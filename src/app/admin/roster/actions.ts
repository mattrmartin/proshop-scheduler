"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth";

export type RosterState = { error?: string; ok?: boolean };

export type RosterPerson = {
  id: string;
  name: string;
  phone: string;
  role: string;
  department: string;
  rank: number;
};

/** The roster split by department, for the manager dashboard drawer. Admin-only. */
export async function loadRoster(): Promise<{
  inside: RosterPerson[];
  outside: RosterPerson[];
} | null> {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, phone, role, department, rank")
    .order("department", { ascending: true })
    .order("rank", { ascending: true });
  if (error) throw error; // surface, don't swallow

  return {
    inside: (data ?? []).filter((u) => u.department === "inside"),
    outside: (data ?? []).filter((u) => u.department === "outside"),
  };
}

const ROLES = ["admin", "staff"] as const;
const DEPARTMENTS = ["inside", "outside"] as const;

type Fields = {
  name: string;
  phone: string;
  role: string;
  department: string;
  rank: number;
};

/** Parse + validate the shared form fields for create/update. */
function parseFields(formData: FormData): Fields | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const department = String(formData.get("department") ?? "");
  const rankRaw = String(formData.get("rank") ?? "");

  if (!name) return { error: "Name is required." };
  if (!/^\+\d{10,15}$/.test(phone))
    return { error: "Phone must be E.164, e.g. +12085551234." };
  if (!ROLES.includes(role as (typeof ROLES)[number]))
    return { error: "Pick a role." };
  if (!DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number]))
    return { error: "Pick a department." };
  const rank = Number(rankRaw);
  if (!Number.isInteger(rank) || rank < 0)
    return { error: "Rank must be a whole number." };

  return { name, phone, role, department, rank };
}

export async function createUser(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const parsed = parseFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("users").insert(parsed);
  if (error) {
    if (error.code === "23505")
      return { error: "That phone number is already in the roster." };
    return { error: error.message };
  }

  revalidatePath("/admin/roster");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateUser(
  _prev: RosterState,
  formData: FormData,
): Promise<RosterState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user." };
  const parsed = parseFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update(parsed).eq("id", id);
  if (error) {
    if (error.code === "23505")
      return { error: "That phone number is already in the roster." };
    return { error: error.message };
  }

  revalidatePath("/admin/roster");
  revalidatePath("/admin");
  return { ok: true };
}
