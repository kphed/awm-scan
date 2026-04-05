// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Pausing Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining methods needed to make a token "pausable"
 */
interface IPausable {
  /**
   * @notice Event is emitted whenever a Token Admin pauses the token
   * @dev MUST trigger when the token is paused
   * @param account address which has paused the token
   */
  event Paused(address account);

  /**
   * @notice Event is emitted whenever a Token Admin unpauses the token
   * @dev MUST trigger when the token is unpaused
   * @param account address which has unpaused the token
   */
  event Unpaused(address account);

  /**
   * @notice Query if the token is paused or not
   *
   * @return isPaused_ true if token if paused, false otherwise
   */
  function paused() external view returns (bool isPaused_);

  /**
   * @notice Pauses the token
   * @dev Token must be previously unpaused
   */
  function pause() external;

  /**
   * @notice Unpauses the token
   * @dev Token must be previously paused
   */
  function unpause() external;
}
