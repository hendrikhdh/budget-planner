// 1) Gewichteter gleitender Durchschnitt (WMA)
export const weightedMovingAvg = (arr, horizon = 6) => {
  if (arr.length === 0) return Array(horizon).fill(0);
  const n = Math.min(arr.length, 6);
  const slice = arr.slice(-n);
  let wSum = 0, wTotal = 0;
  slice.forEach((v, i) => { const w = i + 1; wSum += v * w; wTotal += w; });
  const avg = wSum / wTotal;
  return Array(horizon).fill(Math.round(avg * 100) / 100);
};

// 2) Exponentielle Glättung (Holt's Double Exponential Smoothing)
export const holtSmoothing = (arr, horizon = 6, alpha = 0.4, beta = 0.2) => {
  if (arr.length < 2) return weightedMovingAvg(arr, horizon);
  let level = arr[0];
  let trend = arr[1] - arr[0];
  for (let i = 1; i < arr.length; i++) {
    const newLevel = alpha * arr[i] + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel;
    trend = newTrend;
  }
  const result = [];
  for (let h = 1; h <= horizon; h++) {
    result.push(Math.max(0, Math.round((level + trend * h) * 100) / 100));
  }
  return result;
};

// 3) Lineare Regression (Least Squares)
export const linearRegression = (arr, horizon = 6) => {
  const n = arr.length;
  if (n < 2) return weightedMovingAvg(arr, horizon);
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  arr.forEach((y, x) => { sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; });
  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const a = (sumY - b * sumX) / n;
  const result = [];
  for (let h = 0; h < horizon; h++) {
    result.push(Math.max(0, Math.round((a + b * (n + h)) * 100) / 100));
  }
  return result;
};

// 4) Saisonale Dekomposition
export const seasonalForecast = (arr, monthlyArr, horizon = 6) => {
  if (arr.length < 3) return weightedMovingAvg(arr, horizon);
  const monthBuckets = Array(12).fill(null).map(() => []);
  monthlyArr.forEach(m => monthBuckets[m.month].push(m.expense));
  const monthAvg = monthBuckets.map(b => b.length > 0 ? b.reduce((s, v) => s + v, 0) / b.length : 0);
  const globalAvg = arr.reduce((s, v) => s + v, 0) / arr.length;
  const seasonIdx = monthAvg.map(a => globalAvg > 0 ? a / globalAvg : 1);
  const holtBase = holtSmoothing(arr, horizon, 0.3, 0.15);
  const lastEntry = monthlyArr[monthlyArr.length - 1];
  const result = [];
  for (let h = 0; h < horizon; h++) {
    const futureMonth = (lastEntry.month + 1 + h) % 12;
    const idx = seasonIdx[futureMonth] || 1;
    result.push(Math.max(0, Math.round(holtBase[h] * idx * 100) / 100));
  }
  return result;
};

// 5) Ensemble: gewichtete Kombination aller Methoden
export const ensembleForecast = (arr, monthlyArr, horizon = 6) => {
  const wma = weightedMovingAvg(arr, horizon);
  const holt = holtSmoothing(arr, horizon);
  const lr = linearRegression(arr, horizon);
  const seasonal = seasonalForecast(arr, monthlyArr, horizon);
  return Array(horizon).fill(0).map((_, i) =>
    Math.max(0, Math.round((wma[i] * 0.15 + holt[i] * 0.3 + lr[i] * 0.2 + seasonal[i] * 0.35) * 100) / 100)
  );
};

// Returns sample standard deviation (Bessel's correction). Named `variance`
// for historical reasons — used by PredictionPage for ±σ confidence bands.
export const variance = (arr) => {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1));
};
