// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibTimelockable} from "../../../libraries/extensions/timelock/LibTimelockable.sol";
import {PausableFacet} from "../../PausableFacet.sol";

contract PausableFacetTimelockable is PausableFacet {
  constructor() {}

  /**
   * @inheritdoc PausableFacet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function unpause() public virtual override {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    super.unpause();
  }
}
