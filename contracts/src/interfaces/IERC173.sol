// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title ERC-173 Contract Ownership Standard
///  Note: the ERC-165 identifier for this interface is 0x7f5828d0
/* is ERC165 */
interface IERC173 {
  /// @dev This emits when ownership of a contract changes
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /// @dev This emits when transfer of ownership of a contract is initiated
  event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

  /// @notice Get the address of the owner. If there is no owner, returns the zero address
  /// @return owner_ The address of the owner
  function owner() external view returns (address owner_);

  /// @notice Get the address of the pending owner. If no ownership transfer is pending,
  /// this returns the zero address
  /// @dev The returned pending owner value does not indicate that the address is valid
  /// @return pendingOwner_ The address of the owner
  function pendingOwner() external view returns (address pendingOwner_);

  /// @notice Initiate the transfer of the new owner of the contract but does not change
  /// the current owners
  /// @dev Cannot renounce ownership using this function
  /// @dev This function can be called multipled times before the ownership transfer is accepted
  /// @dev Will revert if called by any account other than the current owner
  /// @dev MUST emit OwnershipTransferStarted event
  /// @param _newOwner The proposed address of the new owner of the contract
  function transferOwnership(address _newOwner) external;

  /// @notice Accept the transfer of ownership
  /// @dev Can only be called by the pending new owner
  /// @dev Will revert if called by any account other than the pending new owner
  /// @dev MUST emit OwnershipTransferred event
  function acceptOwnership() external;

  /// @notice Renounce ownership of the contract and set the owner to the zero address
  /// @dev Will revert if called by any account other than the current owner
  /// @dev MUST emit OwnershipTransferred event
  function renounceOwnership() external;
}
