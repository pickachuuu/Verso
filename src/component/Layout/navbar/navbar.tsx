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
        {/* Navbar container with claymorphism */}
        <div className="mx-4 mt-4">
          <div
            className="rounded-2xl px-4 sm:px-6 lg:px-8 py-3"
            style={{
              background: 'linear-gradient(145deg, rgba(248,250,255,0.95) 0%, rgba(240,244,255,0.92) 100%)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: [
                // Outer depth shadows
                '0 8px 32px -4px rgba(0, 0, 0, 0.08)',
                '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
                // Colored ambient glow
                '0 12px 40px -8px rgba(40, 69, 214, 0.07)',
                // Inner highlight for puffy top edge
                'inset 0 2px 0 rgba(248, 250, 255, 1)',
                // Inner bottom shadow for 3D depth
                'inset 0 -2px 6px rgba(0, 0, 0, 0.03)',
              ].join(', '),
              border: '1px solid rgba(221, 228, 255, 0.7)',
            }}
          >
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all"
                  style={{
                    background: 'linear-gradient(145deg, var(--primary-light) 0%, var(--primary) 60%, var(--primary-dark) 100%)',
                    boxShadow: [
                      '0 6px 16px -2px rgba(40, 69, 214, 0.45)',
                      '0 2px 4px rgba(0, 0, 0, 0.08)',
                      'inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                      'inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
                    ].join(', '),
                  }}
                >
                  <span className="text-white font-bold text-lg" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>M</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground-muted bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary-light transition-all hidden sm:block">
                  MemoForge
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center">
                <div
                  className="flex items-center rounded-xl p-1.5 gap-1"
                  style={{
                    background: 'linear-gradient(145deg, #e0e7ff 0%, #d4dcf5 100%)',
                    boxShadow: [
                      'inset 0 2px 6px rgba(0, 0, 0, 0.06)',
                      'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                      'inset 0 -1px 0 rgba(255, 255, 255, 0.7)',
                    ].join(', '),
                    border: '1px solid rgba(203, 213, 225, 0.5)',
                  }}
                >
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={index}
                        href={item.href}
                        className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                        style={isActive ? {
                          background: 'linear-gradient(145deg, #f8faff 0%, #f0f4ff 100%)',
                          color: 'var(--primary)',
                          boxShadow: [
                            '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
                            '0 2px 4px rgba(0, 0, 0, 0.04)',
                            // Colored glow for active state
                            '0 4px 16px -4px rgba(40, 69, 214, 0.2)',
                            // Inner highlights for puffy clay feel
                            'inset 0 1px 0 rgba(255, 255, 255, 1)',
                            'inset 0 -1px 2px rgba(0, 0, 0, 0.03)',
                          ].join(', '),
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                        } : {
                          color: 'var(--foreground-muted)',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'linear-gradient(145deg, rgba(240,244,255,0.7) 0%, rgba(224,231,255,0.5) 100%)';
                            e.currentTarget.style.color = 'var(--foreground)';
                            e.currentTarget.style.boxShadow = [
                              '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
                              'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                            ].join(', ');
                            e.currentTarget.style.border = '1px solid rgba(226, 232, 240, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.color = 'var(--foreground-muted)';
                            e.currentTarget.style.boxShadow = '';
                            e.currentTarget.style.border = '1px solid transparent';
                          }
                        }}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                {/* Sign Out */}
                <button
                  onClick={signOut}
                  className="p-2.5 rounded-xl transition-all duration-200 group/btn"
                  style={{
                    background: 'linear-gradient(145deg, #f8faff 0%, #f0f4ff 100%)',
                    boxShadow: [
                      '0 3px 8px rgba(0, 0, 0, 0.05)',
                      '0 1px 3px rgba(0, 0, 0, 0.03)',
                      'inset 0 1px 0 rgba(255, 255, 255, 1)',
                      'inset 0 -1px 2px rgba(0, 0, 0, 0.02)',
                    ].join(', '),
                    border: '1px solid rgba(226, 232, 240, 0.7)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(145deg, #FEF2F2 0%, #FEE2E2 100%)';
                    e.currentTarget.style.boxShadow = [
                      '0 4px 12px rgba(239, 68, 68, 0.12)',
                      '0 2px 4px rgba(0, 0, 0, 0.04)',
                      'inset 0 1px 0 rgba(255, 255, 255, 0.9)',
                      'inset 0 -1px 2px rgba(239, 68, 68, 0.05)',
                    ].join(', ');
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(145deg, #f8faff 0%, #f0f4ff 100%)';
                    e.currentTarget.style.boxShadow = [
                      '0 3px 8px rgba(0, 0, 0, 0.05)',
                      '0 1px 3px rgba(0, 0, 0, 0.03)',
                      'inset 0 1px 0 rgba(255, 255, 255, 1)',
                      'inset 0 -1px 2px rgba(0, 0, 0, 0.02)',
                    ].join(', ');
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.7)';
                    e.currentTarget.style.transform = '';
                  }}
                  aria-label="Sign out"
                >
                  <Logout01Icon className="w-5 h-5 text-foreground-muted group-hover/btn:text-red-500 transition-colors" />
                </button>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2.5 rounded-xl transition-all duration-200"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    background: 'linear-gradient(145deg, #f8faff 0%, #f0f4ff 100%)',
                    boxShadow: [
                      '0 3px 8px rgba(0, 0, 0, 0.05)',
                      '0 1px 3px rgba(0, 0, 0, 0.03)',
                      'inset 0 1px 0 rgba(255, 255, 255, 1)',
                      'inset 0 -1px 2px rgba(0, 0, 0, 0.02)',
                    ].join(', '),
                    border: '1px solid rgba(226, 232, 240, 0.7)',
                  }}
                >
                  {mobileMenuOpen ? (
                    <Cancel01Icon className="w-5 h-5 text-foreground-muted" />
                  ) : (
                    <Menu01Icon className="w-5 h-5 text-foreground-muted" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mx-4 mt-2">
            <div
              className="rounded-2xl p-3 space-y-1.5"
              style={{
                background: 'linear-gradient(165deg, rgba(248,250,255,0.97) 0%, rgba(240,244,255,0.95) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: [
                  '0 12px 40px -6px rgba(0, 0, 0, 0.1)',
                  '0 6px 16px -4px rgba(0, 0, 0, 0.06)',
                  '0 20px 50px -12px rgba(40, 69, 214, 0.08)',
                  'inset 0 2px 0 rgba(248, 250, 255, 1)',
                  'inset 0 -2px 6px rgba(0, 0, 0, 0.02)',
                ].join(', '),
                border: '1px solid rgba(221, 228, 255, 0.7)',
              }}
            >
              {navItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={isActive ? {
                      background: 'linear-gradient(145deg, var(--primary-light) 0%, var(--primary) 100%)',
                      color: '#ffffff',
                      boxShadow: [
                        '0 4px 14px -2px rgba(40, 69, 214, 0.4)',
                        '0 2px 4px rgba(0, 0, 0, 0.06)',
                        'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        'inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
                      ].join(', '),
                      textShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    } : {
                      color: 'var(--foreground-muted)',
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

    </>
  );
}
