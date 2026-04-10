---
name: auto-router
description: 智能路由 - 根据关键词或 LLM 判断，自动将任务路由到最合适的 Agent。支持关键词匹配 + LLM 兜底。
version: 1.0.0
author: 天哥
tags: [router, auto-agent, dispatch]
---

# auto-router - 智能路由 Skill

## 功能

1. **关键词路由**：已知任务模式 → 直接匹配 Agent
2. **LLM 路由兜底**：未知任务 → 模型判断最合适的 Agent
3. **手动指定**：用户显式指定 Agent

## 路由表（关键词 → Agent）

| 关键词 | Agent |
|--------|-------|
| 增长、裂变、获客 | `marketing/marketing-growth-hacker` |
| 内容、文章、写作、创作 | `marketing/marketing-content-creator` |
| 抖音、视频号 | `marketing/marketing-douyin-strategist` |
| 小红书、种草 | `marketing/marketing-xiaohongshu-specialist` |
| 公众号、微信 | `marketing/marketing-wechat-official-account` |
| 微博 | `marketing/marketing-weibo-strategist` |
| 知乎 | `marketing/marketing-zhihu-strategist` |
| SEO、搜索引擎 | `marketing/marketing-seo-specialist` |
| 私域、社群 | `marketing/marketing-private-domain-operator` |
| 直播、带货 | `marketing/marketing-livestream-commerce-coach` |
| 前端、React、Vue | `engineering/engineering-frontend-developer` |
| 后端、API、数据库 | `engineering/engineering-backend-architect` |
| 移动端、iOS、Android | `engineering/engineering-mobile-app-builder` |
| AI、机器学习 | `engineering/engineering-ai-engineer` |
| DevOps、CI/CD、部署 | `engineering/engineering-devops-automator` |
| 安全、漏洞 | `engineering/engineering-security-engineer` |
| 测试、QA | `testing/testing-reality-checker` |
| 性能、压测 | `testing/testing-performance-benchmarker` |
| UI、设计 | `design/design-ui-designer` |
| UX、用户体验 | `design/design-ux-researcher` |
| 产品经理、需求 | `product/product-manager` |
| 项目管理、敏捷 | `project/project-manager-senior` |
| 数据分析、报表 | `support/support-analytics-reporter` |
| 竞彩、彩票、数据 | `data/data-consolidation-agent` |

## 使用方式

### 自动路由（关键词匹配）
```
你：帮我写个增长策略
→ 检测到"增长" → 自动路由到 marketing-growth-hacker
```

### 自动路由（LLM 兜底）
```
你：帮我分析竞彩数据
→ 关键词未匹配 → LLM 判断 → 路由到 data-consolidation-agent
```

### 手动指定
```
你：用 growth-hacker 帮我做增长策略
→ 显式指定 → 直接使用 marketing-growth-hacker
```

## 在对话中触发

当用户描述一个任务时，主 Agent 会自动：
1. 调用 `router.js route "<用户消息>"` 判断是否需要路由
2. 如需路由，spawn 对应 Agent 执行任务
3. 返回 Agent 的执行结果

## 路由流程

```
用户消息
    ↓
router.js（关键词匹配）
    ↓ (未匹配)
router.js（LLM 智能判断）
    ↓
spawn --role <agent> "<任务>"
    ↓
返回结果给用户
```

## 测试命令

```bash
# 测试路由
node skills/auto-router/router.js route "帮我写增长策略"

# 列出所有规则
node skills/auto-router/router.js list

# 测试关键词匹配
node skills/auto-router/router.js test "增长策略"
```

## LLM 路由 Prompt

当关键词未匹配时，使用：

```
任务：{user_message}
可用 Agent（151个）：
{agent_list}

请从可用 Agent 中选择最合适的一个。
只需要回复 Agent 的 key，例如：marketing/marketing-growth-hacker
不要解释，不要多余文字。
```
