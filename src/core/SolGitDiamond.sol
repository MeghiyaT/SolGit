// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";

/// @title SolGitDiamond — EIP-2535 Diamond Proxy with SolGit Guardian Defense
/// @notice Master proxy entry point. Function calls are forwarded to facet implementations
///         via delegatecall. Address remains permanent across all upgrades and emergency rollbacks.
contract SolGitDiamond {
    constructor(
        address _contractOwner,
        address _guardian,
        IDiamondCut.FacetCut[] memory _diamondCut,
        address _init,
        bytes memory _calldata
    ) payable {
        LibDiamond.setContractOwner(_contractOwner);
        if (_guardian != address(0)) {
            LibDiamond.setGuardian(_guardian);
        }
        if (_diamondCut.length > 0) {
            LibDiamond.diamondCut(_diamondCut, _init, _calldata);
        }
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "SolGitDiamond: Function does not exist");

        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // Execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // Get any return value
            returndatacopy(0, 0, returndatasize())
            // Return any return value or error back to the caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}

