# -*- coding: utf-8 -*-
import requests
import os
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

save_dir = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/players/'
os.makedirs(save_dir, exist_ok=True)

# 使用 Wikimedia API 获取图片 URL
def get_wiki_image(title):
    """通过 Wikimedia API 获取图片 URL"""
    api_url = "https://en.wikipedia.org/w/api.php"
    params = {
        'action': 'query',
        'titles': f'File:{title}',
        'prop': 'imageinfo',
        'iiprop': 'url',
        'format': 'json'
    }
    try:
        resp = requests.get(api_url, params=params, headers=headers, timeout=15)
        data = resp.json()
        pages = data.get('query', {}).get('pages', {})
        for page in pages.values():
            info = page.get('imageinfo', [{}])[0]
            return info.get('url', '')
    except Exception as e:
        print(f"  API error: {e}")
    return None

# 球员名单：wikipedia filename
players = [
    ('melbourne_leckie', 'Mathew Leckie (16003617688).jpg'),
    ('arsenal_saka', 'Bukayo Saka 2022 (cropped).jpg'),
    ('arsenal_team', 'Arsenal FC.svg'),
    ('real_mbappe', 'Kylian Mbappé Lens - Saint-Étienne (17-02-2023) - Photo 071.jpg'),
    ('bayern_kane', 'Harry Kane 2018 (cropped).jpg'),
    ('sporting_gyokeres', 'Viktor Gyökeres 2024.jpg'),
    ('mariners_logo', 'Central Coast Mariners logo.svg'),
    ('madrid_team', 'Real Madrid CF logo (simple).svg'),
    ('bayern_team', 'FC Bayern Munich logo (2017).svg'),
]

for filename, imgname in players:
    print(f"Fetching {filename}...")
    
    # 方案1：直接用 thumbnail URL（更小，更快）
    thumb_url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/"
    
    # 方案2：API 获取真实 URL
    url = get_wiki_image(imgname)
    if url:
        # 替换为中等尺寸缩略图
        url = url.replace('/commons/', '/commons/thumb/')
        if not '/thumb/' in url:
            url = url.replace('/commons/', '/commons/thumb/0/00/')
        # 获取 440px 宽的缩略图
        url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/{imgname}/440px-{imgname}"
        
    time.sleep(3)  # 间隔 3 秒
    
    if url:
        try:
            resp = requests.get(url, headers=headers, timeout=20)
            print(f"  Status: {resp.status_code}, URL: {url[:80]}")
            if resp.status_code == 200 and len(resp.content) > 5000:
                path = os.path.join(save_dir, f'{filename}.jpg')
                with open(path, 'wb') as f:
                    f.write(resp.content)
                print(f"  Saved: {len(resp.content)} bytes")
            else:
                print(f"  Too small or failed: {len(resp.content) if resp.status_code == 200 else 'no content'}")
        except Exception as e:
            print(f"  Error: {e}")
    else:
        print(f"  Could not get URL")
    
    time.sleep(2)

print("Done!")
