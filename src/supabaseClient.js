import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ugoyrpqracsmijbehevv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnb3lycHFyYWNzbWlqYmVoZXZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzODk3MDQsImV4cCI6MjA3OTk2NTcwNH0.nKBiHoClbwv_khdssyie7P9LVi6789vde2w8BkHh8P8';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);