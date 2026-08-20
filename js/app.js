/* =================== DATA =================== */
const fmt = n => n.toLocaleString('fr-FR').replace(/\u202f|,/g,' ') + ' F';

// Squelettes de chargement (CDC \u00a79.1/\u00a79.2) \u2014 silhouette du contenu \u00e0 venir
// plut\u00f4t qu'un \u00e9cran vide ou une roue qui tourne dans le vide.
function skeletonTableRows(cols, rows=4){
  return Array.from({length:rows}, ()=>`<tr><td colspan="${cols}"><div class="sk sk-row"></div></td></tr>`).join('');
}
function skeletonCards(n=4){
  return Array.from({length:n}, ()=>`<div class="sk sk-card"></div>`).join('');
}

// Catalogue chargé depuis le vrai backend (fetchCatalogue(), voir plus bas) —
// plus de données figées : ces tableaux sont peuplés après connexion.
let CATS = [];
let SERVICES = [];

// Rendez-vous réels (fetchAppointments(), voir plus bas) — plus de créneaux fictifs.
let RDV = [];
const STATUS = {
  a_venir: ['gold','À venir'],
  attente_sur_place: ['blue','Sur place'],
  en_cours: ['blue','En cours'],
  termine: ['green','Terminé'],
  encaisse: ['green','Encaissé'],
  annule: ['grey','Annulé'],
  absent: ['grey','Absent'],
};
const RDV_OPEN_STATUTS = ['a_venir','attente_sur_place','en_cours'];

// Clients chargés depuis le vrai backend (fetchClients(), voir plus bas).
let CLIENTS = [];

/* --- Programme de fidélité --- */
const TIERS = [
  {id:'or',     name:'Or',     min:500, disc:10, color:'linear-gradient(135deg,#E0B45A,#C99A3B)', ico:'🥇'},
  {id:'argent', name:'Argent', min:200, disc:5,  color:'linear-gradient(135deg,#C7CBD1,#9AA0A8)', ico:'🥈'},
  {id:'bronze', name:'Bronze', min:0,   disc:0,  color:'linear-gradient(135deg,#C89B6E,#A9744B)', ico:'🥉'},
];
function tierOf(pts){ return TIERS.find(t=>pts>=t.min); }
const PT_PER_F = 100;      // 1 point pour 100 F dépensés
const PT_BLOCK = 100;      // échange par bloc de 100 pts
const PT_VALUE = 1000;     // 100 pts = 1 000 F de réduction

const TEAM = [
  {name:'Modou Séne', role:'Barber senior', clients:32, ca:'418 K', note:'4.9'},
  {name:'Fatou Diallo', role:'Spécialiste tresses', clients:24, ca:'356 K', note:'4.8'},
  {name:'Awa Ndoye', role:'Coloriste', clients:19, ca:'289 K', note:'4.7'},
  {name:'Cheikh Mbaye', role:'Barber', clients:21, ca:'182 K', note:'4.6'},
];

// Stock réel (fetchStock(), voir plus bas) — plus de produits fictifs.
let STOCK = [];

// Identifiants alignés sur les valeurs acceptées par l'API (PayTicketDto).
// Seuls Wave, Orange Money (Max It) et Espèces sont proposés — Free Money et
// carte ne sont pas couverts par UnitechPay pour l'instant, retirés de l'écran.
const LOGO_WAVE = 'data:image/png;base64,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';
const LOGO_OM = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAActpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+QWRvYmUgSW1hZ2VSZWFkeTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KKS7NPQAAQABJREFUeAHt3QmcXFWd6PF/b1lJCAkhgWxNCAKiKKskDE/ggYLioKPjc32TAecpjOP6YZvJuEVnAEcWAfX5dHzKOA46KjDiEEQ+vJGEVcBhWLKQfSMJSUhCll7f/3+qTqfSqb5d1V11+lSd3/2ku6rrVt17zvec1P9/z90aunUSJgQQQAABBBBISqAxqdpSWQQQQAABBBBwAiQAdAQEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQQAABBBIUIAFIsNGpMgIIIIAAAiQA9AEEEEAAAQQSFCABSLDRqTICCCCAAAIkAPQBBBBAAAEEEhQgAUiw0akyAggggAACJAD0AQQQ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ECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoGeSV5YAAAT+SURBVBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiECABiKARKAICCCCAAAKhBUgAQouzPgQQQAABBCIQIAGIoBEoAgIIIIAAAqEFSABCi7M+BBBAAAEEIhAgAYigESgCAggggAACoQVIAEKLsz4EEEAAAQQiEPj/NV/EUk7ygfYAAAAASUVORK5CYII=';

const PAY_METHODS = [
  {id:'wave', name:'Wave', tag:'Mobile money', img:LOGO_WAVE, bg:'linear-gradient(135deg,#12C0FF,#0A9BE0)', logo:'Wave'},
  {id:'orange_money', name:'Orange Money (Max It)', tag:'Mobile money', img:LOGO_OM, bg:'#FF7900', logo:'OM'},
  {id:'especes', name:'Espèces', tag:'Comptant', bg:'linear-gradient(135deg,#2F9E6B,#1F7E52)', logo:'💵'},
];

/* =================== STATE =================== */
let cart = [];          // {name, price, qty, e}
let currentCat = 'homme';
let caisseCat = 'homme';
// Réponse /stats/overview du jour (from=to=aujourd'hui) — remplace l'ancien
// compteur local dayCA/dayClients qui n'était jamais synchronisé avec le
// serveur (ni entre onglets, ni entre appareils).
let todayOverview = null;
async function fetchTodayOverview(){
  const today = new Date().toISOString().slice(0,10);
  try{
    todayOverview = await apiFetch(`/stats/overview?from=${today}&to=${today}`);
  }catch(err){
    todayOverview = null;
  }
  const caEl = document.getElementById('kpi-ca');
  const clEl = document.getElementById('kpi-clients');
  if(caEl) caEl.textContent = fmt(todayOverview?.ca||0);
  if(clEl) clEl.textContent = todayOverview?.tickets||0;
  const caDeltaEl = document.getElementById('kpi-ca-delta');
  if(caDeltaEl){
    const v = todayOverview?.variationPct;
    caDeltaEl.classList.toggle('k-up', v==null || v>=0);
    caDeltaEl.classList.toggle('k-dn', v!=null && v<0);
    caDeltaEl.textContent = v==null ? 'Pas de comparaison hier' : `${v>=0?'▲ +':'▼ '}${v}% vs hier`;
  }
  const clDeltaEl = document.getElementById('kpi-clients-delta');
  if(clDeltaEl){
    const t = todayOverview?.tickets||0, ca = todayOverview?.ca||0;
    clDeltaEl.textContent = t ? `▲ panier moyen ${fmt(Math.round(ca/t))}` : 'Aucun client servi aujourd\'hui';
  }
}
let payState = {method:null};
let currentClient = null;   // index dans CLIENTS ou null
let COIFFEURS = [];         // chargé depuis GET /users?role=coiffeur
let currentTicketId = null;
let currentCashSessionId = null;

/* =================== NAV =================== */
const TITLES = {
  dash:['Tableau de bord',"Vue d'ensemble du salon · aujourd'hui"],
  rdv:['Rendez-vous','Planning et réservations'],
  prestations:['Prestations',"Catalogue complet des services"],
  caisse:['Caisse','Encaissement et vente rapide'],
  clients:['Clients','Fichier et programme de fidélité'],
  team:['Équipe','Performance des coiffeurs'],
  commissions:['Commissions','Taux par coiffeur, filtrable par mois'],
  stats:['Statistiques','Analyse de l\'activité'],
  stock:['Stock produits','Inventaire boutique'],
};
function go(v){
  document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.view===v));
  document.getElementById('page-title').textContent = TITLES[v][0];
  document.getElementById('page-crumb').textContent = TITLES[v][1];
  document.querySelector('.main').scrollTop = 0;
}
document.querySelectorAll('.nav-item').forEach(n=>n.onclick=()=>go(n.dataset.view));

/* =================== RENDER: PRESTATIONS =================== */
function renderCatTabs(containerId, active, onClick){
  const c = document.getElementById(containerId); c.innerHTML='';
  CATS.forEach(cat=>{
    const b=document.createElement('button');
    b.className='cat-tab'+(cat.id===active?' active':'');
    b.innerHTML = cat.emoji+' '+cat.name;
    b.onclick=()=>onClick(cat.id);
    c.appendChild(b);
  });
}
function renderServices(){
  renderCatTabs('cat-tabs', currentCat, id=>{currentCat=id;renderServices();});
  const g=document.getElementById('serv-grid'); g.innerHTML='';
  // La fiche prestation (nom/prix/durée/catégorie) n'est modifiable que par
  // l'administrateur côté serveur (services.ecrire) — le bouton n'apparaît
  // donc que pour ce rôle, pour éviter un PATCH qui échouerait en 403.
  const canEdit = session && session.role==='admin';
  const list = SERVICES.filter(s=>s.cat===currentCat);
  if(!list.length){
    g.innerHTML = `<div class="serv-empty"><span class="ic">✂️</span>Aucune prestation dans cette catégorie.</div>`;
    return;
  }
  // Chaque catégorie a sa propre teinte (badge + liseré au survol) — donne
  // une identité visuelle immédiate en changeant d'onglet.
  const [bgVar, textVar] = CATS.find(c=>c.id===currentCat)?.accent || CAT_PALETTE[0];
  list.forEach(s=>{
    const card=document.createElement('div');
    card.className='serv-card card';
    card.style.setProperty('--accent', `var(${textVar})`);
    card.innerHTML=`
      <div class="serv-head">
        <span class="serv-emoji" style="background:var(${bgVar})">${s.e}</span>
        ${canEdit?`<button class="x-btn edit-btn" title="Modifier la prestation" aria-label="Modifier la prestation">✎</button>`:''}
      </div>
      <div class="serv-name">${s.name}</div>
      ${s.desc?`<div class="serv-desc">${s.desc}</div>`:''}
      <div class="serv-meta">
        <span class="serv-price">${fmt(s.price)}</span>
        <span class="serv-dur">⏱ ${s.dur} min</span>
      </div>
      <button class="add-btn">＋ Ajouter à la caisse</button>`;
    card.querySelector('.add-btn').onclick=(ev)=>{
      addToCart(s); ev.target.classList.add('added'); ev.target.innerHTML='✓ Ajouté';
      setTimeout(()=>{ev.target.classList.remove('added');ev.target.innerHTML='＋ Ajouter à la caisse';},1000);
    };
    const editBtn = card.querySelector('.edit-btn');
    if(editBtn) editBtn.onclick=(ev)=>{ ev.stopPropagation(); editServicePrompt(s.id); };
    g.appendChild(card);
  });
}
async function editServicePrompt(id){
  const s = SERVICES.find(x=>x.id===id);
  if(!s) return;
  const r = await openFormModal({
    title:`Modifier — ${s.name}`, confirmLabel:'Enregistrer',
    fields:[
      {id:'nom', label:'Nom de la prestation', value:s.name},
      {id:'categorieId', label:'Catégorie', type:'select', value:s.cat,
        options:CATS.map(c=>({value:c.id, label:c.name}))},
      {id:'prix', label:'Prix (F)', type:'number', value:s.price, min:0, full:false},
      {id:'dureeMin', label:'Durée (min)', type:'number', value:s.dur, min:1, full:false},
    ],
  });
  if(!r || !r.nom.trim()) return;
  try{
    const updated = await apiFetch(`/services/${id}`, {method:'PATCH', body:JSON.stringify({
      nom:r.nom.trim(), categorieId:r.categorieId, prix:+r.prix||0, dureeMin:Math.max(1,+r.dureeMin||1),
    })});
    const idx = SERVICES.findIndex(x=>x.id===id);
    if(idx>=0){
      const emojiByCat = Object.fromEntries(CATS.map(c=>[c.id, c.emoji]));
      SERVICES[idx] = {
        id:updated.id, cat:updated.categorieId, name:updated.nom, desc:updated.description||'',
        price:updated.prix, dur:updated.dureeMin, e: emojiByCat[updated.categorieId]||'💈',
      };
    }
    renderServices();
    if(document.getElementById('view-caisse').classList.contains('active')) renderQuick();
    toast(`${updated.nom} mise à jour`);
  }catch(err){
    toast(err.message||'Impossible de mettre à jour la prestation');
  }
}

/* =================== RENDER: CAISSE =================== */
function renderQuick(){
  renderCatTabs('caisse-cats', caisseCat, id=>{caisseCat=id;renderQuick();});
  const g=document.getElementById('quick-serv'); g.innerHTML='';
  SERVICES.filter(s=>s.cat===caisseCat).forEach(s=>{
    const b=document.createElement('button');
    b.className='q-item';
    b.innerHTML=`<div class="qe">${s.e}</div><div class="qn">${s.name}</div><div class="qp">${fmt(s.price)}</div>`;
    b.onclick=()=>addToCart(s);
    g.appendChild(b);
  });
}
function addToCart(s){
  const found=cart.find(i=>i.name===s.name);
  if(found) found.qty++;
  else cart.push({name:s.name, price:s.price, qty:1, e:s.e, serviceId:s.id});
  renderTicket(); toast(`${s.name} ajouté au ticket`);
}
function changeQty(i,d){
  cart[i].qty+=d;
  if(cart[i].qty<=0) cart.splice(i,1);
  renderTicket();
}
function renderTicket(){
  const body=document.getElementById('ticket-body');
  const count=cart.reduce((a,i)=>a+i.qty,0);
  const navBadge=document.getElementById('nav-cart-count');
  navBadge.style.display = count?'inline-block':'none';
  navBadge.textContent = count;

  if(!cart.length){
    body.innerHTML=`<div class="t-empty">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M2 8h20l-1 12a2 2 0 01-2 2H5a2 2 0 01-2-2L2 8z"/><path d="M7 8V6a5 5 0 0110 0v2"/></svg>
      <div>Aucune prestation.<br>Ajoutez un service pour démarrer.</div></div>`;
  } else {
    body.innerHTML = cart.map((i,idx)=>`
      <div class="t-line">
        <span style="font-size:20px">${i.e}</span>
        <div class="t-info"><div class="n">${i.name}</div><div class="p">${fmt(i.price)} / u</div></div>
        <div class="qty">
          <button onclick="changeQty(${idx},-1)">−</button>
          <span>${i.qty}</span>
          <button onclick="changeQty(${idx},1)">＋</button>
        </div>
        <div class="t-sum">${fmt(i.price*i.qty)}</div>
      </div>`).join('');
  }
  const sub=cart.reduce((a,i)=>a+i.price*i.qty,0);

  // Remise fidélité automatique et échange de points non gérés par le
  // backend en V1 (pas d'endpoint /redeem) — retirés de l'écran caisse pour
  // ne montrer que ce qui est réellement appliqué au ticket serveur.
  document.getElementById('loyalty-row').style.display='none';

  // remise manuelle — seule remise réellement envoyée au serveur au moment d'Encaisser
  const disc=Math.min(100,Math.max(0,+document.getElementById('discount').value||0));
  const discAmt=Math.round(sub*disc/100);
  const total=sub-discAmt;

  document.getElementById('sub-total').textContent=fmt(sub);
  document.getElementById('disc-amount').textContent='– '+fmt(discAmt);
  document.getElementById('grand-total').textContent=fmt(total);
  document.getElementById('pay-btn').style.opacity = cart.length?1:.5;
  document.getElementById('pay-btn').style.pointerEvents = cart.length?'auto':'none';

  // Barre de panier flottante (mobile uniquement, cf. CSS) — évite d'avoir à
  // remonter tout en haut de l'écran pour voir le total et encaisser sur un
  // téléphone : le total et le bouton Encaisser restent toujours à portée de pouce.
  const mcb = document.getElementById('mobile-cart-bar');
  if(mcb){
    mcb.classList.toggle('show', cart.length>0);
    document.getElementById('mcb-count').textContent = count;
    document.getElementById('mcb-label').textContent = count>1 ? ' articles' : ' article';
    document.getElementById('mcb-total').textContent = fmt(total);
  }
  return total;
}
function renderLoyaltyChip(){
  const chip=document.getElementById('loyalty-chip');
  if(currentClient==null){ chip.innerHTML=''; return; }
  const cl=CLIENTS[currentClient]; const t=tierOf(cl.pts);
  chip.innerHTML=`
    <div class="loy-chip" style="background:${t.color}">
      <div class="loy-top">
        <span class="loy-name">${cl.name}</span>
        <span class="loy-tier">${t.ico} Carte ${t.name}</span>
      </div>
      <div class="loy-bot">
        <span class="loy-card-no">${cl.card}</span>
        <span class="loy-pts"><b>${cl.pts}</b><span>points fidélité</span></span>
      </div>
    </div>`;
}
async function selectClient(idx){
  if(idx==='new'){ await createClientPrompt(); return; }
  currentClient = idx==='' ? null : +idx;
  renderLoyaltyChip();
  renderTicket();
}
// Coiffeurs réels (GET /users?role=coiffeur) — le rôle est un type, pas une
// personne (CDC §2.1) : ajouter un 3e coiffeur ne demande aucun code.
function fillCoiffeurSelect(){
  const sel=document.getElementById('assign-coiffeur');
  if(!sel) return;
  sel.innerHTML='<option value="">👤 Attribuer un coiffeur…</option>'+
    COIFFEURS.map(c=>`<option value="${c.id}">${c.nom}</option>`).join('');
  if(sel._customSync) sel._customSync();
  else enhanceSelect(sel);
}
function fillClientSelect(){
  const sel=document.getElementById('assign-client');
  if(!sel) return;
  sel.innerHTML='<option value="">🪪 Client de passage</option>'+
    CLIENTS.map((c,i)=>`<option value="${i}">${tierOf(c.pts).ico} ${c.name} · ${c.pts} pts</option>`).join('')+
    '<option value="new">+ Nouveau client…</option>';
  if(currentClient!=null) sel.value=currentClient;
  if(sel._customSync) sel._customSync();
  else enhanceSelect(sel);
}
// Création à la volée depuis la caisse (CDC §4.3 — "recherche ou création à
// la volée"). Deux invites simples plutôt qu'un nouveau modal.
// Création réelle d'un client (POST /clients), adaptée à la forme déjà
// attendue ailleurs dans l'appli (name/phone/card/pts/spent/visits/last) —
// partagée entre la caisse, l'agenda et le fichier clients.
async function createClient(nom, telephone){
  const c=await apiFetch('/clients', {method:'POST', body:JSON.stringify({nom, telephone})});
  const client={
    id:c.id, name:c.nom, phone:c.telephone,
    card:c.loyaltyAccount?.numeroCarte||'—', visits:0, last:'—',
    pts:c.loyaltyAccount?.points||0, spent:c.loyaltyAccount?.totalDepense||0,
  };
  CLIENTS.push(client);
  return client;
}
async function promptNewClient(){
  const result = await openFormModal({
    title:'Nouveau client', confirmLabel:'Créer le client',
    fields:[
      {id:'nom', label:'Nom du client', placeholder:'Ex. Aïssatou Ndiaye'},
      {id:'telephone', label:'Téléphone', placeholder:'+221 7X XXX XX XX'},
    ],
  });
  if(!result || !result.nom.trim() || !result.telephone.trim()) return null;
  return {nom:result.nom.trim(), telephone:result.telephone.trim()};
}
async function createClientPrompt(){
  const data = await promptNewClient();
  if(!data){ fillClientSelect(); return; }
  try{
    const c=await createClient(data.nom, data.telephone);
    currentClient=CLIENTS.length-1;
    fillClientSelect(); renderLoyaltyChip(); renderTicket();
    toast(`Client ${c.name} créé — carte ${c.card}`);
  }catch(err){
    toast(err.message||'Impossible de créer le client');
    fillClientSelect();
  }
}
async function addClientFromView(){
  const data = await promptNewClient();
  if(!data) return;
  try{
    const c=await createClient(data.nom, data.telephone);
    renderClients(); fillClientSelect();
    toast(`Client ${c.name} créé — carte ${c.card}`);
  }catch(err){
    toast(err.message||'Impossible de créer le client');
  }
}

