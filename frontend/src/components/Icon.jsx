// Stroke icons from the Strata prototype (24×24, currentColor). Static strings only.
const PATHS = {
  nav: '<path d="M21 3 3 10.5l7.5 2.2L13 21z"/>',
  analysis: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  chat: '<path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-5A8.5 8.5 0 1 1 21 12z"/>',
  chatTrend: '<path d="M21 12a8.5 8.5 0 0 1-12.3 7.6L3.5 21l1.4-5A8.5 8.5 0 1 1 21 12z"/><path d="M8 13l3-3 2.5 2.5L17 9"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18 14.6a6.5 6.5 0 0 1 3.5 5.4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  rotate: '<path d="M20 11a8 8 0 0 0-14.9-4"/><path d="M4 3v4h4"/><path d="M4 13a8 8 0 0 0 14.9 4"/><path d="M20 21v-4h-4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  note: '<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  drop: '<path d="M12 3s6.5 6.8 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.8 12 3 12 3z"/>',
  alert: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 10"/>',
  leaf: '<path d="M5 20c0-9.5 6-15 15-15 0 9.5-5.5 15-14.5 15"/><path d="M5 20l7.5-7.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  // weather
  cloud: '<path d="M7 18h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 11 3.5 3.5 0 0 0 7 18z"/>',
  rain: '<path d="M7 15h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 8 3.5 3.5 0 0 0 7 15z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>',
  storm: '<path d="M7 14h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.3 7 3.5 3.5 0 0 0 7 14z"/><path d="M12.5 15l-2 3.5h3l-2 3.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  cmoon: '<path d="M14 3.5a5 5 0 0 0 5.5 6.5A5 5 0 0 1 14 3.5z"/><path d="M7 19h9a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 6.6 13.3 3 3 0 0 0 7 19z"/>',
  sunset: '<path d="M3 20h18M5 16h14M7.5 16a4.5 4.5 0 0 1 9 0M12 3v6M9.5 6.5 12 9l2.5-2.5"/>',
  sunrise: '<path d="M3 20h18M5 16h14M7.5 16a4.5 4.5 0 0 1 9 0M12 9V3M9.5 5.5 12 3l2.5 2.5"/>',
  partly: '<circle cx="8.5" cy="8" r="3"/><path d="M8.5 2.5v1M3 8h1M4.6 4.1l.7.7M12.4 4.1l-.7.7"/><path d="M9 19h9a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 8.6 13.3 3 3 0 0 0 9 19z"/>',
}

export function Icon({ name, className = '' }) {
  return <svg className={`ic ${className}`} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: PATHS[name] }} />
}

export function WxIcon({ k }) {
  return <Icon name={k} className={k === 'sun' ? 'wx-sun' : ''} />
}
