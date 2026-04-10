---
name: agency-sync
description: 同步 msitarzewski/agency-agents 上游仓库，保持本地 Agent 人格文件与上游同步。支持首次全量同步和增量更新。
version: 1.0.0
author: 天哥
license: MIT
tags: [agency-agents, sync, upstream]
---

# agency-sync - agency-agents 上游同步

## 功能概述

将 msitarzewski/agency-agents（69.6k stars，112 个 Agent）同步到本地，作为 Coordinator 的角色库使用。

## 工作目录

```
skills/agency-sync/
├── SKILL.md
├── sync.js          # 核心同步脚本
├── converter.js     # Markdown 格式转换
├── auto-registry.js # 自动生成 ROLE_MAP
└── README.md        # 使用说明
```

同步后的 Agent 文件存放于：
```
skills/coordinator/roles/
```

## 使用命令

```bash
# 首次全量同步（需要网络）
node skills/agency-sync/sync.js full

# 增量更新（检查上游变更）
node skills/agency-sync/sync.js update

# 仅列出可用 Agent
node skills/agency-sync/sync.js list

# 重建角色注册表
node skills/agency-sync/auto-registry.js
```

## 定时同步

通过 cron 每日检查上游更新：
- 每日 03:00 检查（低峰期）
- 仅当上游有变更时重新下载
- 变更记录写入 memory/YYYY-MM-DD.md

## 注意事项

- 上游为 MIT 协议，可自由使用
- 本地修改不会自动覆盖（转换后的文件与上游分离）
- 如需重置，重新运行 `sync.js full`
