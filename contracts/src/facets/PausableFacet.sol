// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibPausable} from "../libraries/LibPausable.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {IPausable} from "../interfaces/IPausable.sol";

contract PausableFacet is IPausable {
  constructor() {}

  // Modifiers
  modifier onlyTokenAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.TOKEN_ADMIN, msg.sender), "FACT0400");
    _;
  }

  /**
   * @inheritdoc IPausable
   */
  function pause() public virtual onlyTokenAdmin {
    require(!LibPausable.ref().paused, "FACT0300");
    LibPausable._pause(msg.sender);
  }

  /**
   * @inheritdoc IPausable
   */
  function unpause() public virtual onlyTokenAdmin {
    require(LibPausable.ref().paused, "FACT0301");
    LibPausable._unpause(msg.sender);
  }

  /**
   * @inheritdoc IPausable
   */
  function paused() public view virtual returns (bool) {
    return LibPausable.ref().paused;
  }
}
