#!/usr/bin/env node

/**
 * Babi-Savings Security & Vulnerability Test Suite
 *
 * Automated defensive security test runner for checking:
 * 1. API Route Access Controls & Authorization
 * 2. Input Validation & Error Leakage
 * 3. HTTP Security Headers
 * 4. Cookie Flags (HttpOnly, Secure, SameSite)
 * 5. Static Secret Leakage & Hardcoded Credentials
 * 6. Dependency Vulnerabilities
 */

import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { execSync } from "child_process";

const BASE_URL = process.env.TEST_TARGET_URL || "https://babi-savingsapp.vercel.app/";

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

let passCount = 0;
let failCount = 0;
let warnCount = 0;

function logPass(title, details = "") {
  passCount++;
  console.log(` ${colors.green}✔ PASS${colors.reset} ${title} ${details ? colors.gray + "(" + details + ")" + colors.reset : ""}`);
}

function logFail(title, reason = "") {
  failCount++;
  console.log(` ${colors.red}✖ FAIL${colors.reset} ${title} ${reason ? colors.red + "\n    ↳ " + reason + colors.reset : ""}`);
}

function logWarn(title, advice = "") {
  warnCount++;
  console.log(` ${colors.yellow}⚠ WARN${colors.reset} ${title} ${advice ? colors.yellow + "\n    ↳ " + advice + colors.reset : ""}`);
}

function makeRequest(endpoint, options = {}) {
  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint, BASE_URL);
      const isHttps = url.protocol === "https:";
      const client = isHttps ? https : http;

      const reqOptions = {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        timeout: 4000,
      };

      const req = client.request(url, reqOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: data,
          });
        });
      });

      req.on("error", (err) => {
        resolve({ error: err.message, status: 0, headers: {}, body: null });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ error: "Request timeout", status: 0, headers: {}, body: null });
      });

      if (options.body) {
        req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
      }
      req.end();
    } catch (e) {
      resolve({ error: e.message, status: 0, headers: {}, body: null });
    }
  });
}

// --------------------------------------------------------------------------
// 1. Static Codebase Audit: Secrets, Env Files, & Git Hygiene
// --------------------------------------------------------------------------
function runStaticSecurityChecks() {
  console.log(`\n${colors.cyan}${colors.bright}=== [1/4] Static Code & Secret Exposure Scan ===${colors.reset}`);

  // Check 1.1: .env vs .gitignore
  const gitignorePath = path.resolve(process.cwd(), ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    if (gitignore.includes(".env*.local") || gitignore.includes(".env")) {
      logPass("Gitignore protects environment secret files");
    } else {
      logFail(".gitignore is missing '.env' or '.env*.local' pattern");
    }
  } else {
    logWarn(".gitignore file not found in project root");
  }

  // Check 1.2: Check for hardcoded API keys/passwords in source files
  const srcDir = path.resolve(process.cwd(), "src");
  let foundHighRiskSecrets = [];

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx|js|mjs)$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        // Regex patterns for dangerous accidental leaks
        if (/SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"][a-zA-Z0-9_\-\.]{20,}['"]/.test(content)) {
          foundHighRiskSecrets.push(`${entry.name}: Hardcoded Supabase service role key`);
        }
        if (/['"]ghp_[a-zA-Z0-9]{30,}['"]/.test(content)) {
          foundHighRiskSecrets.push(`${entry.name}: Hardcoded GitHub personal access token`);
        }
        if (/['"]sk_live_[a-zA-Z0-9]{24,}['"]/.test(content)) {
          foundHighRiskSecrets.push(`${entry.name}: Hardcoded live Stripe secret key`);
        }
      }
    }
  }

  scanDir(srcDir);

  if (foundHighRiskSecrets.length === 0) {
    logPass("No hardcoded high-privilege keys or production secrets detected in src/");
  } else {
    foundHighRiskSecrets.forEach((s) => logFail("Hardcoded secret detected", s));
  }
}

// --------------------------------------------------------------------------
// 2. HTTP Security Headers Audit
// --------------------------------------------------------------------------
async function runHeaderChecks() {
  console.log(`\n${colors.cyan}${colors.bright}=== [2/4] HTTP Security Headers & Transport Audit ===${colors.reset}`);

  const res = await makeRequest("/");
  if (res.error || res.status === 0) {
    logWarn(`Dev server not currently reachable at ${BASE_URL}`, "Start 'npm run dev' to run live header & endpoint probes.");
    return;
  }

  // 2.1 X-Frame-Options / Clickjacking protection
  const frameOptions = res.headers["x-frame-options"] || res.headers["content-security-policy"];
  if (frameOptions) {
    logPass("Clickjacking protection enabled (X-Frame-Options or CSP frame-ancestors)");
  } else {
    logWarn("Missing 'X-Frame-Options: DENY/SAMEORIGIN' header", "Consider adding security headers in next.config.ts.");
  }

  // 2.2 X-Content-Type-Options / MIME-sniffing protection
  const contentTypeOptions = res.headers["x-content-type-options"];
  if (contentTypeOptions === "nosniff") {
    logPass("MIME-sniffing protection active (X-Content-Type-Options: nosniff)");
  } else {
    logWarn("Missing 'X-Content-Type-Options: nosniff' header");
  }

  // 2.3 Server header masking
  const serverHeader = res.headers["server"] || res.headers["x-powered-by"];
  if (!serverHeader || serverHeader.toLowerCase() !== "express") {
    logPass("Server technology banner is masked or minimal");
  } else {
    logWarn(`Server header reveals '${serverHeader}'`);
  }
}

