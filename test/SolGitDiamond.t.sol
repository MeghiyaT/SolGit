// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import {SolGitDiamond} from "../src/core/SolGitDiamond.sol";
import {DiamondCutFacet} from "../src/facets/DiamondCutFacet.sol";
import {DiamondLoupeFacet} from "../src/facets/DiamondLoupeFacet.sol";
import {OwnershipFacet} from "../src/facets/OwnershipFacet.sol";
import {SolGitGuardianFacet} from "../src/facets/SolGitGuardianFacet.sol";
import {VaultV1} from "../src/facets/VaultV1.sol";
import {IDiamondCut} from "../src/interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "../src/interfaces/IDiamondLoupe.sol";
import {IERC173} from "../src/interfaces/IERC173.sol";
import {ISolGitGuardian} from "../src/interfaces/ISolGitGuardian.sol";

contract SolGitDiamondTest is Test {
    SolGitDiamond internal diamond;
    DiamondCutFacet internal cutFacet;
    DiamondLoupeFacet internal loupeFacet;
    OwnershipFacet internal ownerFacet;
    SolGitGuardianFacet internal guardianFacet;
    VaultV1 internal vaultV1;

    address internal owner = address(0xABCD);
    address internal guardian = address(0x9999);
    address internal user = address(0x1111);

    function setUp() public {
        vm.deal(owner, 100 ether);
        vm.deal(user, 100 ether);

        vm.startPrank(owner);

        // 1. Deploy core facets
        cutFacet = new DiamondCutFacet();
        loupeFacet = new DiamondLoupeFacet();
        ownerFacet = new OwnershipFacet();
        guardianFacet = new SolGitGuardianFacet();
        vaultV1 = new VaultV1();

        // 2. Prepare cut array for core facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](5);

        // CutFacet
        bytes4[] memory cutSelectors = new bytes4[](1);
        cutSelectors[0] = IDiamondCut.diamondCut.selector;
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(cutFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: cutSelectors
        });

        // LoupeFacet
        bytes4[] memory loupeSelectors = new bytes4[](5);
        loupeSelectors[0] = IDiamondLoupe.facets.selector;
        loupeSelectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        loupeSelectors[2] = IDiamondLoupe.facetAddresses.selector;
        loupeSelectors[3] = IDiamondLoupe.facetAddress.selector;
        loupeSelectors[4] = DiamondLoupeFacet.supportsInterface.selector;
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(loupeFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: loupeSelectors
        });

        // OwnershipFacet
        bytes4[] memory ownerSelectors = new bytes4[](2);
        ownerSelectors[0] = IERC173.owner.selector;
        ownerSelectors[1] = IERC173.transferOwnership.selector;
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(ownerFacet), action: IDiamondCut.FacetCutAction.Add, functionSelectors: ownerSelectors
        });

        // GuardianFacet
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

        // VaultV1 Facet
        bytes4[] memory vaultSelectors = new bytes4[](4);
        vaultSelectors[0] = VaultV1.deposit.selector;
        vaultSelectors[1] = VaultV1.withdraw.selector;
        vaultSelectors[2] = VaultV1.transfer.selector;
        vaultSelectors[3] = VaultV1.balanceOf.selector;
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(vaultV1), action: IDiamondCut.FacetCutAction.Add, functionSelectors: vaultSelectors
        });

        // 3. Deploy Diamond proxy
        diamond = new SolGitDiamond(owner, guardian, cuts, address(0), "");

        vm.stopPrank();
    }

    function test_InitialDeploymentAndLoupe() public view {
        IDiamondLoupe loupe = IDiamondLoupe(address(diamond));
        address[] memory addresses = loupe.facetAddresses();
        assertEq(addresses.length, 5);

        // Check ownership
        IERC173 ownerContract = IERC173(address(diamond));
        assertEq(ownerContract.owner(), owner);

        // Check guardian
        ISolGitGuardian guardianContract = ISolGitGuardian(address(diamond));
        assertEq(guardianContract.guardian(), guardian);
    }

    function test_VaultDepositAndWithdrawThroughDiamond() public {
        vm.startPrank(user);

        // Deposit 10 ether
        (bool okDeposit,) = address(diamond).call{value: 10 ether}(abi.encodeWithSelector(VaultV1.deposit.selector));
        assertTrue(okDeposit, "Deposit failed");

        // Check balance
        (bool okBal, bytes memory balData) =
            address(diamond).call(abi.encodeWithSelector(VaultV1.balanceOf.selector, user));
        assertTrue(okBal, "balanceOf failed");
        uint256 balance = abi.decode(balData, (uint256));
        assertEq(balance, 10 ether);

        // Withdraw 4 ether
        (bool okWithdraw,) = address(diamond).call(abi.encodeWithSelector(VaultV1.withdraw.selector, 4 ether));
        assertTrue(okWithdraw, "Withdraw failed");

        // Check remaining balance
        (, balData) = address(diamond).call(abi.encodeWithSelector(VaultV1.balanceOf.selector, user));
        balance = abi.decode(balData, (uint256));
        assertEq(balance, 6 ether);

        vm.stopPrank();
    }

    function test_OwnershipTransfer() public {
        address newOwner = address(0x5555);
        IERC173 ownerContract = IERC173(address(diamond));

        vm.prank(user);
        vm.expectRevert();
        ownerContract.transferOwnership(newOwner);

        vm.prank(owner);
        ownerContract.transferOwnership(newOwner);

        assertEq(ownerContract.owner(), newOwner);
    }
}
