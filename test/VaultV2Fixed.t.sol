// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {VaultV2Fixed} from "../src/facets/VaultV2Fixed.sol";
import {SolGitErrors} from "../src/libraries/SolGitErrors.sol";

contract VaultV2FixedTest is Test {
    VaultV2Fixed public vault;
    address public alice;
    address public attacker;

    function setUp() public {
        vault = new VaultV2Fixed();
        alice = makeAddr("alice");
        attacker = makeAddr("attacker");
        vm.deal(alice, 20 ether);
        vm.deal(attacker, 20 ether);
    }

    function test_VaultV2Fixed_DepositAndWithdraw() public {
        vm.startPrank(alice);
        vault.deposit{value: 10 ether}();
        assertEq(vault.balanceOf(alice), 10 ether);

        uint256 preBal = alice.balance;
        vault.withdraw(4 ether);
        assertEq(vault.balanceOf(alice), 6 ether);
        assertEq(alice.balance, preBal + 4 ether);
        vm.stopPrank();
    }

    function test_VaultV2Fixed_UnderflowExploitBlocked() public {
        // Alice deposits 10 ether
        vm.prank(alice);
        vault.deposit{value: 10 ether}();

        // Attacker attempts to withdraw without having any balance
        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(SolGitErrors.InsufficientBalance.selector, 0, 5 ether)
        );
        vault.withdraw(5 ether);
    }

    function test_VaultV2Fixed_OverdrawReverts() public {
        vm.startPrank(alice);
        vault.deposit{value: 3 ether}();
        vm.expectRevert(
            abi.encodeWithSelector(SolGitErrors.InsufficientBalance.selector, 3 ether, 5 ether)
        );
        vault.withdraw(5 ether);
        vm.stopPrank();
    }

    function test_VaultV2Fixed_TransferReturnsBool() public {
        vm.startPrank(alice);
        vault.deposit{value: 5 ether}();
        bool success = vault.transfer(attacker, 2 ether);
        assertTrue(success, "transfer must return true on success");
        assertEq(vault.balanceOf(alice), 3 ether);
        assertEq(vault.balanceOf(attacker), 2 ether);
        vm.stopPrank();
    }
}

