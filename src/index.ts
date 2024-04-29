import { MaybeRefOrGetter, Ref, ref, toValue } from "@vue/reactivity"
import {
	BaseSchema,
	BaseSchemaAsync,
	FlatErrors,
	flatten,
	safeParseAsync,
} from "valibot"

type BaseSchemaMaybeAsync<TInput, TOutput> =
	| BaseSchema<TInput, TOutput>
	| BaseSchemaAsync<TInput, TOutput>

type MaybeGetter<T> = T | (() => T)

export interface FormComposable<Args extends any[], Result> {
	/**
	 * The form element ref.
	 *
	 * Using it with `<form ref="form">` will enable HTML5 validation on submit.
	 */
	form: Ref<HTMLFormElement | undefined>
	/**
	 * The actual form submit function that you should call with something like:
	 *
	 * - `<form @submit.prevent="submit">`
	 * - `<button @click="submit">`
	 *
	 * It will:
	 *
	 * - Run HTML5 validation (if the form ref is set).
	 * - Run valibot validation (if the schema is provided).
	 * - Call submit callback (if provided).
	 *
	 * Arguments passed to this submit function will be passed to the submit callback,
	 * prepended with (possibly validated) form input (unless using the shortcut variant of useForm).
	 *
	 * During execution, `submitting` is true.
	 * After successfull execution, `submitted` is true.
	 */
	submit: (...args: Args) => Promise<Result | undefined>
	/**
	 * Is the form submit callback executing at the moment?
	 *
	 * Use this to disable submit button.
	 *
	 * Also, `useForm` will not perform submit if it sees this is `true`.
	 */
	submitting: Ref<boolean>
	/**
	 * Has the form been successfully submitted?
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
	/**
	 * Error callback.
	 *
	 * Called (and awaited) if the validation fails, or if `errors.value` was set by the submit handler.
	 */
	onErrors?: (errors: FlatErrors) => any
	/**
	 * User-provided ref for `form` return value.
	 */
	form?: Ref<HTMLFormElement | undefined>
	/**
	 * User-provided ref for `submitting` return value.
	 */
	submitting?: Ref<boolean>
	/**
	 * User-provided ref for `submitted` return value.
	 */
	submitted?: Ref<boolean>
	/**
	 * User-provided ref for `errors` return value.
	 */
	errors?: Ref<FlatErrors | undefined>
}

type SubmitCallback<Args extends any[], Result> = (
	...args: Args
) => Result | PromiseLike<Result>

/**
 * Vue3 composable for handling form submit.
 */
export function useForm<Input, Args extends any[], Result>(
	options: BaseOptions & {
		/**
		 * Input value, or ref, or a getter. Will be passed to `submit` as is.
		 */
		input?: MaybeRefOrGetter<Input>
		/**
		 * Input value, or ref, or a getter. Will be passed to `submit` as is.
		 *
		 * @deprecated Use `input` instead.
		 */
		fields?: MaybeRefOrGetter<Input>
		schema?: never
		/**
		 * Form submit callback.
		 *
		 * Only called if:
		 * - Form is not being submitted at the moment (submitting.value is falsy).
		 * - HTML5 validation passes (if enabled).
		 *
		 * The first argument is the input, the rest arguments are the submit function arguments.
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
		/**
		 * Input value, or ref, or a getter for the data to be validated.
		 */
		input?: unknown
		/**
		 * Input value, or ref, or a getter for the data to be validated.
		 *
		 * @deprecated Use `input` instead.
		 */
		fields?: unknown
		/**
		 * Valibot schema.
		 */
		schema?: MaybeGetter<BaseSchemaMaybeAsync<unknown, Input>>
		/**
		 * Form submit callback.
		 *
		 * Only called if:
		 * - Form is not being submitted at the moment (submitting.value is falsy).
		 * - HTML5 validation passes (if enabled).
		 * - Valibot validation passes.
		 *
		 * The first argument is the validated input, the rest arguments are the submit function arguments.
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
	 *
	 * Only called if:
	 * - Form is not being submitted at the moment (submitting.value is falsy).
	 * - HTML5 validation passes (if enabled).
	 * - Valibot validation passes.
	 *
	 * The arguments are the submit function arguments.
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
				schema?: MaybeGetter<BaseSchemaMaybeAsync<unknown, Input>>
				submit?: SubmitCallback<[unknown, ...Args], Result>
		  })
		| SubmitCallback<Args, Result>,
): FormComposable<Args, Result> {
	const options =
		(typeof optionsOrSubmit === "function" ? undefined : optionsOrSubmit) ?? {}
	const directSubmit =
		typeof optionsOrSubmit === "function" ? optionsOrSubmit : undefined
	const { schema } = options
	const form = options.form ?? ref<HTMLFormElement>()
	// TODO: type using FlatErrors<S> from the schema
	// Please test carefully, as blindly using a schema generic was breaking type inference for submit(data: ValidInput)
	const errors = options.errors ?? ref<FlatErrors>()
	const submitting = options.submitting ?? ref(false)
	const submitted = options.submitted ?? ref(false)

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
			const res = schema
				? await safeParseAsync(
						typeof schema === "function" ? schema() : schema,
						input,
				  )
				: undefined
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
