# MEMORY.md - 长期记忆

## 用户档案
- **姓名**：小白大叔
- **昵称**：阿伟
- **位置**：苏州市吴江区
- **工作时段**：每天 12:00~22:00
- **技术能力**：有一定电脑基础，会安装软件、改配置、排错

## 当前目标（2026-04-23 更新）
1. **带货方向**：在各大平台做带货（抖音、小红书等）
2. 熟练使用 OpenClaw 连接各类 AI 模型
3. 用 AI 提升内容创作和运营效率

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

### 模型优先级（当前会话）
- 默认：minimax/MiniMax-M2.7（速度快，但图片理解能力不可用）
- 图片理解：需换用其他模型（见下）
- ⚠️ **MiniMax 模型不支持 image 工具**，遇到图片分析任务需换模型

### 媒体生成配置
- **默认引擎：通义万相** (Tianshu Wan Xiang 2.6)
- **适用范围**：所有生图、生视频任务
- **配置时间**：2026-04-03
- **技能位置**：`~/.openclaw/workspace/skills/tianshu-wan-video/`
- **API状态**：✅ 已配置，key 有效（更新了 endpoint 和请求格式）

### Computer Use Skill（2026-04-10 已删除）
**原因**: 用户反馈"不好用"，已彻底删除
**原目录**: `~/.openclaw/workspace/skills/computer-use/`
**删除时间**: 2026-04-10 19:34
**状态**: ❌ 已移除

### 公众号排版规范（2026-04-13 确定）
**卡片式表格排版要求：**
1. 表格卡片：圆角(10px) + 阴影 + 渐变色标题栏
2. 联赛标签：渐变色胶囊标签（每个联赛对应颜色：英超绿、意甲深绿、德甲红、日职蓝、澳超红、西甲红、荷甲橙、法甲紫、韩职红、挪超蓝、葡超蓝、美职蓝、德乙红）
3. 赛果标签：绿色（主胜）/ 橙色（平局）/ 绿色（客胜）胶囊
4. 前瞻倾向：渐变色胶囊标签
5. 两部分之间：渐变分隔线（透明→灰→透明）
6. 关键结论：用对应联赛色高亮

**联赛颜色对应：**
- 英超：#27ae60（绿）
- 意甲：#27ae60（深绿）
- 德甲/德乙：#e74c3c（红）
- 日职：#3498db（蓝）
- 澳超：#e74c3c（红）
- 西甲：#e74c3c（红）
- 荷甲：#f39c12（橙）
- 法甲：#9b59b6（紫）
- 韩职：#e74c3c（红）
- 挪超：#3498db（蓝）
- 葡超：#3498db（蓝）
- 美职：#3498db（蓝）

### 图片生成工作流（2026-04-07 新总结）
- **配图策略**（用户确定）：
  - 每场 2 张图
  - 首选项：两队代表性球员真实照片
  - 次选项：比赛经典镜头 / 整队合照
- **真实球员照片获取**：困难（Wikipedia 429限速，Getty 等商业图库无法直接爬）
- **可稳定执行**：HTML → Chrome 截图生成数据对比图（完全可行）
- **用户建议**：用户发参考图给我，我负责上传 + 排版（效率最高）

### API Keys（已配置）
- Moonshot (Kimi)
- DeepSeek (V3/R1)
- Tavily（网络搜索）
- 飞书机器人
- 微信公众号 AppID: `wxfb1dc014e68f77a6`

### 飞书集成
- 用户ID：`ou_1b35a7e08c18ad9df24f0491eb2f06e6`
- 状态：已配对，可正常使用

## 进行中的项目

