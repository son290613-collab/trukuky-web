/* ==========================================================================
   TRUKUKY — Trang chủ
   Một khu sản phẩm duy nhất (chip lọc + lưới), một sản phẩm editorial, Reels,
   bằng chứng xã hội, câu chuyện + cửa hàng. Header, drawer, tìm kiếm, xem
   nhanh có chọn size/màu, bảng size.
   ========================================================================== */

/* ---------- Header, drawer ---------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggle || !drawer) return;
  const closeBtn = drawer.querySelector('.mobile-drawer-close');
  const scrim = drawer.querySelector('.mobile-drawer-scrim');
  const open = () => { drawer.classList.add('is-open'); document.documentElement.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('is-open'); document.documentElement.style.overflow = ''; };
  toggle.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  scrim.addEventListener('click', close);
  drawer.querySelectorAll('a, .mobile-drawer-sub button').forEach((el) => el.addEventListener('click', close));
}

/* ---------- Ảnh hero ----------
   Ảnh mở đầu đúng của Trukuky là khoảnh khắc hai mẹ con trên chiếc xe máy —
   ảnh gốc nằm trên Fanpage. Thả file vào images/ với một trong các tên dưới
   đây là trang tự dùng nó, không cần sửa code; chưa có thì tạm dùng ảnh set
   kaki đồng điệu. Ảnh luôn hiển thị nguyên khung, không cắt. */
const HERO_PHOTO = 'images/hero-xemay.jpg';

function initHeroPhoto() {
  const img = document.getElementById('heroPhoto');
  if (!img) return;

  /* Bản trước dò bằng cách tải thử ảnh — chưa có file thì mỗi lượt ghé đều
     sinh một request 404 nằm chình ình trong console và bị Lighthouse trừ
     điểm Best Practices. Giờ đọc từ data/photo-sizes.json (npm run photos đã
     quét sẵn thư mục images/), nên không có file thì không có request nào. */
  const file = HERO_PHOTO.split('/').pop();
  const size = PHOTO_SIZES[file];
  if (!size) return;

  const picture = img.closest('picture');
  /* Ảnh thay tạm có bản AVIF dựng sẵn; ảnh hero thật shop mới thả vào thì
     chưa có, nên bỏ luôn thẻ <source> để trình duyệt dùng đúng file JPEG. */
  if (picture) picture.querySelector('source')?.remove();
  img.src = assetUrl(HERO_PHOTO);
  img.setAttribute('width', size[0]);
  img.setAttribute('height', size[1]);
  img.alt = 'Hai mẹ con Trukuky trên chiếc xe máy giữa phố Hải Phòng';
  const cap = document.querySelector('.hero-photo figcaption');
  if (cap) cap.textContent = 'Khoảnh khắc khởi nguồn của Trukuky';
}

/* ---------- Khu sản phẩm: chip lọc + lưới + tìm kiếm ---------- */
let activeFilter = 'live';
let searchQuery = '';

function currentProducts() {
  const q = normalizeText(searchQuery.trim());
  /* Ô tìm kiếm quét TOÀN BỘ danh mục, không bị bó trong chip đang bật.
     Trước đây chip mặc định là "Mẫu live còn size", nên khách gõ "balo" —
     shop có ba chiếc — lại nhận về "Không tìm thấy sản phẩm nào" và bỏ đi.
     Khách gõ chữ là đang hỏi "shop có cái này không?", câu trả lời phải lấy
     từ cả kho hàng; chip chỉ còn tác dụng khi ô tìm kiếm đang trống. */
  if (q) {
    return PRODUCTS.filter((p) =>
      normalizeText(`${p.title} ${p.desc || ''} ${(p.ages || []).join(' ')}`).includes(q));
  }
  return PRODUCTS.filter((p) => matchesFilter(p, activeFilter));
}

function renderChips() {
  const root = document.getElementById('filterChips');
  if (!root) return;
  const known = PRODUCT_FILTERS.some((f) => f.key === activeFilter);
  const extra = known ? [] : [{ key: activeFilter, label: EXTRA_FILTER_LABELS[activeFilter] || activeFilter }];
  root.innerHTML = [...PRODUCT_FILTERS, ...extra].map((f) => `
    <button type="button" class="chip${f.key === activeFilter ? ' is-active' : ''}" data-chip="${f.key}" aria-pressed="${f.key === activeFilter}">
      ${f.label}<span class="chip-count">${countProducts(f.key)}</span>
    </button>`).join('');
}

