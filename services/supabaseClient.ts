import { createClient } from '@supabase/supabase-js';

// Helper seguro para entorno navegador donde process no existe
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Credentials provided by user for project: AgenteCRM
const SUPABASE_URL = getEnv('SUPABASE_URL') || 'https://pgwvhtzisefxpyhmjkxk.supabase.co';
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd3ZodHppc2VmeHB5aG1qa3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MTY5MzQsImV4cCI6MjA4Mzk5MjkzNH0.Zwy9W_3d3WkwS0SxgwD69jYgRqOI8bEHYliep8buwuo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapping from AppState keys to Database Table names
export const TABLE_MAPPING: Record<string, string> = {
  countries: 'countries',
  courses: 'courses',
  prices: 'prices',
  paymentLinks: 'payment_links',
  professionsCatalog: 'professions',
  professionRules: 'profession_rules',
  pipeline: 'pipeline_stages',
  contactProperties: 'contact_properties',
  deals: 'deals',
  faqs: 'faqs',
  config: 'agent_config'
};