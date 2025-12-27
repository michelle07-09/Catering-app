import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// IMPORTANT: Ganti dengan Supabase URL dan ANON KEY kamu
const SUPABASE_URL = 'https://ewcnzlnierkpbakuikbc.supabase.co'; // Contoh: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3Y256bG5pZXJrcGJha3Vpa2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTUyMTIsImV4cCI6MjA4MTM5MTIxMn0.WmESHsoqna5Wst1fLoTahJaxdbyhmKWr21s4YNWfjnY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
