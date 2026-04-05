// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

/**
 * @title Token Burning Interface
 * @author Kinexys Digital Assets Engineering
 * @notice Simple interface defining all functionalities needed to make a token "burnable"
 * @dev Interface enforces a two-step burn process
 */
interface IBurnPreparable {
  /**
   * @notice Event is emitted whenever some address requests tokens to be burned to its account
   * @dev MUST trigger when an address requests to burn some tokens
   * @param requestId_ id for the request to be created
   * @param requester_ address for which request is made
   * @param burner_ address to which tokens are transferred to and from which tokens will be burned
   * @param amount_ requested number of tokens to be burned
   */
  event BurnRequested(bytes32 indexed requestId_, address indexed requester_, address burner_, uint256 amount_);

  /**
   * @notice Creates a request to burn some from tokens the from_ address and TRANSFERS amount_ tokens from from_
   * to burner address
   * @dev Implementation must satisfy all pre-checks
   * @dev This function is expected to be called by the TOKENIZATION_AGENT only
   * @param requestId_ id for the request to be created
   * @param from_ address for which the burn request will be from
   * @param burner_ address to which tokens are transferred to and from which tokens will be burned
   * @param amount_ requested number of tokens to be burned
   * @return success_ status of the request to burn (true/false)
   */
  function prepareBurn(
    bytes32 requestId_,
    address from_,
    address burner_,
    uint256 amount_
  ) external returns (bool success_);
}
