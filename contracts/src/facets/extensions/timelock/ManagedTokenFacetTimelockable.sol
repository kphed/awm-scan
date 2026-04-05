// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibTimelockable} from "../../../libraries/extensions/timelock/LibTimelockable.sol";
import {ManagedTokenFacet} from "../../ManagedTokenFacet.sol";

contract ManagedTokenFacetTimelockable is ManagedTokenFacet {
  constructor() {}

  /**
   * @inheritdoc ManagedTokenFacet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function activateToken() public virtual override returns (bool success_) {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    success_ = super.activateToken();
  }
}
