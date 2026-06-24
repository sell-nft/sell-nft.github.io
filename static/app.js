(function () {
'use strict';
var header = document.querySelector('.site-header');
var toggle = document.querySelector('.nav-toggle');
if (toggle && header) {
toggle.addEventListener('click', function () {
var open = header.classList.toggle('nav-open');
toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});
document.querySelectorAll('.site-nav a').forEach(function (a) {
a.addEventListener('click', function () { header.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); });
});
}
var widget = document.getElementById('app-widget');
if (!widget) return;
var ITEMS = [
{ name: 'Pixel Apes #1432', coll: 'Pixel Apes', g: ['#7C3AED', '#22D3EE'], floor: '2.4 ETH', offer: '2.1 ETH' },
{ name: 'Meta Foxes #0907', coll: 'Meta Foxes', g: ['#EC4899', '#F59E0B'], floor: '0.8 ETH', offer: '0.72 ETH' },
{ name: 'Neon Koi #3120', coll: 'Neon Koi', g: ['#10B981', '#3B82F6'], floor: '1.15 ETH', offer: '1.04 ETH' },
{ name: 'Glass Orbs #0044', coll: 'Glass Orbs', g: ['#F43F5E', '#8B5CF6'], floor: '0.45 ETH', offer: '0.39 ETH' }
];
var art = widget.querySelector('.nft-art');
var name = widget.querySelector('.nft-name');
var coll = widget.querySelector('.nft-coll');
var floor = widget.querySelector('[data-floor]');
var offer = widget.querySelector('[data-offer]');
var card = widget.querySelector('.nft-card');
var i = 0;
function render() {
var it = ITEMS[i];
if (art) art.style.background = 'linear-gradient(135deg,' + it.g[0] + ',' + it.g[1] + ')';
if (name) name.textContent = it.name;
if (coll) coll.textContent = it.coll;
if (floor) floor.textContent = it.floor;
if (offer) offer.textContent = it.offer;
}
if (card) card.addEventListener('click', function () { i = (i + 1) % ITEMS.length; render(); });
render();
})();
