import {
  applyDashboardBookFilterSort,
  toDashboardBookViewModel,
  type DashboardBookViewModel,
} from './books-view-model';

const makeBook = (overrides: Partial<DashboardBookViewModel>): DashboardBookViewModel => ({
  id: 'book-1',
  title: 'Default',
  type: 'AI_ADAPTED',
  style: 'WATERCOLOR',
  status: 'DRAFT',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('applyDashboardBookFilterSort', () => {
  it('sorts by updated desc by default', () => {
    const books = [
      makeBook({ id: 'older', title: 'Older', updatedAt: '2026-01-01T00:00:00.000Z' }),
      makeBook({ id: 'newer', title: 'Newer', updatedAt: '2026-03-01T00:00:00.000Z' }),
      makeBook({ id: 'middle', title: 'Middle', updatedAt: '2026-02-01T00:00:00.000Z' }),
    ];

    const result = applyDashboardBookFilterSort(books);

    expect(result.map((book) => book.id)).toEqual(['newer', 'middle', 'older']);
  });

  it('sorts by title asc', () => {
    const books = [
      makeBook({ id: 'z', title: 'Zulu' }),
      makeBook({ id: 'a', title: 'alpha' }),
      makeBook({ id: 'm', title: 'Mike' }),
    ];

    const result = applyDashboardBookFilterSort(books, { sort: 'title' });

    expect(result.map((book) => book.title)).toEqual(['alpha', 'Mike', 'Zulu']);
  });

  it('filters by title search', () => {
    const books = [
      makeBook({ id: '1', title: 'Moonlight Adventure' }),
      makeBook({ id: '2', title: 'Sunny Day' }),
      makeBook({ id: '3', title: 'Moon Mission' }),
    ];

    const result = applyDashboardBookFilterSort(books, { titleSearch: 'moon' });

    expect(result.map((book) => book.id)).toEqual(['1', '3']);
  });

  it('normalizes title search with trim and case-insensitive matching', () => {
    const books = [
      makeBook({ id: '1', title: 'Moonlight Adventure' }),
      makeBook({ id: '2', title: 'Sunny Day' }),
      makeBook({ id: '3', title: 'MOON Mission' }),
    ];

    const result = applyDashboardBookFilterSort(books, { titleSearch: '  mOoN  ' });

    expect(result.map((book) => book.id)).toEqual(['1', '3']);
  });
});

describe('toDashboardBookViewModel', () => {
  it('falls back to createdAt when updatedAt is missing', () => {
    const result = toDashboardBookViewModel({
      id: 'book-1',
      title: 'Story',
      style: 'WATERCOLOR',
      status: 'DRAFT',
      createdAt: '2026-01-05T00:00:00.000Z',
    });

    expect(result.updatedAt).toBe('2026-01-05T00:00:00.000Z');
  });

  it('preserves failed status for dashboard routing', () => {
    const result = toDashboardBookViewModel({
      id: 'book-2',
      title: 'Broken Story',
      style: 'SKETCH',
      status: 'FAILED',
      createdAt: '2026-01-06T00:00:00.000Z',
    });

    expect(result.status).toBe('FAILED');
  });
});
