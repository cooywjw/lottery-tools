# Cognee OpenClaw Skill

AI Agent 记忆引擎 - 将文档/文本转化为持久化知识图谱。

## 安装

```bash
pip install cognee
```

可选（支持更多存储后端）：
```bash
pip install "cognee[postgres,neo4j,chromadb,scraping]"
```

## 环境变量

在 `.env` 文件或系统环境变量中设置：

```bash
OPENAI_API_KEY=sk-xxx  # 必需（至少一个 LLM）
# ANTHROPIC_API_KEY=sk-ant-xxx
# LITELLM_API_KEY=xxx
```

## 快速开始

### 命令行工具

```bash
# 1. 添加数据
python scripts/cognee_cli.py add --text "梅西是阿根廷足球运动员" --dataset football

# 2. 构建知识图谱
python scripts/cognee_cli.py cognify --dataset football

# 3. 查询
python scripts/cognee_cli.py search --query "梅西是谁" --dataset football

# 4. 列出数据集
python scripts/cognee_cli.py list

# 5. 删除数据集
python scripts/cognee_cli.py delete --dataset football
```

### Python API

```python
import cognee
from cognee import SearchType

# 添加数据
await cognee.add(
    "梅西是阿根廷足球运动员，效力于迈阿密国际",
    dataset_name="football"
)

# 构建图谱
await cognee.cognify(datasets="football")

# 查询
results = await cognee.search(
    "梅西效力于哪支球队？",
    query_type=SearchType.GRAPH_COMPLETION,
    datasets="football"
)
```

## 数据存储位置

```
~/.openclaw/workspace/cognee_data/
├── cognee.db           # SQLite 元数据
├── lance_db/          # LanceDB 向量库
└── graphs/            # 知识图谱
```

## OpenClaw 集成

在 OpenClaw 中使用时，可以：

1. **通过 exec 工具调用 Python 脚本**
2. **直接通过 subprocess 调用 CLI**
3. **作为 Skill 工具集成到 Agent 工作流**

详见 SKILL.md
