-- ============================================================
-- BackIn5 — Schema v2 (simplified fields)
-- Run this in Supabase SQL Editor as a single query.
-- ============================================================

-- 0. Drop old objects
DROP VIEW  IF EXISTS trade_stats       CASCADE;
DROP VIEW  IF EXISTS business_stats    CASCADE;
DROP TABLE IF EXISTS audit_history     CASCADE;
DROP TABLE IF EXISTS automation_logs   CASCADE;
DROP TABLE IF EXISTS enquiries         CASCADE;
DROP TABLE IF EXISTS trade_settings    CASCADE;
DROP TABLE IF EXISTS trades            CASCADE;
DROP TABLE IF EXISTS businesses        CASCADE;


-- ============================================================
-- 1. businesses  (one row per trade business)
-- ============================================================
CREATE TABLE businesses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text NOT NULL,
  contact_name    text,
  contact_phone   text,
  contact_email   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Businesses: users see own row"
  ON businesses FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Businesses: users update own row"
  ON businesses FOR UPDATE
  USING (id = auth.uid());


-- ============================================================
-- 2. enquiries  (the main dashboard table)
-- ============================================================
CREATE TABLE enquiries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Business link
  business_id           uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_name         text,

  -- Customer info
  customer_name         text,
  customer_phone        text,
  customer_email        text,

  -- Job info
  service_requested     text,
  postcode              text,
  town                  text,
  job_description       text,
  urgency               text,

  -- Intent & status
  enquiry_intent        text,
  action_tag            text,
  status                text NOT NULL DEFAULT 'Needs Action',
  source                text,

  -- Media
  media_urls            text[],

  -- Custom questions (from website widget / forms)
  custom_question_1     text,
  custom_answer_1       text,
  custom_question_2     text,
  custom_answer_2       text,
  custom_question_3     text,
  custom_answer_3       text,

  -- Contact & booking
  preferred_contact_time text,
  booking_enabled       boolean NOT NULL DEFAULT false,
  booking_requested     boolean NOT NULL DEFAULT false,
  appointment_datetime  timestamptz,

  -- Automation
  notification_sent     boolean NOT NULL DEFAULT false,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enquiries: users see own"
  ON enquiries FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Enquiries: users update own"
  ON enquiries FOR UPDATE
  USING (business_id = auth.uid());

CREATE INDEX idx_enquiries_business    ON enquiries (business_id);
CREATE INDEX idx_enquiries_status      ON enquiries (status);
CREATE INDEX idx_enquiries_created_at  ON enquiries (created_at DESC);
CREATE INDEX idx_enquiries_source      ON enquiries (source);


-- ============================================================
-- 3. Dashboard stats view
-- ============================================================
CREATE OR REPLACE VIEW business_stats AS
SELECT
  e.business_id,
  COUNT(*)                                                    AS total_enquiries,
  COUNT(*) FILTER (WHERE e.status = 'Needs Action')          AS needs_action_count,
  COUNT(*) FILTER (WHERE e.status = 'In Process')            AS in_process_count,
  COUNT(*) FILTER (WHERE e.status = 'Booked')                AS booked_count,
  COUNT(*) FILTER (WHERE e.status = 'Archived')              AS archived_count
FROM enquiries e
GROUP BY e.business_id;


-- ============================================================
-- 4. Seed data
-- ============================================================
-- Replace UUID with your auth.uid() from Supabase > Authentication > Users
-- Currently: 681cdda1-9e2d-47f4-ad31-638d42be03f5

INSERT INTO businesses (id, business_name, contact_name, contact_phone, contact_email)
VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
  'BackIn5',
  'Fartash Juenda',
  '07476170853',
  'fj@backin5.org'
);

INSERT INTO enquiries (
  business_id, business_name, customer_name, customer_phone, customer_email,
  postcode, town, source, service_requested, job_description,
  status, action_tag, urgency
) VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
  'BackIn5',
  'James Patterson',
  '07411234567',
  'james.p@gmail.com',
  'SK4 2QP',
  'Stockport',
  'Missed Call',
  'Roof repair',
  'Leaking roof on single storey extension. Wants quote this week.',
  'Needs Action',
  'Call Back',
  'This week'
);


-- ============================================================
-- Done. Verify:
--   SELECT * FROM businesses;
--   SELECT * FROM enquiries;
--   SELECT * FROM business_stats;
-- ============================================================
