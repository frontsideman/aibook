# Project Directory Architecture

Mermaid diagrams for the three primary project directories:

- `apps/frontend` — Next.js 16 application
- `apps/backend` — NestJS API and background worker
- `packages/database` — Prisma schema and client factory

## Runtime Containers

```mermaid
flowchart LR
    Browser["User Browser"]

    subgraph Frontend["apps/frontend — Next.js 16"]
        Middleware["middleware.ts<br/>/books/new profile guard"]
        AuthSystem["src/lib/mock-auth.ts<br/>AuthProvider, AuthGuard<br/>localStorage session"]
        RouteGroups["src/app<br/>(auth) guest pages<br/>(app) authenticated pages"]
        AppShell["src/components/app-shell<br/>AppShell, AppSidebar, PageBreadcrumb"]
        UIComponents["src/components<br/>dashboard, books, profiles,<br/>settings, auth, ui"]
        FrontendLib["src/lib<br/>view models and utilities"]
        NextConfig["next.config.mjs<br/>/api rewrites to BACKEND_URL"]
    end

    subgraph Backend["apps/backend — NestJS"]
        Main["src/main.ts<br/>ValidationPipe, shutdown hooks"]
        AppModule["AppModule<br/>Config, BullMQ, domain modules"]
        Health["HealthController<br/>GET /health"]
        Auth["MockAuthGuard<br/>request user injection in dev"]
        BookModule["BookModule<br/>list, create, preview, approve, PDF"]
        ChildProfileModule["ChildProfileModule<br/>user-scoped CRUD"]
        StoryLibraryModule["StoryLibraryModule<br/>story catalog search"]
        PaymentModule["PaymentModule<br/>prototype webhook, SubscriptionGuard"]
        GenerationModule["BookGenerationModule<br/>BullMQ processor"]
        AiModule["AiModule<br/>OpenAI-compatible story generation"]
        PdfModule["PdfModule<br/>PDFKit rendering"]
        StorageModule["StorageModule<br/>MinIO/S3 upload + public URL"]
        QueueModule["QueueModule<br/>BullMQ registration"]
        SettingsModule["SettingsModule<br/>model allowlist + reasoning effort"]
        PrismaService["PrismaService<br/>connect/disconnect Prisma"]
    end

    subgraph DatabasePackage["packages/database — @repo/database"]
        PrismaFactory["index.ts<br/>createPrismaClient"]
        PrismaSchema["prisma/schema.prisma<br/>6 models, 5 enums"]
        Seed["prisma/seed.ts<br/>classic story catalog"]
        PrismaConfig["prisma.config.ts"]
    end

    subgraph External["Runtime Dependencies"]
        Postgres[("PostgreSQL")]
        Redis[("Redis<br/>BullMQ")]
        Minio[("MinIO<br/>S3-compatible")]
        AIProvider["LLM Provider"]
    end

    Browser --> AuthSystem
    AuthSystem --> RouteGroups
    RouteGroups --> AppShell
    RouteGroups --> UIComponents
    UIComponents --> FrontendLib
    RouteGroups --> NextConfig
    NextConfig -->|"/api/* rewrite"| Main

    Main --> AppModule
    AppModule --> Health
    AppModule --> Auth
    AppModule --> BookModule
    AppModule --> ChildProfileModule
    AppModule --> StoryLibraryModule
    AppModule --> PaymentModule
    AppModule --> GenerationModule
    AppModule --> AiModule
    AppModule --> PdfModule
    AppModule --> StorageModule
    AppModule --> SettingsModule
    AppModule --> PrismaService
    GenerationModule --> QueueModule
    GenerationModule --> Redis
    GenerationModule --> AiModule
    BookModule --> PdfModule
    BookModule --> StorageModule
    BookModule --> QueueModule
    PdfModule --> StorageModule
    StorageModule --> Minio
    AiModule --> AIProvider

    PrismaService --> PrismaFactory
    PrismaFactory -->|driver adapter pg pool| Postgres
    PrismaConfig --> PrismaSchema
    Seed --> PrismaFactory
```