function renderGrid() {
  const grid = document.getElementById('productGrid');
  const count = document.getElementById('gridCount');
  if (!grid) return;
  const list = currentProducts();

  if (count) {
    const filterLabel = activeFilter === 'all'
      ? ''
      : ` trong “${PRODUCT_FILTERS.find((f) => f.key === activeFilter)?.label || EXTRA_FILTER_LABELS[activeFilter] || activeFilter}”`;
    const dangDao = activeFilter === 'all' && !searchQuery.trim();
    /* Nói rõ kết quả trải khắp mọi danh mục, để khách không tưởng con số này
       chỉ là phần nằm trong chip đang bật. */
    count.textContent = searchQuery.trim()
      ? `${list.length} kết quả cho “${searchQuery.trim()}” trong toàn bộ danh mục`
      : dangDao && COLLECTIONS.length
        ? `${list.length} sản phẩm, xếp thành ${COLLECTIONS.length} bộ`
        : `${list.length} sản phẩm${filterLabel}`;
  }

  if (!list.length) {
    /* Khi đang tìm kiếm, lưới rỗng nghĩa là cả kho không có mẫu nào khớp —
       không phải do bộ lọc, nên đừng bảo khách "bỏ bớt bộ lọc". */
    const goi = searchQuery.trim()
      ? 'Cả danh mục chưa có mẫu nào khớp. Thử một từ khoá ngắn hơn, hoặc'
      : 'Không tìm thấy sản phẩm nào. Thử bỏ bớt bộ lọc, hoặc';
    grid.innerHTML = `<p class="grid-empty">${goi} <a href="https://m.me/trukuky" target="_blank" rel="noopener">nhắn Messenger</a> để Trukuky tìm giúp.</p>`;
    grid.classList.remove('is-collections');
    return;
  }

  /* Hai chế độ xem, và ranh giới giữa chúng là câu hỏi khách đang hỏi.

     ĐANG DẠO (chưa lọc, chưa tìm): khách hỏi "shop này bán gì?" — trả lời
     bằng bộ sưu tập có tên và có lời dẫn. Đây là lúc shop được nói.

     ĐANG TÌM (đã bấm chip hoặc gõ ô tìm): khách hỏi "có cái này không?" —
     trả lời bằng một lưới phẳng, ngắn nhất tới kết quả. Chen lời dẫn vào
     lúc này chỉ làm khách phải cuộn thêm. */
  const dangDao = activeFilter === 'all' && !searchQuery.trim();

  if (!dangDao || !COLLECTIONS.length) {
    grid.classList.remove('is-collections');
    grid.innerHTML = framesFor(list).map(frameCardHTML).join('');
    return;
  }

  grid.classList.add('is-collections');
    grid.innerHTML = COLLECTIONS.map((c) => `
    <div class="collection" id="bst-${escAttr(c.id)}">
      <div class="collection-head">
        <h3>${escAttr(c.title)}</h3>
        ${c.lead ? `<p>${escAttr(c.lead)}</p>` : ''}
        <span class="collection-count">${c.items.length} mẫu</span>
      </div>
      <div class="frame-grid">${framesFor(c.items).map(frameCardHTML).join('')}</div>
    </div>`).join('');
}

function renderCollectionShowcase() {
  const root = document.getElementById('collectionShowcase');
  if (!root) return;
  if (!COLLECTIONS.length) {
    root.innerHTML = '<p class="grid-empty">Bộ sưu tập đang được cập nhật. Nhắn Trukuky để được gợi ý theo nhu cầu.</p>';
    return;
  }
  root.innerHTML = COLLECTIONS.slice(0, 5).map((c, index) => {
    const lead = c.items[0];
    const image = lead ? lead.imgA : '';
    return `
    <article class="collection-tile${index === 0 ? ' collection-tile--lead' : ''}">
      <button type="button" class="collection-tile-media" data-collection="${escAttr(c.id)}" aria-label="Khám phá ${escAttr(c.title)}">
        ${image ? pictureHTML(image, c.title, { sizes: index === 0 ? '(max-width: 760px) 92vw, 46vw' : '(max-width: 760px) 92vw, 24vw' }) : ''}
      </button>
      <div class="collection-tile-body">
        <span>${String(index + 1).padStart(2, '0')} · ${c.items.length} mẫu</span>
        <h3>${escAttr(c.title)}</h3>
        <p>${escAttr(c.lead || '')}</p>
        <button type="button" class="collection-link" data-collection="${escAttr(c.id)}">Xem tuyển chọn <span aria-hidden="true">→</span></button>
      </div>
    </article>`;
  }).join('');
}

function scrollToProducts(behavior) {
  const section = document.getElementById('products');
  if (!section) return;
  const top = section.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior });
}