### OpenNana 提示词采集 (2026-04-07 ✅ 完成)
- **网址**：https://opennana.com/awesome-prompt-gallery
- **总数**：3613 条提示词
- **采集方式**：Chrome 远程调试 + CDP Python 客户端（websocket-client）
- **Chrome 启动**：`--remote-debugging-port=9222 --user-data-dir=TestProfile --remote-allow-origins=*`
- **脚本**：`C:\Users\Administrator\.openclaw\workspace\tmp_img\cdp_full.py` → `merge_data.py`
- **采集结果（2026-04-07 完成）**：
  - 3613 条全部采集完成
  - 中文提示词：1914 条（59.6%）
  - 英文提示词：3598 条（99.6%）
  - 有标签：3063 条（84.8%）
  - 分类 CSV：387 个分类
- **G 盘文件**：
  - `prompts_full.json`（11MB）- 完整数据含提示词
  - `prompts_total.csv`（10MB）- 完整数据 CSV
  - `prompts_total.csv`（旧版，无提示词）- 可删除
  - `分类_*.csv`（387个）- 按标签分类
  - `分类索引.json` - 分类统计

### 公众号「绿茵有运」
- **名称**：绿茵有运
- **定位**：~~竞彩数据 + 足球资讯 + 彩票店引流~~ → **已停更（目标转向带货）**

