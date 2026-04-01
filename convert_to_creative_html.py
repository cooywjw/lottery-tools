# -*- coding: utf-8 -*-
"""
将 Markdown 文章转换为微信公众号创意 HTML
"""

import re

def markdown_to_creative_html(markdown_text):
    """
    将 Markdown 文本转换为创意 HTML

    Args:
        markdown_text: Markdown 文本

    Returns:
        HTML 文本
    """
    lines = markdown_text.split('\n')
    html_lines = []
    in_list = False

    # 颜色主题
    colors = {
        'primary': '#FF4500',      # 红橙色 - 主标题
        'secondary': '#FFD700',   # 金色 - 装饰
        'accent1': '#1E90FF',     # 蓝色 - 重点
        'accent2': '#32CD32',     # 绿色 - 成功/推荐
        'accent3': '#FF69B4',     # 粉色 - 注意
        'bg1': '#FFF5E6',         # 浅橙背景
        'bg2': '#E8F4FF',         # 浅蓝背景
        'bg3': '#F0FFF0',         # 浅绿背景
        'text1': '#FF4500',        # 红橙色文字
        'text2': '#1E90FF',        # 蓝色文字
    }

    for i, line in enumerate(lines):
        line = line.rstrip()

        # 空行（统一间距）
        if not line.strip():
            if in_list:
                in_list = False
                html_lines.append('</ul>')
            html_lines.append('<section style="margin: 15px 0;"></section>')
            continue

        # 一级标题（大标题 - 渐变色）
        if line.startswith('# ') and not line.startswith('##'):
            if in_list:
                in_list = False
                html_lines.append('</ul>')
            title = re.sub(r'^#\s*', '', line).strip()
            html_lines.append(f'''
<section style="text-align: center; margin: 30px 0 25px 0; padding: 0;">
    <h1 style="
        background: linear-gradient(135deg, #FF4500 0%, #FFD700 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 28px;
        font-weight: bold;
        margin: 0;
        padding: 20px 0;
        position: relative;
        display: inline-block;
    ">{title}</h1>
    <div style="
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, #FF4500, #FFD700);
        margin: 15px auto 25px auto;
        border-radius: 2px;
    "></div>
</section>
'''.strip())
            continue

        # 二级标题（中标题 - 彩色背景卡片）
        elif line.startswith('## '):
            if in_list:
                in_list = False
                html_lines.append('</ul>')
            title = line[3:].strip()
            html_lines.append(f'''
<section style="margin: 25px 0;">
    <div style="
        background: linear-gradient(135deg, {colors['bg1']} 0%, {colors['bg2']} 100%);
        border-left: 5px solid {colors['primary']};
        padding: 18px 20px;
        border-radius: 8px;
        margin: 0;
        box-shadow: 0 2px 8px rgba(255, 69, 0, 0.15);
    ">
        <h2 style="
            font-size: 22px;
            font-weight: bold;
            color: {colors['primary']};
            margin: 0;
            display: flex;
            align-items: center;
            line-height: 1.4;
        ">
            <span style="margin-right: 10px;">🔥</span>
            {title}
        </h2>
    </div>
</section>
'''.strip())
            continue

        # 三级标题（小标题 - 彩色文字）
        elif line.startswith('### '):
            if in_list:
                in_list = False
                html_lines.append('</ul>')
            title = line[4:].strip()
            # 不同标题使用不同颜色
            color_cycle = [colors['accent1'], colors['accent2'], colors['accent3']]
            title_color = color_cycle[i % len(color_cycle)]

            html_lines.append(f'''
<h3 style="
    font-size: 19px;
    font-weight: bold;
    color: {title_color};
    margin: 20px 0 12px 0;
    padding: 12px 0;
    border-bottom: 2px dashed {colors['secondary']};
    position: relative;
">
    <span style="
        display: inline-block;
        width: 8px;
        height: 8px;
        background: {title_color};
        border-radius: 50%;
        margin-right: 10px;
        vertical-align: middle;
    "></span>
    {title}
</h3>
'''.strip())
            continue

        # 列表
        if line.startswith('- '):
            if not in_list:
                in_list = True
                html_lines.append(f'''
<ul style="
    list-style: none;
    padding: 0;
    margin: 12px 0 12px 30px;
">
'''.strip())
            item = line[2:].strip()

            # 列表项 - 彩色数字标记
            html_lines.append(f'''
<li style="
    margin: 10px 0;
    padding: 10px 12px 10px 20px;
    background: {colors['bg1']};
    border-radius: 6px;
    color: {colors['text1']};
    position: relative;
    display: flex;
    align-items: center;
    line-height: 1.6;
">
    <span style="
        display: inline-block;
        min-width: 20px;
        height: 20px;
        background: {colors['primary']};
        color: white;
        text-align: center;
        line-height: 20px;
        border-radius: 50%;
        font-size: 12px;
        font-weight: bold;
        margin-right: 12px;
        flex-shrink: 0;
    ">{(i % 9) + 1}</span>
    {item}
</li>
'''.strip())
            continue
        elif in_list:
            in_list = False
            html_lines.append('</ul>')

        # 加粗文字（彩色背景）
        if '**' in line:
            line = re.sub(r'\*\*(.*?)\*\*', r'<span style="background: linear-gradient(90deg, #FFD700, #FFA500); color: white; padding: 2px 8px; border-radius: 3px; font-weight: bold; font-size: 1.05em; box-shadow: 0 2px 4px rgba(255, 165, 0, 0.3);">\1</span>', line)

        # 分隔线（彩色渐变）
        if line.startswith('---'):
            html_lines.append(f'''
<div style="
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg,
        transparent 0%,
        {colors['primary']} 20%,
        {colors['secondary']} 50%,
        {colors['primary']} 80%,
        transparent 100%
    );
    margin: 30px 0;
"></div>
'''.strip())
            continue

        # 引用（彩色边框卡片）
        if line.startswith('> '):
            quote = line[2:].strip()
            html_lines.append(f'''
<blockquote style="
    background: linear-gradient(135deg, {colors['bg2']} 0%, {colors['bg3']} 100%);
    border: 2px solid {colors['accent1']};
    border-left: 5px solid {colors['primary']};
    padding: 18px 20px;
    margin: 20px 0;
    border-radius: 8px;
    color: #333;
    position: relative;
    box-shadow: 0 3px 10px rgba(30, 144, 255, 0.1);
">
    <span style="
        position: absolute;
        top: -12px;
        left: 20px;
        background: {colors['primary']};
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: bold;
    ">&#128394;</span>
    <span style="color: {colors['text2']}; font-weight: 500;">{quote}</span>
</blockquote>
'''.strip())
            continue

        # 普通段落（彩色标记）
        if line:
            # 给段落添加彩色装饰
            paragraph_colors = [colors['bg1'], colors['bg2'], colors['bg3']]
            bg_color = paragraph_colors[i % len(paragraph_colors)]

            html_lines.append(f'''
<p style="
    margin: 15px 0;
    line-height: 1.8;
    color: #333;
    padding: 12px 0;
    position: relative;
    padding-left: 20px;
">
    <span style="
        position: absolute;
        left: 0;
        top: 16px;
        width: 6px;
        height: 6px;
        background: {colors['accent1']};
        border-radius: 50%;
    "></span>
    {line}
</p>
'''.strip())

    html_content = '\n'.join(html_lines)
    return html_content


if __name__ == '__main__':
    # 读取 Markdown 文件
    md_file = r'C:\Users\Administrator\.openclaw\workspace\竞彩分析_2026-03-29_009-015场次.md'
    with open(md_file, 'r', encoding='utf-8') as f:
        markdown_text = f.read()

    # 提取标题（第一行）
    lines = markdown_text.split('\n')
    title_line = lines[0].strip()
    if title_line.startswith('# '):
        title = title_line[2:].strip()
    else:
        title = '竞彩足球深度分析：3月29日009-015场次全解析'

    # 提取正文（移除标题和元数据）
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

    # 转换为创意 HTML
    html_content = markdown_to_creative_html(body_text)

    # 保存 HTML 文件
    html_file = r'C:\Users\Administrator\.openclaw\workspace\article_creative.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f'标题: {title}')
    print(f'HTML 已保存到: {html_file}')
    print(f'HTML 长度: {len(html_content)} 字符')
