# Design Document: Children's Book SaaS (pixellabel.com)

**Date:** 2026-05-15  
**Status:** Draft for Review  
**Architecture:** Monorepo (NestJS Backend, NextJS Frontend)

## 1. Executive Summary
A SAAS platform for creating customized, AI-generated children's books (3-20 pages, A3 format). Features include persistent child profiles, style presets, and two distinct creation flows (AI-adapted known stories and manual user-provided stories).

## 2. System Architecture
### 2.1 Technical Stack
- **Backend:** NestJS (Node.js)
- **Frontend:** NextJS (React)
- **ORM:** Prisma with PostgreSQL
- **Queue:** BullMQ with Redis
- **Storage:** S3-compatible (Minio for local/test)
- **Auth:** Google OAuth
- **Payments:** Stripe or Paddle

## 3. Data Model
### 3.1 Primary Entities
- **User:** Email, GoogleID, SubscriptionStatus.
- **ChildProfile:** Name, Age, Gender, Interests, Photos (S3 links).
- **Book:** 
  - Title, Status (`DRAFT`, `AWAITING_INPUT`, `GENERATING`, `REVIEW`, `COMPLETED`).
  - Type (`AI_ADAPTED` vs `MANUAL`).
  - Settings (Mood: Funny/Sad; Style: Rainbow/B&W/Unicorn/Manga/Comic).
- **Page:** PageNumber, TextContent, BookID.
- **Illustration:** URL, Prompt, PageID. (Multiple illustrations per page supported).

## 4. Creation & Generation Flows
### 4.1 Mandatory Pre-Step: Child Profile
- Before starting Flow A or Flow B, the user MUST select a `ChildProfile`.
- If no profile exists or is incomplete, the system redirects to a creation/fulfillment dialog.
- The `ChildProfile` (name, age, interests, photos) is injected into the context of all AI prompts.

### 4.2 Flow A: AI-Adapted (Known Story)
1. User provides a story name/theme (AI Knowledge-Based).
2. System adapts the story to the child's context and chosen Style/Mood.
3. **Manga/Comic Logic:** If "Manga" or "Comic" style is chosen, the system uses a specialized prompting engine to generate multi-panel descriptions or style-consistent prompts to maintain character stability across multiple illustrations per page.

### 4.3 Flow B: Manual Story
1. User provides full story text and/or images.
2. System organizes content into the 3-20 page A3 layout using the selected Child Profile context for any AI-assisted layout/cleanup.

## 5. Testing & Verification Strategy
### 5.1 Tools
- **Unit/Integration:** `next/jest` for Next.js and standard Jest for NestJS.
- **Mocks:** Mock Service Worker (MSW) for API mocking and `jest-mock-extended` for service-level mocks.
- **Environment:** Mock AI services for deterministic testing.

### 5.2 Unit Tests
- **Redirection Logic:** Verify users are sent to profile creation if none exists.
- **Manga Prompting:** Test the specialized prompt generator for style consistency.
- **Multi-Illustration:** Ensure 1:N relationship between Pages and Illustrations is handled correctly.

## 6. Gallery & Discovery
- **Search/Filter:** 10 books per page.
- **Review Phase:** Parent can request full redo or granular edits before PDF finalization.

## 7. Success Criteria
- Generation of 20-page A3 PDF with character consistency.
- Successful redirection/fulfillment of child profiles.
- 90%+ test coverage using MSW and Jest.
