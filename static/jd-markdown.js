/* =============================================================================
   ecommsyte — JD Markdown  (shared by the careers page and the /admin portal)
   A small, SAFE Markdown -> HTML renderer for premium job descriptions.

   Security: input is HTML-escaped FIRST, then a controlled subset of Markdown is
   turned into a fixed set of tags. Raw HTML in the source can never reach the DOM,
   so admin-authored JDs cannot inject markup. Supports:
     # / ## / ###  headings · **bold** / __bold__ · *italic* / _italic_ ·
     - / * / +  bullets · 1. / 1)  numbered lists · > blockquotes · --- rule ·
     `code` · [text](url)  links (safe schemes only) · paragraphs & line breaks.
   Exposes window.JDMarkdown = { render(src), excerpt(src, n) }.
   ============================================================================= */
(function () {
  "use strict";

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safeHref(url) {
    var v = String(url == null ? "" : url).trim();
    if (!v) return "#";
    // Allow http(s), root/relative, anchors, mailto, tel — block javascript:, data:, etc.
    if (/^(https?:\/\/|\/|\.\/|#|mailto:|tel:)/i.test(v)) return v;
    if (/^[\w./?=&%-]+$/.test(v)) return v; // bare relative path like /contact#x
    return "#";
  }

  // Inline formatting on already-escaped text.
  function inline(t) {
    // links [text](url)
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_m, txt, url) {
      var href = safeHref(url);
      var ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<a href="' + href + '"' + ext + ">" + txt + "</a>";
    });
    t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
    // bold before italic
    t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    // italic (avoid matching a leftover ** and avoid snake_case for _)
    t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    t = t.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, "$1<em>$2</em>");
    return t;
  }

  function render(src) {
    // Escaped first, so ">" is now "&gt;" — detect blockquotes in that escaped form.
    var lines = escapeHtml(src).replace(/\r\n?/g, "\n").split("\n");
    var html = "";
    var list = null; // "ul" | "ol"
    var para = [];
    var quote = [];

    function flushPara() {
      if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; }
    }
    function closeList() {
      if (list) { html += "</" + list + ">"; list = null; }
    }
    function flushQuote() {
      if (quote.length) { html += "<blockquote>" + quote.map(inline).join("<br>") + "</blockquote>"; quote = []; }
    }
    function flushAll() { flushPara(); closeList(); flushQuote(); }

    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].replace(/\s+$/, "").trim();
      var m;

      if (!trimmed) { flushAll(); continue; }

      if ((m = /^(#{1,6})\s+(.*)$/.exec(trimmed))) {
        flushAll();
        var tag = m[1].length <= 2 ? "h3" : "h4";
        html += "<" + tag + ">" + inline(m[2]) + "</" + tag + ">";
      } else if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        flushAll();
        html += "<hr>";
      } else if (/^&gt;\s?/.test(trimmed)) {
        flushPara(); closeList();
        quote.push(trimmed.replace(/^&gt;\s?/, ""));
      } else if (/^([-*+])\s+/.test(trimmed)) {
        flushPara(); flushQuote();
        if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
        html += "<li>" + inline(trimmed.replace(/^([-*+])\s+/, "")) + "</li>";
      } else if (/^\d+[.)]\s+/.test(trimmed)) {
        flushPara(); flushQuote();
        if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
        html += "<li>" + inline(trimmed.replace(/^\d+[.)]\s+/, "")) + "</li>";
      } else {
        closeList(); flushQuote();
        para.push(trimmed);
      }
    }
    flushAll();
    return html;
  }

  // Plain-text summary for the collapsed card (strips all Markdown markers).
  function excerpt(src, n) {
    n = n || 165;
    var t = String(src == null ? "" : src)
      .replace(/\r\n?/g, "\n")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s*([-*+]|\d+[.)])\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (t.length <= n) return t;
    var cut = t.slice(0, n);
    var sp = cut.lastIndexOf(" ");
    if (sp > n * 0.6) cut = cut.slice(0, sp);
    return cut + "…";
  }

  window.JDMarkdown = { render: render, excerpt: excerpt };
})();