function setFilter(key, { scroll = false } = {}) {
  activeFilter = key || 'all';
  renderChips();
  renderGrid();
  document.querySelectorAll('.main-nav a[data-filter]').forEach((a) => {
    a.classList.toggle('is-active', a.dataset.filter === activeFilter);
  });
  if (scroll) scrollToProducts('smooth');
}

function initProductSection() {
  renderChips();
  renderGrid();
  initDensityToggle();

  document.getElementById('filterChips')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-chip]');
    if (chip) setFilter(chip.dataset.chip);
  });

  /* Mọi link mang data-filter (menu, ô danh mục, footer, nút hero) đều đổ về
     cùng một khu sản phẩm thay vì nhảy tới một khu riêng. */
  document.addEventListener('click', (e) => {
    const collectionLink = e.target.closest('[data-collection]');
    if (collectionLink) {
      e.preventDefault();
      setFilter('all');
      requestAnimationFrame(() => {
        const target = document.getElementById(`bst-${collectionLink.dataset.collection}`);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      return;
    }
    const link = e.target.closest('[data-filter]');
    if (!link || link.matches('[data-chip]')) return;
    e.preventDefault();
    setFilter(link.dataset.filter, { scroll: true });
  });

  document.querySelectorAll('[data-search-form]').forEach((form) => {
    const input = form.querySelector('[data-search-input]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      searchQuery = input.value;
      renderGrid();
      setFilter('all', { scroll: true });
    });
    input.addEventListener('input', () => {
      searchQuery = input.value;
      document.querySelectorAll('[data-search-input]').forEach((other) => {
        if (other !== input) other.value = input.value;
      });
      /* Đang tìm thì kết quả lấy từ cả kho, nên bỏ luôn chip đang bật —
         nếu không dãy chip vẫn sáng "Mẫu live còn size" trong khi lưới bên
         dưới đang hiện cả những mẫu không thuộc chip đó. */
      if (searchQuery.trim() && activeFilter !== 'all') setFilter('all');
      else renderGrid();
    });
  });

  /* Vào thẳng từ link chia sẻ / trang chi tiết: index.html#girls, #age:4-6T…
     Nhảy tức thì (không 'smooth') vì trình duyệt huỷ cuộn mượt phát sinh ngay
     lúc trang đang tải. */
  const hashKey = decodeURIComponent(location.hash.replace('#', ''));
  if (hashKey && (PRODUCT_FILTERS.some((f) => f.key === hashKey) || hashKey.startsWith('age:') || hashKey === 'girls')) {
    setFilter(hashKey);
    /* Tắt khôi phục vị trí cuộn của trình duyệt cho riêng lần vào này: nó chạy
       sau 'load' và sẽ kéo trang về đúng chỗ cũ (0), đè lên chỗ ta vừa nhảy tới. */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    /* Trình duyệt còn tự cuộn lại sau khi ảnh tải xong, nên đặt lại vị trí một
       lần nữa lúc load xong — chỉ khi khách chưa tự cuộn đi đâu. */
    const land = () => { if (window.scrollY < 40) scrollToProducts('auto'); };
    requestAnimationFrame(land);
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => requestAnimationFrame(land), { once: true });
    }
  }
}

/* ---------- Cỡ ảnh trong lưới ----------
   Hai mức: "Ảnh lớn" (lưới vốn có) và "Xem nhiều" (hàng thấp hơn ~1/3, lướt
   hết hàng nhanh hơn). Chỉ đổi một biến CSS trên lưới — tỉ lệ từng khung ảnh
   giữ nguyên, nên không tấm nào bị cắt ở bất kỳ mức nào.
   Lựa chọn được nhớ lại cho lần ghé sau. */
const DENSITY_KEY = 'trukuky-co-anh-luoi';
let gridDensity = 'roomy';
try {
  if (localStorage.getItem(DENSITY_KEY) === 'dense') gridDensity = 'dense';
} catch {
  /* trình duyệt chặn localStorage (chế độ riêng tư) — cứ chạy với mức mặc định */
}

function paintDensity() {
  document.getElementById('productGrid')?.classList.toggle('is-dense', gridDensity === 'dense');
  document.querySelectorAll('#densityToggle button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.density === gridDensity));
  });
}

function setDensity(next) {
  if (next === gridDensity) return;
  gridDensity = next;
  try { localStorage.setItem(DENSITY_KEY, gridDensity); } catch { /* không lưu được thì thôi */ }
  /* View Transitions có sẵn trong trình duyệt lo phần chuyển động; không có
     thì ảnh đổi cỡ tức thì — không thêm thư viện animation nào. */
  if (document.startViewTransition && document.visibilityState === 'visible') {
    const t = document.startViewTransition(paintDensity);
    /* Các promise này reject khi trình duyệt bỏ qua hiệu ứng — lưới vẫn đã đổi xong. */
    t.finished?.catch(() => {});
    t.ready?.catch(() => {});
    t.updateCallbackDone?.catch(() => {});
  } else {
    paintDensity();
  }
}

