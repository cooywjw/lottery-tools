# MEMORY.md - 长期记忆

## 用户档案
- **姓名**：小白大叔
- **昵称**：阿伟
- **身份**：彩票店业主 / 自由职业
- **位置**：苏州市吴江区
- **工作时段**：每天 12:00~22:00
- **技术能力**：有一定电脑基础，会安装软件、改配置、排错

## 当前目标
1. 熟练使用 OpenClaw 连接各类 AI 模型
2. 稳定运行本地大模型
3. 用 AI 提升学习/工作效率
4. 为彩票店引流获客（公众号、短视频）

## 重要配置

### OpenClaw
- Gateway 端口：18789
- 工作区：`~/.openclaw/workspace`
- 备份仓库：https://github.com/cooywjw/lottery-tools
- **自动备份时间：每天 20:00**（cron 任务：daily-backup-openclaw）
- 备份内容：workspace/、memory/、skills/、openclaw-config/

### 模型配置注意事项
- **所有模型必须指向同一个工作区**：`~/.openclaw/workspace`
- 这样 skill 才能跨模型共享使用
- 切换模型后 skill 仍然可用（前提是同一工作区）
- 不同模型的 tool use 能力有差异，需要主动提示使用 skill

### 媒体生成配置
- **默认引擎：通义万相** (Tianshu Wan Xiang 2.6)
- **适用范围**：所有生图、生视频任务
- **配置时间**：2026-04-03
- **技能位置**：`~/.openclaw/workspace/skills/tianshu-wan-video/`
- **API状态**：✅ 已配置，key 有效（更新了 endpoint 和请求格式）

### API Keys（已配置）
- Moonshot (Kimi)
- DeepSeek (V3/R1)
- Tavily（网络搜索）
- 飞书机器人

### 飞书集成
- 用户ID：`ou_1b35a7e08c18ad9df24f0491eb2f06e6`
- 状态：已配对，可正常使用

## 进行中的项目

### 公众号「绿茵有运」
- **名称**：绿茵有运
- **定位**：竞彩数据 + 足球资讯 + 彩票店引流
- **状态**：原账号「慈云小白说球」已被永久封禁，新账号启用
- **AppID**：`wxd45ed6706fa1547d`（同原账号）
- **运营计划**：
  - 内容方向：每日竞彩推荐、赛事分析、足球资讯
  - 更新频率：每日1-2篇
  - 互动方式：评论区互动、菜单栏引导到店
  - 变现路径：内容引流 → 关注公众号 → 到店购彩

