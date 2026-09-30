/* ==========================================================================
   TRUKUKY — Checkout page: form, payment method, order submission
   ========================================================================== */

function checkoutSummaryHTML(lines, total) {
  return `
  <aside class="summary-card">
    <h3>Đơn hàng của bạn</h3>
    ${lines.map((l) => {
      const v = variantLabel(l);
      return `<div class="summary-row"><span>${l.product.title}${v ? ` <i>(${v})</i>` : ''} × ${l.qty}</span><span>${formatVND(l.product.price * l.qty)}</span></div>`;
    }).join('')}
    <div class="summary-row"><span>Phí vận chuyển</span><span>Tính khi xác nhận đơn</span></div>
    <div class="summary-row total"><span>Tổng cộng</span><span class="amount">${formatVND(total)}</span></div>
  </aside>`;
}

function payOptionHTML(vietqrEnabled) {
  return `
  <div class="pay-options">
    <label class="pay-option is-selected">
      <input type="radio" name="paymentMethod" value="cod" checked>
      <div>
        <div class="pay-option-title">Thanh toán khi nhận hàng (COD)</div>
        <div class="pay-option-desc">Kiểm tra hàng và thanh toán trực tiếp cho shipper.</div>
      </div>
    </label>
    <label class="pay-option" style="${vietqrEnabled ? '' : 'opacity:0.5;pointer-events:none'}">
      <input type="radio" name="paymentMethod" value="qr" ${vietqrEnabled ? '' : 'disabled'}>
      <div>
        <div class="pay-option-title">Chuyển khoản QR (VietQR)</div>
        <div class="pay-option-desc">${vietqrEnabled ? 'Quét mã QR để chuyển khoản đúng số tiền, tự động điền nội dung.' : 'Tạm thời chưa khả dụng — vui lòng chọn COD.'}</div>
      </div>
    </label>
  </div>`;
}

function renderCheckoutForm(lines, total, vietqrEnabled) {
  const root = document.getElementById('checkoutRoot');
  root.innerHTML = `
  <div class="checkout-layout">
    <form id="checkoutForm" novalidate>
      <div class="form-error-banner" id="formErrorBanner"></div>

      <div class="field">
        <label for="fName">Họ và tên <span class="req">*</span></label>
        <input id="fName" name="name" type="text" autocomplete="name" required>
        <span class="field-error" data-error-for="name"></span>
      </div>
      <div class="field">
        <label for="fPhone">Số điện thoại <span class="req">*</span></label>
        <input id="fPhone" name="phone" type="tel" autocomplete="tel" required>
        <span class="field-error" data-error-for="phone"></span>
      </div>
      <div class="field">
        <label for="fAddress">Địa chỉ giao hàng <span class="req">*</span></label>
        <input id="fAddress" name="address" type="text" autocomplete="street-address" required>
        <span class="field-error" data-error-for="address"></span>
      </div>
      <div class="field">
        <label for="fNote">Ghi chú (tuỳ chọn)</label>
        <textarea id="fNote" name="note" placeholder="Thời gian giao hàng mong muốn, hướng dẫn tìm địa chỉ..."></textarea>
      </div>

      <!-- Bẫy bot. Người thật không thấy ô này, trình đọc màn hình bỏ qua, phím
           Tab không dừng lại. Bot điền tự động thì máy chủ loại đơn. -->
      <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">
        <label for="fCompany">Công ty</label>
        <input id="fCompany" name="company" type="text" tabindex="-1" autocomplete="off">
      </div>

      <h3 style="margin-bottom:var(--space-3)">Phương thức thanh toán</h3>
      ${payOptionHTML(vietqrEnabled)}

      <button type="submit" class="btn btn-primary btn-lg btn-block" id="submitOrderBtn">Đặt hàng — ${formatVND(total)}</button>
    </form>
    ${checkoutSummaryHTML(lines, total)}
  </div>`;

  const form = document.getElementById('checkoutForm');
  bindPayOptionClicks();
  form.addEventListener('submit', handleCheckoutSubmit);
}

function setFieldError(name, message) {
  const field = document.querySelector(`[name="${name}"]`).closest('.field');
  const errorEl = document.querySelector(`[data-error-for="${name}"]`);
  field.classList.toggle('has-error', !!message);
  if (errorEl) errorEl.textContent = message || '';
}

function validateCheckoutForm(data) {
  let ok = true;
  ['name', 'phone', 'address'].forEach((f) => setFieldError(f, ''));

  if (!data.name.trim()) { setFieldError('name', 'Vui lòng nhập họ tên.'); ok = false; }
  if (!/^[0-9+\s]{8,15}$/.test(data.phone.trim())) { setFieldError('phone', 'Số điện thoại không hợp lệ.'); ok = false; }
  if (!data.address.trim()) { setFieldError('address', 'Vui lòng nhập địa chỉ giao hàng.'); ok = false; }

  return ok;
}

/* Mã đơn sinh ngay tại máy khách: TK + ngày + 4 ký tự ngẫu nhiên. Khách đọc
   được mã này cho shop qua điện thoại kể cả khi đường truyền hỏng giữa chừng. */
