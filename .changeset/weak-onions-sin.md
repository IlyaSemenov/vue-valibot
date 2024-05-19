---
"vue-valibot-form": major
---

Pass `input` to submit callback only if there is composable input and/or schema (#15). Otherwise, pass `submit` function arguments immediately. **BREAKING CHANGE:** in v1, `input` was always passed unless using the shortcut callback variant.

Type `errors` as `FlatErrors<TSchema>` when using Valibot schema (#12).
