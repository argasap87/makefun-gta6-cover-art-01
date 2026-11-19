/* V12 Neon Heist — GTA 6 Cover Maker.
   Plain static app, no libraries, no network. One canvas renderer draws
   every cover (preview and PNG export share it), so what you see is what
   you get. Original art only: the sunset, the giant "6", the car and the
   city are all drawn in code. */
'use strict';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const GRADES = {
  neon: {
    sky: [[0, '#1a0b2e'], [0.38, '#7a145a'], [0.58, '#ff2e88'], [0.78, '#ff7a18'], [1, '#ffc45e']],
    sun: '#fff3c4', six: '#00c8ff', tint: 'rgba(255,46,136,0.16)',
  },
  sunset: {
    sky: [[0, '#2b0a3d'], [0.4, '#a3134f'], [0.62, '#ff4d2e'], [0.82, '#ff9a1f'], [1, '#ffe08a']],
    sun: '#fff8d8', six: '#00e5ff', tint: 'rgba(255,90,30,0.14)',
  },
  midnight: {
    sky: [[0, '#050718'], [0.45, '#101a4a'], [0.65, '#27407e'], [0.85, '#7a2d8f'], [1, '#ff5e7a']],
    sun: '#cfe8ff', six: '#7df9ff', tint: 'rgba(60,90,255,0.18)',
  },
};

