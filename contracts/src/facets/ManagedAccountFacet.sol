// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IManagedAccount} from "../interfaces/IManagedAccount.sol";
import {LibManagedAccount} from "../libraries/LibManagedAccount.sol";
import {LibFactBase} from "../libraries/LibFactBase.sol";
import {LibAccessControl} from "../libraries/LibAccessControl.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract ManagedAccountFacet is IManagedAccount {
  constructor() {}

  // Modifiers
  modifier onlyAccountAdmin() {
    require(LibAccessControl._hasRole(LibFactBase.ACCOUNT_ADMIN, msg.sender), "FACT0401");
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
   * @inheritdoc IManagedAccount
   */
  function accountActive(address owner_) public view virtual override returns (bool active_) {
    return LibManagedAccount._accountActive(owner_);
  }

  /**
   * @inheritdoc IManagedAccount
   */
  function batchAccountActive(
    address[] calldata owners_
  ) public view virtual override returns (bool[] memory actives_) {
    actives_ = new bool[](owners_.length);
    for (uint256 i = 0; i < actives_.length; i++) {
      actives_[i] = LibManagedAccount._accountActive(owners_[i]);
    }
    return actives_;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if owner_ is not active
   */
  function activateAccount(
    address owner_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._activateAccount(owner_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if not all owners_ are inactive
   * @dev MUST revert if any activate in batch fails
   */
  function batchActivateAccount(
    address[] calldata owners_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._batchActivateAccount(owners_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if owner_ is in active
   */
  function deactivateAccount(
    address owner_
  ) public virtual override whenNotPaused onlyAccountAdmin onlyActiveAccount(owner_) returns (bool success_) {
    LibManagedAccount._deactivateAccount(owner_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if not all owners_ are active
   * @dev MUST revert if any deactivate in batch fails
   */
  function batchDeactivateAccount(
    address[] calldata owners_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success) {
    LibManagedAccount._batchDeactivateAccount(owners_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   */
  function lockBalanceOf(address owner_) public view virtual override returns (uint256 balance_) {
    return LibManagedAccount._lockBalanceOf(owner_);
  }

  /**
   * @inheritdoc IManagedAccount
   */
  function batchLockBalanceOf(
    address[] calldata owners_
  ) public view virtual override returns (uint256[] memory balances_) {
    balances_ = new uint256[](owners_.length);
    for (uint256 i = 0; i < owners_.length; i++) {
      balances_[i] = LibManagedAccount._lockBalanceOf(owners_[i]);
    }
    return balances_;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if amount_ is zero
   * @dev MUST revert if owner_ balance < amount_
   * @dev CAN lock when token is inactive
   * @dev CAN lock when owner_ is deactivated
   * @dev MUST NOT decrease total supply
   */
  function lock(
    address owner_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._lock(owner_, amount_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if any amount_ is zero
   * @dev MUST revert if any owner_ balance < amount_
   * @dev MUST revert if any lock in batch fails
   * @dev CAN lock when token is inactive
   * @dev CAN lock when any of owners_ are deactivated
   * @dev MUST NOT decrease total supply
   */
  function batchLock(
    address[] calldata owners_,
    uint256[] calldata amounts_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._batchLock(owners_, amounts_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if amount_ is zero
   * @dev MUST revert if owner lock balance < amount_
   * @dev CAN unlock token is inactive
   * @dev CAN unlock when owner_ is deactivated
   * @dev MUST NOT increase total supply
   */
  function unlock(
    address owner_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._unlock(owner_, amount_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if any amount_ is zero
   * @dev MUST revert if owner lock balance < amount_
   * @dev MUST revert if any unlock in batch fails
   * @dev CAN unlock when token is inactive
   * @dev CAN unlock when some of owners_ are deactivated
   * @dev MUST NOT increase total supply
   */
  function batchUnlock(
    address[] calldata owners_,
    uint256[] calldata amounts_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._batchUnlock(owners_, amounts_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if amount_ is zero
   * @dev MUST revert if owner lock balance < amount_
   * @dev CAN force burn when token is inactive
   * @dev CAN force burn when owner_ is deactivated
   * @dev MUST decrease total supply
   */
  function forceBurn(
    address owner_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._forceBurn(owner_, amount_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if any amount_ is zero
   * @dev MUST revert if owner lock balance < amount_
   * @dev MUST revert if any force burn in batch fails
   * @dev CAN force burn when token is inactive
   * @dev CAN force burn when some of owners_ are deactivated
   * @dev MUST decrease total supply
   */
  function batchForceBurn(
    address[] calldata owners_,
    uint256[] calldata amounts_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._batchForceBurn(owners_, amounts_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner_ is zero address
   * @dev MUST revert if amount_ is zero
   * @dev MUST revert if owner lock balance < amount_
   * @dev CAN force transfer when token is inactive
   * @dev CAN force transfer when owner_ is deactivated
   * @dev CAN force transfer when newOwner_ is deactivated
   */
  function forceTransfer(
    address owner_,
    address newOwner_,
    uint256 amount_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._forceTransfer(owner_, newOwner_, amount_);
    return true;
  }

  /**
   * @inheritdoc IManagedAccount
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender does not have account admin role
   * @dev MUST revert if owner lock balance < amount_
   * @dev MUST revert if any force transfer in batch fails
   * @dev MUST revert if any owner_ is zero address
   * @dev MUST revert if any newOwner_ is zero address
   * @dev MUST revert if any amount_ is zero
   * @dev CAN force transfer when token is inactive
   * @dev CAN force transfer when some of owners_ are deactivated
   * @dev CAN force transfer when some of newOwners_ are deactivated
   */
  function batchForceTransfer(
    address[] calldata owners_,
    address[] calldata newOwners_,
    uint256[] calldata amounts_
  ) public virtual override whenNotPaused onlyAccountAdmin returns (bool success_) {
    LibManagedAccount._batchForceTransfer(owners_, newOwners_, amounts_);
    return true;
  }
}
