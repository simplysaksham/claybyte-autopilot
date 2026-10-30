// ClayByte reel kit: script-driven clay scenes. Reads window.TIMING (built by timing.py from a script JSON).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
await Promise.all(['900 100px Fraunces', '700 40px Fraunces', '800 50px Brico', '600 28px Brico'].map(f => document.fonts.load(f)));

const T = window.TIMING;
const W = 720, H = 1280;
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio || 1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);

// ---------- utils ----------
let seed = (T.seed || 7) | 0; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + (b - a) * rnd();
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eout = x => 1 - Math.pow(1 - clamp(x), 3);
const back = x => { x = clamp(x); const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, t) => a + (b - a) * t;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function noiseTex(sz = 256) {
  const c = document.createElement('canvas'); c.width = c.height = sz; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, sz, sz);
  for (let i = 0; i < 2600; i++) { const v = 100 + rnd() * 70 | 0; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.beginPath(); g.arc(rnd() * sz, rnd() * sz, R(1, 4), 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(150,150,150,.25)'; g.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(rnd() * sz, rnd() * sz, R(6, 22), R(0, 3), R(3, 6)); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t;
}
const BUMP = noiseTex();
const clay = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, bumpMap: BUMP, bumpScale: 1.4, ...o });
const RB = (w, h, d, r = .2, s = 4) => new RoundedBoxGeometry(w, h, d, s, Math.min(r, Math.min(w, h, d) / 2 - .001));
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
function textTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function fitText(g, text, maxW, size, weight = 900, fam = 'Fraunces') { let s = size; do { g.font = `${weight} ${s}px ${fam}`; s -= 4; } while (g.measureText(text).width > maxW && s > 12); }
function wrap(g, text, maxW) { const words = String(text).split(' '); const lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; }
const faceMat = (col, tex) => { const c = clay(col); return [c, c, c, c, new THREE.MeshStandardMaterial({ map: tex, roughness: .8 }), c]; };

const COL = { teal: '#36B5A0', coral: '#E8664A', mustard: '#F2B33D', cream: '#FFF3DC', ink: '#2A1F33', pink: '#F49AA6', lilac: '#B6A2E3', blue: '#8DB2DA', sage: '#A6C796', brown: '#B07A4F', peach: '#F3B79A', plum: '#4B3866' };
const PCOL = ['#FFF6E3', '#FFE7A8', '#D7F2EA', '#FFD9DE', '#E6DDFF'];
const BULBC = ['#FF6B6B', '#F2B33D', '#7ED957', '#36B5A0', '#6FA8FF', '#B98BFF', '#FF8FD1'];

// ---------- lights & ground ----------
scene.add(new THREE.HemisphereLight('#fff4e6', '#c9a98a', .75));
const key = new THREE.DirectionalLight('#fff1dc', 2.1); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0006; key.shadow.normalBias = .02;
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 11, bottom: -6, near: .5, far: 60 });
scene.add(key, key.target);
const rim = new THREE.DirectionalLight('#ffd9f0', .6); scene.add(rim, rim.target);
const spot = new THREE.SpotLight('#fff1c9', 0, 30, .38, .6, 1); spot.castShadow = false; scene.add(spot, spot.target);
const ground = mesh(new THREE.PlaneGeometry(600, 80), clay('#EADCC4'), 0, 0, 0); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;

function wall(cx, color) {
  mesh(RB(22, 16, .6, .3), clay(color), cx, 8, -3.4).castShadow = false;
  mesh(RB(22, .5, .4, .15), clay(new THREE.Color(color).offsetHSL(0, 0, -.12)), cx, 2.2, -3.0);
}
function plant(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g);
  mesh(new THREE.CylinderGeometry(.42, .32, .7, 18), clay(COL.coral), 0, .35, 0, g);
  for (let i = 0; i < 5; i++) { const l = mesh(new THREE.SphereGeometry(.32, 16, 12), clay('#5FA36A'), R(-.3, .3), .9 + i * .22, R(-.2, .2), g); l.scale.set(1, 1.5, .7); l.rotation.z = R(-.6, .6); }
}
function windowFrame(cx, cy, color = '#FFE7B8') {
  mesh(RB(2.6, 2.2, .3, .15), clay('#F6EBD3'), cx, cy, -3.0);
  mesh(RB(2.2, 1.8, .2, .1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .9 }), cx, cy, -2.88);
  mesh(RB(.12, 1.9, .26, .05), clay('#F6EBD3'), cx, cy, -2.8); mesh(RB(2.3, .12, .26, .05), clay('#F6EBD3'), cx, cy, -2.8);
}
function poster(cx, cy, title, big, sub, bigCol = '#3FAE6A') {
  const t = textTex(512, 640, (g, w, h) => { g.fillStyle = '#FFF3DC'; g.fillRect(0, 0, w, h); g.fillStyle = COL.ink; g.textAlign = 'center';
    fitText(g, title, 460, 54, 800, 'Brico'); g.fillText(title, w / 2, 100);
    g.fillStyle = bigCol; fitText(g, big, 460, 210); g.fillText(big, w / 2, 330);
    g.fillStyle = COL.ink; g.font = '800 46px Brico'; wrap(g, sub, 440).slice(0, 3).forEach((l, i) => g.fillText(l, w / 2, 440 + i * 58)); });
  mesh(RB(2.5, 3.1, .2, .1), faceMat('#FFF3DC', t), cx, cy, -2.95).rotation.z = .03;
  for (const dx of [-1.05, 1.05]) mesh(RB(.5, .2, .1, .04), clay('#E9D6A0'), cx + dx, cy + 1.5, -2.82).rotation.z = dx > 0 ? .4 : -.4;
}

// ---------- SETS ----------
const SETS = {};
const P = T.sets || {}; // per-set params from script (sign text, phone text, poster...)

