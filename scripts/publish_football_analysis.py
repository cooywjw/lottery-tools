#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
足球赛事分析自动发布脚本
"""

import os
import sys
import json
import datetime
from pathlib import Path

# 添加技能目录到路径
skill_root = Path.home() / ".openclaw" / "workspace" / "skills" / "wechat-publisher"
sys.path.insert(0, str(skill_root / "scripts"))

from publisher import WeChatPublisher

def load_template(template_name):
    """加载模板文件"""
    template_path = Path.home() / ".openclaw" / "workspace" / "templates" / template_name
    if template_path.exists():
        return template_path.read_text(encoding='utf-8')
    else:
        print(f"错误：模板文件不存在 {template_path}")
        return None

def generate_content(template_content, data):
    """使用模板和数据生成内容"""
    content = template_content
    for key, value in data.items():
        placeholder = f"{{{key}}}"
        content = content.replace(placeholder, value)
    return content

def save_content(content, filename):
    """保存生成的内容"""
    output_path = Path.home() / ".openclaw" / "workspace" / "output" / filename
    output_path.parent.mkdir(exist_ok=True)
    output_path.write_text(content, encoding='utf-8')
    return output_path

def publish_to_wechat(title, content_path, author="绿茵有运"):
    """发布到微信公众号"""
    try:
        publisher = WeChatPublisher()
        
        # 读取HTML内容
        with open(content_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 发布草稿
        result = publisher.create_draft(
            title=title,
            content=content,
            author=author,
            thumb_media_id="",  # 使用默认封面
            digest="",
            content_base_dir=str(content_path.parent)
        )
        
        print(f"发布成功！草稿ID: {result['media_id']}")
        return result['media_id']
        
    except Exception as e:
        print(f"发布失败: {e}")
        return None

def main():
    """主函数"""
    print("=== 足球赛事分析自动发布脚本 ===")
    
    # 获取当前日期
    today = datetime.datetime.now()
    date_str = today.strftime("%Y年%m月%d日")
    
    # 示例数据（实际应从数据源获取）
    data = {
        "日期": date_str,
        "联赛": "日职联",
        "比赛数量": "两",
        "时间": "18:00",
        "焦点比赛列表": "1. **町田泽维亚 vs FC东京** - 东京德比战\n2. **神户胜利 vs 清水鼓动** - 攻防大战",
        "比赛分析部分": "（实际比赛分析内容）",
        "联赛赛制说明": "2026年日职联采用特殊赛制：\n- **东西分区**：20支球队分东西区各10队\n- **特殊积分**：常规时间平局直接点球决胜\n  - 点球胜：2分\n  - 点球负：1分\n- **奖金激励**：每积1分奖励200万日元（约10万人民币）",
        "影响点1": "平局概率降低：球队更倾向在常规时间决出胜负",
        "影响点2": "进攻欲望强：积分奖金激励进攻",
        "影响点3": "点球因素：需考虑点球决胜的可能性",
        "下期预告内容": f"{today.day + 1}月{today.month}日欧洲赛事分析"
    }
    
    # 1. 加载模板
    print("1. 加载模板...")
    template_content = load_template("football_analysis_template.md")
    if not template_content:
        return
    
    # 2. 生成内容
    print("2. 生成内容...")
    content = generate_content(template_content, data)
    
    # 3. 保存内容
    print("3. 保存内容...")
    filename = f"日职赛事分析_{today.strftime('%Y%m%d')}.md"
    content_path = save_content(content, filename)
    print(f"内容已保存到: {content_path}")
    
    # 4. 转换为HTML（简化版，实际需要更复杂的转换）
    html_content = f"<html><body><h1>{data['日期']}{data['联赛']}焦点战</h1><pre>{content}</pre></body></html>"
    html_path = content_path.with_suffix('.html')
    html_path.write_text(html_content, encoding='utf-8')
    
    # 5. 发布到微信公众号
    print("5. 发布到微信公众号...")
    title = f"{data['日期']}{data['联赛']}焦点战：{data['比赛数量']}场关键对决深度解析"
    draft_id = publish_to_wechat(title, html_path)
    
    if draft_id:
        print(f"\n✅ 发布成功！")
        print(f"标题: {title}")
        print(f"草稿ID: {draft_id}")
        print(f"查看地址: https://mp.weixin.qq.com → 素材管理 → 草稿箱")
    else:
        print("\n❌ 发布失败！")

if __name__ == "__main__":
    main()