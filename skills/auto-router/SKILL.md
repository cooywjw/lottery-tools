# Auto Router Skill

智能 Agent 路由引擎，根据用户输入自动选择最合适的 Agent 处理任务。

## 设计理念

**方案 A：关键词匹配 + LLM 兜底**
- 第一层：关键词规则匹配（快速、确定）
- 第二层：LLM 智能判断（灵活、覆盖边缘情况）

## 使用方法

```bash
# 测试路由（不实际执行）
node skills/auto-router/router.js route "帮我做一个增长策略"

# 实际路由并执行
node skills/auto-router/router.js exec "帮我做一个增长策略"

# 列出所有路由规则
node skills/auto-router/router.js rules
```

## 配置

编辑 `config.json`：

```json
{
  "concurrency": 1,
  "llmProvider": "deepseek",
  "llmModel": "deepseek/deepseek-chat",
  "fallbackEnabled": true
}
```

## 路由规则

60+ 条规则覆盖：
- **Marketing**: growth-hacker, content-strategist, seo-specialist...
- **Engineering**: frontend-developer, backend-developer, devops-engineer...
- **Testing**: qa-engineer, security-tester, performance-tester...
- **Product**: product-manager, ux-researcher, data-analyst...

## 工作流程

```
用户输入
    ↓
关键词匹配 → 命中 → 直接路由到对应 Agent
    ↓ 未命中
LLM 分析 → 推荐 Agent → 执行
    ↓ 无法判断
默认 Agent (general-assistant)
```

## 依赖

- Node.js 18+
- DeepSeek API Key（已配置在环境变量）
