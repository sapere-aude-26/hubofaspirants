(function(window){
'use strict';
const state={version:'CORE-V2',initialized:false,productionBaseline:true,activeView:null};
const listeners=new Set();
const core={
 version:state.version,
 init(){state.initialized=true;return true;},
 getState(){return Object.freeze({...state});},
 setActiveView(view){const old=state.activeView;state.activeView=view||null;listeners.forEach(fn=>{try{fn(state.activeView,old)}catch(_){}});return state.activeView;},
 onViewChange(fn){if(typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn);},
 byId(id){return document.getElementById(id);},
 query(selector){return document.querySelector(selector);}
};
window.HOA_CORE_V2=core;
window.HOA_COMPONENT_ADAPTERS=window.HOA_COMPONENT_ADAPTERS||{};
window.HOA_COMPONENT_ADAPTERS.core=core;
})(window);
