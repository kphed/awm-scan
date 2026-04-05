// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IERC20} from "../interfaces/IERC20.sol";
import {LibERC20} from "../libraries/LibERC20.sol";
import {LibManagedToken} from "../libraries/LibManagedToken.sol";
import {LibManagedAccount} from "../libraries/LibManagedAccount.sol";
import {LibPausable} from "../libraries/LibPausable.sol";

contract ERC20Facet is IERC20 {
  constructor() {}

  // Modifiers
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
   * @inheritdoc IERC20
   */
  function name() public view virtual override returns (string memory name_) {
    return LibERC20.ref()._name;
  }

  /**
   * @inheritdoc IERC20
   */
  function symbol() public view virtual override returns (string memory symbol_) {
    return LibERC20.ref()._symbol;
  }

  /**
   * @inheritdoc IERC20
   */
  function decimals() public view virtual override returns (uint8 decimals_) {
    return LibERC20.ref()._decimals;
  }

  /**
   * @inheritdoc IERC20
   */
  function totalSupply() public view virtual override returns (uint256 totalSupply_) {
    return LibERC20.ref()._totalSupply;
  }

  /**
   * @inheritdoc IERC20
   */
  function balanceOf(address owner_) public view virtual override returns (uint256 balance_) {
    return LibERC20.ref()._balances[owner_];
  }

  /**
   * @inheritdoc IERC20
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender balance < amount_
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if to_ is deactivated
   * @dev MUST revert if msg.sender is the zero address
   * @dev MUST revert if to_ is the zero address
   */
  function transfer(
    address to_,
    uint256 amount_
  )
    public
    virtual
    override
    whenNotPaused
    whenActiveToken
    onlyActiveAccount(msg.sender)
    onlyActiveAccount(to_)
    returns (bool success_)
  {
    LibERC20._transfer(msg.sender, to_, amount_);
    return true;
  }

  /**
   * @inheritdoc IERC20
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if msg.sender allowance for from_ < amount_
   * @dev MUST revert if from_ balance < amount_
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if from_ is deactivated
   * @dev MUST revert if to_ is deactivated
   * @dev MUST revert if msg.sender is the zero address
   * @dev MUST revert if from_ is the zero address
   * @dev MUST revert if to_ is the zero address
   * @dev MUST update allowance after successful transfer
   */
  function transferFrom(
    address from_,
    address to_,
    uint256 amount_
  )
    public
    virtual
    override
    whenNotPaused
    whenActiveToken
    onlyActiveAccount(from_)
    onlyActiveAccount(to_)
    onlyActiveAccount(msg.sender)
    returns (bool success_)
  {
    LibERC20._spendAllowance(from_, msg.sender, amount_);
    LibERC20._transfer(from_, to_, amount_);
    return true;
  }

  /**
   * @inheritdoc IERC20
   *
   * @dev MUST revert if contract is paused
   * @dev MUST revert if token is inactive
   * @dev MUST revert if msg.sender is deactivated
   * @dev MUST revert if spender_ is deactivated
   * @dev MUST revert if msg.sender is the zero address
   * @dev MUST revert if spender_ is the zero address
   * @dev CAN approve more than the msg.sender address balance
   */
  function approve(
    address spender_,
    uint256 amount_
  )
    public
    virtual
    override
    whenNotPaused
    whenActiveToken
    onlyActiveAccount(msg.sender)
    onlyActiveAccount(spender_)
    returns (bool success_)
  {
    LibERC20._approve(msg.sender, spender_, amount_);
    return true;
  }

  /**
   * @inheritdoc IERC20
   */
  function allowance(address owner_, address spender_) public view virtual override returns (uint256 remaining_) {
    return LibERC20._allowance(owner_, spender_);
  }
}
