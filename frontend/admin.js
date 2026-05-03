// 1. Firebase Yapılandırması
const firebaseConfig = {
    apiKey: "AIzaSyBlyS7v-r6Yv8Z_E4v_W-I8-vI8vI8vI8",
    authDomain: "qr-sistemi-4779e.firebaseapp.com",
    databaseURL: "https://qr-sistemi-4779e-default-rtdb.firebaseio.com",
    projectId: "qr-sistemi-4779e",
    storageBucket: "qr-sistemi-4779e.appspot.com",
    messagingSenderId: "1055866176317",
    appId: "1:1055866176317:web:4f4f4f4f4f4f4f4f4f4f4f"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// DOM Elementleri
const urunListesiTbody = document.getElementById('urunListesiTbody');
const urunForm = document.getElementById('urunForm');
const formTitleSpan = document.querySelector('#formTitle span');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const submitBtn = document.getElementById('submitBtn');

const urunAnaKategoriSelect = document.getElementById('urunAnaKategori');
const urunAltKategoriSelect = document.getElementById('urunAltKategori');
const hedefAnaKategoriSelect = document.getElementById('hedefAnaKategori');
const anaKategoriForm = document.getElementById('anaKategoriForm');
const altKategoriForm = document.getElementById('altKategoriForm');

let tumUrunler = {};
let kategoriAgaci = {};

const defaultKategoriler = {
    "Yemekler": { "Hamburgerler": true, "Deniz Ürünleri": true, "Kebaplar": true, "Beyaz Etler": true, "Kırmızı Etler": true, "Pizzalar": true, "Makarnalar": true },
    "Salatalar": { "Mevsim Salatalar": true, "Diyet Salatalar": true, "Tavuklu Salata": true },
    "Tatlılar": { "Sütlü Tatlılar": true, "Şerbetli Tatlılar": true, "Pastalar": true },
    "Sıcak İçecekler": { "Sıcak Kahveler": true, "Sıcak Çikolata": true, "Çaylar": true },
    "Soğuk İçecekler": { "Meşrubatlar": true, "Soğuk Kahveler": true, "Milkshakeler": true, "Limonata": true },
    "Alkollü İçecekler": { "Viski": true, "Shot": true, "Kokteyl": true, "Bira": true, "Rakı": true, "Şarap": true },
    "Sağlıklı Çaylar": { "Yeşil Çay": true, "Bitki Çayları": true, "Detox Çayları": true },
    "Aperatifler": { "Çıtır Atıştırmalıklar": true, "Patates Kızartması": true, "Çerezler": true },
    "Diğer": { "Soslar": true, "Ekstralar": true }
};

const anaKategoriSirasi = [
    "Yemekler",
    "Salatalar",
    "Tatlılar",
    "Sıcak İçecekler",
    "Soğuk İçecekler",
    "Alkollü İçecekler",
    "Sağlıklı Çaylar",
    "Aperatifler",
    "Diğer"
];

// TOAST BİLDİRİM FONKSİYONU
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '<i class="fa-solid fa-circle-check toast-icon"></i>' : '<i class="fa-solid fa-circle-exclamation toast-icon"></i>';
    toast.innerHTML = `${icon}<div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

const urunStokInput = document.getElementById('urunStok');
if (urunStokInput) {
    urunStokInput.addEventListener('input', function() {
        const val = this.value.trim();
        if (val === '') {
            this.style.color = 'inherit';
            this.style.fontWeight = 'normal';
        } else {
            const s = parseInt(val);
            if (s <= 0) {
                this.style.color = 'var(--danger)';
                this.style.fontWeight = 'bold';
            } else if (s <= 10) {
                this.style.color = '#ef4444';
                this.style.fontWeight = 'bold';
            } else {
                this.style.color = '#10b981';
                this.style.fontWeight = 'bold';
            }
        }
    });
}

// CUSTOM CONFIRM MODAL FONKSİYONU
function showConfirm(title, message, onConfirm, type = 'danger') {
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmMessage').innerText = message;
    
    const iconDiv = document.getElementById('confirmIcon');
    const actionBtn = document.getElementById('confirmActionBtn');
    
    if(type === 'danger') {
        iconDiv.style.background = '#fef2f2';
        iconDiv.style.color = '#ef4444';
        iconDiv.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        actionBtn.className = 'btn btn-danger';
    } else {
        iconDiv.style.background = '#eff6ff';
        iconDiv.style.color = '#3b82f6';
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
        actionBtn.className = 'btn btn-primary';
    }

    actionBtn.onclick = function() {
        closeCustomConfirm();
        if(onConfirm) onConfirm();
    };
    
    document.getElementById('customConfirmOverlay').classList.add('active');
}

window.closeCustomConfirm = function() {
    document.getElementById('customConfirmOverlay').classList.remove('active');
}

function checkAndAutoCloseTable(masaAdi) {
    let isTableFullyResolved = true;
    let hasActiveItems = false;
    let hasPaidItems = false;
    const updates = {};

    Object.keys(window.guncelSiparisler || {}).forEach(id => {
        const siparis = window.guncelSiparisler[id];
        if(siparis.masa === masaAdi && !siparis.arsiv && siparis.tip === 'Sipariş') {
            if(siparis.items) {
                siparis.items.forEach(item => {
                    hasActiveItems = true;
                    
                    const iAdet = item.ikramAdet || (item.ikram ? item.adet : 0);
                    const pAdet = item.paidAdet || (item.paid ? item.adet : 0);
                    
                    if (pAdet > 0) hasPaidItems = true;

                    if(!item.iptal && (iAdet + pAdet < item.adet)) {
                        isTableFullyResolved = false;
                    }
                });
            }
        }
    });

    if(hasActiveItems && isTableFullyResolved && hasPaidItems) {
        const seansId = 'seans_' + Date.now();
        Object.keys(window.guncelSiparisler).forEach(id => {
            const siparis = window.guncelSiparisler[id];
            if(siparis.masa === masaAdi && !siparis.arsiv) {
                updates[`hesapIstekleri/${id}/arsiv`] = true;
                updates[`hesapIstekleri/${id}/arsivZaman`] = new Date().toISOString();
                updates[`hesapIstekleri/${id}/zRaporlandi`] = false;
                updates[`hesapIstekleri/${id}/seansId`] = seansId;
            }
        });
        
        if (Object.keys(updates).length > 0) {
            database.ref().update(updates).then(() => {
                showToast(`${masaAdi} tüm ödemeler tamamlandığı için otomatik kapatıldı.`);
            });
        }
    }
}

// ---------------- KATEGORİ YÖNETİMİ ----------------

database.ref('kategoriler').on('value', (snapshot) => {
    let cats = snapshot.val() || {};
    let isUpdated = false;

    // Özel Temizlik: Kullanıcının hatalı açtığı çaylar ve Yemekler içindeki Salatalar alt kategorisini sil
    if (cats['çaylar']) {
        delete cats['çaylar'];
        isUpdated = true;
    }
    if (cats['Yemekler'] && cats['Yemekler']['Salatalar']) {
        delete cats['Yemekler']['Salatalar'];
        isUpdated = true;
    }

    // Veritabanındaki kategorilerle varsayılanları BİRLEŞTİR (Merge)
    for (const [anaKat, altKatObj] of Object.entries(defaultKategoriler)) {
        if (!cats[anaKat]) {
            cats[anaKat] = { ...altKatObj };
            isUpdated = true;
        } else {
            // Ana kategori var ama alt kategorileri eksikse ekle
            for (const altKat of Object.keys(altKatObj)) {
                if (cats[anaKat][altKat] === undefined) {
                    cats[anaKat][altKat] = true;
                    isUpdated = true;
                }
            }
        }
    }

    if (isUpdated) {
        database.ref('kategoriler').set(cats); // Veritabanını eksiklerle güncelle
    }

    kategoriAgaci = cats;
    updateKategoriSelects();
});

function updateKategoriSelects() {
    // Mevcut seçimleri sakla
    const currentUrunAna = urunAnaKategoriSelect.value;
    const currentHedefAna = hedefAnaKategoriSelect.value;

    let anaHtml = '<option value="">Seçiniz...</option>';
    const anaKategoriler = Object.keys(kategoriAgaci).sort((a, b) => {
        let indexA = anaKategoriSirasi.indexOf(a);
        let indexB = anaKategoriSirasi.indexOf(b);
        if (a === 'Diğer') return 1;
        if (b === 'Diğer') return -1;
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
    });
    
    anaKategoriler.forEach(ana => {
        anaHtml += `<option value="${ana}">${ana}</option>`;
    });

    urunAnaKategoriSelect.innerHTML = anaHtml;
    hedefAnaKategoriSelect.innerHTML = anaHtml;

    // Geri yükle (Eğer hala listedeyse)
    if(anaKategoriler.includes(currentUrunAna)) {
        urunAnaKategoriSelect.value = currentUrunAna;
        loadAltKategoriler(); // alt kategorileri yükle
    }
    if(anaKategoriler.includes(currentHedefAna)) hedefAnaKategoriSelect.value = currentHedefAna;
    
    updateFilterSelects();
}

function updateFilterSelects() {
    const filterAna = document.getElementById('filterAnaKategori');
    if(!filterAna) return;
    
    let currentAna = filterAna.value;
    let html = '<option value="">Ana Kategori Seçin</option>';
    
    const anaKategoriler = Object.keys(kategoriAgaci).sort((a, b) => {
        let indexA = anaKategoriSirasi.indexOf(a);
        let indexB = anaKategoriSirasi.indexOf(b);
        if (a === 'Diğer') return 1;
        if (b === 'Diğer') return -1;
        if (indexA === -1) indexA = 99;
        if (indexB === -1) indexB = 99;
        return indexA - indexB;
    });
    
    anaKategoriler.forEach(ana => {
        html += `<option value="${ana}">${ana}</option>`;
    });
    
    filterAna.innerHTML = html;
    if(currentAna && kategoriAgaci[currentAna]) {
        filterAna.value = currentAna;
        loadFilterAltKategoriler();
    }
}

window.loadFilterAltKategoriler = function() {
    const filterAna = document.getElementById('filterAnaKategori').value;
    const filterAlt = document.getElementById('filterAltKategori');
    if(!filterAna || !kategoriAgaci[filterAna]) {
        filterAlt.innerHTML = '<option value="">Önce Ana Kategori Seçin</option>';
        window.renderFilteredProducts();
        return;
    }
    
    let html = '<option value="">Tüm Alt Kategoriler</option>';
    Object.keys(kategoriAgaci[filterAna]).sort((a,b) => a.localeCompare(b, 'tr-TR')).forEach(alt => {
        html += `<option value="${alt}">${alt}</option>`;
    });
    filterAlt.innerHTML = html;
    window.renderFilteredProducts();
}

urunAnaKategoriSelect.addEventListener('change', loadAltKategoriler);

function loadAltKategoriler(selectedAlt = '') {
    const secilenAna = urunAnaKategoriSelect.value;
    if (!secilenAna || !kategoriAgaci[secilenAna]) {
        urunAltKategoriSelect.innerHTML = '<option value="">Önce Ana Kategori Seçin...</option>';
        return;
    }

    const altKategoriler = Object.keys(kategoriAgaci[secilenAna]).sort((a,b) => a.localeCompare(b, 'tr-TR'));
    let altHtml = '<option value="">Seçiniz...</option>';
    
    altKategoriler.forEach(alt => {
        altHtml += `<option value="${alt}">${alt}</option>`;
    });

    urunAltKategoriSelect.innerHTML = altHtml;

    if (selectedAlt && altKategoriler.includes(selectedAlt)) {
        urunAltKategoriSelect.value = selectedAlt;
    }
}

// Yeni Ana Kategori Ekleme
if (anaKategoriForm) {
    anaKategoriForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const yeniAna = document.getElementById('yeniAnaKategori').value.trim();
        if (yeniAna) {
            // Ana kategori oluştur, boş kalmasın diye içine 'Genel' alt kategorisi ekle
            database.ref(`kategoriler/${yeniAna}`).set({ "Genel": true })
                .then(() => {
                    showToast(`"${yeniAna}" ana kategorisi eklendi!`);
                    anaKategoriForm.reset();
                }).catch(err => showToast("Hata: " + err.message, "error"));
        }
    });
}

// Yeni Alt Kategori Ekleme
if (altKategoriForm) {
    altKategoriForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const hedefAna = hedefAnaKategoriSelect.value;
        const yeniAlt = document.getElementById('yeniAltKategori').value.trim();
        const gorselURL = document.getElementById('yeniAltKategoriGorsel') ? document.getElementById('yeniAltKategoriGorsel').value.trim() : '';
        
        if (hedefAna && yeniAlt) {
            let data = true;
            if (gorselURL) {
                data = { gorsel: gorselURL, aktif: true };
            }
            database.ref(`kategoriler/${hedefAna}/${yeniAlt}`).set(data)
                .then(() => {
                    showToast(`"${hedefAna}" altına "${yeniAlt}" eklendi!`);
                    altKategoriForm.reset();
                }).catch(err => showToast("Hata: " + err.message, "error"));
        }
    });
}

window.deleteAnaKategori = function() {
    const anaKat = document.getElementById('yeniAnaKategori').value.trim();
    if (!anaKat) {
        showToast("Lütfen silmek istediğiniz Ana Kategori adını yazın.", "error");
        return;
    }
    showConfirm("Ana Kategori Sil", `"${anaKat}" ana kategorisini silmek istediğinize emin misiniz? (İçindeki ürünler silinmeyecektir)`, () => {
        database.ref(`kategoriler/${anaKat}`).remove()
            .then(() => {
                showToast(`"${anaKat}" başarıyla silindi!`);
                document.getElementById('yeniAnaKategori').value = '';
            })
            .catch(err => showToast("Silme hatası: " + err.message, "error"));
    });
}

window.deleteAltKategori = function() {
    const hedefAna = hedefAnaKategoriSelect.value;
    const altKat = document.getElementById('yeniAltKategori').value.trim();
    if (!hedefAna || !altKat) {
        showToast("Lütfen silinecek Alt Kategoriyi yazın ve üstten Ana Kategorisini seçin.", "error");
        return;
    }
    showConfirm("Alt Kategori Sil", `"${hedefAna}" içindeki "${altKat}" alt kategorisini silmek istediğinize emin misiniz? (Ürünler silinmez)`, () => {
        database.ref(`kategoriler/${hedefAna}/${altKat}`).remove()
            .then(() => {
                showToast(`"${altKat}" başarıyla silindi!`);
                document.getElementById('yeniAltKategori').value = '';
            })
            .catch(err => showToast("Silme hatası: " + err.message, "error"));
    });
}

// ---------------- ÜRÜN YÖNETİMİ ----------------

database.ref('urunler').on('value', (snapshot) => {
    tumUrunler = snapshot.val();
    window.renderFilteredProducts();
}, (error) => {
    showToast("Ürünler yüklenirken hata oluştu!", "error");
});

window.renderFilteredProducts = function() {
    if (!urunListesiTbody) return;
    urunListesiTbody.innerHTML = "";

    const anaKat = document.getElementById('filterAnaKategori').value;
    const altKat = document.getElementById('filterAltKategori').value;

    if(!anaKat) {
        urunListesiTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:var(--text-muted);"><i class="fa-solid fa-filter"></i> Lütfen listelemek için sol üstten kategori seçin.</td></tr>';
        return;
    }

    if(!tumUrunler) {
        urunListesiTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Veritabanında henüz ürün bulunamadı.</td></tr>`;
        return;
    }

    let count = 0;
    Object.keys(tumUrunler).forEach((id) => {
        const urun = tumUrunler[id];
        const urunAnaKategori = urun.anaKategori || 'Belirtilmemiş';
        const urunAltKategori = urun.kategori || 'Genel';
        
        if (urunAnaKategori === anaKat) {
            if (!altKat || urunAltKategori === altKat) {
                count++;
                const ad = urun.yemekAdi || urun.ad || urun.urunAdı || 'İsimsiz Ürün';
                
                const imgHtml = urun.gorsel 
                    ? `<img src="${urun.gorsel}" class="td-image" alt="Görsel" onerror="this.outerHTML='<div class=\\'td-image\\' style=\\'display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:20px;\\'><i class=\\'fa-solid fa-image\\'></i></div>'">` 
                    : `<div class="td-image" style="display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:20px;"><i class="fa-solid fa-utensils"></i></div>`;

                let stokRenk = 'var(--text-muted)';
                let stokMetin = 'Sınırsız';
                if (urun.stok !== undefined && urun.stok !== '') {
                    const s = parseInt(urun.stok);
                    if (s <= 0) { stokRenk = 'var(--danger)'; stokMetin = 'Tükendi'; }
                    else if (s <= 10) { stokRenk = '#ef4444'; stokMetin = `Stok: ${s} (Kritik)`; }
                    else { stokRenk = '#10b981'; stokMetin = `Stok: ${s}`; }
                }

                urunListesiTbody.innerHTML += `
                    <tr>
                        <td>${imgHtml}</td>
                        <td style="font-weight: 500; color: var(--text-dark);">${ad}</td>
                        <td style="font-weight: 600;">${urun.fiyat} ₺<br>
                            <span style="font-size: 11px; font-weight: ${stokRenk === 'var(--danger)' || stokRenk === '#ef4444' ? 'bold' : 'normal'}; color: ${stokRenk}">
                                ${stokMetin}
                            </span>
                        </td>
                        <td class="td-actions" style="white-space: nowrap;">
                            <button type="button" class="btn btn-outline btn-sm" onclick="openGorselModal('${id}')" title="Görsel Yönetimi" style="margin-right:4px;">
                                <i class="fa-solid fa-image"></i>
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" onclick="editUrun('${id}')" title="Düzenle">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-sm" onclick="deleteUrun('${id}')" title="Sil">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        }
    });

    if (count === 0) {
        urunListesiTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Bu kategoride ürün bulunamadı.</td></tr>';
    }
}
if (urunForm) {
    urunForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editUrunId').value;
        const ad = document.getElementById('urunAdi').value.trim();
        const fiyat = document.getElementById('urunFiyati').value.trim();
        const stokStr = document.getElementById('urunStok').value.trim();
        const stok = stokStr !== '' ? parseInt(stokStr, 10) : '';
        const anaKategori = urunAnaKategoriSelect.value;
        const altKategori = urunAltKategoriSelect.value;

        if(!anaKategori || !altKategori) {
            showToast("Lütfen Ana ve Alt Kategori seçiniz!", "error");
            return;
        }

        const data = {
            yemekAdi: ad,
            fiyat: fiyat,
            stok: stok,
            anaKategori: anaKategori,
            kategori: altKategori
        };

        if (id) {
            // Sadece diğer alanları güncelle, görseli elleme
            database.ref('urunler/' + id).update(data)
                .then(() => {
                    showToast("Ürün başarıyla güncellendi!");
                    cancelEdit();
                }).catch(err => showToast("Güncelleme hatası: " + err.message, "error"));
        } else {
            database.ref('urunler').push(data)
                .then(() => {
                    showToast("Yeni ürün eklendi!");
                    urunForm.reset();
                    urunAnaKategoriSelect.value = '';
                    urunAltKategoriSelect.innerHTML = '<option value="">Önce Ana Kategori Seçin...</option>';
                }).catch(err => showToast("Ekleme hatası: " + err.message, "error"));
        }
    });
}

window.deleteUrun = function(id) {
    showConfirm("Ürünü Sil", "Bu ürünü silmek istediğinize emin misiniz?", () => {
        database.ref('urunler/' + id).remove()
            .then(() => showToast("Ürün silindi!"))
            .catch(err => showToast("Silme hatası: " + err.message, "error"));
    });
}

window.editUrun = function(id) {
    const urun = tumUrunler[id];
    if (!urun) return;

    document.getElementById('editUrunId').value = id;
    document.getElementById('urunAdi').value = urun.yemekAdi || urun.ad || urun.urunAdı || '';
    document.getElementById('urunFiyati').value = urun.fiyat || '';
    const stokInput = document.getElementById('urunStok');
    stokInput.value = urun.stok !== undefined ? urun.stok : '';
    stokInput.dispatchEvent(new Event('input'));

    // Kategorileri ayarla
    if (urun.anaKategori) {
        urunAnaKategoriSelect.value = urun.anaKategori;
        loadAltKategoriler(urun.kategori); // Alt kategoriyi de seçili hale getir
    } else {
        urunAnaKategoriSelect.value = '';
        urunAltKategoriSelect.innerHTML = '<option value="">Önce Ana Kategori Seçin...</option>';
    }

    formTitleSpan.innerHTML = '<i class="fa-solid fa-pen text-primary"></i> Ürünü Düzenle';
    cancelEditBtn.style.display = 'inline-flex';
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Güncelle';
    
    urunForm.scrollIntoView({ behavior: 'smooth' });
}

window.cancelEdit = function() {
    urunForm.reset();
    document.getElementById('editUrunId').value = '';
    const stokInput = document.getElementById('urunStok');
    stokInput.dispatchEvent(new Event('input'));
    urunAnaKategoriSelect.value = '';
    urunAltKategoriSelect.innerHTML = '<option value="">Önce Ana Kategori Seçin...</option>';
    
    formTitleSpan.innerHTML = '<i class="fa-solid fa-plus text-primary"></i> Yeni Ürün Ekle';
    cancelEditBtn.style.display = 'none';
    submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Kaydet';
}

// ---------------- SİPARİŞ VE İSTEK YÖNETİMİ ----------------
const aktifSiparislerDiv = document.getElementById('aktifSiparisler');

let previousUnseenCount = 0;

database.ref('hesapIstekleri').on('value', (snapshot) => {
    if (!aktifSiparislerDiv) return;
    aktifSiparislerDiv.innerHTML = '';
    
    window.guncelSiparisler = snapshot.val() || {};
    const masalar = {};
    let currentUnseenCount = 0;
    
    Object.keys(window.guncelSiparisler).forEach(id => {
        const istek = window.guncelSiparisler[id];
        if(istek.arsiv) return; // Arşivlenenleri atla
        
        const masaAdi = istek.masa || 'Belirsiz Masa';
        if(!masalar[masaAdi]) {
            masalar[masaAdi] = {
                istekler: [],
                garsonIstekleri: [],
                toplamTutar: 0,
                hasUnseen: false
            };
        }
        
        if(!istek.isSeen) {
            masalar[masaAdi].hasUnseen = true;
            currentUnseenCount++;
        }
        
        if(istek.tip === 'Sipariş') {
            masalar[masaAdi].istekler.push({...istek, id});
            if(istek.items && !istek.iptal && istek.durum !== 'İptal Edildi') {
                istek.items.forEach(item => {
                    if(!item.iptal && !item.paid) {
                        const pAdet = item.paidAdet || 0;
                        const iAdet = item.ikramAdet || (item.ikram ? item.adet : 0);
                        const kalanAdet = item.adet - pAdet - iAdet;
                        if(kalanAdet > 0) {
                            masalar[masaAdi].toplamTutar += (item.fiyat * kalanAdet);
                        }
                    }
                });
            }
        } else {
            masalar[masaAdi].garsonIstekleri.push({...istek, id});
        }
    });

    let count = 0;
    Object.keys(masalar).sort().forEach(masaAdi => {
        count++;
        const masa = masalar[masaAdi];
        
        let garsonHtml = '';
        masa.garsonIstekleri.forEach(gi => {
            garsonHtml += `
                <div style="background:#fef2f2; color:#ef4444; padding:8px; border-radius:6px; margin-bottom:8px; font-size:13px; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-bell text-danger"></i> ${gi.tip} (${gi.zaman})</span>
                    <button class="btn btn-danger btn-sm" onclick="markIstekTamamlandi('${gi.id}')" style="padding:4px 8px; font-size:11px;">Kapat</button>
                </div>
            `;
        });
        
        let siparisHtml = '';
        masa.istekler.forEach(siparis => {
            const isIptal = siparis.iptal || siparis.durum === 'İptal Edildi';
            let itemlerHtml = '';
            
            if(siparis.items) {
                siparis.items.forEach((item, index) => {
                    const itemIsIptal = item.iptal || isIptal;
                    const itemIsPaid = item.paid;
                    const paidAdet = item.paidAdet || 0;
                    const ikramAdet = item.ikramAdet || (item.ikram ? item.adet : 0);
                    
                    let statusBadge = '';
                    if(itemIsIptal) statusBadge = '<span class="badge" style="background:#fee2e2; color:#ef4444;">İptal</span>';
                    else if(itemIsPaid) statusBadge = '<span class="badge" style="background:#d1fae5; color:#10b981;">Ödendi</span>';
                    else if(ikramAdet >= item.adet) statusBadge = '<span class="badge" style="background:#fef3c7; color:#f59e0b;">İkram</span>';
                    else if(paidAdet > 0 || ikramAdet > 0) {
                        let bTxt = [];
                        if(paidAdet > 0) bTxt.push(`${paidAdet} Ödendi`);
                        if(ikramAdet > 0) bTxt.push(`${ikramAdet} İkram`);
                        statusBadge = `<span class="badge" style="background:#e0e7ff; color:#4f46e5;">${bTxt.join(' - ')}</span>`;
                    }
                    
                    const kalanAdet = Math.max(0, item.adet - paidAdet - ikramAdet);
                    const priceDisplay = (itemIsIptal) ? '0 ₺' : `${item.fiyat * kalanAdet} ₺`;
                    
                    let itemNoteHtml = item.not ? `<div class="note-badge"><i class="fa-solid fa-note-sticky"></i> ${item.not}</div>` : '';
                    
                    itemlerHtml += `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding: 6px 0; border-bottom: 1px dashed rgba(0,0,0,0.1); ${itemIsIptal?'opacity:0.5; text-decoration:line-through;':''}">
                            <div style="font-size:13px; font-weight: 500; color: var(--text-dark); display:flex; flex-direction:column; gap:4px;">
                                <div>${item.adet}x ${item.isim} ${statusBadge}</div>
                                ${itemNoteHtml}
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-weight:600; font-size:13px;">${priceDisplay}</span>
                                ${(!itemIsIptal && !itemIsPaid && kalanAdet > 0 && !isIptal) ? `<button class="btn btn-outline btn-sm" style="padding:2px 6px; font-size:11px;" onclick="ikramEtModalAc('${siparis.id}', ${index}, ${kalanAdet}, '${item.isim.replace(/'/g, "\\'")}')" title="İkram Et"><i class="fa-solid fa-gift"></i></button>` : ''}
                                ${(ikramAdet > 0 && !isIptal) ? `<button class="btn btn-danger-outline btn-sm" style="padding:2px 6px; font-size:11px;" onclick="ikramIptalEt('${siparis.id}', ${index})" title="İkram İptal"><i class="fa-solid fa-xmark"></i></button>` : ''}
                            </div>
                        </div>
                    `;
                });
            }
            
            siparisHtml += `
                <div style="margin-bottom:12px; background: ${siparis.isSeen ? 'rgba(255,255,255,0.6)' : '#fef3c7'}; border: 1px solid ${siparis.isSeen ? 'transparent' : '#f59e0b'}; padding: 10px; border-radius: 8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:12px; color:var(--text-muted); align-items:center;">
                        <span><i class="fa-solid fa-clock"></i> ${siparis.zaman} | ${siparis.durum}</span>
                        <div>
                        ${!siparis.isSeen ? `<button class="btn btn-primary btn-sm" style="padding:4px 8px; font-size: 11px;" onclick="markOrderSeen('${siparis.id}')">Görüldü</button>` : ''}
                        ${(siparis.durum === 'Alındı' || siparis.durum === 'bekliyor') && siparis.isSeen && !isIptal ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size: 11px;" onclick="updateOrderStatus('${siparis.id}', 'Hazırlanıyor')">Hazırlanıyor</button>` : ''}
                        ${(siparis.durum === 'Hazırlanıyor') && !isIptal ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size: 11px; margin-right:4px;" onclick="updateOrderStatus('${siparis.id}', 'Alındı')" title="Geri Al"><i class="fa-solid fa-rotate-left"></i></button><button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size: 11px; color:#10b981; border-color:#10b981;" onclick="updateOrderStatus('${siparis.id}', 'Servis Edildi')">Servis Et</button>` : ''}
                        ${(siparis.durum === 'Servis Edildi') && !isIptal ? `<button class="btn btn-outline btn-sm" style="padding:4px 8px; font-size: 11px;" onclick="updateOrderStatus('${siparis.id}', 'Hazırlanıyor')" title="Geri Al"><i class="fa-solid fa-rotate-left"></i> Hazırlanıyor</button>` : ''}
                        </div>
                    </div>
                    ${itemlerHtml}
                </div>
            `;
        });
        
        aktifSiparislerDiv.innerHTML += `
            <div class="admin-card" style="background: ${masa.hasUnseen ? '#f0f9ff' : '#fff'}; border: ${masa.hasUnseen ? '2px solid #3b82f6' : '1px solid var(--border-color)'}; box-shadow: var(--shadow-md);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid var(--primary); padding-bottom:10px; margin-bottom:10px;">
                    <h3 style="margin:0; color:var(--primary); font-size:18px;"><i class="fa-solid fa-utensils"></i> ${masaAdi}</h3>
                    <div style="font-weight:800; font-size:18px; color: var(--text-dark);">Tutar: ${masa.toplamTutar} ₺</div>
                </div>
                ${garsonHtml}
                ${siparisHtml}
                <div style="margin-top:16px;">
                    <button class="btn btn-primary" style="width:100%; font-size: 15px; padding: 12px; border-radius: var(--radius-md);" onclick="openOdemeModal('${masaAdi}')"><i class="fa-solid fa-credit-card"></i> Adisyon Böl / Ödeme Al</button>
                </div>
            </div>
        `;
    });

    if (count === 0) {
        aktifSiparislerDiv.innerHTML = '<div style="color: var(--text-muted); padding: 20px;">Aktif masa bulunmuyor.</div>';
    }

    if (currentUnseenCount > previousUnseenCount) {
        playNotificationSound();
        animateTabSiparisler();
    }
    previousUnseenCount = currentUnseenCount;

    if(window.renderBekleyenZ) window.renderBekleyenZ();
});

