import re
from pathlib import Path
from urllib.parse import urlparse, unquote

# All paths are absolute (start with /) — works from any depth in the site
def patch_html(html_path):
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Replace Webflow JS URLs
    js_map = {
        "https://cdn.prod.website-files.com/6947fb1779dba6a26efc7f43/js/webflow.schunk.36b8fb49256177c8.js":
            "/js/webflow-chunk1.js",
        "https://cdn.prod.website-files.com/6947fb1779dba6a26efc7f43/js/webflow.schunk.3458fd3e15187ee4.js":
            "/js/webflow-chunk2.js",
        "https://cdn.prod.website-files.com/6947fb1779dba6a26efc7f43/js/webflow.2084559d.27f4f6dae0ef93e6.js":
            "/js/webflow-main.js",
    }
    for old, new in js_map.items():
        content = content.replace(old, new)

    # 2. Replace jQuery
    content = re.sub(
        r'https://d3e54v103j8qbb\.cloudfront\.net/js/jquery[^\s"\']+',
        "/js/jquery.min.js",
        content
    )

    # 3. Replace Clarity script (encoded URL)
    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43%2F[^\s"\']+clarity[^\s"\']+\.js',
        "/js/clarity-script.js",
        content
    )

    # 4. Replace CSS reference
    content = content.replace(
        "css/nfinance-cot-course.webflow.shared.927130f0f.css",
        "/css/nfinance.css"
    )

    # 5. Replace all image CDN URLs
    def replace_cdn_image(match):
        url = match.group(0)
        decoded = unquote(url)
        filename = Path(urlparse(decoded).path).name
        return f"/assets/images/{filename}"

    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43/[^\s"\'>\)\\]+\.(svg|png|jpg|jpeg|gif|webp|avif|ico)',
        replace_cdn_image,
        content,
        flags=re.IGNORECASE
    )

    # 6. Replace video CDN URLs (non-encoded paths)
    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43/[^\s"\'>\)\\]+\.mp4',
        "/assets/videos/main-page.mp4",
        content,
        flags=re.IGNORECASE
    )

    # 7. Replace percent-encoded image CDN URLs (path separator is %2F)
    def replace_encoded_cdn_image(match):
        url = match.group(0)
        decoded = unquote(url)
        filename = Path(urlparse(decoded).path).name
        return f"/assets/images/{filename}"

    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43%2F[^\s"\'>\)\\,&]+\.(svg|png|jpg|jpeg|gif|webp|avif|ico)',
        replace_encoded_cdn_image,
        content,
        flags=re.IGNORECASE
    )

    # 8. Replace percent-encoded video CDN URLs
    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43%2F[^\s"\'>\)\\,&]+\.mp4',
        "/assets/videos/main-page.mp4",
        content,
        flags=re.IGNORECASE
    )

    # 9. Replace percent-encoded webm CDN URLs
    content = re.sub(
        r'https://cdn\.prod\.website-files\.com/6947fb1779dba6a26efc7f43%2F[^\s"\'>\)\\,&]+\.webm',
        "/assets/videos/main-page.webm",
        content,
        flags=re.IGNORECASE
    )

    # 10. Remove the bare preconnect link to cdn.prod.website-files.com
    content = re.sub(
        r'<link\s+href="https://cdn\.prod\.website-files\.com"\s+rel="preconnect"\s*/?>',
        '',
        content,
        flags=re.IGNORECASE
    )

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"Patched: {html_path}")

# Patch UA version
patch_html("C:/Users/nazar/nfinance-landing/index.html")
patch_html("C:/Users/nazar/nfinance-landing/privacy-policy/index.html")
patch_html("C:/Users/nazar/nfinance-landing/disclaimer/index.html")
