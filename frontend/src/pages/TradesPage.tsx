import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { tradeApi } from '@/services/trade.service';
import { FOREX_PAIRS } from '@/types';
import { PageLoader } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate, getPnlColor, cn } from '@/lib/utils';

export default function TradesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pair, setPair] = useState('');
  const [result, setResult] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['trades', page, search, pair, result, sortBy, sortOrder],
    queryFn: () => tradeApi.getAll({
      page, limit: 20, search, pair, result,
      sortBy, sortOrder,
    }).then((r) => r.data.data),
  });

  const handleExportCSV = async () => {
    try {
      const res = await tradeApi.export('csv');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trades.csv';
      a.click();
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const handleExportExcel = async () => {
    try {
      const res = await tradeApi.export('json');
      const trades = res.data.data;
      const ws = XLSX.utils.json_to_sheet(trades);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Trades');
      XLSX.writeFile(wb, 'trades.xlsx');
      toast.success('Excel exported');
    } catch { toast.error('Export failed'); }
  };

  if (isLoading) return <PageLoader />;

  const { trades, pagination } = data || { trades: [], pagination: { page: 1, pages: 1, total: 0 } };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Trades</h1>
          <p className="text-muted-foreground">{pagination.total} total trades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="h-4 w-4" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}><Download className="h-4 w-4" /> Excel</Button>
          <Button size="sm" onClick={() => navigate('/trades/add')}>Add Trade</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search trades..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={pair} onValueChange={(v) => { setPair(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Pair" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pairs</SelectItem>
                {FOREX_PAIRS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={result} onValueChange={(v) => { setResult(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="Result" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Profit">Profit</SelectItem>
                <SelectItem value="Loss">Loss</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="pnl">PnL</SelectItem>
                <SelectItem value="pair">Pair</SelectItem>
                <SelectItem value="riskRewardRatio">RR</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Trades</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Pair</th>
                  <th className="pb-3 pr-4">Direction</th>
                  <th className="pb-3 pr-4">RR</th>
                  <th className="pb-3 pr-4">PnL</th>
                  <th className="pb-3 pr-4">Result</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade._id} onClick={() => navigate(`/trades/${trade._id}`)}
                    className="border-b border-border/50 cursor-pointer hover:bg-accent/50">
                    <td className="py-3 pr-4 font-medium">{trade.pair}</td>
                    <td className="py-3 pr-4">{trade.direction}</td>
                    <td className="py-3 pr-4">{trade.riskRewardRatio}R</td>
                    <td className={cn('py-3 pr-4 font-medium', getPnlColor(trade.pnl))}>{formatCurrency(trade.pnl)}</td>
                    <td className="py-3 pr-4">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs', trade.result === 'Profit' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss')}>
                        {trade.result}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{formatDate(trade.createdAt)}</td>
                  </tr>
                ))}
                {trades.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No trades found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
