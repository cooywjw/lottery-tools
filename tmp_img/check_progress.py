# -*- coding: utf-8 -*-
import json, os
f = r'G:\opennana_prompts\scraped_detail.json'
if os.path.exists(f):
    with open(f, 'r', encoding='utf-8') as fp:
        d = json.load(fp)
    good = sum(1 for v in d.values() if v.get('zh_prompt') and len(v.get('zh_prompt','')) > 10)
    print(f'Scraped: {len(d)} | Good ZH: {good}')
else:
    print('Progress file not found')
