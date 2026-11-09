import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteNote } from '../../services/noteService';
import type { Note } from '../../types/note';
import css from './NoteList.module.css';

interface NoteListProps {
  notes: Note[];
}

export default function NoteList({ notes }: NoteListProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  });

  return (
    <>
      <ul className={css.list}>
        {notes.map((note) => (
          <li className={css.listItem} key={note.id}>
            <h2 className={css.title}>{note.title}</h2>
            <p className={css.content}>{note.content}</p>
            <div className={css.footer}>
              <span className={css.tag}>{note.tag}</span>
              <button
                type="button"
                className={css.button}
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(note.id)}
                aria-label={`Delete ${note.title}`}
              >
                {deleteMutation.isPending &&
                deleteMutation.variables === note.id
                  ? 'Deleting...'
                  : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {deleteMutation.isError && (
        <p className={css.error} role="alert">
          Could not delete the note. Please try again.
        </p>
      )}
    </>
  );
}
