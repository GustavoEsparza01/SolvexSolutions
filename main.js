/* =====================
   SOLVEXSOLUTIONS - SCRIPTS
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

document.addEventListener('DOMContentLoaded', () => {

  // =====================
  // 1. MENÚ HAMBURGUESA
  // =====================
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
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

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.style.color = link.getAttribute('href') === '#' + current
        ? 'var(--text)'
        : '';
    });
  });

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

  // Hero se muestra inmediatamente sin esperar scroll
  document.querySelectorAll('.hero .reveal, .hero .reveal-left, .hero .reveal-right')
    .forEach(el => el.classList.add('visible'));

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
  if (counterSection) {
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
}

// =====================
// 6. FORMULARIO DE CONTACTO
// =====================
// TODO: Reemplaza el alert con una llamada a tu API backend
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

function enviarMensaje() {
  const nombre  = document.getElementById('nombre').value.trim();
  const email   = document.getElementById('email').value.trim();
  const negocio = document.getElementById('negocio').value.trim();
  const servicio = document.getElementById('servicio').value;
  const mensaje = document.getElementById('mensaje').value.trim();

  // Validación básica
  if (!nombre || !email || !mensaje) {
    alert('Por favor completa los campos obligatorios: nombre, correo y mensaje.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert('Por favor ingresa un correo electrónico válido.');
    return;
  }

  // --- REEMPLAZAR con llamada a API cuando tengas backend ---
  console.log('Datos del formulario:', { nombre, email, negocio, servicio, mensaje });
  alert(`¡Gracias ${nombre}! Tu mensaje fue enviado. Te contactaremos pronto.`);

  // Limpiar formulario
  document.getElementById('nombre').value = '';
  document.getElementById('email').value = '';
  document.getElementById('negocio').value = '';
  document.getElementById('servicio').value = '';
  document.getElementById('mensaje').value = '';
}
