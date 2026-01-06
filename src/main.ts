// src/main.ts
import "./style.css";
import { supabase } from "./lib/supabase";
import type { Database } from "./types/supabase";

type Todo = Database["public"]["Tables"]["todos"]["Row"];

const app = document.getElementById("app") as HTMLDivElement;
if (!app) throw new Error("Missing #app");

let user: { id: string; email?: string | null } | null = null;
let todos: Todo[] = [];
let errorMsg: string | null = null;

let searchTerm = "";
let filterMode: "all" | "active" | "done" = "all";
let sortMode: "newest" | "oldest" | "az" = "newest";

/* ---------- helpers ---------- */
function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function escAttr(s: string) {
  return esc(s).replaceAll('"', "&quot;");
}
function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function getVisibleTodos(): Todo[] {
  let list = [...todos];

  const q = searchTerm.trim().toLowerCase();
  if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));

  if (filterMode === "active") list = list.filter((t) => !t.completed);
  if (filterMode === "done") list = list.filter((t) => t.completed);

  if (sortMode === "az") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortMode === "oldest") {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return list;
}

/* ---------- views ---------- */
function authView() {
  return `
    <main>
      <h1>Auth</h1>
      ${errorMsg ? `<p style="color:red">${esc(errorMsg)}</p>` : ""}
      <form id="auth-form" style="display:grid;gap:8px;max-width:360px;">
        <input name="email" type="email" placeholder="email" required />
        <input name="password" type="password" placeholder="password" required minlength="6" />
        <button type="submit">Sign in</button>
        <button type="button" id="signup-btn">Sign up</button>
      </form>
    </main>
  `;
}

function todosView() {
  return `
    <main>
      <header style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div>
          <h1>Todos</h1>
          <small>${esc(user?.email ?? "")}</small>
        </div>
        <button id="logout-btn" type="button">Logout</button>
      </header>

      ${errorMsg ? `<p style="color:red">${esc(errorMsg)}</p>` : ""}

      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0;">
        <input id="search" placeholder="Sök..." value="${escAttr(searchTerm)}" style="flex:1;min-width:200px;" />
        <select id="filter">
          <option value="all" ${filterMode === "all" ? "selected" : ""}>Alla</option>
          <option value="active" ${filterMode === "active" ? "selected" : ""}>Aktiva</option>
          <option value="done" ${filterMode === "done" ? "selected" : ""}>Klara</option>
        </select>
        <select id="sort">
          <option value="newest" ${sortMode === "newest" ? "selected" : ""}>Nyast</option>
          <option value="oldest" ${sortMode === "oldest" ? "selected" : ""}>Äldst</option>
          <option value="az" ${sortMode === "az" ? "selected" : ""}>A–Z</option>
        </select>
        <button id="clear-all-btn" type="button">Rensa listan</button>
      </div>

      <form id="create-form" style="display:flex;gap:8px;">
        <input name="title" placeholder="Ny uppgift..." required style="flex:1;" />
        <button type="submit">Lägg till</button>
      </form>

      <ul style="margin-top:12px;">
        ${getVisibleTodos()
          .map(
            (t) => `
          <li data-id="${t.id}" style="display:flex;gap:8px;align-items:center;margin:6px 0;">
            <input class="toggle" type="checkbox" ${t.completed ? "checked" : ""} />
            <input class="title" value="${escAttr(t.title)}" style="flex:1;" />
            <button class="delete" type="button">Ta bort</button>
          </li>
        `
          )
          .join("")}
      </ul>
    </main>
  `;
}

function render() {
  app.innerHTML = user ? todosView() : authView();
}

/* ---------- data ---------- */
async function loadTodos() {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  todos = data ?? [];
}

