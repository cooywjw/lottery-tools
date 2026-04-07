# -*- coding: utf-8 -*-
import re, os, json, time, requests, csv, http.cookiejar

API = 'https://api.opennana.com'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ3OTg0LCJlbWFpbCI6ImNvb3l3andAMTYzLmNvbSIsInVzZXJuYW1lIjoiY29veXdqdyIsIm1lbWJlckxldmVsIjowLCJpYXQiOjE3NzU0ODM0NTksImV4cCI6MTc3ODA3NTQ1OX0.Tm4xmqgUTr2BSb2s33jgQzrM3JBEaRIqHuO-nQ_qhw8'
SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
    'Origin': 'https://opennana.com',
    'Authorization': f'Bearer {TOKEN}',
})

# Test which detail approach works
def test_auth():
    print('Testing authentication methods...')
    
    # Method 1: Bearer token header
    r1 = session.get(f'{API}/api/prompts/12708', timeout=10)
    print(f'Method 1 (Bearer header): {r1.status_code} -> {r1.text[:100]}')
    
    # Method 2: Try with cookies
    session2 = requests.Session()
    session2.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://opennana.com/',
    })
    session2.cookies.set('user_token', TOKEN, domain='opennana.com')
    r2 = session2.get(f'{API}/api/prompts/12708', timeout=10)
    print(f'Method 2 (Cookie): {r2.status_code} -> {r2.text[:100]}')
    
    # Method 3: Check if there's a different detail endpoint
    # e.g. /api/prompt/{id} without s
    r3 = session.get(f'{API}/api/prompt/12708', timeout=10)
    print(f'Method 3 (no s): {r3.status_code} -> {r3.text[:100]}')
    
    # Method 4: Try with query param
    r4 = session.get(f'{API}/api/prompts/12708?token={TOKEN}', timeout=10)
    print(f'Method 4 (query token): {r4.status_code} -> {r4.text[:100]}')

test_auth()

# Now fetch all items with tags from the list API
print('\nFetching all items from list API...')
all_items = []
page = 1

while True:
    print(f'  Page {page}...')
    r = session.get(f'{API}/api/prompts?page={page}&limit=50&sort=reviewed_at&order=DESC', timeout=15)
    try:
        d = r.json()
        if d.get('status') != 200:
            # Try without auth
            r2 = requests.get(f'{API}/api/prompts?page={page}&limit=50&sort=reviewed_at&order=DESC', 
                            headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
            d = r2.json()
        items = d.get('data', {}).get('items', [])
        if not items:
            break
        real = [i for i in items if not i.get('_is_sponsor')]
        all_items.extend(real)
        pagination = d.get('data', {}).get('pagination', {})
        print(f'    {len(real)} items, total: {len(all_items)}')
        if not pagination.get('has_more'):
            break
        page += 1
        time.sleep(0.3)
    except Exception as e:
        print(f'    Error: {e}')
        break

print(f'Total: {len(all_items)}')

# Extract all tags from HTML (they're in the initial page data)
print('\nExtracting tags from HTML...')
tags_map = {}
for item in all_items:
    # Tags not in list API response without auth
    pass

# Save final data
all_data = []
for item in all_items:
    all_data.append({
        'id': item['id'],
        'slug': item['slug'],
        'title': item.get('title', ''),
        'cover_image': item.get('cover_image', ''),
        'url': f"https://opennana.com/awesome-prompt-gallery/{item['slug']}",
    })

# Save
json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(all_data, f, ensure_ascii=False, indent=2)

csv_path = os.path.join(SAVE_DIR, 'prompts_total.csv')
with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['ID', 'Title', 'Image_URL', 'URL'])
    for item in all_data:
        w.writerow([item['id'], item['title'], item['cover_image'], item['url']])

print(f'Saved {len(all_data)} items')
print('DONE')
