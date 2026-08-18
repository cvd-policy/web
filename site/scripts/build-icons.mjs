// Draws the icon and writes favicon.svg, favicon.ico, favicon-32.png and
// apple-touch-icon.png into public/.
//
// The shapes are defined once, in a unit square, and rasterised here — so there
// is no binary asset in the repository that nobody can edit.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const TEAL = [0x2d, 0x5f, 0x5d];
const WHITE = [0xff, 0xff, 0xff];

// A page with a folded corner: a file that states something, not a seal of
// approval. The corner and the single rule stay legible down to 16 px.
const PAGE = [
  [0.32, 0.23],
  [0.58, 0.23],
  [0.72, 0.37],
  [0.72, 0.77],
  [0.32, 0.77],
];
const RULE = { x0: 0.4, x1: 0.64, y0: 0.55, y1: 0.61 };
const RADIUS = 0.18;

const inPolygon = (x, y, points) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/** Rounded square covering the whole tile. */
function inTile(x, y) {
  const dx = Math.max(RADIUS - x, x - (1 - RADIUS), 0);
  const dy = Math.max(RADIUS - y, y - (1 - RADIUS), 0);
  return dx * dx + dy * dy <= RADIUS * RADIUS;
}

/** Colour and coverage of one sample point. */
function sample(x, y) {
  if (!inTile(x, y)) return null;
  const onPage = inPolygon(x, y, PAGE);
  const onRule = x >= RULE.x0 && x <= RULE.x1 && y >= RULE.y0 && y <= RULE.y1;
  return onPage && !onRule ? WHITE : TEAL;
}

/** Renders the icon into an RGBA buffer, 4x4 supersampled. */
function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const steps = 4;
  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let hits = 0;
      for (let sy = 0; sy < steps; sy += 1) {
        for (let sx = 0; sx < steps; sx += 1) {
          const colour = sample((px + (sx + 0.5) / steps) / size, (py + (sy + 0.5) / steps) / size);
          if (!colour) continue;
          r += colour[0];
          g += colour[1];
          b += colour[2];
          hits += 1;
        }
      }
      const total = steps * steps;
      const offset = (py * size + px) * 4;
      if (hits > 0) {
        pixels[offset] = Math.round(r / hits);
        pixels[offset + 1] = Math.round(g / hits);
        pixels[offset + 2] = Math.round(b / hits);
        pixels[offset + 3] = Math.round((hits / total) * 255);
      }
    }
  }
  return pixels;
}

// --- PNG ---------------------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size) {
  const pixels = render(size);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // truecolour with alpha
  // Each scanline carries a filter byte; 0 means "store as is".
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- ICO (a container around the 32 px PNG) ----------------------------

function ico(pngData, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry[0] = size;
  entry[1] = size;
  entry[2] = 0; // palette
  entry[4] = 1; // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngData.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, pngData]);
}

// --- SVG ---------------------------------------------------------------

const points = PAGE.map(([x, y]) => `${(x * 64).toFixed(1)},${(y * 64).toFixed(1)}`).join(" ");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="CVD Policy Format">
  <rect width="64" height="64" rx="${(RADIUS * 64).toFixed(1)}" fill="#2d5f5d" />
  <polygon points="${points}" fill="#ffffff" />
  <rect x="${(RULE.x0 * 64).toFixed(1)}" y="${(RULE.y0 * 64).toFixed(1)}" width="${((RULE.x1 - RULE.x0) * 64).toFixed(1)}" height="${((RULE.y1 - RULE.y0) * 64).toFixed(1)}" fill="#2d5f5d" />
</svg>
`;

mkdirSync(publicDir, { recursive: true });
const png32 = png(32);
writeFileSync(join(publicDir, "favicon.svg"), svg);
writeFileSync(join(publicDir, "favicon-32.png"), png32);
writeFileSync(join(publicDir, "apple-touch-icon.png"), png(180));
writeFileSync(join(publicDir, "favicon.ico"), ico(png32, 32));

console.log("icons written: favicon.svg, favicon.ico, favicon-32.png, apple-touch-icon.png");
