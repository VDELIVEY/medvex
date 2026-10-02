export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  databaseUrl: process.env.DATABASE_URL,
  collectugApiKey: process.env.COLLECTUG_API_KEY,
  collectugBaseUrl: process.env.COLLECTUG_BASE_URL,
  sessionSecret: process.env.MEDQR_SESSION_SECRET,
  seedSecret: process.env.MEDQR_SEED_SECRET,
  seedPassword: process.env.MEDQR_SEED_PASSWORD,
  appName: process.env.NEXT_PUBLIC_APP_NAME,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
} as const;

export const requireConfig = <K extends keyof typeof config>(
  key: K,
  message?: string
): NonNullable<(typeof config)[K]> => {
  const value = config[key];
  if (!value) {
    throw new Error(message || `Missing required config: ${key}`);
  }
  return value;
};
