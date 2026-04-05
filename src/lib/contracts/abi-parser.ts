import { ABI_ARTIFACTS } from "./artifacts";
import type {
  AbiParam,
  FacetData,
  ParsedEvent,
  ParsedMethod,
  RawAbiEntry,
  RawAbiParameter,
} from "./types";

const READ_MUTABILITIES = new Set(["pure", "view"]);
const WRITE_MUTABILITIES = new Set(["nonpayable", "payable"]);

type MethodMutability = ParsedMethod["stateMutability"];

function isMethodMutability(
  value: string | undefined,
): value is MethodMutability {
  return (
    value === "view" ||
    value === "pure" ||
    value === "nonpayable" ||
    value === "payable"
  );
}

function isFunctionEntry(entry: RawAbiEntry): entry is RawAbiEntry & {
  type: "function";
  name: string;
  inputs: RawAbiParameter[];
  outputs?: RawAbiParameter[];
  stateMutability: MethodMutability;
} {
  return (
    entry.type === "function" &&
    Boolean(entry.name) &&
    isMethodMutability(entry.stateMutability)
  );
}

function isEventEntry(entry: RawAbiEntry): entry is RawAbiEntry & {
  type: "event";
  name: string;
  inputs: RawAbiParameter[];
} {
  return (
    entry.type === "event" && Boolean(entry.name) && Array.isArray(entry.inputs)
  );
}

function toAbiParam(parameter: RawAbiParameter): AbiParam {
  return {
    name: parameter.name ?? "",
    type: parameter.type,
    indexed: parameter.indexed,
    components: parameter.components?.map((component) => toAbiParam(component)),
  };
}

function getSignature(
  name: string,
  inputs: readonly RawAbiParameter[] | undefined,
) {
  return `${name}(${(inputs ?? []).map((input) => input.type).join(",")})`;
}

function toParsedMethod(
  method: RawAbiEntry & {
    name: string;
    inputs: RawAbiParameter[];
    outputs?: RawAbiParameter[];
    stateMutability: MethodMutability;
  },
): ParsedMethod {
  return {
    name: method.name,
    signature: getSignature(method.name, method.inputs),
    inputs: method.inputs.map((input) => toAbiParam(input)),
    outputs: (method.outputs ?? []).map((output) => toAbiParam(output)),
    stateMutability: method.stateMutability,
  };
}

function toParsedEvent(
  event: RawAbiEntry & { name: string; inputs: RawAbiParameter[] },
): ParsedEvent {
  return {
    name: event.name,
    signature: getSignature(event.name, event.inputs),
    inputs: event.inputs.map((input) => toAbiParam(input)),
  };
}

function dedupeBySignature<T extends { signature: string }>(items: T[]) {
  return [...new Map(items.map((item) => [item.signature, item])).values()];
}

export function parseFacetData(name: string, abi: RawAbiEntry[]): FacetData {
  const functionEntries = abi.filter(isFunctionEntry);
  const eventEntries = abi.filter(isEventEntry);
  const readMethods = dedupeBySignature(
    functionEntries
      .filter((entry) => READ_MUTABILITIES.has(entry.stateMutability))
      .map((entry) => toParsedMethod(entry)),
  );
  const writeMethods = dedupeBySignature(
    functionEntries
      .filter((entry) => WRITE_MUTABILITIES.has(entry.stateMutability))
      .map((entry) => toParsedMethod(entry)),
  );
  const events = dedupeBySignature(
    eventEntries.map((entry) => toParsedEvent(entry)),
  );

  return {
    name,
    readMethods,
    writeMethods,
    events,
    hasConstructor: abi.some((entry) => entry.type === "constructor"),
  };
}

export function getAllFacets() {
  return Object.entries(ABI_ARTIFACTS)
    .map(([name, abi]) => parseFacetData(name, abi))
    .sort((left, right) => left.name.localeCompare(right.name));
}
