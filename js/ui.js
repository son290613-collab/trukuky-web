/* ==========================================================================
   TRUKUKY — UI dùng chung cho mọi trang
   Toast, reveal, count-up, bảng size & các modal thông tin, thẻ sản phẩm.
   ========================================================================== */

const STORE_FB = 'https://www.facebook.com/trukuky';

const ZOOM_HINT_SVG =
  '<span class="arrival-zoom-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/>' +
  '<path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></span>';

function escAttr(s) {
  return String(s == null ? '' : s).replace(/"/g, '&quot;');
}

/* Bỏ dấu để "dam tulle" cũng tìm ra "Đầm Tulle". */
function normalizeText(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}


/* ---------- Scroll reveal ---------- */
/* ---------- Toast ---------- */
function showToast(title, desc) {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<b>${escAttr(title)}</b><span>${escAttr(desc)}</span>`;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3800);
}


/* ---------- Chọn biến thể ---------- */
function missingVariantHint(needSize, needColor) {
  if (needSize && needColor) return 'Vui lòng chọn size và màu trước khi thêm vào giỏ.';
  if (needSize) return 'Vui lòng chọn size trước khi thêm vào giỏ.';
  if (needColor) return 'Vui lòng chọn màu trước khi thêm vào giỏ.';
  return '';
}

/* ---------- Thẻ khung ảnh ----------
   Một tấm ảnh = một thẻ, hiển thị NGUYÊN KHUNG theo đúng tỉ lệ gốc
   (--ratio), không aspect-ratio cố định, không object-fit: cover, không cắt.
   Khung chứa nhiều món thì mỗi món là một chấm hotspot đặt đúng chỗ của nó,
   và danh sách món nằm ngay dưới ảnh. */
const ADD_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

const ARROW_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const CHAT_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A8 8 0 1 1 21 15Z"/></svg>';

/* Nút tắt trên thẻ hàng. Trước đây nút này mở Messenger — khách phải rời
   website, tự gõ lại mã mẫu và chờ shop rảnh tay mới trả lời, nên phần lớn
   rơi rụng ngay tại đó. Giờ nút đưa thẳng vào giỏ (hoặc mở khung chọn size
   nếu mẫu có nhiều size), đúng như mọi trang bán hàng khách đã quen dùng.
   Mẫu chưa có giá thật không có nút này — nó chỉ dẫn sang trang chi tiết. */
function compactProductAction(p, className) {
  if (isOrderableProduct(p)) {
    return `<button type="button" class="${className}" data-add-to-cart="${p.id}" aria-label="${needsVariantChoice(p) ? 'Chọn size cho' : 'Thêm vào giỏ'} ${escAttr(p.title)}">${ADD_ICON_SVG}</button>`;
  }
  return `<a class="${className} is-view" href="${productUrl(p.id)}" aria-label="Xem chi tiết ${escAttr(p.title)}">${ARROW_ICON_SVG}</a>`;
}

function hotspotHTML(p, i) {
  return `
      <button type="button" class="hotspot" data-hotspot="${p.id}" data-index="${i + 1}"
              style="left:${p.hotspot.x}%; top:${p.hotspot.y}%"
              aria-label="${escAttr(p.title)} — xem chi tiết">
        <span class="hotspot-dot">${i + 1}</span>
        <span class="hotspot-label">${escAttr(p.title)}</span>
      </button>`;
}

function frameCardHTML(frame) {
  const lead = frame.lead;
  const spots = frameHotspots(frame);
  const isGroup = frame.items.length > 1;
  const badge = !isGroup && lead.badge ? `<span class="product-card-badge">${lead.badge}</span>` : '';
  const groupBadge = isGroup ? `<span class="product-card-badge product-card-badge--group">${frame.items.length} món trong khung</span>` : '';

  /* Khung một món: bấm vào ảnh mở xem nhanh của chính món đó.
     Khung nhiều món: bấm vào ảnh mở xem nhanh cả khung, chọn món bằng chấm. */
  const mediaData = isGroup
    ? `data-frame="${escAttr(frame.src)}"`
    : `data-lightbox data-id="${lead.id}" data-img-a="${assetUrl(lead.imgA)}" data-title="${escAttr(lead.title)}" data-desc="${escAttr(lead.desc || '')}"`;

  const single = `
    <a class="product-card-title" href="${productUrl(lead.id)}">${lead.title}</a>
    <span class="product-card-price">${priceHTML(lead)}</span>
    ${(lead.shots || []).length > 1 ? `<span class="product-card-shots">${lead.shots.length} góc chụp</span>` : ''}`;

  const group = `
    <ul class="frame-items">
      ${spots.map((p, i) => `
      <li>
        <span class="frame-item-index">${i + 1}</span>
        <a href="${productUrl(p.id)}">${p.title}</a>
        <span class="frame-item-price">${priceHTML(p)}</span>
        ${compactProductAction(p, 'frame-item-add')}
      </li>`).join('')}
    </ul>`;

  return `
  <article class="frame-card${isGroup ? ' is-group' : ''}" style="--ratio:${frame.ratio.toFixed(4)}">
    <div class="frame-media" ${mediaData}>
      ${pictureHTML(frame.src, isGroup ? `Khung ảnh bày ${frame.items.length} món Trukuky` : lead.title)}
      ${badge}${groupBadge}
      ${isGroup ? spots.map(hotspotHTML).join('') : ZOOM_HINT_SVG}
      ${isGroup ? '' : compactProductAction(lead, 'quick-add')}
    </div>
    <div class="frame-body">${isGroup ? group : single}</div>
  </article>`;
}

/* Lưới gợi ý ở trang chi tiết vẫn dùng thẻ đơn giản một món. */
function productCardHTML(p) {
  return frameCardHTML({ src: p.imgA, ratio: photoRatio(p.imgA), items: [p], lead: p });
}

/* ---------- Bảng size & thông tin mua hàng ---------- */
function sizeTableHTML(guide) {
  return `
  <h4>${guide.title}</h4>
  <div class="table-wrap">
    <table class="size-table">
      <thead><tr>${guide.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${guide.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <p class="modal-note">${guide.note}</p>`;
}

const INFO_CONTENT = {
  size: {
    title: 'Tư vấn size Trukuky',
    body: () => `
      <p><b>Bảng quy đổi chiều cao, cân nặng và số đo chính thức đang chờ Trukuky xác nhận.</b> Website không dùng một bảng size chung để chốt size thay cho shop.</p>
      <ol class="steps">
        <li>Gửi mã mẫu bạn đang xem.</li>
        <li>Cho shop biết chiều cao, cân nặng và độ tuổi của bé; với giày, gửi chiều dài bàn chân.</li>
        <li>Trukuky đối chiếu đúng phom của mẫu và xác nhận size trước khi chốt.</li>
      </ol>
      <p class="modal-note">Các nút size trên trang là lựa chọn dự kiến từ dữ liệu catalogue, không phải cam kết vừa vặn. <a href="${STORE_MESSENGER}" target="_blank" rel="noopener">Nhắn Trukuky tư vấn size</a>.</p>`,
  },
  price: {
    title: 'Giá sản phẩm',
    body: () => `
      <p>Website chỉ hiển thị giá khi bảng giá đã được Trukuky xác nhận. Mẫu chưa đủ dữ liệu sẽ không thể thêm vào giỏ hay gửi đơn.</p>
      <p class="modal-note">Nhắn <a href="${STORE_MESSENGER}" target="_blank" rel="noopener">Messenger</a> với mã mẫu để shop xác nhận giá, size và tình trạng hàng.</p>`,
  },
  order: {
    title: 'Cách đặt hàng',
    body: () => `
      <ol class="steps">
        <li><b>Chọn mẫu và size.</b> Bấm vào ảnh để xem nhanh, hoặc mở trang chi tiết để xem hết các góc chụp.</li>
        <li><b>Thêm vào giỏ.</b> Mua nhiều mẫu thì thêm hết vào một giỏ, shop gói chung một đơn.</li>
        <li><b>Điền tên, số điện thoại và địa chỉ.</b> Website sinh ra một mã đơn để hai bên cùng tra.</li>
        <li><b>Trukuky gọi lại xác nhận</b> size còn hàng, phí giao và tổng tiền trước khi gửi. Bạn chỉ trả tiền khi nhận hàng.</li>
      </ol>
      <p class="modal-note">Đặt trên web không phải là đã trừ hàng. Quần áo bán cùng lúc ở cửa hàng, trên live và trên web, nên size còn phải được shop đối chiếu sổ trước khi chốt — đó là lý do luôn có một cuộc gọi xác nhận.</p>`,
  },
  ship: {
    title: 'Giao nhận &amp; thanh toán',
    body: () => `
      <p><b>Thanh toán khi nhận hàng (COD).</b> Bạn xem hàng rồi mới trả tiền — website không thu tiền và không lưu thông tin thẻ.</p>
      <p>Phạm vi giao, thời gian dự kiến, đơn vị vận chuyển và phí giao phụ thuộc địa chỉ nhận, nên Trukuky báo con số chính xác trong <b>cuộc gọi xác nhận trước khi gửi hàng</b>.</p>
      <p class="modal-note">Website chưa công bố một biểu phí vận chuyển cố định. Bạn có thể huỷ đơn ngay tại cuộc gọi đó nếu thấy phí chưa hợp lý — đơn chỉ được gửi đi sau khi bạn đồng ý.</p>`,
  },
  return: {
    title: 'Đổi size &amp; đổi hàng',
    body: () => `
      <p>Sai size là lý do đổi hàng số một của quần áo trẻ em, nên hãy nói chiều cao và cân nặng của bé để shop chọn giúp <b>trước khi</b> đơn được gửi đi.</p>
      <p>Thời hạn đổi, điều kiện, chi phí chuyển hoàn và các trường hợp không áp dụng được Trukuky xác nhận cho từng đơn trong cuộc gọi trước khi gửi hàng.</p>
      <p class="modal-note">Website không tự đưa ra một cam kết đổi trả mà shop chưa phê duyệt. Khi Trukuky chốt chính sách chính thức, nội dung này sẽ được thay bằng đúng cam kết đó.</p>`,
  },
};

function initInfoModal() {
  const modal = document.getElementById('infoModal');
  if (!modal) return;
  const titleEl = modal.querySelector('#infoModalTitle');
  const bodyEl = modal.querySelector('#infoModalBody');
  const close = () => {
    modal.classList.remove('is-open');
    if (!document.getElementById('lightbox')?.classList.contains('is-open')) {
      document.documentElement.style.overflow = '';
    }
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-info]');
    if (!trigger) return;
    e.preventDefault();
    const content = INFO_CONTENT[trigger.dataset.info];
    if (!content) return;
    titleEl.innerHTML = content.title;
    bodyEl.innerHTML = content.body();
    modal.classList.add('is-open');
    document.documentElement.style.overflow = 'hidden';
  });

  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.querySelector('.modal-scrim').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}


/* ---------- Count-up stats ---------- */
