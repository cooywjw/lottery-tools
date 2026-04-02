---
name: coordinator
description: "Multi-agent orchestration skill. Spawn workers, coordinate parallel tasks, aggregate results. Use when: tasks can be parallelized, research across multiple topics, or complex projects needing concurrent sub-agents."
claude_tool_interface: true
version: 1.0.0
metadata: { "openclaw": { "emoji": "🎯" } }
---

# Coordinator Skill (v1.0.0)

多Agent编排系统：主Agent协调多个Worker并行执行任务。

## 角色定义

**Coordinator（主控）**：
- 理解用户目标
- 分解任务并分配给 Workers
- 汇总结果向用户汇报
- 直接回答简单问题，不委托

**Workers（执行者）**：
- 接收具体任务，执行并返回结果
- 彼此独立，互不可见
- 通过 Coordinator 协调

## Claude Tool Interface

### inputSchema

```typescript
{
  action: enum["spawn", "send", "list", "stop", "status"],
  name?: string,           // agent 名称（spawn 时必填）
  description?: string,    // 简短描述（3-5词）
  prompt?: string,         // 任务详情（spawn 时必填）
  to?: string,             // 目标 agent（send 时必填）
  task_id?: string,        // agent ID（stop 时必填）
  run_in_background?: boolean,  // 后台运行，默认 false
  cwd?: string,            // 工作目录覆盖
  team_name?: string       // 团队名称
}
```

### 能力标记

- **并发安全**: ✅ (`action=list|status`) / ❌ (`action=spawn|send|stop`)
- **只读**: ✅ (`action=list|status`) / ❌ (`action=spawn|send|stop`)
- **破坏性**: ❌ (`action=list|spawn|status`) / ✅ (`action=stop`)

### description() 动态描述

```typescript
action => {
  switch(action) {
    case "spawn":   return "Spawn a new worker agent to execute a task"
    case "send":    return "Send a message to a running worker agent"
    case "list":    return "List all active worker agents in the team"
    case "stop":    return "Stop a running worker agent (cannot be undone)"
    case "status":  return "Check coordinator team status"
  }
}
```

---

## When to Use

✅ **USE this skill when:**

- 任务可并行化（多个独立研究课题）
- 需要同时处理多个文件/模块
- 复杂项目需要分工（研究 + 实现 + 验证）
- 长时间运行的后台任务

✅ **并行场景示例**：

```
用户：分析这个代码库的安全漏洞、性能问题、代码规范问题

Coordinator:
  spawn(name="sec-audit", description="安全审计", prompt="分析安全漏洞...")
  spawn(name="perf-profiler", description="性能分析", prompt="分析性能问题...")
  spawn(name="code-review", description="代码审查", prompt="检查代码规范...")
  → 等待三个结果 → 汇总汇报
```

✅ **顺序依赖场景**：

```
用户：研究某技术，然后实现，再测试

Coordinator:
  spawn(name="researcher", prompt="研究 X 技术...")  → 等待完成
  send(to="researcher", message="基于你的研究，实现 Y 功能...")
  send(to="researcher", message="现在写测试用例...")
```

## When NOT to Use

❌ **DON'T use this skill when:**

- 任务很简单，直接回答即可
- 只有一个任务，不需要分工
- 需要共享上下文的紧密协作任务

---

## Core Functions

### 1. agent_spawn
创建新的 Worker Agent。

```javascript
// 示例
coordinator(action="spawn", name="researcher", description="研究AI最新进展",
             prompt="搜索并总结今天 AI 领域的最新进展...")
```

### 2. agent_send
向运行中的 Agent 发送消息（继续执行）。

```javascript
// 示例
coordinator(action="send", to="researcher",
             message="请基于刚才的研究，深入分析其中的技术细节...")
```

### 3. agent_list
列出当前团队中所有活跃的 Agent。

```javascript
// 示例
coordinator(action="list")
```

### 4. agent_stop
停止一个运行中的 Agent。

```javascript
// 示例
coordinator(action="stop", task_id="researcher")
```

### 5. team_status
查看团队整体状态。

```javascript
// 示例
coordinator(action="status")
```

---

## 工作流程

```
1. 用户提出需求
       ↓
2. Coordinator 分析任务
       ↓
3. 分解为并行的 Worker 任务
       ↓
4. spawn() 启动多个 Worker（并行）
       ↓
5. Worker 执行并返回结果（通过 subagent_announce）
       ↓
6. Coordinator 汇总结果
       ↓
7. 向用户汇报
```

---

## 任务通知格式

当 Worker 完成时，结果以 `subagent_announce` 形式推送：

```
<task-notification>
<task-id>{agentName}</task-id>
<status>completed|failed</status>
<result>{agent's response}</result>
</task-notification>
```

---

## 安全限制

| 限制 | 默认值 | 说明 |
|------|--------|------|
| 最大并发 Agent | 3 | 防止资源耗尽 |
| 单 Agent 超时 | 180s | 可配置 |
| 破坏性操作 | 需确认 | stop/reset 类操作 |
| Agent 调用深度 | max_depth=3 | 防止递归调用 |

---

## 文件结构

```
skills/coordinator/
├── SKILL.md           # 本文件
├── SYSTEM_PROMPT.md   # Coordinator system prompt
├── team-state.js      # Agent 注册表（内存 + 磁盘）
├── agent_spawn.js     # spawn 工具
├── agent_send.js      # send 工具
├── agent_list.js      # list 工具
├── agent_stop.js      # stop 工具
└── agent_status.js    # status 工具
```

---

## 与 sessions_spawn 的关系

本 Skill 基于 OpenClaw 原生的 `sessions_spawn` 实现：

| 本 Skill | 底层调用 |
|---------|---------|
| spawn | `sessions_spawn(mode="run")` 或 `sessions_spawn(mode="session")` |
| send | `sessions_send(sessionKey, message)` |
| list | 读取 `team-state.js` 内存表 |
| stop | `sessions_send(sessionKey, "STOP")` |

---

## 测试命令

```bash
# 测试 spawn
node skills/coordinator/agent_spawn.js --name test --prompt "计算 2+2" --team test-team

# 测试 list
node skills/coordinator/agent_list.js

# 测试 stop
node skills/coordinator/agent_stop.js --task_id test
```
