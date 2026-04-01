#!/usr/bin/env python3
"""
使用 Stable Horde 生成公众号封面图
完全免费，无需 API Key
"""

import requests
import time
from datetime import datetime
import os
import argparse

# Stable Horde API 配置
API_BASE = "https://stablehorde.net/api/v2"
ANONYMOUS_KEY = "0000000000"  # 10个零，匿名使用

def generate_image(prompt, output_path, width=1200, height=675, steps=20, sampler="k_euler"):
    """
    生成图片

    Args:
        prompt: 提示词
        output_path: 输出路径
        width: 图片宽度（公众号封面推荐 1200x675）
        height: 图片高度
        steps: 生成步数（20-30 之间质量较好）
        sampler: 采样器
    """
    # 1. 提交生成请求
    print(f"[INFO] 正在生成图片...")
    print(f"       提示词: {prompt}")
    print(f"       尺寸: {width}x{height}")

    payload = {
        "prompt": prompt,
        "params": {
            "width": width,
            "height": height,
            "steps": steps,
            "sampler_name": sampler,
            "cfg_scale": 7.0,
            "karras": True
        },
        "nsfw": False,
        "censor_nsfw": True,
        "models": ["Deliberate"],  # 使用 Deliberate 模型，适合文字海报
        "r2": True
    }

    # 添加匿名 API Key
    headers = {"apikey": ANONYMOUS_KEY}

    try:
        resp = requests.post(f"{API_BASE}/generate/async", json=payload, headers=headers, timeout=30)
    except requests.exceptions.SSLError as e:
        print(f"[ERROR] SSL 连接失败: {e}")
        print(f"[INFO] 尝试忽略 SSL 证书验证...")
        resp = requests.post(f"{API_BASE}/generate/async", json=payload, headers=headers, timeout=30, verify=False)

    if resp.status_code != 202:
        raise Exception(f"提交请求失败: {resp.status_code} - {resp.text}")

    data = resp.json()
    request_id = data["id"]
    print(f"       [OK] 请求已提交，ID: {request_id}")

    # 2. 轮询检查状态
    print(f"[INFO] 等待生成完成...（匿名用户可能需要等待几分钟）")
    max_wait = 300  # 最多等待 5 分钟
    wait_time = 0
    check_interval = 10  # 每 10 秒检查一次

    while wait_time < max_wait:
        time.sleep(check_interval)
        wait_time += check_interval

        try:
            resp = requests.get(f"{API_BASE}/generate/check/{request_id}", headers=headers, timeout=10)
        except requests.exceptions.SSLError:
            resp = requests.get(f"{API_BASE}/generate/check/{request_id}", headers=headers, timeout=10, verify=False)

        if resp.status_code != 200:
            continue

        data = resp.json()
        if data.get("done", False):
            print(f"       [OK] 生成完成！")
            break

        # 显示队列状态
        queue_position = data.get("queue_position", 0)
        wait_time_est = data.get("wait_time", 0)
        if wait_time % 30 == 0:  # 每 30 秒显示一次
            if queue_position > 0:
                print(f"       [QUEUE] 位置: {queue_position}，预计等待: {wait_time_est}秒")
            else:
                print(f"       [PROCESSING] 正在生成中...")

    if wait_time >= max_wait:
        raise Exception("等待超时，请稍后再试")

    # 3. 获取结果
    try:
        resp = requests.get(f"{API_BASE}/generate/status/{request_id}", headers=headers, timeout=10)
    except requests.exceptions.SSLError:
        resp = requests.get(f"{API_BASE}/generate/status/{request_id}", headers=headers, timeout=10, verify=False)

    if resp.status_code != 200:
        raise Exception(f"获取结果失败: {resp.status_code} - {resp.text}")

    data = resp.json()
    if not data.get("generations"):
        raise Exception("未获取到生成结果")

    image_url = data["generations"][0]["img"]

    # 4. 下载图片
    print(f"       [DOWNLOAD] 正在下载图片...")
    img_resp = requests.get(image_url, timeout=30)

    if img_resp.status_code != 200:
        raise Exception(f"下载图片失败: {img_resp.status_code}")

    img_data = img_resp.content

    # 确保输出目录存在
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else ".", exist_ok=True)

    with open(output_path, "wb") as f:
        f.write(img_data)

    print(f"       [OK] 图片已保存: {output_path}")
    return output_path

def main():
    parser = argparse.ArgumentParser(description="生成公众号封面图")
    parser.add_argument("--prompt", type=str, default="今日竞彩推荐封面，紫色渐变背景，现代简约风格，足球元素，中文文字", help="提示词")
    parser.add_argument("--output", type=str, help="输出路径（默认：output/2026-03-28-cover.png）")
    parser.add_argument("--width", type=int, default=1200, help="图片宽度")
    parser.add_argument("--height", type=int, default=675, help="图片高度")

    args = parser.parse_args()

    # 默认输出路径
    if not args.output:
        timestamp = datetime.now().strftime("%Y-%m-%d-%H-%M-%S")
        args.output = f"output/{timestamp}-wechat-cover.png"

    try:
        generate_image(
            prompt=args.prompt,
            output_path=args.output,
            width=args.width,
            height=args.height
        )
        print(f"\n[SUCCESS] 完成！")
    except Exception as e:
        print(f"\n[ERROR] 错误: {e}")
        print(f"\n[TIPS] 提示:")
        print(f"   - 匿名用户可能需要排队等待")
        print(f"   - 可以访问 https://stablehorde.net 查看队列状态")
        print(f"   - 注册账号可以获得更快的速度")

if __name__ == "__main__":
    main()
