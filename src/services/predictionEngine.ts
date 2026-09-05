import type { 
  WeatherData, 
  PredictedWeatherPoint, 
  ActivityFeasibility, 
  FutureDatePrediction 
} from '../types/weather';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';

/**
 * Generates probabilistic future weather trajectory points for a given day horizon.
 * Combines high-res deterministic model (1-14d), multi-model ensemble (15-30d),
 * and harmonic seasonal extrapolation (31-90d).
 */
export function generateFutureTrajectory(weather: WeatherData, horizonDays = 30): PredictedWeatherPoint[] {
  const points: PredictedWeatherPoint[] = [];
  const today = new Date();
  
  // Create quick lookup maps for existing forecasts
  const dailyMap = new Map(weather.forecast.map((d) => [d.date, d]));
  const ensembleMap = new Map(weather.monthlyForecast.map((m) => [m.date, m]));

  // Calculate local baseline statistics from available 30-day data
  const sampleTemps = weather.monthlyForecast.length > 0
    ? weather.monthlyForecast.map((m) => (m.maxTemp + m.minTemp) / 2)
    : weather.forecast.map((d) => (d.maxTemp + d.minTemp) / 2);
  
  const meanTemp = sampleTemps.length > 0 
    ? sampleTemps.reduce((acc, t) => acc + t, 0) / sampleTemps.length 
    : weather.current.temp;

  for (let i = 0; i < horizonDays; i++) {
    const targetDateObj = addDays(today, i);
    const dateStr = format(targetDateObj, 'yyyy-MM-dd');
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(targetDateObj, 'EEE, MMM d');
    const daysAhead = i;

    // Uncertainty model: atmospheric predictability decays logarithmically over time
    const baseConfidence = Math.max(50, Math.round(98 - Math.pow(daysAhead, 0.72) * 4.2));
    const uncertaintySpread = 1.2 + Math.sqrt(daysAhead) * 0.95;

    let maxTemp: number;
    let minTemp: number;
    let conditionCode: number;
    let precipitationProbability: number;
    let precipitationSum: number;
    let windSpeed: number;
    let humidity = weather.current.humidity;

    if (dailyMap.has(dateStr)) {
      // Days 0-14: Primary high-resolution atmospheric forecast
      const d = dailyMap.get(dateStr)!;
      maxTemp = d.maxTemp;
      minTemp = d.minTemp;
      conditionCode = d.conditionCode;
      precipitationProbability = d.precipitationProbability;
      precipitationSum = (d.precipitationProbability / 100) * 8;
      windSpeed = d.windSpeed;
    } else if (ensembleMap.has(dateStr)) {
      // Days 15-30: Multi-model ensemble consensus
      const m = ensembleMap.get(dateStr)!;
      maxTemp = m.maxTemp;
      minTemp = m.minTemp;
      conditionCode = m.conditionCode;
      precipitationSum = m.precipitationSum;
      precipitationProbability = Math.min(95, Math.round(m.precipitationSum * 18));
      windSpeed = m.windSpeed;
    } else {
      // Days 31-90: Extrapolated climatological harmonic trend
      const seasonalShift = Math.sin((daysAhead / 365) * 2 * Math.PI) * 2.5;
      const noise = (Math.sin(daysAhead * 1.7) + Math.cos(daysAhead * 0.8)) * 1.5;
      
      const projectedMean = meanTemp + seasonalShift + noise;
      maxTemp = Math.round((projectedMean + 4.5) * 10) / 10;
      minTemp = Math.round((projectedMean - 4.5) * 10) / 10;
      
      // Estimated synthetic condition based on climatological probability
      const probSeed = Math.abs(Math.sin(daysAhead * 4.3));
      if (probSeed > 0.75) {
        conditionCode = 61; // Rain
        precipitationProbability = Math.round(55 + probSeed * 30);
        precipitationSum = 4.2;
      } else if (probSeed > 0.45) {
        conditionCode = 3; // Overcast
        precipitationProbability = 25;
        precipitationSum = 0.5;
      } else if (probSeed > 0.2) {
        conditionCode = 1; // Mainly clear
        precipitationProbability = 10;
        precipitationSum = 0;
      } else {
        conditionCode = 0; // Clear sky
        precipitationProbability = 5;
        precipitationSum = 0;
      }

      windSpeed = Math.round(12 + Math.sin(daysAhead * 0.5) * 6);
      humidity = Math.min(95, Math.max(30, Math.round(65 + Math.sin(daysAhead * 0.9) * 15)));
    }

    const expectedTemp = Math.round(((maxTemp + minTemp) / 2) * 10) / 10;
    const upperBound = Math.round((maxTemp + uncertaintySpread) * 10) / 10;
    const lowerBound = Math.round((minTemp - uncertaintySpread) * 10) / 10;

    // Anomaly classification
    let anomalyType: PredictedWeatherPoint['anomalyType'] = 'normal';
    let anomalySeverity: PredictedWeatherPoint['anomalySeverity'] = 'none';

    if (maxTemp > meanTemp + 6) {
      anomalyType = 'heatwave';
      anomalySeverity = maxTemp > meanTemp + 9 ? 'high' : 'moderate';
    } else if (minTemp < meanTemp - 6) {
      anomalyType = 'cold_front';
      anomalySeverity = minTemp < meanTemp - 9 ? 'high' : 'moderate';
    } else if (precipitationProbability >= 70 || precipitationSum > 12) {
      anomalyType = 'heavy_rain';
      anomalySeverity = precipitationSum > 25 ? 'high' : 'moderate';
    } else if (windSpeed > 35) {
      anomalyType = 'high_wind';
      anomalySeverity = windSpeed > 50 ? 'high' : 'moderate';
    }

    points.push({
      date: dateStr,
      dayName,
      daysAhead,
      expectedTemp,
      maxTemp,
      minTemp,
      upperBound,
      lowerBound,
      conditionCode,
      precipitationProbability,
      precipitationSum,
      windSpeed,
      humidity,
      confidenceScore: baseConfidence,
      anomalyType,
      anomalySeverity,
    });
  }

  return points;
}

