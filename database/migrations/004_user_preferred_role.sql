USE twinday;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_role ENUM('student', 'employee', 'business', 'specialCare') NULL AFTER status;
