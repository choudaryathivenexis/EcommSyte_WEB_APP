/* =========================================================
   ECOMMSYTE — Strategy-Driven Amazon Growth
   Vanilla JS: preloader, nav, scroll progress, reveals,
   3D tilt, magnetic buttons, parallax, counters, forms.
   ========================================================= */

/* =========================================================
   PRELOADER — animate counter, reveal on load, safe fallback
   ========================================================= */
(function () {
  "use strict";
  const pre = document.getElementById("preloader");
  const body = document.body;
  if (!pre) { body.classList.remove("is-loading"); return; }

  const fill = document.getElementById("preloaderFill");
  const pctEl = document.getElementById("preloaderPct");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minDur = reduce ? 400 : 1200;
  const start = performance.now();
  let progress = 0, done = false, rafId = null;

  function paint(v) {
    const s = Math.round(v);
    if (fill) fill.style.width = s + "%";
    if (pctEl) pctEl.textContent = s;
  }

  function tick(now) {
    // Ease toward 90% over minDur; final 10% reserved for actual load.
    const target = Math.min(90, ((now - start) / minDur) * 90);
    progress += (target - progress) * 0.14;
    paint(progress);
    if (!done) rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  function finish() {
    if (done) return;
    done = true;
    if (rafId) cancelAnimationFrame(rafId);
    paint(100);
    setTimeout(() => {
      pre.classList.add("hide");
      body.classList.remove("is-loading");
      setTimeout(() => pre.remove(), 950);
    }, reduce ? 120 : 300);
  }

  function ready() {
    const elapsed = performance.now() - start;
    setTimeout(finish, Math.max(0, minDur - elapsed));
  }

  if (document.readyState === "complete") ready();
  else window.addEventListener("load", ready);
  // Hard fallback so the site is never blocked by the preloader.
  setTimeout(finish, 4500);
})();

(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---- Current year ---- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =======================================================
     NAV: scrolled state, scroll progress, mobile menu
     ======================================================= */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");

  // Backdrop for mobile menu
  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    navLinks.classList.remove("open");
    navToggle.classList.remove("active");
    backdrop.classList.remove("show");
    if (nav) nav.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function openMenu() {
    navLinks.classList.add("open");
    navToggle.classList.add("active");
    backdrop.classList.add("show");
    if (nav) nav.classList.add("menu-open"); // drops the nav backdrop-filter so the fixed drawer isn't clipped
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  if (navToggle && navLinks) {
    // Explicit close (X) button inside the drawer
    const navClose = document.createElement("button");
    navClose.type = "button";
    navClose.className = "nav__close";
    navClose.setAttribute("aria-label", "Close menu");
    navClose.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.71 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.3-6.3z"/></svg>';
    navClose.addEventListener("click", closeMenu);
    navLinks.insertBefore(navClose, navLinks.firstChild);

    navToggle.addEventListener("click", () =>
      navLinks.classList.contains("open") ? closeMenu() : openMenu()
    );
    backdrop.addEventListener("click", closeMenu);
    $$(".nav__link, .nav__cta", navLinks).forEach((a) =>
      a.addEventListener("click", closeMenu)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navLinks.classList.contains("open")) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* =======================================================
     SCROLL REVEAL (Intersection Observer)
     ======================================================= */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* =======================================================
     ANIMATED COUNTERS
     ======================================================= */
  const counters = $$(".rcard[data-count]");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const cio = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cio.observe(c));
  } else {
    counters.forEach((c) => {
      const numEl = $(".rcard__num", c);
      if (numEl) numEl.textContent = (c.dataset.prefix || "") + c.dataset.count + (c.dataset.suffix || "");
    });
  }
  function animateCount(card) {
    const target = parseInt(card.dataset.count, 10) || 0;
    const suffix = card.dataset.suffix || "";
    const prefix = card.dataset.prefix || "";
    const numEl = $(".rcard__num", card);
    if (!numEl) return;
    const dur = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      numEl.textContent = prefix + Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* =======================================================
     3D TILT on cards (desktop, non-reduced)
     ======================================================= */
  if (!isTouch && !prefersReduced) {
    $$(".tilt").forEach((card) => {
      let raf = null;
      const strength = card.classList.contains("dash") ? 6 : 9;
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          // dashboard keeps a base isometric angle; cards tilt from flat
          const baseY = card.classList.contains("dash") ? -12 : 0;
          card.style.transform =
            `perspective(900px) rotateX(${(-py * strength).toFixed(2)}deg) ` +
            `rotateY(${(px * strength + baseY).toFixed(2)}deg) translateY(-4px)`;
        });
      });
      card.addEventListener("mouseleave", () => {
        if (raf) cancelAnimationFrame(raf);
        card.style.transform = "";
      });
    });
  }

  /* =======================================================
     MAGNETIC BUTTONS (desktop, non-reduced)
     ======================================================= */
  if (!isTouch && !prefersReduced) {
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* =======================================================
     PARALLAX orbs (hero / page-hero)
     ======================================================= */
  const parallaxEls = $$(".parallax");
  if (parallaxEls.length && !prefersReduced && !isTouch) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          parallaxEls.forEach((el) => {
            const d = parseFloat(el.dataset.depth) || 0.15;
            el.style.transform = `translate3d(0, ${(y * d).toFixed(1)}px, 0)`;
          });
          ticking = false;
        });
      },
      { passive: true }
    );
  }

  /* Hero scene subtle pointer rotation */
  const scene = $("#heroScene");
  if (scene && !isTouch && !prefersReduced) {
    const hero = $(".hero");
    hero.addEventListener("mousemove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      scene.style.transform = `rotateY(${px * 6}deg) rotateX(${-py * 5}deg)`;
    });
    hero.addEventListener("mouseleave", () => {
      scene.style.transform = "";
    });
  }

  /* =======================================================
     FORM HANDLING (validation + Formspree AJAX)
     ======================================================= */
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateField(field) {
    const input = $("input, select, textarea", field);
    if (!input || !input.hasAttribute("required")) {
      // still validate optional email if present & filled
      if (input && input.type === "email" && input.value.trim() && !emailRe.test(input.value.trim())) {
        field.classList.add("invalid");
        return false;
      }
      field.classList.remove("invalid");
      return true;
    }
    let ok = input.value.trim() !== "";
    if (ok && input.type === "email") ok = emailRe.test(input.value.trim());
    field.classList.toggle("invalid", !ok);
    return ok;
  }

  /* Per-form success copy (contextual, on-brand) */
  const THANKS = {
    newsletterForm: { title: "You’re in!", text: "Welcome to The Growth Memo — one sharp email a month, zero fluff. Watch your inbox to confirm your subscription.", dark: true, again: false },
    bookingForm: { title: "Request received.", text: "Thanks — your strategy-call request just landed with our team. We’ll reply within one business day to lock in a time.", again: true },
    ctaModalForm: { title: "Request received.", text: "Thanks — we’ve got your details. Our team will reach out within one business day to set up your call.", again: true },
    contactForm: { title: "Message received.", text: "Thanks for reaching out. We’ll get back to you within one business day — keep an eye on your inbox.", again: true },
  };

  /* Replace the form with a premium animated thank-you state */
  function showThanks(form) {
    const cfg = THANKS[form.id] || { title: "Thank you!", text: "Your message is in. We’ll be in touch within one business day.", again: true };
    form.reset();
    const node = document.createElement("div");
    node.className = "form-thanks" + (cfg.dark ? " form-thanks--on-dark" : "");
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    node.tabIndex = -1;
    node.innerHTML =
      '<span class="form-thanks__mark" aria-hidden="true"><svg viewBox="0 0 60 60">' +
      '<circle class="ft-circle" cx="30" cy="30" r="25"/>' +
      '<path class="ft-check" d="M18.5 31 L26 38.5 L42 21"/></svg></span>' +
      '<h3>' + cfg.title + '</h3><p>' + cfg.text + '</p>' +
      (cfg.again ? '<button type="button" class="btn btn--ghost btn--dark form-thanks__again">Send another</button>' : '');
    form.appendChild(node);
    form.classList.add("form--done");
    const again = node.querySelector(".form-thanks__again");
    if (again) {
      again.addEventListener("click", function () {
        form.classList.remove("form--done");
        node.remove();
        const first = form.querySelector("input:not([type=hidden]):not([name=_gotcha]), select, textarea");
        if (first) first.focus();
      });
    }
    if (node.focus) node.focus();
  }

  function setupForm(form) {
    if (!form) return;
    const status = $(".form__status", form);
    const submitBtn = $("button[type=submit]", form);
    const fields = $$(".field", form);

    // Live-clear errors while typing
    fields.forEach((f) => {
      const input = $("input, select, textarea", f);
      if (!input) return;
      input.addEventListener("input", () => {
        if (f.classList.contains("invalid")) validateField(f);
      });
      input.addEventListener("blur", () => validateField(f));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      fields.forEach((f) => {
        if (!validateField(f)) valid = false;
      });
      if (!valid) {
        status.textContent = "Please fix the highlighted fields.";
        status.className = "form__status error";
        const firstBad = $(".field.invalid input, .field.invalid select, .field.invalid textarea", form);
        if (firstBad) firstBad.focus();
        return;
      }

      // Guard: unconfigured Formspree endpoint
      if (form.action.includes("YOUR_")) {
        status.textContent = "Form not configured yet — add your Formspree ID in the code.";
        status.className = "form__status error";
        return;
      }

      submitBtn.classList.add("is-loading");
      status.textContent = "";
      status.className = "form__status";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          status.textContent = "";
          status.className = "form__status";
          showThanks(form);
        } else {
          const data = await res.json().catch(() => ({}));
          status.textContent =
            data && data.errors ? data.errors.map((x) => x.message).join(", ")
                                 : "Something went wrong. Please try again.";
          status.className = "form__status error";
        }
      } catch (err) {
        status.textContent = "Network error. Please check your connection and try again.";
        status.className = "form__status error";
      } finally {
        submitBtn.classList.remove("is-loading");
      }
    });
  }

  setupForm($("#bookingForm"));
  setupForm($("#contactForm"));
  setupForm($("#newsletterForm"));

  /* =======================================================
     CTA MODAL — premium popup contact form (site-wide)
     Any element with .js-open-modal, or any link to #book,
     opens a detailed contact form pre-filled with context.
     ======================================================= */
  (function initModal() {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "ctaModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = [
      '<div class="modal__overlay" data-close></div>',
      '<div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ctaModalTitle">',
      '  <div class="modal__head">',
      '    <button class="modal__close" type="button" data-close aria-label="Close dialog">',
      '      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.71 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.3-6.3z"/></svg>',
      '    </button>',
      '    <span class="eyebrow eyebrow--light">Let’s talk growth</span>',
      '    <h3 id="ctaModalTitle">Book your free strategy call</h3>',
      '    <p class="modal__ctx">You’re enquiring about: <strong id="ctaModalService">Full-Service Growth</strong></p>',
      '  </div>',
      '  <form class="modal__form" id="ctaModalForm" action="https://formspree.io/f/xaqrqpwa" method="POST" novalidate>',
      '    <input type="hidden" name="_subject" value="New strategy-call request — ecommsyte" />',
      '    <input type="hidden" name="form" value="CTA Modal Booking" />',
      '    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="display:none" />',
      '    <input type="hidden" name="interest" id="ctaModalInterest" value="Free Strategy Call" />',
      '    <div class="field--split">',
      '      <div class="field"><label for="m-name">Full name</label><input type="text" id="m-name" name="name" placeholder="Your name" required autocomplete="name" /><small class="field__error">Please enter your name.</small></div>',
      '      <div class="field"><label for="m-email">Work email</label><input type="email" id="m-email" name="email" placeholder="you@brand.com" required autocomplete="email" /><small class="field__error">Please enter a valid email.</small></div>',
      '    </div>',
      '    <div class="field--split">',
      '      <div class="field"><label for="m-store">Brand / store</label><input type="text" id="m-store" name="store" placeholder="Brand name" autocomplete="organization" /></div>',
      '      <div class="field"><label for="m-revenue">Monthly revenue</label><select id="m-revenue" name="revenue"><option value="" disabled selected>Select range</option><option>Pre-launch</option><option>Under $10k</option><option>$10k – $50k</option><option>$50k – $250k</option><option>$250k+</option></select></div>',
      '    </div>',
      '    <div class="field"><label for="m-service">Service of interest</label><select id="m-service" name="service" required>',
      '      <option value="" disabled selected>Select a service</option>',
      '      <option>Product Launch Strategy</option><option>Product Research Analysis</option><option>Sourcing &amp; Logistics Solutions</option><option>Listing Optimization</option><option>Creative Design Solutions</option><option>PPC Account Management</option><option>Account Health Support</option><option>Multichannel Integration</option><option>Full-Service Growth</option><option>Free Account Audit</option>',
      '    </select><small class="field__error">Please choose a service.</small></div>',
      '    <div class="field"><label for="m-msg">Tell us about your goals (optional)</label><textarea id="m-msg" name="message" rows="3" placeholder="What would you like to improve or scale?"></textarea></div>',
      '    <button type="submit" class="btn btn--primary btn--block magnetic"><span class="btn__label">Send &amp; Book My Call</span><span class="btn__spinner" aria-hidden="true"></span></button>',
      '    <p class="form__status" role="status" aria-live="polite"></p>',
      '    <p class="modal__fine"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg> Your details stay private. We reply within one business day.</p>',
      '  </form>',
      '</div>'
    ].join("");
    document.body.appendChild(modal);

    const dialog = $(".modal__dialog", modal);
    const serviceLabel = $("#ctaModalService", modal);
    const interestInput = $("#ctaModalInterest", modal);
    const serviceSelect = $("#m-service", modal);
    const form = $("#ctaModalForm", modal);
    const firstField = $("#m-name", modal);
    let lastFocused = null;

    setupForm(form);

    function setSelect(val) {
      if (!val) return;
      const match = Array.from(serviceSelect.options).find((o) => o.value === val || o.textContent === val);
      if (match) serviceSelect.value = match.value;
    }

    function open(trigger) {
      const cta = trigger.getAttribute("data-cta");
      const svc = trigger.getAttribute("data-service");
      const label = cta || svc || "Full-Service Growth";
      serviceLabel.textContent = label;
      interestInput.value = label;
      setSelect(svc || cta || "Full-Service Growth");
      lastFocused = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      setTimeout(() => { if (firstField) firstField.focus(); }, 80);
    }
    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    $$("[data-close]", modal).forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Header CTA (.nav__cta) opens the Calendly popup instead — see the Calendly IIFE below.
    $$('.js-open-modal, a[href$="#book"]:not(.nav__cta)').forEach((t) => {
      t.addEventListener("click", (e) => { e.preventDefault(); open(t); });
    });
  })();

  /* =======================================================
     FAQ — close siblings for a tidy accordion feel
     ======================================================= */
  $$(".faq").forEach((wrap) => {
    $$(".faq__item", wrap).forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        $$(".faq__item[open]", wrap).forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });
})();

