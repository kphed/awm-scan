// SPDX-License-Identifier: UNLISENCED
pragma solidity ^0.8.26;

import {StopCodes, LibStopCodes} from "../libraries/LibStopCodes.sol";
import {IStopCodes} from "../interfaces/IStopCodes.sol";
import {LibFactBase} from "@odaplatform/da-fact-smartcontracts/contracts/libraries/LibFactBase.sol";
import {LibAccessControl} from "@odaplatform/da-fact-smartcontracts/contracts/libraries/LibAccessControl.sol";
import {LibPausable} from "@odaplatform/da-fact-smartcontracts/contracts/libraries/LibPausable.sol";

contract StopCodesFacet is IStopCodes {
  constructor() {}

  modifier whenNotPaused() {
    require(!LibPausable.ref().paused, "FACT0300");
    _;
  }

  modifier onlyAccountAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.ACCOUNT_ADMIN, msg.sender), "FACT0401");
    _;
  }

  /**
   * @inheritdoc IStopCodes
   *
   * @dev MUST revert if token is paused
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is not an ACCOUNT_ADMIN
   */
  function updateStopCodes(
    address account_,
    StopCodes memory stopCodes_
  ) external whenNotPaused onlyAccountAdmin returns (bool success_) {
    return LibStopCodes._updateStopCodes(account_, stopCodes_);
  }

  /**
   * @inheritdoc IStopCodes
   */
  function getStopCodes(address account_) external view returns (StopCodes memory stopCodes_) {
    return LibStopCodes._getStopCodes(account_);
  }
}
