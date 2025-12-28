-- OneValue Delivery Intelligence Console
-- Schema V2: Health History, Alerts, Enhanced Features
-- Generated: 2024-12-26

-- =====================================================
-- TABLE: health_history
-- Historical snapshots of project health for trending
-- =====================================================
CREATE TABLE IF NOT EXISTS health_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES sow_contracts(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_health TEXT CHECK (overall_health IN ('Healthy', 'At Risk', 'Critical', 'Unknown')),
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    sentiment_score NUMERIC(3, 2),
    blocker_count INTEGER DEFAULT 0,
    action_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_health_history_project ON health_history(project_id);
CREATE INDEX IF NOT EXISTS idx_health_history_date ON health_history(snapshot_date DESC);

-- =====================================================
-- TABLE: alert_rules
-- Configurable alert conditions
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'health_change', 'blocker_threshold', 'sentiment_drop',
        'overdue_actions', 'no_activity', 'renewal_approaching'
    )),
    condition_config JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    is_active BOOLEAN DEFAULT TRUE,
    notify_email BOOLEAN DEFAULT TRUE,
    notify_in_app BOOLEAN DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default alert rules
INSERT INTO alert_rules (name, description, rule_type, condition_config, severity, created_by) VALUES
('Project Health Critical', 'Alert when project health changes to Critical', 'health_change', '{"target_health": "Critical"}', 'Critical', 'system'),
('Blocker Threshold', 'Alert when blockers exceed threshold', 'blocker_threshold', '{"threshold": 3}', 'High', 'system'),
('Sentiment Drop', 'Alert on significant sentiment decline', 'sentiment_drop', '{"drop_threshold": 0.3}', 'Medium', 'system'),
('Overdue Actions', 'Alert when actions become overdue', 'overdue_actions', '{"threshold": 5}', 'High', 'system'),
('No Activity', 'Alert when no project activity for days', 'no_activity', '{"days_threshold": 7}', 'Medium', 'system'),
('Renewal Approaching', 'Alert when contract renewal is near', 'renewal_approaching', '{"days_before": 30}', 'High', 'system')
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE: alert_notifications
-- Generated alerts/notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE SET NULL,
    project_id UUID REFERENCES sow_contracts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'dismissed', 'actioned')),
    metadata JSONB DEFAULT '{}',
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    dismissed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_project ON alert_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alert_notifications(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alert_notifications(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alert_notifications(triggered_at DESC) WHERE status = 'unread';

-- Enable RLS
ALTER TABLE health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allowlisted users can view health history" ON health_history;
CREATE POLICY "Allowlisted users can view health history"
    ON health_history FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can manage health history" ON health_history;
CREATE POLICY "Service role can manage health history"
    ON health_history FOR ALL
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Allowlisted users can view alert rules" ON alert_rules;
CREATE POLICY "Allowlisted users can view alert rules"
    ON alert_rules FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Admins can manage alert rules" ON alert_rules;
CREATE POLICY "Admins can manage alert rules"
    ON alert_rules FOR ALL
    USING (public.is_admin());

DROP POLICY IF EXISTS "Allowlisted users can view their alerts" ON alert_notifications;
CREATE POLICY "Allowlisted users can view their alerts"
    ON alert_notifications FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Allowlisted users can update alert status" ON alert_notifications;
CREATE POLICY "Allowlisted users can update alert status"
    ON alert_notifications FOR UPDATE
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can create alerts" ON alert_notifications;
CREATE POLICY "Service role can create alerts"
    ON alert_notifications FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================
-- FUNCTION: Record health snapshot
-- =====================================================
CREATE OR REPLACE FUNCTION record_health_snapshot(p_project_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO health_history (
        project_id, snapshot_date, overall_health, health_score,
        sentiment_score, blocker_count, action_count, message_count, ai_summary
    )
    SELECT
        p.id,
        CURRENT_DATE,
        m.overall_health,
        m.health_score,
        m.sentiment_trend,
        m.blocker_count,
        m.open_action_count,
        (SELECT COUNT(*) FROM delivery_intelligence WHERE project_id = p.id),
        m.ai_summary
    FROM sow_contracts p
    LEFT JOIN project_health_metrics m ON m.project_id = p.id
    WHERE p.id = p_project_id
    ON CONFLICT (project_id, snapshot_date)
    DO UPDATE SET
        overall_health = EXCLUDED.overall_health,
        health_score = EXCLUDED.health_score,
        sentiment_score = EXCLUDED.sentiment_score,
        blocker_count = EXCLUDED.blocker_count,
        action_count = EXCLUDED.action_count,
        message_count = EXCLUDED.message_count,
        ai_summary = EXCLUDED.ai_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Check and trigger alerts
-- =====================================================
CREATE OR REPLACE FUNCTION check_project_alerts(p_project_id UUID)
RETURNS void AS $$
DECLARE
    v_project RECORD;
    v_health RECORD;
    v_rule RECORD;
    v_prev_health TEXT;
BEGIN
    -- Get project and health info
    SELECT * INTO v_project FROM sow_contracts WHERE id = p_project_id;
    SELECT * INTO v_health FROM project_health_metrics WHERE project_id = p_project_id ORDER BY metric_date DESC LIMIT 1;

    -- Get previous health status
    SELECT overall_health INTO v_prev_health
    FROM health_history
    WHERE project_id = p_project_id
    AND snapshot_date < CURRENT_DATE
    ORDER BY snapshot_date DESC
    LIMIT 1;

    -- Check each active rule
    FOR v_rule IN SELECT * FROM alert_rules WHERE is_active = TRUE LOOP
        -- Health change to Critical
        IF v_rule.rule_type = 'health_change' AND
           v_health.overall_health = 'Critical' AND
           v_prev_health IS DISTINCT FROM 'Critical' THEN
            INSERT INTO alert_notifications (alert_rule_id, project_id, title, message, severity)
            VALUES (v_rule.id, p_project_id,
                    'Project Health Critical: ' || v_project.project_name,
                    'Project ' || v_project.project_name || ' health has changed to Critical status.',
                    'Critical');
        END IF;

        -- Blocker threshold
        IF v_rule.rule_type = 'blocker_threshold' AND
           v_health.blocker_count >= (v_rule.condition_config->>'threshold')::int THEN
            -- Only alert if not already alerted today
            IF NOT EXISTS (
                SELECT 1 FROM alert_notifications
                WHERE project_id = p_project_id
                AND alert_rule_id = v_rule.id
                AND triggered_at::date = CURRENT_DATE
            ) THEN
                INSERT INTO alert_notifications (alert_rule_id, project_id, title, message, severity)
                VALUES (v_rule.id, p_project_id,
                        'High Blocker Count: ' || v_project.project_name,
                        'Project has ' || v_health.blocker_count || ' blockers requiring attention.',
                        v_rule.severity);
            END IF;
        END IF;

        -- Renewal approaching
        IF v_rule.rule_type = 'renewal_approaching' THEN
            DECLARE
                v_days_until INT;
            BEGIN
                v_days_until := v_project.end_date - CURRENT_DATE;
                IF v_days_until <= (v_rule.condition_config->>'days_before')::int AND v_days_until > 0 THEN
                    IF NOT EXISTS (
                        SELECT 1 FROM alert_notifications
                        WHERE project_id = p_project_id
                        AND alert_rule_id = v_rule.id
                        AND triggered_at::date = CURRENT_DATE
                    ) THEN
                        INSERT INTO alert_notifications (alert_rule_id, project_id, title, message, severity)
                        VALUES (v_rule.id, p_project_id,
                                'Renewal Approaching: ' || v_project.project_name,
                                'Contract ends in ' || v_days_until || ' days.',
                                v_rule.severity);
                    END IF;
                END IF;
            END;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VIEW: Alert summary
-- =====================================================
CREATE OR REPLACE VIEW alert_summary AS
SELECT
    a.*,
    s.project_name,
    s.client_name,
    r.name as rule_name,
    r.rule_type
FROM alert_notifications a
LEFT JOIN sow_contracts s ON a.project_id = s.id
LEFT JOIN alert_rules r ON a.alert_rule_id = r.id
ORDER BY a.triggered_at DESC;

-- =====================================================
-- Add missing columns to sow_contracts if needed
-- =====================================================
DO $$
BEGIN
    -- Add document columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sow_contracts' AND column_name = 'document_url') THEN
        ALTER TABLE sow_contracts ADD COLUMN document_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'sow_contracts' AND column_name = 'document_name') THEN
        ALTER TABLE sow_contracts ADD COLUMN document_name TEXT;
    END IF;
END $$;
