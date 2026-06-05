// Demo data for design review — no auth required.
// Access via ?demo query param.

const now = new Date()
const today = (h, m) => {
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const yesterday = (h, m) => {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const daysAgo = (days, h, m) => {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const DEMO_TRADE = {
  id: 'demo',
  business_name: 'Summit Roofing Ltd',
}

export const DEMO_ENQUIRIES = [
  {
    id: '1',
    business_id: 'demo',
    customer_name: 'James Patterson',
    customer_phone: '07411 234 567',
    customer_email: 'james.p@gmail.com',
    postcode: 'SK4 2QP',
    town: 'Stockport',
    source: 'Missed Call',
    service_requested: 'Roof repair',
    job_description: 'Leaking roof on single storey extension. Wants quote this week.',
    urgency: 'This week',
    status: 'Needs Action',
    action_tag: 'Call Back',
    created_at: today(9, 41)
  },
  {
    id: '2',
    business_id: 'demo',
    customer_name: 'Sarah Mitchell',
    customer_phone: '07722 891 004',
    customer_email: 'sarah.m@hotmail.co.uk',
    postcode: 'M20 1LP',
    town: 'Manchester',
    source: 'Website Form',
    service_requested: 'Re-roofing',
    job_description: 'Full re-roof on 3 bed semi. Multiple quotes being gathered.',
    urgency: 'Next 2 weeks',
    status: 'Needs Action',
    action_tag: 'Quote Required',
    created_at: today(8, 15)
  },
  {
    id: '3',
    business_id: 'demo',
    customer_name: 'David Chen',
    customer_phone: '07855 443 210',
    customer_email: 'd.chen@icloud.com',
    postcode: 'SK4 3NR',
    town: 'Heaton Moor',
    source: 'Email',
    service_requested: 'Guttering',
    job_description: 'Guttering replacement on detached property. Downpipes leaking.',
    status: 'In Process',
    action_tag: 'Contacted',
    created_at: today(7, 30)
  },
  {
    id: '4',
    business_id: 'demo',
    customer_name: 'Karen Williams',
    customer_phone: '07900 123 456',
    customer_email: 'karen.w@gmail.com',
    postcode: 'WA15 8JQ',
    town: 'Altrincham',
    source: 'Website Form',
    service_requested: 'Flat roof',
    job_description: 'Garage flat roof leaking. Needs replacing. Available weekdays.',
    status: 'In Process',
    action_tag: 'Quote Sent',
    created_at: yesterday(16, 20)
  },
  {
    id: '5',
    business_id: 'demo',
    customer_name: 'Mohammed Ali',
    customer_phone: '07765 998 102',
    customer_email: 'mali@outlook.com',
    postcode: 'M14 5RG',
    town: 'Fallowfield',
    source: 'Missed Call',
    service_requested: 'Emergency repair',
    job_description: 'Storm damage to ridge tiles. 3 tiles missing, water coming in.',
    urgency: 'ASAP',
    status: 'Needs Action',
    action_tag: 'Call Back',
    created_at: yesterday(14, 5)
  },
  {
    id: '6',
    business_id: 'demo',
    customer_name: 'Lisa Thompson',
    customer_phone: '07432 556 789',
    customer_email: 'lisa.t@yahoo.co.uk',
    postcode: 'SK7 1NE',
    town: 'Bramhall',
    source: 'Checkatrade',
    service_requested: 'Chimney work',
    job_description: 'Chimney stack repointing and new flashing. Lead work needed.',
    status: 'In Process',
    action_tag: 'Appointment Agreed',
    created_at: yesterday(11, 30)
  },
  {
    id: '7',
    business_id: 'demo',
    customer_name: 'Tom Bradley',
    customer_phone: '07811 223 344',
    customer_email: 'tom.bradley@gmail.com',
    postcode: 'M21 0BN',
    town: 'Chorlton',
    source: 'Website Widget',
    service_requested: 'Re-roofing',
    job_description: 'Victorian terrace, full slate re-roof. Budget around £8k.',
    status: 'Booked',
    action_tag: 'Job Booked',
    created_at: daysAgo(3, 10, 15)
  },
  {
    id: '8',
    business_id: 'demo',
    customer_name: 'Rachel Foster',
    customer_phone: '07955 667 881',
    customer_email: 'rachel.f@live.co.uk',
    postcode: 'SK3 8AB',
    town: 'Stockport',
    source: 'Email',
    service_requested: 'Fascias & soffits',
    job_description: 'Replace fascias, soffits and guttering on semi-detached. UPVC preferred.',
    status: 'In Process',
    action_tag: 'Waiting on Customer',
    created_at: daysAgo(3, 9, 0)
  },
  {
    id: '9',
    business_id: 'demo',
    customer_name: 'Steve Marsh',
    customer_phone: '07700 112 233',
    customer_email: 'steve.marsh@btinternet.com',
    postcode: 'WA14 2QR',
    town: 'Altrincham',
    source: 'Missed Call',
    service_requested: 'Roof repair',
    job_description: 'Valley gutter repair. Constant drip into bedroom during rain.',
    status: 'Booked',
    action_tag: 'Visit Booked',
    created_at: daysAgo(4, 15, 45)
  },
  {
    id: '10',
    business_id: 'demo',
    customer_name: 'Emma Clarke',
    customer_phone: '07488 334 556',
    customer_email: 'emma.c@gmail.com',
    postcode: 'M19 2FH',
    town: 'Levenshulme',
    source: 'Website Form',
    service_requested: 'Flat roof',
    job_description: 'Extension flat roof — fibreglass or EPDM. Needs before winter.',
    status: 'In Process',
    action_tag: 'Contacted',
    created_at: daysAgo(5, 13, 20)
  },
  {
    id: '11',
    business_id: 'demo',
    customer_name: 'Paul Naylor',
    customer_phone: '07333 445 667',
    customer_email: 'paul.n@yahoo.com',
    postcode: 'SK6 7DS',
    town: 'Marple',
    source: 'MyBuilder',
    service_requested: 'Guttering',
    job_description: 'New cast iron guttering on period property. Heritage style.',
    status: 'Booked',
    action_tag: 'Quote Accepted',
    created_at: daysAgo(6, 8, 50)
  },
  {
    id: '12',
    business_id: 'demo',
    customer_name: 'Diane Patel',
    customer_phone: '07622 778 990',
    customer_email: 'diane.p@gmail.com',
    postcode: 'M33 4TH',
    town: 'Sale',
    source: 'Text',
    service_requested: 'Roof inspection',
    job_description: 'Buying a house, needs roof survey before exchange. Urgent timeline.',
    urgency: 'ASAP',
    status: 'Needs Action',
    action_tag: 'Review Details',
    created_at: daysAgo(8, 17, 10)
  }
]

export const DEMO_STATS = {
  total_enquiries: 12,
  needs_action_count: 4,
  in_process_count: 5,
  booked_count: 3,
  archived_count: 0
}
