-- V18 introduced additional demo accounts with the obsolete seed hash.
-- Only repair untouched demo credentials; never overwrite a changed password.
UPDATE users
SET password_hash = '$2a$10$pHAV5HwX4DkqioHT1e0NDuYzAV/X1XC8xW432SEcBE1ACgVDXc4SO'
WHERE email IN (
    'hr.tech@tttn.com',
    'hr.sales@tttn.com',
    'candidate1@tttn.com',
    'candidate2@tttn.com',
    'candidate3@tttn.com'
)
  AND password_hash = '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa';
