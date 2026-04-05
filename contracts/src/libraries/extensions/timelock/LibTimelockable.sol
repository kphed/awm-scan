// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibTimelockable {
  bytes32 private constant TIMELOCKABLE_STORAGE_POSITION = keccak256("fact.timelockable.storage");

  uint256 private constant MINIMUM_TIMELOCK_DELAY = 12 minutes;

  uint256 private constant MAXIMUM_TIMELOCK_DELAY = 24 hours;

  uint256 private constant GRACE_PERIOD = 24 hours;

  struct TimelockStorage {
    mapping(bytes32 => uint256) _queuedTransactions;
    uint256 _timelockDelay;
  }

  event TimelockDelaySet(address indexed caller_, uint256 oldDelay_, uint256 newDelay_);

  event TransactionQueued(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  event TransactionCancelled(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  event TransactionRevoked(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  event TransactionExecuted(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  function ref() internal pure returns (TimelockStorage storage s) {
    bytes32 position = TIMELOCKABLE_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _setTimelockDelay(uint256 delay_, address caller_) internal returns (bool success_) {
    require((delay_ >= MINIMUM_TIMELOCK_DELAY) && (MAXIMUM_TIMELOCK_DELAY >= delay_), "FACT1000");
    uint256 oldDelay = ref()._timelockDelay;
    ref()._timelockDelay = delay_;
    emit TimelockDelaySet(caller_, oldDelay, delay_);
    return true;
  }

  function _queueTransaction(bytes4 selector_, bytes calldata data_, address caller_) internal returns (bool success_) {
    uint256 eta = block.timestamp + ref()._timelockDelay;
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    require(ref()._queuedTransactions[transactionID] == 0, "FACT1001");
    ref()._queuedTransactions[transactionID] = eta;
    emit TransactionQueued(selector_, data_, caller_, eta);
    return true;
  }

  function _cancelTransaction(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) internal returns (bool success_) {
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    require(ref()._queuedTransactions[transactionID] != 0, "FACT1002");

    uint256 eta = ref()._queuedTransactions[transactionID];
    _clearQueuedTransaction(transactionID);
    emit TransactionCancelled(selector_, data_, caller_, eta);
    return true;
  }

  function _revokeTransaction(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) internal returns (bool success_) {
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    require(ref()._queuedTransactions[transactionID] != 0, "FACT1003");

    uint256 eta = ref()._queuedTransactions[transactionID];
    _clearQueuedTransaction(transactionID);
    emit TransactionRevoked(selector_, data_, caller_, eta);
    return true;
  }

  function _executeTransaction(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) internal returns (bool success_) {
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    require(_isExecutable(selector_, data_, caller_), "FACT1004");

    uint256 eta = ref()._queuedTransactions[transactionID];
    _clearQueuedTransaction(transactionID);
    emit TransactionExecuted(selector_, data_, caller_, eta);
    return true;
  }

  function _executableAt(bytes4 selector_, bytes calldata data_, address caller_) internal view returns (uint256 eta_) {
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    return ref()._queuedTransactions[transactionID];
  }

  function _isExecutable(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) internal view returns (bool callable_) {
    bytes32 transactionID = _getTransactionID(selector_, data_, caller_);
    uint256 eta = ref()._queuedTransactions[transactionID];
    callable_ = (eta != 0 && block.timestamp >= eta && block.timestamp <= eta + GRACE_PERIOD);
  }

  function _getTransactionID(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) internal pure returns (bytes32 transactionID_) {
    transactionID_ = keccak256(abi.encodePacked(selector_, data_, caller_));
  }

  function _clearQueuedTransaction(bytes32 transactionID) internal {
    delete ref()._queuedTransactions[transactionID];
  }
}
