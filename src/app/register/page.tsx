import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RegisterPage() {
  const session = await auth();
  if (session) redirect("/book");
  redirect("/");
}
