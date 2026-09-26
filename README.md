# Trukuky — website công khai

Bản web tĩnh của Trukuky (thời trang mẹ & bé gái, 43 Lê Chân, Hải Phòng), chạy trên GitHub Pages:
https://son290613-collab.github.io/trukuky-web/

Thư mục này chỉ chứa phần khách xem được. Tài liệu nội bộ, sổ chốt đơn, tên khách
và mã quản trị KHÔNG nằm ở đây và không được đưa lên đây.

## Đặt hàng
Web không nhận thanh toán. Mỗi mẫu có nút "Nhắn hỏi mẫu …" mở Messenger của shop;
shop đối chiếu sổ chốt đơn và kho rồi mới xác nhận giá, size và giữ hàng.

## Cập nhật mẫu sau mỗi buổi live
1. Sửa `data/products.json` (mẫu live dùng `priceStatus: "live"`, mã dạng `L<ngày><tháng>-M..`),
   thêm ảnh vào `images/products/` và bản AVIF cùng tên vào `images/products/avif/`.
2. Chạy:
   ```
   node scripts/photo-sizes.js
   SITE_URL=https://son290613-collab.github.io/trukuky-web node scripts/build-product-pages.js
   SITE_URL=https://son290613-collab.github.io/trukuky-web node scripts/build-sitemap.js
   ```
3. `git add -A && git commit -m "Cập nhật mẫu live …" && git push` — GitHub Pages tự cập nhật sau 1–2 phút.

Lần cập nhật 26/09/2026: thêm 23 mẫu từ sổ "Live 17/9" (chỉ mẫu còn size), cập nhật giá/size
cho 2 mẫu cũ trùng bộ ảnh (A1 ↔ M26, PK2 ↔ M05). Size còn hàng là số rà theo sổ ngày 26/9,
shop luôn xác nhận lại trước khi chốt.

Lần cập nhật 27/09/2026: rà lại size còn của 25 mẫu live theo sổ "Live 17/9" và buổi live 24/9
(9 mẫu đã lên lại live 24/9 được trừ các size bán trong buổi đó và gắn link đoạn live 24/9).
Bỏ mọi con số tồn cụ thể khỏi trang ("còn 1", "còn 2" → "còn ít"). Mẫu mới của live 24/9 chưa lên web
vì chưa có sổ chốt đơn buổi đó.
