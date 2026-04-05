// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibFactBase {
  bytes32 private constant FACT_BASE_STORAGE_POSITION = keccak256("fact.base.storage");

  /**
   * @notice Used to grant token admin access to an address
   * @dev Defines role in AccessControlEnumerable
   */
  bytes32 public constant TOKEN_ADMIN = keccak256("TOKEN_ADMIN");

  /**
   * @notice Used to grant account admin access to an address
   * @dev Defines role in AccessControlEnumerable
   */
  bytes32 public constant ACCOUNT_ADMIN = keccak256("ACCOUNT_ADMIN");

  /**
   * @notice Used to grant tokenization agent access to an address
   * @dev Defines role in AccessControlEnumerable
   */
  bytes32 public constant TOKENIZATION_AGENT = keccak256("TOKENIZATION_AGENT");

  /**
   * @notice Used to specify a burner address
   * @dev Defines role in AccessControlEnumerable
   */
  bytes32 public constant BURNER = keccak256("BURNER");

  /**
   * @notice A mint/burn request
   * @dev A new request struct is created for every mint/burn request and is never deleted
   *
   * @param requestId the unique identifier for the request
   * @param requestType the type of the request (mint/burn)
   * @param requestStatus thee status of the request (uninitialized, pending, approved, rejected)
   * @param requester address that made the request
   * @param responder address that acted on the request
   * @param amount the number of tokens requested
   * @param burnFrom address to which tokens are transferred to and from which tokens will be burned
   */
  struct Request {
    bytes32 requestId;
    RequestType requestType;
    RequestStatus requestStatus;
    address requester;
    address responder;
    uint256 amount;
    address burnFrom;
  }

  /**
   * @notice The request type
   *
   * @dev MINT identifies request to be used for minting requests
   * @dev BURN identifies request to be used for burning requests
   */
  enum RequestType {
    MINT,
    BURN
  }

  /**
   * @notice The request status
   *
   * @dev UNINITIALIZED request does not exist
   * @dev PENDING request has been made, but has not been acted on
   * @dev APPROVED request has been accepted
   * @dev REJECTED request has been rejected
   */
  enum RequestStatus {
    UNINITIALIZED,
    PENDING,
    APPROVED,
    REJECTED
  }

  struct FactTokenStorage {
    /**
     * @notice Mint/Burn requests
     * @dev Requests should NEVER be deleted from this mapping
     */
    mapping(bytes32 => Request) _requests;
  }

  function ref() internal pure returns (FactTokenStorage storage s) {
    bytes32 position = FACT_BASE_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _getTokenAdmin() internal pure returns (bytes32) {
    return TOKEN_ADMIN;
  }

  function _getAccountAdmin() internal pure returns (bytes32) {
    return ACCOUNT_ADMIN;
  }

  function _getTokenizationAgent() internal pure returns (bytes32) {
    return TOKENIZATION_AGENT;
  }

  function _getBurner() internal pure returns (bytes32) {
    return BURNER;
  }

  function _requestOf(
    bytes32 requestId_,
    address requester_,
    LibFactBase.RequestType requestType_
  ) internal view returns (uint256 status_, address responder_, uint256 amount_) {
    bytes32 internalRequestId = LibFactBase._generateID(requestId_, requester_);
    LibFactBase.Request memory request = ref()._requests[internalRequestId];

    require(request.requestStatus != LibFactBase.RequestStatus.UNINITIALIZED, "FACT0000");
    require(request.requestType == requestType_, "FACT0001");

    return (uint256(request.requestStatus), request.responder, request.amount);
  }

  function _getRequest(bytes32 requestId_) internal view returns (LibFactBase.Request memory request_) {
    return LibFactBase.ref()._requests[requestId_];
  }

  function _generateID(bytes32 seed, address from) internal pure returns (bytes32 _id) {
    _id = keccak256(abi.encodePacked(seed, from));
  }
}
