/*
 * NeuroPhia - Post-Stroke Rehabilitation Platform Firmware
 * --------------------------------------------------------
 * Hardware: ESP32 / Arduino
 * Sensors: 4x Load Cells (50kg) + HX711 Amplifiers
 * Protocol: Serial JSON Stream @ 115200 baud
 * Author: Kaisar Amangeldiyev
 * * Description:
 * Reads raw data from 4 load cells in a Wheatstone bridge configuration.
 * Performs basic tare and noise filtering.
 * Streams data to Python Backend via Serial in JSON format.
 */

#include "HX711.h"

// --- Pin Definitions ---
const int SCK_PIN = 2;  // Shared Clock Pin
const int PIN_BR = 4;   // Bottom Right Data
const int PIN_TR = 5;   // Top Right Data
const int PIN_TL = 15;  // Top Left Data
const int PIN_BL = 18;  // Bottom Left Data

// --- Calibration ---
// Tuned for specific load cell sensitivity
float CALIBRATION_FACTOR = -45.0; 

HX711 scaleBL;
HX711 scaleTL;
HX711 scaleTR;
HX711 scaleBR;

void setup() {
  Serial.begin(115200); // High-speed serial for low latency

  // Initialize Amplifiers
  scaleBL.begin(PIN_BL, SCK_PIN);
  scaleTL.begin(PIN_TL, SCK_PIN);
  scaleTR.begin(PIN_TR, SCK_PIN);
  scaleBR.begin(PIN_BR, SCK_PIN);

  // Apply Calibration
  scaleBL.set_scale(CALIBRATION_FACTOR);
  scaleTL.set_scale(CALIBRATION_FACTOR);
  scaleTR.set_scale(CALIBRATION_FACTOR);
  scaleBR.set_scale(CALIBRATION_FACTOR);

  delay(500);

  // Zero the sensors on boot
  scaleBL.tare();
  scaleTL.tare();
  scaleTR.tare();
  scaleBR.tare();
}

void loop() {
  if (Serial.available()) {
    char temp = Serial.read();
    if (temp == 't' || temp == 'T') {
      scaleBL.tare();
      scaleTL.tare();
      scaleTR.tare();
      scaleBR.tare();
    }
  }

  // Read sensors (blocking read)
  float val_bl = scaleBL.get_units(1);
  float val_tl = scaleTL.get_units(1);
  float val_tr = scaleTR.get_units(1);
  float val_br = scaleBR.get_units(1);

  // Noise Gate (ignore values < 10g to prevent jitter)
  if (abs(val_bl) < 10.0) val_bl = 0.0;
  if (abs(val_tl) < 10.0) val_tl = 0.0;
  if (abs(val_tr) < 10.0) val_tr = 0.0;
  if (abs(val_br) < 10.0) val_br = 0.0;

  // JSON Output for Python Backend
  Serial.print("{\"tl\":");
  Serial.print(val_tl, 1);
  Serial.print(",\"tr\":");
  Serial.print(val_tr, 1);
  Serial.print(",\"bl\":");
  Serial.print(val_bl, 1);
  Serial.print(",\"br\":");
  Serial.print(val_br, 1);
  Serial.println("}");

  delay(50); // Sampling rate control (~20Hz)
}