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
      // errors is valibot.FlatErrors
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

## API: options

```ts
useForm({
  input,
  schema,
  submit,
})
```

- `input`: (optional) input value (or ref) to be validated and/or passed to `submit`.
- `schema`: (optional) a Valibot schema.
- `submit`: (optional) submit handler.

All the parameters are optional. If the only parameter you need is `submit`, there is a shortcut version:

```ts
const { submit, submitting } = useForm(async () => {
  // submitting is true during this callback.
  await api.post()
})
```

## API: return object

```ts
const {
  form,
  submit,
  submitting,
  submitted,
  errors,
} = useForm(...)
```

- `form`: a `Ref<HTMLFormElement>`. If set with `<form ref="form">`, HTML5 validation will be triggered on the form before `submit`.
- `submit`: a submit handle that should be called by user action (e.g. with `<form @submit.prevent="submit">` or with `<button @click="submit">`)
- `submitting`: a `Ref<boolean>`, which is `true` while the form is being submitted.
- `submitted`: a `Ref<boolean>`, which is `true` after the form has been successfully submitted.
- `errors`: a `Ref<valibot.FlatErrors | undefined>`, the flat list of errors as returned by Valibot (or set manually).

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

In the shortcut form, it works the same but there is no `input` argument in the callback:

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
