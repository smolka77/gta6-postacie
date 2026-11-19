// Glowa-plotno: gladka czaszka bez twarzy (oczy, usta, wlosy itp. maluje sie w kreatorze: kreator-glowy.html).
// Wspolna dla gry i kreatora, zeby to, co namalowane, lezalo w grze dokladnie tam samo.
//
// Mapowanie tekstury (1024 x 512, jak mapa swiata): srodek twarzy na srodku obrazka (u = 0.5), szew z tylu glowy (u = 0/1),
// gora obrazka = czubek glowy. Lewa polowa obrazka to prawa strona twarzy postaci (jak patrzac na nia z przodu).
// Tekstura ma przezroczystosc: gdzie nic nie namalowano, widac kolor skory stroju.

export const HEAD_TEX_W = 1024, HEAD_TEX_H = 512;
export const HEAD_SEG_W = 72, HEAD_SEG_H = 46;

// punkt na sferze jednostkowej (x w lewo postaci, y w gore, z do przodu) -> punkt glowy w metrach (srodek glowy w 0)
export function headShape(x, y, z) {
  const t = Math.max(0, -y), u = Math.max(0, y);
  const wx = 1 - 0.31 * Math.pow(t, 1.6) + 0.03 * u - 0.05 * Math.max(0, z) * (1 - t);     // policzki -> zuchwa -> broda
  const wz = z > 0 ? 0.95 - 0.12 * t * t : 1 - 0.52 * Math.pow(t, 1.25);                  // plaska twarz; tyl czaszki chowa sie w szyje
  return [x * 0.083 * wx, y * 0.124 + 0.004 * u, z * 0.105 * wz + 0.010 * t * Math.max(0, z)];
}

// wspolrzedne UV -> punkt sfery jednostkowej (zgodnie z THREE.SphereGeometry, phiStart = -PI/2)
export function uvToSphere(u, v) {
  const phi = -Math.PI / 2 + u * Math.PI * 2, theta = (1 - v) * Math.PI;
  return [-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)];
}

export function createHeadGeometry(THREE) {
  const g = new THREE.SphereGeometry(1, HEAD_SEG_W, HEAD_SEG_H, -Math.PI / 2), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setXYZ(i, ...headShape(P.getX(i), P.getY(i), P.getZ(i)));
  g.computeVertexNormals();
  // szew z tylu i bieguny maja zdublowane wierzcholki - usrednij normalne, zeby nie bylo widac linii w oswietleniu
  const N = g.attributes.normal, map = new Map();
  for (let i = 0; i < P.count; i++) {
    const k = Math.round(P.getX(i) * 1e5) + ',' + Math.round(P.getY(i) * 1e5) + ',' + Math.round(P.getZ(i) * 1e5);
    (map.get(k) || map.set(k, []).get(k)).push(i);
  }
  for (const ids of map.values()) {
    if (ids.length < 2) continue;
    let x = 0, y = 0, z = 0; for (const i of ids) { x += N.getX(i); y += N.getY(i); z += N.getZ(i); }
    const l = Math.hypot(x, y, z) || 1; for (const i of ids) N.setXYZ(i, x / l, y / l, z / l);
  }
  g.computeBoundingSphere();
  return g;
}

export function blankHeadTexture(THREE) {
  const t = new THREE.DataTexture(new Uint8Array(4), 1, 1); t.needsUpdate = true; return t;
}

// Lambert: kolor skory (material.color) pod spodem, na wierzchu namalowana tekstura z przezroczystoscia
export function makeHeadMaterial(THREE, color = 0xc68a63) {
  const m = new THREE.MeshLambertMaterial({ color, map: blankHeadTexture(THREE) });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 oHeadT = texture2D( map, vMapUv );
        diffuseColor.rgb = mix( diffuseColor.rgb, oHeadT.rgb, oHeadT.a );
      #endif`);
  };
  m.customProgramCacheKey = () => 'head-canvas-v1';
  return m;
}

export function prepHeadTexture(THREE, tex, renderer) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;                       // szew z tylu glowy bez przerwy w filtrowaniu
  tex.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  tex.needsUpdate = true;
  return tex;
}
