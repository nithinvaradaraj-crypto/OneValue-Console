#!/bin/bash
echo "OneValue Setup Verification"
echo "==========================="
echo ""

# Check Node.js
echo -n "✓ Node.js: "
node --version || echo "❌ NOT INSTALLED"

# Check npm
echo -n "✓ npm: "
npm --version || echo "❌ NOT INSTALLED"

# Check Python
echo -n "✓ Python: "
python3 --version || echo "❌ NOT INSTALLED"

# Check git
echo -n "✓ Git: "
git --version | head -1 || echo "❌ NOT INSTALLED"

# Check n8n
echo -n "✓ n8n: "
n8n --version 2>/dev/null || echo "❌ NOT INSTALLED"

# Check n8n-mcp
echo -n "✓ n8n-mcp: "
npm list -g n8n-mcp 2>/dev/null | grep "n8n-mcp" | head -1 | sed 's/^.*n8n-mcp/n8n-mcp/'  || echo "❌ NOT INSTALLED"

# Check Supabase MCP
echo -n "✓ Supabase MCP: "
npm list -g @supabase/mcp-server-supabase 2>/dev/null | grep "supabase" | head -1 | sed 's/^.*@supabase/supabase/'  || echo "❌ NOT INSTALLED"

# Check Playwright MCP
echo -n "✓ Playwright MCP: "
npm list -g @executeautomation/playwright-mcp-server 2>/dev/null | grep "playwright-mcp-server" | head -1 | sed 's/^.*@executeautomation/playwright/'  || echo "❌ NOT INSTALLED"

# Check MCP config
echo -n "✓ MCP Config: "
if [ -f ~/.config/claude/mcp_config.json ]; then
    echo "EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check project config
echo -n "✓ Project MCP Config: "
if [ -f ./config/mcp_servers.json ]; then
    echo "EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check environment
echo -n "✓ .env file: "
if [ -f .env ]; then
    echo "EXISTS"
    # Verify key credentials
    if grep -q "SUPABASE_URL" .env; then
        echo "  ✓ Supabase credentials present"
    fi
    if grep -q "N8N_API_KEY" .env; then
        echo "  ✓ n8n credentials present"
    fi
else
    echo "❌ NOT FOUND"
fi

# Check skills directory
echo -n "✓ Agent Skills: "
if [ -d ~/.claude/skills/user ]; then
    skill_count=$(ls -d ~/.claude/skills/user/onevalue-* 2>/dev/null | wc -l)
    echo "$skill_count created"
else
    echo "NOT INITIALIZED"
fi

# Check frontend
echo -n "✓ Frontend: "
if [ -d ./frontend ]; then
    echo "EXISTS"
    if [ -d ./frontend/node_modules ]; then
        echo "  ✓ Dependencies installed"
    else
        echo "  ⚠ Dependencies not installed (run: cd frontend && npm install)"
    fi
else
    echo "❌ NOT FOUND"
fi

# Check workflows
echo -n "✓ Workflows: "
if [ -d ./workflows ]; then
    workflow_count=$(find ./workflows -name "*.json" 2>/dev/null | wc -l)
    echo "$workflow_count workflow files"
else
    echo "❌ NOT FOUND"
fi

# Check database schemas
echo -n "✓ Database Schemas: "
if [ -d ./supabase ]; then
    schema_count=$(ls ./supabase/*.sql 2>/dev/null | wc -l)
    echo "$schema_count schema files"
else
    echo "❌ NOT FOUND"
fi

echo ""
echo "Setup verification complete!"
echo ""
echo "Next steps:"
echo "1. Install frontend dependencies: cd frontend && npm install"
echo "2. Start n8n: n8n start"
echo "3. Configure Supabase database"
echo "4. Run frontend: cd frontend && npm run dev"
