const { useState, useEffect, useRef } = React;

const NAV = [
  { label: '대시보드', route: 'dash' },
  { label: '업로드', route: 'upload' },
  { label: '거래 내역', route: 'dash' },
  { label: '월별 추이', route: 'dash' },
];

function AppShell({ nav = 0, go, plan, setPlan, children }) {
  return (
    <div className="fs-shell">
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <DS.Sidebar items={NAV} active={nav} onSelect={i => go(NAV[i].route)} />
      </div>
      <div className="fs-main">
        <div style={{ maxWidth: 1120, margin: '0 auto 24px', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <span className="fs-chip">{plan === 'pro' ? 'Pro' : 'Free'} 플랜</span>
          <span style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--color-surface-strong)' }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Dashboard({ go, plan, setPlan }) {
  const D = window.FS_DATA;
  const [hover, setHover] = useState(null);
  const pro = plan === 'pro';
  const diff = D.total - D.prevTotal;
  const pct = (diff / D.prevTotal * 100).toFixed(1);
  const rows = pro ? D.txns : D.txns.slice(0, 8);
  return (
    <AppShell nav={0} go={go} plan={plan}>
      <div className="fs-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-base)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="fs-eyebrow">{D.period}</span>
            <h1 className="fs-h1">이번 달 지출 정리했어요</h1>
            <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>카드 2장 합산 · {D.cards.join(' · ')}</span>
          </div>
          <DS.Button variant="secondary" onClick={() => go('upload')}>명세서 추가</DS.Button>
        </div>

        <div className="fs-grid3">
          <DS.StatCard label="총 지출" value={W(D.total)} delta={`지난달 대비 ${pct}%`} tone={diff < 0 ? 'success' : 'danger'} />
          <DS.StatCard label="거래 건수" value={`${D.txCount}건`} delta="카드 2장 합산" />
          <DS.StatCard label="가장 큰 카테고리" value={W(D.cats[0].amount)} delta={`${D.cats[0].name} · 전체의 ${Math.round(D.cats[0].amount / D.total * 100)}%`} />
        </div>

        <DS.Card>
          <SectionHead title="카테고리별 지출" note="12개 카테고리 · 도넛에 마우스를 올리면 금액이 보여요" />
          <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Donut data={D.cats} total={D.total} active={hover} onHover={setHover} />
            <div style={{ flex: 1, minWidth: 300 }}>
              <Legend data={D.cats} total={D.total} active={hover} onHover={setHover} />
            </div>
          </div>
        </DS.Card>

        <DS.Card>
          <SectionHead title="이번 달 눈에 띄는 변화" note={pro ? '집계 숫자만으로 만든 문장이에요' : 'Free는 1개까지 보여드려요'}
            right={<DS.Badge tone="primary">{pro ? `${D.insights.length}개` : '미리보기'}</DS.Badge>} />
          <div>
            {D.insights.slice(0, 1).map((ins, i) => <InsightItem key={ins.t} ins={ins} i={i} />)}
          </div>
          {pro ? (
            <div>{D.insights.slice(1).map((ins, i) => <InsightItem key={ins.t} ins={ins} i={i + 1} />)}</div>
          ) : (
            <div className="fs-lock" style={{ marginTop: 4, minHeight: 132 }}>
              <div style={{ filter: 'blur(3px)', opacity: .5 }}>
                {D.insights.slice(1, 3).map((ins, i) => <InsightItem key={ins.t} ins={ins} i={i + 1} />)}
              </div>
              <LockVeil title={`인사이트 ${D.insights.length - 1}개가 더 있어요`} note="Pro에서 전체 인사이트를 볼 수 있어요." onUpgrade={() => setPlan('pro')} />
            </div>
          )}
        </DS.Card>

        <DS.Card>
          <SectionHead title="월별 추이" note="최근 5개월 총 지출" right={pro ? null : <DS.Badge>PRO</DS.Badge>} />
          <div className="fs-lock">
            <div style={pro ? null : { filter: 'blur(5px)', opacity: .45 }}>
              <TrendChart months={D.months} />
            </div>
            {!pro && <LockVeil title="월별 추이는 Pro 기능이에요" note="여러 달 데이터를 쌓아 지출 변화를 볼 수 있어요." onUpgrade={() => setPlan('pro')} />}
          </div>
        </DS.Card>

        <DS.Card>
          <SectionHead title="거래 내역"
            note={pro ? '전체 히스토리' : '최근 1개월 · 2026년 7월에 올린 카드 전부'}
            right={<span className="fs-chip">{rows.length}/{D.txns.length}건 표시</span>} />
          <table className="fs-table">
            <thead><tr><th style={{ width: 68 }}>날짜</th><th>가맹점</th><th>카테고리</th><th style={{ width: 120 }}>카드</th><th style={{ textAlign: 'right', width: 120 }}>금액</th></tr></thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={i}>
                  <td className="n" style={{ textAlign: 'left', color: 'var(--color-muted)' }}>{t.d}</td>
                  <td>{t.m}</td>
                  <td><span className="fs-chip">{t.c}</span></td>
                  <td style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>{t.card}</td>
                  <td className="n">-{t.a.toLocaleString('ko-KR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pro && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-base)', marginTop: 'var(--space-base)', paddingTop: 'var(--space-base)', borderTop: '1px solid var(--color-hairline-soft)', flexWrap: 'wrap' }}>
              <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)' }}>이전 달 내역은 잠겨 있어요. 삭제되지 않았으니 언제든 다시 볼 수 있어요.</span>
              <DS.Button variant="ghost" onClick={() => setPlan('pro')}>전체 히스토리 열기 →</DS.Button>
            </div>
          )}
        </DS.Card>
      </div>
    </AppShell>
  );
}

