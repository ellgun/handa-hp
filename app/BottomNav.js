"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const ICON_NAMES = {
  home: "home",
  input: "edit_square",
  history: "history",
  admin: "admin_panel_settings",
};

export default function BottomNav({ isAdmin }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "홈", icon: "home" },
    { href: "/input", label: "입력", icon: "input" },
    { href: "/mypage", label: "이력", icon: "history" },
  ];
  if (isAdmin) {
    items.push({ href: "/admin", label: "관리자", icon: "admin" });
  }

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : ""}>
            <Icon name={ICON_NAMES[item.icon]} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
