// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC165} from "../interfaces/IERC165.sol";

contract ERC165Facet is IERC165 {
  constructor() {}

  /**
   * @inheritdoc IERC165
   */
  function setSupportedInterface(bytes4 _interfaceId) public virtual override {
    LibDiamond.enforceIsContractOwner();
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    ds.supportedInterfaces[_interfaceId] = true;
    emit SupportedInterfaceRegistered(msg.sender, _interfaceId);
  }

  /**
   * @inheritdoc IERC165
   */
  function removeSupportedInterface(bytes4 _interfaceId) public virtual override {
    LibDiamond.enforceIsContractOwner();
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    ds.supportedInterfaces[_interfaceId] = false;
    emit SupportedInterfaceRemoved(msg.sender, _interfaceId);
  }

  /**
   * @inheritdoc IERC165
   */
  function setSupportedInterfaces(bytes4[] calldata _interfaceIds) public virtual override {
    LibDiamond.enforceIsContractOwner();
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    for (uint256 i = 0; i < _interfaceIds.length; i++) {
      ds.supportedInterfaces[_interfaceIds[i]] = true;
    }
    emit SupportedInterfacesRegistered(msg.sender, _interfaceIds);
  }

  /**
   * @inheritdoc IERC165
   */
  function removeSupportedInterfaces(bytes4[] calldata _interfaceIds) public virtual override {
    LibDiamond.enforceIsContractOwner();
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    for (uint256 i = 0; i < _interfaceIds.length; i++) {
      ds.supportedInterfaces[_interfaceIds[i]] = false;
    }
    emit SupportedInterfacesRemoved(msg.sender, _interfaceIds);
  }

  function supportsInterface(bytes4 _interfaceId) public view virtual override returns (bool) {
    LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
    return ds.supportedInterfaces[_interfaceId];
  }
}
