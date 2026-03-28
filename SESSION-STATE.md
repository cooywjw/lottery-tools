# SESSION-STATE.md — Active Working Memory

这个文件是我的"内存" —— 存活于压缩、重启、中断。

**规则**：遇到重要信息时，先写入这个文件，然后再回复用户。

---

## Current Task
当前正在进行的任务
- 提升公众号「慈云小白说球」封面图片质量和吸引力
- 使用免费图库（Unsplash、Pexels、Pixabay、百度图片）获取高质量素材
- Canva 使用困难且需要会员，寻找替代设计工具

## Key Context
- 用户偏好：喜欢简洁直接，不要废话
- 工作时段：每天 12:00-22:00
- 当前项目：公众号「慈云小白说球」运营中

## Pending Actions
- [ ] 无

## Recent Decisions
- 使用 Stable Horde 生成图片（免费，无需 API Key）
- 使用 Tavily 替代 Brave 进行网络搜索

## Important Notes
- 公众号已认证，草稿发布功能正常
- Stable Horde 脚本路径：`scripts/generate_wechat_cover.py`
- 记忆系统配置完成：
  - SESSION-STATE.md：工作记忆（存活于压缩、重启）
  - 使用 WAL 协议：先保存，再回复
  - 重要信息立即写入 SESSION-STATE.md

## Memory System (方案1 - 简单总结)
- 策略：每次会话结束时总结并保存到 memory/YYYY-MM-DD.md
- WAL 协议：重要信息立即写入 SESSION-STATE.md
- 每日文件：记录当天对话和事件
- 长期记忆：重要信息提炼到 MEMORY.md

---

*Last updated: 2026-03-28 17:32*
