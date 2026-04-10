#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""上传6张图片并创建草稿"""
import sys
import os
import json

# 添加skill路径
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
os.environ['WECHAT_PUBLISHER_ROOT'] = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher'

from publisher import WeChatPublisher

article_dir = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/wechat_art'
html_file = os.path.join(article_dir, 'article_styled.html')
title = '昨夜足坛复盘：欧冠两场巅峰战落幕，豪门对决悬念拉满'

# 读取HTML
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 先上传6张图片，替换URL
import re
img_files = ['img18.png', 'img19.png', 'img20.png', 'img21.png', 'img22.png', 'img23.png']

publisher = WeChatPublisher()
for img_file in img_files:
    img_path = os.path.join(article_dir, img_file)
    print(f"→ 上传图片: {img_file}")
    media_id, wechat_url = publisher.upload_image(img_path, return_url=True)
    print(f"  URL: {wechat_url}")
    # 替换HTML中的本地路径为微信URL
    content = content.replace(f'src="{img_file}"', f'src="{wechat_url}"')

# 保存替换后的HTML
html_replaced = os.path.join(article_dir, 'article_replaced.html')
with open(html_replaced, 'w', encoding='utf-8') as f:
    f.write(content)
print(f"\n→ HTML已更新: {html_replaced}")

# 创建草稿
print(f"\n→ 创建草稿: {title}")
result = publisher.create_draft(
    title=title,
    content=content,
    author="绿茵有运",
    thumb_media_id="",  # 使用默认黑色封面
    digest="昨夜足坛赛事全面复盘，欧冠两场巅峰对决最受瞩目",
    content_base_dir=article_dir
)

print(f"\n{'='*50}")
print(f"[OK] 草稿创建成功！")
print(f"  media_id: {result.get('media_id')}")
print(f"{'='*50}")
print(f"\n查看草稿: https://mp.weixin.qq.com → 素材管理 → 草稿箱")
