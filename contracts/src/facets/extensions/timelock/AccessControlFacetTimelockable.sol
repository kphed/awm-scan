// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {LibTimelockable} from "../../../libraries/extensions/timelock/LibTimelockable.sol";
import {AccessControlFacet} from "../../AccessControlFacet.sol";

contract AccessControlFacetTimelockable is AccessControlFacet {
  constructor() {}

  /**
   * @inheritdoc AccessControlFacet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function renounceRole(bytes32 role, address callerConfirmation) public virtual override returns (bool success_) {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    success_ = super.renounceRole(role, callerConfirmation);
  }

  /**
   * @inheritdoc AccessControlFacet
   *
   * @dev MUST revert if not within timelock execution window
   */
  function grantRole(bytes32 role, address account) public virtual override returns (bool success_) {
    bytes4 selector = bytes4(msg.data[:4]);
    bytes calldata data = msg.data[4:];
    LibTimelockable._executeTransaction(selector, data, msg.sender);
    success_ = super.grantRole(role, account);
  }
}
