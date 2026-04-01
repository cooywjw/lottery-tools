# -*- coding: utf-8 -*-
"""
发布超创意排版公众号草稿
"""

import sys
import os

# 添加 skill 目录到 Python 路径
SKILL_ROOT = r"C:\Users\Administrator\.openclaw\workspace\skills\wechat-publisher"
sys.path.insert(0, SKILL_ROOT)
sys.path.insert(0, os.path.join(SKILL_ROOT, "scripts"))

try:
    from publisher import WeChatPublisher
except ImportError:
    print("[ERROR] 无法导入 WeChatPublisher")
    sys.exit(1)

def main():
    # 读取超创意 HTML 内容
    html_file = r'C:\Users\Administrator\.openclaw\workspace\article_super_creative.html'
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 文章信息
    title = "竞彩足球深度分析：3月29日009-015场次全解析"
    author = "小白大叔"
    digest = "今日竞彩足球009-015场次深度分析：苏格兰VS日本、加拿大VS冰岛、美国VS比利时、墨西哥VS葡萄牙等焦点赛事全解析"
    thumb_media_id = "VzuvmlZBA-BK84Y6UaFkv9nvZ9yUJX6txbZfIh6EeiDAimeFrWtldq3P9PZ_zl1g"

    print("=" * 60)
    print("  微信公众号超创意排版发布")
    print("=" * 60)
    print(f"标题: {title}")
    print(f"作者: {author}")
    print(f"HTML长度: {len(content)} 字符")
    print("=" * 60)

    try:
        # 初始化发布器
        publisher = WeChatPublisher()

        # 创建草稿
        print("\n正在创建超创意排版草稿...")
        result = publisher.create_draft(
            title=title,
            content=content,
            author=author,
            thumb_media_id=thumb_media_id,
            digest=digest,
            show_cover_pic=1
        )

        print(f"\n{'=' * 60}")
        print(f"[OK] 超创意排版草稿创建成功!")
        print(f"  Media ID: {result.get('media_id')}")
        print(f"{'=' * 60}\n")

        print("查看草稿:")
        print("  1. 登录 https://mp.weixin.qq.com")
        print("  2. 点击「素材管理」→「草稿箱」")
        print(f"  3. 找到标题为「{title}」的草稿\n")

        print("超创意排版特点:")
        print("  渐变色标题（红橙→金色）")
        print("  卡片式布局（圆角+阴影）")
        print("  彩色左边框（每段不同色）")
        print("  彩色数字圆圈（列表项）")
        print("  重点字彩色高亮")
        print("  统一段落间距")
        print("  结尾精美卡片\n")

        return result

    except Exception as e:
        print(f"\n[ERROR] 发布失败: {e}\n")
        return None

if __name__ == '__main__':
    main()
