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
  const orbs = document.querySelectorAll("[data-parallax]");
  let ticking = false;

  function update() {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = `scaleX(${progress})`;

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
   Demo de WhatsApp
   ========================================================= */
function initChatDemo() {
  const SCRIPTS = {
    catalogo: {
      label: "Ver catálogo",
      answer:
        "Con gusto. Estas son nuestras categorías:\n• Ropa\n• Calzado\n• Accesorios\n¿Qué estás buscando hoy?",
    },
    pedido: {
      label: "Estado de mi pedido",
      answer:
        "Ya lo revisé: tu pedido salió y te enviaremos la confirmación por correo apenas llegue.",
    },
    cita: {
      label: "Agendar una cita",
      answer:
        "Perfecto. Tengo libre mañana a las 10:00 a. m. o el jueves a las 3:00 p. m. ¿Cuál prefieres?",
    },
    persona: {
      label: "Hablar con una persona",
      answer:
        "Listo, ya avisé al equipo. Una persona te escribirá por este mismo chat.",
    },
  };
  const WELCOME =
    "Hola, soy el asistente de tu negocio. ¿En qué te puedo ayudar?";
  const MAX_BUBBLES = 8;

  const chat = document.getElementById("chat");
  const typing = document.getElementById("typing");
  const replies = document.getElementById("replies");
  let busy = false;
  let timer = 0;

  function addBubble(who, text) {
    const bubble = document.createElement("div");
    bubble.className = `bubble ${who}`;
    bubble.textContent = text;
    chat.insertBefore(bubble, typing);
    const bubbles = chat.querySelectorAll(".bubble:not(.typing)");
    if (bubbles.length > MAX_BUBBLES) bubbles[0].remove();
  }

  function setBusy(value) {
    busy = value;
    typing.classList.toggle("show", value);
    replies
      .querySelectorAll(".qr[data-key]")
      .forEach((b) => (b.disabled = value));
  }

  replies.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;

    if (button.id === "reset") {
      clearTimeout(timer);
      chat.querySelectorAll(".bubble:not(.typing)").forEach((b) => b.remove());
      setBusy(false);
      addBubble("bot", WELCOME);
      return;
    }

    const script = SCRIPTS[button.dataset.key];
    if (busy || !script) return;
    addBubble("me", script.label);
    setBusy(true);
    timer = setTimeout(() => {
      addBubble("bot", script.answer);
      setBusy(false);
    }, 1100);
  });

  addBubble("bot", WELCOME);
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
  const panel = document.getElementById("faq-panel");
  const closeBtn = document.getElementById("faq-close");
  const contact = document.getElementById("faq-contact");

  openBtn.addEventListener("click", () => panel.showModal());
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
