import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qoaxifnrlxxwwdzqxmot.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvYXhpZm5ybHh4d3dkenF4bW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDY5MTUsImV4cCI6MjA5NDI4MjkxNX0.kW9xOfMslcra92rcxe9Jz4vspsmen4jNuxdVc_29z9Q'

export const supabase = createClient(supabaseUrl, supabaseKey)
