import { parseAppointmentToDate } from './comms'

const DAY = 24 * 60 * 60 * 1000

function daysSince(date) {
  if (!date) return null
  const t = new Date(date).getTime()
  return (Date.now() - t) / DAY
}

// Returns an array of { enquiry, reason, due, severity }
// severity: 'overdue' | 'today' | 'soon'
export function computeReminders(enquiries) {
  const out = []
  const now = Date.now()

  for (const e of enquiries) {
    const tag = e.action_tag
    const created = e.created_at

    // Quote Sent: chase if >3 days
    if (tag === 'Quote Sent') {
      const d = daysSince(created)
      if (d != null && d >= 3) {
        out.push({
          enquiry: e,
          reason: 'Quote sent over 3 days ago — chase customer',
          due: now,
          severity: d >= 5 ? 'overdue' : 'soon',
        })
      }
    }

    // Booked appointment: remind day before
    if (e.status === 'Booked' && e.appointment_datetime) {
      const apt = parseAppointmentToDate(e.appointment_datetime)
      if (apt) {
        const hoursAway = (apt.getTime() - now) / (60 * 60 * 1000)
        if (hoursAway > 0 && hoursAway <= 36) {
          out.push({
            enquiry: e,
            reason: hoursAway <= 12 ? 'Appointment within 12 hours — confirm' : 'Appointment tomorrow — confirm with customer',
            due: apt.getTime(),
            severity: hoursAway <= 12 ? 'today' : 'soon',
          })
        }
        // After the appointment - ask for review
        if (apt.getTime() < now && (now - apt.getTime()) / (60*60*1000) <= 48) {
          out.push({
            enquiry: e,
            reason: 'Job done recently — ask for a Google review',
            due: now,
            severity: 'soon',
          })
        }
      }
    }

    // Awaiting Confirmation: ping if >24h
    if (tag === 'Awaiting Confirmation') {
      const d = daysSince(created)
      if (d != null && d >= 1) {
        out.push({
          enquiry: e,
          reason: 'Awaiting confirmation over 24h — ping customer',
          due: now,
          severity: d >= 3 ? 'overdue' : 'today',
        })
      }
    }

    // Needs Action - first response within 1 hour
    if (e.status === 'Needs Action') {
      const d = daysSince(created)
      if (d != null && d >= 1/24) {
        out.push({
          enquiry: e,
          reason: 'New enquiry not yet actioned — respond now',
          due: now,
          severity: d >= 1 ? 'overdue' : 'today',
        })
      }
    }
  }

  // Sort: overdue first, then today, then soon, then by created date
  const sev = { overdue: 0, today: 1, soon: 2 }
  out.sort((a, b) => sev[a.severity] - sev[b.severity])
  return out
}
