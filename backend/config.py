import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

# MiMo API
MIMO_BASE_URL = os.getenv("MIMO_BASE_URL", "https://token-plan-cn.xiaomimimo.com/v1")
MIMO_API_KEY = os.getenv("XIAOMI_API_KEY", "")
MIMO_VISION_MODEL = os.getenv("MIMO_VISION_MODEL", "mimo-v2-omni")
MIMO_TEXT_MODEL = os.getenv("MIMO_TEXT_MODEL", "mimo-v4-flash")

# Database
DB_PATH = DATA_DIR / "mimo_student.db"

# Upload
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Server
HOST = "0.0.0.0"
PORT = 8081
