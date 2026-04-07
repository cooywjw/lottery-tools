# -*- coding: utf-8 -*-
import re, os, json, time, requests, csv
from concurrent.futures import ThreadPoolExecutor, as_completed

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Referer': 'https://opennana.com/'}
SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

def extract_slugs(html):
    return list(set(re.findall(r'\\"slug\\":\\"([^\\"]+)\\"', html)))

def fetch_detail(slug):
    url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200: return None
        h = r.text
        tm = re.search(r'<h1[^>]*>([^<]+)</h1>', h)
        title = tm.group(1).strip() if tm else slug
        enm = re.search(r'"text":"(Take this[^"]+)"', h)
        en = enm.group(1).strip() if enm else ''
        zhm = re.search(r'\u8bf7\u4f7f\u7528\u8fd9\u5f20\u57fa\u7840\u56fe\u7247[^\"]+', h)
        zh = zhm.group(0).strip() if zhm else ''
        tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', h)
        tags = [t.strip() for t in tags if t.strip()]
        mm = re.search(r'Nano banana pro|Nano Banana 2|Seedance', h)
        model = mm.group(0) if mm else 'unknown'
        im = re.search(r'"image":"(https?://[^"]+)"', h)
        img = im.group(1) if im else ''
        return {'slug': slug, 'title': title, 'en_prompt': en, 'zh_prompt': zh, 'tags': tags, 'model': model, 'image_url': img, 'url': url}
    except Exception as e:
        return {'slug': slug, 'error': str(e)}

# load home page
home_path = r'C:\Users\Administrator\.openclaw\workspace\tmp_img\gallery_home.html'
with open(home_path, 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

slugs = extract_slugs(html)
print(f'Home: {len(slugs)} slugs')

# fetch pages 2-5
for page in range(2, 6):
    try:
        r = requests.get(f'https://opennana.com/awesome-prompt-gallery?page={page}', headers=headers, timeout=15)
        s = extract_slugs(r.text)
        print(f'Page {page}: {len(s)} slugs')
        slugs.extend(s)
        time.sleep(0.5)
    except Exception as e:
        print(f'Page {page} error: {e}')

slugs = list(set(slugs))
print(f'Total unique: {len(slugs)}')

# fetch details
data = []
for i, slug in enumerate(slugs):
    if i % 20 == 0: print(f'Progress: {i}/{len(slugs)}')
    r = fetch_detail(slug)
    if r and 'error' not in r: data.append(r)
print(f'Done: {len(data)} items')

# save JSON
jp = os.path.join(SAVE_DIR, 'all_prompts.json')
with open(jp, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print(f'JSON: {jp}')

# save main CSV
cp = os.path.join(SAVE_DIR, 'prompts_total.csv')
with open(cp, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['ID','Title','ZH_Prompt','EN_Prompt','Tags','Model','Image','URL'])
    for i, item in enumerate(data, 1):
        w.writerow([i, item.get('title',''), item.get('zh_prompt',''), item.get('en_prompt',''), '|'.join(item.get('tags',[])), item.get('model',''), item.get('image_url',''), item.get('url','')])
print(f'CSV: {cp}')

# category CSVs
cats = {}
for item in data:
    for t in item.get('tags', []):
        cats.setdefault(t, []).append(item)
print(f'Categories: {len(cats)}')
n = 0
for tag, items in cats.items():
    if len(items) >= 3:
        sp = re.sub(r'[\\/:*?"<>|]', '_', tag)
        pp = os.path.join(SAVE_DIR, f'cat_{sp}.csv')
        with open(pp, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.writer(f)
            w.writerow(['ID','Title','ZH_Prompt','EN_Prompt','Model','URL'])
            for i, it in enumerate(items, 1):
                w.writerow([i, it.get('title',''), it.get('zh_prompt',''), it.get('en_prompt',''), it.get('model',''), it.get('url','')])
        n += 1
print(f'Category CSVs: {n}')
print('ALL DONE')
