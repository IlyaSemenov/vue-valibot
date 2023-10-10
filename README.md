# vue-valibot-form

Minimalistic Vue3 composable for handling form submit, with optional validation using [valibot](https://valibot.dev/).

Unlike FormKit, VeeValidate and others, keeps things simple and doesn't interfere with neither data storage nor the UI workflow.

## Install

```sh
npm install vue-valibot-form
```

## Use

Full example:

```vue
<script setup lang="ts">
import * as v from "valibot"
import { useForm } from "vue-valibot-form"

// Store data as you prefer, such as with Vue reactive or ref.
const fields = reactive({
  foo: "",
})

const { form, submit, submitting, errors } = useForm({
  fields,
  schema: v.object({
    foo: v.string([v.toTrimmed(), v.minLength(1)]),
  }),
  async submit(input) {
    // Input is validated (and typed) against the schema.
    const res = await api.post(input)
    if (!res) {
      // errors is valibot's FlatErrors.
      errors.value = { root: ["Failed to submit."], nested: {} }
    }
  },
})
</script>

<template>
  <form ref="form" @submit.prevent="submit">
    <!-- No fancy syntax for fields, just use what you prefer. -->
    <input v-model="fields.foo" />

    <!-- Field errors. -->
    <div v-for="error in errors?.nested.foo">{{ error }}</div>

    <button type="submit" :disabled="submitting">Submit</button>

    <!-- Form errors. -->
    <div v-for="error in errors?.root">{{ error }}</div>
  </form>
</template>
```

All the parameters are optional:

- `fields` is optional
- `schema` is optional (if there no schema, `fields` will be passed as-is)
- `submit` is optional
- `ref="form"` is optional (setting it will call HTML5 validation on the form before submit).

For example, the minimal use, just for the sake of `submitting`:

```ts
import { useForm } from "vue-valibot-form"

const { submit, submitting } = useForm({
  async submit() {
    // submitting is true during this callback.
    await api.post()
  },
})

// Call submit from somewhere else.
await submit()
```

For that particular use, there is a shortcut:

```ts
const { submit, submitting } = useForm(async () => {
  // submitting is true during this callback.
  await api.post()
})
```
