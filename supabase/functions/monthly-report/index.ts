// Monthly report Edge Function
// ---------------------------------------------------------------
// Pulls a trade firm's last-completed month of enquiry data and
// returns a self-contained HTML report — the same layout as
// report-preview.html on the marketing site, but with real numbers.
//
// Usage (Owen, manually):
//   GET /functions/v1/monthly-report?trade_id=<uuid>
//        &month=2026-01            (optional, defaults to LAST month)
//        &as=html                  (optional, default — returns HTML)
//        &as=json                  (returns the raw aggregates)
//        &debug=1                  (includes diagnostic info)
//
// Owen pastes the URL into a browser, reviews, then copies the
// rendered HTML into an email to send to the customer himself.
// There is **no** auto-send. There is **no** cron schedule. Both
// of those can be wired later once the template is signed off.
//
// Auth: requires service_role bearer token in the Authorization
// header so this can only be invoked by Owen (or future internal
// tools). RLS does not gate it.
// ---------------------------------------------------------------

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

interface Enquiry {
  id: string
  trade_id: string
  source: string | null
  service_requested: string | null
  status: string
  action_tag: string | null
  process_tag: string | null
  booked_tag: string | null
  received_at: string
  first_actioned_at: string | null
  won_at: string | null
  won_value: number | null
  customer_name: string | null
  email: string | null
  phone: string | null
}

interface Trade {
  id: string
  business_name: string
  contact_name: string | null
  default_deal_value: number | null
}

// ── Helpers ────────────────────────────────────────────────────

function monthRange(monthIso?: string | null): { start: Date; end: Date; label: string } {
  // monthIso = "2026-01" or undefined (defaults to LAST complete month)
  const now = new Date()
  let year: number, month: number
  if (monthIso && /^\d{4}-\d{2}$/.test(monthIso)) {
    const [y, m] = monthIso.split('-').map(Number)
    year = y
    month = m - 1
  } else {
    // last complete month
    year = now.getUTCFullYear()
    month = now.getUTCMonth() - 1
    if (month < 0) { month = 11; year -= 1 }
  }
  const start = new Date(Date.UTC(year, month, 1))
  const end = new Date(Date.UTC(year, month + 1, 1))
  const label = start.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return { start, end, label }
}

