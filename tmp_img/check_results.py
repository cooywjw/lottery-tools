# -*- coding: utf-8 -*-
import json

with open(r'G:\opennana_prompts\all_prompts.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print(f'Total: {len(d)} items')
print()
for i, item in enumerate(d[:5]):
    print(f"=== {i+1}. {item['title']} ===")
    print(f"Tags: {item['tags']}")
    print(f"Model: {item['model']}")
    print(f"ZH: {item['zh_prompt'][:100]}")
    print(f"EN: {item['en_prompt'][:100]}")
    print()
