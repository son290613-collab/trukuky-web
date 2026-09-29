/* ==========================================================================
   TRUKUKY — Product catalog loader
   Fetches data/products.json (single source of truth, also read server-side
   by api/orders.js) and derives the arrays + filters the pages render.
   ========================================================================== */

/* Trang chi tiết nằm trong /p/ nên mọi đường dẫn tương đối phải quy về gốc
   site — lấy từ chính src của file này (<gốc>/js/data.js). */
const SITE_ROOT = (() => {
  const src = document.currentScript && document.currentScript.src;
  return src ? new URL('../', src).href : new URL('./', document.baseURI).href;
})();

function assetUrl(path) {
  return new URL(path, SITE_ROOT).href;
}

let PRODUCTS = [];
let PRODUCTS_BY_ID = {};
let NEW_ARRIVALS = [];

const STORE_MESSENGER = 'https://m.me/trukuky';

function formatVND(n) {
  return `${Number(n).toLocaleString('vi-VN')}₫`;
}

/* ---------- Filters ----------
   Một khu sản phẩm duy nhất thay cho "Mới về" + "Bộ sưu tập" + "Album":
   mọi lối vào (chip, menu, ô danh mục, link chia sẻ) đều quy về một key ở đây. */
const PRODUCT_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'live', label: 'Mẫu live còn size' },
  { key: 'new', label: 'Mới về' },
  { key: 'matching', label: 'Đồ đôi Mẹ & Bé' },
  { key: 'accessories', label: 'Phụ kiện' },
  { key: 'age:1-3T', label: 'Bé gái 1–3T' },
  { key: 'age:4-6T', label: 'Bé gái 4–6T' },
  { key: 'age:7-12T', label: 'Bé gái 7–12T' },
];

/* "girls" vẫn là key hợp lệ cho link menu và link chia sẻ, chỉ không cần một
   chip riêng vì ba chip độ tuổi ở trên đã phủ hết. */
const EXTRA_FILTER_LABELS = { girls: 'Bé gái', accessories: 'Phụ kiện', all: 'Tất cả' };

/* ---------- Kích thước thật của từng khung ảnh ----------
   Không có tấm nào bị cắt: mỗi ô ảnh trên trang lấy đúng tỉ lệ gốc ở đây
   thay vì bị ép vào một aspect-ratio cố định. Cả 16 ảnh đều cao 1400px —
   nhờ vậy một hàng ảnh vẫn có thể cao bằng nhau mà không cần cắt cạnh nào,
   chỉ cần cho chiều rộng thay đổi theo tỉ lệ.
   Đọc từ data/photo-sizes.json — sinh ra bằng: npm run photos  */
let PHOTO_SIZES = {};

/* Mọi ảnh gốc đều cao 1400px và dọc; nếu vì lý do nào đó chưa đọc được kích
   thước thật thì rơi về tỉ lệ dọc trung bình, và object-fit: contain trong
   CSS đảm bảo ảnh chỉ thừa viền chứ không bao giờ bị cắt. */
const DEFAULT_RATIO = 1023 / 1400;

function photoRatio(src) {
  const size = PHOTO_SIZES[String(src || '').split('/').pop()];
  return size ? size[0] / size[1] : DEFAULT_RATIO;
}

/* ---------- Ảnh AVIF nhiều bề rộng ----------
   Bản AVIF được sinh sẵn lúc build bằng: npm run images (scripts/build-images.py).
   Cùng bề rộng, AVIF nhẹ hơn JPEG khoảng bốn lần — cả bộ 35 ảnh giảm từ 7.136 KB
   xuống 1.553 KB. Trình duyệt chưa đọc được AVIF (Safari dưới 16.4) rơi về đúng
   file JPEG gốc trong thẻ <img>, không ai thấy ảnh vỡ.

   Danh sách bề rộng dưới đây PHẢI khớp với WIDTHS trong scripts/build-images.js;
   sửa một bên thì sửa cả bên kia, nếu không srcset sẽ trỏ vào file không tồn tại. */
const IMAGE_WIDTHS = [480, 800, 1400];

function avifVariants(src) {
  const file = String(src || '').split('/').pop();
  const size = PHOTO_SIZES[file];
  if (!size) return null;
  const [w] = size;
  const dir = String(src).replace(/[^/]+$/, '');
  const base = file.replace(/\.jpe?g$/i, '');
  const widths = IMAGE_WIDTHS.filter((x) => x < w);
  if (!widths.includes(Math.min(w, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]))) widths.push(w);
  return widths.map((x) => `${assetUrl(`${dir}avif/${base}-${x}.avif`)} ${x}w`).join(', ');
}

