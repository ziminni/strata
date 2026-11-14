// Static domain data (Central Luzon rice systems). Mirrors backend/app/data.py.
// Month indexes are 0-based (0 = January).

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Approximate climatology for the Central Luzon plain (in line with NASA POWER long-term means)
export const BASE = {
  T: [25.6, 26.3, 27.6, 29.1, 29.5, 28.6, 27.7, 27.4, 27.5, 27.3, 26.8, 25.9],
  X: [31.2, 32.3, 34.0, 35.6, 35.2, 33.3, 31.7, 31.1, 31.5, 31.6, 31.4, 30.7],
  P: [10, 8, 15, 30, 160, 250, 350, 400, 320, 190, 100, 35],
}

export const PROV = {
  'Nueva Ecija': { lat: 15.58, lon: 120.97, ws: 1.0, ds: 1.0, dt: 0, mun: ['Science City of Muñoz', 'Cabanatuan City', 'San Jose City', 'Guimba', 'Talavera', 'Gapan City'] },
  Tarlac: { lat: 15.48, lon: 120.59, ws: 1.0, ds: 0.95, dt: 0.1, mun: ['Tarlac City', 'Paniqui', 'Moncada', 'Gerona', 'Victoria'] },
  Pampanga: { lat: 15.08, lon: 120.66, ws: 1.07, ds: 1.0, dt: 0.2, mun: ['Candaba', 'Arayat', 'Mexico', 'Lubao'] },
  Bulacan: { lat: 14.95, lon: 120.95, ws: 1.1, ds: 1.05, dt: 0.1, mun: ['San Miguel', 'San Ildefonso', 'Baliuag', 'Pulilan'] },
  Zambales: { lat: 15.35, lon: 120.05, ws: 1.55, ds: 0.8, dt: 0, mun: ['Iba', 'San Marcelino', 'Botolan'] },
  Bataan: { lat: 14.7, lon: 120.45, ws: 1.35, ds: 0.9, dt: 0, mun: ['Dinalupihan', 'Orani', 'Hermosa'] },
  Aurora: { lat: 15.75, lon: 121.55, ws: 0.95, ds: 3.2, dt: -0.4, mun: ['Baler', 'Maria Aurora', 'San Luis'] },
}

export const SCEN = {
  now: { dT: 0, wsP: 0, dsP: 0, label: 'today' },
  ssp245: { dT: 1.3, wsP: 3, dsP: -11, label: '2050, moderate emissions (SSP2-4.5)' },
  ssp585: { dT: 1.8, wsP: 5, dsP: -17, label: '2050, high emissions (SSP5-8.5)' },
}

export const DS_MONTHS = [10, 11, 0, 1, 2, 3, 4] // Nov–May

// Relative 1–5 scores; water = typical crop water need per season (mm)
export const CROPS = {
  rice: { fil: 'Palay', en: 'Rice', days: 115, water: 900, value: 3, capital: 2, labor: 3, legume: 0, heat: 3, drought: 1, upland: 0, fam: 'grass', color: '#7aa84a', ph: [5, 7.5] },
  awd: { fil: 'Palay (AWD)', en: 'Rice with alternate wetting & drying', days: 115, water: 650, value: 3, capital: 2, labor: 3, legume: 0, heat: 3, drought: 2, upland: 0, fam: 'grass', color: '#5f9a52', ph: [5, 7.5] },
  monggo: { fil: 'Monggo', en: 'Mungbean', days: 65, water: 300, value: 3, capital: 1, labor: 2, legume: 1, heat: 4, drought: 4, upland: 1, fam: 'legume', color: '#3c8a4f', ph: [5.8, 7.8] },
  mani: { fil: 'Mani', en: 'Peanut', days: 110, water: 450, value: 3, capital: 2, labor: 3, legume: 1, heat: 3, drought: 3, upland: 1, fam: 'legume', color: '#a98247', ph: [5.5, 7] },
  mais: { fil: 'Mais', en: 'Corn', days: 105, water: 500, value: 3, capital: 3, labor: 2, legume: 0, heat: 3, drought: 3, upland: 1, fam: 'grass', color: '#d1a12a', ph: [5.5, 7.8] },
  sibuyas: { fil: 'Sibuyas', en: 'Onion', days: 110, water: 420, value: 5, capital: 5, labor: 5, legume: 0, heat: 2, drought: 2, upland: 1, fam: 'allium', color: '#a8457a', ph: [6, 7.5] },
  bawang: { fil: 'Bawang', en: 'Garlic', days: 120, water: 380, value: 5, capital: 5, labor: 5, legume: 0, heat: 1, drought: 2, upland: 1, fam: 'allium', color: '#b9a6c9', ph: [6, 7.5] },
  talong: { fil: 'Talong', en: 'Eggplant', days: 120, water: 500, value: 4, capital: 4, labor: 4, legume: 0, heat: 3, drought: 2, upland: 1, fam: 'nightshade', color: '#6a3d8f', ph: [5.5, 7] },
  kamatis: { fil: 'Kamatis', en: 'Tomato', days: 100, water: 450, value: 4, capital: 4, labor: 4, legume: 0, heat: 2, drought: 2, upland: 1, fam: 'nightshade', color: '#c0392b', ph: [5.8, 7] },
  ampalaya: { fil: 'Ampalaya', en: 'Bitter gourd', days: 100, water: 450, value: 4, capital: 4, labor: 5, legume: 0, heat: 3, drought: 2, upland: 1, fam: 'cucurbit', color: '#4d7a28', ph: [5.5, 7] },
  kalabasa: { fil: 'Kalabasa', en: 'Squash', days: 100, water: 400, value: 3, capital: 2, labor: 2, legume: 0, heat: 4, drought: 3, upland: 1, fam: 'cucurbit', color: '#d98a1f', ph: [5.5, 7.5] },
  kamote: { fil: 'Kamote', en: 'Sweet potato', days: 120, water: 350, value: 2, capital: 1, labor: 2, legume: 0, heat: 4, drought: 4, upland: 1, fam: 'morning glory', color: '#b5543e', ph: [5, 7] },
  pakwan: { fil: 'Pakwan', en: 'Watermelon', days: 75, water: 350, value: 4, capital: 3, labor: 3, legume: 0, heat: 4, drought: 3, upland: 1, fam: 'cucurbit', color: '#2f9a6a', ph: [5.5, 7] },
  sesbania: { fil: 'Sesbania', en: 'Green manure', days: 45, water: 150, value: 0, capital: 1, labor: 1, legume: 1, heat: 5, drought: 3, upland: 0, fam: 'legume', color: '#8fbf5a', ph: [4.5, 8], cover: 1 },
  tabako: { fil: 'Tabako', en: 'Tobacco', days: 120, water: 450, value: 5, capital: 4, labor: 5, legume: 0, heat: 4, drought: 3, upland: 1, fam: 'nightshade', color: '#b8873a', ph: [5.5, 6.8], season: 'dry' },
  fallow: { fil: 'Fallow', en: 'Bare field', days: 0 },
}

