// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ITimelockable} from "../../../interfaces/extensions/timelock/ITimelockable.sol";
import {LibTimelockable} from "../../../libraries/extensions/timelock/LibTimelockable.sol";
import {LibFactBase} from "../../../libraries/LibFactBase.sol";
import {LibAccessControl} from "../../../libraries/LibAccessControl.sol";

contract TimelockableFacet is ITimelockable {
  constructor() {}

  // Modifiers
  modifier onlyTokenAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.TOKEN_ADMIN, msg.sender), "FACT0400");
    _;
  }

  modifier onlyAdmin() {
    require(
      LibAccessControl._hasRole(LibFactBase.TOKEN_ADMIN, msg.sender) ||
        LibAccessControl._hasRole(LibFactBase.ACCOUNT_ADMIN, msg.sender) ||
        LibAccessControl._hasRole(LibFactBase.TOKENIZATION_AGENT, msg.sender),
      "FACT0403"
    );
    _;
  }

  /**
   * @inheritdoc ITimelockable
   *
   * @dev MUST revert if msg.sender does not have TOKEN_ADMIN role
   * @dev MUST revert if timelock delay is less than minimum duration(12 minutes)
   * @dev MUST revert if timelock delay is more than maximum duration (24 hours)
   * @dev MUST revert if not within timelock execution window
   */
  function setDelay(uint256 delay_) public override onlyTokenAdmin returns (bool success_) {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    success_ = LibTimelockable._setTimelockDelay(delay_, msg.sender);
  }

  /**
   * @inheritdoc ITimelockable
   */
  function getDelay() public view override returns (uint256 delay_) {
    delay_ = LibTimelockable.ref()._timelockDelay;
  }

  /**
   * @inheritdoc ITimelockable
   *
   * @dev MUST revert if msg.sender does not have one of TOKENIZATION_AGENT, ACCOUNT_ADMIN, TOKEN_ADMIN roles
   * @dev MUST revert if transaction is already queued
   * @dev MUST revert if transaction is past timelock grace period
   */
  function queueTransaction(
    bytes4 selector_,
    bytes calldata data_
  ) public virtual override onlyAdmin returns (bool success_) {
    success_ = LibTimelockable._queueTransaction(selector_, data_, msg.sender);
  }

  /**
   * @inheritdoc ITimelockable
   *
   * @dev MUST revert if msg.sender does not have one of TOKENIZATION_AGENT, ACCOUNT_ADMIN, TOKEN_ADMIN roles
   * @dev MUST revert if transaction is not queued
   * @dev Transaction can be cancelled even if timelock delay has passed
   */
  function cancelTransaction(
    bytes4 selector_,
    bytes calldata data_
  ) public virtual override onlyAdmin returns (bool success_) {
    success_ = LibTimelockable._cancelTransaction(selector_, data_, msg.sender);
  }

  /**
   * @inheritdoc ITimelockable
   *
   * @dev MUST revert if msg.sender does not have TOKEN_ADMIN role
   * @dev MUST revert if transaction is not queued
   * @dev Transaction can be cancelled even if timelock delay has passed
   */
  function revokeTransaction(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) public virtual override onlyTokenAdmin returns (bool success_) {
    success_ = LibTimelockable._revokeTransaction(selector_, data_, caller_);
  }

  /**
   * @inheritdoc ITimelockable
   */
  function isExecutable(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) public view virtual override returns (bool executable_) {
    executable_ = LibTimelockable._isExecutable(selector_, data_, caller_);
  }

  /**
   * @inheritdoc ITimelockable
   */
  function executableAt(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) public view virtual override returns (uint256 eta_) {
    eta_ = LibTimelockable._executableAt(selector_, data_, caller_);
  }
}
