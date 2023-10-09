import { reactive, ref } from "@vue/reactivity"
import * as v from "valibot"
import { expect, test } from "vitest"
import { useForm } from "vue-valibot-form"

test("reactive", async () => {
	const fields = reactive({ foo: "" })
	const { submit, errors } = useForm({
		fields,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })
	fields.foo = " test"
	expect(await submit()).toStrictEqual({ input: { foo: "test" } })
	expect(errors.value).toBeUndefined()
})

test("ref", async () => {
	const fields = ref({ foo: "" })
	const { submit, errors } = useForm({
		fields,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })
	fields.value.foo = " test1"
	expect(await submit()).toStrictEqual({ input: { foo: "test1" } })
	expect(errors.value).toBeUndefined()
	fields.value = { foo: "test2 " }
	expect(await submit()).toStrictEqual({ input: { foo: "test2" } })
	expect(errors.value).toBeUndefined()
})

test("no schema", async () => {
	const fields = reactive({ foo: "" })
	const { submit, errors } = useForm({
		fields,
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toStrictEqual({ input: { foo: "" } })
	expect(errors.value).toBeUndefined()
})

test("no submit", async () => {
	const fields = reactive({ foo: "" })
	const { submit, errors } = useForm({
		fields,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })
	fields.foo = " test"
	expect(await submit()).toBeUndefined()
	expect(errors.value).toBeUndefined()
})

test("empty options", async () => {
	const { submit } = useForm({})
	expect(await submit()).toBeUndefined()
})

test("no options", async () => {
	const { submit } = useForm()
	expect(await submit()).toBeUndefined()
})

// TODO: test submitting ref
