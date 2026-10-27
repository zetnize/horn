import type { HTMLInputTypeAttribute } from "react";
export type FieldDefinition = {
  name: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  maxLength: number;
  multiline?: boolean;
  required?: boolean;
};
export function Field({
  field,
  errors,
}: {
  field: FieldDefinition;
  errors?: string[];
}) {
  const id = `field-${field.name}`;
  const shared = {
    id,
    name: field.name,
    maxLength: field.maxLength,
    required: field.required,
    autoComplete: field.autoComplete,
    "aria-invalid": !!errors?.length,
    "aria-describedby": errors?.length ? `${id}-error` : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>{field.label}</label>
      {field.multiline ? (
        <textarea {...shared} rows={2} />
      ) : (
        <input {...shared} type={field.type ?? "text"} />
      )}{" "}
      {errors?.length ? (
        <p className="field-error" id={`${id}-error`}>
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
