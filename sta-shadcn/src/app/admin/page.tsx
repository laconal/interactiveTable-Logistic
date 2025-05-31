"use client"

import { SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { UserInfo } from "../types"
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Order} from "../types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"
import { Check } from "lucide-react";
import { CheckedState } from "@radix-ui/react-checkbox";
import { Separator } from "@/components/ui/separator";
import STAValues from "../staData.json"

const ip = process.env.NEXT_PUBLIC_API

export default function page() {

    const router = useRouter()
    const token = localStorage.getItem("access_token")
    const [orders, setOrders] = useState<Order[]>([])
    
    const [checked, setChecked] = useState<CheckedState>(false)

    const temp = localStorage.getItem("userInfo")
    let userInfo: UserInfo | null = null;
    if (temp) userInfo = JSON.parse(temp) as UserInfo;

    useEffect(() => {
        document.title = "Admin panel"
        if (userInfo && userInfo.role !== "Admin") router.push('/')
        else {
            fetch(`${ip}/RCC/deleteRequests`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    const x = Object.values(data).flat() as Order[]
                    setOrders(x)
                    console.log(x)
                })
                .catch(error => {
                    console.error("Error while fetching", error)
                })
            }
    }, [])

    function deleteElement(id: number) {
        fetch(`${ip}/RCC/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => { if (response.status === 200)  setOrders(x => x.filter(x => x.id !== id)) })
        .catch(error => { console.error("Error while fetching", error) })
    }

    return (
        <div className="m-5 space-y-5">
            <h1><b>Запросы на удаление:</b></h1>
            {orders.length > 0 ? (
                <div className="flex items-center space-x-2">
                    <Checkbox id="selectAllOrders" checked={checked} onCheckedChange={setChecked}/>
                    <label
                        htmlFor="selectAllOrders"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >Выбрать все</label>
                    {checked ? (
                        <>
                            <Button className="bg-green-500" onClick={() => {
                                orders.map(x =>
                                    fetch(`${ip}/RCC/${x.id}`, {
                                        method: "DELETE",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}`
                                        }
                                    })
                                    .then(response => { if (response.status === 200)  setOrders(v => v.filter(v => v.id !== x.id)) })
                                    .catch(error => { console.error("Error while fetching", error) })
                                )
                            }}>Подтвердить</Button>
                            <Button className="bg-red-500" onClick={() => {
                                orders.map(x =>
                                    fetch(`${ip}/RCC/${x.id}`, {
                                        method: "PUT",
                                        headers: {
                                            "Content-Type": "application/json",
                                            "Authorization": `Bearer ${token}`
                                        },
                                        body: JSON.stringify({toDelete: false})
                                    })
                                    .then(response => { if (response.status === 200)  setOrders(v => v.filter(v => v.id !== x.id)) })
                                    .catch(error => { console.error("Error while fetching", error) })
                                )
                            }}>Отклонить</Button>
                        </>
                    ) : null}
                </div>
            ): null}
            <Table>
                <TableHeader className="bg-accent">
                    <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead className="w-[100px]">Клиент</TableHead>
                        <TableHead>Дата загрузки</TableHead>
                        <TableHead>Запросивший удаление</TableHead>
                        <TableHead>Действие</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length > 0 ? (
                        orders.map(x => 
                            <TableRow key={x.id}>
                                <TableCell>{x.id}</TableCell>
                                <TableCell>{x.client}</TableCell>
                                <TableCell>{x.loadDate}</TableCell>
                                <TableCell>{x.toDeleteRequest}</TableCell>
                                <TableCell>
                                    <div className="space-x-3">
                                        <Button className="bg-green-500" onClick={() => deleteElement(x.id)}>Подтвердить</Button>
                                        <Button className="bg-red-500" onClick={() => {
                                            fetch(`${ip}/RCC/${x.id}`, {
                                                method: "PUT",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    "Authorization": `Bearer ${token}`
                                                },
                                                body: JSON.stringify({toDelete: false})
                                            })
                                            .then(response => { if (response.status === 200)  setOrders(v => v.filter(v => v.id !== x.id)) })
                                            .catch(error => { console.error("Error while fetching", error) })
                                        }}>Отклонить</Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    ): (null)}
                </TableBody>
            </Table>

            <Separator/>
            
            {/* <div className="flex space-x-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Client managers</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {STAValues["clientManagers"].map((x) =>
                            <TableRow>
                                <TableCell className="font-medium">{x}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <div className="flex justify-center">
                        <SquarePlus className="stroke-current hover:text-green-500"/>   
                    </div>
                </Table>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Client's LE</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {STAValues["clientLE_List"].map((x) =>
                            <TableRow>
                                <TableCell className="font-medium">{x}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <div className="flex justify-center">
                        <SquarePlus className="stroke-current hover:text-green-500"/>   
                    </div>
                </Table>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Expeditors</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {STAValues["expeditors"].map((x) =>
                            <TableRow>
                                <TableCell className="font-medium">{x}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <div className="flex justify-center">
                        <SquarePlus className="stroke-current hover:text-green-500"/>   
                    </div>
                </Table>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[100px]">Contractors</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {STAValues["contractors"].map((x) =>
                            <TableRow>
                                <TableCell className="font-medium">{x}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    <div className="flex justify-center">
                        <SquarePlus className="stroke-current hover:text-green-500"/>   
                    </div>
                </Table>
            </div> */}
        </div>
    )
}    