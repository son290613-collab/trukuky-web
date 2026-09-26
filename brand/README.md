# Wordmark TRUKUKY — quy chuẩn sử dụng

Cập nhật 29/08/2026. Mọi file trong `brand/logo/` được sinh bằng
`python3 scripts/build-wordmark.py --kit` và `python3 scripts/wordmark-png.py`.
Đừng sửa tay file SVG: sửa tham số trong script rồi dựng lại.

---

## 1. Đây là gì, và không phải gì

**Là:** một wordmark dựng từ đường viền chữ Fraunces (giấy phép SIL OFL 1.1,
cho phép dùng thương mại và chỉnh sửa), đã chuyển hoàn toàn thành `<path>`
vector. Không còn phụ thuộc vào việc font có tải được hay không.

**Không phải:** lettering vẽ tay riêng cho Trukuky. Muốn có chữ vẽ riêng —
tức là các nét được một nhà thiết kế chữ nắn lại cho chỉ Trukuky mới có — thì
cần thuê thiết kế. Bản này là điểm xuất phát tốt, không phải điểm kết thúc.

**Cảnh báo pháp lý:** chưa tra cứu nhãn hiệu. Trước khi in lên tem, túi, nhãn
cổ hoặc đăng ký kinh doanh, phải tra cứu tại Cục Sở hữu trí tuệ (ipvietnam.gov.vn)
nhóm 25 (quần áo) và nhóm 35 (bán lẻ), và kiểm tra tương đồng với các nhãn
đang có hiệu lực. Không ai được nói logo này là “độc bản” khi chưa tra cứu.

---

## 2. Chọn hướng nào và vì sao

Ba hướng đã dựng thật (xem `brand/logo/concept-*.svg`), chấm theo tám tiêu chí,
thang 5:

| Tiêu chí | A · Fraunces 600 | B · Fraunces 450 | C · Grotesque 600 |
|---|---|---|---|
| Nhận diện (nhớ được sau một lần thấy) | 4 | 4 | 2 |
| Khác biệt với đối thủ | 4 | 4 | 1 |
| Phù hợp cả mẹ và bé | 4 | 3 | 3 |
| Cảm giác cao cấp | 4 | 5 | 3 |
| **Đọc được ở cỡ nhỏ (đo thật)** | **4** | **2** | **5** |
| Khả năng ứng dụng (thêu, dập, tem) | 4 | 2 | 5 |
| Khoảng cách thị giác với đối thủ | 4 | 4 | 1 |
| Phát triển thành hệ thống | 4 | 3 | 3 |
| **Tổng /40** | **32** | **27** | **23** |

**Chọn A.** Lý do quyết định là cột đã đo thật, không phải cảm nhận: dựng cả
ba hướng ra PNG ở 200/150/120/96/72 px rồi nhìn. B đẹp hơn khi phóng to nhưng
ở 96 px các nét mảnh gãy vụn — mà 96 px chính là cỡ logo trên ảnh đại diện
Facebook và trên tem giá. C đọc tốt nhất nhưng đó đúng là công thức chữ không
chân giãn rộng mà gần như mọi nhà mốt đang dùng; chọn C là tự nguyện biến mất.

**Điều chưa kiểm được:** chưa so trực tiếp với logo Zara vì zara.com chặn truy
cập tự động (Akamai interstitial). Nhận định “khoảng cách thị giác” với Zara là
suy luận, không phải đối chứng.

---

## 3. Bộ file

| File | Dùng ở đâu |
|---|---|
| `trukuky-wordmark.svg` | Web — `fill="currentColor"`, ăn theo màu chữ xung quanh |
| `trukuky-wordmark-ink.svg` | Nền sáng, màu mực `#2B2025` |
| `trukuky-wordmark-light.svg` | Nền tối, màu `#FFF8F9` |
| `trukuky-wordmark-mono.svg` | Đen tuyệt đối — cho tem, dập nổi, thêu, in một màu |
| `trukuky-wordmark-on-light.svg` / `-on-dark.svg` | Bản xem trước có nền, để duyệt |
| `trukuky-wordmark-ink-1024.png` / `-2048.png` | PNG nền trong suốt, cho Facebook, Canva, in |
| `trukuky-wordmark-light-1024.png` / `-2048.png` | PNG sáng cho nền tối |

