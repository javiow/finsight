const { useState, useEffect, useRef } = React;

function Landing({ go }) {
  const D = window.FS_DATA;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-surface-soft)' }}>
      <header style={{ maxWidth: 1120, margin: '0 auto', padding: '24px var(--space-xl)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Wordmark />
        <div className="fs-row">
          <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)', cursor: 'default' }}>요금제</span>
          <DS.Button onClick={() => go('empty')}>무료로 시작하기</DS.Button>
        </div>
      </header>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px var(--space-xl) 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)', textAlign: 'center' }}>
        <span className="fs-chip">카드 명세서 CSV → 카테고리별 지출</span>
        <h1 style={{ font: 'var(--text-display-lg)', letterSpacing: 'var(--tracking-display-lg)', margin: 0, maxWidth: 720, fontSize: 'clamp(32px,5vw,52px)', lineHeight: 1.12 }}>
          카드 명세서만 올리면<br />이번 달 지출이 정리돼요
        </h1>
        <p className="fs-p" style={{ maxWidth: 520, font: 'var(--text-body-lg)' }}>
          카드사에서 내려받은 CSV를 그대로 올리세요. 카드가 2장이어도 한 달로 합산해서 카테고리별로 보여드려요. 직접 분류할 필요 없어요.
        </p>
        <div className="fs-row" style={{ marginTop: 8 }}>
          <DS.Button size="lg" onClick={() => go('upload')}>명세서 올려보기</DS.Button>
          <DS.Button size="lg" variant="secondary" onClick={() => go('dash')}>예시 대시보드 보기</DS.Button>
        </div>
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>신용카드 등록 없이 시작 · 한 달에 한 번만 들르면 충분해요</span>
      </section>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '56px var(--space-xl) 0' }}>
        <div style={{ background: 'var(--color-canvas)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-xl)', display: 'flex', gap: 'var(--space-xl)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Donut data={D.cats} total={D.total} size={200} thickness={24} />
          <div style={{ flex: 1, minWidth: 280 }}>
            <Legend data={D.cats} total={D.total} limit={6} />
          </div>
        </div>
      </section>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px var(--space-xl) 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
          <span className="fs-eyebrow">프라이버시</span>
          <h2 className="fs-h1">카드 내역 전체가 AI로 넘어가지 않아요</h2>
        </div>
        <PrivacyList items={D.privacy} />
      </section>
      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '80px var(--space-xl) 0' }}>
        <span className="fs-eyebrow">요금제</span>
        <h2 className="fs-h1" style={{ marginTop: 8, marginBottom: 'var(--space-lg)' }}>무료로도 이번 달은 다 볼 수 있어요</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'var(--space-base)' }}>
          {[
            { n: 'Free', p: '₩0', d: '가장 최근 달만', rows: ['업로드·파싱·분류', '카테고리 요약·거래 테이블 (최근 1개월)', 'AI 인사이트 미리보기 1개'], off: ['월별 추이'], cta: '무료로 시작하기', v: 'secondary' },
            { n: 'Pro', p: '₩4,900', d: '월 결제 · 언제든 해지', rows: ['업로드·파싱·분류', '전체 히스토리 요약·거래 테이블', 'AI 인사이트 전체', '월별 추이 비교'], off: [], cta: 'Pro 시작하기', v: 'primary' },
          ].map(pl => (
            <div key={pl.n} style={{ background: 'var(--color-canvas)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-base)', outline: pl.n === 'Pro' ? '1px solid var(--color-primary)' : 'none' }}>
              <div className="fs-row" style={{ justifyContent: 'space-between' }}>
                <span style={{ font: 'var(--text-title-md)' }}>{pl.n}</span>
                {pl.n === 'Pro' && <DS.Badge tone="primary">추천</DS.Badge>}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="fs-num" style={{ font: 'var(--text-number-lg)' }}>{pl.p}</span>
                <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>{pl.d}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pl.rows.map(r => <span key={r} style={{ font: 'var(--text-body-md)', color: 'var(--color-body)' }}>· {r}</span>)}
                {pl.off.map(r => <span key={r} style={{ font: 'var(--text-body-md)', color: 'var(--color-muted-soft)', textDecoration: 'line-through' }}>· {r}</span>)}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}><DS.Button variant={pl.v} onClick={() => go(pl.n === 'Pro' ? 'dash' : 'empty')}>{pl.cta}</DS.Button></div>
            </div>
          ))}
        </div>
      </section>
      <footer style={{ maxWidth: 1120, margin: '0 auto', padding: '80px var(--space-xl) 120px', borderTop: '1px solid var(--color-hairline)', marginTop: 80, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <Wordmark size={16} />
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>원본 파일은 30일 후 자동 삭제됩니다</span>
      </footer>
    </div>
  );
}

