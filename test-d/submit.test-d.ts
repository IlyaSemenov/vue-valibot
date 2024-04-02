import { ref } from "@vue/reactivity"
import { expectType } from "tsd"
import * as v from "valibot"
import { useForm } from "vue-valibot-form"

// Test that input is validated
useForm({
	input: { foo: "" as string | undefined },
	schema: v.object({
		foo: v.string(),
	}),
	async submit(input) {
		expectType<{ foo: string }>(input)
	},
})

// Test that input ref is validated
useForm({
	input: ref({ foo: "" as string | undefined }),
	schema: v.object({
		foo: v.string(),
	}),
	async submit(input) {
		expectType<{ foo: string }>(input)
	},
})

// Test that input type is the input type
useForm({
	input: { foo: "" as string | undefined },
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that input type is unref in submit handler
useForm({
	input: ref({ foo: "" as string | undefined }),
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that schema can be undefined and the input type is still valid
useForm({
	input: { foo: "" as string | undefined },
	schema: undefined,
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that there can be only submit handler
useForm({
	async submit(input) {
		expectType<unknown>(input)
	},
})

// Test shortcut syntax of having only submit handler
useForm(() => {
	// Do nothing
})

// Test that there can be no submit handler
useForm({
	input: ref({ foo: "" as string | undefined }),
	schema: v.object({
		foo: v.string(),
	}),
})

// Test that submit callback return value type is passed
const { submit: submitNumber } = useForm({
	async submit() {
		return 123
	},
})
expectType<() => Promise<number | undefined>>(submitNumber)

// Test that shortcut submit callback return value type is passed
const { submit: submitNumberShortcut } = useForm(() => 123)
expectType<() => Promise<number | undefined>>(submitNumberShortcut)

// Test that schema can be a partial lax-typed object
useForm({
	input: { foo: 0 as "" | number, bar: 0 as "" | number },
	schema: v.object({
		foo: v.number(),
	}),
})

// Test that there is no type error without submit handler
useForm({
	input: { foo: "" as string | undefined },
	schema: v.object({
		foo: v.string(),
	}),
})