/* =================== RENDER: OTHER VIEWS =================== */
function renderRdv(){
  const tb=document.getElementById('rdv-tbody');
  tb.innerHTML = RDV.length ? RDV.map(r=>{
    const st=STATUS[r.statut]||STATUS.a_venir;
    const nom=r.client?.nom || 'Client de passage';
    return `<tr>
      <td><b>${hm(r.debut)}</b></td>
      <td><div class="cell-user"><div class="av">${initials(nom)}</div><div class="nm">${nom}</div></div></td>
      <td>${r.service.nom}</td>
      <td>${r.coiffeur.nom}</td>
      <td><span class="tag ${st[0]}">${st[1]}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" style="padding:7px 12px" onclick="checkoutRdv('${r.id}')">Encaisser</button></td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--muted)">Aucun rendez-vous pour cette période.</td></tr>`;
  document.getElementById('kpi-rdv').textContent=RDV.length;
  const enAttente = RDV.filter(r=>r.statut==='attente_sur_place').length;
  const aVenir = RDV.filter(r=>r.statut==='a_venir').length;
  const rdvDeltaEl = document.getElementById('kpi-rdv-delta');
  if(rdvDeltaEl) rdvDeltaEl.textContent = enAttente ? `▲ ${enAttente} en attente sur place` : 'Aucun client en attente';
  const rdvAvenirEl = document.getElementById('kpi-rdv-avenir');
  if(rdvAvenirEl) rdvAvenirEl.textContent = aVenir;
  const rdvAvenirDeltaEl = document.getElementById('kpi-rdv-avenir-delta');
  if(rdvAvenirDeltaEl) rdvAvenirDeltaEl.textContent = aVenir ? `Prochain à ${hm(RDV.find(r=>r.statut==='a_venir')?.debut||new Date())}` : 'Rien de programmé';
  // dashboard agenda
  const dots={a_venir:'var(--gold)',attente_sur_place:'var(--wave-d)',en_cours:'var(--wave-d)',
              termine:'var(--green)',encaisse:'var(--green)',annule:'var(--muted)',absent:'var(--muted)'};
  document.getElementById('dash-agenda').innerHTML=RDV.map(r=>{
    const st=STATUS[r.statut]||STATUS.a_venir;
    const nom=r.client?.nom || 'Client de passage';
    return `
    <div class="agenda-row">
      <span class="agenda-time">${hm(r.debut)}</span>
      <span class="agenda-dot" style="background:${dots[r.statut]||'var(--gold)'}"></span>
      <div class="agenda-main"><div class="c">${nom}</div><div class="s">${r.service.nom} · ${r.coiffeur.nom}</div></div>
      <span class="tag ${st[0]}">${st[1]}</span>
    </div>`;}).join('');
}
function checkoutRdv(id){
  const r=RDV.find(x=>x.id===id);
  if(!r) return;
  const s=SERVICES.find(x=>x.id===r.serviceId);
  if(s) addToCart(s);
  if(r.clientId){
    const idx=CLIENTS.findIndex(c=>c.id===r.clientId);
    if(idx>=0){ currentClient=idx; fillClientSelect(); renderLoyaltyChip(); renderTicket();
      toast(`Client fidèle reconnu : ${r.client.nom}`); }
  }
  go('caisse');
}
function initials(n){return n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();}

// Droit d'accès (CDC §10) — télécharge tout ce que l'app détient sur ce client.
async function exportClientData(clientId){
  try{
    const data = await apiFetch(`/clients/${clientId}/export`);
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`client-${clientId}.json`; a.click();
    URL.revokeObjectURL(url);
    toast('Export des données du client téléchargé');
  }catch(err){
    toast(err.message||'Impossible d\'exporter les données');
  }
}
// Droit de suppression (CDC §10) — anonymisation irréversible, admin uniquement.
async function eraseClientPrompt(clientId, nom){
  const confirmed = await openFormModal({
    title:'Supprimer ce client ?',
    message:`Supprimer définitivement la fiche de ${nom} ? Son nom et son téléphone seront anonymisés. Les tickets déjà émis restent conservés (obligation comptable 10 ans).`,
    confirmLabel:'Supprimer définitivement', danger:true,
  });
  if(!confirmed) return;
  try{
    await apiFetch(`/clients/${clientId}`, {method:'DELETE'});
    const idx=CLIENTS.findIndex(c=>c.id===clientId);
    if(idx>=0) CLIENTS.splice(idx,1);
    if(currentClient===idx) currentClient=null;
    renderClients(); fillClientSelect();
    toast('Fiche client supprimée');
  }catch(err){
    toast(err.message||'Impossible de supprimer ce client');
  }
}

function renderClients(){
  const tierTag={or:'gold',argent:'grey',bronze:'grey'};
  document.getElementById('clients-tbody').innerHTML=CLIENTS.map((c,i)=>{
    const t=tierOf(c.pts);
    return `<tr>
      <td><div class="cell-user"><div class="av">${initials(c.name)}</div><div><div class="nm">${c.name}</div><div class="mt">${c.phone}</div></div></div></td>
      <td style="font-family:'Fraunces',serif;letter-spacing:1px">${c.card}</td>
      <td><span class="tag ${tierTag[t.id]}">${t.ico} ${t.name}${t.disc?` · −${t.disc}%`:''}</span></td>
      <td><b>${c.visits}</b></td>
      <td><span class="tag gold">${c.pts} pts</span></td>
      <td><b>${fmt(c.spent)}</b></td>
      <td style="text-align:right;white-space:nowrap">
        <button class="btn btn-ghost" style="padding:7px 10px" onclick="loadClientToCaisse(${i})">Encaisser</button>
        <button class="btn btn-ghost" style="padding:7px 10px" title="Exporter les données (droit d'accès)" onclick="exportClientData('${c.id}')">📤</button>
        ${session?.role==='admin'?`<button class="btn btn-ghost" style="padding:7px 10px" title="Supprimer la fiche (droit de suppression)" onclick="eraseClientPrompt('${c.id}','${c.name.replace(/'/g,"\\'")}')">🗑️</button>`:''}
      </td>
    </tr>`;
  }).join('');
  // bannière fidélité
  const members=CLIENTS.length;
  const totalPts=CLIENTS.reduce((a,c)=>a+c.pts,0);
  const orCount=CLIENTS.filter(c=>tierOf(c.pts).id==='or').length;
  document.getElementById('loy-banner').innerHTML=`
    <div class="loy-stat card"><div class="v">${members}</div><div class="l">🪪 Cartes de fidélité actives</div></div>
    <div class="loy-stat card"><div class="v">${totalPts.toLocaleString('fr-FR')}</div><div class="l">⭐ Points en circulation</div></div>
    <div class="loy-stat card"><div class="v">${orCount}</div><div class="l">🥇 Clients niveau Or</div></div>`;
}
function loadClientToCaisse(i){
  currentClient=i;
  fillClientSelect(); renderLoyaltyChip(); renderTicket();
  go('caisse');
  toast(`${CLIENTS[i].name} chargé sur le ticket`);
}
function renderTeam(){
  document.getElementById('team-grid').innerHTML=TEAM.map(t=>`
    <div class="team-card card">
      <div class="av">${initials(t.name)}</div>
      <div class="nm">${t.name}</div>
      <div class="rl">${t.role}</div>
      <span class="tag green">⭐ ${t.note} / 5</span>
      <div class="team-stats">
        <div><div class="v">${t.clients}</div><div class="l">clients</div></div>
        <div><div class="v">${t.ca}</div><div class="l">CA / mois</div></div>
      </div>
    </div>`).join('');
}
function renderStock(){
  // La fiche produit (nom/prix/catégorie) est réservée à gérant/admin côté
  // serveur (stock.ecrire) — bouton masqué pour un coiffeur, qui garde
  // uniquement « Mouvement » pour déclarer une consommation.
  const canEdit = can('stock');
  document.getElementById('stock-tbody').innerHTML = STOCK.length ? STOCK.map(s=>{
    const st = s.quantite<=s.seuilCritique ? ['blue','⚠ À recommander']
             : s.quantite<=s.seuilBas      ? ['gold','Stock bas'] : ['green','En stock'];
    const safeNom = s.nom.replace(/'/g,"\\'");
    return `<tr>
      <td><b>${s.nom}</b></td><td>${s.categorie||'—'}</td><td>${s.prixVente!=null?fmt(s.prixVente):'—'}</td>
      <td><b>${s.quantite}</b></td><td><span class="tag ${st[0]}">${st[1]}</span></td>
      <td style="text-align:right;white-space:nowrap">
        ${canEdit?`<button class="btn btn-ghost" style="padding:7px 10px" onclick="editProductPrompt('${s.id}')" title="Modifier la fiche produit">✎</button>`:''}
        <button class="btn btn-ghost" style="padding:7px 12px" onclick="declareMovementPrompt('${s.id}','${safeNom}')">Mouvement</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--muted)">Aucun produit — ajoutez le premier avec « Nouveau produit ».</td></tr>`;
}
async function editProductPrompt(id){
  const p = STOCK.find(x=>x.id===id);
  if(!p) return;
  const r = await openFormModal({
    title:`Modifier — ${p.nom}`, confirmLabel:'Enregistrer',
    fields:[
      {id:'nom', label:'Nom du produit', value:p.nom},
      {id:'categorie', label:'Catégorie', value:p.categorie||'', full:false},
      {id:'prixVente', label:'Prix de vente (F)', type:'number', value:p.prixVente??0, min:0, full:false},
      {id:'prixAchat', label:'Prix d\'achat (F)', type:'number', value:p.prixAchat??0, min:0, full:false},
      {id:'seuilBas', label:'Seuil de stock bas', type:'number', value:p.seuilBas, min:0, full:false},
      {id:'seuilCritique', label:'Seuil critique', type:'number', value:p.seuilCritique, min:0, full:false},
      {id:'fournisseur', label:'Fournisseur (optionnel)', value:p.fournisseur||''},
    ],
  });
  if(!r || !r.nom.trim()) return;
  try{
    // La quantité ne se modifie jamais ici : elle passe uniquement par
    // « Mouvement » (POST /stock/movements), pour garder chaque changement tracé.
    const updated = await apiFetch(`/stock/products/${id}`, {method:'PATCH', body:JSON.stringify({
      nom:r.nom.trim(), categorie:r.categorie.trim()||undefined,
      prixVente:+r.prixVente||0, prixAchat:+r.prixAchat||0,
      seuilBas:+r.seuilBas||0, seuilCritique:+r.seuilCritique||0,
      fournisseur:r.fournisseur.trim()||undefined,
    })});
    const idx = STOCK.findIndex(x=>x.id===id);
    if(idx>=0) STOCK[idx] = updated;
    renderStock();
    toast(`${updated.nom} mis à jour`);
  }catch(err){
    toast(err.message||'Impossible de mettre à jour le produit');
  }
}
async function fetchStock(){
  document.getElementById('stock-tbody').innerHTML = skeletonTableRows(6);
  try{
    STOCK = await apiFetch('/stock/products');
  }catch(err){
    STOCK = [];
    toast(err.message||'Impossible de charger le stock');
  }
  renderStock();
}
async function addProductPrompt(){
  const r = await openFormModal({
    title:'Nouveau produit', confirmLabel:'Créer le produit',
    fields:[
      {id:'nom', label:'Nom du produit', placeholder:'Ex. Gel coiffant'},
      {id:'categorie', label:'Catégorie', placeholder:'Ex. Styling', full:false},
      {id:'prixVente', label:'Prix de vente (F)', type:'number', value:0, min:0, full:false},
      {id:'quantite', label:'Quantité initiale', type:'number', value:0, min:0, full:false},
    ],
  });
  if(!r || !r.nom.trim()) return;
  try{
    const p=await apiFetch('/stock/products', {method:'POST', body:JSON.stringify({
      nom:r.nom.trim(), categorie:r.categorie.trim()||undefined, prixVente:+r.prixVente||0, quantite:+r.quantite||0,
    })});
    STOCK.push(p); STOCK.sort((a,b)=>a.nom.localeCompare(b.nom));
    renderStock();
    toast(`Produit ${p.nom} ajouté`);
  }catch(err){
    toast(err.message||'Impossible de créer le produit');
  }
}
async function declareMovementPrompt(productId, nom){
  const r = await openFormModal({
    title:`Mouvement de stock — ${nom}`, confirmLabel:'Valider le mouvement',
    fields:[
      {id:'type', label:'Type de mouvement', type:'select', value:'sortie', options:[
        {value:'entree', label:'Entrée'}, {value:'sortie', label:'Sortie / consommation'},
        {value:'perte', label:'Perte'}, {value:'inventaire', label:'Inventaire (nouveau compte total)'},
      ]},
      {id:'quantite', label:'Quantité (ou nouveau total si inventaire)', type:'number', value:1, min:0},
      {id:'motif', label:'Motif (optionnel, obligatoire pour une sortie déclarée par un coiffeur)'},
    ],
  });
  if(!r) return;
  const quantite=+r.quantite;
  if(Number.isNaN(quantite)){ toast('Quantité invalide'); return; }
  try{
    const {product}=await apiFetch('/stock/movements', {method:'POST', body:JSON.stringify({productId, type:r.type, quantite, motif:r.motif.trim()||undefined})});
    const idx=STOCK.findIndex(s=>s.id===productId);
    if(idx>=0) STOCK[idx]=product;
    renderStock();
    toast(`Stock mis à jour : ${product.nom} → ${product.quantite}`);
  }catch(err){
    toast(err.message||'Mouvement refusé');
  }
}
const PAY_METHOD_META = {
  wave:{label:'Wave', color:'var(--wave-d)'},
  orange_money:{label:'Orange Money', color:'var(--orange)'},
  especes:{label:'Espèces', color:'var(--green)'},
};
function renderPaySplit(parMoyen){
  const entries=Object.entries(parMoyen||{});
  const host=document.getElementById('pay-split');
  host.innerHTML = barRowsHtml(entries, {
    labelOf:m=>(PAY_METHOD_META[m]||{label:m}).label,
    colorOf:m=>(PAY_METHOD_META[m]||{color:'var(--muted)'}).color,
    onClick:m=>`openPaySplitDetail('${m}')`,
    emptyMsg:'Aucun encaissement sur la période.',
  });
}
let statsRangeDays = 30;
let lastStatsOverview = null; // dernière réponse /stats/overview — réutilisée par les tiroirs de détail (clic sur une box)
async function setStatsRange(days, btn){
  statsRangeDays = days;
  document.querySelectorAll('#stats-tabs .cat-tab').forEach(b=>b.classList.toggle('active', b===btn));
  await renderStatsView();
}
async function renderStatsView(){
  const to = new Date().toISOString().slice(0,10);
  const from = new Date(Date.now()-(statsRangeDays-1)*86400000).toISOString().slice(0,10);
  document.getElementById('stats-kpis').innerHTML = skeletonCards(4);
  document.getElementById('pay-split').innerHTML = skeletonCards(3);
  document.getElementById('stats-coiffeur').innerHTML = skeletonCards(3);
  document.getElementById('stats-top-serv').innerHTML = skeletonCards(3);
  document.getElementById('stats-top-clients').innerHTML = skeletonCards(3);
  try{
    const s = await apiFetch(`/stats/overview?from=${from}&to=${to}`);
    lastStatsOverview = s;
    const variation = s.variationPct!=null ? `${s.variationPct>=0?'▲ +':'▼ '}${s.variationPct}%` : 'Période précédente vide';
    document.getElementById('stats-kpis').innerHTML = `
      <div class="kpi card clickable" onclick="openStatCaDetail()"><div class="k-val serif">${fmt(s.ca)}</div><div class="k-lbl">CA de la période</div><div class="k-delta ${s.variationPct==null?'':s.variationPct>=0?'k-up':'k-dn'}">${variation}</div></div>
      <div class="kpi card clickable" onclick="openStatTicketsDetail()"><div class="k-val serif">${s.tickets}</div><div class="k-lbl">Tickets encaissés</div></div>
      <div class="kpi card clickable" onclick="openStatPanierDetail()"><div class="k-val serif">${fmt(s.panierMoyen)}</div><div class="k-lbl">Panier moyen</div></div>
      <div class="kpi card clickable" onclick="openStatFideliteDetail()"><div class="k-val serif">${s.tauxRetourClient}%</div><div class="k-lbl">Clients fidèles (2+ visites)</div></div>`;

    renderPaySplit(s.parMoyen);

    document.getElementById('stats-coiffeur-title').textContent = session?.role==='coiffeur' ? 'Mon CA' : 'CA par coiffeur';
    const coiffHost=document.getElementById('stats-coiffeur');
    coiffHost.innerHTML = s.parCoiffeur.length ? s.parCoiffeur.slice().sort((a,b)=>b.ca-a.ca).map(c=>
      `<div class="top-serv row-click" onclick="openCoiffeurStatDetail('${c.coiffeurId}')"><span style="font-weight:700">${c.nom}</span><span class="tag gold">${fmt(c.ca)} · ${c.tickets} tickets</span></div>`
    ).join('') : `<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun encaissement sur la période.</div>`;

    document.getElementById('stats-top-serv').innerHTML = s.topPrestations.length ? s.topPrestations.map((p,i)=>
      `<div class="top-serv row-click" onclick="openPrestationStatDetail(${i})"><span style="font-weight:700">${p.nom}</span><span class="tag gold">${p.qte} ventes · ${fmt(p.ca)}</span></div>`
    ).join('') : `<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucune vente sur la période.</div>`;

    document.getElementById('stats-top-clients').innerHTML = s.topClients.length ? s.topClients.map((c,i)=>
      `<div class="top-serv row-click" onclick="openClientStatDetail(${i})"><span style="font-weight:700">${c.nom}</span><span class="tag gold">${fmt(c.total)} · ${c.visites} visite${c.visites>1?'s':''}</span></div>`
    ).join('') : `<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun client sur la période.</div>`;
  }catch(err){
    document.getElementById('stats-kpis').innerHTML = `<div class="card" style="padding:20px;color:var(--muted)">${err.message||'Statistiques indisponibles'}</div>`;
  }
}

/* ---------------- Tiroir de détail statistique (clic sur une box/graphique) ----------------
   Réutilise les données déjà chargées par /stats/overview (lastStatsOverview) — aucun appel
   réseau supplémentaire, juste une présentation plus riche de ce que le serveur renvoie déjà
   (dont parCategorie/parHeure, calculés côté serveur mais jusque-là jamais affichés). */
function openStatDrawer(icon, title, subtitle, bodyHtml){
  document.getElementById('stat-dr-head').innerHTML = `
    <div class="st-av" style="width:48px;height:48px;font-size:19px;background:var(--gold-soft);color:var(--gold-text)">${icon}</div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${title}</div>
      <div style="font-size:12px;color:var(--muted);font-weight:600">${subtitle}</div>
    </div>
    <button class="x-btn" onclick="closeStatDrawer()" aria-label="Fermer">✕</button>`;
  document.getElementById('stat-dr-body').innerHTML = bodyHtml;
  document.getElementById('stat-drawer').classList.add('open');
  document.getElementById('stat-scrim').classList.add('show');
}
function closeStatDrawer(){
  document.getElementById('stat-drawer').classList.remove('open');
  document.getElementById('stat-scrim').classList.remove('show');
}
/* =================== INFOBULLES & MODALES KPI =================== */

function showGlobalTooltip(e, title, val, sub=''){
  let tt = document.getElementById('global-tooltip');
  if(!tt){
    tt = document.createElement('div');
    tt.id = 'global-tooltip';
    tt.className = 'chart-tooltip';
    document.body.appendChild(tt);
  }
  tt.innerHTML = `
    ${title ? `<div class="tt-title">${title}</div>` : ''}
    ${val ? `<div class="tt-val">${val}</div>` : ''}
    ${sub ? `<div class="tt-sub">${sub}</div>` : ''}
  `;
  tt.classList.add('show');
  positionGlobalTooltip(e, tt);
}

function positionGlobalTooltip(e, tt){
  if(!tt) tt = document.getElementById('global-tooltip');
  if(!tt) return;
  const clientX = (e && e.touches && e.touches[0]) ? e.touches[0].clientX : (e ? e.clientX : 0);
  const clientY = (e && e.touches && e.touches[0]) ? e.touches[0].clientY : (e ? e.clientY : 0);
  if(clientX === undefined || clientY === undefined) return;

  const rect = tt.getBoundingClientRect();
  let left = clientX - rect.width / 2;
  let top = clientY - rect.height - 12;

  if (left < 10) left = 10;
  if (left + rect.width > window.innerWidth - 10) left = window.innerWidth - rect.width - 10;
  if (top < 10) top = clientY + 20;

  tt.style.left = left + 'px';
  tt.style.top = top + 'px';
}

function hideGlobalTooltip(){
  const tt = document.getElementById('global-tooltip');
  if(tt) tt.classList.remove('show');
}

function renderPaySplitHtml(){
  const parMoyen = lastStatsOverview?.parMoyen || todayOverview?.parMoyen;
  if(!parMoyen || !Object.keys(parMoyen).length) {
    return barRowsHtml([], {emptyMsg:'Aucun encaissement sur la période.'});
  }
  return barRowsHtml(Object.entries(parMoyen), {
    labelOf: k => ({wave:'Wave', orange_money:'Orange Money (Max It)', especes:'Espèces', om:'Orange Money', free:'Free Money', cash:'Espèces', card:'Carte bancaire'}[k]||k),
    colorOf: k => ({wave:'var(--wave-d)', orange_money:'var(--orange)', especes:'var(--green)', om:'var(--orange)', free:'var(--free)', cash:'var(--green)', card:'var(--plum-600)'}[k]||'var(--gold-2)'),
  });
}

function openKpiCaTodayDetail(){
  const ca = todayOverview?.ca||0;
  const ticketsCount = todayOverview?.tickets||0;
  const caStr = fmt(ca);
  const panierStr = ticketsCount ? fmt(Math.round(ca/ticketsCount)) : '0 F';
  openStatDrawer('💰', 'Chiffre d\'affaires du jour', `Aujourd'hui · Total : ${caStr}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${caStr}</div><div class="l">Recettes du jour</div></div>
      <div class="card"><div class="v">${ticketsCount}</div><div class="l">Tickets encaissés</div></div>
      <div class="card"><div class="v">${panierStr}</div><div class="l">Panier moyen du jour</div></div>
      <div class="card"><div class="v">${COIFFEURS.length}</div><div class="l">Coiffeurs de l'équipe</div></div>
    </div>
    <div class="section-title" style="font-size:15px;margin-top:16px">Répartition par moyen de paiement</div>
    ${renderPaySplitHtml()}
    <div class="section-title" style="font-size:15px;margin-top:16px">Période statistique globale</div>
    <button class="btn btn-gold btn-block" onclick="closeStatDrawer();go('stats')">Voir le rapport complet dans Statistiques →</button>
  `);
}

function openKpiRdvTodayDetail(){
  const totalRdv = RDV.length;
  const aVenir = RDV.filter(r=>r.statut==='a_venir').length;
  const surPlace = RDV.filter(r=>r.statut==='attente_sur_place').length;
  const enCours = RDV.filter(r=>r.statut==='en_cours').length;
  const termine = RDV.filter(r=>r.statut==='termine' || r.statut==='encaisse').length;

  openStatDrawer('📅', 'Rendez-vous & Planning', `${totalRdv} réservations au planning aujourd'hui`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${totalRdv}</div><div class="l">Total RDV</div></div>
      <div class="card"><div class="v">${surPlace + enCours}</div><div class="l">En cours / Sur place</div></div>
      <div class="card"><div class="v">${aVenir}</div><div class="l">À venir</div></div>
      <div class="card"><div class="v">${termine}</div><div class="l">Terminés / Encaissés</div></div>
    </div>
    <div class="section-title" style="font-size:15px;margin-top:16px">Prochains rendez-vous</div>
    ${RDV.slice(0,5).map(r=>`
      <div class="dr-3col">
        <span class="nm">${hm(r.debut)} · ${r.client?.nom || 'Client de passage'}</span>
        <span class="sub">${r.coiffeur?.nom || ''}</span>
        <span class="val" style="color:var(--gold-text)">${r.service?.nom || ''}</span>
      </div>
    `).join('') || '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun rendez-vous pour l\'instant.</div>'}
    <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="closeStatDrawer();go('rdv')">Ouvrir le planning complet →</button>
  `);
}

function openKpiClientsTodayDetail(){
  const totalClients = CLIENTS.length;
  const orCount = CLIENTS.filter(c=>tierOf(c.pts).id==='or').length;
  const argentCount = CLIENTS.filter(c=>tierOf(c.pts).id==='argent').length;
  const bronzeCount = CLIENTS.filter(c=>tierOf(c.pts).id==='bronze').length;

  openStatDrawer('🪪', 'Fichier Clients & Fidélité', `${totalClients} clients inscrits dans la base`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${todayOverview?.tickets||0}</div><div class="l">Tickets aujourd'hui</div></div>
      <div class="card"><div class="v">${orCount}</div><div class="l">Membres Or 🥇</div></div>
      <div class="card"><div class="v">${argentCount}</div><div class="l">Membres Argent 🥈</div></div>
      <div class="card"><div class="v">${bronzeCount}</div><div class="l">Membres Bronze 🥉</div></div>
    </div>
    <div class="section-title" style="font-size:15px;margin-top:16px">Derniers clients du salon</div>
    ${CLIENTS.slice(0,5).map(c=>`
      <div class="dr-3col">
        <span class="nm">${c.name}</span>
        <span class="sub">${c.phone || ''}</span>
        <span class="val">${c.pts||0} pts</span>
      </div>
    `).join('') || '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun client enregistré.</div>'}
    <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="closeStatDrawer();go('clients')">Gérer la base client →</button>
  `);
}

function openKpiStockDetail(){
  const totalProds = STOCK.length;
  const alertes = STOCK.filter(p=>p.quantite <= p.seuilBas);
  const totalValeur = STOCK.reduce((s,p)=>s + ((p.prixVente||0)*(p.quantite||0)), 0);

  openStatDrawer('📦', 'Inventaire & Stocks', `${totalProds} références en boutique`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${totalProds}</div><div class="l">Produits au catalogue</div></div>
      <div class="card"><div class="v" style="color:${alertes.length?'var(--danger)':'var(--green)'}">${alertes.length}</div><div class="l">En alerte de réappro</div></div>
      <div class="card"><div class="v">${fmt(totalValeur)}</div><div class="l">Valeur du stock</div></div>
    </div>
    <div class="section-title" style="font-size:15px;margin-top:16px">Produits en réapprovisionnement critique</div>
    ${alertes.length ? alertes.map(p=>`
      <div class="dr-3col">
        <span class="nm">${p.nom}</span>
        <span class="sub">${p.categorie || 'Stock'}</span>
        <span class="val" style="color:var(--danger)">${p.quantite} restant${p.quantite>1?'s':''}</span>
      </div>
    `).join('') : '<div style="color:var(--green);font-size:13px;padding:10px 0">✓ Tous les stocks sont au niveau optimal.</div>'}
    <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="closeStatDrawer();go('stock')">Accéder à la gestion du stock →</button>
  `);
}

function openKpiRemisesDetail(){
  const s = lastStatsOverview || todayOverview;
  const remisesTotal = (s?.parCoiffeur||[]).reduce((a,c)=>a+c.remise,0);
  openStatDrawer('🏷️', 'Remises & Gestes commerciaux', 'Historique des réductions accordées', `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(remisesTotal)}</div><div class="l">Remises de la période</div></div>
      <div class="card"><div class="v">${s?.tickets||0}</div><div class="l">Tickets sur la période</div></div>
    </div>
    <div class="hint" style="margin:16px 0">Toute remise supérieure à 10% requiert une validation du gérant avec PIN.</div>
    <button class="btn btn-gold btn-block" onclick="closeStatDrawer();go('journal')">Voir le journal d'activité →</button>
  `);
}

function openKpiLoyaltyDetail(){
  const totalPts = CLIENTS.reduce((s,c)=>s + (c.pts||0), 0);
  openStatDrawer('⭐', 'Programme de Fidélité', `${totalPts.toLocaleString('fr-FR')} points cumulés par les clients`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${totalPts.toLocaleString('fr-FR')}</div><div class="l">Points en circulation</div></div>
      <div class="card"><div class="v">${fmt(totalPts * 10)}</div><div class="l">Valeur de réduction max</div></div>
    </div>
    <div class="hint" style="margin:16px 0">100 F dépensés = 1 point cumulé. 100 points = 1 000 F de remise lors de l'encaissement.</div>
    <button class="btn btn-gold btn-block" onclick="closeStatDrawer();go('clients')">Voir le programme de fidélité →</button>
  `);
}

function drRow(nm, sub, val){
  return `<div class="dr-3col"><span class="nm">${nm}</span><span class="sub">${sub}</span><span class="val">${val}</span></div>`;
}
function barRowsHtml(entries, opts){
  const o = Object.assign({labelOf:k=>k, colorOf:()=>'var(--gold-2)', onClick:null, emptyMsg:'Aucune donnée sur la période.'}, opts);
  const total = entries.reduce((s,[,v])=>s+v,0);
  if(!total) return `<div style="color:var(--muted);font-size:13px;padding:10px 0">${o.emptyMsg}</div>`;
  return entries.slice().sort((a,b)=>b[1]-a[1]).map(([key,montant])=>{
    const pct = Math.round(montant/total*100);
    const label = o.labelOf(key);
    const clickAttrs = o.onClick ? ` class="row-click" onclick="${o.onClick(key)}"` : ' class="row-click"';
    const valStr = fmt(montant);
    const subStr = `${pct}% du total (${entries.length} éléments)`;
    return `<div style="margin:12px 0"${clickAttrs}
      onmouseenter="showGlobalTooltip(event, '${label.replace(/'/g,"\\'")}', '${valStr}', '${subStr}')"
      onmousemove="positionGlobalTooltip(event)"
      onmouseleave="hideGlobalTooltip()"
      ontouchstart="showGlobalTooltip(event, '${label.replace(/'/g,"\\'")}', '${valStr}', '${subStr}')"
      ontouchend="hideGlobalTooltip()">
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:5px"><span>${label}</span><span>${pct}% · ${valStr}</span></div>
      <div style="height:8px;background:var(--line-2);border-radius:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${o.colorOf(key)};border-radius:6px"></div></div>
    </div>`;
  }).join('');
}
function hourlyBarsHtml(parHeure){
  const max = Math.max(1, ...parHeure);
  if(!parHeure.some(v=>v>0)) return `<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucune vente sur la période.</div>`;
  const total = parHeure.reduce((a,b)=>a+b, 0);
  return `<div class="bars dense">${parHeure.map((v,h)=>{
    const pct = total ? Math.round(v/total*100) : 0;
    const title = `${h}h - ${h+1}h`;
    const val = fmt(v);
    const sub = `${pct}% du CA journalier`;
    return `<div class="bar" style="height:${v?Math.max(4,Math.round(v/max*100)):2}%"
      onmouseenter="showGlobalTooltip(event, '${title}', '${val}', '${sub}')"
      onmousemove="positionGlobalTooltip(event)"
      onmouseleave="hideGlobalTooltip()"
      ontouchstart="showGlobalTooltip(event, '${title}', '${val}', '${sub}')"
      ontouchend="hideGlobalTooltip()"></div>`;
  }).join('')}</div>
  <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--muted);font-weight:600;margin-top:6px">
    <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
  </div>`;
}
function openStatCaDetail(){
  const s=lastStatsOverview; if(!s) return;
  const variation = s.variationPct!=null ? `${s.variationPct>=0?'+':''}${s.variationPct}%` : '—';
  openStatDrawer('💰','CA de la période', `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(s.ca)}</div><div class="l">Chiffre d'affaires</div></div>
      <div class="card"><div class="v">${variation}</div><div class="l">Vs période précédente (${fmt(s.caPrecedent)})</div></div>
    </div>
    <div class="section-title" style="font-size:15px">Répartition par catégorie de prestation (brut, avant remise)</div>
    ${barRowsHtml(Object.entries(s.parCategorie||{}), {emptyMsg:'Aucune vente sur la période.'})}
    <div class="section-title" style="font-size:15px;margin-top:18px">Répartition horaire</div>
    ${hourlyBarsHtml(s.parHeure)}`);
}
function openStatTicketsDetail(){
  const s=lastStatsOverview; if(!s) return;
  openStatDrawer('🧾','Tickets encaissés', `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${s.tickets}</div><div class="l">Tickets encaissés</div></div>
      <div class="card"><div class="v">${fmt(s.panierMoyen)}</div><div class="l">Panier moyen</div></div>
    </div>
    <div class="section-title" style="font-size:15px">Détail par coiffeur</div>
    ${s.parCoiffeur.length ? s.parCoiffeur.slice().sort((a,b)=>b.tickets-a.tickets).map(c=>
      drRow(c.nom, `${fmt(c.tickets?Math.round(c.ca/c.tickets):0)} / ticket`, `${c.tickets} tickets`)
    ).join('') : '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun ticket sur la période.</div>'}`);
}
function openStatPanierDetail(){
  const s=lastStatsOverview; if(!s) return;
  openStatDrawer('🛍️','Panier moyen', `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(s.panierMoyen)}</div><div class="l">Panier moyen</div></div>
      <div class="card"><div class="v">${s.tickets}</div><div class="l">Tickets sur la période</div></div>
    </div>
    <div class="section-title" style="font-size:15px">Prestations phares</div>
    ${s.topPrestations.length ? s.topPrestations.map(p=>
      drRow(p.nom, `${fmt(p.qte?Math.round(p.ca/p.qte):0)} / vente`, `${p.qte} ventes`)
    ).join('') : '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucune vente sur la période.</div>'}`);
}
function openStatFideliteDetail(){
  const s=lastStatsOverview; if(!s) return;
  openStatDrawer('⭐','Clients fidèles', `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${s.tauxRetourClient}%</div><div class="l">Clients fidèles (2+ visites)</div></div>
      <div class="card"><div class="v">${s.clientsUniques ?? '—'}</div><div class="l">Clients uniques reçus</div></div>
    </div>
    <div class="section-title" style="font-size:15px">Meilleurs clients</div>
    ${s.topClients.length ? s.topClients.map(c=>
      drRow(c.nom, `${c.visites} visite${c.visites>1?'s':''}`, fmt(c.total))
    ).join('') : '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun client sur la période.</div>'}`);
}
function openPaySplitDetail(methode){
  const s=lastStatsOverview; if(!s) return;
  const meta = PAY_METHOD_META[methode] || {label:methode, color:'var(--muted)'};
  const montant = (s.parMoyen||{})[methode] || 0;
  const total = Object.values(s.parMoyen||{}).reduce((a,b)=>a+b,0);
  const pct = total ? Math.round(montant/total*100) : 0;
  openStatDrawer('💳', meta.label, `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(montant)}</div><div class="l">Encaissé via ${meta.label}</div></div>
      <div class="card"><div class="v">${pct}%</div><div class="l">Part du chiffre d'affaires</div></div>
    </div>
    <div class="section-title" style="font-size:15px">Tous les moyens de paiement</div>
    ${barRowsHtml(Object.entries(s.parMoyen||{}), {
      labelOf:m=>(PAY_METHOD_META[m]||{label:m}).label,
      colorOf:m=>(PAY_METHOD_META[m]||{color:'var(--muted)'}).color,
    })}`);
}
function openCoiffeurStatDetail(coiffeurId){
  const s=lastStatsOverview; if(!s) return;
  const ranked = s.parCoiffeur.slice().sort((a,b)=>b.ca-a.ca);
  const c = ranked.find(x=>x.coiffeurId===coiffeurId); if(!c) return;
  const rank = ranked.findIndex(x=>x.coiffeurId===coiffeurId)+1;
  openStatDrawer('👤', c.nom, `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(c.ca)}</div><div class="l">Chiffre d'affaires</div></div>
      <div class="card"><div class="v">${c.tickets}</div><div class="l">Tickets</div></div>
      <div class="card"><div class="v">${fmt(c.tickets?Math.round(c.ca/c.tickets):0)}</div><div class="l">Panier moyen</div></div>
      <div class="card"><div class="v">#${rank}</div><div class="l">Rang de l'équipe</div></div>
    </div>`);
}
function openPrestationStatDetail(i){
  const s=lastStatsOverview; if(!s) return;
  const p=s.topPrestations[i]; if(!p) return;
  openStatDrawer('✂️', p.nom, `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${p.qte}</div><div class="l">Ventes</div></div>
      <div class="card"><div class="v">${fmt(p.ca)}</div><div class="l">Chiffre d'affaires généré</div></div>
      <div class="card"><div class="v">${fmt(p.qte?Math.round(p.ca/p.qte):0)}</div><div class="l">Prix moyen constaté</div></div>
      <div class="card"><div class="v">${s.ca?Math.round(p.ca/s.ca*100):0}%</div><div class="l">Part du CA (brut)</div></div>
    </div>`);
}
function openClientStatDetail(i){
  const s=lastStatsOverview; if(!s) return;
  const c=s.topClients[i]; if(!c) return;
  openStatDrawer('👑', c.nom, `Du ${s.from} au ${s.to}`, `
    <div class="dr-kpi">
      <div class="card"><div class="v">${fmt(c.total)}</div><div class="l">Dépensé sur la période</div></div>
      <div class="card"><div class="v">${c.visites}</div><div class="l">Visite${c.visites>1?'s':''}</div></div>
      <div class="card"><div class="v">${fmt(c.visites?Math.round(c.total/c.visites):0)}</div><div class="l">Panier moyen</div></div>
    </div>`);
}

/* =================== RDV MODAL =================== */
function openRdvModal(){
  const rServ = document.getElementById('r-serv');
  const rCoiff = document.getElementById('r-coiffeur');
  if(rServ) rServ.innerHTML=SERVICES.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  if(rCoiff) rCoiff.innerHTML=COIFFEURS.map(c=>`<option value="${c.id}">${c.nom}</option>`).join('');
  enhanceSelect(rServ);
  enhanceSelect(rCoiff);
  if(rServ && rServ._customSync) rServ._customSync();
  if(rCoiff && rCoiff._customSync) rCoiff._customSync();
  document.getElementById('r-name').value='';
  document.getElementById('r-phone').value='';
  document.getElementById('rdv-overlay').classList.add('show');
}
// Client rattaché par téléphone (trouvé ou créé à la volée, comme en caisse) —
// un nom seul sans téléphone reste un rendez-vous non rattaché (note libre).
async function addRdv(){
  const name=document.getElementById('r-name').value.trim();
  const phone=document.getElementById('r-phone').value.trim();
  const time=document.getElementById('r-time').value;
  const serviceId=document.getElementById('r-serv').value;
  const coiffeurId=document.getElementById('r-coiffeur').value;
  if(!serviceId){ toast('Choisissez une prestation'); return; }
  if(!coiffeurId){ toast('Choisissez un coiffeur'); return; }
  if(!time){ toast('Choisissez une heure'); return; }

  try{
    let clientId;
    if(phone){
      const existing=CLIENTS.find(c=>c.phone===phone);
      clientId = existing ? existing.id : (await createClient(name||'Client', phone)).id;
    }
    const debut=`${rdvDate()}T${time}:00`;
    const appt=await apiFetch('/appointments', {method:'POST', body:JSON.stringify({
      clientId, serviceId, coiffeurId, debut, note:(!phone && name) ? name : undefined,
    })});
    RDV.push(appt);
    RDV.sort((a,b)=>new Date(a.debut)-new Date(b.debut));
    renderRdv(); closeModal('rdv-overlay');
    logAct('rdv', session?session.name:'Accueil','Rendez-vous ajouté',`${appt.client?.nom||name||'Client de passage'} · ${time} · ${appt.coiffeur.nom}`);
    renderStaff(); refreshAlerts();
    toast('Rendez-vous ajouté au planning');
  }catch(err){
    toast(err.message||'Impossible de créer le rendez-vous');
  }
}

/* =================== PAYMENT FLOW =================== */
// Vérifie/ouvre une session de caisse (CDC §4.4). Le backend est la seule
// source de vérité pour l'autorisation — si l'utilisateur n'a pas le droit
// d'ouvrir la caisse, son message d'erreur (403) est simplement affiché.
async function ensureCashSession(){
  // Session déjà connue ouverte dans cet onglet : pas besoin de revérifier à
  // chaque clic sur Encaisser — le serveur reste la source de vérité et
  // rejettera la création de ticket si elle a été fermée entre-temps.
  if(currentCashSessionId) return true;
  try{
    const s=await apiFetch('/cash-sessions/current');
    currentCashSessionId=s.id;
    return true;
  }catch(err){
    if(err.status!==404){ toast(err.message||'Erreur de session de caisse'); return false; }
    const r=await openFormModal({
      title:'Ouvrir la caisse', message:'Aucune session de caisse ouverte.', confirmLabel:'Ouvrir la caisse',
      fields:[{id:'montant', label:'Fond de caisse (F)', type:'number', value:10000, min:0}],
    });
    if(!r) return false;
    try{
      const s=await apiFetch('/cash-sessions', {method:'POST', body:JSON.stringify({fondCaisse:+r.montant||0})});
      currentCashSessionId=s.id;
      toast('Caisse ouverte');
      return true;
    }catch(err2){
      toast(err2.message||'Impossible d\'ouvrir la caisse');
      return false;
    }
  }
}
// Clôture Z (CDC §4.4/§9.3) : comptage réel des espèces, écart calculé côté
// serveur. Motif obligatoire uniquement si un écart est détecté.
async function closeCashSessionPrompt(){
  let session;
  try{
    session = await apiFetch('/cash-sessions/current');
  }catch(err){
    toast(err.status===404 ? 'Aucune session de caisse ouverte' : (err.message||'Erreur de session de caisse'));
    return;
  }

  const countR = await openFormModal({
    title:'Clôture de caisse', confirmLabel:'Clôturer',
    fields:[{id:'totalCompte', label:'Montant réellement compté en espèces (F)', type:'number', min:0}],
  });
  if(!countR) return;
  const totalCompte = +countR.totalCompte;
  if(Number.isNaN(totalCompte) || totalCompte<0){ toast('Montant invalide'); return; }

  try{
    const closed = await apiFetch(`/cash-sessions/${session.id}/close`, {
      method:'PATCH', body:JSON.stringify({totalCompte}),
    });
    currentCashSessionId=null;
    toast(closed.ecart===0 ? 'Caisse clôturée — aucun écart' : `Caisse clôturée — écart de ${fmt(closed.ecart)}`);
  }catch(err){
    if(err.status!==400){ toast(err.message||'Impossible de clôturer la caisse'); return; }
    const motifR = await openFormModal({
      title:'Écart détecté', message:err.message, confirmLabel:'Justifier et clôturer',
      fields:[{id:'motif', label:'Motif de l\'écart'}],
    });
    if(!motifR || !motifR.motif.trim()) return;
    const motif = motifR.motif.trim();
    try{
      const closed = await apiFetch(`/cash-sessions/${session.id}/close`, {
        method:'PATCH', body:JSON.stringify({totalCompte, motifEcart:motif}),
      });
      currentCashSessionId=null;
      toast(`Caisse clôturée — écart de ${fmt(closed.ecart)} justifié`);
    }catch(err2){
      toast(err2.message||'Impossible de clôturer la caisse');
    }
  }
}
// Remise avec plafond de rôle + escalade PIN gérant/admin (CDC §2.3).
async function applyDiscountWithEscalation(ticketId, pourcent, motif){
  try{
    await apiFetch(`/tickets/${ticketId}/discount`, {method:'POST', body:JSON.stringify({pourcent, motif})});
  }catch(err){
    if(err.status!==403){ toast(err.message||'Remise refusée'); return; }
    const authR = await openFormModal({
      title:'Autorisation requise', message:'Remise au-delà du plafond — identifiant et PIN d\'un gérant/admin.',
      confirmLabel:'Autoriser',
      fields:[
        {id:'login', label:'Identifiant'},
        {id:'pin', label:'PIN', type:'password'},
      ],
    });
    if(!authR || !authR.login.trim() || !authR.pin.trim()) return;
    const login=authR.login.trim(), pin=authR.pin.trim();
    try{
      await apiFetch(`/tickets/${ticketId}/discount`, {method:'POST', body:JSON.stringify({pourcent, motif, authorization:{login,pin}})});
      toast('Remise autorisée');
    }catch(err2){
      toast(err2.message||'Autorisation refusée');
    }
  }
}
// Bascule vers le serveur : crée le vrai ticket + lignes + remise, puis
// n'affiche les moyens de paiement qu'une fois les totaux serveur connus.
async function openPayment(){
  if(!cart.length) return;
  if(!(await ensureCashSession())) return;

  const coiffeurId=document.getElementById('assign-coiffeur').value;
  if(!coiffeurId){ toast('Choisissez un coiffeur pour ce ticket'); return; }
  const clientId=currentClient!=null ? CLIENTS[currentClient].id : undefined;

  const payBtn=document.getElementById('pay-btn');
  const payBtnLabel=payBtn?payBtn.innerHTML:null;
  if(payBtn){
    payBtn.disabled=true;
    payBtn.innerHTML='<span class="btn-spinner"></span> Création du ticket…';
  }
  try{
    const items=cart.map(item=>({serviceId:item.serviceId, quantite:item.qty}));
    const ticket=await apiFetch('/tickets', {method:'POST', body:JSON.stringify({coiffeurId, clientId, items})});
    currentTicketId=ticket.id;

    let finalTicket=ticket;
    const discPct=Math.min(100,Math.max(0,+document.getElementById('discount').value||0));
    if(discPct>0){
      let motif;
      if(discPct>10){
        const motifR = await openFormModal({
          title:'Motif de la remise', message:`Remise de ${discPct}% — un motif est obligatoire au-delà de 10%.`,
          confirmLabel:'Valider', fields:[{id:'motif', label:'Motif'}],
        });
        motif = motifR ? motifR.motif.trim() : '';
      }
      if(discPct<=10 || motif){
        await applyDiscountWithEscalation(currentTicketId, discPct, motif);
        finalTicket=await apiFetch(`/tickets/${currentTicketId}`);
      }
    }

    payState={method:null, ticket:finalTicket};
    renderPayMethods();
    document.getElementById('pay-overlay').classList.add('show');
  }catch(err){
    toast(err.message||'Impossible de créer le ticket');
  }finally{
    if(payBtn){ payBtn.disabled=false; payBtn.innerHTML=payBtnLabel; }
  }
}
function renderPayMethods(){
  const ticket=payState.ticket;
  const total=ticket.total;
  const cl = currentClient!=null?CLIENTS[currentClient]:null;
  document.getElementById('pay-title').textContent='Encaissement';
  document.getElementById('pay-content').innerHTML=`
    <div class="pay-total"><div class="l">Montant à encaisser${cl?' · '+cl.name:''}</div><div class="v">${fmt(total)}</div></div>
    <div style="font-size:12.5px;font-weight:700;color:var(--muted);margin:16px 0 10px">MOYEN DE PAIEMENT</div>
    <div class="pay-methods">
      ${PAY_METHODS.map(m=>`
        <button class="pm${m.disabled?' disabled':''}" ${m.disabled?'disabled':`onclick="selectMethod('${m.id}')"`} id="pm-${m.id}">
          <div class="pm-logo"${m.img?'':` style="background:${m.bg}"`}>${m.img?`<img src="${encodeURI(m.img)}" alt="${m.name}">`:m.logo}</div>
          <div class="pm-name">${m.name}</div>
          <div class="pm-tag">${m.tag}</div>
        </button>`).join('')}
    </div>
    <div id="pay-extra"></div>`;
}
function selectMethod(id){
  const m=PAY_METHODS.find(x=>x.id===id);
  if(m.disabled) return;
  payState.method=id;
  document.querySelectorAll('.pm').forEach(p=>p.classList.remove('sel'));
  document.getElementById('pm-'+id).classList.add('sel');
  const total=payState.ticket.total;
  const ex=document.getElementById('pay-extra');
  if(id==='especes'){
    ex.innerHTML=`
      <div class="pay-field"><label for="cash-in">Montant reçu du client</label>
        <input type="number" id="cash-in" placeholder="${total}" oninput="cashChange(${total})"></div>
      <div class="hint" id="cash-change">Monnaie à rendre : 0 F</div>
      <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="confirmCashPayment()">Valider l'encaissement</button>`;
  } else {
    const clientPhone=currentClient!=null ? (CLIENTS[currentClient].phone||'') : '';
    ex.innerHTML=`
      <div class="pay-field"><label for="mm-phone">Numéro ${m.name} du client</label>
        <input id="mm-phone" placeholder="77 000 00 00" value="${clientPhone}"></div>
      <div class="hint">Le client valide le paiement en ouvrant le lien sur son téléphone.</div>
      <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="confirmMobilePayment('${id}')">Créer la demande de paiement</button>`;
  }
}
function cashChange(total){
  const v=+document.getElementById('cash-in').value||0;
  const c=v-total;
  document.getElementById('cash-change').innerHTML = c>=0
    ? `Monnaie à rendre : <b style="color:var(--green)">${fmt(c)}</b>`
    : `<span style="color:#C0504D">Il manque ${fmt(-c)}</span>`;
}
async function confirmCashPayment(){
  const total=payState.ticket.total;
  const recu=+document.getElementById('cash-in').value||total;
  try{
    const result=await apiFetch(`/tickets/${currentTicketId}/pay`, {method:'POST', body:JSON.stringify({methode:'especes', montant:total, recu})});
    fetchTodayOverview();
    renderReceipt(result.ticket, 'Espèces', result.rendu);
  }catch(err){
    toast(err.message||'Paiement refusé');
  }
}
async function confirmMobilePayment(methode){
  const total=payState.ticket.total;
  const phone=document.getElementById('mm-phone').value.trim();
  const m=PAY_METHODS.find(x=>x.id===methode);
  try{
    const result=await apiFetch(`/tickets/${currentTicketId}/pay`, {method:'POST', body:JSON.stringify({methode, montant:total, customerPhone:phone||undefined})});
    document.getElementById('pay-content').innerHTML=`
      <div class="processing">
        <div class="phone-anim"><div class="ring"></div><div class="spinner"></div></div>
        <div class="proc-title">En attente du paiement ${m.name}…</div>
        <div class="proc-sub">Faites scanner ce code par le client avec l'appareil photo de son téléphone — ou ouvrez le lien directement.</div>
        <div class="pay-qr" id="pay-qr"></div>
        <a class="btn btn-gold btn-block" style="margin:14px 0" href="${result.launchUrl}" target="_blank" rel="noopener">Ouvrir le lien de paiement ${m.name}</a>
        <button class="btn btn-ghost btn-block" onclick="renderPayMethods()">Changer de moyen</button>
      </div>`;
    renderPaymentQr(result.launchUrl, m.name);
    pollTicketPayment(currentTicketId, m.name);
  }catch(err){
    toast(err.message||'Impossible de créer la demande de paiement');
  }
}
// Le client scanne avec son propre téléphone au lieu qu'on lui prête celui
// du salon — `qrcode` vient de js/lib/qrcode.js (vendored, sans dépendance
// réseau). Si jamais indisponible, le bouton "Ouvrir le lien" au-dessus
// reste utilisable tel quel (rien ne casse, juste pas de QR affiché).
function renderPaymentQr(url, methodName){
  const host = document.getElementById('pay-qr');
  if(!host || typeof qrcode!=='function') return;
  try{
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    host.innerHTML = qr.createSvgTag({cellSize:5, margin:8, alt:`Code de paiement ${methodName}`});
  }catch(err){ /* le lien "Ouvrir" reste disponible, pas de blocage */ }
}
// Pas de SSE en V1 — vérification par sondage (CDC §5.3 : expiration à 5 min).
let pollTimer=null;
function pollTicketPayment(ticketId, methodeLabel){
  clearInterval(pollTimer);
  const start=Date.now();
  pollTimer=setInterval(async ()=>{
    if(Date.now()-start > 5*60*1000){ clearInterval(pollTimer); return; }
    try{
      const t=await apiFetch(`/tickets/${ticketId}`);
      if(t.statut==='paye'){
        clearInterval(pollTimer);
        fetchTodayOverview();
        renderReceipt(t, methodeLabel);
      }
    }catch(err){ /* erreur transitoire — on continue de sonder */ }
  }, 3000);
}
function renderReceipt(ticket, methodeLabel, rendu){
  const who=document.getElementById('assign-coiffeur');
  const coiffeurNom=who && who.selectedOptions[0] ? who.selectedOptions[0].textContent : '';
  const now=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const lines=(ticket.items||[]).map(i=>`<div class="rc-row"><span>${i.quantite}× ${i.libelle}</span><span>${fmt(i.total)}</span></div>`).join('');
  const discRow=ticket.remiseMontant>0 ? `<div class="rc-row" style="color:var(--green)"><span>Remise${ticket.remiseMotif?' ('+ticket.remiseMotif+')':''}</span><span>− ${fmt(ticket.remiseMontant)}</span></div>` : '';
  const renduRow=rendu!=null ? `<div class="rc-row" style="border:none;color:var(--muted)"><span>Monnaie rendue</span><span>${fmt(Math.max(0,rendu))}</span></div>` : '';
  const loyalty=ticket.client?.loyaltyAccount;
  const fidBlock=loyalty ? `<div class="rc-row" style="border:none;color:var(--muted)"><span>Carte ${loyalty.numeroCarte}</span><span>solde ${loyalty.points} pts</span></div>` : '';
  const earnNote=ticket.client ? `<div class="earn-note">⭐ Points fidélité mis à jour pour ${ticket.client.nom}</div>` : '';

  document.getElementById('pay-title').textContent='Paiement réussi';
  document.getElementById('pay-content').innerHTML=`
    <div class="success">
      <div class="check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
      <div class="proc-title" style="font-size:19px">Encaissé avec succès</div>
      <div class="proc-sub">Réglé par <b>${methodeLabel}</b> · ${now}</div>
      <div class="receipt">
        <div class="rc-head"><div class="t serif">${CONFIG.name}</div><div class="s">TICKET #${String(ticket.numero).padStart(5,'0')}</div></div>
        ${lines}
        ${discRow}
        <div class="rc-row big"><span>Total payé</span><span>${fmt(ticket.total)}</span></div>
        <div class="rc-row" style="border:none;color:var(--muted)"><span>Moyen</span><span>${methodeLabel}</span></div>
        ${renduRow}
        ${fidBlock}
        <div class="rc-row" style="border:none;color:var(--muted)"><span>Encaissé par</span><span>${session.name} · ${roleOf().name}</span></div>
      </div>
      ${earnNote}
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="printReceipt('${ticket.id}')">🖨 Imprimer</button>
        <button class="btn btn-gold" style="flex:1;justify-content:center" onclick="closePay()">Nouveau ticket</button>
      </div>
    </div>`;

  logAct('sale', session?session.name:'Caisse', 'Ticket encaissé', `${methodeLabel}${ticket.client?' · '+ticket.client.nom:''}${coiffeurNom?' · coiffeur '+coiffeurNom:''}`, ticket.total);
  refreshAlerts();
  if(document.getElementById('view-admin').classList.contains('active')) renderAdmin();
  if(currentClient!=null && loyalty){
    CLIENTS[currentClient].pts=loyalty.points;
    CLIENTS[currentClient].spent=loyalty.totalDepense;
    renderClients();
  }
}
function closePay(){
  cart=[]; document.getElementById('discount').value=0;
  currentClient=null; currentTicketId=null;
  clearInterval(pollTimer);
  fillClientSelect(); renderLoyaltyChip(); renderTicket();
  closeModal('pay-overlay');
  toast('Ticket clôturé');
}
function closeModal(id){document.getElementById(id).classList.remove('show');}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));

