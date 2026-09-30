# Trukuky — website công khai

Bản web tĩnh của Trukuky (thời trang mẹ & bé gái, 43 Lê Chân, Hải Phòng), chạy trên GitHub Pages:
https://son290613-collab.github.io/trukuky-web/

Thư mục này chỉ chứa phần khách xem được. Tài liệu nội bộ, sổ chốt đơn, tên khách
và mã quản trị KHÔNG nằm ở đây và không được đưa lên đây.

## Cấu trúc trang

| Trang | Nội dung |
|---|---|
| `index.html` | Trang chủ — **chỉ đợt live mới nhất** + nhóm "Mới về", khu Sale rút gọn, video, bộ sưu tập, liên hệ |
| `shop.html` | **Tất cả sản phẩm** — toàn bộ mẫu bán được, kể cả các buổi live trước |
| `sale.html` | **Đang giảm giá** |
| `p/<mã>.html` | Trang chi tiết từng mẫu (sinh tự động) |
| `cart.html`, `checkout.html` | Giỏ hàng và đặt đơn |

Trang chủ không dài thêm sau mỗi buổi live: mẫu của đợt cũ tự dồn sang `shop.html`.
Ranh giới là trường `drop` trong `data/products.json` (xem dưới).

## Đặt hàng

Khách chọn size → thêm vào giỏ → điền tên, số điện thoại, địa chỉ → website sinh
mã đơn dạng `TK<ngày>-<4 ký tự>`. Shop gọi lại xác nhận size còn hàng, phí giao và
tổng tiền **trước khi** gửi hàng. Thanh toán khi nhận hàng (COD).

### ⚠️ Website cần một nơi để nhận đơn

`data/site-config.json` có trường `orderEndpoint`. **Khi trường này còn rỗng, đơn
KHÔNG tới được shop** — trang xác nhận sẽ nói thẳng với khách là đơn chưa gửi được
và mời khách gọi điện, chứ không bao giờ báo "đặt hàng thành công" giả.

Cách tạo địa chỉ nhận đơn (Google Apps Script, miễn phí, ~5 phút): làm theo hướng
dẫn ngay đầu file `scripts/order-endpoint.gs`, rồi dán URL nhận được vào
`orderEndpoint` và commit.

## Quy tắc giá — đọc trước khi sửa dữ liệu

Trường `priceStatus` trong `data/products.json` quyết định mẫu đó có bán được không:

| `priceStatus` | Nghĩa | Trên web |
|---|---|---|
| `confirmed` | Shop đã gửi bảng giá chính thức | Bán được |
| `live` | Giá shop tự đọc công khai trong buổi livestream | Bán được |
| `provisional` | **Con số dựng tạm lúc làm web, shop CHƯA xác nhận** | Không hiện giá, không bán được |

Mẫu `provisional` được gom xuống khu "Sắp lên kệ" ở cuối `shop.html`: có ảnh, không
có giá, không có nút mua. Muốn mở bán thì gửi giá thật rồi đổi `priceStatus` thành
`confirmed`.

**Còn 17 mẫu đang ở trạng thái `provisional`:** A2, A3, A4, G1, G3, G4, G5, G7, G8,
G9, G10, G11, G12, PK1, PK3, PK4, PK5.

## Giảm giá

Một mẫu vào trang Sale khi có `"sale": true`. Muốn hiện `-X%` thì phải có thêm
`"priceOriginal": <giá trước khi giảm>`:

```json
{ "id": "L1709-M02", "price": 290000, "priceOriginal": 390000, "sale": true }
```

Không có `priceOriginal` thì mẫu vẫn nằm trong trang Sale nhưng chỉ hiện giá đang
bán. Website **không** tự bịa giá gốc để tính phần trăm — niêm yết sai giá trước
khi giảm là vi phạm quy định khuyến mại.

## Đợt hàng (`drop`)

Mỗi mẫu có một trường `drop`:

- `"2026-09-24"` — lên trong buổi live gần nhất → **hiện trên trang chủ**
- `"2026-09-17"` — buổi live trước → chỉ ở `shop.html`
- `"catalogue"` — mẫu catalogue, không gắn buổi live nào

Sau mỗi buổi live, đặt `drop` của mẫu mới thành ngày buổi live đó. Trang chủ tự
đổi theo, kể cả dòng nhãn "Hàng mới về · Live 24/9".

## Cập nhật mẫu sau mỗi buổi live

1. Sửa `data/products.json` (mẫu live dùng `priceStatus: "live"`, mã dạng `L<ngày><tháng>-M..`,
   nhớ đặt `drop`), thêm ảnh vào `images/products/` và bản AVIF cùng tên vào `images/products/avif/`.
2. Chạy:
   ```
   node scripts/photo-sizes.js
   export SITE_URL=https://son290613-collab.github.io/trukuky-web
   node scripts/build-pages.js          # shop.html + sale.html
   node scripts/build-product-pages.js  # p/*.html
   node scripts/build-sitemap.js
   ```
3. `git add -A && git commit -m "Cập nhật mẫu live …" && git push` — GitHub Pages tự cập nhật sau 1–2 phút.

`scripts/build-pages.js` cắt phần đầu trang, menu và chân trang thẳng từ `index.html`,
nên sửa menu ở `index.html` rồi chạy lại là hai trang kia tự khớp — không bao giờ
phải sửa cùng một cái menu ở ba chỗ.

## Nhật ký cập nhật

**26/09/2026** — thêm 23 mẫu từ sổ "Live 17/9" (chỉ mẫu còn size), cập nhật giá/size
cho 2 mẫu cũ trùng bộ ảnh (A1 ↔ M26, PK2 ↔ M05).

**27/09/2026** — rà lại size còn của 25 mẫu live theo sổ "Live 17/9" và buổi live 24/9.
Bỏ mọi con số tồn cụ thể khỏi trang ("còn 1", "còn 2" → "còn ít").

**30/09/2026** — chuyển từ catalogue-nhắn-tin sang cửa hàng đặt được đơn:
bỏ nút "Nhắn hỏi mẫu" ở thẻ hàng và khung xem nhanh, mở giỏ hàng cho 25 mẫu có giá
live, tách `shop.html` và `sale.html`, trang chủ chỉ giữ đợt live mới nhất, thêm
trường `drop` / `sale` / `priceOriginal`, và nối trang thanh toán vào một địa chỉ
nhận đơn cấu hình được.
