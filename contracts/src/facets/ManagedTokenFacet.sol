// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IManagedToken} from "../interfaces/IManagedToken.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibManagedToken} from "../libraries/LibManagedToken.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract ManagedTokenFacet is IManagedToken {
  constructor() {}

  // Modifiers
  modifier onlyTokenAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.TOKEN_ADMIN, msg.sender), "FACT0400");
    _;
  }

  modifier whenActiveToken() {
    require(!LibManagedToken.ref()._inactive, "FACT0100");
    _;
  }

  modifier whenInactiveToken() {
    require((LibManagedToken.ref()._inactive), "FACT0100");
    _;
  }

  modifier whenNotPaused() {
    require(!LibPausable.ref().paused, "FACT0300");
    _;
  }

  /**
   * @inheritdoc IManagedToken
   */
  function tokenActive() public view virtual override returns (bool active_) {
    return !LibManagedToken.ref()._inactive;
  }

  /**
   * @inheritdoc IManagedToken
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have token admin role
   * @dev MUST revert if token is active
   */
  function activateToken()
    public
    virtual
    override
    whenNotPaused
    onlyTokenAdmin
    whenInactiveToken
    returns (bool success_)
  {
    LibManagedToken._activateToken();
    return true;
  }

  /**
   * @inheritdoc IManagedToken
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have token admin role
   * @dev MUST revert if token is inactive
   */
  function deactivateToken()
    public
    virtual
    override
    whenActiveToken
    whenNotPaused
    onlyTokenAdmin
    returns (bool success_)
  {
    LibManagedToken._deactivateToken();
    return true;
  }
}
