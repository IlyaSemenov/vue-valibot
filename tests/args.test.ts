import * as v from "valibot"
import { expect, test } from "vitest"
import { useForm } from "vue-valibot-form"

test("args", async () => {
	const fields = { foo: "" }
	const { submit, errors } = useForm({
		fields,
		schema: v.object({
			foo: v.string([v.toTrimmed(), v.minLength(1, "Please enter foo.")]),
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

	fields.foo = " test"
	expect(await submit()).toStrictEqual({ input: { foo: "test" } })
	expect(errors.value).toBeUndefined()

	expect(await submit(false)).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["test not allowed."] } })

	expect(await submit(false, "Boom")).toBeUndefined()
	expect(errors.value).toStrictEqual({ nested: { foo: ["Boom"] } })
})

test("args shortcut", async () => {
	const { submit } = useForm(
		(value: number, multiplier = 2) => value * multiplier,
	)
	expect(await submit(5)).toBe(10)
	expect(await submit(5, 3)).toBe(15)
})
