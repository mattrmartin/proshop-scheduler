"use client";

import { useState } from "react";
import Link from "next/link";

import { RosterDrawer } from "./roster-drawer";

/** Kebab menu in the manager header: Roster (drawer) + Settings. */
export function AdminMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className="border-border text-muted-foreground hover:bg-muted flex size-9 cursor-pointer items-center justify-center rounded-full border"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="12" cy="19" r="1.6" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="panel absolute right-0 z-40 mt-2 w-40 overflow-hidden p-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setRosterOpen(true);
                setMenuOpen(false);
              }}
              className="hover:bg-muted w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm font-medium"
            >
              Roster
            </button>
            <Link
              href="/admin/settings"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-muted block rounded-lg px-3 py-2 text-sm font-medium"
            >
              Settings
            </Link>
          </div>
        </>
      )}

      <RosterDrawer open={rosterOpen} onClose={() => setRosterOpen(false)} />
    </div>
  );
}
