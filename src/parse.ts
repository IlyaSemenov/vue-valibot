import { ref, toValue } from "@vue/reactivity"
import type { MaybeRefOrGetter, Ref, WatchOptionsBase } from "@vue/runtime-core"
import { watchEffect } from "@vue/runtime-core"
import type { BaseSchema, FlatErrors, Output, SafeParseResult } from "valibot"
import { flatten, safeParse } from "valibot"

export function useParse<TSchema extends BaseSchema>(options: {
  /**
   * Input data to be validated (plain value, ref or getter).
   */
  input?: unknown
  /**
   * Valibot schema (plain value, ref or getter).
   */
  schema: MaybeRefOrGetter<TSchema>
}, watchOptions?: WatchOptionsBase) {
  const result = ref() as Ref<SafeParseResult<TSchema>> // Knowingly not empty.
  const output = ref<Output<TSchema>>()
  const errors = ref<FlatErrors<TSchema>>()
  watchEffect(() => {
    const res = safeParse(toValue(options.schema), toValue(options.input))
    result.value = res
    if (res.success) {
      output.value = res.output
      errors.value = undefined
    } else {
      output.value = undefined
      errors.value = flatten(res.issues)
    }
  }, watchOptions)
  return { result, output, errors }
}