// machine (x=0)
SETS.machine = (() => {
  const X = 0; wall(X, P.machine?.wall || COL.lilac); windowFrame(X - 4.6, 6.2); windowFrame(X + 4.6, 6.2, '#CDEBFF'); plant(X - 4.2, -1.6, 1.1); plant(X + 4.4, -1.8, .9);
  mesh(new THREE.CylinderGeometry(4.2, 4.2, .06, 48), clay('#D9C7F0'), X, .03, 1.2).castShadow = false;
  const g = new THREE.Group(); g.position.x = X; scene.add(g);
  mesh(RB(3.4, 5.2, 2.2, .45), clay(COL.coral), 0, 2.6, 0, g);
  mesh(RB(3.6, .5, 2.4, .2), clay('#C9503A'), 0, .25, 0, g);
  const signText = (P.machine?.sign || 'IDEAS').toUpperCase();
  const st = textTex(512, 160, (c, w, h) => { c.fillStyle = COL.cream; c.fillRect(0, 0, w, h); c.fillStyle = COL.ink; fitText(c, signText, 470, 104); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(signText, w / 2, h / 2 + 6); });
  mesh(RB(2.8, .9, .3, .14), faceMat(COL.cream, st), 0, 5.75, .3, g);
  mesh(RB(2.3, 2.0, .2, .12), new THREE.MeshStandardMaterial({ color: '#2B2140', roughness: .3, emissive: '#3b2d63', emissiveIntensity: .5 }), -.25, 3.3, 1.05, g);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) mesh(new THREE.CylinderGeometry(.16, .16, .5, 14), clay([COL.cream, COL.mustard, COL.teal, COL.pink][(r + c) % 4]), -1.05 + c * .53, 2.65 + r * .62, 1.12, g).rotation.z = Math.PI / 2;
  mesh(RB(.75, 1.4, .25, .1), clay('#C9503A'), 1.25, 3.0, 1.15, g);
  const button = mesh(new THREE.CylinderGeometry(.24, .24, .2, 24), clay(COL.mustard, { emissive: COL.mustard, emissiveIntensity: 0 }), 1.25, 3.25, 1.3, g); button.rotation.x = Math.PI / 2;
  mesh(RB(2.2, .55, .3, .12), new THREE.MeshStandardMaterial({ color: '#1d1424', roughness: .9 }), 0, 1.0, 1.05, g);
  mesh(RB(1.8, .2, .9, .08), new THREE.MeshStandardMaterial({ color: '#1d1424', roughness: .9 }), 0, 5.22, -.2, g);
  const bulbs = BULBC.map((c, i) => mesh(new THREE.SphereGeometry(.17, 20, 14), new THREE.MeshStandardMaterial({ color: c, roughness: .5, emissive: c, emissiveIntensity: .05 }), -1.35 + i * .45, 4.75, 1.08, g));
  return { X, g, button, bulbs, slot: new THREE.Vector3(X, .95, 1.3), top: new THREE.Vector3(X, 5.3, -.2), focusY: 2.8,
    cams: { wide: [[.9, 3.8, 15.5], [.6, 3.4, 12.8], [.6, 2.6, 0]], close: [[0, 3.3, 9.6], [0, 3.2, 8.6], [0, 2.9, 0]], low: [[3.5, 1.4, 14.5], [1.2, 2.2, 13.8], [0, 3.3, 1.5]], side: [[-5.5, 7.2, 12.5], [-4.6, 6.8, 11.2], [-.6, 3.3, 0]] },
    mascot: { wide: [2.15, 0, 2.7, -.55], close: [2.3, 0, 2.6, -.4], low: [0, 0, 3.1, 0], side: [-2.75, 0, .9, .7] } };
})();

// desk (x=-40): phone/laptop with text
SETS.desk = (() => {
  const X = -40; wall(X, P.desk?.wall || COL.blue); windowFrame(X + 4.3, 6, '#DDEBFF'); plant(X - 4.6, -1.8);
  mesh(RB(6, .35, 2.6, .15), clay(COL.brown), X, 2.0, .2);
  for (const [dx, dz] of [[-2.6, -.9], [2.6, -.9], [-2.6, 1.3], [2.6, 1.3]]) mesh(new THREE.CylinderGeometry(.14, .12, 1.9, 12), clay('#8A5A38'), X + dx, 1.0, .2 + dz);
  const ph = P.desk?.phone || { title: 'Notes', lines: ['No notes'], pill: '' };
  const tex = textTex(360, 680, (g, w, h) => {
    g.fillStyle = '#FFFDF6'; g.fillRect(0, 0, w, h); g.fillStyle = '#F2B33D'; g.font = '700 30px Brico'; g.fillText('< ' + (ph.app || 'Notes'), 22, 60);
    g.fillStyle = COL.ink; fitText(g, ph.title || '', 316, 46); g.fillText(ph.title || '', 22, 140);
    g.font = '600 26px Brico'; let y = 200; for (const l of (ph.lines || [])) { for (const s of wrap(g, l, 310)) { g.fillStyle = '#5a4f63'; g.fillText(s, 22, y); y += 34; } y += 10; if (y > 520) break; }
    if (ph.pill) { g.fillStyle = '#EDE6F2'; g.beginPath(); g.roundRect(40, 560, 280, 70, 35); g.fill(); g.fillStyle = '#6b5f75'; g.font = '700 28px Brico'; g.textAlign = 'center'; g.fillText(ph.pill, 180, 605); }
  });
  const phone = new THREE.Group(); phone.position.set(X + .9, 3.92, -.4); phone.rotation.x = -.12; scene.add(phone);
  mesh(RB(1.9, 3.5, .22, .22), clay('#2A1F33'), 0, 0, 0, phone);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 3.14), new THREE.MeshStandardMaterial({ map: tex, roughness: .6, emissive: '#fff', emissiveMap: tex, emissiveIntensity: .35 })); scr.position.z = .115; phone.add(scr);
  return { X, phone, slot: new THREE.Vector3(X, 4.5, .5), top: new THREE.Vector3(X + .9, 5.8, -.4), focusY: 3,
    cams: { wide: [[X - .2, 4.8, 12.5], [X - .1, 4.4, 10.6], [X + .1, 3.0, 0]], close: [[X + .5, 4.2, 7.5], [X + .6, 4.0, 6.8], [X + .6, 3.6, 0]], low: [[X + 2, 2.6, 11], [X + 1.4, 2.9, 10], [X, 3.4, 0]], side: [[X - 5, 6.5, 10], [X - 4.2, 6.2, 9], [X, 3, 0]] },
    mascot: { wide: [X - 1.0, 2.17, .7, .35], close: [X - .9, 2.17, .9, .4], low: [X - 1.0, 2.17, .7, .3], side: [X - 1.0, 2.17, .7, .6] } };
})();

