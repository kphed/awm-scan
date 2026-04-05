// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibManagedToken {
  bytes32 private constant MANAGED_TOKEN_STORAGE_POSITION = keccak256("fact.managedtoken.storage");

  struct ManagedTokenStorage {
    /**
     * @notice Status of the token (active/inactive)
     * @dev Should be set to false when asset needs to be frozen for business reasons (e.g. sanctions)
     */
    bool _inactive;
  }

  event TokenActivated(address indexed caller_);

  event TokenDeactivated(address indexed caller_);

  function ref() internal pure returns (ManagedTokenStorage storage s) {
    bytes32 position = MANAGED_TOKEN_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _activateToken() internal {
    ref()._inactive = false;
    emit TokenActivated(msg.sender);
  }

  function _deactivateToken() internal {
    ref()._inactive = true;
    emit TokenDeactivated(msg.sender);
  }
}
