// Shared date helpers for the enquiry feed.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatTime12(d) {
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

export function formatCardDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const target = startOfDay(d)

  if (target.getTime() === today.getTime()) return `Today, ${formatTime12(d)}`
  if (target.getTime() === yesterday.getTime()) return `Yesterday, ${formatTime12(d)}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${formatTime12(d)}`
}

// Returns 'today' | 'yesterday' | 'week' | 'older'
export function groupKey(iso) {
  if (!iso) return 'older'
  const now = new Date()
  const today = startOfDay(now)
  const target = startOfDay(new Date(iso))
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays <= 6) return 'week'
  return 'older'
}

export const GROUP_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Earlier This Week',
  older: 'Older'
}

export const GROUP_ORDER = ['today', 'yesterday', 'week', 'older']
