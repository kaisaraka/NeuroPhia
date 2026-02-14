import json
import time
import asyncio
import threading
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
import serial
import serial.tools.list_ports
import google.generativeai as genai
import os
from dotenv import load_dotenv 
load_dotenv() 
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
def find_arduino_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "USB" in port.description or "Arduino" in port.description or "CH340" in port.description:
            return port.device
    return '/dev/tty.usbserial-1140' 
SERIAL_PORT = find_arduino_port()
BAUD_RATE = 115200
OFFSETS = {"tl": 0, "tr": 0, "bl": 0, "br": 0}
SCALE_FACTOR = 0.00004 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')
    HAS_REAL_AI = True
except Exception as e:
    HAS_REAL_AI = False
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class UserCreate(BaseModel):
    username: str
    password: str
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
class AnalysisRequest(BaseModel):
    duration: int
    avg_score: int
    stability_percent: float
ser = None
latest_data = {
    "cop_x": 0.0, "cop_y": 0.0, "totalWeight": 0.0,
    "weightDist": {"tl": 0, "tr": 0, "bl": 0, "br": 0},
    "stability": 100, "aiStatus": "CALIBRATING"
}
smooth_vals = {"tl": 0, "tr": 0, "bl": 0, "br": 0}
SMOOTH_FACTOR = 0.6 
session_history = []
def init_db():
    conn = sqlite3.connect('neurophia.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (username text PRIMARY KEY, password_hash text)''')
    conn.commit()
    conn.close()
def get_user(username: str):
    conn = sqlite3.connect('neurophia.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=?", (username,))
    user = c.fetchone()
    conn.close()
    return user
def create_user_db(username, password_hash):
    try:
        conn = sqlite3.connect('neurophia.db')
        c = conn.cursor()
        c.execute("INSERT INTO users VALUES (?, ?)", (username, password_hash))
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)
def get_password_hash(password):
    return pwd_context.hash(password)
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
def background_reader():
    global latest_data, ser, smooth_vals, OFFSETS
    while True:
        try:
            if ser and ser.is_open:
                raw_line = None
                while ser.in_waiting > 0: raw_line = ser.readline()
                if raw_line:
                    try:
                        line = raw_line.decode('utf-8', errors='ignore').strip()
                        if line.startswith('{') and line.endswith('}'):
                            data = json.loads(line)
                            raw_tl = float(data.get('tl', 0))
                            raw_tr = float(data.get('tr', 0))
                            raw_bl = float(data.get('bl', 0))
                            raw_br = float(data.get('br', 0))
                            for k, v in zip(['tl','tr','bl','br'], [raw_tl,raw_tr,raw_bl,raw_br]):
                                smooth_vals[k] = (smooth_vals[k] * SMOOTH_FACTOR) + (v * (1 - SMOOTH_FACTOR))
                            net_tl = max(0, smooth_vals['tl'] - OFFSETS['tl'])
                            net_tr = max(0, smooth_vals['tr'] - OFFSETS['tr'])
                            net_bl = max(0, smooth_vals['bl'] - OFFSETS['bl'])
                            net_br = max(0, smooth_vals['br'] - OFFSETS['br'])
                            total_raw = net_tl + net_tr + net_bl + net_br
                            total_kg = total_raw * SCALE_FACTOR
                            cop_x, cop_y, status = 0.0, 0.0, "RED"
                            if total_kg > 5.0:
                                cop_x = ((net_tr + net_br) - (net_tl + net_bl)) / total_raw
                                cop_y = ((net_tl + net_tr) - (net_bl + net_br)) / total_raw
                                cop_x = max(-1.0, min(1.0, cop_x * 2.5))
                                cop_y = max(-1.0, min(1.0, cop_y * 2.5))
                                dist = (cop_x**2 + cop_y**2)**0.5
                                if dist < 0.2: status = "GREEN"
                                elif dist < 0.5: status = "YELLOW"
                            latest_data = {
                                "cop_x": cop_x, "cop_y": cop_y,
                                "totalWeight": round(total_kg, 2),
                                "aiStatus": status
                            }
                    except: pass
            else:
                try: ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
                except: pass
                time.sleep(1)
            time.sleep(0.01)
        except: time.sleep(1)
@app.on_event("startup")
def startup_event():
    init_db() 
    global ser
    try: ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    except: ser = None
    threading.Thread(target=background_reader, daemon=True).start()
@app.post("/register")
def register_user(user: UserCreate):
    hashed_pw = get_password_hash(user.password)
    if create_user_db(user.username, hashed_pw):
        return {"status": "User created"}
    raise HTTPException(status_code=400, detail="Username already exists")
@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user_db = get_user(form_data.username)
    if not user_db or not verify_password(form_data.password, user_db[1]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer", "username": form_data.username}
@app.post("/api/calibrate")
def calibrate_sensor():
    global OFFSETS, smooth_vals
    OFFSETS = smooth_vals.copy()
    return {"status": "success"}
@app.post("/api/save_session")
def save_session(score: int = 0, duration: int = 0):
    new_session = {"name": datetime.now().strftime("%d %b %H:%M"), "value": score, "duration": duration}
    session_history.append(new_session)
    if len(session_history) > 50: session_history.pop(0)
    return {"status": "saved"}
@app.get("/api/history")
def get_history(): return session_history
@app.post("/api/ai_report")
def generate_ai_report(req: AnalysisRequest):
    w_total = latest_data["totalWeight"]
    prompt = (f"Role: Rehabilitation Doctor. Language: English. Constraint: No greetings.\n"
              f"Data: Weight {w_total}kg, Stability {req.stability_percent}%, Duration {req.duration}s.\n"
              f"Give Objective Assessment and 2 Clinical Recommendations.")
    if HAS_REAL_AI:
        try: return {"report": model.generate_content(prompt).text.replace("*", "")}
        except Exception as e: return {"report": f"Error: {e}"}
    return {"report": "AI Module Offline."}
@app.get("/api/global_analysis")
def global_analysis():
    if not session_history: return {"report": "No data."}
    hist_txt = "\n".join([f"S{i}: {s['value']}" for i, s in enumerate(session_history[-10:])])
    prompt = f"Analyze progress:\n{hist_txt}\nIs patient improving? Give 3 bullet points."
    if HAS_REAL_AI:
        try: return {"report": model.generate_content(prompt).text.replace("*", "")}
        except: pass
    return {"report": "AI unavailable."}
@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json(latest_data)
            await asyncio.sleep(0.05)
    except: pass