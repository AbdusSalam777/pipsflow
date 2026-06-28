import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/trade.service';
import { PageLoader, StatCard } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EquityCurveChart, MonthlyPnLChart, WinRateChart, BarPerformanceChart } from '@/components/charts/Charts';
import { formatCurrency, formatPercent } from '@/lib/utils';

const periods = ['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<string>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params = { period, ...(period === 'custom' && { startDate, endDate }) };

  const { data: performance, isLoading } = useQuery({
    queryKey: ['performance', params],
    queryFn: () => analyticsApi.getPerformance(params).then((r) => r.data.data),
  });

  const { data: winRate } = useQuery({
    queryKey: ['winrate', params],
    queryFn: () => analyticsApi.getWinRate(params).then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;
  if (!performance) return null;

  const p = performance as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your trading performance</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {periods.map((p) => (
          <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm"
            onClick={() => setPeriod(p)} className="capitalize">{p}</Button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex gap-3">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard title="Total Trades" value={p.totalTrades as number} />
        <StatCard title="Win Rate" value={formatPercent(p.winRate as number)} />
        <StatCard title="Avg RR" value={`${p.averageRR}R`} />
        <StatCard title="Avg Winner" value={formatCurrency(p.averageWinner as number)} trend="up" />
        <StatCard title="Avg Loser" value={formatCurrency(p.averageLoser as number)} trend="down" />
        <StatCard title="Profit Factor" value={p.profitFactor as number} />
        <StatCard title="Expectancy" value={formatCurrency(p.expectancy as number)} />
        <StatCard title="Largest Win" value={formatCurrency(p.largestWin as number)} trend="up" />
        <StatCard title="Largest Loss" value={formatCurrency(p.largestLoss as number)} trend="down" />
        <StatCard title="Max Drawdown" value={formatCurrency(p.maxDrawdown as number)} trend="down" />
        <StatCard title="Total PnL" value={formatCurrency(p.totalPnL as number)} trend={(p.totalPnL as number) >= 0 ? 'up' : 'down'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Win Rate Trend</CardTitle></CardHeader>
          <CardContent>{winRate && <WinRateChart data={winRate} />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Equity Curve</CardTitle></CardHeader>
          <CardContent>
            <EquityCurveChart data={(p.equityCurve as { date: string; equity: number }[]) || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Performance</CardTitle></CardHeader>
          <CardContent>
            <MonthlyPnLChart data={(p.monthlyPerformance as { month: string; pnl: number }[]) || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pair Performance</CardTitle></CardHeader>
          <CardContent>
            <BarPerformanceChart
              data={(p.pairPerformance as Record<string, unknown>[]) || []}
              dataKey="pnl" nameKey="pair"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Session Performance</CardTitle></CardHeader>
          <CardContent>
            <BarPerformanceChart
              data={(p.sessionPerformance as Record<string, unknown>[]) || []}
              dataKey="pnl" nameKey="session"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Day of Week</CardTitle></CardHeader>
          <CardContent>
            <BarPerformanceChart
              data={(p.dayOfWeekPerformance as Record<string, unknown>[]) || []}
              dataKey="pnl" nameKey="day"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
