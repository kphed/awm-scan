// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibTimelockable} from "../../../libraries/extensions/timelock/LibTimelockable.sol";
import {ERC173Facet} from "../../ERC173Facet.sol";

contract ERC173FacetTimelockable is ERC173Facet {
  constructor() {}

  /**
   * @inheritdoc ERC173Facet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function transferOwnership(address _newOwner) public virtual override {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    super.transferOwnership(_newOwner);
  }

  /**
   * @inheritdoc ERC173Facet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function renounceOwnership() public virtual override {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    super.renounceOwnership();
  }
}
