"use client"

import {Roboto} from "next/font/google"
import {useState, useEffect} from "react"
import { Toaster } from "@/components/ui/sonner"
import auth from "./loginPage/auth"
import "./globals.css";
import { usePathname, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const ip = process.env.NEXT_PUBLIC_API

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [userInfo, setUserInfo] = useState({
        id: 0,
        username: '',
        department: '',
        role: ''
    })
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathName = usePathname()

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = auth.getAccessToken()
                if (!token) {
                    setIsAuthenticated(false)
                    return router.push("/loginPage")
                }

                const response = await fetch(`${ip}/api/token/me/`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    credentials: "include"
                })

                if (response.ok) {
                    const userData = await response.json()
                    setUserInfo(userData)
                    setIsAuthenticated(true)
                    localStorage.setItem("userInfo", JSON.stringify(userData))
                    
                } else {
                    try {
                        await auth.refreshToken()
                        checkAuth()
                    } catch (refreshToken) {
                        setIsAuthenticated(false)
                        router.push("/loginPage")
                    }
                }
            } catch (error) {
                console.error("Authentication error", error)
                setIsAuthenticated(false)
                router.push("/loginPage")
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    if (loading) {
        return (
            <html lang="en">
            <body className="flex items-center justify-center min-h-screen">
                <div className="w-1/2">
                <Progress value={60} max={100} />
                <p className="text-center mt-4">Checking authentication...</p>
                </div>
            </body>
            </html>
        )
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 overflow-auto">
                <SidebarTrigger />
                <Toaster />
                {children}
            </main>
        </SidebarProvider>
    )
}
