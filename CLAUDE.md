# OneValue Delivery Intelligence Console - Multi-Agent Development System

## Project Overview

**Mission:** Build a production-ready Delivery Intelligence Console in 3 days
**Standard:** Enterprise-grade, not a PoC
**Architecture:** Multi-agent orchestration with specialized roles

---

## Agent Architecture

### 1. ORCHESTRATOR (Project Manager)
**Role:** Coordinates all agents, manages dependencies, enforces timeline
**Responsibilities:**
- Sprint planning and task breakdown
- Dependency management between agents
- Daily standup coordination
- Risk escalation to human stakeholder
- Quality gate enforcement

**Skills Required:**
- Project management
- Risk assessment
- Cross-functional coordination
- Timeline management

**Decision Authority:** Medium - can reassign tasks, cannot modify requirements

---

### 2. BACKEND LEAD DEVELOPER
**Role:** Database schema, API design, n8n workflow architecture
**Responsibilities:**
- Supabase schema implementation with RLS policies
- API endpoint design and implementation
- n8n workflow creation and testing
- Integration with Claude API for AI features
- Error handling and retry logic

**Skills Required:**
- PostgreSQL/Supabase expertise
- REST API design
- n8n workflow automation
- AI/LLM integration patterns
- Error handling and resilience

**Key Deliverables:**
- `supabase_schema.sql` with all tables and RLS
- n8n workflow JSONs for 5 core workflows
- API documentation
- Error handling framework

**Quality Standards:**
- All queries must use prepared statements
- RLS policies must be tested for all user roles
- Workflows must handle failures gracefully
- API responses must include correlation IDs

---

### 3. FRONTEND LEAD DEVELOPER
**Role:** Lovable-based UI implementation with Tahoe OS26 design
**Responsibilities:**
- React component architecture
- Supabase real-time integration
- Google OAuth implementation
- Dashboard visualizations
- Responsive design implementation

**Skills Required:**
- React/TypeScript expertise
- Supabase client integration
- OAuth 2.0 implementation
- Data visualization (charts, metrics)
- CSS-in-JS/Tailwind mastery

**Key Deliverables:**
- Component library following Tahoe OS26 standards
- Dashboard views (Portfolio, Project Detail, Action Queue)
- Authentication flow with allowlist
- Real-time data subscriptions

**Design Standards (Tahoe OS26):**
- Liquid glass surfaces with semi-transparency
- Rounded geometry (border-radius: 12-16px)
- Frosted glass effects (backdrop-filter: blur)
- Subtle shadows and elevation
- "Extremely intrusive" critical alerts
- Apple-inspired color palette

---

### 4. INFRASTRUCTURE ENGINEER
**Role:** Deployment, monitoring, and operational excellence
**Responsibilities:**
- GitHub Pages deployment setup
- Environment configuration
- Monitoring and alerting setup
- Backup and recovery procedures
- Performance optimization

**Skills Required:**
- CI/CD pipeline setup
- Infrastructure as Code
- Monitoring (logs, metrics, traces)
- Security hardening
- Performance tuning

**Key Deliverables:**
- Deployment pipeline (GitHub Actions)
- Environment variable management
- Health check endpoints
- Backup automation
- Performance benchmarks

**Quality Standards:**
- Zero-downtime deployments
- 99.9% uptime target
- < 2s page load time
- Automated backups every 6 hours

---

### 5. SECOPS ENGINEER
**Role:** Security hardening and threat mitigation
**Responsibilities:**
- Security audit of all components
- Authentication/authorization testing
- Input validation and sanitization
- Rate limiting implementation
- Security monitoring setup

**Skills Required:**
- OWASP Top 10 expertise
- OAuth security patterns
- SQL injection prevention
- XSS/CSRF mitigation
- Security testing tools

**Key Deliverables:**
- Security audit report
- Penetration test results
- Rate limiting configuration
- Security monitoring rules
- Incident response runbook

**Security Checkpoints:**
1. Authentication bypass attempts
2. SQL injection testing
3. XSS payload testing
4. CSRF token validation
5. Rate limiting verification
6. RLS policy bypass attempts
7. API key exposure scanning
8. Secrets management audit

**Threat Model:**
- Unauthorized access via OAuth bypass
- Data exfiltration via RLS bypass
- API abuse via missing rate limits
- Injection attacks (SQL, NoSQL, Command)
- Credential stuffing attacks
- Man-in-the-middle attacks

