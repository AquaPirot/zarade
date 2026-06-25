-- =============================================================
--  PROHORECA — Migracija: dodaje polje teren_naknada
--  Pokreni SAMO ako si VEĆ importovao prohoreca_baza.sql ranije.
--  phpMyAdmin → odaberi svoju bazu → Import → ovaj fajl.
--  (Bezbedno je — ne dira postojeće podatke, nula je podrazumevana.)
-- =============================================================

SET NAMES utf8mb4;

ALTER TABLE `employees`
  ADD COLUMN IF NOT EXISTS `teren_naknada` DECIMAL(12,2) NOT NULL DEFAULT 0.00
    COMMENT 'Fiksna naknada po odlasku na teren (RSD)';
