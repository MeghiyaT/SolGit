// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title VaultStorage — Namespaced diamond storage for the demo vault
/// @dev Uses EIP-2535 diamond storage pattern to avoid slot collisions between facets.
library VaultStorage {
    /// @dev keccak256("solgit.vault.storage") — unique namespace for vault data
    bytes32 private constant STORAGE_SLOT = 0x8a8dc4e5242ea8b1ab1d60606c71b7e0c3e29793bdb29ec93f4abb1cc481e5ee;

    struct Layout {
        mapping(address => uint256) balances;
        uint256 totalDeposits;
        /// @dev Tracks cumulative withdrawals per block for rate limiting
        uint256 currentBlockWithdrawals;
        /// @dev The block number for the current withdrawal tracking window
        uint256 withdrawalBlockNumber;
    }

    /// @notice Returns a storage pointer to the vault's namespaced Layout struct
    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
