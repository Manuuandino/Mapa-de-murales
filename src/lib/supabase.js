import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://unqwjkovypkqhukqyies.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVucXdqa292eXBrcWh1a3F5aWVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDcyODIsImV4cCI6MjA3MDMyMzI4Mn0.MSaU3QQPlPfqwbxytrPbBHaXETaVxSTB17PwDtKoRWw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)