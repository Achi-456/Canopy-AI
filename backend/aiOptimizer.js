/**
 * AI Optimizer Module
 * Uses Gemini API for intelligent farming recommendations.
 * Falls back to rule-based optimization when API is unavailable.
 */

require('dotenv').config();

class AIOptimizer {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.hasApi = this.apiKey && this.apiKey !== 'your-gemini-api-key';
    this.lastRecommendation = null;
    this.history = [];
  }

  /**
   * Get optimization recommendations based on sensor data
   */
  async optimize(sensorData, plantStates) {
    let recommendation;

    if (this.hasApi) {
      try {
        recommendation = await this.geminiOptimize(sensorData, plantStates);
      } catch (error) {
        console.log('⚠️  Gemini API failed, using rule-based fallback:', error.message);
        recommendation = this.ruleBasedOptimize(sensorData, plantStates);
      }
    } else {
      recommendation = this.ruleBasedOptimize(sensorData, plantStates);
    }

    recommendation.timestamp = Date.now();
    recommendation.sensorSnapshot = { ...sensorData };
    this.lastRecommendation = recommendation;
    this.history.unshift(recommendation);
    if (this.history.length > 50) this.history = this.history.slice(0, 50);

    return recommendation;
  }

  /**
   * Call Gemini API for optimization
   */
  async geminiOptimize(sensorData, plantStates) {
    const prompt = `You are an expert hydroponic farming AI. Analyze the following sensor data and plant states, then provide specific optimization recommendations.

CURRENT SENSOR DATA:
- Temperature: ${sensorData.temperature}°C
- Humidity: ${sensorData.humidity}%
- pH: ${sensorData.pH}
- EC (Electrical Conductivity): ${sensorData.ec} mS/cm
- Light Intensity: ${sensorData.lightIntensity} lux
- Water Level: ${sensorData.waterLevel}%

PLANT STATES:
${plantStates.map(p => `- ${p.name} (${p.profile.name}): Biomass ${Math.round(p.biomass)}g / ${p.profile.maxBiomass}g, Health: ${Math.round(p.healthScore)}%, Stage: ${p.currentStage || 'Growing'}`).join('\n')}

Provide a JSON response with this exact structure:
{
  "ledIntensity": <0-100 percentage>,
  "irrigationInterval": <minutes between watering>,
  "irrigationDuration": <seconds per watering>,
  "nutrientDosing": <0-10 ml per cycle>,
  "phAdjustment": <"none" | "increase" | "decrease">,
  "alerts": [<array of string warnings>],
  "insights": [<array of string optimization insights>],
  "overallScore": <0-100 system health score>,
  "confidence": <0-100 confidence in recommendations>
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(text);
    return {
      ...parsed,
      source: 'gemini-ai',
    };
  }

  /**
   * Rule-based optimization fallback
   */
  ruleBasedOptimize(sensorData, plantStates) {
    const alerts = [];
    const insights = [];

    // LED intensity recommendation
    let ledIntensity = 70;
    if (sensorData.lightIntensity < 200) {
      ledIntensity = 95;
      alerts.push('⚠️ Light levels critically low — increasing LED to maximum');
    } else if (sensorData.lightIntensity < 350) {
      ledIntensity = 85;
      insights.push('Light slightly below optimal — increasing LED intensity');
    } else if (sensorData.lightIntensity > 700) {
      ledIntensity = 50;
      insights.push('High light levels detected — reducing LED to prevent stress');
    } else {
      insights.push('Light levels are within optimal range');
    }

    // Irrigation recommendation
    let irrigationInterval = 60;
    let irrigationDuration = 30;
    if (sensorData.humidity < 50) {
      irrigationInterval = 30;
      irrigationDuration = 45;
      alerts.push('⚠️ Low humidity — increasing irrigation frequency');
    } else if (sensorData.humidity > 85) {
      irrigationInterval = 120;
      irrigationDuration = 15;
      insights.push('High humidity — reducing irrigation to prevent root rot');
    }

    // Nutrient dosing
    let nutrientDosing = 3;
    if (sensorData.ec < 1.0) {
      nutrientDosing = 6;
      alerts.push('⚠️ Low nutrient concentration — increasing dosing');
    } else if (sensorData.ec > 2.2) {
      nutrientDosing = 1;
      insights.push('High EC — reducing nutrient dosing to prevent burn');
    }

    // pH adjustment
    let phAdjustment = 'none';
    if (sensorData.pH < 5.5) {
      phAdjustment = 'increase';
      alerts.push('⚠️ pH too acidic — recommend pH up solution');
    } else if (sensorData.pH > 7.0) {
      phAdjustment = 'decrease';
      alerts.push('⚠️ pH too alkaline — recommend pH down solution');
    } else {
      insights.push('pH is within acceptable range');
    }

    // Temperature insights
    if (sensorData.temperature < 18) {
      alerts.push('⚠️ Temperature too low — consider heating');
    } else if (sensorData.temperature > 30) {
      alerts.push('⚠️ Temperature too high — increase ventilation');
    } else {
      insights.push('Temperature is optimal for plant growth');
    }

    // Water level
    if (sensorData.waterLevel < 30) {
      alerts.push('🚨 Water level critical — refill reservoir immediately');
    } else if (sensorData.waterLevel < 50) {
      alerts.push('⚠️ Water level getting low — plan to refill soon');
    }

    // Overall score
    const scores = [];
    scores.push(sensorData.pH >= 5.5 && sensorData.pH <= 7.0 ? 100 : 50);
    scores.push(sensorData.ec >= 1.0 && sensorData.ec <= 2.0 ? 100 : 60);
    scores.push(sensorData.temperature >= 18 && sensorData.temperature <= 28 ? 100 : 55);
    scores.push(sensorData.humidity >= 50 && sensorData.humidity <= 80 ? 100 : 60);
    scores.push(sensorData.lightIntensity >= 300 && sensorData.lightIntensity <= 650 ? 100 : 55);
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      ledIntensity,
      irrigationInterval,
      irrigationDuration,
      nutrientDosing,
      phAdjustment,
      alerts,
      insights,
      overallScore,
      confidence: 75,
      source: 'rule-based',
    };
  }

  getLastRecommendation() {
    return this.lastRecommendation;
  }

  getHistory() {
    return this.history.slice(0, 20);
  }
}

module.exports = AIOptimizer;
