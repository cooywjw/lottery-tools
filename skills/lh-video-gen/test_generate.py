#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试修复后的 generate_slide 函数
"""

import sys
import os
from pathlib import Path

# 添加 scripts 目录到路径
sys.path.insert(0, str(Path(__file__).parent / "scripts"))

# 导入修复后的函数
from generate import generate_slide, _detect_chrome

def test_generate_slide():
    """测试图片生成"""
    print("测试 generate_slide 函数")
    print("=" * 60)
    
    # 检查 Chrome
    chrome_path = _detect_chrome()
    if not chrome_path:
        print("错误: Chrome 未找到")
        return
    
    print(f"Chrome 路径: {chrome_path}")
    
    # 测试数据
    subtitle = "测试字幕内容\n第二行字幕"
    visual = "测试画面描述"
    output_path = "test_slide_output.png"
    width = 1080
    height = 1920
    index = 1
    
    print(f"输出路径: {output_path}")
    print(f"画幅: {width}x{height}")
    
    try:
        result = generate_slide(subtitle, visual, output_path, width, height, index)
        print(f"\n生成成功: {result}")
        
        # 检查文件
        if os.path.exists(output_path):
            size = os.path.getsize(output_path)
            print(f"文件大小: {size} 字节")
            
            # 尝试用 PIL 打开
            try:
                from PIL import Image
                img = Image.open(output_path)
                print(f"图片尺寸: {img.size}")
                img.close()
            except ImportError:
                print("PIL 未安装，跳过图片检查")
            except Exception as e:
                print(f"打开图片失败: {e}")
        else:
            print("错误: 文件未生成")
            
    except Exception as e:
        print(f"生成失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 清理
    if os.path.exists(output_path):
        os.remove(output_path)
        print(f"\n清理临时文件: {output_path}")

if __name__ == "__main__":
    test_generate_slide()