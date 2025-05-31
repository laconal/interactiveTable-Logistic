"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
  } from "@/components/ui/dialog"
import { Order } from "../types"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DialogAdditionalInfo {
    order: Order,
    modalOpenStatus: boolean,
    changeOpenStatus: (modalOpenStatus: boolean) => void
}

export function DialogAdditionalInformation({modalOpenStatus, changeOpenStatus, order}: DialogAdditionalInfo) {
    return (
        <Dialog open={modalOpenStatus}
            onOpenChange={changeOpenStatus}>
                <DialogContent className="min-w-[500px] max-w-[1000px]">
                    <DialogHeader>
                        <DialogTitle>ID: {order.id} --- Сделка: {order.orderID || "Отсутсвует"}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[700px] pr-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <DialogTitle>Пункт перегруза:</DialogTitle>
                                <DialogDescription>{order.transshipmentPoint || "Отсвутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Зарубежная сделка:</DialogTitle>
                                <DialogDescription>{order.foreignOrder ? "Да" : "Нет"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Тип груза:</DialogTitle>
                                <DialogDescription>{order.cargoType}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>ТНВЭД:</DialogTitle>
                                <DialogDescription>{order.tnved || "Отсвутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Совместная сделка:</DialogTitle>
                                <DialogDescription>{order.cooperativeOrder || "Отсвутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Акты и счета:</DialogTitle>
                                <DialogDescription>{order.actsAndInvoices || "Отсутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Инвойск страховки Клиента:</DialogTitle>
                                <DialogDescription>{order.client_sInsuranceID || "Отсутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Дополнительные расходы:</DialogTitle>
                                <DialogDescription className="whitespace-pre-line">{order.additionalExpenses || "Отсутствует"}</DialogDescription>
                            </div>
                            <div className="space-y-2">
                                <DialogTitle>Заметки:</DialogTitle>
                                <DialogDescription>{order.notes || "Отсутствует"}</DialogDescription>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogClose asChild>
                        <div className="flex justify-end"> 
                            <Button className="max-w-[100px]" onClick={() => changeOpenStatus(false)}>Закрыть</Button>
                        </div>
                    </DialogClose>
                </DialogContent>
        </Dialog>
    )
}