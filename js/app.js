/* =================== DATA =================== */
const fmt = n => n.toLocaleString('fr-FR').replace(/\u202f|,/g,' ') + ' F';

const CATS = [
  {id:'homme', name:'Coupe Homme', emoji:'💈'},
  {id:'barbe', name:'Barbe & Rasage', emoji:'🪒'},
  {id:'femme', name:'Coupe Femme', emoji:'💇🏾‍♀️'},
  {id:'tresses', name:'Tresses & Tissage', emoji:'👑'},
  {id:'color', name:'Coloration', emoji:'🎨'},
  {id:'soins', name:'Soins capillaires', emoji:'🌿'},
  {id:'enfant', name:'Enfants', emoji:'🧒'},
  {id:'extra', name:'Esthétique', emoji:'✨'},
];

const SERVICES = [
  // HOMME
  {cat:'homme', name:'Coupe homme classique', desc:'Coupe aux ciseaux ou tondeuse, shampoing inclus.', price:3000, dur:30, e:'💈'},
  {cat:'homme', name:'Dégradé (fade)', desc:'Dégradé progressif net, finitions au rasoir.', price:4000, dur:40, e:'✂️'},
  {cat:'homme', name:'Dégradé américain', desc:'Skin fade complet + design possible.', price:5000, dur:45, e:'🔥'},
  {cat:'homme', name:'Coupe + barbe', desc:'La formule complète coupe et taille de barbe.', price:6000, dur:50, e:'🧔🏾'},
  {cat:'homme', name:'Coupe aux ciseaux', desc:'Coupe entièrement travaillée aux ciseaux.', price:4500, dur:45, e:'✂️'},
  {cat:'homme', name:'Contours / finitions', desc:'Retouche des contours entre deux coupes.', price:1500, dur:15, e:'📐'},
  {cat:'homme', name:'Coupe + dessin (design)', desc:'Coupe avec motif personnalisé à la tondeuse.', price:6500, dur:55, e:'🎯'},
  // BARBE
  {cat:'barbe', name:'Taille de barbe', desc:'Mise en forme et entretien de la barbe.', price:2500, dur:25, e:'🧔🏾'},
  {cat:'barbe', name:'Rasage traditionnel', desc:'Rasage au coupe-chou, serviette chaude.', price:3500, dur:35, e:'🪒'},
  {cat:'barbe', name:'Contour de barbe', desc:'Lignes nettes au rasoir.', price:1500, dur:15, e:'📏'},
  {cat:'barbe', name:'Coloration barbe', desc:'Teinture pour uniformiser la barbe.', price:3000, dur:30, e:'🎨'},
  // FEMME
  {cat:'femme', name:'Coupe femme', desc:'Coupe adaptée à la nature du cheveu.', price:5000, dur:45, e:'💇🏾‍♀️'},
  {cat:'femme', name:'Brushing', desc:'Séchage et mise en forme au brush.', price:4000, dur:40, e:'💨'},
  {cat:'femme', name:'Coupe + brushing', desc:'Coupe complète et brushing finition.', price:8000, dur:70, e:'✨'},
  {cat:'femme', name:'Wrap / lissage', desc:'Lissage soigné longue tenue.', price:6000, dur:50, e:'➰'},
  // TRESSES
  {cat:'tresses', name:'Tresses collées (cornrows)', desc:'Nattes collées classiques ou stylées.', price:7000, dur:120, e:'👑'},
  {cat:'tresses', name:'Box braids', desc:'Tresses individuelles avec mèches.', price:15000, dur:240, e:'👸🏾'},
  {cat:'tresses', name:'Twists / vanilles', desc:'Vanilles ou twists sur cheveux naturels.', price:12000, dur:180, e:'🌀'},
  {cat:'tresses', name:'Tissage (weave)', desc:'Pose de tissage, cousu ou à clip.', price:20000, dur:150, e:'💫'},
  {cat:'tresses', name:'Pose de perruque', desc:'Installation et coiffage de perruque.', price:10000, dur:90, e:'👩🏾'},
  {cat:'tresses', name:'Crochet braids', desc:'Technique au crochet, gain de temps.', price:13000, dur:150, e:'🪝'},
  {cat:'tresses', name:'Entretien locks', desc:'Resserrage et soin des dreadlocks.', price:8000, dur:90, e:'🌾'},
  // COLORATION
  {cat:'color', name:'Coloration racines', desc:'Retouche des racines uniquement.', price:6000, dur:60, e:'🎨'},
  {cat:'color', name:'Coloration complète', desc:'Couleur uniforme sur toute la chevelure.', price:12000, dur:90, e:'🖌️'},
  {cat:'color', name:'Mèches / balayage', desc:'Éclaircissement partiel effet soleil.', price:15000, dur:120, e:'☀️'},
  {cat:'color', name:'Décoloration', desc:'Décoloration avant coloration fantaisie.', price:14000, dur:120, e:'⚡'},
  {cat:'color', name:'Défrisage', desc:'Défrisage professionnel longue tenue.', price:7000, dur:75, e:'➖'},
  // SOINS
  {cat:'soins', name:'Soin capillaire', desc:'Masque nourrissant selon le cheveu.', price:4000, dur:30, e:'🌿'},
  {cat:'soins', name:'Traitement kératine', desc:'Lissage et réparation en profondeur.', price:18000, dur:120, e:'💧'},
  {cat:'soins', name:'Soin du cuir chevelu', desc:'Gommage et massage du cuir chevelu.', price:5000, dur:35, e:'🧖🏾'},
  {cat:'soins', name:'Shampoing traitant', desc:'Shampoing ciblé + rinçage soin.', price:2500, dur:20, e:'🫧'},
  // ENFANT
  {cat:'enfant', name:'Coupe enfant', desc:'Coupe douce pour les moins de 12 ans.', price:2000, dur:25, e:'🧒'},
  {cat:'enfant', name:'Tresses enfant', desc:'Nattes simples adaptées aux enfants.', price:4000, dur:60, e:'🎀'},
  // EXTRA
  {cat:'extra', name:'Pose de faux cils', desc:'Extension de cils à la bande.', price:5000, dur:40, e:'👁️'},
  {cat:'extra', name:'Maquillage', desc:'Maquillage jour ou soirée.', price:8000, dur:45, e:'💄'},
  {cat:'extra', name:'Épilation sourcils', desc:'Restructuration au fil ou à la cire.', price:2000, dur:15, e:'✨'},
  {cat:'extra', name:'Massage crânien', desc:'Détente et relaxation express.', price:3000, dur:20, e:'🙌🏾'},
];

let RDV = [
  {time:'09:00', name:'Ousmane Fall', serv:'Dégradé + barbe', coiffeur:'Modou', status:'done'},
  {time:'09:45', name:'Aminata Sow', serv:'Box braids', coiffeur:'Fatou', status:'progress'},
  {time:'11:00', name:'Ibrahima Diop', serv:'Coupe homme', coiffeur:'Cheikh', status:'wait'},
  {time:'13:30', name:'Ndeye Gueye', serv:'Coloration complète', coiffeur:'Awa', status:'wait'},
  {time:'15:00', name:'Modou Kane', serv:'Rasage traditionnel', coiffeur:'Modou', status:'wait'},
];
const STATUS = {done:['green','Terminé'], progress:['blue','En cours'], wait:['gold','À venir']};

