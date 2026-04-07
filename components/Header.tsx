"use client";

import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function Header({
  activeTab = "testing",
  onTabChange,
}: HeaderProps) {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const currentTab = activeTab || searchParams.get("tab") || "testing";

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const nextTheme =
      savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : prefersDark
          ? "dark"
          : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }

    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-4 md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <Link
              href="/dashboard"
              className="shrink-0 text-xl font-bold text-zinc-900 dark:text-white"
            >
              APIfy
            </Link>
            <nav className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
              <HeaderTab
                isActive={currentTab === "testing"}
                label="Тестирование"
                onClick={() => handleTabClick("testing")}
              />
              <HeaderTab
                isActive={currentTab === "favorites"}
                label="Избранное"
                onClick={() => handleTabClick("favorites")}
              />
              <HeaderTab
                isActive={currentTab === "import"}
                label="Импорт API"
                onClick={() => handleTabClick("import")}
              />
              <HeaderTab
                isActive={currentTab === "monitoring"}
                label="Мониторинг"
                onClick={() => handleTabClick("monitoring")}
              />
              <HeaderTab
                isActive={currentTab === "analytics"}
                label="Аналитика"
                onClick={() => handleTabClick("analytics")}
              />
              <HeaderTab
                isActive={currentTab === "history"}
                label="История"
                onClick={() => handleTabClick("history")}
              />
            </nav>
          </div>

          <div className="flex items-center gap-4 md:justify-end">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-700"
              aria-label="Переключить тему"
            >
              {theme === "dark" ? "Светлая" : "Тёмная"}
            </button>
            {loading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                Загрузка...
              </div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderTab({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border-b-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-blue-500 text-zinc-900 dark:text-white"
          : "border-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