/* ---------------- Modal générique (remplace prompt()/confirm()) ---------------- */
// Un seul champ ou plusieurs, texte ou liste — toujours dans le thème de
// l'app, jamais la boîte de dialogue du navigateur. Résout avec un objet
// {champId: valeur} si validé, ou null si annulé (mêmes sémantiques que
// prompt()/confirm(), mais habillées).
let formModalResolve = null;
function openFormModal({title, message, fields=[], confirmLabel='Valider', danger=false}){
  return new Promise(resolve=>{
    formModalResolve = resolve;
    document.getElementById('form-modal-title').textContent = title;
    const msgEl = document.getElementById('form-modal-message');
    msgEl.textContent = message||'';
    msgEl.style.display = message ? '' : 'none';
    document.getElementById('form-modal-body').innerHTML = fields.map(f=>{
      const full = f.full===false ? '' : ' full';
      if(f.type==='select'){
        return `<div class="fg${full}"><label for="fm-${f.id}">${f.label}</label>
          <select id="fm-${f.id}">${f.options.map(o=>`<option value="${o.value}" ${o.value===f.value?'selected':''}>${o.label}</option>`).join('')}</select></div>`;
      }
      return `<div class="fg${full}"><label for="fm-${f.id}">${f.label}</label>
        <input id="fm-${f.id}" type="${f.type||'text'}" placeholder="${f.placeholder||''}" value="${f.value??''}" ${f.min!=null?`min="${f.min}"`:''}></div>`;
    }).join('');
    const confirmBtn = document.getElementById('form-modal-confirm');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.classList.toggle('btn-gold', !danger);
    confirmBtn.classList.toggle('btn-ghost', danger);
    confirmBtn.style.color = danger ? '#C0504D' : '';
    document.getElementById('form-modal-overlay').classList.add('show');
    setTimeout(()=>{ const first=document.querySelector('#form-modal-body input,#form-modal-body select'); if(first) first.focus(); else document.getElementById('form-modal-confirm').focus(); }, 30);
  });
}
function submitFormModal(ev){
  if(ev) ev.preventDefault();
  if(!formModalResolve) return;
  const result = {};
  document.querySelectorAll('#form-modal-body input,#form-modal-body select').forEach(el=>{
    result[el.id.replace('fm-','')] = el.value;
  });
  const resolve = formModalResolve; formModalResolve = null;
  document.getElementById('form-modal-overlay').classList.remove('show');
  resolve(result);
}
function cancelFormModal(){
  if(!formModalResolve) return;
  const resolve = formModalResolve; formModalResolve = null;
  document.getElementById('form-modal-overlay').classList.remove('show');
  resolve(null);
}
document.getElementById('form-modal-overlay').addEventListener('click', e=>{
  if(e.target.id==='form-modal-overlay') cancelFormModal();
});