const CLIENTS = [
  {name:'Ousmane Fall', phone:'77 512 04 18', card:'CDO-0142', visits:14, last:'Aujourd\'hui', pts:280, spent:84000},
  {name:'Aminata Sow', phone:'78 233 91 07', card:'CDO-0088', visits:9, last:'Aujourd\'hui', pts:190, spent:135000},
  {name:'Ndeye Gueye', phone:'76 890 44 21', card:'CDO-0037', visits:22, last:'Il y a 2 sem.', pts:440, spent:264000},
  {name:'Ibrahima Diop', phone:'70 145 77 63', card:'CDO-0211', visits:5, last:'Il y a 1 mois', pts:60, spent:21000},
  {name:'Fatou Ba', phone:'77 003 12 90', card:'CDO-0009', visits:31, last:'Il y a 3 j.', pts:620, spent:410000},
];

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

const STOCK = [
  {name:'Mèches Kanékalon', cat:'Tresses', price:1500, qty:48, },
  {name:'Coloration châtain', cat:'Coloration', price:3500, qty:6},
  {name:'Huile de ricin', cat:'Soins', price:2500, qty:23},
  {name:'Gel coiffant', cat:'Styling', price:2000, qty:3},
  {name:'Shampoing pro 1L', cat:'Soins', price:5000, qty:11},
  {name:'Lames de rasoir (x10)', cat:'Barbe', price:1000, qty:2},
];

const PAY_METHODS = [
  {id:'wave', name:'Wave', tag:'Mobile money', bg:'linear-gradient(135deg,#12C0FF,#0A9BE0)', logo:'Wave'},
  {id:'om', name:'Orange Money', tag:'Mobile money', bg:'#FF7900', logo:'OM'},
  {id:'free', name:'Free Money', tag:'Mobile money', bg:'#E2001A', logo:'Free'},
  {id:'cash', name:'Espèces', tag:'Comptant', bg:'linear-gradient(135deg,#2F9E6B,#1F7E52)', logo:'💵'},
  {id:'card', name:'Carte bancaire', tag:'TPE Visa / MC', bg:'linear-gradient(135deg,#442A46,#2E1A2F)', logo:'💳'},
];

/* =================== STATE =================== */
let cart = [];          // {name, price, qty, e}
let currentCat = 'homme';
let caisseCat = 'homme';
let dayCA = 0, dayClients = 0;
let payState = {method:null};
let currentClient = null;   // index dans CLIENTS ou null
let redeemActive = false;   // échange de points activé au paiement

/* =================== NAV =================== */
const TITLES = {
  dash:['Tableau de bord',"Vue d'ensemble du salon · aujourd'hui"],
  rdv:['Rendez-vous','Planning et réservations'],
  prestations:['Prestations',"Catalogue complet des services"],
  caisse:['Caisse','Encaissement et vente rapide'],
  clients:['Clients','Fichier et programme de fidélité'],
  team:['Équipe','Performance des coiffeurs'],
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
  SERVICES.filter(s=>s.cat===currentCat).forEach(s=>{
    const card=document.createElement('div');
    card.className='serv-card card';
    card.innerHTML=`
      <div class="serv-head"><span class="serv-emoji">${s.e}</span></div>
      <div class="serv-name">${s.name}</div>
      <div class="serv-desc">${s.desc}</div>
      <div class="serv-meta">
        <span class="serv-price">${fmt(s.price)}</span>
        <span class="serv-dur">⏱ ${s.dur} min</span>
      </div>
      <button class="add-btn">＋ Ajouter à la caisse</button>`;
    card.querySelector('.add-btn').onclick=(ev)=>{
      addToCart(s); ev.target.classList.add('added'); ev.target.innerHTML='✓ Ajouté';
      setTimeout(()=>{ev.target.classList.remove('added');ev.target.innerHTML='＋ Ajouter à la caisse';},1000);
    };
    g.appendChild(card);
  });
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
  else cart.push({name:s.name, price:s.price, qty:1, e:s.e});
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

  // avantage fidélité (niveau de carte)
  const cl = currentClient!=null ? CLIENTS[currentClient] : null;
  const tier = cl ? tierOf(cl.pts) : null;
  const loyPct = tier ? tier.disc : 0;
  const loyAmt = Math.round(sub*loyPct/100);
  const loyRow=document.getElementById('loyalty-row');
  if(cl && loyPct>0){
    loyRow.style.display='flex';
    document.getElementById('loyalty-lbl').textContent=`Avantage carte ${tier.name} (−${loyPct}%)`;
    document.getElementById('loyalty-amount').textContent='– '+fmt(loyAmt);
  } else loyRow.style.display='none';

  // remise manuelle
  const disc=Math.min(100,Math.max(0,+document.getElementById('discount').value||0));
  const discAmt=Math.round((sub-loyAmt)*disc/100);
  const total=sub-loyAmt-discAmt;

  document.getElementById('sub-total').textContent=fmt(sub);
  document.getElementById('disc-amount').textContent='– '+fmt(discAmt);
  document.getElementById('grand-total').textContent=fmt(total);
  document.getElementById('pay-btn').style.opacity = cart.length?1:.5;
  document.getElementById('pay-btn').style.pointerEvents = cart.length?'auto':'none';
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
function selectClient(idx){
  currentClient = idx==='' ? null : +idx;
  renderLoyaltyChip();
  renderTicket();
}
function fillClientSelect(){
  const sel=document.getElementById('assign-client');
  sel.innerHTML='<option value="">🪪 Client de passage</option>'+
    CLIENTS.map((c,i)=>`<option value="${i}">${tierOf(c.pts).ico} ${c.name} · ${c.pts} pts</option>`).join('');
  if(currentClient!=null) sel.value=currentClient;
}

/* =================== RENDER: OTHER VIEWS =================== */
function renderRdv(){
  const tb=document.getElementById('rdv-tbody');
  tb.innerHTML=RDV.map(r=>{
    const st=STATUS[r.status];
    return `<tr>
      <td><b>${r.time}</b></td>
      <td><div class="cell-user"><div class="av">${initials(r.name)}</div><div class="nm">${r.name}</div></div></td>
      <td>${r.serv}</td>
      <td>${r.coiffeur}</td>
      <td><span class="tag ${st[0]}">${st[1]}</span></td>
      <td style="text-align:right"><button class="btn btn-ghost" style="padding:7px 12px" onclick="checkoutRdv('${r.serv}','${r.name.replace(/'/g,"\\'")}')">Encaisser</button></td>
    </tr>`;
  }).join('');
  document.getElementById('kpi-rdv').textContent=RDV.length;
  // dashboard agenda
  const dots={done:'var(--green)',progress:'var(--wave-d)',wait:'var(--gold)'};
  document.getElementById('dash-agenda').innerHTML=RDV.map(r=>`
    <div class="agenda-row">
      <span class="agenda-time">${r.time}</span>
      <span class="agenda-dot" style="background:${dots[r.status]}"></span>
      <div class="agenda-main"><div class="c">${r.name}</div><div class="s">${r.serv} · ${r.coiffeur}</div></div>
      <span class="tag ${STATUS[r.status][0]}">${STATUS[r.status][1]}</span>
    </div>`).join('');
}
function checkoutRdv(serv, name){
  const s=SERVICES.find(x=>x.name===serv);
  if(s) addToCart(s);
  const idx=CLIENTS.findIndex(c=>c.name===name);
  if(idx>=0){ currentClient=idx; fillClientSelect(); renderLoyaltyChip(); renderTicket();
    toast(`Client fidèle reconnu : ${name}`); }
  go('caisse');
}
function initials(n){return n.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();}

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
      <td style="text-align:right"><button class="btn btn-ghost" style="padding:7px 12px" onclick="loadClientToCaisse(${i})">Encaisser</button></td>
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
  document.getElementById('stock-tbody').innerHTML=STOCK.map(s=>{
    let st = s.qty<=3 ? ['grey','Rupture proche'] : s.qty<=10 ? ['gold','Stock bas'] : ['green','En stock'];
    if(s.qty<=3) st=['blue','⚠ À recommander'];
    return `<tr>
      <td><b>${s.name}</b></td><td>${s.cat}</td><td>${fmt(s.price)}</td>
      <td><b>${s.qty}</b></td><td><span class="tag ${st[0]}">${st[1]}</span></td>
    </tr>`;
  }).join('');
}
function renderPaySplit(){
  const data=[['Wave',42,'var(--wave-d)'],['Orange Money',28,'var(--orange)'],['Espèces',18,'var(--green)'],['Free Money',8,'var(--free)'],['Carte',4,'var(--plum-600)']];
  document.getElementById('pay-split').innerHTML=data.map(d=>`
    <div style="margin:12px 0">
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:600;margin-bottom:5px"><span>${d[0]}</span><span>${d[1]}%</span></div>
      <div style="height:8px;background:var(--line-2);border-radius:6px;overflow:hidden"><div style="height:100%;width:${d[1]}%;background:${d[2]};border-radius:6px"></div></div>
    </div>`).join('');
}

