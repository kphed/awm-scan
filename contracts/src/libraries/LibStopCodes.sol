// SPDX-License-Identifier: UNLISENCED
pragma solidity ^0.8.26;

struct StopCodes {
  bool stopSubscriptionTo;
  bool stopTransferFrom;
  bool stopTransferTo;
  bool stopRedemptionFrom;
}

library LibStopCodes {
  bytes32 private constant STOPCODES_STORAGE_POSITION = keccak256("fact.stopcodes.storage");

  event StopCodesUpdated(
    address indexed caller_,
    address indexed account_,
    StopCodes previousStopCodes_,
    StopCodes currentStopCodes_
  );

  struct StopCodesStorage {
    mapping(address => StopCodes) _stopCodes;
  }

  function ref() internal pure returns (StopCodesStorage storage s) {
    bytes32 position = STOPCODES_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _getStopCodes(address account_) internal view returns (StopCodes memory) {
    return ref()._stopCodes[account_];
  }

  function _updateStopCodes(address account_, StopCodes memory stopCodes_) internal returns (bool) {
    require(account_ != address(0), "RSTR0004");
    StopCodes memory previousStopCodes = _getStopCodes(account_);
    ref()._stopCodes[account_] = stopCodes_;
    emit StopCodesUpdated(msg.sender, account_, previousStopCodes, stopCodes_);
    return true;
  }
}
