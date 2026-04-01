import urllib.request
import json
import os

api_key = os.environ.get('MATON_API_KEY', '')
req = urllib.request.Request('https://ctrl.maton.ai/connections')
req.add_header('Authorization', f'Bearer {api_key}')

try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read())
    print('[OK] API Key is valid!')
    print(f'Connections count: {len(data.get("connections", []))}')
    if data.get('connections'):
        for conn in data['connections'][:3]:
            print(f"  - {conn.get('app', 'unknown')}: {conn.get('status', 'unknown')}")
except urllib.error.HTTPError as e:
    print(f'[ERROR] HTTP {e.code}: {e.reason}')
except Exception as e:
    print(f'[ERROR] {e}')
