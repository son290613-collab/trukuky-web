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

  const paymentMethod = form.querySelector('input[name="paymentMethod"]:checked').value;
  const items = getCartLines().map((l) => ({ id: l.product.id, qty: l.qty, size: l.size, color: l.color }));

  const submitBtn = document.getElementById('submitOrderBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang xử lý...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: data, items, paymentMethod, company: form.company.value }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Có lỗi xảy ra, vui lòng thử lại.');

    clearCart();
    renderCheckoutConfirmation(result);
  } catch (err) {
    banner.textContent = err.message;
    banner.classList.add('is-visible');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Đặt hàng';
  }
}

function renderCheckoutConfirmation(order) {
  const root = document.getElementById('checkoutRoot');
  const qrBlock = order.paymentMethod === 'qr' && order.vietqrImage ? `
    <div class="qr-box">
      <img src="${order.vietqrImage}" alt="Mã QR chuyển khoản đơn hàng ${order.id}">
    </div>
    <p>Quét mã để chuyển khoản đúng số tiền — nội dung chuyển khoản đã tự động điền mã đơn hàng.</p>
  ` : `<p>Trukuky sẽ liên hệ xác nhận đơn và giao hàng — thanh toán khi nhận hàng (COD).</p>`;

  root.innerHTML = `
  <div class="checkout-confirm">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
    <h2>Đặt hàng thành công!</h2>
    <span class="order-code">${order.id}</span>
    <p>Tổng thanh toán: <b>${formatVND(order.total)}</b></p>
    ${qrBlock}
    <a href="index.html" class="btn btn-outline">Về trang chủ</a>
  </div>`;
}

function bindPayOptionClicks() {
  document.querySelectorAll('.pay-option').forEach((label) => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.pay-option').forEach((l) => l.classList.remove('is-selected'));
      if (!label.querySelector('input').disabled) label.classList.add('is-selected');
    });
  });
}

function initCheckoutPage() {
  const lines = getCartLines();
  if (!lines.length) {
    window.location.href = 'cart.html';
    return;
  }
  const total = getCartTotal();

  // Render immediately with COD only — don't make the whole form wait on a
  // network round-trip for a payment option most orders won't even need.
  // Upgrade in place to VietQR if/when the config confirms it's enabled.
  renderCheckoutForm(lines, total, false);

  fetch('/api/config')
    .then((r) => r.json())
    .then((cfg) => {
      if (!cfg.vietqrEnabled) return;
      const payOptions = document.querySelector('.pay-options');
      if (!payOptions) return;
      payOptions.outerHTML = payOptionHTML(true);
      bindPayOptionClicks();
    })
    .catch(() => {});
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
