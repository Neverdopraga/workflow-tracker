import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zbbywejxdxacoftiqrut.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiYnl3ZWp4ZHhhY29mdGlxcnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTg2MTgsImV4cCI6MjA5MDQzNDYxOH0.LSr_71U7kZAfOZf0xWOe_fxaRVNPSgM8JsjkHeszqTk";

export const supabase = createClient(supabaseUrl, supabaseKey);
