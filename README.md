# OneValue Delivery Intelligence Console - Multi-Agent Development System

## 🎯 Quick Start

This package contains everything you need to build the OneValue Delivery Intelligence Console using Claude Code with a sophisticated multi-agent architecture.

### What's Included

1. **CLAUDE.md** - Complete multi-agent architecture specification
2. **INSTALLATION_GUIDE.md** - Step-by-step setup instructions
3. **skills/** - Pre-configured sub-agent skill templates
   - Backend Developer skill
   - Frontend Developer skill
   - (Additional skills to be populated)

---

## 📋 Prerequisites

Before you begin, ensure you have:

✅ Node.js 18+ installed  
✅ Python 3.10+ installed  
✅ npm package manager  
✅ Anthropic API key (provided in PRD)  
✅ Supabase project URL and service role key  
✅ n8n instance running (or willingness to set one up)  
✅ Google OAuth credentials for oneorigin.us domain

---

## 🚀 Installation Overview

### Phase 1: Install Claude Code (15 minutes)

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Set your API key
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Verify installation
claude-code --version
```

### Phase 2: Install MCP Servers (30 minutes)

```bash
# Install n8n
npm install -g n8n

# Install Supabase MCP
npm install -g @modelcontextprotocol/server-supabase

# Install Playwright MCP
npm install -g @executeautomation/playwright-mcp-server
npx playwright install
```

### Phase 3: Configure MCP (15 minutes)

Create `~/.config/claude/mcp_config.json` with your credentials:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "YOUR_N8N_API_KEY"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_KEY"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### Phase 4: Initialize Project (10 minutes)

```bash
# Create project directory
mkdir ~/onevalue-delivery-console
cd ~/onevalue-delivery-console

# Extract this package
tar -xzf onevalue-multi-agent-setup.tar.gz

# Initialize Claude Code
claude-code init
```

---

## 🏗️ Architecture Overview

### Multi-Agent System

This project uses 7 specialized AI agents:

1. **ORCHESTRATOR** - Project Manager coordinating all work
2. **BACKEND LEAD** - Database schema, n8n workflows, APIs
3. **FRONTEND LEAD** - React UI with Tahoe OS26 design
4. **INFRASTRUCTURE** - Deployment, monitoring, operations
5. **SECOPS** - Security testing and hardening
6. **QA (UI)** - Frontend testing with Playwright
7. **QA (Functional)** - Backend and integration testing

Each agent has:
- Dedicated skill file with domain expertise
- Clear responsibilities and deliverables
- Quality standards to uphold
- Communication protocols with other agents

### 20% Failure Mandate

QA agents are instructed to **deliberately find issues in 20% of completed work** to ensure enterprise-grade quality. This forces:
- Comprehensive edge case testing
- Thorough error state validation
- Performance optimization
- Security hardening

---

## 📊 Development Timeline

### Day 1 (0-8 hours): Foundation
- ✅ Supabase schema with RLS
- ✅ Authentication working
- ✅ Deployment pipeline
- ✅ Test frameworks ready

### Day 2 (8-32 hours): Core Features
- ✅ All 5 n8n workflows
- ✅ Dashboard with real data
- ✅ SOW parsing working
- ✅ AI features functional

### Day 3 (32-48 hours): Polish & Demo
- ✅ Production deployment
- ✅ Demo scenarios tested
- ✅ Documentation complete
- ✅ Security sign-off

---

## 🎨 Design System: Tahoe OS26

Inspired by Apple's design language:

- **Liquid Glass** - Semi-transparent surfaces with blur
- **Rounded Geometry** - 12-16px border radius
- **Subtle Depth** - Layered shadows
- **Intrusive Alerts** - Critical info demands attention
- **Premium Typography** - High-quality fonts and spacing

See `skills/onevalue-frontend-SKILL.md` for complete specifications.

---

## 🔐 Security Requirements

### Authentication
- Google OAuth restricted to @oneorigin.us
- Invite-only allowlist in Supabase
- Role-based access (Admin, PM, Viewer)

### Data Protection
- Row Level Security (RLS) on all tables
- Prepared statements (no SQL injection)
- Rate limiting on all endpoints
- Audit logging for all changes

### Threat Mitigation
- OWASP Top 10 compliance
- Regular penetration testing
- Security monitoring with alerts
- Incident response runbook

---

## 📁 File Structure

```
onevalue-delivery-console/
├── src/
│   ├── frontend/          # React + Lovable
│   ├── backend/           # Supabase Edge Functions
│   └── shared/            # Common types/utils
├── workflows/
│   └── n8n/               # n8n workflow JSONs
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/               # Playwright tests
├── scripts/
│   └── init_skill.py      # Skill initialization
├── .env                   # Environment variables
├── CLAUDE.md              # Architecture spec
└── package.json           # Dependencies
```

---

## 🧪 Testing Strategy

### UI Testing (Playwright)
- Authentication flows
- Dashboard functionality
- Real-time updates
- Accessibility (WCAG 2.1 AA)
- Visual regression

### Functional Testing
- API endpoint validation
- n8n workflow execution
- Data integrity checks
- Load testing (50 concurrent users)
- Integration testing

### Security Testing
- Authentication bypass attempts
- SQL injection testing
- XSS payload testing
- Rate limiting verification
- RLS policy validation

---

## 📚 Detailed Documentation

### Read These First

1. **INSTALLATION_GUIDE.md** - Complete setup walkthrough
2. **CLAUDE.md** - Multi-agent architecture
3. **skills/onevalue-backend-SKILL.md** - Backend implementation
4. **skills/onevalue-frontend-SKILL.md** - Frontend implementation

### Key Concepts

**Evidence Linking**: Every AI-generated insight must link back to the source (Gmail/Chat message)

**SOW Anchoring**: All delivery events must tie to contract terms

**Auditability**: Every workflow execution logged with correlation IDs

**Intrusive Design**: Critical information cannot be missed

---

## 🚨 Common Issues & Solutions

### "Claude Code not found"
```bash
npm install -g @anthropic-ai/claude-code --force
```

### "MCP server won't connect"
```bash
# Verify config file exists
cat ~/.config/claude/mcp_config.json

# Check API keys are set correctly
# Restart Claude Code
```

### "Supabase RLS policies failing"
```bash
# Ensure using SERVICE_ROLE_KEY, not anon key
# Test with: curl -H "apikey: YOUR_KEY" YOUR_URL/rest/v1/
```

### "n8n workflows not executing"
```bash
# Verify n8n is running
curl http://localhost:5678/healthcheck

# Check API key in mcp_config.json matches n8n
```

---

## ✅ Quality Gates

### Gate 1: Foundation (8 hours)
- [ ] Database schema deployed
- [ ] Authentication working
- [ ] Deployment pipeline functional
- [ ] No critical security issues

### Gate 2: Core Features (32 hours)
- [ ] All n8n workflows running
- [ ] Dashboard shows real data
- [ ] SOW parsing works
- [ ] 80% test coverage
- [ ] QA found issues in 20% of work

### Gate 3: Demo Ready (48 hours)
- [ ] Production deployed
- [ ] Demo scenarios tested
- [ ] All critical bugs resolved
- [ ] Security sign-off obtained
- [ ] Documentation complete

---

## 🎯 Success Criteria

### Technical
- Zero critical vulnerabilities
- 90%+ test coverage
- < 2s page load time
- 99.9% workflow success rate

### Functional
- All 5 workflows operational
- Dashboard shows live data
- SOW parsing accurate
- AI insights actionable

### Demo
- Live system accessible
- SOW linkage demonstrated
- Access control working
- Failure recovery shown

---

## 🆘 Getting Help

### During Development
1. **Orchestrator Agent** - Technical blockers
2. **Human (Nithin)** - Resource/timeline issues
3. **SecOps** - Security concerns (immediate escalation)

### Documentation
- Read the relevant skill file
- Check CLAUDE.md for architecture
- Review INSTALLATION_GUIDE.md for setup

### Debugging
- Check system_audit_logs table
- Review n8n execution logs
- Use browser DevTools for frontend
- Check Supabase logs for database

---

## 🎓 Learning Resources

### Supabase
- [RLS Policies Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

### n8n
- [Workflow Best Practices](https://docs.n8n.io/workflows/best-practices/)
- [Error Handling](https://docs.n8n.io/workflows/error-handling/)

### React + TypeScript
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Playwright
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## 📝 Next Steps

1. ✅ **Install Claude Code** (see INSTALLATION_GUIDE.md)
2. ✅ **Configure MCP servers** (n8n, Supabase, Playwright)
3. ✅ **Initialize project structure**
4. ✅ **Populate agent skills** (read skill templates)
5. ✅ **Start Phase 1 development**
6. ✅ **Run daily standups** (every 8 hours)
7. ✅ **Enforce quality gates** (8hr, 32hr, 48hr)

---

## 🏆 Deliverables

At the end of 3 days, you will have:

✅ **Working Product**
- Live Delivery Intelligence Console
- Google OAuth with allowlist
- Real-time dashboard
- 5 operational n8n workflows

✅ **Production Ready**
- Deployed to GitHub Pages
- Monitoring and alerting
- Backup and recovery
- Security hardened

✅ **Fully Tested**
- 90%+ test coverage
- Security penetration tested
- Performance benchmarked
- Demo scenarios validated

✅ **Documented**
- API documentation
- Deployment runbook
- User guide
- Incident response plan

---

**Ready to build? Let's ship this! 🚀**

For detailed instructions, start with **INSTALLATION_GUIDE.md**
