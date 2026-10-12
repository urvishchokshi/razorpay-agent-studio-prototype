// One deterministic snapshot powers every synthetic performance surface.
export const TODAY = '2026-10-12';
export const ACTIVATION = '2026-08-29';
const DAY = 86400000;
const stamp = date => Date.parse(date + 'T00:00:00Z');
const iso = value => new Date(value).toISOString().slice(0,10);
export const RANGES = [
  {id:'week',label:'This week',start:'2026-10-12',end:'2026-10-18'},
  {id:'d30',label:'Last 30 days',start:'2026-09-13',end:TODAY},
  {id:'since',label:'Since activation',start:ACTIVATION,end:TODAY},
  {id:'q',label:'This quarter',start:'2026-10-01',end:'2026-12-31'}
];
export const dateLabel = date => new Date(date+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});
export const rangeCaption = id => {const r=RANGES.find(r=>r.id===id)||RANGES[2];return `${dateLabel(r.start)}–${dateLabel(r.end)} 2026 · data through 12 Oct`;};
const weights=Array.from({length:82},(_,i)=>6000+(i*1733)%8500);
const weightedTotal=weights.reduce((a,b)=>a+b,0);
export const ORDERS=weights.map((w,i)=>({id:`ord-${i+1}`,date:iso(stamp(ACTIVATION)+Math.floor(i*44/81)*DAY),buyer:`business-${i<63?i+1:i-62}`,amount:Math.floor(w/weightedTotal*840000)}));
ORDERS[81].amount+=840000-ORDERS.reduce((s,o)=>s+o.amount,0);
const COHORT=Array.from({length:1140},(_,i)=>({date:iso(stamp(ACTIVATION)+(i*13%45)*DAY),consented:i<714,replied:i<221,quoted:i<108}));
export function performance(id='since') {
  const r=RANGES.find(r=>r.id===id)||RANGES[2],end=r.end<TODAY?r.end:TODAY;
  const orders=ORDERS.filter(o=>o.date>=r.start&&o.date<=end),cohort=COHORT.filter(o=>o.date>=r.start&&o.date<=end);
  const counts=new Map();for(const o of orders)counts.set(o.buyer,(counts.get(o.buyer)||0)+1);
  const buckets=[];const step=id==='week'?1:7;
  for(let t=stamp(r.start);t<=stamp(id==='week'?r.end:end);t+=step*DAY){const start=iso(t),finish=iso(Math.min(t+(step-1)*DAY,stamp(id==='week'?r.end:end)));buckets.push({start,end:finish,label:step===1?dateLabel(start):`${dateLabel(start)}–${dateLabel(finish)}`,amount:orders.filter(o=>o.date>=start&&o.date<=finish).reduce((s,o)=>s+o.amount,0),future:start>TODAY});}
  let cumulative=0;for(const bucket of buckets){cumulative+=bucket.amount;bucket.cumulative=cumulative;}
  const revenue=orders.reduce((s,o)=>s+o.amount,0),repeat=[...counts.values()].filter(v=>v>1).length;
  return {revenue,orders:orders.length,accounts:counts.size,repeat,average:orders.length?Math.round(revenue/orders.length):0,buckets,caption:rangeCaption(r.id),label:r.label,funnel:[['Found by the agent',cohort.length],['Opted in to WhatsApp',cohort.filter(x=>x.consented).length],['Replied',cohort.filter(x=>x.replied).length],['Quoted',cohort.filter(x=>x.quoted).length],['Business accounts',counts.size],['Reordered',repeat]]};
}
export function questionRange(question,fallback='since') {
  if(/since (activation|activating|install|the start)|all[- ]time/i.test(question))return 'since';
  if(/last 30 days|past 30 days/i.test(question))return 'd30';
  if(/this week|current week/i.test(question))return 'week';
  if(/this quarter|current quarter/i.test(question))return 'q';
  if(/yesterday|last week|last month|last quarter|last year|today|\b20\d\d\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b|\b\d+ days\b/i.test(question))return null;
  return fallback;
}
export const CONNECTOR_DEFAULTS={payments:'Built in',checkout:'Built in',whatsapp:'Pre-enabled',sms:'Pre-enabled',email:'Pre-enabled',shiprocket:'Pre-enabled',elevenlabs:'Pre-enabled',shopify:'Available',tally:'Expires in 3 days',sarvam:'Available',zoho:'Available'};
export const connectorStatus=(state,id)=>(state.connectors?.[id]||CONNECTOR_DEFAULTS[id]||'Available').replace(/^Demo connected$/,'Connected');
export const connected=(state,id)=>!['Available','Disconnected','Expired'].includes(connectorStatus(state,id));
export const defaultQuote=()=>({embroidery:60,delivery:'2026-10-24'});
export function quoteErrors(q=defaultQuote()) {
  const errors={};const n=Number(q.embroidery);
  if(q.embroidery===''||!Number.isFinite(n)||n<0||n>10000||!Number.isInteger(n))errors.embroidery='Enter a whole-number price from ₹0 to ₹10,000.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(q.delivery||'')||!Number.isFinite(stamp(q.delivery))||iso(stamp(q.delivery))!==q.delivery||q.delivery<'2026-10-13'||q.delivery>'2027-10-12')errors.delivery='Choose a delivery date from 13 Oct 2026 to 12 Oct 2027.';
  return errors;
}
export function quoteAmount(state,id) {
  if(id==='finch'){const q=state.quotes?.finch||defaultQuote();if(quoteErrors(q).embroidery)return null;const sub=7315+35*Number(q.embroidery);return sub+Math.round(sub*.05);}
  return {sai:21042,shivalik:32193,glow:27122}[id]||0;
}
export const queueAmount=state=>(state.pending||[]).reduce((sum,id)=>sum+(quoteAmount(state,id)||0),0);
export function agentStatus(state){return !state.installed?(state.installDraft?'Setting up':'Preview'):state.paused?'Paused':'Live';}
export const modeLabel=state=>state.config?.mode==='auto'?'Auto within your rules':'Review-first';
export function autoAvailable(state){return !state.installed||stamp(TODAY)-stamp(state.activatedAt||ACTIVATION)>=14*DAY;}
export const effectiveRule=(state,id)=>state.config?.autonomy?.[id]==='never'?'never':state.config?.mode!=='auto'?'ask':state.config?.autonomy?.[id]||(['intro','qhigh','floor','custom','credit'].includes(id)?'ask':'auto');
export const INTRO_RECIPIENTS=[
 ['Hotel Green Leaf','Udaipur',94,'18 bath towels · Hotel in name'],['Comfort Stay Ladies PG','Kota',91,'PG in name · 3 orders in 5 weeks'],['Hilltop Homestay','Kasauli',90,'12 bedsheets + 12 towels'],['Kids Corner Daycare','Bhopal',88,'20 sheets · commercial address'],['Snip & Style Salon','Lucknow',86,'40 hand towels · Salon in name'],
 ['Lakeview Guest House','Bhopal',93,'24 towels · Guest House in name'],['Lotus Women’s Hostel','Pune',92,'32 bedsheets · repeat payer'],['Maple Corporate Suites','Gurugram',91,'48 pillow covers · business address'],['Indigo Spa','Jaipur',90,'60 hand towels · monthly reorder'],['Riverbend Retreat','Rishikesh',89,'20 sheets · Retreat in name'],['Bright Minds Preschool','Indore',88,'30 cushion covers · school address'],['Pearl Boutique Hotel','Surat',95,'72 towels · verified firm name'],['Cedar Co-living','Bengaluru',92,'42 sheets · shared payer'],['Mango Tree Café','Kochi',87,'36 towels · Café in name'],['Silverline Dental','Ahmedabad',85,'24 towels · clinic address'],['West End Hostel','Mumbai',93,'50 sheets · repeat orders'],['Olive Office Spaces','Hyderabad',89,'28 covers · office address'],['Jasmine Beauty Lounge','Chennai',90,'48 hand towels · monthly rhythm'],['Pinewood Homestay','Shimla',88,'18 sheets · Homestay in name'],['Sunrise Student Living','Kota',94,'60 sheets · repeat payer'],['Coral Wellness Studio','Goa',87,'30 towels · studio address'],['Bluebird Training Centre','Noida',86,'24 covers · commercial address'],['Saffron Banquets','Ludhiana',92,'80 towels · Banquets in name'],['Meadow Montessori','Nagpur',84,'22 sheets · school address'],['Haven Serviced Apartments','Delhi',91,'44 covers · repeat payer'],['The Grooming Room','Mysuru',85,'32 towels · salon address'],['North Star Lodge','Manali',90,'26 sheets · Lodge in name']
].map(([name,city,confidence,evidence],i)=>({id:'intro-'+(i+1),name,city,confidence,evidence,consent:true}));
export const selectedRecipients=state=>INTRO_RECIPIENTS.filter(b=>b.consent&&b.confidence>=Number(state.config?.confidence??80)&&(state.introSelection||INTRO_RECIPIENTS.map(b=>b.id)).includes(b.id));
