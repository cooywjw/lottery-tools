import asyncio
import edge_tts
import os

os.environ['CARES_DNS_SERVER'] = '8.8.8.8'

async def test():
    try:
        communicate = edge_tts.Communicate('各位观众大家好，欢迎来到今天的足球赛事分析', 'zh-CN-XiaoxiaoNeural')
        await communicate.save('D:/work/media/tts_test.mp3')
        print('OK')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
