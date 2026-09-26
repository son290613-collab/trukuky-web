/* ==========================================================================
   TRUKUKY — Cart (localStorage-backed, shared across pages)
   Khoá giỏ theo biến thể: "G1|110cm|Hồng" — cùng một mẫu ở hai size là hai
   dòng khác nhau trong giỏ, đúng như khi shop soạn đơn.
   ========================================================================== */

const CART_KEY = 'trukuky_cart_v1';

function variantKey(id, variant) {
  const v = variant || {};
  return [id, v.size || '', v.color || ''].join('|');
}

/* Giỏ cũ (trước khi có biến thể) lưu key trần "G1" — split vẫn ra đúng id
   với size/màu rỗng, nên giỏ của khách cũ không bị mất. */
function parseVariantKey(key) {
  const [id, size = '', color = ''] = String(key).split('|');
  return { id, size, color };
}

function variantLabel(line) {
  return [line.size, line.color].filter(Boolean).join(' · ');
}

let MEMORY_CART = null;

function getCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    if (raw && typeof raw === 'object') return raw;
    return MEMORY_CART || {};
  } catch {
    return MEMORY_CART || {};
  }
}

function saveCart(cart) {
  /* Safari chế độ riêng tư (và iframe bị chặn storage) ném lỗi ở setItem —
     giỏ vẫn hiển thị đúng trong phiên, chỉ là không nhớ được sau khi tải lại. */
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    MEMORY_CART = cart;
  }
  updateCartBadge();
}

function addToCart(id, variant, qty = 1) {
  const product = PRODUCTS_BY_ID[id];
  if (!isOrderableProduct(product)) {
    if (typeof showToast === 'function') {
      showToast('Mẫu này đang chờ xác nhận', 'Nhắn Trukuky để kiểm tra giá, size và tình trạng hàng.');
    }
    return false;
  }
  const cart = getCart();
  const key = variantKey(id, variant);
  cart[key] = Math.min(99, (cart[key] || 0) + qty);
  saveCart(cart);
  return true;
}

function setQty(key, qty) {
  const cart = getCart();
  if (qty <= 0) delete cart[key];
  else cart[key] = Math.min(99, qty);
  saveCart(cart);
}

function removeFromCart(key) {
  setQty(key, 0);
}

function clearCart() {
  saveCart({});
}

function getCartCount() {
  return getCartLines().reduce((sum, line) => sum + line.qty, 0);
}

function getCartLines() {
  return Object.entries(getCart())
    .map(([key, qty]) => {
      const { id, size, color } = parseVariantKey(key);
      return { key, product: PRODUCTS_BY_ID[id], qty, size, color };
    })
    .filter((line) => isOrderableProduct(line.product));
}

function getCartTotal() {
  return getCartLines().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function updateCartBadge() {
  const n = getCartCount();
  document.querySelectorAll('[data-cart-badge]').forEach((el) => {
    el.textContent = n;
    el.classList.toggle('is-visible', n > 0);
  });
}

function syncCommerceVisibility() {
  const enabled = hasOrderableProducts();
  document.querySelectorAll('[data-commerce-only]').forEach((el) => {
    el.hidden = !enabled;
  });
  document.documentElement.classList.toggle('is-catalog-mode', !enabled);
}

/* Nút "Thêm vào giỏ" ở thẻ sản phẩm không mang sẵn size/màu: nếu mẫu đó có
   nhiều lựa chọn thì mở khung chọn (openVariantPicker) thay vì lặng lẽ thêm
   một dòng thiếu size — size là lý do đổi trả số một của quần áo trẻ em. */
function initCart() {
  updateCartBadge();
  if (typeof productsReady !== 'undefined') productsReady.then(syncCommerceVisibility);
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.dataset.addToCart;
    if (!id) return;
    const product = PRODUCTS_BY_ID[id];
    const variant = { size: btn.dataset.size || '', color: btn.dataset.color || '' };

    if (product && !variant.size && !variant.color && needsVariantChoice(product)) {
      if (typeof window.openVariantPicker === 'function') {
        window.openVariantPicker(product);
      } else {
        window.location.href = productUrl(id);
      }
      return;
    }

    const filled = product && !variant.size && !variant.color ? defaultVariant(product) : variant;
    const added = addToCart(id, filled, 1);
    if (added && typeof showToast === 'function') {
      const label = variantLabel(filled);
      showToast('Đã thêm vào giỏ hàng', product ? `${product.title}${label ? ` — ${label}` : ''}` : '');
    }
  });
}
