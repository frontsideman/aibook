import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/books', () => {
    return HttpResponse.json([
      { id: '1', title: 'The Brave Little Lion', status: 'COMPLETED' },
      { id: '2', title: 'Space Adventure', status: 'GENERATING' },
    ])
  }),

  http.get('/api/child-profiles', () => {
    return HttpResponse.json([
      { id: '1', name: 'Alice', age: 5, gender: 'female', interests: ['dinosaurs', 'space'] },
      { id: '2', name: 'Bob', age: 7, gender: 'male', interests: ['robots', 'coding'] },
    ])
  }),

  http.post('/api/child-profiles', async ({ request }) => {
    const newProfile = await request.json()
    return HttpResponse.json({ id: Math.random().toString(36).substr(2, 9), ...(newProfile as object) }, { status: 201 })
  }),
]
