#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试修复空白图片问题
"""

import os
import subprocess
from pathlib import Path

def test_chrome_screenshot():
    """测试 Chrome 截图功能"""
    chrome_path = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    
    # 创建测试 HTML
    html_content = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test</title>
  <style>
    body {
      width: 1080px;
      height: 1920px;
      background: linear-gradient(135deg, #0D1B2A 0%, #1E3A5F 50%, #0D1B2A 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 64px;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div>测试内容 - 检查 Chrome 截图</div>
</body>
</html>"""
    
    test_html = Path("test_chrome.html")
    test_png = Path("test_chrome.png")
    
    with open(test_html, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        f"--screenshot={test_png}",
        "--window-size=1080,1920",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        f"file://{test_html.absolute()}"
    ]
    
    print(f"运行命令: {' '.join(cmd)}")
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    print(f"返回码: {result.returncode}")
    print(f"标准输出: {result.stdout}")
    print(f"标准错误: {result.stderr}")
    
    # 检查图片是否生成
    import os
    if os.path.exists(test_png):
        size = os.path.getsize(test_png)
        print(f"图片已生成: {test_png}, 大小: {size} 字节")
    else:
        # 检查当前目录
        print(f"当前目录: {os.getcwd()}")
        print("检查当前目录文件:")
        for f in os.listdir('.'):
            if f.endswith('.png'):
                print(f"  - {f}")
        print("图片未生成")
    
    # 清理
    if test_html.exists():
        test_html.unlink()
    if test_png.exists():
        test_png.unlink()

def test_template_rendering():
    """测试模板渲染"""
    from pathlib import Path
    
    skill_dir = Path(__file__).resolve().parent
    template_path = skill_dir / "templates" / "slide.html"
    
    if not template_path.exists():
        print(f"模板文件不存在: {template_path}")
        return
    
    with open(template_path, "r", encoding="utf-8") as f:
        template = f.read()
    
    # 替换占位符
    html = template.replace("{{SUBTITLE}}", "测试字幕<br>第二行")
    html = html.replace("{{VISUAL}}", "测试画面")
    html = html.replace("{{INDEX}}", "01")
    
    test_html = Path("test_template.html")
    with open(test_html, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"模板测试文件已生成: {test_html}")
    
    # 检查模板内容
    print("\n检查模板替换:")
    print(f"SUBTITLE 替换: {'{{SUBTITLE}}' in template} -> {'测试字幕<br>第二行' in html}")
    print(f"VISUAL 替换: {'{{VISUAL}}' in template} -> {'测试画面' in html}")
    print(f"INDEX 替换: {'{{INDEX}}' in template} -> {'01' in html}")
    
    # 清理
    if test_html.exists():
        test_html.unlink()

if __name__ == "__main__":
    print("=" * 60)
    print("测试 Chrome 截图功能")
    print("=" * 60)
    test_chrome_screenshot()
    
    print("\n" + "=" * 60)
    print("测试模板渲染")
    print("=" * 60)
    test_template_rendering()