---

### 6. QA LEAD (UI Tester)
**Role:** Frontend testing with 20% failure mandate
**Responsibilities:**
- Component testing with Playwright
- Visual regression testing
- Accessibility testing (WCAG 2.1 AA)
- Cross-browser compatibility
- Performance testing

**Skills Required:**
- Playwright/Cypress expertise
- Accessibility testing
- Performance testing tools
- Visual testing frameworks
- Browser DevTools mastery

**Testing Strategy:**
- **Unit tests:** 80% coverage minimum
- **Integration tests:** All critical paths
- **E2E tests:** User journeys via Playwright
- **Visual tests:** Snapshot testing
- **Performance tests:** Lighthouse CI

**20% Failure Mandate:**
- Deliberately find issues in 20% of completed work
- Focus on edge cases and error states
- Test with realistic failure scenarios
- Validate degraded state handling

**Key Test Scenarios:**
1. Google OAuth flow (success/failure)
2. Dashboard data loading (empty, partial, full)
3. Real-time updates (WebSocket reconnection)
4. Error states (network failures, API errors)
5. Allowlist rejection flow
6. Mobile responsiveness
7. Keyboard navigation
8. Screen reader compatibility

---

### 7. QA ENGINEER (Functional Tester)
**Role:** Backend and integration testing with 20% failure mandate
**Responsibilities:**
- API endpoint testing
- n8n workflow testing
- Data integrity validation
- Integration testing
- Load testing

**Skills Required:**
- API testing (Postman/Insomnia)
- Database testing
- Load testing tools (k6, Artillery)
- Integration testing patterns
- Test automation

**Testing Strategy:**
- **API tests:** All endpoints with various payloads
- **Workflow tests:** All n8n workflows with failure injection
- **Data tests:** Referential integrity, constraints
- **Load tests:** Concurrent user scenarios
- **Integration tests:** End-to-end data flows

**20% Failure Mandate:**
- Test with malformed data
- Simulate partial failures (network, DB)
- Validate rollback mechanisms
- Test concurrent operations
- Verify audit log completeness

**Key Test Scenarios:**
1. Historical data dump (Gmail/Chat)
2. SOW PDF parsing with edge cases
3. Daily delivery poller resilience
4. AI project analyzer accuracy
5. Error handler cascade testing
6. Database connection failures
7. Rate limit enforcement
8. Data consistency under load

---

## MCP Server Integrations

### n8n-mcp
**Purpose:** Workflow automation orchestration
**Usage:**
- Create and manage n8n workflows
- Test workflow executions
- Monitor workflow health
- Deploy workflows to production

**Configuration:**
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-n8n-api-key"
      }
    }
  }
}
```

### supabase-mcp
**Purpose:** Database management and RLS testing
**Usage:**
- Execute SQL migrations
- Test RLS policies
- Query data for debugging
- Monitor database performance

**Configuration:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-project-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### lovable-mcp
**Purpose:** Frontend component development
**Usage:**
- Generate React components
- Manage component library
- Deploy to production
- Preview changes

**Configuration:**
```json
{
  "mcpServers": {
    "lovable": {
      "command": "npx",
      "args": ["-y", "lovable-mcp"],
      "env": {
        "LOVABLE_API_KEY": "your-lovable-api-key"
      }
    }
  }
}
```

### playwright-mcp
**Purpose:** Browser automation and E2E testing
**Usage:**
- Write E2E test scenarios
- Run visual regression tests
- Generate test reports
- Debug test failures

**Configuration:**
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "HEADLESS": "true"
      }
    }
  }
}
```

---

## Development Workflow

### Phase 1: Foundation (Day 1, 0-8 hours)
**Orchestrator Tasks:**
- Initialize project structure
- Set up MCP servers
- Create task board
- Assign initial tasks

**Backend Tasks:**
- Create Supabase project
- Implement schema with RLS
- Set up n8n instance
- Create basic API endpoints

**Frontend Tasks:**
- Initialize Lovable project
- Set up routing
- Implement authentication shell
- Create component library foundation

**Infrastructure Tasks:**
- Set up GitHub repository
- Configure deployment pipeline
- Set up monitoring

**SecOps Tasks:**
- Initial security audit
- Set up secret management
- Configure rate limiting

