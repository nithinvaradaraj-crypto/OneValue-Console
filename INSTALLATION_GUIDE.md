# OneValue Project - Installation & Setup Guide

## Prerequisites

Before starting, ensure you have:
- Node.js 18+ and npm installed
- Python 3.10+ installed
- Git installed
- A GitHub account
- Access to the Supabase project
- Access to n8n instance
- Google OAuth credentials for oneorigin.us domain

---

## Part 1: Install Claude Code

### Option 1: Using npm (Recommended)
```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude-code --version
```

### Option 2: Using npx (No global install)
```bash
# Run Claude Code without installation
npx @anthropic-ai/claude-code --version
```

### Authenticate with Anthropic
```bash
# Set your API key from the PRD
export ANTHROPIC_API_KEY="your-anthropic-api-key-here"

# Or add to your shell profile (.bashrc, .zshrc, etc.)
echo 'export ANTHROPIC_API_KEY="your-anthropic-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

---

## Part 2: Install MCP Servers

### 2.1: Install n8n-mcp

```bash
# Install n8n locally (if not already running)
npm install -g n8n

# Start n8n to get API credentials
n8n start

# Access n8n at http://localhost:5678
# Go to Settings → API → Generate API Key
# Save the API key for MCP configuration

# Install n8n-mcp
npm install -g n8n-mcp
```

**n8n Configuration:**
1. Open http://localhost:5678
2. Create account (if first time)
3. Go to Settings → API
4. Click "Create API Key"
5. Name it "Claude Code MCP"
6. Copy the generated key (starts with `n8n_api_`)
7. Save it securely

### 2.2: Install Supabase MCP

```bash
# Install Supabase MCP server
npm install -g @modelcontextprotocol/server-supabase
```

**Supabase Configuration:**
1. Go to https://supabase.com
2. Navigate to your OneValue project (or create one)
3. Go to Settings → API
4. Copy the following:
   - Project URL (e.g., https://xxxx.supabase.co)
   - Service Role Key (anon key won't work for MCP)
5. Save both securely

### 2.3: Install Playwright MCP

```bash
# Install Playwright MCP server
npm install -g @executeautomation/playwright-mcp-server

# Install Playwright browsers
npx playwright install chromium firefox webkit
```

### 2.4: Install Lovable MCP (if available)

```bash
# Note: Lovable MCP might not be publicly available
# Alternative: Use direct Lovable integration via their API
# Check: https://lovable.dev/docs for latest integration method

# If available:
npm install -g lovable-mcp
```

---

## Part 3: Configure MCP Servers

### 3.1: Create MCP Configuration File

```bash
# Create config directory
mkdir -p ~/.config/claude

# Create MCP configuration file
nano ~/.config/claude/mcp_config.json
```

### 3.2: Add Configuration

Paste the following into `~/.config/claude/mcp_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "YOUR_N8N_API_KEY_HERE"
      }
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "YOUR_SUPABASE_URL_HERE",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"],
      "env": {
        "HEADLESS": "true",
        "BROWSER": "chromium"
      }
    }
  }
}
```

### 3.3: Replace Placeholders

Replace the following in the config file:
- `YOUR_N8N_API_KEY_HERE` → Your n8n API key from step 2.1
- `YOUR_SUPABASE_URL_HERE` → Your Supabase project URL
- `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE` → Your Supabase service role key

### 3.4: Verify MCP Configuration

```bash
# Test n8n MCP connection
npx n8n-mcp test

# Test Supabase MCP connection
npx @modelcontextprotocol/server-supabase test

# Test Playwright MCP
npx @executeautomation/playwright-mcp-server test
```

---

## Part 4: Set Up Project Structure

### 4.1: Create Project Directory

```bash
# Create project root
mkdir -p ~/onevalue-delivery-console
cd ~/onevalue-delivery-console

# Initialize Git repository
git init
git remote add origin https://github.com/YOUR_ORG/onevalue-delivery-console.git
```

### 4.2: Initialize Claude Code

```bash
# Initialize Claude Code in project
claude-code init

