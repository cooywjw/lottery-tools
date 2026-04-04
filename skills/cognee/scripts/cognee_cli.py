#!/usr/bin/env python3
"""
Cognee OpenClaw Skill - 核心工具脚本

用法:
    python cognee_cli.py add --text "文本内容" --dataset my_data
    python cognee_cli.py add --file /path/to/file.pdf --dataset my_data
    python cognee_cli.py add --url "https://example.com" --dataset my_data
    python cognee_cli.py cognify --dataset my_data
    python cognee_cli.py search --query "查询" --dataset my_data
    python cognee_cli.py list
    python cognee_cli.py delete --dataset my_data
"""

import argparse
import asyncio
import os
import sys

# 添加技能目录到路径
SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(SKILL_DIR)

try:
    import cognee
    from cognee import SearchType
except ImportError as e:
    print(f"ERROR: cognee 未安装。")
    print(f"请运行: pip install cognee")
    print(f"或: pip install 'cognee[postgres,neo4j,chromadb]' (完整安装)")
    sys.exit(1)


def setup_data_directory():
    """配置 cognee 使用本地数据目录"""
    cognee_directory = os.path.join(WORKSPACE_DIR, "cognee_data")
    os.makedirs(cognee_directory, exist_ok=True)
    os.chdir(cognee_directory)
    print(f"Cognee data directory: {cognee_directory}")


async def cmd_add(args):
    """添加数据"""
    if args.text:
        print(f"Adding text to dataset '{args.dataset}'...")
        await cognee.add(
            args.text,
            dataset_name=args.dataset,
            node_set=[args.node_set] if args.node_set else ["default"]
        )
    elif args.file:
        if not os.path.exists(args.file):
            print(f"ERROR: File not found: {args.file}")
            return False
        print(f"Adding file to dataset '{args.dataset}'...")
        await cognee.add(
            args.file,
            dataset_name=args.dataset,
            node_set=[args.node_set] if args.node_set else ["default"]
        )
    elif args.url:
        print(f"Fetching URL to dataset '{args.dataset}'...")
        await cognee.add(
            args.url,
            dataset_name=args.dataset,
            node_set=[args.node_set] if args.node_set else ["default"]
        )
    else:
        print("ERROR: Must specify --text, --file, or --url")
        return False

    print(f"Done! Data added to '{args.dataset}'")
    return True


async def cmd_cognify(args):
    """构建知识图谱"""
    print(f"Cognifying dataset '{args.dataset}'...")

    if args.rebuild:
        print("  (Rebuild mode - clearing existing graph first...)")
        try:
            await cognee.delete.dataset(args.dataset)
            print("  Existing graph cleared.")
        except Exception as e:
            print(f"  Note: {e}")

    await cognee.cognify(datasets=args.dataset)
    print(f"Done! Knowledge graph built for '{args.dataset}'")
    return True


async def cmd_search(args):
    """查询知识图谱"""
    type_map = {
        "graph_completion": SearchType.GRAPH_COMPLETION,
        "summaries": SearchType.SUMMARIES,
        "triples": SearchType.TRIPLES,
        "chunks": SearchType.CHUNKS,
    }
    search_type = type_map.get(args.type, SearchType.GRAPH_COMPLETION)

    print(f"Searching dataset '{args.dataset}' for: {args.query}")
    print(f"Search type: {args.type}")

    results = await cognee.search(
        args.query,
        query_type=search_type,
        datasets=args.dataset
    )

    print("\n" + "=" * 60)
    print(f"RESULTS for: {args.query}")
    print("=" * 60)

    if results and len(results) > 0:
        for i, result in enumerate(results, 1):
            print(f"\n[{i}] {result}")
    else:
        print("(No results found)")

    print("=" * 60)
    return True


async def cmd_list(args):
    """列出数据集"""
    try:
        from cognee.api.search import list_datasets
        datasets = await list_datasets()
        print("\nAvailable datasets:")
        if datasets:
            for ds in datasets:
                print(f"  - {ds}")
        else:
            print("  (no datasets found)")
        return True
    except Exception as e:
        print(f"Error listing datasets: {e}")
        return False


async def cmd_delete(args):
    """删除数据集"""
    try:
        await cognee.delete.dataset(args.dataset)
        print(f"Dataset '{args.dataset}' deleted.")
        return True
    except Exception as e:
        print(f"Error deleting dataset: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Cognee OpenClaw Skill - AI Agent Memory Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # add
    p = subparsers.add_parser("add", help="Add data to knowledge base")
    p.add_argument("--text", help="Text content to add")
    p.add_argument("--file", help="File path to add")
    p.add_argument("--url", help="URL to fetch and add")
    p.add_argument("--dataset", required=True, help="Dataset name")
    p.add_argument("--node_set", default="default", help="Node set label (default: default)")

    # cognify
    p = subparsers.add_parser("cognify", help="Build knowledge graph from dataset")
    p.add_argument("--dataset", required=True, help="Dataset name")
    p.add_argument("--rebuild", action="store_true", help="Rebuild from scratch")

    # search
    p = subparsers.add_parser("search", help="Search knowledge graph")
    p.add_argument("--query", required=True, help="Search query")
    p.add_argument("--dataset", required=True, help="Dataset name")
    p.add_argument("--type", default="graph_completion",
                   choices=["graph_completion", "summaries", "triples", "chunks"],
                   help="Search type (default: graph_completion)")

    # list
    subparsers.add_parser("list", help="List all datasets")

    # delete
    p = subparsers.add_parser("delete", help="Delete a dataset")
    p.add_argument("--dataset", required=True, help="Dataset name")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        print("\n--- Quick Examples ---")
        print("  python cognee_cli.py add --text 'Hello world' --dataset test")
        print("  python cognee_cli.py cognify --dataset test")
        print("  python cognee_cli.py search --query 'hello' --dataset test")
        sys.exit(1)

    # 设置数据目录
    setup_data_directory()

    # 执行命令
    commands = {
        "add": cmd_add,
        "cognify": cmd_cognify,
        "search": cmd_search,
        "list": cmd_list,
        "delete": cmd_delete,
    }

    if args.command in commands:
        success = asyncio.run(commands[args.command](args))
        sys.exit(0 if success else 1)
    else:
        print(f"Unknown command: {args.command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
