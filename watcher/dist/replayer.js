import chalk from "chalk";
export async function replayIncident(incident) {
    console.log(chalk.bold(`\n[Replayer] Analyzing incident for selector ${chalk.cyan(incident.selector)}...`));
    console.log(`  Triggered By:     ${incident.triggeredBy}`);
    console.log(`  Bad Version:      v${incident.badVersion} (Quarantined)`);
    console.log(`  Good Version:     v${incident.goodVersion} (Restored Stable)`);
    console.log(`  Tx Hash:          ${incident.transactionHash}`);
    console.log(`  Block Number:     ${incident.blockNumber}`);
    const details = `Incident replay on selector ${incident.selector}: Attack transaction ${incident.transactionHash} triggered invariant violation in v${incident.badVersion}. Soft-fail guard rolled back to v${incident.goodVersion}.`;
    return { success: true, details };
}
