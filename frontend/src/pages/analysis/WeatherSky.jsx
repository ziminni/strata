import { Icon, WxIcon } from '../../components/Icon'
import { useApp } from '../../context/AppContext'
import { tr } from '../../lib/i18n'
import { forecast, NOW_TXT, SKY_CLASS } from '../../lib/weather'

/** iOS-weather-style header for the Simple dashboard. `clim` = monthly {T,X,P} for today's climate. */
export default function WeatherSky({ clim, lat, lon }) {
  const { farm } = useApp()
  const { today: t, kNow, cur, hours } = forecast(farm.prov, clim, lat, lon)

  return (
    <section className={`sky ${SKY_CLASS[kNow]} lg:pt-10`} aria-label={tr('Weather on your farm')}>
      <div className="inline-flex items-center gap-[5px] text-[14px] font-bold tracking-[0.06em] opacity-95 [&_.ic]:size-[15px] [&_.ic]:fill-white">
        <Icon name="nav" />{tr('MY FARM')}
      </div>
      <h2 className="mt-1 font-sans text-[32px] leading-[1.15] font-medium tracking-[-0.01em]">{farm.mun}</h2>
      <div className="mt-0.5 ml-[18px] text-[104px] leading-none font-extralight tracking-[-4px] [text-shadow:0_2px_14px_rgb(0_0_0/0.08)]">{cur}°</div>
      <div className="mt-0.5 text-[22px] font-semibold">{NOW_TXT[kNow]}</div>
      <div className="mt-0.5 text-[21px] font-semibold">{tr('H')}:{t.hi}°&nbsp;&nbsp;{tr('L')}:{t.lo}°</div>

      <div className="glass">
        <div className="wx no-scrollbar -mx-1.5 flex gap-1 overflow-x-auto" data-noswipe>
          {hours.map((o, i) => (
            <div key={i} className={`flex flex-none flex-col items-center gap-2.5 text-[15px] font-bold ${o.ev ? 'basis-[84px]' : 'basis-16'}`}>
              <span className="text-[14.5px] whitespace-nowrap">{tr(o.lab)}</span>
              <WxIcon k={o.k} />
              <b className={o.ev ? 'text-[15px] font-semibold' : 'text-[18px] font-semibold'}>{o.ev ? tr(o.v) : o.v}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
