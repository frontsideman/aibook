import { http, HttpResponse } from 'msw'

const mockBookPages = [
  { id: 'p1', pageNumber: 1, textContent: 'Once upon a time, in a cozy little village, there lived a brave little girl named Lily.', illustrations: [{ id: 'i1', url: 'https://placehold.co/800x600/ADD8E6/333333?text=Page+1', prompt: 'Girl in village' }] },
  { id: 'p2', pageNumber: 2, textContent: 'Lily loved exploring the forest behind her house. She dreamed of finding a magical creature.', illustrations: [{ id: 'i2', url: 'https://placehold.co/800x600/90EE90/333333?text=Page+2', prompt: 'Girl in forest' }] },
  { id: 'p3', pageNumber: 3, textContent: 'One sunny morning, she discovered a tiny, sparkling door at the base of an old oak tree.', illustrations: [{ id: 'i3', url: 'https://placehold.co/800x600/DDA0DD/333333?text=Page+3', prompt: 'Sparkling door in tree' }] },
];

const mockProfiles = [
  { id: '1', name: 'Alice', age: 5, gender: 'female', interests: ['dinosaurs', 'space'] },
  { id: '2', name: 'Bob', age: 7, gender: 'male', interests: ['robots', 'coding'] },
];

const seedStories = [
  { id: 's1', title: 'The Little Red Riding Hood', description: 'A girl meets a wolf' },
  { id: 's2', title: 'Cinderella', description: 'A kind girl goes to the ball' },
  { id: 's3', title: 'The Snow Queen', description: 'A winter fairy tale' },
  { id: 's4', title: 'The Three Little Pigs', description: 'Three pigs build houses' },
  { id: 's5', title: 'Jack and the Beanstalk', description: 'A boy and magic beans' },
];
const mockStories = [
  ...seedStories,
  ...Array.from({ length: 995 }, (_, index) => ({
    id: `s${index + 6}`,
    title: `Popular Bedtime Story ${index + 1}`,
    description: 'Popular children story',
  })),
];

export const handlers = [
  http.get('/api/books', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const style = url.searchParams.get('style') || '';

    let books = [
      { id: 'b1', title: 'The Brave Little Lion', style: 'CARTOON', status: 'COMPLETED', child: { name: 'Alice' }, createdAt: '2026-05-20T10:00:00Z' },
      { id: 'b2', title: 'Space Adventure', style: 'PIXAR', status: 'GENERATING', child: { name: 'Bob' }, createdAt: '2026-05-25T14:30:00Z' },
      { id: 'b3', title: 'The Magic Forest', style: 'WATERCOLOR', status: 'REVIEW', child: { name: 'Alice' }, createdAt: '2026-05-26T09:00:00Z' },
      { id: 'b4', title: 'Dinosaur Friends', style: 'CARTOON', status: 'DRAFT', child: { name: 'Alice' }, createdAt: '2026-05-26T08:00:00Z' },
    ];

    if (search) books = books.filter((b) => b.title.toLowerCase().includes(search.toLowerCase()));
    if (status) books = books.filter((b) => b.status === status);
    if (style) books = books.filter((b) => b.style === style);

    const total = books.length;
    const limit = 10;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = books.slice(start, start + limit);

    return HttpResponse.json({ books: paginated, total, page, totalPages });
  }),

  http.get('/api/books/:id/preview', ({ params }) => {
    const { id } = params;
    if (id === 'b1') {
      return HttpResponse.json({
        book: { id: 'b1', title: 'The Brave Little Lion', status: 'COMPLETED', style: 'CARTOON', tone: 'PLAYFUL', pages: mockBookPages },
        pdfUrl: 'https://example.com/book.pdf',
        redirectToDetail: true,
      });
    }
    if (id === 'b3') {
      return HttpResponse.json({
        book: { id: 'b3', title: 'The Magic Forest', status: 'REVIEW', style: 'WATERCOLOR', tone: 'MAGICAL', pages: mockBookPages },
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/books/generate', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ bookId: 'b5', status: 'DRAFT' });
  }),

  http.post('/api/books/:id/approve', () => {
    return HttpResponse.json({ pdfUrl: 'https://example.com/book.pdf' });
  }),

  http.patch('/api/books/:id/pages/:pageNumber', async ({ params, request }) => {
    const body = await request.json() as any;
    const pageNum = parseInt(params.pageNumber as string);
    return HttpResponse.json({
      id: `p${pageNum}`,
      pageNumber: pageNum,
      textContent: `Updated content: ${body.feedback || ''}`,
      illustrations: [{ id: `i${pageNum}`, url: `https://placehold.co/800x600?text=Updated+Page+${pageNum}`, prompt: 'Updated' }],
    });
  }),

  http.patch('/api/books/:id/regenerate', () => {
    return HttpResponse.json({ bookId: 'b3', status: 'REGENERATING' });
  }),

  http.get('/api/books/:id/pdf', () => {
    return HttpResponse.json({ pdfUrl: 'https://example.com/book.pdf' });
  }),

  http.get('/api/child-profiles', () => {
    return HttpResponse.json(mockProfiles);
  }),

  http.post('/api/child-profiles', async ({ request }) => {
    const newProfile = await request.json()
    return HttpResponse.json({ id: Math.random().toString(36).substr(2, 9), ...(newProfile as object) }, { status: 201 })
  }),

  http.patch('/api/child-profiles/:id', async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: params.id, ...body });
  }),

  http.delete('/api/child-profiles/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/api/stories', ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const limit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = Number.parseInt(url.searchParams.get('offset') || '0', 10);
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 10;
    const safeOffset = Number.isFinite(offset) ? Math.max(offset, 0) : 0;
    const filtered = search
      ? mockStories.filter((s) => s.title.toLowerCase().includes(search))
      : mockStories;
    return HttpResponse.json(filtered.slice(safeOffset, safeOffset + safeLimit));
  }),
]
