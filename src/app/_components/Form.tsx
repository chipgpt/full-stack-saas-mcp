"use client"

import React, { ReactElement, ReactNode } from 'react';
import {
  Control,
  Controller,
  ControllerProps,
  FieldErrors,
  FieldPath,
  FieldValues,
  FormProvider,
  UseFormReturn,
} from 'react-hook-form';
import { capitalize, words } from 'lodash';

interface IFormProps<TFieldValues extends FieldValues> {
  onSubmit(): void;
  form: UseFormReturn<TFieldValues>;
  children: React.ReactNode;
}

export function Form<TFieldValues extends FieldValues>(props: IFormProps<TFieldValues>) {
  const { form, children, onSubmit, ...rest } = props;
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit && form.handleSubmit(onSubmit)} {...rest}>
        <div className="flex flex-col">{children}</div>
      </form>
    </FormProvider>
  );
}

export function FormBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-14 p-6">{children}</div>;
}

export function FormFooter({ children }: { children: ReactNode }) {
  return <div className="flex justify-center gap-6 p-6">{children}</div>;
}

export interface IFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends ControllerProps<TFieldValues, TName> {
  label?: React.ReactNode;
  description?: string | string[];
  required?: boolean;
  control: Control<TFieldValues>;
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: IFormFieldProps<TFieldValues, TName>) {
  const { render, label, description, required, ...rest } = props;

  const descriptions = Array.isArray(description)
    ? description
    : description
    ? [description]
    : [];

  return (
    <Controller
      {...rest}
      render={({ field, fieldState, ...rest }) => (
        <div className="flex flex-col gap-1">
          {label && (
            <span className="font-bold">
              {label}
              {required && <span className="text-[red]"> *</span>}
            </span>
          )}
          {descriptions.map((description, i) => (
            <div key={i}>{description}</div>
          ))}
          {render({field, fieldState, ...rest})}
          {fieldState.error && (
            <div className="text-[red]">{fieldState.error.message || 'Required'}</div>
          )}
        </div>
      )}
    />
  );
}

const reverseCamelCase = (value: string) => {
  const result = words(value);
  return result.map(word => capitalize(word)).join(' ');
};

const renderFormErrors = (errors: FieldErrors) => {
  const errorBoxes: ReactElement[] = [];

  const errorKeys = Object.keys(errors).filter(key => key !== 'root');
  for (const key of errorKeys) {
    const error = errors[key];
    if (error && 'message' in error) {
      errorBoxes.push(
        <div key={key} className="p-4 bg-[red] text-white font-bold">
          - {String(error.message || '') || `${reverseCamelCase(key)} is required`}
        </div>
      );
    } else if (typeof error === 'object') {
      errorBoxes.push(...renderFormErrors(error as FieldErrors));
    }
  }

  return errorBoxes;
};
