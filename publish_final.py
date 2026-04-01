import sys
import os
import json
import time
import hashlib
import urllib.request
import urllib.parse

# 微信公众号配置
APPID = "wxd45ed6706fa1547d"
APPSECRET = "80b90354feaef5632500d2608e6ae516"
AUTHOR = "慈云小白说球"

# 缓存文件路径
TOKEN_CACHE_FILE = r'C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher\token_cache.json'

def get_access_token():
    """获取 access_token，优先使用缓存"""
    # 检查缓存
    if os.path.exists(TOKEN_CACHE_FILE):
        try:
            with open(TOKEN_CACHE_FILE, 'r') as f:
                cache = json.load(f)
            if cache.get('expires_at', 0) > time.time() + 300:
                print(f"[INFO] 使用缓存的 access_token (过期时间: {time.ctime(cache['expires_at'])})")
                return cache['access_token']
        except Exception as e:
            print(f"[WARN] 读取缓存失败: {e}")
    
    # 重新获取 token
    print("[INFO] 正在获取新的 access_token...")
    url = f"https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={APPID}&secret={APPSECRET}"
    
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"[ERROR] 请求失败: {e}")
        return None
    
    if 'access_token' not in data:
        print(f"[ERROR] 获取 token 失败: {data}")
        return None
    
    access_token = data['access_token']
    expires_in = data.get('expires_in', 7200)
    
    # 保存缓存
    cache = {
        'access_token': access_token,
        'expires_at': int(time.time()) + expires_in
    }
    try:
        with open(TOKEN_CACHE_FILE, 'w') as f:
            json.dump(cache, f)
        print(f"[INFO] access_token 已缓存")
    except Exception as e:
        print(f"[WARN] 保存缓存失败: {e}")
    
    return access_token

def upload_image(access_token, image_path):
    """上传图片到微信素材库（获取永久素材ID）"""
    print(f"[INFO] 正在上传图片: {image_path}")
    
    import mimetypes
    import random
    import string
    
    boundary = '----' + ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    
    # 读取图片
    with open(image_path, 'rb') as f:
        image_data = f.read()
    
    filename = os.path.basename(image_path)
    content_type = mimetypes.guess_type(image_path)[0] or 'image/jpeg'
    
    # 构建 multipart/form-data
    body = []
    body.append(f'--{boundary}\r\n'.encode())
    body.append(f'Content-Disposition: form-data; name="media"; filename="{filename}"\r\n'.encode())
    body.append(f'Content-Type: {content_type}\r\n\r\n'.encode())
    body.append(image_data)
    body.append(f'\r\n--{boundary}--\r\n'.encode())
    
    body = b''.join(body)
    
    # 使用新增永久素材接口（用于草稿封面图）
    url = f"https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={access_token}&type=image"
    
    req = urllib.request.Request(url, data=body, method='POST')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Content-Length', str(len(body)))
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"[ERROR] 上传失败: {e}")
        return None
    
    if 'media_id' not in result:
        print(f"[ERROR] 上传图片失败: {result}")
        return None
    
    print(f"[INFO] 图片上传成功，media_id: {result['media_id'][:20]}...")
    return result['media_id']

def create_draft(access_token, title, content, author, digest, thumb_media_id=""):
    """创建图文草稿"""
    print(f"[INFO] 正在创建草稿: {title}")
    
    # 构建图文消息（不设置封面图，内容中已包含图片）
    # 注意：微信草稿 API 要求 thumb_media_id 必须存在，即使为空也要传 null 而不是空字符串
    articles = [{
        "title": title,
        "author": author,
        "digest": digest,
        "content": content,
        "content_source_url": "",
        "show_cover_pic": 0,
        "need_open_comment": 1,
        "only_fans_can_comment": 0
    }]
    # 如果 thumb_media_id 为空，不传该字段
    if thumb_media_id:
        articles[0]["thumb_media_id"] = thumb_media_id
    
    data = {
        "articles": articles
    }
    
    url = f"https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}"
    
    req = urllib.request.Request(
        url,
        data=json.dumps(data, ensure_ascii=False).encode('utf-8'),
        method='POST',
        headers={'Content-Type': 'application/json; charset=utf-8'}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"[ERROR] 请求失败: {e}")
        return None
    
    if 'media_id' not in result:
        print(f"[ERROR] 创建草稿失败: {result}")
        return None
    
    return result

def main():
    print("=" * 60)
    print("WeChat Publisher Tool")
    print("=" * 60)
    
    # 1. 获取 access_token
    access_token = get_access_token()
    if not access_token:
        print("[ERROR] 无法获取 access_token，请检查 AppID 和 AppSecret")
        return
    
    print(f"[INFO] access_token: {access_token[:20]}...")
    
    # 2. 先上传封面图
    print("[INFO] 正在上传封面图...")
    cover_image = r'G:\公众号图片\2026美加墨世界杯.png'
    thumb_media_id = None
    if os.path.exists(cover_image):
        thumb_media_id = upload_image(access_token, cover_image)
        if thumb_media_id:
            print(f"[INFO] 封面图上传成功")
        else:
            print("[WARN] 封面图上传失败，将不设置封面")
    else:
        print(f"[WARN] 封面图不存在: {cover_image}")
    
    # 3. 读取文章内容
    article_path = r'C:\Users\Administrator\.openclaw\workspace\2026世界杯前瞻-公众号就绪版.html'
    if not os.path.exists(article_path):
        # 尝试另一个路径
        article_path = r'C:\tmp\article_styled.html'
    
    print(f"[INFO] 读取文章: {article_path}")
    
    try:
        with open(article_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"[ERROR] 读取文章失败: {e}")
        return
    
    print(f"[INFO] 文章长度: {len(content)} 字符")
    
    # 4. 创建草稿
    result = create_draft(
        access_token=access_token,
        title="【首发】2026世界杯前瞻：三国合办、48队盛宴",
        content=content,
        author=AUTHOR,
        digest="史上规模最大的世界杯即将在美加墨三国上演！48支球队、104场比赛、16座主办城市，让我们一起提前感受这场足球盛宴的魅力！",
        thumb_media_id=thumb_media_id or ""
    )
    
    if result:
        print("\n" + "=" * 60)
        print("[SUCCESS] 草稿创建成功！")
        print(f"Draft ID: {result['media_id']}")
        print(f"\n查看草稿: https://mp.weixin.qq.com → 素材管理 → 草稿箱")
        print("=" * 60)
    else:
        print("\n[ERROR] 草稿创建失败")

if __name__ == "__main__":
    main()