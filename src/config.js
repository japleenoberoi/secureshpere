const supabaseUrlMeta = document.querySelector('meta[name="orbitjobs-supabase-url"]');
const supabaseAnonKeyMeta = document.querySelector('meta[name="orbitjobs-supabase-anon-key"]');

export const APP_CONFIG = Object.freeze({
  supabaseUrl: supabaseUrlMeta?.content?.trim() || '',
  supabaseAnonKey: supabaseAnonKeyMeta?.content?.trim() || '',
});
