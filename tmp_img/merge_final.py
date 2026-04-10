# -*- coding: utf-8 -*-
import json, re, os, csv, html as html_mod

SAVE_DIR = r'G:\opennana_prompts'

def fix_text(t):
    if not t:
        return ''
    t = html_mod.unescape(t)
    return t

# Load all prompts (basic info)
with open(os.path.join(SAVE_DIR, 'all_prompts.json'), 'r', encoding='utf-8') as f:
    all_prompts = json.load(f)

# Load scraped detail
with open(os.path.join(SAVE_DIR, 'scraped_detail.json'), 'r', encoding='utf-8') as f:
    scraped = json.load(f)

print(f'All prompts: {len(all_prompts)}')
print(f'Scraped detail: {len(scraped)}')

# Merge
merged = []
for item in all_prompts:
    slug = item['slug']
    detail = scraped.get(slug, {})
    
    en = fix_text(detail.get('en_prompt', ''))
    zh = fix_text(detail.get('zh_prompt', ''))
    tags = detail.get('tags', [])
    if tags and isinstance(tags[0], str):
        # Already fixed
        tags = [fix_text(t) for t in tags]
    model = fix_text(detail.get('model', ''))
    
    merged.append({
        'id': item['id'],
        'title': item['title'],
        'en_prompt': en,
        'zh_prompt': zh,
        'tags': tags,
        'model': model,
        'image_url': item.get('cover_image', ''),
        'url': f"https://opennana.com/awesome-prompt-gallery/{slug}",
    })

print(f'Merged: {len(merged)}')

# Count good data
good_zh = sum(1 for m in merged if m['zh_prompt'] and '\u4e00' <= m['zh_prompt'][0] <= '\u9fff')
good_en = sum(1 for m in merged if m['en_prompt'])
print(f'Has ZH prompt: {good_zh}')
print(f'Has EN prompt: {good_en}')

# Save merged JSON
with open(os.path.join(SAVE_DIR, 'all_prompts_merged.json'), 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

# Save main CSV
csv_path = os.path.join(SAVE_DIR, '提示词总表.csv')
with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['ID', '标题', '中文提示词', '英文提示词', '标签', '模型', '图片URL', '链接'])
    for m in merged:
        w.writerow([
            m['id'],
            m['title'],
            m['zh_prompt'],
            m['en_prompt'],
            '|'.join(m['tags']),
            m['model'],
            m['image_url'],
            m['url'],
        ])

print(f'CSV saved: {csv_path}')

# Category CSVs
cats = {}
for m in merged:
    for tag in m['tags']:
        if tag not in cats:
            cats[tag] = []
        cats[tag].append(m)

n = 0
for tag, items in cats.items():
    if len(items) >= 3:
        safe = re.sub(r'[\\/:*?"<>|]', '_', tag)
        p = os.path.join(SAVE_DIR, f'分类_{safe}.csv')
        with open(p, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f)
            w.writerow(['ID', '标题', '中文提示词', '英文提示词', '模型', '链接'])
            for it in items:
                w.writerow([it['id'], it['title'], it['zh_prompt'], it['en_prompt'], it['model'], it['url']])
        n += 1

print(f'Category CSVs: {n}')

# Category index
idx = {tag: len(items) for tag, items in cats.items()}
with open(os.path.join(SAVE_DIR, '分类索引.json'), 'w', encoding='utf-8') as f:
    json.dump(idx, f, ensure_ascii=False, indent=2)

print('ALL DONE!')
print(f'Files in {SAVE_DIR}:')
for f2 in os.listdir(SAVE_DIR):
    size = os.path.getsize(os.path.join(SAVE_DIR, f2))
    print(f'  {f2}: {size/1024:.1f} KB')