window.renderBekleyenZ = function() {
    const bekleyenDiv = document.getElementById('bekleyenZRaporlari');
    if(!bekleyenDiv) return;
    
    let masalarOzet = {};
    
    Object.keys(window.guncelSiparisler || {}).forEach(id => {
        const siparis = window.guncelSiparisler[id];
        if (siparis.arsiv && !siparis.zRaporlandi) {
            const seansKey = siparis.seansId || siparis.arsivZaman || id;
            
            if(!masalarOzet[siparis.masa]) masalarOzet[siparis.masa] = {};
            if(!masalarOzet[siparis.masa][seansKey]) {
                const d = siparis.arsivZaman ? new Date(siparis.arsivZaman) : new Date();
                const saat = d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                masalarOzet[siparis.masa][seansKey] = { saat, zamanObj: d, ciro: 0, nakit: 0, kart: 0, ikram: 0, urunler: [] };
            }

            let s = masalarOzet[siparis.masa][seansKey];

            if(siparis.items) {
                siparis.items.forEach(item => {
                    if (item.iptal) return;
                    
                    const iAdet = item.ikramAdet || (item.ikram ? item.adet : 0);
                    let pNakit = item.paidNakit || 0;
                    let pKart = item.paidKart || 0;
                    
                    if(item.paid && pNakit === 0 && pKart === 0) {
                        let legacyAdet = item.paidAdet || (item.adet - iAdet);
                        if(item.paymentMethod === 'Nakit') pNakit = legacyAdet;
                        else if(item.paymentMethod === 'Kredi Kartı') pKart = legacyAdet;
                    }
                    
                    if (iAdet > 0) {
                        const m = item.fiyat * iAdet;
                        s.ikram += m;
                        s.urunler.push({ ad: item.isim, adet: iAdet, tip: 'ikram', not: item.not });
                    }
                    if (pNakit > 0) {
                        const m = item.fiyat * pNakit;
                        s.nakit += m;
                        s.ciro += m;
                        s.urunler.push({ ad: item.isim, adet: pNakit, tip: 'Nakit', fiyat: m, not: item.not });
                    }
                    if (pKart > 0) {
                        const m = item.fiyat * pKart;
                        s.kart += m;
                        s.ciro += m;
                        s.urunler.push({ ad: item.isim, adet: pKart, tip: 'Kredi Kartı', fiyat: m, not: item.not });
                    }
                });
            }
        }
    });

    let html = '';
    let hasData = false;
    Object.keys(masalarOzet).forEach(masaAdi => {
        hasData = true;
        let total = 0;
        let döküm = '';
        
        const seansListesi = Object.values(masalarOzet[masaAdi]).sort((a,b) => a.zamanObj - b.zamanObj);
        
        seansListesi.forEach((h, index) => {
            if(h.ciro === 0 && h.ikram === 0) return;
            total += h.ciro;
            
            let urunlerHtml = '';
            h.urunler.forEach(u => {
                let notHtml = u.not ? `<div style="font-size:10px; color:var(--primary); padding-left:8px;"><i class="fa-solid fa-note-sticky"></i> ${u.not}</div>` : '';
                if(u.tip === 'ikram') {
                    urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#f59e0b; padding-left:8px; margin-bottom:2px;">
                        <div><i class="fa-solid fa-gift"></i> ${u.adet}x ${u.ad} (İkram)</div>
                        ${notHtml}
                    </div>`;
                } else if(u.tip === 'Nakit') {
                    urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#10b981; padding-left:8px; margin-bottom:2px;">
                        <div style="display:flex; justify-content:space-between;"><span><i class="fa-solid fa-money-bill-wave"></i> ${u.adet}x ${u.ad} (Nakit)</span> <span>${u.fiyat} ₺</span></div>
                        ${notHtml}
                    </div>`;
                } else if(u.tip === 'Kredi Kartı') {
                    urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#3b82f6; padding-left:8px; margin-bottom:2px;">
                        <div style="display:flex; justify-content:space-between;"><span><i class="fa-solid fa-credit-card"></i> ${u.adet}x ${u.ad} (Kart)</span> <span>${u.fiyat} ₺</span></div>
                        ${notHtml}
                    </div>`;
                } else {
                    urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:var(--text-dark); padding-left:8px; margin-bottom:2px;">
                        <div style="display:flex; justify-content:space-between;"><span>${u.adet}x ${u.ad} (${u.tip})</span> <span>${u.fiyat} ₺</span></div>
                        ${notHtml}
                    </div>`;
                }
            });

            let ikramSpan = h.ikram > 0 ? ` <span style="color:#f59e0b; font-size:10px;">(İkram: ${h.ikram}₺)</span>` : '';
            
            döküm += `<div style="display:flex; flex-direction:column; font-size:12px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #cbd5e1;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="badge" style="background:#e0e7ff; color:#4f46e5; font-size:10px; padding:2px 6px;">${index + 1}. Müşteri</span>
                        <span style="color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${h.saat}</span>
                    </div>
                    <span style="font-weight:600;">${h.ciro} ₺ ${ikramSpan}</span>
                </div>
                <div style="background:#f8fafc; border-radius:4px; padding:6px;">
                    ${urunlerHtml}
                </div>
            </div>`;
        });
        
        if (döküm !== '') {
            html += `<div style="background:white; border:1px solid var(--border-color); padding:12px; border-radius:8px; box-shadow:var(--shadow-sm); margin-bottom:12px;">
                <div style="font-weight:700; color:var(--primary); margin-bottom:8px; display:flex; justify-content:space-between;">
                    <span>${masaAdi}</span> <span>${total} ₺</span>
                </div>
                ${döküm}
            </div>`;
        }
    });

    if(!hasData || html === '') {
        html = '<div style="font-size: 13px; color: var(--text-muted);">Henüz kapanmış ve Z-Raporu bekleyen masa yok.</div>';
    }
    bekleyenDiv.innerHTML = html;
}

