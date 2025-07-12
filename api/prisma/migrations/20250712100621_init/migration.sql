-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "special_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "year" TEXT NOT NULL,
    "competition_id" TEXT NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" SERIAL NOT NULL,
    "special_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "country" TEXT,
    "country_code" TEXT,
    "seasonId" INTEGER NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "special_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "competitorId" INTEGER NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistique" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "competitorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statistique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatistique" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerStatistique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerStatsAIAdvice" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "advice" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerStatsAIAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorStatsAdvice" (
    "id" SERIAL NOT NULL,
    "competitorId" INTEGER NOT NULL,
    "advice" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorStatsAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpcomingMatch" (
    "id" SERIAL NOT NULL,
    "special_id" TEXT NOT NULL,
    "homeCompetitorId" INTEGER NOT NULL,
    "awayCompetitorId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpcomingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_special_id_key" ON "Season"("special_id");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_special_id_key" ON "Competitor"("special_id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_special_id_key" ON "Player"("special_id");

-- CreateIndex
CREATE UNIQUE INDEX "UpcomingMatch_special_id_key" ON "UpcomingMatch"("special_id");

-- AddForeignKey
ALTER TABLE "Competitor" ADD CONSTRAINT "Competitor_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statistique" ADD CONSTRAINT "Statistique_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatistique" ADD CONSTRAINT "PlayerStatistique_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerStatsAIAdvice" ADD CONSTRAINT "PlayerStatsAIAdvice_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorStatsAdvice" ADD CONSTRAINT "CompetitorStatsAdvice_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingMatch" ADD CONSTRAINT "UpcomingMatch_homeCompetitorId_fkey" FOREIGN KEY ("homeCompetitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingMatch" ADD CONSTRAINT "UpcomingMatch_awayCompetitorId_fkey" FOREIGN KEY ("awayCompetitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpcomingMatch" ADD CONSTRAINT "UpcomingMatch_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
