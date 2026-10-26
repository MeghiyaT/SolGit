// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import {SolGitRouter} from "../src/core/SolGitRouter.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {GuardExecutor} from "../src/core/GuardExecutor.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {VaultV2} from "../src/facets/VaultV2.sol";
import {Attacker} from "../src/test-helpers/Attacker.sol";

/// @title Deploy — Deploy SolGit to MST Testnet
/// @notice Deploys all contracts, wires them together, and pushes initial versions
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy infrastructure
        VersionRegistry registry = new VersionRegistry(deployer);
        console.log("VersionRegistry:", address(registry));

        GuardExecutor guard = new GuardExecutor();
        console.log("GuardExecutor:", address(guard));

        SolGitRouter router = new SolGitRouter(address(registry), address(guard), deployer);
        console.log("SolGitRouter:", address(router));

        // Wire registry to router
        registry.setRouter(address(router));

        // 2. Deploy facets
        VaultV1 vaultV1 = new VaultV1();
        console.log("VaultV1:", address(vaultV1));

        VaultV2 vaultV2 = new VaultV2();
        console.log("VaultV2:", address(vaultV2));

        // 3. Deploy attacker (for demo)
        Attacker attackerContract = new Attacker(address(router));
        console.log("Attacker:", address(attackerContract));

        // 4. Push V1 for all selectors and promote to Stable
        bytes4 depositSel = bytes4(keccak256("deposit()"));
        bytes4 withdrawSel = bytes4(keccak256("withdraw(uint256)"));
        bytes4 transferSel = bytes4(keccak256("transfer(address,uint256)"));
        bytes4 balanceSel = bytes4(keccak256("balanceOf(address)"));

        registry.pushVersion(depositSel, address(vaultV1));
        registry.promote(depositSel, 1);

        registry.pushVersion(withdrawSel, address(vaultV1));
        registry.promote(withdrawSel, 1);

        registry.pushVersion(transferSel, address(vaultV1));
        registry.promote(transferSel, 1);

        registry.pushVersion(balanceSel, address(vaultV1));
        registry.promote(balanceSel, 1);

        // 5. Push V2 for withdraw (Active, NOT promoted — the buggy version)
        registry.pushVersion(withdrawSel, address(vaultV2));

        console.log("---");
        console.log("Deployment complete!");
        console.log("Withdraw is now on V2 (buggy, Active)");
        console.log("All other selectors on V1 (Stable)");

        vm.stopBroadcast();
    }
}
