import { ref } from "@vue/reactivity"
import { expectType } from "tsd"
import * as v from "valibot"
import { test } from "vitest"
import { useForm } from "vue-valibot"

test("plain input with schema", () => {
  useForm({
    input: { foo: "" as string | undefined },
    schema: v.object({
      foo: v.string(),
    }),
    async submit(input) {
      expectType<{ foo: string }>(input)
    },
  })
})

test("ref input with schema", () => {
  useForm({
    input: ref({ foo: "" as string | undefined }),
    schema: v.object({
      foo: v.string(),
    }),
    async submit(input) {
      expectType<{ foo: string }>(input)
    },
  })
})

test("ref input without schema", () => {
  useForm({
    input: ref({ foo: "" as string | undefined }),
    async submit(input) {
      expectType<{ foo: string | undefined }>(input)
    },
  })
})

test("input with undefined schema", () => {
  useForm({
    input: { foo: "" as string | undefined },
    schema: undefined,
    async submit(input) {
      expectType<{ foo: string | undefined }>(input)
    },
  })
})

test("no submit handler", () => {
  useForm({
    input: ref({ foo: "" as string | undefined }),
    schema: v.object({
      foo: v.string(),
    }),
  })
})

test("schema accepting partial lax-typed input", () => {
  useForm({
    input: { foo: 0 as "" | number, bar: 0 as "" | number },
    schema: v.object({
      foo: v.number(),
    }),
  })
})

test("dynamic schema", () => {
  useForm({
    schema: () =>
      v.object({
        foo: v.string(),
      }),
    submit(input) {
      expectType<{ foo: string }>(input)
    },
  })
})

test("input without schema", () => {
  const { submit } = useForm({
    input: 123,
    async submit(input, commit: boolean) {
      expectType<number>(input)
      return commit ? `${input}` : false
    },
  })
  expectType<(commit: boolean) => Promise<string | false | undefined>>(submit)
})

test("callback only", () => {
  const { submit } = useForm({
    async submit(input: number) {
      return `${input}`
    },
  })
  expectType<(input: number) => Promise<string | undefined>>(submit)
})

test("callback shortcut", () => {
  const { submit } = useForm(() => 123)
  expectType<() => Promise<number | undefined>>(submit)
})
