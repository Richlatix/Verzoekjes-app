const SUPABASE_URL = localStorage.getItem('custom_supabase_url') || "https://vwbhqtmrenfaqcbwmmqx.supabase.co";
const SUPABASE_KEY = localStorage.getItem('custom_supabase_key') || "sb_publishable_BZTtNRR2HHFUGZm_R3LahA_XcfQwqHX";

let dbClient = null;
let activeDjPin = "3977";
const MASTER_KEY = "Admin3977";

document.addEventListener("DOMContentLoaded", () => {
  dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  loadAdminSettings();
});

function toonPopup(bericht) {
  const oude = document.getElementById('custom-toast');
  if (oude) oude.remove();
  const p = document.createElement('div');
  p.id = 'custom-toast';
  p.className = 'toast-popup';
  p.innerText = bericht;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 3000);
}

function verifyAdminPin() {
  const val = document.getElementById('admin-pin-input').value.trim();
  if (val === activeDjPin || val === MASTER_KEY) {
    document.getElementById('admin-login-card').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    toonPopup('Welkom in het Beheer!');
  } else {
    toonPopup('Onjuiste pincode!');
    document.getElementById('admin-pin-input').value = '';
  }
}

async function loadAdminSettings() {
  if (!dbClient) return;
  document.getElementById('setting-supabase-url').value = SUPABASE_URL;
  document.getElementById('setting-supabase-key').value = SUPABASE_KEY;

  const { data } = await dbClient.from('settings').select('*').in('key', ['app_colors', 'app_pincode', 'logo_url', 'app_brand_name']);
  if (data) {
    data.forEach(item => {
      if (item.key === 'app_colors') {
        try {
          const c = JSON.parse(item.value);
          if(c.bg) document.getElementById('col-bg').value = c.bg;
          if(c.card) document.getElementById('col-card').value = c.card;
          if(c.accent) document.getElementById('col-accent').value = c.accent;
          if(c.text) document.getElementById('col-text').value = c.text;
        } catch(e) {}
      }
      if (item.key === 'app_pincode' && item.value) {
        document.getElementById('setting-pincode').value = item.value;
        activeDjPin = item.value;
      }
      if (item.key === 'logo_url') {
        if (item.value === 'REMOVED' || !item.value) {
          toggleTextBrandMode(true);
        } else {
          toggleTextBrandMode(false);
          const preview = document.getElementById('current-logo-preview');
          if (preview) preview.src = item.value + (item.value.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        }
      }
      if (item.key === 'app_brand_name') {
        document.getElementById('setting-brand-name').value = item.value || '';
      }
    });
  }
  if (!document.getElementById('setting-pincode').value) {
    document.getElementById('setting-pincode').value = activeDjPin;
  }
}

function toggleTextBrandMode(isTextMode) {
  const logoSection = document.getElementById('logo-active-section');
  const textSection = document.getElementById('text-brand-section');
  if (isTextMode) {
    if (logoSection) logoSection.classList.add('hidden');
    if (textSection) textSection.classList.remove('hidden');
  } else {
    if (logoSection) logoSection.classList.remove('hidden');
    if (textSection) textSection.classList.add('hidden');
  }
}

async function removeLogo() {
  if (!confirm("Weet je zeker dat je het logo wilt verwijderen?")) return;
  await dbClient.from('settings').upsert({ key: 'logo_url', value: 'REMOVED' }, { onConflict: 'key' });
  toggleTextBrandMode(true);
  toonPopup('Logo verwijderd!');
}

async function undoRemoveLogo() {
  await dbClient.from('settings').upsert({ key: 'logo_url', value: 'Logo.png' }, { onConflict: 'key' });
  toggleTextBrandMode(false);
  const preview = document.getElementById('current-logo-preview');
  if (preview) preview.src = 'Logo.png?' + new Date().getTime();
  toonPopup('Teruggeschakeld naar logo-modus.');
}

async function saveBrandName() {
  const name = document.getElementById('setting-brand-name').value.trim();
  if (!name) return toonPopup('Vul een tekstnaam in!');
  await dbClient.from('settings').upsert({ key: 'app_brand_name', value: name }, { onConflict: 'key' });
  toonPopup('Tekstnaam opgeslagen!');
}

async function clearXmlDatabase() {
  const pinCheck = prompt("Typ de DJ-pincode om te bevestigen:");
  if (pinCheck !== activeDjPin) return toonPopup("Onjuiste pincode.");
  if (!confirm("Weet je zeker dat je de database wilt wissen?")) return;

  const { error } = await dbClient.from('requests').delete().neq('id', 0); 
  if (error) toonPopup("Fout bij legen database.");
  else toonPopup("Database gewist!");
}

async function saveColors() {
  const colors = {
    bg: document.getElementById('col-bg').value,
    card: document.getElementById('col-card').value,
    accent: document.getElementById('col-accent').value,
    text: document.getElementById('col-text').value
  };
  await dbClient.from('settings').upsert({ key: 'app_colors', value: JSON.stringify(colors) }, { onConflict: 'key' });
  toonPopup('Kleuren opgeslagen!');
}

async function savePincode() {
  const pin = document.getElementById('setting-pincode').value.trim();
  if (pin.length !== 4) return toonPopup('De pincode moet exact 4 cijfers bevatten!');
  await dbClient.from('settings').upsert({ key: 'app_pincode', value: pin }, { onConflict: 'key' });
  activeDjPin = pin;
  toonPopup('Pincode opgeslagen en gesynchroniseerd!');
}

function saveSupabaseCredentials() {
  const url = document.getElementById('setting-supabase-url').value.trim();
  const key = document.getElementById('setting-supabase-key').value.trim();
  const pass = document.getElementById('setting-admin-pass').value.trim();

  if (pass !== MASTER_KEY) return toonPopup("❌ Onjuist admin-wachtwoord!");
  if (!url || !key) return toonPopup('URL en Key mogen niet leeg zijn!');

  if (confirm("Weet je zeker dat je de Supabase koppeling wilt wijzigen?")) {
    localStorage.setItem('custom_supabase_url', url);
    localStorage.setItem('custom_supabase_key', key);
    toonPopup('Opgeslagen. Bezig met herladen...');
    setTimeout(() => location.reload(), 1500);
  }
}

async function uploadLogo() {
  const fileInput = document.getElementById('logo-file-input');
  const file = fileInput.files[0];
  if (!file) return toonPopup('Kies eerst een afbeelding!');

  const fileExt = file.name.split('.').pop();
  const fileName = `logo_${Date.now()}.${fileExt}`;

  const { error } = await dbClient.storage.from('media').upload(fileName, file, { upsert: true });
  if (error) {
    toonPopup('Fout bij uploaden naar bucket "media"!');
  } else {
    const { data: publicData } = dbClient.storage.from('media').getPublicUrl(fileName);
    if (publicData && publicData.publicUrl) {
      await dbClient.from('settings').upsert({ key: 'logo_url', value: publicData.publicUrl }, { onConflict: 'key' });
      const preview = document.getElementById('current-logo-preview');
      if (preview) preview.src = publicData.publicUrl + '?' + new Date().getTime();
      toggleTextBrandMode(false);
    }
    toonPopup('Logo opgeslagen!');
    fileInput.value = '';
  }
}
