import * as dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

// Muat variabel dari file .env (DB_HOST, DB_PORT, DB_USERNAME, dll)
dotenv.config();

// fungsi runSeed untuk membuka koneksi ke database
async function runSeed() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_DATABASE || 'nft-marketplace';
  //Membuat koneksi ke database
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    // Ambil password dari .env dan hash menggunakan bcrypt dgn salt round : 10
    const rawPassword = process.env.ORGANIZER_SEED_PASSWORD || 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    //  Seed table users (Akun login untuk masing-masing Organizer)
    console.log('🌱 Seeding users for organizers...');
    await connection.query(`
            INSERT INTO users (id, name, email, password, created_at, updated_at)
            VALUES
            (10, 'Admin Event Master Pro', 'admin@eventmaster.com', '${hashedPassword}', NOW(), NOW()),
            (11, 'Admin Konserindo', 'admin@konserindo.com', '${hashedPassword}', NOW(), NOW()),
            (12, 'Admin Jakarta Live', 'admin@jakartalive.com', '${hashedPassword}', NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                updated_at = NOW();
        `);
    console.log('✅ Users for organizers seeded successfully');

    // Seed table organizers
    console.log('Seeding organizers...');
    await connection.query(`
            INSERT INTO organizers (id, organization_name, status, created_at, users_id)
            VALUES
            (1, 'Event Master Pro', 'Active', NOW(), 1),
            (2, 'Konserindo', 'Active', NOW(), 2),
            (3, 'Jakarta Live Entertainment', 'Active', NOW(), 3)
            ON DUPLICATE KEY UPDATE 
                organization_name = VALUES(organization_name),
                status = VALUES(status);
                
        `);
    console.log('✅ Organizers seeded successfully');

    // Seed table events
    console.log('🌱 Seeding events...');
    await connection.query(`
            INSERT INTO events (id, on_chain_event_id, event_name, start_date, venue_location, category, capacity, image_ipfs_cid, organizers_id)
            VALUES
            (1, 1, 'UBAYA Music Fest 2026', '2026-10-25 18:00:00', 'Lapangan Parkir Kampus II Tenggilis UBAYA', 'festival musik', 300, 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80', 1),
            (2, 2, 'Rock in Indonesia 2026', '2026-12-10 19:00:00', 'Gelora Bung Karno Jakarta', 'konser musik', 1000, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 2),
            (3, 3, 'Art & Tech Expo 2026', '2026-12-15 10:00:00', 'Museum Nasional Indonesia', 'pameran berbayar', 500, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 3)
            ON DUPLICATE KEY UPDATE 
                on_chain_event_id = VALUES(on_chain_event_id),
                event_name = VALUES(event_name),
                start_date = VALUES(start_date),
                venue_location = VALUES(venue_location),
                category = VALUES(category),
                capacity = VALUES(capacity),
                image_ipfs_cid = VALUES(image_ipfs_cid),
                organizers_id = VALUES(organizers_id);
        `);
    console.log('✅ Events seeded successfully');

    // Seed table ticket_categories
    console.log('Seeding ticket categories...');
    await connection.query(`
            INSERT INTO ticket_categories (id, name, price, quota, events_id)
            VALUES
            ('1', 'VIP (Early Access)', 150000.00, 50, 1),
            ('2', 'CAT 1 (TRIBUN)', 100000.00, 100, 1),
            ('3', 'FESTIVAL', 75000.00, 150, 1),
            ('4', 'VIP Rock', 250000.00, 100, 2),
            ('5', 'Festival Rock', 120000.00, 300, 2),
            ('6', 'Regular Pass', 50000.00, 200, 3)
            ON DUPLICATE KEY UPDATE
                events_id = VALUES(events_id),
                name = VALUES(name),
                price = VALUES(price),
                quota = VALUES(quota)
        `);
    console.log('✅ Ticket categories seeded successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    // make sure koneksi DB sll ditutup biar proses terminal selesai
    await connection.end();
    console.log('✅ Database connection closed');
  }
}

// Eksekusi fungsi runSeed
runSeed();
