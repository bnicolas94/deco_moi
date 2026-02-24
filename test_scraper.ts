import { PriceMonitorService } from './src/lib/services/PriceMonitorService';

async function test() {
    const url = 'https://www.mercadolibre.com.ar/confites-chocolate-palmesano-corazonito-500gr/p/MLA22650894';
    console.log('Testing URL:', url);

    // We need to bypass the DB part to just test the scraper
    // @ts-ignore
    const price = await PriceMonitorService.scrapePrice(url);
    console.log('Detected Price:', price);
}

test();
