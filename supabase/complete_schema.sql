-- OneValue Delivery Intelligence Console
-- COMPLETE SCHEMA - Run this file in Supabase SQL Editor
-- Generated: 2024-12-26

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: user_allowlist
-- Controls access to the application (Google OAuth allowlist)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_allowlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'Viewer' CHECK (role IN ('Admin', 'PM', 'Viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT,
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_allowlist_email ON user_allowlist(email) WHERE is_active = TRUE;

-- =====================================================
-- TABLE: sow_contracts
-- Stores Statement of Work (SOW) contract terms
-- =====================================================
CREATE TABLE IF NOT EXISTS sow_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_name TEXT NOT NULL UNIQUE,
    client_name TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    scope_anchors TEXT[] NOT NULL DEFAULT '{}',
    renewal_window_start DATE,
    contract_value NUMERIC(12, 2),
    pdf_link TEXT,
    google_drive_file_id TEXT,
    inferred_owner TEXT,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'At Risk', 'Expired')),
    document_url TEXT,
    document_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sow_project_name ON sow_contracts(project_name);
CREATE INDEX IF NOT EXISTS idx_sow_status ON sow_contracts(status);
CREATE INDEX IF NOT EXISTS idx_sow_renewal ON sow_contracts(renewal_window_start) WHERE renewal_window_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sow_end_date ON sow_contracts(end_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sow_contracts_updated_at ON sow_contracts;
CREATE TRIGGER sow_contracts_updated_at
    BEFORE UPDATE ON sow_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: delivery_intelligence
-- Central repository for all project execution data
-- =====================================================
CREATE TABLE IF NOT EXISTS delivery_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES sow_contracts(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('Gmail', 'GoogleChat', 'Teams', 'Slack', 'Manual')),
    event_type TEXT NOT NULL CHECK (event_type IN ('MOM', 'Communication', 'Alert', 'Blocker', 'Update')),
    title TEXT,
    content_raw JSONB NOT NULL,
    sentiment_score NUMERIC(3, 2) CHECK (sentiment_score BETWEEN -1.0 AND 1.0),
    extracted_blockers TEXT[] DEFAULT '{}',
    extracted_objectives TEXT[] DEFAULT '{}',
    extracted_owners TEXT[] DEFAULT '{}',
    extracted_action_items JSONB DEFAULT '[]',
    aging_days INTEGER DEFAULT 0,
    evidence_link TEXT NOT NULL,
    message_id TEXT,
    thread_id TEXT,
    space_id TEXT,
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_insights JSONB,
    ai_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_project ON delivery_intelligence(project_id);
CREATE INDEX IF NOT EXISTS idx_delivery_source ON delivery_intelligence(source);
CREATE INDEX IF NOT EXISTS idx_delivery_type ON delivery_intelligence(event_type);
CREATE INDEX IF NOT EXISTS idx_delivery_aging ON delivery_intelligence(aging_days);
CREATE INDEX IF NOT EXISTS idx_delivery_unprocessed ON delivery_intelligence(ai_processed) WHERE NOT ai_processed;
CREATE INDEX IF NOT EXISTS idx_delivery_created ON delivery_intelligence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_message ON delivery_intelligence(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_delivery_content_gin ON delivery_intelligence USING GIN(content_raw jsonb_path_ops);

-- =====================================================
-- TABLE: project_health_metrics
-- Aggregated health metrics per project
-- =====================================================
CREATE TABLE IF NOT EXISTS project_health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES sow_contracts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    overall_health TEXT DEFAULT 'Unknown' CHECK (overall_health IN ('Healthy', 'At Risk', 'Critical', 'Unknown')),
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    blocker_count INTEGER DEFAULT 0,
    open_action_count INTEGER DEFAULT 0,
    overdue_action_count INTEGER DEFAULT 0,
    sentiment_trend NUMERIC(3, 2),
    scope_creep_detected BOOLEAN DEFAULT FALSE,
    scope_creep_details TEXT,
    renewal_risk_score NUMERIC(3, 2) CHECK (renewal_risk_score BETWEEN 0.0 AND 1.0),
    days_until_renewal INTEGER,
    last_activity_date DATE,
    last_mom_date DATE,
    communication_frequency TEXT CHECK (communication_frequency IN ('High', 'Normal', 'Low', 'Silent')),
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_health_project ON project_health_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_health_date ON project_health_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_status ON project_health_metrics(overall_health);
CREATE INDEX IF NOT EXISTS idx_health_renewal_risk ON project_health_metrics(renewal_risk_score DESC) WHERE renewal_risk_score > 0.5;

-- =====================================================
-- TABLE: action_queue
-- "What we do next" - prioritized action items
-- =====================================================
CREATE TABLE IF NOT EXISTS action_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES sow_contracts(id) ON DELETE CASCADE,
    delivery_intelligence_id UUID REFERENCES delivery_intelligence(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner TEXT,
    owner_email TEXT,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled')),
    due_date DATE,
    evidence_link TEXT,
    source_type TEXT CHECK (source_type IN ('AI_Extracted', 'Manual', 'MOM', 'Blocker')),
    aging_days INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_project ON action_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_action_status ON action_queue(status);
CREATE INDEX IF NOT EXISTS idx_action_priority ON action_queue(priority);
CREATE INDEX IF NOT EXISTS idx_action_owner ON action_queue(owner_email) WHERE owner_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_due ON action_queue(due_date) WHERE status NOT IN ('Completed', 'Cancelled');
CREATE INDEX IF NOT EXISTS idx_action_overdue ON action_queue(due_date) WHERE status NOT IN ('Completed', 'Cancelled');

DROP TRIGGER IF EXISTS action_queue_updated_at ON action_queue;
CREATE TRIGGER action_queue_updated_at
    BEFORE UPDATE ON action_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: system_audit_logs
-- Tracks all workflow executions and errors
-- =====================================================
CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_name TEXT NOT NULL,
    workflow_id TEXT,
    execution_id TEXT,
    execution_status TEXT NOT NULL CHECK (execution_status IN ('Success', 'Failed', 'Running', 'Cancelled', 'Warning')),
    error_payload JSONB,
    error_message TEXT,
    execution_time_ms INTEGER,
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_workflow ON system_audit_logs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_audit_status ON system_audit_logs(execution_status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON system_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_failures ON system_audit_logs(timestamp DESC) WHERE execution_status = 'Failed';

-- =====================================================
-- TABLE: chat_spaces
-- Google Chat spaces being monitored
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id TEXT NOT NULL UNIQUE,
    space_name TEXT NOT NULL,
    space_type TEXT CHECK (space_type IN ('SPACE', 'DM', 'GROUP_DM')),
    project_id UUID REFERENCES sow_contracts(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_polled_at TIMESTAMPTZ,
    last_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spaces_active ON chat_spaces(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_spaces_project ON chat_spaces(project_id);

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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claims', true)::json->>'email',
        (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'email'),
        ''
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.is_allowlisted()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_allowlist
        WHERE email = public.get_user_email()
        AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_allowlist
        WHERE email = public.get_user_email()
        AND role = 'Admin'
        AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- user_allowlist
DROP POLICY IF EXISTS "Admins can manage allowlist" ON user_allowlist;
CREATE POLICY "Admins can manage allowlist"
    ON user_allowlist FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own entry" ON user_allowlist;
CREATE POLICY "Users can view own entry"
    ON user_allowlist FOR SELECT
    USING (email = public.get_user_email());

-- sow_contracts
DROP POLICY IF EXISTS "Allowlisted users can view SOWs" ON sow_contracts;
CREATE POLICY "Allowlisted users can view SOWs"
    ON sow_contracts FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Admins and PMs can modify SOWs" ON sow_contracts;
CREATE POLICY "Admins and PMs can modify SOWs"
    ON sow_contracts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_allowlist
            WHERE email = public.get_user_email()
            AND role IN ('Admin', 'PM')
            AND is_active = TRUE
        )
    );

-- delivery_intelligence
DROP POLICY IF EXISTS "Allowlisted users can view delivery data" ON delivery_intelligence;
CREATE POLICY "Allowlisted users can view delivery data"
    ON delivery_intelligence FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can insert delivery data" ON delivery_intelligence;
CREATE POLICY "Service role can insert delivery data"
    ON delivery_intelligence FOR INSERT
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can modify delivery data" ON delivery_intelligence;
CREATE POLICY "Admins can modify delivery data"
    ON delivery_intelligence FOR UPDATE
    USING (public.is_admin());

-- project_health_metrics
DROP POLICY IF EXISTS "Allowlisted users can view metrics" ON project_health_metrics;
CREATE POLICY "Allowlisted users can view metrics"
    ON project_health_metrics FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can manage metrics" ON project_health_metrics;
CREATE POLICY "Service role can manage metrics"
    ON project_health_metrics FOR ALL
    WITH CHECK (TRUE);

-- action_queue
DROP POLICY IF EXISTS "Allowlisted users can view actions" ON action_queue;
CREATE POLICY "Allowlisted users can view actions"
    ON action_queue FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Allowlisted users can manage own actions" ON action_queue;
CREATE POLICY "Allowlisted users can manage own actions"
    ON action_queue FOR ALL
    USING (
        public.is_allowlisted() AND (
            owner_email = public.get_user_email() OR
            public.is_admin()
        )
    );

-- system_audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON system_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON system_audit_logs FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can insert audit logs" ON system_audit_logs;
CREATE POLICY "Service role can insert audit logs"
    ON system_audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- chat_spaces
DROP POLICY IF EXISTS "Allowlisted users can view spaces" ON chat_spaces;
CREATE POLICY "Allowlisted users can view spaces"
    ON chat_spaces FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Admins can manage spaces" ON chat_spaces;
CREATE POLICY "Admins can manage spaces"
    ON chat_spaces FOR ALL
    USING (public.is_admin());

-- health_history
DROP POLICY IF EXISTS "Allowlisted users can view health history" ON health_history;
CREATE POLICY "Allowlisted users can view health history"
    ON health_history FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can manage health history" ON health_history;
CREATE POLICY "Service role can manage health history"
    ON health_history FOR ALL
    WITH CHECK (TRUE);

-- alert_rules
DROP POLICY IF EXISTS "Allowlisted users can view alert rules" ON alert_rules;
CREATE POLICY "Allowlisted users can view alert rules"
    ON alert_rules FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Admins can manage alert rules" ON alert_rules;
CREATE POLICY "Admins can manage alert rules"
    ON alert_rules FOR ALL
    USING (public.is_admin());

-- alert_notifications
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
-- VIEWS
-- =====================================================
CREATE OR REPLACE VIEW portfolio_overview AS
SELECT
    s.id,
    s.project_name,
    s.client_name,
    s.start_date,
    s.end_date,
    s.status,
    s.inferred_owner,
    s.contract_value,
    m.overall_health,
    m.health_score,
    m.blocker_count,
    m.open_action_count,
    m.overdue_action_count,
    m.renewal_risk_score,
    m.days_until_renewal,
    m.last_activity_date,
    m.scope_creep_detected,
    m.ai_summary,
    (s.end_date - CURRENT_DATE) as days_remaining
FROM sow_contracts s
LEFT JOIN LATERAL (
    SELECT * FROM project_health_metrics
    WHERE project_id = s.id
    ORDER BY metric_date DESC
    LIMIT 1
) m ON TRUE
WHERE s.status != 'Completed';

CREATE OR REPLACE VIEW action_queue_full AS
SELECT
    a.*,
    s.project_name,
    s.client_name,
    s.inferred_owner as project_owner
FROM action_queue a
LEFT JOIN sow_contracts s ON a.project_id = s.id
WHERE a.status NOT IN ('Completed', 'Cancelled')
ORDER BY
    CASE a.priority
        WHEN 'Critical' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
    END,
    a.due_date NULLS LAST;

CREATE OR REPLACE VIEW renewal_readiness AS
SELECT
    s.id,
    s.project_name,
    s.client_name,
    s.end_date,
    s.renewal_window_start,
    s.contract_value,
    m.overall_health,
    m.renewal_risk_score,
    m.sentiment_trend,
    m.scope_creep_detected,
    (s.end_date - CURRENT_DATE) as days_until_end,
    CASE
        WHEN m.renewal_risk_score >= 0.7 THEN 'High Risk'
        WHEN m.renewal_risk_score >= 0.4 THEN 'Medium Risk'
        ELSE 'Low Risk'
    END as risk_category
FROM sow_contracts s
LEFT JOIN LATERAL (
    SELECT * FROM project_health_metrics
    WHERE project_id = s.id
    ORDER BY metric_date DESC
    LIMIT 1
) m ON TRUE
WHERE s.end_date >= '2025-06-01'
AND s.status = 'Active'
ORDER BY m.renewal_risk_score DESC NULLS LAST;

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
-- FUNCTIONS
-- =====================================================
CREATE OR REPLACE FUNCTION get_portfolio_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_projects', COUNT(*),
        'healthy', COUNT(*) FILTER (WHERE overall_health = 'Healthy'),
        'at_risk', COUNT(*) FILTER (WHERE overall_health = 'At Risk'),
        'critical', COUNT(*) FILTER (WHERE overall_health = 'Critical'),
        'unknown', COUNT(*) FILTER (WHERE overall_health = 'Unknown'),
        'avg_health_score', ROUND(AVG(health_score)),
        'total_blockers', SUM(blocker_count),
        'total_overdue_actions', SUM(overdue_action_count),
        'avg_renewal_risk', ROUND(AVG(renewal_risk_score)::numeric, 2)
    ) INTO result
    FROM portfolio_overview;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION check_project_alerts(p_project_id UUID)
RETURNS void AS $$
DECLARE
    v_project RECORD;
    v_health RECORD;
    v_rule RECORD;
    v_prev_health TEXT;
BEGIN
    SELECT * INTO v_project FROM sow_contracts WHERE id = p_project_id;
    SELECT * INTO v_health FROM project_health_metrics WHERE project_id = p_project_id ORDER BY metric_date DESC LIMIT 1;

    SELECT overall_health INTO v_prev_health
    FROM health_history
    WHERE project_id = p_project_id
    AND snapshot_date < CURRENT_DATE
    ORDER BY snapshot_date DESC
    LIMIT 1;

    FOR v_rule IN SELECT * FROM alert_rules WHERE is_active = TRUE LOOP
        IF v_rule.rule_type = 'health_change' AND
           v_health.overall_health = 'Critical' AND
           v_prev_health IS DISTINCT FROM 'Critical' THEN
            INSERT INTO alert_notifications (alert_rule_id, project_id, title, message, severity)
            VALUES (v_rule.id, p_project_id,
                    'Project Health Critical: ' || v_project.project_name,
                    'Project ' || v_project.project_name || ' health has changed to Critical status.',
                    'Critical');
        END IF;

        IF v_rule.rule_type = 'blocker_threshold' AND
           v_health.blocker_count >= (v_rule.condition_config->>'threshold')::int THEN
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
-- INITIAL DATA
-- =====================================================
INSERT INTO user_allowlist (email, display_name, role, is_active, created_by)
VALUES ('nithin@oneorigin.us', 'Nithin Varadaraj', 'Admin', TRUE, 'system')
ON CONFLICT (email) DO UPDATE SET
    role = 'Admin',
    is_active = TRUE,
    display_name = 'Nithin Varadaraj';

INSERT INTO alert_rules (name, description, rule_type, condition_config, severity, created_by) VALUES
('Project Health Critical', 'Alert when project health changes to Critical', 'health_change', '{"target_health": "Critical"}', 'Critical', 'system'),
('Blocker Threshold', 'Alert when blockers exceed threshold', 'blocker_threshold', '{"threshold": 3}', 'High', 'system'),
('Sentiment Drop', 'Alert on significant sentiment decline', 'sentiment_drop', '{"drop_threshold": 0.3}', 'Medium', 'system'),
('Overdue Actions', 'Alert when actions become overdue', 'overdue_actions', '{"threshold": 5}', 'High', 'system'),
('No Activity', 'Alert when no project activity for days', 'no_activity', '{"days_threshold": 7}', 'Medium', 'system'),
('Renewal Approaching', 'Alert when contract renewal is near', 'renewal_approaching', '{"days_before": 30}', 'High', 'system')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE user_allowlist IS 'Controls access to the application via Google OAuth allowlist';
COMMENT ON TABLE sow_contracts IS 'Statement of Work contracts - the truth anchors for all projects';
COMMENT ON TABLE delivery_intelligence IS 'All project communication data from Gmail, Chat, etc.';
COMMENT ON TABLE project_health_metrics IS 'Daily aggregated health metrics per project';
COMMENT ON TABLE action_queue IS 'Prioritized action items - what we do next';
COMMENT ON TABLE system_audit_logs IS 'Workflow execution logs for debugging and compliance';
COMMENT ON TABLE chat_spaces IS 'Google Chat spaces being monitored for MOMs';
COMMENT ON TABLE health_history IS 'Historical snapshots of project health for trending';
COMMENT ON TABLE alert_rules IS 'Configurable alert conditions';
COMMENT ON TABLE alert_notifications IS 'Generated alerts/notifications';
