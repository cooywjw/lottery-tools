# -*- coding: utf-8 -*-
import requests
import os
import time

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://en.wikipedia.org/',
}

save_dir = 'C:/Users/Administrator/.openclaw/workspace/tmp_img/players/'
os.makedirs(save_dir, exist_ok=True)

images = {
    'melbourne_leckie.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Mathew_Leckie_%2816003617688%29.jpg/440px-Mathew_Leckie_%2816003617688%29.jpg',
    'arsenal_saka.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Bukayo_Saka_2022_%28cropped%29.jpg/440px-Bukayo_Saka_2022_%28cropped%29.jpg',
    'arsenal_players.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Arsenal_FC.svg/440px-Arsenal_FC.svg.png',
    'real_mbappe.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Kylian_Mbapp%C3%A9_Lens_-_Saint-%C3%89tienne_%2817-02-2023%29_-_Photo_071.jpg/440px-Kylian_Mbapp%C3%A9_Lens_-_Saint-%C3%89tienne_%2817-02-2023%29_-_Photo_071.jpg',
    'bayern_kane.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Harry_Kane_2018_%28cropped%29.jpg/440px-Harry_Kane_2018_%28cropped%29.jpg',
    'sporting_gyokeres.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Viktor_Gy%C3%B6keres_2024.jpg/440px-Viktor_Gy%C3%B6keres_2024.jpg',
    'mariners_team.jpg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Central_Coast_Mariners_logo.svg/440px-Central_Coast_Mariners_logo.svg.png',
}

for filename, url in images.items():
    try:
        print(f"Downloading {filename}...")
        resp = requests.get(url, headers=headers, timeout=20)
        if resp.status_code == 200:
            path = os.path.join(save_dir, filename)
            with open(path, 'wb') as f:
                f.write(resp.content)
            size = os.path.getsize(path)
            print(f"  OK: {size} bytes")
        else:
            print(f"  FAIL: {resp.status_code} - {url}")
    except Exception as e:
        print(f"  ERROR: {e}")
    time.sleep(0.5)

print("Done!")
