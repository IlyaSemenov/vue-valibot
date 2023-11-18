import { expectType } from "tsd"
import * as v from "valibot"
import { useForm } from "vue-valibot-form"

// Test that additional args are consumed
const { submit: submitWithNumberAndBoolean } = useForm({
	schema: v.string(),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async submit(input, arg1: number, arg2: boolean) {
		expectType<string>(input)
	},
})
// @ts-expect-error arg1 is required
submitWithNumberAndPossiblyBoolean()
// @ts-expect-error arg2 is required
submitWithNumberAndPossiblyBoolean(123)
submitWithNumberAndBoolean(123, true)

// Test that additional optional args can be consumed
const { submit: submitWithNumberAndPossiblyBoolean } = useForm({
	schema: v.string(),
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async submit(input, arg1: number, arg2?: boolean) {
		expectType<string>(input)
	},
})
// @ts-expect-error arg1 is required
submitWithNumberAndPossiblyBoolean()
submitWithNumberAndPossiblyBoolean(123)
submitWithNumberAndPossiblyBoolean(123, true)
