import re
import os
import urllib.request
from pathlib import Path
from urllib.parse import urlparse, unquote

SOURCE_HTML = "C:/Users/nazar/nfinance-landing/index.html"
IMAGES_DIR = "C:/Users/nazar/nfinance-landing/assets/images"

os.makedirs(IMAGES_DIR, exist_ok=True)

with open(SOURCE_HTML, "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'https://cdn\.prod\.website-files\.com/[^\s"\'>\)\\]+'
urls = list(set(re.findall(pattern, content)))

IMAGE_EXTS = {'.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.mp4'}

downloaded = []
skipped = []

for url in urls:
    decoded = unquote(url)
    path = urlparse(decoded).path
    filename = Path(path).name
    ext = Path(filename).suffix.lower()

    if ext not in IMAGE_EXTS:
        skipped.append(url)
        continue

    dest = os.path.join(IMAGES_DIR, filename)
    if os.path.exists(dest):
        print(f"  EXISTS  {filename}")
        downloaded.append(url)
        continue

    try:
        print(f"  DOWN    {filename}")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req) as r, open(dest, "wb") as f:
            f.write(r.read())
        downloaded.append(url)
    except Exception as e:
        print(f"  FAIL    {filename}: {e}")

print(f"\nDownloaded: {len(downloaded)}")
print(f"Skipped (JS/CSS): {len(skipped)}")
