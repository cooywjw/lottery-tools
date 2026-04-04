"""
添加"AI生成"水印到图片右下角
用法: python add_watermark.py <图片路径> [--output <输出路径>]
"""
import sys
import os
from PIL import Image, ImageDraw, ImageFont

def add_watermark(image_path, output_path=None, text="AI生成", opacity=40, font_size=12, position="bottom-right"):
    """添加水印到图片右下角"""
    if output_path is None:
        output_path = image_path

    img = Image.open(image_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)

    # 尝试使用系统字体
    font = None
    for font_path in [
        "C:/Windows/Fonts/msyh.ttc",   # 微软雅黑
        "C:/Windows/Fonts/simhei.ttf",  # 黑体
        "C:/Windows/Fonts/simsun.ttc",  # 宋体
    ]:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue

    if font is None:
        font = ImageFont.load_default()

    # 水印位置
    margin = 10
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    if position == "center-bottom":
        x = (img.width - text_w) // 2
        y = img.height - text_h - margin
    elif position == "center":
        x = (img.width - text_w) // 2
        y = (img.height - text_h) // 2
    else:  # bottom-right
        x = img.width - text_w - margin
        y = img.height - text_h - margin

    # 白色文字，低透明度
    alpha = int(opacity * 255 / 100)
    draw.text((x, y), text, font=font, fill=(255, 255, 255, alpha))

    # 合成
    watermarked = Image.alpha_composite(img, overlay)
    final = watermarked.convert("RGB")
    final.save(output_path, "PNG")
    print(f"[OK] 水印添加成功: {output_path}")

if __name__ == "__main__":
    args = sys.argv[1:]
    image_path = None
    output_path = None

    i = 0
    while i < len(args):
        if args[i] == "--output" and i + 1 < len(args):
            output_path = args[i + 1]
            i += 2
        elif not args[i].startswith("--"):
            image_path = args[i]
            i += 1
        else:
            i += 1

    if not image_path:
        print("用法: python add_watermark.py <图片> [--output <输出>]")
        sys.exit(1)

    pos = os.environ.get('WATERMARK_POS', 'bottom-right')
    add_watermark(image_path, output_path, position=pos)
