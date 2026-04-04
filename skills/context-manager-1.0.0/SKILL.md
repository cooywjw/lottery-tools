---
claude_tool_interface: true
name: context_manager
skill: context-manager
version: "1.1.0"
description: "Monitor conversation context usage, summarize and reset when threshold exceeded. Use when: (1) context usage >85%, (2) user wants to continue long conversation, (3) AI performance slows down, (4) manual context cleanup needed."
metadata:
  emoji: "🧠"
  category: "system"
  trustLevel: "safe"
---

# Context Manager Skill (v1.1.0)

Monitor conversation context usage in real-time, generate summaries when approaching limits, and create new sessions with preserved context.

## Claude Tool Interface

### Tool Identity

```typescript
{
  name: 'context_manager',
  aliases: ['check_context', 'compact_context'],
  searchHint: 'check or manage conversation context usage',
  version: '1.1.0'
}
```

### Input Schema

```typescript
{
  action: "check" | "summarize" | "reset" | "compact",  // 必填
  threshold: number,                                      // 可选，默认 0.85，范围 0-1
  force: boolean,                                         // 可选，默认 false
  sessionId: string,                                      // 可选，指定会话
  dryRun: boolean                                         // 可选，默认 false
}
```

### Capability Markers

| Action | 并发安全 | 只读 | 破坏性 |
|--------|---------|------|--------|
| `check` | ✅ true | ✅ true | ❌ false |
| `summarize` | ❌ false | ❌ false | ❌ false |
| `reset` | ❌ false | ❌ false | ✅ true |
| `compact` | ❌ false | ❌ false | ❌ false |

### Dynamic Description

```typescript
async description(input, options) {
  switch (input.action) {
    case 'check':     return '检查当前上下文使用率';
    case 'summarize': return '生成会话摘要并保存';
    case 'reset':     return '重置会话上下文（需要确认）';
    case 'compact':   return input.dryRun ? '模拟上下文压缩' : '压缩上下文并保留摘要';
    default:          return '管理对话上下文';
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
- ✅ Zod `inputSchema` for structured parameters
- ✅ `isConcurrencySafe(action)` - 根据 action 返回不同值
- ✅ `isReadOnly(action)` - 根据 action 返回不同值
- ✅ `isDestructive(action)` - reset 时返回 true
- ✅ Dynamic `description()` based on action
- ✅ Tool registry compatible format
- ✅ Progress callback support
- ✅ Result rendering method
- ✅ New `compact` action for auto-compact

---

## Core Functions

### 1. Context Monitoring (`action: check`)
- Real-time usage tracking via `session_status`
- Configurable thresholds (default: 85% warning, 90% critical)
- Periodic checks in background

### 2. Smart Summarization (`action: summarize`)
- Extract key information: decisions, TODOs, user preferences
- Preserve critical context for continuation
- Generate human-readable summary files

### 3. Session Management (`action: reset`)
- Reset session after user confirmation
- Requires `force: true` to execute

### 4. Auto-Compact (`action: compact`)
- Automatically compress context when token count exceeds threshold
- Preserve recent messages, summarize older ones
- Dry-run mode for testing

---

## Usage

### As a Tool (Claude Tool Interface)

```javascript
const { tool } = require('./context-manager.js');

// Check context usage
const result = await tool.call(
  { action: 'check', threshold: 0.85 },
  { sessionKey: 'xxx', workingDirectory: '/path' },
  async (toolName) => true,  // canUseTool
  (progress) => console.log(progress.message)  // onProgress
);

// Compact context
const result = await tool.call(
  { action: 'compact', dryRun: false },
  context,
  canUseTool,
  onProgress
);
```

### CLI Usage
```bash
# Check context usage
node skills/context-manager-1.0.0/context-manager.js --action check

# Generate summary
node skills/context-manager-1.0.0/context-manager.js --action summarize --session abc123

# Compact (dry run)
node skills/context-manager-1.0.0/context-manager.js --action compact --dry-run

# Compact (execute)
node skills/context-manager-1.0.0/context-manager.js --action compact
```

---

## Configuration

```javascript
const CONFIG = {
  WARNING_THRESHOLD: 0.85,        // 85% warning
  CRITICAL_THRESHOLD: 0.90,       // 90% critical
  COMPACT_THRESHOLD: 180000,      // Token count for auto-compact
  COMPACT_TARGET: 40000,          // Target tokens after compact
  PRESERVE_RECENT_MESSAGES: 20,   // Messages to keep
  MAX_SUMMARIES_TO_KEEP: 10,      // Summary files to retain
  SUMMARY_DIR: 'memory/context-summaries'
};
```

---

## API Reference

### Exports

```javascript
const { check, summarize, reset, tool, metadata, CONFIG } = require('./context-manager.js');

// Legacy API (backward compatible)
const status = await check(sessionKey);
const summary = await summarize(sessionKey);

// Tool API (Claude Tool Interface)
const result = await tool.call(args, context, canUseTool, onProgress);

// Metadata
console.log(metadata);
// { name, version, capabilities, category, trustLevel, maxResultSizeChars }
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
