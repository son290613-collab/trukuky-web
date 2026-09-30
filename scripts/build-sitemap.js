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
const SITE_URL = (process.env.SITE_URL || 'https://trukuky.vn').replace(/\/$/, '');
const products = require(path.join(ROOT, 'data/products.json'));

const today = new Date().toISOString().slice(0, 10);

/* Trang chi tiết chỉ vào sitemap khi mẫu đó bán được — mẫu đang chờ chốt giá
   mà được lập chỉ mục thì khách vào từ Google sẽ rơi thẳng vào một trang
   không mua được, và đó là loại lượt truy cập tệ nhất. */
const sellable = (p) => ['confirmed', 'live'].includes(p.priceStatus) && Number(p.price) > 0;

const urls = [
  { loc: `${SITE_URL}/`, priority: '1.0', changefreq: 'weekly' },
  { loc: `${SITE_URL}/shop.html`, priority: '0.9', changefreq: 'weekly' },
  { loc: `${SITE_URL}/sale.html`, priority: '0.9', changefreq: 'weekly' },
  ...products.filter(sellable).map((p) => ({
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
