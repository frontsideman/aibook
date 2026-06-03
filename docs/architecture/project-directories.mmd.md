# Project Directory Architecture

Mermaid diagrams for the three primary project directories:

- `apps/frontend` - Next.js 16 application
- `apps/backend` - NestJS API and background workers
- `packages/database` - Prisma schema and client factory

## Runtime Containers

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#e8f4ff"
    primaryBorderColor: "#1b4d89"
    primaryTextColor: "#172033"
    secondaryColor: "#fff3d8"
    tertiaryColor: "#e9f7ef"
    lineColor: "#667085"
---
flowchart LR
    Browser["User Browser"]

    subgraph Frontend["apps/frontend - Next.js 16"]
        Middleware["middleware.ts"]
        AppRoutes["src/app\nApp Router pages"]
        UIComponents["src/components\nApp shell, dashboard, books, auth, shadcn UI"]
        FrontendLib["src/lib\nview models and utilities"]
        MSW["src/mocks\nMSW handlers for frontend tests"]
        NextConfig["next.config.mjs\n/api rewrites to BACKEND_URL"]
    end

    subgraph Backend["apps/backend - NestJS"]
        Main["src/main.ts"]
        AppModule["AppModule\nConfig, BullMQ, domain modules"]
        Auth["MockAuthGuard\nrequest user injection in dev"]
        BookModule["BookModule\nBookController and BookService"]
        ChildProfileModule["ChildProfileModule"]
        StoryLibraryModule["StoryLibraryModule"]
        PaymentModule["PaymentModule\nSubscriptionGuard"]
        GenerationModule["BookGenerationModule\nBullMQ processor"]
        AiModule["AiModule\nAI story and image generation"]
        PdfModule["PdfModule\nPDF generation"]
        StorageModule["StorageModule\nobject storage integration"]
        QueueModule["QueueModule\nshared BullMQ registrations"]
        PrismaService["PrismaService\nconnects and disconnects Prisma client"]
    end

    subgraph DatabasePackage["packages/database - @repo/database"]
        PrismaFactory["index.ts\ncreatePrismaClient"]
        PrismaSchema["prisma/schema.prisma\nmodels and enums"]
        Seed["prisma/seed.ts"]
        PrismaConfig["prisma.config.ts"]
    end

    subgraph External["Runtime Dependencies"]
        Postgres[("PostgreSQL")]
        Redis[("Redis\nBullMQ")]
        ObjectStorage[("Object Storage\nMinIO or S3")]
        AIProvider["AI Provider\nstory and image APIs"]
    end

    Browser --> AppRoutes
    AppRoutes --> UIComponents
    UIComponents --> FrontendLib
    AppRoutes --> NextConfig
    NextConfig -->|"/api/* rewrite"| Main
    MSW -. "test-time API mocks" .-> AppRoutes

    Main --> AppModule
    AppModule --> Auth
    AppModule --> BookModule
    AppModule --> ChildProfileModule
    AppModule --> StoryLibraryModule
    AppModule --> PaymentModule
    AppModule --> GenerationModule
    AppModule --> AiModule
    AppModule --> PdfModule
    AppModule --> StorageModule
    AppModule --> PrismaService
    GenerationModule --> QueueModule
    GenerationModule --> Redis
    BookModule --> PaymentModule
    BookModule --> PrismaService
    ChildProfileModule --> PrismaService
    StoryLibraryModule --> PrismaService
    GenerationModule --> PrismaService
    GenerationModule --> AiModule
    GenerationModule -->|creates pages and illustrations| PrismaService
    PdfModule --> StorageModule
    StorageModule --> ObjectStorage
    AiModule --> AIProvider

    PrismaService --> PrismaFactory
    PrismaFactory --> PrismaSchema
    PrismaFactory -->|driver adapter pg pool| Postgres
    PrismaConfig --> PrismaSchema
    Seed --> PrismaFactory
