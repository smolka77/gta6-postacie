// Stroje postaci: ubrania jako OSOBNA geometria nalozona na cialo (nie malowana na skorze).
//
// Jak to dziala (raz na stroj, przy pierwszym uzyciu, potem z cache):
//  1. Z siatki ciala wycinane sa kawalki ubran (koszulka, kurtka, spodnie, pasek, buty, kolnierze, klapy, krawat).
//     Kazdy kawalek to pole skalarne f(punkt) > 0 tam, gdzie lezy material; trojkaty na granicy sa przycinane
//     dokladnie po linii f = 0, wiec dekolt, rekaw czy nogawka maja gladka krawedz, a nie schodki po trojkatach.
//  2. Kawalek jest odsuniety od ciala: najpierw na wygladzona sylwetke (bez miesni brzucha i klatki), potem o grubosc
//     materialu wzdluz normalnej; nogawki i rekawy marynarek sa proste (nie oblepiaja lydki), dol koszuli odstaje,
//     krotki rekaw rozszerza sie przy brzegu - miedzy ubraniem a skora jest prawdziwa szczelina.
//  3. Na kazdej krawedzi powstaje pasek grubosci materialu (widac brzeg tkaniny).
//  4. Cialo pod ubraniem jest usuwane (trojkaty zakryte z zapasem) - nic nie przebija i nie kosztuje rysowania.
// Ubrania to jeden SkinnedMesh na postac (1 draw call) podpiety pod ten sam szkielet. Detale (szwy, guziki, kieszenie,
// wzory, faldy) liczy shader per piksel z pozycji w pozie spoczynkowej; napisy/tatuaze z malej tekstury nadrukow.

// ---------------------------------------------------------------------------------------------------------------------
// STROJE (kolory 0xRRGGBB, dlugosci w metrach). id - stale, uzywane przez kreator glow do przypisania glowy do stroju.
//   top:    kind 'tee'|'tank'|'shirt'|'polo'|'jumpsuit'|'turtleneck', sleeve 'short'|'elbow'|'long',
//           pattern 'plain'|'floral'|'rib'|'check', colors [glowny, drugi, trzeci], v (dekolt/rozpiecie), hem,
//           tucked, loose 0..1, tie (kolor krawata), pocket (kieszen na piersi)
//   jacket: kind 'bomber'|'track'|'leather'|'suit', color, accent, open (pol-szerokosc rozpiecia), pin (przypinka-flaga)
//   pants:  kind 'jeans'|'trousers'|'cargo'|'track', color, accent, end 'full'|'knee', belt, baggy 0..1
//   shoes:  kind 'sneaker'|'hightop'|'dress'|'boot', color, sole, accent
//   bulk -0.5..1 (sylwetka: szczuply..tegi), tattoo 0..1 (rekawy tatuazy), dirt 0..1, prints {front, back, neck}
// ---------------------------------------------------------------------------------------------------------------------
export const OUTFITS = [
  { id: 'michael', name: 'Michael De Santa', skin: 0xdcae8e,
    top: { kind: 'shirt', sleeve: 'long', colors: [0xf4f4f2, 0xe9e9e6], v: 0.06, tucked: true },
    jacket: { kind: 'suit', color: 0x5d6168 },
    pants: { kind: 'trousers', color: 0x5d6168, belt: 0x161616 }, shoes: { kind: 'dress', color: 0x141414, sole: 0x0d0d0d } },
  { id: 'trevor', name: 'Trevor Philips', skin: 0xd8a888, dirt: 1,
    top: { kind: 'tee', sleeve: 'short', colors: [0xe2ddd0], hem: 0.06 },
    pants: { kind: 'cargo', color: 0x4f4636 }, shoes: { kind: 'boot', color: 0x4a3524, sole: 0x1a1612 },
    prints: { neck: { text: 'CUT HERE', dashed: true, color: '#2a3552' } } },
  { id: 'franklin', name: 'Franklin Clinton', skin: 0x5e3b27,
    top: { kind: 'tee', sleeve: 'short', colors: [0xf2f2ef], v: 0.055, hem: 0.07 },
    pants: { kind: 'jeans', color: 0x4d6c9c }, shoes: { kind: 'sneaker', color: 0xf4f4f4, sole: 0xe8e4da, accent: 0x2f8f4a } },
  { id: 'cj', name: 'Carl "CJ" Johnson', skin: 0x6b4630,
    top: { kind: 'tank', pattern: 'rib', colors: [0xf4f4f0], hem: 0.07 },
    pants: { kind: 'jeans', color: 0x3e5a8c, baggy: 0.6 }, shoes: { kind: 'sneaker', color: 0x18181a, sole: 0xf2f2f2, accent: 0x18181a } },
  { id: 'bigsmoke', name: 'Big Smoke', skin: 0x4e3121, bulk: 1,
    top: { kind: 'tee', sleeve: 'elbow', colors: [0x2f7d3a], hem: 0.14, loose: 1 },
    pants: { kind: 'jeans', color: 0x2c3e5e, baggy: 1 }, shoes: { kind: 'sneaker', color: 0xf6f6f6, sole: 0xeaeaea, accent: 0xf6f6f6 } },
  { id: 'lester', name: 'Lester Crest', skin: 0xe6c2a6, bulk: -0.3,
    top: { kind: 'shirt', sleeve: 'long', pattern: 'check', colors: [0x4c7a46, 0x24402a, 0xddd6bc], v: 0.03, tucked: true, pocket: true },
    pants: { kind: 'trousers', color: 0xb8a27a, belt: 0x4a3222 }, shoes: { kind: 'dress', color: 0x5a3e28, sole: 0x2a1c12 } },
  { id: 'niko', name: 'Niko Bellic', skin: 0xd2a07a,
    top: { kind: 'turtleneck', sleeve: 'long', colors: [0x76787c] },
    jacket: { kind: 'track', color: 0x6a4a30, accent: 0xe6d8b6, open: 0.035 },
    pants: { kind: 'trousers', color: 0x3c4b68 }, shoes: { kind: 'dress', color: 0x5a3a22, sole: 0x2a1c12 } },
  { id: 'tommy', name: 'Tommy Vercetti', skin: 0xd9a47e,
    top: { kind: 'shirt', sleeve: 'short', pattern: 'floral', colors: [0x1fa1b4, 0xf5f1e4, 0x10606c], v: 0.085, hem: 0.08, loose: 1 },
    pants: { kind: 'jeans', color: 0x4a6fa6 }, shoes: { kind: 'dress', color: 0x4e301d, sole: 0x24170e } },
  { id: 'lucia', name: 'Lucia Caminos', skin: 0xb5805a,
    top: { kind: 'jumpsuit', sleeve: 'short', colors: [0xf2701e], v: 0.07, pocket: true },
    shoes: { kind: 'sneaker', color: 0xf0f0ee, sole: 0xdadada, accent: 0xf0f0ee },
    prints: { back: { text: 'INMATE', color: '#1b1b1b' } } },
  { id: 'jason', name: 'Jason Duval', skin: 0xcf9a76, tattoo: 1,
    top: { kind: 'tank', pattern: 'rib', colors: [0xcfcdc6], hem: 0.06 },
    pants: { kind: 'cargo', color: 0x8b7b5a, end: 'knee' }, shoes: { kind: 'sneaker', color: 0x3a3a3c, sole: 0xf0f0f0, accent: 0xf0f0f0 } },
  { id: 'elon', name: 'Elon Musk', skin: 0xe6bea0,
    top: { kind: 'tee', sleeve: 'short', colors: [0x161618], hem: 0.05 },
    jacket: { kind: 'suit', color: 0x1b1b1e, open: 0.075 },
    pants: { kind: 'jeans', color: 0x1e1f24 }, shoes: { kind: 'boot', color: 0x141414, sole: 0x0c0c0c },
    prints: { front: { text: 'OCCUPY MARS', color: '#f2f2f2' } } },
  { id: 'trump', name: 'Donald Trump', skin: 0xe8a878, bulk: 0.55,
    top: { kind: 'shirt', sleeve: 'long', colors: [0xf6f6f4, 0xeeeeea], v: 0.022, tucked: true, tie: 0xc4122f },
    jacket: { kind: 'suit', color: 0x1d2a48, open: 0.03, pin: true },
    pants: { kind: 'trousers', color: 0x1d2a48, belt: 0x111111 }, shoes: { kind: 'dress', color: 0x111111, sole: 0x0a0a0a } },
  { id: 'pepe', name: 'Żaba Pepe', skin: 0x5f9e3a,
    top: { kind: 'tee', sleeve: 'short', colors: [0x2f5fb5], hem: 0.06 },
    pants: { kind: 'jeans', color: 0x283650 }, shoes: { kind: 'sneaker', color: 0xf4f4f4, sole: 0xe6e6e6, accent: 0xf4f4f4 } },
];

// ---------------------------------------------------------------------------------------------------------------------
// GLSL wspolny (vertex + fragment, cialo + ubrania)
// ---------------------------------------------------------------------------------------------------------------------
const COMMON = /* glsl */ `
uniform vec4 uLm;      // y pasa, y szyi, y kolana, y kostki
uniform vec4 uLm2;     // odleglosc lokcia od barku, nadgarstka od barku
uniform vec3 uNeck, uArmS, uArmE, uArmW, uLegH, uLegK, uLegA;   // stawy (lewa strona, x > 0), poza spoczynkowa
uniform vec4 uTop;     // rodzaj (0 brak,1 tee,2 tank,3 koszula,4 polo,5 kombinezon,6 golf), dl. rekawa, wystawanie pod pasem, wzor
uniform vec4 uTop2;    // dekolt V (m), w spodniach, krawat, luz
uniform vec4 uJk;      // rodzaj (0 brak,1 bomber/dres,2 skora,3 marynarka), rozpiecie, dl. pod pasem, dl. rekawa
uniform vec4 uPt;      // rodzaj (0 brak,1 jeans,2 materialowe,3 bojowki,5 dresowe), y konca nogawki, pasek, baggy
uniform vec4 uSh;      // rodzaj (0 boso,1 trampki,2 wizytowe,3 robocze,4 za kostke), y cholewki, y podeszwy
uniform vec4 uMisc;    // tatuaze, brud, polysk kurtki, lampasy
uniform vec4 uMisc2;   // tusza, przypinka, kieszen na piersi, -
uniform float uInf;    // jednostki geometrii na metr
#define IS(v, n) (abs((v) - (n)) < 0.5)

vec3 oArmC(float y, float s) {
  vec3 sh = uArmS * vec3(s, 1.0, 1.0), el = uArmE * vec3(s, 1.0, 1.0), wr = uArmW * vec3(s, 1.0, 1.0);
  return y > el.y ? mix(el, sh, clamp((y - el.y) / (sh.y - el.y), 0.0, 1.0)) : mix(wr, el, clamp((y - wr.y) / (el.y - wr.y), 0.0, 1.0));
}
vec3 oLegC(float y, float s) {
  vec3 h = uLegH * vec3(s, 1.0, 1.0), k = uLegK * vec3(s, 1.0, 1.0), a = uLegA * vec3(s, 1.0, 1.0);
  return y > k.y ? mix(k, h, clamp((y - k.y) / (h.y - k.y), 0.0, 1.0)) : mix(a, k, clamp((y - a.y) / (k.y - a.y), 0.0, 1.0));
}
float oNeckR(vec3 p) { return length(vec2(p.x, (p.z - uNeck.z) * 1.1)); }
float oVy(float vd) { return uNeck.y - 0.045 - vd; }
float oCollarY(vec3 p, float front, float back) {
  float th = atan(p.x, p.z - uNeck.z), sn = sin(th);
  return mix(back, front, 0.5 + 0.5 * cos(th)) + 0.022 * sn * sn;
}
float oJkOpen(float y) {
  float W = uLm.x, v = 0.0;
  if (uJk.x > 2.5) {
    v = y > W + 0.09 ? mix(0.006, 0.07, smoothstep(W + 0.09, uNeck.y - 0.05, y)) : (y < W - 0.01 ? 0.004 + (W - 0.01 - y) * 0.7 : 0.0);
    if (uJk.y > 0.0) v = max(v, uJk.y + 0.03 * smoothstep(W + 0.22, uNeck.y - 0.02, y));
    return v;
  }
  return uJk.y > 0.0 ? uJk.y + 0.03 * smoothstep(W + 0.22, uNeck.y - 0.02, y) : 0.0;
}
// tusza: przesuniecie wzdluz gladkiej normalnej (m) - to samo dla ciala i ubran, wiec nic nie przebija
float oBulk(vec3 p, vec2 lim) {
  float k = uMisc2.x;
  if (abs(k) < 0.001) return 0.0;
  float arm = smoothstep(0.3, 0.7, lim.y), body = 1.0 - arm;
  float torso = smoothstep(0.8, 0.95, p.y) * (1.0 - smoothstep(1.36, 1.46, p.y)) * body;
  float belly = exp(-pow((p.y - 1.06) / 0.13, 2.0)) * smoothstep(-0.03, 0.09, p.z) * body;
  float back = exp(-pow((p.y - 1.25) / 0.12, 2.0)) * smoothstep(0.0, -0.08, p.z) * body;
  float legs = smoothstep(1.0, 0.85, p.y) * smoothstep(0.15, 0.6, p.y) * body;
  float arms = arm * (1.0 - smoothstep(uLm2.y - 0.12, uLm2.y - 0.02, lim.x));
  float neck = smoothstep(uNeck.y - 0.1, uNeck.y - 0.03, p.y) * (1.0 - smoothstep(uNeck.y, uNeck.y + 0.06, p.y)) * body;
  return k * (0.02 * torso + 0.06 * belly + 0.015 * back + 0.014 * legs + 0.012 * arms + 0.012 * neck);
}
`;

