// Consistent colour per action tag — shown on card, on stage picker, and on detail view.
// Tradespeople learn "orange = visit", "purple = quote", etc.

const ACTION_COLOURS = {
  // Needs Action
  'Call Back':            '#3B82F6', // blue
  'Reply Required':       '#06B6D4', // cyan
  'Quote Required':       '#A855F7', // purple
  'Visit Required':       '#F97316', // orange
  'Review Details':       '#6B7280', // grey
  // In Process
  'Contacted':            '#60A5FA',
  'Waiting on Customer':  '#F59E0B',
  'Quote Sent':           '#6366F1',
  'Appointment Agreed':   '#14B8A6',
  'Awaiting Confirmation':'#F59E0B',
  // Booked
  'Job Booked':           '#10B981',
  'Callback Booked':      '#10B981',
  'Visit Booked':         '#10B981',
  'Quote Accepted':       '#10B981',
}

export function getActionColor(tag) {
  return ACTION_COLOURS[tag] || '#6B7FA3'
}