// conveyor (x=40): scored items
SETS.conveyor = (() => {
  const X = 40; wall(X, P.conveyor?.wall || COL.sage); windowFrame(X - 4.4, 6.2); plant(X + 4.8, -1.6, 1.1);
  mesh(RB(6.2, .45, 1.6, .2), clay('#4A3A5C'), X - .5, 1.5, 0);
  for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(.24, .24, 1.7, 16), clay('#6B5A80'), X - 3.3 + i * 1.1, 1.25, 0).rotation.x = Math.PI / 2;
  for (const dx of [-3.2, 2.2]) for (const dz of [-.6, .6]) mesh(new THREE.CylinderGeometry(.12, .12, 1.3, 10), clay('#3a2d4a'), X + dx, .65, dz);
  const bin = new THREE.Group(); bin.position.set(X + .2, 0, 2.2); scene.add(bin);
  mesh(new THREE.CylinderGeometry(.75, .6, 1.3, 28, 1, true), clay('#7D8AA6', { side: THREE.DoubleSide }), 0, .65, 0, bin);
  mesh(new THREE.TorusGeometry(.75, .07, 10, 32), clay('#66728C'), 0, 1.3, 0, bin).rotation.x = Math.PI / 2;
  const keep = new THREE.Group(); keep.position.set(X + 2.9, 0, .1); scene.add(keep);
  mesh(RB(1.6, 1.0, 1.4, .2), clay(COL.mustard), 0, 1.4, 0, keep);
  const kt = textTex(256, 96, (g, w, h) => { g.fillStyle = COL.ink; g.font = '800 64px Brico'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText((P.conveyor?.keep || 'KEEP').toUpperCase(), w / 2, h / 2 + 4); });
  const kl = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .45), new THREE.MeshBasicMaterial({ map: kt, transparent: true })); kl.position.set(0, 1.42, .71); keep.add(kl);
  const pp = P.conveyor?.poster || { title: 'HOOK SCORE', big: '7+', sub: 'OR IT GOES IN THE BIN' };
  poster(X - .4, 5.0, pp.title, pp.big, pp.sub);
  return { X, slot: new THREE.Vector3(X - 3, 2, 0), top: new THREE.Vector3(X, 5, 0), focusY: 2,
    cams: { wide: [[X - .3, 4.6, 15.5], [X - .1, 4.3, 14.2], [X - .1, 2.6, 0]], close: [[X, 3.4, 9.5], [X + .2, 3.3, 8.8], [X, 2, 0]], low: [[X + 2, 1.5, 12], [X + 1, 1.8, 11], [X, 2.4, 0]], side: [[X - 6, 6, 11], [X - 5, 5.6, 10], [X, 1.8, 0]] },
    mascot: { wide: [X + 1.9, 0, -1.3, -.3], close: [X + 1.9, 0, -1.3, -.3], low: [X + 1.9, 0, -1.3, -.3], side: [X + 1.9, 0, -1.3, -.3] } };
})();

// stage (x=80): spotlight podium for reveals / hot takes
SETS.stage = (() => {
  const X = 80; wall(X, P.stage?.wall || COL.plum);
  for (let i = 0; i < 7; i++) { const c = mesh(RB(.9, 14, .5, .4), clay(i % 2 ? '#C9503A' : '#B8442F'), X - 9 + i * .9, 7, -2.9); c.castShadow = false; }
  for (let i = 0; i < 7; i++) { const c = mesh(RB(.9, 14, .5, .4), clay(i % 2 ? '#C9503A' : '#B8442F'), X + 3.6 + i * .9, 7, -2.9); c.castShadow = false; }
  mesh(new THREE.CylinderGeometry(3.2, 3.4, .5, 48), clay('#F2B33D'), X, .25, .8);
  mesh(new THREE.CylinderGeometry(2.4, 2.6, .35, 48), clay('#F6D27A'), X, .65, .8);
  const pod = new THREE.Group(); pod.position.set(X + 2.4, 0, 2.2); scene.add(pod);
  mesh(RB(1.1, 1.6, .8, .15), clay(COL.ink), 0, .8, 0, pod);
  const mic = mesh(new THREE.SphereGeometry(.16, 16, 12), clay('#888'), -.2, 1.95, .2, pod); mesh(new THREE.CylinderGeometry(.03, .03, .4, 8), clay('#333'), -.2, 1.72, .2, pod);
  const lights = []; for (let i = 0; i < 9; i++) lights.push(mesh(new THREE.SphereGeometry(.16, 14, 10), new THREE.MeshStandardMaterial({ color: '#FFE7A8', emissive: '#FFD27A', emissiveIntensity: .8 }), X - 4 + i, 9.6, -2.6));
  return { X, slot: new THREE.Vector3(X, 6, 1), top: new THREE.Vector3(X, 8, 1), focusY: 2.4, lights,
    cams: { wide: [[X, 3.6, 15], [X, 3.4, 12.5], [X, 2.6, 0]], close: [[X, 2.6, 8], [X, 2.5, 7], [X, 2.0, 0]], low: [[X + 2, 1.2, 11], [X + 1.4, 1.4, 10], [X, 2.6, 0]], side: [[X - 6, 5.5, 11], [X - 5, 5, 10], [X, 2, 0]] },
    mascot: { wide: [X, .82, .9, 0], close: [X, .82, .9, 0], low: [X, .82, .9, 0], side: [X, .82, .9, .4] } };
})();

