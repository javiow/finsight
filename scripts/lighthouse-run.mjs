#!/usr/bin/env node
// Lighthouse 성능 측정 스크립트 — lighthouse-optimize 스킬의 "측정" 담당.
// 코드를 고치지 않는다. 프로덕션 빌드(.next)를 서버로 띄우고, 지정된 공개 라우트를
// Lighthouse로 측정해 lighthouse-reports/history.json에 누적 기록한다.
//
// 사용법: node scripts/lighthouse-run.mjs [--iteration N]
// 사전 조건: npm run build 로 .next 프로덕션 빌드가 이미 생성되어 있어야 한다.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "lighthouse-reports");
const HISTORY_PATH = path.join(REPORTS_DIR, "history.json");
const PORT = 4173;
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

// 인증 없이 접근 가능한 공개 라우트만 측정한다.
// 대시보드/거래내역/트렌드는 로그인 세션이 필요해 Lighthouse가 로그인 페이지로
// 리다이렉트된 결과를 측정하게 되므로 의도적으로 제외했다.
const ROUTES = [
  { name: "landing", path: "/" },
  { name: "pricing", path: "/pricing" },
  { name: "login", path: "/login" },
];

function parseArgs() {
  const args = process.argv.slice(2);
  const iterIdx = args.indexOf("--iteration");
  const iteration = iterIdx >= 0 ? Number(args[iterIdx + 1]) : nextIteration();
  return { iteration };
}

function nextIteration() {
  if (!fs.existsSync(HISTORY_PATH)) return 1;
  const history = JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"));
  return (history.at(-1)?.iteration ?? 0) + 1;
}

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.status < 500) return resolve();
      } catch {
        // 서버가 아직 안 떴을 뿐
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error("next start 서버 기동 타임아웃 (30s)"));
      }
      setTimeout(tick, 500);
    };
    tick();
  });
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, ".next", "BUILD_ID"))) {
    throw new Error(
      "프로덕션 빌드가 없습니다. 먼저 `npm run build`를 실행하세요 (dev 서버는 최적화가 꺼져 있어 Lighthouse 점수가 왜곡됩니다).",
    );
  }

  const { iteration } = parseArgs();
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const iterDir = path.join(REPORTS_DIR, `iteration-${iteration}`);
  fs.mkdirSync(iterDir, { recursive: true });

  const server = spawn(`npx next start -p ${PORT}`, {
    cwd: ROOT,
    stdio: "pipe",
    shell: true,
  });
  let serverLog = "";
  server.stdout.on("data", (d) => (serverLog += d));
  server.stderr.on("data", (d) => (serverLog += d));

  let chrome;
  try {
    await waitForServer(`http://localhost:${PORT}/`);

    const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
      ...(fs.existsSync(chromePath) ? { chromePath } : {}),
    });

    const results = {};
    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route.path}`;
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: "json",
        onlyCategories: CATEGORIES,
        logLevel: "error",
      });
      const lhr = runnerResult.lhr;

      const reportPath = path.join(iterDir, `${route.name}.json`);
      fs.writeFileSync(reportPath, runnerResult.report);

      const scores = Object.fromEntries(
        CATEGORIES.map((c) => [c, Math.round((lhr.categories[c]?.score ?? 0) * 100)]),
      );
      const metrics = {
        LCP: Math.round(lhr.audits["largest-contentful-paint"]?.numericValue ?? 0),
        TBT: Math.round(lhr.audits["total-blocking-time"]?.numericValue ?? 0),
        CLS: Number((lhr.audits["cumulative-layout-shift"]?.numericValue ?? 0).toFixed(3)),
        FCP: Math.round(lhr.audits["first-contentful-paint"]?.numericValue ?? 0),
        SI: Math.round(lhr.audits["speed-index"]?.numericValue ?? 0),
      };
      const opportunities = Object.values(lhr.audits)
        .filter((a) => a.details?.type === "opportunity" && (a.numericValue ?? 0) > 0)
        .sort((a, b) => (b.numericValue ?? 0) - (a.numericValue ?? 0))
        .slice(0, 5)
        .map((a) => ({ id: a.id, title: a.title, savingsMs: Math.round(a.numericValue) }));

      results[route.name] = {
        url,
        scores,
        metrics,
        opportunities,
        reportPath: path.relative(ROOT, reportPath).replace(/\\/g, "/"),
      };
    }

    const history = fs.existsSync(HISTORY_PATH)
      ? JSON.parse(fs.readFileSync(HISTORY_PATH, "utf-8"))
      : [];
    history.push({ iteration, timestamp: new Date().toISOString(), results });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));

    printSummary(iteration, results, history);
  } catch (err) {
    if (serverLog) console.error("--- next start 로그 ---\n" + serverLog);
    throw err;
  } finally {
    // Windows에서 chrome-launcher가 임시 프로필 디렉터리를 정리할 때
    // 파일 잠금으로 EPERM이 나는 경우가 있다. 측정은 이미 끝났으므로
    // 정리 실패가 전체 실행을 실패로 만들지 않게 한다.
    if (chrome) {
      try {
        await chrome.kill();
      } catch (err) {
        console.warn(`Chrome 임시 프로필 정리 실패(무시): ${err.message ?? err}`);
      }
    }
    server.kill();
  }
}

function printSummary(iteration, results, history) {
  console.log(`\n=== Lighthouse iteration ${iteration} ===`);
  const prev = history.length > 1 ? history[history.length - 2] : null;

  for (const [name, r] of Object.entries(results)) {
    console.log(`\n[${name}] ${r.url}`);
    console.log(
      `  performance=${r.scores.performance} accessibility=${r.scores.accessibility} ` +
        `best-practices=${r.scores["best-practices"]} seo=${r.scores.seo}`,
    );
    console.log(
      `  LCP=${r.metrics.LCP}ms TBT=${r.metrics.TBT}ms CLS=${r.metrics.CLS} ` +
        `FCP=${r.metrics.FCP}ms SI=${r.metrics.SI}ms`,
    );
    if (prev?.results[name]) {
      const before = prev.results[name].scores.performance;
      const after = r.scores.performance;
      const delta = after - before;
      console.log(`  performance 변화: ${before} -> ${after} (${delta >= 0 ? "+" : ""}${delta})`);
    }
    if (r.opportunities.length) {
      console.log("  top opportunities:");
      for (const o of r.opportunities) {
        console.log(`   - [${o.id}] ${o.title} (~${o.savingsMs}ms 절감 추정)`);
      }
    }
    console.log(`  report: ${r.reportPath}`);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
