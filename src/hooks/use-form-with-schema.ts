import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

/**
 * Convenience wrapper around useForm with zod resolver pre-configured.
 * Establishes the standard form pattern for the project.
 *
 * Validation runs on blur (first error) and on every change after the field
 * has been blurred once - matches the Material Design pattern of "don't
 * yell at the user mid-typing, but give live feedback once they've started".
 */
export function useFormWithSchema<TOutput, TDef extends z.ZodTypeDef, TInput>(
  schema: z.ZodType<TOutput, TDef, TInput>,
  defaultValues?: DefaultValues<TOutput extends Record<string, unknown> ? TOutput : never>,
): UseFormReturn<TOutput extends Record<string, unknown> ? TOutput : never> {
  type FormValues = TOutput extends Record<string, unknown> ? TOutput : never;
  return useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any),
    defaultValues,
    mode: "onBlur",
    reValidateMode: "onChange",
  });
}
