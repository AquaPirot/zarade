-- =============================================================
--  PROHORECA — Obračun zarada
--  Baza podataka · AG GROUP
--  Import: phpMyAdmin → odaberi bazu → Import → ovaj fajl
-- =============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
-- Podešavanja aplikacije
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key_name`   VARCHAR(100) NOT NULL,
  `value`      TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_key` (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`key_name`, `value`) VALUES
  ('app_name',          'Prohoreca'),
  ('eur_rate',          '117.5'),
  ('pergola_bonus_eur', '10')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- -----------------------------------------------------------
-- Radnici
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `employees` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`           VARCHAR(200) NOT NULL,
  `agreed_salary`  DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- mesecna plata RSD
  `dnevnica`       DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- dnevnica RSD
  `active`         TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Prisustvo (kalendar po danima)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT UNSIGNED NOT NULL,
  `month`       CHAR(7) NOT NULL,      -- format YYYY-MM
  `day`         TINYINT UNSIGNED NOT NULL,  -- 1–31
  `state`       ENUM('worked','off') DEFAULT NULL,  -- NULL = podrazumevano (pon–pet radi)
  `note`        TEXT,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_att` (`employee_id`, `month`, `day`),
  CONSTRAINT `fk_att_emp` FOREIGN KEY (`employee_id`)
    REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Mesecni obracuni (dnevnice + pergole)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `monthly_records` (
  `id`            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id`   INT UNSIGNED NOT NULL,
  `month`         CHAR(7) NOT NULL,
  `num_dnevnica`  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `num_pergola`   DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `note`          TEXT,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_rec` (`employee_id`, `month`),
  CONSTRAINT `fk_rec_emp` FOREIGN KEY (`employee_id`)
    REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Isplate
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `employee_id`  INT UNSIGNED NOT NULL,
  `month`        CHAR(7) NOT NULL,
  `amount`       DECIMAL(12,2) NOT NULL,
  `payment_date` DATE,
  `method`       ENUM('cash','bank','other') NOT NULL DEFAULT 'cash',
  `note`         TEXT,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pay_emp` FOREIGN KEY (`employee_id`)
    REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------
-- Korisni VIEW-ovi (opciono — olaksavaju izvestaje)
-- -----------------------------------------------------------

-- Sve isplate po mesecu
CREATE OR REPLACE VIEW `v_monthly_payments` AS
SELECT
  p.month,
  e.name        AS employee_name,
  SUM(p.amount) AS total_paid
FROM payments p
JOIN employees e ON e.id = p.employee_id
GROUP BY p.month, p.employee_id;

-- Pregled prisustva — koliko je odrađeno dana po mesecu
CREATE OR REPLACE VIEW `v_attendance_summary` AS
SELECT
  a.employee_id,
  e.name    AS employee_name,
  a.month,
  SUM(CASE WHEN a.state = 'worked' THEN 1 ELSE 0 END) AS forced_worked,
  SUM(CASE WHEN a.state = 'off'    THEN 1 ELSE 0 END) AS forced_off,
  COUNT(*)                                              AS total_entries
FROM attendance a
JOIN employees e ON e.id = a.employee_id
GROUP BY a.employee_id, a.month;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- Napomena: aplikacija trenutno čuva podatke u localStorage
-- (browser keš). Ovaj SQL je osnova za PHP/API backend kada
-- budeš prelazio sa localStorage na pravu bazu.
-- =============================================================
