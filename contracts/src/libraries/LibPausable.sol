// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibPausable {
  bytes32 private constant PAUSABLE_STORAGE_POSITION = keccak256("fact.pausable.storage");

  event Paused(address account);

  event Unpaused(address account);

  struct PausableStorage {
    bool paused;
  }

  function ref() internal pure returns (PausableStorage storage s) {
    bytes32 position = PAUSABLE_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _pause(address _caller) internal {
    ref().paused = true;
    emit Paused(_caller);
  }

  function _unpause(address _caller) internal {
    ref().paused = false;
    emit Unpaused(_caller);
  }
}
