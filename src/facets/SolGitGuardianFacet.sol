// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISolGitGuardian} from "../interfaces/ISolGitGuardian.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

/// @title SolGitGuardianFacet — Automated Emergency Defense & Rollback Facet
/// @notice Grants the SolGit Watcher (Guardian) the authority to execute immediate function-level
///         rollbacks to verified stable facets during an exploit, while preserving contract address.
contract SolGitGuardianFacet is ISolGitGuardian {
    /// @inheritdoc ISolGitGuardian
    function guardian() external view override returns (address) {
        return LibDiamond.guardian();
    }

    /// @inheritdoc ISolGitGuardian
    function setGuardian(address _guardian) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.setGuardian(_guardian);
    }

    /// @inheritdoc ISolGitGuardian
    function registerStableFacet(address _facet, bool _isStable) external override {
        LibDiamond.enforceIsContractOwner();
        LibDiamond.registerStableFacet(_facet, _isStable);
    }

    /// @inheritdoc ISolGitGuardian
    function isRegisteredStableFacet(address _facet) external view override returns (bool) {
        return LibDiamond.isRegisteredStableFacet(_facet);
    }

    /// @inheritdoc ISolGitGuardian
    function emergencyRollback(
        bytes4 _selector,
        address _targetFacet,
        string calldata _reason
    ) external override {
        LibDiamond.enforceIsGuardian();
        LibDiamond.rollbackSelector(_selector, _targetFacet, _reason);
    }
}

