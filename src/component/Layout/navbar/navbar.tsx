'use client';

import { navItems } from "./navConfig";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logout01Icon, Menu01Icon, Cancel01Icon } from "hugeicons-react";
import { useState } from "react";
import { signOut } from '@/hook/useAuthActions';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full">
        {/* Navbar container with glass effect */}
        <div className="mx-4 mt-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl px-4 sm:px-6 lg:px-8 py-3 shadow-lg shadow-gray-200/50 border border-white/80">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 group-hover:scale-105 transition-all">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary-light transition-all hidden sm:block">
                  MemoForge
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center">
                <div className="flex items-center bg-gray-100/70 rounded-xl p-1 border border-gray-200/50">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className={`
                          relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                          ${isActive
                            ? 'bg-white text-primary shadow-md shadow-gray-200/50'
                            : 'text-foreground-muted hover:text-foreground hover:bg-white/60'
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
                {/* Sign Out */}
                <button
                  onClick={signOut}
                  className="p-2.5 rounded-xl bg-gray-100/70 hover:bg-red-50 text-foreground-muted hover:text-red-500 transition-all duration-200 border border-transparent hover:border-red-100"
                  aria-label="Sign out"
                >
                  <Logout01Icon className="w-5 h-5" />
                </button>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2.5 rounded-xl bg-gray-100/70 hover:bg-gray-200/70 text-foreground-muted hover:text-foreground transition-all duration-200"
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
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-3 space-y-1 shadow-xl shadow-gray-200/50 border border-white/80">
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md shadow-primary/25'
                        : 'text-foreground-muted hover:bg-gray-100/70 hover:text-foreground'
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