function initDensityToggle() {
  const root = document.getElementById('densityToggle');
  if (!root) return;
  paintDensity();
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-density]');
    if (btn) setDensity(btn.dataset.density);
  });
}

/* ---------- Sản phẩm nổi bật trong tuần ---------- */
function renderFeatured() {
  const root = document.getElementById('featuredCard');
  if (!root) return;
  /* Khu nổi bật làm nổi một sản phẩm đã có trong lưới, nên nếu dùng lại đúng
     tấm ảnh của thẻ đó thì trang có hai lần cùng một ảnh. Thay vào đó chọn
     mẫu có nhiều góc chụp và lấy góc chưa xuất hiện ở đâu — khách được xem
     thêm một mặt của sản phẩm, và không tấm ảnh nào bị lặp. */
  const usedInGrid = new Set(framesFor(PRODUCTS).map((f) => f.src));
  const unusedShot = (x) => (x.shots || []).find((s) => !usedInGrid.has(s));
  const p = PRODUCTS.find((x) => x.featured && unusedShot(x))
    || PRODUCTS.find((x) => (x.sections || []).includes('new') && unusedShot(x))
    || PRODUCTS.find(unusedShot)
    || NEW_ARRIVALS[0] || PRODUCTS[0];
  if (!p) return;
  const featuredImg = unusedShot(p) || p.imgA;
  root.innerHTML = `
    <div class="featured-media" data-lightbox data-id="${p.id}"
         style="--ratio:${photoRatio(featuredImg).toFixed(4)}"
         data-img-a="${assetUrl(featuredImg)}" data-title="${escAttr(p.title)}"
         data-desc="${escAttr(p.desc || '')}">
      <img src="${assetUrl(featuredImg)}" alt="${escAttr(p.title)}" loading="lazy" decoding="async">
      ${ZOOM_HINT_SVG}
    </div>
    <div class="featured-body">
      <span class="eyebrow">Nổi bật tuần này</span>
      <h2>${p.title}</h2>
      <p>${p.desc || ''}</p>
      <div class="featured-meta">
        <span class="featured-price">${priceHTML(p)}</span>
        <span class="featured-sizes">${(p.sizes || []).length} size · ${(p.colors || []).length} màu${(p.shots || []).length > 1 ? ` · ${p.shots.length} góc chụp` : ''}</span>
      </div>
      <div class="featured-actions">
        ${isOrderableProduct(p) ? `
          <button type="button" class="btn btn-primary add-to-cart-btn" data-add-to-cart="${p.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            Chọn size &amp; thêm vào giỏ
          </button>` : `
          <a class="btn btn-primary" href="${STORE_MESSENGER}" target="_blank" rel="noopener" data-consult-product="${p.id}">
            ${CHAT_ICON_SVG} Nhắn hỏi mẫu ${p.id}
          </a>`}
        <a href="${productUrl(p.id)}" class="btn btn-ghost-pink">Xem chi tiết</a>
      </div>
    </div>`;
}

/* ---------- Xem nhanh: ảnh lớn + chọn size/màu ---------- */
let quickProduct = null;
let quickVariant = { size: '', color: '' };

function variantPickerHTML(p) {
  if (!p) return '';
  const guide = sizeGuideFor(p);
  const sizes = p.sizes || [];
  const colors = p.colors || [];
  const sizeBlock = sizes.length ? `
    <div class="variant-group">
      <div class="variant-label">
        <span>Size${sizes.length > 1 ? ' <i>*</i>' : ''}</span>
        ${guide ? '<button type="button" class="variant-guide-link" data-info="size">Xem bảng size</button>' : ''}
      </div>
      <div class="variant-options">
        ${sizes.map((s) => `<button type="button" class="variant-option${quickVariant.size === s ? ' is-active' : ''}" data-variant-size="${escAttr(s)}">${s}</button>`).join('')}
      </div>
    </div>` : '';
  const colorBlock = colors.length ? `
    <div class="variant-group">
      <div class="variant-label"><span>Màu${colors.length > 1 ? ' <i>*</i>' : ''}</span></div>
      <div class="variant-options">
        ${colors.map((c) => `<button type="button" class="variant-option variant-color${quickVariant.color === c.name ? ' is-active' : ''}" data-variant-color="${escAttr(c.name)}"><i style="background:${c.hex}"></i>${c.name}</button>`).join('')}
      </div>
    </div>` : '';
  return `${sizeBlock}${colorBlock}<p class="variant-hint" id="variantHint"></p>`;
}

