import { MaybeRefOrGetter, Ref, ref, toValue } from "@vue/reactivity"
import {
	BaseSchema,
	BaseSchemaAsync,
	FlatErrors,
	flatten,
	safeParseAsync,
} from "valibot"

export interface FormComposable<Args extends any[], Result> {
	/**
	 * The form element reference.
	 *
	 * Providing it to <form ref="form"> will call HTML5 validation on submit.
	 */
	form: Ref<HTMLFormElement | undefined>
	/**
	 * Submit form:
	 *
	 * - run HTML5 validation (if the reference it set)
	 * - run valibot validation (if the schema is provided)
	 * - call submit callback (if provided)
	 *
	 * Arguments passed to this submit function will be passed to the submit callback,
	 * prepended with (possibly validated) form input (unless using the shortcut variant of useForm).
	 *
	 * During execution, `submitting` is true.
	 *
	 * After successfull execution, `submitted` is true.
	 */
	submit: (...args: Args) => Promise<Result | undefined>
	/**
	 * Is the form submit callback executing at the moment?
	 *
	 * Use this to disable submit button.
	 */
	submitting: Ref<boolean>
	/**
	 * Has the form been successfully submitted?
	 *
	 * Use this to disable submit button during success redirects or similar post-submit events.
	 *
	 * Feel free to reset. `useForm` doesn't depend on this value.
	 */
	submitted: Ref<boolean>
	/**
	 * Validation errors, as returned by valibot.
	 *
	 * Set it in the submit callback to report submit errors.
	 */
	errors: Ref<FlatErrors | undefined>
}

interface BaseOptions {
	onErrors?: (errors: FlatErrors) => any
}

type SubmitCallback<Args extends any[], Result> = (
	...args: Args
) => Result | PromiseLike<Result>

/**
 * Vue3 composable for handling form submit.
 */
export function useForm<Input, Args extends any[], Result>(
	options: BaseOptions & {
		input?: MaybeRefOrGetter<Input>
		fields?: MaybeRefOrGetter<Input>
		schema?: never
		/**
		 * Form submit callback.
		 * The first argument is `fields`, the rest arguments (if any) are the submit function arguments.
		 *
		 * During execution, `submitting` is true.
		 * After successfull execution, `submitted` is true.
		 */
		submit?: SubmitCallback<[Input, ...Args], Result>
	},
): FormComposable<Args, Result>

/**
 * Vue3 composable for handling form submit.
 *
 * Validates the input using valibot.
 */
export function useForm<Input, Args extends any[], Result>(
	options: BaseOptions & {
		input?: unknown
		fields?: unknown
		schema?: BaseSchema<unknown, Input> | BaseSchemaAsync<unknown, Input>
		/**
		 * Form submit callback.
		 * The first argument is the validated input, the rest arguments (if any) are the submit function arguments.
		 *
		 * Called only if the validation succeeds.
		 *
		 * During execution, `submitting` is true.
		 * After successfull execution, `submitted` is true.
		 */
		submit?: SubmitCallback<[Input, ...Args], Result>
	},
): FormComposable<Args, Result>

/**
 * Vue3 composable for handling form submit.
 */
export function useForm<Args extends any[], Result>(
	/**
	 * Form submit callback.
	 * The arguments (if any) are the submit function arguments.
	 *
	 * During execution, `submitting` is true.
	 * After successfull execution, `submitted` is true.
	 */
	submit?: SubmitCallback<Args, Result>,
): FormComposable<Args, Result>

export function useForm<Input, Args extends any[], Result>(
	optionsOrSubmit?:
		| (BaseOptions & {
				input?: unknown
				fields?: unknown
				schema?: BaseSchema<unknown, Input> | BaseSchemaAsync<unknown, Input>
				submit?: SubmitCallback<[unknown, ...Args], Result>
		  })
		| SubmitCallback<Args, Result>,
): FormComposable<Args, Result> {
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
	const submitted = ref(false)

	async function submit(...args: Args) {
		if (submitting.value) {
			return
		}
		submitted.value = false
		errors.value = undefined
		if (form.value && !form.value.checkValidity()) {
			form.value.reportValidity()
			return
		}
		submitting.value = true
		try {
			const input = toValue(options.input ?? options.fields)
			const res = schema ? await safeParseAsync(schema, input) : undefined
			if (res && !res.success) {
				errors.value = flatten(res.issues)
				await options.onErrors?.(errors.value)
			} else {
				const returnValue = await Promise.resolve()
					.then(() =>
						directSubmit
							? directSubmit(...args)
							: options.submit?.(res ? res.output : input, ...args),
					)
					.catch((err) => {
						if (err instanceof SubmitError) {
							errors.value = err.errors
							return undefined
						}
						throw err
					})
				if (errors.value) {
					await options.onErrors?.(errors.value)
				} else {
					submitted.value = true
				}
				return returnValue
			}
		} finally {
			submitting.value = false
		}
	}

	return { form, submit, submitting, submitted, errors }
}

export class SubmitError extends Error {
	constructor(public errors: FlatErrors) {
		super("Error submitting form.")
	}
}
