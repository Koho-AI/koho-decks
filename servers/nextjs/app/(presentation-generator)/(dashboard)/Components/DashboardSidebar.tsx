"use client";

import React from "react";
import { LayoutDashboard, Star, Brain, Settings, Palette } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KohoDecksWordmark from "@/components/KohoDecksWordmark";
import SidebarUserMenu from "@/components/SidebarUserMenu";



export const defaultNavItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { key: "templates" as const, label: "Standard", icon: Star },
    { key: "designs" as const, label: "Smart", icon: Brain },



];
export const BelongingNavItems = [
    { key: "settings" as const, label: "Settings", icon: Settings },
]

const DashboardSidebar = () => {


    const pathname = usePathname();
    const activeTab = pathname.split("?")[0].split("/").pop();
    const router = useRouter();




    return (
        <aside
            className="sticky top-0 h-screen w-[115px] flex flex-col justify-between bg-[#F6F6F9] backdrop-blur border-r border-slate-200/60 px-4  py-8"
            aria-label="Dashboard sidebar"
        >
            <div>

                <div onClick={() => router.push("/dashboard")} className="flex items-center  pb-6 border-b border-slate-200/60   gap-2    ">
                    <div className="cursor-pointer flex justify-center items-center mx-auto" aria-label="Koho Decks" title="Koho Decks">
                        {/* Mark-only (sidebar is 115px wide — no room for the full wordmark) */}
                        <svg width="36" height="36" viewBox="0 0 146 146" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path opacity="0.28" d="M69.7283 2.00867C97.5808 -1.2363 128.528 18.2335 137.812 49.0607C147.096 79.8879 133.17 112.338 103.77 125.317C75.9177 138.297 38.7811 131.807 17.1181 110.715C-4.54491 89.6228 -4.54491 52.3057 10.9287 27.9684C26.4023 3.63115 41.8758 5.25364 69.7283 2.00867Z" fill="#00C278"/>
                            <path opacity="0.52" d="M79.0125 26.3459C99.1626 23 119.244 36.0809 122.339 58.7956C125.433 81.5104 113.054 102.603 92.9387 109.093C72.8231 115.583 51.16 105.848 41.8759 88.0003C32.5917 70.153 37.2338 47.4382 52.7074 36.0809C63.5389 27.9684 69.6626 27.5 79.0125 26.3459Z" fill="#00C278"/>
                            <path opacity="0.7" d="M83.6546 52.3056C96.6626 49.5 108.412 55.5506 109.96 71.7754C111.507 88.0003 100.676 99.3577 86.7494 100.98C72.8231 102.603 60.4443 92.8677 58.8969 78.2654C57.3495 63.663 65.9169 56.1315 83.6546 52.3056Z" fill="#00C278"/>
                            <path d="M86.7821 57.6665C94.6626 56.5 100.825 59.8486 101.699 69.2115C102.572 78.5745 99.1428 83.7302 91.2821 84.6665C83.4214 85.6028 74.6555 80.0931 73.7821 71.6665C72.9087 63.2399 76.7821 58.6665 86.7821 57.6665Z" fill="#00C278"/>
                        </svg>
                    </div>
                </div>
                <nav className="pt-6 font-syne" aria-label="Dashboard sections">
                    <div className="  space-y-6">

                        {/* Dashboard */}
                        <Link
                            prefetch={false}
                            href={`/dashboard`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/dashboard" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Dashboard"
                            title="Dashboard"
                        >
                            <LayoutDashboard className={["h-4 w-4", pathname === "/dashboard" ? "text-[#00C278]" : "text-slate-600"].join(" ")} />
                            <span className="text-[11px] text-slate-800">Dashboard</span>
                        </Link>
                        <Link
                            prefetch={false}
                            href={`/templates`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/templates" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Templates"
                            title="Templates"
                        >
                            <div className="flex flex-col cursor-pointer tex-center items-center gap-2  transition-colors">
                                <Star className={`h-4 w-4 ${pathname === "/templates" ? "text-[#00C278]" : "text-slate-600"}`} />
                                <span className="text-[11px] text-slate-800">Templates</span>
                            </div>
                        </Link>
                        <Link
                            prefetch={false}
                            href={`/theme`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors",
                                pathname === "/theme" ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label="Theme"
                            title="Theme"
                        >
                            <div className="flex flex-col cursor-pointer tex-center items-center gap-2  transition-colors">
                                <Palette className={`h-4 w-4 ${pathname === "/theme" ? "text-[#00C278]" : "text-slate-600"}`} />
                                <span className="text-[11px] text-slate-800">Themes</span>
                            </div>
                        </Link>
                    </div>
                </nav>
            </div>

            <div className=" pt-5 border-t border-slate-200/60  font-syne "
            >
                {BelongingNavItems.map(({ key, label: itemLabel, icon: Icon }) => {
                    const isActive = activeTab === key;
                    return (
                        <Link
                            prefetch={false}
                            key={key}
                            href={`/${key}`}
                            className={[
                                "flex flex-col tex-center items-center gap-2  transition-colors ",
                                isActive ? "" : "ring-transparent",
                            ].join(" ")}
                            aria-label={itemLabel}
                            title={itemLabel}
                        >
                            <Icon className={["h-4 w-4", isActive ? "text-[#00C278]" : "text-slate-600"].join(" ")} />
                            <span className="text-[11px] text-slate-800">{itemLabel}</span>
                        </Link>
                    );
                })}

                <div className="pt-4 mt-2 border-t border-slate-200/60">
                    <SidebarUserMenu />
                </div>

            </div>

        </aside>
    );
};

export default DashboardSidebar;


