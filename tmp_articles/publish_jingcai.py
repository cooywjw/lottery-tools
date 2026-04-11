import sys
sys.path.insert(0, 'C:/Users/Administrator/.openclaw/workspace/skills/wechat-publisher/scripts')
from publisher import WeChatPublisher

with open('/tmp/article_styled.html', 'r', encoding='utf-8') as f:
    content = f.read()

publisher = WeChatPublisher()
result = publisher.create_draft(
    title='昨夜竞彩冷门频出，今晚欧联 + 解放者杯再战',
    content=content,
    thumb_media_id='',
    digest='昨夜欧冠+解放者杯冷门不断，今日欧联欧协联解放者杯继续开战，7场重点赛事前瞻',
    content_base_dir='/tmp'
)
print(f"Draft media_id: {result['media_id']}")
