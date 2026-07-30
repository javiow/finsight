const { useState, useEffect, useRef } = React;
const DS = window.FinsightDesignSystem_9bfd03;
const W = window.FS_WON, SLICE = window.FS_SLICE;

function Wordmark({ size = 20 }) {
  return <span style={{ font: `800 ${size}px var(--font-sans)`, letterSpacing: '-.03em', color: 'var(--color-ink)' }}>finsight</span>;
}

function Donut({ data, total, size = 232, thickness = 26, onHover, active }) {
  const r = (size - thickness) / 2, C = 2 * Math.PI * r;
  let acc = 0;
  const hovered = active != null ? data[active] : null;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {data.map((c, i) => {
          const frac = c.amount / total, len = frac * C, off = acc * C;
          acc += frac;
          return <circle key={c.name} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={SLICE(i, data.length)} strokeWidth={active === i ? thickness + 6 : thickness}
            strokeDasharray={`${Math.max(len - 2, 1)} ${C - len + 2}`} strokeDashoffset={-off}
            style={{ transition: 'stroke-width .15s ease', cursor: 'default' }}
            onMouseEnter={() => onHover && onHover(i)} onMouseLeave={() => onHover && onHover(null)} />;
        })}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, pointerEvents: 'none' }}>
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>{hovered ? hovered.name : '총 지출'}</span>
        <span className="fs-num" style={{ font: 'var(--text-number-md)', color: 'var(--color-ink)' }}>{W(hovered ? hovered.amount : total)}</span>
        {hovered && <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>{Math.round(hovered.amount / total * 100)}%</span>}
      </div>
    </div>
  );
}

function Legend({ data, total, active, onHover, limit }) {
  const rows = limit ? data.slice(0, limit) : data;
  return (
    <div className="fs-legend" style={{ flex: 1, minWidth: 0 }}>
      {rows.map((c, i) => (
        <div key={c.name} className="fs-legend-row" onMouseEnter={() => onHover && onHover(i)} onMouseLeave={() => onHover && onHover(null)}
          style={active === i ? { background: 'var(--color-surface-strong)' } : null}>
          <span style={{ width: 9, height: 9, borderRadius: 99, background: SLICE(i, data.length), flexShrink: 0 }} />
          <span style={{ flex: 1, font: 'var(--text-body-md)', color: 'var(--color-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
          <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)', width: 34, textAlign: 'right' }}>{Math.round(c.amount / total * 100)}%</span>
          <span className="fs-num" style={{ font: 'var(--text-number-sm)', color: 'var(--color-body)', width: 96, textAlign: 'right' }}>{W(c.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ months, height = 168 }) {
  const max = Math.max(...months.map(m => m.v));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-base)', height }}>
      {months.map((m, i) => {
        const last = i === months.length - 1;
        return (
          <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
            <span className="fs-num" style={{ font: 'var(--text-caption)', fontFamily: 'var(--font-mono)', color: last ? 'var(--color-ink)' : 'var(--color-muted)' }}>{(m.v / 10000).toFixed(0)}만</span>
            <div style={{ width: '100%', maxWidth: 56, height: `${(m.v / max) * 100}%`, borderRadius: 'var(--radius-sm)', background: last ? 'var(--color-primary)' : 'var(--color-surface-strong)', transition: 'height .4s ease' }} />
            <span style={{ font: 'var(--text-caption)', color: last ? 'var(--color-ink)' : 'var(--color-muted)' }}>{m.m}</span>
          </div>
        );
      })}
    </div>
  );
}

function LockVeil({ title, note, onUpgrade }) {
  return (
    <div className="fs-lock-veil">
      <span style={{ font: 'var(--text-title-sm)', color: 'var(--color-ink)' }}>{title}</span>
      <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)', maxWidth: 380 }}>{note}</span>
      <div style={{ marginTop: 6 }}><DS.Button onClick={onUpgrade}>Pro로 업그레이드</DS.Button></div>
    </div>
  );
}

function InsightItem({ ins, i }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderTop: i === 0 ? 'none' : '1px solid var(--color-hairline-soft)' }}>
      <span className="fs-num" style={{ font: 'var(--text-number-sm)', color: 'var(--color-primary)', paddingTop: 3, width: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: 'var(--text-title-sm)', color: 'var(--color-ink)' }}>{ins.t}</span>
        <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)' }}>{ins.s}</span>
      </div>
    </div>
  );
}

function PrivacyList({ items, compact }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(3,1fr)', gap: compact ? 'var(--space-base)' : 'var(--space-lg)' }}>
      {items.map(p => (
        <div key={p.t} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 99, background: 'var(--color-primary-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
            </span>
            <span style={{ font: 'var(--text-title-sm)', color: 'var(--color-ink)' }}>{p.t}</span>
          </div>
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)', paddingLeft: 36, textWrap: 'pretty' }}>{p.d}</span>
        </div>
      ))}
    </div>
  );
}

function SectionHead({ title, right, note }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-base)', marginBottom: 'var(--space-base)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span className="fs-h2">{title}</span>
        {note && <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>{note}</span>}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { Wordmark, Donut, Legend, TrendChart, LockVeil, InsightItem, PrivacyList, SectionHead, DS, W, SLICE });