function minutesBetween(a: string, b: string): number {
  return Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000)
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${Math.round(mins)} min`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pct(num: number, denom: number): number {
  if (!denom) return 0
  return Math.round((num / denom) * 100)
}

// ── Aggregation ────────────────────────────────────────────────

interface Aggregates {
  monthLabel: string
  firmName: string
  contactName: string
  totalEnquiries: number
  totalEnquiriesPrev: number
  wonCount: number
  wonValue: number
  avgDeal: number
  avgResponseMins: number | null
  avgResponseMinsPrev: number | null
  slowestResponseMins: number | null
  slowestResponseExample: { customer: string | null; source: string | null } | null
  conversionPct: number
  conversionPctPrev: number
  channels: Array<{ name: string; count: number; pct: number }>
  funnel: { enquiries: number; quoted: number; booked: number; won: number }
  bestSource: { name: string; conversion: number } | null
  topServices: Array<{ name: string; count: number; won: number }>
  peakHourLabel: string | null
  peakHourShare: number | null
  urgentShare: number | null
  avgLeadTimeDays: number | null
  repeatCustomersCount: number
  repeatCustomersOfWon: number
}

function aggregate(
  trade: Trade,
  thisMonth: Enquiry[],
  prevMonth: Enquiry[],
  monthLabel: string,
): Aggregates {
  const defaultDeal = Number(trade.default_deal_value ?? 0)

  // Won
  const won = thisMonth.filter((e) => !!e.won_at)
  const wonValue = won.reduce(
    (sum, e) => sum + Number(e.won_value ?? defaultDeal ?? 0),
    0,
  )
  const avgDeal = won.length ? Math.round(wonValue / won.length) : defaultDeal || 0

  // Response time
  const responded = thisMonth
    .filter((e) => e.first_actioned_at)
    .map((e) => ({
      mins: minutesBetween(e.received_at, e.first_actioned_at as string),
      enquiry: e,
    }))
  const avgResponseMins = responded.length
    ? responded.reduce((s, r) => s + r.mins, 0) / responded.length
    : null
  const slowest = responded.length
    ? responded.reduce((a, b) => (a.mins > b.mins ? a : b))
    : null

  const respondedPrev = prevMonth
    .filter((e) => e.first_actioned_at)
    .map((e) => minutesBetween(e.received_at, e.first_actioned_at as string))
  const avgResponseMinsPrev = respondedPrev.length
    ? respondedPrev.reduce((s, m) => s + m, 0) / respondedPrev.length
    : null

  // Channels
  const channelCounts = new Map<string, number>()
  for (const e of thisMonth) {
    const k = e.source ?? 'Other'
    channelCounts.set(k, (channelCounts.get(k) ?? 0) + 1)
  }
  const channels = Array.from(channelCounts.entries())
    .map(([name, count]) => ({ name, count, pct: pct(count, thisMonth.length) }))
    .sort((a, b) => b.count - a.count)

  // Best converting source
  const bySourceWon = new Map<string, { total: number; won: number }>()
  for (const e of thisMonth) {
    const k = e.source ?? 'Other'
    const cur = bySourceWon.get(k) ?? { total: 0, won: 0 }
    cur.total += 1
    if (e.won_at) cur.won += 1
    bySourceWon.set(k, cur)
  }
  const bestSource = Array.from(bySourceWon.entries())
    .filter(([, s]) => s.total >= 3) // ignore tiny samples
    .map(([name, s]) => ({ name, conversion: pct(s.won, s.total) }))
    .sort((a, b) => b.conversion - a.conversion)[0] ?? null

  // Funnel
  const quoted = thisMonth.filter((e) =>
    e.process_tag === 'Quote Sent' ||
    e.action_tag === 'Quote Required' ||
    !!e.won_at,
  ).length
  const booked = thisMonth.filter((e) =>
    e.status === 'Booked' ||
    e.booked_tag != null ||
    !!e.won_at,
  ).length
  const funnel = {
    enquiries: thisMonth.length,
    quoted,
    booked,
    won: won.length,
  }
  const conversionPct = pct(won.length, thisMonth.length)
  const wonPrev = prevMonth.filter((e) => !!e.won_at).length
  const conversionPctPrev = pct(wonPrev, prevMonth.length)

  // Top services
  const svcMap = new Map<string, { count: number; won: number }>()
  for (const e of thisMonth) {
    const k = e.service_requested ?? 'Other'
    const cur = svcMap.get(k) ?? { count: 0, won: 0 }
    cur.count += 1
    if (e.won_at) cur.won += 1
    svcMap.set(k, cur)
  }
  const topServices = Array.from(svcMap.entries())
    .map(([name, s]) => ({ name, count: s.count, won: s.won }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Peak hour
  const hourCounts = new Array(24).fill(0)
  for (const e of thisMonth) {
    const h = new Date(e.received_at).getUTCHours()
    hourCounts[h] += 1
  }
  let peakHour = -1
  let peakCount = 0
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > peakCount) { peakHour = h; peakCount = hourCounts[h] }
  }
  const peakHourLabel = peakHour >= 0
    ? `${peakHour}:00 – ${(peakHour + 2) % 24}:00`
    : null
  const peakHourShare = thisMonth.length ? pct(peakCount, thisMonth.length) : null

  // Urgent share (action_tag === 'Call Back' as proxy for urgent)
  const urgent = thisMonth.filter((e) =>
    e.action_tag === 'Call Back' || e.action_tag === 'Visit Required',
  ).length
  const urgentShare = thisMonth.length ? pct(urgent, thisMonth.length) : null

  // Lead time: enquiry → booked_callback / visit (using won_at as fallback)
  const leadTimes: number[] = []
  for (const e of thisMonth) {
    if (e.won_at) {
      leadTimes.push((new Date(e.won_at).getTime() - new Date(e.received_at).getTime()) / 86400000)
    }
  }
  const avgLeadTimeDays = leadTimes.length
    ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
    : null

  // Repeat customers: phone seen in older won enquiries
  const phonesThisMonth = thisMonth.map((e) => e.phone).filter((p): p is string => !!p)
  // (Owen will see the count in the report; the join itself runs in SQL
  // separately; we'll fill it in via a small extra query in main handler.)

  return {
    monthLabel,
    firmName: trade.business_name,
    contactName: trade.contact_name ?? '',
    totalEnquiries: thisMonth.length,
    totalEnquiriesPrev: prevMonth.length,
    wonCount: won.length,
    wonValue: Math.round(wonValue),
    avgDeal,
    avgResponseMins,
    avgResponseMinsPrev,
    slowestResponseMins: slowest?.mins ?? null,
    slowestResponseExample: slowest
      ? { customer: slowest.enquiry.customer_name, source: slowest.enquiry.source }
      : null,
    conversionPct,
    conversionPctPrev,
    channels,
    funnel,
    bestSource,
    topServices,
    peakHourLabel,
    peakHourShare,
    urgentShare,
    avgLeadTimeDays,
    repeatCustomersCount: 0, // filled in below
    repeatCustomersOfWon: 0, // filled in below
  }
}

// ── HTML render ────────────────────────────────────────────────

function colourForSource(source: string): string {
  const map: Record<string, string> = {
    'Website Enquiry': '#2341A8',
    'Website Widget': '#2341A8',
    'WhatsApp': '#25B270',
    'Missed Call': '#D4890E',
    'Checkatrade': '#5B8DEF',
    'Email': '#A06CFF',
    'Facebook Lead': '#5B8DEF',
    'Google Lead': '#34A853',
    'Other': '#8B94A7',
  }
  return map[source] ?? '#8B94A7'
}

function deltaBadge(curr: number, prev: number, suffix = '', better: 'up' | 'down' = 'up'): string {
  if (prev === 0) return ''
  const diff = curr - prev
  if (diff === 0) return `<div class="r-kpi-sub">no change</div>`
  const good = better === 'up' ? diff > 0 : diff < 0
  const arrow = diff > 0 ? '▲' : '▼'
  const sign = diff > 0 ? '+' : ''
  return `<div class="r-kpi-sub ${good ? 'up' : 'down'}">${arrow} ${sign}${diff}${suffix} vs prev</div>`
}

function deltaMinutes(curr: number | null, prev: number | null): string {
  if (curr == null || prev == null) return ''
  const diff = Math.round(prev - curr) // positive = improvement
  if (diff === 0) return `<div class="r-kpi-sub">no change</div>`
  const good = diff > 0
  const arrow = good ? '▲' : '▼'
  return `<div class="r-kpi-sub ${good ? 'up' : 'down'}">${arrow} ${Math.abs(diff)} min ${good ? 'faster' : 'slower'}</div>`
}

function renderHtml(a: Aggregates): string {
  const channelsHtml = a.channels.map((c) => {
    const colour = colourForSource(c.name)
    const widthPct = a.channels[0]?.count
      ? Math.round((c.count / a.channels[0].count) * 80) + 20
      : 0
    return `
      <div class="r-channel">
        <div class="r-channel-name"><span class="r-channel-dot" style="background:${colour}"></span>${escapeHtml(c.name)}</div>
        <div class="r-channel-track"><div class="r-channel-fill" style="width:${widthPct}%;background:${colour}"></div></div>
        <div class="r-channel-num">${c.count} <span>· ${c.pct}%</span></div>
      </div>`
  }).join('')

  const servicesHtml = a.topServices.map((s) => `
    <div class="r-service">
      <span class="r-service-name">${escapeHtml(s.name)}</span>
      <span class="r-service-count">${s.count} enquiries · ${s.won} won</span>
    </div>`).join('')

  const f = a.funnel
  const funnelHtml = `
    <div class="r-funnel-step">
      <strong>${f.enquiries}</strong><span>Enquiries</span>
      <em>100%</em>
    </div>
    <div class="r-funnel-step">
      <strong>${f.quoted}</strong><span>Quoted</span>
      <em>${pct(f.quoted, f.enquiries)}%</em>
    </div>
    <div class="r-funnel-step">
      <strong>${f.booked}</strong><span>Booked</span>
      <em>${pct(f.booked, f.enquiries)}%</em>
    </div>
    <div class="r-funnel-step final">
      <strong>${f.won}</strong><span>Won</span>
      <em>${pct(f.won, f.enquiries)}%</em>
    </div>`

  const bestInsight = a.bestSource
    ? `<strong>Best converting channel: ${escapeHtml(a.bestSource.name)}.</strong> ${a.bestSource.conversion}% of ${escapeHtml(a.bestSource.name)} enquiries turned into won jobs. Worth leaning into next month.`
    : `Not enough data yet to highlight a single best channel — give it another month of activity.`

  const greetingName = a.contactName ? `Hi ${escapeHtml(a.contactName.split(' ')[0])} — ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(a.firmName)} — ${escapeHtml(a.monthLabel)} Report</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root{--ink:#0E1116;--soft:#FAFBFC;--muted:#6B7588;--mute:#8B94A7;--hair:rgba(15,23,42,.08);--accent:#2341A8;--accent-soft:rgba(35,65,168,.07);--green:#1F7A3A;--green-soft:rgba(31,122,58,.10);--red:#B23F3F;--amber:#C57C00}
  *{box-sizing:border-box}
  html,body{margin:0;background:#F1F4F9;font-family:'IBM Plex Sans',system-ui,sans-serif;color:var(--ink);line-height:1.5;-webkit-font-smoothing:antialiased}
  .report{max-width:760px;margin:32px auto;background:#fff;border-radius:18px;box-shadow:0 30px 60px rgba(15,23,42,.08);overflow:hidden}
  .r-head{padding:28px 36px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--hair)}
  .r-logo{font-size:18px;font-weight:700;color:var(--ink)} .r-logo span{color:var(--accent)}
  .r-firm{font-size:14px;color:var(--muted);font-weight:600;margin-left:14px;padding-left:14px;border-left:1px solid var(--hair)}
  .r-period{font-size:12px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:6px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:.05em}
  .r-greet{padding:30px 36px 6px} .r-greet h1{margin:0 0 6px;font-size:26px;font-weight:700;letter-spacing:-.02em} .r-greet p{margin:0;color:var(--muted);font-size:15px}
  .r-hero{margin:22px 36px 12px;padding:28px 30px;background:linear-gradient(135deg,var(--accent),#3658c8 60%,#5b7be0);border-radius:14px;color:#fff;position:relative;overflow:hidden}
  .r-hero-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.7)}
  .r-hero-value{font-size:52px;font-weight:700;letter-spacing:-.025em;line-height:1.05;margin:4px 0 8px}
  .r-hero-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:13px;font-weight:600;color:rgba(255,255,255,.9)}
  .r-kpis{margin:18px 36px 8px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .r-kpi{background:var(--soft);border:1px solid var(--hair);border-radius:12px;padding:14px}
  .r-kpi-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mute)}
  .r-kpi-value{font-size:24px;font-weight:700;letter-spacing:-.01em;margin:4px 0 2px}
  .r-kpi-sub{font-size:11.5px;color:var(--muted);font-weight:600}
  .r-kpi-sub.up{color:var(--green)} .r-kpi-sub.down{color:var(--red)}
  .r-section{padding:28px 36px 4px} .r-section+.r-section{padding-top:4px}
  .r-section h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--mute);margin:0 0 14px;display:flex;align-items:center;gap:10px}
  .r-section h2::after{content:"";flex:1;height:1px;background:var(--hair)}
  .r-channels{display:flex;flex-direction:column;gap:10px}
  .r-channel{display:grid;grid-template-columns:150px 1fr 80px;align-items:center;gap:14px}
  .r-channel-name{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px}
  .r-channel-dot{width:8px;height:8px;border-radius:50%}
  .r-channel-track{height:10px;background:var(--hair);border-radius:999px;overflow:hidden}
  .r-channel-fill{height:100%;border-radius:999px}
  .r-channel-num{font-size:13px;font-weight:700;text-align:right}.r-channel-num span{font-weight:500;color:var(--mute);font-size:12px}
  .r-response{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .r-resp-card{padding:16px;border:1px solid var(--hair);border-radius:12px}
  .r-resp-card-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mute)}
  .r-resp-card-value{font-size:22px;font-weight:700;letter-spacing:-.01em;margin:6px 0 0}
  .r-resp-card-note{font-size:12px;color:var(--muted);margin-top:4px}
  .r-resp-card.good .r-resp-card-value{color:var(--green)}.r-resp-card.bad .r-resp-card-value{color:var(--amber)}
  .r-funnel{display:flex;align-items:stretch;gap:6px}
  .r-funnel-step{flex:1;min-width:0;background:var(--soft);border:1px solid var(--hair);border-radius:10px;padding:14px 12px 12px;text-align:center}
  .r-funnel-step strong{display:block;font-size:22px;font-weight:700;letter-spacing:-.01em}
  .r-funnel-step span{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mute);margin-top:2px}
  .r-funnel-step em{font-style:normal;display:block;font-size:11px;color:var(--muted);margin-top:6px;font-weight:600}
  .r-funnel-step.final{background:var(--accent-soft);border-color:rgba(35,65,168,.2)}
  .r-funnel-step.final strong{color:var(--accent)}
  .r-insight{margin:26px 36px 0;padding:18px 22px;background:var(--green-soft);border:1px solid rgba(31,122,58,.18);border-radius:12px;display:flex;gap:14px;align-items:flex-start}
  .r-insight-icon{flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
  .r-insight-body{font-size:13.5px;line-height:1.55}.r-insight-body strong{color:var(--green)}
  .r-services{display:flex;flex-direction:column;gap:8px}
  .r-service{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border:1px solid var(--hair);border-radius:10px;font-size:13px}
  .r-service-name{font-weight:600}.r-service-count{color:var(--muted);font-weight:600}
  .r-patterns{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .r-pattern-card{background:var(--soft);border:1px solid var(--hair);border-radius:12px;padding:16px 18px}
  .r-pattern-card .pl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mute)}
  .r-pattern-card .pv{font-size:18px;font-weight:700;margin-top:6px}
  .r-pattern-card .ps{font-size:12px;color:var(--muted);margin-top:4px}
  .r-cta{margin:28px 36px;padding:22px 24px;background:var(--ink);color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
  .r-cta-btn{background:var(--accent);color:#fff;padding:10px 18px;border-radius:100px;text-decoration:none;font-weight:700;font-size:13.5px}
  .r-foot{padding:20px 36px 28px;border-top:1px solid var(--hair);color:var(--muted);font-size:11.5px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}
  @media(max-width:640px){.r-head,.r-greet,.r-section,.r-foot{padding-left:22px;padding-right:22px}.r-hero,.r-kpis,.r-insight,.r-cta{margin-left:22px;margin-right:22px}.r-kpis{grid-template-columns:repeat(2,1fr)}.r-response,.r-patterns{grid-template-columns:1fr}.r-funnel{flex-direction:column}.r-channel{grid-template-columns:100px 1fr 60px;gap:10px}}
</style>
</head>
<body>
  <div class="report">

    <div class="r-head">
      <div style="display:flex;align-items:center">
        <div class="r-logo">BackIn<span>5</span></div>
        <div class="r-firm">${escapeHtml(a.firmName)}</div>
      </div>
      <div class="r-period">${escapeHtml(a.monthLabel)}</div>
    </div>

    <div class="r-greet">
      <h1>${greetingName}here's your month at a glance</h1>
      <p>${a.totalEnquiries} new enquiries, ${a.wonCount} won jobs${a.avgResponseMins != null ? `, ${formatMinutes(a.avgResponseMins)} average response time` : ''}.</p>
    </div>

    <div class="r-hero">
      <div class="r-hero-label">Estimated revenue from won jobs</div>
      <div class="r-hero-value">£${a.wonValue.toLocaleString('en-GB')}</div>
      <div class="r-hero-meta">
        <span>${a.wonCount} jobs at avg £${a.avgDeal.toLocaleString('en-GB')}</span>
      </div>
    </div>

    <div class="r-kpis">
      <div class="r-kpi">
        <div class="r-kpi-label">Enquiries</div>
        <div class="r-kpi-value">${a.totalEnquiries}</div>
        ${deltaBadge(a.totalEnquiries, a.totalEnquiriesPrev)}
      </div>
      <div class="r-kpi">
        <div class="r-kpi-label">Avg response</div>
        <div class="r-kpi-value">${a.avgResponseMins != null ? formatMinutes(a.avgResponseMins) : '—'}</div>
        ${deltaMinutes(a.avgResponseMins, a.avgResponseMinsPrev)}
      </div>
      <div class="r-kpi">
        <div class="r-kpi-label">Conversion</div>
        <div class="r-kpi-value">${a.conversionPct}%</div>
        ${deltaBadge(a.conversionPct, a.conversionPctPrev, ' pts')}
      </div>
      <div class="r-kpi">
        <div class="r-kpi-label">Avg deal</div>
        <div class="r-kpi-value">£${a.avgDeal.toLocaleString('en-GB')}</div>
        <div class="r-kpi-sub">based on ${a.wonCount} won</div>
      </div>
    </div>

    <div class="r-section">
      <h2>Where enquiries came from</h2>
      <div class="r-channels">${channelsHtml || '<div style="font-size:13px;color:var(--muted)">No enquiries this month.</div>'}</div>
    </div>

    <div class="r-section">
      <h2>How fast you responded</h2>
      <div class="r-response">
        <div class="r-resp-card good">
          <div class="r-resp-card-label">Average response</div>
          <div class="r-resp-card-value">${a.avgResponseMins != null ? formatMinutes(a.avgResponseMins) : '—'}</div>
          <div class="r-resp-card-note">${a.avgResponseMinsPrev != null && a.avgResponseMins != null ? `Was ${formatMinutes(a.avgResponseMinsPrev)} last month.` : 'First month with data — next month we can compare.'}</div>
        </div>
        <div class="r-resp-card bad">
          <div class="r-resp-card-label">Slowest response</div>
          <div class="r-resp-card-value">${a.slowestResponseMins != null ? formatMinutes(a.slowestResponseMins) : '—'}</div>
          <div class="r-resp-card-note">${a.slowestResponseExample?.source ? `${escapeHtml(a.slowestResponseExample.source)} enquiry${a.slowestResponseExample.customer ? ` — ${escapeHtml(a.slowestResponseExample.customer)}` : ''}.` : ' '}</div>
        </div>
      </div>
    </div>

    <div class="r-section">
      <h2>From enquiry to won</h2>
      <div class="r-funnel">${funnelHtml}</div>
    </div>

    <div class="r-insight">
      <div class="r-insight-icon">★</div>
      <div class="r-insight-body">${bestInsight}</div>
    </div>

    <div class="r-section">
      <h2>Top services requested</h2>
      <div class="r-services">${servicesHtml || '<div style="font-size:13px;color:var(--muted)">No services tagged this month.</div>'}</div>
    </div>

    <div class="r-section">
      <h2>When demand peaks</h2>
      <div class="r-patterns">
        <div class="r-pattern-card">
          <div class="pl">Repeat customers</div>
          <div class="pv">${a.repeatCustomersOfWon} of ${a.wonCount} wins</div>
          <div class="ps">${a.wonCount ? pct(a.repeatCustomersOfWon, a.wonCount) : 0}% of won jobs came from people you have worked with before</div>
        </div>
        <div class="r-pattern-card">
          <div class="pl">Peak hours</div>
          <div class="pv">${a.peakHourLabel ?? '—'}</div>
          <div class="ps">${a.peakHourShare != null ? `${a.peakHourShare}% of enquiries land in this window` : ' '}</div>
        </div>
        <div class="r-pattern-card">
          <div class="pl">Urgent enquiries</div>
          <div class="pv">${a.urgentShare != null ? `${a.urgentShare}%` : '—'}</div>
          <div class="ps">Marked as needing a call back or visit</div>
        </div>
        <div class="r-pattern-card">
          <div class="pl">Average lead time</div>
          <div class="pv">${a.avgLeadTimeDays != null ? `${a.avgLeadTimeDays} days` : '—'}</div>
          <div class="ps">From first enquiry to job won</div>
        </div>
      </div>
    </div>

    <div class="r-cta">
      <div style="font-size:14.5px;max-width:380px">Want to dig deeper? Every enquiry, photo and message is in your dashboard.</div>
      <a class="r-cta-btn" href="https://fjbuilds.github.io/backin5-pwa/">Open dashboard →</a>
    </div>

    <div class="r-foot">
      <span>BackIn5 monthly report · ${escapeHtml(a.monthLabel)}</span>
      <span><a href="https://backin5.org" style="color:var(--muted);text-decoration:none">backin5.org</a></span>
    </div>

  </div>
</body>
</html>`
}

// ── Handler ────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  // Auth: require service_role bearer.
  // Tolerant of whitespace/casing. Falls back to a project-set REPORT_AUTH_TOKEN
  // secret if the auto-injected SUPABASE_SERVICE_ROLE_KEY is unavailable.
  const authHeader = req.headers.get('Authorization') ?? ''
  const presentedToken = authHeader.replace(/^\s*Bearer\s+/i, '').trim()
  const expectedToken = (
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? Deno.env.get('REPORT_AUTH_TOKEN')
    ?? ''
  ).trim()

  if (!presentedToken || !expectedToken || presentedToken !== expectedToken) {
    // Debug mode: return non-sensitive diagnostics so we can see why the
    // comparison failed. Activate with ?debug=auth. Never echoes the keys
    // themselves — just lengths + first/last 4 chars so a mismatch is
    // obvious without leaking the secret.
    if (new URL(req.url).searchParams.get('debug') === 'auth') {
      const obscure = (s: string) =>
        s ? `${s.length} chars · ${s.slice(0, 4)}…${s.slice(-4)}` : '(empty)'
      return new Response(
        JSON.stringify({
          error: 'Unauthorised',
          debug: {
            presentedToken: obscure(presentedToken),
            expectedToken: obscure(expectedToken),
            authHeaderRaw: authHeader ? `${authHeader.length} chars` : '(missing)',
            envVarSource:
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
                ? 'SUPABASE_SERVICE_ROLE_KEY'
                : Deno.env.get('REPORT_AUTH_TOKEN')
                  ? 'REPORT_AUTH_TOKEN'
                  : '(neither set)',
          },
        }, null, 2),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    return new Response(
      JSON.stringify({ error: 'Unauthorised — pass service_role key as Bearer token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const url = new URL(req.url)
  const tradeId = url.searchParams.get('trade_id')
  const monthIso = url.searchParams.get('month') // YYYY-MM
  const as = url.searchParams.get('as') ?? 'html'

  if (!tradeId) {
    return new Response(
      JSON.stringify({ error: 'Missing trade_id query param' }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
  )

  // Fetch trade
  const { data: trade, error: tradeErr } = await supabase
    .from('trades')
    .select('id,business_name,contact_name,default_deal_value')
    .eq('id', tradeId)
    .single()
  if (tradeErr || !trade) {
    return new Response(
      JSON.stringify({ error: 'Trade not found', detail: tradeErr?.message }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { start, end, label } = monthRange(monthIso)
  const prevStart = new Date(start); prevStart.setUTCMonth(prevStart.getUTCMonth() - 1)
  const prevEnd = new Date(start)

  // Fetch enquiries for this month + previous month in one trip each
  const { data: thisMonth, error: thisErr } = await supabase
    .from('enquiries')
    .select('id,trade_id,source,service_requested,status,action_tag,process_tag,booked_tag,received_at,first_actioned_at,won_at,won_value,customer_name,email,phone')
    .eq('trade_id', tradeId)
    .gte('received_at', start.toISOString())
    .lt('received_at', end.toISOString())

  if (thisErr) {
    return new Response(
      JSON.stringify({ error: 'Enquiries query failed', detail: thisErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const { data: prevMonth } = await supabase
    .from('enquiries')
    .select('id,trade_id,source,service_requested,status,action_tag,process_tag,booked_tag,received_at,first_actioned_at,won_at,won_value,customer_name,email,phone')
    .eq('trade_id', tradeId)
    .gte('received_at', prevStart.toISOString())
    .lt('received_at', prevEnd.toISOString())

  // Compute aggregates
  const agg = aggregate(trade as Trade, (thisMonth ?? []) as Enquiry[], (prevMonth ?? []) as Enquiry[], label)

  // Repeat-customers query: count this month's won enquiries whose
  // phone has been seen in an earlier won enquiry for the same trade.
  if (agg.wonCount > 0) {
    const wonPhones = (thisMonth ?? [])
      .filter((e: any) => e.won_at && e.phone)
      .map((e: any) => ({ phone: e.phone as string, wonAt: e.won_at as string }))
    let repeat = 0
    for (const w of wonPhones) {
      const { count } = await supabase
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .eq('trade_id', tradeId)
        .eq('phone', w.phone)
        .lt('won_at', w.wonAt)
        .not('won_at', 'is', null)
      if ((count ?? 0) > 0) repeat += 1
    }
    agg.repeatCustomersOfWon = repeat
    agg.repeatCustomersCount = repeat
  }

  if (as === 'json') {
    return new Response(JSON.stringify(agg, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(renderHtml(agg), {
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
  })
})
