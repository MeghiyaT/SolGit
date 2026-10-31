// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {SolGitDiamond} from "../src/core/SolGitDiamond.sol";
import {DiamondCutFacet} from "../src/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../src/facets/OwnershipFacet.sol";
import {SolGitGuardianFacet} from "../src/facets/SolGitGuardianFacet.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {VaultV2} from "../src/facets/VaultV2.sol";
import {IDiamondCut} from "../src/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../src/interfaces/IDiamondLoupe.sol";
import {ISolGitGuardian} from "../src/interfaces/ISolGitGuardian.sol";
import {LibDiamond} from "../src/libraries/LibDiamond.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {IVersionRegistry} from "../src/interfaces/IVersionRegistry.sol";

contract SolGitGuardianTest is Test {
    SolGitDiamond internal diamond;
    DiamondCutFacet internal cutFacet;
    DiamondLoupeFacet internal loupeFacet;
    OwnershipFacet internal ownerFacet;
    SolGitGuardianFacet internal guardianFacet;
    VaultV1 internal vaultV1;
    VaultV2 internal vaultV2;

    address internal owner = address(0xABCD);
    address internal guardian = address(0x9999);
    address internal attacker = address(0xBAD);
    address internal victim = address(0x1111);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(victim, 100 ether);
        vm.deal(attacker, 100 ether);

        vm.startPrank(owner);

        cutFacet = new DiamondCutFacet();
        loupeFacet = new DiamondLoupeFacet();
        ownerFacet = new OwnershipFacet();
        guardianFacet = new SolGitGuardianFacet();
        vaultV1 = new VaultV1();
        vaultV2 = new VaultV2();

        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);

        bytes4[] memory cutSelectors = new bytes4[](1);
        cutSelectors[0] = IDiamondCut.diamondCut.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(cutFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: cutSelectors
        });

        bytes4[] memory loupeSelectors = new bytes4[](4);
        loupeSelectors[0] = IDiamondLoupe.facets.selector;
        loupeSelectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        loupeSelectors[2] = IDiamondLoupe.facetAddresses.selector;
        loupeSelectors[3] = IDiamondLoupe.facetAddress.selector;
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(loupeFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: loupeSelectors
        });

        bytes4[] memory ownerSelectors = new bytes4[](2);
        ownerSelectors[0] = OwnershipFacet.owner.selector;
        ownerSelectors[1] = OwnershipFacet.transferOwnership.selector;
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(ownerFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: ownerSelectors
        });

        bytes4[] memory guardianSelectors = new bytes4[](9);
        guardianSelectors[0] = ISolGitGuardian.guardian.selector;
        guardianSelectors[1] = ISolGitGuardian.setGuardian.selector;
        guardianSelectors[2] = ISolGitGuardian.registerStableFacet.selector;
        guardianSelectors[3] = ISolGitGuardian.isRegisteredStableFacet.selector;
        guardianSelectors[4] = ISolGitGuardian.emergencyRollback.selector;
        guardianSelectors[5] = ISolGitGuardian.facetSupportsSelector.selector;
        guardianSelectors[6] = ISolGitGuardian.registerStableFacetWithSelectors.selector;
        guardianSelectors[7] = ISolGitGuardian.setVersionRegistry.selector;
        guardianSelectors[8] = ISolGitGuardian.versionRegistry.selector;
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
            facetAddress: address(vaultV1), action: IDiamondCut.FacetCutAction.Add, functionSelectors: vaultSelectors
        });

        diamond = new SolGitDiamond(owner, guardian, cuts, address(0), "");

        // Register VaultV1 as a verified stable facet
        ISolGitGuardian(address(diamond)).registerStableFacet(address(vaultV1), true);

        vm.stopPrank();

        // Victim deposits 50 ether
        vm.prank(victim);
        (bool ok,) = address(diamond).call{value: 50 ether}(abi.encodeWithSelector(VaultV1.deposit.selector));
        assertTrue(ok, "Victim deposit failed");
    }

    function test_GuardianOnlyEmergencyRollback() public {
        // 1. Upgrade withdraw to VaultV2 (vulnerable facet)
        vm.startPrank(owner);
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        bytes4[] memory replaceSelectors = new bytes4[](1);
        replaceSelectors[0] = VaultV2.withdraw.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(vaultV2),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: replaceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");
        vm.stopPrank();

        // Verify selector now points to VaultV2
        IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
        assertEq(loupe.facetAddress(VaultV2.withdraw.selector), address(vaultV2));

        // 2. Non-guardian attempts emergencyRollback -> must revert
        vm.prank(attacker);
        vm.expectRevert(LibDiamond.NotGuardian.selector);
        ISolGitGuardian(address(diamond))
            .emergencyRollback(VaultV2.withdraw.selector, address(vaultV1), "Unauthorized trigger");

        // 3. Guardian attempts rollback to an unregistered facet -> must revert
        address rogueFacet = address(0x9876);
        vm.prank(guardian);
        vm.expectRevert(abi.encodeWithSelector(LibDiamond.TargetFacetNotRegisteredStable.selector, rogueFacet));
        ISolGitGuardian(address(diamond))
            .emergencyRollback(VaultV2.withdraw.selector, rogueFacet, "Rogue rollback attempt");

        // 4. Guardian executes emergency rollback to VaultV1 (registered stable facet)
        vm.prank(guardian);
        ISolGitGuardian(address(diamond))
            .emergencyRollback(VaultV2.withdraw.selector, address(vaultV1), "Underflow exploit detected by Watcher");

        // 5. Verify selector is restored to VaultV1
        assertEq(loupe.facetAddress(VaultV1.withdraw.selector), address(vaultV1));

        // 6. Verify address did NOT change and funds remain secure
        assertEq(address(diamond).balance, 50 ether);

        // 7. Attacker tries to withdraw without balance -> now reverts because VaultV1 has proper balance checks!
        vm.prank(attacker);
        (bool exploitSuccess,) = address(diamond).call(abi.encodeWithSelector(VaultV1.withdraw.selector, 10 ether));
        assertFalse(exploitSuccess, "Exploit should fail after rollback to VaultV1");
    }

    function test_GuardianRollbackToFacetNotImplementingSelectorReverts() public {
        // VaultV1 does NOT implement diamondCut selector
        bytes4 cutSelector = IDiamondCut.diamondCut.selector;

        vm.prank(guardian);
        vm.expectRevert(
            abi.encodeWithSelector(
                LibDiamond.TargetFacetDoesNotImplementSelector.selector, address(vaultV1), cutSelector
            )
        );
        ISolGitGuardian(address(diamond)).emergencyRollback(cutSelector, address(vaultV1), "Invalid selector hijack");
    }

    function test_SynchronizationWithVersionRegistry() public {
        vm.startPrank(owner);
        VersionRegistry registry = new VersionRegistry(owner);
        registry.setRouter(address(diamond));
        ISolGitGuardian(address(diamond)).setVersionRegistry(address(registry));
        assertEq(ISolGitGuardian(address(diamond)).versionRegistry(), address(registry));

        // Push initial stable version in registry
        registry.pushVersion(VaultV1.withdraw.selector, address(vaultV1));
        registry.promote(VaultV1.withdraw.selector, 1);

        // Perform diamondCut to upgrade to VaultV2
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](1);
        bytes4[] memory replaceSelectors = new bytes4[](1);
        replaceSelectors[0] = VaultV2.withdraw.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(vaultV2),
            action: IDiamondCut.FacetCutAction.Replace,
            functionSelectors: replaceSelectors
        });
        IDiamondCut(address(diamond)).diamondCut(cuts, address(0), "");
        vm.stopPrank();

        // Verify diamondCut automatically synchronized to VersionRegistry
        IVersionRegistry.VersionInfo memory activeInfo = registry.getActiveVersion(VaultV2.withdraw.selector);
        assertEq(activeInfo.implementation, address(vaultV2));

        // Trigger emergency rollback by guardian
        vm.prank(guardian);
        ISolGitGuardian(address(diamond))
            .emergencyRollback(VaultV2.withdraw.selector, address(vaultV1), "Incident detected");

        // Verify VersionRegistry was automatically synchronized
        activeInfo = registry.getActiveVersion(VaultV1.withdraw.selector);
        assertEq(activeInfo.implementation, address(vaultV1));

        // Verify bad version is marked Quarantined in registry
        IVersionRegistry.VersionInfo memory badInfo = registry.getVersion(VaultV2.withdraw.selector, 2);
        assertEq(uint8(badInfo.status), uint8(IVersionRegistry.VersionStatus.Quarantined));
    }
}
