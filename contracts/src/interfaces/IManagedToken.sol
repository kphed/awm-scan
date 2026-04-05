// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Managed Token Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining administrative functions to manage tokens
 * @dev Allows tokens in balance to be managed by an authorized user
 */
interface IManagedToken {
  /**
   * @notice Event signaling that the token is activated for business reasons (e.g. sanctions lifted)
   * @dev MUST trigger when the token status is changed from deactivated to activated
   *
   * @param caller_ authorized address that activated the token
   */
  event TokenActivated(address indexed caller_);

  /**
   * @notice Event signaling that the token is deactivated for business reasons (e.g. sanctions)
   * @dev MUST trigger when the token status is changed from activated to deactivated
   *
   * @param caller_ authorized address that deactivated the token
   */
  event TokenDeactivated(address indexed caller_);

  /**
   * @notice Queries the token's status
   *
   * @return active_ status of the token (true/false)
   */
  function tokenActive() external view returns (bool active_);

  /**
   * @notice Activate the token and enable regular business processes (e.g. end of sanctions)
   *
   * @return success_ status of the transaction (true/false)
   */
  function activateToken() external returns (bool success_);

  /**
   * @notice Deactivate the token and disable regular business processes (e.g. sanctions)
   *
   * @return success_ status of the transaction (true/false)
   */
  function deactivateToken() external returns (bool success_);
}
