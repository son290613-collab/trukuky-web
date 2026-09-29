/* ==========================================================================
   TRUKUKY — Sinh sitemap.xml
   Chạy tự động trong: npm run build

   Trước file này site không có sitemap lẫn robots.txt, nên Google phải tự dò
   ra 19 trang sản phẩm bằng cách bò theo link — trong khi lưới sản phẩm lại
   do JavaScript dựng. Sitemap là đường ngắn nhất để 19 trang đó được lập chỉ mục.
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/* Mặc định PHẢI là địa chỉ site đang chạy thật. Trước đây mặc định là
   https://trukuky.vn — tên miền chưa hoạt động — nên chỉ cần quên biến
   SITE_URL một lần là toàn bộ canonical, og:url và sitemap trỏ sang một
   domain chết, và Google lập chỉ mục nhầm. Có tên miền riêng thì đổi
   dòng này, hoặc chạy kèm SITE_URL=... */
const SITE_URL = (process.env.SITE_URL || 'https://son290613-collab.github.io/trukuky-web').replace(/\/$/, '');
const products = require(path.join(ROOT, 'data/products.json'));

const today = new Date().toISOString().slice(0, 10);

/* Trang Chăm sóc khách hàng là trang nội dung thật (bảng size, phí ship, đổi
   hàng) — đúng những thứ khách mẹ&bé tìm trên Google trước khi quyết định mua,
   nên nó vào sitemap. Chỉ thêm khi file có thật, để sitemap không bao giờ trỏ
   vào một URL 404. */
const CARE_PAGE = 'cham-soc-khach-hang.html';
const carePage = fs.existsSync(path.join(ROOT, CARE_PAGE))
  ? [{ loc: `${SITE_URL}/${CARE_PAGE}`, priority: '0.7', changefreq: 'monthly' }]
  : [];

const urls = [
  { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' },
  ...carePage,
  ...products.map((p) => ({
    loc: `${SITE_URL}/p/${p.id}.html`,
    priority: '0.8',
    changefreq: 'weekly',
  })),
];

/* Giỏ hàng và thanh toán KHÔNG vào sitemap: đó là trang thao tác, không phải
   trang nội dung, và lập chỉ mục chúng chỉ làm loãng kết quả tìm kiếm. */

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`Đã sinh sitemap.xml với ${urls.length} URL (SITE_URL=${SITE_URL})`);
