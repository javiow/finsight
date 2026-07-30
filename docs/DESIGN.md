# 디자인 산출물

Claude Design에서 만든 프로토타입이 `design/`에 있다. **디자인 판단의 기준은 이 파일들이다** — 색·간격·타이포를 새로 지어내지 말고 여기서 가져온다.

프로토타입은 CDN React + Babel + 인라인 `style={{}}`로 만든 탐색용 산출물이다. 본 구현은 Next.js + Tailwind + shadcn/ui다. **그대로 복사하는 게 아니라 이식한다.**

## 파일 지도

| 파일 | 내용 | 언제 읽나 |
|---|---|---|
| `design/finsight-dark.css` | **팔레트 원본.** 다크 토큰 재매핑 + `.fs-*` 레이아웃 클래스 | Tailwind 테마 세팅, 색·간격 결정 시 |
| `design/_ds/*/tokens/*.css` | 원본 토큰 정의 (colors·typography·spacing·radius·shadows·fonts) | 위 파일의 상위 정의가 필요할 때 |
| `design/_ds/*/_ds_manifest.json` | 토큰 79개 전체 목록 + 값 | 토큰 이름/값을 한 번에 훑을 때 |
| `design/_ds/*/_ds_bundle.js` | DS 컴포넌트 17개 구현 | 컴포넌트 치수·상태·variant 확인 시 |
| `design/_ds/*/readme.md` | 톤·보이스·비주얼 원칙, 알려진 공백 | 카피 톤, 아이콘 정책 확인 시 |
| `design/finsight-parts.jsx` | Donut·Legend·TrendChart·LockVeil·InsightItem·PrivacyList·SectionHead·Wordmark | 차트/게이팅 UI 만들 때 |
| `design/finsight-dashboard.jsx` | AppShell·Dashboard·MobileScreens | 대시보드 레이아웃 만들 때 |
| `design/finsight-screens.jsx` | Landing·EmptyState·Upload | 랜딩/업로드 만들 때 |
| `design/finsight-data.js` | 목 데이터 + `FS_WON`(₩ 포맷) + `FS_SLICE`(차트 색 램프) | 포맷 규칙·차트 색 산출식 확인 시 |
| `design/FinSight Prototype.html` | 엔트리 (라우팅·Tweaks) | 화면 목록 확인 시 |
| `design/tweaks-panel.jsx` | Claude Design 전용 스캐폴드 | **읽지 않는다. 이식 대상 아님** |

프로토타입을 브라우저로 확인하려면 `npx --yes serve design -p 5000` 후 `/FinSight%20Prototype.html`. `file://`로는 안 열린다 (Babel이 `.jsx`를 XHR로 가져와 CORS에 막힌다).

## 화면 → 라우트 매핑

프로토타입의 화면 구분은 탐색용이고, **라우트 구조는 `ARCHITECTURE.md`가 기준이다.**

| 프로토타입 화면 | 이식 대상 |
|---|---|
| `Landing` | `app/page.tsx` + `app/pricing/` (요금제 섹션 분리) |
| `Upload` | 업로드 위젯 컴포넌트 — **독립 라우트로 만들지 않는다.** `dashboard/page.tsx`에 올라간다 |
| `EmptyState` | `dashboard/page.tsx`의 명세서 0건 상태 |
| `Dashboard` | `(dashboard)/dashboard/page.tsx`. 거래 테이블은 `transactions/page.tsx`, 월별 추이는 `trends/page.tsx`로 분리 |
| `MobileScreens` | 라우트가 아니다. 반응형 검증용 참고 화면 |

프로토타입 사이드바에는 `업로드`가 있고 `설정`이 없다. **ARCHITECTURE.md를 따른다** — 업로드는 대시보드 안에 두고, 사이드바는 `대시보드` · `거래` · `추이` 셋이다. 설정 페이지는 MVP에 없고(PRD "MVP 제외 사항"), 플랜 관리는 Polar 고객 포털 링크로 대체한다.

## 컴포넌트 이식 방침

**shadcn/ui로 대체** (프로토타입 구현을 베끼지 않고, 치수·색만 맞춘다):
Button · Input · Select · Checkbox · Switch · Badge · Dialog · Tabs · Tooltip · Toast(sonner) · Tag(Badge 변형)

**직접 만든다** (shadcn에 없는 도메인 컴포넌트):
StatCard · TransactionRow · ProgressBar · AmountDisplay · LockVeil · InsightItem · PrivacyList · SectionHead · Wordmark · AppShell/Sidebar

**차트는 Recharts로 다시 만든다.** 프로토타입의 Donut·TrendChart는 손으로 그린 SVG다. 그대로 쓰지 말고 Recharts로 옮긴다. 색 램프는 `FS_SLICE` 산출식을 따른다.
**차트 작업 전 `dataviz` 스킬을 반드시 로드할 것.**

## 지켜야 하는 것

- **토큰을 경유한다.** raw hex나 raw px를 컴포넌트에 박지 않는다. `design/_ds/*/_adherence.oxlintrc.json`이 원본 프로젝트에서 이걸 lint로 막고 있었다.
- **금액은 항상 monospace.** `--font-mono`(JetBrains Mono) + `tabular-nums`. 금액 컬럼이 세로로 정렬되어야 한다. 포맷은 `FS_WON` = `₩` + `toLocaleString('ko-KR')`.
- **다크 고정.** 라이트 토큰을 만들지 않는다 (PRD "디자인").
- **아이콘을 손으로 그리지 않는다.** DS에 아이콘 세트가 없다. Lucide를 쓴다 (shadcn 기본 의존성이고, 프로토타입의 인라인 SVG도 Lucide 계열 스트로크다).
- **포인트 컬러는 1개.** 프로토타입 기본값은 `#3ecf8e`(green), `finsight-dark.css`의 `--accent` 기본값은 `#4b7bff`(blue). **`#3ecf8e`를 쓴다** — Tweaks에서 확정된 값이다. `--accent` 하나만 바꾸면 나머지 primary 토큰이 `color-mix`로 따라온다.
- **로고 파일이 없다.** `finsight` 워드마크(Inter 800, `letter-spacing:-.03em`)가 로고 자리를 대신한다.

## 프로토타입에 없는 것

프로토타입은 해피 패스만 그렸다. 아래는 구현 시 새로 디자인해야 하며, 위 토큰과 컴포넌트 안에서 해결한다.

- 파싱 실패 안내 (어떤 컬럼을 못 찾았는지 — PRD "MVP 제외 사항"의 수동 지정 UI 대체물)
- 카테고리 수정 UI (ADR-006)
- 로그인·회원가입 (`_ds_bundle.js`의 `ui_kits/web-dashboard/Login.jsx`가 라이트 모드 참고용으로 있다)
- "결제 확인 중" 배너 (ADR-007)
- 업로드 한도 초과 안내 (ADR-009)
