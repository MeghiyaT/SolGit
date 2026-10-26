// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {GuardExecutor} from "../src/core/GuardExecutor.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {VaultV2} from "../src/facets/VaultV2.sol";
import {VaultStorage} from "../src/storage/VaultStorage.sol";
import {SolGitErrors} from "../src/libraries/SolGitErrors.sol";

contract GuardExecutorTest is Test {
    GuardExecutor public guard;
    VaultV1 public vaultV1;
    VaultV2 public vaultV2;
    address public alice;

    function setUp() public {
        guard = new GuardExecutor();
        vaultV1 = new VaultV1();
        vaultV2 = new VaultV2();
        alice = makeAddr("alice");
        vm.deal(alice, 300 ether);
        vm.deal(address(this), 300 ether);
    }

    // Helper to delegatecall guard
    function _execute(address facet, bytes memory callData) internal returns (bool success, bytes memory ret) {
        bytes memory data = abi.encodeCall(guard.executeWithGuard, (facet, callData));
        (success, ret) = address(guard).delegatecall(data);
    }

    function test_guard_successPath() public {
        (bool ok, ) = _execute(address(vaultV1), abi.encodeWithSignature("balanceOf(address)", address(this)));
        assertTrue(ok, "call through guard should succeed");
    }

    function test_guard_outflowCapExceeded_reverts() public {
        (bool ok, bytes memory ret) = _execute(
            address(vaultV2),
            abi.encodeWithSignature("withdraw(uint256)", 150 ether)
        );

        assertFalse(ok, "outflow cap violation should revert in guard");
        bytes4 errSel;
        assembly {
            errSel := and(mload(add(ret, 0x20)), 0xffffffff00000000000000000000000000000000000000000000000000000000)
        }
        assertEq(errSel, SolGitErrors.InvariantViolation.selector);
    }

    function test_guard_bubblesUpFacetRevert() public {
        (bool ok, bytes memory ret) = _execute(
            address(vaultV1),
            abi.encodeWithSignature("withdraw(uint256)", 50 ether)
        );
        assertFalse(ok);
        bytes4 errSel;
        assembly {
            errSel := and(mload(add(ret, 0x20)), 0xffffffff00000000000000000000000000000000000000000000000000000000)
        }
        assertEq(errSel, SolGitErrors.Unauthorized.selector);
    }

    receive() external payable {}
}
