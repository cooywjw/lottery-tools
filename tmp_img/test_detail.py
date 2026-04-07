# -*- coding: utf-8 -*-
import json

try:
    d = json.load(open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\detail_auth_test.json', 'r', encoding='utf-8-sig'))
except:
    d = json.load(open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\detail_auth_test.json', 'r', encoding='utf-8-sig', errors='replace'))

print('Full response:', json.dumps(d, ensure_ascii=False)[:500])
