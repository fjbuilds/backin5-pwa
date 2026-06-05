-- ============================================================
-- BackIn5 — promote raw_payload fields to real columns
-- Run this in Supabase SQL Editor against the EXISTING v1 schema.
-- Safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================

ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS town text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS urgency text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS preferred_contact_time text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS custom_answers jsonb;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_intent text;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS booking_requested boolean DEFAULT false;
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS booking_type text;

-- Backfill existing rows from raw_payload
UPDATE enquiries
SET
  town                   = COALESCE(town,                   raw_payload->>'town'),
  urgency                = COALESCE(urgency,                raw_payload->>'urgency'),
  preferred_contact_time = COALESCE(preferred_contact_time, raw_payload->>'preferred_contact_time'),
  custom_answers         = COALESCE(custom_answers,         raw_payload->'custom_answers'),
  enquiry_intent         = COALESCE(enquiry_intent,         raw_payload->>'enquiry_intent'),
  booking_requested      = COALESCE(booking_requested,      (raw_payload->>'booking_requested')::boolean),
  booking_type           = COALESCE(booking_type,           raw_payload->>'booking_type')
WHERE raw_payload IS NOT NULL;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_town    ON enquiries (town);
CREATE INDEX IF NOT EXISTS idx_enquiries_urgency ON enquiries (urgency);

-- Verify
-- SELECT id, customer_name, town, urgency, preferred_contact_time, custom_answers, enquiry_intent
-- FROM enquiries
-- ORDER BY created_at DESC
-- LIMIT 5;
