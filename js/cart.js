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

/* Safari chế độ riêng tư (và iframe bị chặn storage) cho đọc localStorage
   nhưng ném lỗi ở setItem. Khi điều đó xảy ra, bản giỏ trong bộ nhớ MỚI là
   bản đúng — trước đây getCart() vẫn ưu tiên đọc localStorage nên giá trị cũ
   còn sót lại ở đó ghi đè thao tác vừa rồi: khách bấm "+", toast báo đã thêm,
   mà giỏ lặng lẽ quay về như cũ. */
let MEMORY_CART = null;
let storageWritable = true;

function getCart() {
  if (!storageWritable) return MEMORY_CART || {};
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY));
    if (raw && typeof raw === 'object') return raw;
  } catch {
    /* Đọc hỏng (JSON lỗi, storage bị chặn) thì rơi về bộ nhớ phiên. */
  }
  return MEMORY_CART || {};
}

function saveCart(cart) {
  /* Giữ bản mới nhất trong bộ nhớ TRƯỚC, rồi mới thử ghi xuống đĩa: ghi hỏng
     thì giỏ vẫn đúng suốt phiên, chỉ là không nhớ được sau khi tải lại trang. */
  MEMORY_CART = cart;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    storageWritable = false;
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

/* ---------- Soạn đơn để gửi qua Messenger ----------
   Website là trang tĩnh, không có máy chủ nhận đơn. "Gửi đơn" ở đây nghĩa là
   soạn sẵn một đoạn văn bản để CHÍNH KHÁCH dán vào Messenger. Đoạn này viết
   cho người đọc trên điện thoại: chủ shop đọc một lần là đủ mã, size, số
   lượng — thay vì hỏi đi hỏi lại 6–10 tin nhắn mới chốt được đơn. */

/* isEstimatedPrice() nằm ở data.js. Bọc thêm một lớp ở đây để trang giỏ không
   vỡ nếu trình duyệt của khách còn giữ bản data.js cũ trong cache; quy tắc vẫn
   chỉ có một: priceFrom === true nghĩa là giá sàn ("từ ..."), không phải giá chốt. */
function lineHasEstimatedPrice(line) {
  const p = line && line.product;
  if (!p) return false;
  if (typeof isEstimatedPrice === 'function') return !!isEstimatedPrice(p);
  return p.priceFrom === true;
}

/* Mã sản phẩm đi kèm MỌI dòng: shop đối chiếu đơn theo mã, không theo tên. */
function orderLineText(line, index) {
  const p = line.product;
  const money = `${lineHasEstimatedPrice(line) ? 'từ ' : ''}${formatVND(p.price)}`;
  const details = [line.size ? `Size: ${line.size}` : 'Size: chưa chọn (nhờ shop tư vấn)'];
  if (line.color) details.push(`Màu: ${line.color}`);
  details.push(`SL: ${line.qty}`);
  details.push(line.qty > 1 ? `${money} × ${line.qty} = ${formatVND(p.price * line.qty)}` : money);
  return `${index + 1}. [${p.id}] ${p.title}\n   ${details.join(' · ')}`;
}

function orderText(lines, customer) {
  const items = Array.isArray(lines) ? lines : getCartLines();
  if (!items.length) return 'ĐƠN ĐẶT TỪ WEBSITE TRUKUKY\n\n(Giỏ hàng đang trống)';

  const c = customer || {};
  const total = items.reduce((sum, l) => sum + l.product.price * l.qty, 0);
  const parts = ['ĐƠN ĐẶT TỪ WEBSITE TRUKUKY', ''];

  parts.push(items.map(orderLineText).join('\n'));
  parts.push('');

  /* Có một dòng giá sàn thôi thì con số cộng lại cũng không phải giá chốt —
     nói thẳng ra để không ai hiểu nhầm đây là số tiền phải trả. */
  parts.push(items.some(lineHasEstimatedPrice)
    ? `Tạm tính (giá theo size, shop báo lại): ${formatVND(total)}`
    : `Tạm tính: ${formatVND(total)}`);
  parts.push('(Giá tạm tính theo web — nhờ shop xác nhận giá cuối và tình trạng hàng)');

  /* Ô nào khách để trống thì bỏ hẳn dòng đó — một dòng "SĐT:" rỗng chỉ làm
     chủ shop tưởng khách quên điền rồi lại phải nhắn hỏi thêm một lượt. */
  const fields = [
    ['Người nhận', c.name],
    ['SĐT', c.phone],
    ['Địa chỉ', c.address],
    ['Ghi chú', c.note],
  ].filter(([, value]) => String(value == null ? '' : value).trim())
    .map(([label, value]) => `${label}: ${String(value).trim()}`);

  if (fields.length) {
    parts.push('');
    parts.push(fields.join('\n'));
  }
  return parts.join('\n');
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
