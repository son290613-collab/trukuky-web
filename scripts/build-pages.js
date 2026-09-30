/* ==========================================================================
   TRUKUKY — Sinh shop.html (Tất cả sản phẩm) và sale.html (Giảm giá)

   Hai trang này dùng lại NGUYÊN VĂN phần đầu trang, menu, chân trang, khung
   xem nhanh và modal của index.html. Viết tay ba bản sao là cách chắc chắn
   nhất để một hôm nào đó menu ở trang chủ có mục mới còn hai trang kia thì
   không — nên chúng được cắt ra từ index.html mỗi lần build.

   Chạy lại mỗi khi index.html đổi phần khung:  npm run build:pages
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE_URL = (process.env.SITE_URL || 'https://son290613-collab.github.io/trukuky-web').replace(/\/$/, '');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const slice = (from, to) => {
  const a = index.indexOf(from);
  const b = index.indexOf(to, a);
  if (a < 0 || b < 0) throw new Error(`Không cắt được khối: ${from.slice(0, 40)}`);
  return index.slice(a, b);
};

/* Phần khung: từ sau <body> tới trước <main>, và từ sau </main> tới </body>. */
const chromeTop = slice('<svg width="0"', '<main id="main">');
const chromeBottom = slice('</main>', '</body>');

/* Khối <link> css/font dùng chung — lấy nguyên để version ?v= không lệch. */
const assets = slice('<link rel="preload" href="fonts/fraunces-roman.woff2"', '<script type="application/ld+json">')
  .replace(/<link rel="preload" as="image"[\s\S]*?>\n/, ''); // preload ảnh hero chỉ đúng cho trang chủ

const ICON = index.match(/<link rel="icon"[^>]*>/)[0];

/* #reels, #contact, #collections chỉ tồn tại trên trang chủ. Trên hai trang
   này, cùng một cái menu phải trỏ về index.html — nếu không, bấm "Video" ở
   trang Sale sẽ không xảy ra chuyện gì và khách tưởng web hỏng. */
function retargetAnchors(html) {
  return html.replace(/href="#(reels|contact|collections|top)"/g, 'href="index.html#$1"');
}

/* Trang nào đang mở thì mục đó sáng trên menu. */
function markCurrent(html, href) {
  return html
    .replace(/ class="is-current"/g, '')
    .replace(new RegExp(`(<a href="${href}"(?: class="([^"]*)")?)`, 'g'),
      (m, head, cls) => (cls ? `<a href="${href}" class="${cls} is-current"` : `<a href="${href}" class="is-current"`));
}

function page({ file, scope, href, title, desc, h1, eyebrow, lead, extra = '' }) {
  const top = markCurrent(retargetAnchors(chromeTop), href)
    .replace(/href="#products">Mới về</g, 'href="index.html#products">Mới về<');
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="canonical" href="${SITE_URL}/${file}">
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Trukuky">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${SITE_URL}/images/products/p01.jpg">
<meta property="og:url" content="${SITE_URL}/${file}">
<meta name="twitter:card" content="summary_large_image">
${ICON}
${assets.trim()}
</head>
<body data-scope="${scope}">
${top}<main id="main">

  <section class="section container catalog-head" id="products">
    <div class="section-head section-head--row">
      <div>
        <span class="eyebrow${scope === 'sale' ? ' eyebrow-sale' : ''}">${eyebrow}</span>
        <h1 class="catalog-title">${h1}</h1>
        <p class="section-lead">${lead}</p>
      </div>
      <div class="section-head-actions">
        <button type="button" class="btn btn-ghost-pink btn-sm" data-info="size">Bảng size</button>
        <button type="button" class="btn btn-ghost-pink btn-sm" data-info="order">Cách đặt hàng</button>
      </div>
    </div>
${extra}
    <div class="filter-chips" id="filterChips" role="group" aria-label="Lọc sản phẩm"></div>
    <div class="grid-toolbar">
      <p class="grid-count" id="gridCount"></p>
      <div class="density-toggle" id="densityToggle" role="group" aria-label="Cỡ ảnh trong lưới">
        <button type="button" data-density="roomy" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
          Ảnh lớn
        </button>
        <button type="button" data-density="dense" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="10" y="3" width="5" height="5" rx="1"/><rect x="17" y="3" width="4" height="5" rx="1"/><rect x="3" y="10" width="5" height="5" rx="1"/><rect x="10" y="10" width="5" height="5" rx="1"/><rect x="17" y="10" width="4" height="5" rx="1"/><rect x="3" y="17" width="5" height="4" rx="1"/><rect x="10" y="17" width="5" height="4" rx="1"/><rect x="17" y="17" width="4" height="4" rx="1"/></svg>
          Xem nhiều
        </button>
      </div>
    </div>
    <div class="frame-grid" id="productGrid"></div>
  </section>

${scope === 'shop' ? `  <!-- Mẫu đã có ảnh nhưng shop chưa gửi bảng giá: để riêng, không lẫn vào
       lưới bán hàng, và không có nút mua. Khách không bao giờ bấm vào một
       thẻ hàng rồi mới phát hiện ra là không mua được. -->
  <section class="section container pending-section" id="pending" hidden>
    <div class="section-head">
      <span class="eyebrow">Sắp lên kệ</span>
      <h2>Đang chờ Trukuky chốt giá</h2>
      <p class="section-lead">Những mẫu này đã có ảnh nhưng chưa có bảng giá chính thức, nên website chưa mở bán. Xem trước ở đây, shop sẽ mở bán ngay khi chốt xong giá.</p>
    </div>
    <div class="frame-grid pending-grid" id="pendingGrid"></div>
  </section>
` : ''}</main>
${retargetAnchors(chromeBottom)}</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, file), html);
  console.log(`✓ ${file}`);
}

page({
  file: 'shop.html',
  scope: 'shop',
  href: 'shop.html',
  title: 'Tất cả sản phẩm — Trukuky',
  desc: 'Toàn bộ quần áo, giày và phụ kiện mẹ & bé gái đang bán tại Trukuky, 43 Lê Chân, Hải Phòng. Lọc theo độ tuổi, đồ đôi, phụ kiện và hàng giảm giá.',
  h1: 'Tất cả sản phẩm',
  eyebrow: 'Cửa hàng Trukuky',
  lead: 'Toàn bộ mẫu đang bán, kể cả các buổi live trước. Lọc theo độ tuổi hoặc nhóm hàng, chọn size rồi thêm vào giỏ.',
});

page({
  file: 'sale.html',
  scope: 'sale',
  href: 'sale.html',
  title: 'Đang giảm giá — Trukuky',
  desc: 'Các mẫu quần áo mẹ & bé gái Trukuky đang giảm giá. Giá giảm do shop công bố trong buổi live, size còn hạn chế.',
  h1: 'Đang giảm giá',
  eyebrow: 'Sale',
  lead: 'Các mẫu Trukuky đã công bố giảm giá trong buổi live. Size còn lại có hạn — shop đối chiếu sổ và gọi xác nhận trước khi gửi hàng.',
  extra: `    <p class="sale-note">Giá gạch ngang là giá Trukuky niêm yết trước khi giảm. Mẫu chưa có giá gốc trên hệ thống thì chỉ hiện giá đang bán, không hiện phần trăm.</p>
`,
});