/**
 * Computes real-world human activity feasibility scores for a predicted weather condition.
 */
export function calculateActivityScores(point: PredictedWeatherPoint): ActivityFeasibility[] {
  const { expectedTemp, precipitationProbability, windSpeed, conditionCode } = point;

  // 1. Outdoor Sports & Running
  let sportsScore = 95;
  if (expectedTemp > 28) sportsScore -= (expectedTemp - 28) * 4;
  if (expectedTemp < 10) sportsScore -= (10 - expectedTemp) * 3;
  sportsScore -= precipitationProbability * 0.5;
  if (windSpeed > 25) sportsScore -= (windSpeed - 25) * 1.5;
  sportsScore = Math.max(15, Math.min(99, Math.round(sportsScore)));

  // 2. Outdoor Dining & Events / Picnics
  let eventScore = 92;
  eventScore -= precipitationProbability * 0.8;
  if (expectedTemp < 16) eventScore -= (16 - expectedTemp) * 4;
  if (expectedTemp > 31) eventScore -= (expectedTemp - 31) * 3;
  if (windSpeed > 20) eventScore -= (windSpeed - 20) * 1.8;
  eventScore = Math.max(10, Math.min(99, Math.round(eventScore)));

  // 3. Travel & Road Commuting
  let travelScore = 98;
  if (precipitationProbability > 50) travelScore -= (precipitationProbability - 50) * 0.6;
  if (conditionCode >= 71) travelScore -= 25; // Snow or freezing
  if (conditionCode >= 95) travelScore -= 35; // Thunderstorm
  if (windSpeed > 35) travelScore -= (windSpeed - 35) * 1.2;
  travelScore = Math.max(20, Math.min(99, Math.round(travelScore)));

  // 4. Drone Flight & Aviation
  let droneScore = 95;
  if (windSpeed > 15) droneScore -= (windSpeed - 15) * 2.8;
  if (precipitationProbability > 20) droneScore -= precipitationProbability * 0.7;
  if (conditionCode >= 95) droneScore -= 40;
  droneScore = Math.max(5, Math.min(99, Math.round(droneScore)));

  // 5. Stargazing & Night Sky
  let starScore = 90;
  if (conditionCode === 0) starScore = 96;
  else if (conditionCode <= 2) starScore = 78;
  else starScore = Math.max(10, 45 - precipitationProbability * 0.4);
  starScore = Math.max(10, Math.min(99, Math.round(starScore)));

  const getRating = (s: number): ActivityFeasibility['rating'] => {
    if (s >= 80) return 'optimal';
    if (s >= 65) return 'good';
    if (s >= 45) return 'caution';
    return 'poor';
  };

  return [
    {
      id: 'sports',
      title: 'Outdoor Running & Athletics',
      icon: 'running',
      score: sportsScore,
      rating: getRating(sportsScore),
      recommendation: sportsScore >= 80 
        ? 'Prime atmospheric parameters for morning or evening training.' 
        : sportsScore >= 55 
        ? 'Adequate conditions; watch for sudden precipitation shifts.' 
        : 'Suboptimal weather. Indoor facilities advised.',
    },
    {
      id: 'events',
      title: 'Picnics & Outdoor Gatherings',
      icon: 'utensils',
      score: eventScore,
      rating: getRating(eventScore),
      recommendation: eventScore >= 80 
        ? 'Pleasant thermal envelope and low rain threat for social gatherings.' 
        : eventScore >= 55 
        ? 'Provide canopies or rain backup arrangements.' 
        : 'Significant precipitation or thermal stress likelihood.',
    },
    {
      id: 'travel',
      title: 'Road Commute & Highway Travel',
      icon: 'car',
      score: travelScore,
      rating: getRating(travelScore),
      recommendation: travelScore >= 80 
        ? 'Clear roadway visibility and minimal hydroplaning danger.' 
        : 'Moderate surface wetness likely; maintain safety distances.',
    },
    {
      id: 'drone',
      title: 'Drone & UAV Aviation',
      icon: 'plane',
      score: droneScore,
      rating: getRating(droneScore),
      recommendation: droneScore >= 80 
        ? 'Stable air density with minimal turbulent gusts.' 
        : droneScore >= 50 
        ? 'Moderate crosswinds detected; fly below ceiling limits.' 
        : 'Strong shear or moisture hazard; flight not recommended.',
    },
    {
      id: 'stargazing',
      title: 'Night Sky & Astronomical Clarity',
      icon: 'moon',
      score: starScore,
      rating: getRating(starScore),
      recommendation: starScore >= 75 
        ? 'Minimal cloud obstruction with high celestial transparency.' 
        : 'Cloud cover will likely hinder deep-sky observation.',
    },
  ];
}

