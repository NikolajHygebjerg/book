import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/book");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="text-center mb-8">
        <span className="text-4xl">🏺</span>
        <h1 className="mt-4 text-2xl font-bold text-stone-900">Log ind</h1>
        <p className="mt-1 text-stone-500">Velkommen tilbage i værkstedet</p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </div>
  );
}
