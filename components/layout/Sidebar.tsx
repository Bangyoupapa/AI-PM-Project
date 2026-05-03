"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Package,
  CheckSquare,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/config";

const navItems = [
  { href: "/dashboard", label: "儀表板", icon: LayoutDashboard },
  { href: "/regulations", label: "法規管理", icon: BookOpen },
  { href: "/parts", label: "料件管理", icon: Package },
  { href: "/compliance", label: "合規狀態", icon: CheckSquare },
  { href: "/ai", label: "AI 查詢", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold leading-tight text-foreground">
          {config.app.name}
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
