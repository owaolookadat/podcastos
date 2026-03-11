import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "../db";
import path from "path";

export function runMigrations() {
  const db = getDb();
  migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });
}
