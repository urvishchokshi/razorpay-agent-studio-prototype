import {performance,questionRange,quoteAmount,queueAmount as sharedQueueAmount,connected,INTRO_RECIPIENTS,selectedRecipients} from './model.js';
import {icon, esc, button, badge, money} from './ui.js';

const REQUESTS = {
  intro: {name:'27 business introductions',detail:'All buyers have opted in to WhatsApp. The batch is ready for your review.'},
  sai: {name:'Sai Krupa PG',amount:21042,detail:'40 bedsheets + 40 pillow covers. Stock and GSTIN checks passed.'},
  shivalik: {name:'Hotel Shivalik Residency',amount:32193,detail:'Requested 20% off, beyond your maximum 15% discount.'},
  finch: {name:'Finch Analytics',amount:9886,detail:'Custom logo embroidery needs your price and delivery date.'},
  glow: {name:'Glow Unisex Salon',amount:27122,detail:'Requested 15 days’ credit. Your payment choice needs review.'},
  label: {name:'Buyer labels',detail:'Low-confidence buyers need your judgement before outreach.'}
};
const INTRO_DRAFT='Hi, thanks for your order from Kesar Linen Co. If you’re buying for a PG, hotel, salon or office, we can send a GST invoice in your firm’s name and trade prices on 10+ pieces. Reply YES for trade prices, CALL for a call back, or STOP to opt out.';
const SAI_DRAFT='Here’s your quote for 40 single bedsheets and 40 pillow covers at our 25+ piece trade price: ₹20,040 + IGST ₹1,002 = ₹21,042. The GST invoice will be in the name of Sai Krupa PG (GSTIN 36AB•••••1Z5). Pay 50% (₹10,521) to confirm. Balance on delivery.';
const rayState = ctx => ctx.ui.ray ||= {question:'',messages:ctx.state.rayMessages||[],view:'chat',selected:[]};
const pending = ctx => (ctx.state.pending || []).filter(id => REQUESTS[id]);
const actionButton = (label,action,id,variant='secondary',attrs='') => button(label,action,variant,`${id?`data-id="${esc(id)}"`:''} ${attrs}`);
const labelCount = ctx => (ctx.state.labelPending || []).length;
const requestAmount=(id,ctx)=>quoteAmount(ctx.state,id);
const queueAmount=ctx=>sharedQueueAmount(ctx.state);
function draft(id,ctx){return ctx.state.approvalDrafts?.[id] || ctx.ui.dashboard?.messages?.[id] || (id==='intro'?INTRO_DRAFT:SAI_DRAFT);}

function blockedReason(id,ctx){
  if(!(ctx.state.pending || []).includes(id))return 'This action has already been reviewed.';
  if(ctx.state.paused)return 'Resume the B2B Customer Agent before approving actions.';
  const c=ctx.state.config||{},a=c.autonomy||{};
  if(!connected(ctx.state,'whatsapp'))return 'Reconnect WhatsApp in agent settings before approving outreach.';
  if(id==='intro'){
    if(a.intro==='never')return 'Introductions are disabled in your current rules.';
    if(Number(c.confidence??80)>80)return 'Review the batch against your updated confidence threshold.';
    if(Number(c.weeklyMessages??2)<1)return 'Your weekly message limit is set to zero.';
    if(selectedRecipients(ctx.state).length!==27)return 'Review your selected recipients in the approval workspace before scheduling.';
  }
  if(id==='sai'){
    const buyer=ctx.state.buyerOverrides?.sai;
    if(buyer && /paused|excluded|opted out|not a business|handled by you/i.test(buyer.status||''))return 'Review the buyer’s current conversation and outreach status first.';
    if(Number(c.confidence??80)>92)return 'This buyer falls below your updated confidence threshold.';
    if(Number(c.moq??10)>40)return 'This quote falls below your current minimum order quantity.';
    if(Number((c.tiers||[8,12,15])[1])!==12)return 'Review the draft against your updated trade prices.';
    const rule=21042>Number(c.quoteLimit??15000)?'qhigh':'qlow';
    if(a[rule]==='never')return 'Quotes of this value are disabled in your current rules.';
  }
  if(!draft(id,ctx).trim())return 'Add a message draft before approving this action.';
  return '';
}
const eligible = ctx => ['intro','sai'].filter(id=>!blockedReason(id,ctx));

