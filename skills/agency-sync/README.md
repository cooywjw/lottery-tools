# agency-sync 使用说明

## 状态

✅ 已完成！151 个 Agent 同步至 `skills/coordinator/roles/`

## 部门分布

- ENGINEERING: 52 agents
- MARKETING: 15+ agents
- TESTING: 13 agents
- PROJECT-MANAGEMENT: 7 agents
- DESIGN: 8 agents
- PRODUCT: 5 agents
- ACADEMIC: 5 agents
- SPECIALIZED: 10+ agents
- 其他专业部门（BLOCKCHAIN, HEALTHCARE, DATA, etc.）

## 使用方式

### 通过 Coordinator 使用 Agent

```bash
# 使用完整路径
/agent frontend-developer "帮我创建一个 React 登录组件"

/# 使用短名称
/agent growth-hacker "设计一个增长策略"
```

### 命令行工具

```bash
# 列出所有 Agent
node skills/coordinator/roles/role-loader.js list

# 查看特定 Agent
node skills/coordinator/roles/role-loader.js engineering-frontend-developer

# 强制全量同步（从上游重新拉取）
node skills/agency-sync/sync.js full

# 增量更新（检查变更）
node skills/agency-sync/sync.js update
```

## 定时同步

已设置每日 03:00 自动检查上游更新。

## 数据来源

- 上游仓库: https://github.com/msitarzewski/agency-agents
- Stars: 69.6k
- MIT License
- 同步脚本自动克隆并转换格式
