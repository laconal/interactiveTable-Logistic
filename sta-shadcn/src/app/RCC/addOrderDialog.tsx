"use client"

import {useEffect, useState, useRef, useMemo } from "react"
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
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Order } from "../types"
import { toast } from "sonner"
import { SelectGroup } from "@radix-ui/react-select"
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import STAValues from "../staData.json"
import { OctagonX } from "lucide-react"

interface DialogOrderInterface {
    modalOpenStatus: boolean,
    changeOpenStatus: (status: boolean) => void,
    setStaticValue: (value: string) => void,
    staticValueModal: boolean,
    addStaticValue: (status: boolean) => void,
    onRefresh: () => void,
    trigger: any
}

const ip = process.env.NEXT_PUBLIC_API

export const DialogAddOrder: React.FC<DialogOrderInterface> = ({modalOpenStatus, changeOpenStatus, setStaticValue, addStaticValue, staticValueModal, trigger, onRefresh}) => {
    const token = localStorage.getItem("access_token")
    const [inputValues, setInputValues] = useState<{city: string[]; cargo: string[]}>({
        city: [],
        cargo: []
    })
    const [clients, setClients] = useState<string[]>([])

    const [newOrder, setNewOrder] = useState<Order>({               // Placeholder for auto-generated ID (you can set it to 0 initially if you're planning to create a new one)
        id: 0,
        client: '',                            // Заказчик
        clientManager: '',                     // Клиент менеджер
        client_sLegalEntity: null,             // ЮЛ Клиента (nullable)
        routeStart: null,                      // Пункт отправки (nullable)
        routeEnd: null,     
        transshipmentPoint: '',                   // Пункт назначения (nullable)
        cargo: null,                           // Груз (nullable)
        tnved: null,                           // ТНВЭД (nullable)
        loadDate: '',                        // Дата загрузки (nullable)
        cooperativeOrder: null,               // Совместная сделка (nullable)
        sumOnClient: null,                     // Сумма на Клиента (nullable)
        brutto: null,                          // Брутто $
        netto: null,                           // Нетто $
        kn: null,                              // КН (nullable)
        profit: null,                          // Профит (nullable)
        deliverDateByCMR: null,                // Дата погр/выгр по CMR (nullable)
        vehicle: null,                         // Номер ТС (nullable)
        orderID: null,                         // Номер сделки (nullable)
        applicationID: null,                   // Заявка (nullable)
        actsAndInvoices: null,                 // АКТЫ и СЧЕТА (nullable)
        expeditor: null,                       // Экспедитор (nullable)
        contractorInvoice: null,               // Счет подрядчика (nullable)
        contractor: null,                      // Подрядчика (nullable)
        contractorLegalEntity: null,           // ЮЛ Подрядчика (nullable)
        additionalExpenses: null ,
        cancelled: false,              // Доп. расходы (nullable)
        notes: null,
        orderStatus: "empty",
        applicationAttached: false,
        contractorInvoiceSent: false,
        needToChangeVehicle: false,
        needToChangeBrutto: false,
        needToChangeNetto: false,
        cargoType: "Комплектный",
        foreignOrder: false,
        toDelete: false
    });
    
    const [requiredFields, setRequiredFields] = useState({
        client: false,
        loadDate: false
    })
    const [showSuggestions, setShowSuggestions] = useState({
        clients: false,
        clientLE: false,
        clientManager: false,
        cityStart: false,
        cityEnd: false,
        cargo: false,
        expeditors: false,
        contrators: false
    })
    const date = newOrder.loadDate ? new Date(newOrder.loadDate) : undefined
    const [calendarOpen, setCalendarOpen] = useState(false)
   
    const [comboboxOpen, setComboboxOpen] = useState({
        routeStart: false,
        routeEnd: false,
        transshipmentPoint: false,
        cargo: false
    })
    const [comboboxValue, setComboboxValue] = useState({
        routeStart: '',
        routeEnd: '',
        transshipmentPoint: '',
        cargo: ''
    })

    const clientManagers = STAValues["clientManagers"]
    const clientLE = STAValues["clientLE_List"]
    const expeditors = STAValues["expeditors"]

    useEffect(() => {
        fetch(`${ip}/RCC/staticValues`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            }})
            .then(response => response.json())
            .then(data => {
                // setInputValues((x) => ({
                //     city: data.city ? Object.keys(data.city) : [],
                //     cargo: data.cargo ? Object.keys(data.cargo) : []
                // }))
                const sortedCities = data.city
                    ? Object.keys(data.city).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                    : []
                const sortedCargo = data.cargo
                    ? Object.keys(data.cargo).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                    : []
                setInputValues({
                    city: sortedCities,
                    cargo: sortedCargo
                })
            })
            .catch(err => console.log("Failed to fetch static values: ", err))
        fetch(`${ip}/RCC/clients`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${token}`
            }})
            .then(res => res.json())
            .then(data => setClients(data))
            .catch(err => console.error("Failed to load clients:", err))
    }, [])

    const totalProfit = useMemo(() => {
        const brutto  = parseInt(newOrder.brutto || '0', 10) || 0
        let parts = []
        let resultProfit = ''
        if (newOrder.netto?.includes('/')) {
            parts = newOrder.netto.split('/')
            resultProfit = (brutto - parseInt(parts[0] || '0', 10) - parseInt(parts[1] || '0', 10)).toString()
        } else {
            resultProfit = (brutto - parseInt(newOrder.netto || '0', 10)).toString()
        }
        setNewOrder({...newOrder, profit: resultProfit})
        return resultProfit
    }, [newOrder.brutto, newOrder.netto])


    useEffect(() => {
        if (!staticValueModal) {
            fetch(`${ip}/RCC/staticValues`, {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                }})
                .then(response => response.json())
                .then(data => {
                    const sortedCities = data.city
                        ? Object.keys(data.city).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                        : []
                    const sortedCargo = data.cargo
                        ? Object.keys(data.cargo).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                        : []
                    setInputValues({
                        city: sortedCities,
                        cargo: sortedCargo
                    })
                })
                .catch(err => console.log("Failed to fetch static values: ", err))
        }
    }, [staticValueModal])
        
        return (
            <Dialog open={modalOpenStatus} onOpenChange={(isOpen) => {
                changeOpenStatus(isOpen)
                setComboboxValue({routeStart: '', routeEnd: '', transshipmentPoint: '', cargo: ''})
                setRequiredFields({"client": false, "loadDate": false})
                setNewOrder({       
                    id: 0,   // Placeholder for auto-generated ID (you can set it to 0 initially if you're planning to create a new one)
                    client: '',                            // Заказчик
                    clientManager: '',                     // Клиент менеджер
                    client_sLegalEntity: null,             // ЮЛ Клиента (nullable)
                    routeStart: null,                      // Пункт отправки (nullable)
                    routeEnd: null,                        // Пункт назначения (nullable)
                    cargo: null,                           // Груз (nullable)
                    tnved: null,                           // ТНВЭД (nullable)
                    loadDate: '',                        // Дата загрузки (nullable)
                    cooperativeOrder: null,               // Совместная сделка (nullable)
                    sumOnClient: null,                     // Сумма на Клиента (nullable)
                    brutto: null,                          // Брутто $
                    netto: null,                           // Нетто $
                    kn: null,                              // КН (nullable)
                    profit: null,                          // Профит (nullable)
                    deliverDateByCMR: null,                // Дата погр/выгр по CMR (nullable)
                    vehicle: null,                         // Номер ТС (nullable)
                    orderID: null,                         // Номер сделки (nullable)
                    applicationID: null,                   // Заявка (nullable)
                    actsAndInvoices: null,                 // АКТЫ и СЧЕТА (nullable)
                    expeditor: null,                       // Экспедитор (nullable)
                    contractorInvoice: null,               // Счет подрядчика (nullable)
                    contractor: null,                      // Подрядчика (nullable)
                    contractorLegalEntity: null,           // ЮЛ Подрядчика (nullable)
                    additionalExpenses: null ,
                    cancelled: false,              // Доп. расходы (nullable)
                    notes: null,
                    orderStatus: "empty",
                    applicationAttached: false,
                    contractorInvoiceSent: false,
                    needToChangeVehicle: false,
                    needToChangeBrutto: false,
                    needToChangeNetto: false,
                    cargoType: 'Комплектный',
                    foreignOrder: false,
                    toDelete: false
                });
            }}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent className="sm:max-w-[1200px]">
                    <DialogHeader>
                    <DialogTitle>Новая строка</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
                        <div className="space-y-2">
                            <Label className="text-right">Клиент</Label>
                            <Input
                                className={requiredFields.client ? "col-span-3" : "col-span-3 border-red-500"}
                                value={newOrder.client}
                                onFocus={() => setShowSuggestions(x => ({...x, clients: true}))}
                                onBlur={() => setTimeout(() =>  setShowSuggestions(x => ({...x, clients: false})), 100)}
                                onChange={(e) => {
                                    if (e.target.value.trim()) {
                                        setRequiredFields({ ...requiredFields, client: true });
                                    } else {setRequiredFields({ ...requiredFields, client: false });}
                                    setNewOrder({ ...newOrder, client: e.target.value})
                                }}
                            />
                            {showSuggestions.clients && (
                                <ul className="max-w-[300px] max-h-[300px] absolute z-10 bg-white border rounded mt-1 w-full overflow-y-auto shadow-md">
                                {clients.filter((name) =>
                                    name.toLowerCase().includes(newOrder.client.toLowerCase()) && name !== newOrder.client
                                    )
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        setNewOrder({ ...newOrder, client: name });
                                        setShowSuggestions(x => ({...x, clients: false}));
                                        setRequiredFields({ ...requiredFields, client: true });
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right">Клиент-менеджер</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.clientManager}
                                onFocus={() => setShowSuggestions(x => ({...x, clientManager: true}))}
                                onBlur={() => setTimeout(() =>  setShowSuggestions(x => ({...x, clientManager: false})), 100)}
                                onChange={(e) => setNewOrder({ ...newOrder, clientManager: e.target.value })}
                            />
                            {showSuggestions.clientManager && (
                            <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                                {clientManagers.filter((name) =>
                                    name.toLowerCase().includes((newOrder.clientManager ?? '').toLowerCase()) && name !== newOrder.clientManager
                                    )
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        setNewOrder({ ...newOrder, clientManager: name });
                                        setShowSuggestions(x => ({...x, clientManager: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">ЮЛ Клиента</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.client_sLegalEntity || ''}
                                onFocus={() => setShowSuggestions(x => ({...x, clientLE: true}))}
                                onBlur={() => setTimeout(() =>  setShowSuggestions(x => ({...x, clientLE: false})), 100)}
                                onChange={(e) => setNewOrder({ ...newOrder, client_sLegalEntity: e.target.value || null })}
                            />
                            {showSuggestions.clientLE && (
                            <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                                {clientLE.filter((name) =>
                                    name.toLowerCase().includes((newOrder.client_sLegalEntity ?? '').toLowerCase()) && name !== newOrder.client_sLegalEntity
                                    )
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        setNewOrder({ ...newOrder, client_sLegalEntity: name });
                                        setShowSuggestions(x => ({...x, clientLE: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Пункт отправки</Label>
                            <div className="flex items-center justify-items-center space-x-2">
                                <Popover open={comboboxOpen.routeStart} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, routeStart: isOpen}))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen.routeStart}
                                        className="w-[250px] justify-between"
                                        >
                                        {comboboxValue.routeStart || "Выберите пункт отправки"}
                                        <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0">
                                        <Command>
                                        <CommandInput placeholder="Поиск города" className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Такого города нету. Добавьте через функции</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {inputValues.city.map((x) => (
                                                <CommandItem
                                                    key={x}
                                                    value={x}
                                                    onSelect={(currentValue) => {
                                                        setComboboxValue((x) => ({...x, routeStart: currentValue}))
                                                        setComboboxOpen((x) => ({...x, routeStart: false}));
                                                        setNewOrder({ ...newOrder, routeStart: currentValue})
                                                    }}
                                                >{x}</CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Button onClick={() => {
                                    setStaticValue("city")
                                    addStaticValue(true)
                                }}>+</Button>
                                <OctagonX
                                    className="transition-transform duration-100 hover:scale-120"
                                    onClick={() => {
                                        setComboboxValue(x => ({...x, routeStart: ''}))
                                        setNewOrder(x => ({...x, routeStart: ''}))
                                    }}
                                />
                            </div>
                            
                            {/* <Input
                                className="col-span-3"
                                value={newOrder.routeStart || ''}
                                onFocus={() => setShowSuggestions(x => ({...x, cityStart: true}))}
                                onBlur={() => setTimeout(() => setShowSuggestions(x => ({...x, cityStart: false})), 100)}
                                onChange={(e) => setNewOrder({ ...newOrder, routeStart: e.target.value || null })}
                            />
                            {showSuggestions.cityStart && (
                            <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                                {inputValues.city.filter((name) =>
                                    name.toLowerCase().includes((newOrder.routeStart ?? '').toLowerCase()) && name !== newOrder.routeStart
                                    )
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        setNewOrder({ ...newOrder, routeStart: name });
                                        setShowSuggestions(x => ({...x, cityStart: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                            )} */}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Пункт назначения</Label>
                            <div className="flex items-center justify-items-center space-x-2">
                                <Popover open={comboboxOpen.routeEnd} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, routeEnd: isOpen}))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen.routeEnd}
                                        className="w-[300px] justify-between"
                                        >
                                        {comboboxValue.routeEnd || "Выберите пункт отправки"}
                                        <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0">
                                        <Command>
                                        <CommandInput placeholder="Поиск города" className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Такого города нету. Добавьте через функции</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {inputValues.city.map((x) => (
                                                <CommandItem
                                                key={x}
                                                value={x}
                                                onSelect={(currentValue) => {
                                                    setComboboxValue((x) => ({...x, routeEnd: currentValue}))
                                                    setComboboxOpen((x) => ({...x, routeEnd: false}))
                                                    setNewOrder({ ...newOrder, routeEnd: currentValue})
                                                }}
                                                >{x}</CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <OctagonX
                                    className="transition-transform duration-100 hover:scale-120"
                                    onClick={() => {
                                        setComboboxValue(x => ({...x, routeEnd: ''}))
                                        setNewOrder(x => ({...x, routeEnd: ''}))
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Груз</Label>
                            <div className="flex space-x-2">
                                <Popover open={comboboxOpen.cargo} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, cargo: isOpen}))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen.cargo}
                                            className="w-[300px] justify-between"
                                            >{comboboxValue.cargo || "Выберите груз"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0">
                                        <Command>
                                        <CommandInput placeholder="Поиск груза" className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Такого груза. Добавьте через функции</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {inputValues.cargo.map((x) => (
                                                <CommandItem
                                                key={x}
                                                value={x}
                                                onSelect={(currentValue) => {
                                                    setComboboxValue((x) => ({...x, cargo: currentValue}))
                                                    setComboboxOpen((x) => ({...x, cargo: false}))
                                                    setNewOrder({ ...newOrder, cargo: currentValue})
                                                }}
                                                >{x}</CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Button onClick={() => {
                                    setStaticValue("cargo")
                                    addStaticValue(true)
                                }}>+</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Пункт перегруза</Label>
                            <div className="flex items-center justify-items-center space-x-2">
                                <Popover open={comboboxOpen.transshipmentPoint} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, transshipmentPoint: isOpen}))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen.transshipmentPoint}
                                            className="w-[300px] justify-between"
                                        >
                                        {comboboxValue.transshipmentPoint || "Выберите пункт перегруза"}
                                        <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0">
                                        <Command>
                                        <CommandInput placeholder="Поиск города" className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Такого города нету. Добавьте через функции</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {inputValues.city.map((x) => (
                                                <CommandItem
                                                    key={x}
                                                    value={x}
                                                    onSelect={(currentValue) => {
                                                        setComboboxValue((x) => ({...x, transshipmentPoint: currentValue}))
                                                        setComboboxOpen((x) => ({...x, transshipmentPoint: false}));
                                                        setNewOrder({ ...newOrder, transshipmentPoint: currentValue})
                                                    }}
                                                >{x}</CommandItem>
                                            ))}
                                            </CommandGroup>
                                        </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <OctagonX
                                    className="transition-transform duration-100 hover:scale-120"
                                    onClick={() => {
                                        setComboboxValue(x => ({...x, transshipmentPoint: ''}))
                                        setNewOrder(x => ({...x, transshipmentPoint: ''}))
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Дата загрузки</Label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground",
                                        !requiredFields.loadDate && "border-red-500"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date 
                                        ? format(date, "PPP", { locale: ru }) 
                                        : <span>Выберите дату</span>
                                        }
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        locale={ru}
                                        mode="single"
                                        selected={date}
                                        onSelect={(selected) => {
                                            if (selected) {
                                                const iso = format(selected, "yyyy-MM-dd")
                                                setNewOrder((o) => ({ ...o, loadDate: iso }))
                                                setRequiredFields((f) => ({ ...f, loadDate: true }))
                                            } else {
                                                setNewOrder((o) => ({ ...o, loadDate: '' }))
                                                setRequiredFields((f) => ({ ...f, loadDate: false }))
                                            }
                                            setCalendarOpen(false)
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                            {/* <Input
                                className={requiredFields.loadDate ? "col-span-3" : "col-span-3 border-red-500"}
                                type="date"
                                value={newOrder.loadDate || ''}
                                onChange={(e) => {
                                    setNewOrder({ ...newOrder, loadDate: e.target.value || null })
                                    if (e.target.value.trim()) {
                                        setRequiredFields({ ...requiredFields, loadDate: true });
                                    } else {setRequiredFields({ ...requiredFields, loadDate: false });}
                                }}
                            /> */}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Сумма на Клиента</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.sumOnClient || ''}
                                onChange={(e) => setNewOrder({ ...newOrder, sumOnClient: e.target.value || null })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Брутто USD</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.brutto || ''}
                                onChange={(e) => setNewOrder({ ...newOrder, brutto: e.target.value || null })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Нетто USD</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Input
                                            className="col-span-3"
                                            value={newOrder.netto || ''}
                                            onChange={(e) => setNewOrder({ ...newOrder, netto: e.target.value || null })}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>Если маршрут с перегрузом: <b>первое плечо/второе плечо</b></p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">КН USD</Label>
                            <Input
                                className="col-span-3"
                                type="number"
                                value={newOrder.kn || ''}
                                onChange={(e) => setNewOrder({ ...newOrder, kn: e.target.value ? parseInt(e.target.value) : null })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Профит USD</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Input
                                            readOnly
                                            className="col-span-3 bg-gray-200"
                                            value={totalProfit}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>Как считается профит: <b>Брутто - (общее Нетто)</b></p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        

                        <div className="space-y-2">
                            <Label className="text-right">Номер транспорта</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.vehicle || ''}
                                onChange={(e) => setNewOrder({ ...newOrder, vehicle: e.target.value || null })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Экспедитор</Label>
                            <Input
                                className="col-span-3"
                                value={newOrder.expeditor || ''}
                                onFocus={() => setShowSuggestions(x => ({...x, expeditors: true}))}
                                onBlur={() => setTimeout(() => setShowSuggestions(x => ({...x, expeditors: false})), 100)}
                                onChange={(e) => setNewOrder({ ...newOrder, expeditor: e.target.value || null })}
                            />
                            {showSuggestions.expeditors && (
                            <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-md">
                                {expeditors.filter((name) =>
                                    name.toLowerCase().includes((newOrder.expeditor ?? '').toLowerCase()) && name !== newOrder.expeditor
                                    ).map((name, idx) => (
                                        <li
                                            key={idx}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={() => {
                                            setNewOrder({ ...newOrder, expeditor: name });
                                            setShowSuggestions(x => ({...x, expeditors: false}))
                                            }}
                                        >
                                            {name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-right">Тип груза</Label>
                            <Select defaultValue="Комплектный"
                                onValueChange={(e) => setNewOrder({...newOrder, cargoType: e })}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Тип груза" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem value="Комплектный">Комплектный</SelectItem>
                                        <SelectItem value="Сборный">Сборный</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Зарубежная сделка</Label>
                                <Switch 
                                className="m-2" 
                                checked={newOrder.foreignOrder} 
                                onCheckedChange={(e) => setNewOrder({ ...newOrder, foreignOrder: e })} 
                                />
                        </div>

                        
                    </div>
                    <DialogFooter>
                        <Button 
                            disabled={ 
                                requiredFields.client === false ||
                                requiredFields.loadDate === false
                            }
                            className="bg-green-600 hover:bg-green-500" type="submit"
                            onClick={() => {
                                const { id, ...dataWithoutID} = newOrder
                                fetch(`${ip}/RCC/add`, {
                                    method: "POST", 
                                    body: JSON.stringify(dataWithoutID,
                                        (_, value) => typeof value === "string" ? value.trimEnd() : value
                                    ),
                                    headers: {
                                        'Content-Type': 'application/json',
                                        "Authorization": `Bearer ${token}`
                                    }})
                                    .then(response => {
                                        if (response.ok) {
                                            toast.success("Создана новая строка", {
                                                description: `Сделка с клиентом ${newOrder.client} создана`,
                                                position: "top-right"
                                                })
                                            onRefresh();
                                        }
                                        if (!response.ok) {
                                        throw new Error(`HTTP error! Status: ${response.status}`);
                                        }
                                        return response.json(); // Otherwise, parse as JSON
                                    }) 
                                    .then((data) => console.log(data))
                                    .catch(error => {
                                        console.error("Error while fetching", error)
                                    })
                                setNewOrder({       
                                    id: 0,   
                                    client: '',                            
                                    clientManager: '',                     
                                    client_sLegalEntity: null,             
                                    routeStart: null,                      
                                    routeEnd: null,                        
                                    cargo: null,                           
                                    tnved: null,                           
                                    loadDate: '',                        
                                    cooperativeOrder: null,               
                                    sumOnClient: null,                     
                                    brutto: null,                          
                                    netto: null,                           
                                    kn: null,                              
                                    profit: null,                          
                                    deliverDateByCMR: null,                
                                    vehicle: null,                         
                                    orderID: null,                         
                                    applicationID: null,                   
                                    actsAndInvoices: null,                 
                                    expeditor: null,                       
                                    contractorInvoice: null,               
                                    contractor: null,             
                                    contractorLegalEntity: null,  
                                    additionalExpenses: null ,
                                    cancelled: false,             
                                    notes: null,
                                    orderStatus: "empty",
                                    applicationAttached: false,
                                    contractorInvoiceSent: false,
                                    needToChangeVehicle: false,
                                    needToChangeBrutto: false,
                                    needToChangeNetto: false,
                                    cargoType: 'Комплектный',
                                    foreignOrder: false,
                                    toDelete: false
                                });
                                changeOpenStatus(false)
                                setRequiredFields({
                                    client: false,
                                    loadDate: false
                                })
                            }}>Подтвердить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
}