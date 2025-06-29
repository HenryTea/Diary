import mysql from 'mysql2/promise';

async function createIpTrackingTable() {
  try {
    // Use the Railway database URL directly
    const DATABASE_URL = 'mysql://root:bCezukLBvzeVDhFHUsbJkraTBNcmnCSi@maglev.proxy.rlwy.net:55569/railway';
    const connection = await mysql.createConnection(DATABASE_URL);
    
    console.log('Connected to Railway database');
    
    // Check if known_ips table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'known_ips'
    `);
    
    if (tables.length === 0) {
      console.log('Creating known_ips table...');
      await connection.execute(`
        CREATE TABLE known_ips (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ip_address VARCHAR(45) NOT NULL UNIQUE,
          is_trusted BOOLEAN DEFAULT FALSE,
          first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          notes TEXT,
          INDEX idx_ip (ip_address),
          INDEX idx_trusted (is_trusted)
        )
      `);
      console.log('✅ Created known_ips table');
    } else {
      console.log('✅ known_ips table already exists');
    }
    
    console.log('\n🎉 IP tracking table setup completed successfully!');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error setting up IP tracking table:', error);
    process.exit(1);
  }
}

createIpTrackingTable();
