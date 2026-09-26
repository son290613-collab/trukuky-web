/* ==========================================================================
   TRUKUKY — Trang chi tiết sản phẩm (p/<id>.html)
   Nội dung chính đã được render sẵn lúc build; file này chỉ lo phần tương
   tác: đổi ảnh, chọn size/màu, chặn thêm vào giỏ khi chưa chọn, gợi ý thêm.
   ========================================================================== */

const pdRoot = document.getElementById('pdVariants');
const PRODUCT_ID = pdRoot ? pdRoot.dataset.product : '';

let pdVariant = { size: '', color: '' };

function pdProduct() {
  return PRODUCTS_BY_ID[PRODUCT_ID];
}

function syncAddButton() {
  const btn = document.getElementById('pdAddBtn');
  const consult = document.getElementById('pdConsultBtn');
  const hint = document.getElementById('variantHint');
  const p = pdProduct();
  if (!p || (!btn && !consult)) return;
  if (btn) {
    btn.dataset.size = pdVariant.size;
    btn.dataset.color = pdVariant.color;
  }
  if (consult) {
    consult.dataset.size = pdVariant.size;
    consult.dataset.color = pdVariant.color;
  }
  const needSize = (p.sizes || []).length > 0 && !pdVariant.size;
  const needColor = (p.colors || []).length > 0 && !pdVariant.color;
  if (btn) btn.disabled = needSize || needColor;
  if (hint) {
    hint.textContent = btn
      ? missingVariantHint(needSize, needColor)
      : 'Chọn size và màu dự kiến; Trukuky sẽ xác nhận lại khi tư vấn.';
  }
}

function initVariants() {
  if (!pdRoot) return;
  const p = pdProduct();
  if (p) pdVariant = defaultVariant(p);

  /* Mẫu chỉ có một lựa chọn đã được đánh dấu sẵn trong HTML tĩnh. */
  pdRoot.addEventListener('click', (e) => {
    const sizeBtn = e.target.closest('[data-variant-size]');
    const colorBtn = e.target.closest('[data-variant-color]');
    if (sizeBtn) {
      pdVariant.size = sizeBtn.dataset.variantSize;
      pdRoot.querySelectorAll('[data-variant-size]').forEach((b) => b.classList.toggle('is-active', b === sizeBtn));
    }
    if (colorBtn) {
      pdVariant.color = colorBtn.dataset.variantColor;
      pdRoot.querySelectorAll('[data-variant-color]').forEach((b) => b.classList.toggle('is-active', b === colorBtn));
    }
    if (sizeBtn || colorBtn) syncAddButton();
  });

  syncAddButton();
}

/* Khung ảnh lớn đổi tỉ lệ theo đúng ảnh đang xem, nên không góc chụp nào bị
   cắt cạnh khi khách bấm sang ảnh khác. */
function initGallery() {
  const main = document.getElementById('pdMainImg');
  const frame = main ? main.closest('.pd-main') : null;
  document.querySelectorAll('.pd-thumb').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      if (!main) return;
      main.src = thumb.dataset.src;
      if (frame && thumb.dataset.ratio) frame.style.setProperty('--ratio', thumb.dataset.ratio);
      document.querySelectorAll('.pd-thumb').forEach((t) => t.classList.toggle('is-active', t === thumb));
    });
  });
}

/* Gợi ý cùng danh mục — 5 mẫu, bỏ chính nó ra. */
function renderRelated() {
  const grid = document.getElementById('relatedGrid');
  const p = pdProduct();
  if (!grid || !p) return;
  const key = (p.sections || []).find((s) => s !== 'new') || 'new';
  const related = PRODUCTS.filter((x) => x.id !== p.id && matchesFilter(x, key)).slice(0, 5);
  const fill = related.length >= 5 ? related : [...related, ...PRODUCTS.filter((x) => x.id !== p.id && !related.includes(x))].slice(0, 5);
  grid.innerHTML = fill.map(productCardHTML).join('');
}

/* Trang chi tiết không có lightbox — bấm "+" ở thẻ gợi ý thì sang trang đó. */
window.openVariantPicker = function openVariantPicker(product) {
  window.location.href = productUrl(product.id);
};

document.addEventListener('DOMContentLoaded', () => {
  initInfoModal();
  initConsultLinks();
  initGallery();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

productsReady.then(() => {
  initCart();
  initVariants();
  renderRelated();
});
