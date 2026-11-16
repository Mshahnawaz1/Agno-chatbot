/** Prop helpers shared by the catalog's components. */

/** `weight` is the component's flex-grow inside a Row or Column. */
export function weightStyle(weight: number | undefined) {
  return weight === undefined ? undefined : { flexGrow: weight, flexBasis: 0 }
}

/** What an input's binder adds for its label and checks. */
export type FieldProps = {
  label?: string
  isValid?: boolean
  validationErrors?: string[]
}

/** ARIA for a control whose checks fail. */
export function invalidProps(props: FieldProps, id: string) {
  const invalid = props.isValid === false
  return {
    'aria-invalid': invalid || undefined,
    'aria-errormessage': invalid && props.validationErrors?.length ? `${id}-errors` : undefined,
  }
}
