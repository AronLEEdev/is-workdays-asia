import postgres from "postgres";

let sql: ReturnType<typeof postgres>;

export function useDb() {
  if (!sql) {
    const config = useRuntimeConfig();
    sql = postgres(config.databaseUrl, {
      ssl: "require",
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return sql;
}
