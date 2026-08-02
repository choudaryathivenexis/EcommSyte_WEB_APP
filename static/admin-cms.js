/* =============================================================================
   ecommsyte — Admin portal for the Careers CMS  (standalone page at /admin)
   Serverless, browser-only. Supabase (Postgres + PostgREST + GoTrue) via the
   @supabase/supabase-js@2 CDN SDK.

   Security: the anon key below is PUBLIC by design — Row Level Security in
   Postgres is the real boundary (only authenticated admins can read hidden rows
   or write). NEVER put the service_role key here. Anyone can open /admin, but
   without valid credentials they can only see the sign-in screen.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- Config (both values are public-safe) --------------------------------- */
  const SUPABASE_URL = "https://cdvinzttmkgbypxjsvlc.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdmluenR0bWtnYnlweGpzdmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTgxNTAsImV4cCI6MjEwMTIzNDE1MH0.DvdGhpN_aK1daT61xZmsC6y1S5rcW0EKnJWwh_VuU30";
  const TABLE = "job_roles";

  const $ = (id) => document.getElementById(id);
  const root = $("admRoot");
  if (!root) return; // not the admin page

  const el = {
    login: $("admLogin"),
    app: $("admApp"),
    barActions: $("admBarActions"),
    who: $("admWho"),
    loginForm: $("admLoginForm"),
    email: $("admEmail"),
    password: $("admPassword"),
    loginBtn: $("admLoginBtn"),
    loginError: $("admLoginError"),
    logout: $("admLogout"),
    statTotal: $("admStatTotal"),
    statVisible: $("admStatVisible"),
    statHidden: $("admStatHidden"),
    form: $("admRoleForm"),
    formTitle: $("admFormTitle"),
    fTitle: $("admTitle"),
    fDept: $("admDept"),
    fType: $("admType"),
    fLocation: $("admLocation"),
    fDesc: $("admDesc"),
    fApply: $("admApplyUrl"),
    fVisible: $("admVisible"),
    submit: $("admSubmit"),
    cancel: $("admFormCancel"),
    list: $("admList"),
    empty: $("admEmpty"),
    status: $("admStatus"),
  };

  const loginError = (msg) => { if (el.loginError) el.loginError.textContent = msg || ""; };

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    loginError("Could not load the Supabase library. Check your connection and reload.");
    console.error("[admin] supabase-js SDK failed to load.");
    return;
  }
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ---- State ---------------------------------------------------------------- */
  let editingId = null; // null => "add" mode; otherwise the id being edited
  let cache = [];
  const byId = new Map();

  /* ---- Helpers -------------------------------------------------------------- */
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

  const val = (node) => (node && node.value ? String(node.value) : "");

  /* ---- Auth gate ------------------------------------------------------------ */
  function reflect(session) {
    const on = !!session;
    if (el.login) el.login.hidden = on;
    if (el.app) el.app.hidden = !on;
    if (el.barActions) el.barActions.hidden = !on;
    if (el.who) el.who.textContent = on && session.user ? session.user.email || "" : "";
  }

  async function initAuth() {
    try {
      const { data } = await db.auth.getSession();
      const session = data && data.session;
      reflect(session);
      if (session) await load();
    } catch (e) {
      console.error(e);
      reflect(null);
    }
    db.auth.onAuthStateChange(async (_event, session) => {
      reflect(session);
      if (session) await load();
      else { cache = []; byId.clear(); }
    });
  }

  if (el.loginForm) {
    el.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginError("");
      if (el.loginBtn) el.loginBtn.disabled = true;
      try {
        const { error } = await db.auth.signInWithPassword({
          email: val(el.email).trim(),
          password: val(el.password),
        });
        if (error) { loginError(error.message); return; }
        if (el.password) el.password.value = "";
      } catch (err) {
        loginError("Sign-in failed. Please try again.");
        console.error(err);
      } finally {
        if (el.loginBtn) el.loginBtn.disabled = false;
      }
    });
  }

  if (el.logout) {
    el.logout.addEventListener("click", async () => {
      try { await db.auth.signOut(); } catch (e) { console.error(e); }
      resetForm();
    });
  }

  /* ---- Data load ------------------------------------------------------------ */
  async function load() {
    try {
      const { data, error } = await db
        .from(TABLE)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) { setStatus("Load failed: " + error.message, true); return; }
      cache = data || [];
      byId.clear();
      cache.forEach((r) => byId.set(r.id, r));
      render();
    } catch (e) {
      setStatus("Could not load roles. Please reload.", true);
      console.error(e);
    }
  }

  function updateStats() {
    const total = cache.length;
    const visible = cache.filter((r) => r.visible).length;
    if (el.statTotal) el.statTotal.textContent = String(total);
    if (el.statVisible) el.statVisible.textContent = String(visible);
    if (el.statHidden) el.statHidden.textContent = String(total - visible);
  }

  function itemRow(r) {
    const meta = [r.department, r.employment_type, r.location].filter(Boolean).join("  ·  ");
    return (
      `<li class="adm__item" data-id="${esc(r.id)}" draggable="true">` +
      `<span class="adm__grip" aria-hidden="true">☰</span>` +
      `<span class="adm__item-main"><b>${esc(r.title)}</b><span>${esc(meta)}</span></span>` +
      `<span class="adm__item-actions">` +
      `<button type="button" class="adm-btn adm-btn--toggle" data-vis aria-pressed="${r.visible ? "true" : "false"}">${r.visible ? "Visible" : "Hidden"}</button>` +
      `<button type="button" class="adm-btn" data-edit>Edit</button>` +
      `<button type="button" class="adm-btn adm-btn--danger" data-del>Delete</button>` +
      `</span></li>`
    );
  }

  function render() {
    updateStats();
    const rows = [...cache].sort((a, b) => a.sort_order - b.sort_order);
    if (el.list) el.list.innerHTML = rows.map(itemRow).join("");
    if (el.empty) el.empty.hidden = rows.length > 0;
    if (!el.list) return;
    el.list.querySelectorAll(".adm__item").forEach((row) => {
      const id = row.getAttribute("data-id");
      const edit = row.querySelector("[data-edit]");
      const del = row.querySelector("[data-del]");
      const vis = row.querySelector("[data-vis]");
      if (edit) edit.addEventListener("click", () => startEdit(id));
      if (del) del.addEventListener("click", () => removeRole(id));
      if (vis) vis.addEventListener("click", () => toggleVisible(id));
      row.addEventListener("dragstart", onDragStart);
      row.addEventListener("dragover", onDragOver);
      row.addEventListener("drop", onDrop);
      row.addEventListener("dragend", onDragEnd);
    });
  }

  /* ---- Add / edit (one form) ------------------------------------------------ */
  function resetForm() {
    editingId = null;
    if (el.form) el.form.reset();
    if (el.fVisible) el.fVisible.checked = true;
    if (el.formTitle) el.formTitle.textContent = "Add a role";
    if (el.submit) el.submit.textContent = "Add role";
    if (el.cancel) el.cancel.hidden = true;
  }

  function startEdit(id) {
    const r = byId.get(id);
    if (!r) return;
    editingId = id;
    if (el.fTitle) el.fTitle.value = r.title || "";
    if (el.fDept) el.fDept.value = r.department || "";
    if (el.fType) el.fType.value = r.employment_type || "";
    if (el.fLocation) el.fLocation.value = r.location || "";
    if (el.fDesc) el.fDesc.value = r.description || "";
    if (el.fApply) el.fApply.value = r.apply_url || "";
    if (el.fVisible) el.fVisible.checked = !!r.visible;
    if (el.formTitle) el.formTitle.textContent = "Edit role";
    if (el.submit) el.submit.textContent = "Save changes";
    if (el.cancel) el.cancel.hidden = false;
    if (el.form) el.form.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (el.cancel) el.cancel.addEventListener("click", () => resetForm());

  if (el.form) {
    el.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const record = {
        title: val(el.fTitle).trim(),
        department: val(el.fDept).trim(),
        employment_type: val(el.fType).trim() || "Full-time",
        location: val(el.fLocation).trim() || "Remote",
        description: val(el.fDesc).trim(),
        apply_url: val(el.fApply).trim() || "contact.html#contact",
        visible: !!(el.fVisible && el.fVisible.checked),
      };
      if (!record.title) return setStatus("A role title is required.", true);
      if (el.submit) el.submit.disabled = true;
      try {
        let error;
        if (editingId === null) {
          record.sort_order = cache.length ? Math.max(...cache.map((r) => r.sort_order)) + 1 : 0;
          ({ error } = await db.from(TABLE).insert(record));
        } else {
          ({ error } = await db.from(TABLE).update(record).eq("id", editingId));
        }
        if (error) return setStatus((editingId ? "Update" : "Add") + " failed: " + error.message, true);
        setStatus(editingId ? "Role updated." : "Role added.");
        resetForm();
        await load();
      } catch (err) {
        setStatus("Save failed. Please try again.", true);
        console.error(err);
      } finally {
        if (el.submit) el.submit.disabled = false;
      }
    });
  }

  /* ---- Delete (with confirm) ------------------------------------------------ */
  async function removeRole(id) {
    const r = byId.get(id);
    if (!window.confirm('Delete "' + (r ? r.title : "this role") + '"? This cannot be undone.')) return;
    try {
      const { error } = await db.from(TABLE).delete().eq("id", id);
      if (error) return setStatus("Delete failed: " + error.message, true);
      if (editingId === id) resetForm();
      setStatus("Role deleted.");
      await load();
    } catch (e) {
      setStatus("Delete failed. Please try again.", true);
      console.error(e);
    }
  }

  /* ---- Visibility toggle ---------------------------------------------------- */
  async function toggleVisible(id) {
    const r = byId.get(id);
    if (!r) return;
    try {
      const { error } = await db.from(TABLE).update({ visible: !r.visible }).eq("id", id);
      if (error) return setStatus("Visibility update failed: " + error.message, true);
      setStatus(!r.visible ? "Role is now visible." : "Role hidden.");
      await load();
    } catch (e) {
      setStatus("Update failed. Please try again.", true);
      console.error(e);
    }
  }

  /* ---- Drag to reorder (persists via upsert on DROP, never on dragover) ----- */
  function onDragStart(e) {
    e.currentTarget.classList.add("is-dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", e.currentTarget.getAttribute("data-id")); } catch (_) {}
    }
  }

  function onDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    if (!el.list) return;
    const dragging = el.list.querySelector(".is-dragging");
    const target = e.currentTarget;
    if (!dragging || dragging === target) return;
    const rect = target.getBoundingClientRect();
    const after = e.clientY - rect.top > rect.height / 2;
    el.list.insertBefore(dragging, after ? target.nextSibling : target);
  }

  async function onDrop(e) {
    e.preventDefault();
    if (!el.list) return;
    const ids = [...el.list.querySelectorAll(".adm__item")].map((r) => r.getAttribute("data-id"));
    const payload = ids.map((id, i) => {
      const src = byId.get(id) || {};
      const { created_at, ...rest } = src; // don't overwrite created_at
      return { ...rest, id, sort_order: i };
    });
    try {
      const { error } = await db.from(TABLE).upsert(payload);
      if (error) { setStatus("Reorder failed: " + error.message, true); await load(); return; }
      payload.forEach((p) => { const r = byId.get(p.id); if (r) r.sort_order = p.sort_order; });
      cache = ids.map((id) => byId.get(id)).filter(Boolean);
      updateStats();
      setStatus("Order saved.");
    } catch (err) {
      setStatus("Reorder failed. Please try again.", true);
      console.error(err);
      await load();
    }
  }

  function onDragEnd() {
    const d = el.list && el.list.querySelector(".is-dragging");
    if (d) d.classList.remove("is-dragging");
  }

  /* ---- Boot ----------------------------------------------------------------- */
  resetForm();
  initAuth();
})();
