// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IAccessControl} from "../interfaces/IAccessControl.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";

contract AccessControlFacet is IAccessControl {
  constructor() {}

  modifier onlyRole(bytes32 role) {
    LibAccessControl._checkRole(role, msg.sender);
    _;
  }

  /**
   * @inheritdoc IAccessControl
   */
  function hasRole(bytes32 role, address account) public view virtual returns (bool hasRole_) {
    return LibAccessControl._hasRole(role, account);
  }

  /**
   * @inheritdoc IAccessControl
   */
  function getRoleAdmin(bytes32 role) public view virtual returns (bytes32 role_) {
    return LibAccessControl._getRoleAdmin(role);
  }

  /**
   * @inheritdoc IAccessControl
   */
  function renounceRole(bytes32 role, address callerConfirmation) public virtual returns (bool success_) {
    require(callerConfirmation == msg.sender, "FACT0404");
    return LibAccessControl._revokeRole(role, callerConfirmation);
  }

  /**
   * @inheritdoc IAccessControl
   */
  function revokeRole(
    bytes32 role,
    address account
  ) public virtual onlyRole(getRoleAdmin(role)) returns (bool success_) {
    return LibAccessControl._revokeRole(role, account);
  }

  /**
   * @inheritdoc IAccessControl
   */
  function grantRole(
    bytes32 role,
    address account
  ) public virtual onlyRole(getRoleAdmin(role)) returns (bool success_) {
    return LibAccessControl._grantRole(role, account);
  }
}
