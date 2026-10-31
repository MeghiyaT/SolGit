// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {VaultV2} from "../src/facets/VaultV2.sol";
import {Attacker} from "../src/test-helpers/Attacker.sol";
import {SolGitErrors} from "../src/libraries/SolGitErrors.sol";

contract VaultFacetTest is Test {
    VaultV1 public vaultV1;
    VaultV2 public vaultV2;
    address public alice;
    address public bob;

    function setUp() public {
        vaultV1 = new VaultV1();
        vaultV2 = new VaultV2();
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    function test_vaultV1_depositAndWithdraw() public {
        vm.startPrank(alice);
        vaultV1.deposit{value: 10 ether}();
        assertEq(vaultV1.balanceOf(alice), 10 ether);

        uint256 preBal = alice.balance;
        vaultV1.withdraw(4 ether);
        assertEq(vaultV1.balanceOf(alice), 6 ether);
        assertEq(alice.balance, preBal + 4 ether);
        vm.stopPrank();
    }

    function test_vaultV1_zeroDepositReverts() public {
        vm.prank(alice);
        vm.expectRevert(SolGitErrors.ZeroDeposit.selector);
        vaultV1.deposit{value: 0}();
    }

    function test_vaultV1_overdrawReverts() public {
        vm.startPrank(alice);
        vaultV1.deposit{value: 5 ether}();
        vm.expectRevert(abi.encodeWithSelector(SolGitErrors.InsufficientBalance.selector, 5 ether, 10 ether));
        vaultV1.withdraw(10 ether);
        vm.stopPrank();
    }

    function test_vaultV1_transfer() public {
        vm.startPrank(alice);
        vaultV1.deposit{value: 10 ether}();
        bool success = vaultV1.transfer(bob, 3 ether);
        assertTrue(success, "transfer should return true");
        assertEq(vaultV1.balanceOf(alice), 7 ether);
        assertEq(vaultV1.balanceOf(bob), 3 ether);
        vm.stopPrank();
    }

    function test_vaultV1_transferZeroRecipientReverts() public {
        vm.startPrank(alice);
        vaultV1.deposit{value: 5 ether}();
        vm.expectRevert(SolGitErrors.ZeroAddress.selector);
        vaultV1.transfer(address(0), 1 ether);
        vm.stopPrank();
    }

    function test_vaultV1_transferInsufficientBalanceReverts() public {
        vm.startPrank(alice);
        vaultV1.deposit{value: 2 ether}();
        vm.expectRevert(abi.encodeWithSelector(SolGitErrors.InsufficientBalance.selector, 2 ether, 5 ether));
        vaultV1.transfer(bob, 5 ether);
        vm.stopPrank();
    }

    function test_vaultV2_deposit() public {
        vm.prank(alice);
        vaultV2.deposit{value: 5 ether}();
        assertEq(vaultV2.balanceOf(alice), 5 ether);
    }
}