/* =========================================================
   SOCIAL SIDEBAR TRAY — premium fixed rail (site-wide)
   Injected once so every page shares it.
   ========================================================= */
(function () {
  "use strict";
  if (document.querySelector(".social-tray")) return;

  const ICONS = {
    linkedin: '<circle cx="49.5" cy="41.5" r="8.5"/><rect x="41" y="56.5" width="17" height="59"/><path d="M68.5 56.5 H85 V64.8 H85.25 C87.65 60.25 93.45 55.5 102.3 55.5 C119.45 55.5 123.5 66.75 123.5 83.15 V115.5 H106.5 V87.1 C106.5 79.85 106.35 72.1 97.35 72.1 C88.2 72.1 85.5 79.25 85.5 86.85 V115.5 H68.5 Z"/>',
    facebook: '<path d="M13 22v-8h2.7l.4-3H13V9c0-.9.25-1.5 1.5-1.5H16V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H7v3h2.6v8H13z"/>',
    whatsapp: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.208-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.693.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.9 6.994c-.003 5.45-4.437 9.884-9.892 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>',
    email: '<path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13zm2.2.5 7.8 5.4L19.8 6H4.2zM20 7.7l-7.4 5.1a1 1 0 0 1-1.2 0L4 7.7V18h16V7.7z"/>',
  };

  const VIEWBOX = { linkedin: "34 26 96 96" }; // others default to 0 0 24 24

  const LINKS = [
    { brand: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/ecommsyte/", ext: true },
    { brand: "facebook", label: "Facebook", href: "https://www.facebook.com/ecommsyte/", ext: true },
    { brand: "whatsapp", label: "WhatsApp", href: "https://wa.me/+923288090606", ext: true },
    { brand: "email", label: "Email us", href: "mailto:ecomsyte@gmail.com", ext: false },
  ];

  const tray = document.createElement("aside");
  tray.className = "social-tray";
  tray.setAttribute("aria-label", "Social media");
  tray.innerHTML = LINKS.map((l, i) => {
    const rel = l.ext ? ' target="_blank" rel="noopener"' : "";
    const div = i > 0 ? '<span class="social-tray__divider" aria-hidden="true"></span>' : "";
    return (
      div +
      `<a class="social-tray__link" data-brand="${l.brand}" href="${l.href}"${rel} aria-label="${l.label}">` +
      `<svg viewBox="${VIEWBOX[l.brand] || "0 0 24 24"}" aria-hidden="true">${ICONS[l.brand]}</svg>` +
      `<span class="social-tray__label">${l.label}</span></a>`
    );
  }).join("");

  document.body.appendChild(tray);
})();

/* =========================================================
   BLOG POST — table-of-contents scrollspy + copy-link
   Guarded so it no-ops on non-article pages.
   ========================================================= */
(function () {
  "use strict";

  // Copy-link buttons
  Array.prototype.forEach.call(document.querySelectorAll(".js-copy-link"), function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-url") || window.location.href;
      var note = btn.parentNode.querySelector(".post__copied");
      var flash = function () {
        if (!note) return;
        note.classList.add("show");
        setTimeout(function () { note.classList.remove("show"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(flash, flash);
      } else {
        flash();
      }
    });
  });

  // TOC scrollspy
  var toc = document.querySelector(".post__toc");
  if (!toc || !("IntersectionObserver" in window)) return;
  var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
  var map = {};
  links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var heads = Array.prototype.slice.call(document.querySelectorAll(".post__body h2[id]"));
  if (!heads.length) return;

  var current = null;
  function setCurrent(id) {
    if (current === id) return;
    current = id;
    links.forEach(function (a) { a.classList.remove("is-current"); });
    if (map[id]) map[id].classList.add("is-current");
  }

  var io = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (e) { return e.isIntersecting; });
    if (visible.length) {
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setCurrent(visible[0].target.id);
    }
  }, { rootMargin: "-90px 0px -68% 0px", threshold: 0 });

  heads.forEach(function (h) { io.observe(h); });
  setCurrent(heads[0].id);
})();

