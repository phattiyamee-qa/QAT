"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Project Overview" },
  { href: "/person", label: "Track by Person" },
  { href: "/new", label: "Add New Task" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100vh",
        minWidth: 1280,
        display: "flex",
        flexDirection: "column",
        background: "var(--shopee-color-bg-layout)",
      }}
    >
      <header
        style={{
          height: 56,
          flex: "none",
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "0 24px",
          background: "var(--shopee-color-white)",
          borderBottom: "1px solid var(--shopee-color-border)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image src="/shopee-logo.svg" alt="" width={24} height={24} />
          <span className="t-section-title">PMO Task Tracker</span>
        </div>
        <span
          style={{
            fontSize: 12,
            lineHeight: "16px",
            color: "var(--shopee-color-text-tertiary)",
            padding: "2px 8px",
            border: "1px solid var(--shopee-color-border)",
            borderRadius: 4,
            whiteSpace: "nowrap",
            flex: "none",
          }}
        >
          Sheet is source of truth · read-only sync
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="t-caption">Role</span>
          <select
            defaultValue="QA"
            disabled
            style={{
              height: 32,
              padding: "0 8px",
              border: "1px solid var(--shopee-color-border)",
              borderRadius: 4,
              fontSize: 14,
              color: "var(--shopee-color-text)",
              background: "var(--shopee-color-white)",
            }}
          >
            <option value="QA">QA</option>
            <option value="PM">PM (coming soon)</option>
            <option value="Manager">Manager (coming soon)</option>
          </select>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 16,
            borderLeft: "1px solid var(--shopee-color-border)",
          }}
          title="Google OAuth sign-in lands in a later phase"
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--shopee-chart-3)",
              color: "var(--shopee-color-white)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            ?
          </span>
          <span className="t-body">Not signed in</span>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", alignItems: "stretch", minHeight: 0 }}>
        <nav
          style={{
            width: 222,
            flex: "none",
            background: "var(--shopee-color-white)",
            borderRight: "1px solid var(--shopee-color-border)",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span
            style={{
              padding: "0 24px 8px",
              fontSize: 12,
              lineHeight: "16px",
              color: "var(--shopee-color-text-tertiary)",
            }}
          >
            QA Workspace
          </span>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 40,
                  padding: "0 24px",
                  borderLeft: active
                    ? "3px solid var(--shopee-color-primary)"
                    : "3px solid transparent",
                  background: active ? "var(--shopee-color-primary-bg)" : "transparent",
                  color: active ? "var(--shopee-color-primary-text-active)" : "var(--shopee-color-text)",
                  fontSize: 14,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <div
            style={{
              marginTop: 16,
              padding: "0 24px 8px",
              borderTop: "1px solid var(--shopee-color-border-secondary)",
              paddingTop: 16,
            }}
          >
            <span style={{ fontSize: 12, lineHeight: "16px", color: "var(--shopee-color-text-quaternary)" }}>
              PM and Manager views will slot in here.
            </span>
          </div>
        </nav>

        <main style={{ flex: 1, minWidth: 0, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