**QA Tasks:**
- Set up test frameworks
- Create test plan
- Prepare test data

**Deliverables:**
- ✅ Database schema deployed
- ✅ Basic authentication working
- ✅ Deployment pipeline functional
- ✅ Test frameworks configured

---

### Phase 2: Core Features (Day 1-2, 8-32 hours)
**Backend Tasks:**
- Historical data dump workflow
- SOW PDF auto-ingestor
- Daily delivery poller
- AI project analyzer integration

**Frontend Tasks:**
- Portfolio Health Dashboard
- Project Detail View
- Action Queue implementation
- Real-time subscriptions

**Infrastructure Tasks:**
- Performance optimization
- Monitoring dashboards
- Alerting rules

**SecOps Tasks:**
- Penetration testing
- Security monitoring setup
- Incident response prep

**QA Tasks:**
- Component testing (UI)
- API endpoint testing (Functional)
- Integration testing
- Performance testing

**Deliverables:**
- ✅ All 5 n8n workflows functional
- ✅ Dashboard showing real data
- ✅ SOW linkage working
- ✅ Security audit passed (80%)

---

### Phase 3: Polish & Demo Prep (Day 3, 32-48 hours)
**Backend Tasks:**
- Error handling refinement
- Performance tuning
- Documentation

**Frontend Tasks:**
- UI polish (Tahoe OS26)
- Error state handling
- Loading states
- Demo script preparation

**Infrastructure Tasks:**
- Production deployment
- Backup verification
- Runbook creation

**SecOps Tasks:**
- Final security sweep
- Vulnerability remediation
- Security documentation

**QA Tasks:**
- Demo scenario testing
- Final regression testing
- Bug verification
- Test report generation

**Deliverables:**
- ✅ Live dashboard on real data
- ✅ SOW linkage demonstrated
- ✅ Access control demonstrated
- ✅ Failure handling demonstrated
- ✅ All critical bugs resolved
- ✅ 90%+ test coverage

---

## Quality Gates

### Gate 1: Foundation Complete (8 hours)
**Criteria:**
- [ ] Supabase schema deployed with RLS
- [ ] Authentication flow working
- [ ] Deployment pipeline functional
- [ ] Test frameworks operational
- [ ] Security scan shows no critical issues

**SecOps Checkpoint:**
- Authentication tested for bypass
- RLS policies validated
- Secrets properly managed

**QA Checkpoint:**
- Test data created
- Smoke tests passing
- CI/CD tests green

---

### Gate 2: Core Features Complete (32 hours)
**Criteria:**
- [ ] All 5 n8n workflows deployed
- [ ] Dashboard rendering real data
- [ ] SOW parsing working
- [ ] AI features functional
- [ ] 80% test coverage achieved

**SecOps Checkpoint:**
- API endpoints secured
- Rate limiting verified
- Input validation tested
- No high-severity vulnerabilities

**QA Checkpoint (20% Failure Mandate):**
- At least 20% of features flagged for improvement
- All critical paths tested
- Performance benchmarks met
- Accessibility compliance verified

**QA Must Find Issues In:**
1. Error handling edge cases
2. Race conditions in workflows
3. UI inconsistencies
4. Performance bottlenecks
5. Security gaps

---

### Gate 3: Demo Ready (48 hours)
**Criteria:**
- [ ] Production deployment successful
- [ ] All demo scenarios rehearsed
- [ ] Documentation complete
- [ ] No critical bugs outstanding
- [ ] Security sign-off received

**SecOps Checkpoint:**
- Penetration test passed
- Security monitoring active
- Incident response tested

**QA Checkpoint:**
- All critical bugs resolved
- Demo script validated
- Rollback tested
- Performance verified

---

## Agent Communication Protocol

### Daily Standup (Every 8 hours)
**Format:**
1. What I completed
2. What I'm working on
3. Blockers needing escalation

**Orchestrator Responsibilities:**
- Record updates
- Identify dependencies
- Escalate blockers
- Adjust timeline if needed

### Cross-Agent Handoffs
**Backend → Frontend:**
- API contract documentation
- Sample responses
- Error code definitions

**Frontend → QA:**
- Component list
- Test scenarios
- Known issues

**QA → Backend/Frontend:**
- Bug reports with reproduction steps
- Performance metrics
- Security findings