/* =================== MISC =================== */
let toastT;
function toast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show'); clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),2200);
}
function clock(){
  const d=new Date();
  const opts={weekday:'long',day:'numeric',month:'long'};
  document.getElementById('live-clock').textContent=
    d.toLocaleDateString('fr-FR',opts)+' · '+d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}


/* ==================================================================
   V2 — ADMINISTRATION · SUPERVISION · PARAMÈTRES · UX
   ================================================================== */

/* ---------------- Configuration du salon ---------------- */
// name/tagline/phone/address/logoUrl écrasés par fetchSalonIdentity() dès la
// connexion (GET /salons/me) — les valeurs ici ne servent qu'avant login.
const CONFIG = {
  name:"Maison Fade", tagline:"Salon · Barber",
  phone:"77 000 00 00", address:"Sacré-Cœur 3, Dakar", logoUrl:'logo/Logo MF.jpeg',
  seats:6, goalDay:180000, goalMonth:4500000,
  hours:{lundi:['09:00','20:00',1],mardi:['09:00','20:00',1],mercredi:['09:00','20:00',1],
         jeudi:['09:00','20:00',1],vendredi:['09:00','21:00',1],samedi:['08:00','21:00',1],dimanche:['10:00','16:00',0]},
  stockLow:10, stockCrit:3, stockAlert:true,
  commission:15, discountMax:15, lateAlert:true,
  pay:{wave:true, orange_money:true, especes:true},
  theme:'light', density:'normal'
};

const ROLES = [
  {id:'admin',  name:'Administrateur', maxDisc:100,
   p:{caisse:1,remise:1,rdv:1,clients:1,stock:1,perso:1,stats:1,admin360:1,journal:1,params:1,users:1}},
  {id:'gerant', name:'Gérant', maxDisc:30,
   p:{caisse:1,remise:1,rdv:1,clients:1,stock:1,perso:1,stats:1,admin360:0,journal:0,params:0,users:0}},
  {id:'coiffeur', name:'Coiffeur', maxDisc:10,
   p:{caisse:1,remise:1,rdv:1,clients:1,stock:0,perso:1,stats:1,admin360:0,journal:0,params:0,users:0}},
];
const PERMS = [
  ['caisse','Encaisser'],['remise','Accorder une remise'],['rdv','Gérer les rendez-vous'],
  ['clients','Gérer le fichier clients'],['stock','Gérer le stock'],
  ['perso','Gérer le personnel et les pointages'],['stats','Voir les statistiques'],
  ['admin360','Ouvrir la supervision 360°'],['journal','Consulter le journal'],
  ['params','Modifier les paramètres du salon'],['users','Gérer les comptes et les accès'],
];

/* ---------------- Personnel (donnees reelles) ----------------
   STAFF est alimente par fetchStaffTeam() (croise /staff/profiles,
   /staff/attendance, /staff/attendance-month et /stats/overview du mois en
   cours) — plus aucune donnee de demonstration. Certains champs de l'ancien
   tableau fictif n'ont pas d'equivalent reel (statut "en prestation" precis,
   note moyenne sans systeme d'avis) : ils sont soit simplifies, soit affiches
   comme absents plutot que fabriques. */
let STAFF = [];
const ST_LABEL = {busy:['s-busy','En prestation'], free:['s-free','Disponible'],
                  break:['s-break','En pause'],    off:['s-off','Pas encore pointe']};
const ST_COLOR = {busy:'var(--info)', free:'var(--green)', break:'var(--gold)', off:'#C9BCC8'};
function hm2(d){ return d ? new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : null; }
async function fetchStaffTeam(){
  try{
    const from = new Date(); from.setDate(1);
    const fromStr = from.toISOString().slice(0,10);
    const toStr = new Date().toISOString().slice(0,10);
    // En deux vagues plutôt que 4 appels simultanés — le poste de commande
    // (go('team')) cumule déjà d'autres requêtes (pointage, commissions) au
    // même instant ; limite la pointe de connexions concurrentes au pool DB.
    const [profiles, today] = await Promise.all([apiFetch('/staff/profiles'), apiFetch('/staff/attendance')]);
    const [month, stats] = await Promise.all([
      apiFetch('/staff/attendance-month'),
      apiFetch(`/stats/overview?from=${fromStr}&to=${toStr}`),
    ]);
    const todayByUser = new Map(today.map(t=>[t.user.id, t.attendance]));
    const monthByUser = new Map(month.map(m=>[m.user.id, m]));
    const statsByUser = new Map(stats.parCoiffeur.map(c=>[c.coiffeurId, c]));
    const todayName = new Date().toLocaleDateString('fr-FR',{weekday:'long'});
    const planStart = (CONFIG.hours[todayName]||CONFIG.hours.lundi)[0];

    STAFF = profiles.map(({user:u, profile:pr})=>{
      const att = todayByUser.get(u.id) || null;
      const enPause = !!(att?.pauses?.length && !att.pauses[att.pauses.length-1].fin);
      const status = !att?.heureArrivee ? 'off' : att.heureDepart ? 'off' : enPause ? 'break' : 'free';
      const m = monthByUser.get(u.id) || {heuresTotal:0, retardsTotal:0, joursTravailles:0, joursEnRetard:0};
      const s = statsByUser.get(u.id) || {ca:0, tickets:0, remise:0};
      const goal = pr.objectifMensuel||0;
      return {
        id:u.id, name:u.nom, first:u.nom.split(' ')[0], role:roleName(u.role),
        status, in:hm2(att?.heureArrivee), out:hm2(att?.heureDepart), plan:planStart,
        retardMinAujourdhui: att?.retardMin||0,
        hours:m.heuresTotal, late:m.joursEnRetard||0, joursTravailles:m.joursTravailles||0,
        tickets:s.tickets, ca:s.ca, disc:s.remise,
        goal, goalPct: goal ? Math.min(100, Math.round(s.ca/goal*100)) : 0,
        punctPct: m.joursTravailles ? Math.max(0, Math.round((1 - m.joursEnRetard/m.joursTravailles)*100)) : 100,
        tauxCommission:pr.tauxCommission ?? CONFIG.commission,
        rating:pr.noteMoyenne, reviews:0, until:null,
      };
    });
  }catch(err){ STAFF = []; }
}

