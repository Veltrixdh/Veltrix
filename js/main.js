"use strict";

/* =========================================================
   Configuración
   ========================================================= */
const CONFIG = {
  whatsapp: {
    // Prefijo de Colombia, sin "+".
    countryCode: "57",
    // TODO: número de WhatsApp sin prefijo, solo dígitos (p. ej. "3001234567").
    number: "",
    defaultMessage: "Hola Veltrix, quiero contarles sobre mi proyecto.",
  },
  // TODO: URLs completas de los perfiles. Los que queden vacíos no se muestran.
  social: {
    linkedin: "",
    github: "",
    x: "",
  },
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function whatsappUrl(message) {
  const { countryCode, number } = CONFIG.whatsapp;
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${countryCode}${digits}?text=${encodeURIComponent(message)}`;
}

/* =========================================================
   Fondo de estrellas
   ========================================================= */
function initStarfield() {
  const canvas = document.getElementById("stars");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const STAR_COUNT = 160;
  let width = 0;
  let height = 0;
  let stars = [];
  let frame = 0;

  function createStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.2,
      v: Math.random() * 0.25 + 0.05,
      t: Math.random() * 6,
    }));
  }

  function draw(move) {
    ctx.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      if (move) {
        s.y -= s.v;
        s.t += 0.03;
        if (s.y < 0) {
          s.y = height;
          s.x = Math.random() * width;
        }
      }
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.t));
      ctx.fillStyle = s.r > 1 ? "#60a5fa" : "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function resize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    const widthChanged = newWidth !== width;

    // En móvil la barra del navegador cambia solo la altura al hacer scroll:
    // en ese caso se reescalan las estrellas en lugar de regenerarlas.
    if (!widthChanged && height) {
      const ratio = newHeight / height;
      stars.forEach((s) => (s.y *= ratio));
    }

    width = newWidth;
    height = newHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (widthChanged) createStars();
    if (reduceMotion.matches) draw(false);
  }

  function loop() {
    draw(true);
    frame = requestAnimationFrame(loop);
  }

  function start() {
    cancelAnimationFrame(frame);
    if (reduceMotion.matches) draw(false);
    else loop();
  }

  resize();
  start();
  window.addEventListener("resize", resize);
  reduceMotion.addEventListener("change", start);
}

/* =========================================================
   Aparición al hacer scroll
   ========================================================= */
function initReveal() {
  const items = [...document.querySelectorAll(".reveal")];
  const REVEAL_MS = 900;

  items.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) =>
      c.classList.contains("reveal"),
    );
    el.style.setProperty("--d", `${siblings.indexOf(el) * 110}ms`);
    el.classList.add("is-done");
  });

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        el.classList.add("in");

        // Solo se animan los bloques que estaban ocultos; los demás ya
        // muestran su estado final y no deben parpadear.
        if (!el.classList.contains("pre")) return;
        const delay = parseFloat(el.style.getPropertyValue("--d")) || 0;
        setTimeout(() => el.classList.add("is-done"), delay + REVEAL_MS);
      }),
    { threshold: 0.2 },
  );
  items.forEach((el) => observer.observe(el));

  if (reduceMotion.matches) return;

  // Se ocultan los bloques de más abajo solo cuando el usuario empieza a
  // moverse por la página, así nada queda invisible si el JS tarda.
  const triggers = ["scroll", "wheel", "touchmove", "keydown"];
  function arm() {
    triggers.forEach((ev) => window.removeEventListener(ev, arm));
    items.forEach((el) => {
      if (el.classList.contains("in")) return;
      if (el.getBoundingClientRect().top > window.innerHeight * 0.9) {
        el.classList.add("pre");
        el.classList.remove("is-done");
      }
    });
  }
  triggers.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));
}

/* =========================================================
   Barra de progreso + parallax de los orbes
   ========================================================= */
function initScrollEffects() {
  const bar = document.getElementById("progress");
  const header = document.querySelector(".site-header");
  const orbs = document.querySelectorAll("[data-parallax]");
  let ticking = false;

  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);

    if (reduceMotion.matches) return;
    // Desplazamiento acotado (± la mitad del rango) para que los orbes
    // nunca salgan de la pantalla.
    orbs.forEach((orb) => {
      const range = Number(orb.dataset.parallax);
      orb.style.transform = `translate3d(0, ${(progress - 0.5) * range}px, 0)`;
    });
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}

/* =========================================================
   Menú móvil
   ========================================================= */
function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  const icon = toggle.querySelector("i");
  const desktop = window.matchMedia("(min-width: 768px)");

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    icon.className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  }

  toggle.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-open")),
  );
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  desktop.addEventListener("change", () => setOpen(false));
}

/* =========================================================
   Brillo que sigue al cursor en las tarjetas
   ========================================================= */
function initCardGlow() {
  document.querySelectorAll(".card--glow").forEach((card) =>
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    }),
  );
}

/* =========================================================
   Inclinación 3D del logo del hero
   ========================================================= */
function initLogoTilt() {
  const area = document.getElementById("hero-visual");
  const logo = document.getElementById("hero-logo-img");

  area.addEventListener("mousemove", (e) => {
    if (reduceMotion.matches) return;
    const r = area.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    logo.style.transform = `perspective(600px) rotateY(${dx * 30}deg) rotateX(${-dy * 30}deg)`;
  });
  area.addEventListener("mouseleave", () => {
    logo.style.transform = "";
  });
}

/* =========================================================
   Sistema de Internacionalización (i18n: ES / EN)
   ========================================================= */
const I18N = {
  es: {
    "nav.services": "Servicios",
    "nav.demo": "Demo",
    "nav.projects": "Proyectos",
    "nav.team": "Equipo",
    "nav.contact": "Contacto",
    "nav.talk": "Hablemos",
    "hero.badge": "Ingeniería de software de alto rendimiento",
    "hero.title": "Construimos el <span class=\"glow-text\">software</span> del futuro.",
    "hero.lead": "Veltrix diseña y desarrolla productos digitales a medida: apps, plataformas e IA que escalan a la velocidad de tu ambición.",
    "hero.start": "Iniciar proyecto <i class=\"fa-solid fa-arrow-right\" aria-hidden=\"true\"></i>",
    "hero.services": "<i class=\"fa-solid fa-arrow-down\" aria-hidden=\"true\"></i> Ver servicios",
    "hero.floatTime": "Respuesta en 24 h",
    "hero.floatQuote": "Presupuesto sin costo",
    "services.eyebrow": "Servicios",
    "services.title": "Todo lo que tu producto necesita",
    "services.s1Title": "Desarrollo web",
    "services.s1Text": "Plataformas y SaaS rápidos, seguros y listos para escalar.",
    "services.s2Title": "Apps móviles",
    "services.s2Text": "iOS y Android con experiencias fluidas y nativas.",
    "services.s3Title": "IA y datos",
    "services.s3Text": "Modelos, automatización y analítica que impulsan decisiones.",
    "services.s4Title": "Cloud y DevOps",
    "services.s4Text": "Infraestructura automatizada, CI/CD y observabilidad.",
    "services.s5Title": "UX/UI Design",
    "services.s5Text": "Interfaces memorables diseñadas alrededor de tus usuarios.",
    "services.s6Title": "Ciberseguridad",
    "services.s6Text": "Auditorías y arquitectura segura desde el primer commit.",
    "demo.eyebrow": "Demo · Asistente IA",
    "demo.title": "Pruébalo tú mismo",
    "demo.lead": "Toca una opción o escribe tu mensaje para ver cómo respondería un asistente inteligente adaptado a tu negocio.",
    "demo.status": "En línea · Respuesta inmediata",
    "demo.dateDivider": "Hoy · Asistente en vivo",
    "demo.quickLabel": "Sugerencias rápidas:",
    "demo.q1": "Ver catálogo",
    "demo.q2": "Estado de pedido",
    "demo.q3": "Agendar cita",
    "demo.q4": "Hablar con asesor",
    "demo.inputPlaceholder": "Escribe un mensaje...",
    "projects.eyebrow": "Proyectos",
    "projects.title": "Lo que construimos",
    "projects.note": "Proyectos reales en producción desarrollados y desplegados por nuestro equipo.",
    "projects.badgeLive": "<i class=\"fa-solid fa-circle-check\" aria-hidden=\"true\"></i> En vivo",
    "projects.visitSite": "Visitar sitio",
    "projects.badgeConcept": "Concepto",
    "projects.hireCategory": "Plataforma web",
    "projects.hireDesc": "Plataforma de evaluación y selección de talento para reclutadores desplegada en Azure.",
    "projects.mercattoCategory": "Marketplace",
    "projects.mercattoDesc": "Marketplace multi-vendedor con pasarela de pagos Wompi Bancolombia y despliegue en Vercel.",
    "projects.catMobile": "App móvil",
    "projects.catWeb": "Plataforma web",
    "projects.catSaaS": "SaaS",
    "projects.catAI": "Automatización IA",
    "projects.catIoT": "IoT",
    "projects.catEcommerce": "E-commerce",
    "projects.catEdTech": "Plataforma educativa",
    "projects.rutaxpressDesc": "Seguimiento de envíos en tiempo real para repartidores y clientes.",
    "projects.clinicaDesc": "Agenda de citas médicas con recordatorios automáticos por WhatsApp.",
    "projects.finpilotDesc": "Panel financiero que reúne ventas, gastos y flujo de caja en un solo lugar.",
    "projects.mesabotDesc": "Asistente que toma pedidos y reservas para restaurantes las 24 horas.",
    "projects.agrosenseDesc": "Sensores y alertas para monitorear humedad y temperatura de cultivos.",
    "projects.nomadaDesc": "Tienda en línea con pagos, inventario y envíos integrados.",
    "projects.edulabDesc": "Cursos en video, evaluaciones y certificados para academias.",
    "projects.pulsofitDesc": "Rutinas, progreso y pagos de membresía para gimnasios.",
    "team.eyebrow": "Equipo",
    "team.title": "Las personas detrás de Veltrix",
    "team.note": "Un equipo pequeño que trabaja directamente contigo, sin intermediarios, desde la primera llamada hasta la entrega.",
    "team.m1Role": "Desarrollador Full Stack",
    "team.m1Bio": "Tres años programando en Java durante su formación universitaria. Construye aplicaciones completas: desde la base de datos hasta la interfaz.",
    "team.m2Role": "Automatizaciones y procesos con IA",
    "team.m2Bio": "Fundador de Veltrix Suite (plataforma ARM). Tres años creando proyectos escalables con IA que eliminan las tareas repetitivas de los negocios.",
    "team.m2Skill1": "Automatización con IA",
    "team.m2Skill2": "Procesos",
    "team.m2Skill3": "Proyectos escalables",
    "team.m3Name": "Gustavo Gonzalez",
    "team.m3Role": "Desarrollador Full Stack",
    "team.m3Bio": "Estudiante universitario con experiencia en desarrollo full stack. Construye aplicaciones completas y escalables con Java, Spring Boot, JavaScript y React, desde bases de datos hasta la interfaz.",
    "team.m4Badge": "Por confirmar",
    "team.m4Name": "Nombre por confirmar",
    "team.m4Role": "Diseño UX/UI",
    "team.m4Bio": "Perfil de ejemplo. Aquí irá la experiencia de la persona encargada del diseño de interfaces.",
    "team.m4Skill2": "Prototipos",
    "cta.title": "¿Listo para despegar?",
    "cta.lead": "Cuéntanos tu idea y continuamos la conversación por WhatsApp. Te respondemos en menos de 24 horas.",
    "cta.placeholder": "Ej.: una app para gestionar pedidos",
    "cta.btn": "<i class=\"fa-brands fa-whatsapp\" aria-hidden=\"true\"></i> Escribir por WhatsApp",
    "footer.rights": "Todos los derechos reservados.",
    "footer.faqLink": "Preguntas frecuentes",
    "faq.fabLabel": "Preguntas frecuentes",
    "faq.pill": "Centro de ayuda",
    "faq.title": "Preguntas frecuentes",
    "faq.subtitle": "Todo lo que necesitas saber antes de iniciar tu proyecto.",
    "faq.q1": "¿Cuánto cuesta un proyecto?",
    "faq.a1": "Depende del alcance y las funciones que necesites. Después de una primera conversación te enviamos un presupuesto detallado y sin costo, para que sepas exactamente qué incluye.",
    "faq.q2": "¿Cuánto tiempo tarda?",
    "faq.a2": "Una landing page suele estar lista en una o dos semanas. Una plataforma web o una app puede tomar entre uno y tres meses, según su complejidad. Antes de empezar acordamos un cronograma contigo.",
    "faq.q3": "¿Cómo es el proceso de trabajo?",
    "faq.a3": "Primero conversamos sobre tu idea, luego te enviamos una propuesta con alcance y precio. Durante el desarrollo ves avances cada semana y, al terminar, publicamos el proyecto y te acompañamos en el lanzamiento.",
    "faq.q4": "¿El código y el diseño serán míos?",
    "faq.a4": "Sí. Al finalizar el proyecto te entregamos el código fuente, los diseños y todos los accesos, para que tengas el control total de tu producto.",
    "faq.q5": "¿Ofrecen soporte después de la entrega?",
    "faq.a5": "Sí. Incluimos un periodo de soporte para corregir cualquier error y, si lo necesitas, acordamos un plan de mantenimiento para nuevas mejoras.",
    "faq.q6": "¿Trabajan con clientes fuera de Colombia?",
    "faq.a6": "Sí. Trabajamos de forma remota con reuniones por videollamada y comunicación directa por WhatsApp, estés donde estés.",
    "faq.q7": "¿Qué necesito para empezar?",
    "faq.a7": "Solo tu idea. No hace falta tener nada técnico definido: te ayudamos a darle forma, priorizar funciones y elegir la mejor tecnología.",
    "faq.footerTitle": "¿Tienes otra pregunta?",
    "faq.footerDesc": "Te respondemos por WhatsApp en minutos.",
    "faq.footerBtn": "<i class=\"fa-brands fa-whatsapp\" aria-hidden=\"true\"></i> Escríbenos"
  },
  en: {
    "nav.services": "Services",
    "nav.demo": "Demo",
    "nav.projects": "Projects",
    "nav.team": "Team",
    "nav.contact": "Contact",
    "nav.talk": "Let's talk",
    "hero.badge": "High-performance software engineering",
    "hero.title": "We build the <span class=\"glow-text\">software</span> of the future.",
    "hero.lead": "Veltrix designs and develops bespoke digital products: apps, platforms, and AI that scale at the speed of your ambition.",
    "hero.start": "Start project <i class=\"fa-solid fa-arrow-right\" aria-hidden=\"true\"></i>",
    "hero.services": "<i class=\"fa-solid fa-arrow-down\" aria-hidden=\"true\"></i> View services",
    "hero.floatTime": "24h Response",
    "hero.floatQuote": "Free estimate",
    "services.eyebrow": "Services",
    "services.title": "Everything your product needs",
    "services.s1Title": "Web Development",
    "services.s1Text": "Fast, secure SaaS platforms ready to scale globally.",
    "services.s2Title": "Mobile Apps",
    "services.s2Text": "iOS and Android with fluid, native experiences.",
    "services.s3Title": "AI & Data",
    "services.s3Text": "Models, automation, and analytics driving smart decisions.",
    "services.s4Title": "Cloud & DevOps",
    "services.s4Text": "Automated infrastructure, CI/CD, and high observability.",
    "services.s5Title": "UX/UI Design",
    "services.s5Text": "Memorable digital interfaces designed around your users.",
    "services.s6Title": "Cybersecurity",
    "services.s6Text": "Audits and secure architecture from the first commit.",
    "demo.eyebrow": "Demo · AI Assistant",
    "demo.title": "Try it yourself",
    "demo.lead": "Tap an option or type a message to see how an intelligent assistant tailored to your business responds.",
    "demo.status": "Online · Immediate response",
    "demo.dateDivider": "Today · Live Assistant",
    "demo.quickLabel": "Quick suggestions:",
    "demo.q1": "View catalog",
    "demo.q2": "Order status",
    "demo.q3": "Book appointment",
    "demo.q4": "Talk to advisor",
    "demo.inputPlaceholder": "Type a message...",
    "projects.eyebrow": "Projects",
    "projects.title": "What we build",
    "projects.note": "Live production platforms engineered and deployed by our team.",
    "projects.badgeLive": "<i class=\"fa-solid fa-circle-check\" aria-hidden=\"true\"></i> Live App",
    "projects.visitSite": "Visit site",
    "projects.badgeConcept": "Concept",
    "projects.hireCategory": "Web Platform",
    "projects.hireDesc": "Smart talent hiring and assessment platform deployed on Microsoft Azure.",
    "projects.mercattoCategory": "Marketplace",
    "projects.mercattoDesc": "Multi-vendor marketplace with dynamic catalog and Wompi payments on Vercel.",
    "projects.catMobile": "Mobile App",
    "projects.catWeb": "Web Platform",
    "projects.catSaaS": "SaaS",
    "projects.catAI": "AI Automation",
    "projects.catIoT": "IoT",
    "projects.catEcommerce": "E-commerce",
    "projects.catEdTech": "EdTech Platform",
    "projects.rutaxpressDesc": "Real-time delivery and parcel tracking for couriers and clients.",
    "projects.clinicaDesc": "Medical appointment scheduling with automated WhatsApp reminders.",
    "projects.finpilotDesc": "Financial analytics dashboard unifying revenue, expenses, and cash flow.",
    "projects.mesabotDesc": "24/7 conversational AI assistant taking restaurant orders and bookings.",
    "projects.agrosenseDesc": "Smart telemetry sensors and real-time alerts for crop climate monitoring.",
    "projects.nomadaDesc": "Modern headless storefront with payments, stock, and shipping integration.",
    "projects.edulabDesc": "Video courses, automated grading, and verified student certifications.",
    "projects.pulsofitDesc": "Workout routines, body progress tracking, and gym membership billing.",
    "team.eyebrow": "Team",
    "team.title": "The people behind Veltrix",
    "team.note": "A lean team that works directly with you, without middlemen, from the first discovery call to launch.",
    "team.m1Role": "Full Stack Developer",
    "team.m1Bio": "Three years coding in Java during university. Builds complete applications: from database architecture to UI.",
    "team.m2Role": "AI Automation & Processes",
    "team.m2Bio": "Founder of Veltrix Suite (ARM platform). Three years delivering scalable AI solutions that eliminate repetitive business tasks.",
    "team.m2Skill1": "AI Automation",
    "team.m2Skill2": "Workflows",
    "team.m2Skill3": "Scalable Systems",
    "team.m3Name": "Gustavo Gonzalez",
    "team.m3Role": "Full Stack Developer",
    "team.m3Bio": "University student with full-stack development experience. Builds complete and scalable applications with Java, Spring Boot, JavaScript, and React, from databases to user interfaces.",
    "team.m4Badge": "To be confirmed",
    "team.m4Name": "Name to be confirmed",
    "team.m4Role": "UX/UI Design",
    "team.m4Bio": "Example profile. Experience details of the designer in charge of digital interfaces.",
    "team.m4Skill2": "Prototyping",
    "cta.title": "Ready to take off?",
    "cta.lead": "Tell us about your idea and let's continue on WhatsApp. We answer in less than 24 hours.",
    "cta.placeholder": "E.g.: an app to manage online orders",
    "cta.btn": "<i class=\"fa-brands fa-whatsapp\" aria-hidden=\"true\"></i> Chat on WhatsApp",
    "footer.rights": "All rights reserved.",
    "footer.faqLink": "FAQ",
    "faq.fabLabel": "FAQ",
    "faq.pill": "Help Center",
    "faq.title": "Frequently asked questions",
    "faq.subtitle": "Everything you need to know before launching your project.",
    "faq.q1": "How much does a project cost?",
    "faq.a1": "It depends on the scope and features you need. After an initial discovery call, we provide a detailed, zero-cost proposal so you know exactly what is included.",
    "faq.q2": "How long does it take?",
    "faq.a2": "A high-converting landing page is typically delivered in 1-2 weeks. Web platforms or mobile apps range from 1 to 3 months depending on complexity. We agree on a timeline beforehand.",
    "faq.q3": "How does the workflow work?",
    "faq.a3": "First we discuss your vision, then send a clear scope proposal. During development you see weekly progress demos, and upon completion we deploy and support your launch.",
    "faq.q4": "Will I own the code and design?",
    "faq.a4": "Yes, 100%. Upon project completion we hand over the full source code repository, design files, and all credentials so you have complete ownership.",
    "faq.q5": "Do you provide post-launch support?",
    "faq.a5": "Yes. We include a warranty period to fix any issues and offer continuous maintenance and feature scaling plans.",
    "faq.q6": "Do you work with international clients?",
    "faq.a6": "Yes. We work remotely worldwide via video calls, asynchronous updates, and direct WhatsApp communication.",
    "faq.q7": "What do I need to get started?",
    "faq.a7": "Just your idea. You don't need technical specs ready: we help you shape it, prioritize MVP features, and choose the ideal tech stack.",
    "faq.footerTitle": "Have another question?",
    "faq.footerDesc": "We answer on WhatsApp in minutes.",
    "faq.footerBtn": "<i class=\"fa-brands fa-whatsapp\" aria-hidden=\"true\"></i> Contact us"
  }
};

let currentLang = localStorage.getItem("veltrix_lang") || "es";
let onLanguageChangeCallback = null;

function applyLanguage(lang) {
  currentLang = lang === "en" ? "en" : "es";
  localStorage.setItem("veltrix_lang", currentLang);
  document.documentElement.lang = currentLang;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === currentLang);
  });

  const dict = I18N[currentLang];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  if (typeof onLanguageChangeCallback === "function") {
    onLanguageChangeCallback(currentLang);
  }
}

function initI18n() {
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = btn.dataset.lang;
      if (selected && selected !== currentLang) {
        applyLanguage(selected);
      }
    });
  });

  applyLanguage(currentLang);
}

/* =========================================================
   Demo de Asistente Interactivo (Estilo App Móvil Moderna)
   ========================================================= */
function initChatDemo() {
  function getChatData(lang) {
    if (lang === "en") {
      return {
        welcome: "Hello! 👋 I'm the Veltrix AI Assistant. How can we help you today?",
        scripts: {
          catalogo: {
            label: "View catalog",
            answer: "Here are our core software development solutions:",
            card: `
              <div class="chat-card">
                <div class="chat-card__header">
                  <span class="chat-card__tag">Featured Solution</span>
                  <span class="chat-card__price">$350 USD/mo</span>
                </div>
                <div class="chat-card__body">
                  <div class="chat-card__icon"><i class="fa-solid fa-layer-group"></i></div>
                  <div class="chat-card__details">
                    <strong>SaaS Platform + App</strong>
                    <p>Scalable cloud full-stack development with AI integration.</p>
                  </div>
                </div>
                <div class="chat-card__actions">
                  <button type="button" class="chat-card__btn chat-card__btn--secondary" onclick="alert('Specs sent to your WhatsApp')">Specs</button>
                  <button type="button" class="chat-card__btn chat-card__btn--primary" onclick="window.location.href='#contacto'">Request</button>
                </div>
              </div>
            `,
          },
          pedido: {
            label: "Order status",
            answer: "I located your active project in our pipeline:",
            card: `
              <div class="chat-card">
                <div class="chat-card__header">
                  <span class="chat-card__tag chat-card__tag--active">Sprint 3 · In Progress</span>
                  <span class="chat-card__badge">#VL-8924</span>
                </div>
                <div class="chat-card__body">
                  <div class="chat-card__icon chat-card__icon--blue"><i class="fa-solid fa-code-commit"></i></div>
                  <div class="chat-card__details">
                    <strong>Payments & API Gateway</strong>
                    <p>Estimated deployment: Friday 4:00 PM (92% completed)</p>
                  </div>
                </div>
                <div class="chat-card__progress-bar">
                  <div class="chat-card__progress-fill" style="width: 92%;"></div>
                </div>
              </div>
            `,
          },
          cita: {
            label: "Book appointment",
            answer: "Available slots for an engineering discovery session:",
            card: `
              <div class="chat-card">
                <div class="chat-card__header">
                  <span class="chat-card__tag">30-min Video Call</span>
                  <span class="chat-card__badge"><i class="fa-regular fa-clock"></i> Zero cost</span>
                </div>
                <div class="chat-card__slots">
                  <button type="button" class="chat-card__slot">Tomorrow · 10:00 AM</button>
                  <button type="button" class="chat-card__slot active">Thursday · 3:30 PM</button>
                </div>
                <div class="chat-card__actions">
                  <a href="#contacto" class="chat-card__btn chat-card__btn--primary">Confirm slot</a>
                </div>
              </div>
            `,
          },
          persona: {
            label: "Talk to advisor",
            answer: "Connecting you directly with a senior engineer:",
            card: `
              <div class="chat-card">
                <div class="chat-card__body chat-card__body--agent">
                  <div class="chat-card__agent-avatar">HB</div>
                  <div class="chat-card__details">
                    <strong>Holman Berdugo</strong>
                    <p>Lead Engineer · Online now</p>
                  </div>
                </div>
                <div class="chat-card__actions">
                  <a href="#contacto" class="chat-card__btn chat-card__btn--whatsapp">
                    <i class="fa-brands fa-whatsapp"></i> Direct WhatsApp
                  </a>
                </div>
              </div>
            `,
          },
        },
      };
    }

    return {
      welcome: "¡Hola! 👋 Soy el asistente inteligente de Veltrix. ¿En qué podemos ayudarte hoy?",
      scripts: {
        catalogo: {
          label: "Ver catálogo",
          answer: "Aquí tienes nuestras soluciones principales para empresas y startups:",
          card: `
            <div class="chat-card">
              <div class="chat-card__header">
                <span class="chat-card__tag">Solución Destacada</span>
                <span class="chat-card__price">$350 USD/mes</span>
              </div>
              <div class="chat-card__body">
                <div class="chat-card__icon"><i class="fa-solid fa-layer-group"></i></div>
                <div class="chat-card__details">
                  <strong>Plataforma SaaS + App</strong>
                  <p>Desarrollo full-stack escalable en la nube con IA integrada.</p>
                </div>
              </div>
              <div class="chat-card__actions">
                <button type="button" class="chat-card__btn chat-card__btn--secondary" onclick="alert('Detalles enviados a tu WhatsApp')">Ver ficha</button>
                <button type="button" class="chat-card__btn chat-card__btn--primary" onclick="window.location.href='#contacto'">Solicitar</button>
              </div>
            </div>
          `,
        },
        pedido: {
          label: "Estado de mi pedido",
          answer: "Localicé tu proyecto activo en el sistema:",
          card: `
            <div class="chat-card">
              <div class="chat-card__header">
                <span class="chat-card__tag chat-card__tag--active">Sprint 3 · En Progreso</span>
                <span class="chat-card__badge">#VL-8924</span>
              </div>
              <div class="chat-card__body">
                <div class="chat-card__icon chat-card__icon--blue"><i class="fa-solid fa-code-commit"></i></div>
                <div class="chat-card__details">
                  <strong>Módulo de Pagos & API</strong>
                  <p>Despliegue estimado: Viernes 4:00 PM (92% completado)</p>
                </div>
              </div>
              <div class="chat-card__progress-bar">
                <div class="chat-card__progress-fill" style="width: 92%;"></div>
              </div>
            </div>
          `,
        },
        cita: {
          label: "Agendar una cita",
          answer: "Horarios disponibles para sesión de descubrimiento con el equipo de ingeniería:",
          card: `
            <div class="chat-card">
              <div class="chat-card__header">
                <span class="chat-card__tag">Videollamada 30 min</span>
                <span class="chat-card__badge"><i class="fa-regular fa-clock"></i> Sin costo</span>
              </div>
              <div class="chat-card__slots">
                <button type="button" class="chat-card__slot">Mañana · 10:00 AM</button>
                <button type="button" class="chat-card__slot active">Jueves · 3:30 PM</button>
              </div>
              <div class="chat-card__actions">
                <a href="#contacto" class="chat-card__btn chat-card__btn--primary">Confirmar horario</a>
              </div>
            </div>
          `,
        },
        persona: {
          label: "Hablar con un asesor",
          answer: "Te conectamos de inmediato con un especialista humano:",
          card: `
            <div class="chat-card">
              <div class="chat-card__body chat-card__body--agent">
                <div class="chat-card__agent-avatar">HB</div>
                <div class="chat-card__details">
                  <strong>Holman Berdugo</strong>
                  <p>Lead Engineer · En línea ahora</p>
                </div>
              </div>
              <div class="chat-card__actions">
                <a href="#contacto" class="chat-card__btn chat-card__btn--whatsapp">
                  <i class="fa-brands fa-whatsapp"></i> Abrir WhatsApp directo
                </a>
              </div>
            </div>
          `,
        },
      },
    };
  }

  let chatData = getChatData(currentLang);
  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");
  const replies = document.getElementById("replies");
  const form = document.getElementById("chat-input-form");
  const input = document.getElementById("chat-user-input");
  let busy = false;
  let timer = 0;

  function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight;
  }

  function addMessage(who, text, cardHtml = null) {
    const row = document.createElement("div");
    row.className = `bubble-row ${who}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (who === "bot") {
      row.innerHTML = `
        <div class="chat-avatar bot" aria-hidden="true">
          <img src="./img/veltrix-v.png" alt="Veltrix" />
        </div>
        <div class="bubble-content">
          <div class="bubble bot">
            <p>${text}</p>
            ${cardHtml || ""}
          </div>
          <span class="bubble-time">${timeStr}</span>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="bubble-content me">
          <div class="bubble me">
            <p>${text}</p>
          </div>
          <span class="bubble-time">${timeStr} · ${currentLang === "en" ? "Sent" : "Enviado"}</span>
        </div>
        <div class="chat-avatar me" aria-hidden="true">
          <i class="fa-solid fa-user"></i>
        </div>
      `;
    }

    chat.insertBefore(row, typing);
    scrollToBottom();

    const messages = chat.querySelectorAll(".bubble-row:not(.typing)");
    if (messages.length > 10) messages[0].remove();
  }

  function setBusy(value) {
    busy = value;
    typing.classList.toggle("show", value);
    if (replies) {
      replies
        .querySelectorAll(".qr[data-key]")
        .forEach((b) => (b.disabled = value));
    }
    if (input) input.disabled = value;
    scrollToBottom();
  }

  function handleAction(scriptKey, customText = null) {
    if (busy) return;
    const script = chatData.scripts[scriptKey];
    const userText = customText || (script ? script.label : "");
    if (!userText) return;

    addMessage("me", userText);
    setBusy(true);

    timer = setTimeout(() => {
      if (script) {
        addMessage("bot", script.answer, script.card);
      } else {
        const lower = userText.toLowerCase();
        let reply = currentLang === "en"
          ? "We build bespoke software platforms tailored to your business needs."
          : "Entiendo tu consulta. Desarrollamos soluciones a medida adaptadas a tus requerimientos.";
        if (lower.includes("price") || lower.includes("cost") || lower.includes("precio") || lower.includes("costo")) {
          reply = currentLang === "en"
            ? "Our projects are quoted based on specific scope. Request a free estimate in under 24 hours."
            : "Nuestros proyectos se cotizan según el alcance exacto. Puedes solicitar una estimación sin costo en menos de 24 horas.";
        } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("hola")) {
          reply = currentLang === "en"
            ? "Hello! Great to connect. Do you have a software or AI project in mind?"
            : "¡Hola! Un gusto saludarte. ¿Tienes una idea o proyecto de software en mente?";
        }
        addMessage("bot", reply);
      }
      setBusy(false);
    }, 950);
  }

  if (replies) {
    replies.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      if (button.id === "reset" || button.classList.contains("qr--reset")) {
        clearTimeout(timer);
        chat.querySelectorAll(".bubble-row:not(.typing)").forEach((b) => b.remove());
        setBusy(false);
        addMessage("bot", chatData.welcome);
        return;
      }

      const scriptKey = button.dataset.key;
      if (scriptKey && chatData.scripts[scriptKey]) {
        handleAction(scriptKey);
      }
    });
  }

  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val || busy) return;
      input.value = "";
      
      const lower = val.toLowerCase();
      let matchedKey = null;
      if (lower.includes("catálogo") || lower.includes("catalogo") || lower.includes("catalog") || lower.includes("product")) {
        matchedKey = "catalogo";
      } else if (lower.includes("pedido") || lower.includes("order") || lower.includes("status") || lower.includes("estado")) {
        matchedKey = "pedido";
      } else if (lower.includes("cita") || lower.includes("agendar") || lower.includes("book") || lower.includes("meeting")) {
        matchedKey = "cita";
      } else if (lower.includes("asesor") || lower.includes("persona") || lower.includes("agent") || lower.includes("human")) {
        matchedKey = "persona";
      }

      if (matchedKey) {
        handleAction(matchedKey, val);
      } else {
        handleAction(null, val);
      }
    });
  }

  // Hook al cambiar idioma para reiniciar chat en el nuevo idioma
  onLanguageChangeCallback = (newLang) => {
    chatData = getChatData(newLang);
    clearTimeout(timer);
    chat.querySelectorAll(".bubble-row:not(.typing)").forEach((b) => b.remove());
    setBusy(false);
    addMessage("bot", chatData.welcome);
  };

  addMessage("bot", chatData.welcome);
}

