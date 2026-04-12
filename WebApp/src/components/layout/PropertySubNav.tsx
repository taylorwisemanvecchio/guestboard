"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PropertySubNavProps {
  propertyId: string;
}

const tabs = [
  { label: "Overview", href: "" },
  { label: "Calendar", href: "/calendar" },
  { label: "Recommendations", href: "/recommendations" },
  { label: "Devices", href: "/devices" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

export function PropertySubNav({ propertyId }: PropertySubNavProps) {
  const pathname = usePathname();
  const basePath = `/properties/${propertyId}`;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="flex gap-1 px-6">
        {tabs.map((tab) => {
          const href = `${basePath}${tab.href}`;
          const isActive =
            tab.href === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition",
                isActive
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
