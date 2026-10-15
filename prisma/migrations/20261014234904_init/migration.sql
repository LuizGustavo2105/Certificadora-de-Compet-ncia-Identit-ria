-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMIN', 'COORDENADOR');

-- CreateEnum
CREATE TYPE "StatusVoluntario" AS ENUM ('PENDENTE', 'APROVADO', 'ATIVO', 'DESLIGADO');

-- CreateEnum
CREATE TYPE "StatusOficina" AS ENUM ('PLANEJADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PapelParticipacao" AS ENUM ('MINISTRANTE', 'APOIO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'COORDENADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voluntario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "ra" TEXT,
    "curso" TEXT,
    "periodo" INTEGER,
    "interesses" TEXT[],
    "status" "StatusVoluntario" NOT NULL DEFAULT 'PENDENTE',
    "dataEntrada" TIMESTAMP(3),
    "dataSaida" TIMESTAMP(3),
    "consentimentoLgpd" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voluntario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disponibilidade" (
    "id" TEXT NOT NULL,
    "voluntarioId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,

    CONSTRAINT "Disponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oficina" (
    "id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "cargaHoraria" DOUBLE PRECISION NOT NULL,
    "status" "StatusOficina" NOT NULL DEFAULT 'PLANEJADA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Oficina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participacao" (
    "id" TEXT NOT NULL,
    "voluntarioId" TEXT NOT NULL,
    "oficinaId" TEXT NOT NULL,
    "papel" "PapelParticipacao" NOT NULL DEFAULT 'MINISTRANTE',
    "horasValidas" DOUBLE PRECISION NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistorico" (
    "id" TEXT NOT NULL,
    "voluntarioId" TEXT NOT NULL,
    "de" "StatusVoluntario" NOT NULL,
    "para" "StatusVoluntario" NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "observacao" TEXT,
    "em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermoVoluntariado" (
    "id" TEXT NOT NULL,
    "voluntarioId" TEXT NOT NULL,
    "geradoPorId" TEXT NOT NULL,
    "totalHoras" DOUBLE PRECISION NOT NULL,
    "hashValidacao" TEXT NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermoVoluntariado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Voluntario_email_key" ON "Voluntario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Voluntario_ra_key" ON "Voluntario"("ra");

-- CreateIndex
CREATE INDEX "Voluntario_status_idx" ON "Voluntario"("status");

-- CreateIndex
CREATE INDEX "Disponibilidade_voluntarioId_diaSemana_idx" ON "Disponibilidade"("voluntarioId", "diaSemana");

-- CreateIndex
CREATE INDEX "Oficina_data_idx" ON "Oficina"("data");

-- CreateIndex
CREATE INDEX "Participacao_oficinaId_idx" ON "Participacao"("oficinaId");

-- CreateIndex
CREATE UNIQUE INDEX "Participacao_voluntarioId_oficinaId_key" ON "Participacao"("voluntarioId", "oficinaId");

-- CreateIndex
CREATE INDEX "StatusHistorico_voluntarioId_em_idx" ON "StatusHistorico"("voluntarioId", "em");

-- CreateIndex
CREATE UNIQUE INDEX "TermoVoluntariado_hashValidacao_key" ON "TermoVoluntariado"("hashValidacao");

-- CreateIndex
CREATE INDEX "TermoVoluntariado_voluntarioId_idx" ON "TermoVoluntariado"("voluntarioId");

-- AddForeignKey
ALTER TABLE "Disponibilidade" ADD CONSTRAINT "Disponibilidade_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_oficinaId_fkey" FOREIGN KEY ("oficinaId") REFERENCES "Oficina"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistorico" ADD CONSTRAINT "StatusHistorico_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistorico" ADD CONSTRAINT "StatusHistorico_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermoVoluntariado" ADD CONSTRAINT "TermoVoluntariado_voluntarioId_fkey" FOREIGN KEY ("voluntarioId") REFERENCES "Voluntario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermoVoluntariado" ADD CONSTRAINT "TermoVoluntariado_geradoPorId_fkey" FOREIGN KEY ("geradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