/* =========================================================
   Stat counters — smooth count-up on scroll into view
   (hero highlights + About stats; supports prefix/suffix)
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = [];

  // About stats — explicit data-count (+ optional prefix/suffix)
  Array.prototype.forEach.call(document.querySelectorAll(".astat__count[data-count]"), function (el) {
    items.push({ el: el, pre: el.getAttribute("data-prefix") || "", target: parseInt(el.getAttribute("data-count"), 10) || 0, suf: el.getAttribute("data-suffix") || "" });
  });
  // Hero highlights — parsed from the existing text so markup/styling is untouched ($40M+, 120+, 96%)
  Array.prototype.forEach.call(document.querySelectorAll(".hero__trust strong"), function (el) {
    var m = /^(\D*?)([\d,]+)(\D*)$/.exec((el.textContent || "").trim());
    if (m) items.push({ el: el, pre: m[1], target: parseInt(m[2].replace(/,/g, ""), 10) || 0, suf: m[3] });
  });
  if (!items.length) return;

  function itemFor(el) { for (var i = 0; i < items.length; i++) if (items[i].el === el) return items[i]; }
  function fmt(it, v) { return it.pre + v + it.suf; }
  function run(it) {
    if (!it) return;
    if (reduce || !("requestAnimationFrame" in window)) { it.el.textContent = fmt(it, it.target); return; }
    var dur = 1700, start = null;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      it.el.textContent = fmt(it, Math.round(eased * it.target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(itemFor(e.target)); obs.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    items.forEach(function (it) { io.observe(it.el); });
  } else {
    items.forEach(run);
  }
})();

/* =========================================================
   CASE STUDIES — tabbed switching (accessible)
   ========================================================= */
