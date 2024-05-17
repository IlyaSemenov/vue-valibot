import type { BaseSchema, BaseSchemaAsync } from "valibot"

export type BaseSchemaMaybeAsync<TInput = any, TOutput = TInput> =
  | BaseSchema<TInput, TOutput>
  | BaseSchemaAsync<TInput, TOutput>