**SecOps → All:**
- Security advisories
- Required fixes
- Compliance updates

### Escalation Path
1. **Agent → Orchestrator:** Technical blockers
2. **Orchestrator → Human (Nithin):** Resource/timeline/requirement issues
3. **SecOps → Orchestrator → Human:** Critical security issues (immediate)

---

## Testing Requirements

### UI Testing (Playwright MCP)
**Test Categories:**
1. **Authentication Flow**
   - Google OAuth success
   - Google OAuth failure
   - Allowlist rejection
   - Session management

2. **Dashboard Functionality**
   - Data loading states
   - Real-time updates
   - Filtering and sorting
   - Drill-down navigation

3. **Accessibility**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast
   - Focus management

4. **Visual Regression**
   - Component snapshots
   - Layout consistency
   - Responsive breakpoints

**Playwright Test Structure:**
```typescript
// tests/auth.spec.ts
test.describe('Authentication', () => {
  test('should login with Google OAuth', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="google-login"]');
    // ... assertions
  });
  
  test('should reject non-allowlisted users', async ({ page }) => {
    // ... test implementation
  });
});
```

### Functional Testing
**Test Categories:**
1. **API Endpoints**
   - Request/response validation
   - Error handling
   - Rate limiting
   - Authentication/authorization

2. **n8n Workflows**
   - Workflow execution
   - Error recovery
   - Data transformation
   - Integration points

3. **Data Integrity**
   - Foreign key constraints
   - Data validation
   - Audit log completeness

**Load Testing Scenarios:**
- 50 concurrent users browsing dashboards
- 10 workflows executing simultaneously
- 1000 MOMs ingested in batch
- Real-time updates to 100 connected clients

---

## Skills Placement

### Backend Developer Skills Location
```
/mnt/skills/user/onevalue-backend/
├── SKILL.md                          # Main workflow guide
├── scripts/
│   ├── create_rls_policy.py         # RLS policy generator
│   ├── test_workflow.py              # n8n workflow tester
│   └── migrate_schema.py             # Schema migration runner
├── references/
│   ├── supabase_patterns.md         # Common patterns
│   ├── n8n_best_practices.md        # Workflow design
│   └── api_standards.md              # API conventions
└── assets/
    └── workflow_templates/           # n8n JSON templates
```

### Frontend Developer Skills Location
```
/mnt/skills/user/onevalue-frontend/
├── SKILL.md                          # Component development guide
├── scripts/
│   ├── generate_component.py        # Component scaffolding
│   └── theme_generator.py            # Tahoe OS26 theme helper
├── references/
│   ├── tahoe_design_system.md       # Design specifications
│   ├── component_patterns.md        # React patterns
│   └── supabase_realtime.md         # Real-time integration
└── assets/
    ├── component_templates/          # React boilerplate
    └── design_tokens.json            # Theme variables
```

### Infrastructure Engineer Skills Location
```
/mnt/skills/user/onevalue-infra/
├── SKILL.md                          # Deployment guide
├── scripts/
│   ├── deploy.sh                     # Deployment script
│   ├── health_check.py               # Health monitoring
│   └── backup.sh                     # Backup automation
├── references/
│   ├── deployment_checklist.md      # Release process
│   ├── monitoring_guide.md          # Observability
│   └── runbook.md                    # Operations guide
└── assets/
    └── github_actions/               # CI/CD workflows
```

### SecOps Engineer Skills Location
```
/mnt/skills/user/onevalue-secops/
├── SKILL.md                          # Security testing guide
├── scripts/
│   ├── security_scan.py             # Automated scanning
│   ├── penetration_test.py          # Pentest automation
│   └── vulnerability_report.py      # Report generator
├── references/
│   ├── owasp_checklist.md           # Security standards
│   ├── threat_model.md              # Threat analysis
│   └── incident_response.md         # IR procedures
└── assets/
    └── test_payloads/               # Attack vectors
```

