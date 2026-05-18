// js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// PEGA AQUÍ TUS DATOS ENTRE LAS COMILLAS
const supabaseUrl = 'AQUÍ_PEGA_LA_URL_DE_TU_PROJECT_URL'
const supabaseKey = 'AQUÍ_PEGA_LA_LLAVE_ANON_PUBLIC'

export const supabase = createClient(supabaseUrl, supabaseKey)