import { startWatcher, processRollback } from "./listener.js";
const args = process.argv.slice(2);
if (args.includes("--demo") || args.includes("demo")) {
    console.log("Starting SolGit AI Watcher in Self-Healing Demo Mode...\n");
    const sampleIncident = {
        selector: "0x2e1a7d4d", // withdraw(uint256)
        badVersion: 2,
        goodVersion: 1,
        triggeredBy: "0x67852244E41F39CA15605264536E94BaBf56A4e7",
        contextHash: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
        blockNumber: 415022n,
        transactionHash: "0xa21801e7a4cee367f6dc7b0f93dc7d3c6755a09b9ec5a64f2467fb457ae253b9",
        timestamp: Date.now(),
    };
    processRollback(sampleIncident, {
        diamondAddress: "0x56B05b503A117840A73740a1b8744B12732e44e5",
        targetStableFacet: "0x463DC23a3E649Cf3FF54762F6588f1D71C207c01",
    }).then(() => {
        console.log("\nDemo run completed successfully.");
        process.exit(0);
    });
}
else {
    startWatcher();
}
