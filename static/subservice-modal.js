/* =============================================================================
   ecommsyte — Sub-service detail modal (services page)

   Clicking a sub-service card's CTA opens a premium split dialog: artwork on one
   side, the full service breakdown on the other. Its own CTA hands off to the
   existing enquiry form modal via a hidden proxy trigger (#ssProxyCta), which is
   in the page markup so script.js binds it on load like any other .js-open-modal.

   Content lives in static/sub-services.js (window.SUBSERVICES).
   ============================================================================= */
(function () {
  "use strict";

  var triggers = Array.prototype.slice.call(document.querySelectorAll(".subcard__cta"));
  if (!triggers.length) return;

  var DATA = window.SUBSERVICES || null;
  var proxy = document.getElementById("ssProxyCta");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function slug(name) {
    return String(name || "")
      .replace(/&amp;/g, "and").replace(/&/g, "and").replace(/\+/g, " ")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  /* ---- Build the dialog once ---------------------------------------------- */
  var modal = document.createElement("div");
  modal.className = "ssm";
  modal.id = "ssModal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = [
    '<div class="ssm__overlay" data-ssm-close></div>',
    '<div class="ssm__dialog" role="dialog" aria-modal="true" aria-labelledby="ssmTitle">',
    '  <button class="ssm__close" type="button" data-ssm-close aria-label="Close">',
    '    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    '  </button>',
    '  <div class="ssm__media"><img class="ssm__img" id="ssmImg" src="" alt="" /></div>',
    '  <div class="ssm__body">',
    '    <p class="ssm__eyebrow" id="ssmService"></p>',
    '    <h2 class="ssm__title" id="ssmTitle"></h2>',
    '    <span class="ssm__rule" aria-hidden="true"></span>',
    '    <p class="ssm__short" id="ssmShort"></p>',
    '    <p class="ssm__detail" id="ssmDetail"></p>',
    '    <div class="ssm__blocks" id="ssmBlocks"></div>',
    '    <div class="ssm__actions">',
    '      <button type="button" class="ssm__cta" id="ssmCta">',
    '        <span id="ssmCtaLabel">Get this service</span>',
    '        <svg class="ssm__cta-arrow" viewBox="0 0 22 16" aria-hidden="true" focusable="false">',
    '          <path class="ssm__cta-shaft" d="M1 8h14" />',
    '          <path class="ssm__cta-head" d="M13.5 1.5 20 8l-6.5 6.5" />',
    '        </svg>',
    '      </button>',
    '      <p class="ssm__note">Free consultation &middot; No obligation</p>',
    '    </div>',
    '  </div>',
    '</div>',
  ].join("");
  document.body.appendChild(modal);

  var dialog = modal.querySelector(".ssm__dialog");
  var body = modal.querySelector(".ssm__body");
  var el = {
    img: modal.querySelector("#ssmImg"),
    service: modal.querySelector("#ssmService"),
    title: modal.querySelector("#ssmTitle"),
    short: modal.querySelector("#ssmShort"),
    detail: modal.querySelector("#ssmDetail"),
    blocks: modal.querySelector("#ssmBlocks"),
    cta: modal.querySelector("#ssmCta"),
  };
  var lastFocused = null;
  var current = null;

  function block(label, items) {
    if (!items || !items.length) return "";
    return (
      '<section class="ssm__block">' +
      '<h3 class="ssm__block-title">' + esc(label) + "</h3>" +
      '<ul class="ssm__list">' +
      items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") +
      "</ul></section>"
    );
  }

  function fill(d) {
    current = d;
    if (d.image) { el.img.src = d.image; el.img.alt = ""; }
    el.service.textContent = d.service || "Our services";
    el.title.textContent = d.title;
    el.short.textContent = d.short || "";
    el.detail.textContent = d.detail || "";
    el.detail.hidden = !d.detail;
    el.blocks.innerHTML =
      block("What we do", d.do) + block("Methods used", d.methods) + block("Deliverables", d.deliver);
  }

  function open(d, trigger) {
    fill(d);
    lastFocused = trigger || document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (body) body.scrollTop = 0;
    setTimeout(function () { el.cta.focus({ preventScroll: true }); }, 90);
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  Array.prototype.forEach.call(modal.querySelectorAll("[data-ssm-close]"), function (n) {
    n.addEventListener("click", close);
  });

  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    var f = dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- Hand off to the existing enquiry form ------------------------------ */
  el.cta.addEventListener("click", function () {
    if (!current) return;
    close();
    if (!proxy) return;                       // no proxy → the card CTA still works as a link elsewhere
    proxy.setAttribute("data-cta", current.title);
    proxy.setAttribute("data-service", current.service || current.title);
    setTimeout(function () { proxy.click(); }, 180);   // let this dialog finish closing first
  });

  /* ---- Wire the cards ------------------------------------------------------ */
  triggers.forEach(function (t) {
    t.addEventListener("click", function (e) {
      var key = slug(t.getAttribute("data-cta"));
      var d = DATA && DATA[key];
      if (!d) return;                          // no content → leave the default behaviour alone
      e.preventDefault();
      e.stopPropagation();
      open(d, t);
    });
  });
})();