### OpenClaw 进化计划（Claude Code 源码复刻）
- **启动时间**：2026-04-02
- **源码位置**：`D:\work\projects\claude-code-source\`（222MB）
- **项目背景**：基于 Claude Code 泄露源码（1,900文件/512K行TS），分3个Phase复刻核心架构

#### Phase 1：工具系统重构
- **状态**：进行中
- **目标**：创建 `claude-tool-interface` Skill，统一工具接口规范
- **产出文件**：
  - `skills/claude-tool-interface/SKILL.md` — 接口规范说明
  - `skills/claude-tool-interface/SCHEMA.md` — TypeScript 接口定义
  - `skills/claude-tool-interface/REGISTRY.md` — 工具注册规范
  - `skills/claude-tool-interface/MIGRATION_GUIDE.md` — 迁移指南
  - `skills/claude-tool-interface/TOOL_TEMPLATE.md` — 创建模板
  - `D:\work\projects\claude-code-source/PHASE1_TOOL_SCHEMA.md` — 设计文档
- **下一步**：迁移 context-manager + tavily-search

#### Phase 2：多Agent编排
- **状态**：✅ **核心功能已完成**（2026-04-02）
- **目标**：实现 Coordinator Mode + agent_spawn/list/send/stop
- **产出**：
  - `D:\work\projects\claude-code-source/PHASE2_COORDINATOR_DESIGN.md` — 设计文档
  - `skills/coordinator/coordinator.js` — **统一入口** ✅
  - `skills/coordinator/SKILL.md` — 技能说明
  - `skills/coordinator/SYSTEM_PROMPT.md` — Coordinator 系统提示词
  - `skills/coordinator/team-state.js` — Agent 注册表
  - `skills/coordinator/team-state.json` — 持久化状态
- **已实现功能**：
  - `spawn` — 创建并行 Worker Agent（最多3个并发）
  - `send` — 向运行中的 Agent 发送消息
  - `list` — 列出团队所有 Agent
  - `stop` — 停止运行中的 Agent
  - `status` — 查看团队整体状态
- **Gateway API**：通过 `/tools/invoke` 调用 `sessions_spawn/sessions_send`
- **下一步**：集成到 OpenClaw 工具系统，实现任务通知回调

#### Phase 3：上下文与命令系统
- **状态**：✅ **核心功能已完成**（2026-04-02）
- **目标**：autoCompact + slash-commands + 成本追踪
- **产出**：
  - `skills/context-manager-1.0.0/compact/autoCompact.js` — **自动压缩引擎** ✅
    - 触发阈值：180K tokens
    - 压缩目标：40K tokens
    - LLM 生成摘要
  - `skills/slash-commands/` — **斜杠命令系统** ✅
    - `/help`, `/status`, `/context`, `/compact`
    - `/task`, `/model`, `/memory`, `/clear`
- **待实现**：
  - 成本追踪 Skill（API 使用计费）
- **产出**：`D:\work\projects\claude-code-source/PHASE3_CORE_ANALYSIS.md`

## 自定义 Skills
1. **tavily-search** - 网络搜索（替代 Brave）
2. **memory-manager** - 记忆管理
3. **intent-confirm** - 意图确认
4. **cross-model-memory** - 跨模型记忆
5. **skill-vetter** - 安全检查
6. **free-ride** - OpenRouter 免费模型管理
7. **context-manager** - 上下文监控与管理 ✓ (v1.0.0 已部署)
8. **claude-tool-interface** - 统一工具接口规范 ✓ (v1.0.0 新建，2026-04-02)
9. **cli-anything** - CLI 生成工具 ✓ (v0.1.0 新安装，2026-04-03)
   - 用途：将 GUI 应用转换为 AI 可用的命令行接口

## 已知问题
- OpenClaw CLI WebSocket 连接有问题（HTTP API 可用）
- OpenClaw 升级失败（命令行和界面都报错）
- 浏览器自动化被反爬虫拦截（京东、淘宝、机票查询）

## 重要决策
1. 使用 GitHub 备份 OpenClaw 配置 ✓
2. 使用 Tavily 替代 Brave 进行网络搜索 ✓
3. 创建 MEMORY.md 实现跨模型记忆 ✓
4. 删除 Ollama 模型配置，改用 DeepSeek R1 作为默认模型 ✓ (2026-03-26)
5. 视频生成方案选择：优先优化通义万相（方案1），上下文满前主动处理压缩 ✓ (2026-03-30)
6. 上下文管理 skill 开发完成：创建 context-manager-1.0.0，包含监控、总结、会话管理功能 ✓ (2026-03-31)
7. Claude Code 源码进化计划启动：Phase 1 进行中，Phase 2/3 设计文档已完成 ✓ (2026-04-02)
8. 生图生视频默认使用通义万相引擎 ✓ (2026-04-03)

## 待办事项
- [x] 等公众号审核通过 ✅ 2026-03-25
- [x] 发布首篇测试文章 ✅ 2026-03-26
- [x] 发布国土比赛分析文章 ✅ 2026-03-31
- [ ] Phase 1：迁移 context-manager 到新接口
- [ ] Phase 1：迁移 tavily-search 到新接口
- [ ] Phase 1：创建 TOOL_REGISTRY.json
- [ ] Phase 2：实现 coordinator Skill
- [ ] Phase 3：增强 context-manager（autoCompact）
- [ ] 配置公众号自动回复和菜单栏
- [ ] 每日更新竞彩数据 + 足球内容

## 沟通偏好
- 简洁、直接、步骤清晰
- 不喜欢：绕弯子、模糊不清、长篇大论
