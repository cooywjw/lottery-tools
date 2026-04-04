import sys
import os

skill_root = r"C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher"
sys.path.insert(0, os.path.join(skill_root, "scripts"))

from publisher import WeChatPublisher

html_path = r"C:\Users\Administrator\.openclaw\workspace\output\article_wechat_simple.html"
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

publisher = WeChatPublisher()

result = publisher.create_draft(
    title="4月3日（周五）竞彩13场赛事全解析｜早场+夜场全覆盖，焦点对决一文读懂",
    content=content,
    author="慈云小白说球",
    digest="",
    content_base_dir=os.path.dirname(html_path)
)

print(f"Result: {result}")
