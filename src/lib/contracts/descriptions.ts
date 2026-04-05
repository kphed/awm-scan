const METHOD_DESCRIPTIONS: Record<string, string> = {
  "mint(bytes32,address,uint256)":
    "Creates new fund tokens for an investor after subscription capital clears.",
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  "Burn(bytes32,address,address,uint256)":
    "Emitted when a redemption flow burns fund tokens from an investor balance.",
};

export function getMethodDescription(signature: string) {
  return METHOD_DESCRIPTIONS[signature] ?? null;
}

export function getEventDescription(signature: string) {
  return EVENT_DESCRIPTIONS[signature] ?? null;
}
