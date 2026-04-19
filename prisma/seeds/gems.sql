-- Seed default gems (gift items users can send to authors)
-- Only inserts if the gifts table is empty (no duplicates)
INSERT INTO gifts (id, name, icon_emoji, pen_value, sort_order, is_active)
SELECT gen_random_uuid(), 'Rose', '🌹', 10, 1, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1)
UNION ALL
SELECT gen_random_uuid(), 'Star', '⭐', 25, 2, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1)
UNION ALL
SELECT gen_random_uuid(), 'Diamond', '💎', 50, 3, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1)
UNION ALL
SELECT gen_random_uuid(), 'Crown', '👑', 100, 4, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1)
UNION ALL
SELECT gen_random_uuid(), 'Fire', '🔥', 250, 5, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1)
UNION ALL
SELECT gen_random_uuid(), 'Trophy', '🏆', 500, 6, true
WHERE NOT EXISTS (SELECT 1 FROM gifts LIMIT 1);
