---
name: context-manager
description: "Monitor conversation context usage, summarize and reset when threshold exceeded. Use when: (1) context usage >85%, (2) user wants to continue long conversation, (3) AI performance slows down, (4) manual context cleanup needed."
claude_tool_interface: true
version: 1.1.0
metadata: { "openclaw": { "emoji": "🧠" } }
---

# Context Manager Skill (v1.1.0)

Monitor conversation context usage in real-time, generate summaries when approaching limits, and create new sessions with preserved context.

## Claude Tool Interface

### inputSchema

```typescript
{
  action: enum["check", "summarize", "reset"],  // 必填
  threshold: number[0-1],                          // 可选，默认0.85
  force: boolean,                                 // 可选，强制执行
  sessionId: string                               // 可选，指定会话
}
```

### 能力标记

- **并发安全**: ✅ (`action=check` 时) / ❌ (`action=summarize|reset`)
- **只读**: ✅ (`action=check`) / ❌ (`action=summarize|reset`)
- **破坏性**: ❌ (`action=check|summarize`) / ✅ (`action=reset` 会话重置)
- **最大结果**: 5000 字符

### description() 动态描述

```typescript
(action) => {
  switch(action) {
    case "check":   return "Check current context usage percentage"
    case "summarize": return "Summarize conversation into summary file"
    case "reset":  return "Reset session after user confirmation (DESTRUCTIVE)"
  }
}
```

---

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

---

## Migration Notes (v1.0.0 → v1.1.0)

Added Claude Tool Interface support:
- Zod `inputSchema` for structured parameters
- `isConcurrencySafe` / `isReadOnly` / `isDestructive` capability flags
- Dynamic `description()` based on action
- Tool registry compatible format

---

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

---

## Usage

### Manual Trigger
Ask the AI assistant:
- "Check context usage"
- "Start context cleanup"
- "Save summary and continue"

### Script Usage (Advanced)
```bash
node skills/context-manager-1.0.0/context-monitor.js --check
node skills/context-manager-1.0.0/context-monitor.js --summarize
node skills/context-manager-1.0.0/context-monitor.js --reset
```

---

## Configuration

```json
{
  "warningThreshold": 0.85,
  "criticalThreshold": 0.90,
  "checkInterval": 300,
  "summaryDir": "memory/context-summaries",
  "autoApprove": false
}
```

---

## Safety Notes

- **Always ask for user approval** before resetting session
- **Preserve critical information** in summaries
- **Never delete** original conversation files
- **Keep backups** of important context

## Integration

Works with: **memory-manager**, **cross-model-memory**, **self-improving**

---
**Purpose**: Extend effective conversation length, prevent context overflow, maintain conversation continuity across sessions.
