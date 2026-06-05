// Phone / SMS / WhatsApp / ICS helpers

export function digitsOnly(phone) {
  return (phone || '').replace(/[^\d+]/g, '')
}

// UK normaliser: 07xxxxxxxxx -> +447xxxxxxxxx, +447xxx unchanged
export function toInternational(phone) {
  let p = digitsOnly(phone)
  if (p.startsWith('+44')) return p
  if (p.startsWith('44')) return '+' + p
  if (p.startsWith('07')) return '+44' + p.slice(1)
  return p
}

export function smsHref(phone, body) {
  // sms:+44... ?&body= encoded — works on iOS and Android
  const num = toInternational(phone).replace(/\s/g, '')
  return `sms:${num}?&body=${encodeURIComponent(body)}`
}

export function whatsappHref(phone, body) {
  const num = toInternational(phone).replace(/[^\d]/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(body)}`
}

// Build ICS file content for a single event
export function buildIcs({ title, startDate, durationMinutes = 60, description = '', location = '' }) {
  const dtStart = formatIcsDate(startDate)
  const dtEnd   = formatIcsDate(new Date(startDate.getTime() + durationMinutes * 60_000))
  const uid     = `${Date.now()}-${Math.random().toString(36).slice(2)}@backin5`
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BackIn5//Dashboard//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(description)}`,
    `LOCATION:${escape(location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function pad(n) { return String(n).padStart(2, '0') }
function formatIcsDate(d) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Parse widget appointment "2026-06-25 at 11:00am" into a Date
export function parseAppointmentToDate(str) {
  if (!str) return null
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+at\s+(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
  if (!m) return null
  let [, y, mo, d, h, min, ampm] = m
  let hour = Number(h)
  if (ampm) {
    if (/pm/i.test(ampm) && hour < 12) hour += 12
    if (/am/i.test(ampm) && hour === 12) hour = 0
  }
  return new Date(Number(y), Number(mo) - 1, Number(d), hour, Number(min), 0)
}
