import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_REDIRECT_URI,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);
