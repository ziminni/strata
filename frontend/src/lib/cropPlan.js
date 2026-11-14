// What happens during one crop's season, and what Tata predicts for it.
// Day numbers are typical for Central Luzon (PhilRice / DA guides); prototype values to refine with agronomists.
import { addDays, dayDiff, MON, parseYmd } from './format'

export const STAGES = ['Planting', 'Growing', 'Flowering', 'Ripening', 'Harvest']
export const stageAt = (day, days) => {
  const f = day / days
  return f < 0.12 ? 0 : f < 0.55 ? 1 : f < 0.75 ? 2 : f < 0.92 ? 3 : 4
}

/** Key field steps per crop as [day, title, detail]. */
const STEPS = {
  rice: [
    [1, 'Transplant or direct-seed', 'Keep 2–3 cm of water on the field.'],
    [14, '1st fertilizer', 'Apply complete fertilizer (14-14-14) plus urea.'],
    [30, 'Weed and check pests', 'Hand-weed and look for stem borer and golden snails.'],
    [45, '2nd fertilizer (topdress)', 'Apply urea at panicle initiation.'],
    [65, 'Flowering', 'Keep water on the field; flowers fail if it dries out or gets too hot.'],
    [100, 'Drain the field', 'Stop irrigating about 2 weeks before harvest.'],
    [115, 'Harvest', 'Harvest when 85–90% of the grains are golden.'],
  ],
  mais: [
    [1, 'Plant the seeds', 'Basal fertilizer at planting, 2 seeds per hill.'],
    [10, 'Thin and replant gaps', 'Leave the strongest seedling in each hill.'],
    [28, 'Side-dress and hill-up', 'Apply urea beside the rows and pile soil around the stems.'],
    [40, 'Check for fall armyworm', 'Look inside the leaf whorls for holes and frass.'],
    [58, 'Tasseling and silking', 'The most water-sensitive stage. Don’t let the soil dry out.'],
    [95, 'Dry-down', 'Husks turn brown; stop irrigating.'],
    [105, 'Harvest', 'Harvest when the kernels are hard and show a black layer.'],
  ],
  tabako: [
    [1, 'Transplant seedlings', 'Water each hill right after transplanting.'],
    [7, '1st fertilizer', 'Apply basal fertilizer around the plants.'],
    [25, '2nd fertilizer and hilling-up', 'Side-dress and pile soil around the stems.'],
    [55, 'Topping', 'Break off the flower heads so the leaves grow bigger.'],
    [60, 'Remove suckers', 'Take off the side shoots every week after topping.'],
    [75, 'Start priming', 'Pick the ripe bottom leaves first, 2–3 leaves per week.'],
    [120, 'Last harvest', 'Final pick of the top leaves, then cure them.'],
  ],
}
export const cropSteps = (crop) => STEPS[crop] || []

/** Typical yield per hectare (tons). Tobacco = cured leaf. */
const YIELD = { rice: [4.2, 'palay'], mais: [5.5, 'shelled corn'], tabako: [2.0, 'cured leaf'] }

export function cropStatus(plot, cropInfo, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const planted = parseYmd(plot.planted)
  const day = dayDiff(today, planted) + 1
  const days = cropInfo.days
  const harvest = parseYmd(plot.harvest)
  return {
    day, days, planted, harvest,
    left: Math.max(0, dayDiff(harvest, today)),
    progress: Math.min(1, Math.max(0, day / days)),
    stage: day < 1 ? -1 : day > days ? 4 : stageAt(day, days),
  }
}

/** This week's steps (the ones due within the next 7 days or overdue by ≤ 3 days) and the ones after. */
export function stepsTimeline(plot, day) {
  const planted = parseYmd(plot.planted)
  const steps = cropSteps(plot.crop)
  const all = steps.map(([d, title, detail], i) => ({
    d, title, detail,
    // the last step is the harvest: use the same date as the rest of the app
    date: i === steps.length - 1 ? parseYmd(plot.harvest) : addDays(planted, d - 1),
  }))
  return {
    now: all.filter((s) => s.d >= day - 3 && s.d <= day + 7),
    next: all.filter((s) => s.d > day + 7),
    done: all.filter((s) => s.d < day - 3),
  }
}

/** Yield, harvest shift and risks from the climate series ({T,X,P} monthly) and the season outlook. */
export function predictions(plot, cropInfo, clim, outlook) {
  const planted = parseYmd(plot.planted)
  const at = (frac) => addDays(planted, Math.round(cropInfo.days * frac)).getMonth()
  const flowerM = at(0.62), harvestM = at(0.97)
  const dryWater = plot.water !== 'canal'

  // yield
  const [perHa, unit] = YIELD[plot.crop] || [3, 'harvest']
  let f = 0.6 + 0.4 * (plot.score / 100)
  if (dryWater) f *= 1 + Math.min(0, outlook.rainPct) / 150
  const mid = perHa * plot.area * f
  const yieldRange = [mid * 0.9, mid * 1.1]

  // harvest shift
  let shift = 0, shiftWhy = 'Normal weather expected, so harvest should be on time.'
  if (dryWater && outlook.rainPct <= -10) { shift = 5; shiftWhy = 'A drier season can slow growth, so harvest may be about 5 days late.' }
  else if (outlook.dT >= 0.8) { shift = -3; shiftWhy = 'A hotter season speeds up ripening, so harvest may be about 3 days early.' }

  // risks
  const risks = []
  if (clim.X[flowerM] >= 34) risks.push({ level: 'high', title: `Heat during flowering (${MON[flowerM]})`, text: `Days reach ${Math.round(clim.X[flowerM])}°. Water in the late afternoon to keep the plants cool.` })
  if (clim.P[flowerM] < 40 && dryWater) risks.push({ level: 'high', title: `Dry spell at flowering (${MON[flowerM]})`, text: `Only ~${clim.P[flowerM]} mm of rain that month and your water is limited. Plan irrigation for this stage.` })
  if (clim.P[harvestM] > 280) risks.push({ level: 'mid', title: `Heavy rain at harvest (${MON[harvestM]})`, text: 'Harvest and dry quickly on sunny days to avoid spoilage.' })
  if ([6, 7, 8, 9].includes(harvestM)) risks.push({ level: 'mid', title: 'Typhoon season at harvest', text: 'Watch PAGASA warnings and harvest early if a storm is coming.' })
  if (plot.crop === 'mais') risks.push({ level: 'low', title: 'Fall armyworm', text: 'Common in corn around day 20–45. Check the leaf whorls weekly.' })
  if (plot.crop === 'rice' && [5, 6, 7, 8, 9].includes(at(0.3))) risks.push({ level: 'low', title: 'Stem borer and golden snail', text: 'More common in the wet season. Check the field weekly.' })
  if (plot.crop === 'tabako') risks.push({ level: 'low', title: 'Rain on curing leaves', text: 'Keep picked leaves under a roof while curing.' })
  return { yieldRange, unit, shift, shiftWhy, harvestAdj: addDays(parseYmd(plot.harvest), shift), risks: risks.slice(0, 3), flowerM }
}
