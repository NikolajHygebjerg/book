"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-stone-500 hover:text-stone-800 transition-colors text-sm"
    >
      Log ud
    </button>
  );
}
