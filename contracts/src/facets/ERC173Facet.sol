// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IERC173} from "../interfaces/IERC173.sol";

contract ERC173Facet is IERC173 {
  constructor() {}

  /**
   * @inheritdoc IERC173
   */
  function owner() public view virtual override returns (address owner_) {
    owner_ = LibDiamond.contractOwner();
  }

  /**
   * @inheritdoc IERC173
   */
  function pendingOwner() public view virtual override returns (address pendingOwner_) {
    pendingOwner_ = LibDiamond.pendingContractOwner();
  }

  /**
   * @inheritdoc IERC173
   */
  function transferOwnership(address _newOwner) public virtual override {
    LibDiamond.transferOwnership(_newOwner);
  }

  /**
   * @inheritdoc IERC173
   */
  function acceptOwnership() public virtual override {
    LibDiamond.acceptOwnership();
  }

  /**
   * @inheritdoc IERC173
   */
  function renounceOwnership() public virtual override {
    LibDiamond.renounceOwnership();
  }
}
