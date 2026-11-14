import Chart from 'chart.js/auto'
import { useEffect, useRef } from 'react'

Chart.defaults.font.family = 'Manrope, system-ui, sans-serif'
Chart.defaults.color = '#5f6f66'
Chart.defaults.borderColor = '#e2e8e2'

/** Creates the chart once, then updates data/options in place when `config` changes. */
export default function ChartCanvas({ config, animate = true, className = 'relative h-[220px]', label }) {
  const canvas = useRef(null)
  const chart = useRef(null)
  useEffect(() => {
    chart.current = new Chart(canvas.current, config)
    return () => chart.current.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const c = chart.current
    if (!c) return
    c.data = config.data
    c.options = config.options
    c.update(animate ? undefined : 'none')
  }, [config, animate])
  return (
    <div className={className}>
      <canvas ref={canvas} role="img" aria-label={label} />
    </div>
  )
}
