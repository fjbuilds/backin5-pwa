-- ============================================================
-- v4 — Monthly report fields
-- Adds the minimum columns + trigger needed for the monthly report
-- Edge Function to produce accurate revenue, response-time and
-- conversion numbers. Safe to re-run.
-- ============================================================

-- 1) trades.default_deal_value
--    Used as the £ multiplier when computing "estimated revenue from
--    won jobs". Owen sets one value per trade firm. NULL = unknown.
ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS default_deal_value numeric(10, 2);

COMMENT ON COLUMN trades.default_deal_value IS
  'Average revenue per won job (£). Used by the monthly report to estimate revenue. Set per trade firm.';


-- 2) enquiries.first_actioned_at
--    Set the first time the enquiry leaves "Needs Action". Lets us
--    compute response time (received_at → first_actioned_at).
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS first_actioned_at timestamptz;

COMMENT ON COLUMN enquiries.first_actioned_at IS
  'Timestamp set the first time status moves away from Needs Action. Source of response-time metric.';


-- 3) enquiries.won_at + enquiries.won_value
--    Captures when a job was actually won and the agreed £ value.
--    won_at means it's counted in that month's revenue.
--    won_value falls back to trades.default_deal_value when NULL.
ALTER TABLE enquiries
  ADD COLUMN IF NOT EXISTS won_at timestamptz,
  ADD COLUMN IF NOT EXISTS won_value numeric(10, 2);

COMMENT ON COLUMN enquiries.won_at IS
  'Set when the job is marked as won. Drives revenue + conversion metrics in the monthly report.';
COMMENT ON COLUMN enquiries.won_value IS
  'Actual agreed value of the won job (£). NULL falls back to trades.default_deal_value.';


-- 4) Trigger to populate first_actioned_at automatically
CREATE OR REPLACE FUNCTION set_first_actioned_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> 'Needs Action'
     AND OLD.status = 'Needs Action'
     AND NEW.first_actioned_at IS NULL
  THEN
    NEW.first_actioned_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_first_actioned_at ON enquiries;
CREATE TRIGGER trg_set_first_actioned_at
  BEFORE UPDATE OF status ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION set_first_actioned_at();


-- 5) Trigger to populate won_at automatically when booked_tag = 'Quote Accepted'
--    Means existing dashboard behaviour Just Works — flagging a quote
--    as accepted records the win without extra UI.
CREATE OR REPLACE FUNCTION set_won_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booked_tag = 'Quote Accepted'
     AND (OLD.booked_tag IS DISTINCT FROM 'Quote Accepted')
     AND NEW.won_at IS NULL
  THEN
    NEW.won_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_won_at ON enquiries;
CREATE TRIGGER trg_set_won_at
  BEFORE UPDATE OF booked_tag ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION set_won_at();


-- 6) Indexes the report query will hit
CREATE INDEX IF NOT EXISTS idx_enquiries_received_month
  ON enquiries (trade_id, received_at);

CREATE INDEX IF NOT EXISTS idx_enquiries_won_month
  ON enquiries (trade_id, won_at)
  WHERE won_at IS NOT NULL;
