"use client"

import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Order } from "../types";
import {useState, useEffect, useRef} from "react";
import { socket } from "../socket";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronsUpDown, Loader2, OctagonX } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import STAValues from "../staData.json"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"

interface UpdateCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Order;
  monthOrders: Order[],
  contractors: {contractor: string, contractorName: string, contractorLE: string}[],
  onSubmit: (data: Partial<Order> & {id: number}) => void;
}

const ip = process.env.NEXT_PUBLIC_API

const clientLE = STAValues["clientLE_List"]
const clientManagers = STAValues["clientManagers"]
const expeditors = STAValues["expeditors"]
// const contractors = STAValues["contractors"]

export function UpdateCardDialog({ open, onOpenChange, monthOrders, contractors, initialData, onSubmit }: UpdateCardDialogProps) {
  const token = localStorage.getItem("access_token")
  const { control, handleSubmit, reset, watch, getValues, setValue, formState : { dirtyFields, errors, isValid } } = useForm<Order>({
    defaultValues: initialData,
    mode: "onChange"
  });
  const [inputValues, setInputValues] = useState<{city: string[]; cargo: string[]}>({
    city: [],
    cargo: []
  })

  const [showSuggestions, setShowSuggestions] = useState({
    clients: false,
    clientLE: false,
    clientManager: false,
    expeditors: false,
    contractors: false
})

  const [comboboxOpen, setComboboxOpen] = useState({
    routeStart: false,
    routeEnd: false,
    transshipmentPoint: false,
    cargo: false
  })
  const [comboboxValue, setComboboxValue] = useState({
      routeStart: initialData.routeStart,
      routeEnd: initialData.routeStart,
      transshipmentPoint: initialData.transshipmentPoint,
      cargo: initialData.cargo
  })

  const brutto = watch("brutto") || '0'
  const netto = watch("netto") || '0'

  const vehicle = watch("vehicle")
  const vehicleExistsInOthers = vehicle &&
    monthOrders.some(
      (order) => order.id !== initialData.id && (order.vehicle?.trim() ?? '') === vehicle.trim()
    );

  const [clients, setClients] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const raw = typeof window !== "undefined" && localStorage.getItem("userInfo");
  const user = raw ? JSON.parse(raw) : null;
  const [count, setCount] = useState(0);
  const [viewers, setViewers] = useState<string[]>([]);
  const prevOrderRef = useRef<number | undefined>(0);
  const [calendarOpen, setCalendarOpen] = useState(false)

  useEffect(() => {
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

  useEffect(() => {
    if (open) {
      console.log(monthOrders)
      setIsLoading(true);
      // Reset the form with initialData
      reset(initialData);
      
      // Mark this specific order as loaded
      setOrderLoaded(true);
      
      // Fetch static values
      fetch(`${ip}/RCC/staticValues`, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        }
      })
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
        setIsLoading(false);
      })
      .catch(err => {
        console.log("Failed to fetch static values: ", err);
        setIsLoading(false);
      });
    } else {
      // Reset the loading state when dialog closes
      setOrderLoaded(false);
    }
  }, [open, initialData, reset, token]);

  
  useEffect(() => {
    const handler = ({ objectID, count, users }: any) => {
      if (objectID === initialData.id) {
        setCount(count);
        setViewers(users);
      }
    };
    socket.on("viewer:update", handler);
    return () => void socket.off("viewer:update", handler);
  }, [initialData.id]);

  useEffect(() => {
    if (!user) return;
    const payload = { objectID: initialData.id, username: user.username };

    if (open) {
      if (prevOrderRef.current && prevOrderRef.current !== initialData.id) {
        socket.emit("dialog:close", { objectID: prevOrderRef.current });
      }
      socket.emit("dialog:open", payload);
      prevOrderRef.current = initialData.id;
    } else {
      if (prevOrderRef.current) {
        socket.emit("dialog:close", { objectID: prevOrderRef.current });
        prevOrderRef.current = undefined;
      }
    }
  }, [open, initialData.id, user]);

  const onFormSubmit = (data: Order) => {
    const patch: Partial<Order> & { id: number } = { id: initialData.id };

    Object.keys(dirtyFields).forEach((key) => {
      // @ts-ignore
      patch[key] = getValues(key);
    });

    onSubmit(patch);

    if (prevOrderRef.current) {
      socket.emit("dialog:close", { objectID: prevOrderRef.current });
      prevOrderRef.current = undefined;
    }
    onOpenChange(false);
    setComboboxValue({
      routeStart: '',
      routeEnd: '',
      transshipmentPoint: '',
      cargo: ''
    })
  };

  useEffect(() => {
    if (netto?.includes('/')) {
      let parts = netto.split('/')
      setValue("profit", (parseInt(brutto) - parseInt(parts[0]) - parseInt(parts[1] || '0')).toString(), { shouldDirty: true})
    } else setValue("profit", (parseInt(brutto) - parseInt(netto)).toString(), { shouldDirty: true})
  }, [brutto, netto, setValue])

  function getContractorInvoiceID(contractor: string) {
    fetch(`${ip}/RCC/contractorID`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ contractor })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setValue("contractorInvoice", data["ID"], {
          shouldDirty: true
        })
      })
      .catch(error => {
        console.error("Error while fetching", error);
        throw error;  // re-throw so the caller sees the error
      });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[1000px]">
          {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Loader2/>
                <Progress value={45} className="w-64" />
                <p className="text-sm text-gray-500">Загрузка данных...</p>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Изменение данных: ID {initialData.id}</DialogTitle>
                  <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
                    <span>Редактируется:</span>
                    <div className="flex flex-wrap gap-1">
                      {viewers.map((name) => (
                        <Badge key={name}>{name}</Badge>
                      ))}
                    </div>
                  </div>
                  {/* <div className="grid gap-4 py-4 justify-center">
                      <div className="flex items-center gap-4">
                        <Label className="text-right">ID:</Label>
                        <h3 className="col-span-3">{initialData.id}</h3>
                        <Label className="text-right">Сделка:</Label>
                        <h3 className="col-span-3">{initialData.orderID}</h3>
                      </div>
                  </div> */}
                </DialogHeader>
                  <form onSubmit={handleSubmit(onFormSubmit)} autoComplete="off">
                  <ScrollArea className="h-[700px] pr-4">
                    <div className="grid gap-4 py-4 grid-cols-3">
                      <div className="space-y-2">
                        <Label>Клиент</Label>
                        <Controller
                          name="client"
                          control={control}
                          rules={{ required: 'Поле обязательно' }}
                          render={({ field, fieldState }) => (
                            <>
                              <Input
                                {...field}
                                className={
                                  fieldState.invalid
                                    ? 'col-span-3 border-red-500'
                                    : 'col-span-3'
                                }
                                // autoComplete="off"
                                onFocus={() => setShowSuggestions(s => ({ ...s, clients: true }))}
                                onBlur={() =>
                                  setTimeout(
                                    () =>
                                      setShowSuggestions(s => ({
                                        ...s,
                                        clients: false,
                                      })),
                                    100
                                  )
                                }
                              />
                              {fieldState.error && (
                                <p className="text-red-600 text-sm">
                                  {fieldState.error.message}
                                </p>
                              )}

                              {showSuggestions.clients && (
                                <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 max-h-70 overflow-y-auto shadow-md">
                                  {clients.filter((name) =>
                                    name.toLowerCase().includes(field.value.toLocaleLowerCase()) && name !== field.value)
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        field.onChange(name)
                                        setShowSuggestions(x => ({...x, clients: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                              )}
                            </>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Клиент менеджер</Label>
                        <Controller
                          name="clientManager"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                {...field}
                                onFocus={() => setShowSuggestions(s => ({ ...s, clientManager: true }))}
                                onBlur={() =>
                                  setTimeout(() => setShowSuggestions(s => ({...s, clientManager: false,})), 100)}
                              />

                              {showSuggestions.clientManager && (
                                <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 max-h-70 overflow-y-auto shadow-md">
                                  {clientManagers.filter((name) =>
                                    name.toLowerCase().includes(field.value.toLocaleLowerCase()) && name !== field.value)
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        field.onChange(name)
                                        setShowSuggestions(x => ({...x, clientManager: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                              )}
                            </>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ЮЛ клиента</Label>
                        {/* <Controller
                          name="client_sLegalEntity"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        /> */}
                        <Controller
                          name="client_sLegalEntity"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                {...field}
                                value={field.value || ''}
                                onFocus={() => setShowSuggestions(s => ({ ...s, clientLE: true }))}
                                onBlur={() =>
                                  setTimeout(() => setShowSuggestions(s => ({...s, clientLE: false,})), 100)}
                              />

                              {showSuggestions.clientLE && (
                                <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 max-h-70 overflow-y-auto shadow-md">
                                  {clientLE.filter((name) =>
                                    name.toLowerCase().includes((field.value ?? '').toLocaleLowerCase()) && name !== field.value)
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        field.onChange(name)
                                        setShowSuggestions(x => ({...x, clientLE: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                              )}
                            </>
                          )}
                        />
                      </div>
                      
                      {/* Route information */}
                      <div className="space-y-2">
                        <Label>Пункт отправки</Label>
                        <Controller
                          name="routeStart"
                          control={control}
                          render={({ field }) => (
                            <Popover open={comboboxOpen.routeStart} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, routeStart: isOpen}))}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen.routeStart}
                                        >{field.value || comboboxValue.routeStart || "Выберите город отправки"}
                                        <ChevronsUpDown className="opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0">
                                    <Command>
                                    <CommandInput placeholder="Поиск груза" className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>Такого груза. Добавьте через функции</CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                                        {inputValues.city.map((x) => (
                                            <CommandItem
                                              key={x}
                                              value={x}
                                              onSelect={(currentValue) => {
                                                  setComboboxValue((x) => ({...x, routeStart: currentValue}));
                                                  setComboboxOpen((x) => ({...x, routeStart: false}));
                                                  field.onChange(currentValue)
                                              }}
                                            >{x}</CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                          )
                        }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Пункт назначения</Label>
                        <Controller
                          name="routeEnd"
                          control={control}
                          render={({ field }) => (

                            <Popover open={comboboxOpen.routeEnd} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, routeEnd: isOpen}))}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen.routeEnd}
                                        >{field.value || comboboxValue.routeEnd || "Выберите город прибытия"}
                                        <ChevronsUpDown className="opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[350px] p-0">
                                    <Command>
                                    <CommandInput placeholder="Поиск груза" className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>Такого груза. Добавьте через функции</CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                                        {inputValues.city.map((x) => (
                                            <CommandItem
                                              key={x}
                                              value={x}
                                              onSelect={(currentValue) => {
                                                  setComboboxValue((x) => ({...x, routeEnd: currentValue}));
                                                  setComboboxOpen((x) => ({...x, routeEnd: false}));
                                                  field.onChange(currentValue)
                                              }}
                                            >{x}</CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                          )
                        }
                        />
                      </div>
                      
                      {/* Cargo information */}
                      <div className="space-y-2">
                        <Label>Груз</Label>
                        <Controller
                          name="cargo"
                          control={control}
                          render={({field}) => (

                            <Popover open={comboboxOpen.cargo} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, cargo: isOpen}))}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={comboboxOpen.cargo}
                                        >{field.value || comboboxValue.cargo || "Выберите груз"}
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
                                                  setComboboxValue((x) => ({...x, cargo: currentValue}));
                                                  setComboboxOpen((x) => ({...x, cargo: false}));
                                                  field.onChange(currentValue)
                                              }}
                                            >{x}</CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Пункт перегруза</Label>
                          <Controller
                            name="transshipmentPoint"
                            control={control}
                            render={({field}) => (
                              <div className="flex items-center justify-items-center space-x-2">
                                <Popover open={comboboxOpen.transshipmentPoint} onOpenChange={(isOpen) => setComboboxOpen((x) => ({...x, transshipmentPoint: isOpen}))}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={comboboxOpen.transshipmentPoint}
                                            >{field.value || comboboxValue.transshipmentPoint || "Выберите пункт перегруза"}
                                            <ChevronsUpDown className="opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[350px] p-0">
                                        <Command>
                                        <CommandInput placeholder="Поиск груза" className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Такого груза. Добавьте через функции</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                                            {inputValues.city.map((x) => (
                                                <CommandItem
                                                  key={x}
                                                  value={x}
                                                  onSelect={(currentValue) => {
                                                      setComboboxValue((x) => ({...x, transshipmentPoint: currentValue}));
                                                      setComboboxOpen((x) => ({...x, transshipmentPoint: false}));
                                                      field.onChange(currentValue)
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
                                      field.onChange(null)
                                }}/>
                              </div>
                            )}
                          />
                      </div>

                      <div className="space-y-2">
                        <Label>Дата загрузки</Label>
                        <Controller
                            name="loadDate"
                            control={control}
                            rules={{ required: "Пожалуйста, выберите дату" }}
                            render={({ field }) => {
                              const selected = field.value ? new Date(field.value) : undefined
                              return (
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn("w-[240px] justify-start text-left font-normal")}>
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {selected 
                                        ? format(selected, "PPP", { locale: ru }) 
                                        : <span>Выберите дату</span>
                                      }
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      locale={ru}
                                      mode="single"
                                      selected={selected}
                                      onSelect={(date) => {
                                        if (date) {
                                          const iso = format(date, "yyyy-MM-dd")
                                          // field.onChange(date.toISOString().split("T")[0])
                                          field.onChange(iso)
                                        } else {
                                          field.onChange(null)
                                        }
                                        setCalendarOpen(false)
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              )
                            }}
                          />
                      </div>
                      
                      
                      
                      {/* Financial information */}
                      
                      
                      <div className="space-y-2">
                        <Label>Брутто USD</Label>
                        <Controller
                          name="brutto"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Нетто USD</Label>
                        <Controller
                          name="netto"
                          control={control}
                          render={({ field }) => 
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Input {...field} value={field.value || ''} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                    <p>Если маршрут с перегрузом: <b>первое плечо/второе плечо</b></p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            }
                        />
                      </div>
                      
                      
                      <div className="space-y-2">
                        <Label>Профит USD</Label>
                        <Controller
                          name="profit"
                          control={control}
                          render={({ field }) => (<Input {...field} 
                            readOnly
                            className="bg-gray-200"
                            value={field.value || '0'}
                             />)}
                        />
                      </div>
                      
                      
                      {/* Vehicle and order information */}
                      <div className="space-y-2">
                        <Label>Транспорт</Label>
                        <Controller
                          name="vehicle"
                          control={control}
                          // render={({ field }) => <Input {...field} value={field.value || ''} />}
                          render={({ field }) => (
                            <div className="grid space-x-2">
                              <Input
                                {...field}
                                value={field.value || ''}
                                className={vehicleExistsInOthers ? "border-yellow-400" : ""}
                              />
                              {vehicleExistsInOthers && (<p className="text-yellow-400">Этот ТС уже используется</p>  )}
                            </div>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Сделка</Label>
                        <Controller
                          name="orderID"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Заявка</Label>
                        <Controller
                          name="applicationID"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        />
                      </div>
                      
                      
                      
                      {/* Contractor information */}
                      <div className="space-y-2">
                        <Label>Экспедитор</Label>
                        {/* <Controller
                          name="expeditor"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        /> */}
                        <Controller
                          name="expeditor"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                {...field}
                                value={field.value || ''}
                                onFocus={() => setShowSuggestions(s => ({ ...s, expeditors: true }))}
                                onBlur={() =>
                                  setTimeout(() => setShowSuggestions(s => ({...s, expeditors: false,})), 100)}
                              />

                              {showSuggestions.expeditors && (
                                <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 max-h-70 overflow-y-auto shadow-md">
                                  {expeditors.filter((name) =>
                                    name.toLowerCase().includes((field.value ?? '').toLocaleLowerCase()) && name !== field.value)
                                    .map((name, idx) => (
                                    <li
                                        key={idx}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                        field.onChange(name)
                                        setShowSuggestions(x => ({...x, expeditors: false}))
                                        }}
                                    >
                                        {name}
                                    </li>
                                    ))}
                                </ul>
                              )}
                            </>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Счет подрядчика</Label>
                        <Controller
                          name="contractorInvoice"
                          control={control}
                          render={({ field }) => 
                            <div>
                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                                  <Input {...field} value={field.value || ''} />
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  {contractors.map(x => 
                                    <ContextMenuItem onClick={() => {
                                      getContractorInvoiceID(x.contractor);
                                      setValue("contractor", x.contractorName);
                                      setValue("contractorLegalEntity", x.contractorLE);
                                    }}>{x.contractor} - {x.contractorName}</ContextMenuItem>  
                                  )}
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                        }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Подрядчик</Label>
                        {/* <Controller
                          name="contractor"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        /> */}
                        <Controller
                          name="contractor"
                          control={control}
                          render={({ field }) => (
                            <>
                              <Input
                                {...field}
                                value={field.value || ''}
                                onFocus={() => setShowSuggestions(s => ({ ...s, contractors: true }))}
                                onBlur={() =>
                                  setTimeout(() => setShowSuggestions(s => ({...s, contractors: false,})), 100)}
                              />

                              {showSuggestions.contractors && (
                                <ul className="max-w-[300px] absolute z-10 bg-white border rounded mt-1 max-h-70 overflow-y-auto shadow-md">
                                  {contractors
                                    .filter((name) =>
                                      name.contractorName.toLowerCase().includes((field.value ?? '').toLowerCase()) &&
                                      name.contractorName !== field.value
                                    )
                                    .map((x) => (
                                      <li
                                        key={x.contractor} // ✅ Required for React list rendering
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        onMouseDown={() => {
                                          field.onChange(x);
                                          setShowSuggestions((prev) => ({ ...prev, contractors: false }));
                                        }}
                                      >
                                        {x.contractorName}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </>
                          )}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>ЮЛ подрядчика</Label>
                        <Controller
                          name="contractorLegalEntity"
                          control={control}
                          render={({ field }) => <Input {...field} value={field.value || ''} />}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Дополнительные расходы</Label>
                        <Controller
                          name="additionalExpenses"
                          control={control}
                          render={({ field }) => <Textarea {...field} value={field.value || ''} />}
                        />
                      </div>
                      
                      {/* Cargo type and other fields */}
                      <div className="space-y-2">
                        <Label>Тип груза</Label>
                        <Controller
                          name="cargoType"
                          control={control}
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
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
                          )}
                        />
                      </div>
                    </div>
                    <Accordion type="single" collapsible>
                      <AccordionItem value="item-1">
                        <AccordionTrigger>Дополнительное (Тыкните)</AccordionTrigger>
                        <AccordionContent>
                            <div className="grid gap-4 py-4 grid-cols-3">
                              <div className="space-y-2">
                                <Label>Совместная сделка</Label>
                                <Controller
                                  name="cooperativeOrder"
                                  control={control}
                                  render={({ field }) => <Input {...field} value={field.value || ''} />}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Сумма на клиента</Label>
                                <Controller
                                  name="sumOnClient"
                                  control={control}
                                  render={({ field }) => <Input {...field} value={field.value || ''} />}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Акты и счета</Label>
                                <Controller
                                  name="actsAndInvoices"
                                  control={control}
                                  render={({ field }) => <Input {...field} value={field.value || ''} />}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Дата выгр/погр по CMR</Label>
                                <Controller
                                  name="deliverDateByCMR"
                                  control={control}
                                  render={({ field }) => <Input type="date" {...field} value={field.value || ''} />}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>КН</Label>
                                <Controller
                                  name="kn"
                                  control={control}
                                  render={({ field }) => (
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    />
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Код ТНВЭД</Label>
                                <Controller
                                  name="tnved"
                                  control={control}
                                  render={({ field }) => (
                                    <Input 
                                      type="number" 
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                    />
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Инвойс страховки Клиента</Label>
                                <Controller
                                  name="client_sInsuranceID"
                                  control={control}
                                  render={({ field }) => (
                                    <Input  
                                      {...field} 
                                      value={field.value || ''} 
                                      onChange={(e) => field.onChange(e.target.value)}
                                    />
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Заметки</Label>
                                <Controller
                                  name="notes"
                                  control={control}
                                  render={({ field }) => <Textarea {...field} value={field.value || ''} />}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Зарубежная сделка</Label>
                                <Controller
                                  name="foreignOrder"
                                  control={control}
                                  render={({ field }) => (
                                    <Switch 
                                      className="m-2" 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange} 
                                    />
                                  )}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label>Заменить ТС</Label>
                                <Controller
                                  name="needToChangeVehicle"
                                  control={control}
                                  render={({ field }) => (
                                    <Switch 
                                      className="m-2" 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange} 
                                    />
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Изменить брутто</Label>
                                <Controller
                                  name="needToChangeBrutto"
                                  control={control}
                                  render={({ field }) => (
                                    <Switch 
                                      className="m-2" 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange} 
                                    />
                                  )}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Изменить нетто</Label>
                                <Controller
                                  name="needToChangeNetto"
                                  control={control}
                                  render={({ field }) => (
                                    <Switch 
                                      className="m-2" 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange} 
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                </ScrollArea>
                <div className="flex justify-end">
                  <Button className="bg-green-600 hover:bg-green-500 max-w-[100px]"
                    disabled={!!errors.client} type="submit">Сохранить</Button>
                </div>
                </form>
              </>
            )}
        </DialogContent>
    </Dialog>
  );
}
