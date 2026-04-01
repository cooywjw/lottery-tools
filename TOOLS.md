# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

### Web Search

- **Tavily** (默认): 已配置，使用 MCP 服务器
  - 脚本位置: `~/.openclaw/workspace/skills/tavily-search/tavily-search.js`
  - Skill 位置: `~/.openclaw/workspace/skills/tavily-search/SKILL.md`
  - 使用方法: `node C:/Users/Administrator/.openclaw/workspace/skills/tavily-search/tavily-search.js "搜索内容"`
  - 选项: `--depth=basic|advanced`, `--max=N`

---

Add whatever helps you do your job. This is your cheat sheet.

---

### 文件存储配置 (2026-03-31 新增)

由于C盘空间紧张，已创建D盘工作目录：

#### D盘工作目录
- **媒体文件**: `D:\work\media\` - 视频、音频、图片等大文件
- **记忆备份**: `D:\work\memory\` - memory文件夹完整备份
- **项目文件**: `D:\work\projects\` - 未来项目文件

#### 文件生成规则
1. **新视频/音频**: 自动保存到 `D:\work\media\`
2. **命名格式**: `项目名_日期_序号.扩展名` (如: `lottery_20260331_01.mp4`)
3. **记忆文件**: 继续使用C盘原位置，定期备份到D盘
4. **大文件**: 所有超过10MB的文件都应放在D盘

#### 常用命令
```powershell
# 查看C盘大文件
Get-ChildItem -Path "C:\Users\Administrator\.openclaw\workspace" -Recurse -File | Where-Object {$_.Length -gt 10MB} | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}, FullName

# 备份记忆文件
Copy-Item -Path "C:\Users\Administrator\.openclaw\workspace\memory\*" -Destination "D:\work\memory\" -Recurse -Force

# 生成视频到D盘
ffmpeg -i input.mp4 D:\work\media\output_$(Get-Date -Format "yyyyMMdd").mp4
```

#### 已迁移文件
- `lottery_shop.mp4` (2.57MB) → D:\work\media\
- `output-video.mp4` (0.53MB) → D:\work\media\
- 其他多个媒体文件 → D:\work\media\
- memory文件夹完整备份 → D:\work\memory\

**详细配置**: 参见 `STORAGE_CONFIG.md`
