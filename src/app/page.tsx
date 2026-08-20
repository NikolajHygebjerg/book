import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/layout/logo";
import { AuthScreen } from "@/components/auth/auth-screen";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/book");

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Logo size="lg" href={null} priority className="mb-10" />
      <AuthScreen />
    </div>
  );
}
