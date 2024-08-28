import { expectType } from "tsd"
import * as v from "valibot"
import { test } from "vitest"
import type { GenericFlatErrors } from "vue-valibot"
import { useForm } from "vue-valibot"

test("untyped errors without input", () => {
  const { errors } = useForm()
  expectType<GenericFlatErrors | undefined>(errors.value)
})

test("untyped errors with input", () => {
  const { errors } = useForm({
    input: { foo: "Foo" },
    submit() {
      expectType<GenericFlatErrors | undefined>(errors.value)
      errors.value = { nested: { bar: ["error"] } }
    },
    onErrors(errors) {
      expectType<GenericFlatErrors>(errors)
    },
  })
})

test("untyped errors with input", () => {
  const schema = v.object({ foo: v.string() })
  const { errors } = useForm({
    schema,
    onErrors(errors) {
      expectType<v.FlatErrors<typeof schema>>(errors)
      expectType<[string, ...string[]] | undefined>(errors.nested?.foo)
      // @ts-expect-error Propery bar does not exist
      expectType<[string, ...string[]] | undefined>(errors.nested?.bar)
    },
  })
  expectType<v.FlatErrors<typeof schema> | undefined>(errors.value)
})
