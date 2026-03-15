"use client"

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
    const [user, setUser] = useState<{ isLoggedIn: boolean; role: string | null } | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (error) {
                console.error("Failed to fetch auth status", error);
            }
        }
        checkAuth();
    }, []);

    const getDashboardLink = () => {
        if (!user?.isLoggedIn) return "/login";
        if (user.role === "COORDINATOR") return "/coordinator/dashboard";
        return "/admin"; // SUPERADMIN or STAFF
    }

    return (
        <>
            <footer className="w-full py-4 mb-4 text-center text-[10px] font-bold text-gray-800 flex justify-center gap-6 bg-[#FFF9ED] relative z-50">
                <Link href="/privacy" className="hover:text-[#162B40] cursor-pointer">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#162B40] cursor-pointer">Terms of Service</Link>
                <Link href="/about" className="hover:text-[#162B40] cursor-pointer">About Us</Link>
                {user && (
                    <Link href={getDashboardLink()} className="hover:text-[#162B40] cursor-pointer">
                        {user.isLoggedIn ? "Dashboard" : "Login"}
                    </Link>
                )}
                {!user && <Link href="/login" className="hover:text-[#162B40] cursor-pointer">Login</Link>}
            </footer>
            <div className="text-center text-[9px] text-gray-500 pb-6 font-medium">
                © Jamia Raheemiyya
                <br />
                Developed by <Link href="https://jazeelwayanad.me" target="_blank" className="hover:text-[#162B40] cursor-pointer">Jazeel Wayanad</Link>
            </div>
        </>
    )
}
