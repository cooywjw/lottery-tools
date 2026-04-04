---
claude_tool_interface: true
name: web_search
skill: tavily-search
version: "1.1.0"
description: "Search the web using Tavily API. Use when: user asks for web search, current information, research, or any query requiring up-to-date web data. Use this INSTEAD of web_search."
metadata:
  emoji: "🔍"
  category: "network"
  trustLevel: "safe"
---

# Tavily Search Skill (v1.1.0)

Search the web using Tavily AI search API.

## Claude Tool Interface

### Tool Identity

```typescript
{
  name: 'web_search',
  aliases: ['tavily_search', 'search_web'],
  searchHint: 'search the web for current information',
  version: '1.1.0'
}
```

### Input Schema

```typescript
{
  query: string,                    // 必填，搜索关键词
  depth: "basic" | "advanced",     // 可选，默认 "basic"
  max_results: number,              // 可选，默认 5，范围 1-20
  include_answer: boolean,          // 可选，默认 true
  include_raw_content: boolean      // 可选，默认 false
}
```

### Capability Markers

| 属性 | 值 | 说明 |
|------|-----|------|
| **并发安全** | ✅ true | 搜索是只读操作，可并发执行 |
| **只读** | ✅ true | 不修改任何数据 |
| **破坏性** | ❌ false | 非破坏性操作 |
| **最大结果** | 10000 字符 | API返回上限 |

### Dynamic Description

```typescript
async description(input, options) {
  const depth = input.depth === 'advanced' ? '深度' : '基础';
  const max = input.max_results || 5;
  return `Tavily ${depth}搜索 "${input.query}"，返回最多 ${max} 条结果`;
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
- 已有内部知识的问答

---

## Migration Notes (v1.0.0 → v1.1.0)

Added Claude Tool Interface support:
- ✅ Zod `inputSchema` for structured parameters
- ✅ `isConcurrencySafe: () => true` (搜索可并发)
- ✅ `isReadOnly: () => true` (只读)
- ✅ `isDestructive: () => false` (非破坏性)
- ✅ Dynamic `description()` with query + options
- ✅ Tool registry compatible format
- ✅ Progress callback support
- ✅ Result rendering method

---

## Usage

### As a Tool (Claude Tool Interface)

```javascript
const { tool } = require('./tavily-search.js');

// Call with context
const result = await tool.call(
  { query: 'AI news', depth: 'advanced', max_results: 10 },
  { sessionId: 'xxx', workingDirectory: '/path' },
  async (toolName) => true,  // canUseTool
  (progress) => console.log(progress.message)  // onProgress
);

// Result format
// { data: { query, answer, results, response_time }, error?: string }
```

### CLI Usage
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
  "query": "原始查询",
  "answer": "AI生成的摘要",
  "results": [
    { 
      "title": "标题", 
      "url": "链接", 
      "content": "内容摘要",
      "score": 0.95
    }
  ],
  "response_time": "0.82s"
}
```

---

## API Reference

### Exports

```javascript
const { search, tool, metadata } = require('./tavily-search.js');

// Legacy API (backward compatible)
const result = await search('query', { depth: 'advanced' });

// Tool API (Claude Tool Interface)
const result = await tool.call(args, context, canUseTool, onProgress);

// Metadata
console.log(metadata);
// { name, version, capabilities, category, trustLevel, maxResultSizeChars }
```

---

## Notes

- Tavily API key is pre-configured in `tavily-search.js`
- Advanced search provides more comprehensive results
- Results include citations and sources
- API endpoint: `https://api.tavily.com/search`
