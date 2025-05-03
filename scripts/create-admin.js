// Script to create an admin user

const { Pool } = require('@neondatabase/serverless');
const prompt = require('prompt-sync')({ sigint: true });
const crypto = require('crypto');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString("hex")}.${salt}`);
    });
  });
}

async function createAdminUser() {
  console.log("Create Admin User");
  console.log("=================");
  
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  
  const username = prompt("Username: ");
  const email = prompt("Email: ");
  const password = prompt("Password: ", { echo: '*' });
  const confirmPassword = prompt("Confirm Password: ", { echo: '*' });
  
  if (password !== confirmPassword) {
    console.error("Passwords do not match");
    process.exit(1);
  }
  
  if (password.length < 8) {
    console.error("Password must be at least 8 characters long");
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if user exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    
    if (userCheck.rowCount > 0) {
      console.error("Username or email already exists");
      process.exit(1);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, 'admin') 
       RETURNING id, username, email, role`,
      [username, email, hashedPassword]
    );
    
    console.log("\nAdmin user created successfully:");
    console.log(`ID: ${result.rows[0].id}`);
    console.log(`Username: ${result.rows[0].username}`);
    console.log(`Email: ${result.rows[0].email}`);
    console.log(`Role: ${result.rows[0].role}`);
    
  } catch (err) {
    console.error("Error creating admin user:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdminUser().catch(console.error);