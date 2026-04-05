"""
Cognee 测试脚本 v4 - 直接 patch config.embedding_dimensions
"""

import os
os.environ['ENABLE_BACKEND_ACCESS_CONTROL'] = 'false'
os.environ['COGNEE_SKIP_CONNECTION_TEST'] = 'true'
os.environ['HF_ENDPOINT'] = 'https://hf-mirror.com'

import asyncio
from cognee import add, cognify, search, config
from cognee.infrastructure.databases.vector.embeddings.config import get_embedding_config

# 强制清除缓存
get_embedding_config.cache_clear()

# 配置 LLM
config.set_llm_provider("openai")
config.set_llm_api_key("sk-11936f8a91394f5a8c549e6e4ccacf4f")
config.set_llm_model("deepseek/deepseek-chat")

# 配置 Embedding
config.set_embedding_provider("fastembed")
config.set_embedding_model("BAAI/bge-small-en-v1.5")

# 强制覆盖 dimensions（bge-small-en-v1.5 = 384维）
cfg = get_embedding_config()
cfg.embedding_dimensions = 384
print(f"Set embedding_dimensions to: {cfg.embedding_dimensions}")

async def test_cognee():
    print("=== Cognee 功能测试 (v4) ===\n")

    # 测试文本
    test_data = """
    苏州是中国江苏省的一个地级市，位于长江三角洲地区。
    苏州以其古典园林闻名，包括拙政园、留园等世界文化遗产。
    苏州2023年GDP超过2万亿元，是中国重要的经济中心之一。
    """

    # 步骤1: 添加数据（用新名字避免旧schema冲突）
    print("步骤1: 添加数据...")
    await add(test_data, dataset_name="test_dataset_v4")
    print("数据添加成功!")

    # 步骤2: 转换为知识图谱
    print("步骤2: 转换为知识图谱 (cognify)...")
    await cognify(datasets=["test_dataset_v4"])
    print("知识图谱构建成功!")

    # 步骤3: 搜索
    print("步骤3: 搜索测试...")
    results = await search("苏州园林")
    print(f"搜索 '苏州园林' 结果: {results}\n")

    print("=== 测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_cognee())
