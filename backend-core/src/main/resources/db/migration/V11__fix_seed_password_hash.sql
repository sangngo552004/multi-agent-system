-- The original seed comment said password123, but its BCrypt hash did not match that value.
-- Only repair untouched demo credentials; never overwrite a password that has been changed.
UPDATE users
SET password_hash = '$2a$10$pHAV5HwX4DkqioHT1e0NDuYzAV/X1XC8xW432SEcBE1ACgVDXc4SO'
WHERE email IN ('admin@tttn.com', 'hr@tttn.com', 'candidate@tttn.com')
  AND password_hash = '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa';