```

## Main Book Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as apps/frontend
    participant API as apps/backend BookController
    participant Guard as MockAuthGuard and SubscriptionGuard
    participant Book as BookService
    participant Queue as BullMQ book-generation queue
    participant Worker as BookProcessor
    participant AI as AiService
    participant DB as packages/database Prisma client
    participant PDF as PdfService
    participant Storage as StorageService

    User->>FE: Create book from UI
    FE->>API: POST /api/books/generate
    API->>Guard: Authenticate mock user and check subscription
    Guard-->>API: user id and access decision
    API->>Book: createAndGenerate(dto, userId)
    Book->>DB: Create Book with GENERATING status
    Book->>Queue: Enqueue book-generation job
    API-->>FE: Book response

    Queue-->>Worker: Process bookId
    Worker->>DB: Load Book and ChildProfile
    Worker->>AI: Generate story text
    AI-->>Worker: Page text
    loop For each page
        Worker->>DB: Create Page
        Worker->>AI: Generate illustration
        AI-->>Worker: image URL
        Worker->>DB: Create Illustration
    end
    Worker->>DB: Update Book status to REVIEW

    User->>FE: Approve book
    FE->>API: POST /api/books/:id/approve
    API->>Guard: Check subscription
    API->>Book: approveBook(id, userId)
    Book->>PDF: Generate PDF from pages and illustrations
    PDF->>Storage: Store generated PDF
    Storage-->>PDF: pdfUrl
    Book->>DB: Save pdfUrl and approval data
    API-->>FE: Approved book with PDF URL
```

## Database Model

```mermaid
erDiagram
    USER ||--o{ CHILD_PROFILE : owns
    USER ||--o{ BOOK : creates
    CHILD_PROFILE ||--o{ BOOK : personalizes
    BOOK ||--o{ PAGE : contains
    PAGE ||--o{ ILLUSTRATION : has

    USER {
        string id PK
        string email UK
        boolean subscriptionActive
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
        Tone tone
        string parentComments
        json parentFeedback
        string pdfUrl
        datetime approvedAt
        string userId FK
        string childId FK
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

## Combined Export View

Single Mermaid block for export in Mermaid Live Editor. This uses one `flowchart`
because Mermaid does not allow `flowchart`, `sequenceDiagram`, and `erDiagram`
syntax to be mixed inside the same diagram block.

```mermaid
---
config:
  theme: base
  themeVariables:
    primaryColor: "#e8f4ff"
    primaryBorderColor: "#1b4d89"
    primaryTextColor: "#172033"
    secondaryColor: "#fff3d8"
    tertiaryColor: "#e9f7ef"
    lineColor: "#667085"