### OpenClaw 进化计划（Claude Code 源码复刻）
- **启动时间**：2026-04-02
- **源码位置**：`D:\work\projects\claude-code-source\`（222MB）
- **项目背景**：基于 Claude Code 泄露源码（1,900文件/512K行TS），分3个Phase复刻核心架构

#### Phase 1：工具系统重构
- **状态**：✅ **核心产出完成**（2026-04-05）
- **目标**：创建 `claude-tool-interface` Skill，统一工具接口规范
- **产出文件**：
  - `skills/claude-tool-interface/SKILL.md` — 接口规范说明 ✅
  - `skills/claude-tool-interface/SCHEMA.md` — TypeScript 接口定义 ✅
  - `skills/claude-tool-interface/REGISTRY.md` — 工具注册规范 ✅
  - `skills/claude-tool-interface/MIGRATION_GUIDE.md` — 迁移指南 ✅
  - `skills/claude-tool-interface/TOOL_TEMPLATE.md` — 创建模板 ✅
  - `TOOL_REGISTRY.json` — 全局工具注册表 ✅ (2026-04-05 新增)
- **已迁移 Skill**：
  - ✅ context-manager — 完整 Claude Tool Interface (context-manager.js)
  - ✅ tavily-search — 完整 Claude Tool Interface (tavily-search.js)
  - ✅ wechat-publisher — 已有 claude_tool_interface 标记
  - ✅ memory-manager — 完整 Claude Tool Interface (memory-manager.js, 2026-04-05)
- **待补充**：工具发现流程集成（OpenClaw 启动时扫描 skills/*/SKILL.md）

#### Phase 2：多Agent编排
- **状态**：✅ **核心功能已完成**（2026-04-02）**+ 角色集成**（2026-04-04）**+ 151 Agent 全量同步**（2026-04-10）
- **目标**：实现 Coordinator Mode + agent_spawn/list/send/stop
- **产出**：
  - `D:\work\projects\claude-code-source/PHASE2_COORDINATOR_DESIGN.md` — 设计文档
  - `skills/coordinator/coordinator.js` — **统一入口** ✅
  - `skills/coordinator/SKILL.md` — 技能说明
  - `skills/coordinator/SYSTEM_PROMPT.md` — Coordinator 系统提示词
  - `skills/coordinator/team-state.js` — Agent 注册表
  - `skills/coordinator/team-state.json` — 持久化状态
  - `skills/coordinator/roles/role-loader.js` — **角色加载器** ✅（2026-04-04新增）
  - `skills/agency-sync/` — **上游同步 Skill** ✅（2026-04-10新增）
    - 151 个 Agent 同步自 msitarzewski/agency-agents（69.6k stars）
    - 覆盖 37 个专业部门
- **已实现功能**：
  - `spawn` — 创建并行 Worker Agent（最多3个并发）
  - `send` — 向运行中的 Agent 发送消息
  - `list` — 列出团队所有 Agent
  - `stop` — 停止运行中的 Agent
  - `status` — 查看团队整体状态
  - `--role` 参数 — 加载 agency-agents 专业角色人设
- **Gateway API**：通过 `/tools/invoke` 调用 `sessions_spawn/sessions_send`
- **下一步**：集成到 OpenClaw 工具系统，实现任务通知回调

#### Phase 3：上下文与命令系统
- **状态**：✅ **autoCompact 完成**（2026-04-05）
- **目标**：autoCompact + slash-commands + 成本追踪
- **产出**：
  - `skills/context-manager-1.0.0/compact/autoCompact.js` — **自动压缩引擎** ✅
    - 支持 action: check / summary / dry-run / compact
    - 触发阈值：180K tokens（check）
    - DeepSeek LLM 生成摘要，保存到 memory/YYYY-MM-DD.md
    - 关键修复：sessions_history 返回 content[0].text 而非 content[0].content
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
5. **workflow-engine** - 工作流引擎（工具串联自动化）✅ (2026-04-05)
6. **skill-vetter** - 安全检查
7. **free-ride** - OpenRouter 免费模型管理
8. **context-manager** - 上下文监控与管理 ✓ (v1.0.0 已部署)
9. **claude-tool-interface** - 统一工具接口规范 ✓ (v1.0.0 新建，2026-04-02)
10. **cli-anything** - CLI 生成工具 ✓ (v0.1.0 新安装，2026-04-03)
    - 用途：将 GUI 应用转换为 AI 可用的命令行接口
11. **coordinator** - 多Agent编排引擎 ✓ (2026-04-02，含角色集成，2026-04-04)
    - 新增：支持 `--role` 参数加载 agency-agents 专业角色
    - 角色库：`roles/engineering/`, `roles/marketing/`, `roles/project-management/`, `roles/testing/`
12. **agency-agents** - ✅ 已完全集成 (2026-04-10 完成)
    - 来源：msitarzewski/agency-agents (69.6k stars, MIT)
    - 本地路径：`skills/coordinator/roles/`
    - 同步方式：`skills/agency-sync/sync.js`
    - **Agent 数量：151 个**（覆盖 37 个部门）
    - 主要部门：engineering(52), marketing(15+), testing(13), design(8), 等
    - 使用方式：`/agent <角色名>` 或 Coordinator `--role` 参数
    - 定时同步：每日 03:00 自动增量更新
    - 注册表：`skills/agency-sync/registry.json`
13. **auto-router** - 智能路由引擎 ✓ (2026-04-10 新建)
    - 关键词匹配：60+ 规则覆盖营销/工程/测试/产品
    - LLM 兜底：未知任务自动判断合适 Agent
    - 调用：`node skills/auto-router/router.js route "<消息>"`
14. **cognee** - AI记忆引擎 ✓ (2026-04-05 功能测试通过!)
    - 来源：topoteretes/cognee（14.9k stars）
    - 功能：文本→知识图谱，Agent长期记忆
    - ⚠️ Python 3.14 不兼容，必须用 Python 3.12（`py -3.12`）
    - 状态：✅ 已完成！Pipeline 全部任务通过（add_data_points、extract_graph_from_data、summarize_text）
    - **关键修复**：
      - HuggingFace 超时 → 使用 `HF_ENDPOINT=https://hf-mirror.com`
      - 向量维度 3072 vs 384 → patch `cfg.embedding_dimensions = 384`
      - LanceDB schema 冲突 → 删除 `.cognee_system/databases` 重新初始化
    - 测试脚本：`test_cognee.py`（dataset: test_dataset_v4）

## 已知问题
- OpenClaw CLI WebSocket 连接有问题（HTTP API 可用）
- OpenClaw 升级失败（命令行和界面都报错）
- 浏览器自动化被反爬虫拦截（京东、淘宝、机票查询）
- Wikipedia 下载图片 429 限速（真实球员照片获取困难）
- MiniMax 模型不支持 image 工具（图片分析需换用其他模型）

