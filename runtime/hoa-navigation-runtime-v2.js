(function(window){
'use strict';
const adapters=window.HOA_COMPONENT_ADAPTERS=window.HOA_COMPONENT_ADAPTERS||{};
const core=window.HOA_CORE_V2||adapters.core;
function delegate(names,args){
 for(const name of names){
  const fn=window[name];
  if(typeof fn==='function') return fn.apply(window,args);
 }
 return undefined;
}
const navigation={
 version:'NAV-V2', mode:'delegating',
 showFrontPage(){const r=delegate(['hoaShowFrontPage','showFrontPage'],[]);if(core)core.setActiveView('front');return r;},
 openPortal(type){const r=delegate(['hoaOpenPortal','openPortal'],[type]);if(core)core.setActiveView(type||'portal');return r;},
 openLogin(mode){const r=delegate(['hoaOpenLogin','openLogin'],[mode]);if(core)core.setActiveView('login');return r;},
 currentView(){return core?core.getState().activeView:null;}
};
adapters.navigation=navigation;
window.HOA_NAVIGATION_V2=navigation;
})(window);
