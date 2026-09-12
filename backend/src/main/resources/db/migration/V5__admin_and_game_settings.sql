ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';
ALTER TABLE game_rounds ADD COLUMN theme_max_multiplier NUMERIC(10,2) NOT NULL DEFAULT 100.00;

CREATE TABLE game_settings (
    id                    INTEGER PRIMARY KEY,
    green_max_multiplier  NUMERIC(10,2) NOT NULL,
    red_max_multiplier    NUMERIC(10,2) NOT NULL,
    multiplier_growth_rate NUMERIC(10,4) NOT NULL,
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO game_settings (
    id,
    green_max_multiplier,
    red_max_multiplier,
    multiplier_growth_rate
) VALUES (1, 10.00, 25.00, 0.1200);
