/* ==========================================================================
   TRUKUKY — Đọc kích thước thật của mọi ảnh trong images/products
   Ghi ra data/photo-sizes.json — nguồn duy nhất để trang web và trình sinh
   trang chi tiết biết tỉ lệ gốc của từng khung ảnh, nhờ đó không ô ảnh nào
   phải cắt cạnh cho vừa một aspect-ratio dựng sẵn.

   Chạy lại mỗi khi thêm/đổi ảnh:  npm run photos
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'images', 'products');
const OUT = path.join(ROOT, 'data', 'photo-sizes.json');

/* Đọc kích thước từ khung SOF của JPEG — không cần thư viện ngoài. */
function jpegSize(buf) {
  if (buf.readUInt16BE(0) !== 0xffd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    /* SOF0..SOF15, bỏ qua DHT(c4) DAC(cc) và các RSTn */
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

const sizes = {};
for (const file of fs.readdirSync(DIR).sort()) {
  if (!/\.jpe?g$/i.test(file)) continue;
  const size = jpegSize(fs.readFileSync(path.join(DIR, file)));
  if (size) sizes[file] = [size.w, size.h];
  else console.warn(`Không đọc được kích thước: ${file}`);
}

fs.writeFileSync(OUT, `${JSON.stringify(sizes, null, 2)}\n`);
console.log(`Đã ghi ${Object.keys(sizes).length} kích thước ảnh vào data/photo-sizes.json`);
