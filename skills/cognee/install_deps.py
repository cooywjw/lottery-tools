#!/usr/bin/env python3
"""
Cognee 依赖安装脚本（带重试）
用法: py -3.12 install_deps.py
"""

import subprocess
import sys

# 核心依赖列表（按优先级分组）
DEPS = {
    # Group 1: 最基础依赖
    "structlog": "structlog",
    "pydantic": "pydantic",
    "pydantic-settings": "pydantic-settings",
    "sqlalchemy": "sqlalchemy",
    "aiosqlite": "aiosqlite",
    "networkx": "networkx",
    "rdflib": "rdflib",
    "pypdf": "pypdf",
    "filetype": "filetype",
    "aiofiles": "aiofiles",
    "tenacity": "tenacity",
    "jinja2": "jinja2",
    "nbformat": "nbformat",
    "diskcache": "diskcache",
    "aiolimiter": "aiolimiter",
    "python-multipart": "python-multipart",
    "colorama": "colorama",
    # Group 2: Web 框架
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "websockets": "websockets",
    "gunicorn": "gunicorn",
    # Group 3: LLM 相关（较大包）
    "openai": "openai",
    "tiktoken": "tiktoken",
    "instructor": "instructor",
    "litellm": "litellm",
    "fakeredis": "fakeredis",
    # Group 4: 用户认证（较大包）
    'fastapi-users[sqlalchemy]': "fastapi-users",
}

def run_pip_install(package, max_retries=3):
    """带重试的 pip 安装"""
    cmd = [sys.executable, "-m", "pip", "install", package]
    
    for attempt in range(max_retries):
        print(f"  Installing {package}... (attempt {attempt+1}/{max_retries})")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"  ✅ {package} installed")
            return True
        else:
            stderr = result.stderr.strip()
            if attempt < max_retries - 1:
                print(f"  ⚠️  Failed, retrying in 5s...")
                import time
                time.sleep(5)
    
    print(f"  ❌ {package} failed after {max_retries} attempts")
    return False

def main():
    print("=" * 60)
    print("Cognee Dependency Installer for Python 3.12")
    print("=" * 60)
    print(f"Python: {sys.version}")
    print()
    
    # 首先检查 cognee 是否已安装
    try:
        import cognee
        print(f"✅ cognee {cognee.__version__} already installed!")
        print()
        print("Verifying imports...")
        from cognee import SearchType
        print("✅ cognee core imports OK")
        return
    except ImportError:
        print("Installing cognee base package...")
    
    # 安装 cognee 本身
    print("\n[Step 1] Installing cognee base package...")
    if not run_pip_install("cognee"):
        print("❌ Failed to install cognee")
        sys.exit(1)
    
    # 分组安装依赖
    groups = [
        ("[Step 2] Installing core dependencies...", list(DEPS.keys())[:15]),
        ("[Step 3] Installing web framework...", ["fastapi", "uvicorn", "websockets", "gunicorn"]),
        ("[Step 4] Installing LLM packages (large, may take time)...", ["openai", "tiktoken", "instructor", "litellm", "fakeredis"]),
        ("[Step 5] Installing fastapi-users...", ["fastapi-users"]),
    ]
    
    all_success = True
    for label, packages in groups:
        print(f"\n{label}")
        for pkg in packages:
            if not run_pip_install(pkg):
                all_success = False
    
    print("\n" + "=" * 60)
    if all_success:
        print("✅ All dependencies installed!")
        print("\nVerifying cognee import...")
        try:
            import cognee
            from cognee import SearchType
            print(f"✅ cognee {cognee.__version__} import verified!")
            print("\nNext steps:")
            print("  1. Set OPENAI_API_KEY in environment")
            print("  2. Test: py -3.12 scripts/cognee_cli.py list")
        except ImportError as e:
            print(f"⚠️  cognee installed but import failed: {e}")
            print("   Run this script again to retry failed packages")
    else:
        print("⚠️  Some packages failed - run script again to retry")
    print("=" * 60)

if __name__ == "__main__":
    main()
