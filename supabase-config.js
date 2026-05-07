// Supabase Configuration
const SUPABASE_URL = 'https://flnriktsuhmovlkefroa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gmS8EidVoIN-oPqCAKUgfg_PzBTFOY1'; // Replace with your actual anon key

// Initialize Supabase client
let supabase = null;

async function initSupabase() {
    if (supabase) return supabase;
    
    try {
        // Import Supabase from CDN
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
        
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return supabase;
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        return null;
    }
}

// Get Supabase instance
function getSupabase() {
    return supabase;
}

// Export for use
window.initSupabase = initSupabase;
window.getSupabase = getSupabase;
