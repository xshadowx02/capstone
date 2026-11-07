-- Local Ledge Database Schema

CREATE TABLE IF NOT EXISTS cardholders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    card_number VARCHAR(20) NOT NULL,
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 100000.00,
    location VARCHAR(255) DEFAULT 'Makati, Metro Manila',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS statement_lines (
    id SERIAL PRIMARY KEY,
    cardholder_id INTEGER REFERENCES cardholders(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    merchant_name VARCHAR(255) NOT NULL,
    merchant_category_code VARCHAR(10),
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT,
    raw_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorizations (
    id SERIAL PRIMARY KEY,
    statement_line_id INTEGER REFERENCES statement_lines(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    confidence NUMERIC(5, 4) NOT NULL DEFAULT 0.0,
    reasoning TEXT,
    rag_context TEXT,
    guardrail_passed BOOLEAN DEFAULT TRUE,
    guardrail_flags TEXT,
    eval_score NUMERIC(5, 4),
    eval_feedback TEXT,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_settings (
    id SERIAL PRIMARY KEY,
    cardholder_id INTEGER REFERENCES cardholders(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    monthly_limit NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(cardholder_id, category)
);

CREATE TABLE IF NOT EXISTS store_visits (
    id SERIAL PRIMARY KEY,
    cardholder_id INTEGER REFERENCES cardholders(id),
    merchant_name VARCHAR(255) NOT NULL,
    visit_count INTEGER DEFAULT 1,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    last_visit DATE,
    UNIQUE(cardholder_id, merchant_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_statement_lines_cardholder ON statement_lines(cardholder_id);
CREATE INDEX IF NOT EXISTS idx_statement_lines_date ON statement_lines(transaction_date);
CREATE INDEX IF NOT EXISTS idx_categorizations_line ON categorizations(statement_line_id);
CREATE INDEX IF NOT EXISTS idx_store_visits_cardholder ON store_visits(cardholder_id, visit_count DESC);

-- Default cardholder (Makati)
INSERT INTO cardholders (name, card_number, credit_limit, location)
VALUES ('Maria Santos', '**** **** **** 4217', 150000.00, 'Makati, Metro Manila')
ON CONFLICT DO NOTHING;

-- Default budget settings
INSERT INTO budget_settings (cardholder_id, category, monthly_limit) VALUES
(1, 'Food & Dining', 15000.00),
(1, 'Groceries', 12000.00),
(1, 'Transportation', 5000.00),
(1, 'Shopping', 20000.00),
(1, 'Entertainment', 5000.00),
(1, 'Health & Wellness', 8000.00),
(1, 'Bills & Utilities', 10000.00),
(1, 'Travel', 15000.00),
(1, 'Education', 5000.00),
(1, 'Other', 5000.00)
ON CONFLICT DO NOTHING;