/* sizes mặc định bám theo lưới thật: điện thoại hai cột, tablet ba, desktop bốn. */
const GRID_SIZES = '(max-width: 620px) 46vw, (max-width: 1100px) 31vw, 23vw';

function pictureHTML(src, alt, opts = {}) {
  const { sizes = GRID_SIZES, loading = 'lazy', priority = false, imgAttrs = '' } = opts;
  const size = PHOTO_SIZES[String(src || '').split('/').pop()];
  const dim = size ? ` width="${size[0]}" height="${size[1]}"` : '';
  const srcset = avifVariants(src);
  const img = `<img src="${assetUrl(src)}" alt="${escAttr(alt || '')}"${dim}`
    + (priority ? ' fetchpriority="high"' : ` loading="${loading}"`)
    + ` decoding="async"${imgAttrs ? ` ${imgAttrs}` : ''}>`;
  if (!srcset) return img;
  return `<picture><source type="image/avif" srcset="${srcset}" sizes="${sizes}">${img}</picture>`;
}

/* Ngoài chip, các ô danh mục còn lọc theo độ tuổi: key dạng "age:4-6T". */
function matchesFilter(product, key) {
  if (!key || key === 'all') return true;
  if (key.startsWith('age:')) return (product.ages || []).includes(key.slice(4));
  return (product.sections || []).includes(key);
}

function filterProducts(key) {
  return PRODUCTS.filter((p) => matchesFilter(p, key));
}

function countProducts(key) {
  return filterProducts(key).length;
}

/* ---------- Khung ảnh ----------
   Một tấm ảnh chỉ được xuất hiện đúng một lần trên trang. Hai tấm bày nhóm
   (p07, p08) chứa nhiều món cùng lúc, nên thay vì cắt ảnh ra thành từng món
   — cách làm cũ, khiến đôi giày trong góc khung bị tách ra thành một "sản
   phẩm phụ kiện" riêng — cả nhóm giữ nguyên một khung và mỗi món được đánh
   dấu bằng một chấm hotspot đặt đúng vị trí của nó trong ảnh. */
function framesFor(list) {
  const frames = [];
  const bySrc = new Map();
  list.forEach((p) => {
    let frame = bySrc.get(p.imgA);
    if (!frame) {
      frame = { src: p.imgA, ratio: photoRatio(p.imgA), items: [], lead: p };
      bySrc.set(p.imgA, frame);
      frames.push(frame);
    }
    frame.items.push(p);
  });
  /* Món được chụp riêng ở khung khác nhưng cũng nằm trong khung này (set thể
     thao navy có ảnh riêng p05 và đồng thời nằm trong khung nhóm p08) vẫn
     được chấm lên đây — để khách bấm được, mà ảnh vẫn không bị nhân đôi. */
  frames.forEach((frame) => {
    const seen = new Set(frame.items.map((p) => p.id));
    list.forEach((p) => {
      (p.alsoIn || []).forEach((ref) => {
        if (ref.frame === frame.src && !seen.has(p.id)) {
          seen.add(p.id);
          frame.items.push({ ...p, hotspot: { x: ref.x, y: ref.y } });
        }
      });
    });
  });
  return frames;
}

function frameHotspots(frame) {
  return frame.items.filter((p) => p.hotspot);
}

/* ---------- Giá ----------
   priceStatus có ba mức, và mức nào được vào giỏ hàng là một quyết định
   kinh doanh, không phải một chi tiết kỹ thuật:

   - "confirmed"   = shop đã gửi bảng giá chính thức. Vào giỏ được.
   - "live"        = giá chính shop đã đọc công khai trong buổi livestream.
                     Đây là giá shop tự nói ra trước hàng trăm người xem, nên
                     nó vào giỏ được — nhưng luôn kèm câu "shop xác nhận lại",
                     vì size còn hàng phải đối chiếu sổ chốt đơn.
   - "provisional" = con số người làm web dựng tạm, shop CHƯA BAO GIỜ duyệt.
                     Tuyệt đối không vào giỏ, và không hiện ra như giá thật.

   Website không thu tiền: giỏ hàng chỉ soạn sẵn đơn rồi khách gửi qua
   Messenger, shop chốt giá cuối. Nhờ vậy giá "live" đủ an toàn để đặt hàng
   mà không có rủi ro thu sai tiền — thứ duy nhất phải giữ tuyệt đối là
   không bao giờ đưa một con số shop chưa từng nói ra cho khách. */
const ORDERABLE_PRICE_STATUS = ['confirmed', 'live'];

