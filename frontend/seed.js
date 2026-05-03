const https = require('https');
const dbUrl = 'https://qr-sistemi-4779e-default-rtdb.firebaseio.com/urunler.json';

const defaultKategoriler = {
    "Yemekler": ["Hamburgerler", "Deniz Ürünleri", "Kebaplar", "Beyaz Etler", "Kırmızı Etler", "Pizzalar", "Makarnalar"],
    "Salatalar": ["Mevsim Salatalar", "Diyet Salatalar", "Tavuklu Salata"],
    "Tatlılar": ["Sütlü Tatlılar", "Şerbetli Tatlılar", "Pastalar"],
    "Sıcak İçecekler": ["Sıcak Kahveler", "Sıcak Çikolata", "Çaylar"],
    "Soğuk İçecekler": ["Meşrubatlar", "Soğuk Kahveler", "Milkshakeler", "Limonata"],
    "Alkollü İçecekler": ["Viski", "Shot", "Kokteyl", "Bira", "Rakı", "Şarap"],
    "Sağlıklı Çaylar": ["Yeşil Çay", "Bitki Çayları", "Detox Çayları"],
    "Aperatifler": ["Çıtır Atıştırmalıklar", "Patates Kızartması", "Çerezler"],
    "Diğer": ["Soslar", "Ekstralar"]
};

function getAnaKat(altKat) {
    for (let ana in defaultKategoriler) {
        if (defaultKategoriler[ana].includes(altKat)) {
            return ana;
        }
    }
    return null;
}

