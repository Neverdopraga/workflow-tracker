"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Palmtree,
  CalendarDays,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const allItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard, managerOnly: true },
  { label: "Tasks", href: "/dashboard/tasks", icon: ClipboardList, managerOnly: false },
  { label: "Leave", href: "/dashboard/leave", icon: Palmtree, managerOnly: false },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays, managerOnly: true },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, managerOnly: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { isManager } = useAuth();

  const items = allItems.filter((item) => !item.managerOnly || isManager);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 px-2 pb-safe">
      <div className="flex justify-around">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-[10px] font-semibold transition ${
                isActive ? "text-primary-600" : "text-gray-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
