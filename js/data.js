/**
 * data.js – Sensor Data Simulation Engine
 * Simulates ESP32 sensor readings with realistic fluctuations.
 * Stores history in localStorage and exposes crop thresholds.
 */

'use strict';

/* ── Crop Threshold Profiles ─────────────────────────────── */
const CROP_PROFILES = {
  rice: {
    name: 'Rice', icon: '🌾',
    moisture: { min: 65, max: 85 },
    ph:       { min: 5.5, max: 7.0 },
    n:        { min: 45, max: 80 },
    p:        { min: 30, max: 60 },
    k:        { min: 40, max: 70 },
    temp:     { min: 20, max: 38 },
    humidity: { min: 65, max: 90 },
  },
  wheat: {
    name: 'Wheat', icon: '🌿',
    moisture: { min: 45, max: 65 },
    ph:       { min: 6.0, max: 7.5 },
    n:        { min: 40, max: 75 },
    p:        { min: 25, max: 55 },
    k:        { min: 35, max: 65 },
    temp:     { min: 12, max: 28 },
    humidity: { min: 40, max: 65 },
  },
  tomato: {
    name: 'Tomato', icon: '🍅',
    moisture: { min: 55, max: 75 },
    ph:       { min: 5.8, max: 7.0 },
    n:        { min: 50, max: 80 },
    p:        { min: 35, max: 65 },
    k:        { min: 45, max: 75 },
    temp:     { min: 18, max: 32 },
    humidity: { min: 50, max: 75 },
  },
  cotton: {
    name: 'Cotton', icon: '☁️',
    moisture: { min: 40, max: 65 },
    ph:       { min: 6.0, max: 8.0 },
    n:        { min: 35, max: 70 },
    p:        { min: 25, max: 50 },
    k:        { min: 40, max: 70 },
    temp:     { min: 20, max: 38 },
    humidity: { min: 40, max: 70 },
  },
  maize: {
    name: 'Maize', icon: '🌽',
    moisture: { min: 50, max: 75 },
    ph:       { min: 5.8, max: 7.2 },
    n:        { min: 50, max: 85 },
    p:        { min: 30, max: 60 },
    k:        { min: 35, max: 65 },
    temp:     { min: 18, max: 35 },
    humidity: { min: 45, max: 70 },
  },
  soybean: {
    name: 'Soybean', icon: '🫘',
    moisture: { min: 45, max: 70 },
    ph:       { min: 6.0, max: 7.2 },
    n:        { min: 20, max: 50 },
    p:        { min: 30, max: 60 },
    k:        { min: 40, max: 70 },
    temp:     { min: 15, max: 32 },
    humidity: { min: 50, max: 75 },
  },
};

/* ── Sensor State (Simulates ESP32 live reading) ─────────── */
let _sensorState = {
  moisture: 58,
  ph: 6.8,
  n: 52,
  p: 38,
  k: 45,
  temperature: 27.4,
  humidity: 61,
  pumpOn: false,
  lastWatered: null,
  lastWaterDuration: 0,
};

/** Clamp a value between min and max */
function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

/** Random walk within a range with given step */
function randomWalk(current, step, min, max) {
  const delta = (Math.random() - 0.5) * 2 * step;
  return clamp(+(current + delta).toFixed(2), min, max);
}

/** Generate next simulated reading */
function _nextReading() {
  _sensorState.moisture    = randomWalk(_sensorState.moisture,    3,   0,  100);
  _sensorState.ph          = randomWalk(_sensorState.ph,          0.2, 3.5, 9.5);
  _sensorState.n           = randomWalk(_sensorState.n,           4,   0,  100);
  _sensorState.p           = randomWalk(_sensorState.p,           3,   0,  100);
  _sensorState.k           = randomWalk(_sensorState.k,           3,   0,  100);
  _sensorState.temperature = randomWalk(_sensorState.temperature, 1,   10,  45);
  _sensorState.humidity    = randomWalk(_sensorState.humidity,    2,   20,  100);

  // Auto-irrigation logic
  const crop = getCurrentCrop();
  const profile = CROP_PROFILES[crop];
  if (!_sensorState.pumpOn && _sensorState.moisture < profile.moisture.min - 5) {
    _sensorState.pumpOn = true;
    _sensorState.lastWatered = new Date().toISOString();
  }
  if (_sensorState.pumpOn && _sensorState.moisture >= profile.moisture.min + 8) {
    _sensorState.pumpOn = false;
    _sensorState.lastWaterDuration = Math.floor(Math.random() * 12) + 4;
  }

  return getReading();
}

/** Current snapshot with timestamp */
function getReading() {
  return {
    ...JSON.parse(JSON.stringify(_sensorState)),
    timestamp: new Date().toISOString(),
    crop: getCurrentCrop(),
  };
}

