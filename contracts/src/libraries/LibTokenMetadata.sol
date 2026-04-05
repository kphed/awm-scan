// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library LibTokenMetadata {
  bytes32 private constant TOKEN_METADATA_STORAGE_POSITION = keccak256("fact.tokenmetadata.storage");

  struct TokenMetadataStorage {
    /**
     * @notice URI/Pointer to external system containing metadata of the asset represented by this token
     */
    string _metadata;
  }

  event MetadataUpdated(string previousMetadata_, string currentMetadata_);

  function ref() internal pure returns (TokenMetadataStorage storage s) {
    bytes32 position = TOKEN_METADATA_STORAGE_POSITION;
    assembly {
      s.slot := position
    }
  }

  function _setMetadata(string memory metadata_) internal {
    string memory previousmetadata_ = ref()._metadata;
    ref()._metadata = metadata_;
    emit MetadataUpdated(previousmetadata_, metadata_);
  }
}
