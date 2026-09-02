import { and, count, desc, eq, gte, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateWaitlistEntryBody,
  CreateWaitlistEntryResponse,
  GetWaitlistSummaryResponse,
  ListWaitlistEntriesQueryParams,
  ListWaitlistEntriesResponse,
} from "@workspace/api-zod";
import { db, waitlistEntriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/waitlist", async (req, res): Promise<void> => {
  const parsedQuery = ListWaitlistEntriesQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    req.log.warn({ errors: parsedQuery.error.message }, "Invalid waitlist query");
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const { search, limit } = parsedQuery.data;
  const entries = await db
    .select()
    .from(waitlistEntriesTable)
    .where(
      search
        ? or(
            ilike(waitlistEntriesTable.email, `%${search}%`),
            ilike(waitlistEntriesTable.twitterUsername, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(desc(waitlistEntriesTable.createdAt))
    .limit(limit);

  res.json(ListWaitlistEntriesResponse.parse(entries));
});

router.post("/waitlist", async (req, res): Promise<void> => {
  const parsedBody = CreateWaitlistEntryBody.safeParse(req.body);
  if (!parsedBody.success) {
    req.log.warn({ errors: parsedBody.error.message }, "Invalid waitlist entry");
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const email = parsedBody.data.email.trim().toLowerCase();
  const twitterUsername = parsedBody.data.twitterUsername.trim().replace(/^@/, "");

  try {
    const [entry] = await db
      .insert(waitlistEntriesTable)
      .values({
        email,
        twitterUsername,
        xFollowed: parsedBody.data.xFollowed,
        telegramJoined: parsedBody.data.telegramJoined,
      })
      .returning();

    res.status(201).json(CreateWaitlistEntryResponse.parse(entry));
  } catch (error) {
    const isDuplicate = (err: unknown): boolean => {
      if (!err || typeof err !== "object") {
        return false;
      }
      const obj = err as { message?: unknown; code?: unknown; cause?: unknown };
      return (
        (typeof obj.message === "string" && obj.message.includes("duplicate key value")) ||
        obj.code === "23505" ||
        isDuplicate(obj.cause)
      );
    };
    if (isDuplicate(error)) {
      req.log.info("Rejected duplicate waitlist entry");
      res
        .status(409)
        .json({ error: "That email or X username is already on the list." });
      return;
    }

    req.log.error("Failed to create waitlist entry");
    throw error;
  }
});

router.get("/waitlist/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const [totalResult, todayResult, xResult, telegramResult] = await Promise.all([
    db.select({ value: count() }).from(waitlistEntriesTable),
    db
      .select({ value: count() })
      .from(waitlistEntriesTable)
      .where(gte(waitlistEntriesTable.createdAt, startOfToday)),
    db
      .select({ value: count() })
      .from(waitlistEntriesTable)
      .where(eq(waitlistEntriesTable.xFollowed, true)),
    db
      .select({ value: count() })
      .from(waitlistEntriesTable)
      .where(eq(waitlistEntriesTable.telegramJoined, true)),
  ]);

  res.json(
    GetWaitlistSummaryResponse.parse({
      total: Number(totalResult[0]?.value ?? 0),
      joinedToday: Number(todayResult[0]?.value ?? 0),
      xCompleted: Number(xResult[0]?.value ?? 0),
      telegramCompleted: Number(telegramResult[0]?.value ?? 0),
    }),
  );
});

export default router;