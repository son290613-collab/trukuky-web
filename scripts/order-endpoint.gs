/* ==========================================================================
   TRUKUKY — Nơi nhận đơn hàng từ website (Google Apps Script)

   Website là trang tĩnh trên GitHub Pages, không có máy chủ riêng, nên đơn
   hàng cần một chỗ để rơi vào. Đoạn mã này biến MỘT Google Sheet thành chỗ
   đó: miễn phí, và đơn nằm ngay trong Google Sheet mà shop đã quen dùng để
   đối chiếu sổ chốt đơn.

   CÁCH CÀI (làm một lần, khoảng 5 phút)
   1. Tạo một Google Sheet mới, đặt tên "Đơn web Trukuky".
   2. Trong Sheet: Tiện ích mở rộng ▸ Apps Script.
   3. Xoá hết nội dung mẫu, dán toàn bộ file này vào, bấm Lưu.
   4. Bấm Triển khai ▸ Tạo bản triển khai mới ▸ chọn loại "Ứng dụng web".
        - Thực thi với tên: Tôi
        - Người có quyền truy cập: Bất kỳ ai
   5. Copy đường dẫn "URL ứng dụng web" nhận được.
   6. Dán URL đó vào "orderEndpoint" trong data/site-config.json rồi commit.

   KIỂM TRA: đặt thử một đơn trên web, đơn phải hiện thành một dòng mới
   trong Sheet trong vòng vài giây. Nếu không thấy, xem lại bước 4 —
   "Người có quyền truy cập" phải là "Bất kỳ ai".

   LƯU Ý RIÊNG TƯ: Sheet này chứa tên, số điện thoại và địa chỉ khách. Chỉ
   chia sẻ cho người thật sự cần xử lý đơn, và không đăng ảnh chụp Sheet này
   lên mạng xã hội.
   ========================================================================== */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Bẫy bot: người thật không bao giờ điền ô "company" (ô này bị ẩn).
    if (data.company) {
      return json({ ok: true, id: data.id });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Thời điểm', 'Mã đơn', 'Tên khách', 'Điện thoại',
                       'Địa chỉ', 'Ghi chú', 'Thanh toán', 'Các món', 'Tổng tiền']);
    }

    var items = (data.items || []).map(function (i) {
      return i.id + (i.size ? ' / ' + i.size : '') + (i.color ? ' / ' + i.color : '') + ' × ' + i.qty;
    }).join('\n');

    sheet.appendRow([
      new Date(),
      data.id || '',
      (data.customer && data.customer.name) || '',
      "'" + ((data.customer && data.customer.phone) || ''), // dấu ' giữ số 0 đầu
      (data.customer && data.customer.address) || '',
      (data.customer && data.customer.note) || '',
      data.paymentMethod || '',
      items,
      data.total || 0
    ]);

    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
