// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IBurnPreparable} from "../interfaces/IBurnPreparable.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibBurnRequestable} from "../libraries/LibBurnRequestable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract BurnPreparableFacet is IBurnPreparable {
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

  modifier onlyBurner(address burner) {
    require(LibAccessControl._hasRole(LibFactBase.BURNER, burner), "FACT0710");
    _;
  }

  /**
   * @inheritdoc IBurnPreparable
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if request is already initialized with requestId_
   * @dev MUST revert if burner_ does not have BURNER role
   * @dev MUST revert if from_ is the zero address
   * @dev MUST decrease balance
   * @dev MUST NOT decrease total supply
   * @dev CAN prepare burn when from_ is deactivated
   */
  function prepareBurn(
    bytes32 requestId_,
    address from_,
    address burner_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyTokenizationAgent onlyBurner(burner_) returns (bool success_) {
    LibBurnRequestable._prepareBurn(requestId_, from_, burner_, amount_);
    return true;
  }
}
