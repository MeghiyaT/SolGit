// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import {SolGitDiamond} from "../src/core/SolGitDiamond.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {DiamondCutFacet} from "../src/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../src/facets/OwnershipFacet.sol";
import {SolGitGuardianFacet} from "../src/facets/SolGitGuardianFacet.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {IDiamondCut} from "../src/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../src/interfaces/IDiamondLoupe.sol";
import {ISolGitGuardian} from "../src/interfaces/ISolGitGuardian.sol";

/// @title Deploy — Deploy SolGit EIP-2535 Platform Contracts to Network
contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address guardianAddress = vm.envOr("GUARDIAN_ADDRESS", deployer);

        console.log("Deployer:", deployer);
        console.log("Guardian:", guardianAddress);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy VersionRegistry
        VersionRegistry registry = new VersionRegistry(deployer);
        console.log("VersionRegistry:", address(registry));

        // 2. Deploy Diamond Core Facets
        DiamondCutFacet cutFacet = new DiamondCutFacet();
        console.log("DiamondCutFacet:", address(cutFacet));

        DiamondLoupeFacet loupeFacet = new DiamondLoupeFacet();
        console.log("DiamondLoupeFacet:", address(loupeFacet));

        OwnershipFacet ownerFacet = new OwnershipFacet();
        console.log("OwnershipFacet:", address(ownerFacet));

        SolGitGuardianFacet guardianFacet = new SolGitGuardianFacet();
        console.log("SolGitGuardianFacet:", address(guardianFacet));

        // 3. Deploy Initial Application Facet (VaultV1)
        VaultV1 vaultV1 = new VaultV1();
        console.log("VaultV1:", address(vaultV1));

        // 4. Construct initial diamond cuts
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);

        bytes4[] memory cutSelectors = new bytes4[](1);
        cutSelectors[0] = IDiamondCut.diamondCut.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(cutFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: cutSelectors
        });

        bytes4[] memory loupeSelectors = new bytes4[](4);
        loupeSelectors[0] = IDiamondLoupe.facets.selector;
        loupeSelectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        loupeSelectors[2] = IDiamondLoupe.facetAddresses.selector;
        loupeSelectors[3] = IDiamondLoupe.facetAddress.selector;
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(loupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });

        bytes4[] memory ownerSelectors = new bytes4[](2);
        ownerSelectors[0] = OwnershipFacet.owner.selector;
        ownerSelectors[1] = OwnershipFacet.transferOwnership.selector;
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(ownerFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: ownerSelectors
        });

        bytes4[] memory guardianSelectors = new bytes4[](5);
        guardianSelectors[0] = ISolGitGuardian.guardian.selector;
        guardianSelectors[1] = ISolGitGuardian.setGuardian.selector;
        guardianSelectors[2] = ISolGitGuardian.registerStableFacet.selector;
        guardianSelectors[3] = ISolGitGuardian.isRegisteredStableFacet.selector;
        guardianSelectors[4] = ISolGitGuardian.emergencyRollback.selector;
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(guardianFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: guardianSelectors
        });

        bytes4[] memory vaultSelectors = new bytes4[](4);
        vaultSelectors[0] = VaultV1.deposit.selector;
        vaultSelectors[1] = VaultV1.withdraw.selector;
        vaultSelectors[2] = VaultV1.transfer.selector;
        vaultSelectors[3] = VaultV1.balanceOf.selector;
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(vaultV1),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: vaultSelectors
        });

        // 5. Deploy SolGit Diamond Proxy
        SolGitDiamond diamond = new SolGitDiamond(deployer, guardianAddress, cuts, address(0), "");
        console.log("SolGitDiamond (Permanent Address):", address(diamond));

        // Register VaultV1 as trusted stable facet
        ISolGitGuardian(address(diamond)).registerStableFacet(address(vaultV1), true);

        // Register in VersionRegistry
        for (uint256 i = 0; i < vaultSelectors.length; i++) {
            registry.pushVersion(vaultSelectors[i], address(vaultV1));
            registry.promote(vaultSelectors[i], 1);
        }

        vm.stopBroadcast();
    }
}