function queueRow(id,ctx){
  const item=REQUESTS[id],amount=requestAmount(id,ctx),name=id==='label'?`${labelCount(ctx)} buyers to label`:item.name;
  return `<div class="ray-queue-row"><span class="ray-queue-icon">${icon(id==='intro'?'message':id==='label'?'tag':id==='glow'?'credit-card':'file',16)}</span><div><strong>${esc(name)}</strong><p>${esc(item.detail)}</p></div>${amount===null?'<span class="ray-queue-amount">Needs price</span>':amount?`<span class="ray-queue-amount">${money(amount)}</span>`:''}${actionButton(icon('arrow-right',15),'ray-review',id,'ghost',`aria-label="Review ${esc(name)}"`)}</div>`;
}
export function summary(ctx,range=ctx.state.range||'since'){
 const stats=performance(range);
 return `<p><strong>${esc(stats.label)}</strong> · ${esc(stats.caption)}</p><p>Your B2B agent brought in <strong>${money(stats.revenue)}</strong> from <strong>${stats.orders} orders</strong>. <strong>${stats.accounts} business accounts</strong> ordered and <strong>${stats.repeat}</strong> reordered in this period.</p><p>${pending(ctx).length?`<strong>${pending(ctx).length} review items</strong> are waiting, with <strong>${money(queueAmount(ctx))}</strong> in quotes.`:'Your review queue is clear.'}</p>${ctx.state.paused?'<p class="ray-paused-note">Agent paused. Resume before sending.</p>':''}<div class="ray-response-actions">${pending(ctx).length?button('Help with approvals','ray-approvals','ghost'):button('View activity','ray-activity','ghost')}</div>`;
}
function approvalSummary(ctx){
  const ids=pending(ctx),ready=eligible(ctx);
  if(!ids.length)return `<p>You’re all caught up. Every reviewed action is saved in your activity.</p><div class="ray-response-actions">${button('View activity '+icon('arrow-right',13),'ray-activity','ghost')}</div>`;
  return `<p><strong>${ids.length} items are waiting for you.</strong> Here’s what each one needs.</p><div class="ray-queue">${ids.map(id=>queueRow(id,ctx)).join('')}</div><p>${ready.length?`I can prepare ${ready.length===2?'the introduction batch and Sai Krupa PG’s quote':ready[0]==='intro'?'the introduction batch':'Sai Krupa PG’s quote'} for your approval. You’ll review the exact actions before confirming.`:ctx.state.paused?'The agent is paused. Resume it when you’re ready to approve and send.':'These requests need individual review against your current rules.'}</p><div class="ray-response-actions">${ready.length?button('Review proposed approvals '+icon('arrow-right',14),'ray-proposal','primary'):actionButton('Open approvals '+icon('arrow-right',14),'ray-review','','primary')}</div>`;
}
export function respond(question,ctx){
  const scope=questionRange(question,ctx.state.range||'since');
  if(scope===null&&/revenue|order|business|perform|summar|week|month|quarter|year|today|yesterday/i.test(question))return `<p>Which supported period should I use? You can ask about This week, Last 30 days, Since activation, and This quarter, with data through 12 October 2026.</p><p>Ask again with one of those periods so I can give you the correct total.</p>`;
  if(/shivalik|discount|floor/i.test(question))return targetedResponse('shivalik',ctx);
  if(/finch|embroider|custom/i.test(question))return targetedResponse('finch',ctx);
  if(/glow|credit|salon/i.test(question))return targetedResponse('glow',ctx);
  if(/sai|krupa/i.test(question))return targetedResponse('sai',ctx);
  if(/label|confidence|khan|verma|souza/i.test(question))return targetedResponse('label',ctx);
  if(/approv|pending|review|need me|waiting|send|intro/i.test(question))return approvalSummary(ctx);
  if(/grow|opportun|buyer/i.test(question))return `<p><strong>44 new business buyers</strong> were identified this week. ${pending(ctx).includes('intro')?'27 have opted in and are ready for an introduction.':'The introduction batch has been reviewed.'} PGs and salons show the strongest reorder patterns.</p><p>Start with the ready introductions, then follow up with buyers who have already requested a quote.</p><div class="ray-response-actions">${button('Help with approvals '+icon('arrow-right',13),'ray-approvals','ghost')}</div>`;
  if(/summar|business|perform|revenue|order|week|doing|dashboard|paid|payment/i.test(question))return summary(ctx,scope);
  return `<p>I can summarize your B2B performance, explain what’s waiting for you, and prepare the standard introductions and Sai Krupa PG quote for your approval.</p><p>For discount exceptions, custom work, credit terms and buyer labels, I’ll take you to the request so you can make the decision.</p><div class="ray-response-actions">${button('Summarize my dashboard','ray-summary')}${button('Help with approvals','ray-approvals')}</div>`;
}
function targetedResponse(id,ctx){
  if(!pending(ctx).includes(id))return `<p>${id==='label'?'Your buyer labels':`The request for ${esc(REQUESTS[id].name)}`} ${id==='label'?'have':'has'} already been reviewed. The decision is saved in Activity.</p><div class="ray-response-actions">${button('View activity','ray-activity','ghost')}</div>`;
  const reason=['intro','sai'].includes(id)?blockedReason(id,ctx):'';
  return `<p>${id==='label'?`<strong>${labelCount(ctx)} buyers need your label.</strong> Their business signals are below your confidence threshold, so no introduction has been sent.`:`<strong>${esc(REQUESTS[id].name)}</strong> has a <strong>${requestAmount(id,ctx)===null?'price awaiting correction':money(requestAmount(id,ctx))}</strong> request waiting. ${esc(REQUESTS[id].detail)}`}</p><p>${id==='sai'&&!reason?'The quote uses your standard trade price and a 50% advance of ₹10,521. I can add it to your proposed approvals.':reason?esc(reason):'Review the request and choose the option that fits your business.'}</p><div class="ray-response-actions">${id==='sai'&&!reason?button('Review proposed approvals','ray-proposal','primary'):actionButton('Review request '+icon('arrow-right',13),'ray-review',id,'primary')}</div>`;
}
function addMessage(question,answer,ctx){
  const r=rayState(ctx);r.messages.push({question,answer});r.messages=r.messages.slice(-8);ctx.state.rayMessages=r.messages;ctx.persist();r.question='';r.view='chat';renderRay(ctx,true);
}
function proposal(ctx){
  const r=rayState(ctx),ids=eligible(ctx),selected=r.selected.filter(id=>ids.includes(id));
  const manual=pending(ctx).filter(id=>!ids.includes(id));
  return `<div class="ray-proposal"><div class="ray-proposal-heading">${badge('Your approval is required','blue')}<h3>Review proposed approvals</h3><p>Choose what Ray should carry out. Nothing changes until you confirm below.</p></div>${ids.map(id=>`<article class="ray-proposed-card"><label class="ray-proposed-choice"><input type="checkbox" data-action="ray-select" data-id="${id}" ${selected.includes(id)?'checked':''}><div><strong>${id==='intro'?'Introduce 27 business buyers':'Send Sai Krupa PG’s quote'}</strong><span>${id==='intro'?'WhatsApp · 27 opted-in buyers':'WhatsApp · ₹21,042 total'}</span></div></label><div class="ray-proposed-content"><p>${id==='intro'?'Schedule the approved batch for Tuesday, 13 Oct at 10:00. Every buyer meets the 80% confidence threshold; opted-out buyers are excluded.':'40 bedsheets + 40 pillow covers at 12% trade discount, including ₹1,002 IGST. Request ₹10,521 as the 50% advance.'}</p><div class="ray-proposed-checks">${icon('check-circle',14)}${id==='intro'?'Consent checked · outreach rules checked':'Stock available · GSTIN active · standard pricing'}</div><details><summary>View drafted message ${icon('chevron-down',12)}</summary><p>${esc(draft(id,ctx))}</p></details></div></article>`).join('')}${!ids.length?`<div class="ray-notice">${icon('info',18)}<p>${ctx.state.paused?'Resume the agent before approving actions.':'No standard actions are eligible for this batch. Review the remaining requests individually.'}</p></div>`:''}${manual.length?`<div class="ray-manual-review"><span class="ray-section-label">NEEDS YOUR DECISION</span><p>The remaining requests stay in your queue for individual review.</p><div class="ray-manual-links">${manual.map(id=>actionButton(id==='label'?`${labelCount(ctx)} buyer labels`:REQUESTS[id].name,'ray-review',id,'ghost')).join('')}</div></div>`:''}<div class="ray-confirmation"><div><strong>${selected.length} action${selected.length===1?'':'s'} selected</strong><span>${selected.includes('sai')?'₹21,042 quote · ₹10,521 advance':'Review and approve the chosen actions'}</span></div>${button('Approve selected actions','ray-confirm','primary',!selected.length||ctx.state.paused?'disabled':'')}</div><p class="ray-confirmation-hint">Your decision is saved in Activity.</p></div>`;
}
export function renderRayPanel(ctx,embedded=false){
 const r=rayState(ctx);
 return `<section class="ray-panel ray-inline ${embedded?'ray-dashboard':'ray-page'}" aria-label="Ask Ray"><header class="ray-header"><div class="ray-brand"><span class="ray-avatar">${icon('sparkles',23)}</span><div><h2>Ask Ray</h2><p>Summarize your business. Work through approvals.</p></div></div>${embedded?button('Open full chat '+icon('arrow-right',15),'ray-expand','ghost'):button(icon('arrow-left',14)+' Dashboard','ray-dashboard','ghost')}</header>${r.view==='proposal'?`<div class="ray-toolbar">${button(icon('arrow-left',14)+' Back to conversation','ray-cancel-proposal','ghost')}</div><div class="ray-conversation ray-proposal-scroll">${proposal(ctx)}</div>`:`<div class="ray-conversation" role="log" aria-live="polite" aria-relevant="additions">${!r.messages.length?`<div class="ray-welcome"><h3>What would you like to do?</h3><div class="ray-suggestions"><button type="button" data-action="ray-summary">${icon('chart-line',18)}<strong>Summarize my dashboard</strong></button><button type="button" data-action="ray-approvals">${icon('check-circle',18)}<strong>Help with approvals</strong></button></div></div>`:''}${r.messages.map(message=>`<div class="ray-exchange"><div class="ray-user-message">${esc(message.question)}</div><div class="ray-response"><span class="ray-response-avatar">${icon('sparkles',15)}</span><div class="ray-response-body">${message.answer.replace(/This synthetic snapshot supports/g,'You can ask about').replace(/ in the demo/g,'').replace(/in valid order drafts/g,'in quotes')}</div></div></div>`).join('')}</div><footer class="ray-composer"><form id="dashboard-ray-form"><label class="sr-only" for="dashboard-ray-question">Ask Ray about your business</label><input id="dashboard-ray-question" name="ask_ray" data-action="ray-input" value="${esc(r.question)}" maxlength="500" autocomplete="off" placeholder="Ask Ray to summarize revenue or help with approvals…"><button type="submit" aria-label="Send question to Ray" ${r.question.trim()?'':'disabled'}>${icon('arrow-right',18)}</button></form></footer>`}</section>`;
}
function renderRay(ctx,scroll=false){
 const previous=document.querySelector('.ray-conversation')?.scrollTop||0;
 ctx.rerender();
 const conversation=document.querySelector('.ray-conversation');if(conversation)conversation.scrollTop=scroll?conversation.scrollHeight:previous;
 if(scroll)document.getElementById('dashboard-ray-question')?.focus({preventScroll:true});
}
export function openRay(ctx,intent=''){
 const r=rayState(ctx);r.view='chat';r.selected=[];
 ctx.nav('/payments/ray');
 if(intent){r.messages.push({question:intent,answer:respond(intent,ctx)});r.messages=r.messages.slice(-8);ctx.state.rayMessages=r.messages;ctx.persist();}
 ctx.rerender();
}
export function handleRay(action,el,ctx){
  if(action==='ray-dashboard'){ctx.nav('dashboard');return true;}
  if(action==='ray-expand'){ctx.nav('/payments/ray');return true;}
  if(action==='ray-input'){const r=rayState(ctx);r.question=el.value.slice(0,500);const send=globalThis.document?.querySelector('#dashboard-ray-form button[type="submit"]');if(send)send.disabled=!r.question.trim();return true;}
  if(action==='ray-send'){
    const r=rayState(ctx),question=(globalThis.document?.getElementById('dashboard-ray-question')?.value||r.question||'').trim().slice(0,500);
    if(question)addMessage(question,respond(question,ctx),ctx);return true;
  }
  if(action==='ray-summary'){addMessage('Summarize my dashboard',summary(ctx),ctx);return true;}
  if(action==='ray-approvals'){addMessage('Help with approvals',approvalSummary(ctx),ctx);return true;}
  if(action==='ray-proposal'){const r=rayState(ctx);r.selected=eligible(ctx);r.view='proposal';renderRay(ctx);return true;}
  if(action==='ray-select'){const r=rayState(ctx),id=el.dataset.id;if(!eligible(ctx).includes(id))return true;r.selected=el.checked?[...new Set([...r.selected,id])]:r.selected.filter(x=>x!==id);renderRay(ctx);return true;}
  if(action==='ray-cancel-proposal'){const r=rayState(ctx);r.view='chat';r.selected=[];renderRay(ctx,true);return true;}
  if(action==='ray-review'){ctx.ui.dashboard ||= {};if(el?.dataset.id)ctx.ui.dashboard.approval=el.dataset.id;ctx.closeOverlay();ctx.nav('approvals');return true;}
  if(action==='ray-activity'){ctx.closeOverlay();ctx.nav('activity');return true;}
  if(action==='ray-confirm'){
    const r=rayState(ctx);if(r.view!=='proposal')return true;
    const ids=r.selected.filter(id=>eligible(ctx).includes(id));
    if(!ids.length){ctx.toast(ctx.state.paused?'Resume the agent before approving actions.':'Select an eligible action to approve.');renderRay(ctx);return true;}
    r.view='chat';r.selected=[];
    for(const id of ids){
      if(id==='intro'){ctx.state.scheduledIntro={recipientIds:INTRO_RECIPIENTS.map(b=>b.id),status:'Scheduled',scheduledFor:'2026-10-13T10:00:00+05:30'};ctx.resolve(id,'approved',{title:'Intro batch approved with Ray',buyer:'27 business buyers',cat:'messages',detail:'27 opted-in buyers scheduled for Tue 13 Oct, 10:00. '+draft(id,ctx),status:'Scheduled',by:'Approved by Neha · with Ray',manual:true,why:'You reviewed the proposed batch and explicitly approved the selected action.'});}
      if(id==='sai')ctx.resolve(id,'approved',{title:'Quote approved with Ray',buyer:'Sai Krupa PG',cat:'quotes',amount:21042,detail:'Quote sent · 50% advance ₹10,521. '+draft(id,ctx),by:'Approved by Neha · with Ray',manual:true,why:'You reviewed the proposed quote and explicitly approved the selected action.'},{id:'sai',status:'Quote sent · awaiting advance',tone:'info',groups:['quoted']});
    }
    const approved=ids.map(id=>id==='intro'?'27 introductions scheduled':'Sai Krupa PG’s ₹21,042 quote approved');
    addMessage('Approve selected actions',`<div class="ray-complete-heading">${icon('check-circle',18)}<strong>${ids.length} action${ids.length===1?'':'s'} approved</strong></div><p>${approved.map(esc).join(' and ')}. Your decision is saved in Activity.</p><p>${pending(ctx).length?`${pending(ctx).length} item${pending(ctx).length===1?' remains':'s remain'} in your queue for individual review.`:'Your approval queue is clear.'}</p><div class="ray-response-actions">${button('View activity','ray-activity')}${pending(ctx).length?actionButton('Review remaining','ray-review','','ghost'):''}</div>`,ctx);
    ctx.toast(`${ids.length} selected action${ids.length===1?'':'s'} approved`);return true;
  }
  return false;
}
