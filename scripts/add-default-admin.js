// Script to create a default admin user for testing

import { Pool, neonConfig } from '@neondatabase/serverless';
import crypto from 'crypto';
import ws from 'ws';

// Set websocket for serverless
neonConfig.webSocketConstructor = ws;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString("hex")}.${salt}`);
    });
  });
}

async function createDefaultAdmin() {
  console.log("Creating default admin user...");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  
  // Default admin credentials - for development only
  const admin = {
    username: "admin",
    email: "admin@example.com",
    password: "admin123456"
  };
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if admin user already exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [admin.username, admin.email]
    );
    
    if (userCheck.rowCount > 0) {
      console.log("Admin user already exists.");
      process.exit(0);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(admin.password);
    
    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, 'admin') 
       RETURNING id, username, email, role`,
      [admin.username, admin.email, hashedPassword]
    );
    
    console.log("\nDefault admin user created successfully:");
    console.log(`Username: ${result.rows[0].username}`);
    console.log(`Password: ${admin.password}`);
    console.log(`Role: ${result.rows[0].role}`);
    console.log("\nIMPORTANT: This is a development account. Please change the password in production.");
    
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDefaultAdmin().catch(console.error);