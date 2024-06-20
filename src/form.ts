import type { MaybeRefOrGetter, Ref } from "@vue/reactivity"
import { ref, toValue } from "@vue/reactivity"
import type { FlatErrors, Output } from "valibot"
import { flatten, safeParseAsync } from "valibot"

import type { BaseSchemaMaybeAsync } from "./types"

export interface UseFormReturn<TSchema extends BaseSchemaMaybeAsync, TArgs extends any[], TResult> {
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
  submit: (...args: TArgs) => Promise<TResult | undefined>
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
  errors: Ref<FlatErrors<TSchema> | undefined>
}

interface BaseOptions<TSchema extends BaseSchemaMaybeAsync> {
  /**
   * Error callback.
   *
   * Called (and awaited) if the validation fails, or if `errors.value` was set by the submit handler.
   */
  onErrors?: (errors: FlatErrors<TSchema>) => any
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
  errors?: Ref<FlatErrors<TSchema> | undefined>
}

type SubmitCallback<Args extends any[], Result> = (
  ...args: Args
) => Result | PromiseLike<Result>

//
// No input.
//

/**
 * Vue3 composable for handling form submit.
 */
export function useForm<Args extends unknown[], Result>(
  options: BaseOptions<any> & {
    input?: never
    schema?: never
    /**
     * Form submit callback.
     *
     * Only called if:
     * - Form is not being submitted at the moment (submitting.value is falsy).
     * - HTML5 validation passes (if enabled).
     *
     * The arguments are the submit function arguments.
     *
     * During execution, `submitting` is true.
     * After successfull execution, `submitted` is true.
     */
    submit?: SubmitCallback<Args, Result>
  },
): UseFormReturn<any, Args, Result>

//
// Input, no schema.
//

/**
 * Vue3 composable for handling form submit.
 *
 * Validates the input using valibot.
 */
export function useForm<TInput, TArgs extends any[], TResult>(
  options: BaseOptions<any> & {
    /**
     * Input value, or ref, or a getter for the submit input data.
     */
    input: MaybeRefOrGetter<TInput>
    schema?: never
    /**
     * Form submit callback.
     *
     * Only called if:
     * - Form is not being submitted at the moment (submitting.value is falsy).
     * - HTML5 validation passes (if enabled).
     *
     * The first argument is the form input, the rest arguments are the submit function arguments.
     *
     * During execution, `submitting` is true.
     * After successfull execution, `submitted` is true.
     */
    submit?: SubmitCallback<[TInput, ...TArgs], TResult>
  },
): UseFormReturn<any, TArgs, TResult>

//
// Input + schema.
//

/**
 * Vue3 composable for handling form submit.
 *
 * Validates the input using valibot.
 */
export function useForm<TSchema extends BaseSchemaMaybeAsync, TArgs extends any[], TResult>(
  options: BaseOptions<TSchema> & {
    /**
     * Input data to be validated (plain value, ref or getter).
     */
    input?: unknown
    /**
     * Valibot schema (plain value, ref or getter).
     */
    schema: MaybeRefOrGetter<TSchema>
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
    submit?: SubmitCallback<[Output<TSchema>, ...TArgs], TResult>
  },
): UseFormReturn<TSchema, TArgs, TResult>

//
// No input, callback only.
//

/**
 * Vue3 composable for handling form submit.
 */
export function useForm<TArgs extends any[], TResult>(
/**
 * Form submit callback.
 *
 * Only called if:
 * - Form is not being submitted at the moment (submitting.value is falsy).
 * - HTML5 validation passes (if enabled).
 *
 * The arguments are the submit function arguments.
 *
 * During execution, `submitting` is true.
 * After successfull execution, `submitted` is true.
 */
  submit?: SubmitCallback<TArgs, TResult>,
): UseFormReturn<any, TArgs, TResult>

//
// Implementation.
//

export function useForm(
  optionsOrSubmit?:
    | (BaseOptions<any> & {
      input?: unknown
      schema?: MaybeRefOrGetter<BaseSchemaMaybeAsync>
      submit?: SubmitCallback<any, any>
    })
    | SubmitCallback<any, any>,
): UseFormReturn<any, any, any> {
  const options
    = (typeof optionsOrSubmit === "function" ? undefined : optionsOrSubmit) ?? {}
  const submitCallback
    = typeof optionsOrSubmit === "function" ? optionsOrSubmit : options?.submit
  const hasInput = options.input !== undefined

  const form = options.form ?? ref<HTMLFormElement>()
  const errors = options.errors ?? ref<FlatErrors>()
  const submitting = options.submitting ?? ref(false)
  const submitted = options.submitted ?? ref(false)

  async function submit(...args: unknown[]) {
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
      const input = toValue(options.input)
      const schema = toValue(options.schema)
      const parseResult = schema ? await safeParseAsync(schema, input) : undefined
      if (parseResult && !parseResult.success) {
        errors.value = flatten(parseResult.issues)
        await options.onErrors?.(errors.value)
      } else {
        const returnValue = await Promise.resolve()
          .then(() =>
            hasInput || parseResult
              ? submitCallback?.(parseResult ? parseResult.output : input, ...args)
              : submitCallback?.(...args),
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
