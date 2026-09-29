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

const CHAT_ICON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.7-5.1A8 8 0 1 1 21 15Z"/></svg>';

function compactProductAction(p, className, labelPrefix) {
  if (isOrderableProduct(p)) {
    return `<button type="button" class="${className}" data-add-to-cart="${p.id}" aria-label="${needsVariantChoice(p) ? 'Chọn size cho' : 'Thêm vào giỏ'} ${escAttr(p.title)}">${ADD_ICON_SVG}</button>`;
  }
  return `<a class="${className} is-consult" href="${STORE_MESSENGER}" target="_blank" rel="noopener" data-consult-product="${p.id}" aria-label="${labelPrefix || 'Nhắn tư vấn'} ${escAttr(p.title)}">${CHAT_ICON_SVG}</a>`;
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
        ${compactProductAction(p, 'frame-item-add', 'Nhắn hỏi mẫu')}
      </li>`).join('')}
    </ul>`;

  return `
  <article class="frame-card${isGroup ? ' is-group' : ''}" style="--ratio:${frame.ratio.toFixed(4)}">
    <div class="frame-media" ${mediaData}>
      ${pictureHTML(frame.src, isGroup ? `Khung ảnh bày ${frame.items.length} món Trukuky` : lead.title)}
      ${badge}${groupBadge}
      ${isGroup ? spots.map(hotspotHTML).join('') : ZOOM_HINT_SVG}
      ${isGroup ? '' : compactProductAction(lead, 'quick-add', 'Nhắn hỏi mẫu')}
    </div>
    <div class="frame-body">${isGroup ? group : single}</div>
  </article>`;
}

/* Lưới gợi ý ở trang chi tiết vẫn dùng thẻ đơn giản một món. */
function productCardHTML(p) {
  return frameCardHTML({ src: p.imgA, ratio: photoRatio(p.imgA), items: [p], lead: p });
}

/* ---------- Bảng size & thông tin mua hàng ---------- */
/* Trang Chăm sóc khách hàng nằm ở gốc site, nhưng ui.js còn chạy ở /p/*.html —
   nên đường dẫn phải quy về gốc bằng assetUrl, không ghi tương đối. */
function careUrl(hash) {
  const base = typeof assetUrl === 'function'
    ? assetUrl('cham-soc-khach-hang.html')
    : 'cham-soc-khach-hang.html';
  return hash ? base + hash : base;
}

/* Bảng "giày" trong SIZE_GUIDES còn một cột cuối bỏ trống từ dữ liệu vận hành
   cũ. Cắt mọi cột rỗng hoàn toàn trước khi vẽ: một cột trắng không nói thêm
   điều gì, chỉ kéo bảng rộng ra và bắt khách cuộn ngang trên điện thoại. */
