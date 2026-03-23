# OpenClaw 配置备份

此目录包含 OpenClaw 的重要配置文件，用于换电脑时恢复。

## 文件说明

### openclaw-config/
- `openclaw.json` - 主配置文件（模型、API Key、插件等）
- `exec-approvals.json` - 执行命令审批记录

### workspace/
- `SOUL.md` - AI 性格设定
- `IDENTITY.md` - AI 身份信息
- `USER.md` - 用户档案
- `AGENTS.md` - 工作空间规则
- `TOOLS.md` - 工具配置
- `HEARTBEAT.md` - 定时任务配置

### memory/
- `main.sqlite` - 记忆数据库
- `YYYY-MM-DD.md` - 每日记忆文件

## 恢复步骤

1. 在新电脑安装 OpenClaw
2. 复制 `openclaw-config/openclaw.json` 到 `~/.openclaw/`
3. 复制 `workspace/` 内容到 `~/.openclaw/workspace/`
4. 复制 `memory/` 内容到 `~/.openclaw/memory/`
5. 重启 OpenClaw Gateway

## 注意事项

- API Key 已包含在配置中，注意保密
- 定期更新此仓库以保持备份最新
