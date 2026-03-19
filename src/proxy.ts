import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  return (auth as (req: NextRequest) => unknown)(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/leads/:path*", "/stats/:path*"],
};
