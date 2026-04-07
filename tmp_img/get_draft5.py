# -*- coding: utf-8 -*-
import sys, os, json, requests
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

p = WeChatPublisher()
token = p.get_access_token()

# 用正确格式获取单篇草稿
media_id = 'XdCVOZQkCDAncTvX3_UDXEdgArMlU_7eJTsyFQwYSbDdbfm6xBv4xDvEdz_VN_2a'
url = f"https://api.weixin.qq.com/cgi-bin/draft/get?access_token={token}"
data = {"media_id": media_id}

resp = requests.post(url, json=data)
result = resp.json()

print("errcode:", result.get('errcode'))
print("errmsg:", result.get('errmsg'))

# 如果成功，提取图片
if 'content' in result:
    items = result['content'].get('news_item', [])
    for item in items:
        print("标题:", item.get('title'))
        import re
        html = item.get('content', '')
        imgs = re.findall(r'(https?://[^\s"\'<>]+)', html)
        print(f"图片数: {len(imgs)}")
        for i, img in enumerate(imgs, 1):
            print(f"  {i}. {img}")
