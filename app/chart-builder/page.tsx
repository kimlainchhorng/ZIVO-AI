'use client';
import { useState } from 'react';
import NavBar from '../../components/NavBar';

const COLORS = {
  bg: "#0a0b14", bgPanel: "#0f1120", bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)", accent: "#6366f1",
  accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  textPrimary: "#f1f5f9", textSecondary: "#94a3b8", textMuted: "#64748b",
  success: "#22c55e", warning: "#f59e0b", error: "#ef4444",
};

const fadeInCSS = '@keyframes fadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }';

const chartTypes = ['Line', 'Bar', 'Pie', 'Area', 'Heatmap'];

const defaultCSV = `Month,Sales,Visits
Jan,120,400
Feb,180,520
Mar,140,480
Apr,220,630
May,190,570
Jun,260,710`;

function parseCSV(csv: string): { labels: string[]; values: number[] } {
  const lines = csv.trim().split('\n').slice(1);
  const labels: string[] = [];
  const values: number[] = [];
  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 2) { labels.push(parts[0]); values.push(Number(parts[1]) || 0); }
  });
  return { labels, values };
}

function LineChart({ data, color }: { data: { labels: string[]; values: number[] }; color: string }) {
  const max = Math.max(...data.values, 1);
  const pts = data.values.map((v, i) => `${60 + i * (380 / (data.values.length - 1 || 1))},${250 - (v / max) * 200}`).join(' ');
  return (
    <svg viewBox="0 0 500 300" style={{ width: '100%' }}>
      {[0, 50, 100, 150, 200].map(y => <line key={y} x1="50" y1={50 + y} x2="480" y2={50 + y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.values.map((v, i) => <circle key={i} cx={60 + i * (380 / (data.values.length - 1 || 1))} cy={250 - (v / max) * 200} r="4" fill={color} />)}
      {data.labels.map((l, i) => <text key={i} x={60 + i * (380 / (data.labels.length - 1 || 1))} y="280" textAnchor="middle" fill="#64748b" fontSize="11">{l}</text>)}
    </svg>
  );
}

function BarChart({ data, color }: { data: { labels: string[]; values: number[] }; color: string }) {
  const max = Math.max(...data.values, 1);
  const barColors = [color, '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
  const bw = 40, gap = (380 - data.values.length * bw) / (data.values.length + 1);
  return (
    <svg viewBox="0 0 500 300" style={{ width: '100%' }}>
      {[0, 50, 100, 150, 200].map(y => <line key={y} x1="50" y1={50 + y} x2="480" y2={50 + y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      {data.values.map((v, i) => {
        const h = (v / max) * 200;
        const x = 60 + gap * (i + 1) + i * bw;
        return (
          <g key={i}>
            <rect x={x} y={250 - h} width={bw} height={h} rx="4" fill={barColors[i % barColors.length]} opacity="0.9" />
            <text x={x + bw / 2} y="280" textAnchor="middle" fill="#64748b" fontSize="11">{data.labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({ data, color }: { data: { labels: string[]; values: number[] }; color: string }) {
  const total = data.values.reduce((a, b) => a + b, 0) || 1;
  const sliceColors = [color, '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
  let startAngle = -Math.PI / 2;
  const slices = data.values.slice(0, 3).map((v, i) => {
    const angle = (v / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = 200 + 120 * Math.cos(startAngle), y1 = 150 + 120 * Math.sin(startAngle);
    const x2 = 200 + 120 * Math.cos(endAngle), y2 = 150 + 120 * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M200,150 L${x1},${y1} A120,120 0 ${large},1 ${x2},${y2} Z`;
    const mid = startAngle + angle / 2;
    startAngle = endAngle;
    return { d, color: sliceColors[i], label: data.labels[i], mx: 200 + 80 * Math.cos(mid), my: 150 + 80 * Math.sin(mid) };
  });
  return (
    <svg viewBox="0 0 500 300" style={{ width: '100%' }}>
      {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#0a0b14" strokeWidth="2" />)}
      {slices.map((s, i) => <text key={i} x={s.mx} y={s.my} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="600">{s.label}</text>)}
    </svg>
  );
}

function AreaChart({ data, color }: { data: { labels: string[]; values: number[] }; color: string }) {
  const max = Math.max(...data.values, 1);
  const pts = data.values.map((v, i) => `${60 + i * (380 / (data.values.length - 1 || 1))},${250 - (v / max) * 200}`).join(' ');
  const polyPts = `60,250 ${pts} ${60 + (data.values.length - 1) * (380 / (data.values.length - 1 || 1))},250`;
  return (
    <svg viewBox="0 0 500 300" style={{ width: '100%' }}>
      {[0, 50, 100, 150, 200].map(y => <line key={y} x1="50" y1={50 + y} x2="480" y2={50 + y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      <polygon points={polyPts} fill={`${color}33`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" />
      {data.labels.map((l, i) => <text key={i} x={60 + i * (380 / (data.labels.length - 1 || 1))} y="280" textAnchor="middle" fill="#64748b" fontSize="11">{l}</text>)}
    </svg>
  );
}

function HeatmapChart() {
  const rows = 4, cols = 6;
  const data = Array.from({ length: rows * cols }, () => Math.random());
  return (
    <svg viewBox="0 0 500 300" style={{ width: '100%' }}>
      {data.map((v, i) => {
        const row = Math.floor(i / cols), col = i % cols;
        const opacity = 0.15 + v * 0.85;
        return <rect key={i} x={60 + col * 65} y={40 + row * 55} width="58" height="48" rx="4" fill={`rgba(99,102,241,${opacity})`} />;
      })}
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <text key={d} x={89 + i * 65} y="35" textAnchor="middle" fill="#64748b" fontSize="11">{d}</text>)}
      {['W1', 'W2', 'W3', 'W4'].map((w, i) => <text key={w} x="45" y={70 + i * 55} textAnchor="middle" fill="#64748b" fontSize="11">{w}</text>)}
    </svg>
  );
}

export default function ChartBuilderPage() {
  const [chartType, setChartType] = useState('Line');
  const [csvData, setCsvData] = useState(defaultCSV);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [showAxis, setShowAxis] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const parsed = parseCSV(csvData);

  function renderChart() {
    const props = { data: parsed, color: primaryColor };
    switch (chartType) {
      case 'Line': return <LineChart {...props} />;
      case 'Bar': return <BarChart {...props} />;
      case 'Pie': return <PieChart {...props} />;
      case 'Area': return <AreaChart {...props} />;
      case 'Heatmap': return <HeatmapChart />;
      default: return <LineChart {...props} />;
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.textPrimary }}>
      <style>{fadeInCSS}</style>
      <NavBar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Chart Builder</h1>

        {/* Chart type tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {chartTypes.map(t => (
            <button key={t} onClick={() => setChartType(t)} style={{ background: chartType === t ? COLORS.accentGradient : COLORS.bgCard, color: chartType === t ? '#fff' : COLORS.textSecondary, border: `1px solid ${chartType === t ? 'transparent' : COLORS.border}`, borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: chartType === t ? 600 : 400 }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Chart preview */}
          <div>
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <div style={{ animation: 'fadeIn 0.4s ease both' }}>{renderChart()}</div>
            </div>

            {/* Data panel */}
            <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>CSV Data</h3>
              <textarea value={csvData} onChange={e => setCsvData(e.target.value)} style={{ width: '100%', height: 140, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 12, color: COLORS.textPrimary, fontSize: 13, fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Customization panel */}
          <div style={{ background: COLORS.bgPanel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600 }}>Customization</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 }}>Primary Color</label>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '100%', height: 36, borderRadius: 6, border: `1px solid ${COLORS.border}`, cursor: 'pointer', background: 'none' }} />
            </div>
            {[
              { label: 'Axis Labels', val: showAxis, set: setShowAxis },
              { label: 'Legend', val: showLegend, set: setShowLegend },
              { label: 'Grid Lines', val: showGrid, set: setShowGrid },
            ].map(({ label, val, set }) => (
              <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', fontSize: 14, color: COLORS.textSecondary }}>
                <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} />
                {label}
              </label>
            ))}

            <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, marginTop: 8 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Export</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => window.alert('Exporting PNG...')} style={{ background: COLORS.accentGradient, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 600 }}>Export PNG</button>
                <button onClick={() => window.alert('Exporting SVG...')} style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px', cursor: 'pointer' }}>Export SVG</button>
                <button onClick={() => window.alert('Code copied to clipboard!')} style={{ background: COLORS.bgCard, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px', cursor: 'pointer' }}>Copy Code</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