function syncQuickAddState() {
  const addBtn = document.querySelector('.lightbox-add-to-cart');
  const consultLink = document.querySelector('.lightbox-consult');
  if (!addBtn || !consultLink) return;
  const p = quickProduct;
  if (!p) {
    addBtn.style.display = 'none';
    consultLink.style.display = 'none';
    return;
  }
  const orderable = isOrderableProduct(p);
  addBtn.style.display = orderable ? '' : 'none';
  consultLink.style.display = orderable ? 'none' : '';
  addBtn.dataset.addToCart = p.id;
  addBtn.dataset.size = quickVariant.size;
  addBtn.dataset.color = quickVariant.color;
  consultLink.dataset.consultProduct = p.id;
  consultLink.dataset.size = quickVariant.size;
  consultLink.dataset.color = quickVariant.color;
  const needSize = (p.sizes || []).length > 0 && !quickVariant.size;
  const needColor = (p.colors || []).length > 0 && !quickVariant.color;
  addBtn.disabled = orderable && (needSize || needColor);
  const hint = document.getElementById('variantHint');
  if (hint) {
    hint.textContent = orderable
      ? missingVariantHint(needSize, needColor)
      : 'Chọn size và màu dự kiến; Trukuky sẽ xác nhận lại khi tư vấn.';
  }
}

/* Khung ảnh đang mở trong xem nhanh (nếu là khung bày nhiều món). */
let quickFrame = null;

function frameBySrc(src) {
  return framesFor(PRODUCTS).find((f) => f.src === src) || null;
}

/* Ảnh trong xem nhanh cũng hiển thị nguyên khung theo đúng tỉ lệ gốc. */
function renderQuickMedia(imgSrc, title) {
  const media = document.querySelector('#lightbox .lightbox-media');
  if (!media) return;
  media.style.setProperty('--ratio', photoRatio(imgSrc).toFixed(4));
  const spots = quickFrame ? frameHotspots(quickFrame) : [];
  media.innerHTML = `<img src="${imgSrc}" alt="${escAttr(title)}" loading="lazy">` + spots.map((p, i) => `
    <button type="button" class="hotspot${quickProduct && quickProduct.id === p.id ? ' is-active' : ''}"
            data-hotspot="${p.id}" style="left:${p.hotspot.x}%; top:${p.hotspot.y}%"
            aria-label="${escAttr(p.title)}">
      <span class="hotspot-dot">${i + 1}</span>
      <span class="hotspot-label">${escAttr(p.title)}</span>
    </button>`).join('');
}

/* Danh sách "món đi kèm trong khung": mũ, túi, giày lọt vào ảnh nhưng không
   phải sản phẩm được chụp riêng — nêu bằng chữ, không dựng thành SKU. */
function inFrameHTML(p) {
  if (!p || !(p.inFrame || []).length) return '';
  return `<p class="in-frame">Trong ảnh còn có: ${p.inFrame.join(' · ')}.
    <span>Các món này chưa được chụp riêng nên chưa bán online — hỏi Trukuky qua
    <a href="https://m.me/trukuky" target="_blank" rel="noopener">Messenger</a> nếu bạn muốn mua.</span></p>`;
}

function renderQuickInfo() {
  const lightbox = document.getElementById('lightbox');
  const titleEl = lightbox.querySelector('.lightbox-title');
  const descEl = lightbox.querySelector('.lightbox-desc');
  const priceEl = lightbox.querySelector('.lightbox-price');
  const variantRoot = lightbox.querySelector('#quickVariants');
  const detailLink = lightbox.querySelector('.lightbox-detail-link');
  const p = quickProduct;

  /* Khung nhiều món, chưa chọn món nào: liệt kê để khách chọn. */
  if (quickFrame && !p) {
    const spots = frameHotspots(quickFrame);
    titleEl.textContent = `${spots.length} món trong một khung ảnh`;
    descEl.innerHTML = 'Ảnh giữ nguyên khung gốc, không cắt. Chạm vào từng chấm số trên ảnh — hoặc chọn trong danh sách dưới đây — để xem và mua riêng từng món.';
    priceEl.innerHTML = '';
    priceEl.style.display = 'none';
    variantRoot.innerHTML = `<ul class="frame-items frame-items--panel">${spots.map((x, i) => `
      <li>
        <span class="frame-item-index">${i + 1}</span>
        <button type="button" class="frame-item-pick" data-hotspot="${x.id}">${escAttr(x.title)}</button>
        <span class="frame-item-price">${priceHTML(x)}</span>
      </li>`).join('')}</ul>`;
    if (detailLink) detailLink.style.display = 'none';
    syncQuickAddState();
    return;
  }

  titleEl.textContent = p ? p.title : quickFrame ? 'Khung ảnh Trukuky' : '';
  descEl.innerHTML = p
    ? `${escAttr(p.desc || 'Liên hệ Trukuky để được tư vấn thêm về sản phẩm này.')}${inFrameHTML(p)}`
    : '';
  priceEl.innerHTML = p ? priceHTML(p) : '';
  priceEl.style.display = p && p.price != null ? '' : 'none';
  variantRoot.innerHTML =
    (quickFrame ? '<button type="button" class="frame-back" data-frame-back>‹ Xem cả khung ảnh</button>' : '')
    + variantPickerHTML(p);
  if (detailLink) {
    detailLink.style.display = p ? '' : 'none';
    if (p) detailLink.href = productUrl(p.id);
  }
  syncQuickAddState();
}

