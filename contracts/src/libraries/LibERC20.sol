// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibERC20 {
  bytes32 private constant ERC20_STORAGE_POSITION = keccak256("fact.erc20.storage");

  struct ERC20Storage {
    /**
     * @notice ERC-20 name
     * @dev Can be any string, but most likely asset "long name"
     */
    string _name;
    /**
     * @notice ERC-20 symbol
     * @dev Can be any string, but most likely asset "CUSTODIAN:CTA:CUSIP"
     */
    string _symbol;
    /**
     * @notice ERC-20 decimals
     * @dev Should be equal to the number of divisible parts of the asset
     */
    uint8 _decimals;
    /**
     * @notice ERC-20 total supply
     * @dev Should increment when tokens are minted and decremented when tokens are completely removed
     */
    uint256 _totalSupply;
    /**
     * @notice ERC-20 allowance
     * @dev The number of tokens that are allowed CAN be greater than existing token balance
     */
    mapping(address => mapping(address => uint256)) _allowances;
    /**
     * @notice ERC-20 balance
     * @dev Represents the number of AVAILABLE and USABLE tokens in the account
     */
    mapping(address => uint256) _balances;
  }

  event Transfer(address indexed from_, address indexed to_, uint256 amount_);

  event Approval(address indexed owner_, address indexed spender_, uint256 amount_);

  function ref() internal pure returns (ERC20Storage storage s) {
    bytes32 position = ERC20_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _transfer(address from_, address to_, uint256 amount_) internal {
    require(from_ != address(0), "FACT0501");
    require(to_ != address(0), "FACT0500");
    require(ref()._balances[from_] >= amount_, "FACT0502");

    ref()._balances[from_] -= amount_;
    ref()._balances[to_] += amount_;

    emit Transfer(from_, to_, amount_);
  }

  function _spendAllowance(address owner_, address spender_, uint256 amount_) internal {
    uint256 allowance = _allowance(owner_, spender_);
    require(allowance >= amount_, "FACT0505");
    _approve(owner_, spender_, allowance - amount_);
  }

  function _approve(address owner_, address spender_, uint256 amount_) internal {
    require(owner_ != address(0), "FACT0503");
    require(spender_ != address(0), "FACT0504");

    ref()._allowances[owner_][spender_] = amount_;
    emit Approval(owner_, spender_, ref()._allowances[owner_][spender_]);
  }

  function _allowance(address owner_, address spender_) internal view returns (uint256) {
    return ref()._allowances[owner_][spender_];
  }
}