/* ── Crop Selection ──────────────────────────────────────── */
function getCurrentCrop() {
  return localStorage.getItem('soil_crop') || 'rice';
}
function setCurrentCrop(cropKey) {
  localStorage.setItem('soil_crop', cropKey);
}

/* ── History (localStorage) ──────────────────────────────── */
const HISTORY_KEY = 'soil_history';
const MAX_HISTORY = 200;

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}
function appendHistory(reading) {
  let hist = getHistory();
  hist.push(reading);
  if (hist.length > MAX_HISTORY) hist = hist.slice(-MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
}
function getFilteredHistory(range) {
  const now = new Date();
  const hist = getHistory();
  return hist.filter(r => {
    const d = new Date(r.timestamp);
    if (range === 'daily')   return (now - d) <= 24 * 3600 * 1000;
    if (range === 'weekly')  return (now - d) <= 7  * 24 * 3600 * 1000;
    if (range === 'monthly') return (now - d) <= 30 * 24 * 3600 * 1000;
    return true;
  });
}

/* ── Seed history if empty ───────────────────────────────── */
function seedHistory() {
  if (getHistory().length > 40) return;
  const now = Date.now();
  const seedState = { ..._sensorState };
  for (let i = 120; i >= 0; i--) {
    seedState.moisture    = randomWalk(seedState.moisture,    4, 20, 95);
    seedState.ph          = randomWalk(seedState.ph,          0.25, 4, 9);
    seedState.n           = randomWalk(seedState.n,           5, 10, 95);
    seedState.p           = randomWalk(seedState.p,           4, 10, 90);
    seedState.k           = randomWalk(seedState.k,           4, 10, 90);
    seedState.temperature = randomWalk(seedState.temperature, 1.2, 12, 42);
    seedState.humidity    = randomWalk(seedState.humidity,    3, 25, 98);
    appendHistory({
      ...JSON.parse(JSON.stringify(seedState)),
      pumpOn: false, lastWatered: null, lastWaterDuration: 0,
      timestamp: new Date(now - i * 30 * 60 * 1000).toISOString(),
      crop: getCurrentCrop(),
    });
  }
}

/* ── AI Recommendations Engine ───────────────────────────── */
function getRecommendations(reading, cropKey) {
  const p = CROP_PROFILES[cropKey] || CROP_PROFILES.rice;
  const recs = [];

  // Moisture
  if (reading.moisture < p.moisture.min - 10)
    recs.push({ type: 'critical', icon: '💧', category: 'Irrigation', message: 'Soil moisture is critically low – Immediately irrigate the field.', param: 'Moisture' });
  else if (reading.moisture < p.moisture.min)
    recs.push({ type: 'warning', icon: '🚿', category: 'Irrigation', message: `Soil moisture is low (${reading.moisture.toFixed(0)}%) – Watering is recommended.`, param: 'Moisture' });
  else if (reading.moisture > p.moisture.max)
    recs.push({ type: 'warning', icon: '⚠️', category: 'Irrigation', message: `Soil is waterlogged (${reading.moisture.toFixed(0)}%) – Stop irrigation and ensure drainage.`, param: 'Moisture' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Irrigation', message: `Soil moisture is optimal (${reading.moisture.toFixed(0)}%) – No irrigation needed.`, param: 'Moisture' });

  // pH
  if (reading.ph < p.ph.min - 0.5)
    recs.push({ type: 'critical', icon: '🧪', category: 'Soil pH', message: `Soil is too acidic (pH ${reading.ph.toFixed(1)}) – Apply agricultural lime to raise pH.`, param: 'pH' });
  else if (reading.ph < p.ph.min)
    recs.push({ type: 'warning', icon: '🍋', category: 'Soil pH', message: `Soil is mildly acidic (pH ${reading.ph.toFixed(1)}) – Consider adding lime.`, param: 'pH' });
  else if (reading.ph > p.ph.max + 0.5)
    recs.push({ type: 'critical', icon: '🧪', category: 'Soil pH', message: `Soil is too alkaline (pH ${reading.ph.toFixed(1)}) – Apply sulfur or acidic fertilizer.`, param: 'pH' });
  else if (reading.ph > p.ph.max)
    recs.push({ type: 'warning', icon: '⚗️', category: 'Soil pH', message: `Soil is mildly alkaline (pH ${reading.ph.toFixed(1)}) – Monitor closely.`, param: 'pH' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Soil pH', message: `Soil pH is ideal (${reading.ph.toFixed(1)}) for ${p.name}.`, param: 'pH' });

  // Nitrogen
  if (reading.n < p.n.min - 15)
    recs.push({ type: 'critical', icon: '🌿', category: 'Nitrogen (N)', message: 'Nitrogen level is critically low – Apply urea or ammonium nitrate immediately.', param: 'N' });
  else if (reading.n < p.n.min)
    recs.push({ type: 'warning', icon: '🌱', category: 'Nitrogen (N)', message: 'Nitrogen level is low – Apply nitrogen-rich fertilizer (Urea/DAP).', param: 'N' });
  else if (reading.n > p.n.max)
    recs.push({ type: 'warning', icon: '⚠️', category: 'Nitrogen (N)', message: 'Excess nitrogen detected – Reduce fertilizer application to avoid burn.', param: 'N' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Nitrogen (N)', message: 'Nitrogen level is adequate – No action required.', param: 'N' });

  // Phosphorus
  if (reading.p < p.p.min - 15)
    recs.push({ type: 'critical', icon: '🌻', category: 'Phosphorus (P)', message: 'Phosphorus is critically low – Apply superphosphate fertilizer.', param: 'P' });
  else if (reading.p < p.p.min)
    recs.push({ type: 'warning', icon: '🌼', category: 'Phosphorus (P)', message: 'Phosphorus level is low – Apply DAP or bone meal.', param: 'P' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Phosphorus (P)', message: 'Phosphorus level is good – No supplementation needed.', param: 'P' });

  // Potassium
  if (reading.k < p.k.min - 15)
    recs.push({ type: 'critical', icon: '🍃', category: 'Potassium (K)', message: 'Potassium is critically low – Apply MOP (Muriate of Potash) immediately.', param: 'K' });
  else if (reading.k < p.k.min)
    recs.push({ type: 'warning', icon: '🌾', category: 'Potassium (K)', message: 'Potassium level is low – Apply potash fertilizer.', param: 'K' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Potassium (K)', message: 'Potassium level is healthy – No action needed.', param: 'K' });

  // Temperature
  if (reading.temperature > p.temp.max + 3)
    recs.push({ type: 'critical', icon: '🌡️', category: 'Temperature', message: `Temperature is dangerously high (${reading.temperature.toFixed(1)}°C) – Protect crops with shade nets.`, param: 'Temperature' });
  else if (reading.temperature < p.temp.min - 3)
    recs.push({ type: 'critical', icon: '❄️', category: 'Temperature', message: `Temperature is too low (${reading.temperature.toFixed(1)}°C) – Risk of frost damage.`, param: 'Temperature' });
  else
    recs.push({ type: 'healthy', icon: '✅', category: 'Temperature', message: `Temperature is suitable (${reading.temperature.toFixed(1)}°C) for ${p.name}.`, param: 'Temperature' });

  // Overall
  const badCount = recs.filter(r => r.type === 'critical' || r.type === 'warning').length;
  if (badCount === 0)
    recs.unshift({ type: 'healthy', icon: '🌟', category: 'Overall', message: `All soil conditions are healthy for ${p.name}. Your farm is in great shape!`, param: 'Overall' });

  return recs;
}

/* ── Alert Generator ─────────────────────────────────────── */
function getAlerts(reading, cropKey) {
  const recs = getRecommendations(reading, cropKey);
  return recs.filter(r => r.type === 'critical' || r.type === 'warning');
}

/* ── NPK Level Label ─────────────────────────────────────── */
function npkLevel(value) {
  if (value < 30) return { label: 'Low',    cls: 'badge-red' };
  if (value < 65) return { label: 'Medium', cls: 'badge-amber' };
  return              { label: 'High',   cls: 'badge-green' };
}

/* ── pH Category ─────────────────────────────────────────── */
function phCategory(ph) {
  if (ph < 5.5) return { label: 'Strongly Acidic', cls: 'text-red' };
  if (ph < 6.5) return { label: 'Acidic',          cls: 'text-amber' };
  if (ph < 7.5) return { label: 'Neutral',         cls: 'text-green' };
  if (ph < 8.5) return { label: 'Alkaline',        cls: 'text-amber' };
  return              { label: 'Strongly Alkaline', cls: 'text-red' };
}

/* ── Moisture Color Class ────────────────────────────────── */
function moistureColor(value, profile) {
  if (value < profile.moisture.min - 10 || value > profile.moisture.max + 10) return 'red';
  if (value < profile.moisture.min || value > profile.moisture.max) return 'amber';
  return 'green';
}

/* ── Start Live Data Loop ────────────────────────────────── */
let _liveListeners = [];
let _liveInterval = null;

function onLiveData(callback) { _liveListeners.push(callback); }
function startLiveData(intervalMs = 5000) {
  if (_liveInterval) clearInterval(_liveInterval);
  const emit = () => {
    const r = _nextReading();
    appendHistory(r);
    _liveListeners.forEach(fn => fn(r));
  };
  emit();
  _liveInterval = setInterval(emit, intervalMs);
}

/* ── Exports (as window globals) ─────────────────────────── */
window.SoilData = {
  CROP_PROFILES,
  getCurrentCrop,
  setCurrentCrop,
  getReading,
  getHistory,
  getFilteredHistory,
  seedHistory,
  getRecommendations,
  getAlerts,
  npkLevel,
  phCategory,
  moistureColor,
  onLiveData,
  startLiveData,
};

// Initialize
window.SoilData.seedHistory();
