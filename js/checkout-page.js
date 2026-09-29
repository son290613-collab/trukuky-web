/* ==========================================================================
   TRUKUKY — Gửi đơn cho shop qua Messenger
   Website là trang tĩnh trên GitHub Pages: KHÔNG có máy chủ, KHÔNG nhận
   thanh toán, KHÔNG lưu đơn. Bản cũ của trang này POST vào /api/orders —
   một địa chỉ không tồn tại — nên khách điền tên, số điện thoại, địa chỉ,
   bấm "Đặt hàng" và chỉ nhận về một thông báo lỗi, đơn mất trắng.

   Việc của trang này là soạn sẵn nội dung đơn (mã, size, số lượng) để khách
   dán vào Messenger — shop trả lời một lần là chốt được, thay vì hỏi qua
   hỏi lại 6–10 tin. Mọi thông tin khách gõ chỉ nằm trên máy của khách.
   ========================================================================== */

const CUSTOMER_KEY = 'trukuky_customer_v1';
const STORE_PHONE_DISPLAY = '0225 6506 669';
const STORE_PHONE_TEL = 'tel:+842256506669';

/* ---------- Thông tin khách: chỉ đọc/ghi trên máy khách ----------
   Bọc try/catch ở mọi lần truy cập: Safari chế độ riêng tư ném lỗi ngay cả
   khi chỉ đọc, và một trang gửi đơn thì không được phép vỡ vì chuyện đó. */
function readCustomer() {
  try {
    const raw = JSON.parse(localStorage.getItem(CUSTOMER_KEY));
    if (raw && typeof raw === 'object') return raw;
  } catch {
    /* không đọc được thì coi như khách mới */
  }
  return {};
}

function writeCustomer(customer) {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  } catch {
    /* không lưu được cũng không sao: đơn vẫn soạn được trong phiên này */
  }
}

function forgetCustomer() {
  try {
    localStorage.removeItem(CUSTOMER_KEY);
  } catch {
    /* im lặng — nút "xoá thông tin" không được phép làm vỡ trang */
  }
}

/* ---------- Các mảnh giao diện ---------- */
function checkoutSummaryHTML(lines, total) {
  const estimated = lines.some(lineHasEstimatedPrice);
  return `
  <aside class="summary-card">
    <h3>Đơn hàng của bạn</h3>
    ${lines.map((l) => {
      const v = variantLabel(l);
      const from = lineHasEstimatedPrice(l) ? '<small>từ</small> ' : '';
      return `<div class="summary-row"><span>[${l.product.id}] ${l.product.title}${v ? ` <i>(${v})</i>` : ''} × ${l.qty}</span><span>${from}${formatVND(l.product.price * l.qty)}</span></div>`;
    }).join('')}
    <div class="summary-row"><span>Phí vận chuyển</span><span>Shop báo khi xác nhận</span></div>
    <div class="summary-row total"><span>Tạm tính</span><span class="amount">${estimated ? '<small>từ</small> ' : ''}${formatVND(total)}</span></div>
    <p class="summary-caveat">${estimated
      ? 'Trong đơn có mẫu tính giá theo size nên đây mới là giá sàn. Shop xác nhận giá cuối và tình trạng hàng khi trả lời tin nhắn của bạn.'
      : 'Giá tạm tính theo web. Shop xác nhận giá cuối, size còn hàng và phí giao khi trả lời tin nhắn của bạn.'}</p>
  </aside>`;
}

/* Giá trị các ô được gán bằng .value sau khi dựng HTML (xem fillCustomerFields)
   chứ không nhúng thẳng vào chuỗi — thông tin khách tự gõ không bao giờ được
   diễn giải thành HTML, kể cả khi nó đến từ localStorage của chính máy đó. */
