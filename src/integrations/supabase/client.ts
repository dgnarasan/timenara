// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://czctxfnlwbthbfwkoyto.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3R4Zm5sd2J0aGJmd2tveXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMTkwNjQsImV4cCI6MjA1NTg5NTA2NH0.UmJ2uiuwbIjr1PeklCQghoo_Jhe5CPzk9fewtq09aFM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);