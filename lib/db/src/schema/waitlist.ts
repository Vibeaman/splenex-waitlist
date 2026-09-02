import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistEntriesTable = pgTable(
  "waitlist_entries",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    twitterUsername: text("twitter_username").notNull(),
    xFollowed: boolean("x_followed").notNull().default(false),
    telegramJoined: boolean("telegram_joined").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("waitlist_entries_email_idx").on(table.email),
    uniqueIndex("waitlist_entries_twitter_username_idx").on(
      table.twitterUsername,
    ),
  ],
);

export const insertWaitlistEntrySchema = createInsertSchema(
  waitlistEntriesTable,
).omit({ id: true, createdAt: true });

export type InsertWaitlistEntry = z.infer<typeof insertWaitlistEntrySchema>;
export type WaitlistEntry = typeof waitlistEntriesTable.$inferSelect;