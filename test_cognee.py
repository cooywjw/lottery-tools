"""
Cognee 测试脚本
================
功能：测试 cognee 的 add → cognify → search 完整流程
依赖：
  - cognee 0.5.7
  - fastembed (本地 embedding 模型)
  - DeepSeek API (LLM)
配置：
  - LLM: openai provider + deepseek/deepseek-chat (通过 litellm 路由)
  - Embedding: fastembed + BAAI/bge-small-en-v1.5 (本地, 需要从 HuggingFace 下载)

问题：
  - Embedding 模型下载需要访问 HuggingFace，网络不稳定时会超时
  - 解决方案：等网络恢复后重试，或配置代理

运行：
  $ python test_cognee.py
"""

import os
os.environ['ENABLE_BACKEND_ACCESS_CONTROL'] = 'false'
os.environ['COGNEE_SKIP_CONNECTION_TEST'] = 'true'

import asyncio
from cognee import add, cognify, search, config

async def test_cognee():
    print("=== Cognee 功能测试 ===\n")

    # 配置 LLM: 使用 DeepSeek (通过 litellm 路由)
    config.set_llm_provider("openai")
    config.set_llm_api_key("sk-11936f8a91394f5a8c549e6e4ccacf4f")
    config.set_llm_model("deepseek/deepseek-chat")

    # 配置 Embedding: 使用 Fastembed (本地, 免费)
    config.set_embedding_provider("fastembed")
    config.set_embedding_model("BAAI/bge-small-en-v1.5")

    # 测试文本
    test_data = """
    苏州是中国江苏省的一个地级市，位于长江三角洲地区。
    苏州以其古典园林闻名，包括拙政园、留园等世界文化遗产。
    苏州2023年GDP超过2万亿元，是中国重要的经济中心之一。
    彩票是一种由政府或私人机构发行的合法博彩形式。
    足球是全球最受欢迎的体育运动之一。
    """

    # 步骤1: 添加数据
    print("步骤1: 添加数据...")
    await add(test_data, dataset_name="test_dataset")
    print("数据添加成功!\n")

    # 步骤2: 转换为知识图谱
    print("步骤2: 转换为知识图谱 (cognify)...")
    await cognify(datasets=["test_dataset"])
    print("知识图谱构建成功!\n")

    # 步骤3: 搜索
    print("步骤3: 搜索测试...")
    results = await search("苏州园林")
    print(f"搜索 '苏州园林' 结果: {results}\n")

    results2 = await search("经济")
    print(f"搜索 '经济' 结果: {results2}\n")

    print("=== 测试完成 ===")

if __name__ == "__main__":
    asyncio.run(test_cognee())
