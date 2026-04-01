# -*- coding: utf-8 -*-
"""
超创意排版 - 微信公众号文章转换器
"""

import re

def create_super_creative_html(markdown_text):
    """
    创建超创意排版的 HTML
    """
    lines = markdown_text.split('\n')
    html_parts = []

    # 颜色配置
    colors = {
        'primary': '#FF6B35',      # 活力橙
        'secondary': '#F7C59F',    # 浅橙
        'accent1': '#4ECDC4',      # 青绿
        'accent2': '#95E1D3',      # 薄荷绿
        'accent3': '#F38181',      # 珊瑚红
        'accent4': '#AA96DA',      # 紫色
        'accent5': '#FCBAD3',      # 粉色
        'gold': '#FFD93D',         # 金黄
        'dark': '#2C3E50',         # 深蓝灰
        'text': '#34495E',         # 正文色
    }

    paragraph_index = 0
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()

        # 跳过分隔线和空元数据行
        if not line or line == '---':
            i += 1
            continue

        # 跳过分隔线（3个以上-）
        if line.startswith('---') and len(line) >= 3:
            i += 1
            continue

        # 元数据行（公众号、发布日期、作者）
        if line.startswith('**公众号：') or line.startswith('**发布日期：') or line.startswith('**作者：'):
            i += 1
            continue

        # 一级标题（大标题）
        if line.startswith('# ') and not line.startswith('##'):
            title = re.sub(r'^#\s*', '', line).strip()
            html_parts.append(f'''
<div style="text-align: center; margin: 40px 0 30px 0;">
    <div style="
        background: linear-gradient(135deg, {colors['primary']} 0%, {colors['gold']} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 32px;
        font-weight: bold;
        margin: 0 0 20px 0;
        line-height: 1.4;
        display: inline-block;
    ">{title}</div>
    <div style="
        width: 100px;
        height: 4px;
        background: linear-gradient(90deg, {colors['primary']}, {colors['gold']});
        margin: 0 auto;
        border-radius: 2px;
    "></div>
</div>
''')
            i += 1
            continue

        # 二级标题（章节标题）
        if line.startswith('## '):
            title = line[3:].strip()
            # 添加装饰线分隔
            if html_parts and i > 1:
                html_parts.append(f'''
<div style="
    margin: 30px 0;
    height: 3px;
    background: linear-gradient(90deg,
        transparent 0%,
        {colors['accent1']} 20%,
        {colors['primary']} 50%,
        {colors['accent1']} 80%,
        transparent 100%
    );
    border-radius: 2px;
"></div>
''')

            html_parts.append(f'''
<div style="
    background: linear-gradient(135deg, #fff 0%, {colors['secondary']} 100%);
    border-left: 6px solid {colors['primary']};
    padding: 20px 25px;
    margin: 25px 0;
    border-radius: 0 12px 12px 0;
    box-shadow: 0 4px 15px rgba(255, 107, 53, 0.15);
">
    <div style="
        font-size: 22px;
        font-weight: bold;
        color: {colors['primary']};
        display: flex;
        align-items: center;
    ">
        <span style="margin-right: 12px; font-size: 26px;">🔥</span>
        {title}
    </div>
</div>
''')
            i += 1
            continue

        # 三级标题（小标题）
        if line.startswith('### '):
            title = line[4:].strip()
            color_cycle = [colors['accent1'], colors['accent3'], colors['accent4'], colors['gold']]
            title_color = color_cycle[paragraph_index % len(color_cycle)]

            html_parts.append(f'''
<div style="
    background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    border-bottom: 3px solid {title_color};
    padding: 15px 0;
    margin: 25px 0 20px 0;
">
    <div style="
        font-size: 20px;
        font-weight: bold;
        color: {title_color};
        display: flex;
        align-items: center;
    ">
        <span style="
            display: inline-block;
            width: 10px;
            height: 10px;
            background: {title_color};
            border-radius: 50%;
            margin-right: 12px;
        "></span>
        {title}
    </div>
</div>
''')
            i += 1
            continue

        # 列表项处理
        if line.startswith('- '):
            items = []
            item_num = 1
            while i < len(lines) and lines[i].strip().startswith('- '):
                item_text = lines[i].strip()[2:].strip()
                # 处理加粗
                item_text = re.sub(r'\*\*(.*?)\*\*', r'<span style="background: linear-gradient(90deg, #FFD93D, #FF6B35); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">\1</span>', item_text)
                items.append((item_num, item_text))
                item_num += 1
                i += 1

            # 生成列表 HTML
            list_html = f'''
<div style="margin: 20px 0; padding: 0 15px;">
'''
            for num, text in items:
                list_html += f'''
    <div style="
        display: flex;
        align-items: flex-start;
        margin: 12px 0;
        padding: 15px 20px;
        background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
        border-radius: 10px;
        border-left: 4px solid {colors['primary']};
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    ">
        <span style="
            min-width: 28px;
            height: 28px;
            background: linear-gradient(135deg, {colors['primary']} 0%, {colors['gold']} 100%);
            color: white;
            text-align: center;
            line-height: 28px;
            border-radius: 50%;
            font-size: 14px;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
            box-shadow: 0 2px 5px rgba(255, 107, 53, 0.3);
        ">{num}</span>
        <span style="color: {colors['text']}; line-height: 1.6; font-size: 15px;">{text}</span>
    </div>
'''
            list_html += '</div>'
            html_parts.append(list_html)
            paragraph_index += 1
            continue

        # 普通段落
        if line.strip():
            # 处理加粗
            line = re.sub(r'\*\*(.*?)\*\*', r'<span style="background: linear-gradient(90deg, #FFD93D, #FF6B35); color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">\1</span>', line)

            # 不同段落用不同颜色的左边框
            border_colors = [colors['accent1'], colors['accent3'], colors['accent4'], colors['gold'], colors['accent5']]
            border_color = border_colors[paragraph_index % len(border_colors)]

            html_parts.append(f'''
<div style="
    margin: 18px 0;
    padding: 18px 22px;
    background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
    border-left: 5px solid {border_color};
    border-radius: 0 10px 10px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
">
    <p style="
        margin: 0;
        line-height: 1.8;
        color: {colors['text']};
        font-size: 15px;
    ">{line}</p>
</div>
''')
            paragraph_index += 1

        i += 1

    # 添加结尾装饰
    html_parts.append(f'''
<div style="
    text-align: center;
    margin: 40px 0 20px 0;
    padding: 25px;
    background: linear-gradient(135deg, {colors['secondary']} 0%, #fff 100%);
    border-radius: 15px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
">
    <div style="
        font-size: 18px;
        color: {colors['primary']};
        font-weight: bold;
        margin-bottom: 10px;
    ">🏆 关注「慈云小白说球」，获取更多竞彩分析</div>
    <div style="
        font-size: 14px;
        color: {colors['text']};
    ">苏州市吴江区慈云路彩票店，期待您的光临！</div>
</div>
''')

    return '\n'.join(html_parts)


if __name__ == '__main__':
    # 读取 Markdown 文件
    md_file = r'C:\Users\Administrator\.openclaw\workspace\竞彩分析_2026-03-29_009-015场次.md'
    with open(md_file, 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    # 提取标题
    lines = markdown_text.split('\n')
    title_line = lines[0].strip()
    if title_line.startswith('# '):
        title = title_line[2:].strip()
    else:
        title = '竞彩足球深度分析：3月29日009-015场次全解析'

    # 提取正文
    body_lines = []
    skip_until_empty = True
    for line in lines[1:]:
        line = line.rstrip()
        if skip_until_empty:
            if not line.strip():
                skip_until_empty = False
            continue
        body_lines.append(line)
    body_text = '\n'.join(body_lines)

    # 转换为超创意 HTML
    html_content = create_super_creative_html(body_text)

    # 保存 HTML 文件
    html_file = r'C:\Users\Administrator\.openclaw\workspace\article_super_creative.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f'标题: {title}')
    print(f'超创意 HTML 已保存到: {html_file}')
    print(f'HTML 长度: {len(html_content)} 字符')
    print(f'段落数: {body_text.count(chr(10))}')
