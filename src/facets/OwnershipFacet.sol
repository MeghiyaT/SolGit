// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC173} from "../interfaces/IERC173.sol";
import {SolGitErrors} from "../libraries/SolGitErrors.sol";

/// @title OwnershipFacet — ERC-173 Ownership Management
/// @notice Implements contract ownership retrieval and transfers for the diamond proxy.
contract OwnershipFacet is IERC173 {
    /// @inheritdoc IERC173
    function owner() external view override returns (address owner_) {
        owner_ = LibDiamond.contractOwner();
    }

    /// @inheritdoc IERC173
    function transferOwnership(address _newOwner) external override {
        LibDiamond.enforceIsContractOwner();
        if (_newOwner == address(0)) revert SolGitErrors.ZeroAddress();
        LibDiamond.setContractOwner(_newOwner);
    }
}

