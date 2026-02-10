import { ReactNode } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Control, FieldPath, FieldValues } from "react-hook-form";

interface FormFieldWrapperProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  children: (field: any) => ReactNode;
  className?: string;
}

export function FormFieldWrapper<T extends FieldValues>({
  control,
  name,
  label,
  children,
  className,
}: FormFieldWrapperProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-sm sm:text-base">{label}</FormLabel>
          <FormControl>{children(field)}</FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

