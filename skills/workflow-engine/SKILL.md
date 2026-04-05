---
claude_tool_interface: true
name: workflow_run
skill: workflow-engine
version: 0.1.0
description: "工作流引擎 — 把散落的工具串联成自动流水线。用户说一句话，引擎解析意图 → 匹配工作流 → 按步执行 → 产出结果。"
metadata:
  emoji: "⚙️"
  category: "orchestration"
  trustLevel: "safe"
---

# Workflow Engine — 工作流引擎 v0.1.0

把工具串成自动流水线。用户说一句话，引擎自动完成所有步骤。

## 核心概念

- **工作流模板**：定义好的步骤组合（搜索→写文章→生图→发布）
- **意图路由**：根据用户请求匹配对应工作流
- **步骤执行器**：顺序执行每一步，数据在步骤间传递

## 内置工作流

### 1. search_and_publish
**触发词**：搜、新闻、资讯、发布公众号
**步骤**：tavily搜索 → LLM摘要 → 通义万相生图 → 添加水印
**输出**：封面图 + 公众号草稿

### 2. context_monitor
**触发词**：检查上下文、上下文、压缩、context
**步骤**：context_check → context_compact（如需要）
**输出**：上下文状态 + 摘要文件

### 3. generate_image
**触发词**：生成图片、生图、封面图
**步骤**：tianshuwan生图
**输出**：图片路径

## 用法

### CLI
```bash
# 列出所有工作流
node workflow-engine.js --list

# 测试意图路由
node workflow-engine.js --route 搜今天足球新闻发公众号

# 执行工作流
node workflow-engine.js --workflow search_and_publish "搜今天足球新闻发公众号"
```

### 代码调用
```javascript
const { runWorkflow, matchWorkflow } = require('./workflow-engine.js');

// 自动路由 + 执行
const workflowId = matchWorkflow('搜今天足球新闻发公众号');
const result = await runWorkflow(workflowId, userInput);

// 直接执行
const result = await runWorkflow('search_and_publish', '搜今天足球新闻');
```

## 扩展工作流

在 `WORKFLOWS` 对象中添加新条目：

```javascript
'my_workflow': {
  name: '我的工作流',
  description: '描述',
  triggers: ['触发词1', '触发词2'],
  steps: [
    {
      tool: 'tavily_search',
      params: (ctx) => ({ query: '关键词' }),
      capture: 'searchResults'  // 保存到 context.searchResults
    },
    {
      tool: 'save_memory',
      params: (ctx) => ({ content: ctx.searchResults?.answer }),
      capture: null  // 不需要捕获
    }
  ]
}
```

## 已有工具

| 工具名 | 功能 |
|--------|------|
| tavily_search | 网络搜索 |
| context_check | 检查上下文使用率 |
| context_compact | 生成压缩摘要 |
| tianshuwan_image | 通义万相生图 |
| add_watermark | 添加 AI水印 |
| llm_summary | LLM生成摘要 |
| wechat_publish | 发布到公众号草稿箱 |
| save_memory | 保存到记忆文件 |