function EmptyState({ go }) {
  return (
    <AppShell nav={1} go={go} plan="free">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '68vh', textAlign: 'center', gap: 'var(--space-base)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: 'var(--color-primary-soft)', display: 'grid', placeItems: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17V3" /><path d="m6 9 6-6 6 6" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
        </div>
        <h1 className="fs-h1">아직 올린 명세서가 없어요</h1>
        <p className="fs-p" style={{ maxWidth: 420 }}>카드사 웹사이트에서 이번 달 명세서를 CSV로 내려받아 올려주세요. 헤더가 카드사마다 달라도 알아서 읽어요.</p>
        <div style={{ marginTop: 8 }}><DS.Button size="lg" onClick={() => go('upload')}>CSV 올리기</DS.Button></div>
        <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: 4 }}>지원: 국내 주요 카드사 CSV · CP949/UTF-8 자동 감지</span>
      </div>
    </AppShell>
  );
}

const PARSE_STEPS = [
  { t: '파일 읽는 중', s: '인코딩 감지: CP949 → UTF-8 변환' },
  { t: '컬럼 찾는 중', s: '비식별화된 미리보기 5행으로 날짜·가맹점·금액 컬럼 판별' },
  { t: '가맹점 분류 중', s: '가맹점명만 전송 · 12개 카테고리로 분류' },
  { t: '집계하는 중', s: '같은 달 카드 2장 합산 · 카테고리별 소계' },
];

function Upload({ go }) {
  const D = window.FS_DATA;
  const [over, setOver] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [step, setStep] = useState(0);
  const file = useRef('신한카드_2026-07_명세서.csv');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const start = name => {
    if (name) file.current = name;
    setPhase('parsing'); setStep(0);
    timers.current = [
      setTimeout(() => setStep(1), 900), setTimeout(() => setStep(2), 1900),
      setTimeout(() => setStep(3), 3100), setTimeout(() => { setStep(4); setPhase('done'); }, 4200),
      setTimeout(() => go('dash'), 5400),
    ];
  };
  const drop = e => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    start(f ? f.name : null);
  };
  return (
    <AppShell nav={1} go={go} plan="free">
      <div className="fs-wrap">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="fs-eyebrow">업로드</span>
          <h1 className="fs-h1">명세서 CSV를 올려주세요</h1>
          <p className="fs-p">카드사에서 내려받은 파일을 그대로 끌어다 놓으면 돼요. 여러 장을 올리면 같은 달끼리 합산해요.</p>
        </div>
        {phase === 'idle' ? (
          <div className="fs-drop" data-over={over ? '1' : '0'}
            onDragOver={e => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)} onDrop={drop}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 99, background: 'var(--color-primary-soft)', display: 'grid', placeItems: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17V3" /><path d="m6 9 6-6 6 6" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
              </div>
              <span style={{ font: 'var(--text-title-md)' }}>{over ? '여기에 놓으세요' : 'CSV 파일을 끌어다 놓으세요'}</span>
              <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-muted)' }}>또는</span>
              <DS.Button onClick={() => start(null)}>파일 선택</DS.Button>
              <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)', marginTop: 4 }}>.csv · 최대 10MB · CP949/UTF-8</span>
            </div>
          </div>
        ) : (
          <DS.Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
              <div className="fs-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ font: 'var(--text-title-sm)' }}>{file.current}</span>
                  <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)' }}>{phase === 'done' ? '거래 148건 · 2026년 7월' : '읽는 중…'}</span>
                </div>
                {phase === 'done' ? <DS.Badge tone="primary">완료</DS.Badge> : <DS.Badge>처리 중</DS.Badge>}
              </div>
              <DS.ProgressBar value={step} max={4} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {PARSE_STEPS.map((s, i) => {
                  const state = i < step ? 'done' : i === step ? 'now' : 'wait';
                  return (
                    <div key={s.t} style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: i === 0 ? 'none' : '1px solid var(--color-hairline-soft)', opacity: state === 'wait' ? .38 : 1, transition: 'opacity .3s ease' }}>
                      <span style={{ width: 18, height: 18, borderRadius: 99, marginTop: 2, flexShrink: 0, display: 'grid', placeItems: 'center', background: state === 'done' ? 'var(--color-primary)' : 'var(--color-surface-strong)' }}>
                        {state === 'done' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                        {state === 'now' && <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--color-primary)', animation: 'fsPulse 1s ease-in-out infinite' }} />}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ font: 'var(--text-title-sm)', color: 'var(--color-ink)' }}>{s.t}</span>
                        <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-body)' }}>{s.s}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {phase === 'done' && <span style={{ font: 'var(--text-body-sm)', color: 'var(--color-primary)' }}>대시보드로 이동할게요…</span>}
            </div>
          </DS.Card>
        )}
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <DS.Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="fs-eyebrow">이 파일로 무엇을 하나요</span>
                <h2 className="fs-h1" style={{ font: 'var(--text-title-lg)' }}>카드 내역 전체가 AI로 넘어가지 않아요</h2>
              </div>
              <PrivacyList items={D.privacy} />
              <span style={{ font: 'var(--text-caption)', color: 'var(--color-muted)', borderTop: '1px solid var(--color-hairline-soft)', paddingTop: 'var(--space-base)' }}>
                컬럼을 못 찾으면 분석을 진행하지 않고 어떤 컬럼이 없었는지 알려드려요. 원본 CSV 재다운로드는 제공하지 않습니다.
              </span>
            </div>
          </DS.Card>
        </div>
      </div>
    </AppShell>
  );
}

Object.assign(window, { Landing, EmptyState, Upload });
