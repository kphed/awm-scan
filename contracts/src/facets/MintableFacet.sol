// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IMintable} from "../interfaces/IMintable.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibMintable} from "../libraries/LibMintable.sol";
import {LibManagedToken} from "../libraries/LibManagedToken.sol";
import {LibManagedAccount} from "../libraries/LibManagedAccount.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract MintableFacet is IMintable {
  constructor() {}

  // Modifiers
  modifier onlyTokenizationAgent() {
    require(LibAccessControl._hasRole(LibFactBase.TOKENIZATION_AGENT, msg.sender), "FACT0402");
    _;
  }

  modifier whenActiveToken() {
    require(!LibManagedToken.ref()._inactive, "FACT0100");
    _;
  }

  modifier onlyActiveAccount(address account) {
    require(LibManagedAccount._accountActive(account), "FACT0200");
    _;
  }

  modifier whenNotPaused() {
    require(!LibPausable.ref().paused, "FACT0300");
    _;
  }

  /**
   * @inheritdoc IMintable
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if request is already initialized with requestId_
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if msg.sender is not a Tokenization agent
   * @dev MUST revert if requester_ is deactivated
   * @dev MUST revert if requester_ is the zero address
   * @dev MUST increase requester_ balance
   * @dev MUST increase total supply
   */
  function mint(
    bytes32 requestId_,
    address requester_,
    uint256 amount_
  )
    public
    virtual
    override
    whenNotPaused
    whenActiveToken
    onlyTokenizationAgent
    onlyActiveAccount(requester_)
    returns (bool success_)
  {
    LibMintable._mint(requestId_, requester_, amount_);
    return true;
  }
}
