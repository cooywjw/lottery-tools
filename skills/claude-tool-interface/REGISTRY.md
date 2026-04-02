# 工具注册规范

## 原则

每个符合 Claude Tool Interface 的 Skill 应在 `SKILL.md` 中声明自己是可注册的。

## 注册标记

在 SKILL.md 顶部添加：

```yaml
---
claude_tool_interface: true
name: my-tool
version: 1.0.0
---
```

## 声明能力

```markdown
## 能力声明

- **并发安全**: ✅ / ❌
- **只读**: ✅ / ❌
- **破坏性**: ✅ / ❌
- **最大结果**: N 字符
- **能力分类**: read | write | delete | execute | network | notify
```

## 注册表位置

全局工具注册表：`~/.openclaw/workspace/TOOL_REGISTRY.json`

```json
{
  "tools": [
    {
      "name": "web_search",
      "skill": "tavily-search",
      "capabilities": ["read", "network"],
      "trustLevel": "safe"
    }
  ]
}
```

## 工具发现流程

1. OpenClaw 启动时扫描 `skills/*/SKILL.md`
2. 识别 `claude_tool_interface: true` 的 Skill
3. 读取 `inputSchema` 和能力标记
4. 注册到全局 ToolRegistry

## 已有注册的工具

| 工具名 | Skill | 能力 | 状态 |
|--------|-------|------|------|
| context_check | context-manager | read | 已迁移 |
| web_search | tavily-search | read, network | 待迁移 |
| wechat_publish | wechat-publisher | write, notify | 待迁移 |
| memory_save | memory-manager | write, delete | 待迁移 |
