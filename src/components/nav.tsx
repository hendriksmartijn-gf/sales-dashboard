"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Users, BarChart3, Plus, LogOut } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/stats", label: "Statistieken", icon: BarChart3 },
];

interface NavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function Nav({ user }: NavProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-[#0f0f0f] border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#e07b00] flex items-center justify-center">
            <span className="text-black font-bold text-sm">G</span>
          </div>
          <span className="text-white font-semibold text-sm">Goldfizh Sales</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-[#f5a623]/10 text-[#f5a623]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <Link
          href="/leads/new"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm bg-[#f5a623] text-black font-medium hover:bg-[#e07b00] transition-colors mt-4"
        >
          <Plus size={16} />
          Nieuwe lead
        </Link>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          {user.image ? (
            <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
              <span className="text-zinc-300 text-xs">
                {user.name?.charAt(0) ?? user.email?.charAt(0) ?? "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.name}</p>
            <p className="text-zinc-500 text-xs truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-zinc-500 hover:text-red-400 transition-colors"
            title="Uitloggen"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
