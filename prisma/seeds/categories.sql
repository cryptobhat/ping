-- Kalaloka Categories — Pratilipi-style Kannada genres
-- Run: cat prisma/seeds/categories.sql | docker exec -i kalaloka-postgres psql -U kalaloka -d kalaloka

INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
(gen_random_uuid(), 'ಪ್ರೀತಿ', 'romance', 'Romance stories', 1, true),
(gen_random_uuid(), 'ಸಮಗ್ರ', 'novels', 'Complete novels', 2, true),
(gen_random_uuid(), 'ಪೌರಾಣಿಕ ಕಥನ', 'mythology', 'Mythology', 3, true),
(gen_random_uuid(), 'ನಿಗೂಢ', 'suspense', 'Suspense & thriller', 4, true),
(gen_random_uuid(), 'ಹಾರರ್', 'horror', 'Horror stories', 5, true),
(gen_random_uuid(), 'ಮಹಿಳೆ', 'women', 'Women centric stories', 6, true),
(gen_random_uuid(), 'ಕಿರುಗಥೆಗಳು', 'short-stories', 'Short stories', 7, true),
(gen_random_uuid(), 'ಅನುಭವಗಳು', 'experiences', 'Real experiences', 8, true),
(gen_random_uuid(), 'ಸ್ಫೂರ್ತಿದಾಯಕ', 'inspirational', 'Inspirational stories', 9, true),
(gen_random_uuid(), 'ಕೌಟುಂಬಿಕ', 'family', 'Family & life', 10, true),
(gen_random_uuid(), 'ಬಂಧುತ್ವ', 'relationships', 'Relationship stories', 11, true),
(gen_random_uuid(), 'ಬಾಲಸಾಹಿತ್ಯ', 'children', 'Children literature', 12, true),
(gen_random_uuid(), 'ಸಮಾಜ', 'society', 'Social stories', 13, true),
(gen_random_uuid(), 'ಧಾರ್ಮಿಕ/ಆಧ್ಯಾತ್ಮ', 'spiritual', 'Religious & spiritual', 14, true),
(gen_random_uuid(), 'ಹಾಸ್ಯ', 'comedy', 'Comedy & humor', 15, true)
ON CONFLICT (slug) DO NOTHING;
