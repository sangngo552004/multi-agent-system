-- Hash cho "password123": $2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa
INSERT INTO users (id, email, password_hash, full_name, role)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'hr@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'John HR', 'HR'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'candidate@tttn.com', '$2a$10$wN.H07qg22.L0d1Q7g.KyeW8i3l.6r8q0CqYnQhI3/c68w77C2mOa', 'Alice Candidate', 'CANDIDATE');

INSERT INTO jobs (id, hr_id, title, location, employment_type, description, requirements, benefits, expired_at)
VALUES
    ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Software Engineer (Java/Spring)', 'Ho Chi Minh', 'FULL_TIME',
     'We are looking for a passionate Software Engineer to join our core backend team.',
     '- 3+ years of Java/Spring Boot\n- Experience with Postgres, RabbitMQ, Docker',
     '- 13th month salary\n- Premium healthcare',
     '2026-12-31 23:59:59'),

    ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AI Engineer (Python)', 'Ha Noi', 'FULL_TIME',
     'Join our AI division to build NLP agents using LangGraph and LLMs.',
     '- Strong Python skills\n- Experience with LangChain, LangGraph\n- Vector Database (pgvector)',
     '- Flexible working hours\n- Remote options',
     '2026-10-31 23:59:59');
