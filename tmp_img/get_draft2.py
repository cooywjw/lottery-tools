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

print("=== FULL RESPONSE ===")
print(json.dumps(result, ensure_ascii=False, indent=2))
