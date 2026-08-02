/* =============================================================================
   ecommsyte — Careers roles CMS
   Serverless, browser-only. Supabase (Postgres + PostgREST + GoTrue auth) via the
   @supabase/supabase-js@2 CDN SDK.

   Security model: the anon key below is PUBLIC by design — Row Level Security (RLS)
   in Postgres is the real boundary (public can only read visible rows; only
   authenticated users can insert/update/delete). NEVER put the service_role key here.

   Setup:
     1. Create a Supabase project, run supabase/careers_schema.sql (table + RLS).
     2. Create an admin user (Auth → Users → Add user) — that email/password logs in here.
     3. Paste your Project URL + anon (public) key below.
   Until it's configured, the page keeps rendering the static fallback roles unchanged.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- Config (both values are public-safe) --------------------------------- */
  const SUPABASE_URL = "https://cdvinzttmkgbypxjsvlc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdmluenR0bWtnYnlweGpzdmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTgxNTAsImV4cCI6MjEwMTIzNDE1MH0.DvdGhpN_aK1daT61xZmsC6y1S5rcW0EKnJWwh_VuU30";
  const TABLE = "job_roles";

  /* Secret ways to reveal the sign-in — there is NO visible admin link/text.
     1) Deep-link (works everywhere, incl. mobile): open  /careers#staff-login
     2) Type the secret word ADMIN_KEYWORD anywhere on the careers page.
     A plain key-combo was avoided on purpose — browsers hijack combos like
     Ctrl+Shift+K/J/I for devtools. Change either value to whatever you like. */
  const ADMIN_HASH = "#staff-login";
  const ADMIN_KEYWORD = "admin";

  const configured =
    !/YOUR-PROJECT-REF/.test(SUPABASE_URL) && !/YOUR_PUBLIC_ANON_KEY/.test(SUPABASE_ANON_KEY);

  const $ = (id) => document.getElementById(id);
  const list = $("rolesList");
  if (!list) return; // not the careers page

  // Not configured yet → leave the static fallback roles as-is, hide the CMS.
  if (!configured) {
    console.info("[careers-cms] Supabase not configured — showing static fallback roles.");
    return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("[careers-cms] supabase-js SDK failed to load.");
    return;
  }

  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ---- DOM refs -------------------------------------------------------------- */
  const el = {
    list,
    empty: $("rolesEmpty"),
    cms: $("rolesCms"),
    login: $("adminLogin"),
    email: $("adminEmail"),
    password: $("adminPassword"),
    loginBtn: $("adminLoginBtn"),
    loginError: $("adminLoginError"),
    panel: $("adminPanel"),
    logout: $("adminLogout"),
    status: $("adminStatus"),
    form: $("roleForm"),
    formTitle: $("roleFormTitle"),
    fTitle: $("roleTitle"),
    fDept: $("roleDept"),
    fType: $("roleType"),
    fLocation: $("roleLocation"),
    fDesc: $("roleDesc"),
    fApply: $("roleApplyUrl"),
    fVisible: $("roleVisible"),
    submit: $("roleFormSubmit"),
    cancel: $("roleFormCancel"),
    adminList: $("adminList"),
  };

  /* ---- State ---------------------------------------------------------------- */
  let editingId = null; // null => "add" mode; otherwise the id being edited
  let isAdmin = false;
  let cache = []; // all rows currently loaded
  const byId = new Map();

  /* ---- Sanitizers ----------------------------------------------------------- */
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function safeUrl(u) {
    const v = String(u == null ? "" : u).trim();
    if (!v) return "contact.html#contact";
    if (/^(javascript|data|vbscript):/i.test(v)) return "contact.html#contact";
    return v;
  }

  const setStatus = (msg, isError) => {
    if (!el.status) return;
    el.status.textContent = msg || "";
    el.status.style.color = isError ? "#b4231a" : "";
  };

  /* ---- Public list (visible only, ordered by sort_order) -------------------- */
  function roleCard(r) {
    const apply = esc(safeUrl(r.apply_url));
    const tags = [
      r.department ? `<span class="role__tag role__tag--dept">${esc(r.department)}</span>` : "",
      r.employment_type ? `<span class="role__tag">${esc(r.employment_type)}</span>` : "",
      r.location ? `<span class="role__tag">${esc(r.location)}</span>` : "",
    ].join("");
    return (
      // No `reveal` class + inline opacity/transform: injected cards are ALWAYS
      // visible, never dependent on the scroll-reveal observer having run.
      `<article class="role" style="opacity:1;transform:none">` +
      `<div><div class="role__meta">${tags}</div>` +
      `<h3>${esc(r.title)}</h3><p>${esc(r.description)}</p></div>` +
      `<div class="role__cta"><a href="${apply}" class="btn btn--dark magnetic">Apply Now</a></div>` +
      `</article>`
    );
  }

  function renderPublic() {
    const visible = cache
      .filter((r) => r.visible)
      .sort((a, b) => a.sort_order - b.sort_order);
    el.list.innerHTML = visible.map(roleCard).join("");
    if (el.empty) el.empty.hidden = visible.length > 0;
  }

  /* ---- Admin list (all rows, with controls + drag-reorder) ------------------ */
  function adminRow(r) {
    return (
      `<li class="cms-row" data-id="${esc(r.id)}" draggable="true">` +
      `<span class="cms-row__handle" aria-hidden="true">☰</span>` +
      `<span class="cms-row__title">${esc(r.title)}</span>` +
      `<span class="cms-row__dept">${esc(r.department || "")}</span>` +
      `<button type="button" class="cms-btn cms-btn--toggle" data-vis aria-pressed="${r.visible ? "true" : "false"}">${r.visible ? "Visible" : "Hidden"}</button>` +
      `<button type="button" class="cms-btn" data-edit>Edit</button>` +
      `<button type="button" class="cms-btn cms-btn--danger" data-del>Delete</button>` +
      `</li>`
    );
  }

  function renderAdmin() {
    if (!el.adminList) return;
    const rows = [...cache].sort((a, b) => a.sort_order - b.sort_order);
    el.adminList.innerHTML = rows.map(adminRow).join("");
    el.adminList.querySelectorAll(".cms-row").forEach((row) => {
      const id = row.getAttribute("data-id");
      row.querySelector("[data-edit]").addEventListener("click", () => startEdit(id));
      row.querySelector("[data-del]").addEventListener("click", () => removeRole(id));
      row.querySelector("[data-vis]").addEventListener("click", () => toggleVisible(id));
      row.addEventListener("dragstart", onDragStart);
      row.addEventListener("dragover", onDragOver);
      row.addEventListener("drop", onDrop);
      row.addEventListener("dragend", onDragEnd);
    });
  }

  /* ---- Data load ------------------------------------------------------------ */
  async function load() {
    // RLS returns all rows to an admin and only visible rows to the public.
    const { data, error } = await db.from(TABLE).select("*").order("sort_order", { ascending: true });
    if (error) {
      console.error(error);
      // Keep the static fallback if the very first load fails.
      if (cache.length) setStatus("Load failed: " + error.message, true);
      return;
    }
    cache = data || [];
    byId.clear();
    cache.forEach((r) => byId.set(r.id, r));
    renderPublic();
    if (isAdmin) renderAdmin();
  }

  /* ---- Auth ----------------------------------------------------------------- */
  function reflectAuth(on) {
    isAdmin = on;
    if (on && el.cms) el.cms.hidden = false; // reveal the shell only once signed in
    if (el.panel) el.panel.hidden = !on;
    if (el.login) el.login.hidden = on ? true : el.login.hidden;
    if (on) renderAdmin();
  }

  async function initAuth() {
    // Persist admin login across reloads.
    const { data } = await db.auth.getSession();
    reflectAuth(!!(data && data.session));
    db.auth.onAuthStateChange((_event, session) => reflectAuth(!!session));
  }

  /* ---- Reveal the hidden sign-in (secret deep-link hash OR keyboard shortcut) -
     No visible affordance exists on the page; a normal visitor can never find it. */
  function revealLogin() {
    if (isAdmin) return;
    if (el.cms) el.cms.hidden = false;
    if (el.login) el.login.hidden = false;
    if (el.email) el.email.focus();
  }
  function checkHash() {
    if (ADMIN_HASH && window.location.hash === ADMIN_HASH) revealLogin();
  }
  window.addEventListener("hashchange", checkHash);
  // Typed-passphrase reveal — never collides with any browser/devtools shortcut.
  let keyBuffer = "";
  window.addEventListener("keydown", (e) => {
    if (isAdmin || !ADMIN_KEYWORD) return;
    const t = e.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName || "")) return; // ignore form typing
    if (!e.key || e.key.length !== 1) return;
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-ADMIN_KEYWORD.length);
    if (keyBuffer === ADMIN_KEYWORD.toLowerCase()) {
      keyBuffer = "";
      revealLogin();
    }
  });

  el.login &&
    el.login.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (el.loginError) el.loginError.textContent = "";
      const { error } = await db.auth.signInWithPassword({
        email: el.email.value.trim(),
        password: el.password.value,
      });
      if (error) {
        if (el.loginError) el.loginError.textContent = error.message;
        return;
      }
      el.password.value = "";
      reflectAuth(true);
      await load(); // refetch — admin now sees hidden rows too
    });

  el.logout &&
    el.logout.addEventListener("click", async () => {
      await db.auth.signOut();
      resetForm();
      reflectAuth(false);
      await load(); // back to public view
    });

  /* ---- Add / Edit (one form) ------------------------------------------------ */
  function resetForm() {
    editingId = null;
    if (el.form) el.form.reset();
    if (el.fVisible) el.fVisible.checked = true;
    if (el.formTitle) el.formTitle.textContent = "Add role";
    if (el.submit) el.submit.textContent = "Add role";
    if (el.cancel) el.cancel.hidden = true;
  }

  function startEdit(id) {
    const r = byId.get(id);
    if (!r) return;
    editingId = id;
    el.fTitle.value = r.title || "";
    el.fDept.value = r.department || "";
    el.fType.value = r.employment_type || "";
    el.fLocation.value = r.location || "";
    el.fDesc.value = r.description || "";
    el.fApply.value = r.apply_url || "";
    el.fVisible.checked = !!r.visible;
    el.formTitle.textContent = "Edit role";
    el.submit.textContent = "Save changes";
    el.cancel.hidden = false;
    el.form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  el.cancel && el.cancel.addEventListener("click", (e) => { e.preventDefault(); resetForm(); });

  el.form &&
    el.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const record = {
        title: el.fTitle.value.trim(),
        department: el.fDept.value.trim(),
        employment_type: el.fType.value.trim() || "Full-time",
        location: el.fLocation.value.trim() || "Remote",
        description: el.fDesc.value.trim(),
        apply_url: el.fApply.value.trim() || "contact.html#contact",
        visible: !!el.fVisible.checked,
      };
      if (!record.title) return setStatus("A role title is required.", true);

      let error;
      if (editingId === null) {
        // Add — append to the end of the current order.
        record.sort_order = cache.length ? Math.max(...cache.map((r) => r.sort_order)) + 1 : 0;
        ({ error } = await db.from(TABLE).insert(record));
      } else {
        ({ error } = await db.from(TABLE).update(record).eq("id", editingId));
      }
      if (error) return setStatus((editingId ? "Update" : "Add") + " failed: " + error.message, true);
      setStatus(editingId ? "Role updated." : "Role added.");
      resetForm();
      await load();
    });

  /* ---- Delete (with confirm) ------------------------------------------------ */
  async function removeRole(id) {
    const r = byId.get(id);
    if (!window.confirm(`Delete "${r ? r.title : "this role"}"? This cannot be undone.`)) return;
    const { error } = await db.from(TABLE).delete().eq("id", id);
    if (error) return setStatus("Delete failed: " + error.message, true);
    if (editingId === id) resetForm();
    setStatus("Role deleted.");
    await load();
  }

  /* ---- Visibility toggle (updates the `visible` column) --------------------- */
  async function toggleVisible(id) {
    const r = byId.get(id);
    if (!r) return;
    const { error } = await db.from(TABLE).update({ visible: !r.visible }).eq("id", id);
    if (error) return setStatus("Visibility update failed: " + error.message, true);
    setStatus(!r.visible ? "Role is now visible." : "Role hidden.");
    await load();
  }

  /* ---- Drag to reorder (persists via upsert on DROP, never on dragover) ----- */
  let draggingId = null;

  function onDragStart(e) {
    draggingId = e.currentTarget.getAttribute("data-id");
    e.currentTarget.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", draggingId); } catch (_) {}
  }

  function onDragOver(e) {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
    const dragging = el.adminList.querySelector(".is-dragging");
    const target = e.currentTarget;
    if (!dragging || dragging === target) return;
    const rect = target.getBoundingClientRect();
    const after = e.clientY - rect.top > rect.height / 2;
    // Reorder the DOM for live feedback only — no DB write here.
    el.adminList.insertBefore(dragging, after ? target.nextSibling : target);
  }

  async function onDrop(e) {
    e.preventDefault();
    // DB write happens ONLY here, on drop.
    const ids = [...el.adminList.querySelectorAll(".cms-row")].map((r) => r.getAttribute("data-id"));
    const payload = ids.map((id, i) => {
      const src = byId.get(id) || {};
      const { created_at, ...rest } = src; // don't overwrite created_at
      return { ...rest, id, sort_order: i };
    });
    const { error } = await db.from(TABLE).upsert(payload);
    if (error) {
      setStatus("Reorder failed: " + error.message, true);
      await load(); // resync from server
      return;
    }
    // Sync local state + public list.
    payload.forEach((p) => { const r = byId.get(p.id); if (r) r.sort_order = p.sort_order; });
    cache = ids.map((id) => byId.get(id)).filter(Boolean);
    setStatus("Order saved.");
    renderPublic();
  }

  function onDragEnd() {
    const d = el.adminList.querySelector(".is-dragging");
    if (d) d.classList.remove("is-dragging");
    draggingId = null;
  }

  /* ---- Boot ----------------------------------------------------------------- */
  // The CMS shell stays fully hidden — no visible admin link or login box. It is
  // revealed only by the secret deep-link/shortcut above, or if already signed in.
  resetForm();
  checkHash();
  initAuth().then(load);
})();
