-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'STOREUSER', 'NORMALUSER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'NORMALUSER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
