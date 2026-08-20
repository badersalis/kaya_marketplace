"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useSession } from "../context/SessionContext";
import { ListIcon, BoxIconLine, GridIcon, BoxIcon, BoxCubeIcon, PlugInIcon, TaskIcon } from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const SUPER_ADMIN_ITEMS: NavItem[] = [
  { icon: <GridIcon />, name: "Accueil", path: "/" },
  { icon: <ListIcon />, name: "Commandes", path: "/orders" },
  { icon: <BoxIcon />, name: "Produits", path: "/products" },
  { icon: <TaskIcon />, name: "Réservations", path: "/reservations" },
  { icon: <BoxCubeIcon />, name: "Boutiques", path: "/stores" },
  { icon: <PlugInIcon />, name: "Mon hub", path: "/hub-setup" },
];

const PARTNER_ITEMS: NavItem[] = [
  { icon: <GridIcon />, name: "Accueil", path: "/" },
  { icon: <BoxIconLine />, name: "Livraisons", path: "/deliveries" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const user = useSession();

  // Exact match for "/" (otherwise every route would highlight it via startsWith).
  const isActive = useCallback((path: string) => (path === "/" ? pathname === "/" : pathname.startsWith(path)), [pathname]);
  const navItems = user.role === "SUPER_ADMIN" ? SUPER_ADMIN_ITEMS : PARTNER_ITEMS;
  const showLabel = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-abidjan-600 dark:text-abidjan-400">
            {showLabel ? "Kaya" : "K"}
          </span>
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                }`}
              >
                Menu
              </h2>
              <ul className="flex flex-col gap-4">
                {navItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      className={`menu-item group ${
                        isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                      }`}
                    >
                      <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                        {nav.icon}
                      </span>
                      {showLabel && <span className="menu-item-text">{nav.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
