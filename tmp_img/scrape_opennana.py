# -*- coding: utf-8 -*-
"""
OpenNana 提示词爬虫
从详情页提取：中文提示词 + 英文提示词 + 标题 + 标签 + 图片URL
"""
import re, os, json, time, requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://opennana.com/',
}

SAVE_DIR = r'G:\opennana_prompts'
os.makedirs(SAVE_DIR, exist_ok=True)

# ---------- 从首页HTML提取所有slug ----------
def extract_slugs_from_home(html_content):
    """从首页HTML的initialPrompts中提取所有slug"""
    pattern = r'"slug":"([^"]+)"'
    return list(set(re.findall(pattern, html_content)))

# ---------- 从详情页提取数据 ----------
def fetch_prompt_detail(slug):
    """抓取单个提示词详情页，提取提示词文本"""
    url = f'https://opennana.com/awesome-prompt-gallery/{slug}'
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        if resp.status_code != 200:
            return None
        
        html = resp.text
        
        # 提取英文提示词
        en_match = re.search(
            r'class="whitespace-pre-wrap font-mono text-sm text-slate-800 dark:text-white p-4 md:p-6">([^<]+)</pre>',
            html
        )
        # 提取中文提示词
        zh_match = re.search(
            r'中文</span></div><pre class="whitespace-pre-wrap font-mono[^>]*>([^<]+)</pre>',
            html
        )
        # 备选方案
        if not zh_match:
            parts = html.split('中文')
            if len(parts) > 1:
                zh_match = re.search(r'<pre class="whitespace-pre-wrap[^>]*>([^<]+)</pre>', parts[-1])
        
        # 提取标题
        title_match = re.search(r'<h1 class="text-xl md:text-2xl font-bold[^>]*>([^<]+)</h1>', html)
        
        # 提取标签
        tag_pattern = r'<span class="tag-chip[^>]*>([^<]+)</span>'
        tags = re.findall(tag_pattern, html)
        tags = [t.strip() for t in tags if t.strip()]
        
        # 提取图片URL（示例图片）
        img_match = re.search(r'"image":"(https?://[^"]+)"', html)
        
        # 提取模型
        model_match = re.search(r'模型:\s*<!--[^>]*>-->\s*<[^>]+>([^<]+)<', html)
        if not model_match:
            model_match = re.search(r'模型:\s*([^<{,\]]+)', html)
        
        result = {
            'slug': slug,
            'title': title_match.group(1).strip() if title_match else slug,
            'en_prompt': en_match.group(1).strip() if en_match else '',
            'zh_prompt': zh_match.group(1).strip() if zh_match else '',
            'tags': tags,
            'image_url': img_match.group(1).strip() if img_match else '',
            'model': model_match.group(1).strip() if model_match else 'unknown',
            'url': url,
        }
        return result
        
    except Exception as e:
        return {'slug': slug, 'error': str(e)}

def extract_all_slugs_from_gallery_pages():
    """从gallery首页HTML提取所有slug（跨多页）"""
    slugs = set()
    
    # 尝试抓前20页
    for page in range(1, 21):
        print(f"抓取 gallery 第 {page} 页...")
        url = f'https://opennana.com/awesome-prompt-gallery?page={page}'
        try:
            resp = requests.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                page_slugs = extract_slugs_from_home(resp.text)
                if page_slugs:
                    slugs.update(page_slugs)
                    print(f"  找到 {len(page_slugs)} 个slug")
                else:
                    break
            else:
                break
        except Exception as e:
            print(f"  第{page}页失败: {e}")
        time.sleep(0.5)
    
    return list(slugs)

def run():
    print("=" * 60)
    print("OpenNana 提示词爬虫")
    print("=" * 60)
    
    # 1. 加载已保存的gallery首页HTML
    home_html_path = r'C:\Users\Administrator\.openclaw\workspace\tmp_img\gallery_home.html'
    if os.path.exists(home_html_path):
        print("从已保存的gallery页面提取slug...")
        with open(home_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        initial_slugs = extract_slugs_from_home(html)
        print(f"从首页提取到 {len(initial_slugs)} 个slug")
    
    # 2. 补充更多slug
    print("抓取更多gallery页面补充slug...")
    more_slugs = extract_all_slugs_from_gallery_pages()
    print(f"从gallery页面共获取 {len(more_slugs)} 个slug")
    
    all_slugs = list(set(initial_slugs + more_slugs))
    print(f"去重后共 {len(all_slugs)} 个slug")
    
    # 3. 批量抓取详情
    all_data = []
    total = len(all_slugs)
    
    print(f"\n开始抓取 {total} 个详情页...")
    done = 0
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_prompt_detail, slug): slug for slug in all_slugs}
        for future in as_completed(futures):
            done += 1
            if done % 50 == 0:
                print(f"进度: {done}/{total}")
            result = future.result()
            if result and 'error' not in result:
                all_data.append(result)
    
    print(f"\n抓取完成，共获取 {len(all_data)} 个有效提示词")
    
    # 4. 保存为JSON
    json_path = os.path.join(SAVE_DIR, 'all_prompts.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f"JSON已保存: {json_path}")
    
    # 5. 生成分类CSV
    generate_csv(all_data)
    
    return all_data

def generate_csv(data):
    """生成分类CSV表格"""
    import csv
    
    # 按标签分门别类
    categories = {}
    for item in data:
        for tag in item.get('tags', []):
            if tag not in categories:
                categories[tag] = []
            categories[tag].append(item)
    
    # 主CSV：所有提示词
    csv_path = os.path.join(SAVE_DIR, '提示词总表.csv')
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['序号', '标题', '中文提示词', '英文提示词', '标签', '模型', '图片URL', '链接'])
        for i, item in enumerate(data, 1):
            writer.writerow([
                i,
                item.get('title', ''),
                item.get('zh_prompt', ''),
                item.get('en_prompt', ''),
                '|'.join(item.get('tags', [])),
                item.get('model', ''),
                item.get('image_url', ''),
                item.get('url', ''),
            ])
    print(f"总表CSV已保存: {csv_path}")
    
    # 分类CSV
    csv_count = 0
    for tag, items in categories.items():
        if len(items) >= 3:  # 只生成3个以上的分类
            safe_name = re.sub(r'[\\/:*?"<>|]', '_', tag)
            cat_path = os.path.join(SAVE_DIR, f'分类_{safe_name}.csv')
            with open(cat_path, 'w', encoding='utf-8-sig', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['序号', '标题', '中文提示词', '英文提示词', '标签', '模型', '链接'])
                for i, item in enumerate(items, 1):
                    writer.writerow([
                        i,
                        item.get('title', ''),
                        item.get('zh_prompt', ''),
                        item.get('en_prompt', ''),
                        '|'.join(item.get('tags', [])),
                        item.get('model', ''),
                        item.get('url', ''),
                    ])
            csv_count += 1
    
    print(f"分类CSV已保存 {csv_count} 个")
    
    # 保存分类索引
    idx_path = os.path.join(SAVE_DIR, '分类索引.json')
    idx = {tag: len(items) for tag, items in categories.items()}
    with open(idx_path, 'w', encoding='utf-8') as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)
    print(f"分类索引已保存: {idx_path}")

if __name__ == '__main__':
    run()
