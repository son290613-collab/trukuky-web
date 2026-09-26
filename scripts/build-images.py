#!/usr/bin/env python3
"""Sinh ảnh AVIF nhiều bề rộng cho Trukuky.

Chạy: npm run images   (cần: python3 -m pip install pillow pillow-avif-plugin)

── Vì sao có file này, và vì sao KHÔNG dùng sips ──────────────────────────────
Bản đầu dùng `sips` của macOS vì máy không có ffmpeg/ImageMagick/avifenc. sips
ghi ra file .avif đúng kích thước, đúng khung chứa, mở bằng Preview vẫn thấy
ảnh — nhưng Chromium giải mã ra một khung TRONG SUỐT HOÀN TOÀN. Nghĩa là mọi
ảnh trên site biến mất, trong khi mọi phép kiểm bằng JavaScript vẫn báo "ổn":
naturalWidth khác 0, img.complete = true, không có request 404 nào.

Cách duy nhất phát hiện: vẽ ảnh lên canvas rồi đếm số màu khác nhau trong
điểm ảnh. Bản sips cho ra ĐÚNG MỘT màu rgba(0,0,0,0); bản libavif cho ra 1.455
màu, trùng khớp với ảnh JPEG gốc.

Pillow + pillow-avif-plugin dùng libavif — chính thư viện trình duyệt dùng để
giải mã. Nên file sinh ra ở đây chắc chắn giải mã được ở phía khách.

Vì lỗi này im lặng đến mức đó, hàm verify() dưới đây chạy sau mỗi lần dựng và
làm script thất bại nếu có file nào giải mã ra ảnh phẳng.
"""

import json
import os
import sys

try:
    from PIL import Image
    import pillow_avif  # noqa: F401  — đăng ký bộ mã hoá AVIF vào Pillow
except ImportError:
    sys.exit("Thiếu thư viện. Chạy: python3 -m pip install pillow pillow-avif-plugin")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIRS = ["images/products", "videos/posters"]
WIDTHS = [480, 800, 1400]
QUALITY = 63   # đủ giữ nét vải và đường chỉ; dưới 55 bắt đầu bệt vùng chuyển màu
SPEED = 4      # 0 chậm nhất/nhỏ nhất … 10 nhanh nhất; 4 là điểm cân bằng


def widths_for(w):
    """Chỉ sinh bề rộng NHỎ HƠN ảnh gốc — phóng to không thêm chi tiết nào.
    Bề rộng gốc chỉ thêm vào nếu nó cách mức gần nhất trên 15%, tránh sinh hai
    file gần như y hệt (ảnh bìa reels 506px từng đẻ ra cả bản 480 lẫn 506)."""
    out = [x for x in WIDTHS if x < w]
    nearest = out[-1] if out else None
    if not nearest or w / nearest > 1.15:
        out.append(w)
    return out


def verify(path):
    """Giải mã lại file vừa ghi và đếm số màu. Ảnh thật luôn có hàng trăm màu;
    một khung rỗng chỉ có một. Đây là chốt chặn cho đúng lỗi sips ở trên."""
    with Image.open(path) as im:
        sample = im.convert("RGBA").resize((40, 40), Image.NEAREST)
        colours = len(set(sample.getdata()))
    if colours < 20:
        raise SystemExit(
            f"\nDỰNG THẤT BẠI: {path} giải mã ra ảnh phẳng ({colours} màu).\n"
            f"Bộ mã hoá AVIF đang dùng cho ra file trình duyệt không đọc được.\n"
            f"Kiểm tra lại pillow-avif-plugin trước khi chạy tiếp."
        )
    return colours


def main():
    manifest = {}
    src_kb = out_kb = 0
    made = 0
    checked = 0

    for rel_dir in SRC_DIRS:
        abs_dir = os.path.join(ROOT, rel_dir)
        if not os.path.isdir(abs_dir):
            continue
        out_dir = os.path.join(abs_dir, "avif")
        os.makedirs(out_dir, exist_ok=True)

        names = sorted(f for f in os.listdir(abs_dir) if f.lower().endswith((".jpg", ".jpeg")))
        for name in names:
            src = os.path.join(abs_dir, name)
            base = os.path.splitext(name)[0]
            src_kb += os.path.getsize(src) / 1024

            with Image.open(src) as im:
                im = im.convert("RGB")
                w, h = im.size
                variants = []
                for target in widths_for(w):
                    dest = os.path.join(out_dir, f"{base}-{target}.avif")
                    resized = im if target == w else im.resize(
                        (target, round(target * h / w)), Image.LANCZOS)
                    resized.save(dest, format="AVIF", quality=QUALITY, speed=SPEED)
                    out_kb += os.path.getsize(dest) / 1024
                    made += 1
                    variants.append({"w": target, "url": f"{rel_dir}/avif/{base}-{target}.avif"})

            # verify từng file một, không lấy mẫu — lỗi này im lặng quá
            for v in variants:
                verify(os.path.join(ROOT, v["url"]))
                checked += 1

            manifest[f"{rel_dir}/{name}"] = {"w": w, "h": h, "avif": variants}

    with open(os.path.join(ROOT, "data/image-variants.json"), "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")

    print(f"Đã sinh {made} file AVIF từ {len(manifest)} ảnh gốc (libavif, quality={QUALITY})")
    print(f"  Kiểm tra giải mã: {checked}/{made} file có nội dung ảnh thật ✓")
    print(f"  JPEG gốc:      {src_kb:>8.0f} KB")
    print(f"  AVIF mọi cỡ:   {out_kb:>8.0f} KB")


if __name__ == "__main__":
    main()