/* ---------- init ---------- */
async function init() {
  app.innerHTML = "<main><h1>Loading…</h1></main>";

  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    const session = data.session;

    if (session?.user) {
      user = { id: session.user.id, email: session.user.email };
      await loadTodos();
    } else {
      user = null;
      todos = [];
    }

    errorMsg = null;
    render();

    supabase.auth.onAuthStateChange(async (_e, s) => {
      try {
        if (s?.user) {
          user = { id: s.user.id, email: s.user.email };
          await loadTodos();
        } else {
          user = null;
          todos = [];
        }
        errorMsg = null;
        render();
      } catch (err) {
        errorMsg = getErrorMessage(err);
        render();
        console.error(err);
      }
    });
  } catch (err) {
    user = null;
    todos = [];
    errorMsg = getErrorMessage(err);
    render();
    console.error(err);
  }
}

/* ---------- events ---------- */
document.addEventListener("submit", async (e) => {
  const form = e.target as HTMLFormElement;

  if (form.id === "auth-form") {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    try {
      errorMsg = null;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }

  if (form.id === "create-form") {
    e.preventDefault();
    if (!user) return;

    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    if (!title) return;

    try {
      errorMsg = null;
      const { data, error } = await supabase
        .from("todos")
        .insert({ user_id: user.id, title })
        .select("*")
        .single();

      if (error) throw error;

      todos.unshift(data as Todo);
      form.reset();
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }
});

document.addEventListener("input", (e) => {
  const el = e.target as HTMLElement;

  if (el.id === "search") {
    searchTerm = (el as HTMLInputElement).value;
    render();
  }

  if (el.id === "filter") {
    filterMode = (el as HTMLSelectElement).value as typeof filterMode;
    render();
  }

  if (el.id === "sort") {
    sortMode = (el as HTMLSelectElement).value as typeof sortMode;
    render();
  }
});

document.addEventListener("click", async (e) => {
  const el = e.target as HTMLElement;

  if (el.id === "signup-btn") {
    const form = el.closest("form") as HTMLFormElement | null;
    if (!form) return;

    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");

    try {
      errorMsg = null;
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      errorMsg = "Skapat konto. Om e-postbekräftelse krävs: bekräfta och logga sedan in.";
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }

  if (el.id === "logout-btn") {
    try {
      errorMsg = null;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }

  if (el.classList.contains("delete")) {
    const li = el.closest("li[data-id]") as HTMLElement | null;
    const id = li?.dataset.id;
    if (!id) return;

    try {
      errorMsg = null;
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;

      todos = todos.filter((t) => t.id !== id);
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }

  if (el.id === "clear-all-btn") {
    if (!user) return;

    try {
      errorMsg = null;
      const { error } = await supabase.from("todos").delete().eq("user_id", user.id);
      if (error) throw error;

      todos = [];
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }
});

document.addEventListener("change", async (e) => {
  const el = e.target as HTMLElement;

  if (el.classList.contains("toggle")) {
    const input = el as HTMLInputElement;
    const li = input.closest("li[data-id]") as HTMLElement | null;
    const id = li?.dataset.id;
    if (!id) return;

    try {
      errorMsg = null;
      const { error } = await supabase.from("todos").update({ completed: input.checked }).eq("id", id);
      if (error) throw error;

      todos = todos.map((t) => (t.id === id ? { ...t, completed: input.checked } : t));
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  }
});

// Save title on blur (edit text)
document.addEventListener(
  "blur",
  async (e) => {
    const el = e.target as HTMLElement;
    if (!el.classList.contains("title")) return;

    const input = el as HTMLInputElement;
    const li = input.closest("li[data-id]") as HTMLElement | null;
    const id = li?.dataset.id;
    if (!id) return;

    const title = input.value.trim();
    if (!title) {
      render(); // revert UI
      return;
    }

    try {
      errorMsg = null;
      const { error } = await supabase.from("todos").update({ title }).eq("id", id);
      if (error) throw error;

      todos = todos.map((t) => (t.id === id ? { ...t, title } : t));
      render();
    } catch (err) {
      errorMsg = getErrorMessage(err);
      render();
      console.error(err);
    }
  },
  true
);

init();
