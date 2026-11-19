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
    const isFresh = process.argv.includes('--fresh');
    if (isFresh) {
      console.log('🧹 [db:fresh] Menghapus seluruh data di database...');
      const [tableRows] = await connection.query('SHOW TABLES');
      const tables = (tableRows as Array<Record<string, string>>)
        .map((row) => Object.values(row)[0])
        .filter(Boolean);

      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      try {
        for (const table of tables) {
          await connection.query(`TRUNCATE TABLE \`${table}\``);
        }
      } finally {
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      }
      console.log(`✅ [db:fresh] ${tables.length} tabel berhasil dikosongkan.`);
    }

    // Ambil password dari .env dan hash menggunakan bcrypt dgn salt round : 10
    const rawPassword = process.env.ORGANIZER_SEED_PASSWORD || 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    //  Seed table users (Akun login untuk masing-masing Organizer)
    console.log('🌱 Seeding users for organizers...');
    await connection.query(`
            INSERT INTO users (id, name, email, password, is_email_verified, created_at, updated_at)
            VALUES
            (10, 'Admin Event Master Pro', 'admin@eventmaster.com', '${hashedPassword}', 1, NOW(), NOW()),
            (11, 'Admin Konserindo', 'admin@konserindo.com', '${hashedPassword}', 1, NOW(), NOW()),
            (12, 'Admin Jakarta Live', 'admin@jakartalive.com', '${hashedPassword}', 1, NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                password = VALUES(password),
                is_email_verified = 1,
                updated_at = NOW();
        `);
    console.log('✅ Users for organizers seeded successfully');

    // Seed table organizers
    console.log('Seeding organizers...');
    await connection.query(`
            INSERT INTO organizers (id, organization_name, status, created_at, users_id)
            VALUES
            (1, 'Event Master Pro', 'Active', NOW(), 10),
            (2, 'Konserindo', 'Active', NOW(), 11),
            (3, 'Jakarta Live Entertainment', 'Active', NOW(), 12)
            ON DUPLICATE KEY UPDATE 
                organization_name = VALUES(organization_name),
                status = VALUES(status),
                users_id = VALUES(users_id);
                
        `);
    console.log('✅ Organizers seeded successfully');

    // Seed table events
    console.log('🌱 Seeding events...');
    await connection.query(`
            INSERT INTO events (id, on_chain_event_id, event_name, start_date, venue_location, category, capacity, image_ipfs_cid, organizers_id, max_per_wallet)
            VALUES
            (1, 1, 'UBAYA Music Fest 2026', '2026-12-25 18:00:00', 'Lapangan Parkir Kampus II Tenggilis UBAYA', 'festival musik', 300, 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80', 1, 1),
            (2, 2, 'Rock in Indonesia 2026', '2026-12-10 19:00:00', 'Gelora Bung Karno Jakarta', 'konser musik', 1000, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80', 2, 1),
            (3, 3, 'Art & Tech Expo 2026', '2026-12-15 10:00:00', 'Museum Nasional Indonesia', 'pameran berbayar', 500, 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80', 3, 1),
            (4, 4, 'Indonesia Web3 & Security Summit 2026', '2026-12-18 09:00:00', 'Dyandra Convention Center Surabaya', 'seminar', 400, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80', 1, 2),
            (5, 5, 'Tawa Merdeka Comedy Night 2026', '2026-12-20 19:30:00', 'Balai Sarbini Jakarta', 'stand up comedy', 350, 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80', 2, 2),
            (6, 6, 'Garuda Champions Badminton Open 2026', '2026-12-28 13:00:00', 'Istora Senayan Jakarta', 'olahraga', 800, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80', 3, 2)
            ON DUPLICATE KEY UPDATE 
                on_chain_event_id = VALUES(on_chain_event_id),
                event_name = VALUES(event_name),
                start_date = VALUES(start_date),
                venue_location = VALUES(venue_location),
                category = VALUES(category),
                capacity = VALUES(capacity),
                image_ipfs_cid = VALUES(image_ipfs_cid),
                organizers_id = VALUES(organizers_id),
                max_per_wallet = VALUES(max_per_wallet);
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
            ('6', 'Regular Pass', 50000.00, 200, 3),
            ('7', 'Early Bird Pass', 100000.00, 150, 4),
            ('8', 'VIP Executive', 250000.00, 250, 4),
            ('9', 'Tribune Laugh', 85000.00, 200, 5),
            ('10', 'Front Row VIP', 175000.00, 150, 5),
            ('11', 'Court Side VIP', 300000.00, 200, 6),
            ('12', 'Regular Arena', 125000.00, 600, 6)
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
