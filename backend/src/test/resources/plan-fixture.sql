INSERT INTO plan (id, name, price, billing_cycle, ai_credits_per_month, max_cvs, allow_premium_templates, is_active)
SELECT 1, 'Free', 0, 'monthly', 1000, NULL, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM plan WHERE id = 1);