/* =================== RDV MODAL =================== */
function openRdvModal(){
  const sel=document.getElementById('r-serv');
  sel.innerHTML=SERVICES.map(s=>`<option>${s.name}</option>`).join('');
  document.getElementById('rdv-overlay').classList.add('show');
}
function addRdv(){
  const name=document.getElementById('r-name').value.trim()||'Client';
  const time=document.getElementById('r-time').value;
  const serv=document.getElementById('r-serv').value;
  const coiffeur=document.getElementById('r-coiffeur').value;
  RDV.push({time,name,serv,coiffeur,status:'wait'});
  RDV.sort((a,b)=>a.time.localeCompare(b.time));
  renderRdv(); closeModal('rdv-overlay'); toast('Rendez-vous ajouté au planning');
  document.getElementById('r-name').value='';
}

/* =================== PAYMENT FLOW =================== */
function redeemInfo(){
  if(currentClient==null) return {pts:0,value:0,avail:0};
  const cl=CLIENTS[currentClient];
  const base=renderTicket();
  const availValue=Math.floor(cl.pts/PT_BLOCK)*PT_VALUE;
  const value=Math.min(availValue, base);
  const pts=Math.round(value/PT_VALUE*PT_BLOCK);
  return {pts, value, avail:cl.pts};
}
function payableTotal(){
  const base=renderTicket();
  return Math.max(0, base - (redeemActive?redeemInfo().value:0));
}
function toggleRedeem(){ redeemActive=!redeemActive; renderPayMethods(); }
function openPayment(){
  if(!cart.length) return;
  payState={method:null}; redeemActive=false;
  renderPayMethods();
  document.getElementById('pay-overlay').classList.add('show');
}
function renderPayMethods(){
  const total=payableTotal();
  const cl = currentClient!=null?CLIENTS[currentClient]:null;
  const canRedeem = cl && cl.pts>=PT_BLOCK;
  const ri = redeemInfo();
  document.getElementById('pay-title').textContent='Encaissement';
  document.getElementById('pay-content').innerHTML=`
    <div class="pay-total"><div class="l">Montant à encaisser${cl?' · '+cl.name:''}</div><div class="v">${fmt(total)}</div></div>
    ${canRedeem?`
      <div class="redeem-box ${redeemActive?'on':''}" onclick="toggleRedeem()">
        <div class="redeem-check">${redeemActive?'✓':''}</div>
        <div class="redeem-txt">
          <div class="rt-t">Échanger les points fidélité</div>
          <div class="rt-s">${ri.pts} pts = −${fmt(ri.value)} · solde actuel ${cl.pts} pts</div>
        </div>
      </div>`:''}
    <div style="font-size:12.5px;font-weight:700;color:var(--muted);margin:16px 0 10px">MOYEN DE PAIEMENT</div>
    <div class="pay-methods">
      ${PAY_METHODS.map(m=>`
        <button class="pm" onclick="selectMethod('${m.id}')" id="pm-${m.id}">
          <div class="pm-logo" style="background:${m.bg}">${m.logo}</div>
          <div class="pm-name">${m.name}</div>
          <div class="pm-tag">${m.tag}</div>
        </button>`).join('')}
    </div>
    <div id="pay-extra"></div>`;
}
function selectMethod(id){
  payState.method=id;
  document.querySelectorAll('.pm').forEach(p=>p.classList.remove('sel'));
  document.getElementById('pm-'+id).classList.add('sel');
  const m=PAY_METHODS.find(x=>x.id===id);
  const total=payableTotal();
  const ex=document.getElementById('pay-extra');
  if(id==='cash'){
    ex.innerHTML=`
      <div class="pay-field"><label>Montant reçu du client</label>
        <input type="number" id="cash-in" placeholder="${total}" oninput="cashChange(${total})"></div>
      <div class="hint" id="cash-change">Monnaie à rendre : 0 F</div>
      <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="confirmPayment()">Valider l'encaissement</button>`;
  } else if(id==='card'){
    ex.innerHTML=`
      <div class="ussd-box">💳 Insérez ou approchez la carte du <b>TPE</b>. Montant envoyé au terminal : <b>${fmt(total)}</b></div>
      <button class="btn btn-gold btn-block" onclick="processMobile('${id}')">Lancer le paiement TPE</button>`;
  } else {
    ex.innerHTML=`
      <div class="pay-field"><label>Numéro ${m.name} du client</label>
        <input id="mm-phone" placeholder="77 000 00 00" value=""></div>
      <div class="hint">Une demande de paiement sera envoyée sur le téléphone du client.</div>
      <button class="btn btn-gold btn-block" style="margin-top:16px" onclick="processMobile('${id}')">Envoyer la demande</button>`;
  }
}
function cashChange(total){
  const v=+document.getElementById('cash-in').value||0;
  const c=v-total;
  document.getElementById('cash-change').innerHTML = c>=0
    ? `Monnaie à rendre : <b style="color:var(--green)">${fmt(c)}</b>`
    : `<span style="color:#C0504D">Il manque ${fmt(-c)}</span>`;
}
function processMobile(id){
  const m=PAY_METHODS.find(x=>x.id===id);
  const total=payableTotal();
  const c=document.getElementById('pay-content');
  const isCard=id==='card';
  c.innerHTML=`
    <div class="processing">
      <div class="phone-anim"><div class="ring"></div><div class="spinner"></div></div>
      <div class="proc-title">${isCard?'Paiement TPE en cours…':'En attente de confirmation…'}</div>
      <div class="proc-sub">${isCard?'Transaction en cours sur le terminal.':'Le client valide le paiement <b>'+m.name+'</b> sur son téléphone.'}</div>
      ${isCard?'':`<div class="ussd-box">📲 Notification envoyée<br>Montant : <b>${fmt(total)}</b><br>Le client saisit son code secret <b>${m.name}</b> pour confirmer.</div>`}
    </div>`;
  setTimeout(confirmPayment, 2600);
}
function confirmPayment(){
  const ri = redeemInfo();
  const usedPts = redeemActive ? ri.pts : 0;
  const usedValue = redeemActive ? ri.value : 0;
  const total = payableTotal();
  const m=PAY_METHODS.find(x=>x.id===payState.method);

  dayCA+=total; dayClients+=1;
  document.getElementById('kpi-ca').textContent=fmt(dayCA);
  document.getElementById('kpi-clients').textContent=dayClients;
  const ticketNo='#00'+(248+dayClients);
  const now=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const lines=cart.map(i=>`<div class="rc-row"><span>${i.qty}× ${i.name}</span><span>${fmt(i.price*i.qty)}</span></div>`).join('');

  // --- Mise à jour fidélité ---
  let earned=0, cl=null, oldTier=null, newTier=null;
  if(currentClient!=null){
    cl=CLIENTS[currentClient];
    oldTier=tierOf(cl.pts);
    earned=Math.floor(total/PT_PER_F);
    cl.pts = cl.pts - usedPts + earned;
    cl.spent += total;
    cl.visits += 1;
    cl.last = "Aujourd'hui";
    newTier=tierOf(cl.pts);
    renderClients();
  }
  const upgraded = cl && newTier.id!==oldTier.id;

  const fidBlock = cl ? `
      ${usedPts?`<div class="rc-row" style="color:var(--green)"><span>Points échangés</span><span>− ${fmt(usedValue)} (${usedPts} pts)</span></div>`:''}
      <div class="rc-row" style="border:none;color:var(--muted)"><span>Carte ${cl.card}</span><span>solde ${cl.pts} pts</span></div>` : '';
  const earnNote = cl ? `<div class="earn-note">⭐ +${earned} points crédités à ${cl.name}${upgraded?` · niveau ${newTier.name} atteint ${newTier.ico}`:''}</div>` : '';

  document.getElementById('pay-title').textContent='Paiement réussi';
  document.getElementById('pay-content').innerHTML=`
    <div class="success">
      <div class="check"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></div>
      <div class="proc-title" style="font-size:19px">Encaissé avec succès</div>
      <div class="proc-sub">Réglé par <b>${m.name}</b> · ${now}</div>
      <div class="receipt">
        <div class="rc-head"><div class="t serif">La Coupe d'Or</div><div class="s">TICKET ${ticketNo}</div></div>
        ${lines}
        <div class="rc-row big"><span>Total payé</span><span>${fmt(total)}</span></div>
        <div class="rc-row" style="border:none;color:var(--muted)"><span>Moyen</span><span>${m.name}</span></div>
        ${fidBlock}
      </div>
      ${earnNote}
      <div style="display:flex;gap:10px;margin-top:12px">
        <button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="closePay()">🖨 Imprimer</button>
        <button class="btn btn-gold" style="flex:1;justify-content:center" onclick="closePay()">Nouveau ticket</button>
      </div>
    </div>`;
}
function closePay(){
  cart=[]; document.getElementById('discount').value=0;
  currentClient=null; redeemActive=false;
  fillClientSelect(); renderLoyaltyChip(); renderTicket();
  closeModal('pay-overlay');
  toast('Ticket clôturé · fidélité mise à jour');
}
function closeModal(id){document.getElementById(id).classList.remove('show');}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('show');}));

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
const CONFIG = {
  name:"La Coupe d'Or", tagline:"Salon · Barber",
  phone:"77 000 00 00", address:"Sacré-Cœur 3, Dakar",
  seats:6, goalDay:180000, goalMonth:4500000,
  hours:{lundi:['09:00','20:00',1],mardi:['09:00','20:00',1],mercredi:['09:00','20:00',1],
         jeudi:['09:00','20:00',1],vendredi:['09:00','21:00',1],samedi:['08:00','21:00',1],dimanche:['10:00','16:00',0]},
  stockLow:10, stockCrit:3, stockAlert:true,
  commission:15, discountMax:15, lateAlert:true,
  pay:{wave:true, om:true, free:true, cash:true, card:true},
  theme:'light', density:'normal'
};

