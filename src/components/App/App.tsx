import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';
import { fetchNotes, hasNoteHubToken } from '../../services/noteService';
import Modal from '../Modal/Modal';
import NoteForm from '../NoteForm/NoteForm';
import NoteList from '../NoteList/NoteList';
import Pagination from '../Pagination/Pagination';
import SearchBox from '../SearchBox/SearchBox';
import css from './App.module.css';

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [{ page, search }, setFilters] = useState({ page: 1, search: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const notesQuery = useQuery({
    queryKey: ['notes', search, page],
    queryFn: ({ signal }) => fetchNotes({ page, search, signal }),
    enabled: hasNoteHubToken,
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === search ? previousData : undefined,
  });

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilters({ page: 1, search: value.trim() });
  }, 300);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleCreated = () => {
    debouncedSearch.cancel();
    setSearchInput('');
    setFilters({ page: 1, search: '' });
    setIsModalOpen(false);
  };

  const { data, isPending, isError, isFetching, isPlaceholderData } =
    notesQuery;

  if (data && !isPlaceholderData && page > Math.max(1, data.totalPages)) {
    setFilters({ page: Math.max(1, data.totalPages), search });
  }

  return (
    <div className={css.app}>
      <header className={css.toolbar}>
        <SearchBox value={searchInput} onChange={handleSearch} />
        {data && data.totalPages > 1 && (
          <Pagination
            currentPage={Math.min(page, data.totalPages)}
            totalPages={data.totalPages}
            onPageChange={(nextPage) =>
              setFilters((previous) => ({ ...previous, page: nextPage }))
            }
          />
        )}
        <button
          type="button"
          className={css.button}
          onClick={() => setIsModalOpen(true)}
          disabled={!hasNoteHubToken}
        >
          Create note +
        </button>
      </header>

      {!hasNoteHubToken ? (
        <p className={css.error} role="alert">
          Notes are unavailable right now.
        </p>
      ) : isPending ? (
        <p className={css.status} role="status">
          Loading notes, please wait...
        </p>
      ) : isError ? (
        <p className={css.error} role="alert">
          Could not load notes.{' '}
          <button type="button" onClick={() => void notesQuery.refetch()}>
            Try again
          </button>
        </p>
      ) : (
        <main
          aria-label="Notes"
          aria-busy={isFetching}
          inert={isPlaceholderData}
        >
          {data.notes.length > 0 ? (
            <NoteList notes={data.notes} />
          ) : (
            <p className={css.status} role="status">
              {search
                ? 'No notes found. Try another search.'
                : 'No notes yet. Create your first note!'}
            </p>
          )}
        </main>
      )}

      {isModalOpen && (
        <Modal onClose={closeModal}>
          <NoteForm onSuccess={handleCreated} onCancel={closeModal} />
        </Modal>
      )}
    </div>
  );
}