/* =========================================================
   Proyectos en movimiento
   ========================================================= */
function initProjects() {
  // Se duplica cada grupo para que la cinta avance sin cortes; la copia
  // queda oculta para lectores de pantalla.
  document.querySelectorAll(".projects-row__track").forEach((track) => {
    const group = track.querySelector(".projects-row__group");
    const originals = [...group.children];
    // En pantallas anchas se repiten las tarjetas hasta cubrir el ancho,
    // así nunca aparece un hueco al final de la vuelta.
    const minWidth = Math.max(window.innerWidth, screen.width || 0);
    while (group.scrollWidth < minWidth) {
      originals.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        group.appendChild(copy);
      });
    }
    const clone = group.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    track.appendChild(clone);
    track.classList.add("is-moving");
  });
}

/* =========================================================
   Preguntas frecuentes (botón flotante)
   ========================================================= */
function initFaq() {
  const openBtn = document.getElementById("faq-open");
  const footerOpenBtn = document.getElementById("faq-footer-open");
  const panel = document.getElementById("faq-panel");
  const closeBtn = document.getElementById("faq-close");
  const contact = document.getElementById("faq-contact");

  openBtn.addEventListener("click", () => panel.showModal());
  if (footerOpenBtn) {
    footerOpenBtn.addEventListener("click", () => panel.showModal());
  }
  closeBtn.addEventListener("click", () => panel.close());
  contact.addEventListener("click", () => panel.close());

  // Un clic fuera del panel (sobre el fondo) también lo cierra.
  panel.addEventListener("click", (e) => {
    if (e.target === panel) panel.close();
  });

  // Solo una pregunta abierta a la vez para que el panel no crezca de más.
  const items = [...panel.querySelectorAll(".faq__item")];
  items.forEach((item) =>
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    }),
  );
}

