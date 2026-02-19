-- Migration: convert logs.details to jsonb safely
-- 1) Creates a backup table `logs_backup` (if not exists)
-- 2) Adds a temporary jsonb column `details_json`
-- 3) Iterates rows, attempting to cast existing `details` to jsonb; on failure stores the original text as JSON string
-- 4) Replaces old `details` column with `details_json`

BEGIN;

-- Backup (only if not already backed up)
CREATE TABLE IF NOT EXISTS logs_backup AS TABLE logs WITH NO DATA;
INSERT INTO logs_backup SELECT * FROM logs;

-- Add temporary jsonb column
ALTER TABLE logs ADD COLUMN IF NOT EXISTS details_json JSONB;

-- Convert row-by-row, safe casting
DO $$
DECLARE
  r RECORD;
  v_json JSONB;
BEGIN
  FOR r IN SELECT id, details FROM logs LOOP
    BEGIN
      IF r.details IS NULL THEN
        v_json := NULL;
      ELSE
        BEGIN
          -- try to cast to jsonb
          v_json := r.details::jsonb;
        EXCEPTION WHEN others THEN
          -- on failure, store as a JSON string value {"text": "..."}
          v_json := jsonb_build_object('text', r.details::text);
        END;
      END IF;
      UPDATE logs SET details_json = v_json WHERE id = r.id;
    END;
  END LOOP;
END$$;

-- Replace column
ALTER TABLE logs DROP COLUMN IF EXISTS details;
ALTER TABLE logs RENAME COLUMN details_json TO details;

-- Optional: create helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

COMMIT;

-- Notes:
--  - Run this migration with your DATABASE_URL using psql:
--      psql "$DATABASE_URL" -f migrations/convert_logs_to_jsonb.sql
--  - A full backup was created in `logs_backup` before conversion.
--  - If any row fails in an unexpected way, restore from `logs_backup`.
