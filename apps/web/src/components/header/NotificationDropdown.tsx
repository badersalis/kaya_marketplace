"use client";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { api } from "@/lib/apiClient";
import { Notification, Paginated } from "@/lib/types";

const POLL_INTERVAL_MS = 15000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.floor(hours / 24)} j`;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  async function refreshCount() {
    try {
      const res = await api.get<{ count: number }>("/notifications/unread-count");
      setCount(res.count);
    } catch {
      // best-effort polling; ignore transient failures
    }
  }

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  async function toggleDropdown() {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      try {
        const result = await api.get<Paginated<Notification>>("/notifications?limit=15");
        setNotifications(result.items.filter((n) => n.channel === "IN_APP"));
      } catch {
        // ignore
      }
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function markRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n)));
      refreshCount();
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {count > 0 && (
          <span className="absolute right-0 top-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-handoff-400 px-1 text-[10px] font-semibold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notifications</h5>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-gray-400">
              Aucune notification pour le moment.
            </li>
          )}
          {notifications.map((n) => (
            <li key={n.id}>
              <DropdownItem
                onItemClick={() => markRead(n.id)}
                className={`flex flex-col gap-1 rounded-lg border-b border-gray-100 p-3 px-3.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                  n.status === "READ" ? "opacity-60" : ""
                }`}
              >
                <span className="font-medium text-gray-800 dark:text-white/90">{n.title}</span>
                <span className="text-theme-xs text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</span>
                <span className="text-theme-xs text-gray-400">{timeAgo(n.createdAt)}</span>
              </DropdownItem>
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
}
