-- Keep books when a child profile is deleted.
-- The UI promises that existing books remain available after profile deletion.

ALTER TABLE "Book" DROP CONSTRAINT IF EXISTS "Book_childId_fkey";

ALTER TABLE "Book" ALTER COLUMN "childId" DROP NOT NULL;

ALTER TABLE "Book"
  ADD CONSTRAINT "Book_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "ChildProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
