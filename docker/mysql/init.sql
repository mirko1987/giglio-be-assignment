-- MySQL initialization script for NestJS Order System
-- This script runs when the MySQL container starts for the first time

-- Create the main database (already created by environment variable)
-- CREATE DATABASE IF NOT EXISTS order_system;

-- Create additional databases for testing
CREATE DATABASE IF NOT EXISTS order_system_test;

-- Grant privileges to the nestjs user
GRANT ALL PRIVILEGES ON order_system.* TO 'nestjs'@'%';
GRANT ALL PRIVILEGES ON order_system_test.* TO 'nestjs'@'%';

-- Create indexes for better performance (will be created by TypeORM, but good to have)
-- These will be applied after tables are created by TypeORM

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Display databases and users for verification
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'nestjs';
