import { reactive } from "@vue/reactivity"
import * as v from "valibot"
import { expect, test } from "vitest"
import { useParse } from "vue-valibot"

test("parse", async () => {
  const input = reactive({
    age: "" as number | "", // for v-input
  })

  const { output, errors } = useParse({
    input,
    schema: v.object({
      age: v.number(),
    }),
  }, {
    flush: "sync",
  })

  expect(output.value).toBeUndefined()
  expect(errors.value).toMatchObject({
    nested: {
      age: ["Invalid type"],
    },
  })

  input.age = 0

  expect(output.value).toEqual({ age: 0 })
  expect(errors.value).toBeUndefined()
})
