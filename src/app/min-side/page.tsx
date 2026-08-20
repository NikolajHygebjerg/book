import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserDashboard } from "@/components/user/user-dashboard";

export default async function MinSidePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      bookings: {
        where: { status: "CONFIRMED" },
        orderBy: { startTime: "desc" },
        take: 50,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          hours: true,
          persons: true,
          hasPotteryWheel: true,
          totalPriceOre: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Min side</h1>
            <p className="text-stone-500">Administrer din profil og bookinger</p>
          </div>
          <Link
            href="/min-side/abonnement"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
          >
            Abonnement
          </Link>
        </div>
        <UserDashboard
          initialUser={{
            ...user,
            bookings: user.bookings.map((b) => ({
              ...b,
              startTime: b.startTime.toISOString(),
              endTime: b.endTime.toISOString(),
            })),
          }}
        />
      </div>
    </div>
  );
}
