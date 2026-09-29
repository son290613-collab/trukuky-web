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
        <a href="${STORE_MESSENGER}" target="_blank" rel="noopener" class="btn btn-primary btn-lg">Nhắn Trukuky tư vấn</a>
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
  /* Mẫu tính giá theo size: con số trên web là giá SÀN, nên mọi chỗ hiện giá
     của dòng đó đều phải mang chữ "từ" — kể cả thành tiền. */
  const from = lineHasEstimatedPrice(line) ? '<small>từ</small> ' : '';
  return `
  <div class="cart-item" data-cart-item="${key}">
    <a class="cart-item-media" href="${productUrl(product.id)}"><img src="${assetUrl(product.imgA)}" alt="${product.title}" loading="lazy"></a>
    <div>
      <a class="cart-item-title" href="${productUrl(product.id)}">${product.title}</a>
      <div class="cart-item-code">Mã ${product.id}</div>
      ${variant ? `<div class="cart-item-variant">${variant}</div>` : '<div class="cart-item-variant is-missing">Chưa chọn size — nhắn shop để được tư vấn</div>'}
      <div class="cart-item-price">${from}${formatVND(product.price)}</div>
      <div class="qty-stepper" style="margin-top:8px">
        <button type="button" data-qty-down aria-label="Giảm số lượng">−</button>
        <span>${qty}</span>
        <button type="button" data-qty-up aria-label="Tăng số lượng">+</button>
      </div>
    </div>
    <div class="cart-item-side">
      <span class="cart-item-line-total">${from}${formatVND(product.price * qty)}</span>
      <button type="button" class="cart-remove" data-cart-remove>Xoá</button>
    </div>
  </div>`;
}

function cartSummaryHTML(lines, total) {
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const estimated = lines.some(lineHasEstimatedPrice);
  return `
  <aside class="summary-card">
    <h3>Tóm tắt đơn hàng</h3>
    <div class="summary-row"><span>Số món</span><span>${count}</span></div>
    <div class="summary-row"><span>Phí vận chuyển</span><span>Shop báo khi xác nhận</span></div>
    <div class="summary-row total"><span>Tạm tính</span><span class="amount">${estimated ? '<small>từ</small> ' : ''}${formatVND(total)}</span></div>
    <p class="summary-caveat">${estimated
      ? 'Trong giỏ có mẫu tính giá theo size nên đây mới là giá sàn. Shop sẽ báo lại giá cuối và tình trạng hàng khi bạn nhắn.'
      : 'Giá tạm tính theo web. Shop xác nhận lại giá cuối, size còn hàng và phí giao trước khi gửi hàng.'}</p>
    <a href="checkout.html" class="btn btn-primary btn-lg btn-block">Gửi đơn cho shop</a>
    <a href="index.html#products" class="btn btn-outline btn-block">Tiếp tục mua sắm</a>
  </aside>`;
}

/* Listener gắn MỘT lần cho #cartRoot, không gắn lại sau mỗi lần vẽ.
   Bản cũ gắn listener bên trong renderCartPage() kèm { once: true }: cú bấm
   đầu tiên vào bất cứ đâu trong giỏ đã gỡ luôn listener, nên các nút +/− và
   Xoá chết cho tới khi tải lại trang. Nhưng chỉ bỏ { once: true } thôi thì
   hỏng theo kiểu khác — mỗi lần render lại chồng thêm một listener, bấm "+"
   một cái số lượng nhảy 2, 3 đơn vị. Vì vậy: render chỉ vẽ, sự kiện ở đây. */
function bindCartRootEvents(root) {
  if (root.dataset.eventsBound) return;
  root.dataset.eventsBound = '1';
  root.addEventListener('click', (e) => {
    const item = e.target.closest('[data-cart-item]');
    if (!item) return;
    const key = item.dataset.cartItem;
    /* Đọc lại giỏ ngay lúc bấm: DOM có thể đã được vẽ lại nhiều lần kể từ khi
       listener này được gắn, nên không giữ tham chiếu tới dòng giỏ cũ. */
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
  });
}

function renderCartPage() {
  const root = document.getElementById('cartRoot');
  if (!root) return;
  const lines = getCartLines();

  if (!lines.length) {
    root.innerHTML = cartEmptyHTML();
    return;
  }

  root.innerHTML = `
  <div class="cart-layout">
    <div class="cart-items">${lines.map(cartItemHTML).join('')}</div>
    ${cartSummaryHTML(lines, getCartTotal())}
  </div>`;

  bindCartRootEvents(root);
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
