"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";
import { loadBoardData, type BoardData } from "@/lib/board-data";

/**
 * Fetch one week's board on demand — used by the manager dashboard when a week
 * card is expanded, so we don't load every week's grid up front. Admin-only.
 */
export async function loadWeekBoard(weekId: string): Promise<BoardData | null> {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") return null;
  const supabase = await createClient();
  return loadBoardData(supabase, weekId);
}
