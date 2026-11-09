import type { Note } from '../../types/note';
import css from './NoteList.module.css';

interface NoteListProps {
  notes: Note[];
  onDelete: (id: Note['id']) => void;
  isDeleting: boolean;
  deletingId?: Note['id'];
}

export default function NoteList({
  notes,
  onDelete,
  isDeleting,
  deletingId,
}: NoteListProps) {
  return (
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
              disabled={isDeleting}
              onClick={() => onDelete(note.id)}
              aria-label={`Delete ${note.title}`}
            >
              {deletingId === note.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