function selectQuickProduct(id) {
  quickProduct = PRODUCTS_BY_ID[id] || null;
  quickVariant = quickProduct ? defaultVariant(quickProduct) : { size: '', color: '' };
  renderQuickMedia(assetUrl(quickFrame ? quickFrame.src : quickProduct.imgA), quickProduct ? quickProduct.title : '');
  renderQuickInfo();
}

function showLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.add('is-open');
  document.documentElement.style.overflow = 'hidden';
}

/* Mở nguyên một khung bày nhiều món. */
function openFrameView(src, focusId) {
  if (!document.getElementById('lightbox')) return;
  quickFrame = frameBySrc(src);
  if (!quickFrame) return;
  quickProduct = focusId ? PRODUCTS_BY_ID[focusId] || null : null;
  quickVariant = quickProduct ? defaultVariant(quickProduct) : { size: '', color: '' };
  renderQuickMedia(assetUrl(src), quickProduct ? quickProduct.title : 'Khung ảnh Trukuky');
  renderQuickInfo();
  showLightbox();
}

function openQuickView(data) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  quickFrame = null;
  quickProduct = data.id ? PRODUCTS_BY_ID[data.id] : null;
  quickVariant = quickProduct ? defaultVariant(quickProduct) : { size: '', color: '' };
  renderQuickMedia(data.imgA, data.title);
  if (!quickProduct) {
    lightbox.querySelector('.lightbox-title').textContent = data.title || '';
    lightbox.querySelector('.lightbox-desc').textContent = data.desc || '';
    lightbox.querySelector('.lightbox-price').innerHTML = '';
    lightbox.querySelector('#quickVariants').innerHTML = '';
    lightbox.querySelector('.lightbox-detail-link').style.display = 'none';
    syncQuickAddState();
  } else {
    renderQuickInfo();
  }
  showLightbox();
}

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const close = () => {
    lightbox.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    /* Xoá size/màu vừa chọn. quickVariant là biến dùng chung: initConsultLinks
       trong js/ui.js lấy nó làm phương án dự phòng cho mọi nút "Nhắn hỏi mẫu"
       không mang sẵn data-size. Không xoá thì size chọn cho mẫu A còn nằm lại
       và chui vào tin nhắn hỏi mẫu B — khách hỏi nhầm size. */
    quickVariant = { size: '', color: '' };
    quickProduct = null;
    quickFrame = null;
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('.quick-add, .frame-item-add')) return; /* nút "+" do cart.js xử lý */
    if (lightbox.contains(e.target)) return; /* trong lightbox có handler riêng ở dưới */

    /* Chấm hotspot trên lưới: mở đúng khung ảnh đó, chọn sẵn món được chấm. */
    const spot = e.target.closest('[data-hotspot]');
    if (spot) {
      e.preventDefault();
      const card = spot.closest('.frame-card');
      const src = card?.querySelector('[data-frame]')?.dataset.frame;
      if (src) openFrameView(src, spot.dataset.hotspot);
      return;
    }

    /* Ảnh của một khung bày nhiều món: mở nguyên khung, chưa chọn món nào. */
    const frameTrigger = e.target.closest('[data-frame]');
    if (frameTrigger) {
      openFrameView(frameTrigger.dataset.frame);
      return;
    }

    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    openQuickView({
      id: trigger.dataset.id || '',
      imgA: trigger.dataset.imgA,
      title: trigger.dataset.title,
      desc: trigger.dataset.desc,
    });
  });

  lightbox.addEventListener('click', (e) => {
    const spot = e.target.closest('[data-hotspot]');
    if (spot) { selectQuickProduct(spot.dataset.hotspot); return; }
    if (e.target.closest('[data-frame-back]')) {
      quickProduct = null;
      renderQuickMedia(assetUrl(quickFrame.src), 'Khung ảnh Trukuky');
      renderQuickInfo();
      return;
    }
    const sizeBtn = e.target.closest('[data-variant-size]');
    const colorBtn = e.target.closest('[data-variant-color]');
    if (sizeBtn) {
      quickVariant.size = sizeBtn.dataset.variantSize;
      lightbox.querySelectorAll('[data-variant-size]').forEach((b) => b.classList.toggle('is-active', b === sizeBtn));
      syncQuickAddState();
    }
    if (colorBtn) {
      quickVariant.color = colorBtn.dataset.variantColor;
      lightbox.querySelectorAll('[data-variant-color]').forEach((b) => b.classList.toggle('is-active', b === colorBtn));
      syncQuickAddState();
    }
    if (e.target.closest('.lightbox-add-to-cart') && !e.target.closest('.lightbox-add-to-cart').disabled) {
      setTimeout(close, 150);
    }
  });

  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-scrim').addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