const FRAG = /* glsl */ `
uniform vec3 uSkin, uTopA, uTopB, uTopC, uJkA, uJkB, uPtA, uPtB, uBelt, uShA, uShB, uAcc, uTie;
uniform sampler2D uPrint;
uniform float uDebug;
float oH = 0.0, oCloth = 0.0, oSheen = 0.0, oPx = 0.001;

float oHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float oNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(oHash(i), oHash(i + vec3(1, 0, 0)), f.x), mix(oHash(i + vec3(0, 1, 0)), oHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(oHash(i + vec3(0, 0, 1)), oHash(i + vec3(1, 0, 1)), f.x), mix(oHash(i + vec3(0, 1, 1)), oHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float oLod(float wl) { return clamp(wl / (oPx * 3.0) - 0.5, 0.0, 1.0); }
float oL(float d, float w, float g) { float f = oPx * g * 0.8 + 1e-6; return (1.0 - smoothstep(w - f, w + f, abs(d))) * clamp(w / f, 0.0, 1.0); }
float oE(float d) { float f = oPx * 0.8 + 1e-6; return smoothstep(-f, f, d); }
float oSt(float d, float along) { return oL(d, 0.00055, 1.0) * step(0.42, fract(along / 0.0048)) * oLod(0.0048); }
float oRect(vec2 q, vec2 lo, vec2 hi) { vec2 c = (lo + hi) * 0.5, e = (hi - lo) * 0.5, d = abs(q - c) - e; return oL(max(d.x, d.y), 0.0007, 1.0); }
bool oIn(vec2 q, vec2 lo, vec2 hi) { return q.x > lo.x && q.x < hi.x && q.y > lo.y && q.y < hi.y; }
float oSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }

vec3 oFloral(vec2 uv, vec3 base, vec3 fl, vec3 lf) {
  vec2 g = uv / 0.075, i = floor(g), f = fract(g);
  vec3 c = base;
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 o = vec2(float(xx), float(yy)), cell = i + o;
    float h1 = oHash(vec3(cell, 1.7)), h2 = oHash(vec3(cell, 5.3)), h3 = oHash(vec3(cell, 9.1));
    vec2 d = (o + vec2(h1, h2) * 0.7 + 0.15 - f) * 0.075;
    float size = 0.016 + 0.012 * h3, ca = cos(h1 * 6.28), sa = sin(h1 * 6.28);
    vec2 ld = mat2(ca, sa, -sa, ca) * d;
    if (length(vec2(ld.x - size * 1.25, ld.y * 2.4)) < size * 1.0) c = mix(lf, lf * 0.72, oL(ld.y, 0.0008, 1.0));
    if (length(vec2(ld.x + size * 1.1, ld.y * 2.8)) < size * 0.8) c = lf * 0.88;
    float r = length(d), ang = atan(d.y, d.x) + h3 * 6.283, petal = size * (0.6 + 0.4 * abs(cos(2.5 * ang)));
    if (r < petal) { c = mix(fl, fl * 0.8, smoothstep(petal * 0.35, petal, r)); if (r < size * 0.2) c = vec3(0.96, 0.78, 0.3); }
  }
  return c;
}
vec3 oCheck(vec2 uv, vec3 a, vec3 b, vec3 c) {             // krata (flanela)
  vec2 q = fract(uv / 0.062);
  float bx = 1.0 - smoothstep(0.3, 0.34, q.x), by = 1.0 - smoothstep(0.3, 0.34, q.y);
  vec3 col = a;
  col = mix(col, b, 0.55 * bx); col = mix(col, b, 0.55 * by);
  float th = max(1.0 - smoothstep(0.02, 0.035, abs(q.x - 0.66)), 1.0 - smoothstep(0.02, 0.035, abs(q.y - 0.66)));
  col = mix(col, c, th * 0.75);
  return mix(col, a * 0.55 + b * 0.35 + c * 0.1, smoothstep(0.003, 0.009, oPx));
}

// flag: 0 glowna czesc, 1 klapa / wylozony rog kolnierza, 2 kolnierz stojacy / golf, 3 krawat;  rim: 1 = brzeg materialu
vec3 oShade(float L, vec3 p, vec2 lim, float flag, float rim) {
  oPx = max(length(fwidth(p)), 2.0e-4);
  float W = uLm.x, y = p.y, a = lim.x, s = p.x >= 0.0 ? 1.0 : -1.0;
  bool arm = lim.y > 0.5;
  float n1 = oNoise(p * 55.0), n2 = oNoise(p * 170.0), nl = oNoise(p * 9.0);
  vec3 ac = oArmC(y, s), lc = oLegC(y, s);
  float ang = atan(p.x, p.z - uNeck.z);
  float fine = oLod(0.004);

  // nadruki: jedna probka tekstury w jednolitym przeplywie sterowania (sloty: przod koszulki, plecy, szyja)
  bool torsoTop = L > 0.5 && L < 1.5 && !arm && flag < 0.5;
  vec2 lq = vec2(-1.0); vec4 slot = vec4(0.0);
  if (torsoTop && p.z > 0.02) { lq = vec2(p.x / 0.24 + 0.5, (y - 1.27) / 0.12 + 0.5); slot = vec4(0.0, 0.5, 0.5, 0.5); }
  else if (torsoTop && p.z < -0.02) { lq = vec2(-p.x / 0.28 + 0.5, (y - 1.25) / 0.14 + 0.5); slot = vec4(0.5, 0.5, 0.5, 0.5); }
  else if (L < 0.5 && !arm) { lq = vec2(ang / 3.2 + 0.5, (y - (uNeck.y - 0.07)) / 0.09); slot = vec4(0.0, 0.0, 1.0, 0.5); }
  vec2 puv = (lq.x >= 0.0 && lq.x <= 1.0 && lq.y >= 0.0 && lq.y <= 1.0) ? slot.xy + lq * slot.zw : vec2(2.0);
  vec4 pr = texture2D(uPrint, puv);

  if (uDebug > 0.5) {
    vec3 dbg[7]; dbg[0] = vec3(0.9, 0.7, 0.6); dbg[1] = vec3(0.2, 0.6, 1.0); dbg[2] = vec3(0.1, 0.8, 0.2); dbg[3] = vec3(0.9, 0.2, 0.2);
    dbg[4] = vec3(0.9, 0.9, 0.1); dbg[5] = vec3(0.1, 0.1, 0.1); dbg[6] = vec3(0.8, 0.2, 0.9);
    return dbg[int(L + 0.5)] * (rim > 0.5 ? 0.5 : 1.0);
  }
  vec3 c = uSkin;

  if (L < 0.5) {                                               // ---------------- skora
    c = uSkin * (0.94 + 0.08 * nl + 0.05 * n1 * fine);
    if (arm && uMisc.x > 0.0) {
      float t = oNoise(p * 34.0) * 0.62 + oNoise(p * 85.0) * 0.38;
      float ink = max(oL(t - 0.55, 0.02, 34.0), smoothstep(0.69, 0.71, t));
      ink *= smoothstep(0.04, 0.07, a) * (1.0 - smoothstep(uLm2.y - 0.06, uLm2.y - 0.03, a)) * uMisc.x;
      c = mix(c, vec3(0.09, 0.11, 0.15), ink * 0.82);
    }
    if (!arm && uMisc.x > 0.0 && p.z > 0.0 && y > 1.22 && y < 1.40) {
      float t = oNoise(p * 30.0) * 0.6 + oNoise(p * 80.0) * 0.4;
      float ink = max(oL(t - 0.55, 0.02, 30.0), smoothstep(0.71, 0.73, t)) * smoothstep(0.12, 0.08, abs(p.x - 0.07 * s)) * uMisc.x;
      c = mix(c, vec3(0.09, 0.11, 0.15), ink * 0.8);
    }
    c = mix(c, pr.rgb * 0.9, pr.a * 0.85);                     // tatuaz na szyi
    return c;
  }
  oCloth = 1.0;

  if (L < 1.5) {                                               // ---------------- koszulka / koszula / kombinezon / golf
    float k = uTop.x, vd = uTop2.x, vy = oVy(vd);
    if (flag > 2.5) {                                          // krawat
      c = uTie * (0.9 + 0.08 * n1 + 0.06 * nl);
      c *= 1.0 - 0.12 * oL(p.x, 0.0012, 1.0);
      c = mix(c, c * 1.12, step(0.5, fract((y * 0.7 + p.x) / 0.011)) * 0.35 * fine);
      if (y > vy - 0.015) c *= 0.85;                           // wezel
      oSheen = 0.18; oH += 0.0008 * oL(p.x, 0.003, 1.0);
      return c * (rim > 0.5 ? 0.6 : 1.0);
    }
    c = uTopA;
    vec2 uv = arm ? vec2(atan(p.x - ac.x, p.z - ac.z) * 0.045, y) : vec2(ang * 0.13, y);
    if (IS(uTop.w, 1.0)) {
      c = oFloral(uv, uTopA, uTopB, uTopC);
      c = mix(c, (uTopA * 0.6 + uTopB * 0.25 + uTopC * 0.15), smoothstep(0.004, 0.012, oPx));
    } else if (IS(uTop.w, 4.0)) {
      c = oCheck(uv, uTopA, uTopB, uTopC);
    } else if (IS(uTop.w, 2.0)) {
      float rib = sin(uv.x / 0.0042 * 6.2832);
      c *= 1.0 - 0.06 * rib * fine; oH += 0.00022 * rib * fine;
    }
    c *= 0.95 + 0.06 * n1 * fine + 0.03 * nl;
    c = mix(c, pr.rgb, pr.a);                                  // nadruk
    if (flag > 1.5) {                                          // kolnierz stojacy / golf
      if (IS(k, 6.0)) { float r = sin(y / 0.0055 * 6.2832); c *= 0.93 + 0.06 * r * oLod(0.0055); oH += 0.0005 * r * oLod(0.0055); }
      else c *= 1.0 - 0.25 * oSt(oCollarY(p, uNeck.y - 0.022, uNeck.y + 0.01) - y - 0.004, ang * 0.08);
      return c * (rim > 0.5 ? 0.62 : 0.97);
    }
    if (flag > 0.5) {                                          // wylozone rogi kolnierza
      float e = abs(p.x) - (y - vy) * 0.5;
      c *= 1.0 - 0.25 * oSt(e - 0.031, y);
      return c * (rim > 0.5 ? 0.62 : 0.96);
    }
    if (!arm) {
      float drape = oNoise(vec3(p.x * 26.0, y * 4.5, p.z * 26.0)) - 0.5;
      oH += drape * (0.0025 + 0.003 * uTop2.w) * oLod(0.03) * smoothstep(1.36, 1.15, y);
      if (uTop2.y > 0.5) oH += 0.0012 * sin(y * 420.0 + nl * 7.0) * smoothstep(W + 0.08, W + 0.03, y) * oLod(0.015);
    } else {
      oH += 0.0015 * sin(a * 300.0 + nl * 6.0) * exp(-pow((a - uLm2.x) / 0.035, 2.0)) * oLod(0.02);
      oH += 0.0012 * sin(a * 220.0 + nl * 5.0) * smoothstep(0.03, 0.0, a) * oLod(0.02);
    }
    if (!arm && uTop2.y < 0.5 && !IS(k, 5.0)) {                // obszycie dolu
      float d = y - (W - uTop.z);
      c *= 1.0 - 0.18 * oSt(d - 0.013, ang * 0.13);
      oH -= 0.0006 * oL(d - 0.013, 0.0007, 1.0);
    }
    if (arm) {                                                 // obszycie / mankiet rekawa
      float d = uTop.y - a;
      c *= 1.0 - 0.18 * oSt(d - 0.013, atan(p.x - ac.x, p.z - ac.z) * 0.045);
      if ((IS(k, 3.0) || IS(k, 6.0)) && uTop.y > uLm2.y - 0.05) {
        c *= 1.0 - 0.15 * oL(d - 0.05, 0.0006, 1.0);
        if (IS(k, 3.0)) { float bt = length(vec2((p.x - ac.x) * s - 0.03, d - 0.022)); c = mix(c, uTopB * 0.9, 1.0 - oE(bt - 0.0035)); }
        if (IS(k, 6.0)) { float r = sin(a / 0.005 * 6.2832); c *= 1.0 - 0.05 * r * fine * step(d, 0.05); }
      }
    }
    if (!arm && abs(p.x) > 0.1 && y < 1.36) {                  // szew boczny
      c *= 1.0 - 0.14 * oL(p.z + 0.012, 0.0008, 1.0);
      oH -= 0.0005 * oL(p.z + 0.012, 0.0009, 1.0);
    }
    if (!arm && (IS(k, 1.0) || IS(k, 2.0))) {                  // sciagacz przy dekolcie / wycieciu V
      float drop = IS(k, 2.0) ? 0.1 : 0.045;
      float rn = oCollarY(p, uNeck.y - drop, uNeck.y - drop * 0.3) - y;
      if (vd > 0.0 && p.z > 0.0) rn = min(rn, (abs(p.x) - (y - vy) * 0.5) * 1.6);
      float band = 1.0 - oE(rn - 0.011);
      c *= 1.0 - 0.07 * band; oH += 0.0009 * band;
      c *= 1.0 - 0.15 * oSt(rn - 0.012, ang * 0.08 + y);
    }
    if (!arm && IS(k, 2.0)) {
      vec3 sh = uArmS * vec3(s, 1.0, 1.0);
      float rn = length((p - sh) * vec3(1.0, 0.7, 1.0)) - 0.105;
      float band = 1.0 - oE(rn - 0.01);
      c *= 1.0 - 0.06 * band; oH += 0.0008 * band;
    }
    if (!arm && (IS(k, 3.0) || IS(k, 4.0) || IS(k, 5.0))) {    // listwa z guzikami / zamek
      float py = IS(k, 4.0) ? 1.30 : (IS(k, 5.0) ? W - 0.12 : W - uTop.z + 0.01);
      if (uTop2.y > 0.5 && IS(k, 3.0)) py = W - 0.05;
      if (p.z > 0.03 && y < vy && y > py) {
        float lx = p.x + 0.004;
        c *= 1.0 - 0.18 * (oSt(lx - 0.013, y) + oSt(lx + 0.013, y));
        oH += 0.0006 * (1.0 - oE(abs(lx) - 0.013));
        if (IS(k, 5.0)) {
          float tooth = step(0.5, fract(y / 0.0035)) * fine;
          c = mix(c, vec3(0.55, 0.55, 0.52), (1.0 - oE(abs(lx) - 0.0025)) * (0.6 + 0.4 * tooth));
        } else {
          float by = mod(vy - 0.03 - y + 0.0375, 0.075) - 0.0375;
          float br = length(vec2(lx, by));
          float bm = 1.0 - oE(br - 0.0048);
          vec3 bc = mix(uTopB, uTopA, 0.25) * (0.85 + 0.25 * (1.0 - br / 0.0048));
          c = mix(c, bc, bm); oH += 0.0008 * bm;
          c *= 1.0 - 0.5 * bm * (oL(length(vec2(lx - 0.0015, by)), 0.0006, 1.0) + oL(length(vec2(lx + 0.0015, by)), 0.0006, 1.0));
        }
      }
      if (uMisc2.z > 0.5) {                                    // kieszenie na piersi
        vec2 q = vec2(p.x * s, y);
        if (p.z > 0.03 && (s > 0.0 || IS(k, 3.0))) {
          c *= 1.0 - 0.25 * oRect(q, vec2(0.045, 1.19), vec2(0.115, 1.285));
          c *= 1.0 - 0.2 * oL(y - 1.265, 0.0007, 1.0) * step(0.045, q.x) * step(q.x, 0.115);
          if (oIn(q, vec2(0.045, 1.19), vec2(0.115, 1.285))) oH += 0.0006;
        }
      }
      if (IS(k, 5.0) && y < W) {                               // nogawki kombinezonu
        float d = p.z - lc.z;
        c *= 1.0 - 0.15 * oL(d, 0.0008, 1.0) * step(0.0, (p.x - lc.x) * s);
        oH += 0.0015 * sin(y * 260.0 + nl * 5.0) * exp(-pow((y - uLm.z) / 0.05, 2.0)) * oLod(0.025);
      }
    }
    if (uJk.x > 0.5 && !arm && p.z > 0.0) {                    // cien rozpietej kurtki na koszulce
      float e = oJkOpen(y) - abs(p.x);
      if (e > 0.0) c *= 1.0 - 0.3 * exp(-e / 0.01);
    }
    if (uMisc.y > 0.0) {                                       // brud, plamy potu, przetarcia
      float sn = oNoise(p * 11.0) * 0.6 + oNoise(p * 31.0) * 0.4;
      float st = smoothstep(0.69, 0.72, sn) * uMisc.y;
      c = mix(c, c * vec3(0.8, 0.72, 0.56), st);
      c *= 1.0 - 0.15 * oL(sn - 0.705, 0.008, 31.0) * uMisc.y;
      vec3 pit = vec3(0.13 * s, 1.27, -0.03);
      c = mix(c, c * vec3(0.85, 0.78, 0.55), smoothstep(0.075, 0.03, length(p - pit)) * uMisc.y * (0.7 + 0.3 * n1));
      c = mix(c, c * vec3(0.8, 0.74, 0.62), smoothstep(0.5, 0.9, nl) * 0.35 * uMisc.y);
      if (oNoise(p * 40.0) > 0.86) c *= 1.0 - 0.25 * uMisc.y;
    }
    return c * (rim > 0.5 ? 0.62 : 1.0);
  }

  if (L < 2.5) {                                               // ---------------- kurtka / marynarka
    float k = uJk.x, ow = oJkOpen(y);
    float e = abs(p.x) - ow;
    c = uJkA * (0.95 + 0.05 * nl);
    float hemY = W - uJk.z;
    float aroundA = atan(p.x - ac.x, p.z - ac.z) * 0.045;
    if (IS(k, 1.0)) {                                          // bomber / bluza dresowa
      c *= 0.96 + 0.05 * n1 * fine;
      oH += (oNoise(vec3(p.x * 22.0, y * 7.0, p.z * 22.0)) - 0.5) * 0.004 * oLod(0.03);
      float rib = sin((arm ? aroundA : ang * 0.13) / 0.0035 * 6.2832);
      if (flag > 1.5) { float r = sin(y / 0.0035 * 6.2832); c *= 0.92 + 0.04 * r * fine; if (uMisc.w > 0.5) c = mix(c, uJkB, 0.85); return c * (rim > 0.5 ? 0.6 : 1.0); }
      if (!arm && y < hemY + 0.045) { c *= 0.9 + 0.04 * rib * fine; oH += 0.0003 * rib * fine; c *= 1.0 - 0.3 * oL(y - hemY - 0.045, 0.0007, 1.0); }
      if (arm && a > uJk.w - 0.04) { c *= 0.9 + 0.04 * rib * fine; c *= 1.0 - 0.3 * oL(a - uJk.w + 0.04, 0.0007, 1.0); }
      if (!arm && p.z > 0.0 && y < uNeck.y - 0.01) {           // zamek
        float zx = ow > 0.0 ? e : abs(p.x);
        float tooth = step(0.5, fract(y / 0.003)) * fine;
        c = mix(c, vec3(0.62, 0.62, 0.6), (1.0 - oE(zx - 0.003)) * (0.55 + 0.45 * tooth));
        c *= 1.0 - 0.2 * oSt(zx - 0.009, y);
      }
      if (!arm && p.z > 0.03) {
        float d = oSeg(vec2(abs(p.x), y), vec2(0.07, W + 0.015), vec2(0.105, W + 0.13));
        c *= 1.0 - 0.35 * oL(d, 0.0012, 1.0); oH -= 0.0008 * oL(d, 0.0012, 1.0);
      }
      if (uMisc.w > 0.5) {                                     // lampasy
        if (arm && (p.x - ac.x) * s > 0.0) {
          float d = p.z - ac.z, st3 = 0.0;
          for (int i = -1; i <= 1; i++) st3 = max(st3, oL(d - float(i) * 0.011, 0.0035, 1.0));
          c = mix(c, uJkB, st3);
        }
        if (!arm && p.z > 0.0 && y < uNeck.y) c = mix(c, uJkB, oL(e - 0.008, 0.0028, 1.0));
      }
    } else if (IS(k, 2.0)) {                                   // skora
      oSheen = uMisc.z;
      oH += (oNoise(vec3(p.x * 40.0, y * 14.0, p.z * 40.0)) - 0.5) * 0.004 * oLod(0.02);
      c *= 0.88 + 0.22 * oNoise(p * 18.0) + 0.06 * n2 * fine;
      if (flag > 1.5) return c * (rim > 0.5 ? 0.55 : 0.95);
      if (!arm) {
        if (p.z > 0.02 && y < 1.33 && y > hemY) { float d = abs(p.x) - 0.085; c *= 1.0 - 0.3 * oL(d, 0.0008, 1.0); c *= 1.0 - 0.2 * oSt(d - 0.004, y); }
        c *= 1.0 - 0.3 * oL(y - 1.335, 0.0008, 1.0);
        if (y < hemY + 0.05) { c *= 0.95; c *= 1.0 - 0.3 * oL(y - hemY - 0.05, 0.0008, 1.0); }
        if (p.z > 0.0 && ow > 0.0) { float tooth = step(0.5, fract(y / 0.003)) * fine; c = mix(c, uJkB, (1.0 - oE(e - 0.0028)) * (0.5 + 0.5 * tooth)); }
        if (p.z > 0.03) { float d = oSeg(vec2(abs(p.x), y), vec2(0.06, W + 0.02), vec2(0.12, W + 0.1)); c = mix(c, uJkB * 0.8, oL(d, 0.0012, 1.0) * 0.7); }
      } else {
        if (a > uJk.w - 0.04) { c *= 0.94; c *= 1.0 - 0.3 * oL(a - uJk.w + 0.04, 0.0008, 1.0); }
        oH += 0.002 * sin(a * 280.0 + nl * 6.0) * exp(-pow((a - uLm2.x) / 0.04, 2.0)) * oLod(0.02);
      }
    } else {                                                   // marynarka
      c *= 0.96 + 0.05 * n2 * fine;
      oH += (oNoise(vec3(p.x * 18.0, y * 6.0, p.z * 18.0)) - 0.5) * 0.002 * oLod(0.04);
      if (flag > 0.5 && flag < 1.5) {                          // klapa
        float lw = 0.04 * smoothstep(W + 0.09, W + 0.2, y);
        c *= 0.9 + 0.08 * clamp(e / max(lw, 0.001), 0.0, 1.0);
        c *= 1.0 + 0.1 * oL(e - 0.002, 0.0015, 1.0);
        c *= 1.0 - 0.25 * oSt(e - lw + 0.004, y);
        if (uMisc2.y > 0.5 && s > 0.0) {                       // przypinka z flaga na lewej klapie
          vec2 q = vec2(p.x - (ow + 0.02), y - 1.335);
          if (abs(q.x) < 0.007 && abs(q.y) < 0.0045) {
            c = step(0.5, fract((q.y + 0.0045) / 0.0018)) > 0.5 ? vec3(0.8, 0.08, 0.12) : vec3(0.95);
            if (q.x < -0.001 && q.y > 0.0) c = vec3(0.1, 0.16, 0.45);
            oSheen = 0.5;
          }
        }
        return c * (rim > 0.5 ? 0.6 : 1.0);
      }
      if (!arm) {
        if (p.z > 0.0 && abs(e) < 0.002) c *= 0.75;
        vec2 q = vec2(p.x * s, y);
        if (p.z > 0.03 && s > 0.0) c *= 1.0 - 0.35 * oRect(q, vec2(0.065, 1.285), vec2(0.115, 1.296));
        if (p.z > 0.02) { c *= 1.0 - 0.3 * oRect(q, vec2(0.07, W + 0.005), vec2(0.14, W + 0.04)); if (oIn(q, vec2(0.07, W + 0.005), vec2(0.14, W + 0.04))) oH += 0.001; }
        if (p.z > 0.02 && uJk.y < 0.001) for (int i = 0; i < 2; i++) {
          float by = W + 0.075 - float(i) * 0.08;
          float bm = 1.0 - oE(length(vec2(p.x + 0.004, y - by)) - 0.0065);
          c = mix(c, uJkA * 0.45, bm); oH += 0.0012 * bm;
        }
        if (p.z > 0.02 && uJk.y > 0.001 && p.x > 0.0) for (int i = 0; i < 2; i++) {   // guziki rozpietej marynarki
          float by = W + 0.075 - float(i) * 0.08;
          float bm = 1.0 - oE(length(vec2(abs(p.x) - ow - 0.012, y - by)) - 0.0065);
          c = mix(c, uJkA * 0.45, bm);
        }
        if (p.z < -0.05) c *= 1.0 - 0.3 * oL(p.x, 0.0007, 1.0) * step(y, hemY + 0.15);
      } else {
        float d = uJk.w - a;
        if ((p.x - ac.x) * s > 0.0) for (int i = 0; i < 3; i++) {
          float br = length(vec2(p.z - ac.z, d - 0.03 - float(i) * 0.014));
          c = mix(c, uJkA * 0.45, 1.0 - oE(br - 0.004));
        }
        oH += 0.0012 * sin(a * 260.0 + nl * 6.0) * exp(-pow((a - uLm2.x) / 0.04, 2.0)) * oLod(0.02);
      }
    }
    return c * (rim > 0.5 ? 0.55 : 1.0);
  }

  if (L < 3.5) {                                               // ---------------- spodnie
    float k = uPt.x;
    c = uPtA * (0.95 + 0.06 * nl);
    float out_ = (p.x - lc.x) * s, dz = p.z - lc.z;
    bool leg = y < W - 0.1;
    oH += 0.0016 * sin(y * 240.0 + nl * 6.0) * exp(-pow((y - uLm.z) / 0.05, 2.0)) * oLod(0.025) * step(dz, 0.0);
    oH += (0.0012 + 0.003 * uPt.w) * sin(y * 200.0 + nl * 8.0) * smoothstep(uSh.y + 0.14 + 0.1 * uPt.w, uSh.y + 0.01, y) * oLod(0.03);
    oH += (oNoise(vec3(p.x * 30.0, y * 5.0, p.z * 30.0)) - 0.5) * 0.002 * (1.0 + uPt.w) * oLod(0.04);
    vec2 q = vec2(abs(p.x), y);
    float la = abs(ang);
    if (IS(k, 1.0)) {                                          // dzinsy
      float tw = oNoise(vec3((p.x + p.z) * 420.0, y * 70.0 + (p.x - p.z) * 300.0, 0.5));
      c *= 0.9 + 0.18 * tw * oLod(0.003);
      float fade = smoothstep(0.0, 0.05, dz) * exp(-pow((y - 0.74) / 0.12, 2.0)) + 0.6 * smoothstep(0.02, 0.06, dz) * exp(-pow((y - uLm.z) / 0.05, 2.0));
      c = mix(c, c * 1.45 + 0.04, clamp(fade * (0.45 + 0.4 * nl), 0.0, 1.0) * 0.7);
      vec3 thread = vec3(0.8, 0.58, 0.28);
      if (leg) {
        c = mix(c, thread, oSt(dz, y) * step(0.0, out_) * 0.8);
        c = mix(c, thread, oSt(dz + 0.003, y) * step(0.0, out_) * 0.6);
        c *= 1.0 - 0.15 * oL(dz, 0.0009, 1.0) * step(0.0, out_);
        c = mix(c, thread, oSt(dz, y) * step(out_, 0.0) * 0.5);
      }
      if (p.z > 0.02) {
        float d = length(q - vec2(0.145, W + 0.01)) - 0.07;
        if (q.x < 0.15 && y < W + 0.01) { c = mix(c, thread, oSt(d, q.x + y) * 0.8); c *= 1.0 - 0.3 * oL(d + 0.003, 0.0008, 1.0); }
        if (y > W - 0.13 && y < W - 0.01) { c = mix(c, thread, oSt(p.x - 0.03, y) * 0.8); c *= 1.0 - 0.3 * oL(p.x, 0.0008, 1.0); }
        float jd = length(vec2(p.x, y - (W - 0.13)) - vec2(0.0, 0.03)) - 0.03;
        if (p.x > 0.0 && y < W - 0.13 + 0.03) c = mix(c, thread, oSt(jd, p.x) * 0.8);
        if (abs(p.x) < 0.006 && abs(y - (W - 0.005)) < 0.006) c = mix(c, vec3(0.7, 0.62, 0.45), 0.9);
      }
      if (p.z < -0.03 && y > W - 0.19 && y < W - 0.03) {
        float rd = max(abs(q.x - 0.08) - 0.05, abs(y - (W - 0.11)) - 0.06 + max(0.0, 0.03 - abs(q.x - 0.08)) * 0.4);
        c = mix(c, thread, oSt(rd, q.x + y) * 0.85);
        c = mix(c, thread, oSt(rd + 0.004, q.x + y) * 0.6);
        oH += 0.0006 * (1.0 - oE(rd));
      }
      float wb = y - (W - 0.02);
      c = mix(c, thread, oSt(wb, ang * 0.13) * 0.7);
      c *= 1.0 - 0.18 * oL(wb, 0.0008, 1.0);
      if (wb > 0.0 && (abs(la - 0.95) < 0.035 || abs(la - 2.2) < 0.035 || la > 3.105)) { c *= 1.08; oH += 0.0015; }
    } else if (IS(k, 2.0)) {                                   // materialowe
      c *= 0.97 + 0.04 * n2 * fine;
      if (leg) {
        float cr = p.x - lc.x;
        oH += 0.0012 * oL(cr, 0.004, 1.0) * step(0.02, dz);
        c *= 1.0 + 0.06 * oL(cr, 0.0015, 1.0) * step(0.02, dz);
        c *= 1.0 - 0.15 * oL(dz, 0.0007, 1.0) * step(0.0, out_);
      }
      if (p.z > 0.02) { float d = oSeg(q, vec2(0.11, W), vec2(0.15, W - 0.13)); c *= 1.0 - 0.3 * oL(d, 0.0008, 1.0); }
      c *= 1.0 - 0.25 * oL(y - (W - 0.02), 0.0007, 1.0);
      if (p.z < -0.03) c *= 1.0 - 0.3 * oL(max(abs(q.x - 0.08) - 0.04, abs(y - (W - 0.07)) - 0.0012), 0.0007, 1.0);
      if (y > W - 0.02 && (abs(la - 0.95) < 0.03 || abs(la - 2.2) < 0.03 || la > 3.11)) { c *= 0.92; oH += 0.0012; }
    } else if (IS(k, 3.0)) {                                   // bojowki
      float cv = oNoise(vec3(p.x * 300.0, y * 300.0, p.z * 300.0));
      c *= 0.93 + 0.12 * cv * oLod(0.004) + 0.05 * oNoise(p * 25.0);
      if (leg) { c *= 1.0 - 0.2 * oSt(dz, y) * step(0.0, out_); c *= 1.0 - 0.15 * oL(dz, 0.0009, 1.0) * step(0.0, out_); }
      if (out_ > 0.025 && y > 0.6 && y < 0.78 && y > uPt.y + 0.05) {
        vec2 qq = vec2(dz, y);
        if (abs(dz) < 0.055 && y < 0.755) { oH += 0.002; c *= 0.97; }
        c *= 1.0 - 0.35 * oRect(qq, vec2(-0.055, 0.6), vec2(0.055, 0.755));
        c *= 1.0 - 0.3 * oL(y - 0.725, 0.0009, 1.0) * step(abs(dz), 0.057);
        if (abs(dz) < 0.057 && y > 0.725 && y < 0.758) { c *= 0.92; oH += 0.002; }
        c = mix(c, c * 0.55, 1.0 - oE(length(vec2(dz, y - 0.735)) - 0.004));
      }
      if (p.z > 0.02) { float d = oSeg(q, vec2(0.1, W), vec2(0.15, W - 0.12)); c *= 1.0 - 0.35 * oL(d, 0.001, 1.0); }
      c *= 1.0 - 0.25 * oL(y - (W - 0.025), 0.0008, 1.0);
      if (y > W - 0.025 && (abs(la - 0.95) < 0.03 || abs(la - 2.2) < 0.03 || la > 3.11)) { c *= 0.9; oH += 0.0015; }
    } else if (IS(k, 5.0)) {                                   // dresowe
      c *= 0.96 + 0.05 * n1 * fine;
      if (out_ > 0.0 && leg) { float st3 = 0.0; for (int i = -1; i <= 1; i++) st3 = max(st3, oL(dz - float(i) * 0.012, 0.0038, 1.0)); c = mix(c, uPtB, st3); }
      if (y > W - 0.035) { c *= 0.93; oH += 0.0006 * sin(ang * 0.13 / 0.006 * 6.28) * fine; }
    }
    if (uPt.y > 0.2) { float d = y - uPt.y; c *= 1.0 - 0.2 * oSt(d - 0.015, atan(p.x - lc.x, p.z - lc.z) * 0.06); }
    else c *= 1.0 - 0.2 * oL(y - uPt.y - 0.02, 0.0007, 1.0);
    {                                                          // cien pod brzegiem kurtki / koszulki
      float hem = 9.0;
      if (uJk.x > 0.5) hem = W - uJk.z;
      if (uTop.x > 0.5 && uTop2.y < 0.5) hem = min(hem, W - uTop.z);
      float d = hem - y;
      if (hem < 5.0 && d > 0.0) c *= 1.0 - 0.32 * exp(-d / 0.02);
    }
    if (uMisc.y > 0.0) {
      float sn = oNoise(p * 13.0) * 0.6 + oNoise(p * 37.0) * 0.4;
      c = mix(c, c * 0.62, smoothstep(0.66, 0.7, sn) * uMisc.y);
      c = mix(c, c * vec3(0.85, 0.8, 0.7), smoothstep(0.35, 0.1, y) * 0.5 * uMisc.y);
    }
    return c * (rim > 0.5 ? 0.55 : 1.0);
  }

  if (L < 5.5) {                                               // ---------------- buty
    float k = uSh.x;
    vec3 fc = oLegC(uLegA.y, s);
    float fz = p.z - uLegA.z, fx = (p.x - fc.x) * s;
    bool sole = y < uSh.z;
    if (IS(k, 2.0)) {
      oSheen = 0.45;
      c = sole ? uShB : uShA * (0.92 + 0.12 * oNoise(p * 30.0));
      if (!sole) {
        float cap = length(vec2(fx * 1.3, fz - 0.21)) - 0.11;
        c *= 1.0 - 0.3 * oL(cap, 0.0008, 1.0);
        if (fz > 0.03 && fz < 0.085 && abs(fx) < 0.02 && y > 0.06) c *= 0.85 + 0.15 * step(0.5, fract(fz / 0.012));
        c *= 1.0 - 0.3 * oL(y - uSh.z - 0.003, 0.0007, 1.0);
      } else c *= 1.0 - 0.3 * oL(y - uSh.z * 0.5, 0.0006, 1.0);
    } else if (IS(k, 3.0)) {
      c = sole ? uShB : uShA * (0.85 + 0.25 * oNoise(p * 26.0) + 0.06 * n2 * fine);
      if (!sole) {
        oSheen = 0.12;
        c *= 1.0 - 0.25 * oSt(y - uSh.z - 0.006, fz + fx);
        if (fz > -0.02 && abs(fx) < 0.022 && y > 0.07) {
          float d1 = fract((y + fx * 0.8) / 0.018) - 0.5, d2 = fract((y - fx * 0.8) / 0.018) - 0.5;
          float lace = max(oL(d1, 0.09, 1.0 / 0.018), oL(d2, 0.09, 1.0 / 0.018)) * step(abs(fx), 0.016);
          c = mix(c, vec3(0.62, 0.48, 0.3), lace * 0.85); oH += 0.0008 * lace;
          float hook = length(vec2(abs(fx) - 0.018, mod(y, 0.022) - 0.011)); c = mix(c, vec3(0.7, 0.65, 0.55), 1.0 - oE(hook - 0.0025));
        }
        float cap = length(vec2(fx * 1.2, fz - 0.2)) - 0.1; c *= 1.0 - 0.3 * oSt(cap, fx);
      } else { c *= 0.9 + 0.2 * step(0.5, fract(fz / 0.012)) * step(y, uSh.z * 0.5); oH += 0.0015 * step(0.5, fract(fz / 0.012)); }
    } else {
      if (sole) {
        c = uShB * (0.95 + 0.05 * n1);
        c *= 1.0 - 0.25 * oL(y - uSh.z * 0.55, 0.0007, 1.0);
      } else {
        c = uShA * (0.96 + 0.05 * n1 * fine);
        if (fz > -0.005 && fz < 0.1 && abs(fx) < 0.02 && y > 0.055) {
          float u = fz / 0.013;
          float d1 = abs(fract(u + fx / 0.04) - 0.5), d2 = abs(fract(u - fx / 0.04) - 0.5);
          float lace = max(1.0 - smoothstep(0.08, 0.16, d1), 1.0 - smoothstep(0.08, 0.16, d2)) * step(abs(fx), 0.016);
          vec3 lc2 = dot(uShA, vec3(0.33)) > 0.75 ? uShA * 0.86 : uShB;
          c = mix(uShA * 0.88, lc2, lace);
          oH += 0.0008 * lace;
          c *= 1.0 - 0.3 * oL(abs(fx) - 0.019, 0.0008, 1.0);
        }
        if (fz > 0.105) { c *= 0.97; c *= 1.0 - 0.25 * oSt(length(vec2(fx * 1.2, fz - 0.2)) - 0.095, fx); }
        if (fx > 0.022) { float d = y - (0.036 + 0.3 * clamp(0.07 - fz, 0.0, 0.11)); c = mix(c, uAcc, oL(d, 0.006, 1.0) * step(-0.09, fz) * step(fz, 0.09)); }
        if (fz < -0.06 && y > uSh.y - 0.04) c = mix(c, uAcc, 0.85);
        if (y > uSh.y - 0.012) c *= 0.9;
      }
    }
    return c * (rim > 0.5 ? 0.55 : 1.0);
  }

  c = uBelt * (0.9 + 0.15 * oNoise(p * 40.0));                // ---------------- pasek
  oSheen = 0.15;
  float bd = abs(y - W) - 0.0145;
  c *= 1.0 - 0.3 * oSt(bd + 0.0025, ang * 0.13);
  if (p.z > 0.03 && abs(p.x) < 0.024) {
    float fr = max(abs(p.x) - 0.022, abs(y - W) - 0.0135);
    float inner = max(abs(p.x) - 0.014, abs(y - W) - 0.007);
    if (fr < 0.0 && inner > 0.0) { c = vec3(0.72, 0.7, 0.64) * (0.85 + 0.25 * n1); oSheen = 0.7; oH += 0.0015; }
    c *= 1.0 - 0.4 * oL(fr, 0.0006, 1.0);
    if (abs(p.x + 0.004) < 0.0012 && inner < 0.0) c = vec3(0.72, 0.7, 0.64);
  }
  if (p.z > 0.03 && p.x < -0.03 && p.x > -0.09) { float hx = mod(p.x, 0.025) - 0.0125; c = mix(c, c * 0.4, 1.0 - oE(length(vec2(hx, y - W)) - 0.0018)); }
  return c * (rim > 0.5 ? 0.55 : 1.0);
}

vec3 oPerturb(vec3 surf, vec3 n, vec2 dH, float fd) {
  vec3 sx = dFdx(surf), sy = dFdy(surf);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * n - grad);
}
`;

