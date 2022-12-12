/*
  Warnings:

  - Added the required column `score` to the `Urls` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL,
    "score" REAL NOT NULL
);
INSERT INTO "new_Urls" ("checked", "id", "url") SELECT "checked", "id", "url" FROM "Urls";
DROP TABLE "Urls";
ALTER TABLE "new_Urls" RENAME TO "Urls";
CREATE UNIQUE INDEX "Urls_url_key" ON "Urls"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
