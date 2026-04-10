#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
os.environ['WECHAT_PUBLISHER_ROOT'] = 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher'

from publisher import WeChatPublisher

article_dir = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/wechat_art2'
html_file = os.path.join(article_dir, 'article_styled.html')
title = '4.9 竞彩足球：欧联 + 解放者杯焦点战，今晚稳胆与冷门全解析'

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

publisher = WeChatPublisher()

# 上传5张图片并替换URL
img_files = ['img26.png', 'img27.png', 'img28.png', 'img29.png', 'img30.png']
for img_file in img_files:
    img_path = os.path.join(article_dir, img_file)
    print(f"→ 上传: {img_file}")
    _, wechat_url = publisher.upload_image(img_path, return_url=True)
    content = content.replace(f'src="{img_file}"', f'src="{wechat_url}"')
    print(f"  OK: {wechat_url[:50]}...")

# 保存替换后HTML
with open(os.path.join(article_dir, 'article_replaced.html'), 'w', encoding='utf-8') as f:
    f.write(content)

# 创建草稿
print(f"\n→ 创建草稿...")
result = publisher.create_draft(
    title=title,
    content=content,
    author="绿茵有运",
    thumb_media_id="",
    digest="欧联+解放者杯焦点战，今晚稳胆与冷门全解析",
    content_base_dir=article_dir
)

print(f"\n{'='*50}")
print(f"[OK] 草稿创建成功！")
print(f"  media_id: {result.get('media_id')}")
print(f"{'='*50}")
print(f"查看: https://mp.weixin.qq.com → 草稿箱")
