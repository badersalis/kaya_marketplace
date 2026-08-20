"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useSession } from "@/context/SessionContext";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Gérant · Abidjan",
  LOGISTICS_PARTNER: "Partenaire · Niamey",
};

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const user = useSession();

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleLogout() {
    closeDropdown();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-abidjan-500 font-semibold text-white">
          {initial}
        </span>
        <span className="mr-1 hidden text-left sm:block">
          <span className="block font-medium text-theme-sm">{user.name}</span>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-1 pb-3">
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">{user.name}</span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg border-t border-gray-200 px-3 py-2 pt-4 text-left font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          Déconnexion
        </button>
      </Dropdown>
    </div>
  );
}
