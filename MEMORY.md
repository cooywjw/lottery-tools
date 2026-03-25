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
- 自动备份时间：每天 20:00

### 模型配置注意事项
- **所有模型必须指向同一个工作区**：`~/.openclaw/workspace`
- 这样 skill 才能跨模型共享使用
- 切换模型后 skill 仍然可用（前提是同一工作区）
- 不同模型的 tool use 能力有差异，需要主动提示使用 skill

### API Keys（已配置）
- Moonshot (Kimi)
- DeepSeek (V3/R1)
- Tavily（网络搜索）
- 飞书机器人

### 飞书集成
- 用户ID：`ou_1b35a7e08c18ad9df24f0491eb2f06e6`
- 状态：已配对，可正常使用

## 进行中的项目

### 公众号
- **名称**：小白聊足球
- **定位**：竞彩数据 + 世界杯资讯
- **状态**：审核中（预计7个工作日）
- **目的**：为彩票店引流

### 自定义 Skills
1. **tavily-search** - 网络搜索（替代 Brave）
2. **memory-manager** - 记忆管理
3. **intent-confirm** - 意图确认
4. **cross-model-memory** - 跨模型记忆
5. **skill-vetter** - 安全检查
6. **free-ride** - OpenRouter 免费模型管理

## 已知问题
- OpenClaw CLI WebSocket 连接有问题（HTTP API 可用）
- OpenClaw 升级失败（命令行和界面都报错）
- 浏览器自动化被反爬虫拦截（京东、淘宝、机票查询）

## 重要决策
1. 使用 GitHub 备份 OpenClaw 配置 ✓
2. 使用 Tavily 替代 Brave 进行网络搜索 ✓
3. 创建 MEMORY.md 实现跨模型记忆 ✓

## 待办事项
- [ ] 等公众号审核通过
- [ ] 解决 OpenClaw 升级问题
- [ ] 每日更新竞彩数据 + 世界杯内容
- [ ] 学习短视频动画制作

## 沟通偏好
- 简洁、直接、步骤清晰
- 不喜欢：绕弯子、模糊不清、长篇大论
