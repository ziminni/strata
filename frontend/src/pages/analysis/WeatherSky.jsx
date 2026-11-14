import { Icon, WxIcon } from '../../components/Icon'
import { SpeakButton } from '../../components/Speech'
import { useApp } from '../../context/AppContext'
import { addDays, ARAW } from '../../lib/format'
import { forecast, NOW_TXT, SKY_CLASS, tempAt, wxDay } from '../../lib/weather'

/** iOS-weather-style header for Simple mode. `clim` = monthly {T,X,P} for today's climate. */
export default function WeatherSky({ clim, lat, lon }) {
  const { farm } = useApp()
  const { today: t, h, cur, kNow, hours, days } = forecast(farm.prov, clim, lat, lon)
  const curTxt = NOW_TXT[kNow]
  const mn = Math.min(...days.map((x) => x.lo))
  const mx = Math.max(...days.map((x) => x.hi))
  const sp = Math.max(1, mx - mn)
  const tomorrow = days[1]

  let sum = (t.k === 'rain' || t.k === 'storm') && h < 20 ? 'Posibleng umulan ngayong hapon hanggang gabi.' : `${curTxt} hanggang mamayang gabi.`
  sum += ` Aabot sa ${t.gust} km/h ang bugso ng hangin.`
  if (tomorrow.chance >= 50) sum += ` Bukas, ${tomorrow.chance}% ang tsansa ng ulan.`

  const speech = () => {
    const now = new Date()
    const rainy = [1, 2, 3, 4, 5, 6, 7].map((i) => wxDay(farm.prov, clim, addDays(now, i))).filter((x) => x.chance >= 50).map((x) => ARAW[x.d.getDay()])
    return `Ngayon sa ${farm.mun}: ${Math.round(tempAt(t, now.getHours()))} degrees. Pinakamainit ${t.hi}, pinakamalamig ${t.lo}. ` +
      (rainy.length ? `Posibleng umulan sa ${rainy.join(', ')}.` : 'Walang inaasahang malakas na ulan ngayong linggo.')
  }

  return (
    <section className={`sky ${SKY_CLASS[kNow]}`} aria-label="Panahon sa bukid">
      <div className="inline-flex items-center gap-[5px] text-[14px] font-bold tracking-[0.06em] opacity-95 [&_.ic]:size-[15px] [&_.ic]:fill-white">
        <Icon name="nav" />BUKID KO
      </div>
      <h2 className="mt-1 font-sans text-[32px] leading-[1.15] font-medium tracking-[-0.01em]">{farm.mun}</h2>
      <div className="mt-0.5 ml-[18px] text-[104px] leading-none font-extralight tracking-[-4px] [text-shadow:0_2px_14px_rgb(0_0_0/0.08)]">{cur}°</div>
      <div className="mt-0.5 text-[22px] font-semibold">{curTxt}</div>
      <div className="mt-0.5 text-[21px] font-semibold">T:{t.hi}°&nbsp;&nbsp;B:{t.lo}°</div>
      <SpeakButton text={speech} className="mt-3! bg-white/20! text-white!" />

      <div className="glass">
        <p className="mb-3 border-b border-white/25 pb-3 text-[16.5px] leading-[1.4]">{sum}</p>
        <div className="wx no-scrollbar -mx-1.5 flex gap-1 overflow-x-auto">
          {hours.map((o, i) => (
            <div key={i} className={`flex flex-none flex-col items-center gap-2.5 text-[15px] font-bold ${o.ev ? 'basis-[84px]' : 'basis-16'}`}>
              <span className="text-[14.5px] whitespace-nowrap">{o.lab}</span>
              <WxIcon k={o.k} />
              <b className={o.ev ? 'text-[15px] font-semibold' : 'text-[18px] font-semibold'}>{o.v}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="glass">
        <div className="flex items-center gap-[7px] border-b border-white/25 pb-2 text-[13px] font-bold tracking-[0.06em] opacity-70 [&_.ic]:size-[17px]">
          <Icon name="calendar" />SUSUNOD NA 7 ARAW
        </div>
        {days.map((x, i) => {
          const l = ((x.lo - mn) / sp) * 100
          const w = ((x.hi - x.lo) / sp) * 100
          return (
            <div key={i} className="grid h-[58px] grid-cols-[72px_44px_34px_1fr_38px] items-center gap-2 border-b border-white/20 last:border-0">
              <div className="text-[20px] font-semibold">{i === 0 ? 'Ngayon' : i === 1 ? 'Bukas' : ARAW[x.d.getDay()].slice(0, 3)}</div>
              <div className="wx flex flex-col items-center leading-none">
                <WxIcon k={x.k} />
                {x.chance >= 30 && <em className="mt-0.5 text-[12.5px] font-extrabold text-[#7fd3ff] not-italic">{x.chance}%</em>}
              </div>
              <div className="text-right text-[19px] font-semibold opacity-60">{x.lo}°</div>
              <div className="relative h-1.5 rounded bg-black/18">
                <i
                  className="temp-range"
                  style={{ left: `${l}%`, width: `${w}%`, backgroundSize: `${(100 / Math.max(w, 1)) * 100}% 100%`, backgroundPosition: `${(l / (100 - w || 1)) * 100}% 0` }}
                />
                {i === 0 && (
                  <u className="absolute top-1/2 -mt-[4.5px] -ml-[4.5px] box-border size-[9px] rounded-full border-2 border-[rgb(40_55_75/0.55)] bg-white" style={{ left: `${((cur - mn) / sp) * 100}%` }} />
                )}
              </div>
              <div className="text-right text-[19px] font-semibold">{x.hi}°</div>
            </div>
          )
        })}
        <div className="mt-2 text-[12px] opacity-75">Prototype: batay sa klima ng {farm.prov} (NASA POWER). Sa tunay na app, PAGASA forecast.</div>
      </div>
    </section>
  )
}
