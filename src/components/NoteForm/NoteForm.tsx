import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { createNote } from '../../services/noteService';
import type { CreateNoteParams } from '../../services/noteService';
import type { NoteTag } from '../../types/note';
import css from './NoteForm.module.css';

interface NoteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const tags: NoteTag[] = ['Todo', 'Work', 'Personal', 'Meeting', 'Shopping'];
const initialValues: CreateNoteParams = { title: '', content: '', tag: 'Todo' };
const validationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must be at most 50 characters')
    .required('Title is required'),
  content: Yup.string().max(500, 'Content must be at most 500 characters'),
  tag: Yup.string()
    .oneOf(tags, 'Select a valid tag')
    .required('Tag is required'),
});

export default function NoteForm({ onSuccess, onCancel }: NoteFormProps) {
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  const handleSubmit = async (values: CreateNoteParams) => {
    try {
      await createMutation.mutateAsync({
        ...values,
        title: values.title.trim(),
      });
      onSuccess();
    } catch {
      // The mutation error is displayed in the form so the user can retry.
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form className={css.form} noValidate>
          <div className={css.formGroup}>
            <label htmlFor="title">Title</label>
            <Field
              id="title"
              type="text"
              name="title"
              className={css.input}
              aria-describedby="title-error"
              aria-invalid={Boolean(touched.title && errors.title)}
            />
            <ErrorMessage
              id="title-error"
              name="title"
              component="span"
              className={css.error}
            />
          </div>
          <div className={css.formGroup}>
            <label htmlFor="content">Content</label>
            <Field
              as="textarea"
              id="content"
              name="content"
              rows={8}
              className={css.textarea}
              aria-describedby="content-error"
              aria-invalid={Boolean(touched.content && errors.content)}
            />
            <ErrorMessage
              id="content-error"
              name="content"
              component="span"
              className={css.error}
            />
          </div>
          <div className={css.formGroup}>
            <label htmlFor="tag">Tag</label>
            <Field
              as="select"
              id="tag"
              name="tag"
              className={css.select}
              aria-describedby="tag-error"
              aria-invalid={Boolean(touched.tag && errors.tag)}
            >
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </Field>
            <ErrorMessage
              id="tag-error"
              name="tag"
              component="span"
              className={css.error}
            />
          </div>
          {createMutation.isError && (
            <p className={css.error} role="alert">
              Could not create the note. Please try again.
            </p>
          )}
          <div className={css.actions}>
            <button
              type="button"
              className={css.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={css.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create note'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
}