// ---------------------------------------------------------------------------------------------------------------------
// pomocnicze JS
// ---------------------------------------------------------------------------------------------------------------------
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function vnoise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const h = (a, b, c) => hash3(ix + a, iy + b, iz + c);
  return lerp(lerp(lerp(h(0, 0, 0), h(1, 0, 0), u), lerp(h(0, 1, 0), h(1, 1, 0), u), v),
              lerp(lerp(h(0, 0, 1), h(1, 0, 1), u), lerp(h(0, 1, 1), h(1, 1, 1), u), v), w);
}
// odwrotnosc 3x3 w ukladzie kolumnowym (wzor wierszowy na transpozycji daje transpozycje odwrotnosci = to samo w pamieci)
function inv3(m, o) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const r = 1 / ((a * A + b * B + c * C) || 1e-9);
  o[0] = A * r; o[1] = -(b * i - c * h) * r; o[2] = (b * f - c * e) * r;
  o[3] = B * r; o[4] = (a * i - c * g) * r; o[5] = -(a * f - c * d) * r;
  o[6] = C * r; o[7] = -(a * h - b * g) * r; o[8] = (a * e - b * d) * r;
  return o;
}
const SLEEVE = { short: 0.165, elbow: 0.25, long: 0.475 };
const SHOE_TOP = { barefoot: 0.06, sneaker: 0.095, hightop: 0.17, dress: 0.092, boot: 0.2 };
const SOLE_Y = { barefoot: 0, sneaker: 0.028, hightop: 0.028, dress: 0.016, boot: 0.03 };

