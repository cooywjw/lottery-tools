# -*- coding: utf-8 -*-
import sys, os, json, requests
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

p = WeChatPublisher()
token = p.get_access_token()

media_id = 'XdCVOZQkCDAncTvX3_UDXEdgArMlU_7eJTsyFQwYSbDdbfm6xBv4xDvEdz_VN_2a'
url = f"https://api.weixin.qq.com/cgi-bin/draft/get?access_token={token}"
data = {'media_id': media_id}

resp = requests.post(url, json=data)
result = resp.json()

# 提取HTML内容中的所有图片URL
import re
html = result.get('content', {}).get('news_item', [{}])[0].get('content', '')
imgs = re.findall(r'src=["\']([^"\']+)["\']', html)
print("=== 草稿中的图片URL ===")
for i, img in enumerate(imgs, 1):
    print(f"{i}. {img}")

# 同时打印文章标题
title = result.get('content', {}).get('news_item', [{}])[0].get('title', '')
print(f"\n=== 标题 ===\n{title}")
