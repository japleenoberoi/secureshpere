import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { APP_CONFIG } from '../config.js';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const supabase = APP_CONFIG.supabaseUrl && APP_CONFIG.supabaseAnonKey ? createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
}) : null;

function db() {
  if (!supabase) throw new ApiError('Supabase is not configured. Add your project URL and anon key to index.html.');
  return supabase;
}

function fail(error) {
  if (error) throw new ApiError(error.message, error.status || 0);
}

function publicUser(user, profile) {
  return user ? { id: user.id, name: profile?.name || user.user_metadata?.name || user.email, email: user.email } : null;
}

async function currentUser() {
  const { data, error } = await db().auth.getUser();
  fail(error);
  if (!data.user) throw new ApiError('Please sign in to continue.', 401);
  return data.user;
}

export const Api = {
  async getSession() {
    const { data, error } = await db().auth.getUser();
    fail(error);
    if (!data.user) throw new ApiError('Please sign in to continue.', 401);
    const { data: profile, error: profileError } = await db().from('profiles').select('name').eq('id', data.user.id).maybeSingle();
    fail(profileError);
    return { user: publicUser(data.user, profile) };
  },
  async login(email, password) {
    const { data, error } = await db().auth.signInWithPassword({ email, password });
    fail(error);
    const { data: profile, error: profileError } = await db().from('profiles').select('name').eq('id', data.user.id).maybeSingle();
    fail(profileError);
    return { user: publicUser(data.user, profile) };
  },
  async register(name, email, password) {
    const { data, error } = await db().auth.signUp({ email, password, options: { data: { name } } });
    fail(error);
    if (!data.user) throw new ApiError('Account creation could not be completed.');
    // Supabase returns a user but no session when Confirm email is enabled.
    // That is a successful registration, not an application error.
    return { user: publicUser(data.user, { name }), requiresEmailConfirmation: !data.session };
  },
  async logout() { fail((await db().auth.signOut()).error); },
  async getInterests() {
    const user = await currentUser();
    const [{ data: categories, error: categoryError }, { data: selections, error: selectionError }] = await Promise.all([
      db().from('interest_categories').select('id,label,icon,color').order('sort_order'),
      db().from('user_interests').select('interest_id').eq('user_id', user.id),
    ]);
    fail(categoryError); fail(selectionError);
    return { categories: categories || [], selectedIds: (selections || []).map(row => row.interest_id) };
  },
  async saveInterests(interestIds) {
    await currentUser();
    const uniqueIds = [...new Set(interestIds.map(String))];
    fail((await db().rpc('set_user_interests', { selected_ids: uniqueIds })).error);
  },
  async getJobs() {
    const user = await currentUser();
    const { data: selections, error: selectionError } = await db().from('user_interests').select('interest_id').eq('user_id', user.id);
    fail(selectionError);
    const interestIds = (selections || []).map(row => row.interest_id);
    if (!interestIds.length) return { jobs: [] };
    const { data, error } = await db().from('jobs').select('*').eq('is_active', true).overlaps('interest_ids', interestIds).order('posted_at', { ascending: false });
    fail(error);
    return { jobs: (data || []).map(job => ({
      id: job.id, title: job.title, company: job.company, location: job.location, salary: job.salary,
      type: job.employment_type, posted: job.posted_label, description: job.description, requirements: job.requirements || [],
      applicationUrl: job.application_url, trust: job.trust || {}, trustScore: { score: job.trust_score, breakdown: job.trust_breakdown || [] },
    })) };
  },
  async getScans() {
    await currentUser();
    const { data, error } = await db().from('scan_results').select('*').order('created_at', { ascending: false }).limit(50);
    fail(error);
    return { scans: data || [] };
  },
  async saveScan(result) {
    const user = await currentUser();
    const row = {
      user_id: user.id, file_name: result.fileName, file_size: result.fileSize || 0, file_size_formatted: result.fileSizeFormatted,
      declared_extension: result.declaredExtension, declared_mime: result.declaredMime, detected_type: result.detectedType,
      magic_bytes: result.magicBytes, verdict: result.verdict, verdict_color: result.verdictColor,
      verdict_icon: result.verdictIcon, details: result.details || [],
    };
    const { data, error } = await db().from('scan_results').insert(row).select().single();
    fail(error);
    return data;
  },
  async clearScans() {
    await currentUser();
    const { error } = await db().from('scan_results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fail(error);
  },
};
