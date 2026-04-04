# Coordinator Roles - 专业角色库

本目录存放 Agency Agents 角色文件，可与 Coordinator 配合使用。

## 目录结构

```
roles/
├── README.md              # 本文件
├── engineering/           # 工程部
│   ├── frontend-developer.md
│   └── backend-architect.md
├── marketing/             # 市场部
│   └── growth-hacker.md
├── project-management/    # 项目管理部
│   └── project-manager-senior.md
└── testing/              # 测试部
    └── testing-reality-checker.md
```

## 使用方法

### 方式1：直接加载角色（推荐）

在 spawn 时指定 `--role` 参数，Coordinator 会自动加载对应角色的系统提示词：

```bash
# 使用前端开发角色
node coordinator.js --action spawn \
  --name fe-dev \
  --role frontend-developer \
  --prompt "创建一个React登录组件"

# 使用增长黑客角色
node coordinator.js --action spawn \
  --name growth \
  --role growth-hacker \
  --prompt "为彩票店设计引流方案"
```

### 方式2：手动拼接

读取角色文件和任务描述，手动拼接后传给 spawn。

## 可用角色

| 角色 | 路径 | 用途 |
|------|------|------|
| frontend-developer | engineering/ | 前端开发、React/Vue |
| backend-architect | engineering/ | 后端架构、API设计 |
| growth-hacker | marketing/ | 增长策略、营销自动化 |
| project-manager-senior | project-management/ | 项目规划、任务分解 |
| testing-reality-checker | testing/ | 质量验证、测试分析 |

## 添加新角色

从 ClawHub 安装更多角色：
```bash
npx clawhub inspect agency-agents --file agents/design/ui-designer.md
```

或从其他来源添加 .md 文件到对应目录。
