import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");
  redirect(user.role === "admin" ? "/admin" : "/availability");
}
