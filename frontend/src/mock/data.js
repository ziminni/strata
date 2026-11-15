// Static domain data (Central Luzon rice systems). Mirrors backend/app/data.py.
// Month indexes are 0-based (0 = January).

export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Approximate climatology for the Central Luzon plain (in line with NASA POWER long-term means)
export const BASE = {
  T: [25.6, 26.3, 27.6, 29.1, 29.5, 28.6, 27.7, 27.4, 27.5, 27.3, 26.8, 25.9],
  X: [31.2, 32.3, 34.0, 35.6, 35.2, 33.3, 31.7, 31.1, 31.5, 31.6, 31.4, 30.7],
  P: [10, 8, 15, 30, 160, 250, 350, 400, 320, 190, 100, 35],
}

export const VALENCIA_PLACES = [
  'Bagontaas',
  'Banlag',
  'Barobo',
  'Batangan',
  'Catumbalon',
  'Colonia',
  'Concepcion',
  'Dagat-Kidavao',
  'Guinoyuran',
  'Kahaponan',
  'Laligan',
  'Lilingayon',
  'Lourdes',
  'Lumbayao',
  'Lumbo',
  'Lurogan',
  'Maapag',
  'Mabuhay',
  'Mailag',
  'Mt. Nebo',
  'Nabago',
  'Pinatilan',
  'Poblacion',
  'San Carlos',
  'San Isidro',
  'Sinabuagan',
  'Sinayawan',
  'Sugod',
  'Tongantongan',
  'Tugaya',
  'Vintar',
]

export const PROV = {
  'Valencia City': { lat: 7.9064, lon: 125.0949, ws: 1.0, ds: 1.05, dt: 0.1, mun: VALENCIA_PLACES },
  Bukidnon: { lat: 7.9064, lon: 125.0949, ws: 1.0, ds: 1.05, dt: 0.1, mun: ['Valencia City', 'Malaybalay City', 'Maramag', 'Quezon', 'Manolo Fortich', 'Lantapan', 'Don Carlos'] },
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
  name: 'Sheldon Cooper', prov: 'Valencia City', mun: 'Bagontaas', area: 2, water: 'canal', tex: 'clayloam', drain: 'mod',
  ph: 5.9, om: 1.6, wet: 'rice', dry: 'rice', straw: 'burn', budget: 3.5, labor: 3.5,
  w: { soil: 4, water: 3, inc: 5, res: 4, simp: 3 }, adopted: null,
}

