# 🚀 Quick Start Guide - OneValue Console

## 5-Minute Quick Start

### 1. Open Terminal
```bash
cd /Users/nithinvaradaraj/OneValue-Console
```

### 2. Start Frontend Server
```bash
cd frontend
npm run dev
```
✅ Open http://localhost:3000 in your browser

### 3. (Optional) Start n8n in Another Terminal
```bash
cd /Users/nithinvaradaraj/OneValue-Console
n8n start
```
✅ Open http://localhost:5678 for n8n admin

### 4. Start Building!
- Edit files in `frontend/src/` and see live changes
- Use Claude Code with MCP servers for AI-assisted development
- Commit changes to git as you work

---

## Common Tasks

### Run Frontend in Development Mode
```bash
cd /Users/nithinvaradaraj/OneValue-Console/frontend
npm run dev
```

### Build Frontend for Production
```bash
cd /Users/nithinvaradaraj/OneValue-Console/frontend
npm run build
```

### Check Setup Status
```bash
/Users/nithinvaradaraj/OneValue-Console/scripts/verify_setup.sh
```

### Start n8n Workflows
```bash
n8n start
# Then visit http://localhost:5678
```

### View Environment Variables
```bash
cat /Users/nithinvaradaraj/OneValue-Console/.env
```

### Test MCP Connections
```bash
# All three MCP servers should respond:
n8n-mcp --help
@supabase/mcp-server-supabase --help  
@executeautomation/playwright-mcp-server --help
```

---

## Project Structure

```
/Users/nithinvaradaraj/OneValue-Console/
├── frontend/              ← React app (npm run dev here)
├── workflows/             ← n8n automation workflows
├── supabase/              ← Database schemas
├── scripts/               ← Utility scripts
│   ├── verify_setup.sh   ← Check installation status
│   └── init_skill.py     ← Create new agent skills
├── config/
│   └── mcp_servers.json  ← MCP configuration
├── .env                   ← Credentials & environment
├── SETUP_COMPLETE.md      ← Full setup documentation
└── INSTALLATION_GUIDE.md  ← Detailed installation steps
```

---

## Troubleshooting

### "npm: command not found"
```bash
# Node.js is installed, just reload terminal
source ~/.zshrc
npm --version
```

### "Port 3000 already in use"
```bash
# Use a different port
cd frontend
npm run dev -- --port 3001
```

### "Supabase connection failed"
Check your `.env` file:
```bash
cat .env | grep SUPABASE
# Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE are set
```

### "n8n won't start"
```bash
# Check if port 5678 is available
lsof -i :5678
# If in use, kill the process or use different port
n8n start --port 5679
```

---

## Environment Setup

All credentials are in `.env`:
- **Supabase**: Project URL and Service Role Key
- **n8n**: API endpoint and key  
- **Google OAuth**: Client ID and secret
- **Anthropic**: API key for Claude

**Never commit `.env` to git!** It's already in `.gitignore`.

---

## Next Steps

1. ✅ **Verify setup** (you should have just done this)
2. ⏭️ **Start frontend**: `cd frontend && npm run dev`
3. ⏭️ **Open http://localhost:3000** in browser
4. ⏭️ **Begin development** - edit files and see live changes
5. ⏭️ **Commit regularly** - use git as you code

---

## Getting Help

- Full details: See `SETUP_COMPLETE.md`
- Installation steps: See `INSTALLATION_GUIDE.md`  
- Project status: See `PROJECT_STATUS.md`
- Skill documentation: See `*-SKILL.md` files

---

**Everything is ready! Start building.** 🎉