function isOrderableProduct(p) {
  return !!p
    && ORDERABLE_PRICE_STATUS.includes(p.priceStatus)
    && Number.isFinite(Number(p.price))
    && Number(p.price) > 0;
}

/* priceFrom = con số hiển thị là giá SÀN ("từ 390.000₫"), không phải giá của
   mọi size — bộ đồ đôi mẹ&bé và giày thường mỗi size một giá. 14/42 mẫu như
   vậy. Mọi chỗ cộng tổng phải gọi hàm này để gắn nhãn "tạm tính" thay vì đưa
   ra một con số nghe như đã chốt. */
function isEstimatedPrice(p) {
  return !!p && p.priceFrom === true;
}

/* Giỏ có bất kỳ dòng nào là giá sàn thì cả đơn chỉ là tạm tính. */
function cartHasEstimatedPrice(lines) {
  return (lines || []).some((l) => isEstimatedPrice(l.product));
}

function hasOrderableProducts() {
  return PRODUCTS.some(isOrderableProduct);
}

function consultLabel(p) {
  return p ? `Nhắn hỏi mẫu ${p.id}` : 'Nhắn Trukuky tư vấn';
}

function consultClipboardText(p, variant) {
  if (!p) return 'Mình muốn nhờ Trukuky tư vấn.';
  const v = variant || {};
  const details = [v.size, v.color].filter(Boolean).join(' · ');
  return `Mình muốn hỏi mẫu ${p.id} — ${p.title}${details ? ` (${details})` : ''}. Nhờ Trukuky xác nhận giá và size phù hợp.`;
}

function priceHTML(p, extraClass = '') {
  if (!p) return '';
  /* Mẫu chưa có giá shop duyệt thì không hiện con số nào — thà để khách hỏi
     còn hơn để khách nhớ một mức giá sai rồi thất vọng lúc chốt đơn. */
  if (!isOrderableProduct(p)) {
    return '<span class="price-on-request">Liên hệ xác nhận giá</span>';
  }
  /* Giá "live" giữ nguyên class price-live để CSS phân biệt được với giá đã
     chốt, và giá sàn luôn phải đi kèm chữ "Từ" — bỏ chữ đó đi là biến giá
     rẻ nhất của mẫu thành giá của mọi size. */
  const live = p.priceStatus === 'live' ? ' price-live' : '';
  const cls = `price-value${live}${extraClass ? ` ${extraClass}` : ''}`;
  return `<span class="${cls}">${isEstimatedPrice(p) ? '<small>Từ</small> ' : ''}${formatVND(p.price)}</span>`;
}

/* ---------- Dữ liệu size nháp ----------
   Các bảng dưới đây là dữ liệu vận hành cũ, chưa được shop phê duyệt. Giao
   diện công khai không dùng chúng để tư vấn cho tới khi có nguồn chính thức. */
const SIZE_GUIDES = {
  kids: {
    title: 'Bảng size bé (theo chiều cao & cân nặng)',
    head: ['Size', 'Chiều cao', 'Cân nặng', 'Tuổi tham khảo'],
    rows: [
      ['90cm', '85 – 95 cm', '12 – 14 kg', '1 – 2 tuổi'],
      ['100cm', '95 – 105 cm', '14 – 17 kg', '2 – 3 tuổi'],
      ['110cm', '105 – 115 cm', '17 – 20 kg', '4 – 5 tuổi'],
      ['120cm', '115 – 125 cm', '20 – 24 kg', '5 – 6 tuổi'],
      ['130cm', '125 – 135 cm', '24 – 28 kg', '7 – 8 tuổi'],
      ['140cm', '135 – 145 cm', '28 – 33 kg', '9 – 10 tuổi'],
      ['150cm', '145 – 155 cm', '33 – 38 kg', '11 – 12 tuổi'],
    ],
    note: 'Bé có dáng mũm mĩm nên chọn lên một size. Nhắn số đo cho Trukuky qua Messenger nếu bé nằm giữa hai size.',
  },
  matching: {
    title: 'Bảng size đồ đôi Mẹ & Bé',
    head: ['Size', 'Dành cho', 'Chiều cao', 'Cân nặng'],
    rows: [
      ['Bé 100cm', 'Bé', '95 – 105 cm', '14 – 17 kg'],
      ['Bé 110cm', 'Bé', '105 – 115 cm', '17 – 20 kg'],
      ['Bé 120cm', 'Bé', '115 – 125 cm', '20 – 24 kg'],
      ['Bé 130cm', 'Bé', '125 – 135 cm', '24 – 28 kg'],
      ['Mẹ S', 'Mẹ', '150 – 158 cm', '45 – 52 kg'],
      ['Mẹ M', 'Mẹ', '155 – 163 cm', '52 – 58 kg'],
      ['Mẹ L', 'Mẹ', '160 – 168 cm', '58 – 65 kg'],
    ],
    note: 'Set đồ đôi được may riêng hai form — chọn một size cho mẹ và một size cho bé (đặt hai lần, mỗi lần một size).',
  },
  shoes: {
    title: 'Bảng size giày trẻ em',
    head: ['Size', 'Dài bàn chân', 'Tuổi tham khảo', ''],
    rows: [
      ['28', '17.5 cm', '3 – 4 tuổi', ''],
      ['29', '18.0 cm', '4 – 5 tuổi', ''],
      ['30', '18.5 cm', '5 – 6 tuổi', ''],
      ['31', '19.5 cm', '6 – 7 tuổi', ''],
      ['32', '20.0 cm', '7 – 8 tuổi', ''],
      ['33', '21.0 cm', '8 – 9 tuổi', ''],
    ],
    note: 'Đo từ gót đến đầu ngón chân dài nhất khi bé đứng, cộng thêm 0.5 cm để bé đi thoải mái.',
  },
};