export const SAMPLE_POSTS = [
  {
    hours: 2,
    author: 'Engr. Elena Bautista',
    verified: true,
    prov: 'Valencia City',
    mun: 'Bagontaas',
    crop: 'rice',
    type: 'advice',
    text: 'Early morning field walk in Barangay Bagontaas. Palay grains are turning golden and heavy along the Pulangi lateral! Remember: Alternate Wetting and Drying (AWD) saves up to 30% water without reducing yield. Make sure to drain paddies 7-10 days before harvesting for uniform grain drying.',
    image: '/posts/sample-post-1.jpg',
    helpful_count: 24,
    comments: [
      { id: 101, author: 'Mang Danilo', mun: 'Lumbayao', prov: 'Valencia City', text: "Napakaganda ng tindig ng palay Ma'am Elena! Salamat sa paalala sa tamang araw ng pagpapatuyo.", hours: 1.5 },
      { id: 102, author: 'Ka Ramon', mun: 'Batangan', prov: 'Valencia City', text: 'Subok na talaga ang AWD pipe system dito sa Batangan, malaki ang bawas sa krudo ng bomba pag mahina ang flow sa canal.', hours: 1 },
    ],
  },
  {
    hours: 5,
    author: 'Ka Ernesto Cruz',
    verified: false,
    prov: 'Valencia City',
    mun: 'Lumbayao',
    crop: 'rice',
    type: 'update',
    text: 'Sunrise walk through our tillering stage plot here in Lumbayao, Valencia City. Clean bunds and healthy root aeration. We plan to rotate with mungbean immediately after harvest to restore soil nitrogen for the next cycle.',
    image: '/posts/sample-post-2.avif',
    helpful_count: 18,
    comments: [
      { id: 103, author: 'Benjie Santos', mun: 'Poblacion', prov: 'Valencia City', text: 'Anong barayti ng monggo ang itatanim mo Ka Ernesto? Pag-asa 7 ba o NSIC Rc?', hours: 3 },
    ],
  },
  {
    hours: 12,
    author: 'Mang Tomas Dela Rosa',
    verified: false,
    prov: 'Valencia City',
    mun: 'Batangan',
    crop: 'mais',
    type: 'question',
    text: 'Mga ka-Strata dito sa Batangan at San Carlos: First time naming mag-switch sa yellow corn pagkatapos ng main palay season. Gaano kalaki ang karaniwang capital per hectare at saan pinakamalapit na bagsakan o drying facility sa Valencia?',
    image: '',
    helpful_count: 15,
    comments: [
      { id: 104, author: 'Kuya Bert', mun: 'Batangan', prov: 'Valencia City', text: 'Prepare around ₱35k–₱45k per hectare para sa hybrid seeds, abono, at land prep. May direct buyers sa may Sayre Highway bagsakan!', hours: 9 },
      { id: 105, author: 'Aling Maria', mun: 'San Carlos', prov: 'Valencia City', text: 'Make sure maayos ang drainage furrow mo bago magtanim, huwag pabayaang mag-tubig ang maisan.', hours: 7 },
    ],
  },
  {
    hours: 22,
    author: 'Kuya Lito Morales',
    verified: false,
    prov: 'Valencia City',
    mun: 'Sinayawan',
    crop: 'mais',
    type: 'update',
    text: 'Sinayawan agricultural plain update: Soil moisture from the Pulangi river basin is ideal this week. We are prepping the furrows for hybrid yellow corn this weekend. Zero basal synthetic fertilizer needed for this first pass thanks to mungbean mulch residue.',
    image: '',
    helpful_count: 12,
    comments: [
      { id: 106, author: 'Ferdie Morales', mun: 'Sugod', prov: 'Valencia City', text: 'Biyaya talaga ang matabang lupa ng Sinayawan pagkatapos ng palay.', hours: 16 },
    ],
  },
  {
    hours: 32,
    author: 'City Agriculture Office - Valencia City',
    verified: true,
    prov: 'Valencia City',
    mun: 'Poblacion',
    crop: 'monggo',
    type: 'advice',
    text: 'Advisory for Valencia City rice farmers: Plant mungbean catch crop within 7 to 14 days after rice cutting while residual soil moisture is still high. Zero-tillage seeding saves tractor fuel and prevents topsoil moisture loss during dry spells.',
    image: '',
    helpful_count: 31,
    comments: [
      { id: 107, author: 'Nestor G.', mun: 'Kahaponan', prov: 'Valencia City', text: 'Tried this last season sa Kahaponan, zero plow tapos direct seeding, ganda ng tubo at dami ng pods!', hours: 26 },
    ],
  },
  {
    hours: 44,
    author: 'Farmer Rodrigo',
    verified: false,
    prov: 'Valencia City',
    mun: 'Kahaponan',
    crop: 'rice',
    type: 'warning',
    text: 'Pulangi RIS Lateral Canal maintenance notice: Water turns in Division 2 (Kahaponan & Guinoyuran sectors) will be rotational every other week starting next Monday. Plan your pumping schedules or coordinate with your Irrigators Association (IA).',
    image: '',
    helpful_count: 9,
    comments: [
      { id: 108, author: 'Danny Reyes', mun: 'Guinoyuran', prov: 'Valencia City', text: 'Noted ito pare. Salamat sa maagang abiso para makapag-adjust sa bomba.', hours: 38 },
    ],
  },
  {
    hours: 58,
    author: 'Ka Cardo Manansala',
    verified: false,
    prov: 'Valencia City',
    mun: 'Mt. Nebo',
    crop: 'talong',
    type: 'harvest',
    text: 'Harvest day for eggplant up here in Mt. Nebo! Cool elevation gave firm fruits and steady market prices today at Valencia City Central Public Market. Rice straw mulching kept weed pressure almost to zero and conserved moisture throughout the season.',
    image: '',
    helpful_count: 19,
    comments: [
      { id: 109, author: 'Vicente Cruz', mun: 'Mailag', prov: 'Valencia City', text: 'Magkano kilo sa bagsakan ngayon Ka Cardo?', hours: 50 },
      { id: 110, author: 'Ka Cardo Manansala', mun: 'Mt. Nebo', prov: 'Valencia City', text: '₱38/kg pickup price sa field kaninang 5 AM.', hours: 48 },
    ],
  },
  {
    hours: 70,
    author: 'Valencia Seed Producers Coop',
    verified: true,
    prov: 'Valencia City',
    mun: 'Mailag',
    crop: 'mani',
    type: 'update',
    text: 'Peanut pilot demo plot in Barangay Mailag, Valencia City is showing impressive drought tolerance on well-drained volcanic soil. Intercropping peanut after rice has broken the pest cycle and added organic matter.',
    image: '',
    helpful_count: 22,
    comments: [
      { id: 111, author: 'Marlon D.', mun: 'Colonia', prov: 'Valencia City', text: 'Kailan ang harvest field day ninyo sa Mailag? Gusto namin mabisita ang demo farm.', hours: 60 },
    ],
  },
  {
    hours: 88,
    author: 'Tess Dimaculangan',
    verified: false,
    prov: 'Valencia City',
    mun: 'Laligan',
    crop: 'kalabasa',
    type: 'harvest',
    text: 'First harvest of squash (kalabasa) from our 1-hectare diversification plot in Barangay Laligan, Valencia City. Fruit weight averaging 3.4 kg with deep golden color and thick rind.',
    image: '',
    helpful_count: 14,
    comments: [],
  },
  {
    hours: 96,
    author: 'DA Region 10 - Northern Mindanao',
    verified: true,
    prov: 'Valencia City',
    mun: 'Poblacion',
    crop: 'rice',
    type: 'warning',
    text: 'PAGASA & CDRRMO Weather Advisory for Bukidnon: Localized convective thunderstorms expected over Valencia City and Pulangi River valley. Farmers with standing palay nearing maturity are urged to clear drainage waterways and coordinate harvest schedules.',
    image: '',
    helpful_count: 42,
    comments: [
      { id: 112, author: 'Rene Santos', mun: 'Pinatilan', prov: 'Valencia City', text: 'Salamat po sa maagang paalala DA Region 10 at CDRRMO Valencia.', hours: 3 },
    ],
  },
  {
    hours: 110,
    author: 'NIA - Pulangi RIS Bukidnon',
    verified: true,
    prov: 'Valencia City',
    mun: 'Poblacion',
    crop: 'rice',
    type: 'update',
    text: 'Pulangi River Irrigation System (Pulangi RIS) Advisory: Pulangi reservoir intake discharge is steady at optimum operational level for Valencia City irrigation zones. Main canal and lateral delivery gates are operating on normal schedule.',
    image: '',
    helpful_count: 35,
    comments: [],
  },
]
