# Trukuky — website công khai

Bản web tĩnh của Trukuky (thời trang mẹ & bé gái, 43 Lê Chân, Hải Phòng), chạy trên GitHub Pages:
https://son290613-collab.github.io/trukuky-web/

Thư mục này chỉ chứa phần khách xem được. Tài liệu nội bộ, sổ chốt đơn, tên khách
và mã quản trị KHÔNG nằm ở đây và không được đưa lên đây.

## Đặt hàng

**Web không nhận thanh toán, và sẽ không bao giờ nhận.** Đây là trang tĩnh trên
GitHub Pages — không có máy chủ, không có cổng thanh toán.

Giỏ hàng ở đây là **phiếu đặt hàng**, không phải quầy thu ngân. Khách chọn mẫu và
size → thêm vào giỏ → trang "Gửi đơn" soạn sẵn toàn bộ đơn thành một đoạn văn bản
→ khách dán vào Messenger gửi cho shop. Shop đối chiếu sổ chốt đơn, xác nhận giá,
size còn hàng rồi mới chốt.

Việc này thay cho cách cũ (mỗi mẫu một nút "Nhắn hỏi mẫu …" mở Messenger trống):
khách đặt ba món chỉ nhắn một lần, và shop nhận được đủ mã mẫu, size, số lượng
ngay từ tin nhắn đầu tiên thay vì phải hỏi lại từng thứ.

> Messenger **không** cho điền sẵn nội dung tin nhắn qua đường link — Facebook đã
> bỏ tính năng đó. Nên luồng đúng là **chép đơn vào clipboard rồi mở Messenger để
> khách dán**. Trang luôn hiện sẵn ô văn bản để khách chép tay nếu trình duyệt
> chặn clipboard. Đừng thay bằng link `m.me/...?text=` — nó im lặng không hoạt động.

### Mẫu nào đặt online được
Quy tắc nằm ở `isOrderableProduct()` trong `js/data.js`, và phải khớp với bản sao
trong `scripts/build-product-pages.js`:

| `priceStatus`  | Hiện giá | Vào giỏ | Nghĩa là |
|----------------|----------|---------|----------|
| `confirmed`    | có       | có      | Shop đã duyệt bảng giá chính thức. |
| `live`         | có       | có      | Giá chính shop đọc công khai trong livestream. |
| `provisional`  | **không**| **không** | Số người làm web dựng tạm, shop chưa duyệt. |

Điền giá thật cho một mẫu `provisional` rồi đổi `priceStatus` thành `confirmed`
là mẫu đó **tự mở giỏ hàng**, không cần sửa code.

`priceFrom: true` nghĩa là con số đang hiện là **giá sàn** ("Từ 390.000₫") vì mỗi
size một giá — mọi chỗ cộng tổng đều gắn nhãn "tạm tính" cho đơn có mẫu như vậy.

## Chăm sóc khách hàng
Nội dung phí ship, đổi trả và giờ mở cửa nằm trong `data/policies.json` để sửa
được mà không đụng vào code. Mỗi khối có cờ `confirmed`:

- `confirmed: false` → trang mô tả **quy trình** ("shop báo phí theo từng đơn").
- `confirmed: true`  → trang hiện đúng con số shop đã điền.

**Không bao giờ bịa một mức phí ship hay thời hạn đổi trả vào file này.** Một lời
hứa shop không giữ được gây thiệt hại lớn hơn nhiều so với việc nói thật rằng
shop báo theo từng đơn.

## Cập nhật mẫu sau mỗi buổi live
1. Sửa `data/products.json` (mẫu live dùng `priceStatus: "live"`, mã dạng `L<ngày><tháng>-M..`),
   thêm ảnh vào `images/products/` và bản AVIF cùng tên vào `images/products/avif/`.
2. Chạy:
   ```
   npm run build
   ```
   (gồm `npm run photos`, `build:products`, `build:sitemap`. `SITE_URL` đã mặc định
   đúng địa chỉ GitHub Pages — chỉ cần truyền biến này nếu đổi sang tên miền riêng.)
3. `git add -A && git commit -m "Cập nhật mẫu live …" && git push` — GitHub Pages tự cập nhật sau 1–2 phút.

Lần cập nhật 26/09/2026: thêm 23 mẫu từ sổ "Live 17/9" (chỉ mẫu còn size), cập nhật giá/size
cho 2 mẫu cũ trùng bộ ảnh (A1 ↔ M26, PK2 ↔ M05). Size còn hàng là số rà theo sổ ngày 26/9,
shop luôn xác nhận lại trước khi chốt.

Lần cập nhật 27/09/2026: rà lại size còn của 25 mẫu live theo sổ "Live 17/9" và buổi live 24/9
(9 mẫu đã lên lại live 24/9 được trừ các size bán trong buổi đó và gắn link đoạn live 24/9).
Bỏ mọi con số tồn cụ thể khỏi trang ("còn 1", "còn 2" → "còn ít"). Mẫu mới của live 24/9 chưa lên web
vì chưa có sổ chốt đơn buổi đó.
