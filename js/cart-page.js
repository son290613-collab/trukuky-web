/* ==========================================================================
   TRUKUKY — Cart page rendering
   Mỗi dòng giỏ là một biến thể (mã + size + màu), không phải một mã sản phẩm.
   ========================================================================== */

function cartEmptyHTML() {
  if (!hasOrderableProducts()) {
    return `
    <div class="cart-empty catalog-notice">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A8 8 0 1 1 21 15Z"/></svg>
      <span class="eyebrow">Catalogue tư vấn</span>
      <h3>Trukuky đang xác nhận lại bảng giá</h3>
      <p>Website tạm không nhận đơn online để tránh sai giá. Hãy gửi mã mẫu qua Messenger; shop sẽ xác nhận giá, size và tình trạng hàng trước khi chốt.</p>
      <div class="cart-empty-actions">
        <a href="https://m.me/trukuky" target="_blank" rel="noopener" class="btn btn-primary btn-lg">Nhắn Trukuky tư vấn</a>
        <a href="index.html#products" class="btn btn-outline btn-lg">Xem hàng mới</a>
      </div>
    </div>`;
  }
  return `
  <div class="cart-empty">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
    <h3>Giỏ hàng của bạn đang trống</h3>
    <p>Khám phá bộ sưu tập mới nhất của Trukuky và thêm sản phẩm yêu thích vào giỏ.</p>
    <a href="index.html#products" class="btn btn-primary btn-lg">Khám phá bộ sưu tập</a>
  </div>`;
}

function cartItemHTML(line) {
  const { product, qty, key } = line;
  const variant = variantLabel(line);
  return `
  <div class="cart-item" data-cart-item="${key}">
    <a class="cart-item-media" href="${productUrl(product.id)}"><img src="${assetUrl(product.imgA)}" alt="${product.title}" loading="lazy"></a>
    <div>
      <a class="cart-item-title" href="${productUrl(product.id)}">${product.title}</a>
      ${variant ? `<div class="cart-item-variant">${variant}</div>` : '<div class="cart-item-variant is-missing">Chưa chọn size — Trukuky sẽ gọi xác nhận</div>'}
      <div class="cart-item-price">${formatVND(product.price)}</div>
      <div class="qty-stepper" style="margin-top:8px">
        <button type="button" data-qty-down aria-label="Giảm số lượng">−</button>
        <span>${qty}</span>
        <button type="button" data-qty-up aria-label="Tăng số lượng">+</button>
      </div>
    </div>
    <div class="cart-item-side">
      <span class="cart-item-line-total">${formatVND(product.price * qty)}</span>
      <button type="button" class="cart-remove" data-cart-remove>Xoá</button>
    </div>
  </div>`;
}

function renderCartPage() {
  const root = document.getElementById('cartRoot');
  if (!root) return;
  const lines = getCartLines();

  if (!lines.length) {
    root.innerHTML = cartEmptyHTML();
    return;
  }

  const total = getCartTotal();
  root.innerHTML = `
  <div class="cart-layout">
    <div class="cart-items">${lines.map(cartItemHTML).join('')}</div>
    <aside class="summary-card">
      <h3>Tóm tắt đơn hàng</h3>
      <div class="summary-row"><span>Tạm tính</span><span>${formatVND(total)}</span></div>
      <div class="summary-row"><span>Phí vận chuyển</span><span>Tính khi xác nhận đơn</span></div>
      <div class="summary-row total"><span>Tổng cộng</span><span class="amount">${formatVND(total)}</span></div>
      <a href="checkout.html" class="btn btn-primary btn-lg btn-block">Tiến hành thanh toán</a>
      <a href="index.html#products" class="btn btn-outline btn-block">Tiếp tục mua sắm</a>
    </aside>
  </div>`;

  root.addEventListener('click', (e) => {
    const item = e.target.closest('[data-cart-item]');
    if (!item) return;
    const key = item.dataset.cartItem;
    const line = getCartLines().find((l) => l.key === key);
    if (e.target.closest('[data-qty-up]')) {
      setQty(key, (line ? line.qty : 0) + 1);
      renderCartPage();
    } else if (e.target.closest('[data-qty-down]')) {
      setQty(key, (line ? line.qty : 1) - 1);
      renderCartPage();
    } else if (e.target.closest('[data-cart-remove]')) {
      removeFromCart(key);
      renderCartPage();
    }
  }, { once: true });
}

/* Footer của trang này cũng có các nút mở bảng size / phí ship / đổi trả, nên
   phải khởi động modal thông tin ở đây (trước đây chỉ trang chủ gọi, nên các
   nút ở footer giỏ hàng và thanh toán bấm không ra gì). */
document.addEventListener('DOMContentLoaded', () => {
  initInfoModal();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

productsReady.then(renderCartPage);
