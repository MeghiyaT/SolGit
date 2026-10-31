import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import chalk from "chalk";
import { Octokit } from "@octokit/rest";
import type { FixResult } from "./lib/types.js";

export async function createPullRequest(fix: FixResult): Promise<{ branch: string; prUrl?: string }> {
  const branch = `solgit-fix-${fix.selector.slice(0, 8)}-v${fix.badVersion}`;
  console.log(chalk.bold(`\n[GitHub / Git Integration] Creating clean isolated fix branch ${chalk.cyan(branch)}...`));

  let rootDir = process.cwd();
  if (!fs.existsSync(path.join(rootDir, "src", "facets")) && fs.existsSync(path.join(rootDir, "..", "src", "facets"))) {
    rootDir = path.resolve(rootDir, "..");
  }

  // Ensure stale local branch with same name is removed first
  try {
    execSync(`git branch -D ${branch}`, { cwd: rootDir, stdio: "ignore" });
  } catch {}

  const tempWorktreeDir = path.join(os.tmpdir(), `solgit-wt-${Date.now()}`);

  try {
    // 1. Create clean isolated git worktree without touching active workspace branch
    execSync(`git worktree add -b ${branch} ${tempWorktreeDir} HEAD`, {
      cwd: rootDir,
      stdio: "pipe",
    });

    // 2. Copy/write the patched facet into the isolated worktree
    const fixedFacetRelPath = path.join("src", "facets", "VaultV2Fixed.sol");
    const targetFile = path.join(tempWorktreeDir, fixedFacetRelPath);
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    fs.writeFileSync(targetFile, fix.fixedCode, "utf-8");

    // 3. Stage and commit exclusively in the worktree
    execSync(`git add ${fixedFacetRelPath}`, { cwd: tempWorktreeDir, stdio: "pipe" });
    const commitMsg = `fix(security): auto-patch selector ${fix.selector} quarantined v${fix.badVersion}`;
    execSync(`git commit -m "${commitMsg}"`, {
      cwd: tempWorktreeDir,
      stdio: "pipe",
    });

    console.log(chalk.green(`  ✔ Committed fix to isolated branch '${branch}' without altering active working copy.`));

    // 4. Remote GitHub integration (if configured)
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

      // Push isolated branch to remote first before PR creation
      console.log(chalk.gray(`  Pushing branch '${branch}' to remote...`));
      execSync(`git push origin ${branch} --force`, { cwd: tempWorktreeDir, stdio: "pipe" });

      const pr = await octokit.rest.pulls.create({
        owner,
        repo,
        title: `[SolGit Auto-Fix] Secure patch for selector ${fix.selector} (quarantined v${fix.badVersion})`,
        head: branch,
        base: "main",
        body: `## SolGit Self-Healing AI Security Patch\n\n### Incident Details\n- **Target Selector**: \`${fix.selector}\`\n- **Quarantined Version**: v${fix.badVersion}\n\n### Vulnerability Analysis & Solution\n${fix.explanation}\n\n\`\`\`diff\n${fix.diff}\n\`\`\`\n\n### Test Results\n- Compilation & Verification: **${fix.testsPassed ? "PASSED" : "FAILED"}**\n\n*Generated automatically by SolGit AI Watcher Service on MST Blockchain.*`,
      });

      console.log(chalk.green(`  ✔ GitHub Pull Request created: ${pr.data.html_url}`));
      return { branch, prUrl: pr.data.html_url };
    }

    // Local simulation mode
    const simulatedUrl = `https://github.com/SolGit/solgit-platform/pull/simulated-${fix.badVersion}`;
    console.log(chalk.green(`  ✔ Clean fix branch ready in git: '${branch}'`));
    console.log(chalk.gray(`  (Local PR simulated: ${simulatedUrl})`));
    return { branch, prUrl: simulatedUrl };
  } catch (err: any) {
    console.warn(chalk.yellow(`  Git branch notification: ${err.message}`));
    return { branch };
  } finally {
    // 5. Clean up the temporary worktree directory
    try {
      execSync(`git worktree remove --force ${tempWorktreeDir}`, { cwd: rootDir, stdio: "ignore" });
    } catch {}
  }
}