/* =========================================================
   Contacto por WhatsApp
   ========================================================= */
function initContactForm() {
  const form = document.getElementById("contact-form");
  const input = document.getElementById("idea");
  const note = document.getElementById("form-note");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const idea = input.value.trim();
    const message = idea
      ? `Hola Veltrix, quiero contarles sobre mi proyecto: ${idea}`
      : CONFIG.whatsapp.defaultMessage;
    const url = whatsappUrl(message);

    note.textContent = "";
    if (!url) {
      console.warn("Veltrix: falta CONFIG.whatsapp.number en js/main.js");
      note.textContent =
        "Nuestro WhatsApp estará disponible muy pronto. Inténtalo más tarde.";
      return;
    }

    window.open(url, "_blank", "noopener");

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "ábrelo aquí";
    note.append("Te llevamos a WhatsApp. Si no se abrió, ", link, ".");
    form.reset();
  });
}

/* =========================================================
   Footer
   ========================================================= */
function initFooter() {
  document.getElementById("year").textContent = String(
    new Date().getFullYear(),
  );

  const links = {
    ...CONFIG.social,
    whatsapp: whatsappUrl(CONFIG.whatsapp.defaultMessage),
  };
  document.querySelectorAll("[data-social]").forEach((a) => {
    const url = links[a.dataset.social];
    if (!url) return;
    a.href = url;
    a.hidden = false;
  });
}

/* =========================================================
   Inicio
   ========================================================= */
initI18n();
initStarfield();
initReveal();
initScrollEffects();
initMobileMenu();
initCardGlow();
initLogoTilt();
initChatDemo();
initProjects();
initFaq();
initContactForm();
initFooter();

/* =========================================================
   Anti-selección global (evita resaltados azules accidentales)
   ========================================================= */
document.addEventListener("selectstart", (e) => {
  const tag = e.target.tagName;
  if (tag !== "INPUT" && tag !== "TEXTAREA" && !e.target.isContentEditable) {
    e.preventDefault();
  }
});