// The crops our farmers grow. Crop pickers (add crop, logs, posts) only offer these.
export const FARM_CROPS = ['rice', 'mais', 'tabako']

export const WS = { crop: 'rice', m: 5, d: 15 } // wet-season rice planted ~Jun 15

export const PLANS = [
  { id: 'awd', name: 'Palay → Palay (AWD)', segs: [['awd', 11, 1]] },
  { id: 'rr_m', name: 'Palay → Palay → Monggo', segs: [['rice', 11, 1], ['monggo', 3, 1]] },
  { id: 'm_s', name: 'Palay → Monggo → Sesbania', segs: [['monggo', 10, 10], ['sesbania', 3, 20]] },
  { id: 'sib', name: 'Palay → Sibuyas', segs: [['sibuyas', 10, 25]] },
  { id: 'mais', name: 'Palay → Mais', segs: [['mais', 10, 10]] },
  { id: 'mani', name: 'Palay → Mani → Sesbania', segs: [['mani', 10, 10], ['sesbania', 3, 20]] },
  { id: 'pak_m', name: 'Palay → Pakwan → Monggo', segs: [['pakwan', 10, 15], ['monggo', 1, 10]] },
  { id: 'talong', name: 'Palay → Talong', segs: [['talong', 10, 15]] },
  { id: 'kalabasa', name: 'Palay → Kalabasa → Sesbania', segs: [['kalabasa', 10, 15], ['sesbania', 3, 20]] },
  { id: 'kamote', name: 'Palay → Kamote', segs: [['kamote', 10, 10]] },
  { id: 'bawang', name: 'Palay → Bawang', segs: [['bawang', 10, 1]] },
]

export const LOGTYPES = {
  planting: 'Planting', activity: 'Fertilizer / spray', irrigation: 'Irrigation', observation: 'Pest / observation',
  weather: 'Weather event', harvest: 'Harvest', expense: 'Expense',
}

export const POST_TYPES = ['update', 'question', 'advice', 'warning', 'harvest']

export const DEFAULT_FARM = {
  name: '', prov: 'Nueva Ecija', mun: 'Science City of Muñoz', area: 2, water: 'canal', tex: 'clayloam', drain: 'mod',
  ph: 5.9, om: 1.6, wet: 'rice', dry: 'rice', straw: 'burn', budget: 3.5, labor: 3.5,
  w: { soil: 4, water: 3, inc: 5, res: 4, simp: 3 }, adopted: null,
}

// [hours ago, author, verified, province, crop, type, text]
export const SAMPLE_POSTS = [
  [3, 'Agri Technician, Muñoz', true, 'Nueva Ecija', 'monggo', 'advice', 'Planning monggo after harvest? Plant within 1–2 weeks after cutting the rice so the seeds use the leftover soil moisture. Use an inoculant if you can; it helps the roots fix more nitrogen for your next palay.'],
  [20, 'Sample farmer, Guimba', false, 'Nueva Ecija', 'rice', 'warning', "Dry-season irrigation schedule in our lateral was cut to every other week. If you're still deciding, consider a crop that needs less water this season."],
  [30, 'Sample farmer, San Jose City', false, 'Nueva Ecija', 'sibuyas', 'question', 'First time trying sibuyas after palay. How much capital did you need per hectare, and where did you sell?'],
  [50, 'Sample farmer, Paniqui', false, 'Tarlac', 'rice', 'harvest', 'Tried AWD this season using the pipe in the field. Fewer irrigation turns and the yield was about the same as last year.'],
]