function makeOrderId() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TK${ymd}-${rnd}`;
}

/* Bản tóm tắt đơn ở dạng chữ, để khách copy gửi shop khi đường gửi đơn hỏng. */
function orderSummaryText(order) {
  const lines = order.items.map((i) => {
    const v = [i.size, i.color].filter(Boolean).join(' / ');
    return `• ${i.id}${v ? ` (${v})` : ''} × ${i.qty}`;
  }).join('\n');
  return `Đơn ${order.id}\n${lines}\nTổng: ${formatVND(order.total)}\n`
    + `${order.customer.name} — ${order.customer.phone}\n${order.customer.address}`
    + `${order.customer.note ? `\nGhi chú: ${order.customer.note}` : ''}`;
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const banner = document.getElementById('formErrorBanner');
  banner.classList.remove('is-visible');

  const data = {
    name: form.name.value,
    phone: form.phone.value,
    address: form.address.value,
    note: form.note.value,
  };
  if (!validateCheckoutForm(data)) {
    document.querySelector('.field.has-error input, .field.has-error textarea')?.focus();
    return;
  }

  const order = {
    id: makeOrderId(),
    customer: data,
    items: getCartLines().map((l) => ({ id: l.product.id, qty: l.qty, size: l.size, color: l.color })),
    total: getCartTotal(),
    paymentMethod: form.querySelector('input[name="paymentMethod"]:checked').value,
    company: form.company.value,
  };

  const submitBtn = document.getElementById('submitOrderBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang gửi đơn…';

  const endpoint = (SITE_CONFIG.orderEndpoint || '').trim();

  /* Chưa cấu hình nơi nhận đơn thì KHÔNG được báo "đặt hàng thành công".
     Một trang xác nhận màu xanh trong khi shop không hề nhận được gì là cách
     nhanh nhất để mất một khách vĩnh viễn — thà nói thẳng là đơn chưa tới. */
  if (!endpoint) {
    clearCart();
    renderCheckoutConfirmation(order, 'not-sent');
    return;
  }

  try {
    /* Apps Script không trả CORS header cho preflight, nên gửi dạng text/plain
       (đây là "simple request", trình duyệt không preflight). Máy chủ vẫn đọc
       ra đúng JSON ở e.postData.contents. */
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    clearCart();
    renderCheckoutConfirmation(order, 'sent');
  } catch (err) {
    /* Gửi hỏng: giữ nguyên giỏ để khách thử lại, và đưa mã đơn + bản tóm tắt
       để khách gọi chốt bằng điện thoại nếu không muốn thử lại. */
    console.error('Không gửi được đơn', err);
    renderCheckoutConfirmation(order, 'failed');
  }
}

function renderCheckoutConfirmation(order, status) {
  const root = document.getElementById('checkoutRoot');
  const tel = SITE_CONFIG.phoneTel || '';
  const phone = SITE_CONFIG.phone || '';
  const callBtn = tel
    ? `<a href="tel:${tel}" class="btn btn-primary btn-lg">Gọi Trukuky ${phone}</a>`
    : '';

  const sent = status === 'sent';
  const head = sent
    ? `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
       <h2>Đã nhận đơn của bạn</h2>`
    : `<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-sale)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
       <h2>Đơn chưa gửi được tới shop</h2>`;

  const body = sent
    ? `<p>Trukuky sẽ gọi vào số <b>${escAttr(order.customer.phone)}</b> để xác nhận size còn hàng, phí giao và tổng tiền trước khi gửi. Bạn thanh toán khi nhận hàng.</p>`
    : `<p class="checkout-warn">Đơn của bạn <b>chưa tới shop</b>. Vui lòng gọi cho Trukuky và đọc mã đơn dưới đây — shop sẽ ghi đơn giúp bạn ngay.</p>
       <div class="order-copy"><pre>${escAttr(orderSummaryText(order))}</pre>
       <button type="button" class="btn btn-outline btn-sm" id="copyOrderBtn">Sao chép nội dung đơn</button></div>`;

  root.innerHTML = `
  <div class="checkout-confirm${sent ? '' : ' is-failed'}">
    ${head}
    <span class="order-code">${order.id}</span>
    <p>Tổng tiền hàng: <b>${formatVND(order.total)}</b> <i>(chưa gồm phí giao)</i></p>
    ${body}
    <div class="confirm-actions">
      ${callBtn}
      <a href="index.html" class="btn btn-outline">Về trang chủ</a>
    </div>
  </div>`;

  document.getElementById('copyOrderBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(orderSummaryText(order))
      .then(() => showToast('Đã sao chép đơn hàng', 'Gửi cho Trukuky để shop ghi đơn giúp bạn.'))
      .catch(() => {});
  });
}

function bindPayOptionClicks() {
  document.querySelectorAll('.pay-option').forEach((label) => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.pay-option').forEach((l) => l.classList.remove('is-selected'));
      if (!label.querySelector('input').disabled) label.classList.add('is-selected');
    });
  });
}

let SITE_CONFIG = {};

const siteConfigReady = fetch(assetUrl('data/site-config.json'))
  .then((r) => r.json())
  .then((cfg) => { SITE_CONFIG = cfg || {}; })
  .catch(() => { SITE_CONFIG = {}; });

function initCheckoutPage() {
  const lines = getCartLines();
  if (!lines.length) {
    window.location.href = 'cart.html';
    return;
  }
  renderCheckoutForm(lines, getCartTotal(), !!SITE_CONFIG.vietqrEnabled);
}

/* Footer của trang này cũng có các nút mở bảng size / phí ship / đổi trả, nên
   phải khởi động modal thông tin ở đây (trước đây chỉ trang chủ gọi, nên các
   nút ở footer giỏ hàng và thanh toán bấm không ra gì). */
document.addEventListener('DOMContentLoaded', () => {
  initInfoModal();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* Cần CẢ hai: danh mục (để dựng lại giỏ) và cấu hình (để biết gửi đơn đi
   đâu). Chạy sớm một trong hai sẽ dựng form với nơi nhận đơn rỗng. */
Promise.all([productsReady, siteConfigReady]).then(initCheckoutPage);
