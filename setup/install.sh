#!/usr/bin/env bash
# Sets up the free Claude Code stack from this repo.
# Run from any directory: bash setup/install.sh
set -euo pipefail

echo "=== Free Claude Code Setup ==="

# 1. Install uv if missing
if ! command -v uv &>/dev/null; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

# 2. Install free-claude-code proxy
echo "Installing free-claude-code proxy..."
uv tool install git+https://github.com/Alishahryar1/free-claude-code.git

# 3. Init fcc config and apply template
echo "Configuring fcc proxy..."
fcc-init
cp "$(dirname "$0")/fcc.env.template" ~/.fcc/.env.template
echo ""
echo "  Edit ~/.fcc/.env and set:"
echo "    OPENROUTER_API_KEY=\"your-key-from-openrouter.ai/keys\""
echo "    MODEL=\"open_router/deepseek/deepseek-r1:free\""
echo ""

# 4. Install superpowers plugin + skills
echo "Installing superpowers..."
mkdir -p ~/.claude/plugins ~/.claude/skills ~/.claude/commands
git clone --depth=1 https://github.com/obra/superpowers /tmp/superpowers 2>/dev/null || true
cp -r /tmp/superpowers ~/.claude/plugins/superpowers
cp -r /tmp/superpowers/skills/* ~/.claude/skills/

# 5. Install Karpathy guidelines skill
echo "Installing Karpathy guidelines..."
git clone --depth=1 https://github.com/forrestchang/andrej-karpathy-skills /tmp/karpathy-skills 2>/dev/null || true
cp -r /tmp/karpathy-skills/skills/karpathy-guidelines ~/.claude/skills/

# 6. Install awesome-claude-code slash commands
echo "Installing slash commands..."
git clone --depth=1 https://github.com/hesreallyhim/awesome-claude-code /tmp/awesome-claude-code 2>/dev/null || true
cp -r /tmp/awesome-claude-code/resources/slash-commands/* ~/.claude/commands/

# 7. Install wshobson/agents skills + commands
echo "Installing wshobson agents (172 skills, 126 commands)..."
git clone --depth=1 https://github.com/wshobson/agents /tmp/wshobson-agents 2>/dev/null || true
for plugin_dir in /tmp/wshobson-agents/plugins/*/; do
  plugin_name=$(basename "$plugin_dir")
  if [ -d "$plugin_dir/skills" ]; then
    for skill_dir in "$plugin_dir/skills/"/*/; do
      cp -r "$skill_dir" "$HOME/.claude/skills/${plugin_name}__$(basename "$skill_dir")" 2>/dev/null || true
    done
  fi
  if [ -d "$plugin_dir/commands" ]; then
    for cmd in "$plugin_dir/commands/"*.md; do
      [ -f "$cmd" ] && cp "$cmd" "$HOME/.claude/commands/${plugin_name}__$(basename "$cmd")" 2>/dev/null || true
    done
  fi
done

# 8. Install TDD Guard
echo "Installing TDD Guard..."
npm install -g tdd-guard 2>/dev/null || true

# 9. Install Repomix
echo "Installing Repomix..."
npm install -g repomix 2>/dev/null || true

# 10. Install Playwright MCP
echo "Installing Playwright MCP..."
npm install -g @playwright/mcp 2>/dev/null || true

# 11. Install Claude Subconscious
echo "Installing Claude Subconscious..."
git clone --depth=1 https://github.com/letta-ai/claude-subconscious ~/.claude/plugins/claude-subconscious 2>/dev/null || true
cd ~/.claude/plugins/claude-subconscious && npm install --silent 2>/dev/null || true
cd -

# 12. Apply Claude Code settings
echo "Applying Claude Code settings..."
cp "$(dirname "$0")/claude-settings.json" ~/.claude/settings.json
echo ""
echo "  Edit ~/.claude/settings.json and set:"
echo "    env.LETTA_API_KEY = \"your-key-from-app.letta.com\""
echo ""

# 13. Create MCP config for Playwright
cat > ~/.claude/mcp.json <<'EOF'
{
    "mcpServers": {
        "playwright": {
            "command": "npx",
            "args": ["@playwright/mcp@latest"]
        }
    }
}
EOF

echo ""
echo "=== Done! ==="
echo ""
echo "Start the proxy:  fcc-server"
echo "Use Claude Code:  ANTHROPIC_BASE_URL=http://localhost:8082 ANTHROPIC_AUTH_TOKEN=freecc claude"
echo ""
echo "Or add to ~/.bashrc to make permanent:"
echo "  export ANTHROPIC_BASE_URL=http://localhost:8082"
echo "  export ANTHROPIC_AUTH_TOKEN=freecc"