# This creates:
# - .claude/ directory with configuration
# - .gitignore for Claude-specific files
```

### 4.3: Create Directory Structure

```bash
# Create standard directories
mkdir -p {src,tests,docs,scripts,workflows,config}
mkdir -p src/{frontend,backend,shared}
mkdir -p tests/{unit,integration,e2e}
mkdir -p workflows/{n8n,automation}
```

---

## Part 5: Install Sub-Agent Skills

### 5.1: Download Skill Initialization Script

```bash
# Create scripts directory
mkdir -p scripts

# Download or create init_skill.py script
cat > scripts/init_skill.py << 'EOF'
#!/usr/bin/env python3
"""
Skill initialization script for OneValue multi-agent system
"""
import os
import sys
import argparse
from pathlib import Path

def create_skill_structure(skill_name: str, output_path: str):
    """Create a skill directory with proper structure"""
    skill_path = Path(output_path) / skill_name
    
    # Create directories
    (skill_path / 'scripts').mkdir(parents=True, exist_ok=True)
    (skill_path / 'references').mkdir(parents=True, exist_ok=True)
    (skill_path / 'assets').mkdir(parents=True, exist_ok=True)
    
    # Create SKILL.md template
    skill_md = f"""---
name: {skill_name}
description: TODO - Add comprehensive description of what this skill does and when to use it
---

# {skill_name.replace('-', ' ').title()}

## Overview

TODO: Describe the purpose and scope of this skill

## When to Use This Skill

TODO: Specify triggers and contexts for using this skill

## Workflow

TODO: Provide step-by-step instructions

## Best Practices

TODO: Add guidelines and recommendations

## Examples

TODO: Provide concrete examples
"""
    
    with open(skill_path / 'SKILL.md', 'w') as f:
        f.write(skill_md)
    
    # Create example script
    example_script = """#!/usr/bin/env python3
# Example script - replace with actual implementation

def main():
    print("Skill script executed")

if __name__ == '__main__':
    main()
"""
    
    with open(skill_path / 'scripts' / 'example.py', 'w') as f:
        f.write(example_script)
    
    # Make script executable
    os.chmod(skill_path / 'scripts' / 'example.py', 0o755)
    
    # Create example reference
    with open(skill_path / 'references' / 'example.md', 'w') as f:
        f.write("# Example Reference\n\nTODO: Add reference documentation\n")
    
    print(f"✓ Created skill structure at: {skill_path}")
    print(f"  - SKILL.md (TODO: Complete)")
    print(f"  - scripts/example.py")
    print(f"  - references/example.md")
    print(f"  - assets/ (empty)")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Initialize a new skill')
    parser.add_argument('skill_name', help='Name of the skill (e.g., onevalue-backend)')
    parser.add_argument('--path', default='.', help='Output directory')
    
    args = parser.parse_args()
    create_skill_structure(args.skill_name, args.path)
EOF

chmod +x scripts/init_skill.py
```

### 5.2: Create All Sub-Agent Skills

```bash
# Create user skills directory
mkdir -p ~/.claude/skills/user

# Initialize all agent skills
python3 scripts/init_skill.py onevalue-orchestrator --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-backend --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-frontend --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-infra --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-secops --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-qa-ui --path ~/.claude/skills/user
python3 scripts/init_skill.py onevalue-qa-func --path ~/.claude/skills/user
```

---

## Part 6: Environment Setup

### 6.1: Create Environment File

```bash
# Create .env file
cat > .env << 'EOF'
# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Supabase Configuration
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# n8n Configuration
N8N_API_URL=http://localhost:5678
N8N_API_KEY=YOUR_N8N_API_KEY

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
ALLOWED_DOMAIN=oneorigin.us

# Application
NODE_ENV=development
PORT=3000
EOF

# Secure the file
chmod 600 .env
```

### 6.2: Add to .gitignore

```bash
cat > .gitignore << 'EOF'
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Claude Code
.claude/
*.log

# Build outputs
dist/
build/
.next/
out/

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
EOF
```

---

## Part 7: Install Project Dependencies

### 7.1: Backend Dependencies

```bash
# Create package.json for backend
cat > package.json << 'EOF'
{
  "name": "onevalue-delivery-console",
  "version": "1.0.0",
  "description": "Delivery Intelligence Console for OneValue",
  "main": "src/backend/index.js",
  "scripts": {
    "dev": "nodemon src/backend/index.js",
    "build": "tsc",
    "test": "jest",
    "test:e2e": "playwright test"
  },
  "keywords": ["delivery", "intelligence", "onevalue"],
  "author": "OneOrigin",
  "license": "MIT",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/express": "^4.17.21",
    "nodemon": "^3.0.2",
    "typescript": "^5.3.3",
    "jest": "^29.7.0",
    "@playwright/test": "^1.40.0"
  }
}
EOF

