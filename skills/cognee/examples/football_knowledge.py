"""
Cognee 使用示例 - 足球知识库

演示如何用 cognee 构建足球领域的知识图谱，
用于回答竞彩相关问题。
"""

import asyncio
import cognee
from cognee import SearchType


async def build_football_knowledge():
    """构建足球知识库"""

    # 1. 添加足球相关文本
    texts = [
        "梅西是阿根廷足球运动员，司职前锋，效力于迈阿密国际，曾效力于巴塞罗那和巴黎圣日耳曼。",
        "C罗是葡萄牙足球运动员，司职前锋，效力于利雅得胜利，曾效力于曼联、皇家马德里和尤文图斯。",
        "哈兰德是挪威足球运动员，司职前锋，效力于曼城。",
        "姆巴佩是法国足球运动员，司职前锋，效力于皇家马德里，曾效力于巴黎圣日耳曼。",
        "德甲联赛是德国顶级足球联赛，拜仁慕尼黑是德甲霸主。",
        "英超联赛是英格兰顶级足球联赛，曼城和利物浦是近几个赛季的争冠对手。",
        "西甲联赛是西班牙顶级足球联赛，皇家马德里和巴塞罗那是传统强队。",
        "意甲联赛是意大利顶级足球联赛，尤文图斯是意甲冠军次数最多的球队。",
    ]

    dataset_name = "football_knowledge"

    print("Step 1: Adding texts to knowledge base...")
    for text in texts:
        await cognee.add(text, dataset_name=dataset_name)
    print(f"  Added {len(texts)} texts")

    # 2. 构建知识图谱
    print("\nStep 2: Building knowledge graph...")
    await cognee.cognify(datasets=dataset_name)
    print("  Knowledge graph built!")

    # 3. 查询示例
    queries = [
        "梅西效力过哪些俱乐部？",
        "德甲联赛的霸主是谁？",
        "英超有哪些争冠球队？",
    ]

    print("\nStep 3: Querying knowledge graph...")
    for query in queries:
        print(f"\n  Query: {query}")
        results = await cognee.search(
            query,
            query_type=SearchType.GRAPH_COMPLETION,
            datasets=dataset_name
        )
        if results:
            for i, r in enumerate(results[:2], 1):
                print(f"    [{i}] {r}")
        else:
            print("    (No results)")


async def query_user_preferences():
    """
    场景：作为 Agent 记忆用户偏好

    每次对话后，将用户偏好存入长期记忆。
    下次对话时，可以查询这些记忆。
    """

    dataset_name = "user_memory"
    node_set = "preferences"

    # 存储用户偏好
    print("Storing user preferences...")
    await cognee.add(
        "用户名称是阿伟，在苏州开彩票店，喜欢研究足球和竞彩玩法。",
        dataset_name=dataset_name,
        node_set=[node_set, "user_info"]
    )

    await cognee.add(
        "用户喜欢简洁直接的沟通方式，不喜欢啰嗦。",
        dataset_name=dataset_name,
        node_set=[node_set, "communication"]
    )

    await cognee.add(
        "用户的工作时间是每天12:00-22:00。",
        dataset_name=dataset_name,
        node_set=[node_set, "schedule"]
    )

    # 构建图谱
    await cognee.cognify(datasets=dataset_name)

    # 查询偏好
    print("\nQuerying user preferences...")
    results = await cognee.search(
        "用户的沟通偏好是什么？",
        query_type=SearchType.GRAPH_COMPLETION,
        datasets=dataset_name
    )

    print("\nUser communication preference:")
    if results:
        for r in results[:2]:
            print(f"  - {r}")


async def main():
    print("=" * 60)
    print("Cognee Example: Football Knowledge Base")
    print("=" * 60)
    await build_football_knowledge()

    print("\n" + "=" * 60)
    print("Cognee Example: User Memory")
    print("=" * 60)
    await query_user_preferences()


if __name__ == "__main__":
    asyncio.run(main())
