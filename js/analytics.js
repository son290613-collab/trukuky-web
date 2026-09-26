/* ========================================================================== 
   TRUKUKY — privacy-first measurement scaffold

   Không tải nhà cung cấp phân tích, không đặt cookie và không gửi dữ liệu qua
   mạng. Sự kiện chỉ được đưa vào window.dataLayer để đội vận hành có thể nối
   một nền tảng đã duyệt sau khi hoàn tất chính sách riêng tư/consent.
   ========================================================================== */
(function initTrukukyMeasurement() {
  const queue = window.dataLayer = window.dataLayer || [];
  const seenSections = new Set();

  function clean(value) {
    if (value == null) return undefined;
    return String(value).slice(0, 120);
  }

  window.trackTrukuky = function trackTrukuky(eventName, properties) {
    const safe = {};
    Object.entries(properties || {}).forEach(([key, value]) => {
      const next = clean(value);
      if (next !== undefined && next !== '') safe[key] = next;
    });
    queue.push({
      event: clean(eventName),
      event_time: new Date().toISOString(),
      page_path: location.pathname,
      ...safe,
    });
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a, button');
    if (!target) return;

    const href = target.getAttribute('href') || '';
    if (/facebook\.com\/trukuky/i.test(href)) {
      window.trackTrukuky('click_facebook', { placement: target.closest('footer') ? 'footer' : 'page' });
    } else if (/m\.me\/trukuky/i.test(href)) {
      window.trackTrukuky('click_messenger', {
        placement: target.closest('.lightbox') ? 'quick_view' : target.closest('footer') ? 'footer' : 'page',
        product_id: target.dataset.consultProduct,
      });
    }

    const quick = target.closest('[data-lightbox], [data-frame], [data-hotspot]');
    if (quick) {
      window.trackTrukuky('open_product_quickview', {
        product_id: quick.dataset.id || quick.dataset.hotspot,
        frame: quick.dataset.frame ? 'group' : 'single',
      });
    }

    const collection = target.closest('[data-collection]');
    if (collection) window.trackTrukuky('select_collection', { collection_id: collection.dataset.collection });

    const filter = target.closest('[data-chip], [data-filter]');
    if (filter) window.trackTrukuky('select_product_filter', { filter: filter.dataset.chip || filter.dataset.filter });

    const reel = target.closest('.reel-card');
    if (reel && !target.closest('.reel-link')) {
      window.trackTrukuky('play_product_video', { reel_id: reel.dataset.reel });
    }
  });

  const sections = [
    ['products', 'view_new_arrivals'],
    ['reels', 'view_product_video_section'],
    ['collections', 'view_collection_section'],
    ['contact', 'view_store_info'],
  ];

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seenSections.has(entry.target.id)) return;
        seenSections.add(entry.target.id);
        const item = sections.find(([id]) => id === entry.target.id);
        if (item) window.trackTrukuky(item[1]);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.25 });
    sections.forEach(([id]) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }
})();