const ROLES = [
  {id:'admin',  name:'Administrateur', maxDisc:100,
   p:{caisse:1,remise:1,rdv:1,clients:1,stock:1,perso:1,stats:1,admin360:1,journal:1,params:1,users:1}},
  {id:'gerant', name:'Gérant', maxDisc:30,
   p:{caisse:1,remise:1,rdv:1,clients:1,stock:1,perso:1,stats:1,admin360:0,journal:0,params:0,users:0}},
];
const PERMS = [
  ['caisse','Encaisser'],['remise','Accorder une remise'],['rdv','Gérer les rendez-vous'],
  ['clients','Gérer le fichier clients'],['stock','Gérer le stock'],
  ['perso','Gérer le personnel et les pointages'],['stats','Voir les statistiques'],
  ['admin360','Ouvrir la supervision 360°'],['journal','Consulter le journal'],
  ['params','Modifier les paramètres du salon'],['users','Gérer les comptes et les accès'],
];

/* ---------------- Personnel ---------------- */
const STAFF = [
  {id:1, name:'Modou Séne',   role:'Barber senior',        first:'Modou',
   status:'busy', in:'08:12', out:null, plan:'08:15', hours:168, late:1, absent:0,
   occ:86, tickets:9, ca:418000, goal:500000, rating:4.9, reviews:126, disc:9000, until:'11:20'},
  {id:2, name:'Fatou Diallo', role:'Spécialiste tresses',  first:'Fatou',
   status:'busy', in:'08:47', out:null, plan:'08:30', hours:152, late:4, absent:1,
   occ:94, tickets:6, ca:356000, goal:420000, rating:4.8, reviews:98, disc:4500, until:'13:00'},
  {id:3, name:'Awa Ndoye',    role:'Coloriste',            first:'Awa',
   status:'break', in:'09:05', out:null, plan:'09:00', hours:141, late:2, absent:0,
   occ:61, tickets:4, ca:289000, goal:380000, rating:4.7, reviews:74, disc:26000, until:'12:15'},
  {id:4, name:'Cheikh Mbaye', role:'Barber',               first:'Cheikh',
   status:'off',  in:null,   out:null, plan:'09:00', hours:96,  late:6, absent:3,
   occ:0,  tickets:0, ca:182000, goal:350000, rating:4.6, reviews:52, disc:3000, until:null},
];
const ST_LABEL = {busy:['s-busy','En prestation'], free:['s-free','Disponible'],
                  break:['s-break','En pause'],    off:['s-off','Pas encore pointé']};
const ST_COLOR = {busy:'var(--info)', free:'var(--green)', break:'var(--gold)', off:'#C9BCC8'};