### QA Skills Location
```
/mnt/skills/user/onevalue-qa-ui/
├── SKILL.md                          # UI testing guide
├── scripts/
│   ├── run_playwright_tests.sh      # Test runner
│   └── visual_regression.py         # Snapshot testing
├── references/
│   ├── test_strategy.md             # Testing approach
│   ├── accessibility_guide.md       # WCAG compliance
│   └── playwright_patterns.md       # Test patterns
└── assets/
    └── test_fixtures/               # Test data

/mnt/skills/user/onevalue-qa-func/
├── SKILL.md                          # Functional testing guide
├── scripts/
│   ├── api_test_suite.py            # API tests
│   ├── load_test.js                 # k6 load tests
│   └── integration_tests.py         # E2E tests
├── references/
│   ├── test_scenarios.md            # Test cases
│   └── data_validation.md           # Data quality
└── assets/
    └── test_data/                   # Sample datasets
```

### Orchestrator Skills Location
```
/mnt/skills/user/onevalue-orchestrator/
├── SKILL.md                          # PM workflow guide
├── scripts/
│   ├── standup_report.py            # Daily updates
│   └── risk_analyzer.py             # Risk assessment
├── references/
│   ├── project_plan.md              # Master timeline
│   ├── dependency_map.md            # Task dependencies
│   └── escalation_guide.md          # Issue resolution
└── assets/
    └── templates/                   # Document templates
```

---

## Success Criteria

### Technical Excellence
- [ ] Zero critical security vulnerabilities
- [ ] 90%+ test coverage
- [ ] < 2s page load time
- [ ] 99.9% workflow success rate
- [ ] All RLS policies validated

### Functional Completeness
- [ ] All 5 n8n workflows operational
- [ ] Dashboard shows real data
- [ ] SOW parsing works on standard PDFs
- [ ] AI features generate accurate insights
- [ ] Error handling gracefully degrades

### Demo Readiness
- [ ] Live system accessible via allowlist
- [ ] SOW linkage demonstrated
- [ ] Access control demonstrated
- [ ] Failure recovery demonstrated
- [ ] All stakeholders can log in

### Enterprise Standards (QA Enforcement)
- [ ] 20% of work flagged and improved by QA
- [ ] All critical paths tested
- [ ] Performance benchmarks exceeded
- [ ] Accessibility compliance achieved
- [ ] Security sign-off obtained

---

## Risk Management

### High-Risk Areas
1. **n8n Workflow Complexity**
   - Mitigation: Start with simplest workflow, iterate
   - Owner: Backend Lead

2. **Supabase RLS Complexity**
   - Mitigation: Test each policy in isolation
   - Owner: Backend Lead + SecOps

3. **Google OAuth Integration**
   - Mitigation: Use proven libraries, test early
   - Owner: Frontend Lead

4. **AI Feature Accuracy**
   - Mitigation: Start with rule-based, add AI incrementally
   - Owner: Backend Lead

5. **Timeline Pressure**
   - Mitigation: Daily checkpoints, ruthless prioritization
   - Owner: Orchestrator

---

## Getting Started

### Step 1: Install Claude Code
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Initialize Claude Code in project directory
claude-code init
```

### Step 2: Configure MCP Servers
Create `~/.config/claude/mcp_config.json`:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "{{N8N_API_KEY}}"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "{{SUPABASE_URL}}",
        "SUPABASE_SERVICE_ROLE_KEY": "{{SUPABASE_SERVICE_ROLE_KEY}}"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### Step 3: Initialize Sub-Agent Skills
```bash
# Run the skill initialization script for each agent
python scripts/init_skill.py onevalue-backend --path /mnt/skills/user/
python scripts/init_skill.py onevalue-frontend --path /mnt/skills/user/
python scripts/init_skill.py onevalue-infra --path /mnt/skills/user/
python scripts/init_skill.py onevalue-secops --path /mnt/skills/user/
python scripts/init_skill.py onevalue-qa-ui --path /mnt/skills/user/
python scripts/init_skill.py onevalue-qa-func --path /mnt/skills/user/
python scripts/init_skill.py onevalue-orchestrator --path /mnt/skills/user/
```

### Step 4: Start Development
```bash
# Start Claude Code with all agents
claude-code start --agents orchestrator,backend,frontend,infra,secops,qa-ui,qa-func
```

---

## Next Steps

**Immediate Actions:**
1. Review and approve this architecture
2. Install Claude Code
3. Set up MCP server credentials
4. Initialize project repository
5. Begin Phase 1 development

**Questions for Stakeholder:**
1. Confirm Supabase project is created?
2. Confirm n8n instance is available?
3. Confirm Google OAuth credentials ready?
4. Any additional requirements not in PRD?

---

**End of CLAUDE.md**
