/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Urls` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Urls_url_key" ON "Urls"("url");
