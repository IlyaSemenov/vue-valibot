# vue-valibot

A set of simple Vue3 composables for handling form submit, with optional [valibot](https://valibot.dev/) integration.

Unlike FormKit, VeeValidate and others, keeps things simple and doesn't interfere with neither data storage nor the UI workflow.

Full Typescript support with type inference.

## Install

```sh
npm install vue-valibot
```

## Use

```vue
<script setup lang="ts">
import * as v from "valibot"
import { useForm } from "vue-valibot"

// Store input data as you prefer, such as with Vue reactive or ref.
const fields = reactive({
  name: "",
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  // Schema is optional, but usually recommended.
  schema: v.object({
    name: v.pipe(v.string(), v.trim(), v.minLength(1, "Please enter your name.")),
  }),
  async submit(input) {
    // Input is validated against the schema and typed accordingly.
    const res = await api.post(input)
    if (!res) {
      // errors is valibot.FlatErrors ref typed with schema fields.
      errors.value = { root: ["Failed to submit."] }
    }
  },
})
</script>

<template>
  <form ref="form" @submit.prevent="submit">
    <!-- No fancy syntax for input fields, just use what you prefer. -->
    Name: <input v-model="fields.name" />

    <!-- Field errors. -->
    <div v-for="error in errors?.nested?.name">{{ error }}</div>

    <button type="submit" :disabled="submitting">Submit</button>

    <!-- Form errors. -->
    <div v-for="error in errors?.root">{{ error }}</div>
  </form>
</template>
```

## useForm composable

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

## useForm options

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

If `input` and/or `schema` were provided, the first argument passed to the submit callback is the (possibly validated) form input. The rest of the arguments are the submit function arguments.

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
  async submit() { /* ... */ }
})

const { submit: submit2 } = useForm({
  submitting,
  async submit() { /* ... */ }
})

// `submitting` will be true during submit of either form.
```

## useForm shortcut

All the composable options are optional. If the only option you need is `submit`, there is a shortcut variant:

```ts
const { submit, submitting } = useForm(async () => {
  // submitting is true during this callback.
  await api.post()
})
```

## useForm return

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

Arguments passed to this submit function are passed to the submit callback, possibly prepended with form input (if `input` and/or `schema` were provided).

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

If there was no `input` composable option, all arguments are passed as is:

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

## Custom submit errors

You can set `errors` inside the submit handler. This will be treated the same way as if errors were produced by the schema.

In particular, this could be used together with `onError`:

```ts
const { submit, errors } = useForm({
  input,
  schema,
  submit(input) {
    if (!validateInput(input)) {
      errors.value = { root: ["Input is invalid."] }
    }
  },
  onErrors(errors) {
    // errors is valibot.FlatErrors (coming either from validation or from submit handler)
    // TODO: show some alert box.
    console.error(errors)
  },
})
```

## useParse

`useParse` reactively runs Valibot validation on every input change.

It could be used together with `useForm` or independently.

```vue
<script setup lang="ts">
const input = reactive({
  age: "" as number | "", // for v-input
})

const { errors: presubmitErrors } = useParse({
  input,
  schema: v.object({
    age: v.number(),
  })
})
</script>

<template>
  <form @submit="...">
    Age: <input v-model.number="age" type="number">
    <button type="submit" :disabled="!presubmitErrors">Submit</button>
  </form>
</template>
```
