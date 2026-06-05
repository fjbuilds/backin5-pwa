-- ============================================================
-- BackIn5 — business_settings table
-- Run this in Supabase SQL Editor as a single query.
-- Assumes businesses table from migration-v2.sql exists.
-- ============================================================

DROP TABLE IF EXISTS business_settings CASCADE;

CREATE TABLE business_settings (
  id                                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id                       uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Services & coverage
  services_offered                  text[] DEFAULT '{}',
  areas_covered                     text[] DEFAULT '{}',

  -- Website
  website_url                       text,
  website_platform                  text,
  website_install_route             text,
  website_install_contact_name      text,
  website_install_contact_email     text,

  -- Customer-facing messages
  opening_message                   text,
  confirmation_message              text,
  expected_reply_time               text,

  -- Custom question 1
  custom_question_1                 text,
  custom_question_1_type            text,
  custom_question_1_options         text[] DEFAULT '{}',
  custom_question_1_required        boolean NOT NULL DEFAULT false,

  -- Custom question 2
  custom_question_2                 text,
  custom_question_2_type            text,
  custom_question_2_options         text[] DEFAULT '{}',
  custom_question_2_required        boolean NOT NULL DEFAULT false,

  -- Custom question 3
  custom_question_3                 text,
  custom_question_3_type            text,
  custom_question_3_options         text[] DEFAULT '{}',
  custom_question_3_required        boolean NOT NULL DEFAULT false,

  -- Photo / video uploads
  photo_video_enabled               boolean NOT NULL DEFAULT false,
  photo_video_job_types             text[] DEFAULT '{}',

  -- Booking
  booking_enabled                   boolean NOT NULL DEFAULT false,
  booking_types                     text[] DEFAULT '{}',
  booking_system                    text,
  booking_link                      text,

  -- Missed call handling
  missed_call_enabled               boolean NOT NULL DEFAULT false,
  missed_call_message               text,

  -- Timestamps
  created_at                        timestamptz NOT NULL DEFAULT now(),
  updated_at                        timestamptz NOT NULL DEFAULT now(),

  UNIQUE (business_id)
);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS business_settings_updated_at ON business_settings;
CREATE TRIGGER business_settings_updated_at
  BEFORE UPDATE ON business_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings: users see own"
  ON business_settings FOR SELECT
  USING (business_id = auth.uid());

CREATE POLICY "Settings: users insert own"
  ON business_settings FOR INSERT
  WITH CHECK (business_id = auth.uid());

CREATE POLICY "Settings: users update own"
  ON business_settings FOR UPDATE
  USING (business_id = auth.uid());

CREATE INDEX idx_business_settings_business ON business_settings (business_id);


-- ============================================================
-- Seed row for the test user
-- ============================================================
INSERT INTO business_settings (
  business_id,
  services_offered,
  areas_covered,
  expected_reply_time,
  missed_call_enabled,
  missed_call_message
) VALUES (
  '681cdda1-9e2d-47f4-ad31-638d42be03f5',
  ARRAY[]::text[],
  ARRAY[]::text[],
  'Within 5 minutes',
  true,
  'Sorry we missed your call! We''ll get back to you within 5 minutes.'
)
ON CONFLICT (business_id) DO NOTHING;


-- ============================================================
-- Done. Verify:
--   SELECT * FROM business_settings;
-- ============================================================