window.playNotificationSound = function() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch(e) {
        console.log("Audio blocked by browser policy.");
    }
}

window.animateTabSiparisler = function() {
    const tab = document.getElementById('tabBtnSiparisler');
    if(tab) {
        tab.classList.remove('pulse-ring-anim');
        void tab.offsetWidth; // trigger reflow
        tab.classList.add('pulse-ring-anim');
    }
}

window.markOrderSeen = function(id) {
    database.ref('hesapIstekleri/' + id).update({
        isSeen: true,
        durum: 'Alındı'
    }).then(() => showToast("Sipariş görüldü olarak işaretlendi!")).catch(e => showToast(e.message, "error"));
}

window.updateOrderStatus = function(id, durum) {
    database.ref('hesapIstekleri/' + id).update({
        durum: durum,
        isSeen: true
    }).then(() => showToast(`Durum '${durum}' olarak güncellendi!`)).catch(e => showToast(e.message, "error"));
}

window.markIstekTamamlandi = function(id) {
    database.ref('hesapIstekleri/' + id).update({ arsiv: true, arsivZaman: new Date().toISOString() })
        .then(() => showToast("İstek kapatıldı."));
}

window.ikramEtModalAc = function(siparisId, itemIndex, kalanAdet, isim) {
    document.getElementById('ikramSiparisId').value = siparisId;
    document.getElementById('ikramItemIndex').value = itemIndex;
    document.getElementById('ikramKalanAdet').innerText = kalanAdet;
    document.getElementById('ikramUrunIsmi').innerText = isim;
    document.getElementById('ikramAdetInput').max = kalanAdet;
    document.getElementById('ikramAdetInput').value = 1;
    document.getElementById('ikramOverlay').classList.add('active');
}

