// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Managed Token Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining administrative functions to manage tokens
 * @dev Allows tokens in balance to be managed by an authorized user
 */
interface IManagedAccount {
  /**
   * @notice Event signaling that an address is activated (e.g. sanctions lifted)
   * @dev MUST trigger when the account status is changed from deactivated to activated
   *
   * @param caller_ authorized address that activated another address
   * @param account_ address that is activated
   */
  event AccountActivated(address indexed caller_, address indexed account_);

  /**
   * @notice Event signaling that an address is activated (e.g. sanctions)
   * @dev MUST trigger when the address status is changed from activated to deactivated
   *
   * @param caller_ authorized address that deactivated another address
   * @param account_ address that is deactivated
   */
  event AccountDeactivated(address indexed caller_, address indexed account_);

  /**
   * @notice Event signaling that some addresses are activated for business reasons (e.g. sanctions lifted)
   * @dev MUST trigger when the address' statuses are changed from deactivated to activated
   *
   * @param caller_  authorized address that activated a number of addresses
   * @param accounts_ addresses that are activated
   */
  event AccountActivatedBatch(address caller_, address[] accounts_);

  /**
   * @notice Event signaling that some addresses are deactivated for business reasons (e.g. sanctions)
   * @dev MUST trigger when the address' statuses are changed from activated to deactivated
   *
   * @param caller_  authorized address that deactivated a number of addresses
   * @param accounts_ addresses that are deactivated
   */
  event AccountDeactivatedBatch(address caller_, address[] accounts_);

  /**
   * @notice Event signals an amount of an address's tokens are locked for business reasons (e.g. default)
   * @dev MUST trigger when some tokens for the affected address is locked
   *
   * @param caller_ authorized address that locked some tokens
   * @param owner_ address from which tokens were locked
   * @param amount_ number of tokens that have been locked
   */
  event Locked(address indexed caller_, address indexed owner_, uint256 amount_);

  /**
   * @notice Event signals an amount of an address' tokens are locked for business reasons (e.g. default)
   * @dev MUST trigger when some tokens for the affected addresses are locked
   *
   * @param caller_ authorized address that locked some tokens
   * @param owners_ addresses from which tokens were locked
   * @param amounts_ number of tokens from each address that have been locked
   */
  event LockedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  /**
   * @notice Event signals an amount of an address's tokens are unlocked for business reasons (e.g. default)
   * @dev MUST trigger when some tokens for the affected address is unlocked
   *
   * @param caller_ authorized address that locked some tokens
   * @param owner_ address from which tokens were unlocked
   * @param amount_ number of tokens that have been unlocked
   */
  event Unlocked(address indexed caller_, address indexed owner_, uint256 amount_);

  /**
   * @notice Event signals an amount of an address' tokens are unlocked for business reasons (e.g. default)
   * @dev MUST trigger when some tokens for the affected addresses are unlocked
   *
   * @param caller_ authorized address that locked some tokens
   * @param owners_ addresses from which tokens were unlocked
   * @param amounts_ number of tokens from each address that have been unlocked
   */
  event UnlockedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  /**
   * @notice Event signals an amount of an address's tokens are forcibly burned (e.g. off-chain reconciliation)
   * @dev MUST trigger when some tokens for the affected address is force burned
   *
   * @param caller_ authorized address that force burned some tokens
   * @param owner_ address from which tokens were force burned
   * @param amount_ number of tokens from that have been force burned
   */
  event ForceBurned(address indexed caller_, address indexed owner_, uint256 amount_);

  /**
   * @notice Event signals an amount of address' tokens are forcibly burned (e.g. off-chain reconciliation)
   * @dev MUST trigger when some tokens for the affected addresses are force burned
   * @param caller_ authorized address that locked some tokens
   * @param owners_ addresses from which tokens were force burned
   * @param amounts_ number of tokens from each address that have been force burned
   */
  event ForceBurnedBatch(address indexed caller_, address[] owners_, uint256[] amounts_);

  /**
   * @notice Event signals an amount of an address's tokens are forcibly transferred (e.g. off-chain reconciliation)
   * @dev MUST trigger when some tokens for the affected address is force transferred
   *
   * @param caller_ authorized address that force transfers some tokens
   * @param owner_ address from which tokens were force transferred
   * @param newOwner_ address to which tokens were force transferred
   * @param amount_ number of tokens from that have been force transferred
   */
  event ForceTransferred(address indexed caller_, address indexed owner_, address indexed newOwner_, uint256 amount_);

  /**
   * @notice Event signals an amount of address' tokens are forcibly transferred (e.g. off-chain reconciliation)
   * @dev MUST trigger when some tokens for the affected addresses are force transferred
   * @param caller_ authorized address that force transfers some tokens
   * @param owners_ addresses from which tokens were force transferred
   * @param newOwners_ addresses to which tokens were force transferred
   * @param amounts_ number of tokens from each address that have been force transferred
   */
  event ForceTransferredBatch(address indexed caller_, address[] owners_, address[] newOwners_, uint256[] amounts_);

  /**
   * @notice Queries an address's status
   *
   * @param owner_ address of the account to be activated
   * @return active_ status of the address (true/false)
   */
  function accountActive(address owner_) external view returns (bool active_);

