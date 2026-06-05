// Per-channel colours for the source label on enquiry cards.
// Pick anything matching this exact source, else fall back to a muted colour.

const SOURCE_COLOURS = {
  'Missed Call':    '#D4890E',  // amber
  'Website Form':   '#5B8DEF',  // blue
  'Website Widget': '#6E83D8',  // soft purple
  'Email':          '#3FB8AF',  // teal
  'Text':           '#34A853',  // green
  'Trade Site':     '#A07BD8',  // purple
  'Checkatrade':    '#A07BD8',  // purple
  'MyBuilder':      '#A07BD8',  // purple
}

export function getSourceColor(source) {
  return SOURCE_COLOURS[source] || 'var(--muted)'
}