Mọi SVG: 7 `<path>`, có `viewBox`, không nhúng ảnh raster, không `<text>`,
không `font-family`, có `role="img"` và `aria-label="Trukuky"`.

---

## 4. Khoảng trống bảo vệ và cỡ nhỏ nhất

**Khoảng trống bảo vệ:** tối thiểu bằng **chiều cao chữ T** ở mọi phía. Không
đặt bất kỳ chữ, ảnh, đường kẻ hay mép trang nào vào trong vùng đó.

**Cỡ nhỏ nhất — đo thật, không phỏng đoán:**

| Bối cảnh | Bề ngang tối thiểu | Ghi chú |
|---|---|---|
| Màn hình | **120 px** | Ở 96 px chân chữ bắt đầu dính, ở 72 px chữ nhoè |
| In (tem, nhãn cổ, túi) | **25 mm** | Dưới mức này dùng bản `mono` và kiểm mẫu in thật |
| Thêu | **35 mm** | Chỉ dùng bản `mono`; phải may thử một mẫu trước |

Nếu chỗ đặt hẹp hơn cỡ tối thiểu thì **không thu nhỏ logo** — đổi sang chữ
“TRUKUKY” gõ bằng font thân bài, hoặc bỏ logo khỏi vị trí đó.

---

## 5. Đặt ở đâu

- **Header web:** cao 24–26 px, canh trái, khoảng cách tới mép trái bằng lề container.
- **Footer web:** cao 22 px, cùng cột với dòng địa chỉ.
- **Ảnh đại diện Facebook:** dùng PNG 1024, đặt trong khung tròn an toàn — chữ
  giãn rộng bị khung tròn cắt hai đầu, nên phải thu logo còn ~62% đường kính.
  *Chưa kiểm bằng ảnh thật — cần dựng thử trước khi đổi avatar.*
- **Nhãn cổ, tem giá, túi:** bản `mono`, một màu, không đổ bóng.

---

## 6. Những cách dùng sai

1. Gõ lại chữ “TRUKUKY” bằng font rồi coi đó là logo. Giãn chữ khác nhau ra hình khác nhau.
2. Đổi khoảng cách chữ, kéo giãn hoặc bóp hẹp theo một chiều.
3. Đổ bóng, viền ngoài, gradient, hiệu ứng kim loại.
4. Đặt lên ảnh có chi tiết rối mà không có lớp nền hoặc lớp phủ tối.
5. Dùng bản `light` trên nền sáng (và ngược lại) — chữ biến mất.
6. Ghép thêm hình vẽ, vương miện, trái tim, nơ, hình em bé, mascot.
7. Xoay nghiêng, uốn cong, đặt dọc.
8. Đổi màu sang hồng nhạt `#D78AA0` — tỷ lệ tương phản chỉ **2,50:1** trên nền
   `#FFF8F9`, không đạt bất kỳ ngưỡng nào. Màu này chỉ dùng cho nét trang trí.
9. Dùng logo thay cho tiêu đề trang: `<h1>` phải là chữ thật để máy tìm kiếm đọc được.

---

## 7. Dựng lại

```bash
python3 scripts/build-wordmark.py           # ba hướng để so
python3 scripts/build-wordmark.py --kit     # bộ file cuối cùng (hướng A)
python3 scripts/wordmark-png.py             # PNG nền trong suốt 1024 và 2048
```

`scripts/svg-to-png.py` dùng `qlmanage` của macOS — **không dùng cho logo**:
đã đo, nó render lên nền trắng đặc (0% điểm ảnh trong suốt). Giữ lại vì tiện
cho việc xem nhanh, không dùng để xuất file giao đi.
