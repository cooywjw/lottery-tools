# -*- coding: utf-8 -*-
import json, re, html as html_mod

def fix_text(t):
    """Unescape HTML entities and unicode escapes"""
    if not t:
        return ''
    t = html_mod.unescape(t)
    # Fix unicode escapes like \u8bf7
    try:
        t = t.encode('utf-8').decode('unicode_escape') if '\\u' in t else t
    except:
        pass
    return t

def extract_from_html(html):
    results = {'en': '', 'zh': '', 'tags': [], 'model': ''}
    
    # All pre tags
    pres = re.findall(r'<pre[^>]*>([^<]+)</pre>', html)
    
    for pre in pres:
        t = pre.strip()
        if len(t) < 30:
            continue
        t = fix_text(t)
        if '\u4e00' <= t[0] <= '\u9fff':
            if not results['zh']:
                results['zh'] = t
        elif re.search(r'[a-zA-Z]{20,}', t):
            if not results['en']:
                results['en'] = t
    
    # Tags
    tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', html)
    results['tags'] = [fix_text(t.strip()) for t in tags if 2 < len(t.strip()) < 30]
    
    # Model
    m = re.search(r'模型:\s*(?:<!--[^>]*>)?\s*<[^>]*>([^<]{2,30})<', html)
    if m:
        results['model'] = fix_text(m.group(1).strip())
    if not results['model']:
        m2 = re.search(r'Nano Banana Pro|Nano Banana 2|Seedance 2\.0|ChatGPT|Grok', html)
        if m2:
            results['model'] = m2.group(0)
    
    return results

# Test with current scraped data
with open(r'G:\opennana_prompts\scraped_detail.json', 'r', encoding='utf-8') as f:
    scraped = json.load(f)

# Re-extract with fix
test_slug = 'golden-hour-eiffel-legs'
with open(r'G:\opennana_prompts\all_prompts.json', 'r', encoding='utf-8') as f:
    all_p = json.load(f)

print(f'Scraped: {len(scraped)}')
print(f'Total: {len(all_p)}')

# Check how many have good ZH
good_zh = sum(1 for v in scraped.values() if v.get('zh_prompt') and '\u4e00' <= v['zh_prompt'][0] <= '\u9fff')
print(f'Good ZH: {good_zh}')

# Show a sample
for k, v in list(scraped.items())[:2]:
    print(f'\n--- {k} ---')
    print(f'EN: {v.get("en_prompt", "")[:80]}')
    print(f'ZH raw: {v.get("zh_prompt", "")[:80]}')
    print(f'Tags: {v.get("tags", "")[:4]}')
    print(f'Model: {v.get("model", "")}')