const state = {
  layout: 'hero',
  grade: 'neon',
  size: '1080x1080',
  title: 'GTA VI',
  tagline: '1 CAR. 1 LIGHT. 6 WAYS OUT.',
  badge: 'V12 NEON HEIST',
  photos: [null, null, null, null], // {img, zoom, ox, oy}
  active: 0,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ---------- scene pieces ---------- */

function drawSky(ctx, W, H) {
  const g = GRADES[state.grade];
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  for (const [t, c] of g.sky) grad.addColorStop(t, c);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // sun disc, low on the horizon
  ctx.fillStyle = g.sun;
  ctx.beginPath();
  ctx.arc(W * 0.5, H * 0.52, H * 0.17, 0, Math.PI * 2);
  ctx.fill();
  // sun glow (soft, behind everything else)
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.52, H * 0.05, W * 0.5, H * 0.52, H * 0.34);
  glow.addColorStop(0, 'rgba(255,190,90,0.35)');
  glow.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawPhotoCover(ctx, photo, x, y, w, h) {
  if (!photo || !photo.img) return false;
  const iw = photo.img.naturalWidth, ih = photo.img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * photo.zoom;
  const dw = iw * scale, dh = ih * scale;
  const dx = x + (w - dw) / 2 + photo.ox * w;
  const dy = y + (h - dh) / 2 + photo.oy * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(photo.img, dx, dy, dw, dh);
  ctx.fillStyle = GRADES[state.grade].tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  return true;
}

function drawSix(ctx, W, H, size, cx, cy, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GRADES[state.grade].six;
  ctx.font = `900 ${Math.round(size)}px "Arial Black", "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('6', cx, cy);
  ctx.restore();
}

function drawCity(ctx, W, H) {
  const rand = mulberry32(6);
  const base = H * 0.86;
  ctx.fillStyle = '#12061f';
  let x = -W * 0.02;
  while (x < W) {
    const bw = W * (0.06 + rand() * 0.1);
    const bh = H * (0.08 + rand() * 0.16);
    ctx.fillRect(x, base - bh, bw, bh);
    // lit windows
    for (let wy = base - bh + H * 0.015; wy < base - H * 0.01; wy += H * 0.028) {
      for (let wx = x + W * 0.012; wx < x + bw - W * 0.01; wx += W * 0.022) {
        if (rand() < 0.22) {
          ctx.fillStyle = rand() < 0.6 ? '#ffc45e' : (rand() < 0.5 ? '#00c8ff' : '#ff2e88');
          ctx.fillRect(wx, wy, W * 0.008, H * 0.011);
          ctx.fillStyle = '#12061f';
        }
      }
    }
    x += bw + W * 0.008;
  }
}

function drawCar(ctx, W, H, cx, cy, scale) {
  // Sports car, side profile facing right, in a 1000x300 local box.
  ctx.save();
  ctx.translate(cx - 500 * scale, cy - 150 * scale);
  ctx.scale(scale, scale);
  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(500, 268, 470, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  // body
  const body = new Path2D(
    'M985 200 L860 168 L740 148 L640 112 L520 98 L400 100 L280 128 ' +
    'L150 160 L40 185 L15 215 L20 250 L985 250 Z');
  ctx.fillStyle = '#0b0710';
  ctx.fill(body);
  // red paint sheen along the flank
  const sheen = new Path2D(
    'M60 200 L300 172 L700 162 L950 192 L962 224 L700 240 L200 240 L60 224 Z');
  const sg = ctx.createLinearGradient(60, 0, 960, 0);
  sg.addColorStop(0, '#8f0300');
  sg.addColorStop(0.5, '#e10600');
  sg.addColorStop(1, '#ff3b1f');
  ctx.fillStyle = sg;
  ctx.fill(sheen);
  // cabin glass
  ctx.fillStyle = '#1d3a52';
  ctx.beginPath();
  ctx.moveTo(300, 140); ctx.lineTo(398, 110); ctx.lineTo(516, 104);
  ctx.lineTo(612, 118); ctx.lineTo(596, 148); ctx.lineTo(320, 150);
  ctx.closePath(); ctx.fill();
  // headlight streak: one white beam to the right edge
  const beam = ctx.createLinearGradient(980, 0, 1650, 0);
  beam.addColorStop(0, 'rgba(255,255,240,0.95)');
  beam.addColorStop(0.45, 'rgba(255,255,240,0.45)');
  beam.addColorStop(1, 'rgba(255,255,240,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(978, 192); ctx.lineTo(1650, 150); ctx.lineTo(1650, 232); ctx.lineTo(978, 214);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 952, 190, 34, 16, 7);
  ctx.fill();
  // tail light
  ctx.fillStyle = '#ff1e2d';
  roundRect(ctx, 16, 188, 26, 12, 5);
  ctx.fill();
  // wheels
  for (const wx of [270, 760]) {
    ctx.fillStyle = '#050507';
    ctx.beginPath(); ctx.arc(wx, 232, 50, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a3a46';
    ctx.beginPath(); ctx.arc(wx, 232, 27, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e10600';
    ctx.beginPath(); ctx.arc(wx, 232, 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawRoad(ctx, W, H) {
  ctx.fillStyle = '#0a0614';
  ctx.fillRect(0, H * 0.86, W, H * 0.14);
  // neon centre dashes, pink and cyan — hugging the bottom edge, clear of the tagline
  const y = H * 0.985;
  const dash = W * 0.07, gap = W * 0.05;
  let x = 0, i = 0;
  while (x < W) {
    ctx.fillStyle = i % 2 === 0 ? '#ff2e88' : '#00c8ff';
    ctx.fillRect(x, y, dash, H * 0.012);
    x += dash + gap;
    i++;
  }
}

function drawTitleBlock(ctx, W, H, barY) {
  const title = (state.title || 'GTA VI').toUpperCase();
  const tag = (state.tagline || '').toUpperCase();
  // title: huge flat block type
  const size = Math.min(W * 0.17, (barY > 0 ? (H - barY) * 0.52 : H * 0.13));
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try { ctx.letterSpacing = '0.03em'; } catch (e) { /* older canvas */ }
  ctx.font = `900 ${Math.round(size)}px "Arial Black", sans-serif`;
  ctx.lineWidth = Math.max(2, size * 0.03);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  const ty = barY > 0 ? barY + (H - barY) * 0.42 : H * 0.875;
  ctx.strokeText(title, W / 2, ty);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, W / 2, ty);
  // tagline
  if (tag) {
    const ts = Math.max(12, W * 0.028);
    ctx.font = `700 ${Math.round(ts)}px "Segoe UI", system-ui, sans-serif`;
    try { ctx.letterSpacing = '0.32em'; } catch (e) {}
    ctx.fillStyle = '#ffc45e';
    ctx.fillText(tag, W / 2, ty + size * 0.62);
  }
  ctx.restore();
  // badge pill, top left
  const badge = (state.badge || '').toUpperCase();
  if (badge) {
    ctx.save();
    const bs = Math.max(12, W * 0.024);
    ctx.font = `800 ${Math.round(bs)}px "Segoe UI", system-ui, sans-serif`;
    const tw = ctx.measureText(badge).width;
    const bw = tw + W * 0.05, bh = bs * 2.1;
    const bx = W * 0.035, by = H * 0.03;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.strokeStyle = GRADES[state.grade].six;
    ctx.lineWidth = Math.max(2, W * 0.002);
    roundRect(ctx, bx, by, bw, bh, bh / 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, bx + bw / 2, by + bh / 2 + 1);
    ctx.restore();
  }
}

function grain(ctx, W, H) {
  // sparse deterministic film grain: grit without changing the composition
  const rand = mulberry32(7);
  const n = Math.floor((W * H) / 900);
  for (let i = 0; i < n; i++) {
    const light = rand() < 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 1.5, 1 + rand() * 1.5);
  }
}

function vignette(ctx, W, H) {
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

/* ---------- the one renderer: preview and export share it ---------- */

function drawCover(ctx, W, H, st) {
  const prev = state;
  if (st) Object.assign(state, st);
  ctx.clearRect(0, 0, W, H);
  const hasPhoto = state.photos.some((p) => p && p.img);
  const titleBarH = H * 0.26;

  if (state.layout === 'hero') {
    const painted = drawPhotoCover(ctx, state.photos[0], 0, 0, W, H);
    if (!painted) drawSky(ctx, W, H);
    drawSix(ctx, W, H, H * 1.12, W * 0.5, H * 0.46, 1);
    // red light bounce: the car's paint throws a warm wash onto the "6"
    const bounce = ctx.createRadialGradient(W * 0.5, H * 0.68, 0, W * 0.5, H * 0.68, W * 0.42);
    bounce.addColorStop(0, 'rgba(255,40,20,0.20)');
    bounce.addColorStop(1, 'rgba(255,40,20,0)');
    ctx.fillStyle = bounce;
    ctx.fillRect(0, 0, W, H);
    // diagonal action lines in the sky: the getaway is already moving
    ctx.save();
    ctx.lineCap = 'round';
    const lines = [
      [0.03, 0.12, 0.20, '255,255,255', 0.34], [0.06, 0.19, 0.15, '0,200,255', 0.4],
      [0.02, 0.26, 0.24, '255,255,255', 0.26], [0.10, 0.32, 0.12, '255,46,136', 0.4],
      [0.72, 0.10, 0.16, '255,255,255', 0.3], [0.78, 0.17, 0.11, '0,200,255', 0.38],
    ];
    for (const [fx, fy, len, col, a] of lines) {
      const x0 = W * fx, y0 = H * fy, x1 = x0 + W * len, y1 = y0 - H * len * 0.42;
      const lg = ctx.createLinearGradient(x0, y0, x1, y1);
      lg.addColorStop(0, `rgba(${col},0)`);
      lg.addColorStop(0.5, `rgba(${col},${a})`);
      lg.addColorStop(1, `rgba(${col},0)`);
      ctx.strokeStyle = lg;
      ctx.lineWidth = Math.max(2, H * 0.004);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
    drawCity(ctx, W, H);
    // motion: a ghost echo trailing the car + a slight forward lean
    ctx.save();
    ctx.translate(W * 0.5, H * 0.72);
    ctx.rotate(-0.035);
    ctx.translate(-W * 0.5, -H * 0.72);
    ctx.save();
    ctx.globalAlpha = 0.22;
    drawCar(ctx, W, H, W * 0.5 - W * 0.075, H * 0.72, (W * 0.92) / 1000);
    ctx.restore();
    drawCar(ctx, W, H, W * 0.5, H * 0.72, (W * 0.92) / 1000);
    // cyan rim light along the roofline so the car separates from the skyline
    ctx.strokeStyle = 'rgba(0,200,255,0.55)';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.beginPath();
    const cs = (W * 0.92) / 1000;
    ctx.moveTo(W * 0.5 - 500 * cs + 280 * cs, H * 0.72 - 150 * cs + 128 * cs);
    ctx.lineTo(W * 0.5 - 500 * cs + 400 * cs, H * 0.72 - 150 * cs + 100 * cs);
    ctx.lineTo(W * 0.5 - 500 * cs + 640 * cs, H * 0.72 - 150 * cs + 112 * cs);
    ctx.stroke();
    ctx.restore();
    drawRoad(ctx, W, H);
    // dynamic lighting: neon underglow beneath the car
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, H * 0.86, W, H * 0.14);
    ctx.clip();
    const ug = ctx.createRadialGradient(W * 0.5, H * 0.88, 0, W * 0.5, H * 0.88, W * 0.5);
    ug.addColorStop(0, 'rgba(255,30,40,0.42)');
    ug.addColorStop(0.55, 'rgba(255,30,40,0.12)');
    ug.addColorStop(1, 'rgba(255,30,40,0)');
    ctx.fillStyle = ug;
    ctx.fillRect(0, H * 0.86, W, H * 0.14);
    ctx.restore();
    drawTitleBlock(ctx, W, H, 0);
  } else if (state.layout === 'split') {
    const gap = W * 0.012, topH = H - titleBarH;
    const pw = (W - gap) / 2;
    if (!drawPhotoCover(ctx, state.photos[0], 0, 0, pw, topH)) {
      const g = ctx.createLinearGradient(0, 0, 0, topH);
      g.addColorStop(0, '#3a0a5e'); g.addColorStop(1, '#ff2e88');
      ctx.fillStyle = g; ctx.fillRect(0, 0, pw, topH);
    }
    if (!drawPhotoCover(ctx, state.photos[1], pw + gap, 0, pw, topH)) {
      const g = ctx.createLinearGradient(0, 0, 0, topH);
      g.addColorStop(0, '#0a2a4a'); g.addColorStop(1, '#00c8ff');
      ctx.fillStyle = g; ctx.fillRect(pw + gap, 0, pw, topH);
    }
    drawSix(ctx, W, H, H * 0.6, W * 0.5, topH * 0.44, 0.96);
    drawCar(ctx, W, H, W * 0.5, topH * 0.82, (W * 0.6) / 1000);
    ctx.fillStyle = '#0d0618';
    ctx.fillRect(0, topH, W, titleBarH);
    ctx.fillStyle = GRADES[state.grade].six;
    ctx.fillRect(0, topH, W, H * 0.008);
    drawTitleBlock(ctx, W, H, topH);
  } else { // grid
    const gap = W * 0.012, topH = H - titleBarH;
    const pw = (W - gap) / 2, ph = (topH - gap) / 2;
    const rects = [[0, 0], [pw + gap, 0], [0, ph + gap], [pw + gap, ph + gap]];
    const fills = ['#3a0a5e', '#0a2a4a', '#7a1500', '#4a0a3a'];
    rects.forEach(([rx, ry], i) => {
      if (!drawPhotoCover(ctx, state.photos[i], rx, ry, pw, ph)) {
        ctx.fillStyle = fills[i];
        ctx.fillRect(rx, ry, pw, ph);
      }
    });
    drawSix(ctx, W, H, H * 0.52, W * 0.5, topH * 0.5, 0.96);
    drawCar(ctx, W, H, W * 0.5, topH * 0.86, (W * 0.52) / 1000);
    ctx.fillStyle = '#0d0618';
    ctx.fillRect(0, topH, W, titleBarH);
    ctx.fillStyle = GRADES[state.grade].six;
    ctx.fillRect(0, topH, W, H * 0.008);
    drawTitleBlock(ctx, W, H, topH);
  }
  vignette(ctx, W, H);
  grain(ctx, W, H);
  if (st) Object.assign(state, prev);
}

function render() {
  const [W, H] = SIZES[state.size];
  if (preview.width !== W || preview.height !== H) {
    preview.width = W;
    preview.height = H;
  }
  drawCover(pctx, W, H);
}

/* ---------- export ---------- */

function exportPNG(sizeKey, done) {
  const [W, H] = SIZES[sizeKey];
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  drawCover(c.getContext('2d'), W, H);
  c.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `v12-neon-heist-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${W}×${H} PNG — check your downloads.`);
    if (done) done(blob);
  }, 'image/png');
}

function setStatus(msg) { $('status').textContent = msg; }

/* ---------- editor wiring ---------- */

function buildSlots() {
  const box = $('slots');
  box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'slot' + (i === state.active ? ' active' : '');
    d.innerHTML = `<span class="n">Panel ${i + 1}</span>` + (p ? '' : '+');
    if (p && p.img) d.style.backgroundImage = `url(${p.img.src})`;
    d.title = `Panel ${i + 1} — click to edit this photo`;
    d.onclick = () => { state.active = i; syncControls(); render(); };
    box.appendChild(d);
  });
}

function syncControls() {
  const p = state.photos[state.active];
  $('zoom').value = p ? Math.round(p.zoom * 100) : 100;
  $('zoomVal').textContent = (p ? Math.round(p.zoom * 100) : 100) + '%';
  $('offX').value = p ? Math.round(p.ox * 100) : 0;
  $('offY').value = p ? Math.round(p.oy * 100) : 0;
  document.querySelectorAll('#layoutSeg button').forEach((b) =>
    b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#gradeSeg button').forEach((b) =>
    b.classList.toggle('on', b.dataset.grade === state.grade));
  buildSlots();
}

function addPhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const slot = state.photos.findIndex((p) => !p);
    const i = slot === -1 ? state.active : slot;
    state.photos[i] = { img, zoom: 1, ox: 0, oy: 0 };
    state.active = i;
    syncControls();
    render();
    setStatus(`Photo added to panel ${i + 1} — drag it on the preview to position it.`);
  };
  img.src = url;
}

$('fileInput').addEventListener('change', (e) => {
  [...e.target.files].forEach(addPhotoFile);
  e.target.value = '';
});
$('sampleBtn').addEventListener('click', () => {
  const img = new Image();
  img.onload = () => {
    state.photos[0] = { img, zoom: 1, ox: 0, oy: 0 };
    state.active = 0;
    syncControls();
    render();
    setStatus('Sample photo loaded in panel 1.');
  };
  img.onerror = () => setStatus('Sample photo could not be loaded.');
  img.src = 'samples/neon-street.png';
});
$('clearBtn').addEventListener('click', () => {
  state.photos = [null, null, null, null];
  state.active = 0;
  syncControls();
  render();
  setStatus('Photos cleared — hero preset is back.');
});

$('zoom').addEventListener('input', (e) => {
  const p = state.photos[state.active];
  if (!p) return;
  p.zoom = e.target.value / 100;
  $('zoomVal').textContent = e.target.value + '%';
  render();
});
$('offX').addEventListener('input', (e) => {
  const p = state.photos[state.active];
  if (!p) return;
  p.ox = e.target.value / 100;
  render();
});
$('offY').addEventListener('input', (e) => {
  const p = state.photos[state.active];
  if (!p) return;
  p.oy = e.target.value / 100;
  render();
});

document.querySelectorAll('#layoutSeg button').forEach((b) =>
  b.addEventListener('click', () => { state.layout = b.dataset.layout; syncControls(); render(); }));
document.querySelectorAll('#gradeSeg button').forEach((b) =>
  b.addEventListener('click', () => { state.grade = b.dataset.grade; syncControls(); render(); }));

$('titleInput').addEventListener('input', (e) => { state.title = e.target.value; render(); });
$('tagInput').addEventListener('input', (e) => { state.tagline = e.target.value; render(); });
$('badgeInput').addEventListener('input', (e) => { state.badge = e.target.value; render(); });
$('sizeSel').addEventListener('change', (e) => {
  state.size = e.target.value;
  render();
  setStatus(`Preview is now ${state.size.replace('x', ' × ')} — export matches the preview.`);
});

$('exportBtn').addEventListener('click', () => exportPNG(state.size));
$('exportAllBtn').addEventListener('click', () => {
  const keys = Object.keys(SIZES);
  let i = 0;
  const next = () => {
    if (i >= keys.length) { setStatus('All 3 sizes exported as PNG.'); return; }
    exportPNG(keys[i++], () => setTimeout(next, 350));
  };
  next();
});

/* drag the active photo on the preview */
let dragging = null;
function canvasPos(e) {
  const r = preview.getBoundingClientRect();
  const [W, H] = SIZES[state.size];
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}
preview.addEventListener('pointerdown', (e) => {
  if (!state.photos[state.active]) return;
  dragging = canvasPos(e);
  preview.setPointerCapture(e.pointerId);
});
preview.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const [W, H] = SIZES[state.size];
  const [x, y] = canvasPos(e);
  const p = state.photos[state.active];
  p.ox += (x - dragging[0]) / W;
  p.oy += (y - dragging[1]) / H;
  p.ox = Math.max(-0.6, Math.min(0.6, p.ox));
  p.oy = Math.max(-0.6, Math.min(0.6, p.oy));
  dragging = [x, y];
  syncControls();
  render();
});
preview.addEventListener('pointerup', () => { dragging = null; });

/* drag & drop a photo onto the preview */
preview.addEventListener('dragover', (e) => { e.preventDefault(); $('dropHint').classList.add('show'); });
preview.addEventListener('dragleave', () => $('dropHint').classList.remove('show'));
preview.addEventListener('drop', (e) => {
  e.preventDefault();
  $('dropHint').classList.remove('show');
  [...e.dataTransfer.files].forEach(addPhotoFile);
});

/* automation hook for screenshots: render/export without a download */
window.coverApp = {
  state,
  render,
  exportDataURL(sizeKey) {
    const [W, H] = SIZES[sizeKey];
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    drawCover(c.getContext('2d'), W, H);
    return c.toDataURL('image/png');
  },
  loadSample() { $('sampleBtn').click(); },
  setLayout(l) { state.layout = l; syncControls(); render(); },
  setSize(s) { state.size = s; $('sizeSel').value = s; render(); },
};

syncControls();
render();
