# -*- coding: utf-8 -*-
import re, os, json, time, requests, csv
from concurrent.futures import ThreadPoolExecutor, as_completed

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
}

SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

def unescape(s):
    if not s: return ''
    return s.replace('\\n', '\n').replace('\\"', '"').replace('\\/', '/')

def fetch_detail(slug):
    url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200: return None
        h = r.text
        
        # Title
        tm = re.search(r'<h1[^>]*>([^<]+)</h1>', h)
        title = tm.group(1).strip() if tm else slug
        
        # English prompt - try multiple patterns
        en = ''
        patterns_en = [
            r'"text":"(Take this[^{"]+)"',
            r'class="whitespace-pre-wrap font-mono[^>]*>([^<]+)</pre>',
        ]
        for pat in patterns_en:
            m = re.search(pat, h)
            if m:
                en = unescape(m.group(1).strip())
                break
        
        # Chinese prompt
        zh = ''
        # Look for Chinese section after the English one
        zh_match = re.search(r'\u8bf7\u4f7f\u7528\u8fd9\u5f20\u57fa\u7840\u56fe\u7247[^\"]+', h)
        if zh_match:
            zh = zh_match.group(0)
        else:
            # Try split approach
            parts = h.split('\\u8bf7\\u4f7f\\u7528\\u8fd9\\u5f20')
            if len(parts) > 1:
                m2 = re.search(r'([^"\\]+)', parts[-1][:200])
                if m2: zh = m2.group(1)
        
        # Tags
        tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', h)
        tags = [t.strip() for t in tags if t.strip() and len(t) > 1 and len(t) < 20]
        
        # Model
        mm = re.search(r'Nano banana pro|Nano Banana 2|Seedance|ChatGPT|Grok', h)
        model = mm.group(0) if mm else 'unknown'
        
        # Image URL
        im = re.search(r'"image":"(https?://[^"]+)"', h)
        img = im.group(1) if im else ''
        
        # Source author
        sm = re.search(r'@([\w]+)</a>', h)
        source = f'@{sm.group(1)}' if sm else ''
        
        return {
            'slug': slug,
            'title': title,
            'en_prompt': en,
            'zh_prompt': zh,
            'tags': tags,
            'model': model,
            'image_url': img,
            'source': source,
            'url': url,
        }
    except Exception as e:
        return {'slug': slug, 'error': str(e)}

def run():
    # Load existing slugs from G drive if any
    json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
    existing = []
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            existing = json.load(f)
    
    print(f'Loaded {len(existing)} existing items')
    
    # Get slugs we need to re-fetch (with empty prompts)
    slugs_to_fetch = [item['slug'] for item in existing if not item.get('en_prompt') or not item.get('zh_prompt')]
    print(f'Need to re-fetch {len(slugs_to_fetch)} items')
    
    # Also try to get more slugs from the gallery pages
    home_path = r'C:\Users\Administrator\.openclaw\workspace\tmp_img\gallery_home.html'
    if os.path.exists(home_path):
        more_slugs = re.findall(r'\\"slug\\":\\"([^"\\]+)\\"', open(home_path, 'r', encoding='utf-8', errors='ignore').read())
        more_slugs = [s for s in more_slugs if s not in [item['slug'] for item in existing]]
        print(f'Found {len(more_slugs)} new slugs from gallery')
        slugs_to_fetch.extend(more_slugs)
    
    slugs_to_fetch = list(set(slugs_to_fetch))
    print(f'Total to fetch: {len(slugs_to_fetch)}')
    
    # Fetch details
    results = []
    for i, slug in enumerate(slugs_to_fetch):
        if i % 10 == 0: print(f'Progress: {i}/{len(slugs_to_fetch)} - {slug}')
        r = fetch_detail(slug)
        if r and 'error' not in r:
            results.append(r)
        time.sleep(0.3)  # be polite
    
    print(f'Fetched {len(results)} items')
    
    # Merge with existing
    existing_ids = {item['slug']: item for item in existing}
    for item in results:
        existing_ids[item['slug']] = item
    
    all_data = list(existing_ids.values())
    print(f'Total: {len(all_data)} items')
    
    # Save
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    # Save CSV
    csv_path = os.path.join(SAVE_DIR, 'prompts_total.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Tags', 'Model', 'Source', 'Image', 'URL'])
        for i, item in enumerate(all_data, 1):
            w.writerow([i, item.get('title',''), item.get('zh_prompt',''), item.get('en_prompt',''),
                       '|'.join(item.get('tags',[])), item.get('model',''), item.get('source',''),
                       item.get('image_url',''), item.get('url','')])
    
    # Category CSVs
    cats = {}
    for item in all_data:
        for t in item.get('tags', []):
            cats.setdefault(t, []).append(item)
    
    n = 0
    for tag, items in cats.items():
        if len(items) >= 3:
            sp = re.sub(r'[\\/:*?"<>|]', '_', tag)
            pp = os.path.join(SAVE_DIR, f'cat_{sp}.csv')
            with open(pp, 'w', encoding='utf-8-sig', newline='') as f:
                w = csv.writer(f)
                w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Model', 'URL'])
                for i, it in enumerate(items, 1):
                    w.writerow([i, it.get('title',''), it.get('zh_prompt',''), it.get('en_prompt',''),
                               it.get('model',''), it.get('url','')])
            n += 1
    
    print(f'Done! {len(all_data)} items, {n} category CSVs')
    print(f'Files at: {SAVE_DIR}')

if __name__ == '__main__':
    run()