/* ---------------- Journal d'activité ---------------- */
const ACT_TYPE = {
  sale:    ['💰','Encaissement',  'var(--green-soft)'],
  rdv:     ['📅','Rendez-vous',   'var(--info-soft)'],
  punch:   ['🕒','Pointage',      'var(--warn-soft)'],
  stock:   ['📦','Stock',         '#F1ECF0'],
  loyalty: ['⭐','Fidélité',      'var(--gold-soft)'],
  admin:   ['⚙️','Administration','#F1ECF0'],
};
let ACTIVITY = [
  {t:'08:12', type:'punch',  who:'Modou Séne',  what:'Arrivée pointée',           sub:'À l\'heure', amt:null},
  {t:'08:47', type:'punch',  who:'Fatou Diallo',what:'Arrivée pointée',           sub:'17 min de retard', amt:null},
  {t:'09:20', type:'sale',   who:'Modou Séne',  what:'Ticket #00241 encaissé',    sub:'Wave · Ousmane Fall', amt:6000},
  {t:'09:35', type:'loyalty',who:'Caisse',      what:'60 points crédités',        sub:'Carte CDO-0142', amt:null},
  {t:'10:02', type:'rdv',    who:'Accueil',     what:'Rendez-vous ajouté',        sub:'Ndeye Gueye · 13:30', amt:null},
  {t:'10:18', type:'sale',   who:'Awa Ndoye',   what:'Ticket #00243 encaissé',    sub:'Espèces · remise 25 %', amt:9000},
  {t:'10:41', type:'stock',  who:'Système',     what:'Seuil de stock atteint',    sub:'Lames de rasoir · 2 restantes', amt:null},
  {t:'11:05', type:'punch',  who:'Awa Ndoye',   what:'Pause démarrée',            sub:'Retour prévu 12:15', amt:null},
];
function nowHM(){ return new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}); }
function logAct(type, who, what, sub, amt){
  ACTIVITY.unshift({t:nowHM(), type, who, what, sub:sub||'', amt:amt||null});
  if(document.getElementById('view-journal').classList.contains('active')) renderJournal();
  if(document.getElementById('view-admin').classList.contains('active')) renderFeed();
}

/* ---------------- Séries 7 jours ---------------- */
const WEEK = [
  {d:'Lun', ca:96000,  tickets:11, clients:10},
  {d:'Mar', ca:132000, tickets:15, clients:14},
  {d:'Mer', ca:81000,  tickets:9,  clients:9},
  {d:'Jeu', ca:149000, tickets:17, clients:16},
  {d:'Ven', ca:188000, tickets:21, clients:19},
  {d:'Sam', ca:214000, tickets:26, clients:24},
  {d:'Dim', ca:64000,  tickets:7,  clients:7},
];
let adminSerie = 'ca';

/* ---------------- Alertes ---------------- */
function buildAlerts(){
  const a = [];
  STOCK.forEach(s=>{
    if(!CONFIG.stockAlert) return;
    if(s.qty<=CONFIG.stockCrit) a.push({sev:'crit',ic:'📦',t:`${s.name} : ${s.qty} en rayon`,
      s:'Commandez aujourd\'hui pour ne pas refuser de prestation.',v:'stock'});
    else if(s.qty<=CONFIG.stockLow) a.push({sev:'warn',ic:'📦',t:`${s.name} : stock bas`,
      s:`${s.qty} unités restantes, prévoyez le réassort.`,v:'stock'});
  });
  STAFF.forEach(p=>{
    if(p.status==='off' && CONFIG.lateAlert) a.push({sev:'crit',ic:'🚫',t:`${p.name} n'a pas pointé`,
      s:`Service prévu à ${p.plan}. Ses créneaux ne sont couverts par personne.`,v:'team'});
    const dPct = p.ca ? Math.round(p.disc/p.ca*100) : 0;
    if(dPct>CONFIG.discountMax) a.push({sev:'warn',ic:'🏷️',t:`Remises élevées chez ${p.first}`,
      s:`${dPct} % des recettes en remise, seuil fixé à ${CONFIG.discountMax} %.`,v:'team'});
    if(p.occ>=90) a.push({sev:'info',ic:'⏳',t:`${p.first} est saturé`,
      s:`${p.occ} % de charge : reportez les nouveaux rendez-vous sur un collègue.`,v:'team'});
  });
  const waiting = RDV.filter(r=>r.status==='wait').length;
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
  const goalPct = Math.min(100, dayCA/CONFIG.goalDay*100);
  const presence = STAFF.filter(p=>p.status!=='off').length/STAFF.length*100;
  const stockOk = STOCK.filter(s=>s.qty>CONFIG.stockCrit).length/STOCK.length*100;
  const rating = STAFF.reduce((a,p)=>a+p.rating,0)/STAFF.length/5*100;
  return Math.round(goalPct*.35 + presence*.25 + stockOk*.15 + rating*.25);
}
function renderAdmin(){
  const alerts = buildAlerts();
  const present = STAFF.filter(p=>p.status!=='off').length;
  const occ = Math.round(STAFF.reduce((a,p)=>a+p.occ,0)/STAFF.length);
  const score = healthScore();
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
          <span class="chip">💺 <b>${occ}%</b> de charge</span>
          <span class="chip">🔔 <b>${alerts.length}</b> alertes</span>
        </div>
      </div>
      <div class="cmd-goal">
        <div class="g-lbl"><span>Objectif du jour</span><span>${pct}%</span></div>
        <div class="g-val">${fmt(dayCA)} <span style="font-size:13px;color:#C4AEC5">/ ${fmt(CONFIG.goalDay)}</span></div>
        <div class="track"><i style="width:${pct}%"></i></div>
      </div>
    </div>`;

  const panier = dayClients ? Math.round(dayCA/dayClients) : 0;
  const discTot = STAFF.reduce((a,p)=>a+p.disc,0);
  const pts = CLIENTS.reduce((a,c)=>a+c.pts,0);
  const kpi = (ico,bg,col,val,lbl,delta,up)=>`
    <div class="kpi card">
      <div class="k-ico" style="background:${bg};color:${col}">${ico}</div>
      <div class="k-val">${val}</div><div class="k-lbl">${lbl}</div>
      <div class="k-delta ${up?'k-up':'k-dn'}">${delta}</div>
    </div>`;
  document.getElementById('admin-kpis').innerHTML =
    kpi('💰','var(--gold-soft)','#8a6a1f',fmt(dayCA),'Recettes encaissées',`▲ ${pct}% de l'objectif`,true)+
    kpi('🧾','var(--info-soft)','var(--info)',dayClients,'Tickets du jour',`▲ panier ${fmt(panier)}`,true)+
    kpi('🏷️','var(--danger-soft)','var(--danger)',fmt(discTot),'Remises accordées',
        `${dayCA?Math.round(discTot/(dayCA+discTot)*100):0}% du chiffre brut`,false)+
    kpi('⭐','var(--green-soft)','var(--green)',pts.toLocaleString('fr-FR'),'Points fidélité en circulation','▲ engagement client',true);

  renderAlerts('admin-alerts', alerts, false);
  renderFeed();

  document.getElementById('admin-ctrl').innerHTML = `
    <thead><tr><th>Coiffeur</th><th>Tickets</th><th>Recettes</th><th>Remises</th><th>Part</th></tr></thead>
    <tbody>${STAFF.map(p=>{
      const d = p.ca?Math.round(p.disc/p.ca*100):0;
      const bad = d>CONFIG.discountMax;
      return `<tr onclick="openStaff(${p.id})" style="cursor:pointer">
        <td><div class="cell-user"><div class="av">${initials(p.name)}</div><div><div class="nm">${p.first}</div><div class="mt">${p.role}</div></div></div></td>
        <td><b>${p.tickets}</b></td><td><b>${fmt(p.ca)}</b></td><td>${fmt(p.disc)}</td>
        <td><span class="tag ${bad?'':'green'}" style="${bad?'background:var(--danger-soft);color:var(--danger)':''}">${d}%${bad?' ⚠':''}</span></td>
      </tr>`;}).join('')}</tbody>`;

  document.getElementById('admin-goals').innerHTML = STAFF.map(p=>{
    const g = Math.min(100, Math.round(p.ca/p.goal*100));
    return `<div class="goal-row">
      <div class="gav">${initials(p.name)}</div>
      <div class="gnm"><div class="n">${p.first}</div><div class="t"><i style="width:${g}%"></i></div></div>
      <div class="gvl"><b>${g}%</b><span>${fmt(p.goal)}</span></div>
    </div>`;}).join('');

  renderAdminBars();
}
function renderFeed(){
  document.getElementById('admin-feed').innerHTML = ACTIVITY.slice(0,14).map(a=>{
    const ty = ACT_TYPE[a.type];
    return `<div class="feed-item">
      <span class="feed-time">${a.t}</span>
      <span class="feed-ico" style="background:${ty[2]}">${ty[0]}</span>
      <div class="feed-txt"><b>${a.what}</b>${a.amt?` · ${fmt(a.amt)}`:''}<span>${a.who}${a.sub?' · '+a.sub:''}</span></div>
    </div>`;}).join('');
}
function setAdminSerie(k){
  adminSerie = k;
  document.querySelectorAll('#admin-seg button').forEach((b,i)=>b.classList.toggle('on', ['ca','tickets','clients'][i]===k));
  renderAdminBars();
}
function renderAdminBars(){
  const max = Math.max(...WEEK.map(w=>w[adminSerie]));
  const unit = adminSerie==='ca' ? v=>fmt(v) : v=>v;
  document.getElementById('admin-bars').innerHTML = WEEK.map(w=>`
    <div class="bar" style="height:${Math.round(w[adminSerie]/max*100)}%" title="${w.d} · ${unit(w[adminSerie])}">
      <span>${w.d}</span>
    </div>`).join('');
}