## 重要决策
1. 使用 GitHub 备份 OpenClaw 配置 ✓
2. 使用 Tavily 替代 Brave 进行网络搜索 ✓
3. 创建 MEMORY.md 实现跨模型记忆 ✓
4. 删除 Ollama 模型配置，改用 DeepSeek R1 作为默认模型 ✓ (2026-03-26)
5. 视频生成方案选择：优先优化通义万相（方案1），上下文满前主动处理压缩 ✓ (2026-03-30)
6. 上下文管理 skill 开发完成：创建 context-manager-1.0.0，包含监控、总结、会话管理功能 ✓ (2026-03-31)
7. Claude Code 源码进化计划启动：Phase 1 进行中，Phase 2/3 设计文档已完成 ✓ (2026-04-02)
8. 生图生视频默认使用通义万相引擎 ✓ (2026-04-03)
9. workflow-engine 工作流引擎：工具串联成自动流水线 ✓ (2026-04-05)
10. **公众号配图策略确定** ✓ (2026-04-07)
    - 每场2张：首选项球员照，次选项经典镜头/整队合照
    - 真实球员照片：用户发给我，我上传+排版（效率最高）
    - 数据对比图：HTML + Chrome 截图（完全可自动执行）
- [x] 等公众号审核通过 ✅ 2026-03-25
- [x] 发布首篇测试文章 ✅ 2026-03-26
- [x] 发布国土比赛分析文章 ✅ 2026-03-31
- [x] **cognee 测试** ✅ 2026-04-05（Pipeline 功能验证通过）
- [x] Phase 1：工具系统重构核心完成 ✅ 2026-04-05（TOOL_REGISTRY + 4个Skill迁移）
- [x] 公众号配图策略确定 ✅ 2026-04-07
- [x] **agency-agents 全量同步** ✅ 2026-04-10（151 Agent，37 部门）
- [x] **auto-router 智能路由** ✅ 2026-04-10（关键词+LLM 双引擎）
- [ ] Phase 1：工具发现流程集成（OpenClaw 启动时自动扫描注册）
- [ ] Phase 3：增强 context-manager（autoCompact）
- [x] ~~配置公众号自动回复和菜单栏~~ → 公众号已停更
- [x] ~~每日更新竞彩数据 + 足球内容~~ → 目标转向带货
- [ ] **下一个大活**（用户即将启动）

## Cognee 安装记录 (2026-04-04)

### 已完成
- ✅ cognee 0.5.7 安装成功 (Python 3.12)
- ✅ DeepSeek LLM API 验证通过 (deepseek/deepseek-chat via litellm)
- ✅ fastembed 0.8.0 安装成功
- ✅ 测试脚本已保存: `test_cognee.py`

### 卡住原因
- ❌ Embedding 模型下载超时 (HuggingFace 访问失败, WinError 10060)
- 原因：网络不稳定，HuggingFace 连接超时

### 配置说明
```python
# LLM: openai provider + deepseek/deepseek-chat (litellm 自动路由)
config.set_llm_provider("openai")
config.set_llm_api_key("sk-11936f8a91394f5a8c549e6e4ccacf4f")
config.set_llm_model("deepseek/deepseek-chat")

# Embedding: fastembed 本地模型 (免费)
config.set_embedding_provider("fastembed")
config.set_embedding_model("BAAI/bge-small-en-v1.5")
```

### 下一步
网络恢复后运行：
```bash
python test_cognee.py
```

### cognee 依赖列表
- lancedb (向量数据库)
- litellm (LLM 路由)
- fastembed (本地 embedding)
- deepseek-chat (LLM)

## 沟通偏好
- 简洁、直接、步骤清晰
- 不喜欢：绕弯子、模糊不清、长篇大论
- **流式回复需求**：用户希望在AI执行任务时能看到实时进度，不用干等。建议：长时间任务前先说"好的，收到，马上开始"，执行中定期发进度消息告知进展

