#!/usr/bin/env node

/**
 * Merges V8 coverage data from Playwright tests into an Istanbul coverage report.
 * Reads raw coverage JSON files from tests/coverage/raw/
 * Outputs HTML + text reports to tests/coverage/report/
 */

const fs = require('fs');
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const RAW_DIR = path.join(__dirname, '..', 'coverage', 'raw');
const REPORT_DIR = path.join(__dirname, '..', 'coverage', 'report');
const PROJECT_ROOT = path.join(__dirname, '..', '..');

// Files we care about for coverage
const TRACKED_PATTERNS = [
  '/js/config.js',
  '/js/bridge-sms-verify.js',
  '/js/bridge-booking.js',
];

// Coverage targets by file
const TARGETS = {
  'js/config.js': 100,
  'js/bridge-sms-verify.js': 95,
  'js/bridge-booking.js': 90,
  aggregate: 92.3,
};

async function main() {
  if (!fs.existsSync(RAW_DIR)) {
    console.error('No coverage data found. Run tests first: npx playwright test');
    process.exit(1);
  }

  const rawFiles = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'));
  if (rawFiles.length === 0) {
    console.error('No coverage JSON files found in', RAW_DIR);
    process.exit(1);
  }

  console.log(`Processing ${rawFiles.length} coverage files...`);

  const coverageMap = libCoverage.createCoverageMap({});

  for (const file of rawFiles) {
    const entries = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));

    for (const entry of entries) {
      // Filter to only tracked JS files
      const url = entry.url || '';
      const isTracked =
        TRACKED_PATTERNS.some((p) => url.includes(p)) ||
        url.includes('.html'); // Inline scripts in HTML

      if (!isTracked) continue;

      try {
        // Convert URL to file path
        let filePath;
        const urlObj = new URL(url);
        const relativePath = urlObj.pathname.replace(/^\//, '');
        filePath = path.join(PROJECT_ROOT, relativePath);

        if (!fs.existsSync(filePath)) continue;

        const converter = v8toIstanbul(filePath, 0, {
          source: entry.source || fs.readFileSync(filePath, 'utf-8'),
        });
        await converter.load();
        converter.applyCoverage(entry.functions || []);
        const istanbulData = converter.toIstanbul();
        coverageMap.merge(istanbulData);
      } catch (err) {
        // Skip entries that can't be converted (e.g., inline scripts)
        if (process.env.DEBUG) {
          console.warn(`Skipping ${url}: ${err.message}`);
        }
      }
    }
  }

  // Generate reports
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const context = libReport.createContext({
    dir: REPORT_DIR,
    coverageMap,
    defaultSummarizer: 'nested',
  });

  // Text summary to console
  reports.create('text').execute(context);

  // HTML report
  reports.create('html').execute(context);

  // JSON summary
  reports.create('json-summary').execute(context);

  console.log(`\nHTML report: ${REPORT_DIR}/index.html`);

  // Check targets
  const summary = coverageMap.getCoverageSummary();
  const totalPct = summary.lines.pct;

  console.log(`\n--- Coverage Summary ---`);
  console.log(`Aggregate line coverage: ${totalPct}%`);
  console.log(`Target: ${TARGETS.aggregate}%`);

  if (totalPct < TARGETS.aggregate) {
    console.error(`\nFAIL: Coverage ${totalPct}% is below target ${TARGETS.aggregate}%`);
    process.exit(1);
  } else {
    console.log(`\nPASS: Coverage meets target`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
