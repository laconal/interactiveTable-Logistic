import { Car, ChartArea, FileText, Ship, LogOut, LogIn } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { Separator } from "./ui/separator"
import { UserInfo } from "@/app/types"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { te } from "date-fns/locale"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import auth from "@/app/loginPage/auth"
import { GalleryVerticalEnd } from "lucide-react"
import { useEffect, useState } from "react"

const ip = process.env.NEXT_PUBLIC_API

const items = [
  {
    title: "Route Complete Cargo",
    url: "RCC",
    icon: Car,
  },
  {
    title: "Statistics",
    url: "Statistics",
    icon: ChartArea
  }
]


export function AppSidebar() {
  const router = useRouter();
  const temp = localStorage.getItem("userInfo");
  const token = localStorage.getItem("access_token")
  let userInfo: UserInfo | null = null;
  if (temp) userInfo = JSON.parse(temp) as UserInfo;

  const [orderYears, setOrderYears] = useState<number[]>([])

  useEffect(() => {
    if (token) {
      fetch(`${ip}/RCC/years`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then((data) => {
          setOrderYears(data)
        })
        .catch(error => console.error("Fetch error:", error));
    }
  }, [])

  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex">
            <SidebarGroupLabel 
              onClick={() => router.push('/')}
              className="text-purple-700 font-extrabold text-2xl cursor-pointer">EV(I)L Company</SidebarGroupLabel>
          </div>
          <Separator className="mt-2 mb-2"/>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span className="font-bold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {orderYears.length > 1 && (item.url == "RCC" || item.url == "Statistics") ? (
                    <SidebarMenuSub>
                      {orderYears.map((year) => 
                        <SidebarMenuSubItem key={year}>
                          <SidebarMenuSubButton asChild onClick={() => router.push(`${item.url}?year=${year}`)}>
                            <p>{year}</p>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  ): null}
                </SidebarMenuItem>
              ))}
              {userInfo?.role === "Admin" ? (
                <SidebarMenuItem key="admin">
                  <SidebarMenuButton asChild>
                    <a href='admin'>
                      <span className="font-bold">Admin</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (null)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {temp ? (
            <div className="flex space-x-2 items-center">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              </Avatar>
              <b>{userInfo?.username}</b>
              <div onClick={() => {
                auth.logout();
                router.push('/');
              }} className="cursor-pointer">
                <LogOut/>
              </div>
            </div>
          ) : (
            <div className="cursor-pointer" onClick={() => router.push('/loginPage')}>
              <LogIn/>
            </div>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
