import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// IMPORTANT: Ganti dengan Supabase URL dan ANON KEY kamu
const SUPABASE_URL = 'https://axpcluuaemzxrxsgdbef.supabase.co'; // Contoh: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cGNsdXVhZW16eHJ4c2dkYmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTM4MzMsImV4cCI6MjA4MjU4OTgzM30.blgemvdow9Q3iUIowjavtO7mttb9Yl9QHZztj5wG8sE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
