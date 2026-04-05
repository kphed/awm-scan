// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IBurnRespondable} from "../interfaces/IBurnRespondable.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibBurnRequestable} from "../libraries/LibBurnRequestable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract BurnRespondableFacet is IBurnRespondable {
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
   * @inheritdoc IBurnRespondable
   */
  function burnRequestOf(
    bytes32 requestId_,
    address requester_
  ) public view virtual override returns (uint256 status_, address responder_, uint256 amount_) {
    return LibFactBase._requestOf(requestId_, requester_, LibFactBase.RequestType.BURN);
  }

  /**
   * @inheritdoc IBurnRespondable
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have tokenization agent role
   * @dev MUST revert if request with requestId_ is not in PENDING state
   * @dev CAN approve when token is inactive
   * @dev CAN approve when request.requestor is deactivated
   * @dev MUST decrease total supply
   */
  function approveBurn(
    bytes32 requestId_,
    address requester_
  ) public virtual override whenNotPaused onlyTokenizationAgent returns (bool success_) {
    LibBurnRequestable._approveBurn(requestId_, requester_);
    return true;
  }

  /**
   * @inheritdoc IBurnRespondable
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have tokenization agent role
   * @dev MUST revert if request with requestId_ is not in PENDING state
   * @dev CAN reject when token is inactive
   * @dev CAN reject when request.requestor is deactivated
   * @dev MUST NOT decrease total supply
   */
  function rejectBurn(
    bytes32 requestId_,
    address requester_
  ) public virtual override whenNotPaused onlyTokenizationAgent returns (bool success_) {
    LibBurnRequestable._rejectBurn(requestId_, requester_);
    return true;
  }
}
