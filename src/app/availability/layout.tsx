import { redirect } from "next/navigation";

import { getCurrentAppUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { AppHeader } from "@/components/app-header";

export default async function AvailabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <AppHeader>
        <span className="text-muted-foreground hidden text-sm sm:inline">
          {user.name}
        </span>
        <SignOutButton />
      </AppHeader>
      <main className="mx-auto max-w-[480px] p-4">{children}</main>
    </div>
  );
}
