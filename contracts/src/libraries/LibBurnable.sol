// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibERC20} from "../libraries/LibERC20.sol";

library LibBurnable {
  event Burn(bytes32 indexed requestId_, address indexed requester_, address indexed responder_, uint256 amount_);

  function _burn(bytes32 requestId_, address requester_, uint256 amount_) internal {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    require(
      LibFactBase.ref()._requests[internalRequestId].requestStatus == LibFactBase.RequestStatus.UNINITIALIZED,
      "FACT0002"
    );
    require(requester_ != address(0), "FACT0901");
    require(amount_ > 0, "FACT0900");
    require(amount_ <= LibERC20.ref()._balances[requester_], "FACT0902");

    _createBurnRequest(requester_, msg.sender, amount_, internalRequestId);
    LibERC20.ref()._totalSupply -= amount_;
    LibERC20.ref()._balances[requester_] -= amount_;

    emit Burn(requestId_, requester_, msg.sender, amount_);
    emit LibERC20.Transfer(requester_, address(0), amount_);
  }

  function _createBurnRequest(address requester_, address responder_, uint256 amount_, bytes32 requestId_) internal {
    LibFactBase.Request memory request = LibFactBase.Request(
      requestId_,
      LibFactBase.RequestType.BURN,
      LibFactBase.RequestStatus.APPROVED,
      requester_,
      responder_,
      amount_,
      requester_
    );
    LibFactBase.ref()._requests[requestId_] = request;
  }
}
