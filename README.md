# vue-valibot-form

Minimalistic Vue3 composable for handling form submit, with optional validation using [valibot](https://valibot.dev/).

Unlike FormKit, VeeValidate and others, keeps things simple and doesn't interfere with neither data storage nor the UI workflow.

Full Typescript support with type inference.

## Install

```sh
npm install vue-valibot-form
```

## Use

```vue
<script setup lang="ts">
import * as v from "valibot"
import { useForm } from "vue-valibot-form"

// Store input data as you prefer, such as with Vue reactive or ref.
const data = reactive({
  foo: "",
})

const { form, submit, submitting, errors } = useForm({
  input: data,
  schema: v.object({
    foo: v.string([v.toTrimmed(), v.minLength(1)]),
  }),
  async submit(input) {
    // Input is validated against the schema and typed accordingly.
    const res = await api.post(input)
    if (!res) {
      // errors is Ref<valibot.FlatErrors>
      errors.value = { root: ["Failed to submit."], nested: {} }
    }
  },
})
</script>

<template>
  <form ref="form" @submit.prevent="submit">
    <!-- No fancy syntax for input fields, just use what you prefer. -->
    <input v-model="data.foo" />

    <!-- Field errors. -->
    <div v-for="error in errors?.nested.foo">{{ error }}</div>

    <button type="submit" :disabled="submitting">Submit</button>

    <!-- Form errors. -->
    <div v-for="error in errors?.root">{{ error }}</div>
  </form>
</template>
```

## API

The package provides a single Vue3 composable:

```ts
const {
  // All return values are optional to use.
  form,
  submit,
  submitting,
  submitted,
  errors,
} = useForm({
  // All options are optional to provide.
  input,
  schema,
  submit,
  onErrors,
  // Optional defaults for the return values.
  form,
  submitting,
  submitted,
  errors,
})
```

## Composable options

### `input`

(Optional) Input value, or ref, or a getter, of the data to be validated and/or passed to `submit`.

### `schema`

(Optional) Valibot schema (or a function that returns a schema, such as when the schema depends on the context).

### `submit`

(Optional) Form submit callback.

Only called if:

- Form is not being submitted at the moment (`submitting.value` is falsy).
- HTML5 validation passes (if enabled).
- Valibot validation passes (if used).

The first argument is the (possibly validated) input, the rest arguments are the submit function arguments.

During execution, `submitting` is true.
After successfull execution, `submitted` is true.

### `onErrors`

(Optional) Error callback.

Called (and awaited) if the validation fails, or if `errors.value` was set by the submit handler.

### `form`, `submitting`, `submitted`, `errors`

Normally, `useForm` will create and return these refs (see below), but you may optionally provide your own.

For example, this could be used to share the single `submitting` flag between multiple forms:

```ts
const submitting = ref(false)

const { submit: submit1 } = useForm({
  submitting,
  async submit() { ... }
})

const { submit: submit2 } = useForm({
  submitting,
  async submit() { ... }
})

// `submitting` will be true during submit of either form.
```

## Shortcut variant

All the composable options are optional. If the only option you need is `submit`, there is a shortcut variant:

```ts
const { submit, submitting } = useForm(async () => {
  // submitting is true during this callback.
  await api.post()
})
```

## Composable return values

### `form`

The form element ref.

Using it with `<form ref="form">` will enable HTML5 validation on submit.

### `submit`

The actual form submit function that you should call with something like:

- `<form @submit.prevent="submit">`
- `<button @click="submit">`

It will:

- Run HTML5 validation (if the form ref is set).
- Run valibot validation (if the schema is provided).
- Call submit callback (if provided).

Arguments passed to this submit function will be passed to the submit callback, prepended with (possibly validated) form input (unless using the shortcut variant of useForm).

During execution, `submitting` is true. After successfull execution, `submitted` is true.

### `submitting`

Is the form submit callback executing at the moment?

Use this to disable submit button.

Also, `useForm` will not perform submit if it sees this is `true`.

Type: `Ref<boolean>`.

### `submitted`

Has the form been successfully submitted?

Feel free to reset. `useForm` doesn't depend on this value.

Type: `Ref<boolean>`.

### `errors`

Validation errors, either coming from schema validation, or set manually in the submit callback.

Type: `Ref<FlatErrors?>`.

## Submit with arguments

Additional arguments passed to `submit` composable will be passed to the submit callback after `input`:

```ts
const { submit } = useForm({
  input,
  schema,
  async submit(input, chargeImmediately = false) {
    await api.post({ ...input, chargeImmediately })
  },
})
```

and then:

```html
<form ref="form" @submit.prevent="submit">
  <!-- Input fields omitted for brevity. -->
  <button type="submit">Submit</button>
  <button type="button" @click="submit(true)">
    Submit and Charge Immediately
  </button>
</form>
```

In the shortcut variant, it works the same but there is no `input` argument in the callback:

```ts
const { submit, submitting } = useForm(
  async (arg1: number, arg2: string, arg3 = false) => {
    // Note: no `input` argument.
    await api.post({ arg1, arg2, arg3 })
  },
)

// Arguments are type checked:
submit(10, "foo")
submit(20, "bar", true)
```

## SubmitError

If you throw `SubmitError` from the submit handler, it will be intercepted and its argument will be put into `errors.value`.

This could be useful together with `onError`:

```ts
import { useForm, SubmitError } from "vue-valibot-form"

// Note: no need to expose { errors } on the script level.
const { submit } = useForm({
  input,
  schema,
  submit(input) {
    if (!validateInput(input)) {
      throw new SubmitError({ root: ["Input is invalid."], nested: {} })
    }
  },
  onErrors(errors) {
    // errors is valibot.FlatErrors (coming either from validation or from submit handler)
    // TODO: show some alert box.
    console.error(errors)
  },
})
```