  /**
   * @notice Queries a number of address' statuses
   *
   * @param owners_ addresses of the accounts to be activated
   * @return actives_ status of the addresses (true/false)
   */
  function batchAccountActive(address[] calldata owners_) external view returns (bool[] memory actives_);

  /**
   * @notice Activate the address and enable regular business processes (e.g. sanctions lifted)
   *
   * @param owner_ address of the account to be activated
   * @return success_ status of the transaction (true/false)
   */
  function activateAccount(address owner_) external returns (bool success_);

  /**
   * @notice Activate a number of addresses and enable regular business processes (e.g. sanctions lifted)
   *
   * @param owners_ addresses of the accounts to be activated
   * @return success_ status of the transaction (true/false)
   */
  function batchActivateAccount(address[] calldata owners_) external returns (bool success_);

  /**
   * @notice Deactivate the address and disable regular business processes (e.g. sanctions)
   *
   * @param owner_ address of the account to be deactivated
   * @return success_ status of the transaction (true/false)
   */
  function deactivateAccount(address owner_) external returns (bool success_);

  /**
   * @notice Deactivate the address and disable regular business processes (e.g. sanctions)
   *
   * @param owners_ addresses of the accounts to be deactivated
   * @return success_ status of the transaction (true/false)
   */
  function batchDeactivateAccount(address[] calldata owners_) external returns (bool success_);

  /**
   * @notice Query for the amount of tokens locked up for an address
   *
   * @param owner_ the address of the owner of the locked balance
   * @return balance_ number of locked tokens belonging to the address
   */
  function lockBalanceOf(address owner_) external view returns (uint256 balance_);

  /**
   * @notice Query for the amount of tokens locked up for a number of addresses
   *
   * @param owners_ the address of the owner of the locked balance
   * @return balances_ number of locked tokens belonging to each address
   */
  function batchLockBalanceOf(address[] calldata owners_) external view returns (uint256[] memory balances_);

  /**
   * @notice Lock a number of tokens for an address
   * @dev MUST lock up ONLY to the total token balance of the address
   *
   * @param owner_ the address of the owner for which tokens are locked
   * @param amount_ the number of tokens to be locked
   * @return success_ status of the locking of the tokens (true/false)
   */
  function lock(address owner_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Lock a number of tokens for each address
   * @dev MUST lock up ONLY to the total token balance of the address
   *      MUST fail and rollback if ANY lock fails
   *
   * @param owners_ the addresses of the owners for which tokens are locked
   * @param amounts_ the number of tokens to be locked for each address
   * @return success_ status of the locking of the tokens (true/false)
   */
  function batchLock(address[] calldata owners_, uint256[] calldata amounts_) external returns (bool success_);

  /**
   * @notice Unlock a number of tokens for an address
   * @dev MUST lock up ONLY to the total locked token balance of the address
   *
   * @param owner_ the address of the owner for which tokens are unlocked
   * @param amount_ the number of tokens to be unlocked
   * @return success_ status of the unlocking of the tokens (true/false)
   */
  function unlock(address owner_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Unlock a number of tokens for each address
   * @dev MUST lock up ONLY to the total locked token balance of the address
   *      MUST fail and rollback if ANY unlock fails
   *
   * @param owners_ the addresses of the owners for which tokens are unlocked
   * @param amounts_ the number of tokens to be unlocked for each address
   * @return success_ status of the unlocking of the tokens (true/false)
   */
  function batchUnlock(address[] calldata owners_, uint256[] calldata amounts_) external returns (bool success_);

  /**
   * @notice Force burn a number of tokens for an address
   * @dev MUST only be able to force burn balances that have been burnt
   *
   * @param owner_ the address of the owner for which tokens are force burned
   * @param amount_ the number of tokens to be burned
   * @return success_ status of the burning of the tokens (true/false)
   */
  function forceBurn(address owner_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Force burn a number of tokens for each address for business reasons (e.g. default)
   * @dev MUST only be able to force burn balances that have been locked
   *      MUST fail and rollback if ANY force burn fails
   *
   * @param owners_ the addresses of the owners for which tokens are force burned
   * @param amounts_ the number of tokens to be force burned for each address
   * @return success_ status of the unlocking of the tokens (true/false)
   */
  function batchForceBurn(address[] calldata owners_, uint256[] calldata amounts_) external returns (bool success_);

  /**
   * @notice Force transfer a number of locked tokens for an address
   * @dev MUST only be able to force transfer balances that have been locked
   *
   * @param owner_ the address of the owner for which tokens are transferred
   * @param newOwner_ the address of which locked tokens are transferred to
   * @param amount_ the number of tokens to be unlocked
   * @return success_ status of the transfer of the tokens (true/false)
   */
  function forceTransfer(address owner_, address newOwner_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Force transfer a number of tokens for each address for business reasons (e.g. default)
   * @dev MUST only be able to force transfer balances that have been locked
   *      MUST fail and rollback if ANY force transfer fails
   *
   * @param owners_ the addresses of the owners for which tokens are transferred
   * @param amounts_ the number of tokens to be force transferred for each address
   * @param newOwners_ the addresses of which locked tokens are transferred to
   * @return success_ status of the trasnfer of the tokens (true/false)
   */
  function batchForceTransfer(
    address[] calldata owners_,
    address[] calldata newOwners_,
    uint256[] calldata amounts_
  ) external returns (bool success_);
}
