#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""创建草稿（无配图版）"""
import sys
import os
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
os.environ['WECHAT_PUBLISHER_ROOT'] = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher'

from publisher import WeChatPublisher

article_dir = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/wechat_art'
html_file = os.path.join(article_dir, 'article2_styled.html')
title = '4.9 足坛战报：欧冠双豪门遭 2-0 碾压，冷门夜全线爆冷'

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

publisher = WeChatPublisher()
result = publisher.create_draft(
    title=title,
    content=content,
    author="绿茵有运",
    thumb_media_id="",
    digest="欧冠双豪门0-2惨败，冷门夜全面爆发",
    content_base_dir=article_dir
)

print(f"\n{'='*50}")
print(f"[OK] 草稿创建成功！")
print(f"  media_id: {result.get('media_id')}")
print(f"{'='*50}")
print(f"\n查看草稿: https://mp.weixin.qq.com → 素材管理 → 草稿箱")
