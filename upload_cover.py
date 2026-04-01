# -*- coding: utf-8 -*-
"""
上传封面图到微信公众号
"""

import sys
import os

# 添加 skill 目录到 Python 路径
SKILL_ROOT = r"C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher"
sys.path.insert(0, SKILL_ROOT)
sys.path.insert(0, os.path.join(SKILL_ROOT, "scripts"))

try:
    from publisher import WeChatPublisher
except ImportError:
    print(f"[ERROR] 无法导入 WeChatPublisher")
    print(f"SKILL_ROOT: {SKILL_ROOT}")
    print(f"sys.path: {sys.path}")
    sys.exit(1)

def main():
    # 封面图路径
    cover_path = r"G:\浏览器下载\公众号首图.png"

    print("=" * 60)
    print("  微信公众号封面图上传")
    print("=" * 60)

    try:
        # 初始化发布器
        publisher = WeChatPublisher()

        # 上传封面图
        print(f"\n正在上传封面图: {cover_path}")
        media_id = publisher.upload_image(cover_path)

        print(f"\n{'=' * 60}")
        print(f"[OK] 封面图上传成功!")
        print(f"  Media ID: {media_id}")
        print(f"{'=' * 60}\n")

        return media_id

    except Exception as e:
        print(f"\n[ERROR] 上传失败: {e}\n")
        return None

if __name__ == '__main__':
    main()