function customerFieldsHTML() {
  return `
  <div class="handoff-block">
    <h3>Thông tin nhận hàng <span class="optional-tag">không bắt buộc</span></h3>
    <p class="field-hint">Điền sẵn để shop xử lý nhanh hơn — bạn cũng có thể nhắn sau.</p>

    <div class="field">
      <label for="fName">Họ và tên</label>
      <input id="fName" name="name" type="text" autocomplete="name" placeholder="Ví dụ: Nguyễn Thị Mai">
    </div>
    <div class="field">
      <label for="fPhone">Số điện thoại</label>
      <input id="fPhone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ví dụ: 0912 345 678">
    </div>
    <div class="field">
      <label for="fAddress">Địa chỉ nhận hàng</label>
      <input id="fAddress" name="address" type="text" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành">
    </div>
    <div class="field">
      <label for="fNote">Ghi chú</label>
      <textarea id="fNote" name="note" placeholder="Chiều cao, cân nặng của bé, thời gian nhận hàng mong muốn..."></textarea>
    </div>

    <p class="privacy-note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
      <span><b>Thông tin này chỉ được dùng để soạn sẵn tin nhắn trên máy bạn.</b> Website không gửi và không lưu trữ thông tin của bạn ở bất kỳ đâu — không máy chủ, không bên thứ ba. Nội dung chỉ rời khỏi máy bạn khi chính bạn dán vào Messenger và bấm gửi. Máy bạn tự nhớ để lần sau khỏi gõ lại; bấm dòng dưới là xoá sạch.</span>
    </p>
    <button type="button" class="link-btn" data-forget-customer>Xoá thông tin đã lưu trên máy này</button>
  </div>`;
}

/* Ô văn bản LUÔN hiện, không phải chỉ hiện khi chép tự động thất bại:
   clipboard API hỏng ở rất nhiều trình duyệt điện thoại và ở mọi trang
   không chạy HTTPS. Khách phải luôn nhìn thấy nội dung đơn để tự bôi đen
   và sao chép — không bao giờ để khách tay trắng. */
function orderTextBlockHTML() {
  return `
  <div class="handoff-block">
    <h3>Nội dung đơn sẽ gửi</h3>
    <p class="field-hint">Bạn có thể đọc lại, bôi đen và tự sao chép đoạn này bất cứ lúc nào.</p>
    <textarea class="order-text" id="orderTextArea" readonly rows="12" aria-label="Nội dung đơn để gửi cho shop"></textarea>
    <button type="button" class="btn btn-outline btn-block" data-copy-only>Sao chép nội dung đơn</button>
  </div>`;
}

function renderCheckoutPage(lines, total) {
  const root = document.getElementById('checkoutRoot');
  root.innerHTML = `
  <div class="checkout-layout">
    <div class="handoff">
      <p class="handoff-lead">Shop nhận đơn qua <b>Messenger</b>. Bấm nút bên dưới, website sẽ sao chép sẵn đơn của bạn rồi mở khung chat — bạn chỉ cần dán và gửi.</p>

      ${customerFieldsHTML()}
      ${orderTextBlockHTML()}

      <button type="button" class="btn btn-primary btn-lg btn-block" id="sendOrderBtn">Sao chép đơn &amp; mở Messenger</button>

      <div class="handoff-panel" id="handoffPanel" tabindex="-1" hidden></div>

      <div class="handoff-secondary">
        <a class="btn btn-outline btn-block" href="${STORE_PHONE_TEL}">Gọi shop ${STORE_PHONE_DISPLAY}</a>
        <a class="btn btn-outline btn-block" href="cart.html">Quay lại giỏ hàng</a>
      </div>
    </div>
    ${checkoutSummaryHTML(lines, total)}
  </div>`;

  fillCustomerFields(readCustomer());
  refreshOrderText();
  bindCheckoutEvents();
}

/* ---------- Dữ liệu từ form ---------- */
const CUSTOMER_FIELDS = [['fName', 'name'], ['fPhone', 'phone'], ['fAddress', 'address'], ['fNote', 'note']];

/* Khách quay lại không phải gõ lại địa chỉ — dữ liệu lấy từ máy của chính họ. */
function fillCustomerFields(customer) {
  CUSTOMER_FIELDS.forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = String(customer[key] == null ? '' : customer[key]);
  });
}

