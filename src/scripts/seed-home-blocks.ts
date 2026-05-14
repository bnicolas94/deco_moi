import 'dotenv/config';
import { seedInitialBlocks } from '../lib/services/HomeService';


async function run() {
    console.log('Seeding initial home blocks...');
    try {
        await seedInitialBlocks();
        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

run();
