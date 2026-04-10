# -*- coding: utf-8 -*-
import json, re, csv, os, html as html_mod

SAVE_DIR = r'G:\opennana_prompts'

def fix_text(t):
    if not t: return ''
    t = html_mod.unescape(t)
    return t

# Load all prompts (base data)
with open(os.path.join(SAVE_DIR, 'all_prompts.json'), 'r', encoding='utf-8') as f:
    all_prompts = json.load(f)

# Load scraped details
with open(os.path.join(SAVE_DIR, 'scraped_detail.json'), 'r', encoding='utf-8') as f:
    scraped = json.load(f)

print(f'All prompts: {len(all_prompts)}')
print(f'Scraped details: {len(scraped)}')

# Merge
merged = []
for item in all_prompts:
    slug = item['slug']
    detail = scraped.get(slug, {})
    
    en = fix_text(detail.get('en_prompt', ''))
    zh = fix_text(detail.get('zh_prompt', ''))
    tags = [fix_text(t) for t in detail.get('tags', []) if t and 1 < len(t) < 30]
    model = fix_text(detail.get('model', ''))
    
    merged.append({
        'id': item['id'],
        'title': item.get('title', ''),
        'zh_prompt': zh,
        'en_prompt': en,
        'tags': '|'.join(tags),
        'model': model,
        'image_url': item.get('cover_image', ''),
        'url': item['url'],
    })

print(f'Merged: {len(merged)}')

# Count good data
good_zh = sum(1 for m in merged if m['zh_prompt'] and '\u4e00' <= m['zh_prompt'][0] <= '\u9fff')
good_en = sum(1 for m in merged if m['en_prompt'] and len(m['en_prompt']) > 30)
has_tags = sum(1 for m in merged if m['tags'])
print(f'Good ZH: {good_zh}')
print(f'Good EN: {good_en}')
print(f'Has tags: {has_tags}')

# Save total CSV
csv_path = os.path.join(SAVE_DIR, 'prompts_total.csv')
with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Tags', 'Model', 'Image_URL', 'URL'])
    for m in merged:
        w.writerow([m['id'], m['title'], m['zh_prompt'], m['en_prompt'], m['tags'], m['model'], m['image_url'], m['url']])

print(f'CSV saved: {csv_path}')

# Save JSON
json_path = os.path.join(SAVE_DIR, 'prompts_full.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)
print(f'JSON saved: {json_path}')

# Generate category CSVs
categories = {}
for m in merged:
    for tag in m['tags'].split('|'):
        tag = tag.strip()
        if tag:
            categories.setdefault(tag, []).append(m)

print(f'Categories: {len(categories)}')

n = 0
idx = {}
for tag, items in sorted(categories.items(), key=lambda x: -len(x[1])):
    if len(items) >= 3:
        safe = re.sub(r'[\\/:*?"<>|]', '_', tag)
        p = os.path.join(SAVE_DIR, f'分类_{safe}.csv')
        with open(p, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f)
            w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Model', 'URL'])
            for m in items:
                w.writerow([m['id'], m['title'], m['zh_prompt'], m['en_prompt'], m['model'], m['url']])
        idx[tag] = len(items)
        n += 1

# Save index
idx_path = os.path.join(SAVE_DIR, '分类索引.json')
with open(idx_path, 'w', encoding='utf-8') as f:
    json.dump(idx, f, ensure_ascii=False, indent=2)

print(f'Category CSVs: {n}')
print('ALL DONE!')
