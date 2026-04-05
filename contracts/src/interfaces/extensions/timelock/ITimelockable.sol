// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Timelock Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining methods needed to allow the token to have timelock functionalities
 */
interface ITimelockable {
  /**
   * @notice Event is emitted whenever a caller_ sets a new timelock delay
   * @dev MUST trigger when the timelock delay is set
   * @param caller_ address which has set the new timelock delay
   * @param oldDelay_ previous timelock delay in seconds
   * @param newDelay_ new timelock delay in seconds
   */
  event TimelockDelaySet(address indexed caller_, uint256 oldDelay_, uint256 newDelay_);

  /**
   * @notice Event is emitted whenever a caller_ queues a transaction to be executed after the timelock delay
   * @dev MUST trigger when a transaction is queued
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @param caller_ address which has queued the transaction
   * @param eta_ timestamp at which the transaction will be executable
   */
  event TransactionQueued(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  /**
   * @notice Event is emitted whenever a caller_ cancels a queued transaction
   * @dev MUST trigger when a transaction is cancelled
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @param caller_ address which has queued the transaction
   * @param eta_ timestamp at which the transaction was supposed to be executable
   */
  event TransactionCancelled(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  /**
   * @notice Event is emitted whenever an admin revokes a queued transaction
   * @dev MUST trigger when a transaction is revoked
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @param caller_ address which has queued the transaction
   * @param eta_ timestamp at which the transaction was supposed to be executable
   */

  event TransactionRevoked(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  /**
   * @notice Event is emitted whenever a caller_ sucessfully calls a timelock-protected function
   * @dev MUST trigger when the timelock-protected function is executed
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @param caller_ address which has queued the transaction
   * @param eta_ timestamp from which the transaction was supposed to be executable
   */

  event TransactionExecuted(bytes4 indexed selector_, bytes data_, address indexed caller_, uint256 eta_);

  /**
   * @notice Admin function to set the timelock delay
   * @dev MUST be called by an authorized role
   * @param delay_ new timelock delay in seconds
   * @return success_ true if the operation was successful
   */
  function setDelay(uint256 delay_) external returns (bool success_);

  /**
   * @notice Get the current timelock delay
   * @return delay_ current timelock delay in seconds
   */
  function getDelay() external view returns (uint256 delay_);

  /**
   * @notice Queue a timelock-protected transaction to be executable after the timelock delay
   * @dev MUST be called by an authorized role
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @return success_ true if the operation was successful
   */
  function queueTransaction(bytes4 selector_, bytes calldata data_) external returns (bool success_);

  /**
   * @notice Cancel a queued timelock-protected transaction
   * @dev MUST be called by the same address which queued the transaction
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @return success_ true if the operation was successful
   */
  function cancelTransaction(bytes4 selector_, bytes calldata data_) external returns (bool success_);

  /**
   * @notice Revoke a queued timelock-protected transaction and execute it immediately, bypassing the timelock delay
   * @dev MUST be called by an authorized role
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @return success_ true if the operation was successful
   */

  function revokeTransaction(bytes4 selector_, bytes calldata data_, address caller_) external returns (bool success_);

  /**
   * @notice Check if a transaction is executable
   * @param caller_ address which queued the transaction
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   * @return executable_ true if the transaction is executable, false otherwise
   */
  function isExecutable(
    bytes4 selector_,
    bytes calldata data_,
    address caller_
  ) external view returns (bool executable_);

  /**
   * @notice Get the timestamp at which a queued transaction will be executable
   * @param caller_ address which queued the transaction
   * @param selector_ function selector to be called
   * @param data_ calldata to be sent to the function to be called
   *@return eta_ timestamp at which the transaction will be executable, or 0 if the transaction is not queued
   */
  function executableAt(bytes4 selector_, bytes calldata data_, address caller_) external view returns (uint256 eta_);
}