function MobileCard({ children, pad = 20 }) {
  return <div style={{ background: 'var(--color-canvas)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: pad }}>{children}</div>;
}

function MobileScreens({ plan, setPlan }) {
  const D = window.FS_DATA;
  const pro = plan === 'pro';
  const pct = ((D.total - D.prevTotal) / D.prevTotal * 100).toFixed(1);
  const bar = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 4px 14px' }}>
      <Wordmark size={17} />
      <span className="fs-chip">{pro ? 'Pro' : 'Free'}</span>
    </div>
  );
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-dark)', padding: '48px 24px 120px', display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <div className="fs-phone"><div className="fs-phone-scroll">
          {bar}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '4px 4px 0' }}>
              <span className="fs-eyebrow">{D.period}</span>
              <div style={{ font: 'var(--text-title-lg)', marginTop: 4 }}>이번 달 지출</div>
            </div>
            <MobileCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>총 지출 · 카드 2장 합산</span>
                <span className="fs-num" style={{ font: 'var(--text-number-lg)' }}>{W(D.total)}</span>
                <span className="fs-num" style={{ font: 'var(--text-number-sm)', color: 'var(--color-success)' }}>지난달 대비 {pct}%</span>
              </div>
            </MobileCard>
            <MobileCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                <Donut data={D.cats} total={D.total} size={188} thickness={22} />
                <div style={{ width: '100%' }}><Legend data={D.cats} total={D.total} limit={5} /></div>
              </div>
            </MobileCard>
            <MobileCard>
              <div style={{ font: 'var(--text-title-sm)', marginBottom: 4 }}>눈에 띄는 변화</div>
              <InsightItem ins={D.insights[0]} i={0} />
              {!pro && <div style={{ paddingTop: 10, borderTop: '1px solid var(--color-hairline-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>+{D.insights.length - 1}개 더</span>
                <DS.Button variant="ghost" onClick={() => setPlan('pro')}>Pro로 보기 →</DS.Button>
              </div>}
            </MobileCard>
          </div>
        </div></div>
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>모바일 · 요약</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <div className="fs-phone"><div className="fs-phone-scroll">
          {bar}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '4px 4px 0' }}>
              <span className="fs-eyebrow">{D.period}</span>
              <div style={{ font: 'var(--text-title-lg)', marginTop: 4 }}>거래 내역</div>
              <div style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)', marginTop: 4 }}>{pro ? '전체 히스토리' : '최근 1개월'} · {D.txns.length}건</div>
            </div>
            <MobileCard pad={12}>
              {D.txns.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px', borderTop: i === 0 ? 'none' : '1px solid var(--color-hairline-soft)' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 99, background: SLICE(D.cats.findIndex(c => c.name === t.c), 12), flexShrink: 0, opacity: .9 }} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ font: 'var(--text-title-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.m}</span>
                    <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>{t.c} · {t.d}</span>
                  </div>
                  <span className="fs-num" style={{ font: 'var(--text-number-sm)' }}>-{t.a.toLocaleString('ko-KR')}</span>
                </div>
              ))}
            </MobileCard>
          </div>
        </div></div>
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>모바일 · 거래 내역</span>
      </div>
    </div>
  );
}

Object.assign(window, { AppShell, Dashboard, MobileScreens });
