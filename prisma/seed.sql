-- Readrr Seed Data for UI Testing
-- Run: psql -U postgres -d content_platform -f prisma/seed.sql

-- ============================================================
-- USERS (5 writers + 1 test user)
-- ============================================================

INSERT INTO users (id, phone, email, username, name, bio, "profileImage", location, "isVerified", "isPremium", "isCreator", "coinsBalance", "pensBalance", language, role, "createdAt", "updatedAt") VALUES
('u1', '+919876543210', 'test@readrr.app', 'testuser', 'Test User', 'Just a reader who loves stories', NULL, 'Mumbai', false, false, false, 100, 20, 'hi', 'USER', NOW(), NOW()),
('u2', '+919876543211', NULL, 'priya_writes', 'Priya Sharma', 'Hindi storyteller | Romantic fiction | Follow for daily stories', NULL, 'Delhi', true, true, true, 500, 100, 'hi', 'USER', NOW() - INTERVAL '60 days', NOW()),
('u3', '+919876543212', NULL, 'kavya_kn', 'Kavya Rao', 'Kannada poet & writer | Stories from Karnataka', NULL, 'Bangalore', true, false, true, 300, 50, 'kn', 'USER', NOW() - INTERVAL '45 days', NOW()),
('u4', '+919876543213', NULL, 'ankit_stories', 'Ankit Verma', 'Thriller & horror writer | Your nightmares, my stories', NULL, 'Lucknow', false, false, true, 200, 30, 'hi', 'USER', NOW() - INTERVAL '30 days', NOW()),
('u5', '+919876543214', NULL, 'meera_pen', 'Meera Nair', 'Poems that heal | Malayalam + Hindi | Writer at heart', NULL, 'Kochi', true, true, true, 800, 200, 'ml', 'USER', NOW() - INTERVAL '90 days', NOW()),
('u6', '+919876543215', NULL, 'rahul_reads', 'Rahul Desai', 'Articles on life, tech & culture | Weekend writer', NULL, 'Pune', false, false, true, 150, 25, 'en', 'USER', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CATEGORIES
-- ============================================================

INSERT INTO categories (id, name, slug, description, "sortOrder", "isActive", "createdAt") VALUES
('cat1', 'Romance', 'romance', 'Love stories and romantic fiction', 1, true, NOW()),
('cat2', 'Thriller', 'thriller', 'Suspense and thriller stories', 2, true, NOW()),
('cat3', 'Horror', 'horror', 'Horror and supernatural tales', 3, true, NOW()),
('cat4', 'Fantasy', 'fantasy', 'Fantasy and magical stories', 4, true, NOW()),
('cat5', 'Humor', 'humor', 'Comedy and humorous writing', 5, true, NOW()),
('cat6', 'Motivation', 'motivation', 'Motivational and self-help content', 6, true, NOW()),
('cat7', 'Life', 'life', 'Real life stories and experiences', 7, true, NOW()),
('cat8', 'Spiritual', 'spiritual', 'Spiritual and philosophical writing', 8, true, NOW()),
('cat9', 'Poetry', 'poetry', 'All forms of poetry', 9, true, NOW()),
('cat10', 'Travel', 'travel', 'Travel stories and experiences', 10, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONTENT (20+ items across Story, Poem, Article)
-- ============================================================

INSERT INTO content (id, "authorId", title, body, description, "contentType", "categoryId", visibility, language, "isDraft", "publishedAt", "readTime", "viewCount", "likeCount", "commentCount", "bookmarkCount", "isFeatured", "isPremium", "createdAt", "updatedAt") VALUES
-- Priya's Stories (Hindi)
('c1', 'u2', 'बारिश का वो दिन', 'बारिश की बूँदें खिड़की पर टप-टप गिर रही थीं। मैं अपनी चाय का कप पकड़े, उस पुरानी किताब की तरह खुली खिड़की से बाहर देख रहा था। तभी उसने दरवाज़ा खटखटाया — वो लड़की जो पिछले साल इसी बारिश में मिली थी।

"तुम यहाँ?" मैंने हैरानी से पूछा।
"बारिश में भीगते हुए तुम्हें ढूंढ रही थी," उसने मुस्कुराते हुए कहा।

और फिर वो शाम, वो चाय, वो बातें — सब कुछ उसी पुरानी किताब के पन्नों की तरह खुलता गया। कुछ कहानियाँ बारिश में शुरू होती हैं और दिल में बस जाती हैं।', 'बारिश में शुरू हुई एक प्यार भरी कहानी', 'STORY', 'cat1', 'PUBLIC', 'hi', false, NOW() - INTERVAL '5 days', 4, 1250, 89, 12, 23, true, false, NOW() - INTERVAL '5 days', NOW()),

('c2', 'u2', 'चाय और तुम', 'हर सुबह जब चाय की पहली चुस्की लेता हूँ, तुम्हारी याद आती है। तुम कहती थी — "चाय बनाना एक कला है, और मैं तुम्हारी कलाकार हूँ।"

आज भी वो अदरक वाली चाय बनाता हूँ, तुम्हारे तरीके से। दो चम्मच चीनी, एक चुटकी इलायची, और ढेर सारा प्यार। पर स्वाद वही नहीं आता — शायद प्यार की कमी है।', 'चाय की खुशबू में छिपी यादें', 'STORY', 'cat1', 'PUBLIC', 'hi', false, NOW() - INTERVAL '3 days', 3, 890, 67, 8, 15, false, false, NOW() - INTERVAL '3 days', NOW()),

('c3', 'u2', 'रात की सच्चाई', 'अंधेरा छा गया था। गली में एक भी रोशनी नहीं थी। राहुल ने अपने फोन की टॉर्च जलाई और आगे बढ़ा। उसे बस पाँच मिनट चलना था — पर वो पाँच मिनट उसकी ज़िंदगी बदलने वाले थे।

पीछे से आवाज़ आई — "रुको।"

राहुल रुका। उसने पीछे मुड़कर देखा — वहाँ कोई नहीं था।', 'एक रात जिसने सब बदल दिया', 'STORY', 'cat2', 'PUBLIC', 'hi', false, NOW() - INTERVAL '7 days', 6, 2100, 134, 25, 45, true, false, NOW() - INTERVAL '7 days', NOW()),

-- Kavya's Kannada Content
('c4', 'u3', 'ಮಳೆಯ ಹಾಡು', 'ಮಳೆ ಬಂತು ಮಳೆ ಬಂತು\nಭೂಮಿಗೆ ತಂಪನ್ನು ತಂತು\nಮರಗಳು ನಲಿದವು\nಹೂವುಗಳು ಅರಳಿದವು\n\nಮಕ್ಕಳು ಕುಣಿದರು\nಹಕ್ಕಿಗಳು ಹಾಡಿದವು\nಮಳೆಯ ಸಂಗೀತದಲ್ಲಿ\nಎಲ್ಲರೂ ಮುಳುಗಿದರು', 'ಮಳೆಯ ಸೌಂದರ್ಯವನ್ನು ವರ್ಣಿಸುವ ಕವಿತೆ', 'POEM', 'cat9', 'PUBLIC', 'kn', false, NOW() - INTERVAL '4 days', 2, 650, 45, 6, 12, false, false, NOW() - INTERVAL '4 days', NOW()),

('c5', 'u3', 'ಬೆಂಗಳೂರಿನ ಕಥೆ', 'ಬೆಂಗಳೂರು — ಸಿಲಿಕಾನ್ ವ್ಯಾಲಿ ಎಂದು ಕರೆಯಲ್ಪಡುವ ಈ ನಗರ, ಒಂದು ಕಾಲದಲ್ಲಿ ಉದ್ಯಾನ ನಗರ ಆಗಿತ್ತು। ಈಗ ಟ್ರಾಫಿಕ್ ಜಾಮ್ ಮತ್ತು ಕಾಂಕ್ರೀಟ್ ಕಾಡುಗಳ ನಡುವೆ, ಹಳೆಯ ಬೆಂಗಳೂರಿನ ನೆನಪುಗಳು ಮಾಸಿ ಹೋಗುತ್ತಿವೆ.

ನಾನು ಈ ನಗರದಲ್ಲಿ ಹುಟ್ಟಿ ಬೆಳೆದೆ. ಮಲ್ಲೇಶ್ವರಂನ ಸಂಕಿ ಟ್ಯಾಂಕ್, ಲಾಲ್ಬಾಗ್‌ನ ಹೂ ತೋಟ, ಮತ್ತು ಬಸವನಗುಡಿಯ ಬುಲ್ ಟೆಂಪಲ್ — ಇವೆಲ್ಲ ನನ್ನ ಬಾಲ್ಯದ ಭಾಗ.', 'ಬೆಂಗಳೂರಿನ ಹಳೆಯ ನೆನಪುಗಳು', 'ARTICLE', 'cat7', 'PUBLIC', 'kn', false, NOW() - INTERVAL '2 days', 5, 430, 32, 5, 8, false, false, NOW() - INTERVAL '2 days', NOW()),

-- Ankit's Thriller Stories
('c6', 'u4', 'वो पुरानी हवेली', 'हवेली के दरवाज़े खुले थे — पर अंदर कोई नहीं था। राजीव ने अपने दोस्तों से कहा था कि वो एक रात यहाँ बिताएगा। अब वो दोस्त कहीं नज़र नहीं आ रहे थे।

"हैलो? कोई है?" उसकी आवाज़ दीवारों से टकराकर लौट आई।

तभी ऊपर से एक आवाज़ आई — बच्चों के हँसने की आवाज़। पर यहाँ कोई बच्चा नहीं था। यह हवेली 20 साल से बंद पड़ी थी।', 'एक रात, एक हवेली, और अनगिनत रहस्य', 'STORY', 'cat3', 'PUBLIC', 'hi', false, NOW() - INTERVAL '6 days', 8, 3200, 210, 45, 67, true, false, NOW() - INTERVAL '6 days', NOW()),

('c7', 'u4', 'आखिरी फोन कॉल', 'रात के 2 बजे फोन बजा। स्क्रीन पर नंबर दिख रहा था — मेरे पापा का। पर मेरे पापा तो 3 महीने पहले...

मैंने काँपते हाथों से फोन उठाया। "हैलो?"

"बेटा, दरवाज़ा खोलो। मैं बाहर खड़ा हूँ।"

मैंने खिड़की से बाहर झाँका — सड़क पर कोई नहीं था। पर दरवाज़े पर खटखट की आवाज़ आ रही थी।', 'जब मुर्दे फोन करें तो क्या करोगे?', 'STORY', 'cat3', 'PUBLIC', 'hi', false, NOW() - INTERVAL '8 days', 5, 4500, 312, 78, 95, true, true, NOW() - INTERVAL '8 days', NOW()),

-- Meera's Poems
('c8', 'u5', 'ज़िंदगी के रंग', 'ज़िंदगी के रंग निराले\nकभी खुशी के, कभी उदासी के\nकभी बारिश की बूँदों जैसे\nकभी धूप की किरणों जैसे\n\nहर रंग में एक कहानी है\nहर रंग में एक निशानी है\nज़िंदगी एक कैनवास है\nऔर हम सब रंग भरने वाले', 'ज़िंदगी के हर रंग पर एक कविता', 'POEM', 'cat9', 'PUBLIC', 'hi', false, NOW() - INTERVAL '1 day', 2, 780, 56, 9, 18, false, false, NOW() - INTERVAL '1 day', NOW()),

('c9', 'u5', 'माँ', 'माँ — वो शब्द\nजिसमें सारी दुनिया बसी है\nवो हाथ जो सिर पर रखती है\nवो दुआ जो दिल से निकलती है\n\nमाँ — वो छाँव\nजो धूप में भी ठंडक देती है\nवो मुस्कान\nजो हर दर्द भुला देती है\n\nमाँ — बस माँ\nइससे बड़ा कोई शब्द नहीं', 'माँ को समर्पित एक कविता', 'POEM', 'cat8', 'PUBLIC', 'hi', false, NOW() - INTERVAL '10 days', 1, 1890, 245, 34, 56, true, false, NOW() - INTERVAL '10 days', NOW()),

('c10', 'u5', 'The Art of Letting Go', 'We hold on too tight to things that were never meant to stay. People leave, seasons change, and life moves forward whether we like it or not.

The art of letting go is not about forgetting. It is about accepting that some chapters end so new ones can begin. It is about understanding that holding on to pain only multiplies it.

I learned this the hard way — through loss, through heartbreak, through the slow unraveling of things I thought were permanent.

But here is what no one tells you: the moment you truly let go, you feel lighter than you have ever felt. Like a bird released from a cage it didn''t even know it was in.', 'A reflection on releasing what no longer serves us', 'ARTICLE', 'cat6', 'PUBLIC', 'en', false, NOW() - INTERVAL '12 days', 4, 1200, 89, 15, 28, false, false, NOW() - INTERVAL '12 days', NOW()),

-- Rahul's Articles
('c11', 'u6', 'Why I Stopped Using Social Media', 'Six months ago, I deleted every social media app from my phone. Instagram, Twitter, Facebook — all gone. People thought I was crazy. "How will you stay connected?" they asked.

Here is what actually happened:

1. I started reading books again — finished 12 in 6 months
2. My anxiety reduced by what felt like 80%
3. I had actual conversations with people
4. I wrote more than I had in the previous 2 years combined

The FOMO disappeared within a week. Turns out, you are not missing much. The same memes, the same outrage, the same carefully curated highlight reels.

What you gain in return? Time. So much time.', 'My experiment with digital detox', 'ARTICLE', 'cat7', 'PUBLIC', 'en', false, NOW() - INTERVAL '4 days', 5, 2800, 178, 42, 55, true, false, NOW() - INTERVAL '4 days', NOW()),

('c12', 'u6', 'The Street Food Map of India', 'From Mumbai''s vada pav to Kolkata''s puchka, from Delhi''s chole bhature to Hyderabad''s biryani — India is a street food paradise. I spent 6 months traveling across 15 cities, eating my way through the country.

Here are my top 10 discoveries:

Every city has its own soul food. The kind that locals eat every day without thinking about it, but that blows a visitor''s mind. That is the beauty of Indian street food — it is honest, it is flavorful, and it tells you more about a city than any guidebook ever could.', 'A food lover''s guide to Indian street food', 'ARTICLE', 'cat10', 'PUBLIC', 'en', false, NOW() - INTERVAL '9 days', 7, 3400, 234, 56, 78, true, false, NOW() - INTERVAL '9 days', NOW()),

-- More Hindi stories
('c13', 'u2', 'पहला प्यार', 'स्कूल के वो दिन — जब सिर्फ़ एक नज़र काफ़ी थी दिल धड़काने के लिए। वो तीसरी बेंच पर बैठती थी, और मैं पीछे से उसे देखता रहता था।

एक दिन उसने मुड़कर मुस्कुराया — और मेरी दुनिया बदल गई।

बाद में पता चला, वो मुस्कान मेरे पीछे बैठे मेरे दोस्त के लिए थी। पर उस एक पल में, मैंने प्यार का मतलब समझ लिया था।', 'स्कूल के दिनों की एक मासूम कहानी', 'STORY', 'cat1', 'PUBLIC', 'hi', false, NOW() - INTERVAL '15 days', 3, 920, 78, 11, 19, false, false, NOW() - INTERVAL '15 days', NOW()),

('c14', 'u4', 'अंधेरे में कौन', 'पावर कट हो गया। पूरा मोहल्ला अंधेरे में डूब गया। मैंने मोमबत्ती जलाई और किचन की तरफ़ बढ़ा।

फ़्रिज से पानी की बोतल निकालते वक्त मुझे लगा कि कोई मेरे पीछे खड़ा है। मैंने पीछे मुड़कर देखा — कोई नहीं था।

पर मोमबत्ती की रोशनी में, फ़र्श पर दो परछाइयाँ दिख रही थीं — एक मेरी, और एक...', 'डर का एक नया अनुभव', 'STORY', 'cat3', 'PUBLIC', 'hi', false, NOW() - INTERVAL '11 days', 4, 1800, 145, 28, 35, false, false, NOW() - INTERVAL '11 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SERIES
-- ============================================================

INSERT INTO series (id, "authorId", title, description, language, "categoryId", status, visibility, "isPremium", "followerCount", "contentCount", "viewCount", "createdAt", "updatedAt") VALUES
('s1', 'u2', 'दिल की कहानियाँ', 'प्यार, दर्द, और उम्मीद — हर कहानी दिल से निकली है। एक सीरीज़ जो आपको अपनी कहानी याद दिला दे।', 'hi', 'cat1', 'ONGOING', 'PUBLIC', false, 45, 3, 2800, NOW() - INTERVAL '15 days', NOW()),
('s2', 'u4', 'डरावनी रातें', 'हर रात एक नई कहानी। हर कहानी एक नया डर। सोने से पहले पढ़ें — अगर हिम्मत हो तो।', 'hi', 'cat3', 'ONGOING', 'PUBLIC', false, 78, 3, 8500, NOW() - INTERVAL '12 days', NOW()),
('s3', 'u5', 'कविता संग्रह', 'ज़िंदगी, प्यार, और माँ — तीन विषय जो कभी पुराने नहीं होते।', 'hi', 'cat9', 'COMPLETED', 'PUBLIC', false, 120, 2, 3200, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SERIES ITEMS (link content to series)
-- ============================================================

INSERT INTO series_items (id, "seriesId", "contentId", "sortOrder", "addedAt") VALUES
('si1', 's1', 'c1', 0, NOW() - INTERVAL '5 days'),
('si2', 's1', 'c2', 1, NOW() - INTERVAL '3 days'),
('si3', 's1', 'c13', 2, NOW() - INTERVAL '15 days'),
('si4', 's2', 'c6', 0, NOW() - INTERVAL '6 days'),
('si5', 's2', 'c7', 1, NOW() - INTERVAL '8 days'),
('si6', 's2', 'c14', 2, NOW() - INTERVAL '11 days'),
('si7', 's3', 'c8', 0, NOW() - INTERVAL '1 day'),
('si8', 's3', 'c9', 1, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- FOLLOWS
-- ============================================================

INSERT INTO follows (id, "followerId", "followingId", "createdAt") VALUES
('f1', 'u1', 'u2', NOW() - INTERVAL '10 days'),
('f2', 'u1', 'u3', NOW() - INTERVAL '8 days'),
('f3', 'u1', 'u5', NOW() - INTERVAL '5 days'),
('f4', 'u2', 'u5', NOW() - INTERVAL '20 days'),
('f5', 'u3', 'u2', NOW() - INTERVAL '15 days'),
('f6', 'u4', 'u2', NOW() - INTERVAL '12 days'),
('f7', 'u5', 'u3', NOW() - INTERVAL '25 days'),
('f8', 'u6', 'u2', NOW() - INTERVAL '7 days'),
('f9', 'u6', 'u4', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LIKES
-- ============================================================

INSERT INTO likes (id, "userId", "contentId", "createdAt") VALUES
('l1', 'u1', 'c1', NOW() - INTERVAL '4 days'),
('l2', 'u1', 'c6', NOW() - INTERVAL '3 days'),
('l3', 'u1', 'c9', NOW() - INTERVAL '2 days'),
('l4', 'u3', 'c1', NOW() - INTERVAL '5 days'),
('l5', 'u4', 'c9', NOW() - INTERVAL '1 day'),
('l6', 'u5', 'c6', NOW() - INTERVAL '6 days'),
('l7', 'u6', 'c7', NOW() - INTERVAL '3 days')
ON CONFLICT ("userId", "contentId") DO NOTHING;

-- ============================================================
-- BOOKMARKS
-- ============================================================

INSERT INTO bookmarks (id, "userId", "contentId", "collectionName", "createdAt") VALUES
('b1', 'u1', 'c1', 'Favorites', NOW() - INTERVAL '4 days'),
('b2', 'u1', 'c6', 'Read Later', NOW() - INTERVAL '3 days'),
('b3', 'u1', 'c9', 'Favorites', NOW() - INTERVAL '2 days'),
('b4', 'u1', 'c11', 'Read Later', NOW() - INTERVAL '1 day'),
('b5', 'u1', 'c12', NULL, NOW())
ON CONFLICT ("userId", "contentId") DO NOTHING;

-- ============================================================
-- GIFTS
-- ============================================================

INSERT INTO gifts (id, name, description, "penValue", "imageUrl", "isActive", "sortOrder") VALUES
('g1', 'Clap', 'A round of applause!', 1, 'https://em-content.zobj.net/source/apple/391/clapping-hands_1f44f.png', true, 1),
('g2', 'Rose', 'A beautiful rose for the writer', 3, 'https://em-content.zobj.net/source/apple/391/rose_1f339.png', true, 2),
('g3', 'Coffee', 'Buy them a chai', 5, 'https://em-content.zobj.net/source/apple/391/hot-beverage_2615.png', true, 3),
('g4', 'Star', 'You''re a star!', 10, 'https://em-content.zobj.net/source/apple/391/glowing-star_1f31f.png', true, 4),
('g5', 'Heart', 'From the heart', 15, 'https://em-content.zobj.net/source/apple/391/sparkling-heart_1f496.png', true, 5),
('g6', 'Bookmark', 'Worth saving', 20, 'https://em-content.zobj.net/source/apple/391/bookmark_1f516.png', true, 6),
('g7', 'Fire', 'This is fire!', 25, 'https://em-content.zobj.net/source/apple/391/fire_1f525.png', true, 7),
('g8', 'Crown', 'You deserve a crown', 35, 'https://em-content.zobj.net/source/apple/391/crown_1f451.png', true, 8),
('g9', 'Rocket', 'To the moon!', 50, 'https://em-content.zobj.net/source/apple/391/rocket_1f680.png', true, 9),
('g10', 'Trophy', 'Champion writer!', 75, 'https://em-content.zobj.net/source/apple/391/trophy_1f3c6.png', true, 10),
('g11', 'Diamond', 'A gem of a writer', 100, 'https://em-content.zobj.net/source/apple/391/gem-stone_1f48e.png', true, 11)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================

INSERT INTO subscription_plans (id, name, description, price, "durationDays", features, "isActive", "displayOrder") VALUES
('plan1', 'Monthly', 'Perfect to try Premium', 25.00, 30, '["Ad-free reading", "Premium badge", "Custom themes"]', true, 1),
('plan2', 'Quarterly', 'Save 13% vs monthly', 65.00, 90, '["Ad-free reading", "Premium badge", "Custom themes", "Offline reading"]', true, 2),
('plan3', 'Yearly', 'Best value — save 34%', 199.00, 365, '["Ad-free reading", "Premium badge", "Custom themes", "Offline reading", "Priority support", "Early access"]', true, 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- HASHTAGS
-- ============================================================

INSERT INTO hashtags (id, tag, count, "isTrending", "createdAt") VALUES
('h1', 'HindiStory', 45, true, NOW()),
('h2', 'Kavita', 38, true, NOW()),
('h3', 'Love', 120, true, NOW()),
('h4', 'Horror', 67, true, NOW()),
('h5', 'Motivation', 89, true, NOW()),
('h6', 'Poetry', 56, true, NOW()),
('h7', 'Bangalore', 23, false, NOW()),
('h8', 'MaaKiKahani', 34, true, NOW()),
('h9', 'DigitalDetox', 18, false, NOW()),
('h10', 'StreetFood', 29, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LANGUAGES (if not already seeded)
-- ============================================================

INSERT INTO languages (id, code, name, "nativeName", "isActive", "isDefault", "createdAt") VALUES
('lang1', 'hi', 'Hindi', 'हिंदी', true, true, NOW()),
('lang2', 'kn', 'Kannada', 'ಕನ್ನಡ', true, false, NOW()),
('lang3', 'en', 'English', 'English', true, false, NOW()),
('lang4', 'ta', 'Tamil', 'தமிழ்', true, false, NOW()),
('lang5', 'te', 'Telugu', 'తెలుగు', true, false, NOW()),
('lang6', 'mr', 'Marathi', 'मराठी', true, false, NOW()),
('lang7', 'ml', 'Malayalam', 'മലയാളം', true, false, NOW()),
('lang8', 'bn', 'Bengali', 'বাংলা', true, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- OTP for test user (dev mode) - OTP: 123456
-- ============================================================

INSERT INTO otp_verifications (id, phone, otp, type, "expiresAt", "isUsed", "userId", "createdAt") VALUES
('otp1', '+919876543210', '123456', 'LOGIN', NOW() + INTERVAL '5 minutes', false, 'u1', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMPETITIONS
-- ============================================================

INSERT INTO competitions (id, title, description, rules, "contentType", theme, "prizePool", "prizeFirst", "prizeSecond", "prizeThird", status, "startDate", "endDate", "participantCount", "isActive", "createdAt", "updatedAt") VALUES
('comp1', 'Monsoon Story Challenge', 'Baarish ki kahaniyaan likhein! Write your best monsoon story and win exciting prizes. Stories with most reads and likes win.', 'Story must be original. Minimum 500 words. Written in Hindi or English. One entry per person. No plagiarism.', 'STORY', 'Monsoon / Baarish', 5000.00, 2500.00, 1500.00, 1000.00, 'ACTIVE', NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 12, true, NOW(), NOW()),
('comp2', 'Kavita Ka Rang — Poetry Festival', 'Hindi kavita ka sabse bada competition! Write poems on any theme. Sabse zyada padhi jaane wali kavita jeetegi.', 'Poem must be in Hindi. Minimum 4 lines. Original work only.', 'POEM', 'Any Theme', 3000.00, 1500.00, 1000.00, 500.00, 'ACTIVE', NOW() - INTERVAL '3 days', NOW() + INTERVAL '18 days', 8, true, NOW(), NOW()),
('comp3', 'Horror Nights', 'Darawni kahaniyaan likhein jo sabko daraye! Scariest story with most engagement wins.', 'Horror/thriller genre only. Minimum 300 words. Hindi or English.', 'STORY', 'Horror / Darr', 2000.00, 1000.00, 600.00, 400.00, 'UPCOMING', NOW() + INTERVAL '10 days', NOW() + INTERVAL '40 days', 0, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add some competition entries for comp1
INSERT INTO competition_entries (id, "competitionId", "userId", "contentId", "readCount", "likeCount", score, rank, "submittedAt") VALUES
('ce1', 'comp1', 'u2', 'c1', 1250, 89, 1695, 1, NOW() - INTERVAL '3 days'),
('ce2', 'comp1', 'u4', 'c6', 3200, 210, 4250, 2, NOW() - INTERVAL '4 days'),
('ce3', 'comp1', 'u5', 'c10', 1200, 89, 1645, 3, NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
