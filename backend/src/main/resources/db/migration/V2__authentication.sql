ALTER TABLE users ADD COLUMN email VARCHAR(255);
ALTER TABLE users ADD COLUMN password_hash VARCHAR(100);
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);

UPDATE users SET email = 'test@test.com' WHERE username = 'demo';

CREATE TABLE auth_sessions (
    token      VARCHAR(36) PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions (user_id);
CREATE INDEX idx_auth_sessions_expiry ON auth_sessions (expires_at);
