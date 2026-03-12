/**
 * Sensor Simulator - Simulates ESP32 IoT sensor data
 * Generates realistic pH, EC, temperature, humidity, and light readings
 */

class SensorSimulator {
  constructor() {
    // Base values for simulation
    this.baseValues = {
      pH: 6.2,
      ec: 1.4,           // mS/cm
      temperature: 24,    // °C
      humidity: 65,       // %
      lightIntensity: 450 // lux
    };

    // Time of day affects light and temperature
    this.tickCount = 0;
  }

  /**
   * Generate a sensor reading with realistic noise and diurnal patterns
   */
  generateReading() {
    this.tickCount++;
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 22;

    // Diurnal modifiers
    const lightMod = isDaytime ? 1.0 : 0.15;
    const tempMod = isDaytime ? 1.0 : 0.85;

    // Add realistic noise
    const noise = (base, range) => base + (Math.random() - 0.5) * range;
    const drift = (base, rate) => base + Math.sin(this.tickCount * rate) * 0.3;

    const reading = {
      pH: Math.max(4.0, Math.min(9.0, noise(drift(this.baseValues.pH, 0.05), 0.4))),
      ec: Math.max(0.5, Math.min(3.0, noise(drift(this.baseValues.ec, 0.03), 0.3))),
      temperature: Math.max(15, Math.min(35, noise(this.baseValues.temperature * tempMod, 3))),
      humidity: Math.max(30, Math.min(95, noise(this.baseValues.humidity, 8))),
      lightIntensity: Math.max(0, Math.min(1000, noise(this.baseValues.lightIntensity * lightMod, 80))),
      waterLevel: Math.max(20, Math.min(100, noise(75, 15))),
      timestamp: Date.now(),
      deviceId: 'ESP32_FARM_01'
    };

    // Round to reasonable precision
    reading.pH = Math.round(reading.pH * 100) / 100;
    reading.ec = Math.round(reading.ec * 100) / 100;
    reading.temperature = Math.round(reading.temperature * 10) / 10;
    reading.humidity = Math.round(reading.humidity * 10) / 10;
    reading.lightIntensity = Math.round(reading.lightIntensity);
    reading.waterLevel = Math.round(reading.waterLevel);

    return reading;
  }

  /**
   * Apply control adjustments to base values (simulating actuator effects)
   */
  applyControls(controls) {
    if (controls.ledIntensity !== undefined) {
      this.baseValues.lightIntensity = 50 + (controls.ledIntensity / 100) * 900;
    }
    if (controls.pumpActive) {
      this.baseValues.humidity = Math.min(90, this.baseValues.humidity + 2);
    }
    if (controls.nutrientDosing > 0) {
      this.baseValues.ec = Math.min(2.5, this.baseValues.ec + controls.nutrientDosing * 0.1);
    }
  }
}

module.exports = SensorSimulator;
