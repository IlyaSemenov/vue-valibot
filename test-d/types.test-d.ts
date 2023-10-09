import { ref } from "@vue/reactivity"
import { expectType } from "tsd"
import * as v from "valibot"
import { useForm } from "vue-valibot-form"

// Test that submit input is validated
useForm({
	fields: { foo: "" as string | undefined },
	schema: v.object({
		foo: v.string(),
	}),
	async submit(input) {
		expectType<{ foo: string }>(input)
	},
})

// Test that submit input is validated (with ref as fields)
useForm({
	fields: ref({ foo: "" as string | undefined }),
	schema: v.object({
		foo: v.string(),
	}),
	async submit(input) {
		expectType<{ foo: string }>(input)
	},
})

// Test that submit input type is the fields type
useForm({
	fields: { foo: "" as string | undefined },
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that submit input type is the fields unref type
useForm({
	fields: ref({ foo: "" as string | undefined }),
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that schema can be undefined and the submit input type is still valid
useForm({
	fields: { foo: "" as string | undefined },
	schema: undefined,
	async submit(input) {
		expectType<{ foo: string | undefined }>(input)
	},
})

// Test that there can be no fields and no schema
useForm({
	async submit(input) {
		expectType<unknown>(input)
	},
})

// Test that there can be no submit handler
useForm({
	fields: ref({ foo: "" as string | undefined }),
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