// studio (x=-80): creator desk with laptop, camera on tripod, ring light
SETS.studio = (() => {
  const X = -80; wall(X, P.studio?.wall || COL.peach); windowFrame(X - 4.4, 6.3, '#FFE2C4');
  mesh(RB(5.4, .3, 2.4, .14), clay('#F6EBD3'), X + .6, 2.0, -.3);
  for (const dx of [-1.8, 3.0]) mesh(RB(.25, 1.9, 2.2, .1), clay('#E3D3B4'), X + dx, 1.0, -.3);
  const lt = P.studio?.laptop || { title: 'claude', lines: ['> give me 30 reel ideas', 'Thinking...'] };
  const tex = textTex(640, 400, (g, w, h) => { g.fillStyle = '#221A2C'; g.fillRect(0, 0, w, h); g.fillStyle = '#E8664A'; g.beginPath(); g.arc(30, 30, 9, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(58, 30, 9, 0, 7); g.fill(); g.fillStyle = '#36B5A0'; g.beginPath(); g.arc(86, 30, 9, 0, 7); g.fill();
    g.fillStyle = '#F6EBD3'; g.font = '800 30px Brico'; g.fillText(lt.title || '', 120, 40); g.font = '600 28px "DejaVu Sans Mono"'; let y = 100; for (const l of lt.lines || []) { for (const s of wrap(g, l, 590)) { g.fillStyle = s.startsWith('>') ? '#F2B33D' : '#BFEDE3'; g.fillText(s, 24, y); y += 38; } if (y > 380) break; } });
  const lap = new THREE.Group(); lap.position.set(X + 1.3, 2.17, -.4); scene.add(lap);
  mesh(RB(2.4, .1, 1.6, .05), clay('#B9B3C2'), 0, 0, 0, lap);
  const scrn = new THREE.Group(); scrn.position.set(0, .05, -.78); scrn.rotation.x = -.18; lap.add(scrn);
  mesh(RB(2.4, 1.55, .08, .05), clay('#B9B3C2'), 0, .78, 0, scrn);
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.38), new THREE.MeshStandardMaterial({ map: tex, emissive: '#fff', emissiveMap: tex, emissiveIntensity: .4, roughness: .5 })); sp.position.set(0, .78, .05); scrn.add(sp);
  const cam = new THREE.Group(); cam.position.set(X - 3.2, 0, 2.2); cam.rotation.y = .7; scene.add(cam);
  for (const a of [0, 2.1, 4.2]) { const l = mesh(new THREE.CylinderGeometry(.04, .04, 2.6, 8), clay('#2A1F33'), Math.sin(a) * .35, 1.2, Math.cos(a) * .35, cam); l.rotation.set(Math.cos(a) * .25, 0, -Math.sin(a) * .25); }
  mesh(RB(.9, .6, .5, .12), clay(COL.ink), 0, 2.6, 0, cam); const lens = mesh(new THREE.CylinderGeometry(.22, .25, .4, 20), clay('#444'), 0, 2.6, .4, cam); lens.rotation.x = Math.PI / 2;
  const recDot = mesh(new THREE.SphereGeometry(.06, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff3b3b', emissiveIntensity: 1 }), .3, 2.85, .2, cam);
  const ring = mesh(new THREE.TorusGeometry(1.0, .09, 12, 48), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff3d6', emissiveIntensity: 1.2 }), X + 4.2, 4.2, -1.6);
  mesh(new THREE.CylinderGeometry(.05, .05, 3.2, 8), clay('#2A1F33'), X + 4.2, 1.6, -1.6);
  return { X, recDot, slot: new THREE.Vector3(X + 1.3, 3.5, 0), top: new THREE.Vector3(X + 1.3, 6, 0), focusY: 3,
    cams: { wide: [[X - .2, 4.6, 13], [X, 4.3, 11.5], [X, 2.9, 0]], close: [[X + .3, 4.1, 9.4], [X + .4, 4.0, 8.6], [X + .5, 3.0, 0]], low: [[X + 2.2, 2.2, 11], [X + 1.6, 2.4, 10], [X, 3, 0]], side: [[X - 6, 6.5, 10], [X - 5, 6, 9], [X, 2.8, 0]] },
    mascot: { wide: [X - .6, 2.17, .4, .25], close: [X - .8, 2.17, .7, .35], low: [X - .6, 2.17, .4, .2], side: [X - .6, 2.17, .4, .5] } };
})();

// ---------- props ----------
const paperTex = textTex(128, 168, (g, w, h) => { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = '#2A1F33'; g.fillRect(14, 18, 76, 12); g.fillStyle = '#c8bfcf'; for (let i = 0; i < 6; i++) g.fillRect(14, 46 + i * 18, i % 2 ? 84 : 100, 7); g.fillStyle = '#E8664A'; g.beginPath(); g.arc(104, 24, 9, 0, 7); g.fill(); });
const NP = 230; const papers = new THREE.InstancedMesh(RB(.62, .035, .8, .015, 1), new THREE.MeshStandardMaterial({ map: paperTex, roughness: .85 }), NP); papers.castShadow = papers.receiveShadow = true; scene.add(papers);
for (let i = 0; i < NP; i++) papers.setColorAt(i, new THREE.Color(PCOL[i % 5]));
const NC = 90; const coins = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .22, .06, 20), clay('#F2B33D', { metalness: .3, roughness: .45, emissive: '#7a5200', emissiveIntensity: .15 }), NC); coins.castShadow = true; scene.add(coins);
const NF = 160; const conf = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, .02, .2), new THREE.MeshStandardMaterial({ roughness: .7 }), NF); scene.add(conf);
for (let i = 0; i < NF; i++) conf.setColorAt(i, new THREE.Color(BULBC[i % 7]));
const drops = new THREE.InstancedMesh(new THREE.CapsuleGeometry(.04, .14, 4, 8), clay('#6FA8FF'), 24); scene.add(drops);
const cloud = new THREE.Group(); scene.add(cloud);
for (const [x, y, s] of [[0, 0, .7], [.6, -.1, .55], [-.6, -.1, .55], [.3, .3, .5], [-.3, .28, .5]]) mesh(new THREE.SphereGeometry(s, 20, 16), clay('#9AA3B5'), x, y, 0, cloud);
const bulbIdea = new THREE.Group(); scene.add(bulbIdea);
mesh(new THREE.SphereGeometry(.42, 24, 18), new THREE.MeshStandardMaterial({ color: '#FFF1A8', emissive: '#FFD34D', emissiveIntensity: 1.4, roughness: .3 }), 0, 0, 0, bulbIdea);
mesh(new THREE.CylinderGeometry(.18, .2, .3, 16), clay('#9a9aa8'), 0, -.48, 0, bulbIdea);
const trophy = new THREE.Group(); scene.add(trophy);
mesh(new THREE.CylinderGeometry(.45, .2, .7, 24, 1, true), clay('#F2B33D', { metalness: .35, roughness: .4, side: THREE.DoubleSide }), 0, .95, 0, trophy);
mesh(new THREE.CylinderGeometry(.08, .08, .4, 10), clay('#F2B33D', { metalness: .35 }), 0, .45, 0, trophy);
mesh(RB(.7, .25, .7, .06), clay(COL.ink), 0, .12, 0, trophy);
for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(.2, .05, 8, 16, Math.PI), clay('#F2B33D', { metalness: .35 }), s * .45, 1.0, 0, trophy).rotation.z = s * Math.PI / 2;
const cardsM = []; function cardMesh(label, col) {
  const t = textTex(400, 240, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = COL.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; const L = String(label).toUpperCase().split('|'); L.forEach((l, i) => { fitText(g, l, 370, 54, 800, 'Brico'); g.fillText(l, w / 2, h / 2 + (i - (L.length - 1) / 2) * 60); }); });
  const m = mesh(RB(1.7, 1.02, .08, .04, 2), faceMat(col, t)); m.visible = false; return m;
}
// belt items
const beltItems = [];
function buildBelt(items) {
  return items.map((it, i) => {
    const g = new THREE.Group(); scene.add(g); g.visible = false;
    mesh(RB(.9, .05, 1.1, .02, 1), new THREE.MeshStandardMaterial({ map: paperTex, roughness: .85, color: PCOL[i % 5] }), 0, 0, 0, g);
    const good = it.score >= 7; const lab = it.label ? String(it.label) : it.score + '/10';
    const ft = textTex(256, 96, (c, w, h) => { c.fillStyle = good ? '#3FAE6A' : '#E5484D'; c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, 40); c.fill(); c.fillStyle = '#fff'; fitText(c, lab, 220, 56); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(lab, w / 2, h / 2 + 3); });
    mesh(new THREE.CylinderGeometry(.025, .025, .9, 8), clay('#2A1F33'), -.3, .45, 0, g);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .46), new THREE.MeshBasicMaterial({ map: ft, transparent: true, side: THREE.DoubleSide })); flag.position.set(.25, .82, 0); flag.scale.setScalar(1.3); g.add(flag);
    return { g, good, flag };
  });
}

