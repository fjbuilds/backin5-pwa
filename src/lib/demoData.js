// Demo data — populates the dashboard without a login. Access via ?demo

const now = new Date()
const hoursAgo = (h, m = 0) => { const d = new Date(now); d.setHours(d.getHours() - h, d.getMinutes() - m, 0, 0); return d.toISOString() }
const daysAgo = (days, h, m) => { const d = new Date(now); d.setDate(d.getDate() - days); d.setHours(h, m, 0, 0); return d.toISOString() }
const aptIn = (days, h, m) => {
  const d = new Date(now); d.setDate(d.getDate() + days)
  const hh = h > 12 ? `${h - 12}:${String(m).padStart(2, '0')}pm`
                    : h === 12 ? `12:${String(m).padStart(2, '0')}pm`
                    : `${h}:${String(m).padStart(2, '0')}am`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} at ${hh}`
}

export const DEMO_TRADE = {
  id: 'demo',
  business_name: 'Tradesman Ltd',
}

// 5 enquiries — each shows a different journey through the system.
export const DEMO_ENQUIRIES = [
  // 1 — Urgent, needs a call back NOW
  {
    id: '1',
    customer_name: 'James Patterson',
    phone: '07411 234 567',
    email: 'james.p@gmail.com',
    postcode: 'SK4 2QP',
    town: 'Stockport',
    source: 'Website Widget',
    service_requested: 'Emergency repair',
    urgency: 'Urgent / emergency',
    enquiry_intent: "I'd like someone to call me back",
    preferred_contact_time: 'Morning',
    status: 'Needs Action',
    action_tag: 'Call Back',
    created_at: hoursAgo(0, 18),
    custom_answers: [
      { question_text: 'Is the issue causing damage right now?', answer: 'Yes' },
      { question_text: 'How long has it been happening?', answer: 'Started this morning' },
    ],
  },

  // 2 — Quote request with a customer photo
  {
    id: '2',
    customer_name: 'Sarah Mitchell',
    phone: '07722 891 004',
    email: 'sarah.m@hotmail.co.uk',
    postcode: 'M20 1LP',
    town: 'Manchester',
    source: 'Website Widget',
    service_requested: 'Full installation',
    urgency: 'As soon as possible',
    enquiry_intent: "I'd like a quote",
    preferred_contact_time: 'Afternoon',
    status: 'Needs Action',
    action_tag: 'Quote Required',
    created_at: hoursAgo(2, 5),
    media_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    custom_answers: [
      { question_text: 'How long ago was this installed?', answer: 'Around 15 years ago' },
      { question_text: 'Any specific preferences?', answer: 'Whatever lasts longest' },
    ],
  },

  // 3 — Booked direct via the calendar — appointment confirmed
  {
    id: '3',
    customer_name: 'Lisa Thompson',
    phone: '07432 556 789',
    email: 'lisa.t@yahoo.co.uk',
    postcode: 'SK7 1NE',
    town: 'Bramhall',
    source: 'Website Widget',
    service_requested: 'Site survey',
    urgency: 'This week',
    enquiry_intent: "I'd like to book directly if available",
    booking_type: 'Site visit',
    status: 'Booked',
    action_tag: 'Visit Booked',
    appointment_datetime: aptIn(2, 14, 30),
    created_at: hoursAgo(5, 30),
  },

  // 4 — Quote sent 4 days ago — follow-up surfaces this
  {
    id: '4',
    customer_name: 'Karen Williams',
    phone: '07900 123 456',
    email: 'karen.w@gmail.com',
    postcode: 'WA15 8JQ',
    town: 'Altrincham',
    source: 'Website Widget',
    service_requested: 'Maintenance work',
    urgency: 'Flexible / just looking',
    enquiry_intent: "I'd like a quote",
    preferred_contact_time: 'Morning',
    status: 'In Process',
    action_tag: 'Quote Sent',
    created_at: daysAgo(4, 11, 20),
    internal_notes: '[02/06 11:30] Quote sent via email - £1,850. Awaiting reply.',
  },

  // 5 — Site visit needed, urgent
  {
    id: '5',
    customer_name: 'Mohammed Ali',
    phone: '07765 998 102',
    email: 'mali@outlook.com',
    postcode: 'M14 5RG',
    town: 'Fallowfield',
    source: 'Website Widget',
    service_requested: 'Emergency callout',
    urgency: 'Urgent / emergency',
    enquiry_intent: "I'd like to request a visit / survey",
    preferred_contact_time: 'Anytime',
    status: 'Needs Action',
    action_tag: 'Visit Required',
    created_at: hoursAgo(3, 0),
    custom_answers: [
      { question_text: 'Is anyone in the property?', answer: 'Yes, family at home' },
      { question_text: 'How urgent is this?', answer: 'Today if possible' },
    ],
  },
]

export const DEMO_STATS = {
  total_enquiries: 5,
  needs_action_count: 3,
  in_process_count: 1,
  booked_count: 1,
}
