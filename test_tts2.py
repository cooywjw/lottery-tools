import asyncio
import socket
import edge_tts

# Patch socket to use fixed DNS
original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    if 'speech.platform.bing.com' in host:
        # Use IP directly
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', ('150.171.27.10', port))]
    return original_getaddrinfo(host, port, family, type, proto, flags)

socket.getaddrinfo = patched_getaddrinfo

async def test():
    try:
        communicate = edge_tts.Communicate('各位观众大家好，欢迎来到今天的足球赛事分析', 'zh-CN-XiaoxiaoNeural')
        await communicate.save('D:/work/media/tts_test.mp3')
        print('OK')
    except Exception as e:
        print(f'Error: {e}')

asyncio.run(test())