window.closeIkramModal = function() {
    document.getElementById('ikramOverlay').classList.remove('active');
}

window.changeIkramAdet = function(change) {
    const input = document.getElementById('ikramAdetInput');
    let val = parseInt(input.value) + change;
    const max = parseInt(input.max);
    if(val < 1) val = 1;
    if(val > max) val = max;
    input.value = val;
}

window.saveIkram = function() {
    const siparisId = document.getElementById('ikramSiparisId').value;
    const itemIndex = document.getElementById('ikramItemIndex').value;
    const ikramAdet = parseInt(document.getElementById('ikramAdetInput').value);
    
    const siparis = window.guncelSiparisler[siparisId];
    if(!siparis || !siparis.items || !siparis.items[itemIndex]) return;
    
    const currentItem = siparis.items[itemIndex];
    const prevIkram = currentItem.ikramAdet || (currentItem.ikram ? currentItem.adet : 0);
    const newIkram = prevIkram + ikramAdet;
    
    const updates = {};
    updates[`hesapIstekleri/${siparisId}/items/${itemIndex}/ikramAdet`] = newIkram;
    if(newIkram >= currentItem.adet) {
        updates[`hesapIstekleri/${siparisId}/items/${itemIndex}/ikram`] = true;
    }
    
    database.ref().update(updates).then(() => {
        showToast(`${ikramAdet} adet ürün ikram edildi!`);
        closeIkramModal();
        const masaAdi = siparis.masa;
        setTimeout(() => checkAndAutoCloseTable(masaAdi), 500);
    });
}

