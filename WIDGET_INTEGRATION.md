# Widget → Supabase Integration Notes

For Owen — quick reference for which Supabase columns the widget should write to so the PWA can display everything properly.

## Migration

Before the new columns work, run this in Supabase SQL Editor:
👉 `supabase/migration-v3-promote-fields.sql`

It adds `town`, `urgency`, `preferred_contact_time`, `custom_answers`, `enquiry_intent`, `booking_requested`, `booking_type` columns and backfills from any existing `raw_payload` data.

## Column names the widget should write to

| Widget data | Supabase column | Type | Example |
|---|---|---|---|
| Business UUID | `trade_id` | uuid | `681cdda1-9e2d-47f4-ad31-638d42be03f5` |
| Customer name | `customer_name` | text | `James Patterson` |
| Phone | `phone` | text | `07411 234 567` |
| Email | `email` | text | `james@gmail.com` |
| Postcode | `postcode` | text | `SK4 2QP` |
| Town | `town` | text | `Stockport` |
| Source | `source` | text | `Website Widget` |
| Service | `service_requested` | text | `Roof repair` |
| Job description | `job_description` | text | `Leaking roof on extension...` |
| Status | `status` | text | `Needs Action` |
| Action tag | `action_tag` | text | `Call Back` |
| Urgency | `urgency` | text | `Urgent / emergency` |
| Best time to call | `preferred_contact_time` | text | `Morning` |
| Custom Q&A array | `custom_answers` | jsonb | see below |
| Intent | `enquiry_intent` | text | `I'd like to book directly...` |
| Booking requested | `booking_requested` | boolean | `true` |
| Booking type | `booking_type` | text | `Callback` |
| Appointment | `appointment_datetime` | text/timestamptz | `2026-06-26T10:00:00Z` |
| Photo URL | `media_url` | text | `https://...storage/.../photo.jpg` |
| Full raw dump | `raw_payload` | jsonb | keep as backup |

## `custom_answers` format

```json
[
  { "question_text": "Is the issue currently causing water to come in?", "question_type": "yes_no", "answer": "Yes" },
  { "question_text": "What type of roof is it?", "question_type": "single_choice", "answer": "Pitched roof" },
  { "question_text": "Is the property residential or commercial?", "question_type": "single_choice", "answer": "Residential" }
]
```

The PWA renders this as an "Additional details" section with each question/answer as a row.

## Minimal POST example

```js
await fetch('https://vhslczshkcjjkzzfccge.supabase.co/rest/v1/enquiries', {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({
    trade_id: BUSINESS_UUID,
    customer_name: form.name,
    phone: form.phone,
    email: form.email,
    postcode: form.postcode,
    town: form.town,
    source: 'Website Widget',
    status: 'Needs Action',
    action_tag: 'Call Back',
    service_requested: form.service,
    job_description: form.description,
    urgency: form.urgency,
    preferred_contact_time: form.bestTime,
    enquiry_intent: form.intent,
    booking_requested: form.wantsBooking,
    booking_type: form.bookingType,
    appointment_datetime: form.appointment,
    media_url: form.photoUrl,
    custom_answers: form.customAnswers,
    raw_payload: form  // full backup
  })
})
```

## Test after changes

Submit a fake enquiry through the widget → check the PWA at https://backin5-app.netlify.app shows:
- ✅ Town, Urgency, Best time on the card
- ✅ "Additional details" section in the detail view with all custom Q&A
