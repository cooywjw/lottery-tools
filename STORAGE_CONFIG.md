# 存储配置说明

## 存储结构调整 (2026-03-31)

由于C盘空间紧张，已将大文件迁移到D盘，创建了新的工作目录结构：

### D盘工作目录 (D:\work\)
```
D:\work\
├── media\          # 视频、音频、图片等媒体文件
│   ├── lottery_shop.mp4      (2.57MB) - 彩票店宣传视频
│   ├── output-video.mp4      (0.53MB) - 测试视频
│   ├── square-dance-video.mp4 (0.24MB) - 广场舞视频
│   ├── С�������㳡��.mp4    (0.41MB) - 广场舞视频(俄文名)
│   ├── frame1.jpg            (0.02MB) - 测试图片
│   ├── test_frame.jpg        (0.02MB) - 测试图片
│   ├── test_ps.wav           (0.06MB) - 测试音频
│   ├── test-tts.mp3          (0MB)    - 测试TTS
│   ├── test.mp3              (0MB)    - 测试音频
│   └── test_wrapper.mp3      (0.01MB) - 测试包装音频
├── memory\         # 记忆文档备份 (完整副本)
│   ├── 2026-03-20-software-installation.md
│   ├── 2026-03-21-feishu-setup.md
│   ├── 2026-03-31.md (最新)
│   └── context-summaries\ (上下文总结)
└── projects\       # 未来项目文件 (预留)
```

### C盘工作空间 (C:\Users\Administrator\.openclaw\workspace\)
- **保留原样**：所有配置文件和技能保持不变
- **memory文件夹**：继续使用，但已备份到D盘
- **小文件**：文本文件、配置文件等继续保存在C盘

## 文件生成规则

### 1. 媒体文件 (视频、音频、图片)
- **新生成的文件**：自动保存到 `D:\work\media\`
- **命名规则**：`项目名_日期_序号.扩展名` (如: `lottery_20260331_01.mp4`)
- **子文件夹**：可按项目创建子文件夹，如 `D:\work\media\彩票店宣传\`

### 2. 记忆文档
- **主要位置**：`C:\Users\Administrator\.openclaw\workspace\memory\` (继续使用)
- **备份位置**：`D:\work\memory\` (定期手动或自动备份)
- **备份频率**：每周或每月备份一次

### 3. 项目文件
- **新项目**：建议创建在 `D:\work\projects\项目名\`
- **大文件**：所有超过10MB的文件都应放在D盘
- **临时文件**：可在C盘生成，完成后移动到D盘

## 操作指南

### 生成新视频/音频时
```bash
# 示例：生成视频时指定输出路径
ffmpeg -i input.mp4 D:\work\media\output_$(Get-Date -Format "yyyyMMdd").mp4
```

### 备份记忆文件
```bash
# 手动备份
Copy-Item -Path "C:\Users\Administrator\.openclaw\workspace\memory\*" -Destination "D:\work\memory\" -Recurse -Force
```

### 清理C盘空间
```bash
# 查找大文件
Get-ChildItem -Path "C:\Users\Administrator\.openclaw\workspace" -Recurse -File | Where-Object {$_.Length -gt 10MB} | Select-Object Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}, FullName
```

## 空间节省效果
- **已释放C盘空间**：约3.5MB (媒体文件)
- **未来节省**：所有新的大文件都将直接生成在D盘
- **C盘压力**：显著降低，主要存放文本和配置文件

## 注意事项
1. **路径引用**：在代码中引用文件时使用完整路径或环境变量
2. **权限问题**：确保对D:\work有读写权限
3. **备份策略**：定期检查D盘备份是否完整
4. **磁盘监控**：定期检查C盘和D盘剩余空间

## 环境变量 (可选)
可在系统或用户环境变量中添加：
- `WORKSPACE_MEDIA=D:\work\media`
- `WORKSPACE_PROJECTS=D:\work\projects`
- `WORKSPACE_BACKUP=D:\work\memory`

---
**最后更新**: 2026-03-31 01:24
**执行人**: 向天哥
**原因**: C盘空间紧张，优化存储结构