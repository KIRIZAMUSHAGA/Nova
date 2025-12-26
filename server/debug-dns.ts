
import pg from "pg";
const { Client } = pg;

async function testConnection() {
  console.log("--- DNS DEBUG TEST ---");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  console.log("PGHOST:", process.env.PGHOST);
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Attempting to connect to host:", process.env.PGHOST);
    await client.connect();
    console.log("✅ SUCCESS: Connected to database");
    const res = await client.query('SELECT NOW()');
    console.log("Query result:", res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error("❌ FAILURE: Connection failed");
    console.error("Error code:", err.code);
    console.error("Error message:", err.message);
    console.error("Full error stack:", err.stack);
    
    if (err.code === 'EAI_AGAIN') {
      console.log("\n--- DIAGNOSIS: EAI_AGAIN DETECTED ---");
      console.log("The system cannot resolve the hostname of your database.");
      console.log("This is often caused by Replit's production environment isolation.");
    }
  }
}

testConnection();
