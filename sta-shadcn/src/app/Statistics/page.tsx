"use client"

import { useEffect, useMemo, useState} from "react"
import { Order } from "../types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Info } from "lucide-react"
import { useRouter, useSearchParams, useServerInsertedHTML } from "next/navigation"

interface Stat<K extends string> {
  name:  K;
  count: number;
}

interface RouteMetrics {
  minBrutto: number;
  avgBrutto: number;
  maxBrutto: number;
  minNetto:  number;
  avgNetto:  number;
  maxNetto:  number;
}

const ip = process.env.NEXT_PUBLIC_API

const monthNames = [
    "Январь",    
    "Февраль",   
    "Март",      
    "Апрель",    
    "Май",       
    "Июнь",      
    "Июль",      
    "Август",    
    "Сентябрь",  
    "Октябрь",   
    "Ноябрь",    
    "Декабрь"    
];
const convertMonthTotal = (monthYear: string): string => {
    const date = new Date(monthYear);
    if (isNaN(date.getTime())) return "Неверная дата"; // Invalid date check

    const month = date.getMonth(); // 0–11
    const year = date.getFullYear();

    return `${monthNames[month]} ${year}`;
};

const convertMonth = (monthYear: string): {month: string, year: string} => {
    const [month, year] = monthYear.split("-");
    const monthIndex = parseInt(month, 10) - 1;
    // return `${monthNames[monthIndex]}`;
    return {
        "month": monthNames[monthIndex],
        "year": year
    }
};