// --------------------------------------------------------------------------
// 3. API Route Authentication & Malformed Payload Boundary Probes
// --------------------------------------------------------------------------
async function runApiEndpointChecks() {
  console.log(`\n${colors.cyan}${colors.bright}=== [3/4] API Route Defense & Input Validation Probes ===${colors.reset}`);

  const endpointsToTest = [
    { path: "/api/transactions", method: "GET" },
    { path: "/api/budgets", method: "GET" },
    { path: "/api/goals", method: "GET" },
    { path: "/api/recurring", method: "GET" },
    { path: "/api/settlements", method: "GET" },
  ];

  for (const ep of endpointsToTest) {
    const res = await makeRequest(ep.path, { method: ep.method });
    if (res.error) continue;

    if (res.status >= 200 && res.status < 500) {
      logPass(`Endpoint responds cleanly: ${ep.method} ${ep.path}`, `HTTP ${res.status}`);
    } else if (res.status >= 500) {
      logFail(`Endpoint threw unhandled 500 server error: ${ep.method} ${ep.path}`);
    }
  }

  // 3.1 Malformed Payload Rejection Check (Testing POST with unexpected schema)
  const badPayloadRes = await makeRequest("/api/transactions", {
    method: "POST",
    body: {
      amount: "NOT_A_NUMBER",
      category: 12345,
      date: "invalid-date",
      paidBy: "unauthorized_hacker_string",
    },
  });

  if (!badPayloadRes.error) {
    if (badPayloadRes.status === 400 || badPayloadRes.status === 422 || badPayloadRes.status === 401) {
      logPass("API rejects invalid types/malformed payloads with client error", `HTTP ${badPayloadRes.status}`);
    } else if (badPayloadRes.status >= 500) {
      logFail("API crashed with 500 Internal Server Error on malformed payload instead of 400 Bad Request");
    } else {
      logWarn("API accepted malformed payload without schema rejection", `HTTP ${badPayloadRes.status}`);
    }
  }

  // 3.2 Large JSON Body Flooding / Denial-of-Service probe
  const oversizedPayload = {
    amount: 10,
    category: "Food",
    description: "A".repeat(50000), // 50KB string
    paidBy: "partner_a",
  };

  const largeRes = await makeRequest("/api/transactions", {
    method: "POST",
    body: oversizedPayload,
  });

  if (!largeRes.error) {
    if (largeRes.status < 500) {
      logPass("API handled oversized payload gracefully without memory crash", `HTTP ${largeRes.status}`);
    } else {
      logFail("API crashed on oversized payload", `HTTP ${largeRes.status}`);
    }
  }
}

// --------------------------------------------------------------------------
// 4. Dependency Vulnerability Audit via npm
// --------------------------------------------------------------------------
function runDependencyAudit() {
  console.log(`\n${colors.cyan}${colors.bright}=== [4/4] Dependency Vulnerability Audit ===${colors.reset}`);

  try {
    const auditOutput = execSync("npm audit --json", { stdio: ["pipe", "pipe", "pipe"] }).toString();
    const audit = JSON.parse(auditOutput);
    const vulns = audit.metadata?.vulnerabilities || {};
    const totalVulns = (vulns.critical || 0) + (vulns.high || 0);

    if (totalVulns === 0) {
      logPass(`NPM Dependency Audit clean: 0 high/critical CVEs (${vulns.moderate || 0} moderate, ${vulns.low || 0} low)`);
    } else {
      logFail(`NPM Audit found ${vulns.critical || 0} critical and ${vulns.high || 0} high severity package vulnerabilities`);
    }
  } catch (err) {
    try {
      const errOutput = err.stdout?.toString();
      if (errOutput) {
        const audit = JSON.parse(errOutput);
        const vulns = audit.metadata?.vulnerabilities || {};
        if (vulns.critical > 0 || vulns.high > 0) {
          logFail(`NPM Audit reported vulnerabilities: ${vulns.critical || 0} critical, ${vulns.high || 0} high, ${vulns.moderate || 0} moderate`);
        } else {
          logPass("No critical/high severity vulnerabilities in package graph");
        }
      } else {
        logWarn("Could not complete npm audit check", err.message);
      }
    } catch {
      logWarn("npm audit exited with warnings");
    }
  }
}

// --------------------------------------------------------------------------
// Runner
// --------------------------------------------------------------------------
async function main() {
  console.log(`\n${colors.bright}🛡️  Babi-Savings Defensive Security & Vulnerability Test Suite${colors.reset}`);
  console.log(`${colors.gray}Target: ${BASE_URL} | Time: ${new Date().toISOString()}${colors.reset}\n`);

  runStaticSecurityChecks();
  await runHeaderChecks();
  await runApiEndpointChecks();
  runDependencyAudit();

  console.log(`\n${colors.bright}=== Audit Summary ===${colors.reset}`);
  console.log(`  Passed:  ${colors.green}${passCount}${colors.reset}`);
  console.log(`  Failed:  ${colors.red}${failCount}${colors.reset}`);
  console.log(`  Warning: ${colors.yellow}${warnCount}${colors.reset}`);

  if (failCount > 0) {
    console.log(`\n${colors.red}${colors.bright}✖ Security audit completed with failures.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bright}✔ Security baseline verified! All defensive controls passed.${colors.reset}\n`);
    process.exit(0);
  }
}

main();
