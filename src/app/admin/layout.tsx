import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold">Pro Shop Scheduler</span>
          <span className="text-muted-foreground text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm">{user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
