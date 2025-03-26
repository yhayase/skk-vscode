import { Candidate } from "./candidate";

export type Jisyo = Map<string, Candidate[]>;
export type CacheMetadata = { expiry: number };