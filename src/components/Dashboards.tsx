import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ParsedData, ChartDataPoint, StatusCodeData, IPData } from '../types';
import './Dashboards.css';

interface DashboardsProps {
  data: ParsedData;
  onBack: () => void;
  onIPClick?: (ip: string) => void;
}

const COLORS = ['#60a5fa', '#a78bfa', '#f472b6', '#fbbf24', '#4ade80', '#fb923c', '#f87171', '#94a3b8'];

export default function Dashboards({ data, onBack, onIPClick }: DashboardsProps) {
  // Time series data (events per hour)
  const timeSeriesData = useMemo((): ChartDataPoint[] => {
    const counts = new Map<string, number>();

    data.entries.forEach((entry) => {
      // Skip entries with invalid timestamps
      if (!entry.timestamp || isNaN(entry.timestamp.getTime())) {
        return;
      }
      // Use the full ISO timestamp truncated to hour (YYYY-MM-DDTHH:00:00.000Z)
      const hourKey = entry.timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
      counts.set(hourKey, (counts.get(hourKey) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([isoTime, count]) => {
        const date = new Date(isoTime);
        // Format as readable date/time
        const time = date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return { time, count };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [data]);

  // Status code / Event ID distribution
  const statusCodeData = useMemo((): StatusCodeData[] => {
    const counts = new Map<string, number>();

    data.entries.forEach((entry) => {
      // For EVTX, use eventId; for other formats use statusCode
      let key: string;
      if (data.format === 'evtx') {
        key = entry.eventId ? `Event ${entry.eventId}` : 'Unknown';
      } else {
        key = entry.statusCode?.toString() || 'Unknown';
      }
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([code, count]) => ({
        code,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 for pie chart
  }, [data]);

  // Top IPs / Computers
  const topIPsData = useMemo((): IPData[] => {
    const counts = new Map<string, number>();

    data.entries.forEach((entry) => {
      // For EVTX, use computer; for other formats use ip
      const key = data.format === 'evtx'
        ? (entry.computer || 'Unknown')
        : (entry.ip || 'Unknown');
      if (key && key !== 'Unknown') {
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [data]);

  return (
    <div className="dashboards-page">
      <div className="dashboards-header">
        <h1>Dashboards</h1>
        <button className="back-button" onClick={onBack}>
          ← Back to Main View
        </button>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>{data.format === 'evtx' ? 'Events Over Time' : 'Requests Over Time'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{data.format === 'evtx' ? 'Event ID Distribution' : 'Status Code Distribution'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusCodeData}
                dataKey="count"
                nameKey="code"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusCodeData.map((entry, index) => (
                  <Cell key={entry.code} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>{data.format === 'evtx' ? 'Top 10 Computers' : 'Top 10 IP Addresses'}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topIPsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="ip" stroke="#999" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid #444' }}
              />
              <Bar
                dataKey="count"
                fill="#a78bfa"
                onClick={(entry) => onIPClick?.(entry.ip)}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
          {onIPClick && <p className="hint">Click on a bar to filter logs by IP</p>}
        </div>
      </div>
    </div>
  );
}
