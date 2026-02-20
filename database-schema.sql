-- 1. Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    image_url TEXT,
    receipt TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    qualification VARCHAR(255),
    image_url TEXT,
    bio TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Jobs Table (Linked to Schools)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    actor VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    target_id VARCHAR(255),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Insert Sample Data
INSERT INTO schools (name, location, image_url) VALUES
('Divine Heights Academy', 'Abeokuta South', 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400'),
('Covenant Success College', 'Sango Ota', 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400');

INSERT INTO gallery (title, image_url, caption) VALUES
('NAPPS Annual Conference', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', 'Members at the annual conference.');