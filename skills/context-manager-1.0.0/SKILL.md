---
name: context-manager
description: "Monitor conversation context usage, summarize and reset when threshold exceeded. Use when: (1) context usage >85%, (2) user wants to continue long conversation, (3) AI performance slows down, (4) manual context cleanup needed."
metadata: { "openclaw": { "emoji": "🧠" } }
---

# Context Manager Skill

Monitor conversation context usage in real-time, generate summaries when approaching limits, and create new sessions with preserved context.

## When to Use

✅ **USE this skill when:**

- Context usage exceeds 85% threshold
- User wants to continue long conversation without losing context
- AI response slows down due to large context
- Manual context cleanup requested
- Starting a new phase in complex multi-step tasks

✅ **AUTOMATIC triggers:**

- Periodic checks (every 5-10 minutes when active)
- Before starting large operations
- When context usage >85% (warning) or >90% (critical)

## When NOT to Use

❌ **DON'T use this skill when:**

- Context usage is low (<70%)
- Conversation is simple/short
- User is in middle of critical operation (ask first)
- Fresh session just started

## Core Functions

### 1. Context Monitoring
- Real-time usage tracking via `session_status`
- Configurable thresholds (default: 85% warning, 90% critical)
- Periodic checks in background

### 2. Smart Summarization
- Extract key information: decisions, TODOs, user preferences
- Preserve critical context for continuation
- Generate human-readable summary files

### 3. Session Management
- Create new sessions with `sessions_spawn`
- Load previous summaries automatically
- Seamless transition between sessions

### 4. User Interaction
- Clear prompts for user approval
- Progress updates during summarization
- Confirmation before session reset

## Usage

### Manual Trigger
Ask the AI assistant:
- "Check context usage"
- "Start context cleanup"
- "Save summary and continue"

### Automated Operation
The skill runs automatically when:
- Context usage exceeds configured thresholds
- User approves the cleanup process

### Script Usage (Advanced)
```bash
# Check context usage
node ~/.openclaw/workspace/skills/context-manager-1.0.0/context-monitor.js --check

# Force summary generation
node ~/.openclaw/workspace/skills/context-manager-1.0.0/context-monitor.js --summarize

# Reset session with summary
node ~/.openclaw/workspace/skills/context-manager-1.0.0/context-monitor.js --reset
```

## Configuration

Default thresholds:
- **Warning**: 85% - User gets notified
- **Critical**: 90% - Auto-cleanup recommended
- **Auto-check interval**: 300 seconds (5 minutes)

Customize in `config.json`:
```json
{
  "warningThreshold": 0.85,
  "criticalThreshold": 0.90,
  "checkInterval": 300,
  "summaryDir": "memory/context-summaries",
  "autoApprove": false
}
```

## File Structure

- `memory/context-summary-YYYY-MM-DD-HHMM.md` - Generated summaries
- `memory/context-state.json` - Last check timestamps and thresholds
- `skills/context-manager-1.0.0/` - Skill files

## Safety Notes

- **Always ask for user approval** before resetting session
- **Preserve critical information** in summaries
- **Never delete** original conversation files
- **Keep backups** of important context

## Integration with Other Skills

Works with:
- **memory-manager** - For long-term memory storage
- **cross-model-memory** - For consistency across model switches
- **self-improving** - To learn optimal summarization techniques

---
**Purpose**: Extend effective conversation length, prevent context overflow, maintain conversation continuity across sessions.