import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsApi } from '@/services/trade.service';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, cn, getPnlColor } from '@/lib/utils';

export default function CalendarPage() {
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => analyticsApi.getCalendar(year, month).then((r) => r.data.data),
  });

  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  const dayMap = new Map(calendarData?.map((d) => [d.date, d]) || []);

  const prevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
    setSelectedDay(null);
  };

  if (isLoading) return <PageLoader />;

  const selectedData = selectedDay ? dayMap.get(selectedDay) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trading Calendar</h1>
        <p className="text-muted-foreground">View your daily trading activity</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <CardTitle>{monthName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayData = dayMap.get(dateStr);
              const isSelected = selectedDay === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(dateStr)}
                  className={cn(
                    'relative rounded-md p-2 text-sm transition-colors min-h-[60px]',
                    isSelected ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-accent',
                    dayData && dayData.pnl >= 0 ? 'bg-profit/10' : dayData ? 'bg-loss/10' : ''
                  )}
                >
                  <span className="font-medium">{day}</span>
                  {dayData && (
                    <div className="mt-1 text-[10px]">
                      <div>{dayData.trades} trade{dayData.trades > 1 ? 's' : ''}</div>
                      <div className={getPnlColor(dayData.pnl)}>{formatCurrency(dayData.pnl)}</div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedDay} — {selectedData.trades} trade{selectedData.trades > 1 ? 's' : ''}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-lg font-bold mb-4', getPnlColor(selectedData.pnl))}>
              Daily PnL: {formatCurrency(selectedData.pnl)}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedData.tradeIds.map((id) => (
                <Button key={id} variant="outline" size="sm" onClick={() => navigate(`/trades/${id}`)}>
                  View Trade
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
