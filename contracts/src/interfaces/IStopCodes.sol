// SPDX-License-Identifier: UNLISENCED
pragma solidity ^0.8.26;

import {StopCodes} from "../libraries/LibStopCodes.sol";

interface IStopCodes {
  /**
   * @notice Event is emitted whenever account_ StopCodes are updated
   * @dev MUST trigger when StopCodes are updated for account_
   * @param caller_ address which has set the new timelock delay
   * @param account_ address for which StopCodes are updated
   * @param previousStopCodes_ previous StopCodes struct for account_
   * @param currentStopCodes_ current StopCodes struct for account_
   */
  event StopCodesUpdated(
    address indexed caller_,
    address indexed account_,
    StopCodes previousStopCodes_,
    StopCodes currentStopCodes_
  );

  /**
   * @notice Admin function to update StopCodes for account_
   * @dev MUST be called by an authorized role
   * @param account_ address for which StopCodes are updated
   * @param stopCodes_ new StopCodes for account_ which replace old StopCodes
   * @return success_ true if the operation was successful
   */
  function updateStopCodes(address account_, StopCodes memory stopCodes_) external returns (bool success_);

  /**
   * @notice Function to retrieve StopCodes for account_
   * @param account_ address for which StopCodes are retrieved
   * @return stopCodes_ StopCodes struct for account_
   */
  function getStopCodes(address account_) external view returns (StopCodes memory stopCodes_);
}
