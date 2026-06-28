import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/services/trade.service';
import { PageLoader } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MistakeBarChart } from '@/components/charts/Charts';
import { formatCurrency, formatPercent, getPnlColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
};

export default function MistakesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['mistakes'],
    queryFn: () => analyticsApi.getMistakes().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mistake Analysis</h1>
        <p className="text-muted-foreground mt-1">Identify, measure, and eliminate recurring patterns that impact your profitability</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 lg:grid-cols-2"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Most Common Mistakes</CardTitle>
              <CardDescription>Frequency of recorded discipline breakdowns</CardDescription>
            </CardHeader>
            <CardContent>
              <MistakeBarChart data={data.mostCommon as { name: string; frequency: number }[]} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Worst Performing Mistakes</CardTitle>
              <CardDescription>Absolute financial impact of each mistake category</CardDescription>
            </CardHeader>
            <CardContent>
              <MistakeBarChart data={(data.worstPerforming as { name: string; frequency: number }[]).map((m) => ({
                name: m.name,
                frequency: Math.abs((m as unknown as { pnlImpact: number }).pnlImpact || m.frequency),
              }))} />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Detailed Breakdown</CardTitle>
            <CardDescription>Performance metrics filtered by mistake type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/20 bg-background/25">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/20 text-left text-muted-foreground font-semibold">
                    <th className="p-4">Mistake Type</th>
                    <th className="p-4">Frequency</th>
                    <th className="p-4">Cumulative PnL Impact</th>
                    <th className="p-4">Win Rate Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mistakes.map((m) => (
                    <tr key={m.name} className="border-b border-border/10 hover:bg-primary/5 transition-colors duration-150">
                      <td className="p-4 font-bold text-foreground">{m.name}</td>
                      <td className="p-4 font-medium">{m.frequency} times</td>
                      <td className={cn('p-4 font-bold', getPnlColor(m.pnlImpact))}>
                        {formatCurrency(m.pnlImpact)}
                      </td>
                      <td className={cn(
                        "p-4 font-semibold",
                        m.winRateImpact >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {formatPercent(m.winRateImpact)}
                      </td>
                    </tr>
                  ))}
                  {data.mistakes.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-muted-foreground">
                        Excellent! No trading mistakes recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