## Promoted From Short-Term Memory (2026-04-22)

<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:5:5 -->
- ### 备注 - role-loader.js 未找到，跳过自动更新 - 后续为增量同步，可对比 registry.json.bak ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: agency-sync 首次全量同步: 时间：2026-04-15 11:45 (UTC 03:45) [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-15.md:27-34]
<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:7:10 -->
- ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: agency-sync 首次全量同步: 时间：2026-04-15 11:45 (UTC 03:45) - confidence: 0.00 - evidence: memory/2026-04-15.md:5-5 - recalls: 0 - status: staged - Candidate: agency-sync 首次全量同步: 同步模式：首次全量克隆（无历史备份）; 同步数量：**173 agents**; 来源：msitarzewski/agency-agents 上游仓库; 输出目录：`skills/agency-sync/coordinator/roles/` [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-15.md:32-39]
<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:11:11 -->
- - recalls: 0 - status: staged - Candidate: agency-sync 首次全量同步: 同步模式：首次全量克隆（无历史备份）; 同步数量：**173 agents**; 来源：msitarzewski/agency-agents 上游仓库; 输出目录：`skills/agency-sync/coordinator/roles/` - confidence: 0.00 - evidence: memory/2026-04-15.md:7-10 - recalls: 0 - status: staged - Candidate: agency-sync 首次全量同步: Registry：`skills/agency-sync/registry.json` [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-15.md:37-44]
<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:14:17 -->
- - recalls: 0 - status: staged - Candidate: agency-sync 首次全量同步: Registry：`skills/agency-sync/registry.json` - confidence: 0.00 - evidence: memory/2026-04-15.md:11-11 - recalls: 0 - status: staged - Candidate: 部门分布: engineering: 24; marketing: 26; sales: 9; testing: 8 [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-15.md:42-49]
<!-- openclaw-memory-promotion:memory:memory/2026-04-15.md:18:21 -->
- - recalls: 0 - status: staged - Candidate: 部门分布: engineering: 24; marketing: 26; sales: 9; testing: 8 - confidence: 0.00 - evidence: memory/2026-04-15.md:14-17 - recalls: 0 - status: staged - Candidate: 部门分布: specialized: 12; product: 5; support: 6; finance: 5 [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-15.md:47-54]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:338:338 -->
- - Candidate: Possible Lasting Truths: No strong candidate truths surfaced. [score=0.838 recalls=0 avg=0.620 source=memory/2026-04-16.md:13-13]

## Promoted From Short-Term Memory (2026-04-23)

<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:348:348 -->
- **【对话摘要】** [score=0.867 recalls=0 avg=0.620 source=memory/2026-04-16.md:348-348]
<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:188:188 -->
- - Candidate: Possible Lasting Truths: - Candidate: Assistant: **飞书插件状态正常：** - ✅ 配置完整（channels.feishu + plugins.entries.feishu） - ✅ 已安装（extensions/feishu） - ✅ Gateway 运行正常 - ✅ 历史日志显示飞书连接正常（之前测试过） 之前出现的警告： - `duplicate plugin id detected` — 只是警告，飞书功能不受影响 - `qwen-portal-auth not found` — 已清理，不影响 [score=0.861 recalls=0 avg=0.620 source=memory/2026-04-17.md:13-13]
<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:192:194 -->
- - Candidate: 2026-04-17 12:48 (Asia/Shanghai): 文章整体不错，但编号与场次的球队对应不上。; 五001应为墨尔本胜利vs纽卡斯尔喷气机，而不是塞尔塔vs弗赖堡。; 场次信息需要去竞彩官网搜索确认。 - confidence: 0.00 - evidence: memory/2026-04-17.md:277-279 [score=0.861 recalls=0 avg=0.620 source=memory/2026-04-17.md:18-20]
<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:196:196 -->
- - Candidate: 2026-04-17 13:10 (Asia/Shanghai): 用户发送了一个问号，表示可能有疑问或需要进一步的确认。 [score=0.861 recalls=0 avg=0.620 source=memory/2026-04-17.md:23-23]

