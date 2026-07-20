import { redirect } from "next/navigation";

export default function Home() {
  // Everything lives under /admin for now (staff views come later).
  redirect("/admin");
}
