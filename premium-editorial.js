/* OpenLens editorial design accents — view-only enhancements; never changes source data. */
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined')return;
const link=document.createElement('link');link.rel='stylesheet';link.href='/premium-editorial.css?v=20261112owners3';
document.head.append(link);
const currentEdition=()=>{
 try{return new Intl.DateTimeFormat('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date())}
 catch{return new Date().toLocaleDateString('nl-NL')}
};
function decorate(){
 const brand=document.querySelector('.ol-unified-brand small');
 if(brand)brand.textContent='De nieuwsvergelijker';
 const hero=document.querySelector('.ol-newsroom-hero');
 if(hero){
  const head=hero.querySelector('h1');
  if(head)head.innerHTML='Voorbij de <em>kop.</em>';
  const lead=hero.querySelector('p');
  if(lead)lead.textContent='Eén gebeurtenis. Meerdere redacties. Vergelijk de berichtgeving, ontdek verschillen en vorm je eigen oordeel.';
  const kicker=hero.querySelector('.ol-newsroom-kicker');
  if(kicker)kicker.textContent='OPENLENS  /  ONAFHANKELIJKE NIEUWSVERGELIJKING';
  const main=hero.firstElementChild;
  if(main&&!main.querySelector('.ol-editorial-edition')){
   const strip=document.createElement('div');strip.className='ol-editorial-edition';
   const edition=document.createElement('span');edition.textContent='Editie Nederland · Europa · Wereld';
   const date=document.createElement('span');date.textContent=currentEdition();
   strip.append(edition,date);kicker?.after(strip);
  }
 }
 const newsroom=document.querySelector('.ol-newsroom');
 if(newsroom){
  const topic=newsroom.querySelector('.ol-topic-hub-top span');
  if(topic)topic.textContent='Kies een onderwerp · Bekijk de bronnen · Vergelijk de verschillen';
  const toolbar=newsroom.querySelector('.ol-newsroom-toolbar');
  if(toolbar&&!toolbar.querySelector('.ol-editorial-index')){
   const index=document.createElement('div');index.className='ol-editorial-index';
   const lead=document.createElement('strong');lead.textContent='HET NIEUWS';
   const count=document.createElement('span');count.textContent=(typeof filterStories==='function'?filterStories().length:0)+' verhalen in deze selectie';
   index.append(lead,count);toolbar.prepend(index);
  }
  const cards=[...newsroom.querySelectorAll('.ol-feed-card')];
  cards.forEach((card,i)=>{
   const cover=card.querySelector('.ol-card-cover');
   if(cover&&!cover.querySelector('.ol-image-number')){
    const number=document.createElement('span');number.className='ol-image-number';
    number.textContent='OL  /  '+String(i+1).padStart(2,'0');
    cover.append(number);
   }
   const date=card.querySelector('.ol-feed-time');
   if(date)date.setAttribute('title','Nieuwste beschikbare feed-, publicatie- of indexeringsdatum');
  });
 }
 const reader=document.querySelector('.ol-reader');
 if(reader){
  const head=reader.querySelector('.ol-reader-hero .ol-newsroom-kicker');
  if(head)head.textContent='OPENLENS  /  VERHAALDOSSIER';
 }
 const pubs=document.querySelector('.ol-dir-page');
 if(pubs){
  const kicker=pubs.querySelector('.ol-dir-kicker');if(kicker)kicker.textContent='OPENLENS  /  PUBLISHER INTELLIGENCE';
 }
}
const prev=render;
render=function(){prev();decorate()};
decorate();
})();