# -*- coding: utf-8 -*-
import re, os, json, time, requests, csv
from concurrent.futures import ThreadPoolExecutor, as_completed

API = 'https://api.opennana.com'
SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
}

def fetch_list(page=1, limit=50):
    url = f'{API}/api/prompts?page={page}&limit={limit}&sort=reviewed_at&order=DESC'
    try:
        r = requests.get(url, headers=headers, timeout=15)
        d = r.json()
        if d.get('status') == 200:
            return d['data']
    except:
        pass
    return None

def main():
    print('Fetching all prompts (Plan A: titles, tags, images, URLs)...')
    
    all_items = []
    page = 1
    
    while True:
        print(f'  Page {page}...')
        data = fetch_list(page=page, limit=50)
        if not data:
            break
        items = data.get('items', [])
        if not items:
            break
        # 过滤 sponsor
        real = [i for i in items if not i.get('_is_sponsor')]
        all_items.extend(real)
        print(f'    Got {len(real)} real items, total: {len(all_items)}')
        
        pagination = data.get('pagination', {})
        if not pagination.get('has_more'):
            break
        page += 1
        time.sleep(0.3)
    
    total = len(all_items)
    print(f'Total: {total} items')
    
    # 构建完整数据
    all_data = []
    for i, item in enumerate(all_items):
        pid = item['id']
        slug = item['slug']
        title = item.get('title', '')
        cover = item.get('cover_image', '')
        
        # tags 和 model 需要从详情页拿，但详情需要token
        # 先留空，slug 用于拼接 URL
        all_data.append({
            'id': pid,
            'slug': slug,
            'title': title,
            'cover_image': cover,
            'tags': '',   # 待填充
            'model': '',  # 待填充
            'url': f'https://opennana.com/awesome-prompt-gallery/{slug}',
        })
    
    print(f'Saving {len(all_data)} items...')
    
    # JSON
    json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f'JSON: {json_path}')
    
    # CSV
    csv_path = os.path.join(SAVE_DIR, 'prompts_total.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        w = csv.writer(f)
        w.writerow(['ID', 'Title', 'Tags', 'Model', 'Image_URL', 'URL'])
        for item in all_data:
            w.writerow([
                item['id'],
                item['title'],
                item['tags'],
                item['model'],
                item['cover_image'],
                item['url'],
            ])
    print(f'CSV: {csv_path}')
    print('Plan A DONE')
    print(f'Total items: {len(all_data)}')

if __name__ == '__main__':
    main()
