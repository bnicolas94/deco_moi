import 'dotenv/config';
import { db } from '../src/lib/db/connection';
import { supplies } from '../src/lib/db/schema';

const initialSupplies = [
    { name: 'Ganache Colonial X', category: 'chocolates', unit: 'kg', unitCost: '224', stock: 50, supplier: '', link: '', isActive: true },
    { name: 'Chocolatinas c/', category: 'chocolates', unit: 'u', unitCost: '224', stock: 900, supplier: '', link: '', isActive: true },
    { name: 'Chocolatín Georgalos', category: 'chocolates', unit: 'u', unitCost: '391', stock: 40, supplier: '', link: '', isActive: true },
    { name: 'Papel Autoadhesivo A4 Brillante Láser', category: 'hojas', unit: 'hoja', unitCost: '240', stock: 100, supplier: '', link: '', isActive: true },
    { name: 'Glossy Laser', category: 'hojas', unit: 'hoja', unitCost: '227', stock: 100, supplier: '', link: '', isActive: true },
    { name: 'Opalina 210gr', category: 'hojas', unit: 'hoja', unitCost: '65', stock: 125, supplier: '', link: '', isActive: true },
    { name: 'Foil', category: 'hojas', unit: 'hoja', unitCost: '292', stock: 25, supplier: '', link: '', isActive: false },
    { name: 'Kraft', category: 'hojas', unit: 'hoja', unitCost: '148', stock: 50, supplier: '', link: '', isActive: true },
    { name: 'Frasco Anchoero 100cc', category: 'velas', unit: 'u', unitCost: '927', stock: 35, supplier: '', link: '', isActive: true },
    { name: 'Cera BPF', category: 'velas', unit: 'kg', unitCost: '4.93', stock: 10000, supplier: '', link: '', isActive: true },
    { name: 'Ojalillo chico', category: 'velas', unit: 'u', unitCost: '16.40', stock: 50, supplier: '', link: '', isActive: true },
    { name: 'Indubox D128×100u', category: 'cajas', unit: 'u', unitCost: '500', stock: 50, supplier: 'Indubox', link: '', isActive: true },
    { name: 'Indubox 250u', category: 'cajas', unit: 'u', unitCost: '383', stock: 250, supplier: 'Indubox', link: '', isActive: true },
    { name: 'Caja Tennesse x10', category: 'cajas', unit: 'u', unitCost: '401', stock: 10, supplier: '', link: '', isActive: true },
    { name: 'Telgopor', category: 'extras', unit: 'u', unitCost: '24', stock: 156, supplier: '', link: '', isActive: true },
    { name: 'Cinta Raso', category: 'extras', unit: 'm', unitCost: '1.9', stock: 1000, supplier: '', link: '', isActive: true },
    { name: 'Borlas 13cm', category: 'extras', unit: 'u', unitCost: '347.8', stock: 5, supplier: '', link: '', isActive: true },
    { name: 'Cruz madera', category: 'extras', unit: 'u', unitCost: '95.3', stock: 200, supplier: '', link: '', isActive: false },
    { name: 'Hilo Algodón', category: 'tejidos', unit: 'u', unitCost: '0.92', stock: 10000, supplier: '', link: '', isActive: true },
    { name: 'Argolla', category: 'tejidos', unit: 'u', unitCost: '51.85', stock: 100, supplier: '', link: '', isActive: true },
    { name: 'Mosqueón', category: 'tejidos', unit: 'u', unitCost: '329.90', stock: 50, supplier: '', link: '', isActive: true },
    { name: 'Bolsa Tejido base', category: 'tejidos', unit: 'u', unitCost: '13.80', stock: 200, supplier: '', link: '', isActive: true },
];

async function seed() {
    console.log('🌱 Seeding supplies...');
    try {
        for (const item of initialSupplies) {
            await db.insert(supplies).values(item);
        }
        console.log('✅ Seeding complete!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seed();
