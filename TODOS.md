# TODOS.md - 任务跟踪

## 当前项目：Phase 3 · context-manager 增强（autoCompact）

### 状态
- Phase 1 ✅ 工具系统重构核心完成（2026-04-05）
- Phase 2 ✅ 多Agent编排完成（2026-04-04）
- Phase 3 🔄 进行中（autoCompact）

### Phase 3 目标
- 当上下文使用率超过阈值时，自动触发压缩
- 触发阈值：180K tokens
- 压缩目标：40K tokens
- LLM 生成摘要，保留关键上下文

---

## 公众号「绿茵有运」

### ✅ 已完成
- [x] 新账号注册（AppID: wxd45ed6706fa1547d）
- [x] 首篇文章发布（2026-03-26）
- [x] 竞彩早场文章发布（2026-04-05 001~005）
- [x] 竞彩晚场文章发布（2026-04-05 晚场）
- [x] 封面图生成（含AI水印）
- [x] 晚场封面图 1280×500 + 水印 50%

### 🔄 进行中
- [ ] 配置公众号自动回复和菜单栏
- [ ] 每日更新竞彩数据 + 足球内容（每日）

---

## OpenClaw 进化计划

### ✅ Phase 1：工具系统重构（2026-04-05 完成）
- [x] claude-tool-interface Skill 创建
- [x] SCHEMA.md / REGISTRY.md / MIGRATION_GUIDE.md / TOOL_TEMPLATE.md
- [x] TOOL_REGISTRY.json 全局注册表
- [x] context-manager 迁移完成
- [x] tavily-search 迁移完成
- [x] wechat-publisher 已有接口标记
- [x] memory-manager 新增 Claude Tool Interface

### ✅ Phase 2：多Agent编排（2026-04-04 完成）
- [x] coordinator Skill 创建
- [x] spawn / list / send / stop / status 命令
- [x] 角色加载器（agency-agents 集成）

### 🔄 Phase 3：上下文与命令系统
- [x] autoCompact 自动压缩引擎 ✅（2026-04-05）
- [x] slash-commands 完善 ✅
- [ ] 成本追踪 Skill

### 🔄 短视频杂货铺方向
- [x] 确定内容方向（避开彩票）✅
- [x] 每日爆款推送定时任务 ✅
- [ ] 测试飞书推送（待明天10点自动触发）
- [ ] 确定第一个视频选题并开始制作
- [ ] B站/抖音账号搭建（如果还没注册）

---

## 待办事项（按优先级）

### 高优先级
- [x] Phase 3 autoCompact 开发和集成 ✅
- [x] workflow-engine 工作流引擎 ✅ (2026-04-05)
- [ ] 公众号菜单栏配置（底部菜单 + 关键词自动回复）
- [ ] OpenClaw 工具发现流程集成（启动时扫描 skills/*/SKILL.md）

### 中优先级
- [ ] 每日竞彩文章发布（早场 + 晚场）
- [ ] 短视频内容制作（竞彩分析 / 足球资讯）
- [ ] cross-model-memory 集成测试

### 低优先级
- [ ] OpenClaw 升级问题排查
- [ ] free-ride OpenRouter 免费模型优化

---

## 技能清单（已完成）

| 技能 | 版本 | 用途 |
|------|------|------|
| context-manager | 1.0.0 | 上下文监控与压缩 |
| tavily-search | 1.1.0 | 网络搜索 |
| wechat-publisher | 1.0.0 | 公众号发布 |
| memory-manager | 1.0.0 | 记忆管理 |
| coordinator | - | 多Agent编排 |
| cognee | 0.5.7 | 知识图谱/长期记忆 |
| tianshu-wan-video | - | 通义万相生图/视频 |

---

**最后更新**: 2026-04-05 17:18 (Asia/Shanghai)
