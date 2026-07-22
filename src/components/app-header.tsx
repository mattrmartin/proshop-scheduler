import Image from "next/image";
import Link from "next/link";

/** Brand wordmark + medallion logo. */
export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/hlcc_steel_logo.png"
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="size-8 object-contain"
        priority
      />
      <span className="font-semibold tracking-tight">Pro Shop Scheduler</span>
    </Link>
  );
}

/** Sticky app header shared by every signed-in area. Right-side content
 *  (user name, sign out, section tag) is passed as children. */
export function AppHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="border-border/70 bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <BrandMark />
        <div className="flex items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
