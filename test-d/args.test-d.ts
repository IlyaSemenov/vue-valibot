import { expectType } from "tsd"
import * as v from "valibot"
import { test } from "vitest"
import { useForm } from "vue-valibot"

test("callback args", () => {
  const { submit } = useForm({
    schema: v.string(),
    async submit(input, _arg1: number, _arg2: boolean) {
      expectType<string>(input)
    },
  })
  // @ts-expect-error arg1 is required
  submit()
  // @ts-expect-error arg2 is required
  submit(123)
  submit(123, true)
})

test("optional callback arg", () => {
  const { submit } = useForm({
    schema: v.string(),
    async submit(input, _arg1: number, _arg2?: boolean) {
      expectType<string>(input)
    },
  })
  // @ts-expect-error arg1 is required
  submit()
  submit(123)
  submit(123, true)
})
