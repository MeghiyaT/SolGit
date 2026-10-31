import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import type { RollbackIncident, FixResult } from "./lib/types.js";
import { UnifiedAIClient } from "./lib/ai.js";

export async function generateFix(incident: RollbackIncident): Promise<FixResult> {
  console.log(chalk.bold(`\n[AI Fixer] Analyzing vulnerable facet for quarantined selector ${incident.selector}...`));

  // Find project root directory
  let rootDir = process.cwd();
  if (!fs.existsSync(path.join(rootDir, "src", "facets")) && fs.existsSync(path.join(rootDir, "..", "src", "facets"))) {
    rootDir = path.resolve(rootDir, "..");
  }

  // Identify vulnerable facet file (defaulting to VaultV2.sol)
  let targetFacetFile = "VaultV2.sol";
  let targetContractName = "VaultV2";
  const facetsDir = path.join(rootDir, "src", "facets");

  if (fs.existsSync(path.join(facetsDir, "VaultV2.sol"))) {
    targetFacetFile = "VaultV2.sol";
    targetContractName = "VaultV2";
  } else if (fs.existsSync(facetsDir)) {
    const files = fs.readdirSync(facetsDir);
    for (const file of files) {
      if (file.endsWith(".sol") && !file.includes("Fixed") && !file.includes("V1")) {
        const content = fs.readFileSync(path.join(facetsDir, file), "utf-8");
        if (content.includes("unchecked") || content.includes(incident.selector)) {
          targetFacetFile = file;
          targetContractName = file.replace(".sol", "");
          break;
        }
      }
    }
  }

  const vPath = path.join(facetsDir, targetFacetFile);
  let sourceCode = "";
  if (fs.existsSync(vPath)) {
    sourceCode = fs.readFileSync(vPath, "utf-8");
  } else {
    throw new Error(`Facet file not found: ${vPath}`);
  }

  // Initialize unified AI client (Groq + Gemini with fallback)
  const aiClient = new UnifiedAIClient();
  const fixResponse = await aiClient.generateSecurityFix({
    vulnerableSource: sourceCode,
    selector: incident.selector,
    incidentReason: "Arithmetic underflow vulnerability in withdraw without balance check",
    contractName: targetContractName,
  });

  const fixedContractName = `${targetContractName}Fixed`;
  const fixedFileName = `${fixedContractName}.sol`;
  const fixedPath = path.join(facetsDir, fixedFileName);

  // Write patched facet to disk
  fs.writeFileSync(fixedPath, fixResponse.fixedCode, "utf-8");
  console.log(chalk.green(`  ✔ Generated patched facet: src/facets/${fixedFileName}`));
  console.log(chalk.cyan(`    Provider: ${fixResponse.providerUsed} (${fixResponse.modelUsed})`));
  console.log(chalk.gray(`    Summary: ${fixResponse.explanation}`));

  // Verify fix with automated Foundry test run against VaultV2Fixed
  let testsPassed = false;
  try {
    console.log(chalk.cyan(`  Running automated verification via Foundry (\`forge test --match-contract ${fixedContractName}Test\`)...`));
    const testOutput = execSync(
      `export PATH="$HOME/.foundry/bin:$PATH" && forge test --match-contract ${fixedContractName}Test`,
      {
        cwd: rootDir,
        stdio: "pipe",
        encoding: "utf-8",
      }
    );

    if (testOutput.includes("[PASS]") && !testOutput.includes("[FAIL")) {
      testsPassed = true;
      console.log(chalk.green.bold(`  ✔ Automated Foundry tests PASSED! ${fixedContractName} verified clean.`));
    } else {
      console.error(chalk.red.bold(`  ❌ Foundry test suite reported failure in ${fixedContractName}:`));
      console.error(chalk.red(testOutput));
      testsPassed = false;
    }
  } catch (err: any) {
    console.error(chalk.red.bold(`  ❌ Automated test execution failed for ${fixedContractName}:`));
    console.error(chalk.red(err.stdout || err.message));
    testsPassed = false;
  }

  return {
    selector: incident.selector,
    badVersion: incident.badVersion,
    fixedCode: fixResponse.fixedCode,
    diff: fixResponse.diff,
    explanation: fixResponse.explanation,
    testsPassed,
  };
}