export default function mainPage() {
    const year = useSearchParams().get("year")
    const token = localStorage.getItem("access_token")
    const [flatOrders, setFlatOrders] = useState<Order[]>([])
    const [clients, setClients] = useState<string[]>([])
    const [months, setMonths] = useState<string[]>([])
    const [years, setYears] = useState<number[]>([])
    const [selectedClient, setSelectedClient] = useState<string>("all")
    const [selectedMonth, setSelectedMonth] = useState<string>("all")
    const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

    useEffect(() => {
        document.title = "Statistics"
        const yearUrl = year ? `?year=${year}` : ""
        fetch(`${ip}/RCC${yearUrl}`, {
            method: 'GET',
            headers: {
                "Content-Type": 'application/json',
                Authorization: `Bearer ${token}`,
            }, 
        })
        .then(res => res.json())
        .then(data => {
            const temp = (Object.values(data) as Order[][])  
                .flat()                                      
                .filter((o): o is Order => !o.cancelled);
            setFlatOrders(temp)

            const uClients = Array.from(new Set(temp.map(order => order.client)))
            setClients(uClients)

            const tempMonths = Object.keys(data) as string[]
            setMonths(tempMonths)
        })

        fetch(`${ip}/RCC/years`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then((data) => {
          setYears(data)
        })
        .catch(error => console.error("Fetch error:", error));
    }, [year])

    const filteredOrders = useMemo(
        () => flatOrders.filter(o => {
            const [year, month] = o.loadDate!.split('-')
            const monthKey = `${month}-${year}`;
            return (
                (selectedClient === 'all' || o.client === selectedClient) &&
                (selectedMonth === 'all'  || monthKey === selectedMonth)
            )
        }),[flatOrders, selectedClient, selectedMonth]
    );

    const {
        groupedClients,
        groupedRoutes,
        groupedExpeditors,
        groupedCM,
        groupedCargos,
        total,
    } = useMemo(() => {
        // 1) filter by client one time
        const filtered = flatOrders.filter(o => {
            const [year, month] = o.loadDate!.split('-')
            const monthKey = `${month}-${year}`;
            return (
                (selectedClient === "all" || o.client === selectedClient) &&
                (selectedMonth === "all" || monthKey === selectedMonth)
            )
        });

        const total = filtered.length;

        type Stat<K extends string> = { name: K; count: number };
        function buildStats<K extends string>(
            items: Order[],
            keyFn: (item: Order) => K | undefined
        ): Stat<K>[] {
            const map = new Map<K, number>();
            for (const it of items) {
                const key = keyFn(it);
                if (!key) continue;
                    map.set(key, (map.get(key) ?? 0) + 1);
                }
                return Array
                    .from(map.entries(), ([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count);
        }

        const groupedClients = buildStats(
            filtered,
            o => o.client
        )

        const groupedRoutes = buildStats(
            filtered,
            o => (o.routeStart && o.routeEnd) 
                ? `${o.routeStart} - ${o.routeEnd}` as const 
                : undefined
        );

        const groupedExpeditors = buildStats(
            filtered,
            o => o.expeditor ?? undefined
        );

        const groupedCM = buildStats(
            filtered,
            o => o.clientManager ?? undefined
        )

        const groupedCargos = buildStats(
            filtered,
            o => o.cargo ?? undefined
        );

        return { groupedClients, groupedRoutes, groupedExpeditors, groupedCM, groupedCargos, total };
    }, [flatOrders, selectedClient, selectedMonth]);

    
    const routeMetrics = useMemo<RouteMetrics | null>(() => {
        if (!selectedRoute) return null;
        const [start, end] = selectedRoute.split(' - ');

        const ordersForRoute = filteredOrders.filter(o => o.routeStart === start && o.routeEnd === end);

        // const parseNum = (s: string) => parseFloat(s.replace(/[^0-9.-]+/g, ''));

        const parseNum = (s: string) => {
            if (!s) return 0;
            const numStr = s.split('/')[0].trim();
            const num = parseFloat(numStr);
            return isNaN(num) ? 0 : num;
        };

        const minValue = (arr: number[]) => {
            if (arr.length === 0) return 0;

            const nonZero = arr.filter(n => n > 0)
            if (nonZero.length > 0) return Math.min(...nonZero)
            return 0
        }

        const bruttoVals = ordersForRoute
            .map(o => parseNum(o.brutto || '0'))
            .filter(n => !isNaN(n));
        const nettoVals = ordersForRoute
            .map(o => parseNum(o.netto || '0'))
            .filter(n => !isNaN(n));

        const sum = (arr: number[]) => arr.reduce((a,b) => a + b, 0) || 0;
        const avg = (arr: number[]) => arr.length ? sum(arr)/arr.length : 0;

        return {
            // minBrutto: bruttoVals.length > 0 ? Math.min(...bruttoVals) : 0,
            minBrutto: minValue(bruttoVals),
            avgBrutto: avg(bruttoVals),
            maxBrutto: bruttoVals.length > 0 ? Math.max(...bruttoVals) : 0,
            // minNetto:  nettoVals.length > 0 ? Math.min(...nettoVals) : 0,
            minNetto: minValue(nettoVals),
            avgNetto:  avg(nettoVals),
            maxNetto:  nettoVals.length > 0 ? Math.max(...nettoVals) : 0,
        };
    }, [selectedRoute, filteredOrders]);

    const [clientTotal, setClientTotal] = useState({
        totalOrders: 0,
        perMonth: [] as {
            month: string,
            totalBrutto: number,
            totalNetto: number
        } [],
        totalBrutto: 0,
        totalNetto: 0
    })

    useEffect(() => {
        if (!flatOrders.length || selectedClient === "all") {
            setClientTotal({
                totalOrders: 0,
                perMonth: [],
                totalBrutto: 0,
                totalNetto: 0
            });
            return;
        }

        const parseNum = (s: string | null | undefined) => {
            if (!s) return 0;
            const numStr = s.split('/')[0].trim();
            const num = parseFloat(numStr);
            return isNaN(num) ? 0 : num;
        };

        const clientOrders = flatOrders.filter(order => order.client === selectedClient);
        let totalBrutto = 0;
        let totalNetto = 0;

        const monthlyMap: Record<string, { brutto: number; netto: number }> = {};

        clientOrders.forEach(order => {
            const brutto = parseNum(order.brutto);
            const netto = parseNum(order.netto);
            totalBrutto += brutto;
            totalNetto += netto;

            if (order.loadDate) {
                const month = convertMonthTotal(order.loadDate);
                if (!monthlyMap[month]) {
                    monthlyMap[month] = { brutto: 0, netto: 0 };
                }
                monthlyMap[month].brutto += brutto;
                monthlyMap[month].netto += netto;
            }
        });

        const perMonth = Object.entries(monthlyMap)
            .map(([month, values]) => ({
                month,
                totalBrutto: values.brutto,
                totalNetto: values.netto
            }))
            .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());

        setClientTotal({
            totalOrders: clientOrders.length,
            perMonth,
            totalBrutto,
            totalNetto
        });

    }, [selectedClient]);

    return (
        <div className="ml-5 grid space-y-5">
        
            <div className="flex space-x-4">
                <div className="grid">
                    <b>Клиент</b>
                    <Select defaultValue="all" value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Клиент" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {clients.map((x) => 
                                <SelectItem value={x}>{x}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid">
                    <b>Месяц</b>
                    <Select defaultValue="all" value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Месяц" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {months.map((x) => 
                                <SelectItem value={x}>{convertMonth(x).month}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* <div className="grid">
                    <b>Год</b>
                    <Select disabled={years.length == 1} defaultValue="all" value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Год" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{years.length == 1 ? years[0] : "Все"}</SelectItem>
                            {years.length > 1 && years.map((x) => 
                                <SelectItem value={x.toString()}>{x}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div> */}
            </div>

            <Separator />

            <div className="flex space-x-10">
                <Card className="min-w-[200px]">
                    <CardHeader>
                        <CardDescription>Количество сделок</CardDescription>
                        <CardTitle className="text-2xl"><b>{total}</b></CardTitle>
                    </CardHeader>
                </Card>

                <Card className="min-w-[200px]">
                    <CardHeader>
                        <CardTitle>Минимальное</CardTitle>
                        <CardDescription>брутто</CardDescription>
                        <CardTitle><b>{
                            routeMetrics ? routeMetrics.minBrutto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                        <CardDescription>нетто</CardDescription>
                        <CardTitle><b>{
                            routeMetrics ? routeMetrics.minNetto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="min-w-[200px]">
                    <CardHeader>
                        <CardTitle>Среднее</CardTitle>
                        <CardDescription>брутто</CardDescription>
                        <CardTitle><b>{routeMetrics
                            ? routeMetrics.avgBrutto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                        <CardDescription>нетто</CardDescription>
                        <CardTitle><b>{routeMetrics
                            ? routeMetrics.avgNetto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="min-w-[200px]">
                    <CardHeader>
                        <CardTitle>Максимальное</CardTitle>
                        <CardDescription>брутто</CardDescription>
                        <CardTitle><b>{routeMetrics
                            ? routeMetrics.maxBrutto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                        <CardDescription>нетто</CardDescription>
                        <CardTitle><b>{routeMetrics
                            ? routeMetrics.maxNetto.toFixed(2)
                            : '—'}</b> USD</CardTitle>
                    </CardHeader>
                </Card>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild><Info/></TooltipTrigger>
                        <TooltipContent>
                        <p>Нажмите на маршрут левой кнопкой мыши, чтобы увидеть статистику по брутто\нетто</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
            <Separator /> 

            <div className="grid space-y-5 mb-5">
                <Tabs defaultValue="route" className="mr-10">
                    <TabsList>
                        <TabsTrigger value="client">Клиент</TabsTrigger>
                        <TabsTrigger value="route">Маршрут</TabsTrigger>
                        <TabsTrigger value="expeditor">Экспедитор</TabsTrigger>
                        <TabsTrigger value="km">Клиент менеджер</TabsTrigger>
                        <TabsTrigger value="cargo">Груз</TabsTrigger>
                    </TabsList>

                    <TabsContent value="client">
                        <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                        <Table>
                            <TableHeader className="sticky top-0 bg-accent">
                                <TableRow>
                                <TableHead>Клиент</TableHead>
                                <TableHead>Количество</TableHead>
                                <TableHead>% от всех маршрутов</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {groupedClients.map(({ name, count }) => {
                                    const pct = ((count / total) * 100).toFixed(2);
                                    return (
                                        <TableRow key={name}>
                                            <TableCell>{name}</TableCell>
                                            <TableCell>{count}</TableCell>
                                            <TableCell>{pct}%</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="route">
                        <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-accent">
                                    <TableRow >
                                        <TableHead>Маршрут</TableHead>
                                        <TableHead>Количество</TableHead>
                                        <TableHead>% от всех маршрутов</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedRoutes.map(({ name, count }) => {
                                        const pct = ((count / total) * 100).toFixed(2);
                                        return (
                                            <TableRow key={name} onClick={() => setSelectedRoute(name)}>
                                                <TableCell className={selectedRoute === name ? "bg-amber-400 text-white font-bold" : ""} onClick={() => {}}>{name}</TableCell>
                                                <TableCell className={selectedRoute === name ? "bg-amber-400 text-white font-bold" : ""}>{count}</TableCell>
                                                <TableCell className={selectedRoute === name ? "bg-amber-400 text-white font-bold" : ""}>{pct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="km">
                        <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-accent">
                                    <TableRow>
                                    <TableHead>Клиент менеджер</TableHead>
                                    <TableHead>Количество</TableHead>
                                    <TableHead>% от всех маршрутов</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedCM.map(({ name, count }) => {
                                        const pct = ((count / total) * 100).toFixed(2);
                                        return (
                                            <TableRow key={name}>
                                                <TableCell>{name}</TableCell>
                                                <TableCell>{count}</TableCell>
                                                <TableCell>{pct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="expeditor">
                        <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-accent">
                                    <TableRow>
                                    <TableHead>Экспедитор</TableHead>
                                    <TableHead>Количество</TableHead>
                                    <TableHead>% от всех маршрутов</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedExpeditors.map(({ name, count }) => {
                                        const pct = ((count / total) * 100).toFixed(2);
                                        return (
                                            <TableRow key={name}>
                                                <TableCell>{name}</TableCell>
                                                <TableCell>{count}</TableCell>
                                                <TableCell>{pct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="cargo">
                        <ScrollArea className="h-[calc(100vh-400px)] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-accent">
                                    <TableRow>
                                    <TableHead>Груз</TableHead>
                                    <TableHead>Количество</TableHead>
                                    <TableHead>% от всех маршрутов</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupedCargos.map(({ name, count }) => {
                                        const pct = ((count / total) * 100).toFixed(2);
                                        return (
                                            <TableRow key={name}>
                                                <TableCell>{name}</TableCell>
                                                <TableCell>{count}</TableCell>
                                                <TableCell>{pct}%</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <Separator /> 

                <Card className="min-w-[200px]">
                    <CardHeader>
                        <CardTitle>
                            {selectedClient !== "all" 
                                ? `Данные по клиенту ${selectedClient}`
                                : "Выберите клиента чтобы увидеть по нему общую информацию"
                            }
                        </CardTitle>

                        {selectedClient !== "all" && (
                            <Table className="rounded-lg border">
                                <TableHeader className="sticky top-0 bg-accent">
                                    <TableRow>
                                        <TableHead>Месяц</TableHead>
                                        <TableHead>Брутто USD</TableHead>
                                        <TableHead>Нетто USD</TableHead>
                                        <TableHead>Профит</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clientTotal.perMonth.map((x) =>
                                        <TableRow>
                                            <TableCell>{x.month}</TableCell>
                                            <TableCell>{x.totalBrutto}</TableCell>
                                            <TableCell>{x.totalNetto}</TableCell>
                                            <TableCell>{x.totalBrutto-x.totalNetto}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                                <TableFooter content="center">
                                    <TableRow>
                                        <TableCell>Общее</TableCell>
                                        <TableCell>{clientTotal.totalBrutto}</TableCell>
                                        <TableCell>{clientTotal.totalNetto}</TableCell>
                                        <TableCell>{clientTotal.totalBrutto-clientTotal.totalNetto}</TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                            // <>
                            //     <CardDescription>
                            //         Количество общих сделок: <b>{clientTotal.totalOrders}</b>
                            //     </CardDescription>
                            //     <CardDescription>
                            //         Общий Brutto: <b>{clientTotal.totalBrutto}</b>
                            //     </CardDescription>
                            //     <CardDescription>
                            //         Общий Netto: <b>{clientTotal.totalNetto}</b>
                            //     </CardDescription>
                            //     {/* Per month block (if needed) */}
                            //     {clientTotal.perMonth.length > 0 && (
                            //         <>
                            //             <CardDescription className="mt-2">
                            //                 <b>Динамика по месяцам:</b>
                            //             </CardDescription>
                            //             {clientTotal.perMonth.map((monthData, idx) => (
                            //                 <CardDescription key={idx}>
                            //                     {monthData.month}: Brutto — <b>{monthData.totalBrutto}</b>, Netto — <b>{monthData.totalNetto}</b>
                            //                 </CardDescription>
                            //             ))}
                            //         </>
                            //     )}
                            // </>
                        )}
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