// ---------------------------------------------------------------------------------------------------------------------
// Kawalki ubran dla stroju: pole f (> 0 = material), grubosc th (m), wygladzenie sm, prosty krój nogawki / rekawa.
// order: kolejnosc warstw od ciala (wyzszy lezy na wierzchu i zaslania nizszy).
// ---------------------------------------------------------------------------------------------------------------------
function piecesFor(o, K) {
  const { W, NY, NZ, KN, legA } = K;
  const t = o.top || { kind: 'none' }, j = o.jacket || { kind: 'none' }, pt = o.pants || { kind: 'none' }, sh = o.shoes || { kind: 'barefoot' };
  const tk = t.kind, jk = j.kind, pk = t.kind === 'jumpsuit' ? 'none' : pt.kind, sk = sh.kind;
  const out = [];
  const armK = (v) => sstep(0.3, 0.7, v.w);
  const blend = (v, fT, fA) => { const k = armK(v); return fT * (1 - k) + fA * k; };
  const collarY = (v, front, back) => { const th = Math.atan2(v.x, v.z - NZ), sn = Math.sin(th); return lerp(back, front, 0.5 + 0.5 * Math.cos(th)) + 0.022 * sn * sn; };
  const neckR = (v) => Math.hypot(v.x, (v.z - NZ) * 1.1);
  const vyOf = (vd) => NY - 0.045 - vd;
  const vSDF = (v, vd) => (vd > 0 ? Math.min(v.z, (v.y - vyOf(vd)) * 0.5 - Math.abs(v.x)) : -1);
  const holeSDF = (v, drop, vd) => {             // > 0 w otworze na szyje (skora)
    const th = Math.atan2(v.x, v.z - NZ), cf = Math.pow(Math.max(0, Math.cos(th)), 3);
    const h = Math.min(0.068 + (0.05 + drop) * cf - neckR(v), v.y - collarY(v, NY - drop, NY - drop * 0.3), v.y - (NY - 0.16));
    return Math.max(h, vSDF(v, vd));
  };
  const jkOpen = (y) => {
    let v = 0;
    if (jk === 'suit') {
      v = y > W + 0.09 ? lerp(0.006, 0.07, sstep(W + 0.09, NY - 0.05, y)) : (y < W - 0.01 ? 0.004 + (W - 0.01 - y) * 0.7 : 0);
      if (j.open) v = Math.max(v, j.open + 0.03 * sstep(W + 0.22, NY - 0.02, y));
      return v;
    }
    return j.open ? j.open + 0.03 * sstep(W + 0.22, NY - 0.02, y) : 0;
  };
  const openSDF = (v) => Math.min(v.z, jkOpen(v.y) - Math.abs(v.x));
  const fold = (v, amp) => (vnoise(v.x * 13, v.y * 9, v.z * 13) - 0.5) * amp;
  const shoeTop = SHOE_TOP[sk] ?? 0.06;
  const legEnd = pt.end === 'knee' ? KN + 0.06 : pt.end === 'short' ? KN + 0.13 : Math.max(0.03, shoeTop - 0.035);

  // --- gora
  const tucked = !!t.tucked && tk !== 'jumpsuit';
  const topBase = tk === 'tank' ? 0.0035 : tk === 'shirt' ? 0.006 : tk === 'jumpsuit' ? 0.008 : tk === 'turtleneck' ? 0.0055 : 0.005;
  const topT = topBase + (t.loose || 0) * 0.005;
  if (tk !== 'none') {
    const drop = tk === 'tank' ? 0.1 : 0.045, vd = t.v || 0, hem = tucked ? 0.035 : (t.hem ?? 0.05);
    const sleeve = tk === 'tank' ? -1 : SLEEVE[t.sleeve || 'short'];
    const jump = tk === 'jumpsuit';
    out.push({ name: 'top', L: 1, flag: 0, order: tucked ? 1 : 3,
      f: (v) => {
        let ft = jump ? v.y - legEnd : v.y - (W - hem);
        ft = Math.min(ft, -holeSDF(v, drop, vd));
        if (tk === 'tank') { const sx = Math.sign(v.x) * K.armS.x; ft = Math.min(ft, Math.hypot(v.x - sx, (v.y - K.armS.y) * 0.7, v.z - K.armS.z) - 0.105); }
        return blend(v, ft, sleeve - v.a);
      },
      th: (v) => {
        const k = armK(v);
        let tt = topT + (tk === 'tank' ? 0 : fold(v, 0.004));
        if (!tucked && !jump) tt += 0.008 * sstep(W + 0.12, W - hem, v.y) * (1 + (t.loose || 0));
        if (tucked) tt = v.y < W + 0.02 ? 0.0025 : tt + 0.004 * sstep(W + 0.02, W + 0.05, v.y) * sstep(W + 0.11, W + 0.06, v.y);
        let ta = topT + fold(v, 0.003);
        ta += sleeve < 0.3 ? 0.008 * sstep(sleeve - 0.08, sleeve, v.a) * (1 + (t.loose || 0)) : 0.002 * sstep(sleeve - 0.05, sleeve, v.a);
        return tt * (1 - k) + ta * k;
      },
      sm: 1, radial: jump ? 'leg' : (sleeve >= SLEEVE.long - 0.01 ? 'arm' : null), radialK: jump ? 0.96 : 0.82 });
    if (tk === 'shirt' || tk === 'polo' || tk === 'jumpsuit') {
      out.push({ name: 'collar', L: 1, flag: 2, order: 4,
        f: (v) => (v.w > 0.5 ? -1 : Math.min(collarY(v, NY - 0.022, NY + 0.01) - v.y, v.y - (collarY(v, NY - drop, NY - drop * 0.3) - 0.015), -vSDF(v, vd), 0.11 - neckR(v))),
        th: () => topT + 0.005, sm: 0 });
      if (vd > 0) out.push({ name: 'collarFlap', L: 1, flag: 1, order: 5,
        f: (v) => { const e = Math.abs(v.x) - (v.y - vyOf(vd)) * 0.5; return v.w > 0.5 ? -1 : Math.min(e, 0.036 - e, v.y - vyOf(vd) - 0.004, NY - 0.03 - v.y, v.z); },
        th: () => topT + 0.0045, sm: 0.5 });
    }
    if (tk === 'turtleneck') out.push({ name: 'turtle', L: 1, flag: 2, order: 4,
      f: (v) => (v.w > 0.5 ? -1 : Math.min(NY + 0.045 - v.y, v.y - (collarY(v, NY - 0.045, NY - 0.0135) - 0.014), 0.11 - neckR(v))),
      th: (v) => 0.009 + 0.002 * sstep(NY - 0.02, NY + 0.04, v.y), sm: 0 });
    if (t.tie != null) {
      const vy = vyOf(vd);
      const tw = (y) => (y > W + 0.15 ? lerp(0.034, 0.012, sstep(W + 0.15, vy, y)) : 0.034);
      out.push({ name: 'tie', L: 1, flag: 3, order: 6,
        f: (v) => (v.w > 0.5 ? -1 : Math.min(tw(v.y) - Math.abs(v.x), v.z - 0.02, vy + 0.012 - v.y, v.y - (W - 0.075 + Math.abs(v.x) * 1.1))),
        th: (v) => 0.011 + 0.008 * sstep(W + 0.06, W - 0.02, v.y), sm: 1 });
    }
  }
  // --- kurtka
  if (jk !== 'none') {
    const len = jk === 'suit' ? 0.12 : jk === 'leather' ? 0.07 : jk === 'track' ? 0.05 : 0.04;
    const base = jk === 'suit' ? 0.014 : jk === 'bomber' ? 0.018 : jk === 'track' ? 0.013 : 0.016;
    const jsl = K.WR - (jk === 'suit' ? 0.03 : 0.008);
    out.push({ name: 'jacket', L: 2, flag: 0, order: 7,
      f: (v) => blend(v, Math.min(v.y - (W - len), -holeSDF(v, 0.05, 0), -openSDF(v)), jsl - v.a),
      th: (v) => {
        const k = armK(v);
        let tt = base + fold(v, 0.005);
        if (jk === 'suit' || jk === 'leather') tt += 0.004 * sstep(W + 0.05, W - len, v.y);
        if (jk === 'bomber' || jk === 'track') tt -= 0.005 * sstep(W - len + 0.06, W - len, v.y);
        const ta = base + fold(v, 0.004) - (jk === 'bomber' || jk === 'track' ? 0.004 * sstep(jsl - 0.05, jsl, v.a) : 0);
        return tt * (1 - k) + ta * k;
      },
      sm: 1, radial: 'arm', radialK: jk === 'suit' ? 0.92 : 0.88 });
    if (jk !== 'suit') out.push({ name: 'jkCollar', L: 2, flag: 2, order: 8,
      f: (v) => (v.w > 0.5 ? -1 : Math.min(collarY(v, NY - 0.012, NY + 0.016) - v.y, v.y - (collarY(v, NY - 0.05, NY - 0.015) - 0.012), -openSDF(v), 0.11 - neckR(v))),
      th: () => base - 0.002, sm: 0 });
    if (jk === 'suit') out.push({ name: 'lapel', L: 2, flag: 1, order: 8,
      f: (v) => { const e = Math.abs(v.x) - jkOpen(v.y), lw = 0.04 * sstep(W + 0.09, W + 0.2, v.y); return v.w > 0.5 ? -1 : Math.min(e, lw - e, v.z, v.y - (W + 0.1), NY - 0.035 - v.y); },
      th: () => base + 0.0045, sm: 1 });
  }
  // --- spodnie
  if (pk !== 'none') {
    const bag = pt.baggy || 0;
    const shorts = pt.end === 'knee' || pt.end === 'short';
    out.push({ name: 'pants', L: 3, flag: 0, order: tucked ? 2 : 1,
      f: (v) => blend(v, Math.min(W + 0.025 - v.y, v.y - legEnd), -1),
      th: (v) => {
        let tt = 0.007 + bag * 0.004 + fold(v, 0.003) + 0.002 * sstep(W - 0.03, W - 0.01, v.y);
        if (tucked) tt += 0.003 * sstep(W - 0.04, W - 0.01, v.y);
        if (shorts) tt += 0.009 * sstep(legEnd + 0.1, legEnd, v.y);
        return tt;
      },
      sm: 1, radial: shorts ? null : 'leg', radialK: 0.95 + 0.14 * bag });
    if (pt.belt != null && (tucked || tk === 'none')) out.push({ name: 'belt', L: 6, flag: 0, order: 3,
      f: (v) => blend(v, 0.0165 - Math.abs(v.y - W), -1), th: () => 0.016 + bag * 0.004, sm: 1 });
  }
  // --- buty
  if (sk !== 'barefoot') out.push({ name: 'shoes', L: 4, flag: 0, order: 0,
    f: (v) => blend(v, shoeTop - v.y, -1),
    th: (v) => 0.008 + 0.006 * sstep(0.05, 0.13, v.z - legA.z) + (sk === 'boot' ? 0.003 : 0), sm: 0, horizontal: true });
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Wygladzona sylwetka (Taubin, bez kurczenia) w przestrzeni spoczynkowej (metry), na siatce zespawanej po pozycjach
// ---------------------------------------------------------------------------------------------------------------------
function smoothRest(THREE, g, RP, iters = 26) {
  const P = g.attributes.position, n = P.count, idx = g.index;
  const grp = new Int32Array(n), map = new Map(); let m = 0;
  for (let i = 0; i < n; i++) {
    const k = Math.round(P.getX(i) * 2000) + ',' + Math.round(P.getY(i) * 2000) + ',' + Math.round(P.getZ(i) * 2000);
    let id = map.get(k); if (id === undefined) { id = m++; map.set(k, id); } grp[i] = id;
  }
  const nb = Array.from({ length: m }, () => new Set());
  const tri = idx ? idx.count : n, at = (t) => (idx ? idx.getX(t) : t);
  for (let t = 0; t < tri; t += 3) {
    const a = grp[at(t)], b = grp[at(t + 1)], c = grp[at(t + 2)];
    nb[a].add(b); nb[a].add(c); nb[b].add(a); nb[b].add(c); nb[c].add(a); nb[c].add(b);
  }
  const adj = nb.map((s) => Int32Array.from(s));
  let cur = new Float32Array(m * 3), tmp = new Float32Array(m * 3);
  for (let i = 0; i < n; i++) cur.set([RP[i * 3], RP[i * 3 + 1], RP[i * 3 + 2]], grp[i] * 3);
  const step = (lambda) => {
    for (let v = 0; v < m; v++) {
      const A = adj[v]; let x = 0, y = 0, z = 0;
      for (let j = 0; j < A.length; j++) { const u = A[j] * 3; x += cur[u]; y += cur[u + 1]; z += cur[u + 2]; }
      const k = A.length || 1, o = v * 3;
      tmp[o] = cur[o] + lambda * (x / k - cur[o]); tmp[o + 1] = cur[o + 1] + lambda * (y / k - cur[o + 1]); tmp[o + 2] = cur[o + 2] + lambda * (z / k - cur[o + 2]);
    }
    const s = cur; cur = tmp; tmp = s;
  };
  for (let it = 0; it < iters; it++) { step(0.55); step(-0.58); }
  const SP = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const o = grp[i] * 3; SP[i * 3] = cur[o]; SP[i * 3 + 1] = cur[o + 1]; SP[i * 3 + 2] = cur[o + 2]; }
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(SP, 3)); if (idx) tg.setIndex(idx);
  tg.computeVertexNormals();
  const tn = tg.attributes.normal, acc = new Float32Array(m * 3), SN = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const o = grp[i] * 3; acc[o] += tn.getX(i); acc[o + 1] += tn.getY(i); acc[o + 2] += tn.getZ(i); }
  for (let i = 0; i < n; i++) {
    const o = grp[i] * 3, l = Math.hypot(acc[o], acc[o + 1], acc[o + 2]) || 1;
    SN[i * 3] = acc[o] / l; SN[i * 3 + 1] = acc[o + 1] / l; SN[i * 3 + 2] = acc[o + 2] / l;
  }
  tg.dispose();
  return { SP, SN, grp, m };
}

