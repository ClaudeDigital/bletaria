// Datat shqip pa u mbështetur te locale 'sq-AL' (shumë telefona s'e kanë → dalin anglisht)
export const MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor']
export const MONTHS_SHORT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'kor', 'gus', 'sht', 'tet', 'nën', 'dhj']
export const WEEKDAYS = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë']

export function toDate(v) {
  if (!v) return null
  if (v instanceof Date) return v
  const s = String(v)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s.replace(' ', 'T'))
  return isNaN(d) ? null : d
}

export function fmtDate(v, { year = true } = {}) {
  const d = toDate(v)
  if (!d) return '—'
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year ? ' ' + d.getFullYear() : ''}`
}

export function fmtDay(v) {
  const d = toDate(v)
  if (!d) return '—'
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

export function daysFrom(v) {
  const d = toDate(v)
  if (!d) return null
  const a = new Date(); a.setHours(0, 0, 0, 0)
  const b = new Date(d); b.setHours(0, 0, 0, 0)
  return Math.round((b - a) / 86400000)
}

export function relDay(v) {
  const n = daysFrom(v)
  if (n === null) return '—'
  if (n === 0) return 'sot'
  if (n === 1) return 'nesër'
  if (n === -1) return 'dje'
  if (n > 1) return `pas ${n} ditësh`
  return `${-n} ditë më parë`
}

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
