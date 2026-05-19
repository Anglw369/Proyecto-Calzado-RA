// js/supabase-config.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://lvzdvalxpywyqbiyvfqe.supabase.co'
const supabaseKey = 'sb_publishable_H3ir5Ih3kBKsuX2nRaPFDQ_6Vecd855'

export const supabase = createClient(supabaseUrl, supabaseKey)