https.get(dbUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let urunler = JSON.parse(data);
        let updates = {};
        
        let usedAltKats = new Set();

        for (let id in urunler) {
            let urun = urunler[id];
            
            // Fix categories
            let fixedAltKat = urun.kategori || "";
            let fixedAnaKat = urun.anaKategori || "";

            // Known issues mapping:
            if (fixedAltKat === 'Salatalar' || urun.yemekAdi.toLowerCase().includes('salata')) {
                fixedAnaKat = 'Salatalar';
                if (urun.yemekAdi.toLowerCase().includes('tavuk')) fixedAltKat = 'Tavuklu Salata';
                else if (urun.yemekAdi.toLowerCase().includes('diyet') || urun.yemekAdi.toLowerCase().includes('kinoa')) fixedAltKat = 'Diyet Salatalar';
                else fixedAltKat = 'Mevsim Salatalar';
            }
            if (fixedAltKat === 'Meşrubatlar') { fixedAnaKat = 'Soğuk İçecekler'; fixedAltKat = 'Meşrubatlar'; }
            if (fixedAltKat === 'Hamburgerler') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Hamburgerler'; }
            if (fixedAltKat === 'Makarnalar') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Makarnalar'; }
            if (fixedAltKat === 'Pizzalar') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Pizzalar'; }
            if (fixedAltKat === 'Deniz Ürünleri') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Deniz Ürünleri'; }
            if (fixedAltKat === 'Kebaplar') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Kebaplar'; }
            if (fixedAltKat === 'Kırmızı Etler') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Kırmızı Etler'; }
            if (fixedAltKat === 'Beyaz Etler') { fixedAnaKat = 'Yemekler'; fixedAltKat = 'Beyaz Etler'; }
            if (fixedAltKat === 'Sıcak Kahveler') { fixedAnaKat = 'Sıcak İçecekler'; fixedAltKat = 'Sıcak Kahveler'; }
            if (fixedAltKat === 'Soğuk Kahveler') { fixedAnaKat = 'Soğuk İçecekler'; fixedAltKat = 'Soğuk Kahveler'; }
            if (fixedAltKat === 'Milkshakeler') { fixedAnaKat = 'Soğuk İçecekler'; fixedAltKat = 'Milkshakeler'; }
            if (fixedAltKat === 'Şerbetli Tatlılar') { fixedAnaKat = 'Tatlılar'; fixedAltKat = 'Şerbetli Tatlılar'; }
            if (fixedAltKat === 'Sütlü Tatlılar') { fixedAnaKat = 'Tatlılar'; fixedAltKat = 'Sütlü Tatlılar'; }
            if (fixedAltKat === 'Bira') { fixedAnaKat = 'Alkollü İçecekler'; fixedAltKat = 'Bira'; }
            if (fixedAltKat === 'Viski') { fixedAnaKat = 'Alkollü İçecekler'; fixedAltKat = 'Viski'; }
            if (fixedAltKat === 'Shot') { fixedAnaKat = 'Alkollü İçecekler'; fixedAltKat = 'Shot'; }
            if (fixedAltKat === 'Kokteyl') { fixedAnaKat = 'Alkollü İçecekler'; fixedAltKat = 'Kokteyl'; }
            if (fixedAltKat === 'Rakı') { fixedAnaKat = 'Alkollü İçecekler'; fixedAltKat = 'Rakı'; }
            if (fixedAltKat === 'Aperatifler') { fixedAnaKat = 'Aperatifler'; fixedAltKat = 'Çıtır Atıştırmalıklar'; }
            
            if (urun.yemekAdi.toLowerCase().includes('sos') || urun.yemekAdi.toLowerCase().includes('mayonez') || urun.yemekAdi.toLowerCase().includes('ketçap')) {
                 fixedAnaKat = 'Diğer'; fixedAltKat = 'Soslar';
            } else if (fixedAltKat === 'Diğer' || urun.yemekAdi.toLowerCase().includes('mendil') || urun.yemekAdi.toLowerCase().includes('kürdan')) { 
                fixedAnaKat = 'Diğer'; fixedAltKat = 'Ekstralar'; 
            }
            
            if (urun.yemekAdi.toLowerCase().includes('çay') && !urun.yemekAdi.toLowerCase().includes('kahve') && !urun.kategori.includes('Kahve')) {
                if (urun.yemekAdi.toLowerCase().includes('yeşil')) { fixedAnaKat = 'Sağlıklı Çaylar'; fixedAltKat = 'Yeşil Çay'; }
                else { fixedAnaKat = 'Sıcak İçecekler'; fixedAltKat = 'Çaylar'; }
            }
            if (fixedAltKat === 'sağlıklı çaylar') { fixedAnaKat = 'Sağlıklı Çaylar'; fixedAltKat = 'Bitki Çayları'; }
            if (fixedAnaKat === 'çaylar') { fixedAnaKat = 'Sıcak İçecekler'; fixedAltKat = 'Çaylar'; }

            // Verify mapping exists
            if (!getAnaKat(fixedAltKat)) {
                fixedAnaKat = 'Diğer';
                fixedAltKat = 'Ekstralar';
            } else {
                fixedAnaKat = getAnaKat(fixedAltKat);
            }

            updates[id + '/anaKategori'] = fixedAnaKat;
            updates[id + '/kategori'] = fixedAltKat;
            
            usedAltKats.add(`${fixedAnaKat}|${fixedAltKat}`);
        }

        // Add dummy products to empty categories
        let newItemsCount = 0;
        for (let ana in defaultKategoriler) {
            for (let alt of defaultKategoriler[ana]) {
                if (!usedAltKats.has(`${ana}|${alt}`)) {
                    let dummyId = '-YeniUrun_' + Date.now() + '_' + newItemsCount++;
                    updates[dummyId] = {
                        anaKategori: ana,
                        kategori: alt,
                        yemekAdi: alt + " Örnek Ürünü",
                        fiyat: "100",
                        gorsel: ""
                    };
                }
            }
        }

        // Send PATCH
        const req = https.request(dbUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        }, (res2) => {
            console.log("Status: ", res2.statusCode);
            res2.on('data', (d) => process.stdout.write(d));
        });
        req.write(JSON.stringify(updates));
        req.end();
        console.log("Total updates: ", Object.keys(updates).length);
    });
});
