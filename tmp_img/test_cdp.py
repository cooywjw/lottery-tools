# -*- coding: utf-8 -*-
import sys, json, time, socket, re, threading, urllib.request, os

class CDPClient:
    def __init__(self):
        self.sock = None
        self.msg_id = 0
        self.resp_events = {}
        self.lock = threading.Lock()
        self._recv_thread = None
    
    def connect(self):
        req = urllib.request.Request(
            'http://localhost:9222/json',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tabs = json.loads(resp.read())
        
        ws_url = tabs[0]['webSocketDebuggerUrl']
        import re
        m = re.match(r'ws://([^:]+):(\d+)(.+)', ws_url)
        host, port, path = m.group(1), int(m.group(2)), m.group(3)
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((host, port))
        
        key = 'dGhlIHNhbXBsZSBub25jZQ=='
        handshake = (
            f'GET {path} HTTP/1.1\r\n'
            f'Host: {host}:{port}\r\n'
            f'Upgrade: websocket\r\n'
            f'Connection: Upgrade\r\n'
            f'Sec-WebSocket-Key: {key}\r\n'
            f'Sec-WebSocket-Version: 13\r\n'
            f'\r\n'
        )
        self.sock.sendall(handshake.encode())
        
        data = b''
        while b'\r\n\r\n' not in data:
            data += self.sock.recv(4096)
        
        self._recv_thread = threading.Thread(target=self._recv_loop, daemon=True)
        self._recv_thread.start()
        print('Connected!')
    
    def _recv_loop(self):
        buf = b''
        while True:
            try:
                d = self.sock.recv(8192)
                if not d: break
                buf += d
                while buf:
                    if len(buf) < 2: break
                    payload_len = buf[1] & 0x7F
                    hdr_len = 2 + (4 if payload_len == 126 else 10 if payload_len == 127 else 0)
                    if len(buf) < hdr_len: break
                    masked = (buf[1] & 0x80) != 0
                    payload = bytearray(buf[hdr_len:hdr_len+payload_len])
                    if masked:
                        mask = buf[hdr_len-4:hdr_len]
                        for i in range(len(payload)):
                            payload[i] ^= mask[i % 4]
                    text = payload.decode('utf-8', errors='replace')
                    buf = buf[hdr_len+payload_len:]
                    try:
                        msg = json.loads(text)
                        with self.lock:
                            if 'id' in msg:
                                self.resp_events[msg['id']] = msg
                    except: pass
            except Exception as e:
                print(f'Recv error: {e}')
                break
    
    def send(self, method, params=None):
        with self.lock:
            self.msg_id += 1
            mid = self.msg_id
        msg = json.dumps({'id': mid, 'method': method, 'params': params or {}})
        frame = bytearray([0x81, 0x80 | len(msg)])
        import secrets
        mask_bytes = secrets.token_bytes(4)
        frame.extend(mask_bytes)
        masked = bytearray(msg.encode('utf-8'))
        for i in range(len(masked)):
            masked[i] ^= mask_bytes[i % 4]
        frame.extend(masked)
        with self.lock:
            self.sock.sendall(bytes(frame))
            start = time.time()
            while time.time() - start < 15:
                with self.lock:
                    if mid in self.resp_events:
                        return self.resp_events.pop(mid)
                time.sleep(0.05)
        return None
    
    def close(self):
        if self.sock:
            self.sock.close()

# Test
cdp = CDPClient()
cdp.connect()
cdp.send('Page.enable')
cdp.send('Network.enable')
time.sleep(0.5)

print('Navigating to detail page...')
r = cdp.send('Page.navigate', {'url': 'https://opennana.com/awesome-prompt-gallery/golden-hour-eiffel-legs'})
print('Nav result:', r)

time.sleep(3)

print('Getting HTML...')
r2 = cdp.send('Runtime.evaluate', {
    'expression': 'document.documentElement.outerHTML',
    'returnByValue': True
})

if r2 and 'result' in r2:
    html = r2['result']['result']['value']
    print(f'HTML length: {len(html)}')
    
    # Extract prompts
    pres = re.findall(r'<pre[^>]*>([^<]{30,})</pre>', html)
    print(f'Found {len(pres)} pre tags')
    for p in pres[:5]:
        print(f'  {p[:80]}')
    
    # Find zh/en
    zh = re.search(r'中文</span></div><pre[^>]*>([^<]+)</pre>', html)
    en = re.search(r'English</span></div><pre[^>]*>([^<]+)</pre>', html)
    print(f'ZH: {zh.group(1)[:80] if zh else "NOT FOUND"}')
    print(f'EN: {en.group(1)[:80] if en else "NOT FOUND"}')
else:
    print('Failed to get HTML:', r2)

cdp.close()