(function () {
  "use strict";
  var tablist = document.querySelector(".cs-tabs");
  if (!tablist) return;
  var tabs = Array.prototype.slice.call(tablist.querySelectorAll(".cs-tab"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".cs-panel"));
  if (!tabs.length) return;

  function activate(idx, focus) {
    tabs.forEach(function (t, i) {
      var on = i === idx;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p, i) { p.classList.toggle("is-active", i === idx); });
    if (focus && tabs[idx]) tabs[idx].focus();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { activate(i); });
    t.addEventListener("keydown", function (e) {
      var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (dir) { e.preventDefault(); activate((i + dir + tabs.length) % tabs.length, true); }
      else if (e.key === "Home") { e.preventDefault(); activate(0, true); }
      else if (e.key === "End") { e.preventDefault(); activate(tabs.length - 1, true); }
    });
  });
})();

/* =========================================================
   HEADER CTA — Calendly "book a call" popup (premium, on-theme)
   Only the nav CTA (.nav__cta) opens it; other #book links keep
   the existing contact modal. Calendly loads lazily on first open.
   ========================================================= */
(function () {
  "use strict";
  var triggers = Array.prototype.slice.call(document.querySelectorAll(".nav__cta"));
  if (!triggers.length) return;

  // Brand-themed Calendly embed (colors match the site palette)
  var CAL_URL = "https://calendly.com/mailhussainali00/30min"
    + "?hide_gdpr_banner=1&background_color=fcfaf7&text_color=1d1e20&primary_color=e6862d";

  var modal = document.createElement("div");
  modal.className = "cal-modal";
  modal.id = "calModal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = [
    '<div class="cal-modal__overlay" data-cal-close></div>',
    '<div class="cal-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="calModalTitle">',
    '  <div class="cal-modal__head">',
    '    <button class="cal-modal__close" type="button" data-cal-close aria-label="Close scheduler">',
    '      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42L10.59 13.4 4.3 19.71 2.88 18.3 9.17 12 2.88 5.71 4.3 4.29l6.29 6.3 6.3-6.3z"/></svg>',
    '    </button>',
    '    <span class="eyebrow eyebrow--light">Let’s talk growth</span>',
    '    <h3 id="calModalTitle">Book your free strategy call</h3>',
    '    <p class="cal-modal__ctx">Pick a time that works — a focused 30 minutes, no obligation.</p>',
    '  </div>',
    '  <div class="cal-modal__body">',
    '    <div class="cal-modal__loader" aria-hidden="true"><span class="cal-modal__spinner"></span> Loading your calendar…</div>',
    '    <div class="cal-inline" id="calInline"></div>',
    '  </div>',
    '</div>'
  ].join("");
  document.body.appendChild(modal);

  var dialog = modal.querySelector(".cal-modal__dialog");
  var closeBtn = modal.querySelector(".cal-modal__close");
  var loader = modal.querySelector(".cal-modal__loader");
  var inlineEl = modal.querySelector("#calInline");
  var lastFocused = null;
  var inited = false, loading = false;

  function loadCalendly(cb) {
    if (window.Calendly) { cb(); return; }
    if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }
    var existing = document.querySelector('script[src*="calendly.com/assets/external/widget.js"]');
    if (existing) { existing.addEventListener("load", cb); return; }
    var s = document.createElement("script");
    s.src = "https://assets.calendly.com/assets/external/widget.js";
    s.async = true;
    s.onload = cb;
    s.onerror = function () {
      loader.innerHTML = 'Couldn’t load the scheduler. <a href="' + CAL_URL + '" target="_blank" rel="noopener">Open Calendly in a new tab</a>.';
    };
    document.head.appendChild(s);
  }

  function initWidget() {
    if (inited || loading) return;
    loading = true;
    loadCalendly(function () {
      if (window.Calendly && !inited) {
        window.Calendly.initInlineWidget({ url: CAL_URL, parentElement: inlineEl });
        inited = true;
        // Calendly signals ready via postMessage; hide loader shortly after init.
        setTimeout(function () { modal.classList.add("cal-ready"); }, 900);
      }
      loading = false;
    });
  }

  function open() {
    lastFocused = document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    initWidget();
    setTimeout(function () { closeBtn.focus(); }, 60);
  }
  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  triggers.forEach(function (t) {
    t.addEventListener("click", function (e) { e.preventDefault(); open(); });
  });
  Array.prototype.forEach.call(modal.querySelectorAll("[data-cal-close]"), function (el) {
    el.addEventListener("click", close);
  });
  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key === "Tab") {
      // Simple trap between the close button and the dialog (Calendly iframe manages its own focus).
      var f = dialog.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();

/* =========================================================
   FROM THE BLOG — scoped reveal (IntersectionObserver)
   No-JS / reduced-motion safe: elements stay visible unless
   we can actually animate them.
   ========================================================= */
(function () {
  "use strict";
  var items = document.querySelectorAll(".blogx-fx");
  if (!items.length) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // leave content shown
  items.forEach(function (el) { el.classList.add("is-armed"); });
  var io = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.style.transitionDelay = (Number(el.dataset.fx || 0) * 70) + "ms";
      el.classList.add("is-in");
      obs.unobserve(el);
    });
  }, { threshold: 0.15 });
  items.forEach(function (el) { io.observe(el); });
})();


