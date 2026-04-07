# -*- coding: utf-8 -*-
import re, os, json, time, requests
from concurrent.futures import ThreadPoolExecutor, as_completed

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
}

SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

def unescape_js_str(s):
    """还原JS转义字符串"""
    return s.replace('\\"', '"').replace('\\\\', '\\')

def extract_slugs_from_html(html):
    """从gallery页HTML提取slug（JS转义格式）"""
    # 匹配 \"slug\":\"value\" 格式
    matches = re.findall(r'\\"slug\\":\\"([^"\\]+)\\"', html)
    return list(set(matches))

def extract_all_data_from_gallery_html(html):
    """从gallery HTML提取所有数据（初始批次）"""
    # 匹配 initialPrompts 中的所有条目
    # 格式: \\"id\\":12708,\\"slug\\":\\"xxx\\",\\"title\\":\\"xxx\\"
    entries = []
    
    # 找到 initialPrompts 区域
    start = html.find('initialPrompts')
    if start == -1:
        return entries
    
    # 提取所有 slug
    slugs = extract_slugs_from_html(html)
    print(f"从HTML找到 {len(slugs)} 个slug")
    
    # 提取所有标题（JS转义）
    titles = re.findall(r'\\"title\\":\\"([^"\\]+)\\"', html)
    print(f"从HTML找到 {len(titles)} 个标题")
    
    # 提取所有图片URL
    imgs = re.findall(r'\\"cover_image\\":\\"([^"\\]+)\\"', html)
    print(f"从HTML找到 {len(imgs)} 个图片URL")
    
    # 匹配 id
    ids = re.findall(r'\\"id\\":(\d+)', html)
    print(f"从HTML找到 {len(ids)} 个ID")
    
    # 组装
    for i in range(min(len(slugs), len(titles))):
        entries.append({
            'slug': unescape_js_str(slugs[i]),
            'title': unescape_js_str(titles[i]) if i < len(titles) else '',
            'image_url': unescape_js_str(imgs[i]) if i < len(imgs) else '',
        })
    
    return entries

def fetch_prompt_detail(slug):
    """抓取单个提示词详情页"""
    url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None
        
        html = resp.text
        
        # 提取英文提示词 - 多try
        en_prompt = ''
        for pattern in [
            r'class="whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-white p-4 md:p-6">([^<]+)</pre>',
            r'"text":"(Take this base[^"]+)"',
            r'photoreal sunset lighting[^<]+',
        ]:
            m = re.search(pattern, html)
            if m:
                en_prompt = m.group(1).strip()
                break
        
        # 提取中文提示词
        zh_prompt = ''
        for pattern in [
            r'中文</span></div><pre[^>]*>([^<]+)</pre>',
            r'"text":"(请使用这张基础图片[^"]+)"',
        ]:
            m = re.search(pattern, html)
            if m:
                zh_prompt = m.group(1).strip()
                break
        
        # 提取标题
        title_m = re.search(r'<h1 class="text-xl md:text-2xl font-bold[^>]*>([^<]+)</h1>', html)
        title = title_m.group(1).strip() if title_m else slug
        
        # 提取标签
        tags = re.findall(r'<span class="tag-chip[^>]*>([^<]+)</span>', html)
        tags = [t.strip() for t in tags if t.strip()]
        
        # 提取模型
        model_m = re.search(r'模型:\s*(?:<!--[^>]*>-->)?\s*<[^>]*>([^<]+)<', html)
        if not model_m:
            model_m = re.search(r'Nano banana pro|Seeds?\d|Succession', html)
            model = model_m.group(0) if model_m else 'unknown'
        else:
            model = model_m.group(1).strip()
        
        # 提取图片URL
        img_m = re.search(r'"image":"(https?://[^"]+)"', html)
        img_url = img_m.group(1).strip() if img_m else ''
        
        # 来源
        src_m = re.search(r'@([\w]+)</a>', html)
        source = f"@{src_m.group(1)}" if src_m else ''
        
        return {
            'slug': slug,
            'title': title,
            'en_prompt': en_prompt,
            'zh_prompt': zh_prompt,
            'tags': tags,
            'model': model,
            'image_url': img_url,
            'source': source,
            'url': url,
        }
    except Exception as e:
        return {'slug': slug, 'error': str(e)}

