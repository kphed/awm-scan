// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibERC20} from "../libraries/LibERC20.sol";

library LibMintable {
  event Mint(bytes32 indexed requestId_, address indexed requester_, address indexed responder_, uint256 amount_);

  function _mint(bytes32 requestId_, address requester_, uint256 amount_) internal {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    require(
      LibFactBase.ref()._requests[internalRequestId].requestStatus == LibFactBase.RequestStatus.UNINITIALIZED,
      "FACT0002"
    );
    require(requester_ != address(0), "FACT0801");
    require(amount_ > 0, "FACT0800");

    _createMintRequest(requester_, msg.sender, amount_, internalRequestId);
    LibERC20.ref()._totalSupply += amount_;
    LibERC20.ref()._balances[requester_] += amount_;
    emit Mint(requestId_, requester_, msg.sender, amount_);
    emit LibERC20.Transfer(address(0), requester_, amount_);
  }

  function _createMintRequest(address requester_, address responder_, uint256 amount_, bytes32 requestId_) internal {
    LibFactBase.Request memory request = LibFactBase.Request(
      requestId_,
      LibFactBase.RequestType.MINT,
      LibFactBase.RequestStatus.APPROVED,
      requester_,
      responder_,
      amount_,
      address(0)
    );
    LibFactBase.ref()._requests[requestId_] = request;
  }
}
