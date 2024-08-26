import type { FlatErrors, GenericSchema, GenericSchemaAsync } from "valibot"

export type GenericSchemaMaybeAsync = GenericSchema | GenericSchemaAsync

export type GenericFlatErrors = FlatErrors<any>