/* ---------------- Journal d'activite (reutilise le vrai journal d'audit) ---------------- */
const ACT_TYPE = {
  sale:    ['💰','Encaissement',  'var(--green-soft)'],
  rdv:     ['📅','Rendez-vous',   'var(--info-soft)'],
  punch:   ['🕒','Pointage',      'var(--warn-soft)'],
  stock:   ['📦','Stock',         '#F1ECF0'],
  loyalty: ['⭐','Fidélité',      'var(--gold-soft)'],
  admin:   ['⚙️','Administration','#F1ECF0'],
};
function nowHM(){ return new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
// Le flux d'activite local (ACTIVITY) a ete retire : il n'etait jamais
// persiste (perdu au rechargement, invisible d'un autre poste) et faisait
// doublon avec le vrai journal d'audit serveur (AUDIT_LOG, /admin/audit).
// logAct() reste un no-op pour ne pas casser ses appelants existants.
function logAct(){}

/* ---------------- Serie 7 jours (reelle, /stats/daily) ---------------- */
let WEEK = [];
async function fetchWeekSeries(){
  try{
    const days = await apiFetch('/stats/daily?days=7');
    const DOW = ['dim','lun','mar','mer','jeu','ven','sam'];
    WEEK = days.map(d=>({ d: DOW[new Date(d.date+'T00:00:00Z').getUTCDay()], ca:d.ca, tickets:d.tickets, clients:d.clients }));
  }catch(err){ WEEK = []; }
  renderDashBars();
}
function renderDashBars(){
  const el = document.getElementById('dash-bars');
  if(!el) return;
  if(!WEEK.length){ el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucune donnée sur les 7 derniers jours.</div>'; return; }
  const max = Math.max(1, ...WEEK.map(w=>w.ca));
  el.innerHTML = WEEK.map(w=>`
    <div class="bar" style="height:${w.ca?Math.max(6,Math.round(w.ca/max*100)):2}%" title="${w.d} · ${fmt(w.ca)}">
      <span>${w.d}</span>
    </div>`).join('');
}
// Prestations phares du tableau de bord — reprend les prestations les plus
// vendues sur les 30 derniers jours (même fenêtre que l'écran Statistiques).
async function fetchDashTopServices(){
  const el = document.getElementById('dash-top-serv');
  if(!el) return;
  try{
    const to = new Date().toISOString().slice(0,10);
    const from = new Date(Date.now()-29*86400000).toISOString().slice(0,10);
    const s = await apiFetch(`/stats/overview?from=${from}&to=${to}`);
    el.innerHTML = s.topPrestations.length ? s.topPrestations.map(p=>
      `<div class="top-serv"><span style="font-weight:700">${p.nom}</span><span class="tag gold">${p.qte} ventes</span></div>`
    ).join('') : '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucune vente sur les 30 derniers jours.</div>';
  }catch(err){
    el.innerHTML = '<div style="color:var(--muted);font-size:13px;padding:10px 0">Statistiques indisponibles.</div>';
  }
}
let adminSerie = 'ca';

/* ---------------- Alertes ---------------- */
function buildAlerts(){
  const a = [];
  STOCK.forEach(s=>{
    if(!CONFIG.stockAlert) return;
    if(s.quantite<=s.seuilCritique) a.push({sev:'crit',ic:'📦',t:`${s.nom} : ${s.quantite} en rayon`,
      s:'Commandez aujourd\'hui pour ne pas refuser de prestation.',v:'stock'});
    else if(s.quantite<=s.seuilBas) a.push({sev:'warn',ic:'📦',t:`${s.nom} : stock bas`,
      s:`${s.quantite} unités restantes, prévoyez le réassort.`,v:'stock'});
  });
  STAFF.forEach(p=>{
    if(p.status==='off' && CONFIG.lateAlert) a.push({sev:'crit',ic:'🚫',t:`${p.name} n'a pas pointé`,
      s:`Service prévu à ${p.plan}. Ses créneaux ne sont couverts par personne.`,v:'team'});
    const dPct = p.ca ? Math.round(p.disc/p.ca*100) : 0;
    if(dPct>CONFIG.discountMax) a.push({sev:'warn',ic:'🏷️',t:`Remises élevées chez ${p.first}`,
      s:`${dPct} % des recettes en remise, seuil fixé à ${CONFIG.discountMax} %.`,v:'team'});
  });
  const waiting = RDV.filter(r=>RDV_OPEN_STATUTS.includes(r.statut)).length;
  if(waiting) a.push({sev:'info',ic:'📅',t:`${waiting} rendez-vous à honorer`,
    s:'Vérifiez que chaque client a bien été rappelé.',v:'rdv'});
  return a;
}
function renderAlerts(host, alerts, compact){
  const el = document.getElementById(host);
  if(!alerts.length){
    el.innerHTML = `<div style="text-align:center;padding:28px 10px;color:var(--muted)">
      <div style="font-size:26px">✅</div>
      <div style="font-weight:700;margin-top:8px;color:var(--ink)">Rien à arbitrer</div>
      <div style="font-size:12.5px;margin-top:4px">Stock, présences et remises sont dans les clous.</div></div>`;
    return;
  }
  el.innerHTML = alerts.map(x=>`
    <button class="al ${x.sev}" onclick="go('${x.v}');closeNotif()">
      <span class="ic">${x.ic}</span>
      <span class="txt"><span class="tt">${x.t}</span><span class="ss">${x.s}</span></span>
      ${compact?'':'<span class="go">Ouvrir →</span>'}
    </button>`).join('');
}

/* ---------------- Supervision 360° ---------------- */
function healthScore(){
  const goalPct = Math.min(100, (todayOverview?.ca||0)/CONFIG.goalDay*100);
  const presence = STAFF.length ? STAFF.filter(p=>p.status!=='off').length/STAFF.length*100 : 100;
  const stockOk = STOCK.length ? STOCK.filter(s=>s.quantite>s.seuilCritique).length/STOCK.length*100 : 100;
  // Pas de systeme d'avis client reel (aucune donnee) : la note moyenne est
  // retiree du calcul plutot que fabriquee, poids redistribue.
  return Math.round(goalPct*.45 + presence*.30 + stockOk*.25);
}
// Alertes réelles de supervision 360° (CDC §3.1) — stock, clôture, remises
// anormales, retard de pointage, paiement mobile money non confirmé,
// connexion refusée. Repli sur les heuristiques locales (stock/RDV) si
// l'appel échoue (ex. rôle non-admin qui verrait quand même cet écran).
function mapRealAlert(a){
  const sevMap={crit:'crit', warn:'warn', info:'info'};
  const icMap={ecart_cloture:'⚖️', remise_anormale:'🏷️', stock_critique:'📦', retard_pointage:'⏰', paiement_non_confirme:'💳', connexion_echouee:'🔐'};
  const viewMap={ecart_cloture:'admin', remise_anormale:'team', stock_critique:'stock', retard_pointage:'team', paiement_non_confirme:'caisse', connexion_echouee:'admin'};
  return {sev:sevMap[a.severite]||'info', ic:icMap[a.type]||'⚠️', t:a.message, s:'', v:viewMap[a.type]||'admin'};
}
async function renderAdmin(){
  document.getElementById('admin-alerts').innerHTML = skeletonCards(3);
  // En deux vagues (pas 4 requêtes simultanées) — limite la pointe de
  // connexions concurrentes au pool DB.
  const [sup] = await Promise.all([apiFetch('/admin/360').catch(()=>null), fetchTodayOverview()]);
  await Promise.all([
    STAFF.length ? Promise.resolve() : fetchStaffTeam(),
    fetchAuditLog().catch(()=>{}),
  ]);
  const alerts = sup ? sup.alertes.map(mapRealAlert) : buildAlerts();
  const present = STAFF.filter(p=>p.status!=='off').length;
  const ticketsToday = sup?.ticketsAujourdhui ?? todayOverview?.tickets ?? 0;
  const score = healthScore();
  const dayCA = sup?.caAujourdhui ?? todayOverview?.ca ?? 0;
  const pct = Math.min(100, Math.round(dayCA/CONFIG.goalDay*100));
  const today = new Date().toLocaleDateString('fr-FR',{weekday:'long'});
  const h = CONFIG.hours[today] || CONFIG.hours.lundi;

  document.getElementById('admin-hero').innerHTML = `
    <div class="cmd-hero">
      <div class="ring" style="--p:${score}"><div class="ring-in"><b>${score}</b><span>santé</span></div></div>
      <div class="cmd-main">
        <h2>${CONFIG.name} · poste de commande</h2>
        <p>Tout ce qui se passe dans le salon en ce moment, sur un seul écran.</p>
        <div class="cmd-chips">
          <span class="chip">${h[2]?`🟢 Ouvert jusqu'à <b>${h[1]}</b>`:'🔴 Fermé aujourd\'hui'}</span>
          <span class="chip">👥 <b>${present}/${STAFF.length}</b> coiffeurs en poste</span>
          <span class="chip">🧾 <b>${ticketsToday}</b> tickets aujourd'hui</span>
          <span class="chip">🔔 <b>${alerts.length}</b> alertes</span>
        </div>
      </div>
      <div class="cmd-goal">
        <div class="g-lbl"><span>Objectif du jour</span><span>${pct}%</span></div>
        <div class="g-val">${fmt(dayCA)} <span style="font-size:13px;color:#C4AEC5">/ ${fmt(CONFIG.goalDay)}</span></div>
        <div class="track"><i style="width:${pct}%"></i></div>
      </div>
    </div>`;

  const panier = ticketsToday ? Math.round(dayCA/ticketsToday) : 0;
  const discTot = (todayOverview?.parCoiffeur||[]).reduce((a,c)=>a+c.remise,0);
  const pts = CLIENTS.reduce((a,c)=>a+c.pts,0);
  const kpi = (ico,bg,col,val,lbl,delta,up)=>`
    <div class="kpi card">
      <div class="k-ico" style="background:${bg};color:${col}">${ico}</div>
      <div class="k-val">${val}</div><div class="k-lbl">${lbl}</div>
      <div class="k-delta ${up?'k-up':'k-dn'}">${delta}</div>
    </div>`;
  document.getElementById('admin-kpis').innerHTML =
    kpi('💰','var(--gold-soft)','var(--gold-text)',fmt(dayCA),'Recettes encaissées',`▲ ${pct}% de l'objectif`,true)+
    kpi('🧾','var(--info-soft)','var(--info)',ticketsToday,'Tickets du jour',`▲ panier ${fmt(panier)}`,true)+
    kpi('🏷️','var(--danger-soft)','var(--danger)',fmt(discTot),'Remises accordées (jour)',
        `${dayCA?Math.round(discTot/(dayCA+discTot)*100):0}% du chiffre brut`,false)+
    kpi('⭐','var(--green-soft)','var(--green)',pts.toLocaleString('fr-FR'),'Points fidélité en circulation','▲ engagement client',true);

  renderAlerts('admin-alerts', alerts, false);
  renderFeed();

  document.getElementById('admin-ctrl').innerHTML = `
    <thead><tr><th>Coiffeur</th><th>Tickets (mois)</th><th>Recettes (mois)</th><th>Remises</th><th>Part</th></tr></thead>
    <tbody>${STAFF.length ? STAFF.map(p=>{
      const d = p.ca?Math.round(p.disc/p.ca*100):0;
      const bad = d>CONFIG.discountMax;
      return `<tr onclick="openStaff('${p.id}')" style="cursor:pointer">
        <td><div class="cell-user"><div class="av">${initials(p.name)}</div><div><div class="nm">${p.first}</div><div class="mt">${p.role}</div></div></div></td>
        <td><b>${p.tickets}</b></td><td><b>${fmt(p.ca)}</b></td><td>${fmt(p.disc)}</td>
        <td><span class="tag ${bad?'':'green'}" style="${bad?'background:var(--danger-soft);color:var(--danger)':''}">${d}%${bad?' ⚠':''}</span></td>
      </tr>`;}).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">Aucun coiffeur actif.</td></tr>'}</tbody>`;

  document.getElementById('admin-goals').innerHTML = STAFF.length ? STAFF.map(p=>`
    <div class="goal-row">
      <div class="gav">${initials(p.name)}</div>
      <div class="gnm"><div class="n">${p.first}</div><div class="t"><i style="width:${p.goalPct}%"></i></div></div>
      <div class="gvl"><b>${p.goalPct}%</b><span>${p.goal?fmt(p.goal):'Non défini'}</span></div>
    </div>`).join('') : '<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun coiffeur actif.</div>';

  await fetchWeekSeries();
  renderAdminBars();
}
function renderFeed(){
  const rows = (typeof AUDIT_LOG!=='undefined' ? AUDIT_LOG : []).slice(0,14);
  document.getElementById('admin-feed').innerHTML = rows.length ? rows.map(a=>`
    <div class="feed-item">
      <span class="feed-time">${a.t}</span>
      <span class="feed-ico" style="background:var(--gold-soft)">${a.ic}</span>
      <div class="feed-txt"><b>${a.what}</b>${a.amt!=null?` · ${fmt(a.amt)}`:''}<span>${a.who}${a.sub?' · '+a.sub:''}</span></div>
    </div>`).join('') : '<div style="color:var(--muted);font-size:13px;padding:14px 0;text-align:center">Aucune écriture récente.</div>';
}
function setAdminSerie(k){
  adminSerie = k;
  document.querySelectorAll('#admin-seg button').forEach((b,i)=>b.classList.toggle('on', ['ca','tickets','clients'][i]===k));
  renderAdminBars();
}
function renderAdminBars(){
  const max = Math.max(1, ...WEEK.map(w=>w[adminSerie]));
  const unit = adminSerie==='ca' ? v=>fmt(v) : v=>v;
  const tot = WEEK.reduce((s,w)=>s+w[adminSerie], 0);
  const metricLabel = adminSerie==='ca' ? 'CA' : adminSerie==='tickets' ? 'Tickets' : 'Clients';
  const el = document.getElementById('admin-bars');
  if(!el) return;
  el.innerHTML = WEEK.map(w=>{
    const pct = tot ? Math.round(w[adminSerie]/tot*100) : 0;
    const title = w.d;
    const valStr = unit(w[adminSerie]);
    const subStr = `${pct}% du total hebdo (${metricLabel})`;
    return `<div class="bar" style="height:${Math.max(6, Math.round(w[adminSerie]/max*100))}%"
      onmouseenter="showGlobalTooltip(event, '${title}', '${valStr}', '${subStr}')"
      onmousemove="positionGlobalTooltip(event)"
      onmouseleave="hideGlobalTooltip()"
      ontouchstart="showGlobalTooltip(event, '${title}', '${valStr}', '${subStr}')"
      ontouchend="hideGlobalTooltip()">
      <span>${w.d}</span>
    </div>`;
  }).join('');
}

/* ---------------- Journal d'activité (registre inviolable, CDC §4.9) ---------------- */
// Alimenté par GET /admin/audit — chaque ligne existe côté serveur avec une
// empreinte chaînée au bloc précédent, jamais modifiable depuis l'écran.
let AUDIT_LOG = [];
let journalFilter = 'all';
const AUDIT_META = {
  connexion_reussie: {ic:'🔐', label:'Connexion',         tag:'green'},
  connexion_echouee: {ic:'🚫', label:'Connexion refusée', tag:'grey'},
  remise:            {ic:'🏷️', label:'Remise',            tag:'gold'},
  annulation_ticket: {ic:'❌', label:'Annulation',        tag:'grey'},
  modification_prix: {ic:'💲', label:'Tarif modifié',     tag:'blue'},
  cloture_caisse:    {ic:'🔒', label:'Clôture de caisse', tag:'green'},
  mouvement_stock:   {ic:'📦', label:'Stock',             tag:'grey'},
  commission_generee:{ic:'🧮', label:'Commission générée', tag:'blue'},
  commission_versee: {ic:'💸', label:'Commission versée',  tag:'green'},
  export_donnees_client: {ic:'📤', label:'Export données client', tag:'blue'},
  suppression_client:    {ic:'🗑️', label:'Client supprimé',       tag:'grey'},
  creation_compte:       {ic:'👤', label:'Compte créé',           tag:'green'},
  desactivation_compte:  {ic:'⛔', label:'Compte désactivé',      tag:'grey'},
  reactivation_compte:   {ic:'✅', label:'Compte réactivé',       tag:'green'},
  modification_pin:      {ic:'🔑', label:'Code PIN modifié',      tag:'blue'},
};
const STOCK_MOVEMENT_LABEL = {entree:'Entrée de stock', sortie:'Sortie de stock', perte:'Perte déclarée', inventaire:'Inventaire'};
function auditWhatSub(row){
  const ap=row.apres||{}, av=row.avant||{};
  switch(row.action){
    case 'connexion_reussie':
      return ['Connexion réussie', `${ap.login||''} · ${ap.role||''}`, null];
    case 'connexion_echouee':
      return ['Connexion refusée', `${ap.login||''} · ${ap.raison||''}`, null];
    case 'remise': {
      const pct = ap.pourcentEffectif!=null ? Math.round(ap.pourcentEffectif)+'%' : '';
      const auth = ap.autorisePar ? ` · autorisé par ${ap.autorisePar.nom}` : '';
      return [`Remise ${pct} appliquée`, (ap.remiseMotif||'sans motif')+auth, ap.remiseMontant];
    }
    case 'annulation_ticket':
      return ['Ticket annulé', ap.motif||'', null];
    case 'modification_prix':
      return [`Tarif modifié : ${ap.nom||''}`, `${fmt(av.prix||0)} → ${fmt(ap.prix||0)}`, null];
    case 'cloture_caisse':
      return ['Clôture de caisse', `Écart ${fmt(ap.ecart||0)}${ap.motifEcart?' · '+ap.motifEcart:''}`, ap.ecart];
    case 'mouvement_stock': {
      if(ap.type==='sortie_auto'){
        const mv=ap.mouvements||[];
        return [`Sortie de stock (${mv.length} article${mv.length>1?'s':''})`,
          mv.map(m=>`${m.nom} (-${m.quantite})`).join(', '), null];
      }
      const signe = ap.mouvementType==='entree' ? '+' : ap.mouvementType==='inventaire' ? (ap.ecart>=0?'+':'') : '-';
      return [`${STOCK_MOVEMENT_LABEL[ap.mouvementType]||'Mouvement'} : ${ap.produit||''}`,
        `${signe}${ap.mouvementType==='inventaire'?ap.ecart:ap.quantite}${ap.motif?' · '+ap.motif:''}`, null];
    }
    case 'commission_generee':
      return ['Commission générée', `Période ${ap.periode||''} · CA ${fmt(ap.baseCa||0)} · ${ap.taux||0}%`, ap.montant];
    case 'commission_versee':
      return ['Commission versée', `${fmt(ap.montant||0)} marqués versés`, ap.montant];
    case 'export_donnees_client':
      return ['Export des données client', `Demandé par ${ap.demandePar||''}`, null];
    case 'suppression_client':
      return ['Client supprimé (anonymisé)', `Ancien nom : ${av.nom||''}`, null];
    case 'creation_compte':
      return [`Compte créé : ${ap.nom||''}`, `${ap.login||''} · ${ap.role||''}`, null];
    case 'desactivation_compte':
      return [`Compte désactivé : ${ap.nom||''}`, ap.login||'', null];
    case 'reactivation_compte':
      return [`Compte réactivé : ${ap.nom||''}`, ap.login||'', null];
    case 'modification_pin':
      return [`Code PIN modifié : ${ap.nom||''}`, ap.login||'', null];
    default:
      return [row.action, '', null];
  }
}
function formatAuditEntry(row){
  const meta = AUDIT_META[row.action] || {ic:'📝', label:row.action, tag:'grey'};
  const [what, sub, amt] = auditWhatSub(row);
  return {
    // horodatage vient du serveur en UTC (instant réel) — sans timeZone
    // explicite, toLocaleTimeString rend l'heure du fuseau du navigateur/OS
    // qui affiche l'écran, pas celle du salon (Dakar).
    t: new Date(row.horodatage).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Africa/Dakar'}),
    action: row.action, ic: meta.ic, label: meta.label, tag: meta.tag,
    what, sub, amt, who: row.auteur?.nom || 'Système',
  };
}
async function fetchAuditLog(){
  document.getElementById('journal-tbody').innerHTML = skeletonTableRows(5);
  try{
    const rows = await apiFetch('/admin/audit');
    AUDIT_LOG = rows.map(formatAuditEntry);
  }catch(err){
    AUDIT_LOG = [];
    toast(err.message||'Impossible de charger le journal');
  }
  renderJournal();
}
function renderJournal(){
  const actions=[...new Set(AUDIT_LOG.map(a=>a.action))];
  const filters=[['all','Tout'], ...actions.map(k=>[k, AUDIT_META[k]?.label||k])];
  document.getElementById('journal-filters').innerHTML = filters.map(([k,l])=>
    `<button class="cat-tab ${journalFilter===k?'active':''}" onclick="journalFilter='${k}';renderJournal()">${l}</button>`).join('');
  const rows = AUDIT_LOG.filter(a=>journalFilter==='all'||a.action===journalFilter);
  document.getElementById('journal-tbody').innerHTML = rows.length ? rows.map(a=>`
    <tr><td><b>${a.t}</b></td>
      <td><span class="tag ${a.tag}">${a.ic} ${a.label}</span></td>
      <td><b>${a.what}</b><div style="font-size:12px;color:var(--muted)">${a.sub}</div></td>
      <td>${a.who}</td><td><b>${a.amt!=null?fmt(a.amt):'—'}</b></td></tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--muted)">Aucune écriture dans cette catégorie.</td></tr>`;
}
function exportJournal(){
  const csv = ['Heure;Type;Action;Détail;Auteur;Montant',
    ...AUDIT_LOG.map(a=>[a.t,a.label,a.what,a.sub,a.who,a.amt??''].join(';'))].join('\n');
  try{
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download='journal-salon.csv'; a.click();
    URL.revokeObjectURL(url); toast('Journal exporté en CSV');
  }catch(e){ toast('Export indisponible dans cet aperçu'); }
}

/* ---------------- Pointage (CDC §4.6/§3.3) ---------------- */
// Panneau réel greffé en tête de l'écran Personnel — contenu différent selon
// le rôle : un coiffeur pointe pour lui-même, gérant/admin voient l'équipe.
// Le détail des commissions (filtrable par mois, taux modifiable) vit dans
// son propre menu — voir plus bas « Commissions (menu dédié) ».
async function renderRealStaffPanel(){
  const host = document.getElementById('real-staff-panel');
  if(!session) return;
  if(session.role==='coiffeur'){
    await renderMyPointagePanel(host);
  } else {
    await renderTeamPointagePanel(host);
  }
}
async function renderMyPointagePanel(host){
  host.innerHTML = `<div class="card" style="padding:20px">${skeletonCards(2)}</div>`;
  try{
    const thisMonth = new Date().toISOString().slice(0,7);
    const [summary, commission] = await Promise.all([
      apiFetch('/me/attendance'),
      apiFetch(`/me/commission?period=${thisMonth}`),
    ]);
    const today = summary.jours.find(j=>new Date(j.date).toISOString().slice(0,10)===new Date().toISOString().slice(0,10));
    const pauses = today?.pauses||[];
    const enPause = pauses.length>0 && !pauses[pauses.length-1].fin;
    const arrived = !!today?.heureArrivee;
    const left = !!today?.heureDepart;

    let statusTxt = 'Vous n\'avez pas encore pointé aujourd\'hui.';
    if(arrived && !left) statusTxt = `Arrivé à ${hm(today.heureArrivee)}${today.retardMin>0?` · ${today.retardMin} min de retard`:''}${enPause?' · en pause':''}`;
    if(left) statusTxt = `Journée terminée · ${hm(today.heureArrivee)} → ${hm(today.heureDepart)}`;

    host.innerHTML = `
      <div class="card" style="padding:20px">
        <div class="section-title" style="margin:0 0 14px">Mon pointage</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
          <button class="btn btn-gold" onclick="punchAttendance('arrivee')" ${arrived?'disabled':''}>Pointer l'arrivée</button>
          <button class="btn btn-ghost" onclick="punchAttendance('pause')" ${(!arrived||enPause||left)?'disabled':''}>Pause</button>
          <button class="btn btn-ghost" onclick="punchAttendance('reprise')" ${!enPause?'disabled':''}>Reprendre</button>
          <button class="btn btn-ghost" onclick="punchAttendance('depart')" ${(!arrived||left||enPause)?'disabled':''}>Pointer le départ</button>
        </div>
        <div style="font-size:13px;color:var(--muted)">${statusTxt}</div>
        <div style="display:flex;gap:28px;margin-top:18px;flex-wrap:wrap;align-items:flex-end">
          <div><div style="font-weight:800;font-size:20px">${summary.heuresTotal} h</div><div style="font-size:11.5px;color:var(--muted)">Heures ce mois</div></div>
          <div><div style="font-weight:800;font-size:20px">${summary.retardsTotal} min</div><div style="font-size:11.5px;color:var(--muted)">Retards cumulés</div></div>
          <div><div style="font-weight:800;font-size:20px">${fmt(commission.montant)}</div><div style="font-size:11.5px;color:var(--muted)">Ma commission (${commission.taux}%) · ${commission.statut==='versee'?'versée':'due'}</div></div>
          <button class="btn btn-ghost" style="padding:8px 14px" onclick="go('commissions')">Historique et détail →</button>
        </div>
      </div>`;
  }catch(err){
    host.innerHTML = `<div class="card" style="padding:20px;color:var(--muted)">${err.message||'Pointage indisponible'}</div>`;
  }
}
async function punchAttendance(action){
  try{
    await apiFetch('/me/attendance', {method:'POST', body:JSON.stringify({action})});
    toast({arrivee:'Arrivée pointée', pause:'Pause démarrée', reprise:'Service repris', depart:'Départ pointé'}[action]);
    renderRealStaffPanel();
  }catch(err){
    toast(err.message||'Pointage refusé');
  }
}
async function renderTeamPointagePanel(host){
  host.innerHTML = `<div class="card" style="padding:20px">${skeletonCards(2)}</div>`;
  try{
    const team = await apiFetch('/staff/attendance');
    const teamRows = team.map(({user,attendance:a})=>{
      const pauses = a?.pauses||[];
      const enPause = pauses.length>0 && !pauses[pauses.length-1].fin;
      return `<tr>
        <td><b>${user.nom}</b></td>
        <td>${a?.heureArrivee?hm(a.heureArrivee):'—'}</td>
        <td>${a?.retardMin?`<span class="tag gold">${a.retardMin} min</span>`:'—'}</td>
        <td>${enPause?'<span class="tag blue">En pause</span>':a?.heureDepart?hm(a.heureDepart):'—'}</td>
      </tr>`;
    }).join('') || `<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--muted)">Aucun coiffeur actif.</td></tr>`;

    host.innerHTML = `
      <div class="card" style="padding:20px;margin-bottom:16px">
        <div class="section-title" style="margin:0 0 14px">Pointage de l'équipe — aujourd'hui</div>
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Coiffeur</th><th>Arrivée</th><th>Retard</th><th>Départ</th></tr></thead>
          <tbody>${teamRows}</tbody></table></div>
      </div>
      <div class="card" style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-weight:700">Commissions de l'équipe</div>
          <div style="font-size:12px;color:var(--muted)">Consultez, filtrez par mois et ajustez le taux de chaque coiffeur.</div>
        </div>
        <button class="btn btn-plum" style="padding:8px 14px" onclick="go('commissions')">Ouvrir les commissions →</button>
      </div>`;
  }catch(err){
    host.innerHTML = `<div class="card" style="padding:20px;color:var(--muted)">${err.message||'Données indisponibles'}</div>`;
  }
}

/* ---------------- Commissions (menu dédié, CDC §4.6/§3.3) ----------------
   Taux modifiable par coiffeur (s'applique en direct au calcul tant que la
   commission n'est pas versée — verrouillée ensuite), filtrable par mois.
   Un coiffeur ne voit que sa propre commission ; admin/gérant voient et
   modifient toute l'équipe (portée déjà imposée côté serveur, cf. /me vs
   /staff/commissions). */
let commissionPeriod = new Date().toISOString().slice(0,7);
function periodShift(period, delta){
  const [y,m] = period.split('-').map(Number);
  const d = new Date(Date.UTC(y, m-1+delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}
function commPeriodPicker(){
  const isCurrent = commissionPeriod === new Date().toISOString().slice(0,7);
  return `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <button class="btn btn-ghost" style="padding:6px 10px" onclick="changeCommPeriod(periodShift(commissionPeriod,-1))" aria-label="Mois précédent">‹</button>
      <input type="month" value="${commissionPeriod}" onchange="changeCommPeriod(this.value)" style="max-width:170px">
      <button class="btn btn-ghost" style="padding:6px 10px" onclick="changeCommPeriod(periodShift(commissionPeriod,1))" aria-label="Mois suivant">›</button>
      ${!isCurrent?`<button class="btn btn-ghost" style="padding:6px 10px" onclick="changeCommPeriod(new Date().toISOString().slice(0,7))">Ce mois-ci</button>`:''}
    </div>`;
}
function changeCommPeriod(period){
  if(!period) return;
  commissionPeriod = period;
  renderCommissionsView();
}
async function renderCommissionsView(){
  const host = document.getElementById('commissions-panel');
  if(!session || !host) return;
  if(session.role==='coiffeur'){
    await renderMyCommissionsView(host);
  } else {
    await renderTeamCommissionsView(host);
  }
}
async function renderMyCommissionsView(host){
  host.innerHTML = commPeriodPicker() + `<div class="card" style="padding:20px">${skeletonCards(2)}</div>`;
  try{
    const c = await apiFetch(`/me/commission?period=${commissionPeriod}`);
    host.innerHTML = commPeriodPicker() + `
      <div class="card" style="padding:20px">
        <div class="section-title" style="margin:0 0 14px">Ma commission — ${commissionPeriod}</div>
        <div style="display:flex;gap:28px;flex-wrap:wrap">
          <div><div style="font-weight:800;font-size:22px">${fmt(c.baseCa)}</div><div style="font-size:11.5px;color:var(--muted)">CA encaissé</div></div>
          <div><div style="font-weight:800;font-size:22px">${c.taux}%</div><div style="font-size:11.5px;color:var(--muted)">Taux appliqué</div></div>
          <div><div style="font-weight:800;font-size:22px;color:var(--gold)">${fmt(c.montant)}</div><div style="font-size:11.5px;color:var(--muted)">Commission</div></div>
        </div>
        <div style="margin-top:16px">
          <span class="tag ${c.statut==='versee'?'green':'gold'}">${c.statut==='versee'?`Versée le ${new Date(c.verseLe).toLocaleDateString('fr-FR')}`:'Due — pas encore versée'}</span>
        </div>
      </div>`;
  }catch(err){
    host.innerHTML = commPeriodPicker() + `<div class="card" style="padding:20px;color:var(--muted)">${err.message||'Commission indisponible'}</div>`;
  }
}
async function renderTeamCommissionsView(host){
  host.innerHTML = commPeriodPicker() + `<div class="card" style="padding:20px">${skeletonCards(2)}</div>`;
  try{
    const commissions = await apiFetch(`/staff/commissions?period=${commissionPeriod}`);
    const rows = commissions.map(c=>`
      <tr>
        <td><b>${c.nom}</b></td>
        <td>${fmt(c.baseCa)}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" min="0" max="100" value="${c.taux}" id="taux-${c.userId}"
              style="width:64px;padding:4px 6px" ${c.statut==='versee'?'disabled title="Verrouillé : commission déjà versée"':''}
              onkeydown="if(event.key==='Enter'){event.preventDefault();saveTaux('${c.userId}');}">
            <span style="color:var(--muted)">%</span>
            ${c.statut!=='versee'?`<button class="btn btn-ghost" style="padding:4px 8px" onclick="saveTaux('${c.userId}')">Enregistrer</button>`:''}
          </div>
        </td>
        <td><b>${fmt(c.montant)}</b></td>
        <td><span class="tag ${c.statut==='versee'?'green':'gold'}">${c.statut==='versee'?'Versée':'Due'}</span></td>
        <td style="text-align:right">${c.statut!=='versee'&&c.genere?`<button class="btn btn-ghost" style="padding:6px 10px" onclick="markCommissionPaid('${c.id}')">Marquer versée</button>`:''}</td>
      </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Aucun coiffeur actif.</td></tr>`;

    host.innerHTML = commPeriodPicker() + `
      <div class="card" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px">
          <div class="section-title" style="margin:0">Commissions — ${commissionPeriod}</div>
          <button class="btn btn-plum" style="padding:8px 14px" onclick="generateCommissions()">Générer pour la période</button>
        </div>
        <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Coiffeur</th><th>CA encaissé</th><th>Taux</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
          <tbody>${rows}</tbody></table></div>
        <div style="font-size:12px;color:var(--muted);margin-top:12px">Le taux modifié s'applique immédiatement au calcul affiché. « Générer » fige le montant de la période ; « Marquer versée » verrouille définitivement le taux et le montant de cette période.</div>
      </div>`;
  }catch(err){
    host.innerHTML = commPeriodPicker() + `<div class="card" style="padding:20px;color:var(--muted)">${err.message||'Données indisponibles'}</div>`;
  }
}
async function saveTaux(userId){
  const input = document.getElementById(`taux-${userId}`);
  if(!input) return;
  const taux = Math.min(100, Math.max(0, Math.round(+input.value||0)));
  try{
    await apiFetch(`/staff/profiles/${userId}`, {method:'PATCH', body:JSON.stringify({tauxCommission:taux})});
    toast('Taux de commission mis à jour');
    renderCommissionsView();
  }catch(err){
    toast(err.message||'Impossible de mettre à jour le taux');
  }
}
async function generateCommissions(){
  try{
    await apiFetch('/staff/commissions/generate', {method:'POST', body:JSON.stringify({periode:commissionPeriod})});
    toast('Commissions générées pour la période');
    renderCommissionsView();
  }catch(err){
    toast(err.message||'Impossible de générer les commissions');
  }
}
async function markCommissionPaid(id){
  try{
    await apiFetch(`/staff/commissions/${id}/mark-paid`, {method:'PATCH'});
    toast('Commission marquée versée');
    renderCommissionsView();
  }catch(err){
    toast(err.message||'Impossible de marquer la commission versée');
  }
}

/* ---------------- Supervision du personnel ---------------- */
let staffSort = 'goalPct';
function setStaffSort(k){
  staffSort = k;
  document.querySelectorAll('#staff-seg button').forEach((b,i)=>b.classList.toggle('on', ['goalPct','ca','punctPct'][i]===k));
  renderStaff();
}
function nextRdvFor(first){
  return RDV.find(r=>r.coiffeur?.nom===first && RDV_OPEN_STATUTS.includes(r.statut));
}
function rdvCountFor(first){
  return RDV.filter(r=>r.coiffeur?.nom===first && RDV_OPEN_STATUTS.includes(r.statut)).length;
}
function renderStaff(){
  const present = STAFF.filter(p=>p.status!=='off').length;
  const pause   = STAFF.filter(p=>p.status==='break').length;
  const absent  = STAFF.filter(p=>p.status==='off').length;
  const late    = STAFF.filter(p=>p.retardMinAujourdhui>0).length;
  const band = [
    ['👥','var(--green-soft)',present+'/'+STAFF.length,'En poste maintenant'],
    ['☕','var(--warn-soft)',pause,'En pause'],
    ['🚫','var(--danger-soft)',absent,'Non pointés'],
    ['⏰','var(--info-soft)',late,'Retards ce matin'],
  ];
  document.getElementById('sup-band').innerHTML = band.map(b=>`
    <div class="card"><div class="b-ico" style="background:${b[1]}">${b[0]}</div>
    <div><div class="b-v">${b[2]}</div><div class="b-l">${b[3]}</div></div></div>`).join('');

  const sorted = [...STAFF].sort((a,b)=>b[staffSort]-a[staffSort]);
  document.getElementById('staff-grid').innerHTML = sorted.length ? sorted.map(p=>{
    const st = ST_LABEL[p.status];
    const nx = nextRdvFor(p.first);
    const goalColor = p.goalPct>=90?'var(--green)':p.goalPct>=50?'var(--gold)':'var(--danger)';
    return `<div class="st-card card">
      <div class="st-head">
        <div class="st-av">${initials(p.name)}<i class="pres" style="background:${ST_COLOR[p.status]}"></i></div>
        <div class="st-id"><div class="n">${p.name}</div><div class="r">${p.role}</div></div>
        <span class="st-state ${st[0]}"><i></i>${st[1]}</span>
      </div>
      <div class="st-occ">
        <div class="l"><span>Objectif du mois</span><span>${p.goal?p.goalPct+'%':'Non défini'}</span></div>
        <div class="t"><i style="width:${p.goalPct}%;background:${goalColor}"></i></div>
      </div>
      <div class="st-facts">
        <div><div class="v">${p.tickets}</div><div class="l">tickets (mois)</div></div>
        <div><div class="v">${p.in||'—'}</div><div class="l">arrivée</div></div>
        <div><div class="v">${rdvCountFor(p.first)}</div><div class="l">RDV aujourd'hui</div></div>
      </div>
      <div class="st-next">${nx?`📌 Prochain : <b>${hm(nx.debut)} ${nx.client?.nom||'Client de passage'}</b> · ${nx.service.nom}`:'✅ Plus rien de programmé aujourd\'hui'}</div>
      <div class="st-acts">
        <button class="btn btn-plum" style="flex:1;justify-content:center" onclick="openStaff('${p.id}')">Ouvrir la fiche</button>
      </div>
    </div>`;}).join('') : '<div style="color:var(--muted);font-size:13px;padding:20px 0">Aucun coiffeur actif dans l\'équipe.</div>';

  document.getElementById('staff-tbody').innerHTML = STAFF.length ? STAFF.map(p=>{
    const panier = p.tickets?Math.round(p.ca/p.tickets):0;
    const dPct = p.ca?Math.round(p.disc/p.ca*100):0;
    return `<tr onclick="openStaff('${p.id}')" style="cursor:pointer">
      <td><div class="cell-user"><div class="av">${initials(p.name)}</div><div><div class="nm">${p.name}</div><div class="mt">${p.role}</div></div></div></td>
      <td><b>${p.hours} h</b></td>
      <td><span class="tag ${p.punctPct>=90?'green':p.punctPct>=75?'gold':'grey'}">${p.punctPct}%</span></td>
      <td><b>${p.tickets}</b></td>
      <td>${fmt(panier)}</td>
      <td><span style="${dPct>CONFIG.discountMax?'color:var(--danger);font-weight:800':''}">${fmt(p.disc)} · ${dPct}%</span></td>
      <td><span class="tag ${p.rating?'gold':'grey'}">${p.rating?'⭐ '+p.rating:'—'}</span></td>
      <td><b>${fmt(Math.round(p.ca*p.tauxCommission/100))}</b></td>
      <td style="text-align:right;color:var(--muted);font-weight:800">→</td>
    </tr>`;}).join('') : `<tr><td colspan="9" style="text-align:center;padding:36px;color:var(--muted)">Aucun coiffeur actif dans l'équipe.</td></tr>`;
}

/* ---------------- Fiche personnel (tiroir) ---------------- */
let drawerTab = 'activite';
function openStaff(id, tab){
  const p = STAFF.find(x=>x.id===id);
  if(!p) return;
  drawerTab = tab || 'activite';
  const st = ST_LABEL[p.status];
  document.getElementById('dr-head').innerHTML = `
    <div class="st-av" style="width:52px;height:52px;font-size:19px">${initials(p.name)}<i class="pres" style="background:${ST_COLOR[p.status]}"></i></div>
    <div style="flex:1;min-width:0">
      <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:600">${p.name}</div>
      <div style="font-size:12.5px;color:var(--gold);font-weight:700">${p.role}</div>
    </div>
    <span class="st-state ${st[0]}"><i></i>${st[1]}</span>
    <button class="x-btn" onclick="closeStaff()" aria-label="Fermer">✕</button>`;
  document.getElementById('dr-tabs').innerHTML = [['activite','Activité'],['perf','Performance'],['presence','Présence']]
    .map(([k,l])=>`<button class="dr-tab ${drawerTab===k?'on':''}" onclick="openStaff('${id}','${k}')">${l}</button>`).join('');

  const panier = p.tickets?Math.round(p.ca/p.tickets):0;
  const rdvs = RDV.filter(r=>r.coiffeur?.nom===p.first);
  const body = document.getElementById('dr-body');
  // Journal filtré par personne — nécessite le vrai journal d'audit déjà
  // chargé (réservé à admin/gérant) ; sinon état vide honnête plutôt qu'un
  // flux fabriqué.
  const entries = (typeof AUDIT_LOG!=='undefined' ? AUDIT_LOG : []).filter(a=>a.who===p.name).slice(0,6);

  if(drawerTab==='activite'){
    body.innerHTML = `
      <div class="dr-kpi">
        <div class="card"><div class="v">${rdvCountFor(p.first)}</div><div class="l">RDV aujourd'hui</div></div>
        <div class="card"><div class="v">${p.tickets}</div><div class="l">Tickets ce mois-ci</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Rendez-vous attribués</div>
      ${rdvs.length?rdvs.map(r=>{ const st=STATUS[r.statut]||STATUS.a_venir; return `
        <div class="agenda-row">
          <span class="agenda-time">${hm(r.debut)}</span>
          <div class="agenda-main"><div class="c">${r.client?.nom||'Client de passage'}</div><div class="s">${r.service.nom}</div></div>
          <span class="tag ${st[0]}">${st[1]}</span>
        </div>`;}).join(''):'<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun rendez-vous attribué. Répartissez-lui un client depuis l\'agenda.</div>'}
      <div class="section-title" style="font-size:15px;margin-top:22px">Dernières écritures du journal</div>
      ${entries.length?entries.map(a=>`
        <div class="feed-item"><span class="feed-time">${a.t}</span>
        <span class="feed-ico" style="background:var(--gold-soft)">${a.ic}</span>
        <div class="feed-txt"><b>${a.what}</b><span>${a.sub}</span></div></div>`).join('')
        : '<div style="color:var(--muted);font-size:13px">Aucune écriture récente (ou journal réservé à l\'administrateur).</div>'}`;
  }
  if(drawerTab==='perf'){
    const dPct = p.ca?Math.round(p.disc/p.ca*100):0;
    body.innerHTML = `
      <div class="dr-kpi">
        <div class="card"><div class="v">${fmt(p.ca)}</div><div class="l">Recettes du mois</div></div>
        <div class="card"><div class="v">${fmt(panier)}</div><div class="l">Panier moyen</div></div>
        <div class="card"><div class="v">${p.rating?'⭐ '+p.rating:'—'}</div><div class="l">Note moyenne</div></div>
        <div class="card"><div class="v">${fmt(Math.round(p.ca*p.tauxCommission/100))}</div><div class="l">Commission à ${p.tauxCommission}%</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Objectif mensuel</div>
      <div class="goal-row" style="border:none;padding-top:0">
        <div class="gnm"><div class="t"><i style="width:${p.goalPct}%"></i></div></div>
        <div class="gvl"><b>${p.goalPct}%</b><span>${fmt(p.ca)} / ${p.goal?fmt(p.goal):'non défini'}</span></div>
      </div>
      <div class="section-title" style="font-size:15px;margin-top:18px">Remises accordées</div>
      <div class="al ${dPct>CONFIG.discountMax?'crit':'info'}">
        <span class="ic">🏷️</span>
        <span class="txt"><span class="tt">${fmt(p.disc)} · ${dPct} % des recettes</span>
        <span class="ss">${dPct>CONFIG.discountMax
          ? `Au-dessus du seuil de ${CONFIG.discountMax} %. À revoir avec ${p.first}.`
          : `Sous le seuil de ${CONFIG.discountMax} %, comportement normal.`}</span></span>
      </div>`;
  }
  if(drawerTab==='presence'){
    body.innerHTML = `
      <div class="dr-kpi">
        <div class="card"><div class="v">${p.hours} h</div><div class="l">Heures travaillées (mois)</div></div>
        <div class="card"><div class="v">${p.punctPct}%</div><div class="l">Ponctualité</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Journée en cours</div>
      <div class="punch"><span>Ouverture du salon</span><b>${p.plan}</b></div>
      <div class="punch"><span>Arrivée pointée</span><b style="color:${p.retardMinAujourdhui>0?'var(--danger)':'var(--green)'}">${p.in||'Pas encore'}</b></div>
      <div class="punch"><span>Fin de service</span><b>${p.out||'En cours'}</b></div>
      <div class="punch"><span>Jours en retard ce mois</span><b>${p.late}</b></div>
      <div class="punch"><span>Jours travaillés ce mois</span><b>${p.joursTravailles}</b></div>
      <div style="font-size:12px;color:var(--muted);margin-top:16px">Le pointage se fait par la personne elle-même, depuis le panneau « Mon pointage » en haut de l'écran Personnel.</div>`;
  }
  document.getElementById('staff-drawer').classList.add('open');
  document.getElementById('scrim').classList.add('show');
}
function closeStaff(){
  document.getElementById('staff-drawer').classList.remove('open');
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('scrim').classList.remove('show');
}

/* ---------------- Paramètres ---------------- */
const SET_TABS = [
  ['salon','🏠 Salon'],['horaires','🕒 Horaires'],['fidelite','⭐ Fidélité'],['paiement','💳 Paiements'],
  ['team','👥 Équipe'],['stock','📦 Stock'],['acces','🔐 Comptes & accès'],['apparence','🎨 Apparence'],['raccourcis','⌨️ Raccourcis'],
];
let setTab = 'salon';
function openSettings(tab){
  setTab = tab || 'salon';
  renderSettings();
  document.getElementById('set-overlay').classList.add('show');
}
function setGo(t){ setTab=t; renderSettings(); }
function sw(id,on){ return `<button class="switch ${on?'on':''}" id="${id}" onclick="this.classList.toggle('on')" aria-label="Activer"><i></i></button>`; }
function row(t,s,ctrl){ return `<div class="set-row"><div class="txt"><div class="t">${t}</div><div class="s">${s}</div></div>${ctrl}</div>`; }
function renderSettings(){
  document.getElementById('set-nav').innerHTML = SET_TABS.filter(([k])=>canSet(k)).map(([k,l])=>
    `<button class="${setTab===k?'on':''}" onclick="setGo('${k}')">${l}</button>`).join('');

  const sec = (k,title,sub,html)=>`<div class="set-sec ${setTab===k?'on':''}" id="sec-${k}"><h4>${title}</h4><div class="sub">${sub}</div>${html}</div>`;
  const days = Object.entries(CONFIG.hours).map(([d,v])=>`
    <div class="hours-row">
      <span class="d">${d}</span>
      <input type="time" id="h-${d}-o" value="${v[0]}">
      <input type="time" id="h-${d}-c" value="${v[1]}">
      ${sw('h-'+d+'-on', v[2])}
    </div>`).join('');

  document.getElementById('set-body').innerHTML =
    sec('salon','Identité du salon','Ces informations apparaissent sur les tickets de caisse et dans l\'en-tête.',
      row('Nom du salon','Affiché dans le menu et sur chaque ticket.',`<input type="text" id="s-name" value="${CONFIG.name}">`)+
      row('Activité','Sous-titre affiché sous le nom.',`<input type="text" id="s-tag" value="${CONFIG.tagline}">`)+
      row('Téléphone','Numéro imprimé sur le ticket.',`<input type="text" id="s-phone" value="${CONFIG.phone}">`)+
      row('Adresse','Emplacement du salon.',`<input type="text" id="s-addr" value="${CONFIG.address}">`)+
      row('Fauteuils','Sert au calcul du taux d\'occupation.',`<input type="number" id="s-seats" value="${CONFIG.seats}" min="1">`)+
      row('Objectif de recettes par jour','Barre de progression du poste de commande.',`<input type="number" id="s-goald" value="${CONFIG.goalDay}" step="5000">`)+
      row('Objectif du mois','Référence pour les statistiques.',`<input type="number" id="s-goalm" value="${CONFIG.goalMonth}" step="50000">`))
    +
    sec('horaires','Horaires d\'ouverture','Le poste de commande affiche l\'heure de fermeture du jour et signale les jours fermés.',days)
    +
    sec('fidelite','Programme de fidélité','1 point est gagné pour 100 F dépensés · 100 points valent 1 000 F de réduction. Ajustez ici les paliers de carte.',
      TIERS.map((t,i)=>row(`${t.ico} Carte ${t.name}`, `Palier atteint à partir d'un certain nombre de points.`,
        `<div style="display:flex;gap:8px"><input type="number" id="t-min-${i}" value="${t.min}" step="50" style="width:96px" title="Points requis"><input type="number" id="t-disc-${i}" value="${t.disc}" min="0" max="50" style="width:80px" title="Remise %"></div>`)).join('')+
      `<div style="font-size:12px;color:var(--muted);margin-top:10px">Colonne de gauche : points requis. Colonne de droite : remise accordée en %.</div>`)
    +
    sec('paiement','Moyens de paiement','Seuls les moyens activés apparaissent à l\'écran d\'encaissement.',
      PAY_METHODS.map(m=>row(m.name, m.tag, sw('p-'+m.id, CONFIG.pay[m.id]))).join(''))
    +
    sec('team','Équipe et commissions','Règles appliquées au calcul de la paie et aux alertes de supervision.',
      row('Taux de commission par défaut','Utilisé à la création d\'un profil. Pour ajuster le taux de chaque coiffeur (et voir l\'effet en direct), ouvrez le menu <button onclick="closeModal(\'set-overlay\');go(\'commissions\')" style="color:var(--gold);font-weight:700;text-decoration:underline">Commissions</button>.',`<input type="number" id="s-comm" value="${CONFIG.commission}" min="0" max="60">`)+
      row('Seuil d\'alerte sur les remises','Au-delà de ce pourcentage des recettes, le coiffeur est signalé en rouge.',`<input type="number" id="s-dmax" value="${CONFIG.discountMax}" min="1" max="60">`)+
      row('Alerter sur les retards et absences','Signale les coiffeurs non pointés à l\'heure prévue.',sw('s-late',CONFIG.lateAlert)))
    +
    sec('stock','Stock et réassort','Les seuils déclenchent les alertes de la cloche et du poste de commande.',
      row('Seuil de stock bas','En dessous, le produit passe en « stock bas ».',`<input type="number" id="s-slow" value="${CONFIG.stockLow}" min="1">`)+
      row('Seuil critique','En dessous, le produit est à recommander d\'urgence.',`<input type="number" id="s-scrit" value="${CONFIG.stockCrit}" min="1">`)+
      row('Alertes de stock','Affiche les ruptures dans les notifications.',sw('s-salert',CONFIG.stockAlert)))
    +
    sec('acces','Comptes et accès','Chaque profil a son identifiant, son code et son périmètre.',
      accountsHTML())
    +
    sec('apparence','Apparence','Le thème s\'applique immédiatement pour que vous puissiez juger.',
      row('Thème','Sombre pour les salons ouverts tard.',
        `<div class="seg"><button class="${CONFIG.theme==='light'?'on':''}" onclick="setTheme('light')">Clair</button><button class="${CONFIG.theme==='dark'?'on':''}" onclick="setTheme('dark')">Sombre</button></div>`)+
      row('Densité d\'affichage','Compact affiche plus de lignes sur un petit écran.',
        `<div class="seg"><button class="${CONFIG.density==='normal'?'on':''}" onclick="setDensity('normal')">Confort</button><button class="${CONFIG.density==='compact'?'on':''}" onclick="setDensity('compact')">Compact</button></div>`))
    +
    sec('raccourcis','Raccourcis clavier','Pour aller vite pendant le coup de feu du samedi.',
      `<div class="kbd-list">
        ${[['Recherche globale','Ctrl K'],['Tableau de bord','Alt 1'],['Rendez-vous','Alt 2'],['Caisse','Alt 3'],
           ['Clients','Alt 4'],['Supervision','Alt 5'],['Personnel','Alt 6'],['Paramètres','Alt 0'],['Fermer une fenêtre','Échap']]
          .map(([l,k])=>`<div><span>${l}</span><kbd>${k}</kbd></div>`).join('')}
      </div>`);
}
function setTheme(t){ CONFIG.theme=t; document.documentElement.setAttribute('data-theme',t); renderSettings(); }
function setDensity(d){ CONFIG.density=d; document.documentElement.setAttribute('data-density',d); renderSettings(); }
function val(id,fb){ const el=document.getElementById(id); return el?el.value:fb; }
function on(id){ const el=document.getElementById(id); return el?el.classList.contains('on'):false; }
function saveSettings(){
  CONFIG.name = val('s-name',CONFIG.name).trim() || CONFIG.name;
  CONFIG.tagline = val('s-tag',CONFIG.tagline);
  CONFIG.phone = val('s-phone',CONFIG.phone);
  CONFIG.address = val('s-addr',CONFIG.address);
  CONFIG.seats = +val('s-seats',CONFIG.seats);
  CONFIG.goalDay = +val('s-goald',CONFIG.goalDay);
  CONFIG.goalMonth = +val('s-goalm',CONFIG.goalMonth);
  Object.keys(CONFIG.hours).forEach(d=>{
    CONFIG.hours[d] = [val('h-'+d+'-o',CONFIG.hours[d][0]), val('h-'+d+'-c',CONFIG.hours[d][1]), on('h-'+d+'-on')?1:0];
  });
  TIERS.forEach((t,i)=>{ t.min = +val('t-min-'+i,t.min); t.disc = +val('t-disc-'+i,t.disc); });
  PAY_METHODS.forEach(m=>{ const el=document.getElementById('p-'+m.id); if(el) CONFIG.pay[m.id]=el.classList.contains('on'); });
  CONFIG.commission = +val('s-comm',CONFIG.commission);
  CONFIG.discountMax = +val('s-dmax',CONFIG.discountMax);
  CONFIG.lateAlert = document.getElementById('s-late') ? on('s-late') : CONFIG.lateAlert;
  CONFIG.stockLow = +val('s-slow',CONFIG.stockLow);
  CONFIG.stockCrit = +val('s-scrit',CONFIG.stockCrit);
  CONFIG.stockAlert = document.getElementById('s-salert') ? on('s-salert') : CONFIG.stockAlert;
  ROLES.forEach(r=>PERMS.forEach(([k])=>{ const el=document.getElementById(`r-${r.id}-${k}`); if(el) r.p[k]=el.classList.contains('on')?1:0; }));

  applyIdentity();
  renderStock(); renderClients(); fillClientSelect(); renderTicket(); renderStaff(); refreshAlerts();
  if(document.getElementById('view-admin').classList.contains('active')) renderAdmin();
  logAct('admin','Jésuel A.','Paramètres enregistrés','Identité, seuils et permissions');
  closeModal('set-overlay');
  toast('Paramètres enregistrés');
}
// Affiche le vrai logo (CONFIG.logoUrl, depuis GET /salons/me) dans un
// « mark » carré s'il est défini, sinon replie sur l'initiale du nom.
function setMark(el, letter){
  if(!el) return;
  const logo = CONFIG.logoUrl || 'logo/Logo MF.jpeg';
  if(logo) el.innerHTML = `<img src="${logo}" alt="${CONFIG.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  else el.textContent = letter;
}
function applyIdentity(){
  document.querySelector('.brand .name').textContent = CONFIG.name;
  document.querySelector('.brand .sub').textContent = CONFIG.tagline;
  document.title = CONFIG.name + ' — Gestion';
  const letter = CONFIG.name.trim()[0].toUpperCase();
  setMark(document.querySelector('.brand .mark'), letter);
  setMark(document.getElementById('auth-mark'), letter);
  setMark(document.getElementById('auth-mark-m'), letter);
  document.getElementById('auth-name-m').textContent = CONFIG.name;
}

/* ---------------- Recherche globale ---------------- */
let cmdkItems = [], cmdkSel = 0;
const PAGES = [
  ['dash','Tableau de bord','📊'],['rdv','Rendez-vous','📅'],['caisse','Caisse','🧾'],
  ['prestations','Prestations','✂️'],['clients','Clients & fidélité','🪪'],['team','Personnel & pointage','👥'],
  ['stats','Statistiques','📈'],['stock','Stock produits','📦'],['admin','Supervision 360°','🛡️'],['journal','Journal d\'activité','📋'],
];
function openCmdk(){
  document.getElementById('cmdk-wrap').classList.add('show');
  const i = document.getElementById('cmdk-input'); i.value=''; i.focus();
  buildCmdk('');
}
function closeCmdk(){ document.getElementById('cmdk-wrap').classList.remove('show'); }
function buildCmdk(q){
  q = q.toLowerCase().trim();
  const match = s => !q || s.toLowerCase().includes(q);
  const items = [];
  PAGES.filter(p=>match(p[1])).forEach(p=>items.push({g:'Naviguer',i:p[2],n:p[1],s:'Ouvrir la page',r:'Page',a:()=>go(p[0])}));
  if(q){
    CLIENTS.forEach((c,idx)=>{ if(match(c.name)||match(c.card)||match(c.phone))
      items.push({g:'Clients',i:'🪪',n:c.name,s:`${c.card} · ${c.pts} pts`,r:'Charger en caisse',a:()=>loadClientToCaisse(idx)}); });
    SERVICES.forEach(s=>{ if(match(s.name))
      items.push({g:'Prestations',i:s.e,n:s.name,s:`${fmt(s.price)} · ${s.dur} min`,r:'Ajouter au ticket',a:()=>{addToCart(s);go('caisse');}}); });
    STAFF.forEach(p=>{ if(match(p.name)||match(p.role))
      items.push({g:'Personnel',i:'👤',n:p.name,s:`${p.role} · ${ST_LABEL[p.status][1]}`,r:'Ouvrir la fiche',a:()=>{go('team');openStaff(p.id);}}); });
    RDV.forEach(r=>{ const nom=r.client?.nom||'Client de passage'; if(match(nom)||match(r.service.nom))
      items.push({g:'Rendez-vous',i:'📅',n:`${hm(r.debut)} · ${nom}`,s:`${r.service.nom} · ${r.coiffeur.nom}`,r:'Voir l\'agenda',a:()=>go('rdv')}); });
  }
  items.push({g:'Actions',i:'⚙️',n:'Ouvrir les paramètres',s:'Identité, horaires, permissions',r:'Alt 0',a:()=>openSettings()});
  items.push({g:'Actions',i:'➕',n:'Nouveau rendez-vous',s:'Ajouter au planning',r:'',a:()=>{go('rdv');openRdvModal();}});
  cmdkItems = items.slice(0,24); cmdkSel = 0;
  const res = document.getElementById('cmdk-res');
  if(!cmdkItems.length){
    res.innerHTML = `<div style="padding:34px;text-align:center;color:var(--muted)">
      <div style="font-size:24px">🔍</div><div style="font-weight:700;color:var(--ink);margin-top:8px">Aucun résultat</div>
      <div style="font-size:12.5px;margin-top:4px">Essayez un nom de client, une prestation ou un coiffeur.</div></div>`;
    return;
  }
  let html = '', grp = '';
  cmdkItems.forEach((it,i)=>{
    if(it.g!==grp){ grp=it.g; html += `<div class="cmdk-grp">${grp}</div>`; }
    html += `<button class="cmdk-it ${i===cmdkSel?'sel':''}" data-i="${i}" onclick="runCmdk(${i})" onmousemove="hoverCmdk(${i})">
      <span class="ci">${it.i}</span><span><span class="cn">${it.n}</span><span class="cs">${it.s}</span></span>
      <span class="cr">${it.r}</span></button>`;
  });
  res.innerHTML = html;
}
function hoverCmdk(i){ if(i===cmdkSel) return; cmdkSel=i; paintCmdk(); }
function paintCmdk(){
  document.querySelectorAll('.cmdk-it').forEach(el=>el.classList.toggle('sel', +el.dataset.i===cmdkSel));
  const el = document.querySelector('.cmdk-it.sel'); if(el) el.scrollIntoView({block:'nearest'});
}
function runCmdk(i){ const it = cmdkItems[i]; if(!it) return; closeCmdk(); it.a(); }

/* ---------------- Alertes (cloche) ---------------- */
function refreshAlerts(){
  const a = buildAlerts();
  const n = document.getElementById('notif-count');
  n.textContent = a.length; n.style.display = a.length?'grid':'none';
  renderAlerts('notif-body', a, true);
}
function toggleNotif(e){
  e.stopPropagation();
  const p = document.getElementById('notif-panel');
  p.classList.contains('show') ? closeNotif() : (refreshAlerts(), p.classList.add('show'));
}
function closeNotif(){ document.getElementById('notif-panel').classList.remove('show'); }
document.addEventListener('click', e=>{
  const p = document.getElementById('notif-panel');
  if(p.classList.contains('show') && !p.contains(e.target) && !document.getElementById('notif-btn').contains(e.target)) closeNotif();
});

/* ---------------- Menu mobile ---------------- */
function openMenu(){
  document.querySelector('.sidebar').classList.add('open');
  document.getElementById('scrim').classList.add('show');
}

/* ---------------- Extensions du comportement existant ---------------- */
const _go = go;
go = function(v){
  _go(v);
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('scrim').classList.remove('show');
  document.querySelectorAll('#mnav button').forEach(b=>b.classList.toggle('on', b.dataset.view===v));
  if(v==='admin') renderAdmin();
  if(v==='team'){ fetchStaffTeam().then(renderStaff); renderRealStaffPanel(); }
  if(v==='commissions') renderCommissionsView();
  if(v==='journal') fetchAuditLog();
  if(v==='rdv') fetchAppointments().catch(err=>toast(err.message||'Impossible de charger l\'agenda'));
  if(v==='stock') fetchStock();
  if(v==='stats') renderStatsView();
  if(v==='dash'){ fetchTodayOverview(); fetchWeekSeries(); fetchDashTopServices(); }
};
document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.onclick=()=>go(n.dataset.view));
document.getElementById('nav-settings').onclick = ()=>openSettings();

const _renderPayMethods = renderPayMethods;
renderPayMethods = function(){
  _renderPayMethods.apply(this, arguments);
  document.querySelectorAll('.pm').forEach(el=>{
    const id = el.id.replace('pm-','');
    if(!CONFIG.pay[id]) el.remove();
  });
};

renderTeam = function(){ renderStaff(); };

Object.assign(TITLES, {
  admin:   ['Supervision 360°','Tout ce qui se passe dans le salon, en direct'],
  team:    ['Personnel & pointage','Présence, charge et performance de l\'équipe'],
  journal: ['Journal d\'activité','Historique tracé de toutes les opérations'],
});

/* ---------------- Clavier ---------------- */
const ALT_MAP = {'1':'dash','2':'rdv','3':'caisse','4':'clients','5':'admin','6':'team','7':'stats','8':'stock'};
document.addEventListener('keydown', e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); openCmdk(); return; }
  if(e.altKey && ALT_MAP[e.key]){ e.preventDefault(); go(ALT_MAP[e.key]); return; }
  if(e.altKey && e.key==='0'){ e.preventDefault(); openSettings(); return; }
  const cmdkOpen = document.getElementById('cmdk-wrap').classList.contains('show');
  if(cmdkOpen){
    if(e.key==='ArrowDown'){ e.preventDefault(); cmdkSel=Math.min(cmdkSel+1,cmdkItems.length-1); paintCmdk(); }
    if(e.key==='ArrowUp'){ e.preventDefault(); cmdkSel=Math.max(cmdkSel-1,0); paintCmdk(); }
    if(e.key==='Enter'){ e.preventDefault(); runCmdk(cmdkSel); }
  }
  if(e.key==='Escape'){
    closeCmdk(); closeNotif(); closeStaff(); closeStatDrawer();
    document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  }
});
document.getElementById('cmdk-input').addEventListener('input', e=>buildCmdk(e.target.value));

/* ---------------- Démarrage V2 ----------------
   Initialisation avant connexion : purement visuelle (identité de marque,
   état de la barre mobile). Les données réelles (personnel, journal,
   supervision, alertes) ne sont chargées qu'après authentification — voir
   tryLogin() — pour ne pas déclencher d'appels API avant qu'un jeton existe. */
function initV2(){
  applyIdentity();
  document.querySelectorAll('#mnav button').forEach(b=>b.classList.toggle('on', b.dataset.view==='dash'));
}


/* ==================================================================
   V3 — SESSIONS, RÔLES ET PERMISSIONS
   ================================================================== */
ACT_TYPE.auth = ['🔐','Session','#F1ECF0'];

// Backend réel (API NestJS) — voir api/README ou api/.env pour le lancer.
// En local (localhost/127.0.0.1) on cible le serveur de dev ; en production
// (déployé sur Vercel) on cible l'API hébergée sur Railway.
const API_BASE = ['localhost','127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000/api/v1'
  : 'https://maison-fade-production.up.railway.app/api/v1';
let authToken = null;
// Le token d'accès expire après 15 min (JWT_ACCESS_TTL) — refreshToken/
// deviceId permettent de le renouveler en silence via POST /auth/refresh
// (endpoint déjà prêt côté serveur, jamais appelé jusqu'ici) plutôt que de
// laisser un « Unauthorized » brut planter l'écran dès qu'on revient sur
// l'agenda ou qu'on encaisse plus de 15 min après la connexion.
let refreshToken = null;
let deviceId = null;
let refreshInFlight = null;

async function refreshSession(){
  if(!refreshInFlight){
    refreshInFlight = (async()=>{
      if(!refreshToken || !deviceId) throw new Error('Pas de session à renouveler');
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({deviceId, refreshToken}),
      });
      const body = await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(body.message || 'Session expirée');
      authToken = body.accessToken;
      refreshToken = body.refreshToken;
    })().finally(()=>{ refreshInFlight = null; });
  }
  return refreshInFlight;
}

// Helper réseau commun — pose l'Authorization, uniformise les erreurs
// {code,message} du backend (err.status = code HTTP). Un 401 déclenche un
// essai de renouvellement silencieux (une seule fois par appel) avant
// d'abandonner et de renvoyer l'utilisateur à l'écran de connexion.
async function apiFetch(path, opts={}, _retried=false){
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? {Authorization: `Bearer ${authToken}`} : {}),
      ...(opts.headers||{}),
    },
  });
  const body = await res.json().catch(()=>({}));
  if(!res.ok){
    if(res.status===401 && !_retried && authToken){
      try{
        await refreshSession();
        return apiFetch(path, opts, true);
      }catch(refreshErr){
        if(session) lockSession();
        authError('Votre session a expiré. Reconnectez-vous.');
        const err = new Error('Session expirée — reconnectez-vous.');
        err.status = 401; err.body = body;
        throw err;
      }
    }
    const err = new Error(body.message || `Erreur ${res.status}`);
    err.status = res.status; err.body = body;
    throw err;
  }
  return body;
}

// Reçu PDF réel (CDC §7/§10) — apiFetch() suppose du JSON, on refait un
// fetch dédié pour récupérer un blob binaire et l'ouvrir dans un nouvel
// onglet (le visualiseur PDF du navigateur permet ensuite Ctrl+P).
async function printReceipt(ticketId){
  try{
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/receipt.pdf`, {
      headers: authToken ? {Authorization:`Bearer ${authToken}`} : {},
    });
    if(!res.ok) throw new Error('Reçu indisponible');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }catch(err){
    toast(err.message||'Impossible d\'ouvrir le reçu');
  }
}

// Identité visuelle par catégorie (page Prestations) — cycle de teintes
// assignées par ordre d'affichage, cf. le même cycle défini en CSS (:root).
const CAT_PALETTE = [
  ['--gold-soft','--gold-text'], ['--rose-soft','--rose-text'], ['--sage-soft','--sage-text'],
  ['--info-soft','--info'], ['--violet-soft','--violet-text'], ['--terra-soft','--terra-text'],
  ['--teal-soft','--teal-text'], ['--indigo-soft','--indigo-text'],
];
// Catalogue réel (services + catégories) — remplace les tableaux figés.
async function fetchCatalogue(){
  const [cats, services] = await Promise.all([
    apiFetch('/service-categories'),
    apiFetch('/services'),
  ]);
  CATS = cats.map((c,i)=>({id:c.id, name:c.nom, emoji:c.emoji||'💈', accent:CAT_PALETTE[i%CAT_PALETTE.length]}));
  const emojiByCat = Object.fromEntries(CATS.map(c=>[c.id, c.emoji]));
  SERVICES = services.map(s=>({
    id:s.id, cat:s.categorieId, name:s.nom, desc:s.description||'',
    price:s.prix, dur:s.dureeMin, e: emojiByCat[s.categorieId]||'💈',
  }));
  if(CATS.length){ currentCat=CATS[0].id; caisseCat=CATS[0].id; }
}
// Clients réels, adaptés à la forme déjà attendue ailleurs dans l'appli
// (name/phone/card/pts/spent/visits/last) + un vrai `id` pour l'API.
async function fetchClients(){
  const list = await apiFetch('/clients');
  CLIENTS = list.map(c=>({
    id:c.id, name:c.nom, phone:c.telephone,
    card:c.loyaltyAccount?.numeroCarte||'—',
    visits:0, last: c.loyaltyAccount?.derniereVisite ? 'Récemment' : '—',
    pts:c.loyaltyAccount?.points||0, spent:c.loyaltyAccount?.totalDepense||0,
  }));
}
async function fetchCoiffeurs(){
  COIFFEURS = await apiFetch('/users?role=coiffeur');
}
// Identité réelle du salon (CDC §4.10) — remplace les valeurs de démo de
// CONFIG par le nom, la tagline, les coordonnées et le logo réels.
async function fetchSalonIdentity(){
  try{
    const salon = await apiFetch('/salons/me');
    CONFIG.name = salon.nom || CONFIG.name;
    CONFIG.tagline = salon.tagline || CONFIG.tagline;
    CONFIG.phone = salon.tel || CONFIG.phone;
    CONFIG.address = salon.adresse || CONFIG.address;
    CONFIG.logoUrl = salon.logoUrl || null;
  }catch(err){ /* CONFIG garde ses valeurs par défaut si l'appel échoue */ }
}

function hm(iso){ return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
function dateStr(offsetDays){
  const d=new Date(); d.setDate(d.getDate()+offsetDays);
  return d.toISOString().slice(0,10);
}
// Onglet actif de l'agenda (aujourd'hui / demain / semaine) — utilisé à la
// fois pour filtrer la liste et comme date par défaut d'un nouveau rendez-vous.
let rdvFilter='today';
function rdvDate(){ return rdvFilter==='tomorrow' ? dateStr(1) : dateStr(0); }
async function setRdvFilter(mode, btn){
  rdvFilter=mode;
  document.querySelectorAll('#rdv-tabs .cat-tab').forEach(b=>b.classList.toggle('active', b===btn));
  await fetchAppointments();
}
async function fetchAppointments(){
  document.getElementById('rdv-tbody').innerHTML = skeletonTableRows(6);
  const date = rdvFilter==='week' ? undefined : rdvDate();
  RDV = await apiFetch('/appointments'+(date?`?date=${date}`:''));
  renderRdv();
}

const ACCOUNTS = [
  {id:'bamba',  login:'bamba',  name:'Bamba',   ini:'B',  role:'admin',    active:true, last:'—'},
  {id:'fallou', login:'fallou', name:'Fallou',  ini:'F',  role:'gerant',   active:true, last:'—'},
  {id:'palaye', login:'palaye', name:'Pa Laye', ini:'PL', role:'coiffeur', active:true, last:'—'},
  {id:'jaz',    login:'jaz',    name:'Jaz',     ini:'J',  role:'coiffeur', active:true, last:'—'},
];
let session = null;
function roleOf(){ return ROLES.find(r=>r.id===(session?session.role:'')) || ROLES[1]; }
function roleName(id){ const r=ROLES.find(x=>x.id===id); return r?r.name:id; }
function can(k){ return session ? !!roleOf().p[k] : false; }

const VIEW_PERM = {rdv:'rdv', caisse:'caisse', clients:'clients', team:'perso', commissions:'perso',
                   stats:'stats', stock:'stock', admin:'admin360', journal:'journal'};
const SET_PERM  = {salon:'params', horaires:'params', fidelite:'params', paiement:'params',
                   team:'params', stock:'params', acces:'users', apparence:null, raccourcis:null};
function canSet(k){ const p = SET_PERM[k]; return !p || can(p); }

/* ---------------- Écran de connexion ---------------- */
function renderAccPick(){
  const cur = document.getElementById('a-login').value.trim().toLowerCase();
  document.getElementById('acc-pick').innerHTML = ACCOUNTS.map(a=>`
    <button class="${cur===a.login?'on':''}" onclick="pickAccount('${a.login}')">
      <span class="acc-av ${a.role}">${a.ini}</span>
      <span><span class="n">${a.name}</span><span class="s">${roleName(a.role)} · ${a.login}</span></span>
    </button>`).join('');
}
function pickAccount(login){
  document.getElementById('a-login').value = login;
  document.getElementById('a-pin').value = '';
  renderAccPick();
  document.getElementById('a-pin').focus();
}
function authError(msg){
  const e = document.getElementById('a-err');
  e.textContent = msg; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
}
function lockApp(prefill){
  document.body.classList.add('locked');
  document.getElementById('auth').classList.add('show');
  document.getElementById('a-login').value = prefill || '';
  document.getElementById('a-pin').value = '';
  document.getElementById('a-err').classList.remove('on');
  renderAccPick();
  setTimeout(()=>{ const el = document.getElementById(prefill?'a-pin':'a-login'); if(el) el.focus(); }, 120);
}
async function tryLogin(){
  const l = document.getElementById('a-login').value.trim().toLowerCase();
  const p = document.getElementById('a-pin').value.trim();
  if(!l){ authError('Saisissez un identifiant ou choisissez un profil.'); return; }
  if(!p){ authError('Saisissez votre code d\'accès ou votre mot de passe.'); return; }
  // ACCOUNTS n'est qu'un sélecteur rapide local (4 comptes de démo) — un
  // compte créé depuis Paramètres > Comptes et accès n'y figure pas encore.
  // Le serveur reste seul juge de la validité des identifiants (CDC §7) :
  // on ne bloque plus la tentative ici, juste l'état « désactivé » connu localement.
  let a = ACCOUNTS.find(x=>x.login===l);
  if(a && !a.active){ authError('Ce compte est désactivé. Demandez à l\'administrateur de le réactiver.'); return; }

  const btn = document.getElementById('a-submit');
  if(btn){ btn.disabled = true; }
  try{
    // Un compte flambant neuf (créé dans Paramètres > Comptes et accès) n'a
    // encore aucun appareil approuvé : son tout premier accès se fait par mot
    // de passe (cf. AuthService.login) — le code d'accès habituel (4-6
    // chiffres) reste envoyé comme PIN, tout le reste comme mot de passe.
    const isPin = /^\d{4,6}$/.test(p);
    deviceId = `seed-device-${l}`;
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({login: l, [isPin?'pin':'password']: p, deviceId}),
    });
    const body = await res.json();
    if(!res.ok){ authError(body.message || 'Connexion refusée.'); return; }

    authToken = body.accessToken;
    refreshToken = body.refreshToken;
    const meRes = await fetch(`${API_BASE}/me`, {
      headers: {Authorization: `Bearer ${authToken}`},
    });
    const me = await meRes.json();
    if(!meRes.ok){ authError('Connecté, mais impossible de charger le profil.'); return; }

    if(!a){
      // Compte créé après le chargement de la page — absent du sélecteur
      // rapide local, on construit sa fiche à partir du profil serveur.
      a = {id:me.id, login:me.login, name:me.nom, ini:initials(me.nom), role:me.role, active:true, last:'—'};
      ACCOUNTS.push(a);
    }
    a.id = me.id; // aligne l'id de session sur le vrai id serveur (utilisé par la gestion des comptes)
    a.name = me.nom || a.name;
    a.role = me.role || a.role;
    session = a;
    a.last = "Aujourd'hui · " + nowHM();

    await Promise.all([fetchCatalogue(), fetchClients(), fetchCoiffeurs(), fetchAppointments(), fetchStock(), fetchSalonIdentity()]);
    // Le premier rendu (avant connexion) s'est fait avec des tableaux vides —
    // on rafraîchit les écrans caisse/prestations/clients avec les vraies données.
    fillCoiffeurSelect();
    renderQuick(); renderServices(); fillClientSelect(); renderClients(); renderTicket();
    applyIdentity();
    refreshAlerts();

    document.body.classList.remove('locked');
    document.getElementById('auth').classList.remove('show');
    applySession();
    // Le personnel, le tableau de bord et la supervision se chargent au
    // moment d'y naviguer (voir le wrapper go() plus bas) — pas ici, pour ne
    // pas cumuler une trentaine d'appels réseau simultanés à la connexion.
    go(can('admin360') ? 'admin' : 'dash');
    logAct('auth', a.name, 'Connexion', roleOf().name);
    toast(`Bonjour ${a.name.split(' ')[0]} · profil ${roleOf().name}`);
  }catch(err){
    // Le message affiché citait toujours "http://localhost:3000", même en
    // production où API_BASE pointe vers Railway (CDC — jamais mentir sur
    // l'environnement réel à l'utilisateur). On distingue maintenant une
    // vraie panne réseau (fetch n'a pas pu joindre l'API du tout) d'une
    // erreur survenue après une connexion déjà réussie (ex. chargement des
    // données du salon) : cette dernière renvoyait le même message trompeur
    // alors que le compte, lui, était bien authentifié.
    if(!navigator.onLine){
      authError('Pas de connexion internet. Vérifiez votre réseau puis réessayez.');
    } else if(err instanceof TypeError){
      authError('Serveur injoignable pour le moment. Réessayez dans un instant.');
    } else {
      authError(err.message || 'Une erreur est survenue après la connexion. Réessayez.');
    }
  }finally{
    if(btn){ btn.disabled = false; }
  }
}
function logout(){
  if(session) logAct('auth', session.name, 'Déconnexion', roleOf().name);
  // Invalide le refresh token côté serveur (device.refreshTokenHash = null)
  // avant de l'effacer localement — sinon un jeton copié avant la
  // déconnexion resterait valable pour renouveler une session.
  if(authToken) apiFetch('/auth/logout', {method:'POST'}).catch(()=>{});
  cart = []; currentClient = null; currentTicketId = null;
  document.getElementById('discount').value = 0;
  fillClientSelect(); renderLoyaltyChip(); renderTicket();
  closeStaff(); closeNotif(); closeCmdk();
  document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  session = null; authToken = null; refreshToken = null;
  lockApp();
}
function lockSession(){
  if(!session) return;
  const login = session.login;
  logAct('auth', session.name, 'Session verrouillée', roleOf().name);
  closeStaff(); closeNotif(); closeCmdk();
  document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  session = null;
  lockApp(login);
}
document.getElementById('a-pin').addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });
document.getElementById('a-login').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('a-pin').focus(); });
document.getElementById('a-login').addEventListener('input', renderAccPick);