/* =========================================================
   HERO TYPEWRITER
   Cycles the headline's accent phrase with a blinking caret.
   Humanised cadence (slight per-keystroke jitter), pauses on the
   finished phrase, then backspaces. Fully skipped when the user
   prefers reduced motion — the first phrase simply stays put.
   ========================================================= */
(function () {
  "use strict";
  var wrap = document.querySelector(".hero__type");
  if (!wrap) return;
  var out = wrap.querySelector(".hero__type-out");
  var words = (wrap.getAttribute("data-words") || "").split("|").filter(Boolean);
  if (!out || words.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var TYPE = 62, DEL = 30, HOLD = 2000, GAP = 420, START = 2400;
  var i = 0, j = words[0].length, deleting = true, timer = null;

  function tick() {
    var word = words[i];
    if (deleting) {
      j--;
      if (j <= 0) { deleting = false; i = (i + 1) % words.length; out.textContent = ""; timer = setTimeout(tick, GAP); return; }
    } else {
      j++;
      if (j >= word.length) { out.textContent = word; deleting = true; timer = setTimeout(tick, HOLD); return; }
    }
    out.textContent = word.slice(0, j);
    timer = setTimeout(tick, deleting ? DEL : TYPE + Math.random() * 55);
  }

  wrap.classList.add("is-typing");
  timer = setTimeout(tick, START);

  // Pause while the tab is hidden so it never runs a burst on return.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { clearTimeout(timer); }
    else { clearTimeout(timer); timer = setTimeout(tick, GAP); }
  });
})();
