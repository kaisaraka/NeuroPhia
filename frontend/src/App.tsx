import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LogOut, Clock, PlayCircle, CheckCircle, TrendingUp, Activity, User, Calendar, Sparkles, Brain, ArrowRight, Target, Zap, Timer, Lock, Shield } from 'lucide-react';
import { useSensors } from './hooks/useSensors';
interface GraphPoint { name: string; value: number; duration?: number; }
interface DashboardProps { onStart: () => void; history: GraphPoint[]; username: string; }
interface UserProfileProps { onBack: () => void; history: GraphPoint[]; username: string; }
interface SessionResultsProps { score: number; duration: number; onBack: () => void; }
const AuthScreen = ({ onLogin }: { onLogin: (user: string) => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const endpoint = isLogin ? "/token" : "/register";
        try {
            let body;
            let headers = {};
            if (isLogin) {
                const formData = new FormData();
                formData.append('username', username);
                formData.append('password', password);
                body = formData;
            } else {
                body = JSON.stringify({ username, password });
                headers = { 'Content-Type': 'application/json' };
            }
            const res = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: body
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Authentication failed");
            if (isLogin) {
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', data.username);
                onLogin(data.username);
            } else {
                setIsLogin(true);
                setError("ACCOUNT CREATED");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-black rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-slate-200">
                        <Brain size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">NeuroPhia</h1>
                    <p className="text-gray-500 text-sm mt-2">Rehabilitation Intelligence Platform</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl mb-6 relative">
                    <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-lg shadow-sm transition-all duration-300 ${isLogin ? 'left-1' : 'left-[49%]'}`}></div>
                    <button onClick={() => { setIsLogin(true); setError(""); }} className={`relative z-10 flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${isLogin ? 'text-slate-900' : 'text-gray-400'}`}>Login</button>
                    <button onClick={() => { setIsLogin(false); setError(""); }} className={`relative z-10 flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${!isLogin ? 'text-slate-900' : 'text-gray-400'}`}>Register</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition font-medium" required />
                        </div>
                    </div>
                    <div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition font-medium" required />
                        </div>
                    </div>
                    {error && (
                        <div className={`text-xs font-bold uppercase tracking-widest text-center p-4 rounded-xl border transition-all animate-in zoom-in-95 duration-300 ${
                            error.includes('CREATED') 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-100/50 shadow-sm' 
                                : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                            {error}
                        </div>
                    )}
                    <button disabled={loading} className="w-full bg-slate-900 text-white h-12 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 disabled:opacity-50">
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>
            </div>
        </div>
    );
};
const CoPVisualizer = ({ x, y, status }: { x: number, y: number, status: string }) => {
    const leftPos = (x + 1) * 50; 
    const topPos = (1 - y) * 50; 
    const colorMap: any = { 'GREEN': 'bg-emerald-500 shadow-emerald-400/50', 'YELLOW': 'bg-amber-400 shadow-amber-400/50', 'RED': 'bg-rose-500 shadow-rose-500/50', 'CALIBRATING': 'bg-gray-400 shadow-gray-400/50' };
    const activeColor = colorMap[status] || colorMap['GREEN'];
    return (
        <div className="relative w-[350px] h-[350px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden mb-6">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '35px 35px' }}></div>
            <div className="absolute top-1/2 left-0 w-full h-px bg-gray-300"></div>
            <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-emerald-200 rounded-full opacity-50"></div>
            <div className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-100 ease-linear z-10 ${activeColor}`} style={{ left: `${leftPos}%`, top: `${topPos}%`, transform: 'translate(-50%, -50%)' }}><div className="w-full h-full animate-ping opacity-50 rounded-full bg-inherit"></div></div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-400 uppercase">Front</div>
        </div>
    );
};
const Training = ({ duration, onFinish }: { duration: number, onFinish: (s: number, a: number) => void }) => {
  const data = useSensors(); 
  const [phase, setPhase] = useState<'CALIBRATION' | 'TRAINING'>('CALIBRATION');
  const [timeLeft, setTimeLeft] = useState(3);
  const [score, setScore] = useState(0);
  const status = data.aiStatus || 'RED';
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'CALIBRATION') {
             fetch('http://localhost:8000/api/calibrate', { method: 'POST' }).catch(console.error);
             setPhase('TRAINING');
             return duration;
          } else {
             clearInterval(timer);
             onFinish(score, 0);
             return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, duration, score, onFinish]);
  useEffect(() => { if (phase === 'TRAINING' && status === 'GREEN' && (data.totalWeight || 0) > 0.5) setScore(s => s + 1); }, [status, phase, data.totalWeight]);
  if (phase === 'CALIBRATION') return (<div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white animate-in fade-in duration-300"><div className="animate-pulse mb-8"><Target size={64} className="text-emerald-400" /></div><h2 className="text-3xl font-bold mb-2">Zeroing Sensors</h2><p className="text-slate-400 mb-12">Step off the board.</p><div className="text-8xl font-black font-mono">{timeLeft}</div></div>);
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 animate-in fade-in duration-300">
      <div className="flex justify-between w-[350px] mb-6 items-center"><div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500 font-mono text-sm w-24 text-center">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div><div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500 font-mono text-sm w-24 text-center">PTS: {score}</div></div>
      <CoPVisualizer x={data.cop_x || 0} y={data.cop_y || 0} status={status} />
      <div className="mt-8 grid grid-cols-2 gap-4 w-[350px]"><div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"><span className="text-xs text-gray-400 font-bold uppercase">Load</span><span className="font-bold text-slate-800">{data.totalWeight?.toFixed(1)} kg</span></div><div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between"><span className="text-xs text-gray-400 font-bold uppercase">Dev</span><span className="font-mono text-xs text-slate-600">{data.cop_x?.toFixed(2)}</span></div></div>
    </div>
  );
};
const DurationSelector = ({ onSelect }: { onSelect: (s: number) => void }) => {
    const options = [
        { value: 30, label: "Quick Test", desc: "Rapid stability check", icon: <Zap className="w-6 h-6"/>, color: "text-amber-500", bg: "bg-amber-50 group-hover:bg-amber-100" },
        { value: 60, label: "Standard", desc: "Full session analysis", icon: <Activity className="w-6 h-6"/>, color: "text-emerald-500", bg: "bg-emerald-50 group-hover:bg-emerald-100" },
        { value: 120, label: "Endurance", desc: "Stamina & focus test", icon: <Timer className="w-6 h-6"/>, color: "text-indigo-500", bg: "bg-indigo-50 group-hover:bg-indigo-100" }
    ];
    return (
      <div className="max-w-5xl mx-auto p-6 flex flex-col h-full justify-center animate-in zoom-in-95 duration-300">
        <div className="text-center mb-12"><h2 className="text-3xl font-bold text-gray-900 mb-2">Select Session Duration</h2><p className="text-gray-500">Choose a training mode.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => onSelect(opt.value)} className="group relative bg-white border border-gray-200 p-8 rounded-3xl hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left">
              <div className={`w-14 h-14 ${opt.bg} ${opt.color} rounded-2xl flex items-center justify-center mb-6 transition-colors`}>{opt.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{opt.label}</h3>
              <p className="text-sm text-gray-500 mb-6">{opt.desc}</p>
              <div className="flex items-center gap-2 font-mono text-sm font-medium text-gray-400 group-hover:text-gray-900 transition-colors"><Clock size={14}/> {opt.value} seconds</div>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-slate-900 rounded-3xl pointer-events-none transition-all"></div>
            </button>
          ))}
        </div>
      </div>
    );
};
const Dashboard = ({ onStart, history, username }: DashboardProps) => {
  const chartData = history.length ? history.slice(-15) : [{name:'Start', value:0}];
  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col h-full justify-center animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8"><div><h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome, {username}.</h1><p className="text-gray-500 mt-2">Patient stability overview.</p></div></div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6"><h3 className="font-semibold text-gray-700">Stability Trend</h3><span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Live History</span></div>
        <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} /><YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{fontSize: 12, fill: '#9ca3af'}} /><Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} /><Line type="monotone" dataKey="value" stroke="#111827" strokeWidth={3} dot={false} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
      </div>
      <button onClick={onStart} className="w-full bg-slate-900 text-white h-14 rounded-xl font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">Start New Session <PlayCircle size={20} /></button>
    </div>
  );
};
const UserProfile = ({ onBack, history, username }: UserProfileProps) => {
    const totalSessions = history.length;
    const avgScore = totalSessions > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.value || 0), 0) / totalSessions) : 0;
    const totalMinutes = Math.floor((history.reduce((acc, curr) => acc + (curr.duration || 60), 0)) / 60);
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col h-full animate-in slide-in-from-right-10 duration-300">
        <div className="flex items-center gap-6 mb-8"><div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 border-4 border-white shadow-lg"><User size={40} /></div><div><h1 className="text-3xl font-bold text-gray-900">{username}</h1><div className="flex items-center gap-2 mt-2 text-gray-500"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-slate-600">Patient</span><span className="text-sm">ID: #NP-USER</span></div></div><button onClick={onBack} className="ml-auto bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Back to Dashboard</button></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-2"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity size={20}/></div><span className="text-xs font-bold text-gray-400 uppercase">Total Sessions</span></div><div className="text-3xl font-bold text-slate-900">{totalSessions}</div></div><div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-2"><div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={20}/></div><span className="text-xs font-bold text-gray-400 uppercase">Avg Stability</span></div><div className="text-3xl font-bold text-slate-900">{avgScore}%</div></div><div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between"><div className="flex justify-between items-start mb-2"><div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock size={20}/></div><span className="text-xs font-bold text-gray-400 uppercase">Training Time</span></div><div className="text-3xl font-bold text-slate-900">{totalMinutes} <span className="text-base font-normal text-gray-400">min</span></div></div></div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"><h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Calendar size={16}/> Session History</h3>{history.length === 0 ? <div className="text-center py-10 text-gray-400">No sessions recorded yet.</div> : (<div className="space-y-3">{history.slice().reverse().map((session, idx) => (<div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all cursor-pointer"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.value > 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{session.value > 80 ? <CheckCircle size={18}/> : <Activity size={18}/>}</div><div><div className="font-bold text-gray-900">Session #{history.length - idx}</div><div className="text-xs text-gray-500">{session.name} • {session.duration || 60}s</div></div></div><div className="text-right"><div className="font-black text-lg text-slate-900">{session.value}</div><div className="text-xs text-gray-400">Stability</div></div></div>))}</div>)}</div>
      </div>
    );
};
const AIAnalysisView = ({ onBack }: { onBack: () => void }) => {
    const [report, setReport] = useState<string | null>(null);
    useEffect(() => { fetch('http://localhost:8000/api/global_analysis').then(res => res.json()).then(data => setReport(data.report)).catch(() => setReport("Error loading analysis")); }, []);
    return (
      <div className="max-w-3xl mx-auto p-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8"><div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Brain size={32} /></div><div><h1 className="text-3xl font-bold text-gray-900">AI Global Analysis</h1><p className="text-gray-500">Deep learning insights.</p></div></div>
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl relative"><div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">{report || <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>}</div></div>
        <button onClick={onBack} className="mt-8 flex items-center gap-2 text-gray-500 hover:text-slate-900 transition mx-auto">Back to Dashboard <ArrowRight size={16}/></button>
      </div>
    );
  };
const SessionResults = ({ score, duration, onBack }: SessionResultsProps) => {
  const stabilityPercent = Math.min(100, Math.round((score / duration) * 100));
  const [aiReport, setAiReport] = useState<string | null>(null);
  useEffect(() => { fetch('http://localhost:8000/api/ai_report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration, avg_score: score, stability_percent: stabilityPercent }) }).then(r => r.json()).then(d => setAiReport(d.report)).catch(console.error); }, []);
  return (<div className="max-w-2xl mx-auto h-full flex flex-col justify-center p-6 animate-in zoom-in-95 duration-300"><div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100"><div className="text-center mb-8"><h2 className="text-2xl font-bold text-gray-900">Session Complete</h2></div><div className="grid grid-cols-2 gap-4 mb-8"><div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center"><div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Stability</div><div className="text-4xl font-black text-slate-900">{stabilityPercent}%</div></div><div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center"><div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Points</div><div className="text-4xl font-black text-slate-900">{score}</div></div></div><div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-inner relative flex flex-col h-64"><div className="flex items-center gap-2 mb-4 shrink-0"><div className="bg-blue-600 text-white p-1.5 rounded-lg"><Activity size={16} /></div><span className="font-bold text-slate-700 text-sm uppercase tracking-wide">AI Session Analysis</span></div>{aiReport ? <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line overflow-y-auto pr-2 custom-scrollbar">{aiReport}</div> : <div className="space-y-4 animate-pulse mt-2"><div className="h-2 bg-slate-200 rounded w-full"></div><div className="h-2 bg-slate-200 rounded w-full"></div></div>}</div><button onClick={onBack} className="mt-8 w-full bg-slate-900 text-white h-14 rounded-xl font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-200">Back to Dashboard</button></div></div>);
};
function App() {
  const [user, setUser] = useState<string | null>(localStorage.getItem('username'));
  const [view, setView] = useState('dashboard');
  const [duration, setDuration] = useState(60);
  const [lastResults, setLastResults] = useState({ score: 0 });
  const [historyData, setHistoryData] = useState<GraphPoint[]>([]);
  const fetchHistory = () => { fetch('http://localhost:8000/api/history').then(res => res.json()).then(d => setHistoryData(d)).catch(console.error); };
  useEffect(() => { if (user) fetchHistory(); }, [user, view]);
  const handleSessionFinish = (rawScore: number, avgSym: number) => {
    setLastResults({ score: rawScore });
    const stabilityScore = Math.min(100, Math.round((rawScore / duration) * 100));
    fetch(`http://localhost:8000/api/save_session?score=${stabilityScore}&duration=${duration}`, { method: 'POST' }).then(() => { fetchHistory(); setView('results'); }).catch(console.error);
  };
  if (!user) return <AuthScreen onLogin={setUser} />;
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 flex flex-col selection:bg-slate-200">
      <nav className="bg-white border-b border-gray-200 px-6 h-16 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition" onClick={() => setView('dashboard')}><div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">NP</div><span className="font-bold text-lg tracking-tight">NeuroPhia</span></div>
        <div className="flex items-center gap-4">
            <button onClick={() => setView('ai_analysis')} className="flex items-center gap-2 text-sm font-medium transition px-3 py-2 rounded-lg text-gray-500 hover:text-indigo-600"><span>AI Insights</span></button>
            <button onClick={() => setView('profile')} className="flex items-center gap-2 text-sm font-medium transition px-3 py-2 rounded-lg text-gray-500 hover:text-slate-900"><User size={14}/><span>{user}</span></button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('username'); setUser(null); }} className="text-gray-400 hover:text-rose-500 transition"><LogOut size={20} /></button>
        </div>
      </nav>
      <main className="container mx-auto flex-1 h-full py-6">
        {view === 'dashboard' && <Dashboard onStart={() => setView('select')} history={historyData} username={user} />}
        {view === 'ai_analysis' && <AIAnalysisView onBack={() => setView('dashboard')} />}
        {view === 'profile' && <UserProfile onBack={() => setView('dashboard')} history={historyData} username={user} />}
        {view === 'select' && <DurationSelector onSelect={(s) => { setDuration(s); setView('training'); }} />}
        {view === 'training' && <Training duration={duration} onFinish={handleSessionFinish} />}
        {view === 'results' && <SessionResults score={lastResults.score} duration={duration} onBack={() => setView('dashboard')} />}
      </main>
    </div>
  );
}

export default App;