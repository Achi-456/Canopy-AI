/**
 * Digital Twin Engine
 * Simulates plant growth using biomass model:
 *   Biomass(t+1) = Biomass(t) + α·L + β·T + γ·N
 * 
 * Where:
 *   L = normalized light factor (0-1)
 *   T = temperature factor (optimal around 22-26°C)
 *   N = nutrient factor (based on EC and pH)
 *   α, β, γ = growth coefficients
 */

const CROP_PROFILES = {
  lettuce: {
    name: 'Lettuce',
    variety: 'Butterhead',
    maxBiomass: 250,        // grams
    growthDays: 35,
    optimalTemp: [20, 25],
    optimalPH: [5.8, 6.5],
    optimalEC: [1.0, 1.8],
    optimalLight: [300, 600],
    alpha: 0.35,            // light coefficient
    beta: 0.25,             // temperature coefficient
    gamma: 0.20,            // nutrient coefficient
    stages: ['Germination', 'Seedling', 'Vegetative', 'Mature', 'Harvest Ready'],
    stageThresholds: [0.05, 0.15, 0.45, 0.80, 1.0],
    icon: '🥬'
  },
  basil: {
    name: 'Basil',
    variety: 'Sweet Genovese',
    maxBiomass: 150,
    growthDays: 28,
    optimalTemp: [22, 28],
    optimalPH: [5.5, 6.5],
    optimalEC: [1.0, 1.6],
    optimalLight: [400, 700],
    alpha: 0.40,
    beta: 0.30,
    gamma: 0.15,
    stages: ['Germination', 'Seedling', 'Vegetative', 'Mature', 'Harvest Ready'],
    stageThresholds: [0.05, 0.15, 0.50, 0.85, 1.0],
    icon: '🌿'
  },
  strawberry: {
    name: 'Strawberry',
    variety: 'Alpine',
    maxBiomass: 350,
    growthDays: 60,
    optimalTemp: [18, 24],
    optimalPH: [5.5, 6.2],
    optimalEC: [1.2, 2.0],
    optimalLight: [350, 650],
    alpha: 0.30,
    beta: 0.20,
    gamma: 0.25,
    stages: ['Germination', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Harvest Ready'],
    stageThresholds: [0.04, 0.12, 0.35, 0.55, 0.80, 1.0],
    icon: '🍓'
  },
  mint: {
    name: 'Mint',
    variety: 'Spearmint',
    maxBiomass: 180,
    growthDays: 30,
    optimalTemp: [18, 24],
    optimalPH: [6.0, 7.0],
    optimalEC: [1.2, 2.0],
    optimalLight: [300, 500],
    alpha: 0.35,
    beta: 0.25,
    gamma: 0.20,
    stages: ['Germination', 'Seedling', 'Vegetative', 'Mature', 'Harvest Ready'],
    stageThresholds: [0.05, 0.15, 0.45, 0.80, 1.0],
    icon: '🌱'
  }
};

class DigitalTwin {
  constructor() {
    this.plants = [];
    this.initDefaultPlants();
  }

  initDefaultPlants() {
    // Start with a few plants at different growth stages
    this.plants = [
      this.createPlant('lettuce', 'Lettuce Bed A', 12),
      this.createPlant('basil', 'Basil Pot 1', 8),
      this.createPlant('strawberry', 'Strawberry Row 1', 20),
      this.createPlant('mint', 'Mint Planter', 5),
    ];
  }

  createPlant(cropType, name, daysSincePlanting = 0) {
    const profile = CROP_PROFILES[cropType];
    if (!profile) throw new Error(`Unknown crop type: ${cropType}`);

    const progress = Math.min(daysSincePlanting / profile.growthDays, 1.0);
    const biomass = progress * profile.maxBiomass * (0.8 + Math.random() * 0.2);

    return {
      id: `plant_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      cropType,
      name,
      profile,
      biomass: Math.round(biomass * 100) / 100,
      daysSincePlanting,
      plantedDate: new Date(Date.now() - daysSincePlanting * 86400000).toISOString(),
      healthScore: 85 + Math.random() * 15,
      growthRate: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Calculate growth factor from a sensor value given optimal range
   */
  calculateFactor(value, optimalRange) {
    const [min, max] = optimalRange;
    const mid = (min + max) / 2;
    const range = max - min;

    if (value >= min && value <= max) {
      // Inside optimal range: 0.8 to 1.0
      const distFromMid = Math.abs(value - mid) / (range / 2);
      return 1.0 - distFromMid * 0.2;
    }

    // Outside optimal range: decrease with distance
    const dist = value < min ? min - value : value - max;
    return Math.max(0, 1.0 - (dist / range) * 0.5);
  }

  /**
   * Run one simulation step for all plants based on current sensor data
   */
  simulate(sensorData) {
    const results = this.plants.map(plant => {
      const profile = plant.profile;

      // Calculate environmental factors
      const lightFactor = this.calculateFactor(sensorData.lightIntensity, profile.optimalLight);
      const tempFactor = this.calculateFactor(sensorData.temperature, profile.optimalTemp);
      const phFactor = this.calculateFactor(sensorData.pH, profile.optimalPH);
      const ecFactor = this.calculateFactor(sensorData.ec, profile.optimalEC);
      const nutrientFactor = (phFactor + ecFactor) / 2;

      // Biomass growth model: Biomass(t+1) = Biomass(t) + α·L + β·T + γ·N
      const growthIncrement =
        profile.alpha * lightFactor +
        profile.beta * tempFactor +
        profile.gamma * nutrientFactor;

      // Scale growth based on current stage (slower at start and end)
      const progress = plant.biomass / profile.maxBiomass;
      const stageMultiplier = progress < 0.1 ? 0.5 : progress > 0.9 ? 0.3 : 1.0;

      const actualGrowth = growthIncrement * stageMultiplier;
      plant.biomass = Math.min(profile.maxBiomass, plant.biomass + actualGrowth);
      plant.growthRate = Math.round(actualGrowth * 1000) / 1000;

      // Calculate health score based on environmental factors
      const envScore = (lightFactor + tempFactor + nutrientFactor) / 3;
      plant.healthScore = Math.round(envScore * 100);

      // Calculate days since planting
      plant.daysSincePlanting = Math.floor(
        (Date.now() - new Date(plant.plantedDate).getTime()) / 86400000
      );

      plant.lastUpdated = Date.now();

      // Determine current growth stage
      const biomassRatio = plant.biomass / profile.maxBiomass;
      let currentStage = profile.stages[0];
      for (let i = 0; i < profile.stageThresholds.length; i++) {
        if (biomassRatio <= profile.stageThresholds[i]) {
          currentStage = profile.stages[i];
          break;
        }
      }

      // Estimate harvest date
      const remainingBiomass = profile.maxBiomass - plant.biomass;
      const avgGrowthRate = actualGrowth > 0 ? actualGrowth : 0.1;
      const stepsToHarvest = remainingBiomass / avgGrowthRate;
      const hoursToHarvest = stepsToHarvest * (10 / 60); // assuming 10s intervals
      const estimatedHarvestDate = biomassRatio >= 0.95
        ? 'Ready!'
        : new Date(Date.now() + Math.min(hoursToHarvest, profile.growthDays * 24) * 3600000).toISOString();

      return {
        ...plant,
        currentStage,
        biomassRatio: Math.round(biomassRatio * 1000) / 1000,
        estimatedHarvestDate,
        factors: {
          light: Math.round(lightFactor * 100) / 100,
          temperature: Math.round(tempFactor * 100) / 100,
          nutrient: Math.round(nutrientFactor * 100) / 100,
        },
      };
    });

    return results;
  }

  getState() {
    return {
      plants: this.plants.map(p => ({
        ...p,
        biomassRatio: Math.round((p.biomass / p.profile.maxBiomass) * 1000) / 1000,
        currentStage: this.getStage(p),
      })),
      systemHealth: this.calculateSystemHealth(),
      lastUpdated: Date.now(),
    };
  }

  getStage(plant) {
    const ratio = plant.biomass / plant.profile.maxBiomass;
    for (let i = 0; i < plant.profile.stageThresholds.length; i++) {
      if (ratio <= plant.profile.stageThresholds[i]) {
        return plant.profile.stages[i];
      }
    }
    return plant.profile.stages[plant.profile.stages.length - 1];
  }

  calculateSystemHealth() {
    if (this.plants.length === 0) return 0;
    const avg = this.plants.reduce((sum, p) => sum + p.healthScore, 0) / this.plants.length;
    return Math.round(avg);
  }

  addPlant(cropType, name) {
    const plant = this.createPlant(cropType, name, 0);
    this.plants.push(plant);
    return plant;
  }

  removePlant(plantId) {
    this.plants = this.plants.filter(p => p.id !== plantId);
  }

  getCropProfiles() {
    return CROP_PROFILES;
  }
}

module.exports = DigitalTwin;
