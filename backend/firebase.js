const admin = require('firebase-admin');
require('dotenv').config();

let db = null;
let useFirebase = false;

try {
  const fs = require('fs');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json';

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    db = admin.firestore();
    useFirebase = true;
    console.log('✅ Firebase initialized with service account file');
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    db = admin.firestore();
    useFirebase = true;
    console.log('✅ Firebase initialized with environment variables');
  } else {
    console.log('⚠️  Firebase credentials not found. Running in local-only mode with in-memory storage.');
  }
} catch (error) {
  console.log('⚠️  Firebase initialization failed:', error.message);
  console.log('    Running in local-only mode with in-memory storage.');
}

// In-memory fallback storage
const memoryStore = {
  sensorReadings: [],
  digitalTwinState: null,
  plants: [],
  controls: null,
  aiRecommendations: [],
};

// Firestore-like API wrapping in-memory storage
const localDb = {
  collection: (name) => ({
    add: async (data) => {
      const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const doc = { id, ...data };
      if (!memoryStore[name]) memoryStore[name] = [];
      memoryStore[name].push(doc);
      // Keep only last 500 entries for sensor data
      if (name === 'sensorReadings' && memoryStore[name].length > 500) {
        memoryStore[name] = memoryStore[name].slice(-500);
      }
      return { id };
    },
    doc: (id) => ({
      set: async (data, options) => {
        if (!memoryStore[name]) memoryStore[name] = {};
        if (typeof memoryStore[name] !== 'object' || Array.isArray(memoryStore[name])) {
          memoryStore[name] = {};
        }
        if (options && options.merge) {
          memoryStore[name][id] = { ...memoryStore[name][id], ...data };
        } else {
          memoryStore[name][id] = data;
        }
      },
      get: async () => {
        if (!memoryStore[name]) memoryStore[name] = {};
        const data = memoryStore[name][id];
        return {
          exists: !!data,
          data: () => data,
          id,
        };
      },
      update: async (data) => {
        if (!memoryStore[name]) memoryStore[name] = {};
        memoryStore[name][id] = { ...memoryStore[name][id], ...data };
      },
    }),
    orderBy: (field, direction) => ({
      limit: (n) => ({
        get: async () => {
          if (!memoryStore[name]) memoryStore[name] = [];
          let docs = [...memoryStore[name]];
          docs.sort((a, b) => {
            const aVal = a[field] || 0;
            const bVal = b[field] || 0;
            return direction === 'desc' ? bVal - aVal : aVal - bVal;
          });
          docs = docs.slice(0, n);
          return {
            docs: docs.map((d) => ({ data: () => d, id: d.id })),
            empty: docs.length === 0,
          };
        },
      }),
    }),
    where: () => ({
      orderBy: () => ({
        limit: (n) => ({
          get: async () => {
            if (!memoryStore[name]) memoryStore[name] = [];
            return {
              docs: memoryStore[name].slice(-n).map((d) => ({ data: () => d, id: d.id })),
              empty: memoryStore[name].length === 0,
            };
          },
        }),
      }),
    }),
    get: async () => {
      if (!memoryStore[name]) memoryStore[name] = [];
      if (Array.isArray(memoryStore[name])) {
        return {
          docs: memoryStore[name].map((d) => ({ data: () => d, id: d.id })),
          empty: memoryStore[name].length === 0,
        };
      }
      const entries = Object.entries(memoryStore[name]);
      return {
        docs: entries.map(([id, data]) => ({ data: () => data, id })),
        empty: entries.length === 0,
      };
    },
  }),
};

module.exports = {
  db: useFirebase ? db : localDb,
  useFirebase,
  admin: useFirebase ? admin : null,
};
