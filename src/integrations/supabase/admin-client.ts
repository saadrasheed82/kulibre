// Admin client for Supabase operations that require service role permissions
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://itaechlpkrvaccxyeaud.supabase.co";
// For demo purposes, we're using the same key as the regular client
// In a real app, you would use a service role key with higher privileges
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YWVjaGxwa3J2YWNjeHllYXVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1ODE2NjksImV4cCI6MjA2MTE1NzY2OX0.ZUmObRVDx4jtbJiGeZj4e3JkK_rQpFfV2bSP0c-68_U";

// Create a client with the service role key and a different storage key to avoid conflicts
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      storageKey: 'supabase_admin_auth',
      persistSession: false // Don't persist admin sessions
    }
  }
);

// Note: In a production environment, you would:
// 1. Store the service role key securely (not in client-side code)
// 2. Create server-side API endpoints for admin operations
// 3. Call those endpoints from the client instead of using the admin client directly