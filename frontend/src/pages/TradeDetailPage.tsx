import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { tradeApi } from '@/services/trade.service';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, getPnlColor, cn } from '@/lib/utils';

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trade, isLoading } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradeApi.getById(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => tradeApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade deleted');
      navigate('/trades');
    },
    onError: () => toast.error('Failed to delete trade'),
  });

  if (isLoading) return <PageLoader />;
  if (!trade) return <p>Trade not found</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/trades')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{trade.pair} - {trade.direction}</h1>
          <p className="text-muted-foreground">{formatDate(trade.createdAt)} · {trade.session} Session</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/trades/${id}/edit`)}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate()}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Entry', value: trade.entryPrice },
          { label: 'Stop Loss', value: trade.stopLoss },
          { label: 'Take Profit', value: trade.takeProfit },
          { label: 'Lot Size', value: trade.lotSize },
          { label: 'R:R Ratio', value: `${trade.riskRewardRatio}R` },
          { label: 'PnL', value: formatCurrency(trade.pnl), color: getPnlColor(trade.pnl) },
          { label: 'Result', value: trade.result },
          { label: 'Session', value: trade.session },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(trade.beforeImage || trade.afterImage) && (
        <Card>
          <CardHeader><CardTitle>Screenshots</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {trade.beforeImage && (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">Before Trade</p>
                <img src={trade.beforeImage} alt="Before" className="rounded-lg border border-border w-full" />
              </div>
            )}
            {trade.afterImage && (
              <div>
                <p className="mb-2 text-sm text-muted-foreground">After Trade</p>
                <img src={trade.afterImage} alt="After" className="rounded-lg border border-border w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {trade.tradeNotes && (
        <Card>
          <CardHeader><CardTitle>Trade Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{trade.tradeNotes}</p></CardContent>
        </Card>
      )}

      {trade.psychologyNotes && (
        <Card>
          <CardHeader><CardTitle>Psychology Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{trade.psychologyNotes}</p></CardContent>
        </Card>
      )}

      {trade.tags.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Setup Tags</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {trade.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">{tag}</span>
            ))}
          </CardContent>
        </Card>
      )}

      {trade.mistakes.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Mistakes</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {trade.mistakes.map((m) => (
              <span key={m} className="rounded-full bg-loss/20 px-3 py-1 text-xs text-loss">{m}</span>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
