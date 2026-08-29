// Types for validators.js, which scripts/build-validators.mjs generates.
//
// Hand-written and committed on purpose: tsc needs these declarations to
// compile src/, and the JavaScript beside them is built afterwards.
import type { ErrorObject } from "ajv";

/**
 * A schema compiled ahead of time. Same shape as an Ajv `ValidateFunction`:
 * returns whether the data is valid and leaves the reasons on `errors`.
 */
export interface PrecompiledValidator {
  (data: unknown): boolean;
  errors?: ErrorObject[] | null;
}

/** One export per published format version, named `v` plus the version. */
export const v0_1: PrecompiledValidator;
export const v0_2: PrecompiledValidator;

/** The isolated pre-standard Version 1 candidate. */
export const v1: PrecompiledValidator;

/** The `report-0.1` profile: the shape of an incoming report. */
export const report: PrecompiledValidator;