/* cart.js gọi hàm này khi khách bấm "+" ở một mẫu có nhiều size/màu. */
window.openVariantPicker = function openVariantPicker(product) {
  openQuickView({
    id: product.id,
    imgA: assetUrl(product.imgA),
    title: product.title,
    desc: product.desc || '',
    price: formatVND(product.price),
  });
};

/* ---------- Reels quay tại cửa hàng ----------
   Video tổng hợp shop gửi (10 lần lên mẫu nối liền nhau) được cắt sẵn theo
   đúng ranh giới từng lần quay — mỗi file một bộ đồ. Danh sách + lời mô tả
   nằm trong data/reels.json; ở đây chỉ dựng thẻ và lo phần phát.

   Hai mức hoãn tải, đừng nhầm chúng với nhau:
   - preload="none" hoãn file .mp4 cho tới khi khách bấm.
   - Ảnh bìa thì preload KHÔNG đụng tới: trình duyệt tải thuộc tính poster ngay
     khi gặp thẻ, kể cả khi thẻ nằm cách màn hình đầu bốn nghìn pixel. Mười ảnh
     bìa = 918 KB tải ngay, tranh băng thông với ảnh hero. Nên ảnh bìa để trong
     data-poster và chỉ gán khi thẻ sắp lọt vào màn hình (xem initReelPosters).
   Khung ảnh đã có aspect-ratio 9/16 trong CSS nên gán muộn không gây xô bố cục. */
/* Ảnh bìa reels lấy bản AVIF 480px: thẻ clip chỉ rộng khoảng 300px nên 480 là
   thừa đủ, và cả mười tấm giảm từ 918 KB xuống khoảng 300 KB. Thuộc tính poster
   không có cơ chế dự phòng như <picture>; trình duyệt không đọc được AVIF sẽ
   hiện nền tối của .reel-media kèm nút phát — vẫn bấm xem được bình thường. */
function reelPosterUrl(poster) {
  const file = String(poster || '').split('/').pop();
  if (!/\.jpe?g$/i.test(file)) return poster;
  const dir = String(poster).replace(/[^/]+$/, '');
  return `${dir}avif/${file.replace(/\.jpe?g$/i, '')}-480.avif`;
}

function reelDurationLabel(sec) {
  const total = Math.round(Number(sec) || 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function reelCardHTML(r) {
  const product = PRODUCTS_BY_ID[r.productId];
  return `
  <article class="reel-card" data-reel="${escAttr(r.id)}">
    <div class="reel-media">
      <video src="${assetUrl(r.file)}" data-poster="${assetUrl(reelPosterUrl(r.poster))}" preload="none"
             playsinline loop muted aria-label="${escAttr(r.title)}"></video>
      <button type="button" class="reel-play" aria-label="Phát clip ${escAttr(r.title)}">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5-11-6.5Z"/></svg>
      </button>
      <span class="reel-tag">${escAttr(r.tag || '')}</span>
      <span class="reel-dur">${reelDurationLabel(r.duration)}</span>
    </div>
    <div class="reel-body">
      <h3>${escAttr(r.title)}</h3>
      <p>${escAttr(r.desc || '')}</p>
      ${(r.inFrame || []).length ? `<p class="reel-inframe">Trong clip còn có: ${r.inFrame.map(escAttr).join(' · ')}</p>` : ''}
      ${product
        ? `<a class="reel-link" href="${productUrl(product.id)}">Xem ${escAttr(product.title)} ›</a>`
        : `<a class="reel-link reel-link--ask" href="https://m.me/trukuky" target="_blank" rel="noopener">Hỏi mẫu này qua Messenger ›</a>`}
    </div>
  </article>`;
}

/* Gán ảnh bìa khi thẻ còn cách màn hình 400px: khách vuốt tới là ảnh đã sẵn,
   còn ai không cuộn xuống khu Reels thì không tải một byte nào.
   Trình duyệt không có IntersectionObserver thì gán hết ngay — thà nặng còn hơn
   một dãy khung đen không ảnh. */
function initReelPosters(rail) {
  const videos = rail.querySelectorAll('video[data-poster]');
  const attach = (v) => {
    if (!v.dataset.poster) return;
    v.poster = v.dataset.poster;
    delete v.dataset.poster;
  };

  if (!('IntersectionObserver' in window)) {
    videos.forEach(attach);
    return;
  }

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      attach(entry.target);
      obs.unobserve(entry.target);
    });
  }, { rootMargin: '400px' });

  videos.forEach((v) => io.observe(v));
}