/* ---------------- Journal ---------------- */
let journalFilter = 'all';
function renderJournal(){
  const filters = [['all','Tout'],...Object.entries(ACT_TYPE).map(([k,v])=>[k,v[1]])];
  document.getElementById('journal-filters').innerHTML = filters.map(([k,l])=>
    `<button class="cat-tab ${journalFilter===k?'active':''}" onclick="journalFilter='${k}';renderJournal()">${l}</button>`).join('');
  const rows = ACTIVITY.filter(a=>journalFilter==='all'||a.type===journalFilter);
  document.getElementById('journal-tbody').innerHTML = rows.length ? rows.map(a=>`
    <tr><td><b>${a.t}</b></td>
      <td><span class="tag ${a.type==='sale'?'green':a.type==='rdv'?'blue':'gold'}">${ACT_TYPE[a.type][0]} ${ACT_TYPE[a.type][1]}</span></td>
      <td><b>${a.what}</b><div style="font-size:12px;color:var(--muted)">${a.sub}</div></td>
      <td>${a.who}</td><td><b>${a.amt?fmt(a.amt):'—'}</b></td></tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--muted)">Aucune écriture dans cette catégorie.</td></tr>`;
}
function exportJournal(){
  const csv = ['Heure;Type;Action;Détail;Auteur;Montant',
    ...ACTIVITY.map(a=>[a.t,ACT_TYPE[a.type][1],a.what,a.sub,a.who,a.amt||''].join(';'))].join('\n');
  try{
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download='journal-salon.csv'; a.click();
    URL.revokeObjectURL(url); toast('Journal exporté en CSV');
  }catch(e){ toast('Export indisponible dans cet aperçu'); }
}

/* ---------------- Supervision du personnel ---------------- */
let staffSort = 'occ';
function setStaffSort(k){
  staffSort = k;
  document.querySelectorAll('#staff-seg button').forEach((b,i)=>b.classList.toggle('on', ['occ','ca','rating'][i]===k));
  renderStaff();
}
function nextRdvFor(first){
  return RDV.find(r=>r.coiffeur===first && r.status!=='done');
}
function renderStaff(){
  const present = STAFF.filter(p=>p.status!=='off').length;
  const pause   = STAFF.filter(p=>p.status==='break').length;
  const absent  = STAFF.filter(p=>p.status==='off').length;
  const late    = STAFF.filter(p=>p.in && p.in>p.plan).length;
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
  document.getElementById('staff-grid').innerHTML = sorted.map(p=>{
    const st = ST_LABEL[p.status];
    const nx = nextRdvFor(p.first);
    const occColor = p.occ>=90?'var(--danger)':p.occ>=60?'var(--gold)':'var(--green)';
    return `<div class="st-card card">
      <div class="st-head">
        <div class="st-av">${initials(p.name)}<i class="pres" style="background:${ST_COLOR[p.status]}"></i></div>
        <div class="st-id"><div class="n">${p.name}</div><div class="r">${p.role}</div></div>
        <span class="st-state ${st[0]}"><i></i>${st[1]}</span>
      </div>
      <div class="st-occ">
        <div class="l"><span>Charge de la journée</span><span>${p.occ}%${p.until?' · libre à '+p.until:''}</span></div>
        <div class="t"><i style="width:${p.occ}%;background:${occColor}"></i></div>
      </div>
      <div class="st-facts">
        <div><div class="v">${p.tickets}</div><div class="l">tickets</div></div>
        <div><div class="v">${p.in||'—'}</div><div class="l">arrivée</div></div>
        <div><div class="v">⭐ ${p.rating}</div><div class="l">${p.reviews} avis</div></div>
      </div>
      <div class="st-next">${nx?`📌 Prochain : <b>${nx.time} ${nx.name}</b> · ${nx.serv}`:'✅ Plus rien de programmé aujourd\'hui'}</div>
      <div class="st-acts">
        ${p.status==='off'
          ? `<button class="btn btn-gold" onclick="punch(${p.id},'in')">Pointer l'arrivée</button>`
          : p.status==='break'
            ? `<button class="btn btn-gold" onclick="punch(${p.id},'resume')">Reprendre</button>`
            : `<button class="btn btn-ghost" onclick="punch(${p.id},'break')">Mettre en pause</button>`}
        <button class="btn btn-plum" onclick="openStaff(${p.id})">Ouvrir la fiche</button>
      </div>
    </div>`;}).join('');

  document.getElementById('staff-tbody').innerHTML = STAFF.map(p=>{
    const panier = p.tickets?Math.round(p.ca/p.tickets):0;
    const punct = Math.max(0, 100 - p.late*4 - p.absent*8);
    const dPct = p.ca?Math.round(p.disc/p.ca*100):0;
    return `<tr onclick="openStaff(${p.id})" style="cursor:pointer">
      <td><div class="cell-user"><div class="av">${initials(p.name)}</div><div><div class="nm">${p.name}</div><div class="mt">${p.role}</div></div></div></td>
      <td><b>${p.hours} h</b></td>
      <td><span class="tag ${punct>=90?'green':punct>=75?'gold':'grey'}">${punct}%</span></td>
      <td><b>${p.tickets}</b></td>
      <td>${fmt(panier)}</td>
      <td><span style="${dPct>CONFIG.discountMax?'color:var(--danger);font-weight:800':''}">${fmt(p.disc)} · ${dPct}%</span></td>
      <td><span class="tag gold">⭐ ${p.rating}</span></td>
      <td><b>${fmt(Math.round(p.ca*CONFIG.commission/100))}</b></td>
      <td style="text-align:right;color:var(--muted);font-weight:800">→</td>
    </tr>`;}).join('');
}
function punch(id, action){
  const p = STAFF.find(x=>x.id===id); const t = nowHM();
  if(action==='in'){ p.status='free'; p.in=t; p.occ=Math.max(p.occ,5);
    logAct('punch',p.name,'Arrivée pointée', (t>p.plan?`${t} · en retard sur ${p.plan}`:'À l\'heure')+(session?` · validé par ${session.name}`:''));
    toast(`${p.first} est pointé à ${t}`); }
  if(action==='break'){ p.status='break';
    logAct('punch',p.name,'Pause démarrée',`Depuis ${t}`); toast(`${p.first} est en pause`); }
  if(action==='resume'){ p.status='free';
    logAct('punch',p.name,'Reprise de service',`À ${t}`); toast(`${p.first} a repris le service`); }
  if(action==='out'){ p.status='off'; p.out=t; p.occ=0; p.until=null;
    logAct('punch',p.name,'Fin de service',`À ${t}`); toast(`Service terminé pour ${p.first}`); }
  renderStaff(); refreshAlerts();
  if(document.getElementById('staff-drawer').classList.contains('open')) openStaff(id, drawerTab);
}

/* ---------------- Fiche personnel (tiroir) ---------------- */
let drawerTab = 'activite';
function openStaff(id, tab){
  const p = STAFF.find(x=>x.id===id);
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
    .map(([k,l])=>`<button class="dr-tab ${drawerTab===k?'on':''}" onclick="openStaff(${id},'${k}')">${l}</button>`).join('');

  const panier = p.tickets?Math.round(p.ca/p.tickets):0;
  const punct = Math.max(0, 100 - p.late*4 - p.absent*8);
  const goalPct = Math.min(100, Math.round(p.ca/p.goal*100));
  const rdvs = RDV.filter(r=>r.coiffeur===p.first);
  const body = document.getElementById('dr-body');

  if(drawerTab==='activite'){
    body.innerHTML = `
      <div class="dr-kpi">
        <div class="card"><div class="v">${p.occ}%</div><div class="l">Charge aujourd'hui</div></div>
        <div class="card"><div class="v">${p.tickets}</div><div class="l">Tickets du jour</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Rendez-vous attribués</div>
      ${rdvs.length?rdvs.map(r=>`
        <div class="agenda-row">
          <span class="agenda-time">${r.time}</span>
          <div class="agenda-main"><div class="c">${r.name}</div><div class="s">${r.serv}</div></div>
          <span class="tag ${STATUS[r.status][0]}">${STATUS[r.status][1]}</span>
        </div>`).join(''):'<div style="color:var(--muted);font-size:13px;padding:10px 0">Aucun rendez-vous attribué. Répartissez-lui un client depuis l\'agenda.</div>'}
      <div class="section-title" style="font-size:15px;margin-top:22px">Dernières écritures</div>
      ${ACTIVITY.filter(a=>a.who===p.name).slice(0,6).map(a=>`
        <div class="feed-item"><span class="feed-time">${a.t}</span>
        <span class="feed-ico" style="background:${ACT_TYPE[a.type][2]}">${ACT_TYPE[a.type][0]}</span>
        <div class="feed-txt"><b>${a.what}</b><span>${a.sub}</span></div></div>`).join('')
        || '<div style="color:var(--muted);font-size:13px">Aucune écriture aujourd\'hui.</div>'}`;
  }
  if(drawerTab==='perf'){
    const dPct = p.ca?Math.round(p.disc/p.ca*100):0;
    body.innerHTML = `
      <div class="dr-kpi">
        <div class="card"><div class="v">${fmt(p.ca)}</div><div class="l">Recettes du mois</div></div>
        <div class="card"><div class="v">${fmt(panier)}</div><div class="l">Panier moyen</div></div>
        <div class="card"><div class="v">⭐ ${p.rating}</div><div class="l">${p.reviews} avis clients</div></div>
        <div class="card"><div class="v">${fmt(Math.round(p.ca*CONFIG.commission/100))}</div><div class="l">Commission à ${CONFIG.commission}%</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Objectif mensuel</div>
      <div class="goal-row" style="border:none;padding-top:0">
        <div class="gnm"><div class="t"><i style="width:${goalPct}%"></i></div></div>
        <div class="gvl"><b>${goalPct}%</b><span>${fmt(p.ca)} / ${fmt(p.goal)}</span></div>
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
        <div class="card"><div class="v">${punct}%</div><div class="l">Ponctualité</div></div>
      </div>
      <div class="section-title" style="font-size:15px">Journée en cours</div>
      <div class="punch"><span>Service prévu</span><b>${p.plan}</b></div>
      <div class="punch"><span>Arrivée pointée</span><b style="color:${p.in&&p.in>p.plan?'var(--danger)':'var(--green)'}">${p.in||'Pas encore'}</b></div>
      <div class="punch"><span>Fin de service</span><b>${p.out||'En cours'}</b></div>
      <div class="punch"><span>Retards ce mois</span><b>${p.late}</b></div>
      <div class="punch"><span>Absences ce mois</span><b>${p.absent}</b></div>
      <div style="display:flex;gap:10px;margin-top:20px">
        ${p.status==='off'
          ? `<button class="btn btn-gold" style="flex:1;justify-content:center" onclick="punch(${p.id},'in')">Pointer l'arrivée</button>`
          : `<button class="btn btn-ghost" style="flex:1;justify-content:center" onclick="punch(${p.id},'${p.status==='break'?'resume':'break'}')">${p.status==='break'?'Reprendre':'Mettre en pause'}</button>
             <button class="btn btn-plum" style="flex:1;justify-content:center" onclick="punch(${p.id},'out')">Terminer le service</button>`}
      </div>`;
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
      row('Taux de commission','Part des recettes reversée à chaque coiffeur.',`<input type="number" id="s-comm" value="${CONFIG.commission}" min="0" max="60">`)+
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
function applyIdentity(){
  document.querySelector('.brand .name').textContent = CONFIG.name;
  document.querySelector('.brand .sub').textContent = CONFIG.tagline;
  document.querySelector('.brand .mark').textContent = CONFIG.name.trim()[0].toUpperCase();
  document.title = CONFIG.name + ' — Gestion';
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
    RDV.forEach(r=>{ if(match(r.name)||match(r.serv))
      items.push({g:'Rendez-vous',i:'📅',n:`${r.time} · ${r.name}`,s:`${r.serv} · ${r.coiffeur}`,r:'Voir l\'agenda',a:()=>go('rdv')}); });
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
  if(v==='team') renderStaff();
  if(v==='journal') renderJournal();
};
document.querySelectorAll('.nav-item[data-view]').forEach(n=>n.onclick=()=>go(n.dataset.view));
document.getElementById('nav-settings').onclick = ()=>openSettings();

const _confirmPayment = confirmPayment;
confirmPayment = function(){
  const total = payableTotal();
  const who = document.getElementById('assign-coiffeur').value || 'Caisse';
  const first = who.split(' ')[0];
  _confirmPayment.apply(this, arguments);
  const head = document.querySelector('.rc-head .t'); if(head) head.textContent = CONFIG.name;
  const m = PAY_METHODS.find(x=>x.id===payState.method);
  const p = STAFF.find(x=>x.first===first);
  if(p){ p.tickets++; p.ca += total; }
  logAct('sale', session?session.name:'Caisse', 'Ticket encaissé', `${m?m.name:''}${currentClient!=null?' · '+CLIENTS[currentClient].name:''}${p?' · coiffeur '+p.first:''}`, total);
  refreshAlerts();
  if(document.getElementById('view-admin').classList.contains('active')) renderAdmin();
};

const _addRdv = addRdv;
addRdv = function(){
  const name = document.getElementById('r-name').value.trim()||'Client';
  const time = document.getElementById('r-time').value;
  const coif = document.getElementById('r-coiffeur').value;
  _addRdv.apply(this, arguments);
  logAct('rdv', session?session.name:'Accueil','Rendez-vous ajouté',`${name} · ${time} · ${coif}`);
  renderStaff(); refreshAlerts();
};

const _renderPayMethods = renderPayMethods;
renderPayMethods = function(){
  _renderPayMethods.apply(this, arguments);
  document.querySelectorAll('.pm').forEach(el=>{
    const id = el.id.replace('pm-','');
    if(!CONFIG.pay[id]) el.remove();
  });
};

renderStock = function(){
  document.getElementById('stock-tbody').innerHTML = STOCK.map(s=>{
    const st = s.qty<=CONFIG.stockCrit ? ['blue','⚠ À recommander']
             : s.qty<=CONFIG.stockLow  ? ['gold','Stock bas'] : ['green','En stock'];
    return `<tr><td><b>${s.name}</b></td><td>${s.cat}</td><td>${fmt(s.price)}</td>
      <td><b>${s.qty}</b></td><td><span class="tag ${st[0]}">${st[1]}</span></td></tr>`;
  }).join('');
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
    closeCmdk(); closeNotif(); closeStaff();
    document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  }
});
document.getElementById('cmdk-input').addEventListener('input', e=>buildCmdk(e.target.value));

/* ---------------- Démarrage V2 ---------------- */
function initV2(){
  dayCA = 128500; dayClients = 14;
  document.getElementById('kpi-ca').textContent = fmt(dayCA);
  document.getElementById('kpi-clients').textContent = dayClients;
  applyIdentity();
  renderStaff();
  renderJournal();
  renderAdmin();
  refreshAlerts();
  document.querySelectorAll('#mnav button').forEach(b=>b.classList.toggle('on', b.dataset.view==='dash'));
}


/* ==================================================================
   V3 — SESSIONS, RÔLES ET PERMISSIONS
   ================================================================== */
ACT_TYPE.auth = ['🔐','Session','#F1ECF0'];

const ACCOUNTS = [
  {id:'a1', login:'admin',  pin:'1234', name:'Jésuel A.', ini:'JA', role:'admin',
   active:true, last:'Hier · 21:04'},
  {id:'a2', login:'khadim', pin:'5678', name:'Khadim',    ini:'K',  role:'gerant',
   active:true, last:"Aujourd'hui · 08:05"},
];
let session = null;
function roleOf(){ return ROLES.find(r=>r.id===(session?session.role:'')) || ROLES[1]; }
function roleName(id){ const r=ROLES.find(x=>x.id===id); return r?r.name:id; }
function can(k){ return session ? !!roleOf().p[k] : false; }

const VIEW_PERM = {rdv:'rdv', caisse:'caisse', clients:'clients', team:'perso',
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
      <span class="k">code ${a.pin}</span>
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
function tryLogin(){
  const l = document.getElementById('a-login').value.trim().toLowerCase();
  const p = document.getElementById('a-pin').value.trim();
  if(!l){ authError('Saisissez un identifiant ou choisissez un profil.'); return; }
  const a = ACCOUNTS.find(x=>x.login===l);
  if(!a){ authError(`Aucun compte ne porte l'identifiant « ${l} ».`); return; }
  if(!a.active){ authError('Ce compte est désactivé. Demandez à l\'administrateur de le réactiver.'); return; }
  if(a.pin!==p){ authError('Code d\'accès incorrect. Réessayez.'); return; }
  session = a;
  a.last = "Aujourd'hui · " + nowHM();
  document.body.classList.remove('locked');
  document.getElementById('auth').classList.remove('show');
  applySession();
  go(can('admin360') ? 'admin' : 'dash');
  logAct('auth', a.name, 'Connexion', roleOf().name);
  toast(`Bonjour ${a.name.split(' ')[0]} · profil ${roleOf().name}`);
}
function logout(){
  if(session) logAct('auth', session.name, 'Déconnexion', roleOf().name);
  cart = []; currentClient = null; redeemActive = false;
  document.getElementById('discount').value = 0;
  fillClientSelect(); renderLoyaltyChip(); renderTicket();
  closeStaff(); closeNotif(); closeCmdk();
  document.querySelectorAll('.overlay.show').forEach(o=>o.classList.remove('show'));
  session = null;
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
  pill.innerHTML = (session.role==='admin'?'🛡️':'🧾') + ' ' + r.name;

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

const _applyIdentityAuth = applyIdentity;
applyIdentity = function(){
  _applyIdentityAuth.apply(this, arguments);
  const letter = CONFIG.name.trim()[0].toUpperCase();
  document.getElementById('auth-mark').textContent = letter;
  document.getElementById('auth-mark-m').textContent = letter;
  document.getElementById('auth-name-m').textContent = CONFIG.name;
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

/* signature de l'opérateur sur le ticket */
const _confirmPaymentAuth = confirmPayment;
confirmPayment = function(){
  _confirmPaymentAuth.apply(this, arguments);
  const rec = document.querySelector('.receipt');
  if(rec && session) rec.insertAdjacentHTML('beforeend',
    `<div class="rc-row" style="border:none;color:var(--muted)"><span>Encaissé par</span><span>${session.name} · ${roleOf().name}</span></div>`);
};

/* ---------------- Comptes et accès (paramètres) ---------------- */
function accountsHTML(){
  return `
    <div>${ACCOUNTS.map(a=>`
      <div class="acc">
        <span class="acc-av ${a.role}">${a.ini}</span>
        <div class="acc-id">
          <div class="n">${a.name}${session&&session.id===a.id?' <span class="tag green" style="margin-left:6px">vous</span>':''}</div>
          <div class="s">${roleName(a.role)} · identifiant <b>${a.login}</b> · code ${a.pin}</div>
        </div>
        <div class="acc-meta">Dernière connexion<br><b>${a.last}</b></div>
        ${a.role==='admin' ? '<span class="tag green">Actif</span>' : sw('acc-'+a.id, a.active)}
      </div>`).join('')}
    </div>
    <button class="btn btn-ghost" style="width:100%;justify-content:center;margin-top:4px" onclick="toast('Création de compte à brancher sur le back-office')">
      ＋ Ajouter un compte
    </button>
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

/* =================== INIT =================== */
renderServices();
renderQuick();
fillClientSelect();
renderTicket();
renderRdv();
renderClients();
renderTeam();
renderStock();
renderPaySplit();
clock(); setInterval(clock,1000*30);
initV2();
initAuth();
