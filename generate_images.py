from PIL import Image, ImageDraw, ImageFont
import os

# 创建图片目录
output_dir = "C:/Users/Administrator/.openclaw/workspace/content/articles/2026-03-30/resources/images"
os.makedirs(output_dir, exist_ok=True)

# 图片尺寸（竖版 9:16）
width = 1080
height = 1920

# 图片描述（与脚本分段对应）
descriptions = [
    "卡通风格的小妹妹形象，背景是傍晚的广场",
    "小妹妹跟着音乐节奏跳舞，周围有爷爷奶奶在观看",
    "小妹妹做出可爱的舞蹈动作，脸上带着开心的笑容",
    "小妹妹向镜头挥手，背景是美丽的晚霞"
]

# 背景颜色
colors = [(255, 200, 200), (200, 255, 200), (200, 200, 255), (255, 255, 200)]

# 尝试加载字体，如果失败使用默认字体
try:
    font = ImageFont.truetype("arial.ttf", 60)
except:
    font = ImageFont.load_default()

for i, (desc, color) in enumerate(zip(descriptions, colors)):
    # 创建新图片
    img = Image.new('RGB', (width, height), color=color)
    draw = ImageDraw.Draw(img)
    
    # 添加标题
    title = f"场景 {i+1}"
    draw.text((width//2, 200), title, fill=(0, 0, 0), font=font, anchor="mm")
    
    # 添加描述文字（自动换行）
    lines = []
    words = desc.split()
    current_line = ""
    for word in words:
        test_line = current_line + " " + word if current_line else word
        # 简单换行逻辑
        if len(test_line) > 30:
            lines.append(current_line)
            current_line = word
        else:
            current_line = test_line
    if current_line:
        lines.append(current_line)
    
    # 绘制多行文字
    y = height // 2 - (len(lines) * 70) // 2
    for line in lines:
        draw.text((width//2, y), line, fill=(0, 0, 0), font=font, anchor="mm")
        y += 70
    
    # 添加图片编号
    draw.text((100, 100), f"Slide {i+1}", fill=(100, 100, 100), font=font)
    
    # 保存图片
    output_path = os.path.join(output_dir, f"slide_{i+1:02d}.png")
    img.save(output_path)
    print(f"Generated: {output_path}")

print("All images generated successfully!")