// ---------------------------------------------------------------------------------------------------------------------
function bodyUniforms(THREE) {
  const u = {};
  for (const k of ['uLm', 'uLm2', 'uTop', 'uTop2', 'uJk', 'uPt', 'uSh', 'uMisc', 'uMisc2']) u[k] = { value: new THREE.Vector4() };
  for (const k of ['uNeck', 'uArmS', 'uArmE', 'uArmW', 'uLegH', 'uLegK', 'uLegA']) u[k] = { value: new THREE.Vector3() };
  for (const k of ['uSkin', 'uTopA', 'uTopB', 'uTopC', 'uJkA', 'uJkB', 'uPtA', 'uPtB', 'uBelt', 'uShA', 'uShB', 'uAcc', 'uTie']) u[k] = { value: new THREE.Color() };
  u.uInf = { value: 1 }; u.uDebug = { value: 0 }; u.uPrint = { value: null };
  return u;
}

// nadruki stroju (napisy na koszulce, plecach, tatuaz na szyi) - tekstura 1024x512 tylko dla strojow, ktore je maja
function makePrints(THREE, prints) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const cx = cv.getContext('2d');
  const text = (p, x, y, w, h) => {
    cx.save(); cx.fillStyle = p.color || '#fff'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
    const words = p.text.split(' ');
    const lines = words.length > 1 && p.text.length > 8 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [p.text];
    let fs = h / (lines.length * 1.15); cx.font = `900 ${fs}px "Arial Black", Impact, sans-serif`;
    const mw = Math.max(...lines.map((l) => cx.measureText(l).width));
    if (mw > w) { fs *= w / mw; cx.font = `900 ${fs}px "Arial Black", Impact, sans-serif`; }
    lines.forEach((l, i) => cx.fillText(l, x + w / 2, y + h / 2 + (i - (lines.length - 1) / 2) * fs * 1.12));
    cx.restore();
  };
  if (prints.front) text(prints.front, 40, 56, 432, 144);
  if (prints.back) text(prints.back, 552, 60, 432, 136);
  if (prints.neck) {                       // linia przerywana dookola szyi + napis
    const p = prints.neck; cx.save(); cx.strokeStyle = p.color; cx.fillStyle = p.color; cx.lineWidth = 7;
    if (p.dashed) { cx.setLineDash([22, 14]); cx.beginPath(); cx.moveTo(130, 330); cx.lineTo(894, 330); cx.stroke(); }
    cx.font = '900 46px Arial, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(p.text, 512, 398);
    cx.font = '58px Arial, sans-serif'; cx.fillText('✂', 100, 330);
    cx.restore();
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

/**
 * initOutfits(THREE, { bodyMesh, actor, B, rest, headMat }) -> { apply(outfit), body: uniforms, clothes, cache }
 * bodyMesh - skinowany mesh ciala w pozie spoczynkowej (aktor w (0,0,0), obrot 0); headMat - material glowy (kolor skory).
 */
export function initOutfits(THREE, { bodyMesh, actor, B, rest, headMat }) {
  const g = bodyMesh.geometry, n = g.attributes.position.count, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  const GP = g.attributes.position;
  const armRoots = new Set([B.armL, B.armR]);
  const isArm = bodyMesh.skeleton.bones.map((b) => { for (let o = b; o; o = o.parent) if (armRoots.has(o)) return 1; return 0; });
  actor.updateMatrixWorld(true); bodyMesh.skeleton.update();
  const mw = bodyMesh.matrixWorld;
  const RP = new Float32Array(n * 3), LM = new Float32Array(n * 2), LI = new Float32Array(n * 9), LF = new Float32Array(n * 9);
  const q = new THREE.Vector3(), base = new THREE.Vector3(), m9 = new Array(9), i9 = new Array(9);
  const shL = rest.get(B.armL).wp, shR = rest.get(B.armR).wp;
  const T = (i, x, y, z, out) => bodyMesh.applyBoneTransform(i, out.set(x, y, z)).applyMatrix4(mw);
  for (let i = 0; i < n; i++) {
    const gx = GP.getX(i), gy = GP.getY(i), gz = GP.getZ(i);
    T(i, gx, gy, gz, base);
    RP[i * 3] = base.x; RP[i * 3 + 1] = base.y; RP[i * 3 + 2] = base.z;
    let w = 0; for (let k = 0; k < 4; k++) w += isArm[si.getComponent(i, k)] * sw.getComponent(i, k);
    LM[i * 2] = base.distanceTo(base.x > 0 ? shL : shR); LM[i * 2 + 1] = w;
    // liniowa czesc przeksztalcenia geometria -> poza spoczynkowa (do przeliczania przesuniec ubrania z metrow)
    const h = 0.05;
    T(i, gx + h, gy, gz, q); m9[0] = (q.x - base.x) / h; m9[1] = (q.y - base.y) / h; m9[2] = (q.z - base.z) / h;
    T(i, gx, gy + h, gz, q); m9[3] = (q.x - base.x) / h; m9[4] = (q.y - base.y) / h; m9[5] = (q.z - base.z) / h;
    T(i, gx, gy, gz + h, q); m9[6] = (q.x - base.x) / h; m9[7] = (q.y - base.y) / h; m9[8] = (q.z - base.z) / h;
    LF.set(m9, i * 9); LI.set(inv3(m9, i9), i * 9);
  }
  const { SP, SN, grp, m: nGrp } = smoothRest(THREE, g, RP);
  // gladka normalna w przestrzeni geometrii (tusza w shaderze): n_g = L^T n
  const SMN = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const L = LF.subarray(i * 9, i * 9 + 9), nx = SN[i * 3], ny = SN[i * 3 + 1], nz = SN[i * 3 + 2];
    const x = L[0] * nx + L[1] * ny + L[2] * nz, y = L[3] * nx + L[4] * ny + L[5] * nz, z = L[6] * nx + L[7] * ny + L[8] * nz, l = Math.hypot(x, y, z) || 1;
    SMN[i * 3] = x / l; SMN[i * 3 + 1] = y / l; SMN[i * 3 + 2] = z / l;
  }
  g.setAttribute('aRest', new THREE.BufferAttribute(RP, 3));
  g.setAttribute('aLimb', new THREE.BufferAttribute(LM, 2));
  g.setAttribute('aSmN', new THREE.BufferAttribute(SMN, 3));
  if (g.attributes.color) g.deleteAttribute('color');
  const unitsPerM = Math.cbrt(Math.abs(LI[0] * (LI[4] * LI[8] - LI[5] * LI[7]) - LI[3] * (LI[1] * LI[8] - LI[2] * LI[7]) + LI[6] * (LI[1] * LI[5] - LI[2] * LI[4])));

  const r = (b) => rest.get(b).wp;
  const K = { W: r(B.hips).y + 0.05, NY: r(B.neck).y, NZ: r(B.neck).z, KN: r(B.shinL).y, AN: r(B.footL).y,
    EL: r(B.armL).distanceTo(r(B.foreL)), WR: r(B.armL).distanceTo(r(B.handL)) - 0.004,
    armS: r(B.armL), armE: r(B.foreL), armW: r(B.handL), legH: r(B.legL), legK: r(B.shinL), legA: r(B.footL) };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const lerp3 = (a, b, t) => [lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t)];
  const legC = (y, s) => { const h = K.legH, k = K.legK, a = K.legA;
    const c = y > k.y ? lerp3(k, h, clamp01((y - k.y) / (h.y - k.y))) : lerp3(a, k, clamp01((y - a.y) / (k.y - a.y))); c[0] *= s; return c; };
  const armC = (y, s) => { const sh = K.armS, el = K.armE, wr = K.armW;
    const c = y > el.y ? lerp3(el, sh, clamp01((y - el.y) / (sh.y - el.y))) : lerp3(wr, el, clamp01((y - wr.y) / (el.y - wr.y))); c[0] *= s; return c; };

  // przekroje nogi nad kolanem i reki nad lokciem (promien od osi w 48 kierunkach) - wzor prostej nogawki / rekawa
  const BINS = 48;
  const table = (pick, center) => {
    const T2 = [new Float32Array(BINS), new Float32Array(BINS)];
    for (let i = 0; i < n; i++) {
      if (!pick(i)) continue;
      const x = SP[i * 3], y = SP[i * 3 + 1], z = SP[i * 3 + 2], s = x >= 0 ? 1 : -1, c = center(y, s);
      const dx = x - c[0], dz = z - c[2], rr = Math.hypot(dx, dz);
      if (rr > 0.13) continue;
      const b = ((Math.round((Math.atan2(dz, dx) / (2 * Math.PI)) * BINS) % BINS) + BINS) % BINS, t = T2[s > 0 ? 0 : 1];
      t[b] = Math.max(t[b], rr);
    }
    for (const t of T2) for (let pass = 0; pass < 4; pass++) for (let b = 0; b < BINS; b++) if (!t[b]) t[b] = Math.max(t[(b + 1) % BINS], t[(b + BINS - 1) % BINS]);
    return T2;
  };
  const legT = table((i) => LM[i * 2 + 1] < 0.3 && SP[i * 3 + 1] > K.KN + 0.02 && SP[i * 3 + 1] < K.KN + 0.14, legC);
  const armT = table((i) => LM[i * 2 + 1] > 0.7 && LM[i * 2] > K.EL - 0.08 && LM[i * 2] < K.EL - 0.01, armC);
  const sample = (T2, s, phi) => { const t = T2[s > 0 ? 0 : 1], f = (((phi / (2 * Math.PI)) * BINS) % BINS + BINS) % BINS, b0 = Math.floor(f) % BINS, b1 = (b0 + 1) % BINS; return lerp(t[b0], t[b1], f - Math.floor(f)); };

  // ---------------- budowa ubran dla stroju (tablice typowane, bez obiektow na wierzcholek - zero smieci dla GC)
  const cache = new Map();
  const SI = new Uint16Array(n * 4), SWT = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) { SI[i * 4 + k] = si.getComponent(i, k); SWT[i * 4 + k] = sw.getComponent(i, k); }
  const IDX = g.index.array, tri = g.index.count;
  const dv = { x: 0, y: 0, z: 0, a: 0, w: 0 };                    // jeden obiekt na probke pola / grubosci
  const fill = (i, j, t) => {
    if (t === 0) { dv.x = RP[i * 3]; dv.y = RP[i * 3 + 1]; dv.z = RP[i * 3 + 2]; dv.a = LM[i * 2]; dv.w = LM[i * 2 + 1]; return dv; }
    dv.x = RP[i * 3] + (RP[j * 3] - RP[i * 3]) * t; dv.y = RP[i * 3 + 1] + (RP[j * 3 + 1] - RP[i * 3 + 1]) * t; dv.z = RP[i * 3 + 2] + (RP[j * 3 + 2] - RP[i * 3 + 2]) * t;
    dv.a = LM[i * 2] + (LM[j * 2] - LM[i * 2]) * t; dv.w = LM[i * 2 + 1] + (LM[j * 2 + 1] - LM[i * 2 + 1]) * t; return dv;
  };
  const L3 = (A, i, j, t, c) => A[i * 3 + c] + (A[j * 3 + c] - A[i * 3 + c]) * t;
  const sb = new Int32Array(8), swb = new Float32Array(8), out3 = new Float64Array(3), li = new Float64Array(9);

  function build(o) {
    const pieces = piecesFor(o, K), NP = pieces.length;
    const F = pieces.map((p) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = p.f(fill(i, i, 0)); return a; });
    const cap = n * (NP + 1) * 2;
    const pos = new Float32Array(cap * 3), nor = new Float32Array(cap * 3), sIdx = new Uint16Array(cap * 4), sWt = new Float32Array(cap * 4);
    const aR = new Float32Array(cap * 3), aL = new Float32Array(cap * 2), aN = new Float32Array(cap * 3), aG = new Float32Array(cap * 3);
    const srcI = new Int32Array(cap), srcJ = new Int32Array(cap), srcT = new Float32Array(cap), fvOf = new Float32Array(cap), wid = new Int32Array(cap);
    const ind = []; let vc = 0;

    // przesuniecie ubrania (metry, poza spoczynkowa) -> pozycja w geometrii; outer=false: wewnetrzny brzeg materialu
    function place(p, i, j, t, outer, fv) {
      const d = fill(i, j, t);
      for (let c = 0; c < 9; c++) li[c] = t === 0 ? LI[i * 9 + c] : LI[i * 9 + c] + (LI[j * 9 + c] - LI[i * 9 + c]) * t;
      const spx = L3(SP, i, j, t, 0), spy = L3(SP, i, j, t, 1), spz = L3(SP, i, j, t, 2);
      let nx = L3(SN, i, j, t, 0), ny = L3(SN, i, j, t, 1), nz = L3(SN, i, j, t, 2);
      const sm = p.sm * sstep(K.NY - 0.03, K.NY - 0.1, d.y);                      // przy szyi bez wygladzania (otwarta siatka)
      let dx = (spx - d.x) * sm, dy = (spy - d.y) * sm, dz = (spz - d.z) * sm;
      // tam, gdzie pod ubraniem zostaje skora, material nie moze zejsc pod nia (wygladzanie wciaga np. klatke)
      const inward = dx * nx + dy * ny + dz * nz;
      if (inward < 0) {
        const kv = t === 0 ? keptV[i] : keptV[i] + (keptV[j] - keptV[i]) * t;
        const k = Math.max(kv, 1 - sstep(0.012, 0.045, fv)); dx -= nx * inward * k; dy -= ny * inward * k; dz -= nz * inward * k;
      }
      if (p.horizontal) { const l = Math.hypot(nx, nz) || 1; nx /= l; ny = 0; nz /= l; }
      if (p.radial === 'leg' && d.w < 0.3 && d.y < K.W - 0.08) {                     // prosta nogawka od kolana w dol
        const s = spx >= 0 ? 1 : -1, c = legC(spy, s), ex = spx - c[0], ez = spz - c[2], rr = Math.hypot(ex, ez) || 1e-6;
        const R = sample(legT, s, Math.atan2(ez, ex)) * p.radialK, k = sstep(K.KN + 0.12, K.KN - 0.1, d.y);
        if (R > rr) { dx += (ex / rr) * (R - rr) * k; dz += (ez / rr) * (R - rr) * k; }
      }
      if (p.radial === 'arm' && d.w > 0.7 && d.a > K.EL - 0.03) {                    // prosty rekaw od lokcia
        const s = spx >= 0 ? 1 : -1, c = armC(spy, s), ex = spx - c[0], ez = spz - c[2], rr = Math.hypot(ex, ez) || 1e-6;
        const R = sample(armT, s, Math.atan2(ez, ex)) * p.radialK, k = sstep(K.EL - 0.03, K.EL + 0.07, d.a);
        if (R > rr) { dx += (ex / rr) * (R - rr) * k; dz += (ez / rr) * (R - rr) * k; }
      }
      const th = p.th(d) * (outer ? 1 : 0.15);
      dx += nx * th; dy += ny * th; dz += nz * th;
      out3[0] = L3(GP.array, i, j, t, 0) + li[0] * dx + li[3] * dy + li[6] * dz;
      out3[1] = L3(GP.array, i, j, t, 1) + li[1] * dx + li[4] * dy + li[7] * dz;
      out3[2] = L3(GP.array, i, j, t, 2) + li[2] * dx + li[5] * dy + li[8] * dz;
      return out3;
    }
    function pushVert(xyz, i, j, t, p, rim, w, fv) {
      const k = vc++;
      pos[k * 3] = xyz[0]; pos[k * 3 + 1] = xyz[1]; pos[k * 3 + 2] = xyz[2];
      if (t === 0) { for (let c = 0; c < 4; c++) { sIdx[k * 4 + c] = SI[i * 4 + c]; sWt[k * 4 + c] = SWT[i * 4 + c]; } }
      else {                                                                         // wagi kosci z obu koncow krawedzi, 4 najwieksze
        let m = 0;
        for (let e = 0; e < 2; e++) { const v = e ? j : i, f = e ? t : 1 - t;
          for (let c = 0; c < 4; c++) { const b = SI[v * 4 + c], wt = SWT[v * 4 + c] * f; if (!wt) continue;
            let q2 = 0; while (q2 < m && sb[q2] !== b) q2++; if (q2 === m) { sb[m] = b; swb[m] = 0; m++; } swb[q2] += wt; } }
        let sum = 0;
        for (let c = 0; c < 4; c++) {
          let best = -1; for (let q2 = 0; q2 < m; q2++) if (swb[q2] > 0 && (best < 0 || swb[q2] > swb[best])) best = q2;
          if (best < 0) { sIdx[k * 4 + c] = 0; sWt[k * 4 + c] = 0; continue; }
          sIdx[k * 4 + c] = sb[best]; sWt[k * 4 + c] = swb[best]; sum += swb[best]; swb[best] = -1;
        }
        for (let c = 0; c < 4; c++) sWt[k * 4 + c] /= sum || 1;
      }
      const d = fill(i, j, t);
      aR[k * 3] = d.x; aR[k * 3 + 1] = d.y; aR[k * 3 + 2] = d.z; aL[k * 2] = d.a; aL[k * 2 + 1] = d.w;
      aN[k * 3] = L3(SMN, i, j, t, 0); aN[k * 3 + 1] = L3(SMN, i, j, t, 1); aN[k * 3 + 2] = L3(SMN, i, j, t, 2);
      aG[k * 3] = p.L; aG[k * 3 + 1] = rim; aG[k * 3 + 2] = p.flag;
      srcI[k] = i; srcJ[k] = j; srcT[k] = t; fvOf[k] = fv; wid[k] = w;
      return k;
    }

    // ktora skora zostaje: trojkaty ciala zakryte z zapasem znikaja, reszta zostaje (keptV = wierzcholek widocznej skory)
    const covAt = new Float32Array(n).fill(-1);
    for (let pi = 0; pi < NP; pi++) if (pieces[pi].flag === 0 || pieces[pi].flag === 2) { const fp = F[pi]; for (let i = 0; i < n; i++) if (fp[i] > covAt[i]) covAt[i] = fp[i]; }
    const bi = [], keptV = new Float32Array(n);
    for (let tI = 0; tI < tri; tI += 3) {
      const a = IDX[tI], b = IDX[tI + 1], c = IDX[tI + 2];
      if (covAt[a] > 0.014 && covAt[b] > 0.014 && covAt[c] > 0.014) continue;
      bi.push(a, b, c); keptV[a] = keptV[b] = keptV[c] = 1;
    }
    const vmap = new Int32Array(n);
    for (let pi = 0; pi < NP; pi++) {
      const p = pieces[pi], fp = F[pi];
      const occ = p.flag !== 0 ? [] : pieces.map((_, qi) => qi).filter((qi) => qi !== pi && pieces[qi].flag === 0 && pieces[qi].order > p.order).map((qi) => F[qi]);
      vmap.fill(-1);
      const emap = new Map(), clipId = new Map(); let nClip = 0;
      const vOut = (i) => { let k = vmap[i]; if (k < 0) { k = pushVert(place(p, i, i, 0, true, fp[i]), i, i, 0, p, 0, grp[i], fp[i]); vmap[i] = k; } return k; };
      const eOut = (i, j) => {
        const key = i < j ? i * n + j : j * n + i; let k = emap.get(key);
        if (k === undefined) {
          const t = fp[i] / (fp[i] - fp[j]), gi = grp[i], gj = grp[j], ck = gi < gj ? gi * nGrp + gj : gj * nGrp + gi;
          let w = clipId.get(ck); if (w === undefined) { w = nGrp + nClip++; clipId.set(ck, w); }
          k = pushVert(place(p, i, j, t, true, 0), i, j, t, p, 0, w, 0); emap.set(key, k);
        }
        return k;
      };
      const t0 = ind.length, poly = [0, 0, 0, 0];
      for (let tI = 0; tI < tri; tI += 3) {
        const ia = IDX[tI], ib = IDX[tI + 1], ic = IDX[tI + 2], fa = fp[ia], fb = fp[ib], fc = fp[ic];
        if (fa <= 0 && fb <= 0 && fc <= 0) continue;
        let hidden = false;                                                          // zakryte warstwa lezaca wyzej
        for (let q2 = 0; q2 < occ.length && !hidden; q2++) { const fq = occ[q2]; hidden = fq[ia] > 0.03 && fq[ib] > 0.03 && fq[ic] > 0.03; }
        if (hidden) continue;
        if (fa > 0 && fb > 0 && fc > 0) { ind.push(vOut(ia), vOut(ib), vOut(ic)); continue; }
        let np = 0; const vs0 = ia, vs1 = ib, vs2 = ic;
        for (let e = 0; e < 3; e++) {
          const A = e === 0 ? vs0 : e === 1 ? vs1 : vs2, Bv = e === 0 ? vs1 : e === 1 ? vs2 : vs0, fA = fp[A], fB = fp[Bv];
          if (fA > 0) poly[np++] = vOut(A);
          if ((fA > 0) !== (fB > 0)) poly[np++] = eOut(A, Bv);
        }
        for (let k = 1; k + 1 < np; k++) ind.push(poly[0], poly[k], poly[k + 1]);
      }
      const t1 = ind.length;
      // normalne powierzchni (usrednione po zespawanych wierzcholkach - bez linii na szwach UV)
      const accN = new Float32Array((nGrp + nClip) * 3);
      for (let k = t0; k < t1; k += 3) {
        const A = ind[k] * 3, Bv = ind[k + 1] * 3, C = ind[k + 2] * 3;
        const ux = pos[Bv] - pos[A], uy = pos[Bv + 1] - pos[A + 1], uz = pos[Bv + 2] - pos[A + 2], wx = pos[C] - pos[A], wy = pos[C + 1] - pos[A + 1], wz = pos[C + 2] - pos[A + 2];
        const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
        for (let e = 0; e < 3; e++) { const q2 = wid[ind[k + e]] * 3; accN[q2] += fx; accN[q2 + 1] += fy; accN[q2 + 2] += fz; }
      }
      for (let k = t0; k < t1; k++) {
        const v = ind[k], q2 = wid[v] * 3, l = Math.hypot(accN[q2], accN[q2 + 1], accN[q2 + 2]) || 1;
        nor[v * 3] = accN[q2] / l; nor[v * 3 + 1] = accN[q2 + 1] / l; nor[v * 3 + 2] = accN[q2 + 2] / l;
      }
      // brzegi materialu: krawedzie nalezace do jednego trojkata (po zespawaniu) dostaja pasek grubosci
      const edges = new Map();
      for (let k = t0; k < t1; k += 3) for (let e = 0; e < 3; e++) {
        const a = ind[k + e], b = ind[k + (e + 1) % 3], wa = wid[a], wb = wid[b], key = wa < wb ? wa * 4e7 + wb : wb * 4e7 + wa;
        const rec = edges.get(key); if (rec !== undefined) edges.set(key, -1); else edges.set(key, a * 1e6 + b);
      }
      for (const code of edges.values()) {
        if (code < 0) continue;
        const a = Math.floor(code / 1e6), b = code - a * 1e6;
        const Ao = [pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]], Bo = [pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]];
        const Ai = Array.from(place(p, srcI[a], srcJ[a], srcT[a], false, fvOf[a])), Bi = Array.from(place(p, srcI[b], srcJ[b], srcT[b], false, fvOf[b]));
        const e1x = Ao[0] - Bo[0], e1y = Ao[1] - Bo[1], e1z = Ao[2] - Bo[2], e2x = Ai[0] - Bo[0], e2y = Ai[1] - Bo[1], e2z = Ai[2] - Bo[2];
        let fx = e1y * e2z - e1z * e2y, fy = e1z * e2x - e1x * e2z, fz = e1x * e2y - e1y * e2x; const l = Math.hypot(fx, fy, fz) || 1; fx /= l; fy /= l; fz /= l;
        const k0 = pushVert(Bo, srcI[b], srcJ[b], srcT[b], p, 1, 0, 0), k1 = pushVert(Ao, srcI[a], srcJ[a], srcT[a], p, 1, 0, 0);
        const k2 = pushVert(Ai, srcI[a], srcJ[a], srcT[a], p, 1, 0, 0), k3 = pushVert(Bi, srcI[b], srcJ[b], srcT[b], p, 1, 0, 0);
        for (const k of [k0, k1, k2, k3]) { nor[k * 3] = fx; nor[k * 3 + 1] = fy; nor[k * 3 + 2] = fz; }
        ind.push(k0, k1, k2, k0, k2, k3);
      }
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, vc * 3), 3));
    cg.setAttribute('normal', new THREE.BufferAttribute(nor.slice(0, vc * 3), 3));
    cg.setAttribute('skinIndex', new THREE.BufferAttribute(sIdx.slice(0, vc * 4), 4));
    cg.setAttribute('skinWeight', new THREE.BufferAttribute(sWt.slice(0, vc * 4), 4));
    cg.setAttribute('aRest', new THREE.BufferAttribute(aR.slice(0, vc * 3), 3));
    cg.setAttribute('aLimb', new THREE.BufferAttribute(aL.slice(0, vc * 2), 2));
    cg.setAttribute('aSmN', new THREE.BufferAttribute(aN.slice(0, vc * 3), 3));
    cg.setAttribute('aG', new THREE.BufferAttribute(aG.slice(0, vc * 3), 3));
    cg.setIndex(new THREE.BufferAttribute(vc > 65535 ? Uint32Array.from(ind) : Uint16Array.from(ind), 1));
    // cialo: bez trojkatow zakrytych z zapasem; aCov (odleglosc od brzegu ubrania) do cienia przy krawedzi
    const bg = new THREE.BufferGeometry();
    for (const [k, at] of Object.entries(g.attributes)) bg.setAttribute(k, at);
    bg.setAttribute('aCov', new THREE.BufferAttribute(covAt, 1));
    bg.setIndex(new THREE.BufferAttribute(Uint16Array.from(bi), 1));
    bg.boundingBox = g.boundingBox; bg.boundingSphere = g.boundingSphere;
    return { clothes: cg, body: bg, prints: o.prints ? makePrints(THREE, o.prints) : null,
      stats: { clothesTris: ind.length / 3, bodyTris: bi.length / 3 } };
  }
  // ---------------- materialy
  const U = bodyUniforms(THREE);
  U.uLm.value.set(K.W, K.NY, K.KN, K.AN);
  U.uLm2.value.set(K.EL, K.WR, 0, 0);
  U.uNeck.value.copy(r(B.neck)); U.uArmS.value.copy(K.armS); U.uArmE.value.copy(K.armE); U.uArmW.value.copy(K.armW);
  U.uLegH.value.copy(K.legH); U.uLegK.value.copy(K.legK); U.uLegA.value.copy(K.legA);
  U.uInf.value = unitsPerM;
  const blank = (() => { const t = new THREE.DataTexture(new Uint8Array(4), 1, 1); t.needsUpdate = true; return t; })();
  U.uPrint.value = blank;
  const glsl = (sh, decl, colorExpr, extraVert) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + COMMON + decl)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vRest = aRest; vLimb = aLimb; ${extraVert}
        transformed += aSmN * oBulk(aRest, aLimb) * uInf;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + COMMON + FRAG + decl.replace(/attribute[^\n]*\n/g, ''))
      .replace('#include <color_fragment>', colorExpr)
      .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replace('mapN.xy *= normalScale;', 'mapN.xy *= normalScale * (1.0 - oCloth);') +
        '\n normal = oPerturb(-vViewPosition, normal, vec2(dFdx(oH), dFdy(oH)), faceDirection);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * oSheen * pow(1.0 - abs(dot(normal, normalize(vViewPosition))), 2.0) + vec3(oSheen * 0.04);');
  };
  const bm = bodyMesh.material;
  bm.vertexColors = false; bm.color.set(0xffffff);
  bm.onBeforeCompile = (sh) => glsl(sh, 'attribute vec3 aRest;\nattribute vec2 aLimb;\nattribute vec3 aSmN;\nattribute float aCov;\nvarying vec3 vRest;\nvarying vec2 vLimb;\nvarying float vCov;\n',
    // skora tuz przy brzegu ubrania lezy w jego cieniu
    'diffuseColor.rgb = oShade(0.0, vRest, vLimb, 0.0, 0.0) * (1.0 - 0.38 * smoothstep(-0.035, 0.0, vCov));', 'vCov = aCov;');
  bm.customProgramCacheKey = () => 'outfit-body-v2';
  bm.needsUpdate = true;

  const cm = new THREE.MeshLambertMaterial({ color: 0xffffff });
  cm.onBeforeCompile = (sh) => glsl(sh, 'attribute vec3 aRest;\nattribute vec2 aLimb;\nattribute vec3 aSmN;\nattribute vec3 aG;\nvarying vec3 vRest;\nvarying vec2 vLimb;\nvarying vec3 vG;\n',
    'diffuseColor.rgb = oShade(floor(vG.x + 0.5), vRest, vLimb, floor(vG.z + 0.5), vG.y);', 'vG = aG;');
  cm.customProgramCacheKey = () => 'outfit-clothes-v2';
  const clothes = new THREE.SkinnedMesh(new THREE.BufferGeometry(), cm);
  clothes.name = 'clothes';
  clothes.position.copy(bodyMesh.position); clothes.quaternion.copy(bodyMesh.quaternion); clothes.scale.copy(bodyMesh.scale);
  bodyMesh.parent.add(clothes);
  clothes.updateMatrixWorld(true);
  clothes.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
  clothes.castShadow = true; clothes.frustumCulled = bodyMesh.frustumCulled;
  if (bodyMesh.boundingSphere) clothes.boundingSphere = bodyMesh.boundingSphere.clone();

  const TOP = { none: 0, tee: 1, tank: 2, shirt: 3, polo: 4, jumpsuit: 5, turtleneck: 6 };
  const PAT = { plain: 0, floral: 1, rib: 2, check: 4 };
  const JK = { none: 0, bomber: 1, track: 1, leather: 2, suit: 3 };
  const PT = { none: 0, jeans: 1, trousers: 2, cargo: 3, track: 5 };
  const SH = { barefoot: 0, sneaker: 1, dress: 2, boot: 3, hightop: 4 };

  function apply(o) {
    let c = cache.get(o.id);
    if (!c) { const t0 = performance.now(); c = build(o); c.stats.ms = Math.round(performance.now() - t0); cache.set(o.id, c); }
    bodyMesh.geometry = c.body; clothes.geometry = c.clothes;
    U.uPrint.value = c.prints || blank;
    const t = o.top || { kind: 'none' }, j = o.jacket || { kind: 'none' }, p = o.pants || { kind: 'none' }, s = o.shoes || { kind: 'barefoot' };
    const set = (k, hex) => U[k].value.set(hex ?? 0x000000);
    const tk = TOP[t.kind] ?? 0, jk = JK[j.kind] ?? 0, pk = tk === 5 ? 0 : (PT[p.kind] ?? 0), sk = SH[s.kind] ?? 0;
    const tc = t.colors || [0xffffff];
    set('uSkin', o.skin); set('uTopA', tc[0]); set('uTopB', tc[1] ?? tc[0]); set('uTopC', tc[2] ?? tc[1] ?? tc[0]); set('uTie', t.tie ?? 0xaa0000);
    set('uJkA', j.color ?? 0x333333); set('uJkB', j.accent ?? 0x999999);
    set('uPtA', p.color ?? (tk === 5 ? tc[0] : 0x333333)); set('uPtB', p.accent ?? 0xffffff); set('uBelt', p.belt ?? 0x222222);
    set('uShA', s.color ?? 0x222222); set('uShB', s.sole ?? 0xdddddd); set('uAcc', s.accent ?? s.color ?? 0xffffff);
    const tucked = !!t.tucked && tk !== 5;
    U.uTop.value.set(tk, tk === 2 ? 0 : SLEEVE[t.sleeve || 'short'], tucked ? 0.035 : (t.hem ?? 0.05), PAT[t.pattern || 'plain'] ?? 0);
    U.uTop2.value.set(t.v ?? 0, tucked ? 1 : 0, t.tie != null ? 1 : 0, t.loose ?? 0);
    const jlen = jk === 3 ? 0.12 : jk === 2 ? 0.07 : j.kind === 'track' ? 0.05 : 0.04;
    U.uJk.value.set(jk, j.open ?? 0, jlen, K.WR - (jk === 3 ? 0.03 : 0.008));
    const shoeTop = SHOE_TOP[s.kind] ?? 0.06;
    const end = p.end === 'knee' ? K.KN + 0.06 : p.end === 'short' ? K.KN + 0.13 : Math.max(0.03, shoeTop - 0.035);
    U.uPt.value.set(pk, tk === 5 ? shoeTop - 0.035 : end, p.belt != null ? 1 : 0, p.baggy ?? 0);
    U.uSh.value.set(sk, shoeTop, SOLE_Y[s.kind] ?? 0, 0);
    U.uMisc.value.set(o.tattoo ?? 0, o.dirt ?? 0, jk === 2 ? 0.35 : 0, (j.kind === 'track' || p.kind === 'track') ? 1 : 0);
    U.uMisc2.value.set(o.bulk ?? 0, j.pin ? 1 : 0, t.pocket ? 1 : 0, 0);
    if (headMat) headMat.color.set(o.skin);
    return c.stats;
  }
  return { apply, body: U, clothes, cache };
}
