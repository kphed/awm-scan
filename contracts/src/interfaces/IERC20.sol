// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title ERC-20 Token Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities of an ERC-20 token
 * @dev Interface enforces all metadata fields defined as optional in the ERC-20 specifications
 *
 */
interface IERC20 {
  /**
   * @notice Event is emitted whenever a token is transferred from one account to another
   * @dev Event is only emitted when the transfer is "usual" and not under "managed" circumstances
   *
   * @param from_ address from which tokens are moved from
   * @param to_ address from which tokens are moved to
   * @param amount_ number of tokens which are moved
   */
  event Transfer(address indexed from_, address indexed to_, uint256 amount_);

  /**
   * @notice Event is emitted when some address is allowed to move some tokens on the owner's behalf
   * @dev Event is only emitted when the transfer is "usual" and not under "managed" circumstances
   *
   * @param owner_ address of owner tokens from which approval is granted
   * @param spender_ address approved to some tokens from the owner's address
   * @param amount_ amount of tokens which are approved to be moved
   */
  event Approval(address indexed owner_, address indexed spender_, uint256 amount_);

  /**
   * @notice Name of the token represented by this contract
   * @dev Name will most likely be the asset "long name" or equivalent
   *
   * @return name_ name of the token
   */
  function name() external view returns (string memory name_);

  /**
   * @notice Symbol of the token represented by this contract
   * @dev Symbol will most likely be the asset ISIN or equivalent
   *
   * @return symbol_ symbol of the token
   */
  function symbol() external view returns (string memory symbol_);

  /**
   * @notice Number of decimals (significant digits) the token supports
   * @dev The default value for this is 18, but modify based on asset's atomic unit requirements
   *
   * @return decimals_ number of decimal points supported by the token
   */
  function decimals() external view returns (uint8 decimals_);

  /**
   * @notice Total supply of tokens minted in this contract
   * @dev Total supply does not change for tokens that are "pending" some other action (e.g. locked)
   *
   * @return totalSupply_ total number of tokens that have been minted
   */
  function totalSupply() external view returns (uint256 totalSupply_);

  /**
   * @notice Query for the token balance of some address
   * @dev Only "usable" balance amount will be returned, and not those that are "locked up"
   *
   * @param owner_ the address of the owner of the balance
   * @return balance_ number of tokens belonging to the address
   */
  function balanceOf(address owner_) external view returns (uint256 balance_);

  /**
   * @notice Transfer tokens from sender address to another address
   * @dev Implementation must satisfy all pre-checks
   *
   * @param to_ address to which tokens are moved
   * @param amount_ amount of tokens to be moved
   * @return success_ status of transfer (true/false)
   */
  function transfer(address to_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Transfer tokens from some account to another account
   * @dev Implementation must satisfy all pre-checks and respect approved amount
   *
   * @param from_ address from which tokens are moved
   * @param to_ address to which tokens are moved
   * @param amount_ amount of tokens to be moved
   * @return success_ status of transfer (true/false)
   */
  function transferFrom(address from_, address to_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Approve some address to move some tokens on sender's behalf
   * @dev Implementation must satisfy all pre-checks. The amount approved will replace the existing amount.
   *
   * @param spender_ address to be authorized to move tokens from the sender address
   * @param amount_ amount of tokens to be moved
   * @return success_ status of transfer (true/false)
   */
  function approve(address spender_, uint256 amount_) external returns (bool success_);

  /**
   * @notice Remaining tokens that can be moved on sender's behalf by another address
   * @dev Only "usable" approved amount will be returned, and not those that are "locked up"
   *
   * @param owner_ the address of the owner of the balance
   * @param spender_ address to be authorized to move tokens from the sender address
   * @return remaining_ number of tokens that is remaining and is authorized to be moved
   */
  function allowance(address owner_, address spender_) external view returns (uint256 remaining_);
}
