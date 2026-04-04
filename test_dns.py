import asyncio
import aiodns
import os

os.environ['CARES_DNS_SERVER'] = '8.8.8.8'

async def test():
    resolver = aiodns.DNSResolver(nameservers=['8.8.8.8'])
    try:
        results = await resolver.query('speech.platform.bing.com', 'A')
        print(f'DNS OK: {[r.hostname for r in results]}')
    except Exception as e:
        print(f'DNS Error: {e}')

asyncio.run(test())