function currentCustomer() {
  const customer = {};
  CUSTOMER_FIELDS.forEach(([id, key]) => {
    const el = document.getElementById(id);
    customer[key] = el ? el.value.trim() : '';
  });
  return customer;
}

function currentOrderText() {
  return orderText(getCartLines(), currentCustomer());
}

function refreshOrderText() {
  const area = document.getElementById('orderTextArea');
  if (!area) return;
  /* Gán qua .value chứ không dựng bằng innerHTML: nội dung khách gõ không bao
     giờ được diễn giải thành HTML. */
  area.value = currentOrderText();
}

/* ---------- Sao chép ----------
   Hai đường: execCommand chạy ĐỒNG BỘ ngay trong cú chạm (còn focus, còn
   "user activation", chạy được cả khi trang không phải HTTPS), và Clipboard
   API hiện đại. Thử đường đồng bộ trước vì ngay sau đó cửa sổ Messenger mở
   ra và trang này mất focus — lúc đó Clipboard API sẽ bị từ chối. */
function copyViaSelection() {
  const area = document.getElementById('orderTextArea');
  if (!area || typeof document.execCommand !== 'function') return false;
  try {
    area.focus({ preventScroll: true });
    area.select();
    /* iOS Safari bỏ qua select() trên <textarea readonly>, chỉ nghe setSelectionRange. */
    area.setSelectionRange(0, area.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

function copyViaClipboardAPI(text) {
  if (!navigator.clipboard || !window.isSecureContext) return Promise.resolve(false);
  return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
}

/* ---------- Bước xác nhận ---------- */
function handoffPanelHTML(copied, popupBlocked) {
  const head = copied
    ? `<p class="handoff-ok"><span aria-hidden="true">✓</span> Đơn đã được sao chép. Dán (Ctrl+V / giữ màn hình rồi chọn Paste) vào khung chat Messenger và gửi cho shop.</p>`
    : `<p class="handoff-manual"><b>Máy bạn không cho sao chép tự động.</b> Bôi đen toàn bộ nội dung trong ô “Nội dung đơn sẽ gửi” ở trên, sao chép, rồi dán vào khung chat Messenger.</p>`;

  const reopen = popupBlocked
    ? `<p class="handoff-manual">Trình duyệt đã chặn cửa sổ mới. Bấm nút dưới đây để mở Messenger.</p>`
    : '';

  return `
    <h3>Bước cuối: dán vào Messenger và gửi</h3>
    ${head}
    ${reopen}
    <a class="btn btn-primary btn-block" href="${STORE_MESSENGER}" target="_blank" rel="noopener">Mở Messenger Trukuky</a>
    <p class="handoff-note">Shop trả lời trong giờ mở cửa và sẽ xác nhận giá cuối, size còn hàng và phí giao trước khi gửi hàng.</p>
    <button type="button" class="btn btn-outline btn-block" data-order-sent>Tôi đã gửi đơn — xoá giỏ hàng</button>`;
}

/* Không tự động xoá giỏ sau khi mở Messenger: mở được khung chat không có
   nghĩa là khách đã gửi tin. Khách tự bấm khi đã gửi xong. */
function showHandoffPanel(copied, popupBlocked) {
  const panel = document.getElementById('handoffPanel');
  if (!panel) return;
  panel.innerHTML = handoffPanelHTML(copied, popupBlocked);
  panel.hidden = false;
  panel.classList.add('is-visible');
  /* Bước xác nhận nằm dưới nút bấm — kéo tới cho khách thấy ngay trên màn
     hình điện thoại. Bọc guard vì đây là bước cuối: một trình duyệt thiếu
     scrollIntoView không được phép làm hỏng cả màn hướng dẫn dán tin nhắn. */
  if (typeof panel.scrollIntoView === 'function') {
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (typeof panel.focus === 'function') panel.focus({ preventScroll: true });
}

function handleSendOrder() {
  const text = currentOrderText();
  writeCustomer(currentCustomer());

  const copiedSync = copyViaSelection();
  /* Mở Messenger ngay trong cú chạm: nếu chờ một promise xong mới mở thì
     Safari coi đây là pop-up tự động và chặn.
     Không truyền 'noopener' vào tham số thứ ba — Chrome khi đó luôn trả về
     null, ta sẽ tưởng nhầm là cửa sổ bị chặn; cắt opener bằng tay an toàn
     tương đương mà vẫn biết cửa sổ có mở được hay không. */
  const win = window.open(STORE_MESSENGER, '_blank');
  if (win) { try { win.opener = null; } catch { /* trình duyệt cũ */ } }

  if (copiedSync) {
    showHandoffPanel(true, !win);
    return;
  }
  /* Trình duyệt mới có thể đã bỏ execCommand — thử nốt Clipboard API rồi mới
     kết luận là phải chép tay. */
  copyViaClipboardAPI(text).then((ok) => showHandoffPanel(ok, !win));
}

function handleCopyOnly() {
  const text = currentOrderText();
  writeCustomer(currentCustomer());
  const done = (ok) => {
    if (typeof showToast === 'function') {
      showToast(
        ok ? 'Đã sao chép đơn' : 'Chưa sao chép được',
        ok ? 'Dán vào khung chat Messenger và gửi cho shop.' : 'Bôi đen nội dung trong ô bên trên rồi sao chép thủ công nhé.',
      );
    }
  };
  if (copyViaSelection()) { done(true); return; }
  copyViaClipboardAPI(text).then(done);
}

function renderCartClearedState() {
  const root = document.getElementById('checkoutRoot');
  root.innerHTML = `
  <div class="handoff-done">
    <h2>Đã xoá giỏ hàng</h2>
    <p>Cảm ơn bạn. Trukuky sẽ trả lời tin nhắn của bạn trên Messenger và xác nhận giá cuối, size còn hàng cùng phí giao trước khi gửi hàng.</p>
    <p class="handoff-note">Nếu chờ lâu chưa thấy shop trả lời, bạn gọi giúp shop số ${STORE_PHONE_DISPLAY} nhé.</p>
    <div class="handoff-secondary">
      <a class="btn btn-primary btn-block" href="index.html#products">Xem tiếp hàng mới</a>
      <a class="btn btn-outline btn-block" href="${STORE_PHONE_TEL}">Gọi shop ${STORE_PHONE_DISPLAY}</a>
    </div>
  </div>`;
}

function bindCheckoutEvents() {
  const root = document.getElementById('checkoutRoot');
  if (!root || root.dataset.eventsBound) return;
  root.dataset.eventsBound = '1';

  /* Nội dung đơn phải bám theo từng ký tự khách gõ — nếu chỉ dựng lúc tải
     trang thì ô văn bản dự phòng sẽ là một bản cũ, thiếu tên và địa chỉ. */
  root.addEventListener('input', (e) => {
    if (!e.target.closest('.field')) return;
    refreshOrderText();
    writeCustomer(currentCustomer());
  });

  root.addEventListener('click', (e) => {
    if (e.target.closest('#sendOrderBtn')) { handleSendOrder(); return; }
    if (e.target.closest('[data-copy-only]')) { handleCopyOnly(); return; }
    if (e.target.closest('[data-order-sent]')) {
      clearCart();
      renderCartClearedState();
      return;
    }
    if (e.target.closest('[data-forget-customer]')) {
      forgetCustomer();
      fillCustomerFields({});
      refreshOrderText();
      if (typeof showToast === 'function') {
        showToast('Đã xoá thông tin', 'Website không giữ lại thông tin của bạn trên máy này nữa.');
      }
    }
  });
}

function initCheckoutPage() {
  const lines = getCartLines();
  if (!lines.length) {
    window.location.href = 'cart.html';
    return;
  }
  renderCheckoutPage(lines, getCartTotal());
}

/* Footer của trang này cũng có các nút mở bảng size / phí ship / đổi trả, nên
   phải khởi động modal thông tin ở đây (trước đây chỉ trang chủ gọi, nên các
   nút ở footer giỏ hàng và thanh toán bấm không ra gì). */
document.addEventListener('DOMContentLoaded', () => {
  initInfoModal();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

productsReady.then(initCheckoutPage);
