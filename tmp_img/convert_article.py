import sys
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')

read_path = 'G:/Users/Administrator/Downloads/4.15周三竞彩全场次详细回顾+4.16周四赛事前瞻.md'

with open(read_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.strip().split('\n')
if lines[0].startswith('#'):
    title = lines[0].lstrip('#').strip()
    body = '\n'.join(lines[1:]).strip()
else:
    title = read_path.split('/')[-1].replace('.md', '')
    body = content

with open('C:/Users/Administrator/.openclaw/workspace/tmp_img/article_body.md', 'w', encoding='utf-8') as f:
    f.write(body)

print(f"Title: {title}")
print(f"Body length: {len(body)} chars")
print("Body saved to tmp_img/article_body.md")
