-- OneValue Delivery Intelligence Console
-- Supabase Schema with RLS Policies
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

-- Index for fast email lookups
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
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
    aging_days INTEGER DEFAULT 0, -- Calculated at query time via view
    evidence_link TEXT NOT NULL,
    message_id TEXT,
    thread_id TEXT,
    space_id TEXT,
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_insights JSONB,
    ai_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_project ON delivery_intelligence(project_id);
CREATE INDEX IF NOT EXISTS idx_delivery_source ON delivery_intelligence(source);
CREATE INDEX IF NOT EXISTS idx_delivery_type ON delivery_intelligence(event_type);
CREATE INDEX IF NOT EXISTS idx_delivery_aging ON delivery_intelligence(aging_days);
CREATE INDEX IF NOT EXISTS idx_delivery_unprocessed ON delivery_intelligence(ai_processed) WHERE NOT ai_processed;
CREATE INDEX IF NOT EXISTS idx_delivery_created ON delivery_intelligence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_message ON delivery_intelligence(message_id) WHERE message_id IS NOT NULL;

-- Full-text search on content
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

-- Indexes
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
    aging_days INTEGER DEFAULT 0, -- Calculated at query time via view
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_action_project ON action_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_action_status ON action_queue(status);
CREATE INDEX IF NOT EXISTS idx_action_priority ON action_queue(priority);
CREATE INDEX IF NOT EXISTS idx_action_owner ON action_queue(owner_email) WHERE owner_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_action_due ON action_queue(due_date) WHERE status NOT IN ('Completed', 'Cancelled');
CREATE INDEX IF NOT EXISTS idx_action_overdue ON action_queue(due_date) WHERE status NOT IN ('Completed', 'Cancelled');

-- Trigger for updated_at
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

-- Indexes
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
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_spaces ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user email from JWT
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS TEXT AS $$
    SELECT COALESCE(
        current_setting('request.jwt.claims', true)::json->>'email',
        (current_setting('request.jwt.claims', true)::json->'user_metadata'->>'email'),
        ''
    );
$$ LANGUAGE sql STABLE;

-- Helper function to check if user is in allowlist
CREATE OR REPLACE FUNCTION public.is_allowlisted()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_allowlist
        WHERE email = public.get_user_email()
        AND is_active = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to check if user is admin
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
-- RLS POLICIES: user_allowlist
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage allowlist" ON user_allowlist;
CREATE POLICY "Admins can manage allowlist"
    ON user_allowlist FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users can view own entry" ON user_allowlist;
CREATE POLICY "Users can view own entry"
    ON user_allowlist FOR SELECT
    USING (email = public.get_user_email());

-- =====================================================
-- RLS POLICIES: sow_contracts
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: delivery_intelligence
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: project_health_metrics
-- =====================================================
DROP POLICY IF EXISTS "Allowlisted users can view metrics" ON project_health_metrics;
CREATE POLICY "Allowlisted users can view metrics"
    ON project_health_metrics FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Service role can manage metrics" ON project_health_metrics;
CREATE POLICY "Service role can manage metrics"
    ON project_health_metrics FOR ALL
    WITH CHECK (TRUE);

-- =====================================================
-- RLS POLICIES: action_queue
-- =====================================================
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

-- =====================================================
-- RLS POLICIES: system_audit_logs
-- =====================================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON system_audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON system_audit_logs FOR SELECT
    USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can insert audit logs" ON system_audit_logs;
CREATE POLICY "Service role can insert audit logs"
    ON system_audit_logs FOR INSERT
    WITH CHECK (TRUE);

-- =====================================================
-- RLS POLICIES: chat_spaces
-- =====================================================
DROP POLICY IF EXISTS "Allowlisted users can view spaces" ON chat_spaces;
CREATE POLICY "Allowlisted users can view spaces"
    ON chat_spaces FOR SELECT
    USING (public.is_allowlisted());

DROP POLICY IF EXISTS "Admins can manage spaces" ON chat_spaces;
CREATE POLICY "Admins can manage spaces"
    ON chat_spaces FOR ALL
    USING (public.is_admin());

-- =====================================================
-- VIEWS
-- =====================================================

-- Portfolio Overview View
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

-- Action Queue with Project Info
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

-- Renewal Readiness View (Post-June)
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

-- =====================================================
-- INITIAL DATA: Add first admin user
-- =====================================================
INSERT INTO user_allowlist (email, display_name, role, is_active, created_by)
VALUES ('nithin@oneorigin.us', 'Nithin Varadaraj', 'Admin', TRUE, 'system')
ON CONFLICT (email) DO UPDATE SET
    role = 'Admin',
    is_active = TRUE,
    display_name = 'Nithin Varadaraj';

-- =====================================================
-- FUNCTIONS: API Helpers
-- =====================================================

-- Function to get portfolio health summary
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

-- Function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_allowlist
    SET last_login = NOW()
    WHERE email = public.get_user_email();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_allowlist IS 'Controls access to the application via Google OAuth allowlist';
COMMENT ON TABLE sow_contracts IS 'Statement of Work contracts - the truth anchors for all projects';
COMMENT ON TABLE delivery_intelligence IS 'All project communication data from Gmail, Chat, etc.';
COMMENT ON TABLE project_health_metrics IS 'Daily aggregated health metrics per project';
COMMENT ON TABLE action_queue IS 'Prioritized action items - what we do next';
COMMENT ON TABLE system_audit_logs IS 'Workflow execution logs for debugging and compliance';
COMMENT ON TABLE chat_spaces IS 'Google Chat spaces being monitored for MOMs';
