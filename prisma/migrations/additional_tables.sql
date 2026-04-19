-- Reading Tracking Tables

CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    words_read INTEGER DEFAULT 0,
    scroll_percentage INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_content ON reading_sessions(content_id);
CREATE INDEX idx_reading_sessions_created ON reading_sessions(created_at DESC);

-- Reading Stats (Aggregated)

CREATE TABLE reading_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_reading_time_seconds INTEGER DEFAULT 0,
    total_words_read INTEGER DEFAULT 0,
    total_content_read INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_read_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reading_stats_user ON reading_stats(user_id);

-- Daily Reading Log

CREATE TABLE daily_reading_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reading_time_seconds INTEGER DEFAULT 0,
    words_read INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_reading_user_date ON daily_reading_log(user_id, date);

-- Trending Content

CREATE TABLE trending_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    trending_score DECIMAL(10, 4) DEFAULT 0,
    view_velocity DECIMAL(10, 4) DEFAULT 0,
    engagement_rate DECIMAL(10, 4) DEFAULT 0,
    recency_factor DECIMAL(10, 4) DEFAULT 1,
    time_window VARCHAR(20) DEFAULT 'daily',
    rank_position INTEGER,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(content_id, time_window)
);

CREATE INDEX idx_trending_content_rank ON trending_content(time_window, rank_position);
CREATE INDEX idx_trending_content_expires ON trending_content(expires_at);

-- AI Content Analysis

CREATE TABLE content_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE UNIQUE,
    auto_tags TEXT[],
    sentiment_score DECIMAL(3, 2),
    sentiment_label VARCHAR(20),
    quality_score DECIMAL(5, 2),
    reading_level VARCHAR(20),
    keywords TEXT[],
    similar_content_ids UUID[],
    ai_trending_score DECIMAL(10, 4) DEFAULT 0,
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_version INTEGER DEFAULT 1
);

CREATE INDEX idx_content_analysis_tags ON content_analysis USING GIN(auto_tags);
CREATE INDEX idx_content_analysis_sentiment ON content_analysis(sentiment_label);

-- Content Recommendations

CREATE TABLE content_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50),
    relevance_score DECIMAL(5, 2),
    source_tags TEXT[],
    is_shown BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP WITH TIME ZONE,
    is_interacted BOOLEAN DEFAULT FALSE,
    interacted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id, recommendation_type)
);

CREATE INDEX idx_recommendations_user ON content_recommendations(user_id);
CREATE INDEX idx_recommendations_type ON content_recommendations(recommendation_type);

-- User Interests (AI-generated)

CREATE TABLE user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    interest_tags JSONB DEFAULT '[]',
    preferred_content_types JSONB DEFAULT '[]',
    preferred_authors UUID[] DEFAULT '{}',
    reading_time_preference VARCHAR(20),
    avg_session_duration_seconds INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_interests_user ON user_interests(user_id);

-- AI Processing Queue (for n8n integration)

CREATE TABLE ai_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    webhook_url TEXT,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_queue_status ON ai_processing_queue(status, created_at);

-- Notification Templates

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Notifications

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);