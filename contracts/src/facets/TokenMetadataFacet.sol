// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ITokenMetadata} from "../interfaces/ITokenMetadata.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibTokenMetadata} from "../libraries/LibTokenMetadata.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract TokenMetadataFacet is ITokenMetadata {
  constructor() {}

  // Modifiers
  modifier onlyTokenAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.TOKEN_ADMIN, msg.sender), "FACT0400");
    _;
  }

  modifier whenNotPaused() {
    require(!LibPausable.ref().paused, "FACT0300");
    _;
  }

  /**
   * @inheritdoc ITokenMetadata
   */
  function metadata() public view virtual override returns (string memory metadata_) {
    return LibTokenMetadata.ref()._metadata;
  }

  /**
   * @inheritdoc ITokenMetadata
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have token admin role
   */
  function setMetadata(
    string memory metadata_
  ) public virtual override whenNotPaused onlyTokenAdmin returns (bool success_) {
    LibTokenMetadata._setMetadata(metadata_);
    return true;
  }
}
