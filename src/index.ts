import { isRef, Ref, ref } from "@vue/reactivity"
import {
	BaseSchema,
	BaseSchemaAsync,
	FlatErrors,
	flatten,
	safeParseAsync,
} from "valibot"

export interface FormComposable<Args extends any[], Result> {
	form: Ref<HTMLFormElement>
	submit: (...args: Args) => Promise<Result | undefined>
	submitting: Ref<boolean>
	errors: Ref<FlatErrors>
}

export function useForm<Input, Args extends any[], Result>(options: {
	fields?: Input | Ref<Input | undefined>
	schema?: never
	submit?: (data: Input, ...args: Args) => Result | PromiseLike<Result>
}): FormComposable<Args, Result>

export function useForm<
	Input,
	ValidInput,
	Args extends any[],
	Result,
>(options: {
	fields?: Input | Ref<Input | undefined>
	schema?: BaseSchema<Input, ValidInput> | BaseSchemaAsync<Input, ValidInput>
	submit?: (data: ValidInput, ...args: Args) => Result | PromiseLike<Result>
}): FormComposable<Args, Result>

export function useForm<Args extends any[], Result>(
	submit?: (...args: Args) => Result | PromiseLike<Result>,
): FormComposable<Args, Result>

/**
 * @example
 *
 * const fields = reactive({
 *   foo: "",
 * })
 *
 * const { form, submit, submitting, errors } = useForm({
 *   fields,
 *   schema: v.object({
 *     foo: v.string([v.toTrimmed(), v.nonEmpty()]),
 *   }),
 *   async submit(input) {
 *     await api.post(input)
 *   }
 * })
 *
 * <form ref="form" \@submit.prevent="submit">
 *   <input v-model="fields.foo" />
 *   <button type="submit" :disabled="submitting">Submit</button>
 * </form>
 */
export function useForm<Input, ValidInput, Args extends any[], Result>(
	optionsOrSubmit?:
		| {
				fields?: Input | Ref<Input | undefined>
				schema?:
					| BaseSchema<Input, ValidInput>
					| BaseSchemaAsync<Input, ValidInput>
				submit?: (
					data: ValidInput,
					...args: Args
				) => Result | PromiseLike<Result>
		  }
		| ((...args: Args) => Result | PromiseLike<Result>),
) {
	const options =
		(typeof optionsOrSubmit === "function" ? undefined : optionsOrSubmit) ?? {}
	const directSubmit =
		typeof optionsOrSubmit === "function" ? optionsOrSubmit : undefined
	const { schema } = options
	const form = ref<HTMLFormElement>()
	// TODO: type using FlatErrors<S> from the schema
	// Please test carefully, as blindly using a schema generic was breaking type inference for submit(data: ValidInput)
	const errors = ref<FlatErrors>()
	const submitting = ref(false)

	async function submit(...args: Args) {
		if (submitting.value) {
			return
		}
		errors.value = undefined
		if (form.value && !form.value.checkValidity()) {
			form.value.reportValidity()
			return
		}
		submitting.value = true
		try {
			const input = isRef(options.fields)
				? options.fields.value
				: options.fields
			const res = schema ? await safeParseAsync(schema, input) : undefined
			if (res && !res.success) {
				errors.value = flatten(res.issues)
				return
			}
			return await (directSubmit
				? directSubmit(...args)
				: options.submit?.(
						res ? res.output : (input as unknown as ValidInput),
						...args,
				  ))
		} finally {
			submitting.value = false
		}
	}

	return { form, submit, submitting, errors }
}
