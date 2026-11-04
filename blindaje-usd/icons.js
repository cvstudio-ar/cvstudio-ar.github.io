'use strict';
(()=>{
 const ns='http://www.w3.org/2000/svg';
 const paths={
  '↗':'M5 19 19 5M5 5h14v14',
  '↓':'M12 4v16m-7-7 7 7 7-7',
  '←':'M20 12H4m7-7-7 7 7 7',
  '◈':'m12 3 9 9-9 9-9-9 9-9Zm0 5 4 4-4 4-4-4 4-4Z',
  '▦':'M4 5h16v16H4V5Zm0 5h16M8 3v4m8-4v4M8 14h1m6 0h1m-8 4h1m6 0h1',
  '▷':'M9 5 20 12 9 19V5Z',
  '◎':'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  '◇':'m12 3 8 4v6c0 4-4 7-8 9-4-2-8-5-8-9V7l8-4Zm-4 9 3 3 5-6'
 };
 const matcher=/[↗↓←◈▦▷◎◇]/g;
 function icon(path,large=false){const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class',large?'ui-icon ui-icon-large':'ui-icon');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width',large?'1.5':'1.7');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');const p=document.createElementNS(ns,'path');p.setAttribute('d',path);svg.append(p);return svg;}
 function upgradeText(node){if(!node.parentElement||node.parentElement.closest('svg,script,style,textarea,input,select,option,code,pre'))return;const text=node.nodeValue;matcher.lastIndex=0;if(!matcher.test(text))return;matcher.lastIndex=0;const fragment=document.createDocumentFragment();let last=0;for(const match of text.matchAll(matcher)){if(match.index>last)fragment.append(document.createTextNode(text.slice(last,match.index)));fragment.append(icon(paths[match[0]]));last=match.index+match[0].length;}if(last<text.length)fragment.append(document.createTextNode(text.slice(last)));node.replaceWith(fragment);}
 function upgrade(root){if(root.nodeType===Node.TEXT_NODE){upgradeText(root);return;}if(root.nodeType!==Node.ELEMENT_NODE||root.matches('svg,script,style,textarea,input,select,option,code,pre'))return;const nodes=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(upgradeText);}
 document.querySelectorAll('.line-icon').forEach(el=>{const char=el.textContent.trim();let path=paths[char];if(char==='♡')path='M20.8 4.8a5.4 5.4 0 0 0-7.6 0L12 6l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z';if(char==='✚')path='M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z';if(path)el.replaceChildren(icon(path,true));});
 upgrade(document.body);
 new MutationObserver(changes=>{for(const change of changes)for(const node of change.addedNodes)upgrade(node);}).observe(document.body,{childList:true,subtree:true});
})();
