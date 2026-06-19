# Monthly Report Edge Function

A read-only Supabase Edge Function that produces the BackIn5 monthly
performance report for a single trade firm, with real numbers, as an
HTML page.

**Owen runs this manually.** There is no cron, no auto-send, no email
delivery wired in yet — by design. Owen reviews the rendered HTML in
his browser, then forwards it to the trade firm himself until the
template is signed off.

---

## Prerequisites

Run the migration once:

```sql
-- in Supabase SQL editor, on the dashboard project (vhslczshkcjjkzzfccge)
\i supabase/migration-v4-monthly-report.sql
```

That adds:
- `trades.default_deal_value` — set this per firm (£) so revenue is meaningful
- `enquiries.first_actioned_at` — auto-set when status leaves `Needs Action`
- `enquiries.won_at`, `enquiries.won_value` — auto-set when `booked_tag = 'Quote Accepted'`

For older enquiries that pre-date the trigger, you can backfill once:

```sql
UPDATE enquiries
SET first_actioned_at = received_at + interval '15 minutes'
WHERE first_actioned_at IS NULL
  AND status <> 'Needs Action';
```

## Deploy

```bash
cd supabase
supabase functions deploy monthly-report
```

The function picks up `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
automatically from the project — nothing to set.

## Use

Owen's flow is one URL paste away. From a browser tab logged into
nothing in particular:

```
https://vhslczshkcjjkzzfccge.supabase.co/functions/v1/monthly-report
  ?trade_id=<uuid>
  &month=2026-01
```

Add the Authorization header (only practical from terminal, not
browser address bar):

```bash
curl 'https://vhslczshkcjjkzzfccge.supabase.co/functions/v1/monthly-report?trade_id=<uuid>&month=2026-01' \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  > out.html
open out.html
```

Query params:

| Param | Default | Notes |
|---|---|---|
| `trade_id` | required | UUID from `trades.id` |
| `month` | last complete month | Format `YYYY-MM` (e.g. `2026-01`) |
| `as` | `html` | Pass `as=json` to get raw aggregates instead of HTML |

## What it computes

All numbers come from `enquiries` filtered to the trade + month:

- **Hero £** — sum of `won_value` for `won_at in month` (falls back to `trades.default_deal_value` if `won_value` is NULL)
- **Avg deal** — won £ ÷ won count
- **Enquiries** — count by `received_at`
- **Avg response** — minutes from `received_at` to `first_actioned_at`
- **Slowest response** — same metric, max
- **Conversion %** — won ÷ enquiries
- **Channels** — group by `source`
- **Funnel** — count by `process_tag`, `status`, `booked_tag`
- **Best converting source** — won ÷ total per source (samples >= 3)
- **Top services** — group by `service_requested`
- **Peak hours** — most common 2-hour window of `received_at`
- **Urgent share** — `action_tag in ('Call Back','Visit Required')`
- **Lead time** — days from `received_at` to `won_at`
- **Repeat customers** — won enquiries whose `phone` appeared in an earlier won enquiry

## Sending later (when the template is signed off)

Owen will eventually want this to send itself. Two cheap options:

1. **Resend + pg_cron** — schedule a SQL function on the 1st of each month
   that calls this Edge Function for every active trade and POSTs the
   HTML to Resend. Free up to 3,000 emails/month.
2. **Make scenario** — one monthly trigger, loops over trades, calls
   this Edge Function, sends via the existing Make email module. Uses
   Make ops, no new vendor.

Either is a one-time wiring job once the report itself is locked.
