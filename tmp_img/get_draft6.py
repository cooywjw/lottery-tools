# -*- coding: utf-8 -*-
import sys, os, json, requests, codecs
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

p = WeChatPublisher()
token = p.get_access_token()

# 获取草稿列表
url = "https://api.weixin.qq.com/cgi-bin/draft/batchget?access_token=" + token
data = {'offset': 0, 'count': 5}

resp = requests.post(url, json=data)
result = resp.json()

# 写入文件避免编码问题
with open('C:/Users/Administrator/.openclaw/workspace/tmp_img/draft_list.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print("写入完成，文件大小:", os.path.getsize('C:/Users/Administrator/.openclaw/workspace/tmp_img/draft_list.json'))
