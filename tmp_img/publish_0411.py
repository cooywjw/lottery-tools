import sys
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

with open('C:/Users/Administrator/.openclaw/workspace/tmp_img/article_lottery_0411.html', 'r', encoding='utf-8') as f:
    content = f.read()

publisher = WeChatPublisher()
result = publisher.create_draft(
    title='昨夜竞彩冷门频出，今晚欧联 + 五大联赛再战',
    content=content,
    thumb_media_id='',
    digest='赛果复盘+今日场次一览，理性看球',
    content_base_dir='C:/Users/Administrator/.openclaw/workspace/tmp_img'
)

print('Draft media_id:', result['media_id'])
