# -*- coding: utf-8 -*-
import json, time, re, os
import websocket, urllib.request

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
        req = urllib.request.Request(
            f'http://{HOST}:{PORT}/json',
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            tabs = json.loads(resp.read())
        ws_url = tabs[0]['webSocketDebuggerUrl']
        self.ws = websocket.create_connection(ws_url, suppress_redirect=True)
    
    def send(self, method, params=None):
        import threading
        self.lock = threading.Lock()
        with self.lock:
            self.msg_id += 1
            mid = self.msg_id
        self.ws.send(json.dumps({'id': mid, 'method': method, 'params': params or {}}))
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

def extract_from_html(html):
    results = {'en': '', 'zh': '', 'tags': [], 'model': ''}
    
    # All pre tags (prompt boxes)
    pres = re.findall(r'<pre[^>]*>([^<]+)</pre>', html)
    
    for pre in pres:
        t = pre.strip()
        if len(t) < 30:
            continue
        # Check if contains Chinese
        if '\u4e00' <= t[0] <= '\u9fff' or re.search(r'[\u4e00-\u9fff]{10,}', t):
            if not results['zh']:
                results['zh'] = t
        elif re.search(r'[a-zA-Z]{20,}', t):
            if not results['en']:
                results['en'] = t
    
    # Also try specific patterns
    en_m = re.search(r'class="whitespace-pre-wrap font-mono text-sm[^"]*p-4[^>]*>([^<]+)<', html)
    if en_m and not results['en']:
        results['en'] = en_m.group(1).strip()
    
    # Tags
    tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', html)
    results['tags'] = [t.strip() for t in tags if t.strip() and 2 < len(t.strip()) < 30]
    
    # Model
    m = re.search(r'模型:\s*(?:<!--[^>]*>)?\s*<[^>]*>([^<]{2,30})<', html)
    if m:
        results['model'] = m.group(1).strip()
    if not results['model']:
        m2 = re.search(r'Nano Banana Pro|Nano Banana 2|Seedance 2\.0|ChatGPT|Grok', html)
        if m2:
            results['model'] = m2.group(0)
    
    return results

def main():
    save_dir = r'G:\opennana_prompts'
    progress_file = os.path.join(save_dir, 'scraped_detail.json')
    
    with open(os.path.join(save_dir, 'all_prompts.json'), 'r', encoding='utf-8') as f:
        all_prompts = json.load(f)
    
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            scraped = json.load(f)
    else:
        scraped = {}
    
    print(f'Total: {len(all_prompts)}, Already scraped: {len(scraped)}')
    
    cdp = CDPClient()
    cdp.connect()
    cdp.send('Page.enable')
    cdp.send('Network.enable')
    time.sleep(0.5)
    
    done = 0
    errors = 0
    
    for i, item in enumerate(all_prompts):
        slug = item['slug']
        
        if slug in scraped and scraped[slug].get('zh_prompt'):
            continue
        
        url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
        
        try:
            nav = cdp.send('Page.navigate', {'url': url})
            time.sleep(2.5)
            
            result = cdp.send('Runtime.evaluate', {
                'expression': 'document.documentElement.outerHTML',
                'returnByValue': True
            })
            
            if result and result.get('result', {}).get('result', {}).get('type') == 'string':
                html = result['result']['result']['value']
                data = extract_from_html(html)
                scraped[slug] = {
                    'en_prompt': data['en'],
                    'zh_prompt': data['zh'],
                    'tags': data['tags'],
                    'model': data['model'],
                }
                done += 1
            else:
                scraped[slug] = {'en_prompt': '', 'zh_prompt': '', 'tags': [], 'model': '', 'error': 'no_html'}
                errors += 1
        
        except Exception as e:
            errors += 1
            scraped[slug] = {'en_prompt': '', 'zh_prompt': '', 'tags': [], 'model': '', 'error': str(e)}
            if errors <= 3:
                print(f'Error {slug}: {e}')
        
        if (i + 1) % 20 == 0:
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(scraped, f, ensure_ascii=False, indent=2)
            with open(os.path.join(save_dir, 'all_prompts.json'), 'r', encoding='utf-8') as f:
                total = len(json.load(f))
            print(f'Progress: {i+1}/{total} | Done: {done} | Errors: {errors}')
    
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(scraped, f, ensure_ascii=False, indent=2)
    
    cdp.close()
    print(f'DONE! Scraped: {done}, Errors: {errors}')

if __name__ == '__main__':
    main()
