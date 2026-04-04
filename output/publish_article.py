import sys
import os

# Add skill scripts to path
skill_root = r"C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher"
sys.path.insert(0, os.path.join(skill_root, "scripts"))

from publisher import WeChatPublisher

# Read the HTML file
html_path = r"C:\Users\Administrator\.openclaw\workspace\output\article_20260403_jingcai.html"
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Create publisher instance
publisher = WeChatPublisher()

# Extract title from HTML content (simple approach - look for h1 tag)
title_start = content.find('<h1>')
title_end = content.find('</h1>')
if title_start != -1 and title_end != -1:
    title = content[title_start + 4:title_end]
    # Remove <br> tags from title
    title = title.replace('<br>', ' ').replace('<br/>', '').strip()
else:
    title = "4月3日竞彩13场赛事全解析"

print(f"Publishing article: {title}")
print(f"Content length: {len(content)} chars")

# Create draft
result = publisher.create_draft(
    title=title,
    content=content,
    author="慈云小白说球",
    digest="",
    content_base_dir=os.path.dirname(html_path)
)

print(f"\nResult: {result}")
