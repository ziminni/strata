// UI labels shared across views (translated when read, see localized() in i18n.js).
import { localized } from './i18n'

export const TAB_LABELS = localized({
  simple: { analysis: 'Home', map: 'Map', crops: 'My crops', community: 'Community', chat: 'Ask Tata', diagnose: 'Diagnose' },
  detailed: { analysis: 'Home', map: 'Map', crops: 'My crops', community: 'Community', chat: 'Ask Tata', diagnose: 'Diagnose' },
})

// Quick-log buttons in Simple mode: [label, icon, bg, fg]
export const QA_TYPES = localized({
  harvest: ['Harvest', 'leaf', '#fdf2da', '#a06b05'],
  observation: ['Pests', 'alert', '#fde8e3', '#dc4b2f'],
  activity: ['Fertilizer', 'note', '#ece9f8', '#5b4bb5'],
  irrigation: ['Water', 'drop', '#e4f0fb', '#1f74c2'],
  weather: ['Weather', 'sun', '#fdf2da', '#a06b05'],
  planting: ['Planting', 'rotate', '#e3f5ea', '#13773e'],
})

export const GOALS = localized([
  ['soil', 'Soil health', '#9a6a3f'],
  ['water', 'Water', '#1f74c2'],
  ['inc', 'Income', '#e59f12'],
  ['res', 'Resilience', '#1f9d55'],
  ['simp', 'Ease', '#6b62c9'],
])

export const SCENARIO_OPTIONS = localized([['now', 'Today'], ['ssp245', '2050 moderate'], ['ssp585', '2050 high']])
