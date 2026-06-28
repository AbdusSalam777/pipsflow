import { useNavigate } from 'react-router-dom';
import { getHeatmapColor } from '@/lib/utils';

interface HeatmapItem {
  id: string;
  date: string;
  pnl: number;
  result: string;
  pair: string;
}

export function TradeHeatmap({ data }: { data: HeatmapItem[] }) {
  const navigate = useNavigate();

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No trades to display</p>;
  }

  const weeks: HeatmapItem[][] = [];
  let currentWeek: HeatmapItem[] = [];

  data.forEach((item, i) => {
    currentWeek.push(item);
    if (currentWeek.length === 7 || i === data.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((trade) => (
              <button
                key={trade.id}
                title={`${trade.pair} - ${trade.result} $${trade.pnl}`}
                onClick={() => navigate(`/trades/${trade.id}`)}
                className="h-3 w-3 rounded-sm transition-transform hover:scale-150 hover:z-10"
                style={{ backgroundColor: getHeatmapColor(trade.pnl, trade.result) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-profit/60" /> Win</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-loss/60" /> Loss</span>
        <span>Darker = larger PnL</span>
      </div>
    </div>
  );
}