// ---------- mascot ----------
function makeByte() {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body); scene.add(root);
  const tealM = clay(COL.teal);
  mesh(RB(1.5, 1.35, 1.2, .5, 5), tealM, 0, .95, 0, body);
  const belly = mesh(new THREE.SphereGeometry(.42, 24, 16), clay('#BFEDE3'), 0, .7, .5, body); belly.scale.set(1.1, .8, .3);
  const eyes = [], pupils = [];
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(.24, 24, 16), clay('#FFFFFF', { bumpScale: .3 }), s * .32, 1.2, .55, body); e.scale.set(1, 1.15, .55); eyes.push(e);
    const p = mesh(new THREE.SphereGeometry(.12, 20, 14), new THREE.MeshStandardMaterial({ color: '#1d1424', roughness: .3 }), s * .32, 1.17, .66, body); p.scale.set(1, 1.2, .5); pupils.push(p);
    mesh(new THREE.SphereGeometry(.11, 16, 12), clay(COL.pink), s * .55, .92, .55, body).scale.set(1, .7, .3);
  }
  const lids = [-1, 1].map(s => { const l = mesh(new THREE.SphereGeometry(.255, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), tealM, s * .32, 1.2, .55, body); l.scale.set(1.05, 1.2, .6); return l; });
  const mouth = mesh(new THREE.TorusGeometry(.12, .035, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: '#1d1424' }), 0, .9, .6, body);
  mesh(new THREE.CylinderGeometry(.04, .04, .45, 8), clay('#2A1F33'), 0, 1.82, 0, body);
  const antBall = mesh(new THREE.SphereGeometry(.14, 16, 12), clay(COL.mustard, { emissive: COL.mustard, emissiveIntensity: .25 }), 0, 2.08, 0, body);
  const arms = [-1, 1].map(s => { const pv = new THREE.Group(); pv.position.set(s * .76, 1.0, 0); body.add(pv); mesh(new THREE.CapsuleGeometry(.12, .38, 4, 10), tealM, 0, -.25, 0, pv); return pv; });
  [-1, 1].forEach(s => { const f = mesh(new THREE.CapsuleGeometry(.15, .22, 4, 10), clay('#2C8F80'), s * .35, .12, .15, root); f.rotation.x = Math.PI / 2; });
  return { root, body, pupils, lids, mouth, arms, antBall };
}
const byte = makeByte();
function poseByte(o) {
  const b = byte; const { x = 0, y = 0, z = 0, ry = 0, hop = 0, squash = 0, lean = 0, arm = [0, 0], blink = 0, sad = 0, scale = 1, look = [0, 0], happy = 1, tilt = 0, glow = 0, t = 0 } = o;
  b.root.position.set(x, y + Math.max(0, hop), z); b.root.rotation.y = ry; b.root.scale.setScalar(scale);
  b.body.scale.set(1 + squash * .25, 1 - squash * .3, 1 + squash * .25); b.body.rotation.set(lean, 0, tilt);
  b.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (.15 + arm[i]); });
  const lid = Math.max(blink, sad * .55);
  b.lids.forEach(l => { l.visible = lid > .02; l.scale.y = 1.2 * lid; l.position.y = 1.2 + (1 - lid) * .1; });
  b.pupils.forEach((p, i) => { p.position.x = (i ? .32 : -.32) + look[0] * .06; p.position.y = 1.17 + look[1] * .06 - sad * .05; });
  b.mouth.rotation.z = happy > .5 ? Math.PI : 0; b.mouth.position.y = happy > .5 ? .9 : .82;
  b.antBall.position.y = 2.08 + Math.sin(t * 9) * .03; b.antBall.material.emissiveIntensity = .25 + glow;
}
function actionPose(action, lt, t) {
  const blink = (Math.sin(t * 2.3) > .985 || (t % 3.7) < .1) ? 1 : 0;
  const base = { t, blink };
  switch (action) {
    case 'hop': return { ...base, hop: Math.abs(Math.sin(lt * 5)) * .5, squash: Math.sin(lt * 10) * .08, arm: [.4, .4], look: [0, .5] };
    case 'wave': return { ...base, arm: [0, 2.2 + .5 * Math.sin(t * 8)], look: [0, 0] };
    case 'sad': return { ...base, sad: 1, lean: .18, happy: 0, arm: [-.05, -.05], look: [.6, .6], squash: .05 * Math.sin(t * 2) };
    case 'celebrate': return { ...base, arm: [2.4 + .3 * Math.sin(t * 9), 2.4 + .3 * Math.sin(t * 9 + 1)], hop: Math.abs(Math.sin(lt * 6)) * .4, glow: 1.2 };
    case 'point': return { ...base, arm: [.2, 1.5 + .1 * Math.sin(t * 6)], look: [1, .6], tilt: -.08 };
    case 'think': return { ...base, arm: [1.0, .1], tilt: .14 * Math.sin(t * 1.5), look: [.6, 1], happy: 0 };
    case 'shock': return { ...base, arm: [1.6, 1.6], squash: -.15 * clamp(1 - lt / .3), hop: lt < .3 ? Math.sin(lt / .3 * Math.PI) * .6 : 0, happy: 0, look: [0, .3] };
    case 'type': return { ...base, arm: [.6 + .2 * Math.sin(t * 22), .6 + .2 * Math.sin(t * 22 + 2)], look: [.5, 1], lean: .1 };
    case 'press': { const p = clamp((lt - .55) / .12) - clamp((lt - .8) / .15); return { ...base, hop: Math.sin(clamp((lt - .1) / .5) * Math.PI) * 1.1, arm: [p * 1.6 + .2, .3], look: [-1, .5] }; }
    case 'throw': return { ...base, arm: [0, 1.4 + .3 * Math.sin(t * 10)], look: [1, 1], hop: Math.abs(Math.sin(lt * 5)) * .15 };
    default: return { ...base, squash: .04 * Math.sin(t * 3), look: [0, 0] };
  }
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const bannerEl = $('banner'), capsEl = $('caps'), ovl = $('ovl'), dim = $('dim'), grain = $('grain');
{ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); grain.style.backgroundImage = `url(${c.toDataURL()})`; }

