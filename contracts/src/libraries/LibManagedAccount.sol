// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import {LibERC20} from "../libraries/LibERC20.sol";

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library LibManagedAccount {
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant MANAGED_ACCOUNT_STORAGE_POSITION = keccak256("fact.managedaccount.storage");

  address private constant LOCK_ADDRESS = address(uint160(uint256(keccak256("fact.managedaccount.lock.address"))));

  struct ManagedAccountStorage {
    /**
     * @notice Status of an account (active/inactive)
     * @dev Should be set to true when an account needs to be frozen for business reasons (e.g. sanctions)
     */
    EnumerableSet.AddressSet _accountList;
    /**
     * @notice Balance of tokens that have been locked but have not been force burned
     * @dev Represent a number of tokens that are part of the total supply but may be removed
     */
    mapping(address => uint256) _lockBalances;
    /**
     * @notice Status of an account on block list
     * @dev Set to true when an account is blocked
     * @dev Expectation is that _isBlockList will not change after initialization
     */
    bool _isBlockList;
  }

  event AccountActivated(address indexed caller_, address indexed account_);

  event AccountDeactivated(address indexed caller_, address indexed account_);

  event AccountActivatedBatch(address caller_, address[] accounts_);

  event AccountDeactivatedBatch(address caller_, address[] accounts_);

  event Locked(address indexed caller_, address indexed owner_, uint256 amount_);

  event LockedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  event Unlocked(address indexed caller_, address indexed owner_, uint256 amount_);

  event UnlockedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  event ForceBurned(address indexed caller_, address indexed owner_, uint256 amount_);

  event ForceBurnedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  event ForceTransferred(address indexed caller_, address indexed owner_, address indexed newOwner_, uint256 amount_);

  event ForceTransferredBatch(address indexed caller_, address[] owners_, address[] newOwners_, uint256[] amounts_);

  function ref() internal pure returns (ManagedAccountStorage storage s) {
    bytes32 position = MANAGED_ACCOUNT_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _accountActive(address requestor_) internal view returns (bool active_) {
    if (ref()._isBlockList) {
      return (!ref()._accountList.contains(requestor_));
    } else {
      return (ref()._accountList.contains(requestor_));
    }
  }

  function _activateAccount(address owner_) internal {
    require(owner_ != address(0), "FACT0205");
    require(!_accountActive(owner_), "FACT0201");
    if (ref()._isBlockList) {
      ref()._accountList.remove(owner_);
    } else {
      ref()._accountList.add(owner_);
    }
    emit AccountActivated(msg.sender, owner_);
  }

  function _batchActivateAccount(address[] calldata owners_) internal {
    for (uint256 i = 0; i < owners_.length; i++) {
      require(owners_[i] != address(0), "FACT0205");
      require((!_accountActive(owners_[i])), "FACT0201");
      if (ref()._isBlockList) {
        ref()._accountList.remove(owners_[i]);
      } else {
        ref()._accountList.add(owners_[i]);
      }
    }
    emit AccountActivatedBatch(msg.sender, owners_);
  }

  function _deactivateAccount(address owner_) internal {
    require(owner_ != address(0), "FACT0205");
    require(_accountActive(owner_), "FACT0200");
    if (ref()._isBlockList) {
      ref()._accountList.add(owner_);
    } else {
      ref()._accountList.remove(owner_);
    }
    emit AccountDeactivated(msg.sender, owner_);
  }

  function _batchDeactivateAccount(address[] calldata owners_) internal {
    for (uint256 i = 0; i < owners_.length; i++) {
      require(owners_[i] != address(0), "FACT0205");
      require(_accountActive(owners_[i]), "FACT0200");
      if (ref()._isBlockList) {
        ref()._accountList.add(owners_[i]);
      } else {
        ref()._accountList.remove(owners_[i]);
      }
    }
    emit AccountDeactivatedBatch(msg.sender, owners_);
  }

  function _lockBalanceOf(address owner_) internal view returns (uint256 balance_) {
    return ref()._lockBalances[owner_];
  }

  function _lock(address owner_, uint256 amount_) internal {
    require(owner_ != address(0), "FACT0205");
    require(amount_ > 0, "FACT0206");
    require(LibERC20.ref()._balances[owner_] >= amount_, "FACT0202");
    LibERC20.ref()._balances[owner_] -= amount_;
    ref()._lockBalances[owner_] += amount_;
    emit Locked(msg.sender, owner_, amount_);
    emit LibERC20.Transfer(owner_, LOCK_ADDRESS, amount_);
  }

  function _batchLock(address[] calldata owners_, uint256[] calldata amounts_) internal {
    require(owners_.length == amounts_.length, "FACT0203");
    for (uint256 i = 0; i < owners_.length; i++) {
      require(owners_[i] != address(0), "FACT0205");
      require(amounts_[i] > 0, "FACT0206");
      require(LibERC20.ref()._balances[owners_[i]] >= amounts_[i], "FACT0202");
      LibERC20.ref()._balances[owners_[i]] -= amounts_[i];
      ref()._lockBalances[owners_[i]] += amounts_[i];
      emit LibERC20.Transfer(owners_[i], LOCK_ADDRESS, amounts_[i]);
    }
    emit LockedBatch(msg.sender, owners_, amounts_);
  }

  function _unlock(address owner_, uint256 amount_) internal {
    require(owner_ != address(0), "FACT0205");
    require(amount_ > 0, "FACT0206");
    require(ref()._lockBalances[owner_] >= amount_, "FACT0202");
    ref()._lockBalances[owner_] -= amount_;
    LibERC20.ref()._balances[owner_] += amount_;
    emit Unlocked(msg.sender, owner_, amount_);
    emit LibERC20.Transfer(LOCK_ADDRESS, owner_, amount_);
  }

  function _batchUnlock(address[] calldata owners_, uint256[] calldata amounts_) internal {
    require(owners_.length == amounts_.length, "FACT0203");
    for (uint256 i = 0; i < owners_.length; i++) {
      require(owners_[i] != address(0), "FACT0205");
      require(amounts_[i] > 0, "FACT0206");
      require(ref()._lockBalances[owners_[i]] >= amounts_[i], "FACT0202");
      ref()._lockBalances[owners_[i]] -= amounts_[i];
      LibERC20.ref()._balances[owners_[i]] += amounts_[i];
      emit LibERC20.Transfer(LOCK_ADDRESS, owners_[i], amounts_[i]);
    }
    emit UnlockedBatch(msg.sender, owners_, amounts_);
  }

  function _forceBurn(address owner_, uint256 amount_) internal {
    require(owner_ != address(0), "FACT0205");
    require(amount_ > 0, "FACT0206");
    require(ref()._lockBalances[owner_] >= amount_, "FACT0202");
    ref()._lockBalances[owner_] -= amount_;
    LibERC20.ref()._totalSupply -= amount_;
    emit ForceBurned(msg.sender, owner_, amount_);
    emit LibERC20.Transfer(LOCK_ADDRESS, address(0), amount_);
  }

  function _batchForceBurn(address[] calldata owners_, uint256[] calldata amounts_) internal {
    require(owners_.length == amounts_.length, "FACT0203");
    for (uint256 i = 0; i < owners_.length; i++) {
      require(owners_[i] != address(0), "FACT0205");
      require(amounts_[i] > 0, "FACT0206");
      require(ref()._lockBalances[owners_[i]] >= amounts_[i], "FACT0202");
      ref()._lockBalances[owners_[i]] -= amounts_[i];
      LibERC20.ref()._totalSupply -= amounts_[i];
      emit LibERC20.Transfer(LOCK_ADDRESS, address(0), amounts_[i]);
    }
    emit ForceBurnedBatch(msg.sender, owners_, amounts_);
  }

  function _forceTransfer(address owner_, address newOwner_, uint256 amount_) internal {
    require(newOwner_ != address(0), "FACT0204");
    require(owner_ != address(0), "FACT0205");
    require(amount_ > 0, "FACT0206");
    require(ref()._lockBalances[owner_] >= amount_, "FACT0202");
    ref()._lockBalances[owner_] -= amount_;
    ref()._lockBalances[newOwner_] += amount_;
    emit ForceTransferred(msg.sender, owner_, newOwner_, amount_);
  }

  function _batchForceTransfer(
    address[] calldata owners_,
    address[] calldata newOwners_,
    uint256[] calldata amounts_
  ) internal {
    require(owners_.length == amounts_.length, "FACT0203");
    require(owners_.length == newOwners_.length, "FACT0203");

    for (uint256 i = 0; i < owners_.length; i++) {
      require(newOwners_[i] != address(0), "FACT0204");
      require(owners_[i] != address(0), "FACT0205");
      require(amounts_[i] > 0, "FACT0206");
      require(ref()._lockBalances[owners_[i]] >= amounts_[i], "FACT0202");
      ref()._lockBalances[owners_[i]] -= amounts_[i];
      ref()._lockBalances[newOwners_[i]] += amounts_[i];
    }
    emit ForceTransferredBatch(msg.sender, owners_, newOwners_, amounts_);
  }
}
