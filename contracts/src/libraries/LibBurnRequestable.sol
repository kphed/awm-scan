// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibERC20} from "../libraries/LibERC20.sol";

library LibBurnRequestable {
  bytes32 private constant BURN_REQUESTABLE_STORAGE_POSITION = keccak256("fact.burnrequestable.storage");

  struct BurnRequestableStorage {
    /**
     * @notice Balance of tokens that have been requested to be burned but have not been confirmed
     * @dev Represent a number of tokens that are part of the total supply but may be removed
     */
    mapping(address => uint256) _burnBalances;
    /**
     * @notice Burn allowance
     * @dev The number of tokens that are allowed to be burned CAN be greater than existing token balance
     */
    mapping(address => mapping(address => uint256)) _burnAllowances;
  }

  event BurnRequested(bytes32 indexed requestId_, address indexed requester_, address burner_, uint256 amount_);

  event BurnApproved(
    bytes32 indexed requestId_,
    address indexed requester_,
    address indexed responder_,
    address burner_,
    uint256 amount_
  );

  event BurnRejected(
    bytes32 indexed requestId_,
    address indexed requester_,
    address indexed responder_,
    address burner_,
    uint256 amount_
  );

  event RequestBurnApproval(address indexed requester_, address indexed delegate_, uint256 amount_);

  function ref() internal pure returns (BurnRequestableStorage storage s) {
    bytes32 position = BURN_REQUESTABLE_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _requestBurn(bytes32 requestId_, address burner_, uint256 amount_) internal {
    require(amount_ > 0, "FACT0700");
    require(amount_ <= LibERC20.ref()._balances[msg.sender], "FACT0708");

    _createBurnRequest(msg.sender, amount_, requestId_, burner_);
    LibERC20._transfer(msg.sender, burner_, amount_);
  }

  function _requestBurnFrom(
    bytes32 requestId_,
    address requester_,
    address delegate_,
    address burner_,
    uint256 amount_
  ) internal {
    require(requester_ != address(0), "FACT0707");
    require(delegate_ != address(0), "FACT0706");
    require(amount_ > 0, "FACT0700");
    require(amount_ <= LibERC20.ref()._balances[requester_], "FACT0708");

    _decreaseRequestBurnAllowance(requester_, delegate_, amount_);
    _createBurnRequest(requester_, amount_, requestId_, burner_);
    LibERC20._transfer(requester_, burner_, amount_);
  }

  function _prepareBurn(bytes32 requestId_, address requester_, address burner_, uint256 amount_) internal {
    require(requester_ != address(0), "FACT0707");
    require(amount_ > 0, "FACT0700");
    require(amount_ <= LibERC20.ref()._balances[requester_], "FACT0708");

    _createBurnRequest(requester_, amount_, requestId_, burner_);
    LibERC20._transfer(requester_, burner_, amount_);
  }

  function _approveBurn(bytes32 requestId_, address requester_) internal {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    LibFactBase.Request memory request = LibFactBase._getRequest(internalRequestId);
    require(request.requester == requester_, "FACT0701");
    require(request.requestStatus == LibFactBase.RequestStatus.PENDING, "FACT0701");
    require(request.requestType == LibFactBase.RequestType.BURN, "FACT0709");
    request.responder = msg.sender;
    request.requestStatus = LibFactBase.RequestStatus.APPROVED;

    LibFactBase.ref()._requests[request.requestId] = request;
    LibERC20.ref()._balances[request.burnFrom] -= request.amount;
    LibERC20.ref()._totalSupply -= request.amount;

    emit BurnApproved(requestId_, request.requester, request.responder, request.burnFrom, request.amount);
    emit LibERC20.Transfer(request.burnFrom, address(0), request.amount);
  }

  function _rejectBurn(bytes32 requestId_, address requester_) internal {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    LibFactBase.Request memory request = LibFactBase._getRequest(internalRequestId);
    require(request.requester == requester_, "FACT0701");
    require(request.requestStatus == LibFactBase.RequestStatus.PENDING, "FACT0701");
    require(request.requestType == LibFactBase.RequestType.BURN, "FACT0709");
    request.responder = msg.sender;
    request.requestStatus = LibFactBase.RequestStatus.REJECTED;
    LibFactBase.ref()._requests[request.requestId] = request;

    LibERC20._transfer(request.burnFrom, request.requester, request.amount);

    emit BurnRejected(requestId_, request.requester, request.responder, request.burnFrom, request.amount);
  }

  function _approveBurnAllowance(address requester_, address delegate_, uint256 amount_) internal {
    require(requester_ != address(0), "FACT0703");
    require(delegate_ != address(0), "FACT0704");
    ref()._burnAllowances[requester_][delegate_] = amount_;

    emit RequestBurnApproval(requester_, delegate_, amount_);
  }

  function _decreaseRequestBurnAllowance(address requester_, address delegate_, uint256 subtractedValue_) internal {
    uint256 currentAllowance = ref()._burnAllowances[requester_][delegate_];
    require(currentAllowance >= subtractedValue_, "FACT0705");
    uint256 newAllowance = currentAllowance - subtractedValue_;
    _approveBurnAllowance(requester_, delegate_, newAllowance);
  }

  function _burnRequestAllowance(address requester_, address delegate_) internal view returns (uint256) {
    return ref()._burnAllowances[requester_][delegate_];
  }

  function _createBurnRequest(address requester_, uint256 amount_, bytes32 requestId_, address burnFrom_) internal {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    require(
      LibFactBase.ref()._requests[internalRequestId].requestStatus == LibFactBase.RequestStatus.UNINITIALIZED,
      "FACT0002"
    );
    LibFactBase.Request memory request = LibFactBase.Request(
      internalRequestId,
      LibFactBase.RequestType.BURN,
      LibFactBase.RequestStatus.PENDING,
      requester_,
      address(0),
      amount_,
      burnFrom_
    );
    LibFactBase.ref()._requests[internalRequestId] = request;

    emit BurnRequested(requestId_, requester_, burnFrom_, amount_);
  }
}
