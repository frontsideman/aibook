export type DashboardBookStatus = 'DRAFT' | 'GENERATING' | 'REVIEW' | 'COMPLETED' | 'FAILED';
export type DashboardBookStyle =
  | 'WATERCOLOR'
  | 'CARTOON'
  | 'REALISTIC'
  | 'PIXAR'
  | 'SKETCH'
  | 'MANGA'
  | 'COMIC';

export type DashboardBookApiModel = {
  id: string;
  title: string;
  type?: string;
  style: DashboardBookStyle;
  status: DashboardBookStatus;
  child?: { name: string };
  createdAt: string;
  updatedAt?: string;
};

export type DashboardBookViewModel = {
  id: string;
  title: string;
  type: string;
  style: DashboardBookStyle;
  status: DashboardBookStatus;
  childName?: string;
  createdAt: string;
  updatedAt: string;
};

export type DashboardSort = 'updated' | 'title';

export function toDashboardBookViewModel(book: DashboardBookApiModel): DashboardBookViewModel {
  return {
    id: book.id,
    title: book.title,
    type: book.type ?? 'AI_ADAPTED',
    style: book.style,
    status: book.status,
    childName: book.child?.name,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt ?? book.createdAt,
  };
}

export function applyDashboardBookFilterSort(
  books: DashboardBookViewModel[],
  options?: {
    titleSearch?: string;
    status?: string;
    style?: string;
    sort?: DashboardSort;
  },
): DashboardBookViewModel[] {
  const titleSearch = options?.titleSearch?.trim().toLowerCase() ?? '';
  const status = options?.status ?? '';
  const style = options?.style ?? '';
  const sort = options?.sort ?? 'updated';

  const filtered = books.filter((book) => {
    if (titleSearch && !book.title.toLowerCase().includes(titleSearch)) return false;
    if (status && book.status !== status) return false;
    if (style && book.style !== style) return false;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (sort === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
