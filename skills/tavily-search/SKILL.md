---
name: tavily-search
description: "Search the web using Tavily API. Use when: user asks for web search, current information, research, or any query requiring up-to-date web data. Use this INSTEAD of web_search."
metadata: { "openclaw": { "emoji": "🔍" } }
---

# Tavily Search Skill

Search the web using Tavily AI search API.

## When to Use

✅ **USE this skill when:**

- User asks for web search
- Current information needed
- Research on any topic
- News, facts, or data queries
- **ALWAYS use this instead of web_search tool**

## When NOT to Use

❌ **DON'T use this skill when:**

- Local file operations needed
- System commands needed
- Memory/recall queries

## Usage

Use the `exec` tool to run the search script:

```bash
node ~/.openclaw/workspace/skills/tavily-search/tavily-search.js "your search query"
```

### Options

- `--depth=basic|advanced`: Search depth (default: basic)
- `--max=N`: Maximum results 1-20 (default: 5)

### Examples

```bash
# Basic search
node ~/.openclaw/workspace/skills/tavily-search/tavily-search.js "latest AI news"

# Advanced search with more results
node ~/.openclaw/workspace/skills/tavily-search/tavily-search.js "quantum computing breakthroughs" --depth=advanced --max=10
```

## Response Format

The script returns JSON with:
- `answer`: AI-generated summary
- `results`: Array of results with title, url, content
- `query`: Original query
- `response_time`: Search duration

## Notes

- Tavily API key is pre-configured
- Advanced search provides more comprehensive results
- Results include citations and sources