---
flowchart TD
    Browser["User Browser"]

    subgraph Frontend["apps/frontend - Next.js 16"]
        Middleware["middleware.ts"]
        AppRoutes["src/app<br/>App Router pages"]
        UIComponents["src/components<br/>App shell, dashboard, books, auth, shadcn UI"]
        FrontendLib["src/lib<br/>View models and utilities"]
        MSW["src/mocks<br/>MSW handlers for frontend tests"]
        NextConfig["next.config.mjs<br/>/api rewrites to BACKEND_URL"]
    end

    subgraph Backend["apps/backend - NestJS"]
        Main["src/main.ts"]
        AppModule["AppModule<br/>Config, BullMQ, domain modules"]
        Auth["MockAuthGuard<br/>Request user injection in dev"]
        BookModule["BookModule<br/>BookController and BookService"]
        ChildProfileModule["ChildProfileModule"]
        StoryLibraryModule["StoryLibraryModule"]
        PaymentModule["PaymentModule<br/>SubscriptionGuard"]
        GenerationModule["BookGenerationModule<br/>BullMQ processor"]
        AiModule["AiModule<br/>AI story and image generation"]
        PdfModule["PdfModule<br/>PDF generation"]
        StorageModule["StorageModule<br/>Object storage integration"]
        QueueModule["QueueModule<br/>Shared BullMQ registrations"]
        PrismaService["PrismaService<br/>Connects and disconnects Prisma client"]
    end

    subgraph DatabasePackage["packages/database - @repo/database"]
        PrismaFactory["index.ts<br/>createPrismaClient"]
        PrismaSchema["prisma/schema.prisma<br/>Models and enums"]
        Seed["prisma/seed.ts"]
        PrismaConfig["prisma.config.ts"]
    end

    subgraph External["Runtime Dependencies"]
        Postgres[("PostgreSQL")]
        Redis[("Redis<br/>BullMQ")]
        ObjectStorage[("Object Storage<br/>MinIO or S3")]
        AIProvider["AI Provider<br/>Story and image APIs"]
    end

    subgraph BookFlow["Main Book Flow"]
        FlowCreate["1. User creates book in UI"]
        FlowGenerate["2. POST /api/books/generate"]
        FlowGuard["3. MockAuthGuard and SubscriptionGuard<br/>authenticate and authorize"]
        FlowCreateBook["4. BookService creates Book<br/>with GENERATING status"]
        FlowQueue["5. Enqueue book-generation job"]
        FlowWorker["6. BookProcessor loads Book and ChildProfile"]
        FlowStory["7. AiService generates story text"]
        FlowPages["8. For each page<br/>create Page, generate illustration, create Illustration"]
        FlowReview["9. Update Book status to REVIEW"]
        FlowApprove["10. User approves book<br/>POST /api/books/:id/approve"]
        FlowPdf["11. PdfService generates PDF"]
        FlowStore["12. StorageService stores PDF"]
        FlowApproved["13. Save pdfUrl and approval data"]
    end

    subgraph DataModel["Database Model"]
        UserModel["USER<br/>id PK<br/>email UK<br/>subscriptionActive<br/>createdAt<br/>updatedAt"]
        ChildProfileModel["CHILD_PROFILE<br/>id PK<br/>name<br/>age<br/>gender<br/>interests<br/>userId FK"]
        BookModel["BOOK<br/>id PK<br/>title<br/>status BookStatus<br/>type BookType<br/>style BookStyle<br/>tone<br/>parentComments<br/>parentFeedback<br/>pdfUrl<br/>approvedAt<br/>userId FK<br/>childId FK"]
        PageModel["PAGE<br/>id PK<br/>pageNumber<br/>textContent<br/>bookId FK"]
        IllustrationModel["ILLUSTRATION<br/>id PK<br/>url<br/>prompt<br/>pageId FK"]
        StoryLibraryModel["STORY_LIBRARY<br/>id PK<br/>title UK<br/>description<br/>promptHint"]
    end

    Browser --> AppRoutes
    Middleware --> AppRoutes
    AppRoutes --> UIComponents
    UIComponents --> FrontendLib
    AppRoutes --> NextConfig
    NextConfig -->|"/api/* rewrite"| Main
    MSW -. "test-time API mocks" .-> AppRoutes

    Main --> AppModule
    AppModule --> Auth
    AppModule --> BookModule
    AppModule --> ChildProfileModule
    AppModule --> StoryLibraryModule
    AppModule --> PaymentModule
    AppModule --> GenerationModule
    AppModule --> AiModule
    AppModule --> PdfModule
    AppModule --> StorageModule
    AppModule --> PrismaService
    GenerationModule --> QueueModule
    GenerationModule --> Redis
    BookModule --> PaymentModule
    BookModule --> PrismaService
    ChildProfileModule --> PrismaService
    StoryLibraryModule --> PrismaService
    GenerationModule --> PrismaService
    GenerationModule --> AiModule
    PdfModule --> StorageModule
    StorageModule --> ObjectStorage
    AiModule --> AIProvider

    PrismaService --> PrismaFactory
    PrismaFactory --> PrismaSchema
    PrismaFactory -->|driver adapter pg pool| Postgres
    PrismaConfig --> PrismaSchema
    Seed --> PrismaFactory

    FlowCreate --> FlowGenerate --> FlowGuard --> FlowCreateBook --> FlowQueue
    FlowQueue --> FlowWorker --> FlowStory --> FlowPages --> FlowReview
    FlowReview --> FlowApprove --> FlowPdf --> FlowStore --> FlowApproved

    FlowGenerate -. "handled by" .-> BookModule
    FlowGuard -. "uses" .-> Auth
    FlowCreateBook -. "writes" .-> BookModel
    FlowQueue -. "uses" .-> QueueModule
    FlowWorker -. "runs in" .-> GenerationModule
    FlowStory -. "uses" .-> AiModule
    FlowPages -. "writes" .-> PageModel
    FlowPages -. "writes" .-> IllustrationModel
    FlowPdf -. "uses" .-> PdfModule
    FlowStore -. "uses" .-> StorageModule
    FlowApproved -. "updates" .-> BookModel

    UserModel -->|owns| ChildProfileModel
    UserModel -->|creates| BookModel
    ChildProfileModel -->|personalizes| BookModel
    BookModel -->|contains| PageModel
    PageModel -->|has| IllustrationModel
    StoryLibraryModel -. "independent catalog table" .-> BookModel
```

## Notes

- `apps/frontend/next.config.mjs` rewrites `/api/:path*` to the backend URL, so browser-facing API calls stay relative.
- `apps/backend/src/prisma.service.ts` imports `createPrismaClient()` from `@repo/database` and explicitly disconnects it during NestJS shutdown.
- `packages/database/index.ts` creates Prisma with `@prisma/adapter-pg` and a `pg` pool; the schema is the source of the generated Prisma types and enums.
- `StoryLibrary` is currently an independent lookup/catalog table in the schema, not a relation from `Book`.
