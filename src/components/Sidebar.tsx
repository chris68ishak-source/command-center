"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "☀️" },
  { href: "/quotes", label: "Quotes", icon: "📋" },
  { href: "/reviews", label: "Reviews", icon: "⭐" },
  { href: "/content", label: "Content", icon: "✍️" },
  { href: "/intel", label: "Intel", icon: "👁️" },
  { href: "/campaign", label: "Campaign", icon: "📅" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-gray-900 border-r border-gray-800 flex flex-col z-50">
      <div className="px-5 py-5 border-b border-gray-800">
        <h1 className="text-base font-bold text-white">Command Center</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">Pro Touch Construction</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-xs text-gray-500">7 agents live</span>
        </div>
      </div>
    </aside>
  );
}
