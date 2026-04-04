---
name: cognee
description: >
  AI Agent 记忆引擎 - 将文档/文本转化为持久化知识图谱。
  当用户描述以下场景时使用：
  - "把文档变成知识图谱"
  - "构建长期记忆"
  - "搜索我的知识库"
  - "让 AI 从反馈中学习"
  - "知识图谱增强 RAG"
  - "跨会话记忆"
  - "提取实体和关系"
metadata:
  openclaw:
    primaryEnv: OPENAI_API_KEY
    requires:
      env:
        - OPENAI_API_KEY
      bins:
        - python3
      pip:
        - cognee
---

# Cognee - AI Agent 记忆引擎

## 核心定位

**Knowledge Engine for AI Agent Memory**

cognee 将原始数据（文档/URL/文本）转化为持久化知识图谱，为 AI Agent 提供长期记忆能力。

**核心流程：**
```
add()     →  摄入数据
cognify() →  构建知识图谱
search()  →  查询记忆
```

## 功能概述

| 功能 | 说明 |
|------|------|
| 知识图谱构建 | 将文档提取为实体-关系图谱 |
| RAG 增强 | 结合向量搜索 + 图谱推理 |
| 跨会话记忆 | Agent 的长期记忆存储 |
| 反馈学习 | 从用户反馈中自我优化 |
| 时间感知 | 支持时序知识图谱 |
| 多数据源 | PDF/URL/repos/文本 |

## 前置要求

### 必需
- **Python 3.10-3.13**（Python 3.14 不支持）
- `pip install cognee`

> ⚠️ **注意**：你的系统当前是 Python 3.14，需要用 Python 3.12 来安装：
> ```bash
> py -3.12 -m pip install cognee
> ```

### 可选（根据存储后端选择）
```bash
# 默认（SQLite + LanceDB，无需额外配置）
pip install cognee

# PostgreSQL + PGVector（生产环境）
pip install "cognee[postgres]"

# Neo4j 图数据库
pip install "cognee[neo4j]"

# ChromaDB 向量库
pip install "cognee[chromadb]"

# 全量安装（含爬虫/LangChain等）
pip install "cognee[scraping,langchain,llama-index,anthropic,gemini]"
```

## 快速开始

### Step 1: 安装

```bash
pip install cognee
```

### Step 2: 配置 LLM（.env）

```bash
# 必需（至少一个）
OPENAI_API_KEY=sk-xxx

# 可选
ANTHROPIC_API_KEY=sk-ant-xxx
LITELLM_API_KEY=xxx
```

### Step 3: 使用核心流程

```python
import cognee
from cognee.api.search import search
from cognee.api.add import add

# 1. 摄入数据
await add(
    "你的文本内容、文件路径、URL、或者文本列表",
    dataset_name="my_knowledge"
)

# 2. 构建知识图谱
await cognee.cognify(datasets="my_knowledge")

# 3. 查询
results = await search(
    "什么是关键洞察？",
    datasets="my_knowledge"
)
```

## 核心 API

### add() - 摄入数据

```python
await cognee.add(
    "文本内容",
    dataset_name="main",       # 数据集名称
    node_set=["default_memory"]  # 记忆分组
)
```

### cognify() - 构建图谱

```python
await cognee.cognify(
    datasets="main",
    prune=True,                # 自动裁剪无效节点
    distinct=True              # 去重
)
```

### search() - 查询

```python
from cognee import SearchType

results = await cognee.search(
    "用户查询内容",
    query_type=SearchType.GRAPH_COMPLETION,  # 图谱补全
    # query_type=SearchType.SUMMARIES,        # 摘要搜索
    # query_type=SearchType.TRIPLES,          # 三元组搜索
    # query_type=SearchType.CHUNKS,           # 文本块搜索
    datasets="main"
)
```

### memify() - 增量更新

```python
# 向已有图谱中增量添加新数据
await cognee.memify(
    "新的文本内容",
    dataset_name="main"
)
```

### delete() - 删除

```python
# 删除数据集
await cognee.delete.dataset("my_dataset")

# 清理所有数据
await cognee.delete.all()
```

## 使用场景

### 场景 1: 文档知识库

```python
# 摄入 PDF 文件
await cognee.add(
    "/path/to/document.pdf",
    dataset_name="docs"
)
await cognee.cognify(datasets="docs")

# 查询
results = await cognee.search("查找关于项目X的内容", datasets="docs")
```

### 场景 2: Agent 长期记忆

```python
# Agent 每次对话后存入记忆
await cognee.add(
    "用户偏好：喜欢简洁回复，不要表情",
    dataset_name="agent_memory",
    node_set=["user_preferences"]
)

# 查询记忆
prefs = await cognee.search(
    "用户的沟通偏好是什么？",
    datasets="agent_memory"
)
```

### 场景 3: 网页内容抓取

```bash
pip install "cognee[scraping]"
```

```python
await cognee.add(
    "https://example.com/article",
    dataset_name="web_content"
)
```

## 工具脚本

本 Skill 提供以下命令行工具：

### 添加数据

```bash
python scripts/add_data.py --text "文本内容" --dataset my_data
python scripts/add_data.py --file /path/to/file.pdf --dataset my_data
python scripts/add_data.py --url "https://example.com" --dataset my_data
```

### 查询知识库

```bash
python scripts/search_graph.py --query "关键洞察" --dataset my_data
python scripts/search_graph.py --query "查询内容" --dataset my_data --type graph_completion
```

### 构建/重建图谱

```bash
python scripts/cognify.py --dataset my_data
python scripts/cognify.py --dataset my_data --rebuild
```

## 数据结构

```
~/.openclaw/workspace/
├── memory/                    # OpenClaw 原生记忆
│   └── 2026-04-04.md
└── cognee_data/              # Cognee 知识图谱数据
    ├── cognee.db            # SQLite 元数据
    ├── lance_db/           # LanceDB 向量库
    └── graphs/             # 知识图谱数据
```

## 已知限制

| 限制 | 说明 |
|------|------|
| LLM 调用 | 需要 OpenAI 或其他支持的 LLM API Key |
| Windows 性能 | 某些数据库后端在 Windows 上性能较差 |
| 中文支持 | 依赖 LLM 的多语言能力 |

## 更多资源

- **官网:** https://cognee.ai
- **GitHub:** https://github.com/topoteretes/cognee
- **文档:** https://cognee.ai/docs
