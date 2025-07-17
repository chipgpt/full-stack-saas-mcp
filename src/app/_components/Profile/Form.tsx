'use client';

import { Form, FormBody, FormField, FormFooter } from '../Form';
import { Input } from '../Input';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '../Button';

export const userFormSchema = z.object({
  context: z.string().trim().max(2000, 'Max 2000 characters'),
});

export type UserFormSchemaType = z.infer<typeof userFormSchema>;

export const DEFAULT_PROFILE_INFO = {
  context: '',
};

export interface IProfileFormProps {
  form: UseFormReturn<UserFormSchemaType>;
  onSubmit(): void;
  loading: boolean;
}

export function ProfileForm(props: IProfileFormProps) {
  const { form, onSubmit } = props;

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormBody>
        <FormField
          control={form.control}
          name="context"
          label={
            <span className="inline-flex items-center gap-1">
              Context
            </span>
          }
          description="This context will be exposed via the MCP server to the client"
          render={({ field }) => <Input {...field} flex type="textarea" maxLength={2000} />}
        />
      </FormBody>
      <FormFooter>
        <Button type="submit" variant="cta" loading={props.loading}>
          {props.loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </FormFooter>
    </Form>
  );
}
