import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useEffect, useState } from "react";


const ip = process.env.NEXT_PUBLIC_API

interface ChangesHistory {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  id: number;
  token?: string;
}

interface History {
    history_date: string,
    history_user: string,
    history_type: string,
    changed_fields: string[],
    snapshot: Record<string, any>
}

const FIELD_LABELS: Record<string, string> = {
    "client": "Клиент",
    "foreignOrder": "Зарубженая сделка",
    "clientManager": "Клиент-менеджер",
    "client_sLegalEntity": "ЮЛ клиента",
    "routeStart": "Пункт отправки",
    "routeEnd": "Пункт назначения",
    "transshipmentPoint": "Пункт перегруза",
    "cargo": "Груз",
    "tnved": "Код ТНВЭД",
    "loadDate": "Дата загрузки",
    "cooperativeOrder": "Совместная сделка",
    "sumOnClient": "Сумма на клиента",
    "brutto": "Брутто $",
    "netto": "Нетто $",
    "kn": "КН",
    "profit": "Профит",
    "deliverDateByCMR": "Дата погр/выгр по CMR",
    "vehicle": "ТС",
    "orderID": "Сделка",
    "applicationID": "Заявка",
    "actsAndInvoices": "Акты и инвойсы",
    "expeditor": "Экспедитор",
    "contractorInvoice": "Счет подрядчика",
    "contractor": "Подрядчик",
    "contractorLegalEntity": "ЮЛ подрядчика",
    "additionalExpenses": "Дополнительные расходы",
    "notes": "Заметки",
    "orderStatus": "Статус сделки",
    "client_sInsuranceID": "Номер страховки клиента",
    "applicationAttached": "Заявка прикреплена",
    "contractorInvoiceSent": "Счет подрядчика отправлен",
    "cancelled": "Сделка отменена",
    "needToChangeVehicle": "Изменить ТС",
    "needToChangeBrutto": "Изменить Брутто",
    "needToChangeNetto": "Изменить Нетто",
    "cargoType": "Тип груза",
    "addedToDB_time": "Время создания", 
    "createdByUser": "Создан",
    "history_date": "Время изменения",
    "history_type": "Тип изменения",
    "history_user": "Изменен",
    "toDelete": "Запрос на удаление"
}

const HIDDEN_FIELDS = [
    "history_id",
    "history_type",
    "history_change_reason"
]

type FieldChange = {
    date: string;
    user: string;
    from: any;
    to: any;
}

type GroupedHistory = Record<string, FieldChange[]>

function formatValue(value: any): string {
    if (value === null || value === undefined || value === "") return "Пусто";
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    return String(value);
  }

function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })
}

function groupHistoryByField(history: History[]): GroupedHistory {
    const grouped: GroupedHistory = {};
    for (const entry of history) {
        if (entry.history_type === "~") {
            for (const field of entry.changed_fields) {
                if (HIDDEN_FIELDS.includes(field)) continue;

                if (!grouped[field]) {
                    grouped[field] = [];
                }

                grouped[field].push({
                    date: entry.history_date,
                    user: entry.history_user,
                    from: entry.snapshot[field]?.from,
                    to: entry.snapshot[field]?.to
                });
            }
        }
    }
    return grouped;
}

export function ChangesHistoryDialog({ open, onOpenChange, id, token}: ChangesHistory) {
    const [history, setHistory] = useState<History[]>([])
    useEffect(() => {
        if (open && id && token) {
            fetch(`${ip}/RCC/history/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            })
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setHistory(data)
                } else {
                    console.error("Unexpected response", data)
                }
            })
            .catch((err) => console.error("Failed to fetch history", err))
        }
    }, [open, id, token])
    const creationEntry = history.find(h => h.history_type === "+");
    const grouped = groupHistoryByField(history)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[1000px]">
                <DialogHeader>
                    <DialogTitle>История изменений ID: {id}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[700px] pr-4">
                <Accordion type="multiple">
                    {/* 🟢 Creation Snapshot */}
                    {creationEntry && (
                    <AccordionItem value="creation">
                        <AccordionTrigger>
                        Создание — {formatDateTime(creationEntry.history_date)} от {creationEntry.history_user}
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="text-sm space-y-1">
                            {Object.entries(creationEntry.snapshot)
                            .filter(([key]) => !HIDDEN_FIELDS.includes(key))
                            .map(([key, val]) => (
                                <div key={key}>
                                <strong>{FIELD_LABELS[key] || key}:</strong> {formatValue(val)}
                                </div>
                            ))}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                    )}

                    {/* 🟡 Grouped Field Changes */}
                    {Object.entries(grouped).map(([field, changes]) => (
                    <AccordionItem key={field} value={field}>
                        <AccordionTrigger>
                        {FIELD_LABELS[field] || field}
                        </AccordionTrigger>
                        <AccordionContent>
                        <ul className="text-sm pl-4 list-disc">
                            {changes.map((change, i) => (
                            <li key={i}>
                                {formatDateTime(change.date)} от {change.user}:{" "}
                                {formatValue(change.from)} → {formatValue(change.to)}
                            </li>
                            ))}
                        </ul>
                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}