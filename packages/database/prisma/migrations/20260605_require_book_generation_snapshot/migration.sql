-- Self-contained schema rollout for generation settings and book snapshots.
-- This migration supports databases that still reflect the pre-Task-1 schema.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReasoningEffort') THEN
    CREATE TYPE "ReasoningEffort" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'BookStatus'
      AND e.enumlabel = 'FAILED'
  ) THEN
    ALTER TYPE "BookStatus" ADD VALUE 'FAILED';
  END IF;
END
$$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "preferredLlmModel" TEXT,
ADD COLUMN IF NOT EXISTS "preferredReasoningEffort" "ReasoningEffort";

UPDATE "User"
SET
  "preferredLlmModel" = COALESCE("preferredLlmModel", 'openai:gpt-5.4-mini'),
  "preferredReasoningEffort" = COALESCE("preferredReasoningEffort", 'MEDIUM'::"ReasoningEffort")
WHERE "preferredLlmModel" IS NULL OR "preferredReasoningEffort" IS NULL;

ALTER TABLE "User"
ALTER COLUMN "preferredLlmModel" SET DEFAULT 'openai:gpt-5.4-mini',
ALTER COLUMN "preferredReasoningEffort" SET DEFAULT 'MEDIUM'::"ReasoningEffort",
ALTER COLUMN "preferredLlmModel" SET NOT NULL,
ALTER COLUMN "preferredReasoningEffort" SET NOT NULL;

ALTER TABLE "Book"
ADD COLUMN IF NOT EXISTS "llmModel" TEXT,
ADD COLUMN IF NOT EXISTS "reasoningEffort" "ReasoningEffort";

UPDATE "Book" AS b
SET
  "llmModel" = COALESCE(b."llmModel", u."preferredLlmModel", 'openai:gpt-5.4-mini'),
  "reasoningEffort" = COALESCE(b."reasoningEffort", u."preferredReasoningEffort", 'MEDIUM'::"ReasoningEffort")
FROM "User" AS u
WHERE b."userId" = u."id"
  AND (b."llmModel" IS NULL OR b."reasoningEffort" IS NULL);

UPDATE "Book"
SET
  "llmModel" = COALESCE("llmModel", 'openai:gpt-5.4-mini'),
  "reasoningEffort" = COALESCE("reasoningEffort", 'MEDIUM'::"ReasoningEffort")
WHERE "llmModel" IS NULL OR "reasoningEffort" IS NULL;

ALTER TABLE "Book"
ALTER COLUMN "llmModel" SET NOT NULL,
ALTER COLUMN "reasoningEffort" SET NOT NULL;
