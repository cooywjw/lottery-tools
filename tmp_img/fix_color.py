# -*- coding: utf-8 -*-
content = open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\generate_wechat_html.py', 'r', encoding='utf-8').read()

# Fix section_header: parameter is 'color', not 'league_color'
old = 'background:{league_color}!important;text-indent:0!important;">'
new = 'background:{color}!important;text-indent:0!important;">'
count = content.count(old)
print(f'Found {count} occurrences of {repr(old)}')
content = content.replace(old, new, 1)  # Only first (section_header)
open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\generate_wechat_html.py', 'w', encoding='utf-8').write(content)
print('Fixed section_header')
