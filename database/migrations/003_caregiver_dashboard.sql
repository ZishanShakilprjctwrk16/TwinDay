USE twinday;

CREATE TABLE IF NOT EXISTS caregiver_relationships (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id INT UNSIGNED NOT NULL,
  caregiver_id INT UNSIGNED NOT NULL,
  permission ENUM('viewer', 'caregiver') NOT NULL DEFAULT 'viewer',
  status ENUM('pending', 'active', 'revoked') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_caregiver_relationship (owner_id, caregiver_id),
  KEY idx_caregiver_owner (owner_id),
  KEY idx_caregiver_user (caregiver_id),
  CONSTRAINT fk_caregiver_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_caregiver_user FOREIGN KEY (caregiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
