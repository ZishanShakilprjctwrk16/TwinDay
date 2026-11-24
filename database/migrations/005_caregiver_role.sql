USE twinday;

ALTER TABLE users
  MODIFY COLUMN preferred_role ENUM('student', 'employee', 'business', 'specialCare', 'caregiver') NULL;
