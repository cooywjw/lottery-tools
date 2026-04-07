import json

with open(r'G:\opennana_prompts\all_prompts.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print(f'Total: {len(d)} items')
has_en = sum(1 for x in d if x.get('en_prompt'))
has_zh = sum(1 for x in d if x.get('zh_prompt'))
print(f'Has EN prompt: {has_en}')
print(f'Has ZH prompt: {has_zh}')

# Show item 1 raw data
import json
print('\n--- Sample item ---')
print(json.dumps(d[0], ensure_ascii=False, indent=2))