function sizeGuideFor(product) {
  return product && product.sizeGuide && SIZE_GUIDES[product.sizeGuide] ? SIZE_GUIDES[product.sizeGuide] : null;
}

/* Sản phẩm có nhiều hơn một lựa chọn thì bắt buộc chọn trước khi vào giỏ. */
function needsVariantChoice(product) {
  if (!product) return false;
  return (product.sizes || []).length > 1 || (product.colors || []).length > 1;
}

function defaultVariant(product) {
  return {
    size: (product.sizes || []).length === 1 ? product.sizes[0] : '',
    color: (product.colors || []).length === 1 ? product.colors[0].name : '',
  };
}

function productUrl(id) {
  return assetUrl(`p/${id}.html`);
}

async function loadProducts() {
  const [catalog, photos, groups] = await Promise.allSettled([
    fetch(assetUrl('data/products.json')).then((r) => r.json()),
    fetch(assetUrl('data/photo-sizes.json')).then((r) => r.json()),
    fetch(assetUrl('data/collections.json')).then((r) => r.json()),
  ]);
  if (catalog.status === 'fulfilled') {
    PRODUCTS = catalog.value;
  } else {
    console.error('Không tải được danh mục sản phẩm', catalog.reason);
    PRODUCTS = [];
  }
  if (photos.status === 'fulfilled') PHOTO_SIZES = photos.value;
  PRODUCTS_BY_ID = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  NEW_ARRIVALS = filterProducts('new');
  COLLECTIONS = buildCollections(groups.status === 'fulfilled' ? groups.value : null);
}

/* ---------- Bộ sưu tập ----------
   19 sản phẩm trước đây đổ hết vào MỘT lưới phẳng. Khi mọi thứ cùng một cấp
   thì không có gì là quan trọng — khách phải tự đọc 19 cái tên để hiểu shop
   bán gì. Bộ sưu tập cho mỗi nhóm một cái tên và một câu dẫn, tức là shop
   nói giúp khách "bộ này dành cho lúc nào".

   Danh sách nằm trong data/collections.json để shop tự sửa được lời dẫn mà
   không đụng vào code. Sản phẩm không được xếp vào bộ nào sẽ tự dồn xuống
   một mục cuối, nên thêm hàng mới vào products.json không bao giờ làm nó
   biến mất khỏi trang. */
let COLLECTIONS = [];

function buildCollections(raw) {
  const defined = (raw && Array.isArray(raw.collections)) ? raw.collections : [];
  const seen = new Set();
  const out = [];

  defined.forEach((c) => {
    const items = (c.items || []).map((id) => PRODUCTS_BY_ID[id]).filter(Boolean);
    items.forEach((p) => seen.add(p.id));
    if (items.length) out.push({ id: c.id, title: c.title, lead: c.lead || '', items });
  });

  const rest = PRODUCTS.filter((p) => !seen.has(p.id));
  if (rest.length) {
    out.push({ id: 'khac', title: 'Mới xếp vào kho', lead: '', items: rest });
  }
  return out;
}

/* A promise, not an event — a page's own <script> may finish loading only
   after loadProducts() has already resolved (fast local fetch racing the
   next script tag's network fetch), so listening for a dispatched event can
   miss it. .then() on this always fires, no matter when it's attached. */
const productsReady = loadProducts();
