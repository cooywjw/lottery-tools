# -*- coding: utf-8 -*-
"""
Minimal CDP (Chrome DevTools Protocol) client using only built-in modules.
Connects to Chrome remote debugging port and extracts page content.
"""
import json, time, socket, threading, urllib.request, urllib.error

HOST = 'localhost'
PORT = 9222
DEBUG_PORT = 9222

class CDPClient:
    def __init__(self):
        self.ws = None
        self.sock = None
        self.msg_id = 0
        self.resp_events = {}
        self.lock = threading.Lock()
        self._recv_thread = None
    
    def connect(self):
        # Get WebSocket debugger URL
        req = urllib.request.Request(
            f'http://{HOST}:{DEBUG_PORT}/json',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tabs = json.loads(resp.read())
        
        # Find the first tab or use the explicit CDP endpoint
        if tabs:
            ws_url = tabs[0]['webSocketDebuggerUrl']
        else:
            ws_url = f'ws://{HOST}:{PORT}/devtools/browser'
        
        print(f'Connecting to: {ws_url}')
        
        # Parse WebSocket URL
        import re
        m = re.match(r'ws://([^:]+):(\d+)(.+)', ws_url)
        host, port, path = m.group(1), int(m.group(2)), m.group(3)
        
        # Connect TCP socket
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((host, port))
        
        # WebSocket handshake
        key = 'dGhlIHNhbXBsZSBub25jZQ=='  # Fixed base64 key for CDP
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
        
        # Read HTTP response
        data = b''
        while b'\r\n\r\n' not in data:
            data += self.sock.recv(4096)
        
        # Start recv thread
        self._recv_thread = threading.Thread(target=self._recv_loop, daemon=True)
        self._recv_thread.start()
        
        print('Connected!')
    
    def _recv_loop(self):
        buf = b''
        while True:
            try:
                d = self.sock.recv(8192)
                if not d:
                    break
                buf += d
                while buf:
                    # Try to parse WebSocket frame
                    if len(buf) < 2:
                        break
                    fin = (buf[0] & 0x80) != 0
                    opcode = buf[0] & 0x0F
                    masked = (buf[1] & 0x80) != 0
                    payload_len = buf[1] & 0x7F
                    
                    if opcode == 0x8:  # Close
                        self.sock.close()
                        return
                    
                    if opcode != 0x1:  # Not text
                        break
                    
                    hdr_len = 2
                    if payload_len == 126:
                        hdr_len = 4
                    elif payload_len == 127:
                        hdr_len = 10
                    
                    if len(buf) < hdr_len:
                        break
                    
                    if masked:
                        mask = buf[hdr_len:hdr_len+4]
                        payload = bytearray(buf[hdr_len+4:hdr_len+4+payload_len])
                        for i in range(len(payload)):
                            payload[i] ^= mask[i % 4]
                        text = payload.decode('utf-8', errors='replace')
                    else:
                        text = buf[hdr_len:hdr_len+payload_len].decode('utf-8', errors='replace')
                    
                    buf = buf[hdr_len+4+payload_len:]
                    
                    # Parse JSON message
                    try:
                        msg = json.loads(text)
                        with self.lock:
                            if 'id' in msg:
                                self.resp_events[msg['id']] = msg
                            else:
                                # Event
                                pass
                    except:
                        pass
            except Exception as e:
                print(f'Recv error: {e}')
                break
    
    def send(self, method, params=None):
        with self.lock:
            self.msg_id += 1
            mid = self.msg_id
        
        msg = json.dumps({'id': mid, 'method': method, 'params': params or {}})
        
        # WebSocket frame
        frame = bytearray()
        frame.append(0x81)  # FIN + text opcode
        payload = msg.encode('utf-8')
        length = len(payload)
        if length < 126:
            frame.append(0x80 | length)
        elif length < 65536:
            frame.append(0xFE)
            frame.extend(length.to_bytes(2, 'big'))
        else:
            frame.append(0xFF)
            frame.extend(length.to_bytes(8, 'big'))
        
        import secrets
        mask = secrets.token_bytes(4)
        masked = bytearray(payload)
        for i in range(len(masked)):
            masked[i] ^= mask[i % 4]
        frame.extend(mask)
        frame.extend(masked)
        
        with self.lock:
            self.sock.sendall(bytes(frame))
            # Wait for response
            start = time.time()
            while time.time() - start < 10:
                with self.lock:
                    if mid in self.resp_events:
                        return self.resp_events.pop(mid)
                time.sleep(0.05)
        return None
    
    def close(self):
        if self.sock:
            self.sock.close()

def extract_prompts(html_text):
    """Extract prompts from detail page HTML"""
    import re
    
    results = {'en': '', 'zh': '', 'tags': [], 'model': ''}
    
    # Find all pre tags (prompt content)
    pres = re.findall(r'<pre[^>]*class="[^"]*whitespace[^"]*"[^>]*>([^<]+)</pre>', html_text)
    
    for pre in pres:
        text = pre.strip()
        if len(text) < 20:
            continue
        if '\u4e00' <= text[0] <= '\u9fff':  # Starts with Chinese
            if not results['zh']:
                results['zh'] = text
        else:
            if not results['en']:
                results['en'] = text
    
    # Try alternate patterns
    if not results['en']:
        m = re.search(r'"text":"((?:[^"\\]|\\.){50,})"', html_text)
        if m:
            try:
                results['en'] = json.loads('"' + m.group(1) + '"')
            except:
                results['en'] = m.group(1)
    
    # Tags
    tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', html_text)
    results['tags'] = [t.strip() for t in tags if t.strip()]
    
    # Model
    m = re.search(r'模型:\s*(?:<!--[^>]*>)?\s*<[^>]*>([^<]{2,30})<', html_text)
    if m:
        results['model'] = m.group(1).strip()
    else:
        m = re.search(r'Nano Banana Pro|Nano Banana 2|Seedance 2\.0|ChatGPT|Grok', html_text)
        if m:
            results['model'] = m.group(0)
    
    return results

def scrape_all():
    # Load existing prompts
    save_dir = r'G:\opennana_prompts'
    with open(os.path.join(save_dir, 'all_prompts.json'), 'r', encoding='utf-8') as f:
        all_prompts = json.load(f)
    
    progress_file = os.path.join(save_dir, 'scraped_detail.json')
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            scraped = json.load(f)
    else:
        scraped = {}
    
    print(f'Total prompts: {len(all_prompts)}')
    print(f'Already scraped: {len(scraped)}')
    
    cdp = CDPClient()
    cdp.connect()
    
    # Enable Page domain
    cdp.send('Page.enable')
    cdp.send('Network.enable')
    time.sleep(0.5)
    
    total = len(all_prompts)
    done = 0
    errors = 0
    
    for i, item in enumerate(all_prompts):
        slug = item['slug']
        
        if slug in scraped and scraped[slug].get('en_prompt'):
            continue
        
        url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
        
        try:
            # Navigate
            cdp.send('Page.navigate', {'url': url})
            
            # Wait for page to load
            time.sleep(2)
            
            # Get HTML
            result = cdp.send('Runtime.evaluate', {
                'expression': 'document.documentElement.outerHTML',
                'returnByValue': True
            })
            
            if result and result.get('result', {}).get('result', {}).get('type') == 'string':
                html = result['result']['result']['value']
                data = extract_prompts(html)
                scraped[slug] = {
                    'en_prompt': data['en'],
                    'zh_prompt': data['zh'],
                    'tags': data['tags'],
                    'model': data['model'],
                }
            else:
                scraped[slug] = {'en_prompt': '', 'zh_prompt': '', 'tags': [], 'model': '', 'error': 'no_html'}
                errors += 1
            
            done += 1
            
            if (i + 1) % 10 == 0:
                # Save progress
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump(scraped, f, ensure_ascii=False, indent=2)
                print(f'Progress: {i+1}/{total} | Done this run: {done} | Errors: {errors}')
        
        except Exception as e:
            errors += 1
            scraped[slug] = {'en_prompt': '', 'zh_prompt': '', 'tags': [], 'model': '', 'error': str(e)}
            if errors <= 5:
                print(f'Error {slug}: {e}')
    
    # Final save
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(scraped, f, ensure_ascii=False, indent=2)
    
    cdp.close()
    print(f'DONE! Scraped: {done}, Errors: {errors}, Total: {total}')

if __name__ == '__main__':
    import os
    scrape_all()
