import { expectType } from "tsd"
import type * as v from "valibot"
import { useForm } from "vue-valibot-form"

useForm({
  onErrors() {},
})

useForm({
  onErrors(errors) {
    expectType<v.FlatErrors>(errors)
  },
})
