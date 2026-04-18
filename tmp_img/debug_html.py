# -*- coding: utf-8 -*-
content = open(r'C:\Users\Administrator\.openclaw\workspace\tmp_img\article_wechat.html', 'r', encoding='utf-8').read()

# Find all stats sections and check if they have content
import re

# Count occurrences of key patterns
print('Stats row (poss %):', content.count('%</td>'))
print('Stats row (角球):', content.count('\u89d2\u7403'))
print()

# Look at a sample stats section from first match card
# Find the first occurrence of '58%' which is Melbourne possession
idx = content.find('58%')
if idx > 0:
    # Show surrounding context
    start = max(0, idx - 200)
    end = min(len(content), idx + 300)
    print('First stats area (chars %d-%d):' % (start, end))
    print(repr(content[start:end]))
    print()

# Check what the inner stats table looks like
idx2 = content.find('text-indent:0!important;\">\n      <table')
if idx2 > 0:
    print('Inner stats table snippet:')
    print(repr(content[idx2:idx2+400]))
