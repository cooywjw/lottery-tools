# -*- coding: utf-8 -*-
"""
Browser scraper for OpenNana - extracts Chinese and English prompts from detail pages
User must be logged in via Chrome Default profile.
"""
import json, re, os, time as time_module

SAVE_DIR = r'G:\opennana_prompts'
PROGRESS_FILE = os.path.join(SAVE_DIR, 'scraped_detail.json')
BATCH_SIZE = 50

def load_existing():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_progress(data):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_prompts_from_html(html):
    """Extract Chinese and English prompts from detail page HTML"""
    results = {}
    
    # English prompt - find the pre tag that follows "English" label
    en_pattern = r'class="text-sm text-slate-500 dark:text-text-subtle">English</span>.*?<pre[^>]*>([^<]+)</pre>'
    en_match = re.search(en_pattern, html, re.DOTALL)
    if en_match:
        results['en'] = en_match.group(1).strip()
    
    # Chinese prompt
    zh_pattern = r'中文</span></div><pre[^>]*>([^<]+)</pre>'
    zh_match = re.search(zh_pattern, html)
    if zh_match:
        results['zh'] = zh_match.group(1).strip()
    
    # Fallback: find all pre tags with prompt content
    if not results:
        pres = re.findall(r'<pre[^>]*>([^<]+)</pre>', html)
        for pre in pres:
            text = pre.strip()
            if len(text) > 20:  # Real prompt is usually long
                if '\u4e00' in text or '\u8bd5' in text:  # Has Chinese
                    if 'zh' not in results:
                        results['zh'] = text
                elif 'Take this' in text or 'photo' in text.lower() or 'image' in text.lower() or 'style' in text.lower():
                    if 'en' not in results:
                        results['en'] = text
    
    # Extract tags
    tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', html)
    tags = [t.strip() for t in tags if t.strip()]
    
    # Extract model
    model = ''
    m = re.search(r'模型:\s*(?:<!--[^>]*>)?\s*<[^>]*>([^<]{2,30})<', html)
    if m:
        model = m.group(1).strip()
    if not model:
        m = re.search(r'Nano Banana Pro|Nano Banana 2|Seedance 2\.0|ChatGPT|Grok', html)
        if m:
            model = m.group(0)
    
    return results.get('en', ''), results.get('zh', ''), tags, model

def run(browser, slugs_to_scrape, existing_data):
    """Main scraping loop - runs inside browser-use python"""
    total = len(slugs_to_scrape)
    scraped = 0
    errors = 0
    
    for i, slug in enumerate(slugs_to_scrape):
        if slug in existing_data:
            continue  # Already scraped
        
        url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
        
        try:
            browser.goto(url)
            browser.wait(2)  # Wait for content to load
            
            html = browser.html
            en, zh, tags, model = extract_prompts_from_html(html)
            
            existing_data[slug] = {
                'en_prompt': en,
                'zh_prompt': zh,
                'tags': tags,
                'model': model,
            }
            
            scraped += 1
            
            if (i + 1) % BATCH_SIZE == 0:
                save_progress(existing_data)
                print(f'Progress: {i+1}/{total} | Scraped this batch: {scraped} | Errors: {errors}')
            
        except Exception as e:
            errors += 1
            existing_data[slug] = {'en_prompt': '', 'zh_prompt': '', 'tags': [], 'model': '', 'error': str(e)}
            if errors <= 5:
                print(f'Error on {slug}: {e}')
        
        time_module.sleep(0.5)  # Be polite to server
    
    save_progress(existing_data)
    print(f'DONE! Scraped: {scraped}, Errors: {errors}, Total: {total}')
    return existing_data
