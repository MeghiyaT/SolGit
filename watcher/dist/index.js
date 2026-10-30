import { startWatcher, processRollback } from "./listener.js";
const args = process.argv.slice(2);
if (args.includes("--demo") || args.includes("demo")) {
    console.log("Starting SolGit AI Watcher in Self-Healing Demo Mode...\n");
    const sampleIncident = {
        selector: "0x2e1a7d4d", // withdraw(uint256)
        badVersion: 2,
        goodVersion: 1,
        triggeredBy: "0x9dF0C6b0066D5317aA5b38B36850548DaCCa6B4e",
        contextHash: "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
        blockNumber: 120485n,
        transactionHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
        timestamp: Date.now(),
    };
    processRollback(sampleIncident, {
        diamondAddress: "0x3348f760E980326079011707B9E40a6b29910D69",
        targetStableFacet: "0x1111111111111111111111111111111111111111",
    }).then(() => {
        console.log("\nDemo run completed successfully.");
        process.exit(0);
    });
}
else {
    startWatcher();
}
