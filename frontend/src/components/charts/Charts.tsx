import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const chartStyle = {
  fontSize: 12,
  fill: '#94a3b8',
};

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#e2e8f0',
};

export function EquityCurveChart({ data }: { data: { date: string; equity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2962ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2962ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={chartStyle} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={chartStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Equity']} />
        <Area type="monotone" dataKey="equity" stroke="#2962ff" fill="url(#equityGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyPnLChart({ data }: { data: { month: string; pnl: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="month" tick={chartStyle} />
        <YAxis tick={chartStyle} tickFormatter={(v) => `$${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toFixed(2)}`, 'PnL']} />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}
          fill="#2962ff"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WinRateChart({ data }: { data: { date: string; winRate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="date" tick={chartStyle} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={chartStyle} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v)}%`, 'Win Rate']} />
        <Line type="monotone" dataKey="winRate" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarPerformanceChart({ data, dataKey, nameKey }: {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey={nameKey} tick={chartStyle} />
        <YAxis tick={chartStyle} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={dataKey} fill="#2962ff" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MistakeBarChart({ data }: { data: { name: string; frequency: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis type="number" tick={chartStyle} />
        <YAxis type="category" dataKey="name" tick={chartStyle} width={120} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="frequency" fill="#ef4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