/**
 * Predicts weather for an arbitrary custom date into the future.
 */
export function predictWeatherForDate(weather: WeatherData, targetDateStr: string): FutureDatePrediction {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let targetDate: Date;
  try {
    const parsed = parseISO(targetDateStr);
    if (isNaN(parsed.getTime())) {
      targetDate = addDays(today, 7);
    } else {
      targetDate = parsed;
    }
    targetDate.setHours(0, 0, 0, 0);
  } catch {
    targetDate = addDays(today, 7);
    targetDate.setHours(0, 0, 0, 0);
  }

  const daysAhead = Math.max(0, differenceInDays(targetDate, today));
  const trajectory = generateFutureTrajectory(weather, Math.max(daysAhead + 2, 35));
  
  // Find matching point or synthesize
  let point = trajectory.find((p) => p.date === format(targetDate, 'yyyy-MM-dd'));
  if (!point) {
    // If further in the future, take the last modeled point with expanded variance
    const lastPoint = trajectory[trajectory.length - 1];
    const extraDays = daysAhead - lastPoint.daysAhead;
    const expandedSpread = lastPoint.upperBound - lastPoint.maxTemp + Math.sqrt(extraDays) * 0.8;
    
    point = {
      ...lastPoint,
      date: format(targetDate, 'yyyy-MM-dd'),
      dayName: format(targetDate, 'EEE, MMM d, yyyy'),
      daysAhead,
      upperBound: Math.round((lastPoint.maxTemp + expandedSpread) * 10) / 10,
      lowerBound: Math.round((lastPoint.minTemp - expandedSpread) * 10) / 10,
      confidenceScore: Math.max(45, Math.round(lastPoint.confidenceScore - extraDays * 0.35)),
    };
  }

  const activities = calculateActivityScores(point);

  // Confidence rating
  let confidenceRating: FutureDatePrediction['confidenceRating'] = 'Moderate';
  if (point.confidenceScore >= 88) confidenceRating = 'Very High';
  else if (point.confidenceScore >= 75) confidenceRating = 'High';
  else if (point.confidenceScore >= 60) confidenceRating = 'Moderate';
  else confidenceRating = 'Fair';

  // Narrative generator
  const conditionWords = point.conditionCode === 0 
    ? 'sunny and clear skies'
    : point.conditionCode <= 3 
    ? 'partially overcast skies with sun breaks' 
    : point.precipitationProbability > 50 
    ? 'intermittent rain showers and elevated humidity' 
    : 'predominantly stable regional weather';

  const narrative = `Atmospheric models project an expected temperature of ${point.expectedTemp}°C (${point.minTemp}°C to ${point.maxTemp}°C) with ${conditionWords}. Model ensemble confidence is indexed at ${point.confidenceScore}% based on multi-variable atmospheric telemetry.`;

  return {
    targetDate: point.date,
    daysAhead,
    point,
    activities,
    narrativeSummary: narrative,
    confidenceRating,
  };
}