function sizeTableHTML(guide) {
  const keep = guide.head
    .map((h, i) => (String(h || '').trim() !== '' || guide.rows.some((r) => String(r[i] || '').trim() !== '')))
    .map((used, i) => (used ? i : -1))
    .filter((i) => i >= 0);
  return `
  <h4>${guide.title}</h4>
  <div class="table-wrap">
    <table class="size-table">
      <thead><tr>${keep.map((i) => `<th>${guide.head[i]}</th>`).join('')}</tr></thead>
      <tbody>${guide.rows.map((r) => `<tr>${keep.map((i) => `<td>${r[i] == null ? '' : r[i]}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <p class="modal-note">${guide.note}</p>`;
}

/* Modal thông tin ở footer mọi trang.
   Đây là chỗ khách mở ra ĐÚNG lúc đang cân nhắc bấm mua. Bản cũ trả lời cả
   bốn câu hỏi bằng "đang chờ Trukuky xác nhận" — đọc xong thì người ta đóng
   tab, vì nghe như một cửa hàng chưa mở. Nên các mục dưới đây nói ngắn, ấm và
   có việc để làm ngay, rồi dẫn sang trang Chăm sóc khách hàng để xem đầy đủ.
   Vẫn giữ nguyên nguyên tắc: KHÔNG nêu phí ship, thời gian giao hay số ngày
   đổi trả như một con số chắc chắn khi shop chưa chốt. */
const INFO_CONTENT = {
  size: {
    title: 'Chọn size cho bé',
    body: () => `
      <p>Trukuky chọn size theo <b>chiều cao</b> và <b>cân nặng</b> của bé, không theo tuổi — hai bé cùng 5 tuổi có thể cách nhau cả một size.</p>
      <ol class="steps">
        <li>Tra nhanh trong <a href="${careUrl('#chon-size')}">ba bảng size theo chiều cao &amp; cân nặng</a>: đồ bé, đồ đôi mẹ &amp; bé, và giày.</li>
        <li>Nhắn shop chiều cao, cân nặng kèm mã mẫu bạn đang xem. Nếu là giày, đo thêm chiều dài bàn chân.</li>
        <li>Shop đối chiếu đúng phom của mẫu đó rồi xác nhận size trước khi gửi hàng.</li>
      </ol>
      <p class="modal-note">Bảng size là bảng tham khảo, không phải cam kết vừa vặn — mỗi mẫu một phom nên shop luôn chốt lại size theo từng món. <a href="${careUrl('#chon-size')}">Xem chi tiết ở trang Chăm sóc khách hàng</a> hoặc <a href="${STORE_MESSENGER}" target="_blank" rel="noopener">nhắn Trukuky</a>.</p>`,
  },
  price: {
    title: 'Giá sản phẩm',
    body: () => `
      <p>Website chỉ hiện giá khi Trukuky đã chốt con số đó — giá shop niêm yết trong buổi livestream, hoặc giá đã được shop xác nhận. Mẫu chưa có giá chốt sẽ ghi “Liên hệ xác nhận giá” chứ không hiện một con số dựng tạm.</p>
      <p>Một số mẫu hiện “<b>Từ</b> …₫”: đó là giá của size nhỏ nhất, vì đồ đôi mẹ &amp; bé và giày thường mỗi size một giá. Shop báo đúng giá theo size bạn chọn khi xác nhận đơn.</p>
      <p>Phí giao hàng tính riêng, shop báo theo từng đơn.</p>
      <p class="modal-note">Nhắn <a href="${STORE_MESSENGER}" target="_blank" rel="noopener">Messenger</a> kèm mã mẫu để shop xác nhận giá cuối, size còn hàng và cách giao. <a href="${careUrl('#giao-nhan')}">Xem cách nhận hàng</a>.</p>`,
  },
  order: {
    title: 'Cách đặt hàng',
    body: () => hasOrderableProducts() ? `
      <ol class="steps">
        <li><b>Chọn mẫu và size</b> — mở mẫu bạn thích, chọn size (và màu nếu mẫu có nhiều màu).</li>
        <li><b>Thêm vào giỏ</b> — gom nhiều món trong một lần cũng được.</li>
        <li><b>Gửi đơn qua Messenger</b> — mở giỏ hàng rồi bấm “Gửi đơn cho shop”; website soạn sẵn nội dung đơn ngay trên máy bạn để bạn dán vào khung chat.</li>
        <li><b>Shop xác nhận</b> giá cuối, size còn hàng và phí giao, rồi mới chốt đơn.</li>
      </ol>
      <p class="modal-note">Website không tự gửi và không lưu thông tin của bạn — đơn chỉ đi khi chính bạn bấm gửi trong Messenger. Chưa chắc size? <a href="${careUrl('#chon-size')}">Xem hướng dẫn chọn size</a> trước khi thêm vào giỏ.</p>` : `
      <ol class="steps">
        <li><b>Mở mẫu bạn quan tâm</b> và xem các góc ảnh hiện có.</li>
        <li><b>Chọn size, màu dự kiến</b> để cuộc tư vấn nhanh hơn.</li>
        <li><b>Bấm “Nhắn hỏi mẫu”</b>; website sẽ sao chép mã mẫu để bạn dán vào Messenger.</li>
        <li><b>Shop xác nhận</b> giá, size, tình trạng hàng và cách giao trước khi chốt đơn.</li>
      </ol>
      <p class="modal-note">Cần chọn size trước? <a href="${careUrl('#chon-size')}">Xem hướng dẫn chọn size ở trang Chăm sóc khách hàng</a>.</p>`,
  },
  ship: {
    title: 'Giao nhận &amp; phí vận chuyển',
    body: () => `
      <p>Trukuky báo phí ship theo từng đơn, vì tuỳ địa chỉ nhận và số món mà chi phí mỗi đơn một khác. Shop báo trước, bạn đồng ý rồi shop mới gửi hàng.</p>
      <ol class="steps">
        <li>Gửi đơn kèm địa chỉ nhận qua Messenger.</li>
        <li>Shop báo lại phí ship, đơn vị giao và thời gian dự kiến cho đúng đơn đó.</li>
        <li>Bạn xác nhận thì shop đóng gói và gửi đi.</li>
      </ol>
      <p class="modal-note">Ở gần 43 Lê Chân thì có thể tới lấy trực tiếp, cho bé thử rồi mới quyết định. <a href="${careUrl('#giao-nhan')}">Xem chi tiết ở trang Chăm sóc khách hàng</a>.</p>`,
  },
  return: {
    title: 'Đổi size &amp; đổi hàng',
    body: () => `
      <p>Điều kiện đổi được shop xác nhận ngay trong tin nhắn <b>trước khi bạn chốt đơn</b> — để hai bên cùng rõ từ đầu, thay vì hứa một con số rồi làm khác.</p>
      <ol class="steps">
        <li>Trước khi chốt, hỏi thẳng “mẫu này đổi size được không” kèm mã mẫu.</li>
        <li>Giữ lại tem, mác và túi đựng cho tới khi bé mặc thử xong.</li>
        <li>Nếu không vừa, nhắn lại đúng đoạn chat cũ kèm ảnh để shop hướng dẫn.</li>
      </ol>
      <p class="modal-note">Đỡ nhất là không phải đổi: gửi chiều cao và cân nặng của bé để shop chốt size giúp. <a href="${careUrl('#doi-size')}">Xem chi tiết ở trang Chăm sóc khách hàng</a>.</p>`,
  },
};

/* Sao chép mã mẫu/biến thể là một tiện ích tại thiết bị, không gửi
   dữ liệu đi đâu. Nếu trình duyệt chặn clipboard, liên kết Messenger vẫn
   mở bình thường. */
function initConsultLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-consult-product]');
    if (!link) return;
    const p = PRODUCTS_BY_ID[link.dataset.consultProduct];
    if (!p) return;
    const variant = {
      size: link.dataset.size || (typeof quickVariant !== 'undefined' ? quickVariant.size : ''),
      color: link.dataset.color || (typeof quickVariant !== 'undefined' ? quickVariant.color : ''),
    };
    if (!navigator.clipboard || !window.isSecureContext) return;
    navigator.clipboard.writeText(consultClipboardText(p, variant))
      .then(() => showToast('Đã sao chép mã mẫu', 'Dán tin nhắn vào Messenger để Trukuky tư vấn nhanh hơn.'))
      .catch(() => {});
  });
}

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
