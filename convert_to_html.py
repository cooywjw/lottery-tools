#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 Markdown 正文转换为微信兼容的 HTML
"""

def markdown_to_wechat_html(markdown_content):
    """
    将 Markdown 正文转换为微信兼容的 HTML
    """
    lines = markdown_content.strip().split('\n')

    html_lines = []

    for line in lines:
        line = line.strip()

        # 空行
        if not line:
            html_lines.append('<p></p>')
            continue

        # 标题（用 strong 标记）
        if line.startswith('##'):
            # 提取标题内容
            title_content = line[2:].strip()
            html_lines.append(f'<p style="font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 20px;">{title_content}</p>')
            continue

        # 加粗文本
        if line.startswith('**') and line.endswith('**'):
            text = line[2:-2].strip()
            html_lines.append(f'<p><strong>{text}</strong></p>')
            continue

        # 列表项
        if line.startswith('-'):
            text = line[1:].strip()
            html_lines.append(f'<p>• <strong>{text}</strong></p>')
            continue

        # 表格
        if '|' in line and '---' in line:
            # 表头
            if '---' in line:
                html_lines.append('<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">')
                continue

            # 表格内容
            cells = [cell.strip() for cell in line.split('|')[1:-1]]
            if cells and cells[0] != '':
                html_lines.append('<tr>')
                for cell in cells:
                    html_lines.append(f'<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">{cell}</td>')
                html_lines.append('</tr>')
            continue

        # 普通段落
        html_lines.append(f'<p>{line}</p>')

    return '\n'.join(html_lines)


if __name__ == '__main__':
    # 读取正文内容
    with open('temp_article_body.txt', 'r', encoding='utf-8') as f:
        markdown_content = f.read()

    # 转换为 HTML
    html_content = markdown_to_wechat_html(markdown_content)

    # 保存 HTML
    with open('/tmp/article_styled.html', 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"[OK] HTML 已生成，保存到 /tmp/article_styled.html")
    print(f"内容长度: {len(html_content)} 字符")
