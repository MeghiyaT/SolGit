// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {IVersionRegistry} from "../interfaces/IVersionRegistry.sol";

/// @title LibDiamond — Diamond Storage & Core Functions (EIP-2535 Diamond Standard)
/// @dev Enhanced with SolGit Guardian Role and Per-Selector Emergency Rollback
library LibDiamond {
    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    struct FacetAddressAndPosition {
        address facetAddress;
        uint96 functionSelectorPosition; // position in facetFunctionSelectors.functionSelectors
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        uint256 facetAddressPosition; // position of facetAddress in facetAddresses[]
    }

    struct DiamondStorage {
        // Maps function selector to facet address and its position in facetFunctionSelectors.functionSelectors
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        // Maps facet addresses to function selectors
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        // Facet addresses
        address[] facetAddresses;
        // Used to query if a contract implements an interface (ERC-165)
        mapping(bytes4 => bool) supportedInterfaces;
        // Owner of the contract
        address contractOwner;
        // SolGit Guardian authorized for emergency rollbacks
        address guardian;
        // Registry of verified stable facets that Guardian is permitted to roll back to
        mapping(address => bool) isRegisteredStableFacet;
        // Tracks whether a facet implements/supports a specific selector
        mapping(address => mapping(bytes4 => bool)) facetSupportsSelector;
        // Optional VersionRegistry for unified on-chain state synchronization
        address versionRegistry;
    }

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event GuardianUpdated(address indexed previousGuardian, address indexed newGuardian);
    event VersionRegistryUpdated(address indexed previousRegistry, address indexed newRegistry);
    event StableFacetRegistered(address indexed facet, bool isStable);
    event SelectorRolledBack(
        bytes4 indexed selector, address indexed oldFacet, address indexed newFacet, string reason
    );

    // ──────────────────────────────────────────────
    //  Errors
    // ──────────────────────────────────────────────

    error NotContractOwner();
    error NotGuardian();
    error TargetFacetNotRegisteredStable(address facet);
    error TargetFacetDoesNotImplementSelector(address facet, bytes4 selector);
    error ZeroAddress();
    error DirectDepositNotSupported();
    error NoSelectorsInFacet();
    error CannotAddSelectorToZeroAddress(bytes4 selector);
    error CannotAddExistingFunction(bytes4 selector);
    error CannotReplaceFunctionWithZeroAddress(bytes4 selector);
    error CannotReplaceSameFunction(bytes4 selector);
    error CannotReplaceNonExistentFunction(bytes4 selector);
    error CannotRemoveNonExistentFunction(bytes4 selector);
    error CannotRemoveAddressZero();
    error InitializationFailed(address init, bytes reason);

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // ──────────────────────────────────────────────
    //  Access Control & Roles
    // ──────────────────────────────────────────────

    function setContractOwner(address _newOwner) internal {
        if (_newOwner == address(0)) revert ZeroAddress();
        DiamondStorage storage ds = diamondStorage();
        address previousOwner = ds.contractOwner;
        ds.contractOwner = _newOwner;
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    function contractOwner() internal view returns (address) {
        return diamondStorage().contractOwner;
    }

    function enforceIsContractOwner() internal view {
        if (msg.sender != diamondStorage().contractOwner) {
            revert NotContractOwner();
        }
    }

    function setGuardian(address _newGuardian) internal {
        DiamondStorage storage ds = diamondStorage();
        address previousGuardian = ds.guardian;
        ds.guardian = _newGuardian;
        emit GuardianUpdated(previousGuardian, _newGuardian);
    }

    function guardian() internal view returns (address) {
        return diamondStorage().guardian;
    }

    function enforceIsGuardian() internal view {
        if (msg.sender != diamondStorage().guardian) {
            revert NotGuardian();
        }
    }

    function registerStableFacet(address _facet, bool _isStable) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.isRegisteredStableFacet[_facet] = _isStable;
        bytes4[] memory selectors = ds.facetFunctionSelectors[_facet].functionSelectors;
        for (uint256 i = 0; i < selectors.length; i++) {
            ds.facetSupportsSelector[_facet][selectors[i]] = true;
        }
        emit StableFacetRegistered(_facet, _isStable);
    }

    function registerStableFacetWithSelectors(address _facet, bytes4[] memory _selectors) internal {
        DiamondStorage storage ds = diamondStorage();
        ds.isRegisteredStableFacet[_facet] = true;
        for (uint256 i = 0; i < _selectors.length; i++) {
            ds.facetSupportsSelector[_facet][_selectors[i]] = true;
        }
        emit StableFacetRegistered(_facet, true);
    }

    function facetSupportsSelector(address _facet, bytes4 _selector) internal view returns (bool) {
        return diamondStorage().facetSupportsSelector[_facet][_selector];
    }

    function isRegisteredStableFacet(address _facet) internal view returns (bool) {
        return diamondStorage().isRegisteredStableFacet[_facet];
    }

    function setVersionRegistry(address _versionRegistry) internal {
        DiamondStorage storage ds = diamondStorage();
        address previousRegistry = ds.versionRegistry;
        ds.versionRegistry = _versionRegistry;
        emit VersionRegistryUpdated(previousRegistry, _versionRegistry);
    }

    function versionRegistry() internal view returns (address) {
        return diamondStorage().versionRegistry;
    }

    // ──────────────────────────────────────────────
    //  Diamond Cut (EIP-2535 Standard)
    // ──────────────────────────────────────────────

    function diamondCut(IDiamondCut.FacetCut[] memory _diamondCut, address _init, bytes memory _calldata) internal {
        for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
            IDiamondCut.FacetCutAction action = _diamondCut[facetIndex].action;
            if (action == IDiamondCut.FacetCutAction.Add) {
                addFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Replace) {
                replaceFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            } else if (action == IDiamondCut.FacetCutAction.Remove) {
                removeFunctions(_diamondCut[facetIndex].facetAddress, _diamondCut[facetIndex].functionSelectors);
            }
        }
        emit IDiamondCut.DiamondCut(_diamondCut, _init, _calldata);
        initializeDiamondCut(_init, _calldata);

        // Synchronize cuts with VersionRegistry if configured
        DiamondStorage storage ds = diamondStorage();
        if (ds.versionRegistry != address(0)) {
            for (uint256 facetIndex; facetIndex < _diamondCut.length; facetIndex++) {
                if (
                    _diamondCut[facetIndex].action == IDiamondCut.FacetCutAction.Add
                        || _diamondCut[facetIndex].action == IDiamondCut.FacetCutAction.Replace
                ) {
                    address facet = _diamondCut[facetIndex].facetAddress;
                    bytes4[] memory selectors = _diamondCut[facetIndex].functionSelectors;
                    for (uint256 s; s < selectors.length; s++) {
                        try IVersionRegistry(ds.versionRegistry).syncDiamondCut(selectors[s], facet) {} catch {}
                    }
                }
            }
        }
    }

    function addFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        if (_functionSelectors.length == 0) revert NoSelectorsInFacet();
        DiamondStorage storage ds = diamondStorage();
        if (_facetAddress == address(0)) revert CannotAddSelectorToZeroAddress(_functionSelectors[0]);

        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        // If this is a new facet address, record it in facetAddresses[]
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);
        }

        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress != address(0)) revert CannotAddExistingFunction(selector);
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }

    function replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        if (_functionSelectors.length == 0) revert NoSelectorsInFacet();
        DiamondStorage storage ds = diamondStorage();
        if (_facetAddress == address(0)) revert CannotReplaceFunctionWithZeroAddress(_functionSelectors[0]);

        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_facetAddress].functionSelectors.length);
        if (selectorPosition == 0) {
            addFacet(ds, _facetAddress);
        }

        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress == _facetAddress) revert CannotReplaceSameFunction(selector);
            if (oldFacetAddress == address(0)) revert CannotReplaceNonExistentFunction(selector);

            removeFunction(ds, oldFacetAddress, selector);
            addFunction(ds, selector, selectorPosition, _facetAddress);
            selectorPosition++;
        }
    }

    function removeFunctions(address _facetAddress, bytes4[] memory _functionSelectors) internal {
        if (_functionSelectors.length == 0) revert NoSelectorsInFacet();
        DiamondStorage storage ds = diamondStorage();
        if (_facetAddress != address(0)) revert CannotRemoveAddressZero();

        for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
            bytes4 selector = _functionSelectors[selectorIndex];
            address oldFacetAddress = ds.selectorToFacetAndPosition[selector].facetAddress;
            if (oldFacetAddress == address(0)) revert CannotRemoveNonExistentFunction(selector);
            removeFunction(ds, oldFacetAddress, selector);
        }
    }

    function addFacet(DiamondStorage storage ds, address _facetAddress) internal {
        enforceHasContractCode(_facetAddress, "LibDiamond: Facet has no code");
        ds.facetFunctionSelectors[_facetAddress].facetAddressPosition = ds.facetAddresses.length;
        ds.facetAddresses.push(_facetAddress);
    }

    function addFunction(DiamondStorage storage ds, bytes4 _selector, uint96 _selectorPosition, address _facetAddress)
        internal
    {
        ds.selectorToFacetAndPosition[_selector].functionSelectorPosition = _selectorPosition;
        ds.selectorToFacetAndPosition[_selector].facetAddress = _facetAddress;
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.push(_selector);
        ds.facetSupportsSelector[_facetAddress][_selector] = true;
    }

    function removeFunction(DiamondStorage storage ds, address _facetAddress, bytes4 _selector) internal {
        uint256 selectorPosition = ds.selectorToFacetAndPosition[_selector].functionSelectorPosition;
        uint256 lastSelectorPosition = ds.facetFunctionSelectors[_facetAddress].functionSelectors.length - 1;

        if (selectorPosition != lastSelectorPosition) {
            bytes4 lastSelector = ds.facetFunctionSelectors[_facetAddress].functionSelectors[lastSelectorPosition];
            ds.facetFunctionSelectors[_facetAddress].functionSelectors[selectorPosition] = lastSelector;
            ds.selectorToFacetAndPosition[lastSelector].functionSelectorPosition = uint96(selectorPosition);
        }
        ds.facetFunctionSelectors[_facetAddress].functionSelectors.pop();
        delete ds.selectorToFacetAndPosition[_selector];

        // If no more selectors for facet address, remove facet address
        if (lastSelectorPosition == 0) {
            uint256 lastFacetAddressPosition = ds.facetAddresses.length - 1;
            uint256 facetAddressPosition = ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
            if (facetAddressPosition != lastFacetAddressPosition) {
                address lastFacetAddress = ds.facetAddresses[lastFacetAddressPosition];
                ds.facetAddresses[facetAddressPosition] = lastFacetAddress;
                ds.facetFunctionSelectors[lastFacetAddress].facetAddressPosition = facetAddressPosition;
            }
            ds.facetAddresses.pop();
            delete ds.facetFunctionSelectors[_facetAddress].facetAddressPosition;
        }
    }

    // ──────────────────────────────────────────────
    //  Guardian Emergency Rollback
    // ──────────────────────────────────────────────

    /// @notice Emergency rollback for an individual selector to a trusted stable facet
    function rollbackSelector(bytes4 _selector, address _targetFacet, string memory _reason) internal {
        DiamondStorage storage ds = diamondStorage();
        if (!ds.isRegisteredStableFacet[_targetFacet]) {
            revert TargetFacetNotRegisteredStable(_targetFacet);
        }
        if (!ds.facetSupportsSelector[_targetFacet][_selector]) {
            revert TargetFacetDoesNotImplementSelector(_targetFacet, _selector);
        }

        address oldFacet = ds.selectorToFacetAndPosition[_selector].facetAddress;
        if (oldFacet == address(0)) revert CannotReplaceNonExistentFunction(_selector);
        if (oldFacet == _targetFacet) revert CannotReplaceSameFunction(_selector);

        // Remove selector from old facet
        removeFunction(ds, oldFacet, _selector);

        // Add selector to target stable facet
        uint96 selectorPosition = uint96(ds.facetFunctionSelectors[_targetFacet].functionSelectors.length);
        if (selectorPosition == 0) {
            addFacet(ds, _targetFacet);
        }
        addFunction(ds, _selector, selectorPosition, _targetFacet);

        // Synchronize with VersionRegistry if configured
        if (ds.versionRegistry != address(0)) {
            try IVersionRegistry(ds.versionRegistry).syncRollback(_selector, oldFacet, _targetFacet) {} catch {}
        }

        emit SelectorRolledBack(_selector, oldFacet, _targetFacet, _reason);
    }

    function initializeDiamondCut(address _init, bytes memory _calldata) internal {
        if (_init == address(0)) {
            require(_calldata.length == 0, "LibDiamond: _init is zero but _calldata is not empty");
            return;
        }
        enforceHasContractCode(_init, "LibDiamond: _init has no code");
        (bool success, bytes memory error) = _init.delegatecall(_calldata);
        if (!success) {
            if (error.length > 0) {
                assembly {
                    let returndata_size := mload(error)
                    revert(add(32, error), returndata_size)
                }
            } else {
                revert InitializationFailed(_init, error);
            }
        }
    }

    function enforceHasContractCode(address _contract, string memory _errorMessage) internal view {
        uint256 size;
        assembly {
            size := extcodesize(_contract)
        }
        require(size > 0, _errorMessage);
    }
}

