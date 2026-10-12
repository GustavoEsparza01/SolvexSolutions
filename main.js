/* =====================
   NUBO STUDIO - SCRIPTS
   main.js

   MÓDULOS:
   1. Menú y navegación
   2. Escena de partículas: las mismas partículas toman la figura de cada sección
      (nube → caos → celular → reloj → estrella → plato → globo → logo) y se transforman con el scroll
   3. Titular que se forma con partículas y estalla al pasar el cursor
   4. Carrusel de servicios
   5. Proceso, aparición con el scroll y contadores
   6. Formulario de contacto

   TODO - Backend:
   - Conectar enviarMensaje() a una API REST o servicio de email
   - Ejemplo: fetch('/api/contacto', { method: 'POST', body: formData })
===================== */

// Marca que hay JS: el CSS oculta lo que aparece con el scroll solo si hay script
document.documentElement.classList.add('js');

// Número de WhatsApp: oculto mientras el sitio está en fase de prueba. Para reactivar el enlace
// "continuar por WhatsApp" del formulario, pon aquí el número (52 + 10 dígitos) y vuelve a agregar #waForm.
const WHATSAPP = '';

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const css = getComputedStyle(document.documentElement);
  const color = n => css.getPropertyValue(n).trim();

  // Las animaciones del hero esperan a que termine la intro del logo (empieza a subir a los 1.6s)
  const introLista = new Promise(resolve => {
    if (!document.documentElement.classList.contains('intro-hold')) return resolve();
    setTimeout(() => { document.documentElement.classList.remove('intro-hold'); resolve(); }, 1600);
  });

  // =====================
  // 1. MENÚ (pantalla completa en móvil) Y NAV
  // =====================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    const abierto = mobileMenu.classList.toggle('open');
    document.body.style.overflow = abierto ? 'hidden' : '';
    hamburger.setAttribute('aria-expanded', abierto);
    hamburger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  const navLinks = document.querySelectorAll('.nav-links a');
  const navSections = [...navLinks].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  function actualizarNav() {
    const y = window.scrollY + window.innerHeight * 0.4;
    let current = '';
    navSections.forEach(s => { if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) current = '#' + s.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === current));
  }
  window.addEventListener('scroll', actualizarNav, { passive: true });
  actualizarNav();

  // Preseleccionar el servicio en el formulario
  const selectServicio = document.getElementById('servicio');
  document.querySelectorAll('a[data-servicio]').forEach(link => {
    link.addEventListener('click', () => { if (selectServicio) selectServicio.value = link.dataset.servicio; });
  });

  // Cursor (coordenadas de la ventana; null = fuera)
  let cursor = null;
  if (finePointer) {
    window.addEventListener('pointermove', (e) => { cursor = { x: e.clientX, y: e.clientY }; }, { passive: true });
    document.addEventListener('pointerleave', () => { cursor = null; });
  }

  // =====================
  // 2. ESCENA DE PARTÍCULAS
  // =====================
  const paleta = [
    { c: color('--accent'), w: 0.34 },
    { c: color('--accent-hover'), w: 0.12 },
    { c: color('--accent2'), w: 0.16 },
    { c: color('--accent2-text'), w: 0.16 },
    { c: 'rgb(44,163,218)', w: 0.1 },        // mezcla turquesa-azul
    { c: color('--text'), w: 0.12 }
  ];
  const colorAlAzar = () => {
    let r = Math.random();
    for (let i = 0; i < paleta.length; i++) { if ((r -= paleta[i].w) <= 0) return i; }
    return 0;
  };
  function triangulo(ctx, x, y, r, a) {
    ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a + 2.094) * r, y + Math.sin(a + 2.094) * r);
    ctx.lineTo(x + Math.cos(a + 4.189) * r, y + Math.sin(a + 4.189) * r);
    ctx.closePath();
  }

  const world = document.querySelector('.world');
  if (world && world.getContext) {
    const ctx = world.getContext('2d');
    const R = Math.random;
    const gauss = () => Math.sqrt(-2 * Math.log(R() || 1e-6)) * Math.cos(2 * Math.PI * R());
    let N, M, shapes = {}, parts = [], dpr = 1, w = 0, h = 0;

    // ---------- Figuras (coordenadas unitarias, radio ~1; y positivo hacia abajo) ----------
    const gen = {
      cloud(n) {
        const lob = [{ x: -0.66, y: 0.14, z: 0, r: 0.36 }, { x: -0.26, y: -0.16, z: 0.06, r: 0.5 }, { x: 0.24, y: -0.3, z: -0.04, r: 0.56 }, { x: 0.68, y: 0.06, z: 0, r: 0.4 }, { x: 0.02, y: 0.16, z: 0.12, r: 0.46 }];
        const tot = lob.reduce((s, l) => s + l.r * l.r, 0), out = [];
        while (out.length < n * 3) {
          let r = R() * tot, L = lob[0];
          for (const l of lob) { if ((r -= l.r * l.r) <= 0) { L = l; break; } }
          const dx = gauss(), dy = gauss(), dz = gauss(), d = Math.hypot(dx, dy, dz) || 1;
          const sup = R() < 0.8, rad = L.r * (sup ? 0.93 + R() * 0.07 : Math.cbrt(R()));
          let x = L.x + dx / d * rad, y = L.y + dy / d * rad, z = L.z + dz / d * rad * 0.8;
          if (y > 0.42) { if (R() < 0.6) continue; y = 0.42; }
          if (sup && lob.some(o => o !== L && Math.hypot(x - o.x, y - o.y, (z - o.z) / 0.8) < o.r * 0.9)) continue;
          out.push(x, y, z);
        }
        return out;
      },
      // Caos: campo enorme que llena la pantalla; los más cercanos a la cámara se ven grandes
      field(n) { const o = []; for (let i = 0; i < n; i++) o.push((R() - 0.5) * 5.4, (R() - 0.5) * 3.4, -4 + R() * 6.4); return o; },
      dust(n) { const o = []; for (let i = 0; i < n; i++) o.push((R() - 0.5) * 11, (R() - 0.5) * 7, -8 + R() * 8.5); return o; },
      phone(n) {
        const o = [], W = 0.72, H = 1.44, cr = 0.15, D = 0.05;
        const filas = [0.62, 0.5, 0.78, 0.36, 0.7, 0.54, 0.44, 0.66, 0.3];
        const perim = () => {   // punto sobre el contorno redondeado
          const t = R();
          const ladoX = W - 2 * cr, ladoY = H - 2 * cr, arco = Math.PI * cr / 2, L = 2 * ladoX + 2 * ladoY + 4 * arco;
          let s = t * L;
          const segs = [
            [ladoX, u => [-W / 2 + cr + u, -H / 2]], [arco, u => { const a = -Math.PI / 2 + u / cr; return [W / 2 - cr + Math.cos(a) * cr, -H / 2 + cr + Math.sin(a) * cr]; }],
            [ladoY, u => [W / 2, -H / 2 + cr + u]], [arco, u => { const a = u / cr; return [W / 2 - cr + Math.cos(a) * cr, H / 2 - cr + Math.sin(a) * cr]; }],
            [ladoX, u => [W / 2 - cr - u, H / 2]], [arco, u => { const a = Math.PI / 2 + u / cr; return [-W / 2 + cr + Math.cos(a) * cr, H / 2 - cr + Math.sin(a) * cr]; }],
            [ladoY, u => [-W / 2, H / 2 - cr - u]], [arco, u => { const a = Math.PI + u / cr; return [-W / 2 + cr + Math.cos(a) * cr, -H / 2 + cr + Math.sin(a) * cr]; }]
          ];
          for (const [len, f] of segs) { if (s <= len) return f(s); s -= len; }
          return [0, -H / 2];
        };
        for (let i = 0; i < n; i++) {
          const r = R();
          if (r < 0.42) { const [x, y] = perim(); o.push(x, y, (R() < 0.5 ? -D : D)); }
          else if (r < 0.78) { const k = Math.floor(R() * filas.length); o.push(-0.26 + R() * filas[k] * 0.54, -0.44 + k * 0.11 + (R() - 0.5) * 0.02, D); }
          else if (r < 0.84) { o.push(-0.26 + R() * 0.52, -0.58 + (R() - 0.5) * 0.02, D); }        // barra superior
          else if (r < 0.88) { o.push((R() - 0.5) * 0.2, 0.64 + (R() - 0.5) * 0.012, D); }         // barra de inicio
          else { o.push((R() - 0.5) * W * 0.9, (R() - 0.5) * H * 0.9, D); }
        }
        return o;
      },
      clock(n) {
        const o = [], RR = 0.85, rr = 0.11;
        for (let i = 0; i < n; i++) {
          const r = R();
          if (r < 0.6) { const u = R() * Math.PI * 2, v = R() * Math.PI * 2; o.push((RR + rr * Math.cos(v)) * Math.cos(u), (RR + rr * Math.cos(v)) * Math.sin(u), rr * Math.sin(v)); }
          else if (r < 0.74) { const k = Math.floor(R() * 12), a = k * Math.PI / 6, d = 0.6 + R() * 0.1; o.push(Math.cos(a) * d, Math.sin(a) * d, (R() - 0.5) * 0.04); }
          else if (r < 0.86) { const d = R() * 0.42, a = -Math.PI * 0.82; o.push(Math.cos(a) * d + (R() - 0.5) * 0.04, Math.sin(a) * d + (R() - 0.5) * 0.04, (R() - 0.5) * 0.04); }   // horario
          else if (r < 0.97) { const d = R() * 0.62, a = -Math.PI * 0.12; o.push(Math.cos(a) * d + (R() - 0.5) * 0.03, Math.sin(a) * d + (R() - 0.5) * 0.03, (R() - 0.5) * 0.04); } // minutero
          else { o.push((R() - 0.5) * 0.08, (R() - 0.5) * 0.08, 0); }
        }
        return o;
      },
      star(n) {
        const pts = [];
        for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 0.42 : 1; pts.push([Math.cos(a) * rad, Math.sin(a) * rad]); }
        const dentro = (x, y) => { let c = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
        const o = [];
        while (o.length < n * 3) {
          if (R() < 0.45) { const k = Math.floor(R() * 10), [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % 10], t = R(); o.push(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + 0.05, (R() < 0.5 ? -1 : 1) * 0.13); }
          else { const x = (R() - 0.5) * 2, y = (R() - 0.5) * 2; if (dentro(x, y)) o.push(x, y + 0.05, (R() - 0.5) * 0.26); }
        }
        return o;
      },
      plate(n) {
        const o = [];
        for (let i = 0; i < n; i++) {
          const r = R(), a = R() * Math.PI * 2;
          if (r < 0.45) { const d = 0.86 + R() * 0.1; o.push(Math.cos(a) * d, Math.sin(a) * d, (R() - 0.5) * 0.05); }
          else if (r < 0.65) { const d = 0.56 + R() * 0.04; o.push(Math.cos(a) * d, Math.sin(a) * d, 0); }
          else if (r < 0.75) { const d = Math.sqrt(R()) * 0.5; o.push(Math.cos(a) * d, Math.sin(a) * d, 0); }
          else {   // ondas NFC saliendo del plato
            const k = Math.floor(R() * 3), d = 1.12 + k * 0.16, b = (R() - 0.5) * 1.1 - Math.PI / 4;
            o.push(Math.cos(b) * d, Math.sin(b) * d, (R() - 0.5) * 0.03);
          }
        }
        return o.map(v => v * 0.74);   // con las ondas, el plato cabe en el encuadre
      },
      globe(n) {
        const o = [];
        for (let i = 0; i < n; i++) {
          let lat, lon;
          const r = R();
          if (r < 0.3) { lon = Math.floor(R() * 12) / 12 * Math.PI * 2 + (R() - 0.5) * 0.02; lat = Math.asin(R() * 2 - 1); }         // meridianos
          else if (r < 0.55) { lat = (Math.floor(R() * 7) - 3) * 0.38 + (R() - 0.5) * 0.02; lon = R() * Math.PI * 2; }                 // paralelos
          else { lat = Math.asin(R() * 2 - 1); lon = R() * Math.PI * 2; }
          o.push(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon));
        }
        return o;
      },
      logo(n) {   // ‹ ›
        const o = [];
        const segs = [[[-0.2, -0.75], [-0.9, 0]], [[-0.9, 0], [-0.2, 0.75]], [[0.2, -0.75], [0.9, 0]], [[0.9, 0], [0.2, 0.75]]];
        for (let i = 0; i < n; i++) {
          const [[x1, y1], [x2, y2]] = segs[Math.floor(R() * 4)], t = R();
          o.push(x1 + (x2 - x1) * t + (R() - 0.5) * 0.12, y1 + (y2 - y1) * t + (R() - 0.5) * 0.12, (R() - 0.5) * 0.18);
        }
        return o;
      }
    };

    // ---------- Escenas: una por sección con data-scene ----------
    const scenes = [...document.querySelectorAll('[data-scene]')].map(el => ({
      el, shape: el.dataset.scene,
      anchor: el.querySelector('.scene-anchor'),
      rot: parseFloat(el.dataset.rot || 0),
      spin: el.dataset.spin !== undefined ? parseFloat(el.dataset.spin) : 1,
      top: 0, bottom: 0, a: 0, b: 0
    }));
    const fijas = new Set(['field', 'dust']);

    function medirEscenas() {
      const vh = window.innerHeight;
      scenes.forEach(s => {
        const r = s.el.getBoundingClientRect();
        s.top = r.top + window.scrollY; s.bottom = s.top + r.height;
        // Tramo en el que la figura se mantiene quieta (el centro de la pantalla dentro de la sección)
        const m = Math.min(r.height * 0.35, vh * 0.4);
        s.a = s.top + m; s.b = s.bottom - m;
        if (s.a > s.b) s.a = s.b = (s.top + s.bottom) / 2;
      });
    }

    function crear() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      world.width = Math.ceil(w * dpr); world.height = Math.ceil(h * dpr);
      N = w < 900 ? 1700 : 3200;
      const polvo = Math.round(N * 0.14);
      M = N - polvo;
      const usadas = new Set(scenes.map(s => s.shape).concat('field'));
      shapes = {};
      const polvoPts = gen.dust(polvo);
      usadas.forEach(nombre => { shapes[nombre] = gen[nombre](M).slice(0, M * 3).concat(polvoPts); });
      parts = Array.from({ length: N }, (_, i) => ({
        polvo: i >= M,
        col: colorAlAzar(), size: (i >= M ? 2 : 1.2) + R() * (i >= M ? 5 : 2.4),
        ang: R() * 6.28, giro: (R() - 0.5) * 0.02,
        nx: gauss(), ny: gauss(), nz: gauss(),            // dirección de dispersión durante las transiciones
        delay: R() * 900, ox: 0, oy: 0
      }));
      medirEscenas();
    }

    // Parámetros de proyección de una escena en este momento (centro y escala en pantalla)
    function params(s) {
      if (s.anchor && !fijas.has(s.shape)) {
        const r = s.anchor.getBoundingClientRect();
        return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, sc: Math.min(r.width, r.height) * 0.6, rot: s.rot, spin: s.spin, fija: false };
      }
      return { cx: w / 2, cy: h / 2, sc: Math.min(w, h) * 0.5, rot: s.rot, spin: s.spin, fija: true };
    }

    const suave = x => x * x * (3 - 2 * x);
    const easeOut = x => 1 - Math.pow(1 - x, 3);
    let t0 = performance.now(), tiltX = 0, tiltY = 0, raf = null;
    const D = 3.2;   // distancia de la cámara

    function proyectar(arr, j, P, giroY, giroX, vuelo, out) {
      let x = arr[j * 3], y = arr[j * 3 + 1], z = arr[j * 3 + 2];
      if (P.fija) z = ((z + vuelo + 4) % 6.4 + 6.4) % 6.4 - 4;   // la cámara avanza entre los fragmentos
      const cy = Math.cos(giroY), sy = Math.sin(giroY), cx = Math.cos(giroX), sx = Math.sin(giroX);
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy;
      const y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
      const prof = D - z2;
      if (prof < 0.35) { out.v = false; return; }
      const s = D / prof;
      out.v = true; out.x = P.cx + x1 * P.sc * s; out.y = P.cy + y1 * P.sc * s; out.s = P.fija ? s * 1.7 : s; out.z = z2;
    }

    const pa = {}, pb = {};
    function cuadro(now) {
      const t = now - t0;
      const vc = window.scrollY + h / 2;

      // ¿Entre qué escenas estamos?
      let i = 0;
      while (i < scenes.length - 1 && vc > scenes[i].b) i++;
      let A = scenes[Math.max(0, i - 1)], B = scenes[i], k = 1;
      if (i === 0 || vc >= B.a) { A = B; k = 1; }
      else { k = suave(Math.min(1, Math.max(0, (vc - A.b) / (B.a - A.b)))); }
      const PA = params(A), PB = params(B);
      const shA = shapes[A.shape], shB = shapes[B.shape], shF = shapes.field;

      // Giro lento + inclinación hacia el cursor
      const objY = cursor ? (cursor.x / w - 0.5) * 0.7 : 0, objX = cursor ? (cursor.y / h - 0.5) * 0.35 : 0;
      tiltY += (objY - tiltY) * 0.04; tiltX += (objX - tiltX) * 0.04;
      const base = reduceMotion ? 0.35 : t * 0.00011;
      // Figuras sin giro continuo (data-spin=0, p. ej. el logo): siempre de frente con un leve vaivén
      const giro = P => P.spin ? base * P.spin : (reduceMotion ? 0 : Math.sin(t * 0.0005) * 0.25);
      const gYA = giro(PA) + PA.rot + tiltY, gYB = giro(PB) + PB.rot + tiltY;
      const gX = -0.1 + tiltX + (reduceMotion ? 0 : Math.sin(t * 0.00023) * 0.05);
      const vuelo = window.scrollY * 0.0011 + (reduceMotion ? 0 : t * 0.00008);
      const PF = { cx: w / 2, cy: h / 2, sc: Math.min(w, h) * 0.5, fija: true };
      const disp = Math.sin(Math.PI * k) * 0.9;   // las partículas se dispersan a mitad de la transición

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cubetas = paleta.map(() => [[], [], []]);

      for (let j = 0; j < N; j++) {
        const p = parts[j];
        // El polvo siempre llena la pantalla (mismas coordenadas en todas las figuras)
        proyectar(shA, j, p.polvo ? PF : PA, p.polvo ? base * 0.3 : gYA, gX, vuelo, pa);
        let x, y, s, z, vis;
        if (k < 1 && A !== B && !p.polvo) {
          proyectar(shB, j, PB, gYB, gX, vuelo, pb);
          if (!pa.v && !pb.v) continue;
          const qa = pa.v ? pa : pb, qb = pb.v ? pb : pa;
          x = qa.x + (qb.x - qa.x) * k + p.nx * disp * PB.sc * 0.5;
          y = qa.y + (qb.y - qa.y) * k + p.ny * disp * PB.sc * 0.5;
          s = qa.s + (qb.s - qa.s) * k; z = qa.z + (qb.z - qa.z) * k; vis = true;
        } else {
          if (!pa.v) continue;
          x = pa.x; y = pa.y; s = pa.s; z = pa.z; vis = true;
        }
        // Armado inicial: todas salen del campo de fragmentos hacia la primera figura
        if (!reduceMotion && !p.polvo) {
          const ki = easeOut(Math.min(1, Math.max(0, (t - 300 - p.delay) / 1700)));
          if (ki < 1) {
            proyectar(shF, j, PF, base, gX, vuelo, pb);
            if (pb.v) { x = pb.x + (x - pb.x) * ki; y = pb.y + (y - pb.y) * ki; s = pb.s + (s - pb.s) * ki; }
          }
        }
        if (!vis || x < -60 || x > w + 60 || y < -60 || y > h + 60) continue;

        // El cursor aparta los triángulos (resorte de regreso)
        if (cursor) {
          const dx = x + p.ox - cursor.x, dy = y + p.oy - cursor.y, d2 = dx * dx + dy * dy;
          if (d2 < 16900) { const d = Math.sqrt(d2) || 1, f = (1 - d / 130) * 3.4; p.ox += dx / d * f; p.oy += dy / d * f; }
        }
        p.ox *= 0.92; p.oy *= 0.92;
        if (!reduceMotion) p.ang += p.giro;

        const prof = z < -0.3 ? 0 : z < 0.3 ? 1 : 2;
        cubetas[p.col][p.polvo ? 0 : prof].push(x + p.ox, y + p.oy, Math.min(26, p.size * s), p.ang);
      }

      ctx.lineWidth = 1;
      const alfas = [0.42, 0.65, 0.95];
      cubetas.forEach((porProf, ci) => {
        ctx.strokeStyle = paleta[ci].c;
        porProf.forEach((arr, pi) => {
          if (!arr.length) return;
          ctx.globalAlpha = alfas[pi];
          ctx.beginPath();
          for (let q = 0; q < arr.length; q += 4) triangulo(ctx, arr[q], arr[q + 1], arr[q + 2], arr[q + 3]);
          ctx.stroke();
        });
      });
      ctx.globalAlpha = 1;
      raf = reduceMotion ? null : requestAnimationFrame(cuadro);
    }

    crear();
    if (reduceMotion) {
      const dibujar = () => { if (!raf) raf = requestAnimationFrame((n) => { raf = null; cuadro(n); }); };
      window.addEventListener('scroll', dibujar, { passive: true });
      dibujar();
    } else {
      introLista.then(() => { t0 = performance.now(); raf = requestAnimationFrame(cuadro); });
    }

    // Recalcular al cambiar el tamaño (en celular la barra de direcciones cambia el alto: solo ancho)
    let tRes, ancho = window.innerWidth;
    window.addEventListener('resize', () => {
      clearTimeout(tRes);
      tRes = setTimeout(() => {
        if (window.innerWidth !== ancho) { ancho = window.innerWidth; crear(); }
        else { h = window.innerHeight; world.height = Math.ceil(h * dpr); medirEscenas(); }
      }, 150);
    });
    // Las imágenes y fuentes cambian la altura de las secciones
    window.addEventListener('load', medirEscenas);
    if ('ResizeObserver' in window) new ResizeObserver(medirEscenas).observe(document.querySelector('main'));
  }

  // =====================
  // 3. TITULAR — las letras se forman con partículas y estallan al pasar el cursor
  // =====================
  const hero = document.querySelector('.hero');
  const heroTitle = hero && hero.querySelector('.hero-title');
  const pCanvas = hero && hero.querySelector('.hero-particles');

  if (heroTitle && pCanvas && pCanvas.getContext && !reduceMotion) {
    const ctx = pCanvas.getContext('2d');
    heroTitle.classList.add('is-particles');
    let parts = [], raf = null, t0 = 0, dpr = 1, inicioResorte = 0, formado = false, ultimo = 0;

    // Dibuja el titular en un canvas oculto en la misma posición que el HTML y toma un punto cada GAP px
    function objetivos() {
      const hr = hero.getBoundingClientRect();
      const gap = window.innerWidth < 600 ? 3 : 4;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      pCanvas.width = Math.ceil(hr.width * dpr);
      pCanvas.height = Math.ceil(hr.height * dpr);
      const off = document.createElement('canvas');
      off.width = Math.ceil(hr.width); off.height = Math.ceil(hr.height);
      const o = off.getContext('2d', { willReadFrequently: true });
      heroTitle.querySelectorAll('.hero-line').forEach(line => {
        const cs = getComputedStyle(line);
        o.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing;
        o.fillStyle = cs.color;
        const asc = o.measureText('Hg').fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
        // Palabra por palabra con Range: respeta los saltos de línea del navegador
        const nodo = line.firstChild, range = document.createRange(), re = /\S+/g;
        let m;
        while ((m = re.exec(nodo.textContent))) {
          range.setStart(nodo, m.index);
          range.setEnd(nodo, m.index + m[0].length);
          const r = range.getBoundingClientRect();
          o.fillText(m[0], r.left - hr.left, r.top - hr.top + asc);
        }
      });
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const pts = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          const i = (y * off.width + x) * 4;
          if (data[i + 3] > 140) pts.push({ x, y, c: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`, s: gap * 0.6 });
        }
      }
      return pts;
    }

    // origen = null → intro (todas salen del centro del titular); {x, y} → estallido desde el cursor
    function lanzar(origen) {
      const pts = objetivos();
      if (!pts.length) { formado = true; heroTitle.classList.add('is-formed'); return; }
      const hr = hero.getBoundingClientRect(), tr = heroTitle.getBoundingClientRect();
      const cx = tr.left - hr.left + tr.width / 2, cy = tr.top - hr.top + tr.height / 2;
      parts = pts.map(p => {
        if (!origen) {
          const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 16;
          return { ...p, tx: p.x, ty: p.y, x: cx + (Math.random() - 0.5) * 30, y: cy + (Math.random() - 0.5) * 30, vx: Math.cos(a) * v, vy: Math.sin(a) * v };
        }
        const dx = p.x - origen.x, dy = p.y - origen.y, dist = Math.hypot(dx, dy) || 1;
        const f = 22 * Math.exp(-dist / 260) + 1.5;
        return { ...p, tx: p.x, ty: p.y, vx: dx / dist * f + (Math.random() - 0.5) * 3, vy: dy / dist * f + (Math.random() - 0.5) * 3 };
      });
      formado = false;
      heroTitle.classList.remove('is-formed');
      pCanvas.classList.remove('is-done');
      inicioResorte = origen ? 260 : 380;
      t0 = performance.now();
      if (!raf) raf = requestAnimationFrame(cuadro);
    }

    function cuadro(now) {
      const t = now - t0;
      const k = Math.min(1, Math.max(0, (t - inicioResorte) / 500)) * 0.075;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
      for (const p of parts) {
        p.vx = (p.vx + (p.tx - p.x) * k) * 0.88;
        p.vy = (p.vy + (p.ty - p.y) * k) * 0.88;
        p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      if (!formado && t > inicioResorte + 900) { formado = true; heroTitle.classList.add('is-formed'); pCanvas.classList.add('is-done'); }
      if (t > inicioResorte + 1600) { raf = null; ctx.clearRect(0, 0, pCanvas.width, pCanvas.height); return; }
      raf = requestAnimationFrame(cuadro);
    }

    introLista.then(() => (document.fonts ? document.fonts.ready : null)).then(() => setTimeout(() => lanzar(null), 150));
    // Seguro: si algo falla, el titular nunca se queda invisible
    setTimeout(() => { if (!formado) { formado = true; heroTitle.classList.add('is-formed'); pCanvas.classList.add('is-done'); } }, 6000);

    const estallar = (e) => {
      if (raf || !formado || performance.now() - ultimo < 2500) return;
      ultimo = performance.now();
      const hr = hero.getBoundingClientRect();
      lanzar({ x: e.clientX - hr.left, y: e.clientY - hr.top });
    };
    heroTitle.addEventListener('pointerenter', estallar);
    heroTitle.addEventListener('click', estallar);
  }

  // =====================
  // 4. CARRUSEL DE SERVICIOS — tarjeta central grande, vecinas atenuadas
  // =====================
  const car = document.getElementById('svcCarousel');
  if (car) {
    const cards = [...car.querySelectorAll('.car-card')];
    const slides = [...car.querySelectorAll('.car-slide')];
    const n = cards.length;
    let activo = 0;

    function pintar() {
      cards.forEach((card, i) => {
        let d = i - activo;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        const esActiva = d === 0;
        card.style.setProperty('--off', d);
        card.style.setProperty('--sc', esActiva ? 1 : 0.78);
        card.style.setProperty('--op', esActiva ? 1 : 0.28);
        card.style.setProperty('--gs', esActiva ? 0 : 1);
        card.style.setProperty('--br', esActiva ? 1 : 0.45);
        card.style.zIndex = esActiva ? 2 : 1;
        card.classList.toggle('is-active', esActiva);
      });
      slides.forEach((s, i) => {
        s.classList.toggle('is-active', i === activo);
        s.setAttribute('aria-hidden', i !== activo);
        s.querySelectorAll('a').forEach(a => { a.tabIndex = i === activo ? 0 : -1; });
      });
    }
    const ir = (dir) => { activo = (activo + dir + n) % n; pintar(); };

    car.querySelectorAll('.round-btn').forEach(b => b.addEventListener('click', () => ir(parseInt(b.dataset.dir))));
    cards.forEach((card, i) => card.addEventListener('click', () => { if (i !== activo) { activo = i; pintar(); } }));
    car.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') ir(1);
      if (e.key === 'ArrowLeft') ir(-1);
    });
    // Deslizar con el dedo
    let x0 = null;
    const stage = car.querySelector('.car-stage');
    stage.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    stage.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) ir(dx < 0 ? 1 : -1);
    });
    pintar();
  }

  // =====================
  // 5. PROCESO — los números se encienden en orden al entrar en pantalla (CSS)
  // =====================
  const timeline = document.getElementById('processTimeline');
  if (timeline) {
    if (reduceMotion) timeline.classList.add('is-run');
    else {
      const obs = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        timeline.classList.add('is-run'); obs.disconnect();
      }, { threshold: 0.35 });
      obs.observe(timeline);
    }
  }

  // Aparición con el scroll
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // También se muestra lo que ya quedó arriba (recargar a media página o saltar con un enlace)
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // Contadores
  const counterBox = document.getElementById('contadores');
  if (counterBox && !reduceMotion) {   // con movimiento reducido el HTML ya muestra el valor final
    const nums = counterBox.querySelectorAll('.counter-num');
    nums.forEach(el => { el.textContent = '0' + (el.dataset.suffix || ''); });
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      nums.forEach(el => {
        const target = parseInt(el.dataset.target), suffix = el.dataset.suffix || '', inicio = performance.now();
        const paso = (now) => {
          const p = Math.min(1, (now - inicio) / 1800);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      });
    }, { threshold: 0.3 });
    obs.observe(counterBox);
  }

  // Año del footer
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  // "Continuar por WhatsApp": arma el mensaje con lo que ya se escribió en el formulario
  const waForm = document.getElementById('waForm');
  if (waForm) {
    waForm.addEventListener('click', () => {
      const valor = id => document.getElementById(id).value.trim();
      const nombre = valor('nombre'), negocio = valor('negocio'), servicio = valor('servicio'), mensaje = valor('mensaje');
      let texto = 'Hola Nubo Studio';
      if (nombre) texto += `, soy ${nombre}` + (negocio ? ` de ${negocio}` : '');
      texto += '.';
      texto += servicio ? ` Me interesa: ${servicio}.` : ' Me interesa conocer sus servicios.';
      if (mensaje) texto += ` ${mensaje}`;
      waForm.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
    });
  }
});

// =====================
// MENÚ MÓVIL - función global (la usan los enlaces del menú)
// =====================
function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Abrir menú');
}

// =====================
// 6. FORMULARIO DE CONTACTO
// =====================
// TODO: Reemplaza el console.log con una llamada a tu API backend
// Ejemplo con fetch:
//
// async function enviarMensaje() {
//   const data = { nombre, email, negocio, servicio, mensaje };
//   const res = await fetch('/api/contacto', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
//   });
//   const result = await res.json();
//   if (result.ok) mostrarExito();
//   else mostrarError(result.mensaje);
// }

// Muestra el resultado dentro del formulario (#formStatus, aria-live) en lugar de alert()
function mostrarEstado(texto, tipo) {
  const status = document.getElementById('formStatus');
  if (!status) return;
  status.textContent = texto;
  status.className = 'form-status ' + (tipo === 'ok' ? 'is-ok' : 'is-error');
}

// Marca los campos inválidos y enfoca el primero
function marcarInvalidos(ids) {
  ['nombre', 'email', 'mensaje'].forEach(id => {
    document.getElementById(id).setAttribute('aria-invalid', ids.includes(id));
  });
  if (ids.length) document.getElementById(ids[0]).focus();
}

function enviarMensaje() {
  const nombre  = document.getElementById('nombre').value.trim();
  const email   = document.getElementById('email').value.trim();
  const negocio = document.getElementById('negocio').value.trim();
  const servicio = document.getElementById('servicio').value;
  const mensaje = document.getElementById('mensaje').value.trim();

  // Validación básica
  if (!nombre || !email || !mensaje) {
    marcarInvalidos([!nombre && 'nombre', !email && 'email', !mensaje && 'mensaje'].filter(Boolean));
    mostrarEstado('Por favor completa los campos obligatorios: nombre, correo y mensaje.', 'error');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    marcarInvalidos(['email']);
    mostrarEstado('Por favor ingresa un correo electrónico válido.', 'error');
    return;
  }

  marcarInvalidos([]);

  // --- REEMPLAZAR con llamada a API cuando tengas backend ---
  console.log('Datos del formulario:', { nombre, email, negocio, servicio, mensaje });
  mostrarEstado(`¡Gracias ${nombre}! Tu mensaje fue enviado. Te contactaremos pronto.`, 'ok');

  // Limpiar formulario
  document.getElementById('nombre').value = '';
  document.getElementById('email').value = '';
  document.getElementById('negocio').value = '';
  document.getElementById('servicio').value = '';
  document.getElementById('mensaje').value = '';
}
