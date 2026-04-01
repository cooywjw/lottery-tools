#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""测试微信配置是否正常"""

import sys
import os

# 添加脚本目录到路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(SCRIPT_DIR, '..', '..'))

from publisher import WeChatPublisher

print("=" * 60)
print("测试微信配置")
print("=" * 60)

try:
    # 初始化发布器（会自动加载配置）
    publisher = WeChatPublisher()
    print(f"✓ 配置加载成功")
    print(f"  AppID: {publisher.appid[:6]}***{publisher.appid[-6:]}")
    print(f"  作者: {publisher.author or '(未设置)'}")

    # 获取 access_token
    print("\n→ 测试获取 access_token...")
    token = publisher.get_access_token()
    print(f"✓ access_token 获取成功")
    print(f"  Token 长度: {len(token)} 字符")
    print(f"  Token (前20字符): {token[:20]}...")

    print("\n" + "=" * 60)
    print("✓ 所有测试通过！配置正常工作")
    print("=" * 60)

except Exception as e:
    print("\n" + "=" * 60)
    print("✗ 测试失败")
    print("=" * 60)
    print(f"错误: {e}")
    sys.exit(1)