## Main Book Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as apps/frontend
    participant API as BookController
    participant Guards as MockAuthGuard + SubscriptionGuard
    participant Book as BookService
    participant Queue as BullMQ book-generation
    participant Worker as BookProcessor
    participant AI as AiService
    participant DB as Prisma
    participant Minio as MinIO

    User->>FE: Submit create form
    FE->>API: POST /api/books/generate
    API->>Guards: Authenticate + subscription check
    API->>Book: createAndGenerate(dto, userId)
    Book->>DB: Verify child ownership
    Book->>DB: Create Book (GENERATING, model snapshot)
    Book->>Queue: enqueue { bookId }
    API-->>FE: { bookId, status: "GENERATING" }

    Queue-->>Worker: process job
    Worker->>DB: Load Book + ChildProfile
    Worker->>AI: generateStory(prompt)
    AI-->>Worker: raw page text
    Worker->>DB: transaction: delete pages, insert pages, set REVIEW
    Note over Worker,DB: On AI or parse failure the book becomes FAILED

    loop Frontend polling
        FE->>API: GET /api/books/:id
        API-->>FE: status
    end

    User->>FE: Review pages
    FE->>API: GET /api/books/:id/preview
    opt Page-only edits
        FE->>API: PATCH /api/books/:id/pages/:pageNumber
    end
    opt Global feedback / regeneration
        FE->>API: PATCH /api/books/:id/regenerate
        API->>Book: atomic REVIEW/FAILED → GENERATING
        Book->>Queue: enqueue { bookId, parentFeedback }
    end

    User->>FE: Approve
    FE->>API: POST /api/books/:id/approve
    API->>Book: atomic REVIEW → COMPLETED
    API-->>FE: completed

    User->>FE: Download PDF
    FE->>API: POST /api/books/:id/pdf
    API->>Book: createPdf(id, userId)
    Book->>DB: Load pages
    Book->>Book: PDFKit render
    Book->>Minio: upload books/:id/book.pdf
    Book->>DB: save pdfUrl
    API-->>FE: { pdfUrl }
```

## Book Endpoints

| Endpoint | Method | Guards | Description |
|----------|--------|--------|-------------|
| `GET /books` | GET | MockAuthGuard | Paginated list with filters, sorting, and `statusCounts` |
| `POST /books/generate` | POST | MockAuthGuard + SubscriptionGuard | Create book and enqueue generation |
| `GET /books/:id` | GET | MockAuthGuard | Book detail with child info and pages |
| `GET /books/:id/preview` | GET | MockAuthGuard | Review payload; `409` unless REVIEW/COMPLETED |
| `PATCH /books/:id/pages/:pageNumber` | PATCH | MockAuthGuard | Append a parent edit to page text |
| `PATCH /books/:id/regenerate` | PATCH | MockAuthGuard | REVIEW/FAILED → GENERATING, enqueue with feedback |
| `POST /books/:id/approve` | POST | MockAuthGuard + SubscriptionGuard | REVIEW → COMPLETED |
| `GET /books/:id/pdf` | GET | MockAuthGuard | Return an already stored PDF URL |
| `POST /books/:id/pdf` | POST | MockAuthGuard + SubscriptionGuard | Create if needed, store in MinIO, return URL |

## Database Model

```mermaid
erDiagram
    USER ||--o{ CHILD_PROFILE : owns
    USER ||--o{ BOOK : creates
    CHILD_PROFILE |o--o{ BOOK : personalizes
    BOOK ||--o{ PAGE : contains
    PAGE ||--o{ ILLUSTRATION : has

    USER {
        string id PK
        string email UK
        boolean subscriptionActive
        string preferredLlmModel
        ReasoningEffort preferredReasoningEffort
        datetime createdAt
        datetime updatedAt
    }

    CHILD_PROFILE {
        string id PK
        string name
        int age
        string gender
        string_array interests
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    BOOK {
        string id PK
        string title
        BookStatus status
        BookType type
        BookStyle style
        string llmModel
        ReasoningEffort reasoningEffort
        Tone tone
        string parentComments
        json parentFeedback
        string pdfUrl
        datetime approvedAt
        string userId FK
        string childId FK "nullable; SetNull on profile delete"
        datetime createdAt
        datetime updatedAt
    }

    PAGE {
        string id PK
        int pageNumber
        string textContent
        string bookId FK
        datetime createdAt
        datetime updatedAt
    }

    ILLUSTRATION {
        string id PK
        string url
        string prompt
        string pageId FK
        datetime createdAt
        datetime updatedAt
    }

    STORY_LIBRARY {
        string id PK
        string title UK
        string description
        string promptHint
        datetime createdAt
        datetime updatedAt
    }
```

### Enums

| Enum | Values |
|------|--------|
| BookStatus | DRAFT, GENERATING, REVIEW, COMPLETED, FAILED |
| BookType | AI_ADAPTED, MANUAL |
| BookStyle | WATERCOLOR, CARTOON, REALISTIC, PIXAR, SKETCH, MANGA, COMIC |
| Tone | WARM, EDUCATIONAL, PLAYFUL, MAGICAL, ADVENTUROUS |
| ReasoningEffort | LOW, MEDIUM, HIGH |

## Frontend Routes

### Route Group: `(auth)` — Guest-only pages

| Route | Description |
|-------|-------------|
| `/login` | Demo email/password login |
| `/signup` | Demo registration |
| `/forgot-password` | Explains the mock-auth limitation |

### Route Group: `(app)` — Authenticated pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with filters, status summary, and pagination |
| `/books/new` | Child, story, style, and tone selection |
| `/books/:id` | Status-based redirect; completed detail with PDF download |
| `/books/:id/generating` | Polling and failure/retry state |
| `/books/:id/preview` | Review, edits, regeneration, approval |
| `/profiles` | Child profile CRUD |
| `/settings` | Live generation defaults plus static account panels |
| `/notifications` | Empty-state placeholder |

### Standalone

| Route | Description |
|-------|-------------|
| `/logout` | Clears the local mock session and redirects to `/login` |
