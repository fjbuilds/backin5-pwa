-- ============================================================
-- BackIn5 — Full schema (fresh start)
-- Run this in Supabase SQL Editor as a single query.
-- ============================================================

-- 0. Drop old objects
-- ----------------------------------------------------------
DROP VIEW  IF EXISTS client_stats       CASCADE;
DROP TABLE IF EXISTS enquiries          CASCADE;
DROP TABLE IF EXISTS trade_settings     CASCADE;
DROP TABLE IF EXISTS clients            CASCADE;
DROP TABLE IF EXISTS trades             CASCADE;
DROP TABLE IF EXISTS automation_logs    CASCADE;
DROP TABLE IF EXISTS audit_history      CASCADE;


-- ============================================================
-- 1. trades  (one row per trade business)
-- ============================================================
CREATE TABLE trades (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name   text NOT NULL,
  contact_name    text,
  contact_mobile  text,
  contact_email   text,
  twilio_number   text,
  tier            text NOT NULL DEFAULT 'Tier 1'
                    CHECK (tier IN ('Tier 1', 'Tier 2')),
  status          text NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Paused', 'Cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trades: users see own row"
  ON trades FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Trades: users update own row"
  ON trades FOR UPDATE
  USING (id = auth.uid());


-- ============================================================
-- 2. trade_settings  (one row per trade)
-- ============================================================
CREATE TABLE trade_settings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id          uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  allowed_postcodes text[] DEFAULT '{}',
  allowed_towns     text[] DEFAULT '{}',
  services_offered  text[] DEFAULT '{}',
  sms_enabled       boolean NOT NULL DEFAULT false,
  sms_template      text,
  created_at        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (trade_id)
);

ALTER TABLE trade_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings: users see own"
  ON trade_settings FOR SELECT
  USING (trade_id = auth.uid());

CREATE POLICY "Settings: users update own"
  ON trade_settings FOR UPDATE
  USING (trade_id = auth.uid());


-- ============================================================
-- 3. enquiries  (the main dashboard table)
-- ============================================================
CREATE TABLE enquiries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id              uuid NOT NULL REFERENCES trades(id) ON DELETE CASCADE,

  -- Customer info
  customer_name         text,
  phone                 text,
  email                 text,
  postcode              text,
  area                  text,
  address               text,

  -- Source & channel
  source                text NOT NULL
                          CHECK (source IN (
                            'Website Form', 'Website Widget', 'Missed Call',
                            'Text', 'Trade Site', 'Email'
                          )),
  platform              text,

  -- Job info
  service_requested     text,
  job_description       text,

  -- Status system (3-tier)
  status                text NOT NULL DEFAULT 'Needs Action'
                          CHECK (status IN (
                            'Needs Action', 'In Process', 'Booked', 'Archived'
                          )),
  action_tag            text
                          CHECK (action_tag IS NULL OR action_tag IN (
                            'Call Back', 'Reply Required', 'Quote Required',
                            'Visit Required', 'Review Details'
                          )),
  process_tag           text
                          CHECK (process_tag IS NULL OR process_tag IN (
                            'Contacted', 'Waiting on Customer', 'Quote Sent',
                            'Appointment Agreed', 'Awaiting Booking Confirmation'
                          )),
  booked_tag            text
                          CHECK (booked_tag IS NULL OR booked_tag IN (
                            'Job Booked', 'Callback Booked',
                            'Visit Booked', 'Quote Accepted'
                          )),

  -- Workflow
  next_action           text,
  internal_notes        text,
  received_at           timestamptz NOT NULL DEFAULT now(),
  booked_callback_time  timestamptz,
  booked_visit_time     timestamptz,
  quote_details         text,

  -- Automation
  auto_text_status      text,
  suitability           text,
  duplicate_status      text,
  original_email_body   text,
  raw_payload           jsonb,

  -- Lifecycle
  archived_at           timestamptz,
  delete_after          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enquiries: users see own"
  ON enquiries FOR SELECT
  USING (trade_id = auth.uid());

CREATE POLICY "Enquiries: users update own"
  ON enquiries FOR UPDATE
  USING (trade_id = auth.uid());

-- Make.com uses service_role key which bypasses RLS for inserts.
-- If you also want the PWA to insert (unlikely), add an INSERT policy.

