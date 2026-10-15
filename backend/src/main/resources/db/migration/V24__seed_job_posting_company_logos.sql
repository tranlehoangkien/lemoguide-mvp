-- =====================================================================
-- V24__seed_job_posting_company_logos.sql
-- Backfills company_logo_url for the 100 fake job postings seeded by
-- V22__seed_job_postings.sql. Those companies are fictional, so there
-- are no real logo assets - instead this generates a deterministic
-- "initials" avatar per company via the DiceBear HTTP API
-- (https://www.dicebear.com/styles/initials/), the same seed always
-- produces the same image, so re-running this migration (or re-seeding
-- more jobs for an existing company_name) stays visually consistent.
--
-- The background palette is restricted to colors already used
-- elsewhere in the UI (green/blue/purple/amber accents), so the
-- generated logos read as part of the LemoGuide design system instead
-- of clashing rainbow colors.
-- =====================================================================

SET NAMES utf8mb4;

UPDATE job_posting
SET company_logo_url = CONCAT(
    'https://api.dicebear.com/9.x/initials/svg?seed=',
    REPLACE(REPLACE(company_name, ' ', '%20'), '.', '%2E'),
    '&backgroundColor=15803d,0284c7,7c3aed,f59e0b,0ea5e9,dc2626,059669,ea580c',
    '&fontSize=42'
)
WHERE source = 'seed_fake'
  AND company_logo_url IS NULL;

-- =====================================================================
-- End of V24__seed_job_posting_company_logos.sql
-- =====================================================================
