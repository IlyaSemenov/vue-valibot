import { reactive, ref } from "@vue/reactivity"
import * as v from "valibot"
import { describe, expect, test } from "vitest"
import { SubmitError, useForm } from "vue-valibot-form"

describe("input", () => {
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
		expect(errors.value).toStrictEqual({
			nested: { foo: ["Please enter foo."] },
		})

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
		expect(errors.value).toStrictEqual({
			nested: { foo: ["Please enter foo."] },
		})

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
		expect(errors.value).toStrictEqual({
			nested: { foo: ["Please enter foo."] },
		})

		input.value.foo = " test1"
		expect(await submit()).toStrictEqual({ input: { foo: "test1" } })
		expect(errors.value).toBeUndefined()

		input.value = { foo: "test2 " }
		expect(await submit()).toStrictEqual({ input: { foo: "test2" } })
		expect(errors.value).toBeUndefined()
	})
})

test("dynamic schema", async () => {
	let minValue: number
	const input = ref(1)
	const { submit, errors } = useForm({
		input,
		schema: () => v.number([v.minValue(minValue, `Min value: ${minValue}.`)]),
	})
	minValue = 2
	await submit()
	expect(errors.value).toMatchObject({ root: ["Min value: 2."] })
	minValue = 3
	await submit()
	expect(errors.value).toMatchObject({ root: ["Min value: 3."] })
	minValue = 1
	await submit()
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

describe("submitted", () => {
	test("schema errors", async () => {
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

		input.foo = ""
		await submit()
		expect(submitted.value).toBe(false)
	})

	test("manual errors", async () => {
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

	test("exception", async () => {
		const input = ref("")
		const { submit, submitted, errors } = useForm({
			input,
			schema: v.string(),
			submit(input) {
				if (!input) {
					throw new Error("Fail")
				}
			},
		})
		await expect(submit()).rejects.toThrow("Fail")
		expect(errors.value).toBeUndefined()
		expect(submitted.value).toBe(false)

		input.value = "test"
		await submit()
		expect(errors.value).toBeUndefined()
		expect(submitted.value).toBe(true)
	})
})

describe("onErrors", () => {
	test("schema errors", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit } = useForm({
			input,
			schema: v.string([v.minLength(1, "Input required.")]),
			onErrors(errors) {
				callbackErrors.value = errors
			},
		})
		await submit()
		expect(callbackErrors.value).toMatchObject({ root: ["Input required."] })
	})

	test("manual errors", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit, errors } = useForm({
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
	})

	test("generic exception", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit } = useForm({
			input,
			schema: v.string(),
			submit(input) {
				if (!input) {
					throw new Error("Fail")
				}
			},
			onErrors(errors) {
				callbackErrors.value = errors
			},
		})
		await expect(submit()).rejects.toThrow("Fail")
		expect(callbackErrors.value).toBeUndefined()
	})

	test("SubmitError", async () => {
		const input = ref("")
		const callbackErrors = ref<v.FlatErrors>()
		const { submit } = useForm({
			input,
			schema: v.string(),
			submit(input) {
				if (!input) {
					throw new SubmitError({ root: ["Input required."], nested: {} })
				}
			},
			onErrors(errors) {
				callbackErrors.value = errors
			},
		})
		expect(await submit()).toBeUndefined()
		expect(callbackErrors.value).toMatchObject({ root: ["Input required."] })
	})
})

test("user-provided refs", async () => {
	const form = ref()
	const submitting = ref(false)
	const submitted = ref(false)
	const errors = ref<v.FlatErrors>()
	const input = ref("")
	const {
		form: form1,
		submit,
		submitting: submitting1,
		submitted: submitted1,
		errors: errors1,
	} = useForm({
		input,
		schema: v.string(),
		submit() {
			//
		},
		form,
		submitting,
		submitted,
		errors,
	})
	expect(form1).toBe(form)
	expect(submitting1).toBe(submitting)
	expect(submitted1).toBe(submitted)
	expect(errors1).toBe(errors)
	await submit()
	expect(submitted.value).toBe(true)
})
