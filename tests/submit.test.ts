import { reactive, ref } from "@vue/reactivity"
import * as v from "valibot"
import { describe, expect, test } from "vitest"
import { useForm } from "vue-valibot-form"

test("plain", async () => {
	const input = { foo: "" }
	const { submit, errors } = useForm({
		input,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })

	input.foo = " test"
	expect(await submit()).toStrictEqual({ input: { foo: "test" } })
	expect(errors.value).toBeUndefined()
})

test("reactive", async () => {
	const input = reactive({ foo: "" })
	const { submit, errors } = useForm({
		input,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })

	input.foo = " test"
	expect(await submit()).toStrictEqual({ input: { foo: "test" } })
	expect(errors.value).toBeUndefined()
})

test("ref", async () => {
	const input = ref({ foo: "" })
	const { submit, errors } = useForm({
		input,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })

	input.value.foo = " test1"
	expect(await submit()).toStrictEqual({ input: { foo: "test1" } })
	expect(errors.value).toBeUndefined()

	input.value = { foo: "test2 " }
	expect(await submit()).toStrictEqual({ input: { foo: "test2" } })
	expect(errors.value).toBeUndefined()
})

test("no schema", async () => {
	const input = reactive({ foo: "" })
	const { submit, errors } = useForm({
		input,
		async submit(input) {
			return { input }
		},
	})
	expect(await submit()).toStrictEqual({ input: { foo: "" } })
	expect(errors.value).toBeUndefined()
})

test("no submit", async () => {
	const input = reactive({ foo: "" })
	const { submit, errors } = useForm({
		input,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
		}),
	})
	expect(await submit()).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Please enter foo."] } })

	input.foo = " test"
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

test("submit shortcut", async () => {
	const { submit } = useForm(() => 123)
	expect(await submit()).toBe(123)
})

test("submitted", async () => {
	const input = { foo: "" }
	const { submit, submitted } = useForm({
		input,
		schema: v.object({
			foo: v.string([v.minLength(1)]),
		}),
	})
	await submit()
	expect(submitted.value).toBe(false)

	input.foo = "test"
	await submit()
	expect(submitted.value).toBe(true)
})

test("manually set errors", async () => {
	const input = ref("")
	const { submit, submitted, errors } = useForm({
		input,
		schema: v.string(),
		submit(input) {
			if (!input) {
				errors.value = { root: ["Input required."], nested: {} }
			}
		},
	})
	await submit()
	expect(errors.value).toMatchObject({ root: ["Input required."] })
	expect(submitted.value).toBe(false)

	input.value = "test"
	await submit()
	expect(errors.value).toBeUndefined()
	expect(submitted.value).toBe(true)

	input.value = ""
	await submit()
	expect(errors.value).toMatchObject({ root: ["Input required."] })
	expect(submitted.value).toBe(false)
})

describe("onErrors", () => {
	test("validation", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit, submitted } = useForm({
			input,
			schema: v.string([v.minLength(1, "Input required.")]),
			onErrors(errors) {
				callbackErrors.value = errors
			},
		})
		await submit()
		expect(callbackErrors.value).toMatchObject({ root: ["Input required."] })
		expect(submitted.value).toBe(false)
	})

	test("manual set", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit, submitted, errors } = useForm({
			input,
			schema: v.string(),
			submit(input) {
				if (!input) {
					errors.value = { root: ["Input required."], nested: {} }
				}
			},
			onErrors(errors) {
				callbackErrors.value = errors
			},
		})
		await submit()
		expect(callbackErrors.value).toMatchObject({ root: ["Input required."] })
		expect(submitted.value).toBe(false)
	})
})
