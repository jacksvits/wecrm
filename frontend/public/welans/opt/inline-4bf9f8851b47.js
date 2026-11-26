jQuery(function(){
            jQuery("#registerform,.form-tab-rcl").on("keyup","#secondary-pass-user",function(){
                let notice = "Пароли совпадают!";
                if(jQuery("#primary-pass-user").val() !== jQuery(this).val()){
					notice = "Пароли не совпадают!";
                }
                jQuery("#notice-chek-password").html("<span class='login-error'>" + notice + "</span>");
            });});
        