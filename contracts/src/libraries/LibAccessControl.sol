// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibAccessControl {
  bytes32 private constant ACCESS_STORAGE_POSITION = keccak256("fact.accesscontrol.storage");
  bytes32 private constant DEFAULT_ADMIN_ROLE = 0x00;

  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

  struct RoleData {
    mapping(address => bool) hasRole;
    bytes32 adminRole;
  }

  struct AccessControlStorage {
    mapping(bytes32 => RoleData) _roles;
  }

  function ref() internal pure returns (AccessControlStorage storage s) {
    bytes32 position = ACCESS_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _hasRole(bytes32 role, address account) internal view returns (bool) {
    return ref()._roles[role].hasRole[account];
  }

  function _getRoleAdmin(bytes32 role) internal view returns (bytes32) {
    return ref()._roles[role].adminRole;
  }

  function _grantRole(bytes32 role, address account) internal returns (bool) {
    if (!_hasRole(role, account)) {
      ref()._roles[role].hasRole[account] = true;
      emit RoleGranted(role, account, msg.sender);
      return true;
    } else {
      return false;
    }
  }

  function _revokeRole(bytes32 role, address account) internal returns (bool) {
    if (_hasRole(role, account)) {
      ref()._roles[role].hasRole[account] = false;
      emit RoleRevoked(role, account, msg.sender);
      return true;
    } else {
      return false;
    }
  }

  function _checkRole(bytes32 role, address account) internal view {
    require(_hasRole(role, account), "FACT0403");
  }

  function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
    bytes32 previousAdminRole = _getRoleAdmin(role);
    ref()._roles[role].adminRole = adminRole;
    emit RoleAdminChanged(role, previousAdminRole, adminRole);
  }

  function _getDefaultAdminRole() internal pure returns (bytes32) {
    return DEFAULT_ADMIN_ROLE;
  }
}