window.ikramIptalEt = function(siparisId, itemIndex) {
    showConfirm("İkram İptal", "Bu üründeki ikramı iptal edip asıl fiyattan adisyona geri eklemek istediğinize emin misiniz?", () => {
        const siparis = window.guncelSiparisler[siparisId];
        if(!siparis || !siparis.items || !siparis.items[itemIndex]) return;

        const updates = {};
        updates[`hesapIstekleri/${siparisId}/items/${itemIndex}/ikramAdet`] = 0;
        updates[`hesapIstekleri/${siparisId}/items/${itemIndex}/ikram`] = false;

        database.ref().update(updates).then(() => {
            showToast("İkram başarıyla iptal edildi, ürün adisyona geri eklendi.");
            const masaAdi = siparis.masa;
            setTimeout(() => checkAndAutoCloseTable(masaAdi), 500);
        });
    });
}

let currentOdemeMasa = '';
window.openOdemeModal = function(masaAdi) {
    currentOdemeMasa = masaAdi;
    document.getElementById('odemeMasaIsmi').innerText = masaAdi;
    
    const listDiv = document.getElementById('odemeUrunListesi');
    listDiv.innerHTML = '';
    
    window.odemeItems = [];
    
    Object.keys(window.guncelSiparisler).forEach(id => {
        const siparis = window.guncelSiparisler[id];
        if(siparis.masa === masaAdi && !siparis.arsiv && siparis.tip === 'Sipariş' && !siparis.iptal && siparis.durum !== 'İptal Edildi') {
            if(siparis.items) {
                siparis.items.forEach((item, index) => {
                    if(!item.iptal && !item.paid && !item.ikram) {
                        const iAdet = item.ikramAdet || 0;
                        const pAdet = item.paidAdet || 0;
                        const remaining = item.adet - pAdet - iAdet;
                        if(remaining > 0) {
                            window.odemeItems.push({
                                siparisId: id,
                                itemIndex: index,
                                item: item,
                                maxAdet: remaining,
                                secilenAdet: 0
                            });
                        }
                    }
                });
            }
        }
    });
    
    if(window.odemeItems.length === 0) {
        // Zaten ödenecek bir şey yoksa (hepsi iptal/ikram/ödendi ise) direkt arşive gönder
        islemYapOdeme('Kapat');
        return;
    }
    
    renderOdemeModalItems();
    document.getElementById('odemeOverlay').classList.add('active');
}

