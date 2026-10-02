import { createClient } from '@supabase/supabase-js';
import { config } from './config';

const supabaseUrl = config.supabaseUrl || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = config.supabaseAnonKey || 'placeholder-anon-key';
const supabaseServiceRoleKey = config.supabaseServiceRoleKey;

const supabaseOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export const supabaseServer = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, supabaseOptions)
  : supabase;

