# -*- coding: utf-8 -*-
import sys, os, json, requests
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

p = WeChatPublisher()
token = p.get_access_token()

# 获取草稿列表 - correct endpoint is batchget (no underscore)
url = f"https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token={token}"
data = {'offset': 0, 'count': 5, 'no_content': 0}

resp = requests.post(url, json=data)
result = resp.json()

print("=== DRAFT LIST ===")
items = result.get('item', [])
print(f"共 {len(items)} 篇草稿")
for item in items:
    print(f"\nmedia_id: {item.get('media_id')}")
    content = item.get('content', {}).get('news_item', [{}])[0]
    print(f"  标题: {content.get('title', '')}")
    # 提取图片
    import re
    html = content.get('content', '')
    imgs = re.findall(r'src=["\']([^"\']+)["\']', html)
    print(f"  图片数: {len(imgs)}")
    for i, img in enumerate(imgs, 1):
        print(f"    {i}. {img[:100]}")
