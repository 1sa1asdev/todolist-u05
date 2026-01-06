// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !key) {
  document.body.innerHTML = `<pre style="padding:16px;color:red;">
Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env (project root).
Restart Vite after adding it.
</pre>`;
  throw new Error("Missing Supabase env vars");
}

export const supabase = createClient<Database>(url, key);
