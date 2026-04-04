---
name: slash-commands
description: "Slash command system for quick actions. Triggers: user types /command. Commands: /task, /compact, /status, /help, /clear, /model, /context"
claude_tool_interface: true
version: 1.0.0
metadata: { "openclaw": { "emoji": "⚡" } }
---

# Slash Commands Skill (v1.0.0)

快速命令系统，通过斜杠命令触发特定操作。

## 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/task <描述>` | 创建新任务 | `/task 分析代码库安全问题` |
| `/compact` | 手动触发上下文压缩 | `/compact` |
| `/status` | 查看当前状态 | `/status` |
| `/context` | 查看上下文使用率 | `/context` |
| `/help` | 显示帮助信息 | `/help` |
| `/clear` | 清除当前会话 | `/clear` |
| `/model <名称>` | 切换模型 | `/model deepseek` |
| `/memory` | 搜索记忆 | `/memory 用户偏好` |

## Claude Tool Interface

### inputSchema

```typescript
{
  command: string,           // 命令名称（不含斜杠）
  args?: string,             // 命令参数
  sessionKey?: string       // 可选，指定会话
}
```

### 能力标记

- **并发安全**: ✅（只读操作）
- **只读**: ⚠️（部分命令会修改状态）
- **破坏性**: ⚠️（`/clear` 会重置会话）

---

## 当用户输入斜杠命令时使用

✅ 自动识别并执行：
- `/task` → 创建子任务
- `/compact` → 触发上下文压缩
- `/status` → 查看系统状态
- `/context` → 查看上下文使用率
- `/help` → 显示帮助
- `/clear` → 确认后清除会话
- `/model` → 切换 AI 模型
- `/memory` → 搜索记忆文件

---

## 命令处理器

每个命令由对应的脚本处理：

```
skills/slash-commands/
├── commands/
│   ├── task.js       # /task 命令
│   ├── compact.js    # /compact 命令
│   ├── status.js     # /status 命令
│   ├── context.js    # /context 命令
│   ├── help.js       # /help 命令
│   ├── clear.js      # /clear 命令
│   ├── model.js      # /model 命令
│   └── memory.js     # /memory 命令
├── parser.js         # 命令解析
└── registry.js       # 命令注册表
```

---

## 安全限制

- `/clear` 需要用户确认
- `/model` 只允许切换到已配置的模型
- `/exec` 类命令暂不支持（安全考虑）