/* ---------------- Application de la session ---------------- */
function applySession(){
  if(!session) return;
  const r = roleOf();
  document.getElementById('u-avatar').textContent = session.ini;
  document.getElementById('u-name').textContent = session.name;
  document.getElementById('u-role').textContent = r.name;
  const pill = document.getElementById('role-pill');
  pill.className = 'role-pill ' + session.role;
  pill.innerHTML = (session.role==='admin'?'🛡️':'🧾') + ' <span class="rp-label">' + r.name + '</span>';

  document.querySelectorAll('.nav-item[data-view]').forEach(n=>{
    const p = VIEW_PERM[n.dataset.view];
    n.style.display = (!p || can(p)) ? '' : 'none';
  });
  let vis = 0;
  document.querySelectorAll('#mnav button').forEach(b=>{
    const v = b.dataset.view; const p = v ? VIEW_PERM[v] : null;
    const ok = !p || can(p);
    b.style.display = ok ? '' : 'none';
    if(ok) vis++;
  });
  document.getElementById('mnav').style.gridTemplateColumns = `repeat(${vis},1fr)`;
  renderTicket();
}

/* ---------------- Garde-fous ---------------- */
const _goPerm = go;
go = function(v){
  const p = VIEW_PERM[v];
  if(p && !can(p)){ toast('Cet écran est réservé à l\'administrateur'); return; }
  _goPerm(v);
};