// prebuild per-beat assets
T.beats.forEach(B => {
  const ps = B.props || [];
  if (ps.includes('cards')) B._cards = (B.cards || ['A', 'B', 'C']).slice(0, 4).map((l, i) => cardMesh(l, PCOL[(i + 1) % 5]));
  if (ps.includes('belt')) B._belt = buildBelt(B.belt || [{ score: 9 }, { score: 4 }, { score: 8 }, { score: 3 }, { score: 10 }, { score: 7 }]);
});
const wordTime = (B, pre, fb) => { const w = B.words.find(w => w.w.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(String(pre).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5))); return w ? w.t0 - B.start : fb; };

function setCaps(words, t, kw) {
  const idx = words.findIndex(w => t >= w.t0 && t < w.t1 + .05); let html = '';
  if (idx >= 0) { const s = idx - (idx % 2); html = words.slice(s, s + 2).map((w, k) => { if (t < w.t0) return ''; const clean = w.w.replace(/[.,!?;:"]/g, ''); const isK = (kw || []).some(x => clean.toLowerCase() === String(x).toLowerCase()) || /^\d/.test(clean); return `<span class="w${isK ? ' k' : ''}" style="transform:rotate(${((s + k) % 3 - 1) * 2}deg) scale(${.85 + .15 * back((t - w.t0) / .12)})">${esc(clean)}</span>`; }).join(''); }
  capsEl.innerHTML = html;
}

function overlay(B, lt, D) {
  const o = B.overlay; if (!o || !o.type || o.type === 'none') { ovl.innerHTML = ''; return; }
  const items = o.items || [];
  const at = (i, n) => o.sync !== false && typeof items[i] === 'string' ? wordTime(B, items[i].split(' ')[0], .6 + i * (D - 1.2) / Math.max(1, n)) : .6 + i * (D - 1.2) / Math.max(1, n);
  let h = '';
  if (o.type === 'chips') {
    items.forEach((it, i) => { const tt = at(i, items.length); if (lt < tt) return; const e = back((lt - tt) / .25); const side = i % 2; h += `<div class="chip" style="${side ? 'right' : 'left'}:40px;top:${300 + i * 92}px;transform:scale(${e}) rotate(${side ? 3 : -3}deg)"><i style="background:${BULBC[i % 7]}"></i>${esc(it)}</div>`; });
  } else if (o.type === 'counter') {
    const v = Math.round(lerp(o.from ?? 0, o.to ?? 100, eout((lt - .3) / Math.max(.5, D - 1)))); h = `<div class="counter"><span>${esc(o.label || '')}</span><b>${esc((o.prefix || '') + v.toLocaleString('en-IN') + (o.suffix || ''))}</b></div>`;
  } else if (o.type === 'bigstat') {
    const e = back((lt - .2) / .35); h = `<div class="big" style="transform:scale(${e})"><b>${esc(o.value)}</b><span>${esc(o.label || '')}</span></div>`;
  } else if (o.type === 'card') {
    const e = back((lt - .15) / .3); h = `<div class="card" style="transform:translateY(${(1 - e) * 60}px) rotate(-1deg);opacity:${clamp(lt / .15)}"><h4>${esc(o.title || '')}</h4>${items.map((l, i) => lt > at(i, items.length) ? `<p>${esc(l)}</p>` : '').join('')}</div>`;
  } else if (o.type === 'terminal') {
    const lines = o.lines || []; let used = .3; const per = (D - .8) / Math.max(1, lines.length);
    h = `<div class="term"><div class="bar"><i></i><i></i><i></i></div>${lines.map((l, i) => { const st = .3 + i * per; if (lt < st) return ''; const txt = String(l.text); const n = Math.floor(txt.length * clamp((lt - st) / (per * .7))); return `<div class="${l.role === 'you' ? 'you' : 'ai'}">${l.role === 'you' ? '&gt; ' : ''}${esc(txt.slice(0, n))}</div>`; }).join('')}</div>`;
  } else if (o.type === 'compare') {
    const L = o.left || {}, Rr = o.right || {}; const e1 = back((lt - .2) / .3), e2 = back((lt - .6) / .3), win = lt > D * .6;
    const col = (s, e, w) => `<div style="transform:scale(${e})">${w && win ? '<span class="win">WINNER</span>' : ''}<h5>${esc(s.name || '')}</h5>${(s.items || []).map(x => `<p>${esc(x)}</p>`).join('')}</div>`;
    h = `<div class="cmp">${col(L, e1, o.winner === 'left')}${col(Rr, e2, o.winner === 'right')}</div>`;
  } else if (o.type === 'score') {
    const v = Math.round(lerp(0, o.value ?? 9, eout((lt - .2) / .6))); h = `<div class="score ${(o.value ?? 9) < 7 ? 'bad' : ''}" style="transform:translateX(-50%) scale(${back((lt - .1) / .3)})">${v}/${o.max || 10}</div>`;
  } else if (o.type === 'checklist') {
    h = `<div class="chk">${items.map((l, i) => { const tt = at(i, items.length); return `<p><i class="${lt > tt ? 'on' : ''}">${lt > tt ? '✓' : ''}</i>${esc(l)}</p>`; }).join('')}</div>`;
  } else if (o.type === 'beforeafter') {
    const bf = o.before || {}, af = o.after || {}; const e1 = back((lt - .15) / .3), e2 = back((lt - (o.flip ?? D * .45)) / .35);
    h = `<div class="ba"><div class="bef" style="transform:scale(${e1}) rotate(-2deg);opacity:${e2 > .2 ? .55 : 1}"><span>${esc(bf.label || 'BEFORE')}</span><p>${esc(bf.text || '')}</p>${e2 > .2 ? '<em class="x"></em>' : ''}</div>
      <div class="arr" style="opacity:${clamp(e2 * 2)}">↓</div>
      <div class="aft" style="transform:scale(${e2}) rotate(1.5deg)"><span>${esc(af.label || 'AFTER')}</span><p>${esc(af.text || '')}</p></div></div>`;
  } else if (o.type === 'send') {
    const e = back((lt - .15) / .35), e2 = back((lt - .9) / .3), pp = clamp((lt - 1.6) / .5);
    h = `<div class="send" style="transform:translateY(${(1 - e) * 80}px);opacity:${clamp(lt / .15)}"><div class="hd"><svg viewBox="0 0 48 48"><path d="M6 22 L42 6 L30 42 L23 27 Z" fill="none" stroke="#2A1F33" stroke-width="4.5" stroke-linejoin="round"/><path d="M23 27 L42 6" stroke="#2A1F33" stroke-width="4.5"/></svg>${esc(o.title || 'Send this to')}</div>
      <div class="to" style="transform:scale(${e2})"><i></i><b>${esc(o.who || 'a friend who needs this')}</b><u style="background:${pp >= 1 ? '#3FAE6A' : '#E8664A'}">${pp >= 1 ? 'Sent ✓' : 'Send'}</u></div>
      ${o.sub ? `<p style="opacity:${clamp((lt - 1.4) / .3)}">${esc(o.sub)}</p>` : ''}</div>`;
  } else if (o.type === 'cta') {
    const kw = String(o.keyword || T.keyword || 'LINK').toUpperCase(); const ty = clamp((lt - .5) / .8); const nch = Math.floor(ty * kw.length + .0001);
    const pp = clamp((lt - 1.5) / .15) - clamp((lt - 1.75) / .15); const eb = back((lt - 1.8) / .35);
    h = `<div class="env" style="opacity:${clamp((lt - 1.8) / .1)};transform:translateY(${(1 - eb) * 40}px) scale(${.6 + .4 * eb})"><div class="bd" style="transform:scale(${back((lt - 2.3) / .3)})">1</div></div>
      <div class="cbox"><div class="av"></div>${nch ? `<b style="font-weight:800">${esc(kw.slice(0, nch))}</b>` : '<span class="ph">Add a comment…</span>'}<span class="cur" style="opacity:${lt > .4 && lt < 1.5 ? 1 : 0}"></span><span class="post" style="transform:scale(${1 - .15 * pp})">Post</span></div>
      <div class="follow" style="opacity:${clamp((lt - 2.6) / .3)}"><span>${esc(o.follow || 'Follow so the DM lands')}</span></div>`;
  }
  ovl.innerHTML = h;
}

// ---------- props per frame ----------
const dummy = new THREE.Object3D(); const HIDE = new THREE.Matrix4().makeScale(0, 0, 0);
const PR = Array.from({ length: NP }, () => ({ vx: R(-3, 3), vy: R(3.5, 6), vz: R(1.6, 3.4), rx: R(-8, 8), ry: R(-8, 8), rz: R(-8, 8), yaw: R(0, 6.28) }));
const MT = []; { const pts = []; for (let i = 0; i < NP; i++) { const u = rnd(); const h = 2.6 * (1 - Math.sqrt(1 - u * .96)); const rad = 3.4 * (1 - h / 2.6) * Math.sqrt(R(.15, 1)); const a = R(0, 6.28); pts.push({ x: Math.cos(a) * rad, y: h + .02, z: Math.sin(a) * rad * .8, yaw: R(0, 6.28), tilt: R(-.35, .35) }); } pts.sort((a, b) => a.y - b.y); MT.push(...pts); }
const CR = Array.from({ length: NF }, () => ({ x: R(-4, 4), z: R(-1, 4), sp: R(1.5, 3), ph: R(0, 1), r: R(0, 6) }));

function doProps(B, S, lt, D, t, m) {
  const ps = B.props || [];
  let pileTop = 0;
  if (ps.includes('paperBurst')) { const o = S.slot; for (let i = 0; i < 46; i++) { const ts = .6 + i * .055; if (lt <= ts) continue; const p = PR[i]; const g = 9.8; let tt = lt - ts; let x = o.x + p.vx * tt, z = o.z + p.vz * tt, y = o.y + p.vy * tt - .5 * g * tt * tt; let land = false; if (y < .03) { const tl = (p.vy + Math.sqrt(p.vy * p.vy + 2 * g * (o.y - .03))) / g; x = o.x + p.vx * tl; z = o.z + p.vz * tl; y = .03 + (i % 4) * .036; land = true; tt = tl; } dummy.position.set(x, y, z); if (land) dummy.rotation.set(0, p.yaw, 0); else dummy.rotation.set(p.rx * tt, p.ry * tt + p.yaw, p.rz * tt); dummy.scale.setScalar(1); dummy.updateMatrix(); papers.setMatrixAt(i, dummy.matrix); } }
  if (ps.includes('pile')) { const cx = m[0], cz = m[2] + .3; for (let i = 0; i < NP; i++) { const q = MT[i]; const ts = (i / NP) * D * .85; if (lt < ts) continue; const s = eout((lt - ts) / .45); dummy.position.set(lerp(S.slot.x, cx + q.x, s), lerp(S.slot.y, q.y, s) + Math.sin(s * Math.PI) * 1.5, lerp(S.slot.z, cz + q.z, s)); dummy.rotation.set(q.tilt * s + (1 - s) * PR[i].rx, q.yaw, 0); dummy.scale.setScalar(1); dummy.updateMatrix(); papers.setMatrixAt(i, dummy.matrix); if (s >= 1 && Math.hypot(q.x, q.z) < 1.2) pileTop = Math.max(pileTop, q.y); } }
  if (ps.includes('coins')) { coins.visible = true; for (let i = 0; i < NC; i++) { const ph = (lt * .9 + i / NC) % 1; const st = i / NC * .8; if (lt < st) { coins.setMatrixAt(i, HIDE); continue; } const fall = Math.min(1, (lt - st) * 1.1); const y = 9 - fall * 9 + (fall >= 1 ? 0 : 0); dummy.position.set(S.X + Math.sin(i * 12.9) * 3.5, Math.max(.05 + (i % 5) * .06, y), m[2] + Math.cos(i * 7.1) * 1.8); dummy.rotation.set(fall < 1 ? lt * 6 + i : 0, i, fall < 1 ? lt * 4 : 0); dummy.scale.setScalar(1); dummy.updateMatrix(); coins.setMatrixAt(i, dummy.matrix); } coins.instanceMatrix.needsUpdate = true; }
  if (ps.includes('confetti')) { conf.visible = true; for (let i = 0; i < NF; i++) { const c = CR[i]; const ph = ((lt * c.sp * .25) + c.ph) % 1; dummy.position.set(S.X + c.x, 9 - ph * 9, c.z); dummy.rotation.set(lt * 5 + c.r, lt * 3 + c.r, lt * 4); dummy.scale.setScalar(1); dummy.updateMatrix(); conf.setMatrixAt(i, dummy.matrix); } conf.instanceMatrix.needsUpdate = true; }
  if (ps.includes('rain')) { cloud.visible = drops.visible = true; cloud.position.set(m[0], m[1] + 2.85 + Math.sin(t * 1.5) * .08, m[2]); for (let i = 0; i < 24; i++) { const ph = ((lt * 1.6 + i / 24) % 1); dummy.position.set(m[0] + ((i * 37) % 11 / 11 - .5) * 1.4, m[1] + 2.45 - ph * 2.3, m[2] + ((i * 17) % 7 / 7 - .5) * .8); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(ph < .95 ? 1 : 0); dummy.updateMatrix(); drops.setMatrixAt(i, dummy.matrix); } drops.instanceMatrix.needsUpdate = true; }
  if (ps.includes('bulb')) { bulbIdea.visible = true; const e = back((lt - .3) / .4); bulbIdea.position.set(m[0], m[1] + 2.9 + Math.sin(t * 3) * .08, m[2]); bulbIdea.scale.setScalar(Math.max(0.001, e) * .9); }
  if (ps.includes('trophy')) { trophy.visible = true; const e = back((lt - .3) / .5); trophy.position.set(m[0] + 1.3, m[1], m[2] + .3); trophy.scale.setScalar(Math.max(.001, e) * 1.2); trophy.rotation.y = t * .8; }
  if (ps.includes('bulbs') && S.bulbs) { const items = (B.overlay && B.overlay.items) || []; S.bulbs.forEach((b, i) => { const tt = items[i] ? wordTime(B, items[i].split(' ')[0], 1 + i * .6) : .8 + i * (D - 1.2) / 7; if (lt >= tt) b.material.emissiveIntensity = 1.6 + .4 * Math.sin(t * 20 + i); }); }
  if (ps.includes('press') && S.button) { const p = clamp((lt - .55) / .12) - clamp((lt - .8) / .15); S.button.position.z = 1.3 - .12 * p; S.button.material.emissiveIntensity = p * 1.2; }
  if (B._cards) { let gulp = 0; B._cards.forEach((c, i) => { const tt = wordTime(B, (B.cards[i] || '').split('|')[0].split(' ')[0], .5 + i * .8) - .15; if (lt < tt - .3) return; const s = clamp((lt - tt) / .65); c.visible = true; const p0 = new THREE.Vector3(m[0], m[1] + 2.2, m[2] + .3); const e = ease(s); c.position.lerpVectors(p0, S.top, e); c.position.y += Math.sin(e * Math.PI) * 2.2; c.rotation.set(-e * 1.4, .7 * (1 - e), Math.sin(e * 6) * .2); c.scale.setScalar(s >= 1 ? Math.max(.001, 1 - (lt - tt - .65) / .15) : 1); if (lt > tt + .6) gulp = Math.max(gulp, Math.sin(clamp((lt - tt - .6) / .3) * Math.PI)); }); if (S.g) S.g.scale.set(1 + gulp * .05, 1 - gulp * .06, 1 + gulp * .05); }
  if (B._belt) { const X = S.X; B._belt.forEach((b, i) => { const x = X - 3.6 + lt * 1.5 - i * 1.25; if (x < X - 3.4) return; b.g.visible = true; if (!b.good && x > X + .1) { const k = clamp((x - (X + .1)) / 1.1); b.g.position.set(X + .1 + k * .2, 1.76 + Math.sin(k * Math.PI) * .9 - k * 1.2, k * 2.2); b.g.rotation.set(k * 1.8, 0, 0); if (k >= 1) b.g.visible = false; } else if (b.good && x > X + 2.5) { const k = clamp((x - X - 2.5) / .6); b.g.position.set(X + 2.5 + k * .8, 1.76 + Math.sin(k * Math.PI) * .5 + k * .2, 0); if (k >= 1) b.g.visible = false; } else { b.g.position.set(x, 1.76, 0); b.g.rotation.set(0, 0, 0); } b.flag.lookAt(camera.position); }); }
  if (S.lights) S.lights.forEach((l, i) => l.material.emissiveIntensity = .5 + .5 * (Math.sin(t * 6 + i) > 0 ? 1 : 0));
  if (S.recDot) S.recDot.visible = Math.sin(t * 6) > 0;
  return pileTop;
}

// ---------- main ----------
window.renderAt = function (t) {
  let bi = T.beats.findIndex(b => t >= b.start && t < b.end); if (bi < 0) bi = T.beats.length - 1;
  const B = T.beats[bi]; const lt = t - B.start, D = B.end - B.start, u = lt / D;
  const S = SETS[B.set] || SETS.machine; const camKey = B.cam && S.cams[B.cam] ? B.cam : 'wide';
  // reset
  for (let i = 0; i < NP; i++) papers.setMatrixAt(i, HIDE);
  coins.visible = conf.visible = cloud.visible = drops.visible = bulbIdea.visible = trophy.visible = false;
  T.beats.forEach(b => { (b._cards || []).forEach(c => c.visible = false); (b._belt || []).forEach(x => x.g.visible = false); });
  Object.values(SETS).forEach(s => { if (s.bulbs) s.bulbs.forEach(b => b.material.emissiveIntensity = .05); if (s.g) s.g.scale.set(1, 1, 1); if (s.button) { s.button.position.z = 1.3; s.button.material.emissiveIntensity = 0; } });
  // camera + light
  const [p0, p1, l] = S.cams[camKey]; const e = ease(u);
  camera.position.set(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), lerp(p0[2], p1[2], e)); camera.lookAt(l[0], l[1], l[2]);
  key.position.set(S.X - 6, 14, 10); key.target.position.set(S.X, 1.5, 0); rim.position.set(S.X + 8, 6, -2); rim.target.position.set(S.X, 2, 0);
  spot.intensity = B.set === 'stage' ? 60 : 0; spot.position.set(S.X, 12, 6); spot.target.position.set(S.X, 1, 1);
  // mascot
  const m = (B.mascot && B.mascot.at) || S.mascot[camKey] || S.mascot.wide;
  const pileTop = doProps(B, S, lt, D, t, m);
  const act = (B.mascot && B.mascot.action) || 'idle';
  const pose = actionPose(act, lt, t);
  poseByte({ ...pose, x: m[0], y: m[1] + pileTop * .95, z: m[2], ry: m[3], scale: (B.mascot && B.mascot.scale) || (camKey === 'close' ? .9 : 1) });
  byte.root.visible = !(B.mascot && B.mascot.hide);
  papers.instanceMatrix.needsUpdate = true;
  // DOM
  bannerEl.textContent = B.banner || ''; const bin = back(lt / .35);
  bannerEl.style.transform = `translateX(-50%) translateY(${(1 - bin) * -60}px) rotate(${-1.2 + (bi % 2) * 2.2}deg) scale(${.9 + .1 * bin})`; bannerEl.style.opacity = B.banner ? clamp(lt / .12) : 0;
  const isCta = B.overlay && B.overlay.type === 'cta';
  dim.style.background = `rgba(28,18,40,${isCta ? .62 * clamp(lt / .3) : (B.dim || 0)})`;
  overlay(B, lt, D);
  setCaps(B.words, t, T.highlight);
  grain.style.backgroundPosition = `${(t * 997) % 256 | 0}px ${(t * 613) % 256 | 0}px`;
  if (T.still) { bannerEl.style.opacity = 0; capsEl.innerHTML = ''; ovl.innerHTML = ''; document.getElementById('brand').style.opacity = 0; grain.style.opacity = 0; }
  renderer.render(scene, camera);
  return true;
};
window.READY = Promise.resolve(true);
