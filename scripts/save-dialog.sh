#!/bin/bash
# save-dialog.sh - 手动保存对话脚本
# 用法: ./save-dialog.sh "对话内容摘要" [--important]

DIALOG_CONTENT="$1"
IMPORTANT_FLAG="$2"
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)
MEMORY_DIR="$HOME/.openclaw/workspace/memory"
LONG_TERM="$HOME/.openclaw/workspace/MEMORY.md"

# 确保目录存在
mkdir -p "$MEMORY_DIR"

# 保存到每日笔记
echo "" >> "$MEMORY_DIR/$DATE.md"
echo "### $TIME [手动保存]" >> "$MEMORY_DIR/$DATE.md"
echo "$DIALOG_CONTENT" >> "$MEMORY_DIR/$DATE.md"
echo "" >> "$MEMORY_DIR/$DATE.md"

# 如果是重要内容，同时保存到长期记忆
if [ "$IMPORTANT_FLAG" == "--important" ]; then
    echo "" >> "$LONG_TERM"
    echo "## $(date +%Y-%m-%d) $TIME" >> "$LONG_TERM"
    echo "$DIALOG_CONTENT" >> "$LONG_TERM"
    echo "[已同步到长期记忆]"
fi

echo "✅ 对话已保存到 memory/$DATE.md"
