// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IBurnable} from "../interfaces/IBurnable.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibBurnable} from "../libraries/LibBurnable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract BurnableFacet is IBurnable {
  constructor() {}

  // Modifiers
  modifier onlyTokenizationAgent() {
    require(LibAccessControl._hasRole(LibFactBase.TOKENIZATION_AGENT, msg.sender), "FACT0402");
    _;
  }

  modifier whenNotPaused() {
    require(!LibPausable.ref().paused, "FACT0300");
    _;
  }

  /**
   * @inheritdoc IBurnable
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if request is already initialized with requestId_
   * @dev MUST revert if msg.sender is not a Tokenization agent
   * @dev MUST revert if requester_ is the zero address
   * @dev MUST decrease requester_ balance
   * @dev MUST decrease total supply
   * @dev CAN burn when from_ is deactivated
   */
  function burn(
    bytes32 requestId_,
    address requester_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyTokenizationAgent returns (bool success_) {
    LibBurnable._burn(requestId_, requester_, amount_);
    return true;
  }
}
