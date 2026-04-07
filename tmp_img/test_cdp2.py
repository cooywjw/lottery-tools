# -*- coding: utf-8 -*-
import json, time, re
import websocket

HOST = 'localhost'
PORT = 9222

class CDPClient:
    def __init__(self):
        self.ws = None
        self.msg_id = 0
        self.resp_events = {}
        import threading
        self.lock = threading.Lock()
    
    def connect(self):
        import urllib.request
        req = urllib.request.Request(
            f'http://{HOST}:{PORT}/json',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tabs = json.loads(resp.read())
        ws_url = tabs[0]['webSocketDebuggerUrl']
        print(f'Connecting to: {ws_url}')
        self.ws = websocket.create_connection(ws_url, suppress_redirect=True)
        print('Connected!')
    
    def send(self, method, params=None):
        import threading
        self.lock = threading.Lock()
        with self.lock:
            self.msg_id += 1
            mid = self.msg_id
        msg = json.dumps({'id': mid, 'method': method, 'params': params or {}})
        self.ws.send(msg)
        start = time.time()
        while time.time() - start < 15:
            try:
                resp = self.ws.recv()
                if resp:
                    r = json.loads(resp)
                    if r.get('id') == mid:
                        with self.lock:
                            self.resp_events[mid] = r
                        return r
            except:
                time.sleep(0.05)
        return None
    
    def close(self):
        if self.ws:
            self.ws.close()

# Test
cdp = CDPClient()
cdp.connect()
r = cdp.send('Page.enable')
print('Page.enable:', r)
r2 = cdp.send('Network.enable')
print('Network.enable:', r2)
time.sleep(0.5)

print('Navigating...')
r3 = cdp.send('Page.navigate', {'url': 'https://opennana.com/awesome-prompt-gallery/golden-hour-eiffel-legs'})
print('Nav:', r3)

time.sleep(3)

print('Getting HTML...')
r4 = cdp.send('Runtime.evaluate', {
    'expression': 'document.documentElement.outerHTML',
    'returnByValue': True
})

if r4:
    result = r4.get('result', {}).get('result', {})
    if result.get('type') == 'string':
        html = result['value']
        print(f'HTML length: {len(html)}')
        
        # Extract
        en_m = re.search(r'English</span></div><pre[^>]*>([^<]+)</pre>', html)
        zh_m = re.search(r'中文</span></div><pre[^>]*>([^<]+)</pre>', html)
        
        print(f'EN prompt found: {bool(en_m)}')
        if en_m: print(f'  {en_m.group(1)[:100]}')
        print(f'ZH prompt found: {bool(zh_m)}')
        if zh_m: print(f'  {zh_m.group(1)[:100]}')
        
        # Check pre tags
        pres = re.findall(r'<pre[^>]*>([^<]{30,})</pre>', html)
        print(f'Long pre tags: {len(pres)}')
        for p in pres[:3]:
            print(f'  {p[:80]}')
    else:
        print('No string result:', result)
else:
    print('Failed to get HTML')

cdp.close()
print('Test done!')
