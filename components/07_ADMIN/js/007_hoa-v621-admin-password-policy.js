
(function(){
  const RE=/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
  window.hoaAdminPasswordPolicy={
    minLength:6,
    validate:function(password){
      const p=String(password||"");
      return {valid:RE.test(p),length:p.length>=6,upper:/[A-Z]/.test(p),lower:/[a-z]/.test(p),special:/[^A-Za-z0-9]/.test(p)};
    }
  };
  window.hoaValidateAdminPassword=function(password){
    const r=window.hoaAdminPasswordPolicy.validate(password);
    return r.valid ? {ok:true,message:""} : {
      ok:false,
      message:"Admin password must be at least 6 characters and contain at least 1 uppercase letter, 1 lowercase letter and 1 special character."
    };
  };
  window.hoaOwnerCredentialsAreSupabaseManaged=true;
})();
