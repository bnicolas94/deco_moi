import 'dotenv/config';
import { db } from '../src/lib/db/connection';
import { pageTemplates } from '../src/lib/db/schema';
import { v4 as uuidv4 } from 'uuid';

const getBaseProps = () => ({ id: uuidv4(), isVisible: true });

async function seedTemplates() {
  console.log('Seeding page templates...');

  const templates = [
    {
      name: 'Landing de Ventas Mínima',
      category: 'landing',
      blocks: [
        {
          ...getBaseProps(),
          type: 'hero',
          order: 0,
          props: {
            title: 'Oferta Especial de Primavera',
            subtitle: 'Hasta 30% OFF en todos nuestros souvenirs y cajas de regalo.',
            align: 'center',
            minHeight: 500,
            ctaText: 'Ver Productos',
            ctaLink: '/productos',
            overlayOpacity: 40,
            backgroundImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1600'
          }
        },
        {
          ...getBaseProps(),
          type: 'features',
          order: 1,
          props: {
            title: '¿Por qué elegirnos?',
            columns: 3,
            features: [
              { title: 'Hecho a mano', description: 'Cada detalle es único.' },
              { title: 'Envío rápido', description: 'Despachamos en 24hs.' },
              { title: 'Personalizado', description: 'Grabamos tu nombre o logo.' }
            ]
          }
        },
        {
          ...getBaseProps(),
          type: 'product_grid',
          order: 2,
          props: {
            title: 'Productos Destacados',
            limit: 4,
            showCta: true
          }
        },
        {
          ...getBaseProps(),
          type: 'whatsapp_cta',
          order: 3,
          props: {
            title: '¿Dudas con tu pedido mayorista?',
            buttonText: 'Hablemos por WhatsApp'
          }
        }
      ]
    },
    {
      name: 'Página de Contacto / Ayuda',
      category: 'info',
      blocks: [
        {
          ...getBaseProps(),
          type: 'richtext',
          order: 0,
          props: {
            content: '<h1 style="text-align: center;">Centro de Ayuda</h1><p style="text-align: center;">Estamos aquí para resolver todas tus dudas.</p>',
            align: 'center'
          }
        },
        {
          ...getBaseProps(),
          type: 'faq',
          order: 1,
          props: {
            title: 'Preguntas Frecuentes',
            items: [
              { question: '¿Hacen envíos a todo el país?', answer: 'Sí, enviamos a toda Argentina mediante Correo Argentino y OCA.' },
              { question: '¿Cuál es la compra mínima por mayor?', answer: 'La compra mínima mayorista es de 20 unidades.' }
            ]
          }
        },
        {
          ...getBaseProps(),
          type: 'spacer',
          order: 2,
          props: { height: 40, showLine: true }
        },
        {
          ...getBaseProps(),
          type: 'contact_form',
          order: 3,
          props: {
            title: 'Envíanos un mensaje'
          }
        }
      ]
    }
  ];

  for (const t of templates) {
    await db.insert(pageTemplates).values(t);
  }

  console.log('Templates seeded successfully.');
  process.exit(0);
}

seedTemplates().catch(e => {
  console.error(e);
  process.exit(1);
});
