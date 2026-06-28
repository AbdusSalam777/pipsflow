import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '@/services/trade.service';
import { PageLoader, StatCard } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquityCurveChart, MonthlyPnLChart } from '@/components/charts/Charts';
import { TradeHeatmap } from '@/components/charts/TradeHeatmap';
import { formatCurrency, formatPercent, formatDate, getPnlColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 24 } }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.getDashboard().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const { summary, equityCurve, monthlyPnL, heatmap, recentTrades } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time overview of your trading system metrics</p>
        </div>
      </div>

      {/* Staggered Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
      >
        <motion.div variants={itemVariants}><StatCard title="Total Trades" value={summary.totalTrades} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Win Rate" value={formatPercent(summary.winRate)} trend={summary.winRate >= 50 ? 'up' : 'down'} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Total PnL" value={formatCurrency(summary.totalPnL)} trend={summary.totalPnL >= 0 ? 'up' : 'down'} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Month PnL" value={formatCurrency(summary.currentMonthPnL)} trend={summary.currentMonthPnL >= 0 ? 'up' : 'down'} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Profit Factor" value={summary.profitFactor === Infinity ? '∞' : summary.profitFactor} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Expectancy" value={formatCurrency(summary.expectancy)} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Avg RR" value={`${summary.averageRR}R`} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Wins / Losses" value={`${summary.winningTrades} / ${summary.losingTrades}`} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Streak" value={`${summary.currentStreak.current} ${summary.currentStreak.type}`} /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Best Pair" value={summary.bestPair} trend="up" /></motion.div>
        <motion.div variants={itemVariants}><StatCard title="Worst Pair" value={summary.worstPair} trend="down" /></motion.div>
      </motion.div>

      {/* Charts Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <Card>
          <CardHeader><CardTitle>Equity Curve</CardTitle></CardHeader>
          <CardContent><EquityCurveChart data={equityCurve} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly PnL</CardTitle></CardHeader>
          <CardContent><MonthlyPnLChart data={monthlyPnL} /></CardContent>
        </Card>
      </motion.div>

      {/* Heatmap Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Card>
          <CardHeader><CardTitle>Trade Heatmap</CardTitle></CardHeader>
          <CardContent><TradeHeatmap data={heatmap} /></CardContent>
        </Card>
      </motion.div>

      {/* Recent Trades Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/20 bg-background/25">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-left text-muted-foreground font-semibold">
                    <th className="p-4">Pair</th>
                    <th className="p-4">Direction</th>
                    <th className="p-4">RR Ratio</th>
                    <th className="p-4">PnL</th>
                    <th className="p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade) => (
                    <tr
                      key={trade.id}
                      onClick={() => navigate(`/trades/${trade.id}`)}
                      className="border-b border-border/10 cursor-pointer hover:bg-primary/5 transition-colors duration-150"
                    >
                      <td className="p-4 font-bold text-foreground">{trade.pair}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-semibold",
                          trade.direction === 'Long' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                        )}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{trade.riskRewardRatio}R</td>
                      <td className={cn('p-4 font-bold', getPnlColor(trade.pnl))}>{formatCurrency(trade.pnl)}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(trade.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
