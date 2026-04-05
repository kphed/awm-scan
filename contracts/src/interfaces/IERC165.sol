// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC165 {
  /// @notice Emitted when interfaceId is registered
  /// @param operator_ The address of the operator
  /// @param interfaceId_ The interface identifier, as specified in ERC-16
  event SupportedInterfaceRegistered(address indexed operator_, bytes4 indexed interfaceId_);

  /// @notice Emitted when interfaceId is removed
  /// @param operator_ The address of the operator
  /// @param interfaceId_ The interface identifier, as specified in ERC-16
  event SupportedInterfaceRemoved(address indexed operator_, bytes4 indexed interfaceId_);

  /// @notice Emitted when interfaceIds are registered
  /// @param operator_ The address of the operator
  /// @param interfaceIds_ The interface identifiers, as specified in ERC-16
  event SupportedInterfacesRegistered(address indexed operator_, bytes4[] interfaceIds_);

  /// @notice Emitted when interfaceId are removed
  /// @param operator_ The address of the operator
  /// @param interfaceIds_ The interface identifiers, as specified in ERC-16
  event SupportedInterfacesRemoved(address indexed operator_, bytes4[] interfaceIds_);

  /// @notice Setting interfaceIds to true
  /// @param interfaceId The interface identifier, as specified in ERC-165
  /// @dev Interface identification is specified in ERC-165.
  function setSupportedInterface(bytes4 interfaceId) external;

  /// @notice Setting interfaceId to false
  /// @param interfaceId The interface identifier, as specified in ERC-165
  /// @dev Interface identification is specified in ERC-165.
  function removeSupportedInterface(bytes4 interfaceId) external;

  /// @notice Setting interfaceIds to true
  /// @param _interfaceIds The interface identifier, as specified in ERC-165
  /// @dev Interface identification is specified in ERC-165.
  function setSupportedInterfaces(bytes4[] calldata _interfaceIds) external;

  /// @notice Setting interfaceIds to false
  /// @param _interfaceIds The interface identifiers, as specified in ERC-165
  /// @dev Interface identification is specified in ERC-165.
  function removeSupportedInterfaces(bytes4[] calldata _interfaceIds) external;

  /// @notice Query if a contract implements an interface
  /// @param interfaceId The interface identifier, as specified in ERC-165
  /// @dev Interface identification is specified in ERC-165. This function
  ///  uses less than 30,000 gas.
  /// @return `true` if the contract implements `interfaceID` and
  ///  `interfaceID` is not 0xffffffff, `false` otherwise
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