CREATE INDEX idx_enquiries_trade_id    ON enquiries (trade_id);
CREATE INDEX idx_enquiries_status      ON enquiries (status);
CREATE INDEX idx_enquiries_received_at ON enquiries (received_at DESC);
CREATE INDEX idx_enquiries_source      ON enquiries (source);
CREATE INDEX idx_enquiries_archived    ON enquiries (archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX idx_enquiries_delete      ON enquiries (delete_after) WHERE delete_after IS NOT NULL;


-- ============================================================
-- 4. automation_logs  (Make.com error logging)
-- ============================================================
CREATE TABLE automation_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id            uuid REFERENCES trades(id) ON DELETE SET NULL,
  scenario_name       text NOT NULL,
  status              text NOT NULL DEFAULT 'success'
                        CHECK (status IN ('success', 'failed', 'needs review')),
  error_message       text,
  raw_payload         jsonb,
  related_enquiry_id  uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  retry_count         integer NOT NULL DEFAULT 0,
  resolved            boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logs: users see own"
  ON automation_logs FOR SELECT
  USING (trade_id = auth.uid());

CREATE INDEX idx_logs_trade     ON automation_logs (trade_id);
CREATE INDEX idx_logs_status    ON automation_logs (status) WHERE status != 'success';
CREATE INDEX idx_logs_unresolved ON automation_logs (resolved) WHERE resolved = false;


-- ============================================================
-- 5. audit_history  (change log per enquiry)
-- ============================================================
CREATE TABLE audit_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id    uuid REFERENCES trades(id) ON DELETE SET NULL,
  enquiry_id  uuid REFERENCES enquiries(id) ON DELETE SET NULL,
  event_type  text NOT NULL,
  old_status  text,
  new_status  text,
  old_tag     text,
  new_tag     text,
  details     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit: users see own"
  ON audit_history FOR SELECT
  USING (trade_id = auth.uid());

CREATE INDEX idx_audit_enquiry ON audit_history (enquiry_id);
CREATE INDEX idx_audit_trade   ON audit_history (trade_id);


-- ============================================================
-- 6. Dashboard stats view  (replaces old client_stats)
-- ============================================================
CREATE OR REPLACE VIEW trade_stats AS
SELECT
  e.trade_id,
  COUNT(*)                                                    AS total_enquiries,
  COUNT(*) FILTER (WHERE e.status = 'Needs Action')          AS needs_action_count,
  COUNT(*) FILTER (WHERE e.status = 'In Process')            AS in_process_count,
  COUNT(*) FILTER (WHERE e.status = 'Booked')                AS booked_count,
  COUNT(*) FILTER (WHERE e.status = 'Archived')              AS archived_count,
  COUNT(*) FILTER (WHERE e.source = 'Missed Call')           AS missed_call_count,
  COUNT(*) FILTER (WHERE e.source = 'Website Form'
                      OR e.source = 'Website Widget')        AS website_count,
  COUNT(*) FILTER (WHERE e.source = 'Email')                 AS email_count,
  COUNT(*) FILTER (WHERE e.source = 'Trade Site')            AS trade_site_count
FROM enquiries e
WHERE e.archived_at IS NULL
GROUP BY e.trade_id;


-- ============================================================
-- 7. Seed data (your test user)
-- ============================================================
-- IMPORTANT: Replace the UUID below with your actual auth.uid()
-- from Supabase > Authentication > Users.
-- Currently set to: 681cdda1-9e2d-47f4-ad31-638d42be03f5

INSERT INTO trades (id, business_name, contact_name, contact_mobile, contact_email, tier, status)
VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
  'BackIn5',
  'Fartash Juenda',
  '07476170853',
  'fj@backin5.org',
  'Tier 1',
  'Active'
);

INSERT INTO trade_settings (trade_id, allowed_postcodes, allowed_towns, services_offered, sms_enabled)
VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
  ARRAY['M', 'SK', 'WA'],
  ARRAY['Manchester', 'Stockport'],
  ARRAY['Enquiry handling', 'Missed call response'],
  true
);

-- Sample enquiry so the dashboard isn't empty
INSERT INTO enquiries (
  trade_id, customer_name, phone, email, postcode, area,
  source, service_requested, job_description,
  status, action_tag, received_at
) VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
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
  now()
);


-- ============================================================
-- Done. Verify:
--   SELECT * FROM trades;
--   SELECT * FROM trade_settings;
--   SELECT * FROM enquiries;
--   SELECT * FROM trade_stats;
-- ============================================================
