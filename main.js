/* =====================
   NUBO STUDIO - SCRIPTS
   main.js
   
   MÓDULOS:
   1. Menú hamburguesa (móvil)
   2. Navegación activa en scroll
   3. Animaciones de reveal al hacer scroll
   4. Contadores animados
   5. Formulario de contacto
   
   TODO - Backend:
   - Conectar enviarMensaje() a una API REST o servicio de email
   - Ejemplo: fetch('/api/contacto', { method: 'POST', body: formData })
===================== */

// Marca que hay JS: el CSS muestra controles que solo funcionan con script (p. ej. el interruptor papel/digital)
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {

  // =====================
  // 1. MENÚ HAMBURGUESA
  // =====================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    const abierto = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', abierto);
    hamburger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
  });

  // Cerrar al hacer clic afuera
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      closeMobileMenu();
    }
  });

  // =====================
  // 2. NAV ACTIVO EN SCROLL
  // =====================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const nav = document.querySelector('nav');

  function actualizarNav() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    // Progreso de lectura (barra en el borde del nav)
    const recorrido = document.documentElement.scrollHeight - window.innerHeight;
    nav.style.setProperty('--page', recorrido > 0 ? (window.scrollY / recorrido).toFixed(4) : 0);
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', actualizarNav, { passive: true });
  actualizarNav();

  // =====================
  // 2b. SERVICIOS — luz que sigue al cursor + preseleccionar servicio en el formulario
  // =====================
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.service-row').forEach(row => {
      row.addEventListener('pointermove', (e) => {
        const r = row.getBoundingClientRect();
        row.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        row.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  const selectServicio = document.getElementById('servicio');
  document.querySelectorAll('.service-cta[data-servicio]').forEach(link => {
    link.addEventListener('click', () => {
      if (selectServicio) selectServicio.value = link.dataset.servicio;
    });
  });

  // =====================
  // 2c. PROCESO — línea de tiempo que se llena con el scroll
  // =====================
  const timeline = document.getElementById('processTimeline');
  if (timeline) {
    const steps = [...timeline.querySelectorAll('.step')];
    const counter = document.getElementById('processCounter');
    let ticking = false;
    let pasoActual = 0;

    // La línea termina en el centro del último círculo (el último paso tiene contenido debajo)
    function medirLinea() {
      const centroDe = (step) => {
        const c = step.querySelector('.step-num').getBoundingClientRect();
        return c.top + c.height / 2;
      };
      const inicio = centroDe(steps[0]), fin = centroDe(steps[steps.length - 1]);
      timeline.style.setProperty('--line-end', (timeline.getBoundingClientRect().bottom - fin) + 'px');
      return { inicio, fin };
    }

    function actualizarProceso() {
      ticking = false;
      const { inicio, fin } = medirLinea();
      const centro = window.innerHeight * 0.55;
      const progreso = Math.min(1, Math.max(0, (centro - inicio) / (fin - inicio)));
      timeline.style.setProperty('--progress', progreso.toFixed(3));

      let activo = 0;
      steps.forEach((step, i) => {
        if (step.getBoundingClientRect().top < centro) activo = i + 1;
      });
      steps.forEach((step, i) => {
        step.classList.toggle('is-done', i < activo - 1);
        step.classList.toggle('is-active', i === activo - 1);
      });

      if (counter && activo && activo !== pasoActual) {
        counter.textContent = String(activo).padStart(2, '0');
        counter.classList.remove('tick');
        void counter.offsetWidth; // reinicia la animación
        counter.classList.add('tick');
      }
      pasoActual = activo;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(actualizarProceso); }
    }, { passive: true });
    window.addEventListener('resize', actualizarProceso);
    actualizarProceso();
  }

  // =====================
  // 2d. NOSOTROS — párrafo que se ilumina por palabra + abanico de tarjetas
  // =====================
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const statement = document.getElementById('whyStatement');
  const fan = document.getElementById('whyFan');

  // Avance (0–1) de un elemento entre dos alturas del viewport (fracciones de innerHeight)
  function avance(el, desde, hasta) {
    const top = el.getBoundingClientRect().top;
    const h = window.innerHeight;
    return Math.min(1, Math.max(0, (h * desde - top) / (h * (desde - hasta))));
  }

  let palabras = [];
  if (statement && !reduceMotion) {
    // Envuelve cada palabra en <span class="w"> sin perder los .hl
    const walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    nodos.forEach(nodo => {
      const frag = document.createDocumentFragment();
      nodo.textContent.split(/(\s+)/).forEach(parte => {
        if (!parte) return;
        if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
        const span = document.createElement('span');
        span.className = 'w';
        span.textContent = parte;
        frag.appendChild(span);
      });
      nodo.replaceWith(frag);
    });
    statement.classList.add('is-split');
    palabras = [...statement.querySelectorAll('.w')];
  }

  if (fan && reduceMotion) fan.style.setProperty('--fan', 1);

  if ((palabras.length || fan) && !reduceMotion) {
    let tickNos = false;
    function actualizarNosotros() {
      tickNos = false;
      if (palabras.length) {
        const n = Math.round(avance(statement, 0.85, 0.35) * palabras.length);
        palabras.forEach((w, i) => w.classList.toggle('lit', i < n));
      }
      if (fan) fan.style.setProperty('--fan', avance(fan, 0.95, 0.4).toFixed(3));
    }
    window.addEventListener('scroll', () => {
      if (!tickNos) { tickNos = true; requestAnimationFrame(actualizarNosotros); }
    }, { passive: true });
    window.addEventListener('resize', actualizarNosotros);
    actualizarNosotros();
  }

  // =====================
  // 2e. PAPEL VS DIGITAL — interruptor antes/después
  // =====================
  const compBoard = document.getElementById('compBoard');
  const compSwitch = document.querySelector('.comp-switch');
  if (compBoard && compSwitch) {
    const tabs = compSwitch.querySelectorAll('.comp-tab');
    let elegidoPorUsuario = false;

    function ponerEstado(estado) {
      compBoard.dataset.estado = estado;
      compSwitch.dataset.estado = estado;
      tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.estado === estado));
    }

    tabs.forEach(tab => tab.addEventListener('click', () => {
      elegidoPorUsuario = true;
      ponerEstado(tab.dataset.estado);
    }));
    ponerEstado('papel');

    // Al llegar al tablero, el negocio "se digitaliza" solo una vez (si el usuario no ha tocado el interruptor)
    const compObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        compObserver.disconnect();
        setTimeout(() => { if (!elegidoPorUsuario) ponerEstado('digital'); }, 1200);
      });
    }, { threshold: 0.6 });
    compObserver.observe(compBoard);
  }

  // =====================
  // 2f. HERO CINEMÁTICO — titular por palabras, luz/3D con el cursor, salida con el scroll
  // =====================
  const hero = document.querySelector('.hero');
  const heroH1 = hero && hero.querySelector('h1');

  if (heroH1 && !reduceMotion) {
    // Envuelve cada palabra en .w > .wi (máscara + palabra). Las píldoras (aria-hidden) se dejan igual.
    const walker = document.createTreeWalker(heroH1, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('.pill') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    let i = 0;
    nodos.forEach(nodo => {
      const frag = document.createDocumentFragment();
      nodo.textContent.split(/(\s+)/).forEach(parte => {
        if (!parte) return;
        if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(parte)); return; }
        const w = document.createElement('span');
        w.className = 'w';
        const wi = document.createElement('span');
        wi.className = 'wi';
        wi.style.setProperty('--wi', i++);
        wi.textContent = parte;
        w.appendChild(wi);
        frag.appendChild(w);
      });
      nodo.replaceWith(frag);
    });
    heroH1.classList.remove('reveal');
    heroH1.classList.add('is-split');
  }

  if (hero && !reduceMotion) {
    // Cursor → --mx / --my suavizados (solo con mouse; en táctil no aplica)
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5, rafHero = null;
      const seguir = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        hero.style.setProperty('--mx', cx.toFixed(4));
        hero.style.setProperty('--my', cy.toFixed(4));
        rafHero = (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) ? requestAnimationFrame(seguir) : null;
      };
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width;
        ty = (e.clientY - r.top) / r.height;
        if (!rafHero) rafHero = requestAnimationFrame(seguir);
      });
      hero.addEventListener('pointerleave', () => {
        tx = 0.5; ty = 0.5;
        if (!rafHero) rafHero = requestAnimationFrame(seguir);
      });
    }

    // Scroll → --hs (0 arriba, 1 cuando se recorrió el 80% del hero)
    let tickHero = false;
    const salidaHero = () => {
      tickHero = false;
      const p = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.8)));
      hero.style.setProperty('--hs', p.toFixed(3));
    };
    window.addEventListener('scroll', () => {
      if (!tickHero) { tickHero = true; requestAnimationFrame(salidaHero); }
    }, { passive: true });
    salidaHero();
  }

  // =====================
  // 2g. TONO DE FONDO — el body toma el tono de la sección que cruza el centro de la pantalla
  // =====================
  const seccionesConTono = document.querySelectorAll('section[data-tone]');
  if (seccionesConTono.length) {
    document.body.dataset.tone = 'base';
    const tonoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) document.body.dataset.tone = entry.target.dataset.tone;
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    seccionesConTono.forEach(s => tonoObserver.observe(s));
  }

  // Año del footer
  const anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  // =====================
  // 3. SCROLL REVEAL ANIMATION
  // =====================
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Hero se muestra inmediatamente sin esperar scroll (o al terminar la intro del logo)
  const mostrarHero = () => document.querySelectorAll('.hero .reveal, .hero .reveal-left, .hero .reveal-right')
    .forEach(el => el.classList.add('visible'));
  if (document.documentElement.classList.contains('intro-hold')) {
    // La intro empieza a subir a los 1.6s: el hero arranca justo debajo
    setTimeout(() => {
      document.documentElement.classList.remove('intro-hold');
      mostrarHero();
    }, 1600);
  } else {
    mostrarHero();
  }

  // El resto espera scroll
  revealEls.forEach(el => {
    if (!el.closest('.hero')) revealObserver.observe(el);
  });

  // =====================
  // 4. CONTADORES ANIMADOS
  // =====================
  let countersStarted = false;

  function animateCounters() {
    if (countersStarted) return;
    countersStarted = true;

    document.querySelectorAll('.counter-num').forEach(el => {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1800;
      const step = 16;
      const increment = target / (duration / step);
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current) + suffix;
      }, step);
    });
  }

  const counterSection = document.getElementById('contadores');
  if (counterSection && reduceMotion) {
    countersStarted = true; // el HTML ya muestra el valor final
  } else if (counterSection) {
    counterSection.querySelectorAll('.counter-num').forEach(el => {
      el.textContent = '0' + (el.dataset.suffix || '');
    });
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) animateCounters();
      });
    }, { threshold: 0.3 });
    counterObserver.observe(counterSection);
  }

});

// =====================
// 5. MENÚ MÓVIL - función global
// =====================
function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  hamburger.classList.remove('active');
  mobileMenu.classList.remove('open');
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