# Install dependencies
npm install
```

### 7.2: Playwright Setup

```bash
# Install Playwright with browsers
npm install -D @playwright/test
npx playwright install

# Create Playwright config
npx playwright init
```

---

## Part 8: Verify Installation

### 8.1: Check All Components

```bash
# Create verification script
cat > scripts/verify_setup.sh << 'EOF'
#!/bin/bash
echo "OneValue Setup Verification"
echo "==========================="
echo ""

# Check Node.js
echo -n "Node.js: "
node --version || echo "❌ NOT INSTALLED"

# Check npm
echo -n "npm: "
npm --version || echo "❌ NOT INSTALLED"

# Check Python
echo -n "Python: "
python3 --version || echo "❌ NOT INSTALLED"

# Check Claude Code
echo -n "Claude Code: "
claude-code --version 2>/dev/null || echo "❌ NOT INSTALLED"

# Check n8n
echo -n "n8n: "
n8n --version 2>/dev/null || echo "❌ NOT INSTALLED"

# Check Playwright
echo -n "Playwright: "
npx playwright --version 2>/dev/null || echo "❌ NOT INSTALLED"

# Check MCP config
echo -n "MCP Config: "
if [ -f ~/.config/claude/mcp_config.json ]; then
    echo "✓ EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check environment
echo -n ".env file: "
if [ -f .env ]; then
    echo "✓ EXISTS"
else
    echo "❌ NOT FOUND"
fi

# Check skills
echo -n "Agent Skills: "
skill_count=$(ls -d ~/.claude/skills/user/onevalue-* 2>/dev/null | wc -l)
echo "$skill_count/7 created"

echo ""
echo "Setup verification complete!"
EOF

chmod +x scripts/verify_setup.sh

# Run verification
./scripts/verify_setup.sh
```

---

## Part 9: Start Development

### 9.1: Start Required Services

```bash
# Terminal 1: Start n8n
n8n start

# Terminal 2: Start Supabase (if local)
# supabase start

# Terminal 3: Start Claude Code
claude-code start
```

### 9.2: Initial Tasks

Once all services are running:

1. **Create Supabase Schema**
   - Use Supabase MCP to execute schema creation
   - Implement RLS policies
   - Create audit logging

2. **Set Up n8n Workflows**
   - Import workflow templates
   - Configure credentials
   - Test basic workflows

3. **Initialize Frontend**
   - Set up Lovable project
   - Configure authentication
   - Create component library

---

## Part 10: Troubleshooting

### Common Issues

**Issue: Claude Code not found**
```bash
# Solution: Reinstall globally
npm install -g @anthropic-ai/claude-code --force
```

**Issue: MCP servers not connecting**
```bash
# Solution: Check configuration
cat ~/.config/claude/mcp_config.json
# Verify API keys are correct
# Restart Claude Code
```

**Issue: n8n API key invalid**
```bash
# Solution: Regenerate API key
# 1. Open http://localhost:5678
# 2. Settings → API → Delete old key
# 3. Create new key
# 4. Update mcp_config.json
```

**Issue: Supabase connection fails**
```bash
# Solution: Verify credentials
# 1. Check SUPABASE_URL format
# 2. Ensure using SERVICE_ROLE_KEY (not anon key)
# 3. Test connection:
curl -H "apikey: YOUR_KEY" YOUR_URL/rest/v1/
```

**Issue: Playwright tests fail**
```bash
# Solution: Reinstall browsers
npx playwright install --force
```

---

## Next Steps

✅ Installation complete! Now:

1. **Review CLAUDE.md** for the complete multi-agent architecture
2. **Populate sub-agent skills** with detailed instructions
3. **Start Phase 1 development** following the 3-day sprint plan
4. **Run daily standups** with all agents
5. **Enforce quality gates** at 8hr, 32hr, and 48hr marks

**Ready to start building? Ask Claude Code to begin Phase 1!**
