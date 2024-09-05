// supabaseAdminClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_PRIVATE_KEY);

export default supabaseAdmin;
