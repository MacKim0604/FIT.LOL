-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LEADER', 'MEMBER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "oidcSub" TEXT,
    "username" TEXT,
    "email" TEXT,
    "role" "Role",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summoner" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "puuid" TEXT NOT NULL,
    "summonerName" TEXT,
    "summonerLevel" INTEGER,
    "profileIconId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summoner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "matchId" TEXT NOT NULL,
    "gameStartTimestamp" BIGINT,
    "gameDuration" INTEGER,
    "queueId" INTEGER,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("matchId")
);

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "riotIdName" TEXT,
    "riotIdTagline" TEXT,
    "kills" INTEGER,
    "deaths" INTEGER,
    "assists" INTEGER,
    "kda" TEXT,
    "championName" TEXT,
    "win" BOOLEAN,
    "totalDamageDealtToChampions" INTEGER,
    "goldEarned" INTEGER,
    "totalMinionsKilled" INTEGER,
    "visionScore" INTEGER,
    "teamPosition" TEXT,
    "lane" TEXT,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionCursor" (
    "id" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "lastMatchTimestamp" BIGINT,
    "lastMatchId" TEXT,
    "lastFetchedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestionCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "jobId" TEXT,
    "status" TEXT NOT NULL,
    "puuid" TEXT,
    "matchId" TEXT,
    "errorMsg" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_oidcSub_key" ON "User"("oidcSub");

-- CreateIndex
CREATE UNIQUE INDEX "Summoner_puuid_key" ON "Summoner"("puuid");

-- CreateIndex
CREATE UNIQUE INDEX "MatchParticipant_matchId_puuid_key" ON "MatchParticipant"("matchId", "puuid");

-- CreateIndex
CREATE UNIQUE INDEX "IngestionCursor_puuid_key" ON "IngestionCursor"("puuid");

-- CreateIndex
CREATE INDEX "JobLog_jobType_status_idx" ON "JobLog"("jobType", "status");

-- CreateIndex
CREATE INDEX "JobLog_puuid_idx" ON "JobLog"("puuid");

-- AddForeignKey
ALTER TABLE "Summoner" ADD CONSTRAINT "Summoner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("matchId") ON DELETE RESTRICT ON UPDATE CASCADE;
