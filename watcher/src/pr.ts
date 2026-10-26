import { execSync } from "child_process";
import chalk from "chalk";
import { Octokit } from "@octokit/rest";
import type { FixResult } from "./lib/types.js";

export async function createPullRequest(fix: FixResult): Promise<{ branch: string; prUrl?: string }> {
  const branch = `solgit-fix-${fix.selector.slice(0, 8)}-v${fix.badVersion}`;
  console.log(chalk.bold(`\n[GitHub / Git Integration] Creating fix branch ${chalk.cyan(branch)}...`));

  try {
    // Check if git is available
    const gitStatus = execSync("git status --porcelain", { stdio: "pipe" }).toString();
    console.log(chalk.gray(`  Current working tree clean: ${!gitStatus}`));

    // In a live environment with GITHUB_TOKEN:
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
      const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

      const pr = await octokit.rest.pulls.create({
        owner,
        repo,
        title: `[SolGit Auto-Fix] Secure patch for selector ${fix.selector} (quarantined v${fix.badVersion})`,
        head: branch,
        base: "main",
        body: `## SolGit Self-Healing AI Security Patch\n\n### Incident Details\n- **Target Selector**: \`${fix.selector}\`\n- **Quarantined Version**: v${fix.badVersion}\n\n### Vulnerability Analysis & Solution\n${fix.explanation}\n\n\`\`\`diff\n${fix.diff}\n\`\`\`\n\n### Test Results\n- Compilation & Verification: **${fix.testsPassed ? "PASSED" : "PENDING"}**\n\n*Generated automatically by SolGit AI Watcher Service on MST Blockchain.*`,
      });

      console.log(chalk.green(`  ✔ Pull Request created: ${pr.data.html_url}`));
      return { branch, prUrl: pr.data.html_url };
    } else {
      console.log(chalk.green(`  ✔ Simulated Pull Request generated for branch '${branch}'`));
      console.log(chalk.gray("  (Set GITHUB_TOKEN and GITHUB_REPOSITORY in .env to auto-push to GitHub)"));
      return { branch, prUrl: `https://github.com/Study/SolGit/pull/simulated-${fix.badVersion}` };
    }
  } catch (err: any) {
    console.log(chalk.yellow(`  Git PR notice: ${err.message}`));
    return { branch };
  }
}
