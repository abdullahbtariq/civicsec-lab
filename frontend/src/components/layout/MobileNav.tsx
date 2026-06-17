import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "../../lib/utils";
import { Logo } from "../brand/Logo";
import { Button } from "../ui/Button";
import { mainItems, moduleItems } from "./Sidebar";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const items = [...mainItems, ...moduleItems];

  return (
    <div className="border-b border-civic-line bg-civic-surface px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <Logo markSize={30} />
        <Button aria-label="Toggle navigation" onClick={() => setIsOpen((value) => !value)} variant="ghost">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen ? (
        <nav className="mt-3 grid gap-1" aria-label="Mobile">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-civic-teal/10 text-civic-teal"
                      : "text-civic-muted hover:bg-civic-raise hover:text-civic-text",
                  )
                }
                key={item.to}
                onClick={() => setIsOpen(false)}
                to={item.to}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}