const _openSettingsPerm = openSettings;
openSettings = function(tab){
  const t = (tab && canSet(tab)) ? tab : SET_TABS.map(x=>x[0]).find(canSet);
  _openSettingsPerm(t);
};

const _renderSettingsPerm = renderSettings;
renderSettings = function(){
  _renderSettingsPerm.apply(this, arguments);
  if(!can('params')){
    document.getElementById('set-body').insertAdjacentHTML('afterbegin', `
      <div class="al info" style="margin-bottom:18px">
        <span class="ic">🔐</span>
        <span class="txt"><span class="tt">Réglages du salon verrouillés</span>
        <span class="ss">Tarifs, fidélité, horaires, seuils et comptes sont pilotés par l'administrateur. Vous pouvez régler votre affichage.</span></span>
      </div>`);
  }
};

const _saveSettingsPerm = saveSettings;
saveSettings = function(){
  const md = document.getElementById('s-maxdisc');
  if(md) ROLES.find(r=>r.id==='gerant').maxDisc = Math.min(100, Math.max(0, +md.value));
  ACCOUNTS.forEach(a=>{
    const el = document.getElementById('acc-'+a.id);
    if(el) a.active = el.classList.contains('on');
  });
  _saveSettingsPerm.apply(this, arguments);
  applySession();
};

