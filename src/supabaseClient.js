import { createClient } from "@supabase/supabase-js";

// Reemplacen estos dos valores con los que les da Supabase al crear el proyecto.
const SUPABASE_URL = "https://amxsfjyuuyvpapmjjgax.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Dm0rRpPG-BKDYOFSzQz34A_1FOeAmIf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