## Promoted From Short-Term Memory (2026-04-24)

<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:199:200 -->
- - Candidate: 2026-04-17 13:23 (Asia/Shanghai): 刚才断网了，现在已经恢复。; 询问是否可以继续之前的任务。 - confidence: 0.00 [score=0.885 recalls=0 avg=0.620 source=memory/2026-04-17.md:28-29]
<!-- openclaw-memory-promotion:memory:memory/2026-04-18.md:5:8 -->
- ## 备注 - 当前环境可能无法直接访问 GitHub - 如需同步，可能需要配置代理或使用镜像源 ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: Agency Sync 任务: **时间**: 2026-04-18 11:06; **状态**: ❌ 失败; **原因**: 网络无法连接 github.com (port 443 timeout after 21s); **操作**: 同步脚本尝试更新 upstream clone 失败，无法拉取最新代码 [score=0.879 recalls=0 avg=0.620 source=memory/2026-04-18.md:9-16]
<!-- openclaw-memory-promotion:memory:memory/2026-04-18.md:11:12 -->
- ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: Agency Sync 任务: **时间**: 2026-04-18 11:06; **状态**: ❌ 失败; **原因**: 网络无法连接 github.com (port 443 timeout after 21s); **操作**: 同步脚本尝试更新 upstream clone 失败，无法拉取最新代码 - confidence: 0.00 - evidence: memory/2026-04-18.md:5-8 - recalls: 0 - status: staged - Candidate: 备注: 当前环境可能无法直接访问 GitHub; 如需同步，可能需要配置代理或使用镜像源 [score=0.879 recalls=0 avg=0.620 source=memory/2026-04-18.md:14-21]
<!-- openclaw-memory-promotion:memory:memory/2026-04-18.md:341:344 -->
- - Candidate: Reflections: Theme: `assistant` kept surfacing across 681 memories.; confidence: 1.00; evidence: memory/.dreams/session-corpus/2026-04-12.txt:2-2, memory/.dreams/session-corpus/2026-04-12.txt:4-4, memory/.dreams/session-corpus/2026-04-12.txt:5-5; note: reflection - confidence: 0.00 - evidence: memory/2026-04-18.md:346-349 - recalls: 0 [score=0.879 recalls=0 avg=0.620 source=memory/2026-04-18.md:26-29]
<!-- openclaw-memory-promotion:memory:memory/2026-04-18.md:345:348 -->
- - Candidate: Reflections: Theme: `user` kept surfacing across 523 memories.; confidence: 0.81; evidence: memory/.dreams/session-corpus/2026-04-12.txt:1-1, memory/.dreams/session-corpus/2026-04-12.txt:3-3, memory/.dreams/session-corpus/2026-04-12.txt:6-6; note: reflection - confidence: 0.00 - evidence: memory/2026-04-18.md:350-353 - recalls: 0 [score=0.879 recalls=0 avg=0.620 source=memory/2026-04-18.md:31-34]
<!-- openclaw-memory-promotion:memory:memory/2026-04-18.md:351:353 -->
- - Candidate: Possible Lasting Truths: - Candidate: Assistant: **飞书插件状态正常：** - ✅ 配置完整（channels.feishu + plugins.entries.feishu） - ✅ 已安装（extensions/feishu） - ✅ Gateway 运行正常 - ✅ 历史日志显示飞书连接正常（之前测试过） 之前出现的警告： - `duplicate plugin id detected` — 只是警告，飞书功能不受影响 - `qwen-portal-auth not found` — 已清理，不影响 - confidence: 0.00 - evidence: memory/2026-04-18.md:356-358 [score=0.879 recalls=0 avg=0.620 source=memory/2026-04-18.md:36-38]
