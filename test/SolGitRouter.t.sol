// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {SolGitRouter} from "../src/core/SolGitRouter.sol";
import {VersionRegistry} from "../src/core/VersionRegistry.sol";
import {GuardExecutor} from "../src/core/GuardExecutor.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {SolGitErrors} from "../src/libraries/SolGitErrors.sol";

contract SolGitRouterTest is Test {
    SolGitRouter public router;
    VersionRegistry public registry;
    GuardExecutor public guard;
    VaultV1 public vault;
    address public owner;
    address public user;

    bytes4 constant DEPOSIT_SEL = bytes4(keccak256("deposit()"));

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");
        vm.deal(user, 100 ether);

        registry = new VersionRegistry(owner);
        guard = new GuardExecutor();
        router = new SolGitRouter(address(registry), address(guard), owner);
        registry.setRouter(address(router));

        vault = new VaultV1();
        registry.pushVersion(DEPOSIT_SEL, address(vault));
        registry.promote(DEPOSIT_SEL, 1);
    }

    function test_router_owner() public view {
        assertEq(router.owner(), owner);
    }

    function test_router_constructorZeroAddressReverts() public {
        vm.expectRevert(SolGitErrors.ZeroAddress.selector);
        new SolGitRouter(address(0), address(guard), owner);

        vm.expectRevert(SolGitErrors.ZeroAddress.selector);
        new SolGitRouter(address(registry), address(0), owner);

        vm.expectRevert(SolGitErrors.ZeroAddress.selector);
        new SolGitRouter(address(registry), address(guard), address(0));
    }

    function test_router_directEthSendReverts() public {
        vm.prank(user);
        (bool ok, ) = address(router).call{value: 1 ether}("");
        assertFalse(ok);
    }

    function test_router_unknownSelectorReverts() public {
        vm.prank(user);
        (bool ok, ) = address(router).call(abi.encodeWithSignature("unknownFunction()"));
        assertFalse(ok);
    }

    function test_router_routesToActiveVersion() public {
        vm.prank(user);
        (bool ok, ) = address(router).call{value: 5 ether}(abi.encodeWithSignature("deposit()"));
        assertTrue(ok);
        assertEq(address(router).balance, 5 ether);
    }
}
