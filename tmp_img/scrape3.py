# -*- coding: utf-8 -*-
import re, os, json, time, requests, csv
from concurrent.futures import ThreadPoolExecutor, as_completed

API = 'https://api.opennana.com'
SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
    'Origin': 'https://opennana.com',
}

def fetch_list(page=1, limit=20):
    url = f'{API}/api/prompts?page={page}&limit={limit}&sort=reviewed_at&order=DESC'
    r = requests.get(url, headers=headers, timeout=15)
    data = r.json()
    if data.get('status') == 200:
        return data['data']
    return None

def fetch_detail(prompt_id):
    url = f'{API}/api/prompts/{prompt_id}'
    try:
        r = requests.get(url, headers=headers, timeout=15)
        d = r.json()
        if d.get('status') == 200:
            return d.get('data', {})
    except:
        pass
    return None

def run():
    # 1. 先拿所有 slug（分页拉完）
    print('Step 1: Fetching all slugs...')
    all_items = []
    page = 1
    while True:
        print(f'  Fetching page {page}...')
        data = fetch_list(page=page, limit=50)
        if not data:
            break
        items = data.get('items', [])
        if not items:
            break
        # 过滤掉 sponsor
        items = [i for i in items if not i.get('_is_sponsor')]
        all_items.extend(items)
        print(f'    Got {len(items)} items, total so far: {len(all_items)}')
        
        pagination = data.get('pagination', {})
        if not pagination.get('has_more'):
            break
        page += 1
        time.sleep(0.3)
    
    total = len(all_items)
    print(f'Total slugs: {total}')
    
    # 2. 批量抓详情（每个slug需要单独请求）
    print(f'Step 2: Fetching details for {total} prompts...')
    all_data = []
    
    for i, item in enumerate(all_items):
        pid = item['id']
        slug = item['slug']
        title = item.get('title', '')
        cover = item.get('cover_image', '')
        
        if i % 50 == 0:
            print(f'  Progress: {i}/{total}')
        
        detail = fetch_detail(pid)
        if detail:
            prompts = detail.get('prompts', [])
            zh_prompt = ''
            en_prompt = ''
            tags = detail.get('tags', [])
            model = detail.get('model', '')
            source = detail.get('source_name', '')
            
            for p in prompts:
                ptype = p.get('type', '')
                ptext = p.get('text', '') or p.get('prompt_text', '')
                if ptype == 'zh' or 'zh' in str(ptype).lower():
                    zh_prompt = ptext
                elif ptype == 'en' or 'en' in str(ptype).lower():
                    en_prompt = ptext
                else:
                    if not en_prompt:
                        en_prompt = ptext
            
            all_data.append({
                'id': pid,
                'slug': slug,
                'title': title,
                'cover_image': cover,
                'zh_prompt': zh_prompt,
                'en_prompt': en_prompt,
                'tags': tags,
                'model': model,
                'source': source,
                'url': f'https://opennana.com/awesome-prompt-gallery/{slug}',
            })
        else:
            # 没拿到详情，保存基本信息
            all_data.append({
                'id': pid,
                'slug': slug,
                'title': title,
                'cover_image': cover,
                'zh_prompt': '',
                'en_prompt': '',
                'tags': [],
                'model': '',
                'source': '',
                'url': f'https://opennana.com/awesome-prompt-gallery/{slug}',
            })
        
        time.sleep(0.2)
    
    print(f'Done! Got {len(all_data)} items')
    
    # 3. 保存 JSON
    json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f'JSON saved: {json_path}')
    
    # 4. 保存总 CSV
    csv_path = os.path.join(SAVE_DIR, 'prompts_total.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Tags', 'Model', 'Source', 'Image', 'URL'])
        for item in all_data:
            w.writerow([
                item['id'],
                item['title'],
                item['zh_prompt'],
                item['en_prompt'],
                '|'.join(item['tags']),
                item['model'],
                item['source'],
                item['cover_image'],
                item['url'],
            ])
    print(f'CSV saved: {csv_path}')
    
    # 5. 分类 CSV
    cats = {}
    for item in all_data:
        for t in item.get('tags', []):
            cats.setdefault(t, []).append(item)
    
    n = 0
    for tag, items in cats.items():
        if len(items) >= 3:
            safe = re.sub(r'[\\/:*?"<>|]', '_', tag)
            p = os.path.join(SAVE_DIR, f'cat_{safe}.csv')
            with open(p, 'w', encoding='utf-8-sig', newline='') as f:
                w = csv.writer(f)
                w.writerow(['ID', 'Title', 'ZH_Prompt', 'EN_Prompt', 'Model', 'Source', 'URL'])
                for it in items:
                    w.writerow([it['id'], it['title'], it['zh_prompt'], it['en_prompt'],
                               it['model'], it['source'], it['url']])
            n += 1
    
    # 分类索引
    idx_path = os.path.join(SAVE_DIR, 'category_index.json')
    with open(idx_path, 'w', encoding='utf-8') as f:
        json.dump({tag: len(items) for tag, items in cats.items()}, f, ensure_ascii=False, indent=2)
    
    print(f'Category CSVs: {n}')
    print('ALL DONE')

if __name__ == '__main__':
    run()
