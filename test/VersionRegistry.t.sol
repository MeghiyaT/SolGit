// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {IVersionRegistry} from "../src/interfaces/IVersionRegistry.sol";
import {SolGitErrors} from "../src/libraries/SolGitErrors.sol";

contract VersionRegistryTest is Test {
    VersionRegistry public registry;
    address public owner = address(this);
    address public router = makeAddr("router");
    address public nonOwner = makeAddr("nonOwner");
    address public implV1 = address(new MockImpl());
    address public implV2 = address(new MockImpl());

    bytes4 constant WITHDRAW_SEL = bytes4(keccak256("withdraw(uint256)"));

    function setUp() public {
        registry = new VersionRegistry(owner);
        registry.setRouter(router);
    }

    // ── Push ──

    function test_pushVersion_success() public {
        uint32 ver = registry.pushVersion(WITHDRAW_SEL, implV1);
        assertEq(ver, 1, "first version should be 1");

        IVersionRegistry.VersionInfo memory vi = registry.getActiveVersion(WITHDRAW_SEL);
        assertEq(vi.version, 1);
        assertEq(vi.implementation, implV1);
        assertEq(uint8(vi.status), uint8(IVersionRegistry.VersionStatus.Active));
        assertGt(vi.timestamp, 0);
    }

    function test_pushVersion_incrementsVersion() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        uint32 ver2 = registry.pushVersion(WITHDRAW_SEL, implV2);
        assertEq(ver2, 2);

        IVersionRegistry.VersionInfo[] memory history = registry.getVersionHistory(WITHDRAW_SEL);
        assertEq(history.length, 2);
    }

    function test_pushVersion_onlyOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert(SolGitErrors.Unauthorized.selector);
        registry.pushVersion(WITHDRAW_SEL, implV1);
    }

    function test_pushVersion_zeroAddress_reverts() public {
        vm.expectRevert(SolGitErrors.ZeroAddress.selector);
        registry.pushVersion(WITHDRAW_SEL, address(0));
    }

    // ── Promote ──

    function test_promote_movesToStable() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);

        IVersionRegistry.VersionInfo memory vi = registry.getVersion(WITHDRAW_SEL, 1);
        assertEq(uint8(vi.status), uint8(IVersionRegistry.VersionStatus.Stable));
    }

    function test_promote_onlyOwner() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);

        vm.prank(nonOwner);
        vm.expectRevert(SolGitErrors.Unauthorized.selector);
        registry.promote(WITHDRAW_SEL, 1);
    }

    function test_promote_quarantinedReverts() public {
        // Push V1 (Active), promote to Stable
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);

        // Push V2 (Active)
        registry.pushVersion(WITHDRAW_SEL, implV2);

        // Simulate rollback: quarantines V2
        vm.prank(router);
        registry.rollback(WITHDRAW_SEL, 2, 1);

        // Try to promote quarantined V2 — should revert
        vm.expectRevert(abi.encodeWithSelector(SolGitErrors.VersionQuarantined.selector, WITHDRAW_SEL, uint32(2)));
        registry.promote(WITHDRAW_SEL, 2);
    }

    // ── Rollback ──

    function test_rollback_quarantinesBadVersion() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        vm.prank(router);
        registry.rollback(WITHDRAW_SEL, 2, 1);

        IVersionRegistry.VersionInfo memory badVi = registry.getVersion(WITHDRAW_SEL, 2);
        assertEq(uint8(badVi.status), uint8(IVersionRegistry.VersionStatus.Quarantined));
    }

    function test_rollback_setsActiveToStable() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        vm.prank(router);
        registry.rollback(WITHDRAW_SEL, 2, 1);

        IVersionRegistry.VersionInfo memory active = registry.getActiveVersion(WITHDRAW_SEL);
        assertEq(active.version, 1);
        assertEq(active.implementation, implV1);
        assertEq(uint8(active.status), uint8(IVersionRegistry.VersionStatus.Stable));
    }

    function test_rollback_onlyRouter() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        vm.prank(nonOwner);
        vm.expectRevert(SolGitErrors.Unauthorized.selector);
        registry.rollback(WITHDRAW_SEL, 2, 1);
    }

    function test_rollback_noStableVersion_reverts() public {
        // Push only one Active version, never promote
        registry.pushVersion(WITHDRAW_SEL, implV1);

        vm.expectRevert(abi.encodeWithSelector(SolGitErrors.NoStableVersion.selector, WITHDRAW_SEL));
        registry.getLastStableVersion(WITHDRAW_SEL);
    }

    function test_rollback_invalidVersion_reverts() public {
        vm.expectRevert(SolGitErrors.InvalidVersion.selector);
        registry.getVersion(WITHDRAW_SEL, 99);
    }

    // ── Manual Revert ──

    function test_manualRevert_success() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        // Currently active is v2
        assertEq(registry.getActiveVersion(WITHDRAW_SEL).version, 2);

        // Owner manually reverts to v1
        registry.manualRevert(WITHDRAW_SEL, 1);

        IVersionRegistry.VersionInfo memory active = registry.getActiveVersion(WITHDRAW_SEL);
        assertEq(active.version, 1);
        assertEq(active.implementation, implV1);
    }

    function test_manualRevert_onlyOwner() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        vm.prank(nonOwner);
        vm.expectRevert(SolGitErrors.Unauthorized.selector);
        registry.manualRevert(WITHDRAW_SEL, 1);
    }

    function test_manualRevert_quarantinedReverts() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.promote(WITHDRAW_SEL, 1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        // Router rolls back and quarantines v2
        vm.prank(router);
        registry.rollback(WITHDRAW_SEL, 2, 1);

        // Owner attempts manual revert to quarantined v2 -> must revert
        vm.expectRevert(
            abi.encodeWithSelector(SolGitErrors.VersionQuarantined.selector, WITHDRAW_SEL, uint32(2))
        );
        registry.manualRevert(WITHDRAW_SEL, 2);
    }

    function test_manualRevert_invalidVersion_reverts() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);

        vm.expectRevert(SolGitErrors.InvalidVersion.selector);
        registry.manualRevert(WITHDRAW_SEL, 99);
    }

    // ── View ──

    function test_getVersionHistory() public {
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.pushVersion(WITHDRAW_SEL, implV2);

        IVersionRegistry.VersionInfo[] memory history = registry.getVersionHistory(WITHDRAW_SEL);
        assertEq(history.length, 2);
        assertEq(history[0].version, 1);
        assertEq(history[1].version, 2);
    }

    function test_getRegisteredSelectors() public {
        bytes4 sel2 = bytes4(keccak256("deposit()"));
        registry.pushVersion(WITHDRAW_SEL, implV1);
        registry.pushVersion(sel2, implV1);

        bytes4[] memory sels = registry.getRegisteredSelectors();
        assertEq(sels.length, 2);
    }
}

/// @dev Minimal contract that exists so we have a valid address with code
contract MockImpl {
    fallback() external payable {}
}