def run():
    print("=" * 60)
    print("OpenNana 提示词爬虫")
    print("=" * 60)
    
    # 1. 加载gallery首页
    home_path = r'C:\Users\Administrator\.openclaw\workspace\tmp_img\gallery_home.html'
    if os.path.exists(home_path):
        with open(home_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
        entries = extract_all_data_from_gallery_html(html)
        print(f"初始批次: {len(entries)} 条")
    
    # 2. 抓取gallery多页补充slug
    more_slugs = []
    for page in range(2, 6):
        print(f"\n抓取 gallery 第 {page} 页...")
        url = f'https://opennana.com/awesome-prompt-gallery?page={page}'
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                slugs = extract_slugs_from_html(resp.text)
                more_slugs.extend(slugs)
                print(f"  找到 {len(slugs)} 个slug")
            else:
                break
        except Exception as e:
            print(f"  失败: {e}")
        time.sleep(1)
    
    all_slugs = list(set([e['slug'] for e in entries] + more_slugs))
    print(f"\n共 {len(all_slugs)} 个slug待抓取")
    
    # 3. 批量抓取详情
    all_data = []
    done = 0
    total = len(all_slugs)
    
    print(f"\n开始抓取详情页（最多 {total} 个）...")
    print("提示：可随时查看 G:\\opennana_prompts\\progress.json 进度\n")
    
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_prompt_detail, slug): slug for slug in all_slugs}
        for future in as_completed(futures):
            done += 1
            result = future.result()
            if result and 'error' not in result:
                all_data.append(result)
            
            if done % 100 == 0:
                print(f"[{done}/{total}] 最近成功: {result.get('title', 'N/A')[:30] if result else 'FAIL'}")
                # 保存进度
                with open(os.path.join(SAVE_DIR, 'progress.json'), 'w', encoding='utf-8') as f:
                    json.dump(all_data, f, ensure_ascii=False)
    
    print(f"\n✅ 抓取完成！共 {len(all_data)} 个有效提示词")
    
    # 4. 保存
    json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f"JSON: {json_path}")
    
    # 5. 生成CSV
    generate_csv(all_data)

def generate_csv(data):
    import csv
    
    # 总表
    csv_path = os.path.join(SAVE_DIR, '提示词总表.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['序号', '标题', '中文提示词', '英文提示词', '标签', '模型', '来源', '图片URL', '链接'])
        for i, item in enumerate(data, 1):
            writer.writerow([
                i,
                item.get('title', ''),
                item.get('zh_prompt', ''),
                item.get('en_prompt', ''),
                '|'.join(item.get('tags', [])),
                item.get('model', ''),
                item.get('source', ''),
                item.get('image_url', ''),
                item.get('url', ''),
            ])
    print(f"总表: {csv_path}")
    
    # 分类
    categories = {}
    for item in data:
        for tag in item.get('tags', []):
            cat = categories.setdefault(tag, [])
            cat.append(item)
    
    saved = 0
    for tag, items in categories.items():
        if len(items) >= 3:
            safe = re.sub(r'[\\/:*?"<>|]', '_', tag)
            path = os.path.join(SAVE_DIR, f'分类_{safe}.csv')
            with open(path, 'w', encoding='utf-8-sig', newline='') as f:
                w = csv.writer(f)
                w.writerow(['序号', '标题', '中文提示词', '英文提示词', '模型', '链接'])
                for i, item in enumerate(items, 1):
                    w.writerow([i, item.get('title'), item.get('zh_prompt'), 
                               item.get('en_prompt'), item.get('model'), item.get('url')])
            saved += 1
    
    print(f"分类CSV: {saved} 个")
    
    # 索引
    idx = {tag: len(items) for tag, items in categories.items()}
    with open(os.path.join(SAVE_DIR, '分类索引.json'), 'w', encoding='utf-8') as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)
    print("分类索引已保存")

if __name__ == '__main__':
    run()
