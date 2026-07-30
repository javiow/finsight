# finsight Design System

**finsight** is an MVP personal finance / household budgeting web app (개인 자산관리·가계부). No existing codebase, Figma, or brand assets were attached — this design system was built from scratch based on the founder's direction: friendly & casual tone, a single blue accent, Inter-based type, and a text wordmark (no logo file exists yet).

No external sources (Figma links, GitHub repos) are on file for this project. If you later attach a codebase or Figma file, re-run the design-system builder to reconcile these tokens/components against the real source.

## Content Fundamentals
- **Tone:** friendly, casual, encouraging — like a good friend who's good with money, not a bank. Uses "-요/-해요" conversational endings in Korean copy rather than formal "-습니다".
- **Voice:** second-person, warm ("이번 달도 잘하고 계세요"). Celebrates small wins ("지난달보다 12% 덜 썼어요. 잘하고 있어요 👍") instead of just reporting numbers.
- **Casing:** sentence case for body copy; badges/labels are uppercase pills (e.g. "완료").
- **Emoji:** used sparingly as warmth accents in encouraging moments (👋, 👍) — never in data-dense UI (transaction rows, tables).
- **Numbers:** always formatted with thousands separators and ₩ symbol, rendered in monospace (JetBrains Mono) wherever they appear so columns of amounts align.

## Visual Foundations
- **Color:** one scarce brand accent — finsight blue `#1450FF` — carries every primary CTA and active nav state. Neutrals are a cool slate scale (ink → body → muted). Semantic green/red are text-only (income/expense), never background fills, matching common fintech convention of not turning whole rows red/green.
- **Type:** Inter throughout — 700 weight for display headlines (friendly-confident, not shouty), 600 for titles/buttons, 400 for body. JetBrains Mono for every numeric amount.
- **Spacing:** 4px base unit; 64px between major dashboard sections, 24–32px card padding. Denser than an editorial marketing site — appropriate for a dashboard product.
- **Backgrounds:** flat color only — no photography, no gradients, no illustration or texture. A soft-gray (`--color-surface-soft`) band separates the app shell from white cards.
- **Corner radius:** pill (999px) on every button/tag/badge/switch; 20px (`--radius-xl`) on cards; 12px on inputs; full circle on avatar/icon plates. No sharp corners.
- **Elevation:** one soft shadow tier (`--shadow-sm`) on resting cards, a slightly stronger `--shadow-md` on modals/toasts. No borders on elevated cards; hairline borders only on flat inline surfaces (inputs).
- **Motion:** short, subtle — 150ms ease transitions on hover/press color changes, switches, and progress bar fills. No bounce, no spring, nothing decorative.
- **Hover/press states:** buttons darken one step on hover (blue → darker blue) and scale to 0.97 on press. No opacity fades.
- **Transparency/blur:** used only for modal backdrops (40% black scrim), nowhere else.
- **Imagery:** none yet — this is a data/UI product, not a marketing site. No photography color-grade has been established.

## Iconography
No icon system, icon font, or SVG set was provided. The UI kit currently uses plain colored circular plates as placeholders where an icon/avatar would sit (e.g. transaction row leading glyph, sidebar icons omitted). **Do not hand-draw icons.** When real icons are needed, either wait for real assets from the founder, or substitute a CDN icon set with a similar weight to the friendly-casual tone (e.g. Lucide, rounded/regular stroke) and flag the substitution clearly to the user.

## Intentional additions
Since no source defined a component inventory, a standard set was authored sized to a personal-finance dashboard MVP: Button, Input, Select, Checkbox, Switch (forms) · Badge, Tag, Toast, Tooltip (feedback) · Tabs, Sidebar (navigation) · Card, StatCard, TransactionRow, ProgressBar, AmountDisplay (data-display, finance-specific) · Dialog (overlay).

## Index
- `styles.css` — root stylesheet, imports everything under `tokens/`.
- `tokens/` — colors, typography, spacing, radius, shadows, fonts (Inter + JetBrains Mono via Google Fonts).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Shape, Brand) shown in the Design System tab.
- `components/forms/` — Button, Input, Select, Checkbox, Switch
- `components/feedback/` — Badge, Tag, Toast, Tooltip
- `components/navigation/` — Tabs, Sidebar
- `components/data-display/` — Card, StatCard, TransactionRow, ProgressBar, AmountDisplay
- `components/overlay/` — Dialog
- `ui_kits/web-dashboard/` — finsight web app: Login, Dashboard, Transactions, Budgets screens, wired together in `index.html`.
- `SKILL.md` — portable skill file for use in Claude Code.

## Known Gaps
- No logo — wordmark rendered in Inter 800 stands in for a mark everywhere.
- No icon set — placeholder plates only.
- No real product copy, imagery, or brand assets were supplied; all colors/type/copy above are original, invented for this MVP and meant to be replaced once real brand assets exist.
