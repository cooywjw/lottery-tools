# -*- coding: utf-8 -*-
import re, os

with open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\gallery_home.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

print(f"HTML length: {len(html)}")

# Pattern 1: "slug":"value"
matches = re.findall(r'"slug":"([^"]+)"', html)
print(f'Pattern1 found {len(matches)} slugs')

# Show some context
for pattern in ['golden-hour', 'golden_hour', 'slug']:
    idx = html.find(pattern)
    if idx > 0:
        print(f'\nFound "{pattern}" at {idx}:')
        print(repr(html[max(0,idx-30):idx+100]))
        break
