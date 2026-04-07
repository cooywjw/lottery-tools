# -*- coding: utf-8 -*-
import sys, os, json, requests
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

p = WeChatPublisher()
token = p.get_access_token()

# 先获取草稿列表
url = f"https://api.weixin.qq.com/cgi-bin/draft/batch_get?access_token={token}"
data = {'offset': 0, 'count': 5, 'no_content': 0}

resp = requests.post(url, json=data)
result = resp.json()

print("=== DRAFT LIST ===")
print(json.dumps(result, ensure_ascii=False, indent=2))
