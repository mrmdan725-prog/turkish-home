import { createClient } from '@supabase/supabase-js';

// Robust environment variable access for Electron/Vite
const getEnv = (key) => {
    try {
        // Check if running in Vite dev/build
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            return import.meta.env[key];
        }
        // Fallback for some Electron contexts or direct Node usage (less likely here but safe)
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {
        console.warn(`Error accessing env var ${key}:`, e);
    }
    return undefined;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

let supabaseInstance;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
} else {
    console.warn('Supabase URL or Key missing. App will run in offline mode.');
}

// Export a robust client that warns if used without initialization
export const supabase = supabaseInstance || {
    from: () => ({
        select: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
        insert: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
        update: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
        delete: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
        upsert: () => Promise.resolve({ data: [], error: { message: 'Supabase not initialized' } }),
    }),
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not initialized' } }),
            getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
    }
};