/* plafond de remise selon le profil */
let discWarn = 0;
const _renderTicketPerm = renderTicket;
renderTicket = function(){
  const inp = document.getElementById('discount');
  if(inp){
    if(!can('remise')){ inp.value = 0; inp.disabled = true; }
    else{
      inp.disabled = false;
      const cap = roleOf().maxDisc;
      if(+inp.value > cap){
        inp.value = cap;
        if(Date.now()-discWarn > 2500){
          discWarn = Date.now();
          toast(`Profil ${roleOf().name} : remise plafonnée à ${cap} %`);
        }
      }
    }
  }
  return _renderTicketPerm.apply(this, arguments);
};

/* ---------------- Comptes et accès (paramètres) ---------------- */
// Comptes réels (GET /users/all) + appareils en attente d'approbation (GET
// /devices) — null tant que non chargés (accountsHTML() déclenche le
// chargement au premier rendu de l'onglet et affiche un squelette entre-temps).
let accessAccounts = null;
let accessDevices = null;
async function loadAccessData(){
  try{
    const [accounts, devices] = await Promise.all([apiFetch('/users/all'), apiFetch('/devices')]);
    accessAccounts = accounts;
    accessDevices = devices.filter(d=>!d.approuve);
  }catch(err){
    accessAccounts = []; accessDevices = [];
    toast(err.message||'Impossible de charger les comptes');
  }
  if(setTab==='acces') renderSettings();
}
function refreshAccessData(){ accessAccounts=null; accessDevices=null; loadAccessData(); }
async function createAccountPrompt(){
  const r = await openFormModal({
    title:'Ajouter un compte', confirmLabel:'Créer le compte',
    message:'La personne devra se connecter une première fois avec ce mot de passe, puis vous approuverez son appareil ci-dessous pour qu\'elle puisse ensuite utiliser un code d\'accès.',
    fields:[
      {id:'nom', label:'Nom complet'},
      {id:'login', label:'Identifiant de connexion'},
      {id:'role', label:'Rôle', type:'select', value:'coiffeur', options:[
        {value:'coiffeur', label:'Coiffeur'}, {value:'gerant', label:'Gérant'}, {value:'admin', label:'Administrateur'},
      ]},
      {id:'password', label:'Mot de passe temporaire (8 caractères min.)', type:'password'},
    ],
  });
  if(!r) return;
  const nom=r.nom.trim(), login=r.login.trim();
  if(!nom || !login){ toast('Nom et identifiant requis'); return; }
  if(!r.password || r.password.length<8){ toast('Mot de passe : 8 caractères minimum'); return; }
  try{
    await apiFetch('/users', {method:'POST', body:JSON.stringify({nom, login, role:r.role, password:r.password})});
    toast(`Compte créé pour ${nom}`);
    refreshAccessData();
  }catch(err){
    toast(err.message||'Impossible de créer le compte');
  }
}
async function archiveAccount(id, nom){
  const r = await openFormModal({
    title:'Désactiver ce compte ?', danger:true, confirmLabel:'Désactiver',
    message:`${nom} ne pourra plus se connecter tant que le compte n'est pas réactivé.`,
    fields:[],
  });
  if(!r) return;
  try{
    await apiFetch(`/users/${id}/archive`, {method:'PATCH'});
    toast('Compte désactivé');
    refreshAccessData();
  }catch(err){
    toast(err.message||'Impossible de désactiver ce compte');
  }
}
async function restoreAccount(id){
  try{
    await apiFetch(`/users/${id}/restore`, {method:'PATCH'});
    toast('Compte réactivé');
    refreshAccessData();
  }catch(err){
    toast(err.message||'Impossible de réactiver ce compte');
  }
}
async function resetPinPrompt(id, nom){
  const r = await openFormModal({
    title:'Modifier le code PIN', confirmLabel:'Enregistrer',
    message:`Nouveau code d'accès pour ${nom} (4 à 6 chiffres) — pris en compte dès sa prochaine connexion.`,
    fields:[{id:'pin', label:'Nouveau code PIN', type:'password', placeholder:'4 à 6 chiffres'}],
  });
  if(!r) return;
  const pin = r.pin.trim();
  if(!/^\d{4,6}$/.test(pin)){ toast('Le code PIN doit contenir 4 à 6 chiffres'); return; }
  try{
    await apiFetch(`/users/${id}/pin`, {method:'PATCH', body:JSON.stringify({pin})});
    toast('Code PIN mis à jour');
  }catch(err){
    toast(err.message||'Impossible de modifier le code PIN');
  }
}
async function approveDevice(id){
  try{
    await apiFetch(`/devices/${id}/approve`, {method:'PATCH'});
    toast('Appareil approuvé');
    refreshAccessData();
  }catch(err){
    toast(err.message||'Impossible d\'approuver cet appareil');
  }
}
function accountsHTML(){
  if(accessAccounts===null){
    loadAccessData();
    return skeletonCards(3);
  }
  const accountsList = accessAccounts.map(a=>{
    const isSelf = session && session.id===a.id;
    const statusTag = !a.actif ? '<span class="tag" style="margin-left:6px;background:var(--line-2);color:var(--muted)">Désactivé</span>' : '';
    const lastSeen = a.dernierAcces ? new Date(a.dernierAcces).toLocaleDateString('fr-FR') : 'Jamais connecté';
    const safeNom = a.nom.replace(/'/g,"\\'");
    // Le PIN se change indépendamment du statut actif/désactivé du compte —
    // seule action encore utile quand le compte n'est pas soi-même.
    const pinBtn = a.actif ? `<button class="btn btn-ghost" style="padding:8px 14px;font-size:12.5px" onclick="resetPinPrompt('${a.id}','${safeNom}')">Modifier le PIN</button>` : '';
    let action;
    if(isSelf) action = '<span class="tag green">Vous</span>';
    else if(a.actif) action = `<button class="btn btn-ghost" style="padding:8px 14px;font-size:12.5px" onclick="archiveAccount('${a.id}','${safeNom}')">Désactiver</button>`;
    else action = `<button class="btn btn-ghost" style="padding:8px 14px;font-size:12.5px" onclick="restoreAccount('${a.id}')">Réactiver</button>`;
    return `<div class="acc">
        <span class="acc-av ${a.role}">${initials(a.nom)}</span>
        <div class="acc-id">
          <div class="n">${a.nom}${isSelf?' <span class="tag green" style="margin-left:6px">vous</span>':''}${statusTag}</div>
          <div class="s">${roleName(a.role)} · identifiant <b>${a.login}</b></div>
        </div>
        <div class="acc-meta">Dernière connexion<br><b>${lastSeen}</b></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">${pinBtn}${action}</div>
      </div>`;
  }).join('');
  const devicesBlock = accessDevices.length ? `
    <div class="section-title" style="font-size:15px;margin-top:24px">Appareils en attente d'approbation</div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:10px">Un compte tout juste créé doit se connecter une première fois avec son mot de passe ; approuvez ensuite son appareil pour qu'il puisse utiliser son code d'accès au quotidien.</div>
    ${accessDevices.map(d=>`
      <div class="acc">
        <span class="acc-av coiffeur">📱</span>
        <div class="acc-id"><div class="n">${d.user.nom}</div><div class="s">${d.libelle||'Appareil non nommé'} · identifiant ${d.user.login}</div></div>
        <button class="btn btn-gold" style="padding:8px 14px;font-size:12.5px" onclick="approveDevice('${d.id}')">Approuver</button>
      </div>`).join('')}` : '';
  return `
    <div>${accountsList}</div>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:4px" onclick="createAccountPrompt()">
      ＋ Ajouter un compte
    </button>
    ${devicesBlock}
    <div class="section-title" style="font-size:15px;margin-top:24px">Ce que chaque profil peut faire</div>
    <div style="overflow-x:auto"><table class="tbl">
      <thead><tr><th>Permission</th>${ROLES.map(r=>`<th style="text-align:center">${r.name}</th>`).join('')}</tr></thead>
      <tbody>${PERMS.map(([k,l])=>`<tr><td><b>${l}</b></td>${ROLES.map(r=>
        `<td style="text-align:center">${r.id==='admin'
          ? '<span class="tag green">Toujours</span>'
          : `<div style="display:inline-block">${sw('r-'+r.id+'-'+k, r.p[k])}</div>`}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>
    <div class="set-row" style="margin-top:16px">
      <div class="txt"><div class="t">Remise maximale accordée par le gérant</div>
      <div class="s">Au-delà, la caisse ramène automatiquement la remise à ce plafond.</div></div>
      <input type="number" id="s-maxdisc" value="${ROLES.find(r=>r.id==='gerant').maxDisc}" min="0" max="100">
    </div>
    <div style="font-size:12px;color:var(--muted);margin-top:12px;line-height:1.55">
      Les droits de l'administrateur ne peuvent pas être retirés depuis cet écran : c'est le seul profil capable de rendre la main.
    </div>`;
}

/* ---------------- Démarrage ---------------- */
function initAuth(){
  applyIdentity();
  lockApp();
}

/* =================== CUSTOM SAAS SELECT ENGINE =================== */
function enhanceSelect(sel){
  if(!sel || sel.dataset.customEnhanced) return;
  sel.dataset.customEnhanced = 'true';
  sel.classList.add('c-select-native');

  const wrap = document.createElement('div');
  wrap.className = 'c-select';
  wrap.dataset.for = sel.id || '';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'c-select-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');

  const valSpan = document.createElement('span');
  valSpan.className = 'c-select-val';

  const arrow = document.createElement('span');
  arrow.className = 'c-select-arrow';
  arrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg>`;

  btn.appendChild(valSpan);
  btn.appendChild(arrow);
  wrap.appendChild(btn);

  const menu = document.createElement('div');
  menu.className = 'c-select-menu';
  menu.setAttribute('role', 'listbox');
  wrap.appendChild(menu);

  if(sel.parentNode) sel.parentNode.insertBefore(wrap, sel.nextSibling);

  function sync(){
    const opts = Array.from(sel.options);
    menu.innerHTML = '';
    const selIdx = sel.selectedIndex >= 0 ? sel.selectedIndex : 0;
    const curOpt = opts[selIdx];
    valSpan.innerHTML = curOpt ? curOpt.text : '';

    opts.forEach((opt, idx) => {
      const item = document.createElement('div');
      item.className = 'c-select-opt' + (idx === selIdx ? ' selected' : '') + (opt.value === 'new' ? ' c-select-opt-action' : '');
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;
      item.dataset.index = idx;
      item.innerHTML = opt.text;

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        sel.selectedIndex = idx;
        sel.value = opt.value;
        sync();
        closeAllCustomSelects();
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        if(typeof sel.onchange === 'function') sel.onchange();
      });

      menu.appendChild(item);
    });
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = wrap.classList.contains('open');
    closeAllCustomSelects();
    if(!isOpen){
      wrap.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });

  const observer = new MutationObserver(() => sync());
  observer.observe(sel, { childList: true, subtree: true, attributes: true });

  sel.addEventListener('change', () => sync());
  sel._customSync = sync;

  sync();
}

function closeAllCustomSelects(){
  document.querySelectorAll('.c-select.open').forEach(w => {
    w.classList.remove('open');
    const b = w.querySelector('.c-select-btn');
    if(b) b.setAttribute('aria-expanded', 'false');
  });
}

document.addEventListener('click', (e) => {
  if(!e.target.closest('.c-select')) closeAllCustomSelects();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeAllCustomSelects();
});

function initCustomSelects(){
  document.querySelectorAll('select').forEach(enhanceSelect);
}

/* =================== INIT =================== */
renderServices();
renderQuick();
fillClientSelect();
fillCoiffeurSelect();
renderTicket();
renderRdv();
renderClients();
renderTeam();
renderStock();
renderPaySplit();
clock(); setInterval(clock,1000*30);
initV2();
initAuth();
initCustomSelects();