window.closeOdemeModal = function() {
    document.getElementById('odemeOverlay').classList.remove('active');
}



function renderOdemeModalItems() {
    const listDiv = document.getElementById('odemeUrunListesi');
    let html = '';
    let seciliTutar = 0;
    
    window.odemeItems.forEach((oi, i) => {
        seciliTutar += (oi.secilenAdet * oi.item.fiyat);
        
        const isSelected = oi.secilenAdet > 0;
        
        html += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; border-radius:var(--radius-md); background: ${isSelected ? '#fffbf0' : '#fff'}; transition: all 0.2s;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:600; color: var(--text-dark);">${oi.maxAdet}x ${oi.item.isim}</span>
                        <span style="font-size:12px; color:var(--text-muted);">Birim: ${oi.item.fiyat} ₺</span>
                    </div>
                </div>
                
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-weight:800; color: var(--primary); min-width: 60px; text-align:right;">${oi.item.fiyat * oi.secilenAdet} ₺</div>
                    
                    <div style="display:flex; align-items:center; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: white;">
                        <button class="btn" style="padding: 6px 12px; border:none; background:transparent; border-radius:0; color: var(--text-dark); box-shadow: none;" onclick="degistirOdemeAdet(${i}, -1)"><i class="fa-solid fa-minus"></i></button>
                        <span style="font-weight: bold; width: 24px; text-align: center;">${oi.secilenAdet}</span>
                        <button class="btn" style="padding: 6px 12px; border:none; background:transparent; border-radius:0; color: var(--text-dark); box-shadow: none;" onclick="degistirOdemeAdet(${i}, 1)"><i class="fa-solid fa-plus"></i></button>
                        <button class="btn" style="padding: 6px 12px; border:none; border-left: 1px solid var(--border-color); background:#f8fafc; border-radius:0; color: var(--primary); font-size: 12px; box-shadow: none;" onclick="tumunuSecOdeme(${i})" title="Tümünü Seç">HEPSİ</button>
                    </div>
                </div>
            </div>
        `;
    });
    
    listDiv.innerHTML = html;
    document.getElementById('odemeSeciliTutar').innerText = seciliTutar + ' ₺';
}

window.degistirOdemeAdet = function(index, change) {
    let newVal = window.odemeItems[index].secilenAdet + change;
    if(newVal < 0) newVal = 0;
    if(newVal > window.odemeItems[index].maxAdet) newVal = window.odemeItems[index].maxAdet;
    window.odemeItems[index].secilenAdet = newVal;
    renderOdemeModalItems();
}

window.tumunuSecOdeme = function(index) {
    window.odemeItems[index].secilenAdet = window.odemeItems[index].maxAdet;
    renderOdemeModalItems();
}

window.islemYapOdeme = function(yontem) {
    const updates = {};
    let anySelected = false;
    
    if(yontem !== 'Kapat') {
        const increments = {};
        window.odemeItems.forEach(oi => {
            if(oi.secilenAdet > 0) {
                anySelected = true;
                const key = `${oi.siparisId}_${oi.itemIndex}`;
                if(!increments[key]) increments[key] = { oi: oi, count: 0 };
                increments[key].count += oi.secilenAdet;
            }
        });
        
        if(!anySelected) {
            showToast("Lütfen ödemesi alınacak ürünleri seçin (adet belirleyin)!", "error");
            return;
        }

        Object.values(increments).forEach(inc => {
            const siparisId = inc.oi.siparisId;
            const itemIndex = inc.oi.itemIndex;
            const originalItem = window.guncelSiparisler[siparisId].items[itemIndex];

            if(yontem === 'Nakit') {
                originalItem.paidNakit = (originalItem.paidNakit || 0) + inc.count;
            } else if (yontem === 'Kredi Kartı') {
                originalItem.paidKart = (originalItem.paidKart || 0) + inc.count;
            }

            originalItem.paidAdet = (originalItem.paidNakit || 0) + (originalItem.paidKart || 0);
            originalItem.payZaman = new Date().toISOString();

            if (originalItem.paidAdet + (originalItem.ikramAdet || 0) >= originalItem.adet) {
                originalItem.paid = true;
            }
            updates[`hesapIstekleri/${siparisId}/items/${itemIndex}`] = originalItem;
        });
    }
    
    if(yontem === 'Kapat') {
        const seansId = 'seans_' + Date.now();
        Object.keys(window.guncelSiparisler).forEach(id => {
            const siparis = window.guncelSiparisler[id];
            if(siparis.masa === currentOdemeMasa && !siparis.arsiv) {
                updates[`hesapIstekleri/${id}/arsiv`] = true;
                updates[`hesapIstekleri/${id}/arsivZaman`] = new Date().toISOString();
                updates[`hesapIstekleri/${id}/zRaporlandi`] = false;
                updates[`hesapIstekleri/${id}/seansId`] = seansId;
            }
        });
        showToast(`${currentOdemeMasa} hesabı zorla kapatıldı ve arşive aktarıldı!`);
    } else {
        showToast(`Seçili ürünler için ${yontem} tahsilatı yapıldı!`);
    }
    
    database.ref().update(updates).then(() => {
        closeOdemeModal();
        if(yontem !== 'Kapat') {
            setTimeout(() => checkAndAutoCloseTable(currentOdemeMasa), 500);
        }
    });
}

// ---------------- GÖRSEL MODAL FONKSİYONLARI ----------------
window.openGorselModal = function(id) {
    const urun = tumUrunler[id];
    if (!urun) return;
    document.getElementById('gorselUrunId').value = id;
    document.getElementById('modalUrunGorsel').value = urun.gorsel || '';
    document.getElementById('gorselOverlay').classList.add('active');
}

window.closeGorselModal = function() {
    document.getElementById('gorselOverlay').classList.remove('active');
}

window.saveUrunGorsel = function() {
    const id = document.getElementById('gorselUrunId').value;
    const gorsel = document.getElementById('modalUrunGorsel').value.trim();
    if(id) {
        database.ref('urunler/' + id).update({ gorsel: gorsel }).then(() => {
            showToast("Görsel başarıyla güncellendi!");
            closeGorselModal();
        });
    }
}

// ---------------- Z-RAPORU VE ARŞİV ----------------
window.alZRaporu = function() {
    showConfirm("Z-Raporu Al", "Emin misiniz? Günü kapatarak bugünkü aktif ve arşive düşen tüm ödemeler Z-Raporu olarak kaydedilecektir.", () => {
    
    let nakit = 0;
    let kart = 0;
    let ikramToplam = 0;
    const updates = {};
    const masalarOzet = {};
    
    Object.keys(window.guncelSiparisler || {}).forEach(id => {
        const siparis = window.guncelSiparisler[id];
        if (siparis.arsiv && !siparis.zRaporlandi) {
            const seansKey = siparis.seansId || siparis.arsivZaman || id;
            
            if(!masalarOzet[siparis.masa]) masalarOzet[siparis.masa] = {};
            if(!masalarOzet[siparis.masa][seansKey]) {
                const d = siparis.arsivZaman ? new Date(siparis.arsivZaman) : new Date();
                const saat = d.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
                masalarOzet[siparis.masa][seansKey] = { saat, zamanObj: d.getTime(), ciro: 0, nakit: 0, kart: 0, ikram: 0, urunler: [] };
            }

            let s = masalarOzet[siparis.masa][seansKey];

            if(siparis.items) {
                siparis.items.forEach(item => {
                    if (item.iptal) return;
                    
                    const iAdet = item.ikramAdet || (item.ikram ? item.adet : 0);
                    let pNakit = item.paidNakit || 0;
                    let pKart = item.paidKart || 0;
                    
                    if(item.paid && pNakit === 0 && pKart === 0) {
                        let legacyAdet = item.paidAdet || (item.adet - iAdet);
                        if(item.paymentMethod === 'Nakit') pNakit = legacyAdet;
                        else if(item.paymentMethod === 'Kredi Kartı') pKart = legacyAdet;
                    }
                    
                    if (iAdet > 0) {
                        const m = (item.fiyat * iAdet);
                        ikramToplam += m;
                        s.ikram += m;
                        s.urunler.push({ ad: item.isim, adet: iAdet, tip: 'ikram', not: item.not || '' });
                    }
                    
                    if (pNakit > 0) {
                        const m = (item.fiyat * pNakit);
                        nakit += m;
                        s.nakit += m;
                        s.ciro += m;
                        s.urunler.push({ ad: item.isim, adet: pNakit, tip: 'Nakit', fiyat: m, not: item.not || '' });
                    }
                    if (pKart > 0) {
                        const m = (item.fiyat * pKart);
                        kart += m;
                        s.kart += m;
                        s.ciro += m;
                        s.urunler.push({ ad: item.isim, adet: pKart, tip: 'Kredi Kartı', fiyat: m, not: item.not || '' });
                    }
                });
            }
            updates[`hesapIstekleri/${id}/zRaporlandi`] = true;
        }
    });
    
    if(nakit === 0 && kart === 0 && ikramToplam === 0) {
        showToast("Bugün için kapatılacak yeni bir hesap/satış bulunmuyor.", "error");
        return;
    }
    
    let finalMasalar = {};
    let toplamSeans = 0;
    
    Object.keys(masalarOzet).forEach(masaAdi => {
        const seansListesi = Object.values(masalarOzet[masaAdi]).sort((a,b) => a.zamanObj - b.zamanObj);
        let validSeanslar = [];
        seansListesi.forEach((h) => {
            if(h.ciro > 0 || h.ikram > 0) {
                validSeanslar.push(h);
                toplamSeans++;
            }
        });
        if(validSeanslar.length > 0) {
            finalMasalar[masaAdi] = validSeanslar;
        }
    });

    const zRaporu = {
        tarih: new Date().toLocaleDateString('tr-TR'),
        zaman: new Date().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
        nakit: nakit,
        kart: kart,
        ikram: ikramToplam,
        toplamCiro: nakit + kart,
        toplamSeans: toplamSeans,
        masalar: finalMasalar
    };
    
    database.ref('zRaporlari').push(zRaporu).then(() => {
        if(Object.keys(updates).length > 0) {
            database.ref().update(updates);
        }
        showToast("Z-Raporu başarıyla alındı ve kaydedildi!");
    });
    }, 'danger');
}

database.ref('zRaporlari').on('value', (snapshot) => {
    const arsivDiv = document.getElementById('arsivListesi');
    if(!arsivDiv) return;
    
    arsivDiv.innerHTML = '';
    const raporlar = snapshot.val() || {};
    let count = 0;
    
    Object.keys(raporlar).reverse().forEach(id => {
        count++;
        const r = raporlar[id];
        let masaDökümüHtml = '';
        if(r.masalar && Object.keys(r.masalar).length > 0) {
            masaDökümüHtml = `<div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                <h4 style="font-size: 14px; font-weight: 700; color: var(--text-dark); margin-bottom: 10px;">Masa Dökümü</h4>
                <div style="display:flex; flex-direction:column; gap:12px;">`;
            
            Object.keys(r.masalar).forEach(masaAdi => {
                masaDökümüHtml += `<div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; color: var(--primary); margin-bottom: 8px; font-size: 14px;">${masaAdi}</div>`;
                
                r.masalar[masaAdi].forEach((hesap, index) => {
                    let urunlerHtml = '';
                    if (hesap.urunler) {
                        hesap.urunler.forEach(u => {
                            let notHtml = u.not ? `<div style="font-size:10px; color:var(--primary); padding-left:8px;"><i class="fa-solid fa-note-sticky"></i> ${u.not}</div>` : '';
                            if(u.tip === 'ikram') {
                                urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#f59e0b; padding-left:8px; margin-bottom:2px;">
                                    <div><i class="fa-solid fa-gift"></i> ${u.adet}x ${u.ad} (İkram)</div>
                                    ${notHtml}
                                </div>`;
                            } else if(u.tip === 'Nakit') {
                                urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#10b981; padding-left:8px; margin-bottom:2px;">
                                    <div style="display:flex; justify-content:space-between;"><span><i class="fa-solid fa-money-bill-wave"></i> ${u.adet}x ${u.ad} (Nakit)</span> <span>${u.fiyat} ₺</span></div>
                                    ${notHtml}
                                </div>`;
                            } else if(u.tip === 'Kredi Kartı') {
                                urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:#3b82f6; padding-left:8px; margin-bottom:2px;">
                                    <div style="display:flex; justify-content:space-between;"><span><i class="fa-solid fa-credit-card"></i> ${u.adet}x ${u.ad} (Kart)</span> <span>${u.fiyat} ₺</span></div>
                                    ${notHtml}
                                </div>`;
                            } else {
                                urunlerHtml += `<div style="font-size:11px; display:flex; flex-direction:column; color:var(--text-dark); padding-left:8px; margin-bottom:2px;">
                                    <div style="display:flex; justify-content:space-between;"><span>${u.adet}x ${u.ad} (${u.tip})</span> <span>${u.fiyat} ₺</span></div>
                                    ${notHtml}
                                </div>`;
                            }
                        });
                    }

                    masaDökümüHtml += `<div style="display:flex; flex-direction:column; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; margin-bottom: 8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span class="badge" style="background:#e0e7ff; color:#4f46e5; font-size:10px; padding:2px 6px;">${index + 1}. Müşteri</span>
                                <span style="font-size:12px; color:var(--text-muted);"><i class="fa-regular fa-clock"></i> ${hesap.saat}</span>
                            </div>
                            <span style="font-weight:600; font-size:12px;">${hesap.ciro} ₺ ${hesap.ikram > 0 ? ` <span style="color:#f59e0b; font-size:10px;">(İkram: ${hesap.ikram}₺)</span>` : ''}</span>
                        </div>
                        <div style="background:white; border-radius:4px; padding:6px; border: 1px solid #e2e8f0;">
                            ${urunlerHtml}
                        </div>
                    </div>`;
                });
                masaDökümüHtml += `</div>`;
            });
            masaDökümüHtml += `</div></div>`;
        }

        arsivDiv.innerHTML += `
            <div style="background: white; border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: var(--shadow-sm); position: relative;">
                <button class="btn btn-outline btn-sm" style="position: absolute; right: 16px; top: 16px; border-color: #ef4444; color: #ef4444; padding: 4px 8px;" onclick="deleteZRaporu('${id}')" title="Bu Raporu Sil"><i class="fa-solid fa-trash"></i></button>
                <div style="display:flex; justify-content:space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; padding-right: 40px;">
                    <span style="font-weight:700; font-size:16px; color:var(--text-dark);"><i class="fa-solid fa-calendar-day text-primary"></i> ${r.tarih} - ${r.zaman}</span>
                    <span class="badge" style="background:#f0f9ff; color:#0369a1;">Z-Raporu #${count}</span>
                </div>
                
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <div style="background:#f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align:center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight:600; margin-bottom:4px;">Nakit</div>
                        <div style="font-size: 16px; font-weight: 800; color: #10b981;">${r.nakit || 0} ₺</div>
                    </div>
                    <div style="background:#f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align:center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight:600; margin-bottom:4px;">Kredi Kartı</div>
                        <div style="font-size: 16px; font-weight: 800; color: #3b82f6;">${r.kart || 0} ₺</div>
                    </div>
                    <div style="background:#f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align:center;">
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight:600; margin-bottom:4px;">Toplam İkram</div>
                        <div style="font-size: 16px; font-weight: 800; color: #f59e0b;">${r.ikram || 0} ₺</div>
                    </div>
                    <div style="background:#f8fafc; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align:center; position:relative; overflow:hidden;">
                        <div style="position:absolute; top:0; left:0; right:0; height:4px; background:var(--primary);"></div>
                        <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight:600; margin-bottom:4px;">Toplam Ciro</div>
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-dark);">${r.toplamCiro || 0} ₺</div>
                    </div>
                    <div style="background:#e0e7ff; padding: 10px; border-radius: 8px; border: 1px solid #c7d2fe; text-align:center; grid-column: span 2;">
                        <div style="font-size: 11px; color: #4f46e5; text-transform: uppercase; font-weight:700; margin-bottom:4px;">Hizmet Verilen Seans</div>
                        <div style="font-size: 16px; font-weight: 800; color: #312e81;">${r.toplamSeans || 0} Müşteri</div>
                    </div>
                </div>
                ${masaDökümüHtml}
            </div>
        `;
    });
    
    if(count === 0) {
        arsivDiv.innerHTML = '<div style="color:var(--text-muted); padding:20px;">Henüz arşivlenmiş Z-Raporu bulunmuyor.</div>';
    }
});

window.deleteZRaporu = function(id) {
    showConfirm("Raporu Sil", "Bu Z-Raporunu silmek istediğinize emin misiniz?", () => {
        database.ref('zRaporlari/' + id).remove().then(() => showToast("Z-Raporu silindi!"));
    });
}

window.arsiviTemizle = function() {
    showConfirm("Arşivi Tamamen Temizle", "Tüm geçmiş Z-Raporları ve arşive alınmış sipariş kayıtları tamamen silinecektir. Bu işlem geri alınamaz! Emin misiniz?", () => {
        const updates = {};
        updates['zRaporlari'] = null;
        
        // Find archived hesapIstekleri
        Object.keys(window.guncelSiparisler || {}).forEach(id => {
            if(window.guncelSiparisler[id].arsiv) {
                updates[`hesapIstekleri/${id}`] = null;
            }
        });
        
        if (Object.keys(updates).length > 0) {
            database.ref().update(updates).then(() => {
                showToast("Arşiv tamamen temizlendi!");
            }).catch(e => showToast("Hata: " + e.message, "error"));
        } else {
            showToast("Temizlenecek veri bulunamadı.");
        }
    });
}