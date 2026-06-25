-- =============================================================
--  PROHORECA — Migracija: dodaje kartice TERENI
--  Pokreni SAMO ako si VEĆ importovao prohoreca_baza.sql ranije.
--  phpMyAdmin → odaberi svoju bazu → Import → ovaj fajl.
--  (Bezbedno je — ne dira postojeće podatke.)
-- =============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `tereni` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `teren_date` DATE NOT NULL,
  `month`      CHAR(7) NOT NULL,
  `location`   VARCHAR(255) NOT NULL DEFAULT '',
  `note`       TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_teren_month` (`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `teren_workers` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `teren_id`    INT UNSIGNED NOT NULL,
  `employee_id` INT UNSIGNED NOT NULL,
  `systems`     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  UNIQUE KEY `uq_tw` (`teren_id`, `employee_id`),
  CONSTRAINT `fk_tw_teren` FOREIGN KEY (`teren_id`)
    REFERENCES `tereni`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tw_emp` FOREIGN KEY (`employee_id`)
    REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
