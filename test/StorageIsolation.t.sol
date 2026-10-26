// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {SolGitRouter} from "../src/core/SolGitRouter.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {GuardExecutor} from "../src/core/GuardExecutor.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {VaultV2} from "../src/facets/VaultV2.sol";
import {VaultStorage} from "../src/storage/VaultStorage.sol";
import {IVersionRegistry} from "../src/interfaces/IVersionRegistry.sol";

/// @title StorageIsolationTest — Verifies storage is preserved across rollbacks
contract StorageIsolationTest is Test {
    SolGitRouter public router;
    VersionRegistry public registry;
    GuardExecutor public guard;
    VaultV1 public vaultV1;
    VaultV2 public vaultV2;

    address public user1;
    address public user2;

    bytes4 constant DEPOSIT_SEL = bytes4(keccak256("deposit()"));
    bytes4 constant WITHDRAW_SEL = bytes4(keccak256("withdraw(uint256)"));
    bytes4 constant TRANSFER_SEL = bytes4(keccak256("transfer(address,uint256)"));
    bytes4 constant BALANCE_SEL = bytes4(keccak256("balanceOf(address)"));

    function setUp() public {
        address owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        registry = new VersionRegistry(owner);
        guard = new GuardExecutor();
        router = new SolGitRouter(address(registry), address(guard), owner);
        registry.setRouter(address(router));

        vaultV1 = new VaultV1();
        vaultV2 = new VaultV2();

        // Register and promote V1 for all selectors
        bytes4[4] memory sels = [DEPOSIT_SEL, WITHDRAW_SEL, TRANSFER_SEL, BALANCE_SEL];
        for (uint256 i = 0; i < sels.length; i++) {
            registry.pushVersion(sels[i], address(vaultV1));
            registry.promote(sels[i], 1);
        }

        // Push buggy V2 for withdraw
        registry.pushVersion(WITHDRAW_SEL, address(vaultV2));

        vm.deal(user1, 50 ether);
        vm.deal(user2, 50 ether);
    }

    function test_storageIsolation_balancesPreserved() public {
        // User1 deposits 10 ETH
        vm.prank(user1);
        address(router).call{value: 10 ether}(abi.encodeWithSignature("deposit()"));

        // User2 deposits 5 ETH
        vm.prank(user2);
        address(router).call{value: 5 ether}(abi.encodeWithSignature("deposit()"));

        // Trigger rollback (attacker tries to exploit V2)
        address attackerAddr = makeAddr("attacker");
        vm.deal(attackerAddr, 1 ether);
        vm.prank(attackerAddr);
        address(router).call(abi.encodeWithSignature("withdraw(uint256)", 200 ether));

        // Verify both user balances are preserved
        (, bytes memory bal1) = address(router).call(
            abi.encodeWithSignature("balanceOf(address)", user1)
        );
        assertEq(abi.decode(bal1, (uint256)), 10 ether, "user1 balance should be preserved");

        (, bytes memory bal2) = address(router).call(
            abi.encodeWithSignature("balanceOf(address)", user2)
        );
        assertEq(abi.decode(bal2, (uint256)), 5 ether, "user2 balance should be preserved");
    }

    function test_storageIsolation_totalDeposits_consistent() public {
        // Deposits
        vm.prank(user1);
        address(router).call{value: 10 ether}(abi.encodeWithSignature("deposit()"));
        vm.prank(user2);
        address(router).call{value: 5 ether}(abi.encodeWithSignature("deposit()"));

        // Trigger rollback
        address attackerAddr = makeAddr("attacker");
        vm.deal(attackerAddr, 1 ether);
        vm.prank(attackerAddr);
        address(router).call(abi.encodeWithSignature("withdraw(uint256)", 200 ether));

        // Total ETH in router = total deposits = 15 ETH
        assertEq(address(router).balance, 15 ether, "router ETH should match deposits");
    }

    function test_storageIsolation_multipleDepositsAndTransfers() public {
        // Complex scenario: deposits, transfers, then rollback
        vm.prank(user1);
        address(router).call{value: 20 ether}(abi.encodeWithSignature("deposit()"));

        vm.prank(user1);
        address(router).call(
            abi.encodeWithSignature("transfer(address,uint256)", user2, 5 ether)
        );

        // Now: user1 = 15 ETH, user2 = 5 ETH

        // Trigger rollback
        address attackerAddr = makeAddr("attacker");
        vm.deal(attackerAddr, 1 ether);
        vm.prank(attackerAddr);
        address(router).call(abi.encodeWithSignature("withdraw(uint256)", 200 ether));

        // Balances should be exactly as before the attack
        (, bytes memory bal1) = address(router).call(
            abi.encodeWithSignature("balanceOf(address)", user1)
        );
        assertEq(abi.decode(bal1, (uint256)), 15 ether);

        (, bytes memory bal2) = address(router).call(
            abi.encodeWithSignature("balanceOf(address)", user2)
        );
        assertEq(abi.decode(bal2, (uint256)), 5 ether);
    }
}
