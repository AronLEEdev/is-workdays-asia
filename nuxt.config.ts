// TODO: Nuxt 4 config — enable @nuxt/content for app/content/docs, set compatibilityDate, runtimeConfig for API base URL and server-only (db, redis, stripe). See PRD §5–6.
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devServer: {
    port: 1234,
  },
  devtools: { enabled: true },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || "",
    public: {},
  },
});
