---
name: tavily-search
description: "Search the web using Tavily API. Use when: user asks for web search, current information, research, or any query requiring up-to-date web data. Use this INSTEAD of web_search."
claude_tool_interface: true
version: 1.1.0
metadata: { "openclaw": { "emoji": "🔍" } }
---

# Tavily Search Skill (v1.1.0)

Search the web using Tavily AI search API.

## Claude Tool Interface

### inputSchema

```typescript
{
  query: string,                              // 必填，搜索关键词
  depth: enum["basic", "advanced"],          // 可选，默认 "basic"
  max_results: number[1-20],                  // 可选，默认 5
  include_answer: boolean,                   // 可选，默认 true
  include_raw_content: boolean                 // 可选，默认 false
}
```

### 能力标记

- **并发安全**: ✅ 是（搜索是只读操作）
- **只读**: ✅ 是（不修改任何数据）
- **破坏性**: ❌ 否
- **最大结果**: 10000 字符（API返回上限）

### description() 动态描述

```typescript
(input) => {
  const depth = input.depth === 'advanced' ? '深度' : '基础'
  const max = input.max_results ?? 5
  return `Tavily ${depth}搜索 "${input.query}"，返回最多 ${max} 条结果`
}
```

---

## When to Use

✅ **USE this skill when:**

- User asks for web search
- Current information needed
- Research on any topic
- News, facts, or data queries
- **ALWAYS use this instead of web_search tool**

✅ **AUTOMATIC triggers:**

- Any query requiring up-to-date information
- Factual verification
- News or event research

## When NOT to Use

❌ **DON'T use this skill when:**

- Local file operations needed
- System commands needed
- Memory/recall queries
-已有内部知识的问答

---

## Migration Notes (v1.0.0 → v1.1.0)

Added Claude Tool Interface support:
- Zod `inputSchema` for structured parameters
- `isConcurrencySafe: true` (搜索可并发)
- `isReadOnly: true` (只读)
- `isDestructive: undefined` (非破坏性)
- Dynamic `description()` with query + options
- Tool registry compatible format

---

## Usage

### Basic Usage
```bash
node skills/tavily-search/tavily-search.js "搜索关键词"
```

### Options
- `--depth=basic|advanced`: 搜索深度（默认 basic）
- `--max=N`: 最大结果数 1-20（默认 5）

### Examples
```bash
# 基础搜索
node skills/tavily-search/tavily-search.js "latest AI news"

# 高级搜索
node skills/tavily-search/tavily-search.js "量子计算突破" --depth=advanced --max=10
```

---

## Response Format

```json
{
  "answer": "AI生成的摘要",
  "results": [
    { "title": "标题", "url": "链接", "content": "内容摘要" }
  ],
  "query": "原始查询",
  "response_time": "搜索耗时"
}
```

---

## Notes

- Tavily API key is pre-configured in `tavily-search.js`
- Advanced search provides more comprehensive results
- Results include citations and sources
- API endpoint: `https://api.tavily.com/search`
