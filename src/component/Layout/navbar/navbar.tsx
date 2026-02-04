'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ClayButton } from "@/component/ui/Clay";
import { Logout01Icon, Sun01Icon, Moon01Icon, Menu01Icon, Cancel01Icon } from "hugeicons-react";
import { useEffect, useState } from "react";
import { signOut } from '@/hook/useAuthActions';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Once mounted on client, get the theme
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
    }
  }, []);

  // Apply theme and persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Listen for system theme changes if user hasn't set a preference
  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mounted]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        {/* Clay navbar container */}
        <div className="mx-4 mt-4">
          <div className="clay-card rounded-2xl px-4 sm:px-6 lg:px-8 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold text-foreground group-hover:text-accent transition-colors hidden sm:block">
                  MemoForge
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center">
                <div className="flex items-center bg-background-muted/50 rounded-xl p-1">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className={`
                          relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive
                            ? 'bg-surface text-accent shadow-sm'
                            : 'text-foreground-muted hover:text-foreground hover:bg-surface/50'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    className="p-2.5 rounded-xl bg-background-muted/50 hover:bg-background-muted text-foreground-muted hover:text-foreground transition-all duration-200"
                    aria-label="Toggle theme"
                  >
                    {theme === "light" ? (
                      <Sun01Icon className="w-5 h-5" />
                    ) : (
                      <Moon01Icon className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* Sign Out */}
                <button
                  onClick={signOut}
                  className="p-2.5 rounded-xl bg-background-muted/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-foreground-muted hover:text-red-500 transition-all duration-200"
                  aria-label="Sign out"
                >
                  <Logout01Icon className="w-5 h-5" />
                </button>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2.5 rounded-xl bg-background-muted/50 hover:bg-background-muted text-foreground-muted hover:text-foreground transition-all duration-200"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <Cancel01Icon className="w-5 h-5" />
                  ) : (
                    <Menu01Icon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-4 mt-2">
            <div className="clay-card rounded-2xl p-4 space-y-2">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? 'bg-accent text-white'
                        : 'text-foreground-muted hover:bg-background-muted hover:text-foreground'
                      }
                    `}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from going under navbar */}
      <div className="h-4" />
    </>
  );
}
