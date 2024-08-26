import { ref } from "@vue/reactivity"
import * as v from "valibot"
import { expect, test } from "vitest"
import { useForm } from "vue-valibot"

test("without input", async () => {
  const { submit } = useForm({
    async submit(arg1, arg2?: string) {
      return { arg1, arg2 }
    },
  })

  expect(await submit("foo")).toEqual({ arg1: "foo" })
  expect(await submit("foo", "bar")).toEqual({ arg1: "foo", arg2: "bar" })
})

test("input without schema", async () => {
  const { submit } = useForm({
    input: 123,
    async submit(input, arg1 = "foo", arg2?: string) {
      return { input, arg1, arg2 }
    },
  })

  expect(await submit()).toEqual({ input: 123, arg1: "foo" })
  expect(await submit("bar", "baz")).toEqual({ input: 123, arg1: "bar", arg2: "baz" })
})

test("input with schema", async () => {
  const input = { foo: "" }
  const { submit, errors } = useForm({
    input,
    schema: v.object({
      foo: v.pipe(v.string(), v.trim(), v.minLength(1, "Please enter foo.")),
    }),
    async submit(input, allowTest = true, error = "test not allowed.") {
      if (!allowTest && input.foo === "test") {
        errors.value = {
          nested: { foo: [error] },
        }
        return
      }
      return { input }
    },
  })

  expect(await submit()).toBeUndefined()
  expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })

  input.foo = " test"
  expect(await submit()).toStrictEqual({ input: { foo: "test" } })
  expect(errors.value).toBeUndefined()

  expect(await submit(false)).toBeUndefined()
  expect(errors.value).toStrictEqual({ nested: { foo: ["test not allowed."] } })

  expect(await submit(false, "Boom")).toBeUndefined()
  expect(errors.value).toStrictEqual({ nested: { foo: ["Boom"] } })
})

test("callback only", async () => {
  const { submit } = useForm(
    (value: number, multiplier = 2) => value * multiplier,
  )
  expect(await submit(5)).toBe(10)
  expect(await submit(5, 3)).toBe(15)
})

test("empty input", async () => {
  const { submit } = useForm({
    input: ref(undefined),
    async submit(input, arg: string) {
      return { input, arg }
    },
  })

  expect(await submit("foo")).toEqual({ input: undefined, arg: "foo" })
})

test("undefined input", async () => {
  const { submit } = useForm({
    input: undefined,
    async submit(input, arg: string) {
      return { input, arg }
    },
  })

  expect(await submit("foo", "bar")).toEqual({ input: "foo", arg: "bar" })
})

test("undefined input with schema", async () => {
  const { submit } = useForm({
    input: undefined,
    schema: v.pipe(v.any(), v.transform(() => 123)),
    async submit(input, arg: string) {
      return { input, arg }
    },
  })

  expect(await submit("foo")).toEqual({ input: 123, arg: "foo" })
})