function stopOtherReels(current) {
  document.querySelectorAll('.reel-card video').forEach((v) => {
    if (v === current) return;
    v.pause();
    v.controls = false;
    v.closest('.reel-card')?.classList.remove('is-playing');
  });
}

async function renderReels() {
  const rail = document.getElementById('reelRail');
  if (!rail) return;
  let reels = [];
  try {
    const res = await fetch(assetUrl('data/reels.json'));
    reels = await res.json();
  } catch {
    /* chưa có file danh sách clip — bỏ hẳn khu này thay vì để một khung trống */
  }
  if (!Array.isArray(reels) || !reels.length) {
    document.getElementById('reels')?.remove();
    return;
  }
  /* Trang chủ chỉ là một tuyển chọn. Phần còn lại thuộc Fanpage, tránh
     biến website thành một feed video dài và làm loãng đường đến tư vấn. */
  reels = reels.slice(0, 6);
  rail.innerHTML = reels.map(reelCardHTML).join('');
  initReelPosters(rail);

  rail.addEventListener('click', (e) => {
    if (e.target.closest('.reel-link')) return;
    const card = e.target.closest('.reel-card');
    if (!card) return;
    const video = card.querySelector('video');
    if (!video) return;
    if (video.paused) {
      stopOtherReels(video);
      /* Bấm là một thao tác thật của khách nên bật tiếng được ngay — clip lên
         mẫu có lời giới thiệu, tắt tiếng thì mất một nửa nội dung. */
      video.muted = false;
      video.controls = true;
      card.classList.add('is-playing');
      video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
    } else {
      video.pause();
      card.classList.remove('is-playing');
    }
  });

  /* Cuộn qua chỗ khác thì clip tự dừng — không để tiếng nói đuổi theo khách. */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;
        const video = entry.target.querySelector('video');
        if (video && !video.paused) {
          video.pause();
          entry.target.classList.remove('is-playing');
        }
      });
    }, { threshold: 0.25 });
    rail.querySelectorAll('.reel-card').forEach((card) => io.observe(card));
  }
}

/* ---------- Cursor tilt on product media ---------- */
function initTilt() {
  const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsHover || prefersReduced) return;

  const SELECTOR = '.featured-media';
  const MAX_DEG = 4;

  document.addEventListener('mousemove', (e) => {
    if (!(e.target instanceof Element)) return;
    const target = e.target.closest(SELECTOR);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    target.style.transition = 'transform 60ms linear';
    target.style.transform = `perspective(800px) rotateX(${(-py * MAX_DEG).toFixed(2)}deg) rotateY(${(px * MAX_DEG).toFixed(2)}deg) scale3d(1.01,1.01,1.01)`;
  });

  document.addEventListener('mouseout', (e) => {
    if (!(e.target instanceof Element)) return;
    const target = e.target.closest(SELECTOR);
    if (!target || (e.relatedTarget instanceof Node && target.contains(e.relatedTarget))) return;
    target.style.transition = 'transform 400ms var(--ease-out)';
    target.style.transform = '';
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initLightbox();
  initInfoModal();
  initConsultLinks();
  initCart();
  initTilt();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

productsReady.then(() => {
  /* initHeroPhoto đọc PHOTO_SIZES, mà bảng này chỉ có sau khi loadProducts()
     trong js/data.js fetch xong data/photo-sizes.json. Trước đây hàm được gọi
     ở DOMContentLoaded — luôn chạy TRƯỚC lúc fetch trả về, nên PHOTO_SIZES
     còn rỗng và việc thay ảnh hero không bao giờ xảy ra. Chờ đúng promise
     productsReady, giống các trang khác. */
  initHeroPhoto();
  initProductSection();
  renderFeatured();
  renderCollectionShowcase();
  renderReels();
});
