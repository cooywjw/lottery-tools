# -*- coding: utf-8 -*-
"""
创意排版（字体稍小版本）- 微信公众号文章转换器
字体调整：段落从15px改为14px，标题从32px改为28px
"""

import re

def create_smaller_font_html(markdown_text):
    """
    创建字体稍小的创意排版 HTML
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

        # 一级标题（大标题）- 字体从32px改为28px
        if line.startswith('# ') and not line.startswith('##'):
            title = re.sub(r'^#\s*', '', line).strip()
            html_parts.append(f'''
<div style="text-align: center; margin: 35px 0 25px 0;">
    <div style="
        background: linear-gradient(135deg, {colors['primary']} 0%, {colors['gold']} 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 28px;  <!-- 从32px改为28px -->
        font-weight: bold;
        margin: 0 0 15px 0;
        line-height: 1.4;
        display: inline-block;
    ">{title}</div>
    <div style="
        width: 80px;  <!-- 稍短一点 -->
        height: 3px;
        background: linear-gradient(90deg, {colors['primary']}, {colors['gold']});
        margin: 0 auto;
        border-radius: 2px;
    "></div>
</div>
''')
            i += 1
            continue

        # 二级标题（章节标题）- 字体稍小
        if line.startswith('## '):
            title = line[3:].strip()
            # 添加装饰线分隔
            if html_parts and i > 1:
                html_parts.append(f'''
<div style="
    margin: 25px 0;
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
    border-left: 5px solid {colors['primary']};
    padding: 18px 22px;  <!-- 稍小内边距 -->
    border-radius: 0 12px 12px 0;
    margin: 20px 0;
    box-shadow: 0 3px 10px rgba(0,0,0,0.05);
">
    <div style="
        background: linear-gradient(90deg, {colors['primary']}, {colors['accent3']});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 20px;  <!-- 稍小字体 -->
        font-weight: bold;
        margin: 0;
    ">{title}</div>
</div>
''')
            i += 1
            continue

        # 三级标题（小标题）
        if line.startswith('### '):
            title = line[4:].strip()
            html_parts.append(f'''
<div style="
    margin: 20px 0 10px 0;
    padding: 10px 15px;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    border-radius: 8px;
    border-left: 4px solid {colors['accent1']};
">
    <div style="
        color: {colors['dark']};
        font-size: 16px;  <!-- 稍小字体 -->
        font-weight: bold;
        margin: 0;
    ">{title}</div>
</div>
''')
            i += 1
            continue

        # 无序列表
        if line.startswith('- ') or line.startswith('* '):
            list_items = []
            # 收集所有连续的列表项
            while i < len(lines) and (lines[i].startswith('- ') or lines[i].startswith('* ') or lines[i].startswith('  ')):
                item = lines[i].lstrip('*- ').strip()
                if item:
                    list_items.append(item)
                i += 1
            # 处理嵌套列表的缩进
            if lines[i-1].startswith('  '):
                i -= 1
                continue

            list_html = f'''
<div style="
    margin: 15px 0;
    padding: 15px 20px;
    background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
">
'''
            for idx, item in enumerate(list_items):
                # 数字圆圈颜色
                circle_colors = [
                    f'linear-gradient(135deg, {colors["accent1"]}, {colors["accent2"]})',
                    f'linear-gradient(135deg, {colors["accent3"]}, {colors["accent5"]})',
                    f'linear-gradient(135deg, {colors["gold"]}, {colors["primary"]})',
                    f'linear-gradient(135deg, {colors["accent4"]}, #C4B5FD)',
                    f'linear-gradient(135deg, {colors["accent2"]}, #A7F3D0)'
                ]
                circle_color = circle_colors[idx % len(circle_colors)]

                list_html += f'''
    <div style="
        display: flex;
        align-items: flex-start;
        margin: 8px 0;
    ">
        <div style="
            background: {circle_color};
            color: white;
            width: 24px;  <!-- 稍小圆圈 -->
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            flex-shrink: 0;
            font-size: 12px;  <!-- 稍小数字 -->
            font-weight: bold;
        ">{idx + 1}</div>
        <div style="
            flex: 1;
            color: {colors['text']};
            font-size: 14px;  <!-- 稍小字体 -->
            line-height: 1.6;
        ">{item}</div>
    </div>
'''
            list_html += '</div>'
            html_parts.append(list_html)
            paragraph_index += 1
            continue

        # 普通段落
        if line.strip():
            # 处理加粗
            line = re.sub(r'\*\*(.*?)\*\*', r'<span style="background: linear-gradient(90deg, #FFD93D, #FF6B35); color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 13px;">\1</span>', line)

            # 不同段落用不同颜色的左边框
            border_colors = [colors['accent1'], colors['accent3'], colors['accent4'], colors['gold'], colors['accent5']]
            border_color = border_colors[paragraph_index % len(border_colors)]

            html_parts.append(f'''
<div style="
    margin: 15px 0;  <!-- 稍小间距 -->
    padding: 15px 18px;  <!-- 稍小内边距 -->
    background: linear-gradient(135deg, #fff 0%, #fafafa 100%);
    border-left: 4px solid {border_color};  <!-- 稍细边框 -->
    border-radius: 0 8px 8px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
">
    <p style="
        margin: 0;
        line-height: 1.7;
        color: {colors['text']};
        font-size: 14px;  <!-- 从15px改为14px -->
    ">{line}</p>
</div>
''')
            paragraph_index += 1

        i += 1

    # 添加结尾装饰
    html_parts.append(f'''
<div style="
    text-align: center;
    margin: 35px 0 20px 0;
    padding: 22px;
    background: linear-gradient(135deg, {colors['secondary']} 0%, #fff 100%);
    border-radius: 12px;
    box-shadow: 0 3px 12px rgba(0,0,0,0.06);
">
    <div style="
        font-size: 16px;  <!-- 稍小字体 -->
        color: {colors['primary']};
        font-weight: bold;
        margin-bottom: 8px;
    ">🏆 关注「慈云小白说球」，获取更多竞彩分析</div>
    <div style="
        font-size: 13px;  <!-- 稍小字体 -->
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

    # 转换为字体稍小的创意 HTML
    html_content = create_smaller_font_html(body_text)

    # 保存 HTML 文件
    html_file = r'C:\Users\Administrator\.openclaw\workspace\article_smaller_font.html'
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f'标题: {title}')
    print(f'字体稍小的创意 HTML 已保存到: {html_file}')
    print(f'HTML 长度: {len(html_content)} 字符')
    print(f'段落数: {body_text.count(chr(10))}')