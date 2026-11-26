window._wca = window._wca || [];
;
!function(){if(window.VK||(window.VK={}),!VK.Share){var t=document.getElementsByTagName("head")[0],e=function(t,e){return t.replace(/\{(\w+?)\}/g,(function(t,o){return void 0!==e[o]?e[o]:""}))};VK.Share={_popups:[],_gens:[],_base_domain:"//vk.com/",_maxCommentLength:4096,_ge:function(t){return document.getElementById(t)},button:function(o,n,i){o||(o={}),o===o.toString()&&(o={url:o.toString()}),o.url||(o.url=VK.Share._loc),o.url=(o.url||"").replace(/"/g,""),o.comment=o.comment||"",o.comment.length>this._maxCommentLength&&(o.comment=o.comment.substr(0,this._maxCommentLength-3).trim()+"..."),n||(n={type:"round"}),n===n.toString()&&(n={type:"round",text:n}),n.text||(n.text="Сохранить");var r=!0,s="display: none;";if(void 0===i?(o.count=0,o.shared="button"!=n.type&&"round"!=n.type,this._gens.push(o),this._popups.push(!1),i=this._popups.length-1,r=!1):(!(o.count=this._gens[i].count)||"button"!=n.type&&"round"!=n.type||(s=""),o.shared=this._gens[i].shared,this._gens[i]=o),!r&&("button"==n.type||"round"==n.type)){var a=document.createElement("script");a.src=this._base_domain+"share.php?act=count&index="+i+"&url="+encodeURIComponent(o.url),t.appendChild(a)}var d="-webkit-border-radius:{v};-moz-border-radius:{v};border-radius:{v};",c={cssreset:"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;",domain:this._base_domain,table:'<table cellspacing="0" cellpadding="0" style="position: relative; cursor: pointer; width: auto; line-height: normal; border: 0; direction: ltr;" ',is2x:window.devicePixelRatio>=2?"_2x":"",i:i,a2:"</a>",td2:"</td>",font:"font: 400 12px Arial, Helvetica, sans-serif;letter-spacing: 0.1px;text-shadow: none;",radiusl:e(d,{v:"2px 0px 0px 2px"}),radiusr:e(d,{v:"0px 2px 2px 0px"}),radius:e(d,{v:"2px"}),text:n.text,acolor:"color: #33567f;",bg:"background: #6287AE;-webkit-transition: background 200ms linear;transition: background 200ms linear;"};return c.td1=e('<td style="vertical-align: middle;{font}{cssreset}">',c),c.a=e('<a href="{domain}share.php?url='+encodeURIComponent(o.url)+'" onmouseup="this._btn=event.button;this.blur();" onclick="return VK.Share.click({i}, this);"',c),c.a1=e('{a} style="{acolor}text-decoration: none;{font}line-height: 16px;{cssreset}">',c),c.a3=e('{a} style="display: inline-block;text-decoration: none;{cssreset}">',c),c.sprite=e("background-size: 19px 59px;background-image: url('{domain}images/icons/like_widget{is2x}.png');",c),c.logo=e("<div style=\"background-image: url('{domain}images/svg_icons/widgets/widgets_logo_letters.svg');background-repeat:no-repeat;background-position:center;height: 16px;width: 15px;{cssreset}\"></div>",c),"round"==n.type||"round_nocount"==n.type||"button"==n.type||"button_nocount"==n.type?e('{table}id="vkshare{i}" onmouseover="VK.Share.change(1, {i});" onmouseout="VK.Share.change(0, {i});" onmousedown="VK.Share.change(2, {i});" onmouseup="VK.Share.change(1, {i});"><tr style="line-height: normal;">{td1}{a} style="border: 0;display: block;{bg}{radiusl}padding: 2px 6px 4px;{cssreset}">{logo}{a2}{td2}{td1}{a} style="color: #FFF;text-decoration: none;border: 0;{bg}{radiusr}{font}line-height: 16px;display:block;padding: 2px 6px 4px 0;height: 16px;{cssreset}">{text}{a2}{td2}'+("round"==n.type||"button"==n.type?'{td1}{a} style="text-decoration: none;{font}line-height: 15px;-webkit-font-smoothing: subpixel-antialiased;'+s+'{cssreset}"><div style="{sprite};background-position: 0 -49px;margin: 5px 0 0 4px;width: 5px; height: 10px;position: absolute; z-index:100;{cssreset}"></div><div id="vkshare_cnt{i}" style="border: 1px solid #adbdcc;background: #FFF;font-size:11px;padding: 2px 5px;margin-left: 8px;color: #55677d;z-index: 99;{radius}{cssreset}">'+o.count+"</div>{a2}{td2}":"")+"</tr></table>",c):"link"==n.type?e('{table}onmouseover="this.rows[0].cells[1].firstChild.style.textDecoration=\'underline\'" onmouseout="this.rows[0].cells[1].firstChild.style.textDecoration=\'none\'"><tr style="line-height: normal;">{td1}{a1}<img src="{domain}images/svg_icons/widgets/widgets_logo.svg" width="16" height="16" style="vertical-align: top;margin-right: 8px;"/>{a2}{td2}{td1}{a1}{text}{a2}{td2}</tr></table>',c):"link_noicon"==n.type?e('{a3}<span style="{acolor}position: relative;{font}line-height: normal;{cssreset}" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">{text}</span>{a2}',c):e('{a3}<span style="position: relative;padding: 0;{cssreset}">{text}</span>{a2}',c)},change:function(t,e){var o=this._ge("vkshare"+e),n=["#6287AE","#678EB4","#5D7FA4"][t],i=[o.rows[0].cells[0].firstChild,o.rows[0].cells[1].firstChild];for(var r in i)i[r].style.backgroundColor=n,i[r].style.color="#FFF",2==t?(i[r].style.paddingTop="3px",i[r].style.paddingBottom="3px"):(i[r].style.paddingTop="2px",i[r].style.paddingBottom="4px")},click:function(t,e){var o=window.event;if(o&&(!o.which&&e._btn&&(o.which=1&e._btn?1:2&e._btn?3:4&e._btn?2:0),2==o.which))return!0;var n=this._gens[t];n.shared||(VK.Share.count(t,n.count+1),n.shared=!0),undefined===n.noparse&&(n.noparse=n.title&&n.description&&n.image),n.noparse=n.noparse?1:0;for(var i={},r=["title","description","image","noparse","comment"],s=0;s<r.length;++s)n[r[s]]&&(i[r[s]]=n[r[s]]);var a="_blank",d=Math.max(0,(screen.width-650)/2),c=Math.max(0,(screen.height-610)/2),l=this._base_domain+"share.php?url="+encodeURIComponent(n.url),p="width=650,height=610,left="+d+",top="+c+",menubar=0,toolbar=0,location=0,status=0",h=!1;try{var u="",g="";try{u=document.domain,g=location.host}catch(o){}if(u!=g){var m=navigator.userAgent.toLowerCase();if(!/opera/i.test(m)&&/msie/i.test(m))throw"wont work"}h=this._popups[t]=window.open("",a,p);var x='<form accept-charset="UTF-8" action="'+l+'" method="POST" id="share_form">';for(var s in i)x+='<input type="hidden" name="'+s+'" value="'+i[s].toString().replace(/"/g,"&myquot;").replace(/&quot/gi,"&myquot")+'" />';x+="</form>",x='<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en"><head><meta http-equiv="content-type" content="text/html; charset=windows-1251" /></head><body>'+(x+='<script type="text/javascript">document.getElementById("share_form").submit()<\/script>')+"</body></html>",h.document.write(x),h.focus()}catch(o){try{for(var s in h&&h.close(),l+="?",i)l+=encodeURIComponent(s)+"="+encodeURIComponent(i[s])+"&";(h=this._popups[t]=window.open(l,a,p)).focus()}catch(o){}}return!1},count:function(t,e){this._gens[t].count=e;var o=this._ge("vkshare"+t);if(o){var n=this._ge("vkshare_cnt"+t);n&&(e&&(n.innerHTML=e),o.rows[0].cells[2].firstChild.style.display=e?"block":"none")}}};try{VK.Share._loc=location.toString()}catch(t){VK.Share._loc="https://vk.com/"}}}();try{window.stManager&&stManager.done("api/share.js")}catch(t){}
;
var IS_CLIENT_SIDE="undefined"!=typeof window,IS_ANDROID_WEBVIEW=Boolean(IS_CLIENT_SIDE&&window.AndroidBridge),IS_IOS_WEBVIEW=Boolean(IS_CLIENT_SIDE&&window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.VKWebAppClose),IS_WEB=IS_CLIENT_SIDE&&!IS_ANDROID_WEBVIEW&&!IS_IOS_WEBVIEW,androidBridge=IS_CLIENT_SIDE?window.AndroidBridge:void 0,iosBridge=IS_IOS_WEBVIEW?window.webkit.messageHandlers:void 0;function _bridgeSend(e,t){androidBridge&&androidBridge[e]?androidBridge[e](JSON.stringify(t)):iosBridge&&iosBridge[e]&&"function"==typeof iosBridge[e].postMessage&&iosBridge[e].postMessage(t)}function _bridgeSupports(e){return IS_ANDROID_WEBVIEW?androidBridge&&"function"==typeof androidBridge[e]:!!IS_IOS_WEBVIEW&&(iosBridge&&iosBridge[e]&&"function"==typeof iosBridge[e].postMessage)}var IS_BRIDGE_AVAILABLE=!IS_WEB&&_bridgeSupports("VKWebAppConversionHit");function getBaseDomain(){var e="vk.com";try{var t=document.currentScript?.src;if(t)e=new URL(t).hostname.split(".").slice(-2).join(".")}catch(t){return console.warn("Failed to resolve script domain: ",t),e}return e}if(function(e){if(!e.fastXDM){var t={},o={},i=[],n={};e.fastXDM={_id:0,helperUrl:`https://${getBaseDomain()}/js/api/xdmHelper.js`,Server:function(o,i,n){this.methods=o||{},this.filter=i,this.options=n||{},this.id=e.fastXDM._id++,this.key=function(){for(var e="",t=0;t<5;t++)e+=Math.ceil(15*Math.random()).toString(16);return e}(),this.frameName="fXD"+this.key,this.server=!0,this.methods["%init%"]=this.methods.__fxdm_i=function(){d((function(t){for(var o in this.methods)if(this.methods[o]instanceof e.fastXDM.Server){var i=this.methods[o];"p"===t.protocol&&t.send(this,t.json.stringify(["%proxy%",[o,i.key]])),this.methods[o]=function(){this.callMethod.apply(this,arguments)}.bind(i)}}),this),e.fastXDM.run(this.id),this.methods.onInit&&this.methods.onInit()},t[this.key]=[p,this]},Client:function(i,n){if(this.methods=i||{},this.options=n||{},this.id=e.fastXDM._id++,this.client=!0,e.fastXDM.run(this.id),0!==window.name.indexOf("fXD"))throw Error("Wrong window.name property.");this.key=window.name.substring(3,8),this.caller=window.parent,o[this.key]||(o[this.key]={}),this.methods["%proxy%"]=function(e,t){e&&t&&this.caller.frames["fXD"+t]&&(o[this.key][e]={key:t,frame:{contentWindow:this.caller.frames["fXD"+t]}})}.bind(this),t[this.key]=[p,this],e.fastXDM.on("helper",(function(){e.fastXDM.onClientStart(this)}),this),d((function(e){e.send(this,e.json.stringify(["%init%"]));var t=this.methods;setTimeout((function(){t.onInit&&t.onInit()}),0)}),this)},onMessage:function(e){var o=e.data;if(!o)return!1;if("string"!=typeof o&&!(o instanceof String))return!1;var i=o.substr(0,5);if(t[i]){var n=t[i][1];!n||n.filter&&!n.filter(e.origin)||t[i][0](o.substr(6),n,e.origin)}},setJSON:function(e){n.json=e},getJSON:function(e){if(!e)return n.json;d((function(t){e(t.json)}))},getProxyToServer:function(e,t){return o[e]&&o[e][t]},setEnv:function(e){for(var t in e)n[t]=e[t];l()},_q:{},on:function(e,t,o){this._q[e]||(this._q[e]=[]),-1==this._q[e]?t.apply(o):this._q[e].push([t,o])},run:function(e){for(var t=(this._q[e]||[]).length,o=0;o<t;o++)this._q[e][o][0].apply(this._q[e][o][1]);this._q[e]=-1},waitFor:r},e.fastXDM.Server.prototype.start=function(t,o){if(t.contentWindow)this.caller=t.contentWindow,this.frame=t,e.fastXDM.on("helper",(function(){e.fastXDM.onServerStart(this)}),this);else{var i=this;(o=o||0)<50&&setTimeout((function(){i.start.apply(i,[t,o+1])}),100)}},e.fastXDM.Server.prototype.destroy=function(){delete t[this.key]},e.fastXDM.Server.prototype.append=function(e,t,o){var i=document.createElement("DIV");i.innerHTML='<iframe name="'+this.frameName+'" '+(o||"")+"></iframe>";var n=i.firstChild,r=this;return setTimeout((function(){n.frameBorder="0",t&&u(n,t),e.insertBefore(n,e.firstChild),r.start(n)}),0),n},e.fastXDM.Client.prototype.callMethod=e.fastXDM.Server.prototype.callMethod=function(){for(var t=Array.prototype.slice.call(arguments),o=t.shift(),i=0,n=t.length;i<n;i++)if("function"==typeof t[i]){this.funcsCount=(this.funcsCount||0)+1;var s=t[i],l="_func"+this.funcsCount;this.methods[l]=function(){s.apply(this,arguments),delete this.methods[l]},t[i]={_func:this.funcsCount}}else this.options.safe&&(t[i]=a(t[i],!1));r(this,"caller",(function(){e.fastXDM.on(this.id,(function(){d((function(i){var n=this,r=e.fastXDM.getProxyToServer(this.key,o);r&&(n=r,o=t.shift()),i.send(n,i.json.stringify([o,t]))}),this)}),this)}),this)},e.fastXDM.Client.prototype.isUnsafeMethod=e.fastXDM.Server.prototype.isUnsafeMethod=function(e){return~["%proxy%","%init%"].indexOf(e)||this.options.unsafeMethods&&~this.options.unsafeMethods.indexOf(e)},e.JSON&&"object"==typeof e.JSON&&e.JSON.parse&&e.JSON.stringify&&'{"a":[1,2,3]}'===e.JSON.stringify({a:[1,2,3]}).replace(/ /g,"")?n.json={parse:e.JSON.parse,stringify:e.JSON.stringify}:e.fastXDM._needJSON=!0,e.postMessage?(n.protocol="p",n.send=function(e,t){var o=e.frame?e.frame.contentWindow:e.caller;if(o)try{o.postMessage(e.key+":"+t,"*")}catch(i){window.postMessage.call(o,e.key+":"+t,"*")}},e.addEventListener?e.addEventListener("message",e.fastXDM.onMessage,!1):e.attachEvent("onmessage",e.fastXDM.onMessage),e.fastXDM._needJSON?(e.fastXDM._onlyJSON=!0,s()):l()):s()}function r(e,t,o,i,n){e[t]?o.apply(i):(n=n||0)<1e3&&setTimeout((function(){r(e,t,o,i,n+1)}),0)}function s(t){setTimeout((function(){var o=document.createElement("script");o.type="text/javascript",o.src=t||e.fastXDM.helperUrl,r(document,"body",(function(){document.getElementsByTagName("HEAD")[0].appendChild(o)}))}),0)}function a(e,t){var o;switch(typeof e){case"string":o=t?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):e.replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&");break;case"object":if("[object Array]"===Object.prototype.toString.apply(e)){o=[];for(var i=0,n=e.length;i<n;i++)o[i]=a(e[i],t)}else for(var r in o={},e)Object.hasOwnProperty.call(e,r)&&(o[r]=a(e[r],t));break;default:o=e}return o}function d(e,t){n.loaded?e.apply(t,[n]):i.push([t,e])}function l(){n.loaded=!0;for(var e=0,t=i.length;e<t;e++)i[e][1].apply(i[e][0],[n])}function p(t,o,i){d((function(n){var r=n.json.parse(t),s=r[0];if(s){if("p"===n.protocol&&o.options.sameOrigin&&i!==e.origin&&!o.isUnsafeMethod(s))throw Error("Insecure method call.");r[1]||(r[1]=[]);for(var d=0,l=r[1].length;d<l;d++)if(r[1][d]&&r[1][d]._func){var p=r[1][d]._func;r[1][d]=function(){var e=Array.prototype.slice.call(arguments);e.unshift("_func"+p),o.callMethod.apply(o,e)}}else o.options.safe&&(r[1][d]=a(r[1][d],!0));setTimeout((function(){if(!o.methods[s])throw Error("fastXDM: Method "+s+" is undefined");o.methods[s].apply(o,r[1])}),0)}}))}function u(e,t){for(var o in t)e[o]&&"object"==typeof e[o]?u(e[o],t[o]):e[o]=t[o]}}(window),window.VK||(window.VK={}),VK.MD5||(VK.MD5=function(e){var t,o=function(e,t){var o=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(o>>16)<<16|65535&o},i=function(e,t,i,n,r,s){return o(function(e,t){return e<<t|e>>>32-t}(o(o(t,e),o(n,s)),r),i)},n=function(e,t,o,n,r,s,a){return i(t&o|~t&n,e,t,r,s,a)},r=function(e,t,o,n,r,s,a){return i(t&n|o&~n,e,t,r,s,a)},s=function(e,t,o,n,r,s,a){return i(t^o^n,e,t,r,s,a)},a=function(e,t,o,n,r,s,a){return i(o^(t|~n),e,t,r,s,a)};return function(e){for(var t,o="0123456789abcdef",i="",n=0,r=e.length;n<r;n++)t=e.charCodeAt(n),i+=o.charAt(t>>>4&15)+o.charAt(15&t);return i}(function(e){for(var t="",o=0,i=32*e.length;o<i;o+=8)t+=String.fromCharCode(e[o>>5]>>>o%32&255);return t}(function(e,t){var i,d,l,p,u=1732584193,c=-271733879,h=-1732584194,f=271733878;e[t>>5]|=128<<t%32,e[14+(t+64>>>9<<4)]=t;for(var g=0,m=e.length;g<m;g+=16)i=u,d=c,l=h,p=f,u=n(u,c,h,f,e[g+0],7,-680876936),f=n(f,u,c,h,e[g+1],12,-389564586),h=n(h,f,u,c,e[g+2],17,606105819),c=n(c,h,f,u,e[g+3],22,-1044525330),u=n(u,c,h,f,e[g+4],7,-176418897),f=n(f,u,c,h,e[g+5],12,1200080426),h=n(h,f,u,c,e[g+6],17,-1473231341),c=n(c,h,f,u,e[g+7],22,-45705983),u=n(u,c,h,f,e[g+8],7,1770035416),f=n(f,u,c,h,e[g+9],12,-1958414417),h=n(h,f,u,c,e[g+10],17,-42063),c=n(c,h,f,u,e[g+11],22,-1990404162),u=n(u,c,h,f,e[g+12],7,1804603682),f=n(f,u,c,h,e[g+13],12,-40341101),h=n(h,f,u,c,e[g+14],17,-1502002290),c=n(c,h,f,u,e[g+15],22,1236535329),u=r(u,c,h,f,e[g+1],5,-165796510),f=r(f,u,c,h,e[g+6],9,-1069501632),h=r(h,f,u,c,e[g+11],14,643717713),c=r(c,h,f,u,e[g+0],20,-373897302),u=r(u,c,h,f,e[g+5],5,-701558691),f=r(f,u,c,h,e[g+10],9,38016083),h=r(h,f,u,c,e[g+15],14,-660478335),c=r(c,h,f,u,e[g+4],20,-405537848),u=r(u,c,h,f,e[g+9],5,568446438),f=r(f,u,c,h,e[g+14],9,-1019803690),h=r(h,f,u,c,e[g+3],14,-187363961),c=r(c,h,f,u,e[g+8],20,1163531501),u=r(u,c,h,f,e[g+13],5,-1444681467),f=r(f,u,c,h,e[g+2],9,-51403784),h=r(h,f,u,c,e[g+7],14,1735328473),c=r(c,h,f,u,e[g+12],20,-1926607734),u=s(u,c,h,f,e[g+5],4,-378558),f=s(f,u,c,h,e[g+8],11,-2022574463),h=s(h,f,u,c,e[g+11],16,1839030562),c=s(c,h,f,u,e[g+14],23,-35309556),u=s(u,c,h,f,e[g+1],4,-1530992060),f=s(f,u,c,h,e[g+4],11,1272893353),h=s(h,f,u,c,e[g+7],16,-155497632),c=s(c,h,f,u,e[g+10],23,-1094730640),u=s(u,c,h,f,e[g+13],4,681279174),f=s(f,u,c,h,e[g+0],11,-358537222),h=s(h,f,u,c,e[g+3],16,-722521979),c=s(c,h,f,u,e[g+6],23,76029189),u=s(u,c,h,f,e[g+9],4,-640364487),f=s(f,u,c,h,e[g+12],11,-421815835),h=s(h,f,u,c,e[g+15],16,530742520),c=s(c,h,f,u,e[g+2],23,-995338651),u=a(u,c,h,f,e[g+0],6,-198630844),f=a(f,u,c,h,e[g+7],10,1126891415),h=a(h,f,u,c,e[g+14],15,-1416354905),c=a(c,h,f,u,e[g+5],21,-57434055),u=a(u,c,h,f,e[g+12],6,1700485571),f=a(f,u,c,h,e[g+3],10,-1894986606),h=a(h,f,u,c,e[g+10],15,-1051523),c=a(c,h,f,u,e[g+1],21,-2054922799),u=a(u,c,h,f,e[g+8],6,1873313359),f=a(f,u,c,h,e[g+15],10,-30611744),h=a(h,f,u,c,e[g+6],15,-1560198380),c=a(c,h,f,u,e[g+13],21,1309151649),u=a(u,c,h,f,e[g+4],6,-145523070),f=a(f,u,c,h,e[g+11],10,-1120210379),h=a(h,f,u,c,e[g+2],15,718787259),c=a(c,h,f,u,e[g+9],21,-343485551),u=o(u,i),c=o(c,d),h=o(h,l),f=o(f,p);return[u,c,h,f]}(function(e){var t,o,i=Array(e.length>>2);for(t=0,o=i.length;t<o;t++)i[t]=0;for(t=0,o=8*e.length;t<o;t+=8)i[t>>5]|=(255&e.charCodeAt(t/8))<<t%32;return i}(t=function(e){for(var t,o,i="",n=-1,r=e.length;++n<r;)t=e.charCodeAt(n),o=n+1<r?e.charCodeAt(n+1):0,55296<=t&&t<=56319&&56320<=o&&o<=57343&&(t=65536+((1023&t)<<10)+(1023&o),n++),t<=127?i+=String.fromCharCode(t):t<=2047?i+=String.fromCharCode(192|t>>>6&31,128|63&t):t<=65535?i+=String.fromCharCode(224|t>>>12&15,128|t>>>6&63,128|63&t):t<=2097151&&(i+=String.fromCharCode(240|t>>>18&7,128|t>>>12&63,128|t>>>6&63,128|63&t));return i}(e)),8*t.length)))}),VK.extend=function(e,t,o){for(var i in t)(o||void 0===e[i])&&(e[i]=t[i]);return e},VK.extend(VK,{_domain:{base:`https://${getBaseDomain()}`,login:`https://login.${getBaseDomain()}`,main:`https://oauth.${getBaseDomain()}`,api:`https://api.${getBaseDomain()}`}},!0),VK.xdConnectionCallbacks)setTimeout((function(){for(var e;e=VK.xdConnectionCallbacks.pop();)e()}),0),VK.Widgets&&!VK.Widgets._constructor&&(VK.Widgets=!1);else{function obj2qs(e){if(!e)return"";var t=[];for(var o in e)e.hasOwnProperty(o)&&t.push(encodeURIComponent(o)+"="+encodeURIComponent(e[o].toString()||""));return t.length?"?"+t.join("&"):""}VK.extend(VK,{version:1,_apiId:null,_session:null,_userStatus:"unknown",_path:{login:"authorize",proxy:"fxdm_oauth_proxy.html"},_rootId:"vk_api_transport",_nameTransportPath:"",xdReady:!1,access:{FRIENDS:2,PHOTOS:4,AUDIO:8,VIDEO:16,MATCHES:32,QUESTIONS:64,WIKI:128}}),VK.init=function(e){var t,o;if(VK._apiId=null,!e.apiId)throw Error("VK.init() called without an apiId");if(VK._apiId=e.apiId,e.onlyWidgets)return!0;e.nameTransportPath&&""!==e.nameTransportPath&&(VK._nameTransportPath=e.nameTransportPath),(o=document.getElementById(VK._rootId))||((o=document.createElement("div")).id=VK._rootId,(t=document.body).insertBefore(o,t.childNodes[0])),o.style.position="absolute",o.style.top="-10000px";var i=VK.Cookie.load();i&&(VK.Auth._loadState="loaded",VK.Auth.setSession(i,i?"connected":"unknown"))},VK.Cookie||(VK.Cookie={_domain:null,load:function(){var e,t=document.cookie.match("\\bvk_app_"+VK._apiId+"=([^;]*)\\b");if(t){if("oauth"!=(e=this.decode(t[1])).secret)return!1;e.expire=parseInt(e.expire,10),VK.Cookie._domain="."+window.location.hostname}return e},setRaw:function(e,t,o,i){var n;n="vk_app_"+VK._apiId+"="+e;var r=i?(new Date).getTime()+1e3*i:1e3*t;n+=e&&0===t?"":"; expires="+new Date(r).toGMTString(),n+="; path=/",n+=o?"; domain=."+o:"",document.cookie=n,this._domain=o},set:function(e,t){e?this.setRaw(this.encode(e),e.expire,window.location.hostname,(t||{}).time):this.clear()},clear:function(){this.setRaw("",0,this._domain,0)},encode:function(e){var t,o=[];for(t in e)"user"!=t&&o.push(encodeURIComponent(t)+"="+encodeURIComponent(e[t]));return o.sort(),o.join("&")},decode:function(e){var t,o,i={},n=e.split("&");for(t=0;t<n.length;t++)(o=n[t].split("=",2))&&o[0]&&(i[decodeURIComponent(o[0])]=decodeURIComponent(o[1]));return i}}),VK.Api||(VK.Api={_headId:null,_callbacks:{},ie6_7:function(){return VK.Api.ieTested||(VK.Api.isIE6_7=navigator.userAgent.match(/MSIE [6|7]/i),VK.Api.ieTested=!0),VK.Api.isIE6_7},supportCORS:function(){return"withCredentials"in new XMLHttpRequest||"undefined"!=typeof XDomainRequest},makeRequest:function(e,t){var o=VK.Api.createRequest("GET",e);return!!o&&(o.onload=function(){var e=o.responseText;if(200===o.status)t(e);else try{console.error("Open api access error",o.response)}catch(e){}},o.onerror=function(){try{console.error("Open api access error")}catch(e){}},o.send(),!0)},createRequest:function(e,t){var o=new XMLHttpRequest;return"withCredentials"in o?(o.open(e,t,!0),o.withCredentials=!0):"undefined"!=typeof XDomainRequest?((o=new XDomainRequest).open(e,t),o.withCredentials=!0):o=null,o},attachScript:function(e){VK.Api._headId||(VK.Api._headId=document.getElementsByTagName("head")[0]);var t=document.createElement("script");t.type="text/javascript",t.setAttribute("encoding","UTF-8"),t.src=e,VK.Api._headId.appendChild(t)},checkMethod:function(e,t,o,i){var n=e.toLowerCase();if("wall.post"===n){var r,s,a,d,l=/(^https?:\/\/)|(^(poll|album|photo|video|doc|audio|page|note)-?\d+_-?\d+)$/,p=[];t.v||(t.v="5.95"),t.attachments=t.attachments||t.attachment||[],"string"==typeof t.attachments&&(t.attachments=t.attachments.split(","));for(var u=0;u<t.attachments.length;u++){var c=t.attachments[u].trim();l.test(c)&&p.push(c)}return t.attachments=p.length?p:"",r="_"+Math.random().toString(16).substr(2),s={act:"wall_post_box",method:n,widget:4,aid:parseInt(VK._apiId,10),text:t.message||"",method_access:r},(s=VK.extend(s,t)).owner_id=parseInt(t.owner_id||0,10),s.publish_date=t.publish_date||"",a=VK._domain.base+"/al_apps.php",a+=obj2qs(s),VK.UI.popup({url:a,width:560,height:304}),d=setInterval((function(){VK.UI.active.closed&&(clearInterval(d),t.method_access=r,VK.Api.call(e,t,o,i))}),500),!1}return"messages.allowmessagesfromgroup"!=n||(r="_"+Math.random().toString(16).substr(2),a=VK._domain.base+"/widget_allow_messages_from_community.php?act=allow_box&group_id="+parseInt(t.group_id,10)+"&app_id="+parseInt(VK._apiId,10)+"&method_access="+r,VK.UI.popup({url:a,width:560,height:304}),d=setInterval((function(){VK.UI.active.closed&&(clearInterval(d),t.method_access=r,VK.Api.call(e,t,o,i))}),500),!1)},call:function(e,t,o,i){var n,r,s=t||{};if("object"!=typeof s||"function"!=typeof o)return!1;if(t.method_access||t.method_force||VK.Api.checkMethod(e,t,o,i)){if(i||(i=0),"loaded"!=VK.Auth._loadState){var a=function(i){i&&i.session&&(VK.Observer.unsubscribe("auth.loginStatus",a),VK.Api.call(e,t,o))};return VK.Observer.subscribe("auth.loginStatus",a),void VK.Auth.getLoginStatus()}if(VK.Api.queryLength(s)<1500&&!VK.Api.ie6_7()){for(var d=!1,l=parseInt(1e7*Math.random(),10);VK.Api._callbacks[l];)l=parseInt(1e7*Math.random(),10);s.callback="VK.Api._callbacks["+l+"]"}else d=!0;VK._session&&VK._session.sid&&(s.access_token=VK._session.sid),n=VK.Cookie.encode(s),r=function(n){if(!n.error||3!=n.error.error_code&&4!=n.error.error_code&&5!=n.error.error_code)o(n);else{if(i>3)return!1;var r=function(n){VK.Observer.unsubscribe("auth.sessionChange",r),delete t.access_token,n.session&&VK.Api.call(e,t,o,i+1)};VK.Observer.subscribe("auth.sessionChange",r),VK.Auth.getLoginStatus()}d||delete VK.Api._callbacks[l]},d?VK.xdReady?VK.XDM.remote.callMethod("apiCall",e,n,r):(VK.Observer.subscribe("xdm.init",(function(){VK.XDM.remote.callMethod("apiCall",e,n,r)})),VK.XDM.init()):(VK.Api._callbacks[l]=r,VK.Api.attachScript(VK._domain.api+"/method/"+e+"?"+n))}},queryLength:function(e){var t,o=100;for(t in e)o+=t.length+encodeURIComponent(e[t]).length+1;return o}},VK.api=function(e,t,o){VK.Api.call(e,t,o)}),VK.Auth||(VK.Auth={popup:null,lsCb:{},setSession:function(e,t,o,i){var n=!VK._session&&e,r=VK._session&&!e,s=VK._session&&e&&VK._session.mid!=e.mid,a=n||r||VK._session&&e&&VK._session.sid!=e.sid,d=t!=VK._userStatus,l={session:e,status:t,settings:o};return VK._session=e,VK._userStatus=t,VK.Cookie.set(e,i),(a||d||s)&&setTimeout((function(){d&&VK.Observer.publish("auth.statusChange",l),(r||s)&&VK.Observer.publish("auth.logout",l),(n||s)&&VK.Observer.publish("auth.login",l),a&&VK.Observer.publish("auth.sessionChange",l)}),0),l},login:function(e,t){if(!VK._apiId)return!1;var o=VK._domain.main+"/"+VK._path.login+"?client_id="+VK._apiId+"&display=popup&redirect_uri=close.html&response_type=token&openapi=1";t&&parseInt(t,10)>0&&(o+="&scope="+t),VK.Observer.unsubscribe("auth.onLogin"),VK.Observer.subscribe("auth.onLogin",e),VK.UI.popup({width:665,height:370,url:o});var i=function(){VK.Auth.getLoginStatus((function(e){VK.Observer.publish("auth.onLogin",e),VK.Observer.unsubscribe("auth.onLogin")}),!0)};VK.UI.popupOpened=!0;var n=function(){if(!VK.UI.popupOpened)return!1;try{if(!VK.UI.active.top||VK.UI.active.closed)return VK.UI.popupOpened=!1,i(),!0}catch(e){return VK.UI.popupOpened=!1,i(),!0}setTimeout(n,100)};setTimeout(n,100)},logout:function(e){VK.Auth.revokeGrants(e)},revokeGrants:function(e){var t=function(o){VK.Observer.unsubscribe("auth.statusChange",t),e&&e(o)};if(VK.Observer.subscribe("auth.statusChange",t),VK._session&&VK._session.sid){var o=VK._domain.login+"?act=openapi&oauth=1&aid="+parseInt(VK._apiId,10)+"&location="+encodeURIComponent(window.location.hostname)+"&do_logout=1&token="+VK._session.sid;if(VK.Api.supportCORS()){VK.Api.makeRequest(o+"&new=1",(function(){VK.Auth.setSession(null,"unknown")}))}else VK.Api.attachScript(o)}VK.Cookie.clear()},getSession:function(){return VK._session},getLoginStatus:function(cb,force){if(VK._apiId){if(cb){if(!force&&"loaded"==VK.Auth._loadState)return void cb({status:VK._userStatus,session:VK._session});VK.Observer.subscribe("auth.loginStatus",cb)}if(force||"loading"!=VK.Auth._loadState){VK.Auth._loadState="loading";var url=VK._domain.login+"?act=openapi&oauth=1&aid="+parseInt(VK._apiId,10)+"&location="+encodeURIComponent(window.location.hostname);if(VK.Api.supportCORS()){var loginCallback=function(response){if(this.JSON||(this.JSON={}),response="function"!=typeof JSON.parse?eval(response):JSON.parse(response),VK.Auth._loadState="loaded",response&&response.auth){var session={mid:response.user.id,sid:response.access_token,sig:response.sig,secret:response.secret,expire:response.expire};force&&(session.user=response.user);var status="connected"}else{var session=null,status=response.user?"not_authorized":"unknown";VK.Cookie.clear()}VK.Auth.setSession(session,status,!1,response),VK.Observer.publish("auth.loginStatus",{session:session,status:status}),VK.Observer.unsubscribe("auth.loginStatus")};VK.Api.makeRequest(url+"&new=1",loginCallback)}else{for(var rnd=parseInt(1e7*Math.random(),10);VK.Auth.lsCb[rnd];)rnd=parseInt(1e7*Math.random(),10);VK.Auth.lsCb[rnd]=function(e){if(delete VK.Auth.lsCb[rnd],VK.Auth._loadState="loaded",e&&e.auth){var t={mid:e.user.id,sid:e.access_token,sig:e.sig,secret:e.secret,expire:e.expire};force&&(t.user=e.user);var o="connected"}else{t=null,o=e.user?"not_authorized":"unknown";VK.Cookie.clear()}VK.Auth.setSession(t,o,!1,e),VK.Observer.publish("auth.loginStatus",{session:t,status:o}),VK.Observer.unsubscribe("auth.loginStatus")},VK.Api.attachScript(url+"&rnd="+rnd)}}}}}),VK.App||(VK.App={_appOpened:!1,_addToGroupPopup:null,open:function(e,t){!VK.App._appOpened&&VK._apiId&&(VK._session?VK.App._openApp(e,t):VK.Auth.login((function(o){o&&o.session&&VK.App._openApp(e,t)})))},_openApp:function(e,t){var o,i,n=[];if(t=t||{},e&&VK._apiId&&!VK.App._appOpened){if("[object Object]"===Object.prototype.toString.call(t.data))try{t.data=JSON.stringify(t.data)}catch(e){t.data=""}for(var r in o=VK._domain.base+"/apps?act=open_external_app_openapi&aid="+VK._apiId,t.aid=VK._apiId,t){var s="";t.hasOwnProperty(r)&&(void 0!==t[r]&&(s=encodeURIComponent(t[r])),n.push(encodeURIComponent(r)+"="+s))}o+="&url="+e,o+="&q="+encodeURIComponent(n.join("&")),i=VK.Util.Box(o,{},{closeExternalApp:function(){VK.App._result?(VK.Observer.publish("app.done",VK.App._result),VK.App._result=null):VK.Observer.publish("app.closed"),i.hide(),VK.App._appOpened=!1},externalAppDone:function(e,t){t?VK.App._result=e:(VK.Observer.publish("app.done",e),i.hide(),VK.App._appOpened=!1,VK.App._result=null)}}),i.show(),VK.App._appOpened=!0,VK.App._result=null}},addToGroup:function(e){this._addToGroupPopup&&!this._addToGroupPopup.closed||(this._onAddToGroupDone&&VK.Util.removeEvent("message",this._onAddToGroupDone,window),this._onAddToGroupDone=function(e){e.origin===VK._domain.base&&"app.addToGroup"===e.data.method&&(VK.Observer.publish("app.addToGroupDone",{app_id:e.data.app_id,group_ids:e.data.group_ids}),VK.Util.removeEvent("message",this._onAddToGroupDone,window),this._onAddToGroupDone=null)}.bind(this),window.postMessage&&VK.Util.addEvent("message",this._onAddToGroupDone,window),this._addToGroupPopup=VK.UI.popup({url:VK._domain.base+"/add_community_app.php?aid="+e,width:560,height:650}))}})}VK.UI||(VK.UI={active:null,_buttons:[],popup:function(e){var t,o=void 0!==window.screenX?window.screenX:window.screenLeft,i=void 0!==window.screenY?window.screenY:window.screenTop,n=void 0!==window.outerWidth?window.outerWidth:document.body.clientWidth,r=void 0!==window.outerHeight?window.outerHeight:document.body.clientHeight-22,s=e.width,a=e.height,d=parseInt(o+(n-s)/2,10),l=parseInt(i+(r-a)/2.5,10);return t="width="+s+",height="+a+",left="+(d=window.screen&&window.screenX&&screen.left&&screen.left>1e3?0:d)+",top="+l,this.active=window.open(e.url,"vk_openapi",t),this.active},button:function(e,t){var o;"string"==typeof e&&(e=document.getElementById(e)),this._buttons.push(e),index=this._buttons.length-1,o='<table cellspacing="0" cellpadding="0" id="openapi_UI_'+index+'" onmouseover="VK.UI._change(1, '+index+');" onmouseout="VK.UI._change(0, '+index+');" onmousedown="VK.UI._change(2, '+index+');" onmouseup="VK.UI._change(1, '+index+');" style="cursor: pointer; border: 0px; font-family: tahoma, arial, verdana, sans-serif, Lucida Sans; font-size: 10px;"><tr style="vertical-align: middle"><td><div style="border: 1px solid #3b6798;border-radius: 2px 0px 0px 2px;-moz-border-radius: 2px 0px 0px 2px;-webkit-border-radius: 2px 0px 0px 2px;"><div style="border: 1px solid #5c82ab; border-top-color: #7e9cbc; background-color: #6D8DB1; color: #fff; text-shadow: 0px 1px #45688E; height: 15px; padding: 2px 4px 0px 6px;line-height: 13px;">&#1042;&#1086;&#1081;&#1090;&#1080;</div></div></td><td><div style="background: url('+VK._domain.base+'/images/btns.png) 0px -42px no-repeat; width: 21px; height: 21px"></div></td><td><div style="border: 1px solid #3b6798;border-radius: 0px 2px 2px 0px;-moz-border-radius: 0px 2px 2px 0px;-webkit-border-radius: 0px 2px 2px 0px;"><div style="border: 1px solid #5c82ab; border-top-color: #7e9cbc; background-color: #6D8DB1; color: #fff; text-shadow: 0px 1px #45688E; height: 15px; padding: 2px 6px 0px 4px;line-height: 13px;">&#1050;&#1086;&#1085;&#1090;&#1072;&#1082;&#1090;&#1077;</div></div></td></tr></table>',e.innerHTML=o,e.style.width=e.childNodes[0].offsetWidth+"px"},_change:function(e,t){for(var o=document.getElementById("openapi_UI_"+t).rows[0],i=[o.cells[0].firstChild.firstChild,o.cells[2].firstChild.firstChild],n=0;n<2;++n){var r=i[n];0===e?(r.style.backgroundColor="#6D8DB1",r.style.borderTopColor="#7E9CBC",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderBottomColor="#5C82AB"):1==e?(r.style.backgroundColor="#7693B6",r.style.borderTopColor="#88A4C4",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderBottomColor="#6088B4"):2==e&&(r.style.backgroundColor="#6688AD",r.style.borderBottomColor="#7495B8",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderTopColor="#51779F")}0===e||2==e?o.cells[2].firstChild.style.backgroundPosition="0px -42px":1==e&&(o.cells[2].firstChild.style.backgroundPosition="0px -63px")}}),VK.XDM||(VK.XDM={remote:null,init:function(){if(this.remote)return!1;var e=VK._domain.api+"/"+VK._path.proxy;this.remote=new fastXDM.Server({onInit:function(){VK.xdReady=!0,VK.Observer.publish("xdm.init")}}),this.remote.append(document.getElementById(VK._rootId),{src:e})},xdHandler:function(code){try{eval("VK."+code)}catch(e){}}}),VK.Observer||(VK.Observer={_subscribers:function(){return this._subscribersMap||(this._subscribersMap={}),this._subscribersMap},publish:function(e){var t,o,i=Array.prototype.slice.call(arguments),n=(e=i.shift(),this._subscribers()[e]);if(n)for(t=0,o=n.length;t<o;t++)null!=n[t]&&n[t].apply(this,i)},subscribe:function(e,t){var o=this._subscribers();if("function"!=typeof t)return!1;o[e]?o[e].push(t):o[e]=[t]},unsubscribe:function(e,t){var o,i,n=this._subscribers()[e];if(!n)return!1;if("function"==typeof t)for(o=0,i=n.length;o<i;o++)n[o]==t&&(n[o]=null);else delete this._subscribers()[e]}}),VK.Widgets||(VK.Widgets={},VK.Widgets.count=0,VK.Widgets.RPC={},VK.Widgets.loading=function(e,t){e.style.background=t?'url("'+VK._domain.base+'/images/upload.gif") center center no-repeat transparent':"none"},VK.Widgets.Comments=function(e,t,o){var i=VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");t=VK.Util.parseOptions(t);document.getElementById(e);var n,r={limit:t.limit||10,height:t.height||0,mini:void 0===t.mini?"auto":t.mini,norealtime:t.norealtime?1:0},s=function(){return n.callMethod("mouseUp"),!1},a=function(e){n.callMethod("mouseMove",{screenY:e.screenY})};if(t.browse)r.browse=1,r.replies=t.replies||0;else{var d=t.pageUrl||i.url;"/"==d.substr(0,1)&&(d=location.protocol+"//"+location.host+d),VK.extend(r,{page:o||0,status_publish:void 0===t.autoPublish?0:t.autoPublish,attach:void 0===t.attach?"*":t.attach?t.attach:"",url:d,title:t.pageTitle||i.title,description:t.pageDescription||i.description,image:t.pageImage||i.image})}return t.onChange&&(VK.Observer.subscribe("widgets.comments.new_comment",t.onChange),VK.Observer.subscribe("widgets.comments.delete_comment",t.onChange)),VK.Widgets._constructor("widget_comments.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:n}).show()},startDrag:function(){cursorBack=window.document.body.style.cursor,window.document.body.style.cursor="pointer",VK.Util.addEvent("mousemove",a),VK.Util.addEvent("mouseup",s)},stopDrag:function(){window.document.body.style.cursor=cursorBack,VK.Util.removeEvent("mousemove",a),VK.Util.removeEvent("mouseup",s)}},{startHeight:133,minWidth:300},(function(e,t,o){n=o}))},VK.Widgets.CommentsBrowse=function(e,t){return(t=VK.Util.parseOptions(t)).browse=1,VK.Widgets.Comments(e,t)},VK.Widgets.Recommended=function(e,t){VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");var o={limit:(t=VK.Util.parseOptions(t)).limit||5,max:t.max||0,sort:t.sort||"friend_likes",verb:t.verb||0,period:t.period||"week",target:t.target||"parent"};return VK.Widgets._constructor("widget_recommended.php",e,t,o,{},{startHeight:116+47*o.limit-15,minWidth:150})},VK.Widgets.Post=function(e,t,o,i,n){n=VK.Util.parseOptions(n);document.getElementById(e);var r,s,a={owner_id:t,post_id:o,hash:i||"",from:n?n.from:"",mode:n&&n.mode?n.mode:""};return VK.Widgets._constructor("widget_post.php",e,n,a,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:r}).show()},startDrag:function(){s=window.document.body.style.cursor,window.document.body.style.cursor="pointer"},stopDrag:function(){window.document.body.style.cursor=s}},{startHeight:90,minWidth:250},(function(e,t,o){r=o}))},VK.Widgets.TextLive=function(e,t,o,i,n){return n=VK.Util.parseOptions(n),VK.Widgets._constructor("widget_textlive.php",e,n,{textlive_id:t,textpost_id:o,hash:i||""},null,{startHeight:o?176:167,minWidth:320})},VK.Widgets.Like=function(e){if(e)return e;var t=[];return e=function(e,o,i){var n=VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");var r,s,a,d,l,p,u={18:43,20:47,22:51,24:55,30:67},c="full"==(o=VK.extend(VK.Util.parseOptions(o),{allowTransparency:!0})).type||"button"==o.type||"vertical"==o.type||"mini"==o.type?o.type:"full",h="auto"===o.width&&("button"==c||"mini"==c),f=parseInt(o.height,10)||22,g=f&&u[f]?f:22,m=h?153:"full"==c?Math.max(200,o.width||350):"button"==c?180:"mini"==c?115:u[g],_="vertical"==c?2*f+7:f,y={page:i||0,url:o.pageUrl||n.url,type:c,verb:1==o.verb?1:0,color:o.color||"",title:o.pageTitle||n.title,description:o.pageDescription||n.description,image:o.pageImage||n.image,text:(o.text||"").substr(0,140),h:f},b=o.ttHere||!1,v=!1,w=null;function V(e){if((v||e)&&l&&d&&l&&("none"==d.style.display||"yes"==d.getAttribute("vkhidden"))){w&&clearTimeout(w),p&&clearTimeout(p);var t=o.getScrollTop?o.getScrollTop():document.body.scrollTop||document.documentElement.scrollTop||0,i=VK.Util.getXY(r,o.fixed),n=b?0:i[1];t>i[1]-120&&"top"!=o.tooltipPos||"vertical"==c||"bottom"==o.tooltipPos?(d.style.top=n+_+2+"px",l.callMethod("show",!1,c+"_"+g)):(d.style.top=n-128+"px",l.callMethod("show",!0,c+"_"+g)),VK.Util.ss(d,{left:(b?0:i[0])-("full"==c||"button"==c?32:2)+"px",display:"block",opacity:1,filter:"none"}),d.setAttribute("vkhidden","no"),v=!0}}function K(e){v&&!e||!l||(l.callMethod("hide"),a.callMethod("hide"),w=setTimeout((function(){d.style.display="none"}),400))}"vertical"!=c&&"button"!=c&&"mini"!=c||delete o.width,h&&(y.auto_width=1);var x=VK.Widgets._constructor("widget_like.php",e,o,y,{initTooltip:function(e){l=new fastXDM.Server({onInit:e?function(){V()}:function(){},proxy:a,showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[t.width,t.height],{proxy:l}).show()}},!1,{safe:!0}),(d=l.append(b?r:document.body,{src:s.src+"&act=a_like_tooltip",scrolling:"no",allowTransparency:!0,id:s.id+"_tt",style:{position:"absolute",padding:0,display:"none",opacity:.01,filter:"alpha(opacity=1)",border:"0",width:"274px",height:"130px",zIndex:5e3,overflow:"hidden"}})).setAttribute("vkhidden","yes"),d.onmouseover=function(){clearTimeout(p),v=!0},d.onmouseout=function(){clearTimeout(p),v=!1,p=setTimeout((function(){K()}),200)}},showTooltip:V,hideTooltip:K,destroy:function(){a.destroy();try{s.src="about: blank;"}catch(e){}if(s.parentNode.removeChild(s),d){try{d.src="about: blank;"}catch(e){}d.parentNode.removeChild(d)}l&&l.destroy()},showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:a}).show()},proxy:function(){l&&l.callMethod.apply(l,arguments)}},{startHeight:_,minWidth:m},(function(e,t,o){a=o,VK.Util.ss(r=e,{height:_+"px",width:m+"px",position:"relative",clear:"both"}),VK.Util.ss(s=t,{height:_+"px",width:m+"px",overflow:"hidden",zIndex:150}),r.onmouseover=function(){clearTimeout(p),v=!0},r.onmouseout=function(){clearTimeout(p),v=!1,p=setTimeout((function(){K()}),200)}}));return t.push(x),x},e.destroyAll=function(){for(var e=null;t[0];)(e=VK.Widgets.RPC[t.pop()])&&e.methods.destroy()},e}(VK.Widgets.Like),VK.Widgets.Poll=function(e,t,o){var i=VK.Util.getPageData();if(!o)throw Error("No poll id passed");var n,r={poll_id:o,url:(t=VK.Util.parseOptions(t)).pageUrl||i.url||location.href,title:t.pageTitle||i.title,description:t.pageDescription||i.description};return t.preview&&(r.is_preview=1,delete t.preview),void 0!==t.share&&(r.share=t.share?1:0),VK.Widgets._constructor("al_widget_poll.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:n}).show()}},{startHeight:144,minWidth:300},(function(e,t,o){n=o}))},VK.Widgets.App=function(e,t,o){if(!t)throw Error("No app id passed");o=VK.Util.parseOptions(o);var i,n=void 0,r=void 0,s={aid:t,mode:parseInt(o.mode,10)||1};switch(s.mode){case 1:o.width=150,n=251;break;case 2:o.width=o.width?Math.max(200,Math.min(1e4,parseInt(o.width,10))):200,r=n=193;break;case 3:o.width=o.width?Math.max(50,Math.min(1e4,parseInt(o.width,10))):void 0,r=n=o.height={18:18,20:20,22:22,24:24,30:30}[parseInt(o.height,10)||30]}return i=o.width,VK.Widgets._constructor("widget_app.php",e,o,s,{},{startHeight:n,height:r,minWidth:i})},VK.Widgets.Community=VK.Widgets.Group=function(e,t,o){if(t=VK.Util.parseOptions(t),!(o=parseInt(o,10)))throw Error("No group_id passed");t.mode=parseInt(t.mode,10).toString();var i,n,r={gid:o,mode:t.mode?t.mode:"0"},s=3==t.mode?185:1==t.mode?141:0|t.height||290;function a(){return i.callMethod("mouseUp"),!1}function d(e){return i.callMethod("mouseMove",{screenY:e.screenY}),!1}return t.wall&&(r.wall=t.wall),r.color1=t.color1||"",r.color2=t.color2||"",r.color3=t.color3||"",r.class_name=t.class_name||"",t.no_head&&(r.no_head=1),t.no_cover&&(r.no_cover=1),t.wide&&(r.wide=1,(!t.width||t.width<300)&&(t.width=300)),0|!t.width&&(t.width=200),VK.Widgets._constructor("widget_community.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()},startDrag:function(){n=window.document.body.style.cursor,window.document.body.style.cursor="pointer",VK.Util.addEvent("mousemove",d),VK.Util.addEvent("mouseup",a)},stopDrag:function(){window.document.body.style.cursor=n,VK.Util.removeEvent("mousemove",d),VK.Util.removeEvent("mouseup",a)},auth:function(){VK.Auth.login(null,1)}},{minWidth:120,startHeight:s},(function(e,t,o){i=o}))},VK.Widgets.Auth=function(e,t){VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");return(t=VK.Util.parseOptions(t)).width||(t.width=200),t.type?type=1:type=0,VK.Widgets._constructor("widget_auth.php",e,t,{},{makeAuth:function(e){if(e.session&&(VK.Auth._loadState="loaded",VK.Auth.setSession(e.session,"connected"),VK.Observer.publish("auth.loginStatus",{session:e.session,status:"connected"}),VK.Observer.unsubscribe("auth.loginStatus")),t.onAuth)t.onAuth(e);else{if(t.authUrl)var o=t.authUrl;else o=window.location.href;-1==o.indexOf("?")?o+="?":o+="&";var i=[];for(var n in e)"session"!=n&&i.push(n+"="+decodeURIComponent(e[n]).replace(/&/g,"%26").replace(/\#/g,"%23").replace(/\?/,"%3F"));window.location.href=o+i.join("&")}}},{startHeight:134})},VK.Widgets.Subscribe=function(e,t,o){if(!(o=parseInt(o,10)))throw Error("No owner_id passed");var i,n={oid:o};return(t=VK.Util.parseOptions(t)).mode&&(n.mode=t.mode),t.soft&&(n.soft=t.soft),VK.Widgets._constructor("widget_subscribe.php",e,t,n,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()},auth:function(){VK.Auth.login(null,1)}},{minWidth:220,startHeight:22},(function(e,t,o){i=o}))},VK.Widgets.ContactUs=function(e,t,o){if(!(o=parseInt(o,10)))throw Error("No group or user id passed");t=VK.Util.parseOptions(t);var i={oid:o,height:{18:18,20:20,22:22,24:24,30:30}[parseInt(t.height,10)||24],text:(t.text||"").substr(0,140)};return VK.Widgets._constructor("widget_contactus.php",e,t,i,{},{startHeight:i.height,height:i.height},(function(e,t,o){0}))},VK.Widgets.Bookmarks=function(e,t){t=VK.Util.parseOptions(t);var o={height:{18:18,20:20,22:22,24:24,30:30}[parseInt(t.height,10)||30],url:t.url||window.location.href};return VK.Widgets._constructor("widget_bookmarks.php",e,t,o,{},{startHeight:o.height,height:o.height},(function(e,t,o){0}))},VK.Widgets.Playlist=function(e,t,o,i,n){var r,s={oid:parseInt(t,10),pid:parseInt(o,10),hash:i||""};if(!s.oid)throw Error("No owner id passed");if(!s.pid)throw Error("No playlist id passed");return n=VK.Util.parseOptions(n),VK.Widgets._constructor("widget_playlist.php",e,n,s,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:r}).show()}},{minWidth:200},(function(e,t,o){r=o}))},VK.Widgets.Ads=function(e,t,o){t=VK.Util.parseOptions(t),o=o||{};var i,n={},r={},s={},a=document.getElementById(e),d={},l={},p={};for(var u in o){var c=-1!=function(e,t,o){for(var i=o||0,n=(e||[]).length;i<n;i++)if(e[i]==t)return i;return-1}(["hash"],u)?u:"ads_"+u;d[c]=o[u]}if(a&&a.getBoundingClientRect){a.style.width="100%",a.style.height="100%";var h=a.getBoundingClientRect();a.style.width="",a.style.height="",d.ads_ad_unit_width_auto=Math.floor(h.right-h.left),d.ads_ad_unit_height_auto=Math.floor(h.bottom-h.top)}return p.ads_ad_unit_width=100,p.ads_ad_unit_height=100,l.ads_ad_unit_width=parseInt(d.ads_ad_unit_width)||"auto"===d.ads_ad_unit_width&&d.ads_ad_unit_width_auto||p.ads_ad_unit_width,l.ads_ad_unit_height=parseInt(d.ads_ad_unit_height)||"auto"===d.ads_ad_unit_height&&d.ads_ad_unit_height_auto||p.ads_ad_unit_height,d.ads_handler&&(l.ads_handler=d.ads_handler),d.ads_handler_empty_html&&(l.ads_handler_empty_html=d.ads_handler_empty_html),delete d.ads_handler,delete d.ads_handler_empty_html,n.act="ads_web",n.url=location.href,VK.extend(n,d),t.noDefaultParams=!0,t.width=l.ads_ad_unit_width,t.allowTransparency=!0,r.startHeight=l.ads_ad_unit_height,r.minWidth=l.ads_ad_unit_width,s.adsOnInit=function(e,o){VK.Widgets.loading(a,!1),function(e){if(!e)return;for(var t in e){var o=e[t];"ads_ad_unit_width"===t||"ads_ad_unit_height"===t?t in d||(l[t]=parseInt(o)||"auto"===o&&d[t+"_auto"]||p[t]):t in l||(l[t]=o)}}(o),t.onAdsReady&&t.onAdsReady.apply(t.onAdsReady,Array.prototype.slice.call(arguments));!function(e){var t=function(e){var t=!1;try{if(!e)return!1;var o=!1;if(d(e))o=e;else if(l(e)){var i=e.split(".");o=window;for(var n=0,r=i.length;n<r&&(o=o[i[n]]);n++);if(!o){"function"===e.substr(0,8)&&(e="return "+e+";");var s=new Function(e)();d(s)?o=s:t=s}}if(o){var a=Array.prototype.slice.call(arguments,1);t=o.apply(o,a)}}catch(e){try{console.error(e)}catch(e){}}return t;function d(e){return"[object Function]"===Object.prototype.toString.call(e)}function l(e){return"[object String]"===Object.prototype.toString.call(e)}}(l.ads_handler,e);if(e<=0&&!0!==t){try{console.log("VK: ad_unit_id = "+d.ads_ad_unit_id,", errorCode = ",e)}catch(e){}!function(e,t,o){if(!e)return;if(!a)return;t=t?t+"px":"",o=o?o+"px":"";var n='<html><head></head><body style="padding: 0; margin: 0;"><div>'+e+"</div></body></html>",r=document.createElement("iframe");function s(){if(!o)try{var e=r.contentWindow.document.body.firstChild.getBoundingClientRect(),t=Math.ceil(e.bottom-e.top);t&&(r.style.height=t,a.style.height=t)}catch(e){}}r.onload=s,r.id=(i?i.id:"vkwidget-"+Math.round(1e6*Math.random()))+"_ads_html_handler",r.src="about:blank",r.width="100%",r.height="100%",r.scrolling="no",r.frameBorder="0",r.allowTransparency=!0,r.style.overflow="hidden",r.style.width=t,r.style.height=o,a.style.width=t,a.style.height=o,a.appendChild(r),r.contentWindow.vk_ads_html_handler=n,r.src='javascript:window["vk_ads_html_handler"]'}(l.ads_handler_empty_html,l.ads_ad_unit_width,l.ads_ad_unit_height)}}(e)},s.newAdsOnInitLoader=function(e){!function(e){if("vk__adsLight"in window)window.vk__adsLight&&vk__adsLight.userHandlers&&vk__adsLight.userHandlers.onInit&&vk__adsLight.userHandlers.onInit(!1);else{window.vk__adsLight=!1;var t=VK.Api&&VK.Api.attachScript||VK.addScript;if(Array.isArray(e))e.forEach((function(e){t(VK._domain.base+e)}));else{var o=parseInt(e);t(VK._domain.base+jsc("/webl/ads_light.js?")+o)}}}(JSON.parse(e.replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&")))},VK.Widgets._constructor("ads_rotate.php",e,t,n,s,r,(function(e,t,o){a=e,i=t}))},VK.Widgets.AllowMessagesFromCommunity=function(e,t,o){if(!(o=parseInt(o,10))||o<0)throw Error("No group id passed");t=VK.Util.parseOptions(t);var i={height:{22:22,24:24,30:30}[parseInt(t.height,10)||24],key:t.key?t.key.substr(0,256):"",group_id:o};return VK.Widgets._constructor("widget_allow_messages_from_community.php",e,t,i,{},{startHeight:i.height,height:i.height},(function(e,t,o){0}))},VK.Widgets.Article=function(e,t,o){var i,n={url:t};return o=VK.Util.parseOptions(o),VK.Widgets._constructor("widget_article.php",e,o,n,{showBox:function(e){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()}},{},(function(e,t,o){i=o}))},VK.Widgets.Podcast=function(e,t,o){var i={episode:t};return o=VK.Util.parseOptions(o),VK.Widgets._constructor("widget_podcast.php",e,o,i,{showBox:function(e){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:rpc}).show()}},{minWidth:300,startHeight:150})},VK.Widgets.CommunityMessages=function(e){if(e)return e;var t={},o={},i={no_button:{width:0,height:0},blue_circle:{width:50,height:50,margin:{bottom:20}}},n={left:{bottom:0,left:20},right:{bottom:0,right:20}};return e=function(r,s,a){(a=VK.Util.parseOptions(a)).width=300,a.height=399,a.expandTimeout=parseInt(a.expandTimeout)||0;var d={gid:s};a.expanded=parseInt(a.expanded)||0,(!a.from_dev&&null!=function(e){if(!window.localStorage)return null;return localStorage.getItem("vk_community_widget_"+e)}("expanded")||a.expanded)&&(a.shown=1),a.shown&&(d.shown=1),a.welcomeScreen||(d.disable_welcome_screen=1),d.ref_source_info=a.ref_source_info,d.ref_source_link=location.href;var l=a.buttonType;-1==Object.keys(i).indexOf(l)&&(l="blue_circle"),"no_button"==l&&(a.disableButtonTooltip=1),a.disableButtonTooltip&&(d.disable_tooltip=1),a.tooltipButtonText&&(d.tooltip_text=a.tooltipButtonText),a.disableNewMessagesSound&&(d.disable_new_messages_sound=1),t[r]&&e.destroy(r),d.domain=document.domain,a.no_loading=1,a.disableNewMessagesSound&&a.disableExpandChatSound||(a.enable_autoplay=1),a.disableExpandChatSound&&(d.disable_expand_chat_sound=1),a.expandTimeout&&(d.expand_timeout=a.expandTimeout),a.__alpha_new_widget&&(d.__alpha_new_widget=1);var p,u,c,h=!1,f=0,g=[0,0];V(a.widgetPosition),d.button_position=a.widgetPosition,window.addEventListener("message",(function(e){var t=document.getElementById(r),o=t.getElementsByTagName("iframe")[0];if(e.data&&"VKReforgedWidgetResize"===e.data.action){var i=e.data.params.width,n=e.data.params.height;o.width=i,o.height=n,t.style.width=i+"px",t.style.height=n+"px",t.style.margin=n>50?"0":"0 0 20px"}e.data&&"VKReforgedWidgetLogout"===e.data.action&&(o.parentNode.removeChild(o),t.style={})}),!1);var m=0,_={};function y(e){clearTimeout(o.titleTimer),o.titleTimer=setTimeout((function(){1==o.changeTitleMode?document.title=o.oldTitle||"":document.title=o.title,o.changeTitleMode=1==o.changeTitleMode?0:1,y()}),e?0:1500)}function b(){a.disableTitleChange||(clearTimeout(o.titleTimer),o.oldTitle?document.title=o.oldTitle:null===o.oldTitle&&(document.title=""),o.title="")}function v(){var e=document.getElementById(r),t=e.getElementsByTagName("iframe")[0];e.style.width=t.width="372px",e.style.height=t.height="399px",e.style.margin="0px 0px 0px 0px"}function w(){var e=document.getElementById(r),t=e.getElementsByTagName("iframe")[0],o=i[l],n=o.width+g[0],s=Math.max(o.height,g[1]);e.style.width=n+"px",e.style.height=s+"px";var a=o.margin?o.margin:{};e.style.margin="0px "+(a.right||0)+"px "+(a.bottom||0)+"px 0px",t&&(t.style.boxShadow="none",t.width=n,t.height=s)}function V(e){p=e,-1==Object.keys(n).indexOf(p)&&(p="right"),K(),x("changeButtonPosition",p)}function K(){var e=document.getElementById(r);if(e){var t=["left","right","top","bottom"];for(var o in t)e.style[t[o]]="";var i=n[p];for(var o in i)e.style[o]=i[o]+"px";m&&(f?v():w())}}function x(){u&&u.callMethod.apply(u,arguments)}function I(e){e&&"[object Object]"===Object.prototype.toString.call(e)||(e={}),null==e.welcomeScreen&&(e.welcomeScreen=a.welcomeScreen);var t=document.getElementById(r).getElementsByTagName("iframe")[0];t&&t.contentWindow.postMessage({handler:"VKReforgedWidgetExpand"},VK._domain.base),clearTimeout(_.showTimer),x("expand",e)}function S(e){x("setSourceData",VK.extend({link:location.href},e))}return t[r]=VK.Widgets._constructor("reforged_widget.php",r,a,d,{onStartLoading:function(){var e=document.getElementById(r);e.style.position="fixed",e.style["z-index"]=1e4,K()},onReady:function(){m=1,a.expandTimeout>0&&!a.shown&&(_.showTimer=setTimeout((function(){I({playSong:!a.disableExpandChatSound,noSaveState:1})}),a.expandTimeout))},showBox:function(e){if(h)try{h.hide();try{h.iframe.src="about: blank;"}catch(e){}h.iframe.parentNode.removeChild(h.iframe)}catch(e){}(h=VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:u},{zIndex:10002})).show()},setTooltipSize:function(e){g=e,f||w()},expand:function(e){var t,o;e=e||{},f=1,v(),e.noSaveState||(t="expanded",o=1,window.localStorage&&localStorage.setItem("vk_community_widget_"+t,o))},minimize:function(){setTimeout((function(){var e;f=0,w(),e="expanded",window.localStorage&&localStorage.removeItem("vk_community_widget_"+e)}),120)},canNotWrite:function(e){a.onCanNotWrite&&a.onCanNotWrite(e)},destroy:function(){u.destroy();try{c.src="about: blank;"}catch(e){}try{c.parentNode.removeChild(c)}catch(e){}},fatalError:function(t,o){var i={code:t,widget:2,public_id:o};1903==t&&(i.referrer_domain=document.domain);var n=[];for(var s in i)n.push(s+"="+i[s]);e.destroy(r),VK.Util.Box(VK.Util.getAbsUrl("blank.php?"+n.join("&"))).show()},setPageTitle:function(e){a.disableTitleChange||(b(),o.oldTitle=document.title||null,o.title=e,o.changeTitleMode=0,y(1))},resetPageTitle:function(){b()},newMessage:function(){!document.hasFocus||document.hasFocus()||a.disableNewMessagesSound||x("playNewMsgSong")}},{},(function(e,t,o){u=o,c=t,a.shown?v():w()})),VK.Util.addEvent("popstate",S.bind(this,{}),window),VK.Util.addEvent("hashchange",S.bind(this,{}),window),{expand:I,minimize:function(){x("minimize");var e=document.getElementById(r).getElementsByTagName("iframe")[0];e&&e.contentWindow.postMessage({handler:"VKReforgedWidgetMinimize"},VK._domain.base)},destroy:function(){b();var t=document.getElementById(r).getElementsByTagName("iframe")[0];t&&t.contentWindow.postMessage({handler:"VKReforgedWidgetDestroy"},VK._domain.base),e.destroy(r)},setSourceData:S,changeButtonPosition:V,stopTitleAnimation:b}},e.destroy=function(e){if(t[e]){var o=VK.Widgets.RPC[t[e]];o&&o.methods.destroy(),delete t[e]}},e.expand=function(e){console.log(t[e])},e}(VK.Widgets.CommunityMessages),VK.Widgets._constructor=function(e,t,o,i,n,r,s,a,d){var l=document.getElementById(t);if(a=a||++VK.Widgets.count,!l){if((d=d||0)>10)throw Error("VK.Widgets: object #"+t+" not found.");return setTimeout((function(){VK.Widgets._constructor(e,t,o,i,n,r,s,a,d+1)}),500),a}r=r||{},n=n||{},(o=o||{}).preview&&(i.preview=1,delete o.preview);var p,u,c,h,f,g,m="auto"===o.width?0|(l.clientWidth||l.offsetWidth||r.minWidth):parseInt(o.width||0,10);"silent_code"===i.act?(m="1px",l.style.opacity=0,l.style.display="none",l.style.position="absolute"):m=m?Math.max(r.minWidth||200,Math.min(r.maxWidth||1e4,m))+"px":"100%",l.style.width=m,o.height?(i.height=o.height,l.style.height=o.height+"px"):l.style.height=(r.startHeight||200)+"px","100%"===m&&(i.startWidth=0|(l.clientWidth||l.offsetWidth)),i.url||(i.url=o.pageUrl||location.href.replace(/#.*$/,"")),p=VK._domain.base+"/"+e,u="",o.noDefaultParams||(u+="&app="+(VK._apiId||"0")+"&width="+encodeURIComponent(m)),u+="&_ver="+VK.version,VK._iframeAppWidget&&(i.iframe_app=1);var _=VK.Util.getPageData();for(g in i.url=i.url||_.url||"",i.referrer=i.referrer||document.referrer||"",i.title=i.title||_.title||document.title||"",i){if("title"==g&&i[g].length>80&&(i[g]=i[g].substr(0,80)+"..."),"description"==g&&i[g].length>160&&(i[g]=i[g].substr(0,160)+"..."),"number"==typeof i[g])c=i[g];else try{c=encodeURIComponent(i[g])}catch(e){c=""}u+="&"+g+"="+c}p+="?"+(u+="&"+(+new Date).toString(16)).substr(1),n.onStartLoading&&n.onStartLoading(),o.no_loading||VK.Widgets.loading(l,!0),n.showLoader=function(e){VK.Util.Loader(e)},n.publish=function(){var e=Array.prototype.slice.call(arguments);e.push(a),VK.Observer.publish.apply(VK.Observer,e)},n.onInit=function(){VK.Widgets.loading(l,!1),n.onReady&&n.onReady(),o.onReady&&o.onReady()},n.resize=function(e,t){l.style.height=e+"px";var o=document.getElementById("vkwidget"+a);o&&(o.style.height=e+"px")},n.resizeWidget=function(e,t){e=parseInt(e),t=parseInt(t);var i=document.getElementById("vkwidget"+a);isFinite(e)&&(l.style.width=e+"px",i&&(i.style.width=e+"px")),isFinite(t)&&(l.style.height=t+"px",i&&(i.style.height=t+"px")),o.onResizeWidget&&o.onResizeWidget()},n.updateVersion=function(e){e>1&&VK.Api.attachScript(`//${getBaseDomain()}/js/api/openapi_update.js?`+parseInt(e))},h=VK.Widgets.RPC[a]=new fastXDM.Server(n,(function(e){return!e||(e=e.toLowerCase()).match(/(\.|\/)vk\.(com|ru)($|\/|\?)/)}),{safe:!0});var y={overflow:"hidden"};o.custom_style&&"object"==typeof o.custom_style&&(y=VK.extend(y,o.custom_style));var b="";return o.enable_autoplay&&(b='allow="autoplay"'),f=VK.Widgets.RPC[a].append(l,{src:p,width:-1!=m.indexOf("%")?m:parseInt(m)||m,height:r.startHeight||"100%",scrolling:"no",id:"vkwidget"+a,allowTransparency:o.allowTransparency||!1,style:y},b),s&&setTimeout((function(){s(l,f||l.firstChild,h)}),10),a}),VK.Util||(VK.Util={getPageData:function(){if(!VK._pData){var e,t=document.getElementsByTagName("meta"),o={},i=["description","title","url","image","app_id"];for(var n in t)if(t[n].getAttribute&&t[n].getAttribute&&((e=t[n].getAttribute("name"))||(e=t[n].getAttribute("property"))))for(var r in i)e!=i[r]&&e!="og:"+i[r]&&e!="vk:"+i[r]||(o[i[r]]=t[n].content);o.app_id&&!VK._apiId&&(VK._apiId=o.app_id),o.title=o.title||document.title||"",o.description=o.description||"",o.image=o.image||"",!o.url&&VK._iframeAppWidget&&VK._apiId&&(o.url="/app"+VK._apiId,VK._browserHash&&(o.url+=VK._browserHash));var s=location.href.replace(/#.*$/,"");o.url&&o.url.indexOf(s)||(o.url=s),VK._pData=o}return VK._pData},getStyle:function(e,t){var o,i=document.defaultView||window;if(i.getComputedStyle){t=t.replace(/([A-Z])/g,"-$1").toLowerCase();var n=i.getComputedStyle(e,null);n&&(o=n.getPropertyValue(t))}else if(e.currentStyle){var r=t.replace(/\-(\w)/g,(function(e,t){return t.toUpperCase()}));o=e.currentStyle[t]||e.currentStyle[r]}return o},getAbsUrl:function(e){return VK._domain.base+"/"+e.replace(/^\s*\/?/,"")},parseOptions:function(e){return"[object Object]"!==Object.prototype.toString.call(e)&&(e={}),e.base_domain&&(VK._domain.base=e.base_domain),e.login_domain&&(VK._domain.login=e.login_domain),e},getXY:function(e,t){if(e&&void 0!==e){var o=0,i=0;if(void 0!==e.getBoundingClientRect){var n=e.getBoundingClientRect();o=n.left,i=n.top,t=!0}else if(e.offsetParent)do{o+=e.offsetLeft,i+=e.offsetTop,t&&(o-=e.scrollLeft,i-=e.scrollTop)}while(e=e.offsetParent);return t&&(i+=window.pageYOffset||window.scrollNode&&scrollNode.scrollTop||document.documentElement.scrollTop,o+=window.pageXOffset||window.scrollNode&&scrollNode.scrollLeft||document.documentElement.scrollLeft),[o,i]}},Loader:function e(t){e.loader||((e.loader=document.createElement("DIV")).innerHTML='<style type="text/css">        @-webkit-keyframes VKWidgetsLoaderKeyframes {0%{opacity: 0.2;}30%{opacity: 1;}100%{opacity: 0.2;}}        @keyframes VKWidgetsLoaderKeyframes {0%{opacity: 0.2;}30%{opacity: 1;}100%{opacity: 0.2;}}        .VKWidgetsLoader div {width: 7px;height: 7px;-webkit-border-radius: 50%;-khtml-border-radius: 50%;-moz-border-radius: 50%;border-radius: 50%;background: #fff;top: 21px;position: absolute;z-index: 2;-o-transition: opacity 350ms linear; transition: opacity 350ms linear;opacity: 0.2;-webkit-animation-duration: 750ms;-o-animation-duration: 750ms;animation-duration: 750ms;-webkit-animation-name: VKWidgetsLoaderKeyframes;-o-animation-name: VKWidgetsLoaderKeyframes;animation-name: VKWidgetsLoaderKeyframes;-webkit-animation-iteration-count: infinite;-o-animation-iteration-count: infinite;animation-iteration-count: infinite;-webkit-transform: translateZ(0);transform: translateZ(0);}</style><div class="VKWidgetsLoader" style="position: fixed;left: 50%;top: 50%;margin: -25px -50px;z-index: 1002;height: 50px;width: 100px;"><div style="left: 36px;-webkit-animation-delay: 0ms;-o-animation-delay: 0ms;animation-delay: 0ms;"></div><div style="left: 47px;-webkit-animation-delay: 180ms;-o-animation-delay: 180ms;animation-delay: 180ms;"></div><div style="left: 58px;-webkit-animation-delay: 360ms;-o-animation-delay: 360ms;animation-delay: 360ms;"></div><span style="display: block;background-color: #000;-webkit-border-radius: 4px;-khtml-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);-moz-box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);position: absolute;left: 0;top: 0;bottom: 0; right: 0;z-index: 1;opacity: 0.7;"></span></div>',document.body.insertBefore(e.loader,document.body.firstChild)),e.loader.style.display=t?"block":"none"},Box:function(e,t,o,i){o=o||{};var n=document.body.style.overflow;VK.Util.Loader(!0);var r=/(^|\.)(vk\.(com|ru)|vkontakte\.ru)$/.test(location.hostname),s=new fastXDM.Server(VK.extend(o,{onInit:function(){a.style.background="transparent",a.style.visibility="visible",document.body.style.overflow="hidden",a.setAttribute("allowfullscreen",1),r&&(document.body.className+=" layers_shown"),VK.Util.Loader()},hide:function(){a.style.display="none"},tempHide:function(){a.style.left="-10000px",a.style.top="-10000px",a.style.width="10px",a.style.height="10px",r&&(document.body.className=document.body.className.replace(/\b\s*?layers_shown\s*\b/," ")),document.body.style.overflow=n},destroy:function(){try{a.src="about: blank;"}catch(e){}a.parentNode.removeChild(a),r&&(document.body.className=document.body.className.replace(/\b\s*?layers_shown\s*\b/," ")),document.body.style.overflow=n},resize:function(e,t){}},!0),!1,{safe:!0}),a=s.append(document.body,{src:e.replace(/&amp;/g,"&"),scrolling:"no",allowTransparency:!0,style:{position:"fixed",left:0,top:0,zIndex:i&&i.zIndex||1002,background:VK._domain.base+"/images/upload.gif center center no-repeat transparent",padding:"0",border:"0",width:"100%",height:"100%",overflow:"hidden",visibility:"hidden"}});return{show:function(e,t){a.style.display="block",document.body.style.overflow="hidden"},hide:function(){a.style.display="none",document.body.style.overflow=n},iframe:a,rpc:s}},addEvent:function(e,t,o){(o=o||window.document).addEventListener?o.addEventListener(e,t,!1):o.attachEvent&&o.attachEvent("on"+e,t)},removeEvent:function(e,t,o){(o=o||window.document).removeEventListener?o.removeEventListener(e,t,!1):o.detachEvent&&o.detachEvent("on"+e,t)},ss:function(e,t){VK.extend(e.style,t,!0)}}),VK.Retargeting||(VK.Retargeting={pixelCode:null,Init:function(e){return this.pixelCode=e,this},Event:function(e){if(this.pixelCode)if(IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,event:e});else{var t=VK.Util.getPageData(),o=t.url.substr(0,500),i=t.title&&t.title.substr(0,500)||"";(window.Image?new Image:document.createElement("img")).src=VK._domain.base+"/rtrg?p="+this.pixelCode+(e?"&event="+encodeURIComponent(e):"")+(o?"&metatag_url="+encodeURIComponent(o):"")+(i?"&metatag_title="+encodeURIComponent(i):"")}},Hit:function(){this.Event()},Add:function(e){this.pixelCode&&e&&(IS_BRIDGE_AVAILABLE?_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,target_group_id:e}):(window.Image?new Image:document.createElement("img")).src=VK._domain.base+"/rtrg?p="+this.pixelCode+"&audience="+encodeURIComponent(e))},ProductEvent:function(e,t,o,i){if(this.pixelCode&&t&&e){var n=!0;void 0!==(i=i||{}).show_errors&&(n=!!i.show_errors);var r="0";void 0!==i.errors_ignore&&(r=i.errors_ignore?"1":"0");var s=VK.Util.getPageData(),a=s.url.substr(0,500),d=s.title&&s.title.substr(0,500)||"",l=VK._domain.base+"/rtrg",p=o?JSON.stringify(o):"",u={p:this.pixelCode,products_event:t,price_list_id:e,e:"1",i:r,metatag_url:a,metatag_title:d};if(p&&(u.products_params=p),IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,price_list_id:e,products_event:t,products_params:p});else{var c=l+"?"+Object.keys(u).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(u[e])})).join("&");VK.Api.makeRequest(c,this.onDone.bind(this,n))}}},onDone:function(e,t){if(t&&e){var o;try{o=JSON.parse(t)}catch(e){return}o&&o.errors&&this.showErrors(o.errors)}},showErrors:function(e){if(e||e.length){var t="VK Pixel Error ("+this.pixelCode+"): ";if("string"!=typeof e){var o=e.length;if(o)for(var i=0;i<o;i++)console.error(t+e[i])}else console.error(t+e)}}}),VK.Pixel||(VK.Pixel=function(e){if(this.constructor!=VK.Pixel)throw Error("VK.Pixel was called without 'new' operator");return VK.extend(this,VK.Retargeting),this.pixelCode=e,this.Goal=function(t,o){return VK.Goal(t,o,e)},this}),VK.Goal||(VK.Goal=function(e,t,o){var i=o||VK.Retargeting.pixelCode;if(i&&"string"==typeof i){var n=e||"conversion";if("string"==typeof n){var r=(t||{}).value||0;if("string"==typeof r){if(parseFloat(r).toString()!==r)return void console.error("Error argument: parameters.value not a number or valid number string")}else if("number"!=typeof r)return void console.error("Error argument: parameters.value not a number or valid number string");if(IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppConversionHit",{pixel_code:i,conversion_event:n,conversion_value:r});else{var s=VK._domain.base+"/rtrg",a={p:i,e:"1",c:n,v:r},d=s+"?"+Object.keys(a).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(a[e])})).join("&");VK.Api.makeRequest(d,VK.Retargeting.onDone.bind(VK.Retargeting,!0))}}else console.error("Error argument: conversionName not a string")}else console.error("Error argument: pixelCode not a string. Use VK.Retargeting.Init or VK.Pixel to initialize pixel")}),window.vkAsyncInit&&setTimeout(vkAsyncInit,0),window.vkAsyncInitCallbacks&&vkAsyncInitCallbacks.length&&setTimeout((function(){for(var e;e=vkAsyncInitCallbacks.pop();)try{e()}catch(e){try{console.error(e)}catch(e){}}}),0);try{stManager.done("api/openapi.js")}catch(e){}
;
/*! jQuery v3.7.1 | (c) OpenJS Foundation and other contributors | jquery.org/license */
!function(e,t){"use strict";"object"==typeof module&&"object"==typeof module.exports?module.exports=e.document?t(e,!0):function(e){if(!e.document)throw new Error("jQuery requires a window with a document");return t(e)}:t(e)}("undefined"!=typeof window?window:this,function(ie,e){"use strict";var oe=[],r=Object.getPrototypeOf,ae=oe.slice,g=oe.flat?function(e){return oe.flat.call(e)}:function(e){return oe.concat.apply([],e)},s=oe.push,se=oe.indexOf,n={},i=n.toString,ue=n.hasOwnProperty,o=ue.toString,a=o.call(Object),le={},v=function(e){return"function"==typeof e&&"number"!=typeof e.nodeType&&"function"!=typeof e.item},y=function(e){return null!=e&&e===e.window},C=ie.document,u={type:!0,src:!0,nonce:!0,noModule:!0};function m(e,t,n){var r,i,o=(n=n||C).createElement("script");if(o.text=e,t)for(r in u)(i=t[r]||t.getAttribute&&t.getAttribute(r))&&o.setAttribute(r,i);n.head.appendChild(o).parentNode.removeChild(o)}function x(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?n[i.call(e)]||"object":typeof e}var t="3.7.1",l=/HTML$/i,ce=function(e,t){return new ce.fn.init(e,t)};function c(e){var t=!!e&&"length"in e&&e.length,n=x(e);return!v(e)&&!y(e)&&("array"===n||0===t||"number"==typeof t&&0<t&&t-1 in e)}function fe(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()}ce.fn=ce.prototype={jquery:t,constructor:ce,length:0,toArray:function(){return ae.call(this)},get:function(e){return null==e?ae.call(this):e<0?this[e+this.length]:this[e]},pushStack:function(e){var t=ce.merge(this.constructor(),e);return t.prevObject=this,t},each:function(e){return ce.each(this,e)},map:function(n){return this.pushStack(ce.map(this,function(e,t){return n.call(e,t,e)}))},slice:function(){return this.pushStack(ae.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},even:function(){return this.pushStack(ce.grep(this,function(e,t){return(t+1)%2}))},odd:function(){return this.pushStack(ce.grep(this,function(e,t){return t%2}))},eq:function(e){var t=this.length,n=+e+(e<0?t:0);return this.pushStack(0<=n&&n<t?[this[n]]:[])},end:function(){return this.prevObject||this.constructor()},push:s,sort:oe.sort,splice:oe.splice},ce.extend=ce.fn.extend=function(){var e,t,n,r,i,o,a=arguments[0]||{},s=1,u=arguments.length,l=!1;for("boolean"==typeof a&&(l=a,a=arguments[s]||{},s++),"object"==typeof a||v(a)||(a={}),s===u&&(a=this,s--);s<u;s++)if(null!=(e=arguments[s]))for(t in e)r=e[t],"__proto__"!==t&&a!==r&&(l&&r&&(ce.isPlainObject(r)||(i=Array.isArray(r)))?(n=a[t],o=i&&!Array.isArray(n)?[]:i||ce.isPlainObject(n)?n:{},i=!1,a[t]=ce.extend(l,o,r)):void 0!==r&&(a[t]=r));return a},ce.extend({expando:"jQuery"+(t+Math.random()).replace(/\D/g,""),isReady:!0,error:function(e){throw new Error(e)},noop:function(){},isPlainObject:function(e){var t,n;return!(!e||"[object Object]"!==i.call(e))&&(!(t=r(e))||"function"==typeof(n=ue.call(t,"constructor")&&t.constructor)&&o.call(n)===a)},isEmptyObject:function(e){var t;for(t in e)return!1;return!0},globalEval:function(e,t,n){m(e,{nonce:t&&t.nonce},n)},each:function(e,t){var n,r=0;if(c(e)){for(n=e.length;r<n;r++)if(!1===t.call(e[r],r,e[r]))break}else for(r in e)if(!1===t.call(e[r],r,e[r]))break;return e},text:function(e){var t,n="",r=0,i=e.nodeType;if(!i)while(t=e[r++])n+=ce.text(t);return 1===i||11===i?e.textContent:9===i?e.documentElement.textContent:3===i||4===i?e.nodeValue:n},makeArray:function(e,t){var n=t||[];return null!=e&&(c(Object(e))?ce.merge(n,"string"==typeof e?[e]:e):s.call(n,e)),n},inArray:function(e,t,n){return null==t?-1:se.call(t,e,n)},isXMLDoc:function(e){var t=e&&e.namespaceURI,n=e&&(e.ownerDocument||e).documentElement;return!l.test(t||n&&n.nodeName||"HTML")},merge:function(e,t){for(var n=+t.length,r=0,i=e.length;r<n;r++)e[i++]=t[r];return e.length=i,e},grep:function(e,t,n){for(var r=[],i=0,o=e.length,a=!n;i<o;i++)!t(e[i],i)!==a&&r.push(e[i]);return r},map:function(e,t,n){var r,i,o=0,a=[];if(c(e))for(r=e.length;o<r;o++)null!=(i=t(e[o],o,n))&&a.push(i);else for(o in e)null!=(i=t(e[o],o,n))&&a.push(i);return g(a)},guid:1,support:le}),"function"==typeof Symbol&&(ce.fn[Symbol.iterator]=oe[Symbol.iterator]),ce.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){n["[object "+t+"]"]=t.toLowerCase()});var pe=oe.pop,de=oe.sort,he=oe.splice,ge="[\\x20\\t\\r\\n\\f]",ve=new RegExp("^"+ge+"+|((?:^|[^\\\\])(?:\\\\.)*)"+ge+"+$","g");ce.contains=function(e,t){var n=t&&t.parentNode;return e===n||!(!n||1!==n.nodeType||!(e.contains?e.contains(n):e.compareDocumentPosition&&16&e.compareDocumentPosition(n)))};var f=/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;function p(e,t){return t?"\0"===e?"\ufffd":e.slice(0,-1)+"\\"+e.charCodeAt(e.length-1).toString(16)+" ":"\\"+e}ce.escapeSelector=function(e){return(e+"").replace(f,p)};var ye=C,me=s;!function(){var e,b,w,o,a,T,r,C,d,i,k=me,S=ce.expando,E=0,n=0,s=W(),c=W(),u=W(),h=W(),l=function(e,t){return e===t&&(a=!0),0},f="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",t="(?:\\\\[\\da-fA-F]{1,6}"+ge+"?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+",p="\\["+ge+"*("+t+")(?:"+ge+"*([*^$|!~]?=)"+ge+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+t+"))|)"+ge+"*\\]",g=":("+t+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+p+")*)|.*)\\)|)",v=new RegExp(ge+"+","g"),y=new RegExp("^"+ge+"*,"+ge+"*"),m=new RegExp("^"+ge+"*([>+~]|"+ge+")"+ge+"*"),x=new RegExp(ge+"|>"),j=new RegExp(g),A=new RegExp("^"+t+"$"),D={ID:new RegExp("^#("+t+")"),CLASS:new RegExp("^\\.("+t+")"),TAG:new RegExp("^("+t+"|[*])"),ATTR:new RegExp("^"+p),PSEUDO:new RegExp("^"+g),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+ge+"*(even|odd|(([+-]|)(\\d*)n|)"+ge+"*(?:([+-]|)"+ge+"*(\\d+)|))"+ge+"*\\)|)","i"),bool:new RegExp("^(?:"+f+")$","i"),needsContext:new RegExp("^"+ge+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+ge+"*((?:-\\d)?\\d*)"+ge+"*\\)|)(?=[^-]|$)","i")},N=/^(?:input|select|textarea|button)$/i,q=/^h\d$/i,L=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,H=/[+~]/,O=new RegExp("\\\\[\\da-fA-F]{1,6}"+ge+"?|\\\\([^\\r\\n\\f])","g"),P=function(e,t){var n="0x"+e.slice(1)-65536;return t||(n<0?String.fromCharCode(n+65536):String.fromCharCode(n>>10|55296,1023&n|56320))},M=function(){V()},R=J(function(e){return!0===e.disabled&&fe(e,"fieldset")},{dir:"parentNode",next:"legend"});try{k.apply(oe=ae.call(ye.childNodes),ye.childNodes),oe[ye.childNodes.length].nodeType}catch(e){k={apply:function(e,t){me.apply(e,ae.call(t))},call:function(e){me.apply(e,ae.call(arguments,1))}}}function I(t,e,n,r){var i,o,a,s,u,l,c,f=e&&e.ownerDocument,p=e?e.nodeType:9;if(n=n||[],"string"!=typeof t||!t||1!==p&&9!==p&&11!==p)return n;if(!r&&(V(e),e=e||T,C)){if(11!==p&&(u=L.exec(t)))if(i=u[1]){if(9===p){if(!(a=e.getElementById(i)))return n;if(a.id===i)return k.call(n,a),n}else if(f&&(a=f.getElementById(i))&&I.contains(e,a)&&a.id===i)return k.call(n,a),n}else{if(u[2])return k.apply(n,e.getElementsByTagName(t)),n;if((i=u[3])&&e.getElementsByClassName)return k.apply(n,e.getElementsByClassName(i)),n}if(!(h[t+" "]||d&&d.test(t))){if(c=t,f=e,1===p&&(x.test(t)||m.test(t))){(f=H.test(t)&&U(e.parentNode)||e)==e&&le.scope||((s=e.getAttribute("id"))?s=ce.escapeSelector(s):e.setAttribute("id",s=S)),o=(l=Y(t)).length;while(o--)l[o]=(s?"#"+s:":scope")+" "+Q(l[o]);c=l.join(",")}try{return k.apply(n,f.querySelectorAll(c)),n}catch(e){h(t,!0)}finally{s===S&&e.removeAttribute("id")}}}return re(t.replace(ve,"$1"),e,n,r)}function W(){var r=[];return function e(t,n){return r.push(t+" ")>b.cacheLength&&delete e[r.shift()],e[t+" "]=n}}function F(e){return e[S]=!0,e}function $(e){var t=T.createElement("fieldset");try{return!!e(t)}catch(e){return!1}finally{t.parentNode&&t.parentNode.removeChild(t),t=null}}function B(t){return function(e){return fe(e,"input")&&e.type===t}}function _(t){return function(e){return(fe(e,"input")||fe(e,"button"))&&e.type===t}}function z(t){return function(e){return"form"in e?e.parentNode&&!1===e.disabled?"label"in e?"label"in e.parentNode?e.parentNode.disabled===t:e.disabled===t:e.isDisabled===t||e.isDisabled!==!t&&R(e)===t:e.disabled===t:"label"in e&&e.disabled===t}}function X(a){return F(function(o){return o=+o,F(function(e,t){var n,r=a([],e.length,o),i=r.length;while(i--)e[n=r[i]]&&(e[n]=!(t[n]=e[n]))})})}function U(e){return e&&"undefined"!=typeof e.getElementsByTagName&&e}function V(e){var t,n=e?e.ownerDocument||e:ye;return n!=T&&9===n.nodeType&&n.documentElement&&(r=(T=n).documentElement,C=!ce.isXMLDoc(T),i=r.matches||r.webkitMatchesSelector||r.msMatchesSelector,r.msMatchesSelector&&ye!=T&&(t=T.defaultView)&&t.top!==t&&t.addEventListener("unload",M),le.getById=$(function(e){return r.appendChild(e).id=ce.expando,!T.getElementsByName||!T.getElementsByName(ce.expando).length}),le.disconnectedMatch=$(function(e){return i.call(e,"*")}),le.scope=$(function(){return T.querySelectorAll(":scope")}),le.cssHas=$(function(){try{return T.querySelector(":has(*,:jqfake)"),!1}catch(e){return!0}}),le.getById?(b.filter.ID=function(e){var t=e.replace(O,P);return function(e){return e.getAttribute("id")===t}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&C){var n=t.getElementById(e);return n?[n]:[]}}):(b.filter.ID=function(e){var n=e.replace(O,P);return function(e){var t="undefined"!=typeof e.getAttributeNode&&e.getAttributeNode("id");return t&&t.value===n}},b.find.ID=function(e,t){if("undefined"!=typeof t.getElementById&&C){var n,r,i,o=t.getElementById(e);if(o){if((n=o.getAttributeNode("id"))&&n.value===e)return[o];i=t.getElementsByName(e),r=0;while(o=i[r++])if((n=o.getAttributeNode("id"))&&n.value===e)return[o]}return[]}}),b.find.TAG=function(e,t){return"undefined"!=typeof t.getElementsByTagName?t.getElementsByTagName(e):t.querySelectorAll(e)},b.find.CLASS=function(e,t){if("undefined"!=typeof t.getElementsByClassName&&C)return t.getElementsByClassName(e)},d=[],$(function(e){var t;r.appendChild(e).innerHTML="<a id='"+S+"' href='' disabled='disabled'></a><select id='"+S+"-\r\\' disabled='disabled'><option selected=''></option></select>",e.querySelectorAll("[selected]").length||d.push("\\["+ge+"*(?:value|"+f+")"),e.querySelectorAll("[id~="+S+"-]").length||d.push("~="),e.querySelectorAll("a#"+S+"+*").length||d.push(".#.+[+~]"),e.querySelectorAll(":checked").length||d.push(":checked"),(t=T.createElement("input")).setAttribute("type","hidden"),e.appendChild(t).setAttribute("name","D"),r.appendChild(e).disabled=!0,2!==e.querySelectorAll(":disabled").length&&d.push(":enabled",":disabled"),(t=T.createElement("input")).setAttribute("name",""),e.appendChild(t),e.querySelectorAll("[name='']").length||d.push("\\["+ge+"*name"+ge+"*="+ge+"*(?:''|\"\")")}),le.cssHas||d.push(":has"),d=d.length&&new RegExp(d.join("|")),l=function(e,t){if(e===t)return a=!0,0;var n=!e.compareDocumentPosition-!t.compareDocumentPosition;return n||(1&(n=(e.ownerDocument||e)==(t.ownerDocument||t)?e.compareDocumentPosition(t):1)||!le.sortDetached&&t.compareDocumentPosition(e)===n?e===T||e.ownerDocument==ye&&I.contains(ye,e)?-1:t===T||t.ownerDocument==ye&&I.contains(ye,t)?1:o?se.call(o,e)-se.call(o,t):0:4&n?-1:1)}),T}for(e in I.matches=function(e,t){return I(e,null,null,t)},I.matchesSelector=function(e,t){if(V(e),C&&!h[t+" "]&&(!d||!d.test(t)))try{var n=i.call(e,t);if(n||le.disconnectedMatch||e.document&&11!==e.document.nodeType)return n}catch(e){h(t,!0)}return 0<I(t,T,null,[e]).length},I.contains=function(e,t){return(e.ownerDocument||e)!=T&&V(e),ce.contains(e,t)},I.attr=function(e,t){(e.ownerDocument||e)!=T&&V(e);var n=b.attrHandle[t.toLowerCase()],r=n&&ue.call(b.attrHandle,t.toLowerCase())?n(e,t,!C):void 0;return void 0!==r?r:e.getAttribute(t)},I.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)},ce.uniqueSort=function(e){var t,n=[],r=0,i=0;if(a=!le.sortStable,o=!le.sortStable&&ae.call(e,0),de.call(e,l),a){while(t=e[i++])t===e[i]&&(r=n.push(i));while(r--)he.call(e,n[r],1)}return o=null,e},ce.fn.uniqueSort=function(){return this.pushStack(ce.uniqueSort(ae.apply(this)))},(b=ce.expr={cacheLength:50,createPseudo:F,match:D,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){return e[1]=e[1].replace(O,P),e[3]=(e[3]||e[4]||e[5]||"").replace(O,P),"~="===e[2]&&(e[3]=" "+e[3]+" "),e.slice(0,4)},CHILD:function(e){return e[1]=e[1].toLowerCase(),"nth"===e[1].slice(0,3)?(e[3]||I.error(e[0]),e[4]=+(e[4]?e[5]+(e[6]||1):2*("even"===e[3]||"odd"===e[3])),e[5]=+(e[7]+e[8]||"odd"===e[3])):e[3]&&I.error(e[0]),e},PSEUDO:function(e){var t,n=!e[6]&&e[2];return D.CHILD.test(e[0])?null:(e[3]?e[2]=e[4]||e[5]||"":n&&j.test(n)&&(t=Y(n,!0))&&(t=n.indexOf(")",n.length-t)-n.length)&&(e[0]=e[0].slice(0,t),e[2]=n.slice(0,t)),e.slice(0,3))}},filter:{TAG:function(e){var t=e.replace(O,P).toLowerCase();return"*"===e?function(){return!0}:function(e){return fe(e,t)}},CLASS:function(e){var t=s[e+" "];return t||(t=new RegExp("(^|"+ge+")"+e+"("+ge+"|$)"))&&s(e,function(e){return t.test("string"==typeof e.className&&e.className||"undefined"!=typeof e.getAttribute&&e.getAttribute("class")||"")})},ATTR:function(n,r,i){return function(e){var t=I.attr(e,n);return null==t?"!="===r:!r||(t+="","="===r?t===i:"!="===r?t!==i:"^="===r?i&&0===t.indexOf(i):"*="===r?i&&-1<t.indexOf(i):"$="===r?i&&t.slice(-i.length)===i:"~="===r?-1<(" "+t.replace(v," ")+" ").indexOf(i):"|="===r&&(t===i||t.slice(0,i.length+1)===i+"-"))}},CHILD:function(d,e,t,h,g){var v="nth"!==d.slice(0,3),y="last"!==d.slice(-4),m="of-type"===e;return 1===h&&0===g?function(e){return!!e.parentNode}:function(e,t,n){var r,i,o,a,s,u=v!==y?"nextSibling":"previousSibling",l=e.parentNode,c=m&&e.nodeName.toLowerCase(),f=!n&&!m,p=!1;if(l){if(v){while(u){o=e;while(o=o[u])if(m?fe(o,c):1===o.nodeType)return!1;s=u="only"===d&&!s&&"nextSibling"}return!0}if(s=[y?l.firstChild:l.lastChild],y&&f){p=(a=(r=(i=l[S]||(l[S]={}))[d]||[])[0]===E&&r[1])&&r[2],o=a&&l.childNodes[a];while(o=++a&&o&&o[u]||(p=a=0)||s.pop())if(1===o.nodeType&&++p&&o===e){i[d]=[E,a,p];break}}else if(f&&(p=a=(r=(i=e[S]||(e[S]={}))[d]||[])[0]===E&&r[1]),!1===p)while(o=++a&&o&&o[u]||(p=a=0)||s.pop())if((m?fe(o,c):1===o.nodeType)&&++p&&(f&&((i=o[S]||(o[S]={}))[d]=[E,p]),o===e))break;return(p-=g)===h||p%h==0&&0<=p/h}}},PSEUDO:function(e,o){var t,a=b.pseudos[e]||b.setFilters[e.toLowerCase()]||I.error("unsupported pseudo: "+e);return a[S]?a(o):1<a.length?(t=[e,e,"",o],b.setFilters.hasOwnProperty(e.toLowerCase())?F(function(e,t){var n,r=a(e,o),i=r.length;while(i--)e[n=se.call(e,r[i])]=!(t[n]=r[i])}):function(e){return a(e,0,t)}):a}},pseudos:{not:F(function(e){var r=[],i=[],s=ne(e.replace(ve,"$1"));return s[S]?F(function(e,t,n,r){var i,o=s(e,null,r,[]),a=e.length;while(a--)(i=o[a])&&(e[a]=!(t[a]=i))}):function(e,t,n){return r[0]=e,s(r,null,n,i),r[0]=null,!i.pop()}}),has:F(function(t){return function(e){return 0<I(t,e).length}}),contains:F(function(t){return t=t.replace(O,P),function(e){return-1<(e.textContent||ce.text(e)).indexOf(t)}}),lang:F(function(n){return A.test(n||"")||I.error("unsupported lang: "+n),n=n.replace(O,P).toLowerCase(),function(e){var t;do{if(t=C?e.lang:e.getAttribute("xml:lang")||e.getAttribute("lang"))return(t=t.toLowerCase())===n||0===t.indexOf(n+"-")}while((e=e.parentNode)&&1===e.nodeType);return!1}}),target:function(e){var t=ie.location&&ie.location.hash;return t&&t.slice(1)===e.id},root:function(e){return e===r},focus:function(e){return e===function(){try{return T.activeElement}catch(e){}}()&&T.hasFocus()&&!!(e.type||e.href||~e.tabIndex)},enabled:z(!1),disabled:z(!0),checked:function(e){return fe(e,"input")&&!!e.checked||fe(e,"option")&&!!e.selected},selected:function(e){return e.parentNode&&e.parentNode.selectedIndex,!0===e.selected},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling)if(e.nodeType<6)return!1;return!0},parent:function(e){return!b.pseudos.empty(e)},header:function(e){return q.test(e.nodeName)},input:function(e){return N.test(e.nodeName)},button:function(e){return fe(e,"input")&&"button"===e.type||fe(e,"button")},text:function(e){var t;return fe(e,"input")&&"text"===e.type&&(null==(t=e.getAttribute("type"))||"text"===t.toLowerCase())},first:X(function(){return[0]}),last:X(function(e,t){return[t-1]}),eq:X(function(e,t,n){return[n<0?n+t:n]}),even:X(function(e,t){for(var n=0;n<t;n+=2)e.push(n);return e}),odd:X(function(e,t){for(var n=1;n<t;n+=2)e.push(n);return e}),lt:X(function(e,t,n){var r;for(r=n<0?n+t:t<n?t:n;0<=--r;)e.push(r);return e}),gt:X(function(e,t,n){for(var r=n<0?n+t:n;++r<t;)e.push(r);return e})}}).pseudos.nth=b.pseudos.eq,{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})b.pseudos[e]=B(e);for(e in{submit:!0,reset:!0})b.pseudos[e]=_(e);function G(){}function Y(e,t){var n,r,i,o,a,s,u,l=c[e+" "];if(l)return t?0:l.slice(0);a=e,s=[],u=b.preFilter;while(a){for(o in n&&!(r=y.exec(a))||(r&&(a=a.slice(r[0].length)||a),s.push(i=[])),n=!1,(r=m.exec(a))&&(n=r.shift(),i.push({value:n,type:r[0].replace(ve," ")}),a=a.slice(n.length)),b.filter)!(r=D[o].exec(a))||u[o]&&!(r=u[o](r))||(n=r.shift(),i.push({value:n,type:o,matches:r}),a=a.slice(n.length));if(!n)break}return t?a.length:a?I.error(e):c(e,s).slice(0)}function Q(e){for(var t=0,n=e.length,r="";t<n;t++)r+=e[t].value;return r}function J(a,e,t){var s=e.dir,u=e.next,l=u||s,c=t&&"parentNode"===l,f=n++;return e.first?function(e,t,n){while(e=e[s])if(1===e.nodeType||c)return a(e,t,n);return!1}:function(e,t,n){var r,i,o=[E,f];if(n){while(e=e[s])if((1===e.nodeType||c)&&a(e,t,n))return!0}else while(e=e[s])if(1===e.nodeType||c)if(i=e[S]||(e[S]={}),u&&fe(e,u))e=e[s]||e;else{if((r=i[l])&&r[0]===E&&r[1]===f)return o[2]=r[2];if((i[l]=o)[2]=a(e,t,n))return!0}return!1}}function K(i){return 1<i.length?function(e,t,n){var r=i.length;while(r--)if(!i[r](e,t,n))return!1;return!0}:i[0]}function Z(e,t,n,r,i){for(var o,a=[],s=0,u=e.length,l=null!=t;s<u;s++)(o=e[s])&&(n&&!n(o,r,i)||(a.push(o),l&&t.push(s)));return a}function ee(d,h,g,v,y,e){return v&&!v[S]&&(v=ee(v)),y&&!y[S]&&(y=ee(y,e)),F(function(e,t,n,r){var i,o,a,s,u=[],l=[],c=t.length,f=e||function(e,t,n){for(var r=0,i=t.length;r<i;r++)I(e,t[r],n);return n}(h||"*",n.nodeType?[n]:n,[]),p=!d||!e&&h?f:Z(f,u,d,n,r);if(g?g(p,s=y||(e?d:c||v)?[]:t,n,r):s=p,v){i=Z(s,l),v(i,[],n,r),o=i.length;while(o--)(a=i[o])&&(s[l[o]]=!(p[l[o]]=a))}if(e){if(y||d){if(y){i=[],o=s.length;while(o--)(a=s[o])&&i.push(p[o]=a);y(null,s=[],i,r)}o=s.length;while(o--)(a=s[o])&&-1<(i=y?se.call(e,a):u[o])&&(e[i]=!(t[i]=a))}}else s=Z(s===t?s.splice(c,s.length):s),y?y(null,t,s,r):k.apply(t,s)})}function te(e){for(var i,t,n,r=e.length,o=b.relative[e[0].type],a=o||b.relative[" "],s=o?1:0,u=J(function(e){return e===i},a,!0),l=J(function(e){return-1<se.call(i,e)},a,!0),c=[function(e,t,n){var r=!o&&(n||t!=w)||((i=t).nodeType?u(e,t,n):l(e,t,n));return i=null,r}];s<r;s++)if(t=b.relative[e[s].type])c=[J(K(c),t)];else{if((t=b.filter[e[s].type].apply(null,e[s].matches))[S]){for(n=++s;n<r;n++)if(b.relative[e[n].type])break;return ee(1<s&&K(c),1<s&&Q(e.slice(0,s-1).concat({value:" "===e[s-2].type?"*":""})).replace(ve,"$1"),t,s<n&&te(e.slice(s,n)),n<r&&te(e=e.slice(n)),n<r&&Q(e))}c.push(t)}return K(c)}function ne(e,t){var n,v,y,m,x,r,i=[],o=[],a=u[e+" "];if(!a){t||(t=Y(e)),n=t.length;while(n--)(a=te(t[n]))[S]?i.push(a):o.push(a);(a=u(e,(v=o,m=0<(y=i).length,x=0<v.length,r=function(e,t,n,r,i){var o,a,s,u=0,l="0",c=e&&[],f=[],p=w,d=e||x&&b.find.TAG("*",i),h=E+=null==p?1:Math.random()||.1,g=d.length;for(i&&(w=t==T||t||i);l!==g&&null!=(o=d[l]);l++){if(x&&o){a=0,t||o.ownerDocument==T||(V(o),n=!C);while(s=v[a++])if(s(o,t||T,n)){k.call(r,o);break}i&&(E=h)}m&&((o=!s&&o)&&u--,e&&c.push(o))}if(u+=l,m&&l!==u){a=0;while(s=y[a++])s(c,f,t,n);if(e){if(0<u)while(l--)c[l]||f[l]||(f[l]=pe.call(r));f=Z(f)}k.apply(r,f),i&&!e&&0<f.length&&1<u+y.length&&ce.uniqueSort(r)}return i&&(E=h,w=p),c},m?F(r):r))).selector=e}return a}function re(e,t,n,r){var i,o,a,s,u,l="function"==typeof e&&e,c=!r&&Y(e=l.selector||e);if(n=n||[],1===c.length){if(2<(o=c[0]=c[0].slice(0)).length&&"ID"===(a=o[0]).type&&9===t.nodeType&&C&&b.relative[o[1].type]){if(!(t=(b.find.ID(a.matches[0].replace(O,P),t)||[])[0]))return n;l&&(t=t.parentNode),e=e.slice(o.shift().value.length)}i=D.needsContext.test(e)?0:o.length;while(i--){if(a=o[i],b.relative[s=a.type])break;if((u=b.find[s])&&(r=u(a.matches[0].replace(O,P),H.test(o[0].type)&&U(t.parentNode)||t))){if(o.splice(i,1),!(e=r.length&&Q(o)))return k.apply(n,r),n;break}}}return(l||ne(e,c))(r,t,!C,n,!t||H.test(e)&&U(t.parentNode)||t),n}G.prototype=b.filters=b.pseudos,b.setFilters=new G,le.sortStable=S.split("").sort(l).join("")===S,V(),le.sortDetached=$(function(e){return 1&e.compareDocumentPosition(T.createElement("fieldset"))}),ce.find=I,ce.expr[":"]=ce.expr.pseudos,ce.unique=ce.uniqueSort,I.compile=ne,I.select=re,I.setDocument=V,I.tokenize=Y,I.escape=ce.escapeSelector,I.getText=ce.text,I.isXML=ce.isXMLDoc,I.selectors=ce.expr,I.support=ce.support,I.uniqueSort=ce.uniqueSort}();var d=function(e,t,n){var r=[],i=void 0!==n;while((e=e[t])&&9!==e.nodeType)if(1===e.nodeType){if(i&&ce(e).is(n))break;r.push(e)}return r},h=function(e,t){for(var n=[];e;e=e.nextSibling)1===e.nodeType&&e!==t&&n.push(e);return n},b=ce.expr.match.needsContext,w=/^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;function T(e,n,r){return v(n)?ce.grep(e,function(e,t){return!!n.call(e,t,e)!==r}):n.nodeType?ce.grep(e,function(e){return e===n!==r}):"string"!=typeof n?ce.grep(e,function(e){return-1<se.call(n,e)!==r}):ce.filter(n,e,r)}ce.filter=function(e,t,n){var r=t[0];return n&&(e=":not("+e+")"),1===t.length&&1===r.nodeType?ce.find.matchesSelector(r,e)?[r]:[]:ce.find.matches(e,ce.grep(t,function(e){return 1===e.nodeType}))},ce.fn.extend({find:function(e){var t,n,r=this.length,i=this;if("string"!=typeof e)return this.pushStack(ce(e).filter(function(){for(t=0;t<r;t++)if(ce.contains(i[t],this))return!0}));for(n=this.pushStack([]),t=0;t<r;t++)ce.find(e,i[t],n);return 1<r?ce.uniqueSort(n):n},filter:function(e){return this.pushStack(T(this,e||[],!1))},not:function(e){return this.pushStack(T(this,e||[],!0))},is:function(e){return!!T(this,"string"==typeof e&&b.test(e)?ce(e):e||[],!1).length}});var k,S=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;(ce.fn.init=function(e,t,n){var r,i;if(!e)return this;if(n=n||k,"string"==typeof e){if(!(r="<"===e[0]&&">"===e[e.length-1]&&3<=e.length?[null,e,null]:S.exec(e))||!r[1]&&t)return!t||t.jquery?(t||n).find(e):this.constructor(t).find(e);if(r[1]){if(t=t instanceof ce?t[0]:t,ce.merge(this,ce.parseHTML(r[1],t&&t.nodeType?t.ownerDocument||t:C,!0)),w.test(r[1])&&ce.isPlainObject(t))for(r in t)v(this[r])?this[r](t[r]):this.attr(r,t[r]);return this}return(i=C.getElementById(r[2]))&&(this[0]=i,this.length=1),this}return e.nodeType?(this[0]=e,this.length=1,this):v(e)?void 0!==n.ready?n.ready(e):e(ce):ce.makeArray(e,this)}).prototype=ce.fn,k=ce(C);var E=/^(?:parents|prev(?:Until|All))/,j={children:!0,contents:!0,next:!0,prev:!0};function A(e,t){while((e=e[t])&&1!==e.nodeType);return e}ce.fn.extend({has:function(e){var t=ce(e,this),n=t.length;return this.filter(function(){for(var e=0;e<n;e++)if(ce.contains(this,t[e]))return!0})},closest:function(e,t){var n,r=0,i=this.length,o=[],a="string"!=typeof e&&ce(e);if(!b.test(e))for(;r<i;r++)for(n=this[r];n&&n!==t;n=n.parentNode)if(n.nodeType<11&&(a?-1<a.index(n):1===n.nodeType&&ce.find.matchesSelector(n,e))){o.push(n);break}return this.pushStack(1<o.length?ce.uniqueSort(o):o)},index:function(e){return e?"string"==typeof e?se.call(ce(e),this[0]):se.call(this,e.jquery?e[0]:e):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(e,t){return this.pushStack(ce.uniqueSort(ce.merge(this.get(),ce(e,t))))},addBack:function(e){return this.add(null==e?this.prevObject:this.prevObject.filter(e))}}),ce.each({parent:function(e){var t=e.parentNode;return t&&11!==t.nodeType?t:null},parents:function(e){return d(e,"parentNode")},parentsUntil:function(e,t,n){return d(e,"parentNode",n)},next:function(e){return A(e,"nextSibling")},prev:function(e){return A(e,"previousSibling")},nextAll:function(e){return d(e,"nextSibling")},prevAll:function(e){return d(e,"previousSibling")},nextUntil:function(e,t,n){return d(e,"nextSibling",n)},prevUntil:function(e,t,n){return d(e,"previousSibling",n)},siblings:function(e){return h((e.parentNode||{}).firstChild,e)},children:function(e){return h(e.firstChild)},contents:function(e){return null!=e.contentDocument&&r(e.contentDocument)?e.contentDocument:(fe(e,"template")&&(e=e.content||e),ce.merge([],e.childNodes))}},function(r,i){ce.fn[r]=function(e,t){var n=ce.map(this,i,e);return"Until"!==r.slice(-5)&&(t=e),t&&"string"==typeof t&&(n=ce.filter(t,n)),1<this.length&&(j[r]||ce.uniqueSort(n),E.test(r)&&n.reverse()),this.pushStack(n)}});var D=/[^\x20\t\r\n\f]+/g;function N(e){return e}function q(e){throw e}function L(e,t,n,r){var i;try{e&&v(i=e.promise)?i.call(e).done(t).fail(n):e&&v(i=e.then)?i.call(e,t,n):t.apply(void 0,[e].slice(r))}catch(e){n.apply(void 0,[e])}}ce.Callbacks=function(r){var e,n;r="string"==typeof r?(e=r,n={},ce.each(e.match(D)||[],function(e,t){n[t]=!0}),n):ce.extend({},r);var i,t,o,a,s=[],u=[],l=-1,c=function(){for(a=a||r.once,o=i=!0;u.length;l=-1){t=u.shift();while(++l<s.length)!1===s[l].apply(t[0],t[1])&&r.stopOnFalse&&(l=s.length,t=!1)}r.memory||(t=!1),i=!1,a&&(s=t?[]:"")},f={add:function(){return s&&(t&&!i&&(l=s.length-1,u.push(t)),function n(e){ce.each(e,function(e,t){v(t)?r.unique&&f.has(t)||s.push(t):t&&t.length&&"string"!==x(t)&&n(t)})}(arguments),t&&!i&&c()),this},remove:function(){return ce.each(arguments,function(e,t){var n;while(-1<(n=ce.inArray(t,s,n)))s.splice(n,1),n<=l&&l--}),this},has:function(e){return e?-1<ce.inArray(e,s):0<s.length},empty:function(){return s&&(s=[]),this},disable:function(){return a=u=[],s=t="",this},disabled:function(){return!s},lock:function(){return a=u=[],t||i||(s=t=""),this},locked:function(){return!!a},fireWith:function(e,t){return a||(t=[e,(t=t||[]).slice?t.slice():t],u.push(t),i||c()),this},fire:function(){return f.fireWith(this,arguments),this},fired:function(){return!!o}};return f},ce.extend({Deferred:function(e){var o=[["notify","progress",ce.Callbacks("memory"),ce.Callbacks("memory"),2],["resolve","done",ce.Callbacks("once memory"),ce.Callbacks("once memory"),0,"resolved"],["reject","fail",ce.Callbacks("once memory"),ce.Callbacks("once memory"),1,"rejected"]],i="pending",a={state:function(){return i},always:function(){return s.done(arguments).fail(arguments),this},"catch":function(e){return a.then(null,e)},pipe:function(){var i=arguments;return ce.Deferred(function(r){ce.each(o,function(e,t){var n=v(i[t[4]])&&i[t[4]];s[t[1]](function(){var e=n&&n.apply(this,arguments);e&&v(e.promise)?e.promise().progress(r.notify).done(r.resolve).fail(r.reject):r[t[0]+"With"](this,n?[e]:arguments)})}),i=null}).promise()},then:function(t,n,r){var u=0;function l(i,o,a,s){return function(){var n=this,r=arguments,e=function(){var e,t;if(!(i<u)){if((e=a.apply(n,r))===o.promise())throw new TypeError("Thenable self-resolution");t=e&&("object"==typeof e||"function"==typeof e)&&e.then,v(t)?s?t.call(e,l(u,o,N,s),l(u,o,q,s)):(u++,t.call(e,l(u,o,N,s),l(u,o,q,s),l(u,o,N,o.notifyWith))):(a!==N&&(n=void 0,r=[e]),(s||o.resolveWith)(n,r))}},t=s?e:function(){try{e()}catch(e){ce.Deferred.exceptionHook&&ce.Deferred.exceptionHook(e,t.error),u<=i+1&&(a!==q&&(n=void 0,r=[e]),o.rejectWith(n,r))}};i?t():(ce.Deferred.getErrorHook?t.error=ce.Deferred.getErrorHook():ce.Deferred.getStackHook&&(t.error=ce.Deferred.getStackHook()),ie.setTimeout(t))}}return ce.Deferred(function(e){o[0][3].add(l(0,e,v(r)?r:N,e.notifyWith)),o[1][3].add(l(0,e,v(t)?t:N)),o[2][3].add(l(0,e,v(n)?n:q))}).promise()},promise:function(e){return null!=e?ce.extend(e,a):a}},s={};return ce.each(o,function(e,t){var n=t[2],r=t[5];a[t[1]]=n.add,r&&n.add(function(){i=r},o[3-e][2].disable,o[3-e][3].disable,o[0][2].lock,o[0][3].lock),n.add(t[3].fire),s[t[0]]=function(){return s[t[0]+"With"](this===s?void 0:this,arguments),this},s[t[0]+"With"]=n.fireWith}),a.promise(s),e&&e.call(s,s),s},when:function(e){var n=arguments.length,t=n,r=Array(t),i=ae.call(arguments),o=ce.Deferred(),a=function(t){return function(e){r[t]=this,i[t]=1<arguments.length?ae.call(arguments):e,--n||o.resolveWith(r,i)}};if(n<=1&&(L(e,o.done(a(t)).resolve,o.reject,!n),"pending"===o.state()||v(i[t]&&i[t].then)))return o.then();while(t--)L(i[t],a(t),o.reject);return o.promise()}});var H=/^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;ce.Deferred.exceptionHook=function(e,t){ie.console&&ie.console.warn&&e&&H.test(e.name)&&ie.console.warn("jQuery.Deferred exception: "+e.message,e.stack,t)},ce.readyException=function(e){ie.setTimeout(function(){throw e})};var O=ce.Deferred();function P(){C.removeEventListener("DOMContentLoaded",P),ie.removeEventListener("load",P),ce.ready()}ce.fn.ready=function(e){return O.then(e)["catch"](function(e){ce.readyException(e)}),this},ce.extend({isReady:!1,readyWait:1,ready:function(e){(!0===e?--ce.readyWait:ce.isReady)||(ce.isReady=!0)!==e&&0<--ce.readyWait||O.resolveWith(C,[ce])}}),ce.ready.then=O.then,"complete"===C.readyState||"loading"!==C.readyState&&!C.documentElement.doScroll?ie.setTimeout(ce.ready):(C.addEventListener("DOMContentLoaded",P),ie.addEventListener("load",P));var M=function(e,t,n,r,i,o,a){var s=0,u=e.length,l=null==n;if("object"===x(n))for(s in i=!0,n)M(e,t,s,n[s],!0,o,a);else if(void 0!==r&&(i=!0,v(r)||(a=!0),l&&(a?(t.call(e,r),t=null):(l=t,t=function(e,t,n){return l.call(ce(e),n)})),t))for(;s<u;s++)t(e[s],n,a?r:r.call(e[s],s,t(e[s],n)));return i?e:l?t.call(e):u?t(e[0],n):o},R=/^-ms-/,I=/-([a-z])/g;function W(e,t){return t.toUpperCase()}function F(e){return e.replace(R,"ms-").replace(I,W)}var $=function(e){return 1===e.nodeType||9===e.nodeType||!+e.nodeType};function B(){this.expando=ce.expando+B.uid++}B.uid=1,B.prototype={cache:function(e){var t=e[this.expando];return t||(t={},$(e)&&(e.nodeType?e[this.expando]=t:Object.defineProperty(e,this.expando,{value:t,configurable:!0}))),t},set:function(e,t,n){var r,i=this.cache(e);if("string"==typeof t)i[F(t)]=n;else for(r in t)i[F(r)]=t[r];return i},get:function(e,t){return void 0===t?this.cache(e):e[this.expando]&&e[this.expando][F(t)]},access:function(e,t,n){return void 0===t||t&&"string"==typeof t&&void 0===n?this.get(e,t):(this.set(e,t,n),void 0!==n?n:t)},remove:function(e,t){var n,r=e[this.expando];if(void 0!==r){if(void 0!==t){n=(t=Array.isArray(t)?t.map(F):(t=F(t))in r?[t]:t.match(D)||[]).length;while(n--)delete r[t[n]]}(void 0===t||ce.isEmptyObject(r))&&(e.nodeType?e[this.expando]=void 0:delete e[this.expando])}},hasData:function(e){var t=e[this.expando];return void 0!==t&&!ce.isEmptyObject(t)}};var _=new B,z=new B,X=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,U=/[A-Z]/g;function V(e,t,n){var r,i;if(void 0===n&&1===e.nodeType)if(r="data-"+t.replace(U,"-$&").toLowerCase(),"string"==typeof(n=e.getAttribute(r))){try{n="true"===(i=n)||"false"!==i&&("null"===i?null:i===+i+""?+i:X.test(i)?JSON.parse(i):i)}catch(e){}z.set(e,t,n)}else n=void 0;return n}ce.extend({hasData:function(e){return z.hasData(e)||_.hasData(e)},data:function(e,t,n){return z.access(e,t,n)},removeData:function(e,t){z.remove(e,t)},_data:function(e,t,n){return _.access(e,t,n)},_removeData:function(e,t){_.remove(e,t)}}),ce.fn.extend({data:function(n,e){var t,r,i,o=this[0],a=o&&o.attributes;if(void 0===n){if(this.length&&(i=z.get(o),1===o.nodeType&&!_.get(o,"hasDataAttrs"))){t=a.length;while(t--)a[t]&&0===(r=a[t].name).indexOf("data-")&&(r=F(r.slice(5)),V(o,r,i[r]));_.set(o,"hasDataAttrs",!0)}return i}return"object"==typeof n?this.each(function(){z.set(this,n)}):M(this,function(e){var t;if(o&&void 0===e)return void 0!==(t=z.get(o,n))?t:void 0!==(t=V(o,n))?t:void 0;this.each(function(){z.set(this,n,e)})},null,e,1<arguments.length,null,!0)},removeData:function(e){return this.each(function(){z.remove(this,e)})}}),ce.extend({queue:function(e,t,n){var r;if(e)return t=(t||"fx")+"queue",r=_.get(e,t),n&&(!r||Array.isArray(n)?r=_.access(e,t,ce.makeArray(n)):r.push(n)),r||[]},dequeue:function(e,t){t=t||"fx";var n=ce.queue(e,t),r=n.length,i=n.shift(),o=ce._queueHooks(e,t);"inprogress"===i&&(i=n.shift(),r--),i&&("fx"===t&&n.unshift("inprogress"),delete o.stop,i.call(e,function(){ce.dequeue(e,t)},o)),!r&&o&&o.empty.fire()},_queueHooks:function(e,t){var n=t+"queueHooks";return _.get(e,n)||_.access(e,n,{empty:ce.Callbacks("once memory").add(function(){_.remove(e,[t+"queue",n])})})}}),ce.fn.extend({queue:function(t,n){var e=2;return"string"!=typeof t&&(n=t,t="fx",e--),arguments.length<e?ce.queue(this[0],t):void 0===n?this:this.each(function(){var e=ce.queue(this,t,n);ce._queueHooks(this,t),"fx"===t&&"inprogress"!==e[0]&&ce.dequeue(this,t)})},dequeue:function(e){return this.each(function(){ce.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(e,t){var n,r=1,i=ce.Deferred(),o=this,a=this.length,s=function(){--r||i.resolveWith(o,[o])};"string"!=typeof e&&(t=e,e=void 0),e=e||"fx";while(a--)(n=_.get(o[a],e+"queueHooks"))&&n.empty&&(r++,n.empty.add(s));return s(),i.promise(t)}});var G=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,Y=new RegExp("^(?:([+-])=|)("+G+")([a-z%]*)$","i"),Q=["Top","Right","Bottom","Left"],J=C.documentElement,K=function(e){return ce.contains(e.ownerDocument,e)},Z={composed:!0};J.getRootNode&&(K=function(e){return ce.contains(e.ownerDocument,e)||e.getRootNode(Z)===e.ownerDocument});var ee=function(e,t){return"none"===(e=t||e).style.display||""===e.style.display&&K(e)&&"none"===ce.css(e,"display")};function te(e,t,n,r){var i,o,a=20,s=r?function(){return r.cur()}:function(){return ce.css(e,t,"")},u=s(),l=n&&n[3]||(ce.cssNumber[t]?"":"px"),c=e.nodeType&&(ce.cssNumber[t]||"px"!==l&&+u)&&Y.exec(ce.css(e,t));if(c&&c[3]!==l){u/=2,l=l||c[3],c=+u||1;while(a--)ce.style(e,t,c+l),(1-o)*(1-(o=s()/u||.5))<=0&&(a=0),c/=o;c*=2,ce.style(e,t,c+l),n=n||[]}return n&&(c=+c||+u||0,i=n[1]?c+(n[1]+1)*n[2]:+n[2],r&&(r.unit=l,r.start=c,r.end=i)),i}var ne={};function re(e,t){for(var n,r,i,o,a,s,u,l=[],c=0,f=e.length;c<f;c++)(r=e[c]).style&&(n=r.style.display,t?("none"===n&&(l[c]=_.get(r,"display")||null,l[c]||(r.style.display="")),""===r.style.display&&ee(r)&&(l[c]=(u=a=o=void 0,a=(i=r).ownerDocument,s=i.nodeName,(u=ne[s])||(o=a.body.appendChild(a.createElement(s)),u=ce.css(o,"display"),o.parentNode.removeChild(o),"none"===u&&(u="block"),ne[s]=u)))):"none"!==n&&(l[c]="none",_.set(r,"display",n)));for(c=0;c<f;c++)null!=l[c]&&(e[c].style.display=l[c]);return e}ce.fn.extend({show:function(){return re(this,!0)},hide:function(){return re(this)},toggle:function(e){return"boolean"==typeof e?e?this.show():this.hide():this.each(function(){ee(this)?ce(this).show():ce(this).hide()})}});var xe,be,we=/^(?:checkbox|radio)$/i,Te=/<([a-z][^\/\0>\x20\t\r\n\f]*)/i,Ce=/^$|^module$|\/(?:java|ecma)script/i;xe=C.createDocumentFragment().appendChild(C.createElement("div")),(be=C.createElement("input")).setAttribute("type","radio"),be.setAttribute("checked","checked"),be.setAttribute("name","t"),xe.appendChild(be),le.checkClone=xe.cloneNode(!0).cloneNode(!0).lastChild.checked,xe.innerHTML="<textarea>x</textarea>",le.noCloneChecked=!!xe.cloneNode(!0).lastChild.defaultValue,xe.innerHTML="<option></option>",le.option=!!xe.lastChild;var ke={thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};function Se(e,t){var n;return n="undefined"!=typeof e.getElementsByTagName?e.getElementsByTagName(t||"*"):"undefined"!=typeof e.querySelectorAll?e.querySelectorAll(t||"*"):[],void 0===t||t&&fe(e,t)?ce.merge([e],n):n}function Ee(e,t){for(var n=0,r=e.length;n<r;n++)_.set(e[n],"globalEval",!t||_.get(t[n],"globalEval"))}ke.tbody=ke.tfoot=ke.colgroup=ke.caption=ke.thead,ke.th=ke.td,le.option||(ke.optgroup=ke.option=[1,"<select multiple='multiple'>","</select>"]);var je=/<|&#?\w+;/;function Ae(e,t,n,r,i){for(var o,a,s,u,l,c,f=t.createDocumentFragment(),p=[],d=0,h=e.length;d<h;d++)if((o=e[d])||0===o)if("object"===x(o))ce.merge(p,o.nodeType?[o]:o);else if(je.test(o)){a=a||f.appendChild(t.createElement("div")),s=(Te.exec(o)||["",""])[1].toLowerCase(),u=ke[s]||ke._default,a.innerHTML=u[1]+ce.htmlPrefilter(o)+u[2],c=u[0];while(c--)a=a.lastChild;ce.merge(p,a.childNodes),(a=f.firstChild).textContent=""}else p.push(t.createTextNode(o));f.textContent="",d=0;while(o=p[d++])if(r&&-1<ce.inArray(o,r))i&&i.push(o);else if(l=K(o),a=Se(f.appendChild(o),"script"),l&&Ee(a),n){c=0;while(o=a[c++])Ce.test(o.type||"")&&n.push(o)}return f}var De=/^([^.]*)(?:\.(.+)|)/;function Ne(){return!0}function qe(){return!1}function Le(e,t,n,r,i,o){var a,s;if("object"==typeof t){for(s in"string"!=typeof n&&(r=r||n,n=void 0),t)Le(e,s,n,r,t[s],o);return e}if(null==r&&null==i?(i=n,r=n=void 0):null==i&&("string"==typeof n?(i=r,r=void 0):(i=r,r=n,n=void 0)),!1===i)i=qe;else if(!i)return e;return 1===o&&(a=i,(i=function(e){return ce().off(e),a.apply(this,arguments)}).guid=a.guid||(a.guid=ce.guid++)),e.each(function(){ce.event.add(this,t,i,r,n)})}function He(e,r,t){t?(_.set(e,r,!1),ce.event.add(e,r,{namespace:!1,handler:function(e){var t,n=_.get(this,r);if(1&e.isTrigger&&this[r]){if(n)(ce.event.special[r]||{}).delegateType&&e.stopPropagation();else if(n=ae.call(arguments),_.set(this,r,n),this[r](),t=_.get(this,r),_.set(this,r,!1),n!==t)return e.stopImmediatePropagation(),e.preventDefault(),t}else n&&(_.set(this,r,ce.event.trigger(n[0],n.slice(1),this)),e.stopPropagation(),e.isImmediatePropagationStopped=Ne)}})):void 0===_.get(e,r)&&ce.event.add(e,r,Ne)}ce.event={global:{},add:function(t,e,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=_.get(t);if($(t)){n.handler&&(n=(o=n).handler,i=o.selector),i&&ce.find.matchesSelector(J,i),n.guid||(n.guid=ce.guid++),(u=v.events)||(u=v.events=Object.create(null)),(a=v.handle)||(a=v.handle=function(e){return"undefined"!=typeof ce&&ce.event.triggered!==e.type?ce.event.dispatch.apply(t,arguments):void 0}),l=(e=(e||"").match(D)||[""]).length;while(l--)d=g=(s=De.exec(e[l])||[])[1],h=(s[2]||"").split(".").sort(),d&&(f=ce.event.special[d]||{},d=(i?f.delegateType:f.bindType)||d,f=ce.event.special[d]||{},c=ce.extend({type:d,origType:g,data:r,handler:n,guid:n.guid,selector:i,needsContext:i&&ce.expr.match.needsContext.test(i),namespace:h.join(".")},o),(p=u[d])||((p=u[d]=[]).delegateCount=0,f.setup&&!1!==f.setup.call(t,r,h,a)||t.addEventListener&&t.addEventListener(d,a)),f.add&&(f.add.call(t,c),c.handler.guid||(c.handler.guid=n.guid)),i?p.splice(p.delegateCount++,0,c):p.push(c),ce.event.global[d]=!0)}},remove:function(e,t,n,r,i){var o,a,s,u,l,c,f,p,d,h,g,v=_.hasData(e)&&_.get(e);if(v&&(u=v.events)){l=(t=(t||"").match(D)||[""]).length;while(l--)if(d=g=(s=De.exec(t[l])||[])[1],h=(s[2]||"").split(".").sort(),d){f=ce.event.special[d]||{},p=u[d=(r?f.delegateType:f.bindType)||d]||[],s=s[2]&&new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"),a=o=p.length;while(o--)c=p[o],!i&&g!==c.origType||n&&n.guid!==c.guid||s&&!s.test(c.namespace)||r&&r!==c.selector&&("**"!==r||!c.selector)||(p.splice(o,1),c.selector&&p.delegateCount--,f.remove&&f.remove.call(e,c));a&&!p.length&&(f.teardown&&!1!==f.teardown.call(e,h,v.handle)||ce.removeEvent(e,d,v.handle),delete u[d])}else for(d in u)ce.event.remove(e,d+t[l],n,r,!0);ce.isEmptyObject(u)&&_.remove(e,"handle events")}},dispatch:function(e){var t,n,r,i,o,a,s=new Array(arguments.length),u=ce.event.fix(e),l=(_.get(this,"events")||Object.create(null))[u.type]||[],c=ce.event.special[u.type]||{};for(s[0]=u,t=1;t<arguments.length;t++)s[t]=arguments[t];if(u.delegateTarget=this,!c.preDispatch||!1!==c.preDispatch.call(this,u)){a=ce.event.handlers.call(this,u,l),t=0;while((i=a[t++])&&!u.isPropagationStopped()){u.currentTarget=i.elem,n=0;while((o=i.handlers[n++])&&!u.isImmediatePropagationStopped())u.rnamespace&&!1!==o.namespace&&!u.rnamespace.test(o.namespace)||(u.handleObj=o,u.data=o.data,void 0!==(r=((ce.event.special[o.origType]||{}).handle||o.handler).apply(i.elem,s))&&!1===(u.result=r)&&(u.preventDefault(),u.stopPropagation()))}return c.postDispatch&&c.postDispatch.call(this,u),u.result}},handlers:function(e,t){var n,r,i,o,a,s=[],u=t.delegateCount,l=e.target;if(u&&l.nodeType&&!("click"===e.type&&1<=e.button))for(;l!==this;l=l.parentNode||this)if(1===l.nodeType&&("click"!==e.type||!0!==l.disabled)){for(o=[],a={},n=0;n<u;n++)void 0===a[i=(r=t[n]).selector+" "]&&(a[i]=r.needsContext?-1<ce(i,this).index(l):ce.find(i,this,null,[l]).length),a[i]&&o.push(r);o.length&&s.push({elem:l,handlers:o})}return l=this,u<t.length&&s.push({elem:l,handlers:t.slice(u)}),s},addProp:function(t,e){Object.defineProperty(ce.Event.prototype,t,{enumerable:!0,configurable:!0,get:v(e)?function(){if(this.originalEvent)return e(this.originalEvent)}:function(){if(this.originalEvent)return this.originalEvent[t]},set:function(e){Object.defineProperty(this,t,{enumerable:!0,configurable:!0,writable:!0,value:e})}})},fix:function(e){return e[ce.expando]?e:new ce.Event(e)},special:{load:{noBubble:!0},click:{setup:function(e){var t=this||e;return we.test(t.type)&&t.click&&fe(t,"input")&&He(t,"click",!0),!1},trigger:function(e){var t=this||e;return we.test(t.type)&&t.click&&fe(t,"input")&&He(t,"click"),!0},_default:function(e){var t=e.target;return we.test(t.type)&&t.click&&fe(t,"input")&&_.get(t,"click")||fe(t,"a")}},beforeunload:{postDispatch:function(e){void 0!==e.result&&e.originalEvent&&(e.originalEvent.returnValue=e.result)}}}},ce.removeEvent=function(e,t,n){e.removeEventListener&&e.removeEventListener(t,n)},ce.Event=function(e,t){if(!(this instanceof ce.Event))return new ce.Event(e,t);e&&e.type?(this.originalEvent=e,this.type=e.type,this.isDefaultPrevented=e.defaultPrevented||void 0===e.defaultPrevented&&!1===e.returnValue?Ne:qe,this.target=e.target&&3===e.target.nodeType?e.target.parentNode:e.target,this.currentTarget=e.currentTarget,this.relatedTarget=e.relatedTarget):this.type=e,t&&ce.extend(this,t),this.timeStamp=e&&e.timeStamp||Date.now(),this[ce.expando]=!0},ce.Event.prototype={constructor:ce.Event,isDefaultPrevented:qe,isPropagationStopped:qe,isImmediatePropagationStopped:qe,isSimulated:!1,preventDefault:function(){var e=this.originalEvent;this.isDefaultPrevented=Ne,e&&!this.isSimulated&&e.preventDefault()},stopPropagation:function(){var e=this.originalEvent;this.isPropagationStopped=Ne,e&&!this.isSimulated&&e.stopPropagation()},stopImmediatePropagation:function(){var e=this.originalEvent;this.isImmediatePropagationStopped=Ne,e&&!this.isSimulated&&e.stopImmediatePropagation(),this.stopPropagation()}},ce.each({altKey:!0,bubbles:!0,cancelable:!0,changedTouches:!0,ctrlKey:!0,detail:!0,eventPhase:!0,metaKey:!0,pageX:!0,pageY:!0,shiftKey:!0,view:!0,"char":!0,code:!0,charCode:!0,key:!0,keyCode:!0,button:!0,buttons:!0,clientX:!0,clientY:!0,offsetX:!0,offsetY:!0,pointerId:!0,pointerType:!0,screenX:!0,screenY:!0,targetTouches:!0,toElement:!0,touches:!0,which:!0},ce.event.addProp),ce.each({focus:"focusin",blur:"focusout"},function(r,i){function o(e){if(C.documentMode){var t=_.get(this,"handle"),n=ce.event.fix(e);n.type="focusin"===e.type?"focus":"blur",n.isSimulated=!0,t(e),n.target===n.currentTarget&&t(n)}else ce.event.simulate(i,e.target,ce.event.fix(e))}ce.event.special[r]={setup:function(){var e;if(He(this,r,!0),!C.documentMode)return!1;(e=_.get(this,i))||this.addEventListener(i,o),_.set(this,i,(e||0)+1)},trigger:function(){return He(this,r),!0},teardown:function(){var e;if(!C.documentMode)return!1;(e=_.get(this,i)-1)?_.set(this,i,e):(this.removeEventListener(i,o),_.remove(this,i))},_default:function(e){return _.get(e.target,r)},delegateType:i},ce.event.special[i]={setup:function(){var e=this.ownerDocument||this.document||this,t=C.documentMode?this:e,n=_.get(t,i);n||(C.documentMode?this.addEventListener(i,o):e.addEventListener(r,o,!0)),_.set(t,i,(n||0)+1)},teardown:function(){var e=this.ownerDocument||this.document||this,t=C.documentMode?this:e,n=_.get(t,i)-1;n?_.set(t,i,n):(C.documentMode?this.removeEventListener(i,o):e.removeEventListener(r,o,!0),_.remove(t,i))}}}),ce.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(e,i){ce.event.special[e]={delegateType:i,bindType:i,handle:function(e){var t,n=e.relatedTarget,r=e.handleObj;return n&&(n===this||ce.contains(this,n))||(e.type=r.origType,t=r.handler.apply(this,arguments),e.type=i),t}}}),ce.fn.extend({on:function(e,t,n,r){return Le(this,e,t,n,r)},one:function(e,t,n,r){return Le(this,e,t,n,r,1)},off:function(e,t,n){var r,i;if(e&&e.preventDefault&&e.handleObj)return r=e.handleObj,ce(e.delegateTarget).off(r.namespace?r.origType+"."+r.namespace:r.origType,r.selector,r.handler),this;if("object"==typeof e){for(i in e)this.off(i,t,e[i]);return this}return!1!==t&&"function"!=typeof t||(n=t,t=void 0),!1===n&&(n=qe),this.each(function(){ce.event.remove(this,e,n,t)})}});var Oe=/<script|<style|<link/i,Pe=/checked\s*(?:[^=]|=\s*.checked.)/i,Me=/^\s*<!\[CDATA\[|\]\]>\s*$/g;function Re(e,t){return fe(e,"table")&&fe(11!==t.nodeType?t:t.firstChild,"tr")&&ce(e).children("tbody")[0]||e}function Ie(e){return e.type=(null!==e.getAttribute("type"))+"/"+e.type,e}function We(e){return"true/"===(e.type||"").slice(0,5)?e.type=e.type.slice(5):e.removeAttribute("type"),e}function Fe(e,t){var n,r,i,o,a,s;if(1===t.nodeType){if(_.hasData(e)&&(s=_.get(e).events))for(i in _.remove(t,"handle events"),s)for(n=0,r=s[i].length;n<r;n++)ce.event.add(t,i,s[i][n]);z.hasData(e)&&(o=z.access(e),a=ce.extend({},o),z.set(t,a))}}function $e(n,r,i,o){r=g(r);var e,t,a,s,u,l,c=0,f=n.length,p=f-1,d=r[0],h=v(d);if(h||1<f&&"string"==typeof d&&!le.checkClone&&Pe.test(d))return n.each(function(e){var t=n.eq(e);h&&(r[0]=d.call(this,e,t.html())),$e(t,r,i,o)});if(f&&(t=(e=Ae(r,n[0].ownerDocument,!1,n,o)).firstChild,1===e.childNodes.length&&(e=t),t||o)){for(s=(a=ce.map(Se(e,"script"),Ie)).length;c<f;c++)u=e,c!==p&&(u=ce.clone(u,!0,!0),s&&ce.merge(a,Se(u,"script"))),i.call(n[c],u,c);if(s)for(l=a[a.length-1].ownerDocument,ce.map(a,We),c=0;c<s;c++)u=a[c],Ce.test(u.type||"")&&!_.access(u,"globalEval")&&ce.contains(l,u)&&(u.src&&"module"!==(u.type||"").toLowerCase()?ce._evalUrl&&!u.noModule&&ce._evalUrl(u.src,{nonce:u.nonce||u.getAttribute("nonce")},l):m(u.textContent.replace(Me,""),u,l))}return n}function Be(e,t,n){for(var r,i=t?ce.filter(t,e):e,o=0;null!=(r=i[o]);o++)n||1!==r.nodeType||ce.cleanData(Se(r)),r.parentNode&&(n&&K(r)&&Ee(Se(r,"script")),r.parentNode.removeChild(r));return e}ce.extend({htmlPrefilter:function(e){return e},clone:function(e,t,n){var r,i,o,a,s,u,l,c=e.cloneNode(!0),f=K(e);if(!(le.noCloneChecked||1!==e.nodeType&&11!==e.nodeType||ce.isXMLDoc(e)))for(a=Se(c),r=0,i=(o=Se(e)).length;r<i;r++)s=o[r],u=a[r],void 0,"input"===(l=u.nodeName.toLowerCase())&&we.test(s.type)?u.checked=s.checked:"input"!==l&&"textarea"!==l||(u.defaultValue=s.defaultValue);if(t)if(n)for(o=o||Se(e),a=a||Se(c),r=0,i=o.length;r<i;r++)Fe(o[r],a[r]);else Fe(e,c);return 0<(a=Se(c,"script")).length&&Ee(a,!f&&Se(e,"script")),c},cleanData:function(e){for(var t,n,r,i=ce.event.special,o=0;void 0!==(n=e[o]);o++)if($(n)){if(t=n[_.expando]){if(t.events)for(r in t.events)i[r]?ce.event.remove(n,r):ce.removeEvent(n,r,t.handle);n[_.expando]=void 0}n[z.expando]&&(n[z.expando]=void 0)}}}),ce.fn.extend({detach:function(e){return Be(this,e,!0)},remove:function(e){return Be(this,e)},text:function(e){return M(this,function(e){return void 0===e?ce.text(this):this.empty().each(function(){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||(this.textContent=e)})},null,e,arguments.length)},append:function(){return $e(this,arguments,function(e){1!==this.nodeType&&11!==this.nodeType&&9!==this.nodeType||Re(this,e).appendChild(e)})},prepend:function(){return $e(this,arguments,function(e){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var t=Re(this,e);t.insertBefore(e,t.firstChild)}})},before:function(){return $e(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this)})},after:function(){return $e(this,arguments,function(e){this.parentNode&&this.parentNode.insertBefore(e,this.nextSibling)})},empty:function(){for(var e,t=0;null!=(e=this[t]);t++)1===e.nodeType&&(ce.cleanData(Se(e,!1)),e.textContent="");return this},clone:function(e,t){return e=null!=e&&e,t=null==t?e:t,this.map(function(){return ce.clone(this,e,t)})},html:function(e){return M(this,function(e){var t=this[0]||{},n=0,r=this.length;if(void 0===e&&1===t.nodeType)return t.innerHTML;if("string"==typeof e&&!Oe.test(e)&&!ke[(Te.exec(e)||["",""])[1].toLowerCase()]){e=ce.htmlPrefilter(e);try{for(;n<r;n++)1===(t=this[n]||{}).nodeType&&(ce.cleanData(Se(t,!1)),t.innerHTML=e);t=0}catch(e){}}t&&this.empty().append(e)},null,e,arguments.length)},replaceWith:function(){var n=[];return $e(this,arguments,function(e){var t=this.parentNode;ce.inArray(this,n)<0&&(ce.cleanData(Se(this)),t&&t.replaceChild(e,this))},n)}}),ce.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,a){ce.fn[e]=function(e){for(var t,n=[],r=ce(e),i=r.length-1,o=0;o<=i;o++)t=o===i?this:this.clone(!0),ce(r[o])[a](t),s.apply(n,t.get());return this.pushStack(n)}});var _e=new RegExp("^("+G+")(?!px)[a-z%]+$","i"),ze=/^--/,Xe=function(e){var t=e.ownerDocument.defaultView;return t&&t.opener||(t=ie),t.getComputedStyle(e)},Ue=function(e,t,n){var r,i,o={};for(i in t)o[i]=e.style[i],e.style[i]=t[i];for(i in r=n.call(e),t)e.style[i]=o[i];return r},Ve=new RegExp(Q.join("|"),"i");function Ge(e,t,n){var r,i,o,a,s=ze.test(t),u=e.style;return(n=n||Xe(e))&&(a=n.getPropertyValue(t)||n[t],s&&a&&(a=a.replace(ve,"$1")||void 0),""!==a||K(e)||(a=ce.style(e,t)),!le.pixelBoxStyles()&&_e.test(a)&&Ve.test(t)&&(r=u.width,i=u.minWidth,o=u.maxWidth,u.minWidth=u.maxWidth=u.width=a,a=n.width,u.width=r,u.minWidth=i,u.maxWidth=o)),void 0!==a?a+"":a}function Ye(e,t){return{get:function(){if(!e())return(this.get=t).apply(this,arguments);delete this.get}}}!function(){function e(){if(l){u.style.cssText="position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0",l.style.cssText="position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%",J.appendChild(u).appendChild(l);var e=ie.getComputedStyle(l);n="1%"!==e.top,s=12===t(e.marginLeft),l.style.right="60%",o=36===t(e.right),r=36===t(e.width),l.style.position="absolute",i=12===t(l.offsetWidth/3),J.removeChild(u),l=null}}function t(e){return Math.round(parseFloat(e))}var n,r,i,o,a,s,u=C.createElement("div"),l=C.createElement("div");l.style&&(l.style.backgroundClip="content-box",l.cloneNode(!0).style.backgroundClip="",le.clearCloneStyle="content-box"===l.style.backgroundClip,ce.extend(le,{boxSizingReliable:function(){return e(),r},pixelBoxStyles:function(){return e(),o},pixelPosition:function(){return e(),n},reliableMarginLeft:function(){return e(),s},scrollboxSize:function(){return e(),i},reliableTrDimensions:function(){var e,t,n,r;return null==a&&(e=C.createElement("table"),t=C.createElement("tr"),n=C.createElement("div"),e.style.cssText="position:absolute;left:-11111px;border-collapse:separate",t.style.cssText="box-sizing:content-box;border:1px solid",t.style.height="1px",n.style.height="9px",n.style.display="block",J.appendChild(e).appendChild(t).appendChild(n),r=ie.getComputedStyle(t),a=parseInt(r.height,10)+parseInt(r.borderTopWidth,10)+parseInt(r.borderBottomWidth,10)===t.offsetHeight,J.removeChild(e)),a}}))}();var Qe=["Webkit","Moz","ms"],Je=C.createElement("div").style,Ke={};function Ze(e){var t=ce.cssProps[e]||Ke[e];return t||(e in Je?e:Ke[e]=function(e){var t=e[0].toUpperCase()+e.slice(1),n=Qe.length;while(n--)if((e=Qe[n]+t)in Je)return e}(e)||e)}var et=/^(none|table(?!-c[ea]).+)/,tt={position:"absolute",visibility:"hidden",display:"block"},nt={letterSpacing:"0",fontWeight:"400"};function rt(e,t,n){var r=Y.exec(t);return r?Math.max(0,r[2]-(n||0))+(r[3]||"px"):t}function it(e,t,n,r,i,o){var a="width"===t?1:0,s=0,u=0,l=0;if(n===(r?"border":"content"))return 0;for(;a<4;a+=2)"margin"===n&&(l+=ce.css(e,n+Q[a],!0,i)),r?("content"===n&&(u-=ce.css(e,"padding"+Q[a],!0,i)),"margin"!==n&&(u-=ce.css(e,"border"+Q[a]+"Width",!0,i))):(u+=ce.css(e,"padding"+Q[a],!0,i),"padding"!==n?u+=ce.css(e,"border"+Q[a]+"Width",!0,i):s+=ce.css(e,"border"+Q[a]+"Width",!0,i));return!r&&0<=o&&(u+=Math.max(0,Math.ceil(e["offset"+t[0].toUpperCase()+t.slice(1)]-o-u-s-.5))||0),u+l}function ot(e,t,n){var r=Xe(e),i=(!le.boxSizingReliable()||n)&&"border-box"===ce.css(e,"boxSizing",!1,r),o=i,a=Ge(e,t,r),s="offset"+t[0].toUpperCase()+t.slice(1);if(_e.test(a)){if(!n)return a;a="auto"}return(!le.boxSizingReliable()&&i||!le.reliableTrDimensions()&&fe(e,"tr")||"auto"===a||!parseFloat(a)&&"inline"===ce.css(e,"display",!1,r))&&e.getClientRects().length&&(i="border-box"===ce.css(e,"boxSizing",!1,r),(o=s in e)&&(a=e[s])),(a=parseFloat(a)||0)+it(e,t,n||(i?"border":"content"),o,r,a)+"px"}function at(e,t,n,r,i){return new at.prototype.init(e,t,n,r,i)}ce.extend({cssHooks:{opacity:{get:function(e,t){if(t){var n=Ge(e,"opacity");return""===n?"1":n}}}},cssNumber:{animationIterationCount:!0,aspectRatio:!0,borderImageSlice:!0,columnCount:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,scale:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeMiterlimit:!0,strokeOpacity:!0},cssProps:{},style:function(e,t,n,r){if(e&&3!==e.nodeType&&8!==e.nodeType&&e.style){var i,o,a,s=F(t),u=ze.test(t),l=e.style;if(u||(t=Ze(s)),a=ce.cssHooks[t]||ce.cssHooks[s],void 0===n)return a&&"get"in a&&void 0!==(i=a.get(e,!1,r))?i:l[t];"string"===(o=typeof n)&&(i=Y.exec(n))&&i[1]&&(n=te(e,t,i),o="number"),null!=n&&n==n&&("number"!==o||u||(n+=i&&i[3]||(ce.cssNumber[s]?"":"px")),le.clearCloneStyle||""!==n||0!==t.indexOf("background")||(l[t]="inherit"),a&&"set"in a&&void 0===(n=a.set(e,n,r))||(u?l.setProperty(t,n):l[t]=n))}},css:function(e,t,n,r){var i,o,a,s=F(t);return ze.test(t)||(t=Ze(s)),(a=ce.cssHooks[t]||ce.cssHooks[s])&&"get"in a&&(i=a.get(e,!0,n)),void 0===i&&(i=Ge(e,t,r)),"normal"===i&&t in nt&&(i=nt[t]),""===n||n?(o=parseFloat(i),!0===n||isFinite(o)?o||0:i):i}}),ce.each(["height","width"],function(e,u){ce.cssHooks[u]={get:function(e,t,n){if(t)return!et.test(ce.css(e,"display"))||e.getClientRects().length&&e.getBoundingClientRect().width?ot(e,u,n):Ue(e,tt,function(){return ot(e,u,n)})},set:function(e,t,n){var r,i=Xe(e),o=!le.scrollboxSize()&&"absolute"===i.position,a=(o||n)&&"border-box"===ce.css(e,"boxSizing",!1,i),s=n?it(e,u,n,a,i):0;return a&&o&&(s-=Math.ceil(e["offset"+u[0].toUpperCase()+u.slice(1)]-parseFloat(i[u])-it(e,u,"border",!1,i)-.5)),s&&(r=Y.exec(t))&&"px"!==(r[3]||"px")&&(e.style[u]=t,t=ce.css(e,u)),rt(0,t,s)}}}),ce.cssHooks.marginLeft=Ye(le.reliableMarginLeft,function(e,t){if(t)return(parseFloat(Ge(e,"marginLeft"))||e.getBoundingClientRect().left-Ue(e,{marginLeft:0},function(){return e.getBoundingClientRect().left}))+"px"}),ce.each({margin:"",padding:"",border:"Width"},function(i,o){ce.cssHooks[i+o]={expand:function(e){for(var t=0,n={},r="string"==typeof e?e.split(" "):[e];t<4;t++)n[i+Q[t]+o]=r[t]||r[t-2]||r[0];return n}},"margin"!==i&&(ce.cssHooks[i+o].set=rt)}),ce.fn.extend({css:function(e,t){return M(this,function(e,t,n){var r,i,o={},a=0;if(Array.isArray(t)){for(r=Xe(e),i=t.length;a<i;a++)o[t[a]]=ce.css(e,t[a],!1,r);return o}return void 0!==n?ce.style(e,t,n):ce.css(e,t)},e,t,1<arguments.length)}}),((ce.Tween=at).prototype={constructor:at,init:function(e,t,n,r,i,o){this.elem=e,this.prop=n,this.easing=i||ce.easing._default,this.options=t,this.start=this.now=this.cur(),this.end=r,this.unit=o||(ce.cssNumber[n]?"":"px")},cur:function(){var e=at.propHooks[this.prop];return e&&e.get?e.get(this):at.propHooks._default.get(this)},run:function(e){var t,n=at.propHooks[this.prop];return this.options.duration?this.pos=t=ce.easing[this.easing](e,this.options.duration*e,0,1,this.options.duration):this.pos=t=e,this.now=(this.end-this.start)*t+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),n&&n.set?n.set(this):at.propHooks._default.set(this),this}}).init.prototype=at.prototype,(at.propHooks={_default:{get:function(e){var t;return 1!==e.elem.nodeType||null!=e.elem[e.prop]&&null==e.elem.style[e.prop]?e.elem[e.prop]:(t=ce.css(e.elem,e.prop,""))&&"auto"!==t?t:0},set:function(e){ce.fx.step[e.prop]?ce.fx.step[e.prop](e):1!==e.elem.nodeType||!ce.cssHooks[e.prop]&&null==e.elem.style[Ze(e.prop)]?e.elem[e.prop]=e.now:ce.style(e.elem,e.prop,e.now+e.unit)}}}).scrollTop=at.propHooks.scrollLeft={set:function(e){e.elem.nodeType&&e.elem.parentNode&&(e.elem[e.prop]=e.now)}},ce.easing={linear:function(e){return e},swing:function(e){return.5-Math.cos(e*Math.PI)/2},_default:"swing"},ce.fx=at.prototype.init,ce.fx.step={};var st,ut,lt,ct,ft=/^(?:toggle|show|hide)$/,pt=/queueHooks$/;function dt(){ut&&(!1===C.hidden&&ie.requestAnimationFrame?ie.requestAnimationFrame(dt):ie.setTimeout(dt,ce.fx.interval),ce.fx.tick())}function ht(){return ie.setTimeout(function(){st=void 0}),st=Date.now()}function gt(e,t){var n,r=0,i={height:e};for(t=t?1:0;r<4;r+=2-t)i["margin"+(n=Q[r])]=i["padding"+n]=e;return t&&(i.opacity=i.width=e),i}function vt(e,t,n){for(var r,i=(yt.tweeners[t]||[]).concat(yt.tweeners["*"]),o=0,a=i.length;o<a;o++)if(r=i[o].call(n,t,e))return r}function yt(o,e,t){var n,a,r=0,i=yt.prefilters.length,s=ce.Deferred().always(function(){delete u.elem}),u=function(){if(a)return!1;for(var e=st||ht(),t=Math.max(0,l.startTime+l.duration-e),n=1-(t/l.duration||0),r=0,i=l.tweens.length;r<i;r++)l.tweens[r].run(n);return s.notifyWith(o,[l,n,t]),n<1&&i?t:(i||s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l]),!1)},l=s.promise({elem:o,props:ce.extend({},e),opts:ce.extend(!0,{specialEasing:{},easing:ce.easing._default},t),originalProperties:e,originalOptions:t,startTime:st||ht(),duration:t.duration,tweens:[],createTween:function(e,t){var n=ce.Tween(o,l.opts,e,t,l.opts.specialEasing[e]||l.opts.easing);return l.tweens.push(n),n},stop:function(e){var t=0,n=e?l.tweens.length:0;if(a)return this;for(a=!0;t<n;t++)l.tweens[t].run(1);return e?(s.notifyWith(o,[l,1,0]),s.resolveWith(o,[l,e])):s.rejectWith(o,[l,e]),this}}),c=l.props;for(!function(e,t){var n,r,i,o,a;for(n in e)if(i=t[r=F(n)],o=e[n],Array.isArray(o)&&(i=o[1],o=e[n]=o[0]),n!==r&&(e[r]=o,delete e[n]),(a=ce.cssHooks[r])&&"expand"in a)for(n in o=a.expand(o),delete e[r],o)n in e||(e[n]=o[n],t[n]=i);else t[r]=i}(c,l.opts.specialEasing);r<i;r++)if(n=yt.prefilters[r].call(l,o,c,l.opts))return v(n.stop)&&(ce._queueHooks(l.elem,l.opts.queue).stop=n.stop.bind(n)),n;return ce.map(c,vt,l),v(l.opts.start)&&l.opts.start.call(o,l),l.progress(l.opts.progress).done(l.opts.done,l.opts.complete).fail(l.opts.fail).always(l.opts.always),ce.fx.timer(ce.extend(u,{elem:o,anim:l,queue:l.opts.queue})),l}ce.Animation=ce.extend(yt,{tweeners:{"*":[function(e,t){var n=this.createTween(e,t);return te(n.elem,e,Y.exec(t),n),n}]},tweener:function(e,t){v(e)?(t=e,e=["*"]):e=e.match(D);for(var n,r=0,i=e.length;r<i;r++)n=e[r],yt.tweeners[n]=yt.tweeners[n]||[],yt.tweeners[n].unshift(t)},prefilters:[function(e,t,n){var r,i,o,a,s,u,l,c,f="width"in t||"height"in t,p=this,d={},h=e.style,g=e.nodeType&&ee(e),v=_.get(e,"fxshow");for(r in n.queue||(null==(a=ce._queueHooks(e,"fx")).unqueued&&(a.unqueued=0,s=a.empty.fire,a.empty.fire=function(){a.unqueued||s()}),a.unqueued++,p.always(function(){p.always(function(){a.unqueued--,ce.queue(e,"fx").length||a.empty.fire()})})),t)if(i=t[r],ft.test(i)){if(delete t[r],o=o||"toggle"===i,i===(g?"hide":"show")){if("show"!==i||!v||void 0===v[r])continue;g=!0}d[r]=v&&v[r]||ce.style(e,r)}if((u=!ce.isEmptyObject(t))||!ce.isEmptyObject(d))for(r in f&&1===e.nodeType&&(n.overflow=[h.overflow,h.overflowX,h.overflowY],null==(l=v&&v.display)&&(l=_.get(e,"display")),"none"===(c=ce.css(e,"display"))&&(l?c=l:(re([e],!0),l=e.style.display||l,c=ce.css(e,"display"),re([e]))),("inline"===c||"inline-block"===c&&null!=l)&&"none"===ce.css(e,"float")&&(u||(p.done(function(){h.display=l}),null==l&&(c=h.display,l="none"===c?"":c)),h.display="inline-block")),n.overflow&&(h.overflow="hidden",p.always(function(){h.overflow=n.overflow[0],h.overflowX=n.overflow[1],h.overflowY=n.overflow[2]})),u=!1,d)u||(v?"hidden"in v&&(g=v.hidden):v=_.access(e,"fxshow",{display:l}),o&&(v.hidden=!g),g&&re([e],!0),p.done(function(){for(r in g||re([e]),_.remove(e,"fxshow"),d)ce.style(e,r,d[r])})),u=vt(g?v[r]:0,r,p),r in v||(v[r]=u.start,g&&(u.end=u.start,u.start=0))}],prefilter:function(e,t){t?yt.prefilters.unshift(e):yt.prefilters.push(e)}}),ce.speed=function(e,t,n){var r=e&&"object"==typeof e?ce.extend({},e):{complete:n||!n&&t||v(e)&&e,duration:e,easing:n&&t||t&&!v(t)&&t};return ce.fx.off?r.duration=0:"number"!=typeof r.duration&&(r.duration in ce.fx.speeds?r.duration=ce.fx.speeds[r.duration]:r.duration=ce.fx.speeds._default),null!=r.queue&&!0!==r.queue||(r.queue="fx"),r.old=r.complete,r.complete=function(){v(r.old)&&r.old.call(this),r.queue&&ce.dequeue(this,r.queue)},r},ce.fn.extend({fadeTo:function(e,t,n,r){return this.filter(ee).css("opacity",0).show().end().animate({opacity:t},e,n,r)},animate:function(t,e,n,r){var i=ce.isEmptyObject(t),o=ce.speed(e,n,r),a=function(){var e=yt(this,ce.extend({},t),o);(i||_.get(this,"finish"))&&e.stop(!0)};return a.finish=a,i||!1===o.queue?this.each(a):this.queue(o.queue,a)},stop:function(i,e,o){var a=function(e){var t=e.stop;delete e.stop,t(o)};return"string"!=typeof i&&(o=e,e=i,i=void 0),e&&this.queue(i||"fx",[]),this.each(function(){var e=!0,t=null!=i&&i+"queueHooks",n=ce.timers,r=_.get(this);if(t)r[t]&&r[t].stop&&a(r[t]);else for(t in r)r[t]&&r[t].stop&&pt.test(t)&&a(r[t]);for(t=n.length;t--;)n[t].elem!==this||null!=i&&n[t].queue!==i||(n[t].anim.stop(o),e=!1,n.splice(t,1));!e&&o||ce.dequeue(this,i)})},finish:function(a){return!1!==a&&(a=a||"fx"),this.each(function(){var e,t=_.get(this),n=t[a+"queue"],r=t[a+"queueHooks"],i=ce.timers,o=n?n.length:0;for(t.finish=!0,ce.queue(this,a,[]),r&&r.stop&&r.stop.call(this,!0),e=i.length;e--;)i[e].elem===this&&i[e].queue===a&&(i[e].anim.stop(!0),i.splice(e,1));for(e=0;e<o;e++)n[e]&&n[e].finish&&n[e].finish.call(this);delete t.finish})}}),ce.each(["toggle","show","hide"],function(e,r){var i=ce.fn[r];ce.fn[r]=function(e,t,n){return null==e||"boolean"==typeof e?i.apply(this,arguments):this.animate(gt(r,!0),e,t,n)}}),ce.each({slideDown:gt("show"),slideUp:gt("hide"),slideToggle:gt("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,r){ce.fn[e]=function(e,t,n){return this.animate(r,e,t,n)}}),ce.timers=[],ce.fx.tick=function(){var e,t=0,n=ce.timers;for(st=Date.now();t<n.length;t++)(e=n[t])()||n[t]!==e||n.splice(t--,1);n.length||ce.fx.stop(),st=void 0},ce.fx.timer=function(e){ce.timers.push(e),ce.fx.start()},ce.fx.interval=13,ce.fx.start=function(){ut||(ut=!0,dt())},ce.fx.stop=function(){ut=null},ce.fx.speeds={slow:600,fast:200,_default:400},ce.fn.delay=function(r,e){return r=ce.fx&&ce.fx.speeds[r]||r,e=e||"fx",this.queue(e,function(e,t){var n=ie.setTimeout(e,r);t.stop=function(){ie.clearTimeout(n)}})},lt=C.createElement("input"),ct=C.createElement("select").appendChild(C.createElement("option")),lt.type="checkbox",le.checkOn=""!==lt.value,le.optSelected=ct.selected,(lt=C.createElement("input")).value="t",lt.type="radio",le.radioValue="t"===lt.value;var mt,xt=ce.expr.attrHandle;ce.fn.extend({attr:function(e,t){return M(this,ce.attr,e,t,1<arguments.length)},removeAttr:function(e){return this.each(function(){ce.removeAttr(this,e)})}}),ce.extend({attr:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return"undefined"==typeof e.getAttribute?ce.prop(e,t,n):(1===o&&ce.isXMLDoc(e)||(i=ce.attrHooks[t.toLowerCase()]||(ce.expr.match.bool.test(t)?mt:void 0)),void 0!==n?null===n?void ce.removeAttr(e,t):i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:(e.setAttribute(t,n+""),n):i&&"get"in i&&null!==(r=i.get(e,t))?r:null==(r=ce.find.attr(e,t))?void 0:r)},attrHooks:{type:{set:function(e,t){if(!le.radioValue&&"radio"===t&&fe(e,"input")){var n=e.value;return e.setAttribute("type",t),n&&(e.value=n),t}}}},removeAttr:function(e,t){var n,r=0,i=t&&t.match(D);if(i&&1===e.nodeType)while(n=i[r++])e.removeAttribute(n)}}),mt={set:function(e,t,n){return!1===t?ce.removeAttr(e,n):e.setAttribute(n,n),n}},ce.each(ce.expr.match.bool.source.match(/\w+/g),function(e,t){var a=xt[t]||ce.find.attr;xt[t]=function(e,t,n){var r,i,o=t.toLowerCase();return n||(i=xt[o],xt[o]=r,r=null!=a(e,t,n)?o:null,xt[o]=i),r}});var bt=/^(?:input|select|textarea|button)$/i,wt=/^(?:a|area)$/i;function Tt(e){return(e.match(D)||[]).join(" ")}function Ct(e){return e.getAttribute&&e.getAttribute("class")||""}function kt(e){return Array.isArray(e)?e:"string"==typeof e&&e.match(D)||[]}ce.fn.extend({prop:function(e,t){return M(this,ce.prop,e,t,1<arguments.length)},removeProp:function(e){return this.each(function(){delete this[ce.propFix[e]||e]})}}),ce.extend({prop:function(e,t,n){var r,i,o=e.nodeType;if(3!==o&&8!==o&&2!==o)return 1===o&&ce.isXMLDoc(e)||(t=ce.propFix[t]||t,i=ce.propHooks[t]),void 0!==n?i&&"set"in i&&void 0!==(r=i.set(e,n,t))?r:e[t]=n:i&&"get"in i&&null!==(r=i.get(e,t))?r:e[t]},propHooks:{tabIndex:{get:function(e){var t=ce.find.attr(e,"tabindex");return t?parseInt(t,10):bt.test(e.nodeName)||wt.test(e.nodeName)&&e.href?0:-1}}},propFix:{"for":"htmlFor","class":"className"}}),le.optSelected||(ce.propHooks.selected={get:function(e){var t=e.parentNode;return t&&t.parentNode&&t.parentNode.selectedIndex,null},set:function(e){var t=e.parentNode;t&&(t.selectedIndex,t.parentNode&&t.parentNode.selectedIndex)}}),ce.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){ce.propFix[this.toLowerCase()]=this}),ce.fn.extend({addClass:function(t){var e,n,r,i,o,a;return v(t)?this.each(function(e){ce(this).addClass(t.call(this,e,Ct(this)))}):(e=kt(t)).length?this.each(function(){if(r=Ct(this),n=1===this.nodeType&&" "+Tt(r)+" "){for(o=0;o<e.length;o++)i=e[o],n.indexOf(" "+i+" ")<0&&(n+=i+" ");a=Tt(n),r!==a&&this.setAttribute("class",a)}}):this},removeClass:function(t){var e,n,r,i,o,a;return v(t)?this.each(function(e){ce(this).removeClass(t.call(this,e,Ct(this)))}):arguments.length?(e=kt(t)).length?this.each(function(){if(r=Ct(this),n=1===this.nodeType&&" "+Tt(r)+" "){for(o=0;o<e.length;o++){i=e[o];while(-1<n.indexOf(" "+i+" "))n=n.replace(" "+i+" "," ")}a=Tt(n),r!==a&&this.setAttribute("class",a)}}):this:this.attr("class","")},toggleClass:function(t,n){var e,r,i,o,a=typeof t,s="string"===a||Array.isArray(t);return v(t)?this.each(function(e){ce(this).toggleClass(t.call(this,e,Ct(this),n),n)}):"boolean"==typeof n&&s?n?this.addClass(t):this.removeClass(t):(e=kt(t),this.each(function(){if(s)for(o=ce(this),i=0;i<e.length;i++)r=e[i],o.hasClass(r)?o.removeClass(r):o.addClass(r);else void 0!==t&&"boolean"!==a||((r=Ct(this))&&_.set(this,"__className__",r),this.setAttribute&&this.setAttribute("class",r||!1===t?"":_.get(this,"__className__")||""))}))},hasClass:function(e){var t,n,r=0;t=" "+e+" ";while(n=this[r++])if(1===n.nodeType&&-1<(" "+Tt(Ct(n))+" ").indexOf(t))return!0;return!1}});var St=/\r/g;ce.fn.extend({val:function(n){var r,e,i,t=this[0];return arguments.length?(i=v(n),this.each(function(e){var t;1===this.nodeType&&(null==(t=i?n.call(this,e,ce(this).val()):n)?t="":"number"==typeof t?t+="":Array.isArray(t)&&(t=ce.map(t,function(e){return null==e?"":e+""})),(r=ce.valHooks[this.type]||ce.valHooks[this.nodeName.toLowerCase()])&&"set"in r&&void 0!==r.set(this,t,"value")||(this.value=t))})):t?(r=ce.valHooks[t.type]||ce.valHooks[t.nodeName.toLowerCase()])&&"get"in r&&void 0!==(e=r.get(t,"value"))?e:"string"==typeof(e=t.value)?e.replace(St,""):null==e?"":e:void 0}}),ce.extend({valHooks:{option:{get:function(e){var t=ce.find.attr(e,"value");return null!=t?t:Tt(ce.text(e))}},select:{get:function(e){var t,n,r,i=e.options,o=e.selectedIndex,a="select-one"===e.type,s=a?null:[],u=a?o+1:i.length;for(r=o<0?u:a?o:0;r<u;r++)if(((n=i[r]).selected||r===o)&&!n.disabled&&(!n.parentNode.disabled||!fe(n.parentNode,"optgroup"))){if(t=ce(n).val(),a)return t;s.push(t)}return s},set:function(e,t){var n,r,i=e.options,o=ce.makeArray(t),a=i.length;while(a--)((r=i[a]).selected=-1<ce.inArray(ce.valHooks.option.get(r),o))&&(n=!0);return n||(e.selectedIndex=-1),o}}}}),ce.each(["radio","checkbox"],function(){ce.valHooks[this]={set:function(e,t){if(Array.isArray(t))return e.checked=-1<ce.inArray(ce(e).val(),t)}},le.checkOn||(ce.valHooks[this].get=function(e){return null===e.getAttribute("value")?"on":e.value})});var Et=ie.location,jt={guid:Date.now()},At=/\?/;ce.parseXML=function(e){var t,n;if(!e||"string"!=typeof e)return null;try{t=(new ie.DOMParser).parseFromString(e,"text/xml")}catch(e){}return n=t&&t.getElementsByTagName("parsererror")[0],t&&!n||ce.error("Invalid XML: "+(n?ce.map(n.childNodes,function(e){return e.textContent}).join("\n"):e)),t};var Dt=/^(?:focusinfocus|focusoutblur)$/,Nt=function(e){e.stopPropagation()};ce.extend(ce.event,{trigger:function(e,t,n,r){var i,o,a,s,u,l,c,f,p=[n||C],d=ue.call(e,"type")?e.type:e,h=ue.call(e,"namespace")?e.namespace.split("."):[];if(o=f=a=n=n||C,3!==n.nodeType&&8!==n.nodeType&&!Dt.test(d+ce.event.triggered)&&(-1<d.indexOf(".")&&(d=(h=d.split(".")).shift(),h.sort()),u=d.indexOf(":")<0&&"on"+d,(e=e[ce.expando]?e:new ce.Event(d,"object"==typeof e&&e)).isTrigger=r?2:3,e.namespace=h.join("."),e.rnamespace=e.namespace?new RegExp("(^|\\.)"+h.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,e.result=void 0,e.target||(e.target=n),t=null==t?[e]:ce.makeArray(t,[e]),c=ce.event.special[d]||{},r||!c.trigger||!1!==c.trigger.apply(n,t))){if(!r&&!c.noBubble&&!y(n)){for(s=c.delegateType||d,Dt.test(s+d)||(o=o.parentNode);o;o=o.parentNode)p.push(o),a=o;a===(n.ownerDocument||C)&&p.push(a.defaultView||a.parentWindow||ie)}i=0;while((o=p[i++])&&!e.isPropagationStopped())f=o,e.type=1<i?s:c.bindType||d,(l=(_.get(o,"events")||Object.create(null))[e.type]&&_.get(o,"handle"))&&l.apply(o,t),(l=u&&o[u])&&l.apply&&$(o)&&(e.result=l.apply(o,t),!1===e.result&&e.preventDefault());return e.type=d,r||e.isDefaultPrevented()||c._default&&!1!==c._default.apply(p.pop(),t)||!$(n)||u&&v(n[d])&&!y(n)&&((a=n[u])&&(n[u]=null),ce.event.triggered=d,e.isPropagationStopped()&&f.addEventListener(d,Nt),n[d](),e.isPropagationStopped()&&f.removeEventListener(d,Nt),ce.event.triggered=void 0,a&&(n[u]=a)),e.result}},simulate:function(e,t,n){var r=ce.extend(new ce.Event,n,{type:e,isSimulated:!0});ce.event.trigger(r,null,t)}}),ce.fn.extend({trigger:function(e,t){return this.each(function(){ce.event.trigger(e,t,this)})},triggerHandler:function(e,t){var n=this[0];if(n)return ce.event.trigger(e,t,n,!0)}});var qt=/\[\]$/,Lt=/\r?\n/g,Ht=/^(?:submit|button|image|reset|file)$/i,Ot=/^(?:input|select|textarea|keygen)/i;function Pt(n,e,r,i){var t;if(Array.isArray(e))ce.each(e,function(e,t){r||qt.test(n)?i(n,t):Pt(n+"["+("object"==typeof t&&null!=t?e:"")+"]",t,r,i)});else if(r||"object"!==x(e))i(n,e);else for(t in e)Pt(n+"["+t+"]",e[t],r,i)}ce.param=function(e,t){var n,r=[],i=function(e,t){var n=v(t)?t():t;r[r.length]=encodeURIComponent(e)+"="+encodeURIComponent(null==n?"":n)};if(null==e)return"";if(Array.isArray(e)||e.jquery&&!ce.isPlainObject(e))ce.each(e,function(){i(this.name,this.value)});else for(n in e)Pt(n,e[n],t,i);return r.join("&")},ce.fn.extend({serialize:function(){return ce.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=ce.prop(this,"elements");return e?ce.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!ce(this).is(":disabled")&&Ot.test(this.nodeName)&&!Ht.test(e)&&(this.checked||!we.test(e))}).map(function(e,t){var n=ce(this).val();return null==n?null:Array.isArray(n)?ce.map(n,function(e){return{name:t.name,value:e.replace(Lt,"\r\n")}}):{name:t.name,value:n.replace(Lt,"\r\n")}}).get()}});var Mt=/%20/g,Rt=/#.*$/,It=/([?&])_=[^&]*/,Wt=/^(.*?):[ \t]*([^\r\n]*)$/gm,Ft=/^(?:GET|HEAD)$/,$t=/^\/\//,Bt={},_t={},zt="*/".concat("*"),Xt=C.createElement("a");function Ut(o){return function(e,t){"string"!=typeof e&&(t=e,e="*");var n,r=0,i=e.toLowerCase().match(D)||[];if(v(t))while(n=i[r++])"+"===n[0]?(n=n.slice(1)||"*",(o[n]=o[n]||[]).unshift(t)):(o[n]=o[n]||[]).push(t)}}function Vt(t,i,o,a){var s={},u=t===_t;function l(e){var r;return s[e]=!0,ce.each(t[e]||[],function(e,t){var n=t(i,o,a);return"string"!=typeof n||u||s[n]?u?!(r=n):void 0:(i.dataTypes.unshift(n),l(n),!1)}),r}return l(i.dataTypes[0])||!s["*"]&&l("*")}function Gt(e,t){var n,r,i=ce.ajaxSettings.flatOptions||{};for(n in t)void 0!==t[n]&&((i[n]?e:r||(r={}))[n]=t[n]);return r&&ce.extend(!0,e,r),e}Xt.href=Et.href,ce.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Et.href,type:"GET",isLocal:/^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(Et.protocol),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":zt,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/\bxml\b/,html:/\bhtml/,json:/\bjson\b/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":JSON.parse,"text xml":ce.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(e,t){return t?Gt(Gt(e,ce.ajaxSettings),t):Gt(ce.ajaxSettings,e)},ajaxPrefilter:Ut(Bt),ajaxTransport:Ut(_t),ajax:function(e,t){"object"==typeof e&&(t=e,e=void 0),t=t||{};var c,f,p,n,d,r,h,g,i,o,v=ce.ajaxSetup({},t),y=v.context||v,m=v.context&&(y.nodeType||y.jquery)?ce(y):ce.event,x=ce.Deferred(),b=ce.Callbacks("once memory"),w=v.statusCode||{},a={},s={},u="canceled",T={readyState:0,getResponseHeader:function(e){var t;if(h){if(!n){n={};while(t=Wt.exec(p))n[t[1].toLowerCase()+" "]=(n[t[1].toLowerCase()+" "]||[]).concat(t[2])}t=n[e.toLowerCase()+" "]}return null==t?null:t.join(", ")},getAllResponseHeaders:function(){return h?p:null},setRequestHeader:function(e,t){return null==h&&(e=s[e.toLowerCase()]=s[e.toLowerCase()]||e,a[e]=t),this},overrideMimeType:function(e){return null==h&&(v.mimeType=e),this},statusCode:function(e){var t;if(e)if(h)T.always(e[T.status]);else for(t in e)w[t]=[w[t],e[t]];return this},abort:function(e){var t=e||u;return c&&c.abort(t),l(0,t),this}};if(x.promise(T),v.url=((e||v.url||Et.href)+"").replace($t,Et.protocol+"//"),v.type=t.method||t.type||v.method||v.type,v.dataTypes=(v.dataType||"*").toLowerCase().match(D)||[""],null==v.crossDomain){r=C.createElement("a");try{r.href=v.url,r.href=r.href,v.crossDomain=Xt.protocol+"//"+Xt.host!=r.protocol+"//"+r.host}catch(e){v.crossDomain=!0}}if(v.data&&v.processData&&"string"!=typeof v.data&&(v.data=ce.param(v.data,v.traditional)),Vt(Bt,v,t,T),h)return T;for(i in(g=ce.event&&v.global)&&0==ce.active++&&ce.event.trigger("ajaxStart"),v.type=v.type.toUpperCase(),v.hasContent=!Ft.test(v.type),f=v.url.replace(Rt,""),v.hasContent?v.data&&v.processData&&0===(v.contentType||"").indexOf("application/x-www-form-urlencoded")&&(v.data=v.data.replace(Mt,"+")):(o=v.url.slice(f.length),v.data&&(v.processData||"string"==typeof v.data)&&(f+=(At.test(f)?"&":"?")+v.data,delete v.data),!1===v.cache&&(f=f.replace(It,"$1"),o=(At.test(f)?"&":"?")+"_="+jt.guid+++o),v.url=f+o),v.ifModified&&(ce.lastModified[f]&&T.setRequestHeader("If-Modified-Since",ce.lastModified[f]),ce.etag[f]&&T.setRequestHeader("If-None-Match",ce.etag[f])),(v.data&&v.hasContent&&!1!==v.contentType||t.contentType)&&T.setRequestHeader("Content-Type",v.contentType),T.setRequestHeader("Accept",v.dataTypes[0]&&v.accepts[v.dataTypes[0]]?v.accepts[v.dataTypes[0]]+("*"!==v.dataTypes[0]?", "+zt+"; q=0.01":""):v.accepts["*"]),v.headers)T.setRequestHeader(i,v.headers[i]);if(v.beforeSend&&(!1===v.beforeSend.call(y,T,v)||h))return T.abort();if(u="abort",b.add(v.complete),T.done(v.success),T.fail(v.error),c=Vt(_t,v,t,T)){if(T.readyState=1,g&&m.trigger("ajaxSend",[T,v]),h)return T;v.async&&0<v.timeout&&(d=ie.setTimeout(function(){T.abort("timeout")},v.timeout));try{h=!1,c.send(a,l)}catch(e){if(h)throw e;l(-1,e)}}else l(-1,"No Transport");function l(e,t,n,r){var i,o,a,s,u,l=t;h||(h=!0,d&&ie.clearTimeout(d),c=void 0,p=r||"",T.readyState=0<e?4:0,i=200<=e&&e<300||304===e,n&&(s=function(e,t,n){var r,i,o,a,s=e.contents,u=e.dataTypes;while("*"===u[0])u.shift(),void 0===r&&(r=e.mimeType||t.getResponseHeader("Content-Type"));if(r)for(i in s)if(s[i]&&s[i].test(r)){u.unshift(i);break}if(u[0]in n)o=u[0];else{for(i in n){if(!u[0]||e.converters[i+" "+u[0]]){o=i;break}a||(a=i)}o=o||a}if(o)return o!==u[0]&&u.unshift(o),n[o]}(v,T,n)),!i&&-1<ce.inArray("script",v.dataTypes)&&ce.inArray("json",v.dataTypes)<0&&(v.converters["text script"]=function(){}),s=function(e,t,n,r){var i,o,a,s,u,l={},c=e.dataTypes.slice();if(c[1])for(a in e.converters)l[a.toLowerCase()]=e.converters[a];o=c.shift();while(o)if(e.responseFields[o]&&(n[e.responseFields[o]]=t),!u&&r&&e.dataFilter&&(t=e.dataFilter(t,e.dataType)),u=o,o=c.shift())if("*"===o)o=u;else if("*"!==u&&u!==o){if(!(a=l[u+" "+o]||l["* "+o]))for(i in l)if((s=i.split(" "))[1]===o&&(a=l[u+" "+s[0]]||l["* "+s[0]])){!0===a?a=l[i]:!0!==l[i]&&(o=s[0],c.unshift(s[1]));break}if(!0!==a)if(a&&e["throws"])t=a(t);else try{t=a(t)}catch(e){return{state:"parsererror",error:a?e:"No conversion from "+u+" to "+o}}}return{state:"success",data:t}}(v,s,T,i),i?(v.ifModified&&((u=T.getResponseHeader("Last-Modified"))&&(ce.lastModified[f]=u),(u=T.getResponseHeader("etag"))&&(ce.etag[f]=u)),204===e||"HEAD"===v.type?l="nocontent":304===e?l="notmodified":(l=s.state,o=s.data,i=!(a=s.error))):(a=l,!e&&l||(l="error",e<0&&(e=0))),T.status=e,T.statusText=(t||l)+"",i?x.resolveWith(y,[o,l,T]):x.rejectWith(y,[T,l,a]),T.statusCode(w),w=void 0,g&&m.trigger(i?"ajaxSuccess":"ajaxError",[T,v,i?o:a]),b.fireWith(y,[T,l]),g&&(m.trigger("ajaxComplete",[T,v]),--ce.active||ce.event.trigger("ajaxStop")))}return T},getJSON:function(e,t,n){return ce.get(e,t,n,"json")},getScript:function(e,t){return ce.get(e,void 0,t,"script")}}),ce.each(["get","post"],function(e,i){ce[i]=function(e,t,n,r){return v(t)&&(r=r||n,n=t,t=void 0),ce.ajax(ce.extend({url:e,type:i,dataType:r,data:t,success:n},ce.isPlainObject(e)&&e))}}),ce.ajaxPrefilter(function(e){var t;for(t in e.headers)"content-type"===t.toLowerCase()&&(e.contentType=e.headers[t]||"")}),ce._evalUrl=function(e,t,n){return ce.ajax({url:e,type:"GET",dataType:"script",cache:!0,async:!1,global:!1,converters:{"text script":function(){}},dataFilter:function(e){ce.globalEval(e,t,n)}})},ce.fn.extend({wrapAll:function(e){var t;return this[0]&&(v(e)&&(e=e.call(this[0])),t=ce(e,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&t.insertBefore(this[0]),t.map(function(){var e=this;while(e.firstElementChild)e=e.firstElementChild;return e}).append(this)),this},wrapInner:function(n){return v(n)?this.each(function(e){ce(this).wrapInner(n.call(this,e))}):this.each(function(){var e=ce(this),t=e.contents();t.length?t.wrapAll(n):e.append(n)})},wrap:function(t){var n=v(t);return this.each(function(e){ce(this).wrapAll(n?t.call(this,e):t)})},unwrap:function(e){return this.parent(e).not("body").each(function(){ce(this).replaceWith(this.childNodes)}),this}}),ce.expr.pseudos.hidden=function(e){return!ce.expr.pseudos.visible(e)},ce.expr.pseudos.visible=function(e){return!!(e.offsetWidth||e.offsetHeight||e.getClientRects().length)},ce.ajaxSettings.xhr=function(){try{return new ie.XMLHttpRequest}catch(e){}};var Yt={0:200,1223:204},Qt=ce.ajaxSettings.xhr();le.cors=!!Qt&&"withCredentials"in Qt,le.ajax=Qt=!!Qt,ce.ajaxTransport(function(i){var o,a;if(le.cors||Qt&&!i.crossDomain)return{send:function(e,t){var n,r=i.xhr();if(r.open(i.type,i.url,i.async,i.username,i.password),i.xhrFields)for(n in i.xhrFields)r[n]=i.xhrFields[n];for(n in i.mimeType&&r.overrideMimeType&&r.overrideMimeType(i.mimeType),i.crossDomain||e["X-Requested-With"]||(e["X-Requested-With"]="XMLHttpRequest"),e)r.setRequestHeader(n,e[n]);o=function(e){return function(){o&&(o=a=r.onload=r.onerror=r.onabort=r.ontimeout=r.onreadystatechange=null,"abort"===e?r.abort():"error"===e?"number"!=typeof r.status?t(0,"error"):t(r.status,r.statusText):t(Yt[r.status]||r.status,r.statusText,"text"!==(r.responseType||"text")||"string"!=typeof r.responseText?{binary:r.response}:{text:r.responseText},r.getAllResponseHeaders()))}},r.onload=o(),a=r.onerror=r.ontimeout=o("error"),void 0!==r.onabort?r.onabort=a:r.onreadystatechange=function(){4===r.readyState&&ie.setTimeout(function(){o&&a()})},o=o("abort");try{r.send(i.hasContent&&i.data||null)}catch(e){if(o)throw e}},abort:function(){o&&o()}}}),ce.ajaxPrefilter(function(e){e.crossDomain&&(e.contents.script=!1)}),ce.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/\b(?:java|ecma)script\b/},converters:{"text script":function(e){return ce.globalEval(e),e}}}),ce.ajaxPrefilter("script",function(e){void 0===e.cache&&(e.cache=!1),e.crossDomain&&(e.type="GET")}),ce.ajaxTransport("script",function(n){var r,i;if(n.crossDomain||n.scriptAttrs)return{send:function(e,t){r=ce("<script>").attr(n.scriptAttrs||{}).prop({charset:n.scriptCharset,src:n.url}).on("load error",i=function(e){r.remove(),i=null,e&&t("error"===e.type?404:200,e.type)}),C.head.appendChild(r[0])},abort:function(){i&&i()}}});var Jt,Kt=[],Zt=/(=)\?(?=&|$)|\?\?/;ce.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=Kt.pop()||ce.expando+"_"+jt.guid++;return this[e]=!0,e}}),ce.ajaxPrefilter("json jsonp",function(e,t,n){var r,i,o,a=!1!==e.jsonp&&(Zt.test(e.url)?"url":"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&Zt.test(e.data)&&"data");if(a||"jsonp"===e.dataTypes[0])return r=e.jsonpCallback=v(e.jsonpCallback)?e.jsonpCallback():e.jsonpCallback,a?e[a]=e[a].replace(Zt,"$1"+r):!1!==e.jsonp&&(e.url+=(At.test(e.url)?"&":"?")+e.jsonp+"="+r),e.converters["script json"]=function(){return o||ce.error(r+" was not called"),o[0]},e.dataTypes[0]="json",i=ie[r],ie[r]=function(){o=arguments},n.always(function(){void 0===i?ce(ie).removeProp(r):ie[r]=i,e[r]&&(e.jsonpCallback=t.jsonpCallback,Kt.push(r)),o&&v(i)&&i(o[0]),o=i=void 0}),"script"}),le.createHTMLDocument=((Jt=C.implementation.createHTMLDocument("").body).innerHTML="<form></form><form></form>",2===Jt.childNodes.length),ce.parseHTML=function(e,t,n){return"string"!=typeof e?[]:("boolean"==typeof t&&(n=t,t=!1),t||(le.createHTMLDocument?((r=(t=C.implementation.createHTMLDocument("")).createElement("base")).href=C.location.href,t.head.appendChild(r)):t=C),o=!n&&[],(i=w.exec(e))?[t.createElement(i[1])]:(i=Ae([e],t,o),o&&o.length&&ce(o).remove(),ce.merge([],i.childNodes)));var r,i,o},ce.fn.load=function(e,t,n){var r,i,o,a=this,s=e.indexOf(" ");return-1<s&&(r=Tt(e.slice(s)),e=e.slice(0,s)),v(t)?(n=t,t=void 0):t&&"object"==typeof t&&(i="POST"),0<a.length&&ce.ajax({url:e,type:i||"GET",dataType:"html",data:t}).done(function(e){o=arguments,a.html(r?ce("<div>").append(ce.parseHTML(e)).find(r):e)}).always(n&&function(e,t){a.each(function(){n.apply(this,o||[e.responseText,t,e])})}),this},ce.expr.pseudos.animated=function(t){return ce.grep(ce.timers,function(e){return t===e.elem}).length},ce.offset={setOffset:function(e,t,n){var r,i,o,a,s,u,l=ce.css(e,"position"),c=ce(e),f={};"static"===l&&(e.style.position="relative"),s=c.offset(),o=ce.css(e,"top"),u=ce.css(e,"left"),("absolute"===l||"fixed"===l)&&-1<(o+u).indexOf("auto")?(a=(r=c.position()).top,i=r.left):(a=parseFloat(o)||0,i=parseFloat(u)||0),v(t)&&(t=t.call(e,n,ce.extend({},s))),null!=t.top&&(f.top=t.top-s.top+a),null!=t.left&&(f.left=t.left-s.left+i),"using"in t?t.using.call(e,f):c.css(f)}},ce.fn.extend({offset:function(t){if(arguments.length)return void 0===t?this:this.each(function(e){ce.offset.setOffset(this,t,e)});var e,n,r=this[0];return r?r.getClientRects().length?(e=r.getBoundingClientRect(),n=r.ownerDocument.defaultView,{top:e.top+n.pageYOffset,left:e.left+n.pageXOffset}):{top:0,left:0}:void 0},position:function(){if(this[0]){var e,t,n,r=this[0],i={top:0,left:0};if("fixed"===ce.css(r,"position"))t=r.getBoundingClientRect();else{t=this.offset(),n=r.ownerDocument,e=r.offsetParent||n.documentElement;while(e&&(e===n.body||e===n.documentElement)&&"static"===ce.css(e,"position"))e=e.parentNode;e&&e!==r&&1===e.nodeType&&((i=ce(e).offset()).top+=ce.css(e,"borderTopWidth",!0),i.left+=ce.css(e,"borderLeftWidth",!0))}return{top:t.top-i.top-ce.css(r,"marginTop",!0),left:t.left-i.left-ce.css(r,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var e=this.offsetParent;while(e&&"static"===ce.css(e,"position"))e=e.offsetParent;return e||J})}}),ce.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(t,i){var o="pageYOffset"===i;ce.fn[t]=function(e){return M(this,function(e,t,n){var r;if(y(e)?r=e:9===e.nodeType&&(r=e.defaultView),void 0===n)return r?r[i]:e[t];r?r.scrollTo(o?r.pageXOffset:n,o?n:r.pageYOffset):e[t]=n},t,e,arguments.length)}}),ce.each(["top","left"],function(e,n){ce.cssHooks[n]=Ye(le.pixelPosition,function(e,t){if(t)return t=Ge(e,n),_e.test(t)?ce(e).position()[n]+"px":t})}),ce.each({Height:"height",Width:"width"},function(a,s){ce.each({padding:"inner"+a,content:s,"":"outer"+a},function(r,o){ce.fn[o]=function(e,t){var n=arguments.length&&(r||"boolean"!=typeof e),i=r||(!0===e||!0===t?"margin":"border");return M(this,function(e,t,n){var r;return y(e)?0===o.indexOf("outer")?e["inner"+a]:e.document.documentElement["client"+a]:9===e.nodeType?(r=e.documentElement,Math.max(e.body["scroll"+a],r["scroll"+a],e.body["offset"+a],r["offset"+a],r["client"+a])):void 0===n?ce.css(e,t,i):ce.style(e,t,n,i)},s,n?e:void 0,n)}})}),ce.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,t){ce.fn[t]=function(e){return this.on(t,e)}}),ce.fn.extend({bind:function(e,t,n){return this.on(e,null,t,n)},unbind:function(e,t){return this.off(e,null,t)},delegate:function(e,t,n,r){return this.on(t,e,n,r)},undelegate:function(e,t,n){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",n)},hover:function(e,t){return this.on("mouseenter",e).on("mouseleave",t||e)}}),ce.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,n){ce.fn[n]=function(e,t){return 0<arguments.length?this.on(n,null,e,t):this.trigger(n)}});var en=/^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;ce.proxy=function(e,t){var n,r,i;if("string"==typeof t&&(n=e[t],t=e,e=n),v(e))return r=ae.call(arguments,2),(i=function(){return e.apply(t||this,r.concat(ae.call(arguments)))}).guid=e.guid=e.guid||ce.guid++,i},ce.holdReady=function(e){e?ce.readyWait++:ce.ready(!0)},ce.isArray=Array.isArray,ce.parseJSON=JSON.parse,ce.nodeName=fe,ce.isFunction=v,ce.isWindow=y,ce.camelCase=F,ce.type=x,ce.now=Date.now,ce.isNumeric=function(e){var t=ce.type(e);return("number"===t||"string"===t)&&!isNaN(e-parseFloat(e))},ce.trim=function(e){return null==e?"":(e+"").replace(en,"$1")},"function"==typeof define&&define.amd&&define("jquery",[],function(){return ce});var tn=ie.jQuery,nn=ie.$;return ce.noConflict=function(e){return ie.$===ce&&(ie.$=nn),e&&ie.jQuery===ce&&(ie.jQuery=tn),ce},"undefined"==typeof e&&(ie.jQuery=ie.$=ce),ce});
jQuery.noConflict();
;
/*! jQuery Migrate v3.4.1 | (c) OpenJS Foundation and other contributors | jquery.org/license */
"undefined"==typeof jQuery.migrateMute&&(jQuery.migrateMute=!0),function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],function(e){return t(e,window)}):"object"==typeof module&&module.exports?module.exports=t(require("jquery"),window):t(jQuery,window)}(function(s,n){"use strict";function e(e){return 0<=function(e,t){for(var r=/^(\d+)\.(\d+)\.(\d+)/,n=r.exec(e)||[],o=r.exec(t)||[],a=1;a<=3;a++){if(+o[a]<+n[a])return 1;if(+n[a]<+o[a])return-1}return 0}(s.fn.jquery,e)}s.migrateVersion="3.4.1";var t=Object.create(null);s.migrateDisablePatches=function(){for(var e=0;e<arguments.length;e++)t[arguments[e]]=!0},s.migrateEnablePatches=function(){for(var e=0;e<arguments.length;e++)delete t[arguments[e]]},s.migrateIsPatchEnabled=function(e){return!t[e]},n.console&&n.console.log&&(s&&e("3.0.0")&&!e("5.0.0")||n.console.log("JQMIGRATE: jQuery 3.x-4.x REQUIRED"),s.migrateWarnings&&n.console.log("JQMIGRATE: Migrate plugin loaded multiple times"),n.console.log("JQMIGRATE: Migrate is installed"+(s.migrateMute?"":" with logging active")+", version "+s.migrateVersion));var o={};function u(e,t){var r=n.console;!s.migrateIsPatchEnabled(e)||s.migrateDeduplicateWarnings&&o[t]||(o[t]=!0,s.migrateWarnings.push(t+" ["+e+"]"),r&&r.warn&&!s.migrateMute&&(r.warn("JQMIGRATE: "+t),s.migrateTrace&&r.trace&&r.trace()))}function r(e,t,r,n,o){Object.defineProperty(e,t,{configurable:!0,enumerable:!0,get:function(){return u(n,o),r},set:function(e){u(n,o),r=e}})}function a(e,t,r,n,o){var a=e[t];e[t]=function(){return o&&u(n,o),(s.migrateIsPatchEnabled(n)?r:a||s.noop).apply(this,arguments)}}function c(e,t,r,n,o){if(!o)throw new Error("No warning message provided");return a(e,t,r,n,o),0}function i(e,t,r,n){return a(e,t,r,n),0}s.migrateDeduplicateWarnings=!0,s.migrateWarnings=[],void 0===s.migrateTrace&&(s.migrateTrace=!0),s.migrateReset=function(){o={},s.migrateWarnings.length=0},"BackCompat"===n.document.compatMode&&u("quirks","jQuery is not compatible with Quirks Mode");var d,l,p,f={},m=s.fn.init,y=s.find,h=/\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/,g=/\[(\s*[-\w]+\s*)([~|^$*]?=)\s*([-\w#]*?#[-\w#]*)\s*\]/g,v=/^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g;for(d in i(s.fn,"init",function(e){var t=Array.prototype.slice.call(arguments);return s.migrateIsPatchEnabled("selector-empty-id")&&"string"==typeof e&&"#"===e&&(u("selector-empty-id","jQuery( '#' ) is not a valid selector"),t[0]=[]),m.apply(this,t)},"selector-empty-id"),s.fn.init.prototype=s.fn,i(s,"find",function(t){var r=Array.prototype.slice.call(arguments);if("string"==typeof t&&h.test(t))try{n.document.querySelector(t)}catch(e){t=t.replace(g,function(e,t,r,n){return"["+t+r+'"'+n+'"]'});try{n.document.querySelector(t),u("selector-hash","Attribute selector with '#' must be quoted: "+r[0]),r[0]=t}catch(e){u("selector-hash","Attribute selector with '#' was not fixed: "+r[0])}}return y.apply(this,r)},"selector-hash"),y)Object.prototype.hasOwnProperty.call(y,d)&&(s.find[d]=y[d]);c(s.fn,"size",function(){return this.length},"size","jQuery.fn.size() is deprecated and removed; use the .length property"),c(s,"parseJSON",function(){return JSON.parse.apply(null,arguments)},"parseJSON","jQuery.parseJSON is deprecated; use JSON.parse"),c(s,"holdReady",s.holdReady,"holdReady","jQuery.holdReady is deprecated"),c(s,"unique",s.uniqueSort,"unique","jQuery.unique is deprecated; use jQuery.uniqueSort"),r(s.expr,"filters",s.expr.pseudos,"expr-pre-pseudos","jQuery.expr.filters is deprecated; use jQuery.expr.pseudos"),r(s.expr,":",s.expr.pseudos,"expr-pre-pseudos","jQuery.expr[':'] is deprecated; use jQuery.expr.pseudos"),e("3.1.1")&&c(s,"trim",function(e){return null==e?"":(e+"").replace(v,"$1")},"trim","jQuery.trim is deprecated; use String.prototype.trim"),e("3.2.0")&&(c(s,"nodeName",function(e,t){return e.nodeName&&e.nodeName.toLowerCase()===t.toLowerCase()},"nodeName","jQuery.nodeName is deprecated"),c(s,"isArray",Array.isArray,"isArray","jQuery.isArray is deprecated; use Array.isArray")),e("3.3.0")&&(c(s,"isNumeric",function(e){var t=typeof e;return("number"==t||"string"==t)&&!isNaN(e-parseFloat(e))},"isNumeric","jQuery.isNumeric() is deprecated"),s.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),function(e,t){f["[object "+t+"]"]=t.toLowerCase()}),c(s,"type",function(e){return null==e?e+"":"object"==typeof e||"function"==typeof e?f[Object.prototype.toString.call(e)]||"object":typeof e},"type","jQuery.type is deprecated"),c(s,"isFunction",function(e){return"function"==typeof e},"isFunction","jQuery.isFunction() is deprecated"),c(s,"isWindow",function(e){return null!=e&&e===e.window},"isWindow","jQuery.isWindow() is deprecated")),s.ajax&&(l=s.ajax,p=/(=)\?(?=&|$)|\?\?/,i(s,"ajax",function(){var e=l.apply(this,arguments);return e.promise&&(c(e,"success",e.done,"jqXHR-methods","jQXHR.success is deprecated and removed"),c(e,"error",e.fail,"jqXHR-methods","jQXHR.error is deprecated and removed"),c(e,"complete",e.always,"jqXHR-methods","jQXHR.complete is deprecated and removed")),e},"jqXHR-methods"),e("4.0.0")||s.ajaxPrefilter("+json",function(e){!1!==e.jsonp&&(p.test(e.url)||"string"==typeof e.data&&0===(e.contentType||"").indexOf("application/x-www-form-urlencoded")&&p.test(e.data))&&u("jsonp-promotion","JSON-to-JSONP auto-promotion is deprecated")}));var j=s.fn.removeAttr,b=s.fn.toggleClass,w=/\S+/g;function x(e){return e.replace(/-([a-z])/g,function(e,t){return t.toUpperCase()})}i(s.fn,"removeAttr",function(e){var r=this,n=!1;return s.each(e.match(w),function(e,t){s.expr.match.bool.test(t)&&r.each(function(){if(!1!==s(this).prop(t))return!(n=!0)}),n&&(u("removeAttr-bool","jQuery.fn.removeAttr no longer sets boolean properties: "+t),r.prop(t,!1))}),j.apply(this,arguments)},"removeAttr-bool"),i(s.fn,"toggleClass",function(t){return void 0!==t&&"boolean"!=typeof t?b.apply(this,arguments):(u("toggleClass-bool","jQuery.fn.toggleClass( boolean ) is deprecated"),this.each(function(){var e=this.getAttribute&&this.getAttribute("class")||"";e&&s.data(this,"__className__",e),this.setAttribute&&this.setAttribute("class",!e&&!1!==t&&s.data(this,"__className__")||"")}))},"toggleClass-bool");var Q,A,R=!1,C=/^[a-z]/,N=/^(?:Border(?:Top|Right|Bottom|Left)?(?:Width|)|(?:Margin|Padding)?(?:Top|Right|Bottom|Left)?|(?:Min|Max)?(?:Width|Height))$/;s.swap&&s.each(["height","width","reliableMarginRight"],function(e,t){var r=s.cssHooks[t]&&s.cssHooks[t].get;r&&(s.cssHooks[t].get=function(){var e;return R=!0,e=r.apply(this,arguments),R=!1,e})}),i(s,"swap",function(e,t,r,n){var o,a,i={};for(a in R||u("swap","jQuery.swap() is undocumented and deprecated"),t)i[a]=e.style[a],e.style[a]=t[a];for(a in o=r.apply(e,n||[]),t)e.style[a]=i[a];return o},"swap"),e("3.4.0")&&"undefined"!=typeof Proxy&&(s.cssProps=new Proxy(s.cssProps||{},{set:function(){return u("cssProps","jQuery.cssProps is deprecated"),Reflect.set.apply(this,arguments)}})),e("4.0.0")?(A={animationIterationCount:!0,columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,gridArea:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnStart:!0,gridRow:!0,gridRowEnd:!0,gridRowStart:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},"undefined"!=typeof Proxy?s.cssNumber=new Proxy(A,{get:function(){return u("css-number","jQuery.cssNumber is deprecated"),Reflect.get.apply(this,arguments)},set:function(){return u("css-number","jQuery.cssNumber is deprecated"),Reflect.set.apply(this,arguments)}}):s.cssNumber=A):A=s.cssNumber,Q=s.fn.css,i(s.fn,"css",function(e,t){var r,n,o=this;return e&&"object"==typeof e&&!Array.isArray(e)?(s.each(e,function(e,t){s.fn.css.call(o,e,t)}),this):("number"==typeof t&&(r=x(e),n=r,C.test(n)&&N.test(n[0].toUpperCase()+n.slice(1))||A[r]||u("css-number",'Number-typed values are deprecated for jQuery.fn.css( "'+e+'", value )')),Q.apply(this,arguments))},"css-number");var S,P,k,H,E=s.data;i(s,"data",function(e,t,r){var n,o,a;if(t&&"object"==typeof t&&2===arguments.length){for(a in n=s.hasData(e)&&E.call(this,e),o={},t)a!==x(a)?(u("data-camelCase","jQuery.data() always sets/gets camelCased names: "+a),n[a]=t[a]):o[a]=t[a];return E.call(this,e,o),t}return t&&"string"==typeof t&&t!==x(t)&&(n=s.hasData(e)&&E.call(this,e))&&t in n?(u("data-camelCase","jQuery.data() always sets/gets camelCased names: "+t),2<arguments.length&&(n[t]=r),n[t]):E.apply(this,arguments)},"data-camelCase"),s.fx&&(k=s.Tween.prototype.run,H=function(e){return e},i(s.Tween.prototype,"run",function(){1<s.easing[this.easing].length&&(u("easing-one-arg","'jQuery.easing."+this.easing.toString()+"' should use only one argument"),s.easing[this.easing]=H),k.apply(this,arguments)},"easing-one-arg"),S=s.fx.interval,P="jQuery.fx.interval is deprecated",n.requestAnimationFrame&&Object.defineProperty(s.fx,"interval",{configurable:!0,enumerable:!0,get:function(){return n.document.hidden||u("fx-interval",P),s.migrateIsPatchEnabled("fx-interval")&&void 0===S?13:S},set:function(e){u("fx-interval",P),S=e}}));var M=s.fn.load,q=s.event.add,O=s.event.fix;s.event.props=[],s.event.fixHooks={},r(s.event.props,"concat",s.event.props.concat,"event-old-patch","jQuery.event.props.concat() is deprecated and removed"),i(s.event,"fix",function(e){var t,r=e.type,n=this.fixHooks[r],o=s.event.props;if(o.length){u("event-old-patch","jQuery.event.props are deprecated and removed: "+o.join());while(o.length)s.event.addProp(o.pop())}if(n&&!n._migrated_&&(n._migrated_=!0,u("event-old-patch","jQuery.event.fixHooks are deprecated and removed: "+r),(o=n.props)&&o.length))while(o.length)s.event.addProp(o.pop());return t=O.call(this,e),n&&n.filter?n.filter(t,e):t},"event-old-patch"),i(s.event,"add",function(e,t){return e===n&&"load"===t&&"complete"===n.document.readyState&&u("load-after-event","jQuery(window).on('load'...) called after load event occurred"),q.apply(this,arguments)},"load-after-event"),s.each(["load","unload","error"],function(e,t){i(s.fn,t,function(){var e=Array.prototype.slice.call(arguments,0);return"load"===t&&"string"==typeof e[0]?M.apply(this,e):(u("shorthand-removed-v3","jQuery.fn."+t+"() is deprecated"),e.splice(0,0,t),arguments.length?this.on.apply(this,e):(this.triggerHandler.apply(this,e),this))},"shorthand-removed-v3")}),s.each("blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup contextmenu".split(" "),function(e,r){c(s.fn,r,function(e,t){return 0<arguments.length?this.on(r,null,e,t):this.trigger(r)},"shorthand-deprecated-v3","jQuery.fn."+r+"() event shorthand is deprecated")}),s(function(){s(n.document).triggerHandler("ready")}),s.event.special.ready={setup:function(){this===n.document&&u("ready-event","'ready' event is deprecated")}},c(s.fn,"bind",function(e,t,r){return this.on(e,null,t,r)},"pre-on-methods","jQuery.fn.bind() is deprecated"),c(s.fn,"unbind",function(e,t){return this.off(e,null,t)},"pre-on-methods","jQuery.fn.unbind() is deprecated"),c(s.fn,"delegate",function(e,t,r,n){return this.on(t,e,r,n)},"pre-on-methods","jQuery.fn.delegate() is deprecated"),c(s.fn,"undelegate",function(e,t,r){return 1===arguments.length?this.off(e,"**"):this.off(t,e||"**",r)},"pre-on-methods","jQuery.fn.undelegate() is deprecated"),c(s.fn,"hover",function(e,t){return this.on("mouseenter",e).on("mouseleave",t||e)},"pre-on-methods","jQuery.fn.hover() is deprecated");function T(e){var t=n.document.implementation.createHTMLDocument("");return t.body.innerHTML=e,t.body&&t.body.innerHTML}var F=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi;s.UNSAFE_restoreLegacyHtmlPrefilter=function(){s.migrateEnablePatches("self-closed-tags")},i(s,"htmlPrefilter",function(e){var t,r;return(r=(t=e).replace(F,"<$1></$2>"))!==t&&T(t)!==T(r)&&u("self-closed-tags","HTML tags must be properly nested and closed: "+t),e.replace(F,"<$1></$2>")},"self-closed-tags"),s.migrateDisablePatches("self-closed-tags");var D,W,_,I=s.fn.offset;return i(s.fn,"offset",function(){var e=this[0];return!e||e.nodeType&&e.getBoundingClientRect?I.apply(this,arguments):(u("offset-valid-elem","jQuery.fn.offset() requires a valid DOM element"),arguments.length?this:void 0)},"offset-valid-elem"),s.ajax&&(D=s.param,i(s,"param",function(e,t){var r=s.ajaxSettings&&s.ajaxSettings.traditional;return void 0===t&&r&&(u("param-ajax-traditional","jQuery.param() no longer uses jQuery.ajaxSettings.traditional"),t=r),D.call(this,e,t)},"param-ajax-traditional")),c(s.fn,"andSelf",s.fn.addBack,"andSelf","jQuery.fn.andSelf() is deprecated and removed, use jQuery.fn.addBack()"),s.Deferred&&(W=s.Deferred,_=[["resolve","done",s.Callbacks("once memory"),s.Callbacks("once memory"),"resolved"],["reject","fail",s.Callbacks("once memory"),s.Callbacks("once memory"),"rejected"],["notify","progress",s.Callbacks("memory"),s.Callbacks("memory")]],i(s,"Deferred",function(e){var a=W(),i=a.promise();function t(){var o=arguments;return s.Deferred(function(n){s.each(_,function(e,t){var r="function"==typeof o[e]&&o[e];a[t[1]](function(){var e=r&&r.apply(this,arguments);e&&"function"==typeof e.promise?e.promise().done(n.resolve).fail(n.reject).progress(n.notify):n[t[0]+"With"](this===i?n.promise():this,r?[e]:arguments)})}),o=null}).promise()}return c(a,"pipe",t,"deferred-pipe","deferred.pipe() is deprecated"),c(i,"pipe",t,"deferred-pipe","deferred.pipe() is deprecated"),e&&e.call(a,a),a},"deferred-pipe"),s.Deferred.exceptionHook=W.exceptionHook),s});

;
(function(e){function r(t){var n=t||window.event,r=[].slice.call(arguments,1),i=0,s=true,o=0,u=0;t=e.event.fix(n);t.type="mousewheel";if(n.wheelDelta){i=n.wheelDelta/120}if(n.detail){i=-n.detail/3}u=i;if(n.axis!==undefined&&n.axis===n.HORIZONTAL_AXIS){u=0;o=-1*i}if(n.wheelDeltaY!==undefined){u=n.wheelDeltaY/120}if(n.wheelDeltaX!==undefined){o=-1*n.wheelDeltaX/120}r.unshift(t,i,o,u);return(e.event.dispatch||e.event.handle).apply(this,r)}var t=["DOMMouseScroll","mousewheel"];if(e.event.fixHooks){for(var n=t.length;n;){e.event.fixHooks[t[--n]]=e.event.mouseHooks}}e.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var e=t.length;e;){this.addEventListener(t[--e],r,false)}}else{this.onmousewheel=r}},teardown:function(){if(this.removeEventListener){for(var e=t.length;e;){this.removeEventListener(t[--e],r,false)}}else{this.onmousewheel=null}}};e.fn.extend({mousewheel:function(e){return e?this.bind("mousewheel",e):this.trigger("mousewheel")},unmousewheel:function(e){return this.unbind("mousewheel",e)}})})(jQuery)
;
/**
 MapSVG Lite 6.2.8 - Interactive Map Plugin
 Author: Roman S. Stepanov
 http://codecanyon.net/user/Yatek/portfolio?ref=Yatek

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 http://www.gnu.org/licenses/

 */
!function($){function isNumber(t){return!isNaN(parseFloat(t))&&isFinite(t)}function ucfirst(t){return t.charAt(0).toUpperCase()+t.slice(1)}function parseBoolean(t){switch(String(t).toLowerCase()){case"on":case"true":case"1":case"yes":case"y":return!0;case"off":case"false":case"0":case"no":case"n":return!1;default:return}}function safeURL(t){return(0==t.indexOf("http://")||0==t.indexOf("https://"))&&(t="//"+t.split("://").pop()),t}function extend(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t}function MapObject(){this.id=""}function Region(t,e,o,i){if(MapObject.call(this),this.node=t,this.nodeType=t[0].tagName,this.globalOptions=e,this.mapsvg=i,this.id=this.node.attr("id"),this.id||(this.setId(this.nodeType+"_"+o.id++),this.autoID=!0),this.title=this.node.attr("title"),this.node[0].setAttribute("class","mapsvg-region"),this.svg_style={fill:this.getComputedStyle("fill")},this.svg_style.stroke=this.getComputedStyle("stroke"),_browser.ie){var s=this.getComputedStyle("stroke-width");s=s?s.replace("px",""):"1",s="1"==s?1.2:parseFloat(s),this.svg_style["stroke-width"]=s}else this.node.css({"vector-effect":"non-scaling-stroke"});var r=e.regions&&e.regions[this.id]?e.regions[this.id]:null;this.disabled=this.getDisabledState(),this.disabled&&this.attr("class",this.attr("class")+" mapsvg-disabled"),this.default_attr={},this.selected_attr={},this.hover_attr={},this.mapsvg_type="region";var n=!1;r&&r.selected&&(n=!0,delete r.selected),r&&this.update(r),this.setFill(),n&&this.setSelected(!0),this.saveState()}function Marker(t,e){if(!t.id||!t.src)return!1;MapObject.call(this);var o=document.createElementNS("http://www.w3.org/2000/svg","image");o.setAttributeNS(null,"height",t.height),o.setAttributeNS(null,"width",t.width),o.setAttributeNS("http://www.w3.org/1999/xlink","href",t.src),o.setAttributeNS(null,"x",t.x),o.setAttributeNS(null,"y",t.y),o.setAttributeNS(null,"visibility","visible"),o.setAttribute("class","mapsvg-marker"),this.node=$(o),this.src=t.src,this.setId(t.id),this.mapsvg_type="marker",this.x=parseFloat(t.x),this.y=parseFloat(t.y),this.width=parseFloat(t.width),this.height=parseFloat(t.height),this.tooltip=t.tooltip,this.popover=t.popover,this.href=t.href,this.target=t.target,this["default"]={x:this.x,y:this.y,width:this.width,height:this.height},this.geoCoords=t.geoCoords,this.data=t.data}var mapSVG={};MapObject.prototype.getComputedStyle=function(t,e){if(e=e||this.node[0],_p1=e.getAttribute(t))return _p1;if(_p2=e.getAttribute("style")){var o=_p2.split(";"),i=o.filter(function(e){var e=e.trim(),o=e.split(":");return o[0]==t?!0:void 0});if(i.length)return i[0].split(":").pop().trim()}var s=$(e).parent(),r=s.length?s[0].tagName:null;return r&&"svg"!=r?this.getComputedStyle(t,s[0]):void 0},MapObject.prototype.getStyle=function(t){if(_p1=this.attr(t))return _p1;if(_p2=this.attr("style")){var e=_p2.split(";"),o=e.filter(function(e){var e=e.trim();return 0===e.indexOf(t)?e:void 0});return o.length?o[0].split(":").pop().trim():void 0}return""},MapObject.prototype.getCenter=function(){var t=this.node[0].getBoundingClientRect().left,e=this.node[0].getBoundingClientRect().top,o=this.node[0].getBoundingClientRect().width,i=this.node[0].getBoundingClientRect().height;return[t+o/2,e+i/2]},MapObject.prototype.setTooltip=function(t){this.tooltip=t?t:void 0},MapObject.prototype.setPopover=function(t){this.popover=t?t:void 0},MapObject.prototype.setHref=function(t){if(this.href&&this.node.parent("a").length&&this.node.unwrap(),this.href=t?t:void 0,this.href){var e="http://www.w3.org/1999/xlink",o="http://www.w3.org/2000/svg",i=document.createElementNS(o,"a");i.setAttributeNS(e,"href",this.href),this.target&&i.setAttribute("target",this.target),this.node.wrap($(i))}},MapObject.prototype.setTarget=function(t){if(this.target=t?t:void 0,this.href){var e=this.node.parent("a")[0];this.target?e.setAttribute("target",t):e.removeAttribute("target")}},MapObject.prototype.setData=function(data){if(data){if("string"==typeof data)if("["==data.substr(0,1)||"{"==data.substr(0,1))try{var tmp;eval("tmp = "+data),this.data=tmp}catch(err){var error="MapSVG: Error in Data object for "+this.mapsvg_type+" '"+this.id+"'. Data object was set to empty object {}.";return this.data={},{_error:error}}else this.data=data;else this.data=data;return this.data}this.data=void 0},MapObject.prototype.attr=function(t,e){var o=this.node[0];if("object"==typeof t)$.each(t,function(t,e){("string"==typeof e||"number"==typeof e)&&o.setAttribute(t,e)});else if("string"!=typeof t||"string"!=typeof e&&"number"!=typeof e){if(void 0==e)return o.getAttribute(t)}else o.setAttribute(t,e)},MapObject.prototype.setId=function(t){return t?(this.id=t,void this.node[0].setAttribute("id",t)):!1},extend(Region,MapObject),Region.prototype.saveState=function(){this.initialState=JSON.stringify(this.getOptions())},Region.prototype.changed=function(){return JSON.stringify(this.getOptions())!=this.initialState},Region.prototype.getOptions=function(t){var e=(this.globalOptions.regions[this.id],{id:this.id,title:this.title,disabled:this.disabled===this.getDisabledState(!0)?void 0:this.disabled,tooltip:this.tooltip,popover:this.popover,href:this.href,target:this.target,data:this.data});return t&&(e.disabled=this.disabled),$.each(e,function(t,o){void 0==o&&delete e[t]}),e},Region.prototype.update=function(t){for(var e in t){var o="set"+ucfirst(e);o in this&&this[o](t[e])}},Region.prototype.setFill=function(){this.disabled&&this.globalOptions.colors.disabled?this.default_attr.fill=this.globalOptions.colors.disabled:this.globalOptions.colors.base?this.default_attr.fill=this.globalOptions.colors.base:"none"!=this.svg_style.fill?this.default_attr.fill=this.svg_style.fill?this.svg_style.fill:this.globalOptions.colors.baseDefault:this.default_attr.fill="none",this.selected_attr.fill=this.globalOptions.colors.selected,this.hover_attr.fill=this.globalOptions.colors.hover,this.node.css("fill",this.default_attr.fill),this.fill=this.default_attr.fill,void 0!=this.globalOptions.colors.stroke?this.node.css("stroke",this.globalOptions.colors.stroke):this.node.css("stroke",this.svg_style.stroke),this.selected&&this.select()},Region.prototype.setDisabled=function(t){t=void 0!==t?parseBoolean(t):this.getDisabledState(),this.disabled=t,t?this.attr("class",this.attr("class")+" mapsvg-disabled"):this.attr("class",this.attr("class").replace(" mapsvg-disabled","")),this.selected=!1,this.setFill()},Region.prototype.setSelected=function(t){this.mapsvg.selectRegion(this)},Region.prototype.getDisabledState=function(t){var e=this.globalOptions.regions[this.id];return!t&&e&&void 0!==e.disabled?e.disabled:this.globalOptions.disableAll||"none"==this.svg_style.fill||"labels"==this.id||"Labels"==this.id?!0:!1},Region.prototype.highlight=function(){this.node.css({fill:this.hover_attr.fill})},Region.prototype.unhighlight=function(){this.node.css({fill:this.default_attr.fill})},Region.prototype.select=function(){this.node.css({fill:this.selected_attr.fill}),this.selected=!0},Region.prototype.deselect=function(){this.node.css({fill:this.default_attr.fill}),this.selected=!1},extend(Marker,MapObject),Marker.prototype.getOptions=function(){var t={id:this.id,tooltip:this.tooltip,popover:this.popover,href:this.href,target:this.target,data:this.data,src:this.src,width:this["default"].width,height:this["default"].height,x:this.x,y:this.y,geoCoords:this.geoCoords};return $.each(t,function(e,o){void 0==o&&delete t[e]}),t},Marker.prototype.setXY=function(t,e){this.x=t,this.y=e,this.node[0].setAttribute("x",t),this.node[0].setAttribute("y",e),this.adjustPosition(this.mapScale)},Marker.prototype.update=function(t,e){for(var o in t){var i="set"+ucfirst(o);i in this&&this[i](t[o],e)}},Marker.prototype.setSrc=function(t,e){if(!t)return!1;t=safeURL(t),e=e||this.mapScale;var o=new Image,i=this;o.onload=function(){i["default"].width=this.width,i["default"].height=this.height,i.x=i.x-(this.width-i.width)/2,i.y=i.y-(this.height-i.height),i.attr({x:i.x,y:i.y,width:this.width,height:this.height}),i.width=this.width,i.height=this.height,i.node[0].setAttributeNS("http://www.w3.org/1999/xlink","href",t),i.adjustPosition(e),i.src=t},o.src=t},Marker.prototype.adjustPosition=function(t){var e=this["default"].width,o=this["default"].height,i=e/2-e/(2*t),s=o-o/t;this.attr("width",e/t),this.attr("height",o/t),this.attr("transform","translate("+i+","+s+")"),this.mapScale=t},Marker.getDefaultCoords=function(t,e,o,i,s){return t=parseFloat(t),e=parseFloat(e),o=parseFloat(o),i=parseFloat(i),t=t+o/(2*s)-o/2,e=e+i/s-i,[t,e]},Marker.prototype.drag=function(t,e,o,i){_this=this,this.ox=this.x,this.oy=this.y,$("body").on("mousemove.drag.mapsvg",function(o){o.preventDefault();var i=mouseCoords(o),s=i.x-t.x,r=i.y-t.y;_this.x=_this.ox+s/e,_this.y=_this.oy+r/e,_this.attr({x:_this.x,y:_this.y})}),$("body").on("mouseup.drag.mapsvg",function(s){s.preventDefault(),_this.undrag();var r=mouseCoords(s),n=r.x-t.x,a=r.y-t.y;_this.x=_this.ox+n/e,_this.y=_this.oy+a/e,_this.attr({x:_this.x,y:_this.y}),o.call(_this),_this.ox==_this.x&&_this.oy==_this.y&&i.call(_this)})},Marker.prototype.undrag=function(){$("body").off(".drag.mapsvg")},Marker.prototype["delete"]=function(){this.href&&this.node.parent("a").empty().remove(),this.node.empty().remove()};var instances={},globalID=0,userAgent=navigator.userAgent.toLowerCase(),scripts=document.getElementsByTagName("script"),myScript=scripts[scripts.length-1].src.split("/");myScript.pop();var pluginJSURL=myScript.join("/")+"/";myScript.pop();var pluginRootURL=myScript.join("/")+"/",touchDevice=userAgent.indexOf("ipad")>-1||userAgent.indexOf("iphone")>-1||userAgent.indexOf("ipod")>-1||userAgent.indexOf("android")>-1,_browser={};if(_browser.ie=userAgent.indexOf("msie")>-1||userAgent.indexOf("Trident")>-1?{}:!1,_browser.firefox=userAgent.indexOf("firefox")>-1,String.prototype.trim||(String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")}),touchDevice)var mouseCoords=function(t){return t=t.originalEvent,t.touches&&t.touches[0]?{x:t.touches[0].pageX,y:t.touches[0].pageY}:{x:t.changedTouches[0].pageX,y:t.changedTouches[0].pageY}};else var mouseCoords=function(t){return t.pageX?{x:t.pageX,y:t.pageY}:{x:t.clientX+$(document).scrollLeft(),y:t.clientY+$(document).scrollTop()}};var defaults={markerLastID:0,regionLastID:0,disableAll:!1,width:null,height:null,lockAspectRatio:!0,loadingText:"Loading map...",colors:{baseDefault:"#000000",background:"#eeeeee",selected:"#cccccc",hover:"#9d9d9d"},regions:{},markers:[],viewBox:[],cursor:"default",afterLoad:null,zoom:{on:!1,limit:[0,10],delta:1.2,buttons:{on:!0,location:"right"}},scroll:{on:!1,limit:!1,background:!1},responsive:!1,tooltips:{mode:"off",on:!1,priority:"local"},popovers:{mode:"off",on:!1,priority:"local"},multiSelect:!1},markerOptions={src:pluginRootURL+"markers/pin1_red.png"};mapSVG=function(t,e){var o;this.methods={mouseCoords:mouseCoords,functionFromString:function(t){var e,o=!1,i=t;if(-1==i.indexOf("{")||-1==i.indexOf("function")||-1==i.indexOf("("))return{error:"MapSVG user function error: no function body."};var s=i.substring(i.indexOf("{")+1,i.lastIndexOf("}")),r=i.substring(i.indexOf("(")+1,i.indexOf(")"));try{e=new Function(r,s),success=!0}catch(n){o=n}return o?{error:{line:o.line,text:"MapSVG user function error: (line "+o.line+"): "+o.message}}:e},getOptions:function(t,e){var i=$.extend(!0,{},o.options);return i.viewBox=o._viewBox,delete i.markers,t?(i.regions=[],o.regions.forEach(function(t){i.regions.push(t.getOptions())}),i.markers=o.options.markers):(o.regions.forEach(function(t){t.changed()&&(i.regions[t.id]=t.getOptions())}),o.markers.length>0&&(i.markers=[]),o.markers.forEach(function(t){i.markers.push(t.getOptions())})),e&&$.each(i,function(t,e){JSON.stringify(e)==JSON.stringify(defaults[t])&&delete i[t]}),i},update:function(t){for(var e in t)if("regions"==e)$.each(t.regions,function(t,e){var s=i.getRegion(t);s&&s.update(e),void 0!=e.disabled&&(i.deselectRegion(s),o.options.regions[t]=o.options.regions[t]||{},o.options.regions[t].disabled=s.disabled)});else if("markers"==e)$.each(t.markers,function(t,e){var o=i.getMarker(t);if(e.geoCoords){if("string"==typeof e.geoCoords&&(e.geoCoords=e.geoCoords.trim().split(","),e.geoCoords=[parseFloat(e.geoCoords[0]),parseFloat(e.geoCoords[1])]),"object"==typeof e.geoCoords&&2==e.geoCoords.length&&$.isNumeric(e.geoCoords[0])&&$.isNumeric(e.geoCoords[1])){var s=i.convertGeoToPixel(e.geoCoords);s[0]=s[0]-o.width/2+.3,s[1]=s[1]-o.height+1.5,o.setXY(s[0],s[1])}}else o&&o.update(e)});else{var s="set"+ucfirst(e);i.hasOwnProperty(s)?this[s](t[e]):console.log("MapSVG Error: no setter "+s+"()")}},setTitle:function(t){t&&(o.options.title=t)},setDisableLinks:function(t){t=parseBoolean(t),t?o.$map.on("click.a.mapsvg","a",function(t){t.preventDefault()}):o.$map.off("click.a.mapsvg"),o.disableLinks=t},setLoadingText:function(t){o.options.loadingText=t},setLockAspectRatio:function(t){o.options.lockAspectRatio=parseBoolean(t)},setAfterLoad:function(t){o.options.afterLoad=t||void 0},setMarkerEditHandler:function(t){o.markerEditHandler=t},setRegionEditHandler:function(t){o.regionEditHandler=t},setDisableAll:function(t){t=parseBoolean(t),$.extend(!0,o.options,{disableAll:t}),o.regions.forEach(function(t){t.setDisabled()})},setColors:function(t){$.extend(!0,o.options,{colors:t}),$.each(o.options.colors,function(t,e){(null===e||""==e)&&delete e[t]}),t.background&&o.$map.css({background:o.options.colors.background}),t.hover&&(o.options.colors.hover=t.hover),t.selected&&(o.options.colors.selected=t.selected),i.regionsRedrawColors()},setTooltips:function(t){"string"==typeof t.mode&&0==t.mode.indexOf("function")?t.mode=i.functionFromString(t.mode):t.mode||(t.mode="off"),o.options.tooltips.on="off"!=o.options.tooltips.mode,$.extend(!0,o.options,{tooltips:t}),o.mapTip||(o.mapTip=$("<div />").addClass("mapsvg-tooltip"),$("body").append(o.mapTip)),o.tooltipWatchMouseHandler||$("body").on("mousemove.tooltip.mapsvg",function(t){window.m=mouseCoords(t),o.mapTip.css("left",t.clientX+$(window).scrollLeft()).css("top",t.clientY+$(window).scrollTop()+25)})},setPopovers:function(t){"string"==typeof t.mode&&0==t.mode.indexOf("function")?t.mode=i.functionFromString(t.mode):t.mode||(t.mode="off"),$.extend(!0,o.options,{popovers:t}),o.options.popovers.on="off"!=o.options.popovers.mode,o.mapPopover||(o.mapPopover=$("<div />").addClass("mapsvg-popover"),o.mapPopover.closeButton=$('<div class="mapsvg-popover-close">&#10005;</div>'),o.mapPopover.contentDiv=$('<div class="mapsvg-popover-content"></div>'),o.mapPopover.append(o.mapPopover.contentDiv),o.mapPopover.append(o.mapPopover.closeButton),o.mapPopover.css({width:o.options.popovers.width+("auto"==o.options.popovers.width?"":"px"),height:o.options.popovers.height+("auto"==o.options.popovers.height?"":"px")}),o.mapPopover.closeButton.on("click",i.hidePopover),$("body").append(o.mapPopover)),$("body").off(".popover.mapsvg",i.popoverOffHandler),touchDevice||$("body").on("mousedown.popover.mapsvg",i.popoverOffHandler)},setInitialViewBox:function(t){"string"==typeof t&&(t=t.trim().split(" ")),o._viewBox=[parseFloat(t[0]),parseFloat(t[1]),parseFloat(t[2]),parseFloat(t[3])],o.zoomLevel=0},setViewBox:function(t,e){"string"==typeof t&&(t=t.trim().split(" "));var s=t&&4==t.length?t:o.svgDefault.viewBox,r=parseInt(s[2])!=o.viewBox[2]||parseInt(s[3])!=o.viewBox[3];return o.viewBox=[parseFloat(s[0]),parseFloat(s[1]),parseFloat(s[2]),parseFloat(s[3])],t||(o._viewBox=o.viewBox,o._scale=1),o.$svg[0].setAttribute("viewBox",o.viewBox.join(" ")),i.setResponsive(o.options.responsive,!0),r&&!e&&(o.scale=i.getScale(),i.markersAdjustPosition(),_browser.ie&&i.mapAdjustStrokes()),!0},redraw:function(){o.$map.css({width:o.$map.width(),height:o.$map.width()/o.whRatio}),_browser.ie?o.$map.css({width:"auto"}):o.$map.css({width:"auto",height:"auto"}),i.updateSize()},setSize:function(t,e,s){return o.options.width=parseFloat(t),o.options.height=parseFloat(e),o.options.responsive=null!=s?parseBoolean(s):o.options.responsive,o.options.width||o.options.height?!o.options.width&&o.options.height?o.options.width=parseInt(o.options.height*o.svgDefault.width/o.svgDefault.height):o.options.width&&!o.options.height&&(o.options.height=parseInt(o.options.width*o.svgDefault.height/o.svgDefault.width)):(o.options.width=o.svgDefault.width,o.options.height=o.svgDefault.height),o.whRatio=o.options.width/o.options.height,o.scale=i.getScale(),i.setResponsive(s),o.markers&&i.markersAdjustPosition(),[o.options.width,o.options.height]},setResponsive:function(t,e){t=void 0!=t?parseBoolean(t):o.options.responsive,$(window).off("resize.mapsvg"),t?($(window).on("resize.mapsvg",i.updateSize),o.$map.hasClass("mapsvg-responsive")||(o.$map.addClass("mapsvg-responsive"),o.$map.css({width:"auto",height:"auto"})),o.$map.height(o.$map.width()/o.whRatio),$(window).on("resize.mapsvg",function(){o.$map.height(o.$map.width()/o.whRatio),i.updateSize()})):(o.$map.removeClass("mapsvg-responsive"),o.$map.css({width:o.options.width+"px",height:o.options.height+"px"})),$.extend(!0,o.options,{responsive:t}),i.updateSize()},setScroll:function(t){null!=t.on&&(t.on=parseBoolean(t.on)),null!=t.limit&&(t.limit=parseBoolean(t.limit)),$.extend(!0,o.options,{scroll:t}),i.setEventHandlers()},setZoom:function(t){t=t||{},void 0!=t.on&&(t.on=parseBoolean(t.on)),t.delta&&(t.delta=parseFloat(t.delta)),t.limit&&("string"==typeof t.limit&&(t.limit=t.limit.split(";")),t.limit=[parseInt(t.limit[0]),parseInt(t.limit[1])]),$.extend(!0,o.options,{zoom:t}),o.$map.off("mousewheel.mapsvg"),o.options.zoom.on&&o.$map.on("mousewheel.mapsvg",function(t,e,o,s){var r=e>0?1:-1;return i.zoom(r),!1}),i.setZoomButtons()},setZoomButtons:function(){var t=o.options.zoom.buttons.location||"hide";if(!o.zoomButtons){var e=$("<div />").addClass("mapsvg-buttons");e.zoomIn=$("<div />").addClass("mapsvg-btn-zoom in");var s=touchDevice?"touchstart":"click";e.zoomIn.on(s,function(t){t.stopPropagation(),i.zoomIn()}),e.zoomOut=$("<div />").addClass("mapsvg-btn-zoom out"),e.zoomOut.on(s,function(t){t.stopPropagation(),i.zoomOut()}),e.append(e.zoomIn).append(e.zoomOut),o.zoomButtons=e,o.$map.append(o.zoomButtons)}"right"==t&&o.zoomButtons.css({right:"15px",left:"auto"})||"left"==t&&o.zoomButtons.css({right:"auto",left:"15px"}),o.options.zoom.on&&"hide"!=t?o.zoomButtons.show():o.zoomButtons.hide()},setCursor:function(t){t="pointer"==t?"pointer":"default",o.options.cursor=t,"pointer"==t?o.$map.addClass("mapsvg-cursor-pointer"):o.$map.removeClass("mapsvg-cursor-pointer")},setPreloaderText:function(t){o.options.loadingText=t},setMultiSelect:function(t){o.options.multiSelect=parseBoolean(t),i.deselectAllRegions()},getRegion:function(t){return o.regions[o.regionsDict[t]]},getMarker:function(t){return o.markers[o.markersDict[t]]},checkId:function(t){return i.getRegion(t)?{error:"This ID is already being used by a Region"}:i.getMarker(t)?{error:"This ID is already being used by another Marker"}:!0},regionsRedrawColors:function(){o.regions.forEach(function(t){t.setFill()})},destroy:function(){return delete instances[o.$map.attr("id")],o.$map.empty(),i},getData:function(){return o},cnt:function(){return o.t()?!1:!0},getScale:function(){var t,e=(o.svgDefault.width/o.svgDefault.height,o.options.width/o.options.height,[o.$map.width(),o.$map.height()]);return t=e[0]/o.viewBox[2],t||1},updateSize:function(){o.scale=i.getScale(),i.markersAdjustPosition(),_browser.ie&&i.mapAdjustStrokes()},getViewBox:function(){return o.viewBox},viewBoxSetBySize:function(t,e){return o._viewBox=i.viewBoxGetBySize(t,e),o.options.width=parseFloat(t),o.options.height=parseFloat(e),i.setViewBox(o._viewBox,!0),o.whRatio=o.viewBox[2]/o.viewBox[3],o.options.responsive||i.setResponsive(),o.viewBox},viewBoxGetBySize:function(t,e){var i=t/e,s=o.svgDefault.viewBox[2]/o.svgDefault.viewBox[3],r=$.extend([],o.svgDefault.viewBox);return i!=s&&(i>s?(r[2]=o.svgDefault.viewBox[3]*i,r[0]=o.svgDefault.viewBox[0]-(r[2]-o.svgDefault.viewBox[2])/2):(r[3]=o.svgDefault.viewBox[2]/i,r[1]=o.svgDefault.viewBox[1]-(r[3]-o.svgDefault.viewBox[3])/2)),r},viewBoxReset:function(t){if(t){var e=o._viewBox||o.svgDefault.viewBox;o.zoomLevel=0,o._scale=1,i.setViewBox(e)}else i.setViewBox()},getGeoViewBox:function(){var t=o.viewBox,e=i.convertPixelToGeo(t[0],t[1])[1],s=i.convertPixelToGeo(t[0]+t[2],t[1])[1],r=i.convertPixelToGeo(t[0],t[1])[0],n=i.convertPixelToGeo(t[0],t[1]+t[3])[0];return[e,r,s,n]},mapAdjustStrokes:function(){o.regions.forEach(function(t){t.svg_style["stroke-width"]&&t.node.css("stroke-width",t.svg_style["stroke-width"]/o.scale)})},zoomIn:function(){i.zoom(1)},zoomOut:function(){i.zoom(-1)},touchZoomStart:function(t){touchZoomStart=o._scale,o.scale=o.scale*zoom_k,zoom=o._scale,o._scale=o._scale*zoom_k;var e=o.viewBox[2],s=o.viewBox[3],r=[];r[2]=o._viewBox[2]/o._scale,r[3]=o._viewBox[3]/o._scale,r[0]=o.viewBox[0]+(e-r[2])/2,r[1]=viewBox[1]+(s-r[3])/2,i.setViewBox(r)},touchZoomMove:function(){},touchZoomEnd:function(){},zoom:function(t,e){var s=o.viewBox[2],r=o.viewBox[3],n=[];if(e)o._scale=e,n[2]=o.touchZoomStartViewBox[2]/o._scale,n[3]=o.touchZoomStartViewBox[3]/o._scale;else{var a=t>0?1:-1;if(o._zoomLevel=o.zoomLevel,o._zoomLevel+=a,o._zoomLevel>o.options.zoom.limit[1]||o._zoomLevel<o.options.zoom.limit[0])return!1;o.zoomLevel=o._zoomLevel;var l=a*o.options.zoom.delta;1>l&&(l=-1/l),o._scale=o._scale*l,n[2]=o._viewBox[2]/o._scale,n[3]=o._viewBox[3]/o._scale}n[0]=o.viewBox[0]+(s-n[2])/2,n[1]=o.viewBox[1]+(r-n[3])/2,i.setViewBox(n)},markerDelete:function(t){var e=t.id;o.markers.splice(o.markersDict[e],1);t["delete"](),t=null,i.updateMarkersDict(),0==o.markers.length&&(o.options.markerLastID=0)},markerAdd:function(t,e){var o=$.extend(!0,{},markerOptions,t);if(!o.src||!i.cnt())return!1;if(o.src=safeURL(o.src),o.width&&o.height)return i.markerAddFinalStep(o,e);var s=new Image;s.onload=function(){return o.width=this.width,o.height=this.height,i.markerAddFinalStep(o,e)},s.src=o.src},markerAddFinalStep:function(t,e){if(t.xy||isNumber(t.x)&&isNumber(t.y))xy=t.xy||[t.x,t.y],e&&(xy[0]+=o.scale<1?1:2,xy[1]+=1,xy[0]=xy[0]/o.scale-t.width/2+o.viewBox[0],xy[1]=xy[1]/o.scale-t.height+o.viewBox[1]);else{if(!t.geoCoords)return!1;xy=i.convertGeoToPixel(t.geoCoords),xy[0]=xy[0]-t.width/2+.3,xy[1]=xy[1]-t.height+1.5}t.x=xy[0],t.y=xy[1],t.id=t.id||"marker_"+o.options.markerLastID++,!t.geoCoords&&o.mapIsGeo&&(t.geoCoords=i.convertPixelToGeo(t.x+t.width/2,t.y+(t.height-1)));var s=new Marker(t,o.scale);return o.$svg.append(s.node),s.href&&s.setHref(s.href),s.adjustPosition(o.scale),o.markers.push(s),o.markersDict[s.id]=o.markers.length-1,e&&o.markerEditHandler&&o.markerEditHandler.call(s),s},markersAdjustPosition:function(){o.markers.forEach(function(t){t.adjustPosition(o.scale)})},markerMoveStart:function(){this.data("ox",parseFloat(this.attr("x"))),this.data("oy",parseFloat(this.attr("y")))},markerMove:function(t,e){t/=o.scale,e/=o.scale,this.attr({x:this.data("ox")+t,y:this.data("oy")+e})},markerMoveEnd:function(){this.data("ox")==this.attr("x")&&this.data("oy")==this.attr("y")&&e.markerEditHandler.call(this)},scrollStart:function(t,e){if($(t.target).hasClass("mapsvg-btn-zoom")||$(t.target).closest(".mapsvg-gauge").length)return!1;if(o.editMarkers.on&&"mapsvg-marker"==$(t.target).attr("class"))return!1;if(t.preventDefault(),touchDevice)var s=t.originalEvent&&t.originalEvent.touches&&t.originalEvent.touches[0]?t.originalEvent.touches[0]:t;else var s=t;o.scroll={},o.scroll.vxi=o.viewBox[0],o.scroll.vyi=o.viewBox[1],o.scroll.x=s.clientX,o.scroll.y=s.clientY,o.scroll.dx=0,o.scroll.dy=0,o.scroll.vx=0,o.scroll.vy=0,touchDevice||$("body").on("mousemove.scroll.mapsvg",i.scrollMove).on("mouseup.scroll.mapsvg",function(t){i.scrollEnd(t,e)})},scrollMove:function(t){t.preventDefault(),o.isScrolling=!0,$("body").css({cursor:"move"});var e=t.originalEvent&&t.originalEvent.touches&&t.originalEvent.touches[0]?t.originalEvent.touches[0]:t;o.scroll.dx=o.scroll.x-e.clientX,o.scroll.dy=o.scroll.y-e.clientY;var s=parseInt(o.scroll.vxi+o.scroll.dx/o.scale),r=parseInt(o.scroll.vyi+o.scroll.dy/o.scale);o.options.scroll.limit&&(s<o.svgDefault.viewBox[0]?s=o.svgDefault.viewBox[0]:o.viewBox[2]+s>o.svgDefault.viewBox[0]+o.svgDefault.viewBox[2]&&(s=o.svgDefault.viewBox[0]+o.svgDefault.viewBox[2]-o.viewBox[2]),r<o.svgDefault.viewBox[1]?r=o.svgDefault.viewBox[1]:o.viewBox[3]+r>o.svgDefault.viewBox[1]+o.svgDefault.viewBox[3]&&(r=o.svgDefault.viewBox[1]+o.svgDefault.viewBox[3]-o.viewBox[3])),o.scroll.vx=s,o.scroll.vy=r,i.setViewBox([o.scroll.vx,o.scroll.vy,o.viewBox[2],o.viewBox[3]])},scrollEnd:function(t,e){o.isScrolling=!1,Math.abs(o.scroll.dx)<5&&Math.abs(o.scroll.dy)<5&&(o.editMarkers.on?i.markerAddClickHandler(t):o.region_clicked&&i.regionClickHandler(t,o.region_clicked)),$("body").css({cursor:"default"}),o.viewBox[0]=o.scroll.vx||o.viewBox[0],o.viewBox[1]=o.scroll.vy||o.viewBox[1],$("body").off(".scroll.mapsvg")},scrollRegionClickHandler:function(t,e){o.region_clicked=e},touchStart:function(t,e){t.preventDefault();var s=t.originalEvent;o.options.zoom&&s.touches&&2==s.touches.length?(o.touchZoomStartViewBox=o.viewBox,o.touchZoomStart=o.scale,o.touchZoomEnd=1):(i.scrollStart(t,e),o.isScrolling=!0)},touchMove:function(t){t.preventDefault();var e=t.originalEvent;o.options.zoom&&e.touches&&e.touches.length>=2?(i.zoom(null,e.scale),o.isScrolling=!1):o.isScrolling&&i.scrollMove(t)},touchEnd:function(t){t.preventDefault();t.originalEvent;o.touchZoomStart?(o.touchZoomStart=!1,o.touchZoomEnd=!1):o.isScrolling&&i.scrollEnd(t)},markersGroupHide:function(t){for(var e in o.markers[t])o.markers[t][e].hide()},markersGroupShow:function(t){for(var e in o.markers[t])o.markers[t][e].show()},regionsGroupSelect:function(t){for(var e in o.markers[t])o.markers[t][e].hide()},regionsGroupUnselect:function(t){for(var e in o.markers[t])o.markers[t][e].show()},markersGet:function(){return o.markers},getSelected:function(){return o.selected_id},selectRegion:function(t){if("string"==typeof t)var e=i.getRegion(t);else var e=t;if(!e||e.disabled)return!1;if(o.options.multiSelect&&!o.editRegions.on){if(e.selected)return void i.deselectRegion(e)}else o.selected_id.length>0&&i.deselectRegion();o.selected_id.push(e.id),e.select()},deselectAllRegions:function(){$.each(o.selected_id,function(t,e){i.deselectRegion(i.getRegion(e))})},deselectRegion:function(t){t||(t=i.getRegion(o.selected_id[0])),t.deselect();var e=$.inArray(t.id,o.selected_id);o.selected_id.splice(e,1),_browser.ie&&i.mapAdjustStrokes()},selectRegionsGroup:function(t){for(var e in o.regionGroups[t]){var s=o.regionGroups[t][e].id;i.selectRegion(s)}},highlightRegionsGroup:function(t){for(var e in o.regionGroups[t]){var s=o.regionGroups[t][e].id;i.highlightRegion(s)}},unhighlightRegionsGroup:function(t){for(var e in o.regionGroups[t]){var s=o.regionGroups[t][e].id;i.unhighlightRegion(s)}},narrowToRegionsGroup:function(t){o.regions.forEach(function(e){e.group==t||e.disabled?e.disabledTemp&&(e.disabledTemp=!1,e.disabled=!1,$(e.node).removeClass("mapsvg-disabled")):(e.disabled=!0,e.disabledTemp=!0,$(e.node).addClass("mapsvg-disabled"))})},disableRegionsGroup:function(t){},enableAllRegionsGroups:function(){o.regions.forEach(function(t){t.disabledTemp&&(t.disabledTemp=!1,t.disabled=!1,$(t.node).removeClass("mapsvg-disabled"))})},convertGeoToPixel:function(t){var e=parseFloat(t[0]),i=parseFloat(t[1]),s=(i-o.geoViewBox.leftLon)*(o.svgDefault.width/o.mapLonDelta),e=3.14159*e/180,r=o.svgDefault.width/o.mapLonDelta*360/6.28318,n=r/2*Math.log((1+Math.sin(o.mapLatBottomDegree))/(1-Math.sin(o.mapLatBottomDegree))),a=o.svgDefault.height-(r/2*Math.log((1+Math.sin(e))/(1-Math.sin(e)))-n);return s+=o.svgDefault.viewBox[0],a+=o.svgDefault.viewBox[1],[s,a]},convertPixelToGeo:function(t,e){t-=o.svgDefault.viewBox[0],e-=o.svgDefault.viewBox[1];var i=o.svgDefault.width/o.mapLonDelta*360/(2*Math.PI),s=i/2*Math.log((1+Math.sin(o.mapLatBottomDegree))/(1-Math.sin(o.mapLatBottomDegree))),r=o.svgDefault.height+s,n=(r-e)/i,a=180/Math.PI*(2*Math.atan(Math.exp(n))-Math.PI/2),l=o.geoViewBox.leftLon+t/o.svgDefault.width*o.mapLonDelta;return[a,l]},isRegionDisabled:function(t,e){return o.options.regions[t]&&(o.options.regions[t].disabled||"none"==e)?!0:void 0!=o.options.regions[t]&&!parseBoolean(o.options.regions[t].disabled)||!o.options.disableAll&&"none"!=e&&"labels"!=t&&"Labels"!=t?!1:!0},regionClickHandler:function(t,e){if(!e||e.disabled)return!1;if(o.region_clicked=null,"region"==e.mapsvg_type&&i.selectRegion(e.id),o.editRegions.on)return void o.regionEditHandler.call(e);i.hidePopover();var s=i.getPopoverBody(e);s&&i.showPopover(t,s),touchDevice&&e.href&&!o.disableLinks&&(window.location.href=e.href)},fileExists:function(t){if("data"==t.substr(0,4))return!0;var e=new XMLHttpRequest;return e.open("HEAD",t,!1),e.send(),404!=e.status},getStyle:function(t,e){if(t.currentStyle)var o=t.currentStyle.margin;else if(window.getComputedStyle)if(window.getComputedStyle.getPropertyValue)var o=window.getComputedStyle(t,null).getPropertyValue(e);else var o=window.getComputedStyle(t)[e];return o},search:function(t){return results=[],t=t.toLowerCase(),o.regions.forEach(function(e){(0===e.id.toLowerCase().indexOf(t)||e.title&&0===e.title.toLowerCase().indexOf(t))&&results.push(e.id)}),results},searchMarkers:function(t){return results=[],t=t.toLowerCase(),o.markers.forEach(function(e){0===e.id.toLowerCase().indexOf(t)&&results.push(e.id)}),results},markerAddClickHandler:function(t){if($(t.target).is("image"))return!1;var e=mouseCoords(t),s=e.x-o.$map.offset().left,r=e.y-o.$map.offset().top;return $.isNumeric(s)&&$.isNumeric(r)?void i.markerAdd({xy:[s,r],group:o.editMarkers.group},!0):!1},setMarkersEditMode:function(t){o.editMarkers.on=parseBoolean(t),i.deselectAllRegions(),i.setEventHandlers()},setRegionsEditMode:function(t){o.editRegions.on=parseBoolean(t),i.deselectAllRegions(),i.setEventHandlers()},setMarkers:function(t){$.each(t,function(t,e){i.markerAdd(e)})},setEventHandler:function(){},textBr:function(t){for(var e=[],o=t.split(/\n/),i=jQuery(document.createElement("div")),s=0;s<o.length;s++)e.push(i.text(o[s]).html());return e.join("<br />")},runUserFunction:function(t){try{t()}catch(e){console.log("MapSVG user-defined function error: (line "+e.line+"): "+e.message)}},showTooltip:function(t){if(t.disabled)return!1;var e;e="global"==o.options.tooltips.priority?"off"!=o.options.tooltips.mode&&t[o.options.tooltips.mode]||t.tooltip:t.tooltip||"off"!=o.options.tooltips.mode&&t[o.options.tooltips.mode],e&&(o.mapTip.html(i.textBr(e)),o.mapTip.addClass("mapsvg-tooltip-visible"))},getPopoverBody:function(t){return"off"!=o.options.popovers.mode||"global"!=o.options.popovers.priority?t.popover:void 0},showPopover:function(t,e,s){if(s&&2==s.length){var r=i.getScale();s[0]=o.$map.offset().left+s[0]*r,s[1]=o.$map.offset().top+s[1]*r}else var n=mouseCoords(t),s=[n.x,n.y];if(e){o.mapPopover.contentDiv.html(i.textBr(e));var a=s[0]-o.mapPopover.outerWidth(!1)/2,l=s[1]-o.mapPopover.outerHeight(!1)-14;0>a&&(a=0),0>l&&(l=0),o.mapPopover.css("left",a).css("top",l),o.mapPopover.addClass("mapsvg-popover-visible")}else o.mapPopover.removeClass("mapsvg-popover-visible")},hidePopover:function(){o.mapPopover.contentDiv.empty(),o.mapPopover.removeClass("mapsvg-popover-visible"),$("body").off("mousedown.popover.mapsvg",i.popoverOffHandler),o.options.onPopoverClose&&o.options.onPopoverClose.call(i)},hideTip:function(){o.mapTip.removeClass("mapsvg-tooltip-visible")},popoverOffHandler:function(t){return $(t.target).closest(".mapsvg-popover").length?!1:void i.hidePopover()},mouseOverHandler:function(t){this instanceof Region&&(this.selected||this.highlight()),i.showTooltip(this)},mouseOutHandler:function(t){this instanceof Region&&(this.selected||this.unhighlight()),i.hideTip()},updateOptions:function(t){$.extend(!0,o.options,t)},updateMarkersDict:function(){o.markersDict={},o.markers.forEach(function(t,e){o.markersDict[t.id]=e})},setEventHandlers:function(){if(o.$map.off(".common.mapsvg"),o.editMarkers.on){var t=touchDevice?"touchstart.common.mapsvg":"mousedown.common.mapsvg";
 o.$map.on(t,".mapsvg-marker",function(t){t.originalEvent.preventDefault();var e=i.getMarker($(this).attr("id")),s=mouseCoords(t);e.drag(s,o.scale,function(){o.mapIsGeo&&(this.geoCoords=i.convertPixelToGeo(this.x+this.width/2,this.y+(this.height-1))),o.markerEditHandler.call(this,!0)},function(){o.markerEditHandler.call(this)})})}if(touchDevice||(o.editMarkers.on||o.$map.on("mouseover.common.mapsvg",".mapsvg-region",function(t){var o=$(this).attr("id");i.mouseOverHandler.call(i.getRegion(o),t,i,e)}).on("mouseleave.common.mapsvg",".mapsvg-region",function(t){var o=$(this).attr("id");i.mouseOutHandler.call(i.getRegion(o),t,i,e)}),o.editRegions.on||o.$map.on("mouseover.common.mapsvg",".mapsvg-marker",function(t){var o=$(this).attr("id");i.mouseOverHandler.call(i.getMarker(o),t,i,e)}).on("mouseleave.common.mapsvg",".mapsvg-marker",function(t){var o=$(this).attr("id");i.mouseOutHandler.call(i.getMarker(o),t,i,e)})),o.options.scroll.on){var s=touchDevice?"touchstart.common.mapsvg":"mousedown.common.mapsvg";o.$map.on(s,".mapsvg-region",function(t){t.preventDefault();var e=i.getRegion($(this).attr("id"));i.scrollRegionClickHandler.call(i,t,e)}),o.$map.on(s,".mapsvg-marker",function(t){t.preventDefault();var e=i.getMarker($(this).attr("id"));i.scrollRegionClickHandler.call(i,t,e)}),touchDevice?o.$map.on("touchstart.common.mapsvg",function(t){i.touchStart(t,i)}).on("touchmove.common.mapsvg",i.touchMove).on("touchend.common.mapsvg",i.touchEnd):o.$map.on("mousedown.common.mapsvg",function(t){i.scrollStart(t,i)})}else{var s=touchDevice?"touchstart.common.mapsvg":"click.common.mapsvg";o.editMarkers.on?o.$map.on(s,function(t){i.markerAddClickHandler(t)}):(o.$map.on(s,".mapsvg-region",function(t){i.regionClickHandler.call(i,t,i.getRegion($(this).attr("id")))}),o.$map.on(s,".mapsvg-marker",function(t){i.regionClickHandler.call(i,t,i.getMarker($(this).attr("id")))}))}},init:function(t,e){if(!t.source)throw new Error("MapSVG: please provide SVG file source.");0===t.source.indexOf("//")?t.source=t.source.replace(/^\/\/[^\/]+/,"").replace("//","/"):t.source=t.source.replace(/^.*:\/\/[^\/]+/,"").replace("//","/"),o={},o.options=$.extend(!0,{},defaults,t),o.editRegions={on:!1},o.editMarkers={on:!1},o.map=e,o.$map=$(e),o.whRatio=0,o.isScrolling=!1,o.markerOptions={},o.svgDefault={},o.refLength=0,o.scale=1,o._scale=1,o.selected_id=[],o.mapData={},o.regions=[],o.regionsDict={},o.regionID={id:0},o.markers=[],o.code=o.markers,o.markersDict={},o._viewBox=[],o.viewBox=[],o.viewBoxZoom=[],o.viewBoxFind=void 0,o.zoomLevel=0,o.scroll={},o.geoCoordinates=!1,o.t=function(){return o.code.length>=5},o.geoViewBox={leftLon:0,topLat:0,rightLon:0,bottomLat:0},o.$map.addClass("mapsvg").css("background",o.options.colors.background);var s=$("<div>"+o.options.loadingText+"</div>").addClass("mapsvg-loading");return o.$map.append(s),s.css({"margin-left":function(){return-($(this).outerWidth(!1)/2)+"px"},"margin-top":function(){return-($(this).outerHeight(!1)/2)+"px"}}),$.ajax({url:o.options.source,success:function(t){$data=$(t);var e=$data.find("svg");if(o.$svg=e,o.svgDefault.width=e.attr("width"),o.svgDefault.height=e.attr("height"),o.svgDefault.viewBox=e.attr("viewBox"),o.svgDefault.width&&o.svgDefault.height)o.svgDefault.width=parseFloat(o.svgDefault.width.replace(/px/g,"")),o.svgDefault.height=parseFloat(o.svgDefault.height.replace(/px/g,"")),o.svgDefault.viewBox=o.svgDefault.viewBox?o.svgDefault.viewBox.split(" "):[0,0,o.svgDefault.width,o.svgDefault.height];else{if(!o.svgDefault.viewBox)return alert("MapSVG needs width/height or viewBox parameter to be present in SVG file."),!1;o.svgDefault.viewBox=o.svgDefault.viewBox.split(" "),o.svgDefault.width=parseFloat(o.svgDefault.viewBox[2]),o.svgDefault.height=parseFloat(o.svgDefault.viewBox[3])}var r=e.attr("mapsvg:geoViewBox");if(r&&(r=r.split(" "),4==r.length)){o.mapIsGeo=!0,o.geoCoordinates=!0;var n=e.attr("mapsvg:calibratedViewBox");o.geoViewBox={leftLon:parseFloat(r[0]),topLat:parseFloat(r[1]),rightLon:parseFloat(r[2]),bottomLat:parseFloat(r[3])},o.mapLonDelta=o.geoViewBox.rightLon-o.geoViewBox.leftLon,o.mapLatBottomDegree=3.14159*o.geoViewBox.bottomLat/180}$.each(o.svgDefault.viewBox,function(t,e){o.svgDefault.viewBox[t]=parseInt(e)}),o._viewBox=4==o.options.viewBox.length&&o.options.viewBox||o.svgDefault.viewBox,$.each(o._viewBox,function(t,e){o._viewBox[t]=parseFloat(e)}),e.attr("preserveAspectRatio","xMidYMid meet"),e.attr("width","100%"),e.attr("height","100%"),o.$svg.find("path, polygon, circle, ellipse, rect").each(function(t){var e=new Region($(this),o.options,o.regionID,i);o.regions.push(e),o.regionsDict[e.id]=t,e.autoID&&(o.presentAutoID=!0)}),i.setSize(o.options.width,o.options.height,o.options.responsive),o.$map.append(e);var n=o._viewBox;i.setViewBox(n);var a=o.options.markers||o.options.marks||[];i.setMarkers(a),i.setScroll(o.options.scroll),i.setZoom(o.options.zoom),o.options.tooltipsMode&&(o.options.tooltips.mode=o.options.tooltipsMode),i.setTooltips(o.options.tooltips),o.options.popover&&(o.options.popovers=o.options.popover),i.setPopovers(o.options.popovers),o.options.cursor&&i.setCursor(o.options.cursor),_browser.ie&&i.mapAdjustStrokes(),i.setEventHandlers(),$("#"+o.$map.attr("id")+" [title]").each(function(){this.removeAttribute("title")}),$("#"+o.$map.attr("id")+" title").remove(),s.hide(),o.options.afterLoad&&o.options.afterLoad.call(i),i.updateSize()}}),i}};var i=this.methods},$.fn.mapSvg=function(t){var e=$(this).attr("id");return"object"==typeof t&&void 0===instances[e]?(instances[e]=new mapSVG(this,t),instances[e].methods.init(t,this)):instances[e]?instances[e].methods:instances}}(jQuery),function(t){function e(t,i){if(t=t?t:"",i=i||{},t instanceof e)return t;if(!(this instanceof e))return new e(t,i);var s=o(t);this._originalInput=t,this._r=s.r,this._g=s.g,this._b=s.b,this._a=s.a,this._roundA=j(100*this._a)/100,this._format=i.format||s.format,this._gradientType=i.gradientType,this._r<1&&(this._r=j(this._r)),this._g<1&&(this._g=j(this._g)),this._b<1&&(this._b=j(this._b)),this._ok=s.ok,this._tc_id=T++}function o(t){var e={r:0,g:0,b:0},o=1,s=!1,n=!1;return"string"==typeof t&&(t=F(t)),"object"==typeof t&&(H(t.r)&&H(t.g)&&H(t.b)?(e=i(t.r,t.g,t.b),s=!0,n="%"===String(t.r).substr(-1)?"prgb":"rgb"):H(t.h)&&H(t.s)&&H(t.v)?(t.s=M(t.s),t.v=M(t.v),e=a(t.h,t.s,t.v),s=!0,n="hsv"):H(t.h)&&H(t.s)&&H(t.l)&&(t.s=M(t.s),t.l=M(t.l),e=r(t.h,t.s,t.l),s=!0,n="hsl"),t.hasOwnProperty("a")&&(o=t.a)),o=B(o),{ok:s,format:t.format||n,r:I(255,G(e.r,0)),g:I(255,G(e.g,0)),b:I(255,G(e.b,0)),a:o}}function i(t,e,o){return{r:255*S(t,255),g:255*S(e,255),b:255*S(o,255)}}function s(t,e,o){t=S(t,255),e=S(e,255),o=S(o,255);var i,s,r=G(t,e,o),n=I(t,e,o),a=(r+n)/2;if(r==n)i=s=0;else{var l=r-n;switch(s=a>.5?l/(2-r-n):l/(r+n),r){case t:i=(e-o)/l+(o>e?6:0);break;case e:i=(o-t)/l+2;break;case o:i=(t-e)/l+4}i/=6}return{h:i,s:s,l:a}}function r(t,e,o){function i(t,e,o){return 0>o&&(o+=1),o>1&&(o-=1),1/6>o?t+6*(e-t)*o:.5>o?e:2/3>o?t+(e-t)*(2/3-o)*6:t}var s,r,n;if(t=S(t,360),e=S(e,100),o=S(o,100),0===e)s=r=n=o;else{var a=.5>o?o*(1+e):o+e-o*e,l=2*o-a;s=i(l,a,t+1/3),r=i(l,a,t),n=i(l,a,t-1/3)}return{r:255*s,g:255*r,b:255*n}}function n(t,e,o){t=S(t,255),e=S(e,255),o=S(o,255);var i,s,r=G(t,e,o),n=I(t,e,o),a=r,l=r-n;if(s=0===r?0:l/r,r==n)i=0;else{switch(r){case t:i=(e-o)/l+(o>e?6:0);break;case e:i=(o-t)/l+2;break;case o:i=(t-e)/l+4}i/=6}return{h:i,s:s,v:a}}function a(e,o,i){e=6*S(e,360),o=S(o,100),i=S(i,100);var s=t.floor(e),r=e-s,n=i*(1-o),a=i*(1-r*o),l=i*(1-(1-r)*o),c=s%6,u=[i,a,n,n,l,i][c],h=[l,i,i,a,n,n][c],p=[n,n,l,i,i,a][c];return{r:255*u,g:255*h,b:255*p}}function l(t,e,o,i){var s=[C(j(t).toString(16)),C(j(e).toString(16)),C(j(o).toString(16))];return i&&s[0].charAt(0)==s[0].charAt(1)&&s[1].charAt(0)==s[1].charAt(1)&&s[2].charAt(0)==s[2].charAt(1)?s[0].charAt(0)+s[1].charAt(0)+s[2].charAt(0):s.join("")}function c(t,e,o,i){var s=[C(O(i)),C(j(t).toString(16)),C(j(e).toString(16)),C(j(o).toString(16))];return s.join("")}function u(t,o){o=0===o?0:o||10;var i=e(t).toHsl();return i.s-=o/100,i.s=D(i.s),e(i)}function h(t,o){o=0===o?0:o||10;var i=e(t).toHsl();return i.s+=o/100,i.s=D(i.s),e(i)}function p(t){return e(t).desaturate(100)}function d(t,o){o=0===o?0:o||10;var i=e(t).toHsl();return i.l+=o/100,i.l=D(i.l),e(i)}function f(t,o){o=0===o?0:o||10;var i=e(t).toRgb();return i.r=G(0,I(255,i.r-j(255*-(o/100)))),i.g=G(0,I(255,i.g-j(255*-(o/100)))),i.b=G(0,I(255,i.b-j(255*-(o/100)))),e(i)}function g(t,o){o=0===o?0:o||10;var i=e(t).toHsl();return i.l-=o/100,i.l=D(i.l),e(i)}function v(t,o){var i=e(t).toHsl(),s=(i.h+o)%360;return i.h=0>s?360+s:s,e(i)}function m(t){var o=e(t).toHsl();return o.h=(o.h+180)%360,e(o)}function b(t){var o=e(t).toHsl(),i=o.h;return[e(t),e({h:(i+120)%360,s:o.s,l:o.l}),e({h:(i+240)%360,s:o.s,l:o.l})]}function w(t){var o=e(t).toHsl(),i=o.h;return[e(t),e({h:(i+90)%360,s:o.s,l:o.l}),e({h:(i+180)%360,s:o.s,l:o.l}),e({h:(i+270)%360,s:o.s,l:o.l})]}function x(t){var o=e(t).toHsl(),i=o.h;return[e(t),e({h:(i+72)%360,s:o.s,l:o.l}),e({h:(i+216)%360,s:o.s,l:o.l})]}function y(t,o,i){o=o||6,i=i||30;var s=e(t).toHsl(),r=360/i,n=[e(t)];for(s.h=(s.h-(r*o>>1)+720)%360;--o;)s.h=(s.h+r)%360,n.push(e(s));return n}function _(t,o){o=o||6;for(var i=e(t).toHsv(),s=i.h,r=i.s,n=i.v,a=[],l=1/o;o--;)a.push(e({h:s,s:r,v:n})),n=(n+l)%1;return a}function k(t){var e={};for(var o in t)t.hasOwnProperty(o)&&(e[t[o]]=o);return e}function B(t){return t=parseFloat(t),(isNaN(t)||0>t||t>1)&&(t=1),t}function S(e,o){A(e)&&(e="100%");var i=R(e);return e=I(o,G(0,parseFloat(e))),i&&(e=parseInt(e*o,10)/100),t.abs(e-o)<1e-6?1:e%o/parseFloat(o)}function D(t){return I(1,G(0,t))}function $(t){return parseInt(t,16)}function A(t){return"string"==typeof t&&-1!=t.indexOf(".")&&1===parseFloat(t)}function R(t){return"string"==typeof t&&-1!=t.indexOf("%")}function C(t){return 1==t.length?"0"+t:""+t}function M(t){return 1>=t&&(t=100*t+"%"),t}function O(e){return t.round(255*parseFloat(e)).toString(16)}function L(t){return $(t)/255}function H(t){return!!U.CSS_UNIT.exec(t)}function F(t){t=t.replace(E,"").replace(P,"").toLowerCase();var e=!1;if(N[t])t=N[t],e=!0;else if("transparent"==t)return{r:0,g:0,b:0,a:0,format:"name"};var o;return(o=U.rgb.exec(t))?{r:o[1],g:o[2],b:o[3]}:(o=U.rgba.exec(t))?{r:o[1],g:o[2],b:o[3],a:o[4]}:(o=U.hsl.exec(t))?{h:o[1],s:o[2],l:o[3]}:(o=U.hsla.exec(t))?{h:o[1],s:o[2],l:o[3],a:o[4]}:(o=U.hsv.exec(t))?{h:o[1],s:o[2],v:o[3]}:(o=U.hsva.exec(t))?{h:o[1],s:o[2],v:o[3],a:o[4]}:(o=U.hex8.exec(t))?{a:L(o[1]),r:$(o[2]),g:$(o[3]),b:$(o[4]),format:e?"name":"hex8"}:(o=U.hex6.exec(t))?{r:$(o[1]),g:$(o[2]),b:$(o[3]),format:e?"name":"hex"}:(o=U.hex3.exec(t))?{r:$(o[1]+""+o[1]),g:$(o[2]+""+o[2]),b:$(o[3]+""+o[3]),format:e?"name":"hex"}:!1}function z(t){var e,o;return t=t||{level:"AA",size:"small"},e=(t.level||"AA").toUpperCase(),o=(t.size||"small").toLowerCase(),"AA"!==e&&"AAA"!==e&&(e="AA"),"small"!==o&&"large"!==o&&(o="small"),{level:e,size:o}}var E=/^\s+/,P=/\s+$/,T=0,j=t.round,I=t.min,G=t.max,V=t.random;e.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var t=this.toRgb();return(299*t.r+587*t.g+114*t.b)/1e3},getLuminance:function(){var e,o,i,s,r,n,a=this.toRgb();return e=a.r/255,o=a.g/255,i=a.b/255,s=.03928>=e?e/12.92:t.pow((e+.055)/1.055,2.4),r=.03928>=o?o/12.92:t.pow((o+.055)/1.055,2.4),n=.03928>=i?i/12.92:t.pow((i+.055)/1.055,2.4),.2126*s+.7152*r+.0722*n},setAlpha:function(t){return this._a=B(t),this._roundA=j(100*this._a)/100,this},toHsv:function(){var t=n(this._r,this._g,this._b);return{h:360*t.h,s:t.s,v:t.v,a:this._a}},toHsvString:function(){var t=n(this._r,this._g,this._b),e=j(360*t.h),o=j(100*t.s),i=j(100*t.v);return 1==this._a?"hsv("+e+", "+o+"%, "+i+"%)":"hsva("+e+", "+o+"%, "+i+"%, "+this._roundA+")"},toHsl:function(){var t=s(this._r,this._g,this._b);return{h:360*t.h,s:t.s,l:t.l,a:this._a}},toHslString:function(){var t=s(this._r,this._g,this._b),e=j(360*t.h),o=j(100*t.s),i=j(100*t.l);return 1==this._a?"hsl("+e+", "+o+"%, "+i+"%)":"hsla("+e+", "+o+"%, "+i+"%, "+this._roundA+")"},toHex:function(t){return l(this._r,this._g,this._b,t)},toHexString:function(t){return"#"+this.toHex(t)},toHex8:function(){return c(this._r,this._g,this._b,this._a)},toHex8String:function(){return"#"+this.toHex8()},toRgb:function(){return{r:j(this._r),g:j(this._g),b:j(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+j(this._r)+", "+j(this._g)+", "+j(this._b)+")":"rgba("+j(this._r)+", "+j(this._g)+", "+j(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:j(100*S(this._r,255))+"%",g:j(100*S(this._g,255))+"%",b:j(100*S(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+j(100*S(this._r,255))+"%, "+j(100*S(this._g,255))+"%, "+j(100*S(this._b,255))+"%)":"rgba("+j(100*S(this._r,255))+"%, "+j(100*S(this._g,255))+"%, "+j(100*S(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":this._a<1?!1:Z[l(this._r,this._g,this._b,!0)]||!1},toFilter:function(t){var o="#"+c(this._r,this._g,this._b,this._a),i=o,s=this._gradientType?"GradientType = 1, ":"";if(t){var r=e(t);i=r.toHex8String()}return"progid:DXImageTransform.Microsoft.gradient("+s+"startColorstr="+o+",endColorstr="+i+")"},toString:function(t){var e=!!t;t=t||this._format;var o=!1,i=this._a<1&&this._a>=0,s=!e&&i&&("hex"===t||"hex6"===t||"hex3"===t||"name"===t);return s?"name"===t&&0===this._a?this.toName():this.toRgbString():("rgb"===t&&(o=this.toRgbString()),"prgb"===t&&(o=this.toPercentageRgbString()),("hex"===t||"hex6"===t)&&(o=this.toHexString()),"hex3"===t&&(o=this.toHexString(!0)),"hex8"===t&&(o=this.toHex8String()),"name"===t&&(o=this.toName()),"hsl"===t&&(o=this.toHslString()),"hsv"===t&&(o=this.toHsvString()),o||this.toHexString())},clone:function(){return e(this.toString())},_applyModification:function(t,e){var o=t.apply(null,[this].concat([].slice.call(e)));return this._r=o._r,this._g=o._g,this._b=o._b,this.setAlpha(o._a),this},lighten:function(){return this._applyModification(d,arguments)},brighten:function(){return this._applyModification(f,arguments)},darken:function(){return this._applyModification(g,arguments)},desaturate:function(){return this._applyModification(u,arguments)},saturate:function(){return this._applyModification(h,arguments)},greyscale:function(){return this._applyModification(p,arguments)},spin:function(){return this._applyModification(v,arguments)},_applyCombination:function(t,e){return t.apply(null,[this].concat([].slice.call(e)))},analogous:function(){return this._applyCombination(y,arguments)},complement:function(){return this._applyCombination(m,arguments)},monochromatic:function(){return this._applyCombination(_,arguments)},splitcomplement:function(){return this._applyCombination(x,arguments)},triad:function(){return this._applyCombination(b,arguments)},tetrad:function(){return this._applyCombination(w,arguments)}},e.fromRatio=function(t,o){if("object"==typeof t){var i={};for(var s in t)t.hasOwnProperty(s)&&("a"===s?i[s]=t[s]:i[s]=M(t[s]));t=i}return e(t,o)},e.equals=function(t,o){return t&&o?e(t).toRgbString()==e(o).toRgbString():!1},e.random=function(){return e.fromRatio({r:V(),g:V(),b:V()})},e.mix=function(t,o,i){i=0===i?0:i||50;var s,r=e(t).toRgb(),n=e(o).toRgb(),a=i/100,l=2*a-1,c=n.a-r.a;s=l*c==-1?l:(l+c)/(1+l*c),s=(s+1)/2;var u=1-s,h={r:n.r*s+r.r*u,g:n.g*s+r.g*u,b:n.b*s+r.b*u,a:n.a*a+r.a*(1-a)};return e(h)},e.readability=function(o,i){var s=e(o),r=e(i);return(t.max(s.getLuminance(),r.getLuminance())+.05)/(t.min(s.getLuminance(),r.getLuminance())+.05)},e.isReadable=function(t,o,i){var s,r,n=e.readability(t,o);switch(r=!1,s=z(i),s.level+s.size){case"AAsmall":case"AAAlarge":r=n>=4.5;break;case"AAlarge":r=n>=3;break;case"AAAsmall":r=n>=7}return r},e.mostReadable=function(t,o,i){var s,r,n,a,l=null,c=0;i=i||{},r=i.includeFallbackColors,n=i.level,a=i.size;for(var u=0;u<o.length;u++)s=e.readability(t,o[u]),s>c&&(c=s,l=e(o[u]));return e.isReadable(t,l,{level:n,size:a})||!r?l:(i.includeFallbackColors=!1,e.mostReadable(t,["#fff","#000"],i))};var N=e.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},Z=e.hexNames=k(N),U=function(){var t="[-\\+]?\\d+%?",e="[-\\+]?\\d*\\.\\d+%?",o="(?:"+e+")|(?:"+t+")",i="[\\s|\\(]+("+o+")[,|\\s]+("+o+")[,|\\s]+("+o+")\\s*\\)?",s="[\\s|\\(]+("+o+")[,|\\s]+("+o+")[,|\\s]+("+o+")[,|\\s]+("+o+")\\s*\\)?";return{CSS_UNIT:new RegExp(o),rgb:new RegExp("rgb"+i),rgba:new RegExp("rgba"+s),hsl:new RegExp("hsl"+i),hsla:new RegExp("hsla"+s),hsv:new RegExp("hsv"+i),hsva:new RegExp("hsva"+s),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/}}();"undefined"!=typeof module&&module.exports?module.exports=e:"function"==typeof define&&define.amd?define(function(){return e}):window.tinycolor=e}(Math);
;

var wc_add_to_cart_params = {"ajax_url":"/wp-admin/admin-ajax.php","wc_ajax_url":"/?blocksy-header-id=type-1&wc-ajax=%%endpoint%%","i18n_view_cart":"\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u043a\u043e\u0440\u0437\u0438\u043d\u044b","cart_url":"https://welans.ru","is_cart":"","cart_redirect_after_add":"no"};
//# sourceURL=wc-add-to-cart-js-extra

;

var woocommerce_params = {"ajax_url":"/wp-admin/admin-ajax.php","wc_ajax_url":"/?blocksy-header-id=type-1&wc-ajax=%%endpoint%%","i18n_password_show":"\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c","i18n_password_hide":"\u0421\u043a\u0440\u044b\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c"};
//# sourceURL=woocommerce-js-extra

;

var Rcl = {"ajaxurl":"https://welans.ru/wp-admin/admin-ajax.php","wpurl":"https://welans.ru","rcl_url":"https://welans.ru/wp-content/plugins/wp-recall/","user_ID":"0","nonce":"becfad9be0","local":{"save":"\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c","close":"\u0417\u0430\u043a\u0440\u044b\u0442\u044c","wait":"\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435","preview":"\u041f\u0440\u0435\u0434\u043f\u0440\u043e\u0441\u043c\u043e\u0442\u0440","error":"\u041e\u0448\u0438\u0431\u043a\u0430","loading":"\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430","upload":"\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c","cancel":"\u041e\u0442\u043c\u0435\u043d\u0430","no_repeat_pass":"\u041f\u043e\u0432\u0442\u043e\u0440 \u043f\u0430\u0440\u043e\u043b\u044f \u043d\u0435 \u0432\u0435\u0440\u043d\u044b\u0439!","publish":"\u041f\u0443\u0431\u043b\u0438\u043a\u043e\u0432\u0430\u0442\u044c","save_draft":"\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043a\u0430\u043a \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a","edit":"\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c","edit_box_title":"\u0411\u044b\u0441\u0442\u0440\u043e\u0435 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435","allowed_downloads":"\u041f\u0440\u0435\u0432\u044b\u0448\u0435\u043d\u043e \u043c\u0430\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u043e\u0435 \u043a\u043e\u043b-\u0432\u043e \u0444\u0430\u0439\u043b\u043e\u0432 \u0434\u043b\u044f \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0438! \u041c\u0430\u043a\u0441:","upload_size_public":"\u041f\u0440\u0435\u0432\u044b\u0448\u0435\u043d \u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440 \u0444\u0430\u0439\u043b\u0430! \u041c\u0430\u043a\u0441:"},"mobile":"0","https":"1","errors":{"required":"\u0417\u0430\u043f\u043e\u043b\u043d\u0438\u0442\u0435 \u0432\u0441\u0435 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u043f\u043e\u043b\u044f","pattern":"\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0434\u0430\u043d\u043d\u044b\u0435 \u0432 \u0442\u0440\u0435\u0431\u0443\u0435\u043c\u043e\u043c \u0444\u043e\u0440\u043c\u0430\u0442\u0435","number_range":"\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0447\u0438\u0441\u043b\u043e \u0432 \u043f\u0440\u0435\u0434\u0435\u043b\u0430\u0445 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u043d\u043e\u0433\u043e \u0434\u0438\u0430\u043f\u0430\u0437\u043e\u043d\u0430","file_max_size":"\u0420\u0430\u0437\u043c\u0435\u0440 \u0444\u0430\u0439\u043b\u0430 \u043f\u0440\u0435\u0432\u044b\u0448\u0435\u043d","file_min_size":"\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440 \u0438\u0437\u043e\u0431\u0440\u0430\u0436\u0435\u043d\u0438\u044f","file_max_num":"\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0444\u0430\u0439\u043b\u043e\u0432 \u043f\u0440\u0435\u0432\u044b\u0448\u0435\u043d\u043e","file_accept":"\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0442\u0438\u043f \u0444\u0430\u0439\u043b\u0430","cats_important":"\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044e"},"account":{"currency":"\u003Ci class=\"rcli fa-rub\"\u003E\u003C/i\u003E"},"post_ID":"723","office_ID":"0"};
//# sourceURL=rcl-core-scripts-js-extra

;
var rcl_actions = [];
var rcl_filters = [];
var rcl_beats = [];
var rcl_beats_delay = 0;
var rcl_url_params = rcl_get_value_url_params();

jQuery(document).ready(function ($) {

    rcl_init_update_requared_checkbox();

    $.fn.extend({
        insertAtCaret: function (myValue) {
            return this.each(function (i) {
                if (document.selection) {
                    // Для браузеров типа Internet Explorer
                    this.focus();
                    var sel = document.selection.createRange();
                    sel.text = myValue;
                    this.focus();
                } else if (this.selectionStart || this.selectionStart == '0') {
                    // Для браузеров типа Firefox и других Webkit-ов
                    var startPos = this.selectionStart;
                    var endPos = this.selectionEnd;
                    var scrollTop = this.scrollTop;
                    this.value = this.value.substring(0, startPos) + myValue + this.value.substring(endPos, this.value.length);
                    this.focus();
                    this.selectionStart = startPos + myValue.length;
                    this.selectionEnd = startPos + myValue.length;
                    this.scrollTop = scrollTop;
                } else {
                    this.value += myValue;
                    this.focus();
                }
            })
        },
        animateCss: function (animationNameStart, functionEnd) {
            var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
            this.addClass('animated ' + animationNameStart).one(animationEnd, function () {
                jQuery(this).removeClass('animated ' + animationNameStart);

                if (functionEnd) {
                    if (typeof functionEnd == 'function') {
                        functionEnd(this);
                    } else {
                        jQuery(this).animateCss(functionEnd);
                    }
                }
            });
            return this;
        }
    });

});

function rcl_do_action(action_name) {

    var callbacks_action = rcl_actions[action_name];

    if (!callbacks_action)
        return false;

    var args = [].slice.call(arguments, 1);

    callbacks_action.forEach(function (callback, i, callbacks_action) {
        if (window[callback])
            window[callback].apply(this, args);
        if (typeof callback === 'function')
            callback.apply(this, args);
    });
}

function rcl_add_action(action_name, callback) {
    if (!rcl_actions[action_name]) {
        rcl_actions[action_name] = [callback];
    } else {
        var i = rcl_actions[action_name].length;
        rcl_actions[action_name][i] = callback;
    }
}

function rcl_apply_filters(filter_name) {

    var args = [].slice.call(arguments, 1);

    var callbacks_filter = rcl_filters[filter_name];

    if (!callbacks_filter)
        return args[0];

    callbacks_filter.forEach(function (callback, i, callbacks_filter) {
        args[0] = window[callback].apply(this, args);
    });

    return args[0];
}

function rcl_add_filter(filter_name, callback) {
    if (!rcl_filters[filter_name]) {
        rcl_filters[filter_name] = [callback];
    } else {
        var i = rcl_filters[filter_name].length;
        rcl_filters[filter_name][i] = callback;
    }
}

function rcl_get_value_url_params() {
    var tmp_1 = new Array();
    var tmp_2 = new Array();
    var rcl_url_params = new Array();
    var get = location.search;
    if (get !== '') {
        tmp_1 = (get.substr(1)).split('&');
        for (var i = 0; i < tmp_1.length; i++) {
            tmp_2 = tmp_1[i].split('=');
            rcl_url_params[tmp_2[0]] = tmp_2[1];
        }
    }

    return rcl_url_params;
}

function rcl_is_valid_url(url) {
    var objRE = /http(s?):\/\/[-\w\.]{3,}\.[A-Za-z]{2,3}/;
    return objRE.test(url);
}

function setAttr_rcl(prmName, val) {
    var res = '';
    var d = location.href.split("#")[0].split("?");
    var base = d[0];
    var query = d[1];
    if (query) {
        var params = query.split("&");
        for (var i = 0; i < params.length; i++) {
            var keyval = params[i].split("=");
            if (keyval[0] !== prmName) {
                res += params[i] + '&';
            }
        }
    }
    res += prmName + '=' + val;
    return base + '?' + res;
}

function rcl_update_history_url(url) {

    if (url != window.location) {
        if (history.pushState) {
            window.history.pushState(null, null, url);
        }
    }

}

function rcl_init_cookie() {

    jQuery.cookie = function (name, value, options) {
        if (typeof value !== 'undefined') {
            options = options || {};
            if (value === null) {
                value = '';
                options.expires = -1;
            }
            var expires = '';
            if (options.expires && (typeof options.expires === 'number' || options.expires.toUTCString)) {
                var date;
                if (typeof options.expires === 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                } else {
                    date = options.expires;
                }
                expires = '; expires=' + date.toUTCString();
            }
            var path = options.path ? '; path=' + (options.path) : '';
            var domain = options.domain ? '; domain=' + (options.domain) : '';
            var secure = options.secure ? '; secure' : '';
            document.cookie = [name, '=', encodeURIComponent(value),
                expires, path,
                domain, secure].join('');
        } else {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    };

}

function rcl_add_dynamic_field(e) {
    var parent = jQuery(e).parents('.dynamic-value');
    var box = parent.parent('.dynamic-values');
    var html = parent.html();
    box.append('<span class="dynamic-value">' + html + '</span>');
    jQuery(e).attr('onclick', 'rcl_remove_dynamic_field(this);return false;').children('i').toggleClass("fa-plus fa-minus");
    box.children('span').last().children('input').val('').focus();
}

function rcl_remove_dynamic_field(e) {
    jQuery(e).parents('.dynamic-value').remove();
}

function rcl_rand(min, max) {
    if (max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    } else {
        return Math.floor(Math.random() * (min + 1));
    }
}

function rcl_notice(text, type, time_close) {

    time_close = time_close || false;

    var options = {
        text: text,
        type: type,
        time_close: time_close
    };

    options = rcl_apply_filters('rcl_notice_options', options);

    var notice_id = rcl_rand(1, 1000);

    var html = '<div id="notice-' + notice_id + '" class="notice-window type-' + options.type + '"><a href="#" class="close-notice"><i class="rcli fa-times"></i></a>' + options.text + '</div>';
    if (!jQuery('#rcl-notice').length) {
        jQuery('body > div').last().after('<div id="rcl-notice">' + html + '</div>');
    } else {
        if (jQuery('#rcl-notice > div').length)
            jQuery('#rcl-notice > div:last-child').after(html);
        else
            jQuery('#rcl-notice').html(html);
    }

    if (typeof animateCss !== 'undefined') {
        jQuery('#rcl-notice > div').last().animateCss('slideInLeft');
    }

    if (time_close) {
        setTimeout(function () {
            rcl_close_notice('#rcl-notice #notice-' + notice_id)
        }, options.time_close);
    }
}

function rcl_close_notice(e) {

    var timeCook = jQuery(e).data('notice_time');

    if (timeCook) {

        var idCook = jQuery(e).data('notice_id');
        var block = jQuery(e).parents('.rcl-notice');

        if (typeof animateCss !== 'undefined') {
            jQuery(block).animateCss('flipOutX', function () {
                jQuery(block).remove();
            });
        } else {
            jQuery(block).remove();
        }

        jQuery.cookie(idCook, '1', {
            expires: timeCook,
            path: '/'
        });

    } else {

        if (typeof animateCss !== 'undefined') {
            jQuery(e).animateCss('flipOutX', function (e) {
                jQuery(e).hide();
            });
        } else {
            jQuery(e).hide();
        }

    }

    return false;
}

function rcl_preloader_show(e, size) {

    var font_size = (size) ? size : 80;
    var margin = font_size / 2;

    var options = {
        size: font_size,
        margin: margin,
        icon: 'fa-circle-o-notch',
        class: 'rcl_preloader'
    };

    options = rcl_apply_filters('rcl_preloader_options', options);

    var style = 'style="font-size:' + options.size + 'px;margin: -' + options.margin + 'px 0 0 -' + options.margin + 'px;"';

    var html = '<div class="' + options.class + '"><i class="rcli ' + options.icon + ' fa-spin" ' + style + '></i></div>';

    if (typeof (e) === 'string')
        jQuery(e).after(html);
    else
        e.append(html);
}

function rcl_preloader_hide() {
    jQuery('.rcl_preloader').remove();
}

function rcl_setup_datepicker_options() {

    jQuery.datepicker.setDefaults(jQuery.extend(jQuery.datepicker.regional["ru"]));

    var options = {
        monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль",
            "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
        dayNamesMin: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        firstDay: 1,
        dateFormat: 'yy-mm-dd',
        yearRange: "1950:c+3",
        changeYear: true
    };

    options = rcl_apply_filters('rcl_datepicker_options', options);

    return options;

}

function rcl_show_datepicker(e) {
    jQuery(e).datepicker(rcl_setup_datepicker_options());
    jQuery(e).datepicker("show");
    rcl_add_action('rcl_upload_tab', 'rcl_remove_datepicker_box');
}

function rcl_remove_datepicker_box() {
    jQuery('#ui-datepicker-div').remove();
}

function rcl_init_field_file(field_id) {
    jQuery("#" + field_id).parents('form').attr("enctype", "multipart/form-data");
}

function rcl_init_runner(props) {

    var box = jQuery('#rcl-runner-' + props.id);

    box.children('.rcl-runner-box').slider({
        value: parseInt(props.value),
        min: parseInt(props.min),
        max: parseInt(props.max),
        step: parseInt(props.step),
        create: function (event, ui) {
            var value = box.children('.rcl-runner-box').slider('value');
            box.children('.rcl-runner-value').text(value);
            box.children('.rcl-runner-field').val(value);
        },
        slide: function (event, ui) {
            box.find('.rcl-runner-value').text(ui.value);
            box.find('.rcl-runner-field').val(ui.value);
        }
    });
}

function rcl_init_range(props) {

    var box = jQuery('#rcl-range-' + props.id);

    box.children('.rcl-range-box').slider({
        range: true,
        values: [parseInt(props.values[0]), parseInt(props.values[1])],
        min: parseInt(props.min),
        max: parseInt(props.max),
        step: parseInt(props.step),
        create: function (event, ui) {
            var values = box.children('.rcl-range-box').slider('values');
            box.children('.rcl-range-value').text(values[0] + ' - ' + values[1]);
            box.children('.rcl-range-min').val(values[0]);
            box.children('.rcl-range-max').val(values[1]);
        },
        slide: function (event, ui) {
            box.children('.rcl-range-value').text(ui.values[0] + ' - ' + ui.values[1]);
            box.find('.rcl-range-min').val(ui.values[0]);
            box.find('.rcl-range-max').val(ui.values[1]);
        }
    });
}

function rcl_init_color(id, props) {
    jQuery("#" + id).wpColorPicker(props);
}

function rcl_init_field_maxlength(fieldID) {

    var field = jQuery('#' + fieldID);
    var maxlength = field.attr('maxlength');

    if (!field.parent().find('.maxlength').length) {

        if (field.val()) {
            maxlength = maxlength - field.val().length;
        }

        field.after('<span class="maxlength">' + maxlength + '</span>');
    }

    field.on('keyup', function () {
        var maxlength = jQuery(this).attr('maxlength');
        if (!maxlength)
            return false;
        var word = jQuery(this);
        var count = maxlength - word.val().length;
        jQuery(this).next().text(count);
        if (word.val().length > maxlength)
            word.val(word.val().substr(0, maxlength));
    });
}

function rcl_init_ajax_editor(id, options) {

    if (typeof QTags === 'undefined')
        return false;

    rcl_do_action('rcl_pre_init_ajax_editor', {
        id: id,
        options: options
    });

    var qt_options = {
        id: id,
        buttons: (options.qt_buttons) ? options.qt_buttons : "strong,em,link,block,del,ins,img,ul,ol,li,code,more,close"
    };

    QTags(qt_options);

    QTags._buttonsInit();

    if (options.tinymce && typeof tinyMCEPreInit != 'undefined') {

        tinyMCEPreInit.qtInit[id] = qt_options;

        tinyMCEPreInit.mceInit[id] = {
            body_class: id,
            selector: '#' + id,
            menubar: false,
            skin: "lightgray",
            theme: 'modern',
            toolbar1: "formatselect,bold,italic,bullist,numlist,blockquote,alignleft,aligncenter,alignright,link,unlink,wp_more,spellchecker,fullscreen,wp_adv",
            toolbar2: "strikethrough,hr,forecolor,pastetext,removeformat,charmap,outdent,indent,undo,redo,wp_help",
            wpautop: true
        };

        tinymce.init(tinyMCEPreInit.mceInit[id]);
        tinyMCE.execCommand('mceAddEditor', true, id);

        switchEditors.go(id, 'html');
    }

}

function rcl_setup_quicktags(newTags) {

    if (typeof QTags === 'undefined')
        return false;

    newTags.forEach(function (tagArray, i, newTags) {

        QTags.addButton(
            tagArray[0],
            tagArray[1],
            tagArray[2],
            tagArray[3],
            tagArray[4],
            tagArray[5],
            tagArray[6]
        );

    });

}

rcl_add_action('rcl_pre_init_ajax_editor', 'rcl_add_ajax_quicktags');

function rcl_add_ajax_quicktags(editor) {

    if (typeof Rcl === 'undefined' || !Rcl.QTags)
        return false;

    rcl_setup_quicktags(Rcl.QTags);

}

rcl_add_action('rcl_footer', 'rcl_add_quicktags');

function rcl_add_quicktags() {

    if (typeof Rcl === 'undefined' || !Rcl.QTags)
        return false;

    rcl_setup_quicktags(Rcl.QTags);

}

function rcl_proccess_ajax_return(result) {

    var methods = {
        redirect: function (url) {

            var urlData = url.split('#');

            if (window.location.origin + window.location.pathname === urlData[0]) {
                location.reload();
            } else {
                location.replace(url);
            }

        },
        reload: function () {
            location.reload();
        },
        current_url: function (url) {
            rcl_update_history_url(url);
        },
        dialog: function (dialog) {

            if (dialog.content) {

                if (jQuery('#ssi-modalContent').length)
                    ssi_modal.close();

                var ssiOptions = {
                    className: 'rcl-dialog-tab ' + (dialog.class ? ' ' + dialog.class : ''),
                    sizeClass: dialog.size ? dialog.size : 'auto',
                    content: dialog.content,
                    buttons: []
                };

                if (dialog.buttons) {
                    ssiOptions.buttons = dialog.buttons;
                }

                var buttonClose = true;

                if ('buttonClose' in dialog) {
                    buttonClose = dialog.buttonClose;
                }

                if (buttonClose) {

                    ssiOptions.buttons.push({
                        label: Rcl.local.close,
                        closeAfter: true
                    });

                }

                if ('onClose' in dialog) {
                    ssiOptions.onClose = function (m) {
                        window[dialog.onClose[0]].apply(this, dialog.onClose[1]);
                    };
                }

                if (dialog.title)
                    ssiOptions.title = dialog.title;

                ssi_modal.show(ssiOptions);

            }

            if (dialog.close) {
                ssi_modal.close();
            }

        }
    };

    for (var method in result) {
        if (methods[method]) {
            methods[method](result[method]);
        }
    }

}

function rcl_ajax(prop) {

    if (prop.data.ask) {
        if (!confirm(prop.data.ask)) {
            rcl_preloader_hide();
            return false;
        }
    }

    if (typeof Rcl != 'undefined') {
        if (typeof prop.data === 'string') {
            prop.data += '&ajax_nonce=' + Rcl.nonce;
        } else if (typeof prop.data === 'object') {
            prop.data.ajax_nonce = Rcl.nonce;
        }
    }

    var action = false;
    if (typeof prop.data === 'string') {
        var propData = prop.data.split('&');
        var propObj = {};
        for (var key in propData) {
            propObj[propData[key].split("=")[0]] = propData[key].split("=")[1];
        }
        action = propObj.action;
    } else if (typeof prop.data === 'object') {
        action = prop.data.action;
    }

    if (typeof tinyMCE != 'undefined')
        tinyMCE.triggerSave();

    jQuery.ajax({
        type: 'POST',
        data: prop.data,
        dataType: 'json',
        url: (typeof ajaxurl !== 'undefined') ? ajaxurl : Rcl.ajaxurl,
        success: function (result, post) {

            var noticeTime = result.notice_time ? result.notice_time : 5000;

            if (!result) {
                rcl_notice(Rcl.local.error, 'error', noticeTime);
                return false;
            }

            if (result.error || result.errors) {

                rcl_preloader_hide();

                if (result.errors) {
                    jQuery.each(result.errors, function (index, error) {
                        rcl_notice(error, 'error', noticeTime);
                    });
                } else {
                    rcl_notice(result.error, 'error', noticeTime);
                }

                if (prop.error)
                    prop.error(result);

                return false;

            }

            if (!result.preloader_live) {
                rcl_preloader_hide();
            }

            if (result.success) {
                rcl_notice(result.success, 'success', noticeTime);
            }

            if (result.warning) {
                rcl_notice(result.warning, 'warning', noticeTime);
            }

            rcl_do_action('rcl_ajax_success', result);

            if (prop.success) {

                prop.success(result);

            } else {

                rcl_proccess_ajax_return(result);

            }

            rcl_do_action(action, result);

        }
    });

}


function rcl_submit_form(e) {

    var form = jQuery(e).parents('form');

    if (rcl_check_form(form))
        form.submit();

}

function rcl_send_form_data(action, e) {

    var form = jQuery(e).parents('form');

    if (!rcl_check_form(form))
        return false;

    if (e && jQuery(e).parents('.preloader-parent')) {
        rcl_preloader_show(jQuery(e).parents('.preloader-parent'));
    }

    if (typeof tinyMCE !== 'undefined')
        tinyMCE.triggerSave();

    rcl_ajax({
        data: form.serialize() + '&action=' + action
    });

}

function rcl_check_form(form) {

    var rclFormFactory = new RclForm(form);

    return rclFormFactory.validate();

}

function rcl_add_beat(beat_name, delay, data) {

    delay = (delay < 10) ? 10 : delay;

    var data = (data) ? data : false;

    var i = rcl_beats.length;

    rcl_beats[i] = {
        beat_name: beat_name,
        delay: delay,
        data: data
    };

}

function rcl_remove_beat(beat_name) {

    if (!rcl_beats)
        return false;

    var remove = false;
    var all_beats = rcl_beats;

    all_beats.forEach(function (beat, index, all_beats) {
        if (beat.beat_name != beat_name)
            return;
        delete rcl_beats[index];
        remove = true;
    });

    return remove;

}

function rcl_exist_beat(beat_name) {

    if (!rcl_beats)
        return false;

    var exist = false;

    rcl_beats.forEach(function (beat, index, rcl_beats) {
        if (beat.beat_name != beat_name)
            return;
        exist = true;
    });

    return exist;

}

function rcl_init_table(table_id) {

    jQuery('#' + table_id).on('click', '.rcl-table__cell-must-sort', function () {

        jQuery('#' + table_id).find('.rcl-table__cell-must-sort, .rcl-table__cell-sort').removeClass('rcl-table__cell-current-sort');

        var sortCell = jQuery(this);

        var sortby = sortCell.data('sort');
        var route = sortCell.attr('data-route');

        sortCell.addClass('rcl-table__cell-current-sort');
        jQuery('#' + table_id).find('[data-' + sortby + '-value]').addClass('rcl-table__cell-current-sort');

        var list = jQuery('#' + table_id + ' .rcl-table__row-must-sort');

        list.sort(function (a, b) {
            var aVal = jQuery(a).find('[data-' + sortby + '-value]').data(sortby + '-value');
            var bVal = jQuery(b).find('[data-' + sortby + '-value]').data(sortby + '-value');

            if (route == 'desc') {
                return (aVal < bVal) - (aVal > bVal); //по возрастанию
            } else {
                return (aVal > bVal) - (aVal < bVal); //по убыванию
            }
        });

        sortCell.attr('data-route', (route == 'desc' ? 'asc' : 'desc'));

        jQuery('#' + table_id + ' .rcl-table__row-must-sort').remove();

        list.each(function (i, e) {
            jQuery('#' + table_id + ' .rcl-table__row-header').after(jQuery(this));
        });

    });

}

function rcl_table_search(e, key, submit) {

    if (submit) {

        if (typeof submit == 'string') {

            return window[submit].call(this, e, key, submit);

        } else if (key == 'Enter') {
            jQuery(e).parents('form').submit();
        }

        return;

    }

    var table_id = jQuery(e).parents('.rcl-table').attr('id');

    var inputs = jQuery(e).parents('.rcl-table').find('.rcl-table__row-search input');

    var search = [];
    inputs.each(function (i, a) {

        if (jQuery(a).val() !== '') {
            search.push([jQuery(a).parent().data('rcl-ttitle'),
                jQuery(a).val()]);
        }

    });

    jQuery('#' + table_id + ' .rcl-table__row-must-sort').show();

    if (!search.length) {
        return;
    }

    var list = jQuery('#' + table_id + ' .rcl-table__row-must-sort');

    list.each(function (i, r) {

        var success = true;

        var cells = jQuery(r).find('.rcl-table__cell');

        cells.each(function (x, c) {

            search.forEach(function (s) {

                if (jQuery(c).data('rcl-ttitle') == s[0]) {

                    var value = jQuery(c).data('value');

                    if (typeof value == 'number' && jQuery(c).data('value') != s[1] ||
                        typeof value == 'string' && value.indexOf(s[1]) < 0) {
                        success = false;
                        return;
                    }

                }

            });

            if (!success) {
                return;
            }

        });

        if (!success) {
            jQuery(r).hide();
        }

    });
}

function RclForm(form) {

    this.form = form;
    this.errors = {};

    this.validate = function () {

        var valid = true;

        for (var objKey in this.checkForm) {

            var chekObject = this.checkForm[objKey];

            if (!chekObject.isValid.call(this)) {

                valid = false;

                break;

            }

        }
        ;

        if (this.errors) {
            for (var k in this.errors) {
                this.showError(this.errors[k]);
            }
            ;
        }

        return valid;

    };

    this.addChekForm = function (id, data) {
        this.checkForm[id] = data;
    };

    this.addChekFields = function (id, data) {
        this.checkFields[id] = data;
    };

    this.addError = function (id, error) {
        this.errors[id] = error;
    };

    this.shake = function (shakeBox) {
        shakeBox.css('box-shadow', 'red 0px 0px 5px 1px inset').animateCss('shake');
    };

    this.noShake = function (shakeBox) {
        shakeBox.css('box-shadow', 'none');
    };

    this.showError = function (error) {
        rcl_notice(error, 'error', 10000);
    };

    this.checkForm = {
        checkFields: {
            isValid: function () {

                var valid = true;
                var parent = this;

                this.form.find('input,select,textarea').each(function () {

                    var field = jQuery(this);
                    var typeField = field.attr('type');

                    if (field.is('textarea')) {
                        typeField = 'textarea';
                    }

                    var checkFields = rcl_apply_filters('rcl_form_check_rules', parent.checkFields, parent);

                    for (var objKey in checkFields) {

                        var chekObject = checkFields[objKey];

                        if (chekObject.types.length && jQuery.inArray(typeField, chekObject.types) < 0) {
                            continue;
                        }

                        var shakeBox = jQuery.inArray(typeField, ['radio',
                            'checkbox']) < 0 ? field : field.next('label');

                        if (!chekObject.isValid(field)) {

                            parent.shake(shakeBox);
                            parent.addError(objKey, chekObject.errorText());
                            valid = false;
                            return;

                        } else {
                            parent.noShake(shakeBox);
                        }

                    }
                    ;

                });

                return valid;

            }

        }

    };

    this.checkFields = {
        required: {
            types: [],
            isValid: function (field) {

                var required = true;

                if (!field.prop("required"))
                    return required;

                if (field.prop("disabled"))
                    return required;

                var value = false;

                if (field.attr('type') == 'checkbox') {
                    if (jQuery('input[name="' + field.attr('name') + '"]:checked').val())
                        value = true;
                } else if (field.attr('type') == 'radio') {
                    if (jQuery('input[name="' + field.attr('name') + '"]:checked').val())
                        value = true;
                } else {
                    if (field.val())
                        value = true;
                }

                if (!value) {
                    required = false;
                }

                return required;

            },
            errorText: function () {
                return Rcl.errors.required;
            }


        },
        numberRange: {
            types: ['number'],
            isValid: function (field) {
                var range = true;

                var val = field.val();

                if (val === '')
                    return true;

                val = parseInt(val);
                var min = parseInt(field.attr('min'));
                var max = parseInt(field.attr('max'));

                if (min != 'undefined' && min > val || max != 'undefined' && max < val) {
                    range = false;
                }

                return range;
            },
            errorText: function () {
                return Rcl.errors.number_range;
            }

        },
        pattern: {
            types: ['text', 'tel'],
            isValid: function (field) {

                var val = field.val();

                if (!val)
                    return true;

                var pattern = field.attr('pattern');

                if (!pattern)
                    return true;

                var re = new RegExp(pattern);

                return re.test(val);
            },
            errorText: function () {
                return Rcl.errors.pattern;
            }

        },
        fileMaxSize: {
            types: ['file'],
            isValid: function (field) {

                var valid = true;

                field.each(function () {

                    var maxsize = jQuery(this).data("size");
                    var fileInput = jQuery(this)[0];
                    var file = fileInput.files[0];

                    if (!file)
                        return;

                    var filesize = file.size / 1024 / 1024;

                    if (filesize > maxsize) {
                        valid = false;
                        return;
                    }

                });

                return valid;
            },
            errorText: function () {
                return Rcl.errors.file_max_size;
            }

        },
        fileAccept: {
            types: ['file'],
            isValid: function (field) {

                var valid = true;

                field.each(function () {

                    var fileInput = jQuery(this)[0];
                    var file = fileInput.files[0];
                    var accept = fileInput.accept.split(',');

                    if (!file)
                        return;

                    if (accept) {

                        var fileType = false;

                        if (file.type) {

                            for (var i in accept) {
                                if (accept[i] == file.type) {
                                    fileType = true;
                                    return;
                                }
                            }

                        }

                        var exts = jQuery(this).data("ext");

                        if (!exts)
                            return;

                        if (!fileType) {

                            var exts = exts.split(',');
                            var filename = file.name;

                            for (var i in exts) {
                                if (filename.indexOf('.' + exts[i]) + 1) {
                                    fileType = true;
                                    return;
                                }
                            }

                        }

                        if (!fileType) {
                            valid = false;
                            return;
                        }

                    }

                });

                return valid;
            },
            errorText: function () {
                return Rcl.errors.file_accept;
            }

        }
    };

    this.send = function (action, success) {

        if (!this.validate())
            return false;

        rcl_preloader_show(form);

        var sendData = {
            data: form.serialize() + '&action=' + action
        };

        if (success) {
            sendData.success = success;
        }

        rcl_ajax(sendData);

    };

}

function rcl_chek_form_field(e) {

    var field = jQuery(e);

    var rclFormFactory = new RclForm(field.parents('form'));

    var result = rclFormFactory.validate({
        check_fields: [field.data('slug')]
    });

    return result;

}

function rcl_init_iconpicker() {
    jQuery('.rcl-iconpicker').iconpicker();
}

/** new uploader scripts **/

var RclUploaders = [];

(function ($) {

    $(document).ready(function () {

        jQuery('body').on('drop', function (e) {
            return false;
        });
        jQuery(document.body).on("drop", function (e) {
            e.preventDefault();
        });

        RclUploaders.init();

    });

})(jQuery);

RclUploaders = new RclClassUploaders();

function RclClassUploaders() {

    this.uploaders = [];

    this.init = function () {

        this.uploaders.forEach(function (uploader, i) {
            uploader.init();
        });

    };

    this.add = function (props, sk) {

        this.uploaders.push(new RclUploader(props, sk));

    };

    this.get = function (uploader_id) {

        var k = false;

        this.uploaders.forEach(function (uploader, i) {

            if (uploader.uploader_id == uploader_id)
                k = i;
        });

        if (k !== false)
            return this.uploaders[k];

    }

    this.isset = function (uploader_id) {

        var k = false;

        this.uploaders.forEach(function (uploader, i) {

            if (uploader.uploader_id == uploader_id)
                k = i;
        });

        if (k !== false)
            return true;

        return false;

    }

}

function RclUploader(props, sk) {

    this.uploader_id = props.uploader_id;
    this.input = jQuery("#rcl-uploader-input-" + this.uploader_id);
    this.button = this.input.parent(".rcl-uploader-button");
    this.options = props;

    this.getFormData = function (uploader) {
        if (!uploader)
            uploader = this;

        var formData = {
            options: JSON.stringify(uploader.options),
            is_wp_admin_page: typeof adminpage ? 1 : 0,
            sk: sk
        };

        formData.action = uploader.options.action;
        formData.ajax_nonce = Rcl.nonce;

        return formData;

    };

    this.init = function () {

        if (this.options.dropzone)
            rcl_init_dropzone(jQuery("#rcl-dropzone-" + this.uploader_id));

        var uploader_id = this.options.uploader_id;
        var uploader = this;

        options = {
            dataType: 'json',
            type: 'POST',
            url: Rcl.ajaxurl,
            dropZone: this.options.dropzone ? jQuery("#rcl-dropzone-" + this.uploader_id) : false,
            formData: this.getFormData(uploader),
            loadImageMaxFileSize: this.options.max_size * 1024,
            autoUpload: this.options.auto_upload,
            singleFileUploads: false,
            /*limitMultiFileUploads: this.options.max_files,*/
            maxNumberOfFiles: this.options.max_files,
            imageMinWidth: this.options.min_width,
            imageMinHeight: this.options.min_height,
            imageMaxWidth: 1920,
            imageMaxHeight: 1080,
            imageCrop: false,
            imageForceResize: false,
            previewCrop: false,
            previewThumbnail: true,
            previewCanvas: true,
            previewMaxWidth: 900,
            previewMaxHeight: 900,
            disableExifThumbnail: true,
            progressall: function (e, data) {
                RclUploaders.get(uploader_id).progressall(e, data);
            },
            processstart: function (e, data) {
                RclUploaders.get(uploader_id).processstart(e, data);
            },
            processdone: function (e, data) {
                RclUploaders.get(uploader_id).processdone(e, data);
            },
            processfail: function (e, data) {
                RclUploaders.get(uploader_id).processfail(e, data);
            },
            add: function (e, data) {
                RclUploaders.get(uploader_id).add(e, data);
            },
            submit: function (e, data) {
                RclUploaders.get(uploader_id).submit(e, data);
            },
            done: function (e, data) {
                RclUploaders.get(uploader_id).done(e, data);
            }
        };

        this.input.fileupload(options);

        /*this.initSortable();*/

        rcl_do_action('rcl_uploader_init', uploader_id);

    };

    this.initSortable = function () {
        jQuery("#rcl-upload-gallery-" + this.uploader_id).sortable({
            //connectWith: "#rcl-upload-gallery-" + this.uploader_id,
            containment: "parent",
            //handle: ".field-control .control-move",
            cursor: "move",
            placeholder: "ui-sortable-placeholder",
            distance: 5
        });
    }

    this.processstart = function (e, data) {
        console.log('processstart');
    };

    this.processdone = function (e, data) {
        console.log('processdone');
    };

    this.processfail = function (e, data) {
        console.log('processfail');
    };

    this.progressall = function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        jQuery('#rcl-uploader-' + this.uploader_id + ' .rcl-uploader-progress').html('<div class="progress-bar" style="width:' + progress + '%;">' + progress + '%</div>');
    };

    this.add = function (e, data) {

        var uploader = this;
        var options = uploader.options;

        var errors = [];

        var inGalleryNow = jQuery('#rcl-upload-gallery-' + uploader.uploader_id + ' .gallery-attachment').length;

        jQuery.each(data.files, function (index, file) {

            inGalleryNow++;

            if (file.size > options.max_size * 1024) {
                errors.push(Rcl.errors.file_max_size + '. Max: ' + options.max_size + 'Kb');
            }

        });

        if (options.multiple && inGalleryNow > options.max_files) {
            errors.push(Rcl.errors.file_max_num + '. Max: ' + options.max_files);
        }

        errors = this.filterErrors(errors, data.files, uploader);

        if (errors.length) {
            errors.forEach(function (error, i) {
                rcl_notice(error, 'error', 10000);
            });
            return false;
        }

        if (parseInt(options.crop) != 0 && parseInt(options.multiple) == 0 && typeof jQuery.Jcrop != 'undefined') {
            if (jQuery.inArray(data.files[0].type, [
                'image/png',
                'image/jpg',
                'image/jpeg',
                'image/gif'
            ]) >= 0) {
                return this.crop(e, data);
            }
        }

        data.process().done(function () {
            data.submit();
        });

    };

    this.filterErrors = function (errors, files, uploader) {
        return errors;
    };

    this.submit = function (e, data) {

        this.animateLoading(true);

        if (this.options.crop) {
            return this.submitCrop(e, data);
        }

    };

    this.done = function (e, data) {

        rcl_preloader_hide();

        this.animateLoading(false);

        jQuery('#rcl-uploader-' + this.uploader_id + ' .rcl-uploader-progress').empty();

        if (data.result.error) {
            rcl_notice(data.result.error, 'error', 10000);
            return false;
        }

        if (data.result.success) {
            rcl_notice(data.result.success, 'success', 10000);
        }

        var uploader = this;

        if (this.options.multiple) {
            jQuery.each(data.result, function (index, file) {

                uploader.appendInGallery(file, uploader);

            });
        } else {

            jQuery('#rcl-upload-gallery-' + this.uploader_id).html('');

            uploader.appendInGallery(data.result, uploader);
        }

        this.afterDone(e, data);

        jQuery('#rcl-preview').remove();

    };

    this.appendInGallery = function (file) {

        if (file.html) {
            jQuery('#rcl-upload-gallery-' + this.uploader_id).append(file.html);
            jQuery('#rcl-gallery-' + this.uploader_id).append(file.html);
            jQuery('#rcl-upload-gallery-' + this.uploader_id + ' .gallery-attachment').last().animateCss('flipInX');
        }
    };

    this.afterDone = function (e, data) {

    };

    this.crop = function (e, data) {

        var uploader = this;
        var crop = uploader.options.crop;
        var minWidthCrop = uploader.options.min_width;
        var minHeightCrop = uploader.options.min_height;

        jQuery.each(data.files, function (index, file) {

            jQuery('#rcl-preview').remove();

            var maxSize = parseInt(uploader.options.max_size);

            if (file.size > maxSize * 1024) {
                rcl_notice(Rcl.errors.file_max_size + '. Max:' + ' ' + maxSize + 'Kb', 'error', 10000);
                return false;
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var jcrop_api;
                var imgUrl = event.target.result;

                var maxWidth = window.innerWidth * 0.9;
                var maxHeight = window.innerHeight * 0.8;

                jQuery('body > div').last().after('<div id=rcl-preview><img style="max-width:' + maxWidth + 'px;max-height:' + maxHeight + 'px;" src="' + imgUrl + '"></div>');

                var image = jQuery('#rcl-preview img');

                image.on('load', function () {

                    var img = jQuery(this);
                    var cf = 1;

                    if (img[0].naturalWidth > img.width()) {
                        cf = img.width() / img[0].naturalWidth;
                    }

                    minWidthCrop *= cf;
                    minHeightCrop *= cf;

                    var height = img.height();
                    var width = img.width();

                    if (height < minHeightCrop || width < minWidthCrop) {
                        rcl_notice(Rcl.errors.file_min_size + '. Min:' + ' ' + minWidthCrop + '*' + minHeightCrop + ' px', 'error', 10000);
                        return false;
                    }

                    var jcrop_api;

                    img.Jcrop({
                            aspectRatio: (typeof crop.ratio != 'undefined') ? crop.ratio : 1,
                            minSize: [minWidthCrop, minHeightCrop],
                            onSelect: function (c) {
                                img.attr('data-width', width).attr('data-height', height).attr('data-x', c.x).attr('data-y', c.y).attr('data-w', c.w).attr('data-h', c.h);
                            }
                        },
                        function () {
                            jcrop_api = this;
                        });

                    ssi_modal.show({
                        sizeClass: 'auto',
                        title: Rcl.local.title_image_upload,
                        className: 'rcl-hand-uploader',
                        buttons: [{
                            className: 'btn-success',
                            label: Rcl.local.upload,
                            closeAfter: true,
                            method: function () {
                                data.submit();
                            }
                        }, {
                            className: 'btn-cancel',
                            label: Rcl.local.cancel,
                            closeAfter: true,
                            method: function () {
                                jcrop_api.destroy();
                            }
                        }],
                        content: jQuery('#rcl-preview'),
                        extendOriginalContent: true
                    });

                });

            };

            reader.readAsDataURL(file);

        });

    };

    this.submitCrop = function (e, data) {

        data.formData = this.getFormData();

        var image = jQuery('#rcl-preview img');

        if (parseInt(image.data('w'))) {

            var width = image.data('width');
            var height = image.data('height');
            var x = image.data('x');
            var y = image.data('y');
            var w = image.data('w');
            var h = image.data('h');

            data.formData.crop_data = [x, y, w, h];
            data.formData.image_size = [width, height];

        }

    }

    this.animateLoading = function (status) {
        if (status)
            this.button.addClass('rcl-bttn__loading');
        else
            this.button.removeClass('rcl-bttn__loading');
    }

}

function rcl_init_uploader(props, securityKey) {
    RclUploaders.add(props, securityKey);
}

function rcl_init_dropzone(dropZone) {

    jQuery(document.body).bind("drop", function (e) {
        var node = e.target, found = false;

        if (dropZone[0]) {
            dropZone.removeClass('in-dropzone hover-dropzone');
            do {
                if (node === dropZone[0]) {
                    found = true;
                    break;
                }
                node = node.parentNode;
            } while (node != null);

            if (found) {
                e.preventDefault();
            } else {
                return false;
            }
        }
    });

    dropZone.bind('dragover', function (e) {
        var timeout = window.dropZoneTimeout;

        if (!timeout) {
            dropZone.addClass('in-dropzone');
        } else {
            clearTimeout(timeout);
        }

        var found = false, node = e.target;

        do {
            if (node === dropZone[0]) {
                found = true;
                break;
            }
            node = node.parentNode;
        } while (node != null);

        if (found) {
            dropZone.addClass('hover-dropzone');
        } else {
            dropZone.removeClass('hover-dropzone');
        }

        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            dropZone.removeClass('in-dropzone hover-dropzone');
        }, 100);
    });
}

function rcl_delete_attachment(attachment_id, post_id, e) {

    if (e)
        rcl_preloader_show(jQuery(e).parents('.gallery-attachment'));

    var objectData = {
        action: 'rcl_ajax_delete_attachment',
        post_id: post_id,
        attach_id: attachment_id
    };

    rcl_ajax({
        rest: true,
        data: objectData,
        success: function (data) {

            jQuery('.gallery-attachment-' + attachment_id).animateCss('flipOutX', function (e) {
                jQuery(e).remove();
            });

        }
    });

    return false;
}

function rcl_add_attachment_in_editor(attach_id, editor_name, e) {

    var image = jQuery(e).data('html');
    var src = jQuery(e).data('src');

    if (src)
        image = '<a href="' + src + '">' + image + '</a>';

    jQuery("textarea[name=" + editor_name + "]").insertAtCaret(image + "&nbsp;");

    if (typeof tinyMCE != 'undefined') {
        tinyMCE.editors.forEach(function (editor) {

            if (editor.targetElm.name.length === editor_name.length) {
                editor.execCommand('mceInsertContent', false, image);
            }
        });
    }

    return false;
}

/** new uploader scripts end **/

function rcl_update_require_checkbox(e) {
    var name = jQuery(e).attr('name');
    var chekval = jQuery('form input[name="' + name + '"]:checked').val();
    if (chekval)
        jQuery('form input[name="' + name + '"]').attr('required', false);
    else
        jQuery('form input[name="' + name + '"]').attr('required', true);
}

function rcl_init_update_requared_checkbox() {

    jQuery('body form').find('.required-checkbox').each(function () {
        rcl_update_require_checkbox(this);
    });

    jQuery('body form').on('click', '.required-checkbox', function () {
        rcl_update_require_checkbox(this);
    });

}
;
jQuery(function ($) {
    rcl_do_action('rcl_init');
});

jQuery(window).on('load', function () {
    jQuery('body').on('drop', function (e) {
        return false;
    });
    jQuery(document.body).on("drop", function (e) {
        e.preventDefault();
    });
});

rcl_add_action('rcl_init', 'rcl_init_ajax_tab');

function rcl_init_ajax_tab() {
    jQuery('body').on('click', '.rcl-ajax', function () {

        var e = jQuery(this);

        if (e.hasClass('tab-upload'))
            return false;

        rcl_do_action('rcl_before_upload_tab', e);

        rcl_ajax({
            data: {
                action: 'rcl_ajax_tab',
                post: e.data('post'),
                tab_url: e.attr('href') //encodeURIComponent(e.attr('href'))
            },
            success: function (data) {

                e.removeClass('tab-upload');

                data = rcl_apply_filters('rcl_upload_tab', data);

                if (data.result.error) {
                    rcl_notice(data.result.error, 'error', 10000);
                    return false;
                }

                var url = data.post.tab_url;
                var supports = data.post.supports;
                var subtab_id = data.post.subtab_id;

                if (supports && supports.indexOf('dialog') >= 0) { //если вкладка поддерживает диалог

                    if (!subtab_id) { //если загружается основная вкладка

                        ssi_modal.show({
                            className: 'rcl-dialog-tab ' + data.post.tab_id,
                            sizeClass: 'small',
                            buttons: [{
                                label: Rcl.local.close,
                                closeAfter: true
                            }],
                            content: data.result
                        });

                    } else {

                        var box_id = '#ssi-modalContent';

                    }

                } else {

                    rcl_update_history_url(url);

                    if (!subtab_id) {
                        jQuery('.rcl-tab-button .recall-button').removeClass('active').removeClass('rcl-bttn__active');
                    }

                    e.addClass('active').addClass('rcl-bttn__active');

                    var box_id = '#lk-content';

                }

                if (box_id) {

                    jQuery(box_id).html(data.result);

                    var options = rcl_get_options_url_params();

                    if (options.scroll == 1) {
                        var offsetTop = jQuery(box_id).offset().top;
                        jQuery('body,html').animate({
                                scrollTop: offsetTop - options.offset
                            },
                            1000);
                    }

                    if (data.includes) {

                        var includes = data.includes;

                        includes.forEach(function (src, i, includes) {

                            jQuery.getScript(src);

                        });

                    }

                }

                if (!data.post.subtab_id) {
                    if (typeof animateCss !== 'undefined') {
                        jQuery('#lk-content').animateCss('fadeIn');
                    }
                } else {
                    if (typeof animateCss !== 'undefined') {
                        jQuery('#lk-content .rcl-subtab-content').animateCss('fadeIn');
                    }
                }

                rcl_do_action('rcl_upload_tab', {
                    element: e,
                    result: data
                });

            }
        });

        return false;

    });
}

function rcl_get_options_url_params() {

    var options = {
        scroll: 1,
        offset: 100
    };

    options = rcl_apply_filters('rcl_options_url_params', options);

    return options;
}

function rcl_add_dropzone(idzone) {

    jQuery(document.body).on("drop", function (e) {
        var dropZone = jQuery(idzone),
            node = e.target,
            found = false;

        if (dropZone[0]) {
            dropZone.removeClass('in hover');
            do {
                if (node === dropZone[0]) {
                    found = true;
                    break;
                }
                node = node.parentNode;
            } while (node != null);

            if (found) {
                e.preventDefault();
            } else {
                return false;
            }
        }
    });

    jQuery(idzone).on('dragover', function (e) {
        var dropZone = jQuery(idzone),
            timeout = window.dropZoneTimeout;

        if (!timeout) {
            dropZone.addClass('in');
        } else {
            clearTimeout(timeout);
        }

        var found = false,
            node = e.target;

        do {
            if (node === dropZone[0]) {
                found = true;
                break;
            }
            node = node.parentNode;
        } while (node != null);

        if (found) {
            dropZone.addClass('hover');
        } else {
            dropZone.removeClass('hover');
        }

        window.dropZoneTimeout = setTimeout(function () {
            window.dropZoneTimeout = null;
            dropZone.removeClass('in hover');
        }, 100);
    });
}

function passwordStrength(password) {
    var desc = [];
    desc[0] = Rcl.local.pass0;
    desc[1] = Rcl.local.pass1;
    desc[2] = Rcl.local.pass2;
    desc[3] = Rcl.local.pass3;
    desc[4] = Rcl.local.pass4;
    desc[5] = Rcl.local.pass5;
    var score = 0;
    if (password.length > 6)
        score++;
    if ((password.match(/[a-z]/)) && (password.match(/[A-Z]/)))
        score++;
    if (password.match(/\d+/))
        score++;
    if (password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/))
        score++;
    if (password.length > 12)
        score++;
    document.getElementById("passwordDescription").innerHTML = desc[score];
    document.getElementById("passwordStrength").className = "strength" + score;
}

function rcl_manage_user_black_list(e, user_id, confirmText) {

    var class_i = jQuery(e).children('i').attr('class');

    if (class_i == 'rcli fa-refresh fa-spin')
        return false;

    if (!confirm(confirmText))
        return false;

    jQuery(e).children('i').attr('class', 'rcli fa-refresh fa-spin');

    rcl_ajax({
        data: {
            action: 'rcl_manage_user_black_list',
            user_id: user_id
        },
        success: function (data) {

            jQuery(e).children('i').attr('class', class_i);

            if (data['label']) {
                jQuery(e).find('span').text(data['label']);
            }

        }
    });

    return false;
}

function rcl_show_tab(id_block) {
    jQuery(".rcl-tab-button .recall-button").removeClass("active");
    jQuery("#lk-content .recall_content_block").removeClass("active");
    jQuery('#tab-button-' + id_block).children('.recall-button').addClass("active");
    jQuery('#lk-content .' + id_block + '_block').addClass("active");
    return false;
}

rcl_add_action('rcl_init', 'rcl_init_recallbar_hover');

function rcl_init_recallbar_hover() {
    jQuery("#recallbar .menu-item-has-children").on('hover', function () {
        jQuery(this).children(".sub-menu").css({
            'visibility': 'visible'
        });
    }, function () {
        jQuery(this).children(".sub-menu").css({
            'visibility': ''
        });
    });
}

rcl_add_action('rcl_before_upload_tab', 'rcl_add_class_upload_tab');

function rcl_add_class_upload_tab(e) {
    e.addClass('tab-upload');
}

rcl_add_action('rcl_before_upload_tab', 'rcl_add_preloader_tab');

function rcl_add_preloader_tab(e) {
    rcl_preloader_show('#lk-content > div');
    rcl_preloader_show('#ssi-modalContent > div');
}

rcl_add_action('rcl_init', 'rcl_init_get_smilies');

function rcl_init_get_smilies() {
    jQuery(document).on({
            mouseenter: function () {
                var sm_box = jQuery(this).next();
                var block = sm_box.children();
                sm_box.show();
                if (block.html())
                    return false;
                block.html(Rcl.local.loading + '...');
                var dir = jQuery(this).data('dir');

                rcl_ajax({
                    data: {
                        action: 'rcl_get_smiles_ajax',
                        area: jQuery(this).parent().data('area'),
                        dir: dir ? dir : 0
                    },
                    success: function (data) {
                        if (data['content']) {
                            block.html(data['content']);
                        }
                    }
                });

            },
            mouseleave: function () {
                jQuery(this).next().hide();
            }
        },
        "body .rcl-smiles .fa-smile-o");
}

rcl_add_action('rcl_init', 'rcl_init_hover_smilies');

function rcl_init_hover_smilies() {

    jQuery(document).on({
            mouseenter: function () {
                jQuery(this).show();
            },
            mouseleave: function () {
                jQuery(this).hide();
            }
        },
        "body .rcl-smiles > .rcl-smiles-list");

    jQuery('body').on('hover click', '.rcl-smiles > img', function () {
        var block = jQuery(this).next().children();
        if (block.html())
            return false;
        block.html(Rcl.local.loading + '...');
        var dir = jQuery(this).data('dir');

        rcl_ajax({
            data: {
                action: 'rcl_get_smiles_ajax',
                area: jQuery(this).parent().data('area'),
                dir: dir ? dir : 0
            },
            success: function (data) {
                if (data['content']) {
                    block.html(data['content']);
                }
            }
        });

        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_click_smilies');

function rcl_init_click_smilies() {
    jQuery("body").on("click", '.rcl-smiles-list img', function () {
        var alt = jQuery(this).attr("alt");
        var area = jQuery(this).parents(".rcl-smiles").data("area");
        jQuery("#" + area).val(jQuery("#" + area).val() + " " + alt + " ");
    });
}

rcl_add_action('rcl_init', 'rcl_init_close_popup');

function rcl_init_close_popup() {
    jQuery('#rcl-popup,.floatform').on('click', '.close-popup', function () {
        rcl_hide_float_login_form();
        jQuery('#rcl-overlay').fadeOut();
        jQuery('#rcl-popup').empty();
        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_click_overlay');

function rcl_init_click_overlay() {
    jQuery('#rcl-overlay').on('click', function () {
        rcl_hide_float_login_form();
        jQuery('#rcl-overlay').fadeOut();
        jQuery('#rcl-popup').empty();
        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_click_float_window');

function rcl_init_click_float_window() {
    jQuery(".float-window-recall").on('click', '.close', function () {
        jQuery(".float-window-recall").remove();
        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_loginform_shift_tabs');

function rcl_init_loginform_shift_tabs() {
    jQuery('body').on('click', '.form-tab-rcl .link-tab-rcl', function () {
        jQuery('.form-tab-rcl').hide();

        if (jQuery(this).hasClass('link-login-rcl'))
            rcl_show_login_form_tab('login');

        if (jQuery(this).hasClass('link-register-rcl'))
            rcl_show_login_form_tab('register');

        if (jQuery(this).hasClass('link-remember-rcl'))
            rcl_show_login_form_tab('remember');

        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_check_url_params');

function rcl_init_check_url_params() {

    var options = rcl_get_options_url_params();

    if (rcl_url_params['tab']) {

        if (!jQuery("#lk-content").length)
            return false;

        if (options.scroll == 1) {
            var offsetTop = jQuery("#lk-content").offset().top;
            jQuery('body,html').animate({
                    scrollTop: offsetTop - options.offset
                },
                1000);
        }

        var id_block = rcl_url_params['tab'];
        rcl_show_tab(id_block);
    }

}

rcl_add_action('rcl_init', 'rcl_init_close_notice');

function rcl_init_close_notice() {
    jQuery('#rcl-notice,body').on('click', 'a.close-notice', function () {
        rcl_close_notice(jQuery(this).parent());
        return false;
    });
}

rcl_add_action('rcl_init', 'rcl_init_cookie');

rcl_add_action('rcl_login_form', 'rcl_init_login_form');

function rcl_init_login_form(type_form) {

    if (rcl_url_params['action-rcl']) {
        jQuery('.panel_lk_recall.floatform > div').hide();
    }

    if (type_form == 'floatform') {

        jQuery("body").on('click', '.rcl-register', function () {
            rcl_show_float_login_form();
            rcl_show_login_form_tab('register', type_form);
            return false;
        });

        jQuery("body").on('click', '.rcl-login', function () {
            rcl_show_float_login_form();
            rcl_show_login_form_tab('login', type_form);
            return false;
        });

        if (rcl_url_params['action-rcl']) {
            rcl_show_float_login_form();
        }

    } else {

        if (rcl_url_params['action-rcl'] === 'login') {
            jQuery('.rcl-loginform-full.' + type_form + ' #register-form-rcl').hide();
        }

        if (rcl_url_params['action-rcl'] === 'register') {
            jQuery('.rcl-loginform-full.' + type_form + ' #login-form-rcl').hide();
        }

        if (rcl_url_params['action-rcl'] === 'remember') {
            jQuery('.rcl-loginform.' + type_form + ' #login-form-rcl').hide();
        }

    }

    if (rcl_url_params['action-rcl']) {
        rcl_show_login_form_tab(rcl_url_params['action-rcl'], type_form);
    }

}

function rcl_show_login_form_tab(tab, type_form) {
    type_form = (!type_form) ? '' : '.' + type_form;
    jQuery('.panel_lk_recall' + type_form + ' #' + tab + '-form-rcl').show();
}

function rcl_show_float_login_form() {
    jQuery('.panel_lk_recall.floatform > div').hide();
    rcl_setup_position_float_form();
    jQuery('.panel_lk_recall.floatform').show();
}

function rcl_hide_float_login_form() {
    jQuery('.panel_lk_recall.floatform').fadeOut().children('.form-tab-rcl').hide();
}

function rcl_setup_position_float_form() {
    jQuery("#rcl-overlay").fadeIn();
    var screen_top = jQuery(window).scrollTop();
    var popup_h = jQuery('.panel_lk_recall.floatform').height();
    var window_h = jQuery(window).height();
    screen_top = screen_top + 60;
    jQuery('.panel_lk_recall.floatform').css('top', screen_top + 'px');
}

rcl_add_action('rcl_footer', 'rcl_beat');

function rcl_beat() {

    var beats = rcl_apply_filters('rcl_beats', rcl_beats);

    var DataBeat = rcl_get_actual_beats_data(beats);

    if (rcl_beats_delay && DataBeat.length) {

        rcl_do_action('rcl_beat');

        rcl_ajax({
            data: {
                action: 'rcl_beat',
                databeat: JSON.stringify(DataBeat)
            },
            success: function (data) {

                data.forEach(function (result, i, data) {

                    rcl_do_action('rcl_beat_success_' + result['beat_name']);

                    new (window[result['success']])(result['result']);

                });

            }
        });

    }

    rcl_beats_delay++;

    setTimeout('rcl_beat()', 1000);
}

function rcl_get_actual_beats_data(beats) {

    var beats_actual = new Array();

    if (beats) {

        beats.forEach(function (beat, i, beats) {
            var rest = rcl_beats_delay % beat.delay;
            if (rest == 0) {

                var object = new (window[beat.beat_name])(beat.data);

                if (object.data) {

                    object = rcl_apply_filters('rcl_beat_' + beat.beat_name, object);

                    object.beat_name = beat.beat_name;

                    var k = beats_actual.length;
                    beats_actual[k] = object;
                }
            }
        });

    }

    return beats_actual;

}

;
var rcl_public_form = {
    required: new Array()
};

jQuery(document).ready(function ($) {

    if (RclUploaders.isset('post_thumbnail')) {

        RclUploaders.get('post_thumbnail').appendInGallery = function (file) {

            jQuery('#rcl-upload-gallery-' + this.uploader_id).html('').append(file.thumbnail.html).animateCss('flipInX');
            jQuery('#rcl-upload-gallery-post_uploader').append(file.postmedia);
            jQuery('#rcl-upload-gallery-post_uploader div').last().animateCss('flipInX');

        };

        if (RclUploaders.isset('post_uploader')) {

            RclUploaders.get('post_thumbnail').filterErrors = function (errors, files, uploader) {

                var postUploader = RclUploaders.get('post_uploader');

                var inGalleryNow = jQuery('#rcl-upload-gallery-post_uploader .gallery-attachment').length + 1;

                if (inGalleryNow > postUploader.options.max_files) {
                    errors.push(Rcl.errors.file_max_num + '. Max: ' + postUploader.options.max_files);
                }

                return errors;
            };

        }

    }

    $('body').on('click', '.rcl-public-form #insert-media-button', function () {

        var editor = $(this).data('editor');

        var parent_id = ((rcl_url_params['rcl-post-edit'])) ? rcl_url_params['rcl-post-edit'] : 0;

        wp.media.model.settings.post.id = parent_id;

        wp.media.featuredImage.set = function (thumbnail_id) {

            rcl_get_post_thumbnail_html(thumbnail_id);

        };

        wp.media.editor.open(editor);

        return false;

    });

    jQuery('body').on('click', '#rcl-delete-post .delete-toggle', function () {
        jQuery(this).next().toggle('fast');
        return false;
    });

    jQuery('body').on('click', 'form[name="public_post"] input[name="rcl-edit-post"],form[name="public_post"] input[name="add_new_task"]', function () {
        var error = 0;
        jQuery('form[name="public_post"]').find(':input').each(function () {
            for (var i = 0; i < field.length; i++) {
                if (jQuery(this).attr('name') == field[i]) {
                    if (jQuery(this).val() == '') {
                        jQuery(this).attr('style', 'border:1px solid red !important');
                        error = 1;
                    } else {
                        jQuery(this).attr('style', 'border:1px solid #E6E6E6 !important');
                    }
                }
            }
        });
        if (error == 0)
            return true;
        else
            return false;
    });

});

rcl_add_action('rcl_init_public_form', 'rcl_setup_async_upload');

function rcl_setup_async_upload() {

    if (typeof wp == 'undefined' || !wp.Uploader)
        return false;

    jQuery.extend(wp.Uploader.prototype, {
        success: function (attachment) {
            if (attachment.attributes.uploadedTo)
                return false;
            rcl_ajax({
                data: {
                    action: 'rcl_save_temp_async_uploaded_thumbnail',
                    attachment_id: attachment.id,
                    attachment_url: attachment.attributes.url
                }
            });
        }
    });

}

rcl_add_action('rcl_init', 'rcl_init_click_post_thumbnail');

function rcl_init_click_post_thumbnail() {
    jQuery(".rcl-public-form").on('click', '.thumb-foto', function () {
        jQuery(".rcl-public-form .thumb-foto").removeAttr("checked");
        jQuery(this).attr("checked", 'checked');
    });
}

function rcl_get_post_thumbnail_html(thumbnail_id) {

    rcl_preloader_show(jQuery('.rcl-public-form'));

    rcl_ajax({
        data: {
            action: 'rcl_get_post_thumbnail_html',
            thumbnail_id: thumbnail_id
        },
        success: function (result) {
            jQuery('#rcl-thumbnail-post .thumbnail-image').html(result['thumbnail_image']).animateCss('flipInX');
            jQuery('#rcl-thumbnail-post .thumbnail-id').val(thumbnail_id);
        }
    });

}

function rcl_remove_post_thumbnail() {
    jQuery('#rcl-thumbnail-post .thumbnail-image').animateCss('flipOutX', function (e) {
        jQuery(e).empty();
    });
    jQuery('#rcl-thumbnail-post .thumbnail-id').val('0');
}

function rcl_delete_post(element) {

    rcl_preloader_show(jQuery(element).parents('li'));

    var objectData = {
        action: 'rcl_ajax_delete_post',
        post_id: jQuery(element).data('post')
    };

    rcl_ajax({
        data: objectData,
        success: function (data) {

            jQuery('#' + data['post_type'] + '-' + objectData.post_id).animateCss('flipOutX', function (e) {
                jQuery(e).remove();
            });

            data.post_id = objectData.post_id;

            rcl_do_action('rcl_delete_post', data);

        }
    });

    return false;
}

rcl_add_action('rcl_delete_post', 'rcl_delete_thumbnail_attachment');

function rcl_delete_thumbnail_attachment(data) {

    if (data['post_type'] != 'attachment')
        return false;

    if (jQuery('#rcl-thumbnail-post').length) {

        var currentThumbId = jQuery('#rcl-thumbnail-post .thumbnail-id').val();

        if (currentThumbId == data['post_id'])
            rcl_remove_post_thumbnail();
    }

}

function rcl_edit_post(element) {

    rcl_preloader_show(jQuery('#lk-content'));

    rcl_ajax({
        data: {
            action: 'rcl_get_edit_postdata',
            post_id: jQuery(element).data('post')
        },
        success: function (data) {

            if (data['result'] == 100) {

                ssi_modal.show({
                    title: Rcl.local.edit_box_title,
                    className: 'rcl-edit-post-form',
                    sizeClass: 'small',
                    buttons: [{
                        label: Rcl.local.save,
                        closeAfter: false,
                        method: function () {

                            rcl_preloader_show('#rcl-popup-content form');

                            rcl_ajax({
                                data: 'action=rcl_edit_postdata&' + jQuery('#rcl-popup-content form').serialize()
                            });

                        }
                    }, {
                        label: Rcl.local.close,
                        closeAfter: true
                    }],
                    content: '<div id="rcl-popup-content">' + data['content'] + '</div>'
                });
            }
        }
    });

}

function rcl_preview(e) {

    var submit = jQuery(e);
    var formblock = submit.parents('form');
    var post_type = formblock.data('post_type');

    if (!rcl_check_required_fields(formblock))
        return false;

    rcl_preloader_show(formblock);

    var iframe = jQuery("#post_content_ifr").contents().find("#tinymce").html();
    if (iframe) {
        tinyMCE.triggerSave();
        formblock.find('textarea[name="post_content"]').html(iframe);
    }

    var button_draft = formblock.find('input[name="button-draft"]').val();
    var button_delete = formblock.find('input[name="button-delete"]').val();
    var button_preview = formblock.find('input[name="button-preview"]').val();

    rcl_ajax({
        data: 'action=rcl_preview_post&publish=0&' + formblock.serialize(),
        error: function (data) {
            submit.attr('disabled', false).val(Rcl.local.preview);
        },
        success: function (data) {

            if (data['content']) {

                var buttons = [];

                buttons[0] = {
                    className: 'btn btn-primary',
                    label: Rcl.local.edit,
                    closeAfter: true,
                    method: function () {
                        submit.attr('disabled', false).val(Rcl.local.preview);
                    }
                };

                if (button_draft) {
                    buttons[1] = {
                        className: 'btn btn-danger',
                        label: Rcl.local.save_draft,
                        closeAfter: false,
                        method: function () {
                            rcl_save_draft();
                        }
                    };
                }

                var i = buttons.length;
                buttons[i] = {
                    className: 'btn btn-danger',
                    label: Rcl.local.publish,
                    closeAfter: false,
                    method: function () {
                        rcl_publish();
                    }
                };

                ssi_modal.show({
                    sizeClass: 'small',
                    title: Rcl.local.preview,
                    className: 'rcl-preview-post',
                    buttons: buttons,
                    content: '<div id="rcl-preview">' + data['content'] + '</div>'
                });

                return true;
            }

        }
    });

    return false;

}

function rcl_save_draft(e) {

    if (!e)
        e = jQuery('#rcl-draft-post');

    if (!rcl_check_publish(e))
        return false;

    jQuery(e).after('<input type="hidden" name="save-as-draft" value=1>');

    jQuery('form.rcl-public-form').submit();
}

function rcl_check_publish(e) {

    var submit = jQuery(e);
    var formblock = submit.parents('form');

    if (!rcl_check_required_fields(formblock))
        return false;

    return true;
}

function rcl_publish(e) {

    var formblock = (e) ? jQuery(e).parents('form') : jQuery('form.rcl-public-form');

    var post_type = formblock.data('post_type');

    if (!rcl_check_required_fields(formblock))
        return false;

    rcl_preloader_show(formblock);

    var iframe = jQuery("#post_content_ifr").contents().find("#tinymce").html();
    if (iframe) {
        tinyMCE.triggerSave();
        formblock.find('textarea[name="post_content"]').html(iframe);
    }

    rcl_ajax({
        data: 'action=rcl_preview_post&publish=1&' + formblock.serialize(),
        success: function (data) {

            if (data.submit) {
                rcl_preloader_show(formblock);
                jQuery('form.rcl-public-form').submit();
            }

            rcl_do_action('rcl_publish', data, e);

        }
    });

}

function rcl_check_required_fields(form) {

    var rclFormFactory = new RclForm(form);

    rclFormFactory.addChekForm('checkCats', {
        isValid: function () {
            var valid = true;
            if (this.form.find('input[name="cats[]"]').length > 0) {
                if (form.find('input[name="cats[]"]:checked').length == 0) {
                    this.shake(form.find('input[name="cats[]"]'));
                    this.addError('checkCats', Rcl.errors.cats_important);
                    valid = false;
                } else {
                    this.noShake(form.find('input[name="cats[]"]'));
                }
            }
            return valid;
        }

    });

    return rclFormFactory.validate();

}

function rcl_get_prefiew_content(formblock, iframe) {
    formblock.find('textarea[name="post_content"]').html(iframe);
    return formblock.serialize();
}

function rcl_preview_close(e) {
    ssi_modal.close();
}

function rcl_init_public_form(post) {

    rcl_do_action('rcl_init_public_form', post);

    var post_id = post.post_id;
    var post_type = post.post_type;
    var ext_types = post.ext_types;
    var size_files = parseInt(post.size_files, 10);
    var max_files = parseInt(post.max_files, 10);
    var post_status = 'new';

    if (post.post_status)
        post_status = post.post_status;

    jQuery('form.rcl-public-form').find(':required').each(function () {
        var i = rcl_public_form.required.length;
        rcl_public_form.required[i] = jQuery(this).attr('name');
    });

    var maxsize = size_files * 1024 * 1024;

    rcl_add_dropzone('#rcl-public-dropzone-' + post_type);

    jQuery('#upload-public-form-' + post_type).fileupload({
        dataType: 'json',
        type: 'POST',
        dropZone: jQuery('#rcl-public-dropzone-' + post_type),
        url: Rcl.ajaxurl,
        formData: {
            action: 'rcl_imagepost_upload',
            post_type: post_type,
            post_id: post_id,
            form_id: post.form_id,
            ext_types: ext_types,
            size_files: size_files,
            max_files: max_files,
            ajax_nonce: Rcl.nonce
        },
        singleFileUploads: false,
        autoUpload: true,
        send: function (e, data) {
            var error = false;
            rcl_preloader_show('form.rcl-public-form');
            var cnt_now = jQuery('#temp-files-' + post_type + ' li').length;
            jQuery.each(data.files, function (index, file) {
                cnt_now++;
                if (cnt_now > max_files) {
                    rcl_notice(Rcl.local.allowed_downloads + ' ' + max_files, 'error', 10000);
                    error = true;
                }
                if (file['size'] > maxsize) {
                    rcl_notice(Rcl.local.upload_size_public + ' ' + size_files + ' MB', 'error', 10000);
                    error = true;
                }
            });
            if (error) {
                rcl_preloader_hide();
                return false;
            }
        },
        done: function (e, data) {

            rcl_preloader_hide();

            jQuery.each(data.result, function (index, file) {
                if (data.result['error']) {
                    rcl_notice(data.result['error'], 'error', 10000);
                    rcl_preloader_hide();
                    return false;
                }

                if (file['string']) {
                    jQuery('#temp-files-' + post_type).append(file['string']);
                    jQuery('#temp-files-' + post_type + ' li').last().animateCss('flipInX');
                }
            });

        }
    });
}

function rcl_init_thumbnail_uploader(e, options) {

    var form = jQuery(e).parents('form');

    var post_id = form.data('post_id');
    var post_type = form.data('post_type');
    var ext_types = 'jpg,png,jpeg';
    var maxsize_mb = options.size;

    var maxsize = maxsize_mb * 1024 * 1024;

    jQuery('#rcl-thumbnail-uploader').fileupload({
        dataType: 'json',
        type: 'POST',
        url: Rcl.ajaxurl,
        formData: {
            action: 'rcl_imagepost_upload',
            post_type: post_type,
            post_id: post_id,
            ext_types: ext_types,
            ajax_nonce: Rcl.nonce
        },
        singleFileUploads: true,
        autoUpload: true,
        send: function (e, data) {

            var error = false;

            rcl_preloader_show('form.rcl-public-form');

            jQuery.each(data.files, function (index, file) {

                if (file['size'] > maxsize) {
                    rcl_notice(Rcl.local.upload_size_public + ' ' + maxsize_mb + ' MB', 'error', 10000);
                    error = true;
                }

            });

            if (error) {
                rcl_preloader_hide();
                return false;
            }

        },
        done: function (e, data) {
            jQuery.each(data.result, function (index, file) {

                rcl_preloader_hide();

                if (data.result['error']) {
                    rcl_notice(data.result['error'], 'error', 10000);
                    return false;
                }

                if (file['string']) {
                    jQuery('#temp-files-' + post_type).append(file['string']);
                    jQuery('#temp-files-' + post_type + ' li').last().animateCss('flipInX');
                    jQuery('#rcl-thumbnail-post .thumbnail-image').html(file['thumbnail_image']).animateCss('flipInX');
                    jQuery('#rcl-thumbnail-post .thumbnail-id').val(file['attachment_id']);
                }
            });


        }
    });

}

function rcl_set_post_thumbnail(attach_id, parent_id, e) {

    rcl_preloader_show(jQuery('.gallery-attachment-' + attach_id));

    rcl_ajax({
        data: {
            action: 'rcl_set_post_thumbnail',
            thumbnail_id: attach_id,
            parent_id: parent_id,
            form_id: jQuery('form.rcl-public-form input[name="form_id"]').val(),
            post_type: jQuery('form.rcl-public-form input[name="post_type"]').val()
        },
        success: function (result) {
            jQuery('#rcl-upload-gallery-post_thumbnail').html(result.html).animateCss('flipInX');
        }
    });

}

function rcl_switch_attachment_in_gallery(attachment_id, e) {

    var button = jQuery('.rcl-switch-gallery-button-' + attachment_id);

    if (button.children('i').hasClass('fa-toggle-off')) {
        button.children('input').val(attachment_id);
    } else {
        button.children('input').val('');
    }

    button.children('i').toggleClass('fa-toggle-off fa-toggle-on');

}
;
jQuery(function ($) {
    /* Пополняем личный счет пользователя */
    jQuery('body').on('click', '.rcl-form-add-user-count .rcl-get-form-pay', function () {

        var id = jQuery(this).parents('.rcl-form-add-user-count').attr('id');

        rcl_preloader_show('#' + id + ' .rcl-form-input');

        var dataString = 'action=rcl_add_count_user&' + jQuery('#' + id + ' form').serialize();

        rcl_ajax({
            data: dataString,
            success: function (data) {

                if (data['otvet'] == 100) {
                    jQuery('#' + id + ' .rcl-result-box').html(data['redirectform']);
                }
            }
        });

        return false;

    });

    jQuery('body').on('click', '.rcl-widget-balance .rcl-toggle-form-link', function () {
        var id = jQuery(this).parents('.rcl-widget-balance').attr('id');
        jQuery('#' + id + ' .rcl-form-balance').slideToggle(200);
        return false;
    });

});

function rcl_show_payment_form(id) {
    jQuery('.rcl-payment-forms .rcl-payment-form').removeClass('display-form');
    jQuery('.rcl-payment-forms .rcl-payment-form[data-gateway-id="' + id + '"]').addClass('display-form');
}

function rcl_pay_order_user_balance(e, data) {

    rcl_preloader_show(jQuery('.rcl-payment-buttons'));

    rcl_ajax({
        data: {
            action: 'rcl_pay_order_user_balance',
            pay_id: data.pay_id,
            pay_type: data.pay_type,
            pay_summ: data.pay_summ,
            description: data.description,
            baggage_data: JSON.stringify(data.baggage_data)
        }
    });

    return false;

}

function rcl_switch_view_balance_form(e) {

    var widget = jQuery(e).parents('.rcl-balance-widget');

    widget.find('.balance-form').slideToggle();

}
;
Rcl.Cart = {
    products_amount: 0,
    order_price: 0,
    products: new Array
};

Rcl.Variations = new Array;

function rcl_init_product_slider(gallery_id) {
    jQuery('.rcl-product-gallery #' + gallery_id).bxSlider({
        pagerCustom: '.product-slider-pager'
    });
}

function rcl_init_variations(varsData) {

    var box_id = varsData.box_id;
    var variations = varsData.variations;
    var product_id = varsData.box_id;
    var product_price = varsData.product_price;

    Rcl.Variations[product_id] = new Array;

    variations.forEach(function (variation, i, variations) {

        var varSlug = variation.slug;
        var varValues = variation.values;

        var i = Rcl.Variations[product_id].length;
        Rcl.Variations[product_id][i] = {
            slug: varSlug,
            price: 0
        };

        jQuery('#cart-box-' + box_id).find('input[name="cart[variations][' + varSlug + ']"]:checked, input[name="cart[variations][' + varSlug + '][]"]:checked, select[name="cart[variations][' + varSlug + ']"]').each(function () {

            var loopData = {
                input: jQuery(this),
                varValues: varValues,
                varSlug: varSlug,
                product_id: product_id,
                product_price: product_price
            };

            Rcl.Variations[product_id] = rcl_variations_loop(loopData);

        });

        jQuery('#cart-box-' + box_id + ' input[name="cart[variations][' + varSlug + ']"], #cart-box-' + box_id + ' input[name="cart[variations][' + varSlug + '][]"], #cart-box-' + box_id + ' select[name="cart[variations][' + varSlug + ']"]').change(function () {

            var loopData = {
                input: jQuery(this),
                varValues: varValues,
                varSlug: varSlug,
                product_id: product_id,
                product_price: product_price
            };

            Rcl.Variations[product_id] = rcl_variations_loop(loopData);

        });

    });

}

function rcl_variations_loop(loopData) {

    var input = loopData.input;
    var varValues = loopData.varValues;
    var varSlug = loopData.varSlug;
    var product_id = loopData.product_id;
    var product_price = loopData.product_price;

    var type = input.attr('type');

    if (!type)
        type = 'select';

    var currentVal = input.val();
    var cartBox = input.parents('.rcl-cart-box');
    var priceBox = cartBox.find('.current-price');

    varValues.forEach(function (varVal, i, varValues) {

        if (!varVal || currentVal != varVal.name)
            return;

        var varPrice = parseFloat(varVal.price);

        if (!varPrice)
            varPrice = 0;

        var variations = Rcl.Variations[product_id];

        variations.forEach(function (val, i, variations) {

            if (varSlug != val.slug)
                return;

            if (type == 'checkbox') {

                if (input.is(':checked')) {
                    Rcl.Variations[product_id][i].price += varPrice;
                } else {
                    Rcl.Variations[product_id][i].price -= varPrice;
                }
            } else {
                Rcl.Variations[product_id][i].price = varPrice;
            }

        });

    });

    priceBox.text(product_price + rcl_get_variations_price(product_id));

    return Rcl.Variations[product_id];

}

function rcl_get_variations_price(product_id) {

    var variations = Rcl.Variations[product_id];

    var varsPrice = 0;

    variations.forEach(function (value, i, variations) {

        varsPrice += value.price;

    });

    return varsPrice;

}

rcl_add_action('rcl_init', 'rcl_init_cart');

function rcl_init_cart() {

    if (jQuery.cookie('rcl_cart')) {

        var products = JSON.parse(jQuery.cookie('rcl_cart'));

        rcl_cart_setup_data(products);

    }
}

function rcl_cart_setup_data(products) {

    Rcl.Cart.products = products;

    products.forEach(function (product, i, products) {

        if (!product)
            return;

        Rcl.Cart.products_amount += product.product_amount;
        Rcl.Cart.order_price += product.product_amount * product.product_price;

    });

}

function rcl_cart_update_data(products) {

    Rcl.Cart = {
        products_amount: 0,
        order_price: 0,
        products: new Array
    };

    var k = 0;

    products.forEach(function (product, i, products) {

        if (product) {

            Rcl.Cart.products[k] = product;
            Rcl.Cart.products_amount += parseInt(product.product_amount);

            if (product.product_price)
                Rcl.Cart.order_price += product.product_amount * product.product_price;

            k++;

        }

    });

    jQuery.cookie('rcl_cart', JSON.stringify(Rcl.Cart.products), {
        path: '/'
    });
}

function rcl_search_product(product_id) {

    var products = Rcl.Cart.products;

    var key = false;

    products.forEach(function (product, i, products) {

        if (!product)
            return;

        if (product.product_id == product_id) {
            key = i;
            return;
        }

    });

    return key;

}

function rcl_update_cart_content() {

    rcl_preloader_show(jQuery('#rcl-order'));

    rcl_ajax({
        data: {
            action: 'rcl_update_cart_content',
            cart: JSON.stringify(Rcl.Cart.products)
        },
        success: function (data) {

            jQuery('.rcl-order-price').html(Rcl.Cart.order_price);
            jQuery('.rcl-order-amount').html(Rcl.Cart.products_amount);
            jQuery('#rcl-order').html(data['content']).animateCss('fadeIn');

        }
    });

}

function rcl_cart_add_product(product_id, key) {

    var productBox = jQuery('#product-' + product_id + '-' + key);

    if (key === null)
        var key = rcl_search_product(product_id);

    if (key === false)
        return false;

    var product = Rcl.Cart.products[key];

    product.product_amount++;

    var product_sum = product.product_amount * product.product_price;

    Rcl.Cart.products[key] = product;

    rcl_cart_update_data(Rcl.Cart.products);

    productBox.find('.product-amount').text(product.product_amount);
    productBox.find('.product-sumprice').text(product_sum.toFixed(2));

    jQuery('.rcl-order-price').html(Rcl.Cart.order_price.toFixed(2));
    jQuery('.rcl-order-amount').html(Rcl.Cart.products_amount);

    return false;
}

function rcl_cart_remove_product(product_id, key) {

    var productBox = jQuery('#product-' + product_id + '-' + key);

    if (key === null)
        var key = rcl_search_product(product_id);

    if (key === false)
        return false;

    var product = Rcl.Cart.products[key];

    product.product_amount--;

    if (product.product_amount <= 0) {

        delete Rcl.Cart.products[key];

        rcl_cart_update_data(Rcl.Cart.products);

        rcl_update_cart_content();

        return false;

    } else {

        var product_sum = product.product_amount * product.product_price;

        Rcl.Cart.products[key] = product;

    }

    rcl_cart_update_data(Rcl.Cart.products);

    productBox.find('.product-amount').text(product.product_amount);
    productBox.find('.product-sumprice').text(product_sum.toFixed(2));

    jQuery('.rcl-order-price').html(Rcl.Cart.order_price.toFixed(2));
    jQuery('.rcl-order-amount').html(Rcl.Cart.products_amount);

    return false;
}

function rcl_add_to_cart(e) {

    var form = jQuery(e).parents('form');

    if (!rcl_check_form(form)) {
        return false;
    }

    var box = jQuery(e).parents('.rcl-cart-box');

    var product_id = form.data('product');

    if (jQuery('#product-' + product_id).length) {
        rcl_preloader_show(jQuery('#product-' + product_id));
    } else {
        rcl_preloader_show(box);
    }

    rcl_ajax({
        data: 'action=rcl_add_to_cart&' + box.find('form').serialize(),
        success: function (data) {

            if (data.modal) {

                if (jQuery('#ssi-modalContent').length)
                    ssi_modal.close();

                ssi_modal.show({
                    className: 'rcl-dialog-tab product-dialog',
                    sizeClass: 'auto',
                    buttons: [{
                        label: Rcl.local.close,
                        closeAfter: true
                    }],
                    content: data.content
                });

                return;

            }

            if (data.success) {

                jQuery('.rcl-mini-cart').removeClass('empty-cart');
                jQuery('.rcl-order-price').html(data.cart.order_price);
                jQuery('.rcl-order-amount').html(data.cart.products_amount);

                jQuery('.rcl-order-price').html(data.cart.order_price);
                jQuery('.rcl-order-amount').html(data.cart.products_amount);

                if (typeof animateCss !== 'undefined') {
                    jQuery('#recallbar #rcl-cart').animateCss('shake');
                }

                Rcl.Cart = data.cart;

                jQuery.cookie('rcl_cart', JSON.stringify(data.cart.products), {
                    path: '/'
                });

            } else {
                rcl_proccess_ajax_return(data);
            }
        }
    });

    return false;

}

function rcl_add_product_quantity(e) {

    var selector = jQuery(e).parents('.quantity-selector');
    var input = selector.find('input');

    var value = parseInt(input.val()) + 1;

    input.val(value);
}

function rcl_remove_product_quantity(e) {

    var selector = jQuery(e).parents('.quantity-selector');
    var input = selector.find('input');

    var value = parseInt(input.val()) - 1;

    if (!value)
        return false;

    input.val(value);
}

function rcl_cart_submit() {

    rcl_preloader_show(jQuery('#rcl-order'));

    var form = jQuery('#rcl-order-form');

    if (!rcl_check_form(form)) {

        rcl_preloader_hide();

        return false;
    }

    rcl_ajax({
        data: 'action=rcl_check_cart_data&' + form.serialize(),
        success: function (data) {

            if (data.submit) {

                rcl_do_action('rcl_cart_submit');

                form.submit();

            }
        }
    });

}

rcl_add_action('rcl_pay_order_user_balance', 'rcl_pay_order_with_balance');

function rcl_pay_order_with_balance(data) {

    if (data.pay_balance) {

        var orderBox = jQuery('#rcl-order');

        orderBox.find('.rcl-order-pay-form').html(data.success);

    }

}
;
(function ($) {

  var saper = [];
  var mines = [];
  var mines_num = 10;
  var saper_canvas = false;
  var saper_size = 45;
  var particles = [];
  var saper_level = 'low';
  var saper_col = 10;
  var saper_line = 8;
  var saper_first_click = 0;
  var saper_playing = null;
  var saper_flags = 0;
  var saper_timer = null;
  var saper_die = 0;
  var saper_die_timer = null;
  $(document).ready(function () {
	saper_canvas = $('#saper').get(0);
	if (typeof saper_canvas !== 'undefined') {
	  $('.saper-level select').trigger('change');
	}

  });
  $(document).on('change', '.saper-level select', function () {

	saper_level = $(this).val();
	if (saper_level === 'hig') {
	  saper_col = 24;
	  saper_line = 20;
	  mines_num = 99;
	  saper_flags = 99;
	  saper_size = 25;
	} else if (saper_level === 'med') {
	  saper_col = 18;
	  saper_line = 14;
	  mines_num = 40;
	  saper_size = 30;
	  saper_flags = 40;
	} else if (saper_level === 'low') {
	  saper_col = 10;
	  saper_line = 8;
	  mines_num = 10;
	  saper_size = 45;
	  saper_flags = 10;
	}

	$('.saper').removeClass('low hig med').addClass(saper_level);
	saper_start();
  });
  function saper_start() {

	saper_canvas = $('#saper').get(0);
	if (typeof saper_canvas !== 'undefined') {

	  saper = [];
	  mines = [];
	  particles = [];
	  saper_first_click = 0;
	  saper_die = 0;
	  clearInterval(saper_die_timer);
	  init_saper();
	  saper_control();
	  update_canvas();
	  saper_timer_control();
	}
  }

  function saper_control() {

	saper_canvas.onmousemove = function (e) {
	  var rect = this.getBoundingClientRect(),
			  x = e.clientX - rect.left,
			  y = e.clientY - rect.top,
			  i = 0;
	  while (saper[i]) {
		var j = 0;
		while (saper[i][j]) {
		  if (x > saper[i][j].x && x < saper[i][j].x + saper_size && y > saper[i][j].y && y < saper[i][j].y + saper_size) {
			saper[i][j].hover = 1;
		  } else {
			saper[i][j].hover = 0;
		  }
		  j++;
		}

		i++;
	  }
	};
	saper_canvas.onmouseout = function (e) {
	  var old_interval = saper_playing;
	  setTimeout(function () {
		clearInterval(old_interval);
		if (!$('.saper .saper-upd').hasClass('active')) {
		  $('.saper .saper-upd').removeClass('active clear').addClass('stop');
		}
	  }, 2000);
	  $('.saper .saper-upd').removeClass('active stop').addClass('clear');
	};
	saper_canvas.onmouseenter = function (e) {
	  saper_playing = setInterval(update_canvas, 1000 / 30);
	  $('.saper .saper-upd').removeClass('stop clear').addClass('active');
	};
	saper_canvas.oncontextmenu = function (e) {
	  e.preventDefault();
	};
	saper_canvas.onmousedown = function (e) { // обрабатываем клики мышью
	  var rect = this.getBoundingClientRect(),
			  x = e.clientX - rect.left,
			  y = e.clientY - rect.top;
	  var col = Math.floor(x / saper_size);
	  var line = Math.floor(y / saper_size);
	  if (saper[line][col].ishide === 0) {
		return;
	  }
	  if (e.button !== 0) {
		if (e.button === 2) {
		  if (saper[line][col].flag === 1) {
			saper[line][col].flag = 0;
			saper_flags += 1;
		  } else {
			saper[line][col].flag = 1;
			saper_flags -= 1;
		  }
		  $('.saper .saper-flags .saper-flags-count').text(saper_flags);
		  return;
		}
		return;
	  }

	  if (saper_first_click === 0) {

		init_saper_mines(col, line);
		saper_first_click = 1;
		saper_timer_control();
		$('.saper .saper-content').removeClass('shake').addClass('shake');
	  }

	  saper_click(col, line);
	};
  }

  function saper_timer_control() {
	if (typeof saper_timer !== null) {
	  var old_timer = saper_timer;
	  clearInterval(old_timer);
	  $('.saper .saper-timer-count').text(0);
	}
	if (saper_first_click === 1) {
	  saper_timer = setInterval(function () {
		var time = parseInt($('.saper .saper-timer-count').text());
		$('.saper .saper-timer-count').text(time + 1);
	  }, 1000);
	}
  }

  function saper_click(col, line) {

	if (saper[line][col].flag === 1) {
	  return;
	}
	if (saper[line][col].type === 9) {
	  saper_die = 1;
	  saper_loose();
	  return;
	}

	if (saper[line][col].type === 0) {
	  saper_click_empty(col, line);
	} else {
	  saper[line][col].ishide = 0;
	  particles.push({
		x: col * saper_size,
		y: line * saper_size,
		counter: 0,
		destroy: 0
	  });
	  if (saper[line][col].flag === 1) {
		saper[line][col].flag = 0;
		saper_flags += 1;
		$('.saper .saper-flags .saper-flags-count').text(saper_flags);
	  }
	}

  }


  function saper_click_empty(col, line) {
//метим текущую ячейку
	saper[line][col].ishide = 0;
	particles.push({
	  x: col * saper_size,
	  y: line * saper_size,
	  counter: 0,
	  destroy: 0
	});
	if (saper[line][col].flag === 1) {
	  saper[line][col].flag = 0;
	  saper_flags += 1;
	  $('.saper .saper-flags .saper-flags-count').text(saper_flags);
	}

//если текущая ячейка не пустая, то не открываем соседние
	if (saper[line][col].type !== 0) {
	  return;
	}



//верх
	if (line > 0) {
	  if (col > 0) {
//лево верх
		if (saper[line - 1][col - 1].ishide === 1 && saper[line - 1][col - 1].type === 0) {

		  saper_click_empty(col - 1, line - 1);
		} else if (saper[line - 1][col - 1].ishide === 1 && saper[line - 1][col - 1].type !== 9) {
		  saper[line - 1][col - 1].ishide = 0;
		  if (saper[line - 1][col - 1].flag === 1) {
			saper[line - 1][col - 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col - 1) * saper_size,
			y: (line - 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
//центр верх
	  if (saper[line - 1][col].ishide === 1 && saper[line - 1][col].type === 0) {

		saper_click_empty(col, line - 1);
	  } else if (saper[line - 1][col].ishide === 1 && saper[line - 1][col].type !== 9) {
		saper[line - 1][col].ishide = 0;
		if (saper[line - 1][col].flag === 1) {
		  saper[line - 1][col].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col) * saper_size,
		  y: (line - 1) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

//право верх
	  if (col < saper_col - 1) {
		if (saper[line - 1][col + 1].ishide === 1 && saper[line - 1][col + 1].type === 0) {
		  saper_click_empty(col + 1, line - 1);
		} else if (saper[line - 1][col + 1].ishide === 1 && saper[line - 1][col + 1].type !== 9) {
		  saper[line - 1][col + 1].ishide = 0;
		  if (saper[line - 1][col + 1].flag === 1) {
			saper[line - 1][col + 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col + 1) * saper_size,
			y: (line - 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
	}

//на уровне слева
	if (col > 0) {
	  if (saper[line][col - 1].ishide === 1 && saper[line][col - 1].type === 0) {

		saper_click_empty(col - 1, line);
	  } else if (saper[line][col - 1].ishide === 1 && saper[line][col - 1].type !== 9) {
		saper[line][col - 1].ishide = 0;
		if (saper[line][col - 1].flag === 1) {
		  saper[line][col - 1].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col - 1) * saper_size,
		  y: (line) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

	}

//на уровне справа
	if (col < saper_col - 1) {
	  if (saper[line][col + 1].ishide === 1 && saper[line][col + 1].type === 0) {
		saper_click_empty(col + 1, line);
	  } else if (saper[line][col + 1].ishide === 1 && saper[line][col + 1].type !== 9) {
		saper[line][col + 1].ishide = 0;
		if (saper[line][col + 1].flag === 1) {
		  saper[line][col + 1].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col + 1) * saper_size,
		  y: (line) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }


	}

//низ
	if (line < saper_line - 1) {
	  if (col > 0) {
//лево низ
		if (saper[line + 1][col - 1].ishide === 1 && saper[line + 1][col - 1].type === 0) {

		  saper_click_empty(col - 1, line + 1);
		} else if (saper[line + 1][col - 1].ishide === 1 && saper[line + 1][col - 1].type !== 9) {
		  saper[line + 1][col - 1].ishide = 0;
		  if (saper[line + 1][col - 1].flag === 1) {
			saper[line + 1][col - 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col - 1) * saper_size,
			y: (line + 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
//центр низ
	  if (saper[line + 1][col].ishide === 1 && saper[line + 1][col].type === 0) {

		saper_click_empty(col, line + 1);
	  } else if (saper[line + 1][col].ishide === 1 && saper[line + 1][col].type !== 9) {
		saper[line + 1][col].ishide = 0;
		if (saper[line + 1][col].flag === 1) {
		  saper[line + 1][col].flag = 0;
		  saper_flags += 1;
		}
		particles.push({
		  x: (col) * saper_size,
		  y: (line + 1) * saper_size,
		  counter: 0,
		  destroy: 0
		});
	  }

//право низ
	  if (col < saper_col - 1) {
		if (saper[line + 1][col + 1].ishide === 1 && saper[line + 1][col + 1].type === 0) {

		  saper_click_empty(col + 1, line + 1);
		} else if (saper[line + 1][col + 1].ishide === 1 && saper[line + 1][col + 1].type !== 9) {
		  saper[line + 1][col + 1].ishide = 0;
		  if (saper[line + 1][col + 1].flag === 1) {
			saper[line + 1][col + 1].flag = 0;
			saper_flags += 1;
		  }
		  particles.push({
			x: (col + 1) * saper_size,
			y: (line + 1) * saper_size,
			counter: 0,
			destroy: 0
		  });
		}
	  }
	}

	$('.saper .saper-flags .saper-flags-count').text(saper_flags);
  }

  function init_saper_mines(num_col, num_line) {
	var click_cell = (num_line * saper_col) + num_col;
	click_cell = [
	  click_cell,
	  click_cell + 1,
	  click_cell - 1,
	  click_cell + saper_col - 1,
	  click_cell + saper_col,
	  click_cell + saper_col + 1,
	  click_cell - saper_col - 1,
	  click_cell - saper_col,
	  click_cell - saper_col + 1
	];
	var total_cell = [];
	for (var i = 0; i < saper_line * saper_col; i += 1) {
	  if ($.inArray(i, click_cell) === -1) {
		total_cell.push(i);
	  }
	}
	var rand_cell = saper_rand(mines_num, 0, total_cell.length);
	mines = [];
	$(rand_cell).each(function (index, val) {
	  mines.push(total_cell[val]);
	});
	var num = 0;
	$(saper).each(function (l_index, l_obj) {
	  $(l_obj).each(function (c_index, c_obj) {
		if ($.inArray(num, mines) !== -1) {
		  saper[l_index][c_index].type = 9;
		}

		num++;
	  });
	});
	saper_update_type();
  }

  function init_saper() {
	$('.saper #saper').attr({width: saper_col * saper_size, height: saper_line * saper_size});
	$('.saper .saper-flags .saper-flags-count').text(saper_flags);
	var num = 0, line = 0, txt = 0;
	for (var y = 0; y < saper_line * saper_size; y += saper_size) {
	  saper.push([]);
	  for (var x = 0; x < saper_col * saper_size; x += saper_size) {
		saper[line].push({type: 0, x: x, y: y, hover: 0, ishide: 1, flag: 0});
		num++;
	  }

	  line++;
	}
  }

  function saper_user_win() {
	if(saper_die === 1) {
	  return false;
	}
	var sec = parseInt($('.saper .saper-timer-count').text());
	var dif = saper_level;
	saper_send_result(sec, dif);
	saper_show_result(sec, dif);

	$('.saper-level select').trigger('change');

  }

  function saper_update_type() {
	$(saper).each(function (line, line_obj) {
	  $(line_obj).each(function (col, col_obj) {
		if (col_obj.type !== 9) {
		  return true;
		}

//Если есть линия выше
		if (typeof saper[line - 1] !== 'undefined') {
		  if (col > 0 && col < saper_col - 1) {
//лево верх
			if (saper[line - 1][col - 1].type !== 9) {
			  saper[line - 1][col - 1].type += 1;
			}
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
//право верх
			if (saper[line - 1][col + 1].type !== 9) {
			  saper[line - 1][col + 1].type += 1;
			}
		  } else if (col === 0) {
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
//право верх
			if (saper[line - 1][col + 1].type !== 9) {
			  saper[line - 1][col + 1].type += 1;
			}
		  } else if (col === saper_col - 1) {
//лево верх
			if (saper[line - 1][col - 1].type !== 9) {
			  saper[line - 1][col - 1].type += 1;
			}
//верх
			if (saper[line - 1][col].type !== 9) {
			  saper[line - 1][col].type += 1;
			}
		  }
		}


//на уровне мины
		if (col > 0 && col < saper_col - 1) {
		  if (saper[line][col - 1].type !== 9) {
			saper[line][col - 1].type += 1;
		  }
		  if (saper[line][col + 1].type !== 9) {
			saper[line][col + 1].type += 1;
		  }
		} else if (col === 0) {
		  if (saper[line][col + 1].type !== 9) {
			saper[line][col + 1].type += 1;
		  }

		} else if (col === saper_col - 1) {
		  if (saper[line][col - 1].type !== 9) {
			saper[line][col - 1].type += 1;
		  }
		}

//линией ниже
		if (typeof saper[line + 1] !== 'undefined') {
		  if (col > 0 && col < saper_col - 1) {
//лево низ
			if (saper[line + 1][col - 1].type !== 9) {
			  saper[line + 1][col - 1].type += 1;
			}
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
//право низ
			if (saper[line + 1][col + 1].type !== 9) {
			  saper[line + 1][col + 1].type += 1;
			}
		  } else if (col === 0) {
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
//право низ
			if (saper[line + 1][col + 1].type !== 9) {
			  saper[line + 1][col + 1].type += 1;
			}
		  } else if (col === saper_col - 1) {
//лево низ
			if (saper[line + 1][col - 1].type !== 9) {
			  saper[line + 1][col - 1].type += 1;
			}
//низ
			if (saper[line + 1][col].type !== 9) {
			  saper[line + 1][col].type += 1;
			}
		  }
		}




	  });
	});
  }

  function update_canvas() {
	var ctx = saper_canvas.getContext("2d");
	var i = 0;
	var j = 0;
	var hide_count = 0;
	$(saper).each(function (line, line_val) {
	  $(line_val).each(function (col, col_val) {
		if (col_val.ishide === 1) {
		  hide_count += 1;
		  if ((i + j) % 2 === 0) {
			var def_color = "#aad751";
		  } else {
			var def_color = "#a2d149";
		  }
		} else {
		  if ((i + j) % 2 === 0) {
			var def_color = "#e5c29f";
		  } else {
			var def_color = "#d7b899";
		  }
		}

		ctx.beginPath();
		ctx.fillStyle = def_color;
		ctx.rect(col_val.x, col_val.y, saper_size, saper_size);
		ctx.fill();
		if (col_val.hover === 1 && (col_val.type !== 0 || col_val.ishide === 1)) {
		  ctx.beginPath();
		  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
		  ctx.rect(col_val.x, col_val.y, saper_size, saper_size);
		  ctx.fill();
		}


		if (col_val.flag === 1) {
		  ctx.beginPath();
		  ctx.font = "28px rcl-awesome";
		  ctx.fillStyle = "red";
		  ctx.textAlign = "center";
		  ctx.textBaseline = "middle";
		  ctx.fillText("\uf024", col_val.x + saper_size / 2, col_val.y + saper_size / 2);
		}

		if (col_val.ishide === 0) {

		  if (col_val.type === 9) {
			ctx.beginPath();
			ctx.fillStyle = "black";
			ctx.arc(col_val.x + saper_size / 2, col_val.y + saper_size / 2, saper_size / 2, 0, 360, false);
			ctx.fill();
		  } else if (col_val.type === 0) {
		  } else if (col_val.type !== 9) {
			switch (col_val.type) {
			  case 1:
				var txt_color = "blue";
				break;
			  case 2:
				var txt_color = "green";
				break;
			  case 3:
				var txt_color = "red";
				break;
			  default:
				var txt_color = "#673AB7";
			}
			ctx.beginPath();
			var font_size = (saper_size > 40) ? 40 : saper_size;
			ctx.font = 'bold ' + font_size + 'px serif';
			ctx.fillStyle = txt_color;
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(col_val.type, col_val.x + saper_size / 2, col_val.y + 2 + saper_size / 2);
		  }

		}
		i++;
	  });
	  j++;
	});
	if (hide_count === mines_num) {
	  saper_user_win();
	}
	var len = particles.length;
	for (i = 0; i < len; i++) {

	  var particle = particles[i];
	  if (typeof particle === 'undefined') {
		continue;
	  } else if (particle.counter === 10) {
		particles.splice(i, 1);
		continue;
	  }

	  if (typeof particle.to === 'undefined') {
		var rnd = parseInt(Math.random() * 100);
		if (rnd % 2 === 0) {
		  particle.to = 1;
		} else {
		  particle.to = -1;
		}
		particles[i].to = particle.to;
	  }

	  var rand_x = particle.counter / Math.sin(particle.to);
	  var rand_y = particle.counter / Math.sin(particle.to);

	  ctx.beginPath();
	  ctx.globalAlpha = 1 - particle.counter / 10;
	  ctx.fillStyle = "#9cd03a";
	  ctx.rect(particle.x - rand_x, particle.y + rand_y, saper_size - particle.counter, saper_size - particle.counter);
	  ctx.fill();
	  ctx.setTransform(1, 0, 0, 1, 0, 0);
	  ctx.globalAlpha = 1;
	  particles[i].counter += 1;
	}


  }

  function saper_rand(c, l, h) {
	var count = c,
			min = l,
			max = h,
			nums = {},
			out = [],
			r, len = 0;
	if (max - min < count)
	  count = max - min;
	var getRand = function () {
	  return Math.floor(Math.random() * (max - min) + min);
	}, check = function (a) {
	  return nums[a];
	}, add = function (a) {
	  nums[a] = 1;
	  out.push(a);
	  len++;
	};
	(function init() {
	  while (len < count) {
		if (len == 0)
		  r = getRand();
		else
		  while (check(r = getRand()))
			;
		add(r);
	  }
	})();
	return out;
  }

  $(document).on('click', '.saper .saper-overlay', function () {

	$(this).next().hide().html('');
	$(this).hide();

	if (saper_die === 1) {
	  $('.saper-level select').trigger('change');
	}

  });

  $(document).on('click', '.saper .saper-records', function () {

	$.post(Rcl.ajaxurl, {
	  action: 'saper_get_result_ajax',
	  dif: saper_level
	}, function (result) {
	  if (result.content) {
		$('.saper .saper-overlay, .saper .saper-overlay-content').show();
		$('.saper .saper-overlay-content').html('').html(result.content);
	  }

	});
	return false;

  });

  function saper_send_result(sec, dif) {

	$.post(Rcl.ajaxurl, {
	  action: 'saper_upd_result_ajax',
	  sec: sec,
	  dif: dif
	}, function (result) {
	  if (result.content) {
		rcl_notice('Сохранено', 'success', 3000);
	  } else {
		rcl_notice(result.error, 'error', 3000);
	  }

	});
	return false;
  }

  function saper_show_result(sec, dif) {
	$('.saper .saper-overlay, .saper .saper-overlay-content').show();
	$('.saper .saper-overlay-content').html('<div><h3>Поздравляем</h3><div>Вы справились за ' + sec + 'сек.</div></div>');
  }

  function saper_loose() {
	$('.saper .saper-overlay, .saper .saper-overlay-content').show();
	$('.saper .saper-overlay-content').html('<div><h3>Вы подорвались на мине!</h3><div>Попробуйте еще раз</div></div>');

	saper_die_timer = setInterval(function () {
	  $(saper).each(function (lindex, line_obj) {
		$(line_obj).each(function (cindex, col_obj) {
		  if (saper[lindex][cindex].ishide === 1) {
			saper[lindex][cindex].ishide = 0;
			particles.push({
			  x: (cindex) * saper_size,
			  y: (lindex) * saper_size,
			  counter: 0,
			  destroy: 0
			});
			if(typeof saper[lindex][cindex + 1] === 'undefined' && typeof saper[lindex + 1] === 'undefined') {
			  clearInterval(saper_die_timer);
			}
			return false;
		  }
		});
	  });
	}, 50);

  }


})(jQuery);
;

var __CONFIG__ = {"serverTimestamp":1792873891,"currentUser":{"user_login":false,"user_email":false,"user_level":false,"user_firstname":false,"user_lastname":false,"display_name":false,"ID":0,"roles":[]}};
//# sourceURL=brizy-preview-js-before

;

        var ajaxurl = 'https://welans.ru/wp-admin/admin-ajax.php';
        
;

	VK?.init({
		apiId: 51479622,
		onlyWidgets: true
	});

;
function setREVStartSize(e){
			//window.requestAnimationFrame(function() {
				window.RSIW = window.RSIW===undefined ? window.innerWidth : window.RSIW;
				window.RSIH = window.RSIH===undefined ? window.innerHeight : window.RSIH;
				try {
					var pw = document.getElementById(e.c).parentNode.offsetWidth,
						newh;
					pw = pw===0 || isNaN(pw) || (e.l=="fullwidth" || e.layout=="fullwidth") ? window.RSIW : pw;
					e.tabw = e.tabw===undefined ? 0 : parseInt(e.tabw);
					e.thumbw = e.thumbw===undefined ? 0 : parseInt(e.thumbw);
					e.tabh = e.tabh===undefined ? 0 : parseInt(e.tabh);
					e.thumbh = e.thumbh===undefined ? 0 : parseInt(e.thumbh);
					e.tabhide = e.tabhide===undefined ? 0 : parseInt(e.tabhide);
					e.thumbhide = e.thumbhide===undefined ? 0 : parseInt(e.thumbhide);
					e.mh = e.mh===undefined || e.mh=="" || e.mh==="auto" ? 0 : parseInt(e.mh,0);
					if(e.layout==="fullscreen" || e.l==="fullscreen")
						newh = Math.max(e.mh,window.RSIH);
					else{
						e.gw = Array.isArray(e.gw) ? e.gw : [e.gw];
						for (var i in e.rl) if (e.gw[i]===undefined || e.gw[i]===0) e.gw[i] = e.gw[i-1];
						e.gh = e.el===undefined || e.el==="" || (Array.isArray(e.el) && e.el.length==0)? e.gh : e.el;
						e.gh = Array.isArray(e.gh) ? e.gh : [e.gh];
						for (var i in e.rl) if (e.gh[i]===undefined || e.gh[i]===0) e.gh[i] = e.gh[i-1];
											
						var nl = new Array(e.rl.length),
							ix = 0,
							sl;
						e.tabw = e.tabhide>=pw ? 0 : e.tabw;
						e.thumbw = e.thumbhide>=pw ? 0 : e.thumbw;
						e.tabh = e.tabhide>=pw ? 0 : e.tabh;
						e.thumbh = e.thumbhide>=pw ? 0 : e.thumbh;
						for (var i in e.rl) nl[i] = e.rl[i]<window.RSIW ? 0 : e.rl[i];
						sl = nl[0];
						for (var i in nl) if (sl>nl[i] && nl[i]>0) { sl = nl[i]; ix=i;}
						var m = pw>(e.gw[ix]+e.tabw+e.thumbw) ? 1 : (pw-(e.tabw+e.thumbw)) / (e.gw[ix]);
						newh =  (e.gh[ix] * m) + (e.tabh + e.thumbh);
					}
					var el = document.getElementById(e.c);
					if (el!==null && el) el.style.height = newh+"px";
					el = document.getElementById(e.c+"_wrapper");
					if (el!==null && el) {
						el.style.height = newh+"px";
						el.style.display = "block";
					}
				} catch(e){
					console.log("Failure at Presize of Slider:" + e)
				}
			//});
		  };
;
!function(){function t(t){this.element=t,this.animationId,this.start=null,this.init()}if(!window.requestAnimationFrame){var i=null;window.requestAnimationFrame=function(t,n){var e=(new Date).getTime();i||(i=e);var a=Math.max(0,16-(e-i)),o=window.setTimeout(function(){t(e+a)},a);return i=e+a,o}}t.prototype.init=function(){var t=this;this.animationId=window.requestAnimationFrame(t.triggerAnimation.bind(t))},t.prototype.reset=function(){var t=this;window.cancelAnimationFrame(t.animationId)},t.prototype.triggerAnimation=function(t){var i=this;this.start||(this.start=t);var n=t-this.start;504>n||(this.start=this.start+504),this.element.setAttribute("transform","rotate("+Math.min(n/1.4,360)+" 12 12)");if(document.documentElement.contains(this.element))window.requestAnimationFrame(i.triggerAnimation.bind(i))};var n=document.getElementsByClassName("nc-loop_circle-02-24"),e=[];if(n)for(var a=0;n.length>a;a++)!function(i){e.push(new t(n[i]))}(a);document.addEventListener("visibilitychange",function(){"hidden"==document.visibilityState?e.forEach(function(t){t.reset()}):e.forEach(function(t){t.init()})})}();
;
var IS_CLIENT_SIDE="undefined"!=typeof window,IS_ANDROID_WEBVIEW=Boolean(IS_CLIENT_SIDE&&window.AndroidBridge),IS_IOS_WEBVIEW=Boolean(IS_CLIENT_SIDE&&window.webkit&&window.webkit.messageHandlers&&window.webkit.messageHandlers.VKWebAppClose),IS_WEB=IS_CLIENT_SIDE&&!IS_ANDROID_WEBVIEW&&!IS_IOS_WEBVIEW,androidBridge=IS_CLIENT_SIDE?window.AndroidBridge:void 0,iosBridge=IS_IOS_WEBVIEW?window.webkit.messageHandlers:void 0;function _bridgeSend(e,t){androidBridge&&androidBridge[e]?androidBridge[e](JSON.stringify(t)):iosBridge&&iosBridge[e]&&"function"==typeof iosBridge[e].postMessage&&iosBridge[e].postMessage(t)}function _bridgeSupports(e){return IS_ANDROID_WEBVIEW?androidBridge&&"function"==typeof androidBridge[e]:!!IS_IOS_WEBVIEW&&(iosBridge&&iosBridge[e]&&"function"==typeof iosBridge[e].postMessage)}var IS_BRIDGE_AVAILABLE=!IS_WEB&&_bridgeSupports("VKWebAppConversionHit");function getBaseDomain(){var e="vk.com";try{var t=document.currentScript?.src;if(t)e=new URL(t).hostname.split(".").slice(-2).join(".")}catch(t){return console.warn("Failed to resolve script domain: ",t),e}return e}if(function(e){if(!e.fastXDM){var t={},o={},i=[],n={};e.fastXDM={_id:0,helperUrl:`https://${getBaseDomain()}/js/api/xdmHelper.js`,Server:function(o,i,n){this.methods=o||{},this.filter=i,this.options=n||{},this.id=e.fastXDM._id++,this.key=function(){for(var e="",t=0;t<5;t++)e+=Math.ceil(15*Math.random()).toString(16);return e}(),this.frameName="fXD"+this.key,this.server=!0,this.methods["%init%"]=this.methods.__fxdm_i=function(){d((function(t){for(var o in this.methods)if(this.methods[o]instanceof e.fastXDM.Server){var i=this.methods[o];"p"===t.protocol&&t.send(this,t.json.stringify(["%proxy%",[o,i.key]])),this.methods[o]=function(){this.callMethod.apply(this,arguments)}.bind(i)}}),this),e.fastXDM.run(this.id),this.methods.onInit&&this.methods.onInit()},t[this.key]=[p,this]},Client:function(i,n){if(this.methods=i||{},this.options=n||{},this.id=e.fastXDM._id++,this.client=!0,e.fastXDM.run(this.id),0!==window.name.indexOf("fXD"))throw Error("Wrong window.name property.");this.key=window.name.substring(3,8),this.caller=window.parent,o[this.key]||(o[this.key]={}),this.methods["%proxy%"]=function(e,t){e&&t&&this.caller.frames["fXD"+t]&&(o[this.key][e]={key:t,frame:{contentWindow:this.caller.frames["fXD"+t]}})}.bind(this),t[this.key]=[p,this],e.fastXDM.on("helper",(function(){e.fastXDM.onClientStart(this)}),this),d((function(e){e.send(this,e.json.stringify(["%init%"]));var t=this.methods;setTimeout((function(){t.onInit&&t.onInit()}),0)}),this)},onMessage:function(e){var o=e.data;if(!o)return!1;if("string"!=typeof o&&!(o instanceof String))return!1;var i=o.substr(0,5);if(t[i]){var n=t[i][1];!n||n.filter&&!n.filter(e.origin)||t[i][0](o.substr(6),n,e.origin)}},setJSON:function(e){n.json=e},getJSON:function(e){if(!e)return n.json;d((function(t){e(t.json)}))},getProxyToServer:function(e,t){return o[e]&&o[e][t]},setEnv:function(e){for(var t in e)n[t]=e[t];l()},_q:{},on:function(e,t,o){this._q[e]||(this._q[e]=[]),-1==this._q[e]?t.apply(o):this._q[e].push([t,o])},run:function(e){for(var t=(this._q[e]||[]).length,o=0;o<t;o++)this._q[e][o][0].apply(this._q[e][o][1]);this._q[e]=-1},waitFor:r},e.fastXDM.Server.prototype.start=function(t,o){if(t.contentWindow)this.caller=t.contentWindow,this.frame=t,e.fastXDM.on("helper",(function(){e.fastXDM.onServerStart(this)}),this);else{var i=this;(o=o||0)<50&&setTimeout((function(){i.start.apply(i,[t,o+1])}),100)}},e.fastXDM.Server.prototype.destroy=function(){delete t[this.key]},e.fastXDM.Server.prototype.append=function(e,t,o){var i=document.createElement("DIV");i.innerHTML='<iframe name="'+this.frameName+'" '+(o||"")+"></iframe>";var n=i.firstChild,r=this;return setTimeout((function(){n.frameBorder="0",t&&u(n,t),e.insertBefore(n,e.firstChild),r.start(n)}),0),n},e.fastXDM.Client.prototype.callMethod=e.fastXDM.Server.prototype.callMethod=function(){for(var t=Array.prototype.slice.call(arguments),o=t.shift(),i=0,n=t.length;i<n;i++)if("function"==typeof t[i]){this.funcsCount=(this.funcsCount||0)+1;var s=t[i],l="_func"+this.funcsCount;this.methods[l]=function(){s.apply(this,arguments),delete this.methods[l]},t[i]={_func:this.funcsCount}}else this.options.safe&&(t[i]=a(t[i],!1));r(this,"caller",(function(){e.fastXDM.on(this.id,(function(){d((function(i){var n=this,r=e.fastXDM.getProxyToServer(this.key,o);r&&(n=r,o=t.shift()),i.send(n,i.json.stringify([o,t]))}),this)}),this)}),this)},e.fastXDM.Client.prototype.isUnsafeMethod=e.fastXDM.Server.prototype.isUnsafeMethod=function(e){return~["%proxy%","%init%"].indexOf(e)||this.options.unsafeMethods&&~this.options.unsafeMethods.indexOf(e)},e.JSON&&"object"==typeof e.JSON&&e.JSON.parse&&e.JSON.stringify&&'{"a":[1,2,3]}'===e.JSON.stringify({a:[1,2,3]}).replace(/ /g,"")?n.json={parse:e.JSON.parse,stringify:e.JSON.stringify}:e.fastXDM._needJSON=!0,e.postMessage?(n.protocol="p",n.send=function(e,t){var o=e.frame?e.frame.contentWindow:e.caller;if(o)try{o.postMessage(e.key+":"+t,"*")}catch(i){window.postMessage.call(o,e.key+":"+t,"*")}},e.addEventListener?e.addEventListener("message",e.fastXDM.onMessage,!1):e.attachEvent("onmessage",e.fastXDM.onMessage),e.fastXDM._needJSON?(e.fastXDM._onlyJSON=!0,s()):l()):s()}function r(e,t,o,i,n){e[t]?o.apply(i):(n=n||0)<1e3&&setTimeout((function(){r(e,t,o,i,n+1)}),0)}function s(t){setTimeout((function(){var o=document.createElement("script");o.type="text/javascript",o.src=t||e.fastXDM.helperUrl,r(document,"body",(function(){document.getElementsByTagName("HEAD")[0].appendChild(o)}))}),0)}function a(e,t){var o;switch(typeof e){case"string":o=t?e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"):e.replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&");break;case"object":if("[object Array]"===Object.prototype.toString.apply(e)){o=[];for(var i=0,n=e.length;i<n;i++)o[i]=a(e[i],t)}else for(var r in o={},e)Object.hasOwnProperty.call(e,r)&&(o[r]=a(e[r],t));break;default:o=e}return o}function d(e,t){n.loaded?e.apply(t,[n]):i.push([t,e])}function l(){n.loaded=!0;for(var e=0,t=i.length;e<t;e++)i[e][1].apply(i[e][0],[n])}function p(t,o,i){d((function(n){var r=n.json.parse(t),s=r[0];if(s){if("p"===n.protocol&&o.options.sameOrigin&&i!==e.origin&&!o.isUnsafeMethod(s))throw Error("Insecure method call.");r[1]||(r[1]=[]);for(var d=0,l=r[1].length;d<l;d++)if(r[1][d]&&r[1][d]._func){var p=r[1][d]._func;r[1][d]=function(){var e=Array.prototype.slice.call(arguments);e.unshift("_func"+p),o.callMethod.apply(o,e)}}else o.options.safe&&(r[1][d]=a(r[1][d],!0));setTimeout((function(){if(!o.methods[s])throw Error("fastXDM: Method "+s+" is undefined");o.methods[s].apply(o,r[1])}),0)}}))}function u(e,t){for(var o in t)e[o]&&"object"==typeof e[o]?u(e[o],t[o]):e[o]=t[o]}}(window),window.VK||(window.VK={}),VK.MD5||(VK.MD5=function(e){var t,o=function(e,t){var o=(65535&e)+(65535&t);return(e>>16)+(t>>16)+(o>>16)<<16|65535&o},i=function(e,t,i,n,r,s){return o(function(e,t){return e<<t|e>>>32-t}(o(o(t,e),o(n,s)),r),i)},n=function(e,t,o,n,r,s,a){return i(t&o|~t&n,e,t,r,s,a)},r=function(e,t,o,n,r,s,a){return i(t&n|o&~n,e,t,r,s,a)},s=function(e,t,o,n,r,s,a){return i(t^o^n,e,t,r,s,a)},a=function(e,t,o,n,r,s,a){return i(o^(t|~n),e,t,r,s,a)};return function(e){for(var t,o="0123456789abcdef",i="",n=0,r=e.length;n<r;n++)t=e.charCodeAt(n),i+=o.charAt(t>>>4&15)+o.charAt(15&t);return i}(function(e){for(var t="",o=0,i=32*e.length;o<i;o+=8)t+=String.fromCharCode(e[o>>5]>>>o%32&255);return t}(function(e,t){var i,d,l,p,u=1732584193,c=-271733879,h=-1732584194,f=271733878;e[t>>5]|=128<<t%32,e[14+(t+64>>>9<<4)]=t;for(var g=0,m=e.length;g<m;g+=16)i=u,d=c,l=h,p=f,u=n(u,c,h,f,e[g+0],7,-680876936),f=n(f,u,c,h,e[g+1],12,-389564586),h=n(h,f,u,c,e[g+2],17,606105819),c=n(c,h,f,u,e[g+3],22,-1044525330),u=n(u,c,h,f,e[g+4],7,-176418897),f=n(f,u,c,h,e[g+5],12,1200080426),h=n(h,f,u,c,e[g+6],17,-1473231341),c=n(c,h,f,u,e[g+7],22,-45705983),u=n(u,c,h,f,e[g+8],7,1770035416),f=n(f,u,c,h,e[g+9],12,-1958414417),h=n(h,f,u,c,e[g+10],17,-42063),c=n(c,h,f,u,e[g+11],22,-1990404162),u=n(u,c,h,f,e[g+12],7,1804603682),f=n(f,u,c,h,e[g+13],12,-40341101),h=n(h,f,u,c,e[g+14],17,-1502002290),c=n(c,h,f,u,e[g+15],22,1236535329),u=r(u,c,h,f,e[g+1],5,-165796510),f=r(f,u,c,h,e[g+6],9,-1069501632),h=r(h,f,u,c,e[g+11],14,643717713),c=r(c,h,f,u,e[g+0],20,-373897302),u=r(u,c,h,f,e[g+5],5,-701558691),f=r(f,u,c,h,e[g+10],9,38016083),h=r(h,f,u,c,e[g+15],14,-660478335),c=r(c,h,f,u,e[g+4],20,-405537848),u=r(u,c,h,f,e[g+9],5,568446438),f=r(f,u,c,h,e[g+14],9,-1019803690),h=r(h,f,u,c,e[g+3],14,-187363961),c=r(c,h,f,u,e[g+8],20,1163531501),u=r(u,c,h,f,e[g+13],5,-1444681467),f=r(f,u,c,h,e[g+2],9,-51403784),h=r(h,f,u,c,e[g+7],14,1735328473),c=r(c,h,f,u,e[g+12],20,-1926607734),u=s(u,c,h,f,e[g+5],4,-378558),f=s(f,u,c,h,e[g+8],11,-2022574463),h=s(h,f,u,c,e[g+11],16,1839030562),c=s(c,h,f,u,e[g+14],23,-35309556),u=s(u,c,h,f,e[g+1],4,-1530992060),f=s(f,u,c,h,e[g+4],11,1272893353),h=s(h,f,u,c,e[g+7],16,-155497632),c=s(c,h,f,u,e[g+10],23,-1094730640),u=s(u,c,h,f,e[g+13],4,681279174),f=s(f,u,c,h,e[g+0],11,-358537222),h=s(h,f,u,c,e[g+3],16,-722521979),c=s(c,h,f,u,e[g+6],23,76029189),u=s(u,c,h,f,e[g+9],4,-640364487),f=s(f,u,c,h,e[g+12],11,-421815835),h=s(h,f,u,c,e[g+15],16,530742520),c=s(c,h,f,u,e[g+2],23,-995338651),u=a(u,c,h,f,e[g+0],6,-198630844),f=a(f,u,c,h,e[g+7],10,1126891415),h=a(h,f,u,c,e[g+14],15,-1416354905),c=a(c,h,f,u,e[g+5],21,-57434055),u=a(u,c,h,f,e[g+12],6,1700485571),f=a(f,u,c,h,e[g+3],10,-1894986606),h=a(h,f,u,c,e[g+10],15,-1051523),c=a(c,h,f,u,e[g+1],21,-2054922799),u=a(u,c,h,f,e[g+8],6,1873313359),f=a(f,u,c,h,e[g+15],10,-30611744),h=a(h,f,u,c,e[g+6],15,-1560198380),c=a(c,h,f,u,e[g+13],21,1309151649),u=a(u,c,h,f,e[g+4],6,-145523070),f=a(f,u,c,h,e[g+11],10,-1120210379),h=a(h,f,u,c,e[g+2],15,718787259),c=a(c,h,f,u,e[g+9],21,-343485551),u=o(u,i),c=o(c,d),h=o(h,l),f=o(f,p);return[u,c,h,f]}(function(e){var t,o,i=Array(e.length>>2);for(t=0,o=i.length;t<o;t++)i[t]=0;for(t=0,o=8*e.length;t<o;t+=8)i[t>>5]|=(255&e.charCodeAt(t/8))<<t%32;return i}(t=function(e){for(var t,o,i="",n=-1,r=e.length;++n<r;)t=e.charCodeAt(n),o=n+1<r?e.charCodeAt(n+1):0,55296<=t&&t<=56319&&56320<=o&&o<=57343&&(t=65536+((1023&t)<<10)+(1023&o),n++),t<=127?i+=String.fromCharCode(t):t<=2047?i+=String.fromCharCode(192|t>>>6&31,128|63&t):t<=65535?i+=String.fromCharCode(224|t>>>12&15,128|t>>>6&63,128|63&t):t<=2097151&&(i+=String.fromCharCode(240|t>>>18&7,128|t>>>12&63,128|t>>>6&63,128|63&t));return i}(e)),8*t.length)))}),VK.extend=function(e,t,o){for(var i in t)(o||void 0===e[i])&&(e[i]=t[i]);return e},VK.extend(VK,{_domain:{base:`https://${getBaseDomain()}`,login:`https://login.${getBaseDomain()}`,main:`https://oauth.${getBaseDomain()}`,api:`https://api.${getBaseDomain()}`}},!0),VK.xdConnectionCallbacks)setTimeout((function(){for(var e;e=VK.xdConnectionCallbacks.pop();)e()}),0),VK.Widgets&&!VK.Widgets._constructor&&(VK.Widgets=!1);else{function obj2qs(e){if(!e)return"";var t=[];for(var o in e)e.hasOwnProperty(o)&&t.push(encodeURIComponent(o)+"="+encodeURIComponent(e[o].toString()||""));return t.length?"?"+t.join("&"):""}VK.extend(VK,{version:1,_apiId:null,_session:null,_userStatus:"unknown",_path:{login:"authorize",proxy:"fxdm_oauth_proxy.html"},_rootId:"vk_api_transport",_nameTransportPath:"",xdReady:!1,access:{FRIENDS:2,PHOTOS:4,AUDIO:8,VIDEO:16,MATCHES:32,QUESTIONS:64,WIKI:128}}),VK.init=function(e){var t,o;if(VK._apiId=null,!e.apiId)throw Error("VK.init() called without an apiId");if(VK._apiId=e.apiId,e.onlyWidgets)return!0;e.nameTransportPath&&""!==e.nameTransportPath&&(VK._nameTransportPath=e.nameTransportPath),(o=document.getElementById(VK._rootId))||((o=document.createElement("div")).id=VK._rootId,(t=document.body).insertBefore(o,t.childNodes[0])),o.style.position="absolute",o.style.top="-10000px";var i=VK.Cookie.load();i&&(VK.Auth._loadState="loaded",VK.Auth.setSession(i,i?"connected":"unknown"))},VK.Cookie||(VK.Cookie={_domain:null,load:function(){var e,t=document.cookie.match("\\bvk_app_"+VK._apiId+"=([^;]*)\\b");if(t){if("oauth"!=(e=this.decode(t[1])).secret)return!1;e.expire=parseInt(e.expire,10),VK.Cookie._domain="."+window.location.hostname}return e},setRaw:function(e,t,o,i){var n;n="vk_app_"+VK._apiId+"="+e;var r=i?(new Date).getTime()+1e3*i:1e3*t;n+=e&&0===t?"":"; expires="+new Date(r).toGMTString(),n+="; path=/",n+=o?"; domain=."+o:"",document.cookie=n,this._domain=o},set:function(e,t){e?this.setRaw(this.encode(e),e.expire,window.location.hostname,(t||{}).time):this.clear()},clear:function(){this.setRaw("",0,this._domain,0)},encode:function(e){var t,o=[];for(t in e)"user"!=t&&o.push(encodeURIComponent(t)+"="+encodeURIComponent(e[t]));return o.sort(),o.join("&")},decode:function(e){var t,o,i={},n=e.split("&");for(t=0;t<n.length;t++)(o=n[t].split("=",2))&&o[0]&&(i[decodeURIComponent(o[0])]=decodeURIComponent(o[1]));return i}}),VK.Api||(VK.Api={_headId:null,_callbacks:{},ie6_7:function(){return VK.Api.ieTested||(VK.Api.isIE6_7=navigator.userAgent.match(/MSIE [6|7]/i),VK.Api.ieTested=!0),VK.Api.isIE6_7},supportCORS:function(){return"withCredentials"in new XMLHttpRequest||"undefined"!=typeof XDomainRequest},makeRequest:function(e,t){var o=VK.Api.createRequest("GET",e);return!!o&&(o.onload=function(){var e=o.responseText;if(200===o.status)t(e);else try{console.error("Open api access error",o.response)}catch(e){}},o.onerror=function(){try{console.error("Open api access error")}catch(e){}},o.send(),!0)},createRequest:function(e,t){var o=new XMLHttpRequest;return"withCredentials"in o?(o.open(e,t,!0),o.withCredentials=!0):"undefined"!=typeof XDomainRequest?((o=new XDomainRequest).open(e,t),o.withCredentials=!0):o=null,o},attachScript:function(e){VK.Api._headId||(VK.Api._headId=document.getElementsByTagName("head")[0]);var t=document.createElement("script");t.type="text/javascript",t.setAttribute("encoding","UTF-8"),t.src=e,VK.Api._headId.appendChild(t)},checkMethod:function(e,t,o,i){var n=e.toLowerCase();if("wall.post"===n){var r,s,a,d,l=/(^https?:\/\/)|(^(poll|album|photo|video|doc|audio|page|note)-?\d+_-?\d+)$/,p=[];t.v||(t.v="5.95"),t.attachments=t.attachments||t.attachment||[],"string"==typeof t.attachments&&(t.attachments=t.attachments.split(","));for(var u=0;u<t.attachments.length;u++){var c=t.attachments[u].trim();l.test(c)&&p.push(c)}return t.attachments=p.length?p:"",r="_"+Math.random().toString(16).substr(2),s={act:"wall_post_box",method:n,widget:4,aid:parseInt(VK._apiId,10),text:t.message||"",method_access:r},(s=VK.extend(s,t)).owner_id=parseInt(t.owner_id||0,10),s.publish_date=t.publish_date||"",a=VK._domain.base+"/al_apps.php",a+=obj2qs(s),VK.UI.popup({url:a,width:560,height:304}),d=setInterval((function(){VK.UI.active.closed&&(clearInterval(d),t.method_access=r,VK.Api.call(e,t,o,i))}),500),!1}return"messages.allowmessagesfromgroup"!=n||(r="_"+Math.random().toString(16).substr(2),a=VK._domain.base+"/widget_allow_messages_from_community.php?act=allow_box&group_id="+parseInt(t.group_id,10)+"&app_id="+parseInt(VK._apiId,10)+"&method_access="+r,VK.UI.popup({url:a,width:560,height:304}),d=setInterval((function(){VK.UI.active.closed&&(clearInterval(d),t.method_access=r,VK.Api.call(e,t,o,i))}),500),!1)},call:function(e,t,o,i){var n,r,s=t||{};if("object"!=typeof s||"function"!=typeof o)return!1;if(t.method_access||t.method_force||VK.Api.checkMethod(e,t,o,i)){if(i||(i=0),"loaded"!=VK.Auth._loadState){var a=function(i){i&&i.session&&(VK.Observer.unsubscribe("auth.loginStatus",a),VK.Api.call(e,t,o))};return VK.Observer.subscribe("auth.loginStatus",a),void VK.Auth.getLoginStatus()}if(VK.Api.queryLength(s)<1500&&!VK.Api.ie6_7()){for(var d=!1,l=parseInt(1e7*Math.random(),10);VK.Api._callbacks[l];)l=parseInt(1e7*Math.random(),10);s.callback="VK.Api._callbacks["+l+"]"}else d=!0;VK._session&&VK._session.sid&&(s.access_token=VK._session.sid),n=VK.Cookie.encode(s),r=function(n){if(!n.error||3!=n.error.error_code&&4!=n.error.error_code&&5!=n.error.error_code)o(n);else{if(i>3)return!1;var r=function(n){VK.Observer.unsubscribe("auth.sessionChange",r),delete t.access_token,n.session&&VK.Api.call(e,t,o,i+1)};VK.Observer.subscribe("auth.sessionChange",r),VK.Auth.getLoginStatus()}d||delete VK.Api._callbacks[l]},d?VK.xdReady?VK.XDM.remote.callMethod("apiCall",e,n,r):(VK.Observer.subscribe("xdm.init",(function(){VK.XDM.remote.callMethod("apiCall",e,n,r)})),VK.XDM.init()):(VK.Api._callbacks[l]=r,VK.Api.attachScript(VK._domain.api+"/method/"+e+"?"+n))}},queryLength:function(e){var t,o=100;for(t in e)o+=t.length+encodeURIComponent(e[t]).length+1;return o}},VK.api=function(e,t,o){VK.Api.call(e,t,o)}),VK.Auth||(VK.Auth={popup:null,lsCb:{},setSession:function(e,t,o,i){var n=!VK._session&&e,r=VK._session&&!e,s=VK._session&&e&&VK._session.mid!=e.mid,a=n||r||VK._session&&e&&VK._session.sid!=e.sid,d=t!=VK._userStatus,l={session:e,status:t,settings:o};return VK._session=e,VK._userStatus=t,VK.Cookie.set(e,i),(a||d||s)&&setTimeout((function(){d&&VK.Observer.publish("auth.statusChange",l),(r||s)&&VK.Observer.publish("auth.logout",l),(n||s)&&VK.Observer.publish("auth.login",l),a&&VK.Observer.publish("auth.sessionChange",l)}),0),l},login:function(e,t){if(!VK._apiId)return!1;var o=VK._domain.main+"/"+VK._path.login+"?client_id="+VK._apiId+"&display=popup&redirect_uri=close.html&response_type=token&openapi=1";t&&parseInt(t,10)>0&&(o+="&scope="+t),VK.Observer.unsubscribe("auth.onLogin"),VK.Observer.subscribe("auth.onLogin",e),VK.UI.popup({width:665,height:370,url:o});var i=function(){VK.Auth.getLoginStatus((function(e){VK.Observer.publish("auth.onLogin",e),VK.Observer.unsubscribe("auth.onLogin")}),!0)};VK.UI.popupOpened=!0;var n=function(){if(!VK.UI.popupOpened)return!1;try{if(!VK.UI.active.top||VK.UI.active.closed)return VK.UI.popupOpened=!1,i(),!0}catch(e){return VK.UI.popupOpened=!1,i(),!0}setTimeout(n,100)};setTimeout(n,100)},logout:function(e){VK.Auth.revokeGrants(e)},revokeGrants:function(e){var t=function(o){VK.Observer.unsubscribe("auth.statusChange",t),e&&e(o)};if(VK.Observer.subscribe("auth.statusChange",t),VK._session&&VK._session.sid){var o=VK._domain.login+"?act=openapi&oauth=1&aid="+parseInt(VK._apiId,10)+"&location="+encodeURIComponent(window.location.hostname)+"&do_logout=1&token="+VK._session.sid;if(VK.Api.supportCORS()){VK.Api.makeRequest(o+"&new=1",(function(){VK.Auth.setSession(null,"unknown")}))}else VK.Api.attachScript(o)}VK.Cookie.clear()},getSession:function(){return VK._session},getLoginStatus:function(cb,force){if(VK._apiId){if(cb){if(!force&&"loaded"==VK.Auth._loadState)return void cb({status:VK._userStatus,session:VK._session});VK.Observer.subscribe("auth.loginStatus",cb)}if(force||"loading"!=VK.Auth._loadState){VK.Auth._loadState="loading";var url=VK._domain.login+"?act=openapi&oauth=1&aid="+parseInt(VK._apiId,10)+"&location="+encodeURIComponent(window.location.hostname);if(VK.Api.supportCORS()){var loginCallback=function(response){if(this.JSON||(this.JSON={}),response="function"!=typeof JSON.parse?eval(response):JSON.parse(response),VK.Auth._loadState="loaded",response&&response.auth){var session={mid:response.user.id,sid:response.access_token,sig:response.sig,secret:response.secret,expire:response.expire};force&&(session.user=response.user);var status="connected"}else{var session=null,status=response.user?"not_authorized":"unknown";VK.Cookie.clear()}VK.Auth.setSession(session,status,!1,response),VK.Observer.publish("auth.loginStatus",{session:session,status:status}),VK.Observer.unsubscribe("auth.loginStatus")};VK.Api.makeRequest(url+"&new=1",loginCallback)}else{for(var rnd=parseInt(1e7*Math.random(),10);VK.Auth.lsCb[rnd];)rnd=parseInt(1e7*Math.random(),10);VK.Auth.lsCb[rnd]=function(e){if(delete VK.Auth.lsCb[rnd],VK.Auth._loadState="loaded",e&&e.auth){var t={mid:e.user.id,sid:e.access_token,sig:e.sig,secret:e.secret,expire:e.expire};force&&(t.user=e.user);var o="connected"}else{t=null,o=e.user?"not_authorized":"unknown";VK.Cookie.clear()}VK.Auth.setSession(t,o,!1,e),VK.Observer.publish("auth.loginStatus",{session:t,status:o}),VK.Observer.unsubscribe("auth.loginStatus")},VK.Api.attachScript(url+"&rnd="+rnd)}}}}}),VK.App||(VK.App={_appOpened:!1,_addToGroupPopup:null,open:function(e,t){!VK.App._appOpened&&VK._apiId&&(VK._session?VK.App._openApp(e,t):VK.Auth.login((function(o){o&&o.session&&VK.App._openApp(e,t)})))},_openApp:function(e,t){var o,i,n=[];if(t=t||{},e&&VK._apiId&&!VK.App._appOpened){if("[object Object]"===Object.prototype.toString.call(t.data))try{t.data=JSON.stringify(t.data)}catch(e){t.data=""}for(var r in o=VK._domain.base+"/apps?act=open_external_app_openapi&aid="+VK._apiId,t.aid=VK._apiId,t){var s="";t.hasOwnProperty(r)&&(void 0!==t[r]&&(s=encodeURIComponent(t[r])),n.push(encodeURIComponent(r)+"="+s))}o+="&url="+e,o+="&q="+encodeURIComponent(n.join("&")),i=VK.Util.Box(o,{},{closeExternalApp:function(){VK.App._result?(VK.Observer.publish("app.done",VK.App._result),VK.App._result=null):VK.Observer.publish("app.closed"),i.hide(),VK.App._appOpened=!1},externalAppDone:function(e,t){t?VK.App._result=e:(VK.Observer.publish("app.done",e),i.hide(),VK.App._appOpened=!1,VK.App._result=null)}}),i.show(),VK.App._appOpened=!0,VK.App._result=null}},addToGroup:function(e){this._addToGroupPopup&&!this._addToGroupPopup.closed||(this._onAddToGroupDone&&VK.Util.removeEvent("message",this._onAddToGroupDone,window),this._onAddToGroupDone=function(e){e.origin===VK._domain.base&&"app.addToGroup"===e.data.method&&(VK.Observer.publish("app.addToGroupDone",{app_id:e.data.app_id,group_ids:e.data.group_ids}),VK.Util.removeEvent("message",this._onAddToGroupDone,window),this._onAddToGroupDone=null)}.bind(this),window.postMessage&&VK.Util.addEvent("message",this._onAddToGroupDone,window),this._addToGroupPopup=VK.UI.popup({url:VK._domain.base+"/add_community_app.php?aid="+e,width:560,height:650}))}})}VK.UI||(VK.UI={active:null,_buttons:[],popup:function(e){var t,o=void 0!==window.screenX?window.screenX:window.screenLeft,i=void 0!==window.screenY?window.screenY:window.screenTop,n=void 0!==window.outerWidth?window.outerWidth:document.body.clientWidth,r=void 0!==window.outerHeight?window.outerHeight:document.body.clientHeight-22,s=e.width,a=e.height,d=parseInt(o+(n-s)/2,10),l=parseInt(i+(r-a)/2.5,10);return t="width="+s+",height="+a+",left="+(d=window.screen&&window.screenX&&screen.left&&screen.left>1e3?0:d)+",top="+l,this.active=window.open(e.url,"vk_openapi",t),this.active},button:function(e,t){var o;"string"==typeof e&&(e=document.getElementById(e)),this._buttons.push(e),index=this._buttons.length-1,o='<table cellspacing="0" cellpadding="0" id="openapi_UI_'+index+'" onmouseover="VK.UI._change(1, '+index+');" onmouseout="VK.UI._change(0, '+index+');" onmousedown="VK.UI._change(2, '+index+');" onmouseup="VK.UI._change(1, '+index+');" style="cursor: pointer; border: 0px; font-family: tahoma, arial, verdana, sans-serif, Lucida Sans; font-size: 10px;"><tr style="vertical-align: middle"><td><div style="border: 1px solid #3b6798;border-radius: 2px 0px 0px 2px;-moz-border-radius: 2px 0px 0px 2px;-webkit-border-radius: 2px 0px 0px 2px;"><div style="border: 1px solid #5c82ab; border-top-color: #7e9cbc; background-color: #6D8DB1; color: #fff; text-shadow: 0px 1px #45688E; height: 15px; padding: 2px 4px 0px 6px;line-height: 13px;">&#1042;&#1086;&#1081;&#1090;&#1080;</div></div></td><td><div style="background: url('+VK._domain.base+'/images/btns.png) 0px -42px no-repeat; width: 21px; height: 21px"></div></td><td><div style="border: 1px solid #3b6798;border-radius: 0px 2px 2px 0px;-moz-border-radius: 0px 2px 2px 0px;-webkit-border-radius: 0px 2px 2px 0px;"><div style="border: 1px solid #5c82ab; border-top-color: #7e9cbc; background-color: #6D8DB1; color: #fff; text-shadow: 0px 1px #45688E; height: 15px; padding: 2px 6px 0px 4px;line-height: 13px;">&#1050;&#1086;&#1085;&#1090;&#1072;&#1082;&#1090;&#1077;</div></div></td></tr></table>',e.innerHTML=o,e.style.width=e.childNodes[0].offsetWidth+"px"},_change:function(e,t){for(var o=document.getElementById("openapi_UI_"+t).rows[0],i=[o.cells[0].firstChild.firstChild,o.cells[2].firstChild.firstChild],n=0;n<2;++n){var r=i[n];0===e?(r.style.backgroundColor="#6D8DB1",r.style.borderTopColor="#7E9CBC",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderBottomColor="#5C82AB"):1==e?(r.style.backgroundColor="#7693B6",r.style.borderTopColor="#88A4C4",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderBottomColor="#6088B4"):2==e&&(r.style.backgroundColor="#6688AD",r.style.borderBottomColor="#7495B8",r.style.borderLeftColor=r.style.borderRightColor=r.style.borderTopColor="#51779F")}0===e||2==e?o.cells[2].firstChild.style.backgroundPosition="0px -42px":1==e&&(o.cells[2].firstChild.style.backgroundPosition="0px -63px")}}),VK.XDM||(VK.XDM={remote:null,init:function(){if(this.remote)return!1;var e=VK._domain.api+"/"+VK._path.proxy;this.remote=new fastXDM.Server({onInit:function(){VK.xdReady=!0,VK.Observer.publish("xdm.init")}}),this.remote.append(document.getElementById(VK._rootId),{src:e})},xdHandler:function(code){try{eval("VK."+code)}catch(e){}}}),VK.Observer||(VK.Observer={_subscribers:function(){return this._subscribersMap||(this._subscribersMap={}),this._subscribersMap},publish:function(e){var t,o,i=Array.prototype.slice.call(arguments),n=(e=i.shift(),this._subscribers()[e]);if(n)for(t=0,o=n.length;t<o;t++)null!=n[t]&&n[t].apply(this,i)},subscribe:function(e,t){var o=this._subscribers();if("function"!=typeof t)return!1;o[e]?o[e].push(t):o[e]=[t]},unsubscribe:function(e,t){var o,i,n=this._subscribers()[e];if(!n)return!1;if("function"==typeof t)for(o=0,i=n.length;o<i;o++)n[o]==t&&(n[o]=null);else delete this._subscribers()[e]}}),VK.Widgets||(VK.Widgets={},VK.Widgets.count=0,VK.Widgets.RPC={},VK.Widgets.loading=function(e,t){e.style.background=t?'url("'+VK._domain.base+'/images/upload.gif") center center no-repeat transparent':"none"},VK.Widgets.Comments=function(e,t,o){var i=VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");t=VK.Util.parseOptions(t);document.getElementById(e);var n,r={limit:t.limit||10,height:t.height||0,mini:void 0===t.mini?"auto":t.mini,norealtime:t.norealtime?1:0},s=function(){return n.callMethod("mouseUp"),!1},a=function(e){n.callMethod("mouseMove",{screenY:e.screenY})};if(t.browse)r.browse=1,r.replies=t.replies||0;else{var d=t.pageUrl||i.url;"/"==d.substr(0,1)&&(d=location.protocol+"//"+location.host+d),VK.extend(r,{page:o||0,status_publish:void 0===t.autoPublish?0:t.autoPublish,attach:void 0===t.attach?"*":t.attach?t.attach:"",url:d,title:t.pageTitle||i.title,description:t.pageDescription||i.description,image:t.pageImage||i.image})}return t.onChange&&(VK.Observer.subscribe("widgets.comments.new_comment",t.onChange),VK.Observer.subscribe("widgets.comments.delete_comment",t.onChange)),VK.Widgets._constructor("widget_comments.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:n}).show()},startDrag:function(){cursorBack=window.document.body.style.cursor,window.document.body.style.cursor="pointer",VK.Util.addEvent("mousemove",a),VK.Util.addEvent("mouseup",s)},stopDrag:function(){window.document.body.style.cursor=cursorBack,VK.Util.removeEvent("mousemove",a),VK.Util.removeEvent("mouseup",s)}},{startHeight:133,minWidth:300},(function(e,t,o){n=o}))},VK.Widgets.CommentsBrowse=function(e,t){return(t=VK.Util.parseOptions(t)).browse=1,VK.Widgets.Comments(e,t)},VK.Widgets.Recommended=function(e,t){VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");var o={limit:(t=VK.Util.parseOptions(t)).limit||5,max:t.max||0,sort:t.sort||"friend_likes",verb:t.verb||0,period:t.period||"week",target:t.target||"parent"};return VK.Widgets._constructor("widget_recommended.php",e,t,o,{},{startHeight:116+47*o.limit-15,minWidth:150})},VK.Widgets.Post=function(e,t,o,i,n){n=VK.Util.parseOptions(n);document.getElementById(e);var r,s,a={owner_id:t,post_id:o,hash:i||"",from:n?n.from:"",mode:n&&n.mode?n.mode:""};return VK.Widgets._constructor("widget_post.php",e,n,a,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:r}).show()},startDrag:function(){s=window.document.body.style.cursor,window.document.body.style.cursor="pointer"},stopDrag:function(){window.document.body.style.cursor=s}},{startHeight:90,minWidth:250},(function(e,t,o){r=o}))},VK.Widgets.TextLive=function(e,t,o,i,n){return n=VK.Util.parseOptions(n),VK.Widgets._constructor("widget_textlive.php",e,n,{textlive_id:t,textpost_id:o,hash:i||""},null,{startHeight:o?176:167,minWidth:320})},VK.Widgets.Like=function(e){if(e)return e;var t=[];return e=function(e,o,i){var n=VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");var r,s,a,d,l,p,u={18:43,20:47,22:51,24:55,30:67},c="full"==(o=VK.extend(VK.Util.parseOptions(o),{allowTransparency:!0})).type||"button"==o.type||"vertical"==o.type||"mini"==o.type?o.type:"full",h="auto"===o.width&&("button"==c||"mini"==c),f=parseInt(o.height,10)||22,g=f&&u[f]?f:22,m=h?153:"full"==c?Math.max(200,o.width||350):"button"==c?180:"mini"==c?115:u[g],_="vertical"==c?2*f+7:f,y={page:i||0,url:o.pageUrl||n.url,type:c,verb:1==o.verb?1:0,color:o.color||"",title:o.pageTitle||n.title,description:o.pageDescription||n.description,image:o.pageImage||n.image,text:(o.text||"").substr(0,140),h:f},b=o.ttHere||!1,v=!1,w=null;function V(e){if((v||e)&&l&&d&&l&&("none"==d.style.display||"yes"==d.getAttribute("vkhidden"))){w&&clearTimeout(w),p&&clearTimeout(p);var t=o.getScrollTop?o.getScrollTop():document.body.scrollTop||document.documentElement.scrollTop||0,i=VK.Util.getXY(r,o.fixed),n=b?0:i[1];t>i[1]-120&&"top"!=o.tooltipPos||"vertical"==c||"bottom"==o.tooltipPos?(d.style.top=n+_+2+"px",l.callMethod("show",!1,c+"_"+g)):(d.style.top=n-128+"px",l.callMethod("show",!0,c+"_"+g)),VK.Util.ss(d,{left:(b?0:i[0])-("full"==c||"button"==c?32:2)+"px",display:"block",opacity:1,filter:"none"}),d.setAttribute("vkhidden","no"),v=!0}}function K(e){v&&!e||!l||(l.callMethod("hide"),a.callMethod("hide"),w=setTimeout((function(){d.style.display="none"}),400))}"vertical"!=c&&"button"!=c&&"mini"!=c||delete o.width,h&&(y.auto_width=1);var x=VK.Widgets._constructor("widget_like.php",e,o,y,{initTooltip:function(e){l=new fastXDM.Server({onInit:e?function(){V()}:function(){},proxy:a,showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[t.width,t.height],{proxy:l}).show()}},!1,{safe:!0}),(d=l.append(b?r:document.body,{src:s.src+"&act=a_like_tooltip",scrolling:"no",allowTransparency:!0,id:s.id+"_tt",style:{position:"absolute",padding:0,display:"none",opacity:.01,filter:"alpha(opacity=1)",border:"0",width:"274px",height:"130px",zIndex:5e3,overflow:"hidden"}})).setAttribute("vkhidden","yes"),d.onmouseover=function(){clearTimeout(p),v=!0},d.onmouseout=function(){clearTimeout(p),v=!1,p=setTimeout((function(){K()}),200)}},showTooltip:V,hideTooltip:K,destroy:function(){a.destroy();try{s.src="about: blank;"}catch(e){}if(s.parentNode.removeChild(s),d){try{d.src="about: blank;"}catch(e){}d.parentNode.removeChild(d)}l&&l.destroy()},showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:a}).show()},proxy:function(){l&&l.callMethod.apply(l,arguments)}},{startHeight:_,minWidth:m},(function(e,t,o){a=o,VK.Util.ss(r=e,{height:_+"px",width:m+"px",position:"relative",clear:"both"}),VK.Util.ss(s=t,{height:_+"px",width:m+"px",overflow:"hidden",zIndex:150}),r.onmouseover=function(){clearTimeout(p),v=!0},r.onmouseout=function(){clearTimeout(p),v=!1,p=setTimeout((function(){K()}),200)}}));return t.push(x),x},e.destroyAll=function(){for(var e=null;t[0];)(e=VK.Widgets.RPC[t.pop()])&&e.methods.destroy()},e}(VK.Widgets.Like),VK.Widgets.Poll=function(e,t,o){var i=VK.Util.getPageData();if(!o)throw Error("No poll id passed");var n,r={poll_id:o,url:(t=VK.Util.parseOptions(t)).pageUrl||i.url||location.href,title:t.pageTitle||i.title,description:t.pageDescription||i.description};return t.preview&&(r.is_preview=1,delete t.preview),void 0!==t.share&&(r.share=t.share?1:0),VK.Widgets._constructor("al_widget_poll.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:n}).show()}},{startHeight:144,minWidth:300},(function(e,t,o){n=o}))},VK.Widgets.App=function(e,t,o){if(!t)throw Error("No app id passed");o=VK.Util.parseOptions(o);var i,n=void 0,r=void 0,s={aid:t,mode:parseInt(o.mode,10)||1};switch(s.mode){case 1:o.width=150,n=251;break;case 2:o.width=o.width?Math.max(200,Math.min(1e4,parseInt(o.width,10))):200,r=n=193;break;case 3:o.width=o.width?Math.max(50,Math.min(1e4,parseInt(o.width,10))):void 0,r=n=o.height={18:18,20:20,22:22,24:24,30:30}[parseInt(o.height,10)||30]}return i=o.width,VK.Widgets._constructor("widget_app.php",e,o,s,{},{startHeight:n,height:r,minWidth:i})},VK.Widgets.Community=VK.Widgets.Group=function(e,t,o){if(t=VK.Util.parseOptions(t),!(o=parseInt(o,10)))throw Error("No group_id passed");t.mode=parseInt(t.mode,10).toString();var i,n,r={gid:o,mode:t.mode?t.mode:"0"},s=3==t.mode?185:1==t.mode?141:0|t.height||290;function a(){return i.callMethod("mouseUp"),!1}function d(e){return i.callMethod("mouseMove",{screenY:e.screenY}),!1}return t.wall&&(r.wall=t.wall),r.color1=t.color1||"",r.color2=t.color2||"",r.color3=t.color3||"",r.class_name=t.class_name||"",t.no_head&&(r.no_head=1),t.no_cover&&(r.no_cover=1),t.wide&&(r.wide=1,(!t.width||t.width<300)&&(t.width=300)),0|!t.width&&(t.width=200),VK.Widgets._constructor("widget_community.php",e,t,r,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()},startDrag:function(){n=window.document.body.style.cursor,window.document.body.style.cursor="pointer",VK.Util.addEvent("mousemove",d),VK.Util.addEvent("mouseup",a)},stopDrag:function(){window.document.body.style.cursor=n,VK.Util.removeEvent("mousemove",d),VK.Util.removeEvent("mouseup",a)},auth:function(){VK.Auth.login(null,1)}},{minWidth:120,startHeight:s},(function(e,t,o){i=o}))},VK.Widgets.Auth=function(e,t){VK.Util.getPageData();if(!VK._apiId)throw Error("VK not initialized. Please use VK.init");return(t=VK.Util.parseOptions(t)).width||(t.width=200),t.type?type=1:type=0,VK.Widgets._constructor("widget_auth.php",e,t,{},{makeAuth:function(e){if(e.session&&(VK.Auth._loadState="loaded",VK.Auth.setSession(e.session,"connected"),VK.Observer.publish("auth.loginStatus",{session:e.session,status:"connected"}),VK.Observer.unsubscribe("auth.loginStatus")),t.onAuth)t.onAuth(e);else{if(t.authUrl)var o=t.authUrl;else o=window.location.href;-1==o.indexOf("?")?o+="?":o+="&";var i=[];for(var n in e)"session"!=n&&i.push(n+"="+decodeURIComponent(e[n]).replace(/&/g,"%26").replace(/\#/g,"%23").replace(/\?/,"%3F"));window.location.href=o+i.join("&")}}},{startHeight:134})},VK.Widgets.Subscribe=function(e,t,o){if(!(o=parseInt(o,10)))throw Error("No owner_id passed");var i,n={oid:o};return(t=VK.Util.parseOptions(t)).mode&&(n.mode=t.mode),t.soft&&(n.soft=t.soft),VK.Widgets._constructor("widget_subscribe.php",e,t,n,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()},auth:function(){VK.Auth.login(null,1)}},{minWidth:220,startHeight:22},(function(e,t,o){i=o}))},VK.Widgets.ContactUs=function(e,t,o){if(!(o=parseInt(o,10)))throw Error("No group or user id passed");t=VK.Util.parseOptions(t);var i={oid:o,height:{18:18,20:20,22:22,24:24,30:30}[parseInt(t.height,10)||24],text:(t.text||"").substr(0,140)};return VK.Widgets._constructor("widget_contactus.php",e,t,i,{},{startHeight:i.height,height:i.height},(function(e,t,o){0}))},VK.Widgets.Bookmarks=function(e,t){t=VK.Util.parseOptions(t);var o={height:{18:18,20:20,22:22,24:24,30:30}[parseInt(t.height,10)||30],url:t.url||window.location.href};return VK.Widgets._constructor("widget_bookmarks.php",e,t,o,{},{startHeight:o.height,height:o.height},(function(e,t,o){0}))},VK.Widgets.Playlist=function(e,t,o,i,n){var r,s={oid:parseInt(t,10),pid:parseInt(o,10),hash:i||""};if(!s.oid)throw Error("No owner id passed");if(!s.pid)throw Error("No playlist id passed");return n=VK.Util.parseOptions(n),VK.Widgets._constructor("widget_playlist.php",e,n,s,{showBox:function(e,t){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:r}).show()}},{minWidth:200},(function(e,t,o){r=o}))},VK.Widgets.Ads=function(e,t,o){t=VK.Util.parseOptions(t),o=o||{};var i,n={},r={},s={},a=document.getElementById(e),d={},l={},p={};for(var u in o){var c=-1!=function(e,t,o){for(var i=o||0,n=(e||[]).length;i<n;i++)if(e[i]==t)return i;return-1}(["hash"],u)?u:"ads_"+u;d[c]=o[u]}if(a&&a.getBoundingClientRect){a.style.width="100%",a.style.height="100%";var h=a.getBoundingClientRect();a.style.width="",a.style.height="",d.ads_ad_unit_width_auto=Math.floor(h.right-h.left),d.ads_ad_unit_height_auto=Math.floor(h.bottom-h.top)}return p.ads_ad_unit_width=100,p.ads_ad_unit_height=100,l.ads_ad_unit_width=parseInt(d.ads_ad_unit_width)||"auto"===d.ads_ad_unit_width&&d.ads_ad_unit_width_auto||p.ads_ad_unit_width,l.ads_ad_unit_height=parseInt(d.ads_ad_unit_height)||"auto"===d.ads_ad_unit_height&&d.ads_ad_unit_height_auto||p.ads_ad_unit_height,d.ads_handler&&(l.ads_handler=d.ads_handler),d.ads_handler_empty_html&&(l.ads_handler_empty_html=d.ads_handler_empty_html),delete d.ads_handler,delete d.ads_handler_empty_html,n.act="ads_web",n.url=location.href,VK.extend(n,d),t.noDefaultParams=!0,t.width=l.ads_ad_unit_width,t.allowTransparency=!0,r.startHeight=l.ads_ad_unit_height,r.minWidth=l.ads_ad_unit_width,s.adsOnInit=function(e,o){VK.Widgets.loading(a,!1),function(e){if(!e)return;for(var t in e){var o=e[t];"ads_ad_unit_width"===t||"ads_ad_unit_height"===t?t in d||(l[t]=parseInt(o)||"auto"===o&&d[t+"_auto"]||p[t]):t in l||(l[t]=o)}}(o),t.onAdsReady&&t.onAdsReady.apply(t.onAdsReady,Array.prototype.slice.call(arguments));!function(e){var t=function(e){var t=!1;try{if(!e)return!1;var o=!1;if(d(e))o=e;else if(l(e)){var i=e.split(".");o=window;for(var n=0,r=i.length;n<r&&(o=o[i[n]]);n++);if(!o){"function"===e.substr(0,8)&&(e="return "+e+";");var s=new Function(e)();d(s)?o=s:t=s}}if(o){var a=Array.prototype.slice.call(arguments,1);t=o.apply(o,a)}}catch(e){try{console.error(e)}catch(e){}}return t;function d(e){return"[object Function]"===Object.prototype.toString.call(e)}function l(e){return"[object String]"===Object.prototype.toString.call(e)}}(l.ads_handler,e);if(e<=0&&!0!==t){try{console.log("VK: ad_unit_id = "+d.ads_ad_unit_id,", errorCode = ",e)}catch(e){}!function(e,t,o){if(!e)return;if(!a)return;t=t?t+"px":"",o=o?o+"px":"";var n='<html><head></head><body style="padding: 0; margin: 0;"><div>'+e+"</div></body></html>",r=document.createElement("iframe");function s(){if(!o)try{var e=r.contentWindow.document.body.firstChild.getBoundingClientRect(),t=Math.ceil(e.bottom-e.top);t&&(r.style.height=t,a.style.height=t)}catch(e){}}r.onload=s,r.id=(i?i.id:"vkwidget-"+Math.round(1e6*Math.random()))+"_ads_html_handler",r.src="about:blank",r.width="100%",r.height="100%",r.scrolling="no",r.frameBorder="0",r.allowTransparency=!0,r.style.overflow="hidden",r.style.width=t,r.style.height=o,a.style.width=t,a.style.height=o,a.appendChild(r),r.contentWindow.vk_ads_html_handler=n,r.src='javascript:window["vk_ads_html_handler"]'}(l.ads_handler_empty_html,l.ads_ad_unit_width,l.ads_ad_unit_height)}}(e)},s.newAdsOnInitLoader=function(e){!function(e){if("vk__adsLight"in window)window.vk__adsLight&&vk__adsLight.userHandlers&&vk__adsLight.userHandlers.onInit&&vk__adsLight.userHandlers.onInit(!1);else{window.vk__adsLight=!1;var t=VK.Api&&VK.Api.attachScript||VK.addScript;if(Array.isArray(e))e.forEach((function(e){t(VK._domain.base+e)}));else{var o=parseInt(e);t(VK._domain.base+jsc("/webl/ads_light.js?")+o)}}}(JSON.parse(e.replace(/&#039;/g,"'").replace(/&quot;/g,'"').replace(/&gt;/g,">").replace(/&lt;/g,"<").replace(/&amp;/g,"&")))},VK.Widgets._constructor("ads_rotate.php",e,t,n,s,r,(function(e,t,o){a=e,i=t}))},VK.Widgets.AllowMessagesFromCommunity=function(e,t,o){if(!(o=parseInt(o,10))||o<0)throw Error("No group id passed");t=VK.Util.parseOptions(t);var i={height:{22:22,24:24,30:30}[parseInt(t.height,10)||24],key:t.key?t.key.substr(0,256):"",group_id:o};return VK.Widgets._constructor("widget_allow_messages_from_community.php",e,t,i,{},{startHeight:i.height,height:i.height},(function(e,t,o){0}))},VK.Widgets.Article=function(e,t,o){var i,n={url:t};return o=VK.Util.parseOptions(o),VK.Widgets._constructor("widget_article.php",e,o,n,{showBox:function(e){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:i}).show()}},{},(function(e,t,o){i=o}))},VK.Widgets.Podcast=function(e,t,o){var i={episode:t};return o=VK.Util.parseOptions(o),VK.Widgets._constructor("widget_podcast.php",e,o,i,{showBox:function(e){VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:rpc}).show()}},{minWidth:300,startHeight:150})},VK.Widgets.CommunityMessages=function(e){if(e)return e;var t={},o={},i={no_button:{width:0,height:0},blue_circle:{width:50,height:50,margin:{bottom:20}}},n={left:{bottom:0,left:20},right:{bottom:0,right:20}};return e=function(r,s,a){(a=VK.Util.parseOptions(a)).width=300,a.height=399,a.expandTimeout=parseInt(a.expandTimeout)||0;var d={gid:s};a.expanded=parseInt(a.expanded)||0,(!a.from_dev&&null!=function(e){if(!window.localStorage)return null;return localStorage.getItem("vk_community_widget_"+e)}("expanded")||a.expanded)&&(a.shown=1),a.shown&&(d.shown=1),a.welcomeScreen||(d.disable_welcome_screen=1),d.ref_source_info=a.ref_source_info,d.ref_source_link=location.href;var l=a.buttonType;-1==Object.keys(i).indexOf(l)&&(l="blue_circle"),"no_button"==l&&(a.disableButtonTooltip=1),a.disableButtonTooltip&&(d.disable_tooltip=1),a.tooltipButtonText&&(d.tooltip_text=a.tooltipButtonText),a.disableNewMessagesSound&&(d.disable_new_messages_sound=1),t[r]&&e.destroy(r),d.domain=document.domain,a.no_loading=1,a.disableNewMessagesSound&&a.disableExpandChatSound||(a.enable_autoplay=1),a.disableExpandChatSound&&(d.disable_expand_chat_sound=1),a.expandTimeout&&(d.expand_timeout=a.expandTimeout),a.__alpha_new_widget&&(d.__alpha_new_widget=1);var p,u,c,h=!1,f=0,g=[0,0];V(a.widgetPosition),d.button_position=a.widgetPosition,window.addEventListener("message",(function(e){var t=document.getElementById(r),o=t.getElementsByTagName("iframe")[0];if(e.data&&"VKReforgedWidgetResize"===e.data.action){var i=e.data.params.width,n=e.data.params.height;o.width=i,o.height=n,t.style.width=i+"px",t.style.height=n+"px",t.style.margin=n>50?"0":"0 0 20px"}e.data&&"VKReforgedWidgetLogout"===e.data.action&&(o.parentNode.removeChild(o),t.style={})}),!1);var m=0,_={};function y(e){clearTimeout(o.titleTimer),o.titleTimer=setTimeout((function(){1==o.changeTitleMode?document.title=o.oldTitle||"":document.title=o.title,o.changeTitleMode=1==o.changeTitleMode?0:1,y()}),e?0:1500)}function b(){a.disableTitleChange||(clearTimeout(o.titleTimer),o.oldTitle?document.title=o.oldTitle:null===o.oldTitle&&(document.title=""),o.title="")}function v(){var e=document.getElementById(r),t=e.getElementsByTagName("iframe")[0];e.style.width=t.width="372px",e.style.height=t.height="399px",e.style.margin="0px 0px 0px 0px"}function w(){var e=document.getElementById(r),t=e.getElementsByTagName("iframe")[0],o=i[l],n=o.width+g[0],s=Math.max(o.height,g[1]);e.style.width=n+"px",e.style.height=s+"px";var a=o.margin?o.margin:{};e.style.margin="0px "+(a.right||0)+"px "+(a.bottom||0)+"px 0px",t&&(t.style.boxShadow="none",t.width=n,t.height=s)}function V(e){p=e,-1==Object.keys(n).indexOf(p)&&(p="right"),K(),x("changeButtonPosition",p)}function K(){var e=document.getElementById(r);if(e){var t=["left","right","top","bottom"];for(var o in t)e.style[t[o]]="";var i=n[p];for(var o in i)e.style[o]=i[o]+"px";m&&(f?v():w())}}function x(){u&&u.callMethod.apply(u,arguments)}function I(e){e&&"[object Object]"===Object.prototype.toString.call(e)||(e={}),null==e.welcomeScreen&&(e.welcomeScreen=a.welcomeScreen);var t=document.getElementById(r).getElementsByTagName("iframe")[0];t&&t.contentWindow.postMessage({handler:"VKReforgedWidgetExpand"},VK._domain.base),clearTimeout(_.showTimer),x("expand",e)}function S(e){x("setSourceData",VK.extend({link:location.href},e))}return t[r]=VK.Widgets._constructor("reforged_widget.php",r,a,d,{onStartLoading:function(){var e=document.getElementById(r);e.style.position="fixed",e.style["z-index"]=1e4,K()},onReady:function(){m=1,a.expandTimeout>0&&!a.shown&&(_.showTimer=setTimeout((function(){I({playSong:!a.disableExpandChatSound,noSaveState:1})}),a.expandTimeout))},showBox:function(e){if(h)try{h.hide();try{h.iframe.src="about: blank;"}catch(e){}h.iframe.parentNode.removeChild(h.iframe)}catch(e){}(h=VK.Util.Box(VK.Util.getAbsUrl(e),[],{proxy:u},{zIndex:10002})).show()},setTooltipSize:function(e){g=e,f||w()},expand:function(e){var t,o;e=e||{},f=1,v(),e.noSaveState||(t="expanded",o=1,window.localStorage&&localStorage.setItem("vk_community_widget_"+t,o))},minimize:function(){setTimeout((function(){var e;f=0,w(),e="expanded",window.localStorage&&localStorage.removeItem("vk_community_widget_"+e)}),120)},canNotWrite:function(e){a.onCanNotWrite&&a.onCanNotWrite(e)},destroy:function(){u.destroy();try{c.src="about: blank;"}catch(e){}try{c.parentNode.removeChild(c)}catch(e){}},fatalError:function(t,o){var i={code:t,widget:2,public_id:o};1903==t&&(i.referrer_domain=document.domain);var n=[];for(var s in i)n.push(s+"="+i[s]);e.destroy(r),VK.Util.Box(VK.Util.getAbsUrl("blank.php?"+n.join("&"))).show()},setPageTitle:function(e){a.disableTitleChange||(b(),o.oldTitle=document.title||null,o.title=e,o.changeTitleMode=0,y(1))},resetPageTitle:function(){b()},newMessage:function(){!document.hasFocus||document.hasFocus()||a.disableNewMessagesSound||x("playNewMsgSong")}},{},(function(e,t,o){u=o,c=t,a.shown?v():w()})),VK.Util.addEvent("popstate",S.bind(this,{}),window),VK.Util.addEvent("hashchange",S.bind(this,{}),window),{expand:I,minimize:function(){x("minimize");var e=document.getElementById(r).getElementsByTagName("iframe")[0];e&&e.contentWindow.postMessage({handler:"VKReforgedWidgetMinimize"},VK._domain.base)},destroy:function(){b();var t=document.getElementById(r).getElementsByTagName("iframe")[0];t&&t.contentWindow.postMessage({handler:"VKReforgedWidgetDestroy"},VK._domain.base),e.destroy(r)},setSourceData:S,changeButtonPosition:V,stopTitleAnimation:b}},e.destroy=function(e){if(t[e]){var o=VK.Widgets.RPC[t[e]];o&&o.methods.destroy(),delete t[e]}},e.expand=function(e){console.log(t[e])},e}(VK.Widgets.CommunityMessages),VK.Widgets._constructor=function(e,t,o,i,n,r,s,a,d){var l=document.getElementById(t);if(a=a||++VK.Widgets.count,!l){if((d=d||0)>10)throw Error("VK.Widgets: object #"+t+" not found.");return setTimeout((function(){VK.Widgets._constructor(e,t,o,i,n,r,s,a,d+1)}),500),a}r=r||{},n=n||{},(o=o||{}).preview&&(i.preview=1,delete o.preview);var p,u,c,h,f,g,m="auto"===o.width?0|(l.clientWidth||l.offsetWidth||r.minWidth):parseInt(o.width||0,10);"silent_code"===i.act?(m="1px",l.style.opacity=0,l.style.display="none",l.style.position="absolute"):m=m?Math.max(r.minWidth||200,Math.min(r.maxWidth||1e4,m))+"px":"100%",l.style.width=m,o.height?(i.height=o.height,l.style.height=o.height+"px"):l.style.height=(r.startHeight||200)+"px","100%"===m&&(i.startWidth=0|(l.clientWidth||l.offsetWidth)),i.url||(i.url=o.pageUrl||location.href.replace(/#.*$/,"")),p=VK._domain.base+"/"+e,u="",o.noDefaultParams||(u+="&app="+(VK._apiId||"0")+"&width="+encodeURIComponent(m)),u+="&_ver="+VK.version,VK._iframeAppWidget&&(i.iframe_app=1);var _=VK.Util.getPageData();for(g in i.url=i.url||_.url||"",i.referrer=i.referrer||document.referrer||"",i.title=i.title||_.title||document.title||"",i){if("title"==g&&i[g].length>80&&(i[g]=i[g].substr(0,80)+"..."),"description"==g&&i[g].length>160&&(i[g]=i[g].substr(0,160)+"..."),"number"==typeof i[g])c=i[g];else try{c=encodeURIComponent(i[g])}catch(e){c=""}u+="&"+g+"="+c}p+="?"+(u+="&"+(+new Date).toString(16)).substr(1),n.onStartLoading&&n.onStartLoading(),o.no_loading||VK.Widgets.loading(l,!0),n.showLoader=function(e){VK.Util.Loader(e)},n.publish=function(){var e=Array.prototype.slice.call(arguments);e.push(a),VK.Observer.publish.apply(VK.Observer,e)},n.onInit=function(){VK.Widgets.loading(l,!1),n.onReady&&n.onReady(),o.onReady&&o.onReady()},n.resize=function(e,t){l.style.height=e+"px";var o=document.getElementById("vkwidget"+a);o&&(o.style.height=e+"px")},n.resizeWidget=function(e,t){e=parseInt(e),t=parseInt(t);var i=document.getElementById("vkwidget"+a);isFinite(e)&&(l.style.width=e+"px",i&&(i.style.width=e+"px")),isFinite(t)&&(l.style.height=t+"px",i&&(i.style.height=t+"px")),o.onResizeWidget&&o.onResizeWidget()},n.updateVersion=function(e){e>1&&VK.Api.attachScript(`//${getBaseDomain()}/js/api/openapi_update.js?`+parseInt(e))},h=VK.Widgets.RPC[a]=new fastXDM.Server(n,(function(e){return!e||(e=e.toLowerCase()).match(/(\.|\/)vk\.(com|ru)($|\/|\?)/)}),{safe:!0});var y={overflow:"hidden"};o.custom_style&&"object"==typeof o.custom_style&&(y=VK.extend(y,o.custom_style));var b="";return o.enable_autoplay&&(b='allow="autoplay"'),f=VK.Widgets.RPC[a].append(l,{src:p,width:-1!=m.indexOf("%")?m:parseInt(m)||m,height:r.startHeight||"100%",scrolling:"no",id:"vkwidget"+a,allowTransparency:o.allowTransparency||!1,style:y},b),s&&setTimeout((function(){s(l,f||l.firstChild,h)}),10),a}),VK.Util||(VK.Util={getPageData:function(){if(!VK._pData){var e,t=document.getElementsByTagName("meta"),o={},i=["description","title","url","image","app_id"];for(var n in t)if(t[n].getAttribute&&t[n].getAttribute&&((e=t[n].getAttribute("name"))||(e=t[n].getAttribute("property"))))for(var r in i)e!=i[r]&&e!="og:"+i[r]&&e!="vk:"+i[r]||(o[i[r]]=t[n].content);o.app_id&&!VK._apiId&&(VK._apiId=o.app_id),o.title=o.title||document.title||"",o.description=o.description||"",o.image=o.image||"",!o.url&&VK._iframeAppWidget&&VK._apiId&&(o.url="/app"+VK._apiId,VK._browserHash&&(o.url+=VK._browserHash));var s=location.href.replace(/#.*$/,"");o.url&&o.url.indexOf(s)||(o.url=s),VK._pData=o}return VK._pData},getStyle:function(e,t){var o,i=document.defaultView||window;if(i.getComputedStyle){t=t.replace(/([A-Z])/g,"-$1").toLowerCase();var n=i.getComputedStyle(e,null);n&&(o=n.getPropertyValue(t))}else if(e.currentStyle){var r=t.replace(/\-(\w)/g,(function(e,t){return t.toUpperCase()}));o=e.currentStyle[t]||e.currentStyle[r]}return o},getAbsUrl:function(e){return VK._domain.base+"/"+e.replace(/^\s*\/?/,"")},parseOptions:function(e){return"[object Object]"!==Object.prototype.toString.call(e)&&(e={}),e.base_domain&&(VK._domain.base=e.base_domain),e.login_domain&&(VK._domain.login=e.login_domain),e},getXY:function(e,t){if(e&&void 0!==e){var o=0,i=0;if(void 0!==e.getBoundingClientRect){var n=e.getBoundingClientRect();o=n.left,i=n.top,t=!0}else if(e.offsetParent)do{o+=e.offsetLeft,i+=e.offsetTop,t&&(o-=e.scrollLeft,i-=e.scrollTop)}while(e=e.offsetParent);return t&&(i+=window.pageYOffset||window.scrollNode&&scrollNode.scrollTop||document.documentElement.scrollTop,o+=window.pageXOffset||window.scrollNode&&scrollNode.scrollLeft||document.documentElement.scrollLeft),[o,i]}},Loader:function e(t){e.loader||((e.loader=document.createElement("DIV")).innerHTML='<style type="text/css">        @-webkit-keyframes VKWidgetsLoaderKeyframes {0%{opacity: 0.2;}30%{opacity: 1;}100%{opacity: 0.2;}}        @keyframes VKWidgetsLoaderKeyframes {0%{opacity: 0.2;}30%{opacity: 1;}100%{opacity: 0.2;}}        .VKWidgetsLoader div {width: 7px;height: 7px;-webkit-border-radius: 50%;-khtml-border-radius: 50%;-moz-border-radius: 50%;border-radius: 50%;background: #fff;top: 21px;position: absolute;z-index: 2;-o-transition: opacity 350ms linear; transition: opacity 350ms linear;opacity: 0.2;-webkit-animation-duration: 750ms;-o-animation-duration: 750ms;animation-duration: 750ms;-webkit-animation-name: VKWidgetsLoaderKeyframes;-o-animation-name: VKWidgetsLoaderKeyframes;animation-name: VKWidgetsLoaderKeyframes;-webkit-animation-iteration-count: infinite;-o-animation-iteration-count: infinite;animation-iteration-count: infinite;-webkit-transform: translateZ(0);transform: translateZ(0);}</style><div class="VKWidgetsLoader" style="position: fixed;left: 50%;top: 50%;margin: -25px -50px;z-index: 1002;height: 50px;width: 100px;"><div style="left: 36px;-webkit-animation-delay: 0ms;-o-animation-delay: 0ms;animation-delay: 0ms;"></div><div style="left: 47px;-webkit-animation-delay: 180ms;-o-animation-delay: 180ms;animation-delay: 180ms;"></div><div style="left: 58px;-webkit-animation-delay: 360ms;-o-animation-delay: 360ms;animation-delay: 360ms;"></div><span style="display: block;background-color: #000;-webkit-border-radius: 4px;-khtml-border-radius: 4px;-moz-border-radius: 4px;border-radius: 4px;-webkit-box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);-moz-box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.35);position: absolute;left: 0;top: 0;bottom: 0; right: 0;z-index: 1;opacity: 0.7;"></span></div>',document.body.insertBefore(e.loader,document.body.firstChild)),e.loader.style.display=t?"block":"none"},Box:function(e,t,o,i){o=o||{};var n=document.body.style.overflow;VK.Util.Loader(!0);var r=/(^|\.)(vk\.(com|ru)|vkontakte\.ru)$/.test(location.hostname),s=new fastXDM.Server(VK.extend(o,{onInit:function(){a.style.background="transparent",a.style.visibility="visible",document.body.style.overflow="hidden",a.setAttribute("allowfullscreen",1),r&&(document.body.className+=" layers_shown"),VK.Util.Loader()},hide:function(){a.style.display="none"},tempHide:function(){a.style.left="-10000px",a.style.top="-10000px",a.style.width="10px",a.style.height="10px",r&&(document.body.className=document.body.className.replace(/\b\s*?layers_shown\s*\b/," ")),document.body.style.overflow=n},destroy:function(){try{a.src="about: blank;"}catch(e){}a.parentNode.removeChild(a),r&&(document.body.className=document.body.className.replace(/\b\s*?layers_shown\s*\b/," ")),document.body.style.overflow=n},resize:function(e,t){}},!0),!1,{safe:!0}),a=s.append(document.body,{src:e.replace(/&amp;/g,"&"),scrolling:"no",allowTransparency:!0,style:{position:"fixed",left:0,top:0,zIndex:i&&i.zIndex||1002,background:VK._domain.base+"/images/upload.gif center center no-repeat transparent",padding:"0",border:"0",width:"100%",height:"100%",overflow:"hidden",visibility:"hidden"}});return{show:function(e,t){a.style.display="block",document.body.style.overflow="hidden"},hide:function(){a.style.display="none",document.body.style.overflow=n},iframe:a,rpc:s}},addEvent:function(e,t,o){(o=o||window.document).addEventListener?o.addEventListener(e,t,!1):o.attachEvent&&o.attachEvent("on"+e,t)},removeEvent:function(e,t,o){(o=o||window.document).removeEventListener?o.removeEventListener(e,t,!1):o.detachEvent&&o.detachEvent("on"+e,t)},ss:function(e,t){VK.extend(e.style,t,!0)}}),VK.Retargeting||(VK.Retargeting={pixelCode:null,Init:function(e){return this.pixelCode=e,this},Event:function(e){if(this.pixelCode)if(IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,event:e});else{var t=VK.Util.getPageData(),o=t.url.substr(0,500),i=t.title&&t.title.substr(0,500)||"";(window.Image?new Image:document.createElement("img")).src=VK._domain.base+"/rtrg?p="+this.pixelCode+(e?"&event="+encodeURIComponent(e):"")+(o?"&metatag_url="+encodeURIComponent(o):"")+(i?"&metatag_title="+encodeURIComponent(i):"")}},Hit:function(){this.Event()},Add:function(e){this.pixelCode&&e&&(IS_BRIDGE_AVAILABLE?_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,target_group_id:e}):(window.Image?new Image:document.createElement("img")).src=VK._domain.base+"/rtrg?p="+this.pixelCode+"&audience="+encodeURIComponent(e))},ProductEvent:function(e,t,o,i){if(this.pixelCode&&t&&e){var n=!0;void 0!==(i=i||{}).show_errors&&(n=!!i.show_errors);var r="0";void 0!==i.errors_ignore&&(r=i.errors_ignore?"1":"0");var s=VK.Util.getPageData(),a=s.url.substr(0,500),d=s.title&&s.title.substr(0,500)||"",l=VK._domain.base+"/rtrg",p=o?JSON.stringify(o):"",u={p:this.pixelCode,products_event:t,price_list_id:e,e:"1",i:r,metatag_url:a,metatag_title:d};if(p&&(u.products_params=p),IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppRetargetingPixel",{pixel_code:this.pixelCode,price_list_id:e,products_event:t,products_params:p});else{var c=l+"?"+Object.keys(u).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(u[e])})).join("&");VK.Api.makeRequest(c,this.onDone.bind(this,n))}}},onDone:function(e,t){if(t&&e){var o;try{o=JSON.parse(t)}catch(e){return}o&&o.errors&&this.showErrors(o.errors)}},showErrors:function(e){if(e||e.length){var t="VK Pixel Error ("+this.pixelCode+"): ";if("string"!=typeof e){var o=e.length;if(o)for(var i=0;i<o;i++)console.error(t+e[i])}else console.error(t+e)}}}),VK.Pixel||(VK.Pixel=function(e){if(this.constructor!=VK.Pixel)throw Error("VK.Pixel was called without 'new' operator");return VK.extend(this,VK.Retargeting),this.pixelCode=e,this.Goal=function(t,o){return VK.Goal(t,o,e)},this}),VK.Goal||(VK.Goal=function(e,t,o){var i=o||VK.Retargeting.pixelCode;if(i&&"string"==typeof i){var n=e||"conversion";if("string"==typeof n){var r=(t||{}).value||0;if("string"==typeof r){if(parseFloat(r).toString()!==r)return void console.error("Error argument: parameters.value not a number or valid number string")}else if("number"!=typeof r)return void console.error("Error argument: parameters.value not a number or valid number string");if(IS_BRIDGE_AVAILABLE)_bridgeSend("VKWebAppConversionHit",{pixel_code:i,conversion_event:n,conversion_value:r});else{var s=VK._domain.base+"/rtrg",a={p:i,e:"1",c:n,v:r},d=s+"?"+Object.keys(a).map((function(e){return encodeURIComponent(e)+"="+encodeURIComponent(a[e])})).join("&");VK.Api.makeRequest(d,VK.Retargeting.onDone.bind(VK.Retargeting,!0))}}else console.error("Error argument: conversionName not a string")}else console.error("Error argument: pixelCode not a string. Use VK.Retargeting.Init or VK.Pixel to initialize pixel")}),window.vkAsyncInit&&setTimeout(vkAsyncInit,0),window.vkAsyncInitCallbacks&&vkAsyncInitCallbacks.length&&setTimeout((function(){for(var e;e=vkAsyncInitCallbacks.pop();)try{e()}catch(e){try{console.error(e)}catch(e){}}}),0);try{stManager.done("api/openapi.js")}catch(e){}
;

  VK.Widgets.CommunityMessages("vk_community_messages", 214148353, {disableButtonTooltip: 1, disableExpandChatSound: 1});

;

			window.RS_MODULES = window.RS_MODULES || {};
			window.RS_MODULES.modules = window.RS_MODULES.modules || {};
			window.RS_MODULES.waiting = window.RS_MODULES.waiting || [];
			window.RS_MODULES.defered = true;
			window.RS_MODULES.moduleWaiting = window.RS_MODULES.moduleWaiting || {};
			window.RS_MODULES.type = 'compiled';
		
;
jQuery(function(){
            jQuery("#registerform,.form-tab-rcl").on("keyup","#secondary-pass-user",function(){
                let notice = "Пароли совпадают!";
                if(jQuery("#primary-pass-user").val() !== jQuery(this).val()){
					notice = "Пароли не совпадают!";
                }
                jQuery("#notice-chek-password").html("<span class='login-error'>" + notice + "</span>");
            });});
        
;
rcl_do_action("rcl_login_form","floatform")
;

		(function () {
			var c = document.body.className;
			c = c.replace(/woocommerce-no-js/, 'woocommerce-js');
			document.body.className = c;
		})();
	
;

const eio_lazy_vars = {"bg_min_dpr":1.100000000000000088817841970012523233890533447265625,"exactdn_domain":"","safe_paths":["\/wp-content\/plugins","\/wp-content\/themes","\/wp-includes\/"],"safe_domains":["welans.ru","www.welans.ru"],"skip_autoscale":0,"threshold":0,"use_dpr":1};Object.freeze(eio_lazy_vars);
//# sourceURL=eio-lazy-load-js-before

;
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;"undefined"!=typeof window?t=window:"undefined"!=typeof global?t=global:"undefined"!=typeof self&&(t=self),t.sbjs=e()}}(function(){return function e(t,r,a){function n(s,o){if(!r[s]){if(!t[s]){var c="function"==typeof require&&require;if(!o&&c)return c(s,!0);if(i)return i(s,!0);var u=new Error("Cannot find module '"+s+"'");throw u.code="MODULE_NOT_FOUND",u}var p=r[s]={exports:{}};t[s][0].call(p.exports,function(e){var r=t[s][1][e];return n(r||e)},p,p.exports,e,t,r,a)}return r[s].exports}for(var i="function"==typeof require&&require,s=0;s<a.length;s++)n(a[s]);return n}({1:[function(e,t,r){"use strict";var a=e("./init"),n={init:function(e){this.get=a(e),e&&e.callback&&"function"==typeof e.callback&&e.callback(this.get)}};t.exports=n},{"./init":6}],2:[function(e,t,r){"use strict";var a=e("./terms"),n=e("./helpers/utils"),i={containers:{current:"sbjs_current",current_extra:"sbjs_current_add",first:"sbjs_first",first_extra:"sbjs_first_add",session:"sbjs_session",udata:"sbjs_udata",promocode:"sbjs_promo"},service:{migrations:"sbjs_migrations"},delimiter:"|||",aliases:{main:{type:"typ",source:"src",medium:"mdm",campaign:"cmp",content:"cnt",term:"trm",id:"id",platform:"plt",format:"fmt",tactic:"tct"},extra:{fire_date:"fd",entrance_point:"ep",referer:"rf"},session:{pages_seen:"pgs",current_page:"cpg"},udata:{visits:"vst",ip:"uip",agent:"uag"},promo:"code"},pack:{main:function(e){return i.aliases.main.type+"="+e.type+i.delimiter+i.aliases.main.source+"="+e.source+i.delimiter+i.aliases.main.medium+"="+e.medium+i.delimiter+i.aliases.main.campaign+"="+e.campaign+i.delimiter+i.aliases.main.content+"="+e.content+i.delimiter+i.aliases.main.term+"="+e.term+i.delimiter+i.aliases.main.id+"="+e.id+i.delimiter+i.aliases.main.platform+"="+e.platform+i.delimiter+i.aliases.main.format+"="+e.format+i.delimiter+i.aliases.main.tactic+"="+e.tactic},extra:function(e){return i.aliases.extra.fire_date+"="+n.setDate(new Date,e)+i.delimiter+i.aliases.extra.entrance_point+"="+document.location.href+i.delimiter+i.aliases.extra.referer+"="+(document.referrer||a.none)},user:function(e,t){return i.aliases.udata.visits+"="+e+i.delimiter+i.aliases.udata.ip+"="+t+i.delimiter+i.aliases.udata.agent+"="+navigator.userAgent},session:function(e){return i.aliases.session.pages_seen+"="+e+i.delimiter+i.aliases.session.current_page+"="+document.location.href},promo:function(e){return i.aliases.promo+"="+n.setLeadingZeroToInt(n.randomInt(e.min,e.max),e.max.toString().length)}}};t.exports=i},{"./helpers/utils":5,"./terms":9}],3:[function(e,t,r){"use strict";var a=e("../data").delimiter;t.exports={useBase64:!1,setBase64Flag:function(e){this.useBase64=e},encodeData:function(e){return encodeURIComponent(e).replace(/\!/g,"%21").replace(/\~/g,"%7E").replace(/\*/g,"%2A").replace(/\'/g,"%27").replace(/\(/g,"%28").replace(/\)/g,"%29")},decodeData:function(e){try{return decodeURIComponent(e).replace(/\%21/g,"!").replace(/\%7E/g,"~").replace(/\%2A/g,"*").replace(/\%27/g,"'").replace(/\%28/g,"(").replace(/\%29/g,")")}catch(t){try{return unescape(e)}catch(e){return""}}},set:function(e,t,r,a,n){var i,s;if(r){var o=new Date;o.setTime(o.getTime()+60*r*1e3),i="; expires="+o.toGMTString()}else i="";s=a&&!n?";domain=."+a:"";var c=this.encodeData(t);this.useBase64&&(c=btoa(c).replace(/=+$/,"")),document.cookie=this.encodeData(e)+"="+c+i+s+"; path=/"},get:function(e){for(var t=this.encodeData(e)+"=",r=document.cookie.split(";"),a=0;a<r.length;a++){for(var n=r[a];" "===n.charAt(0);)n=n.substring(1,n.length);if(0===n.indexOf(t)){var i=n.substring(t.length,n.length);if(/^[A-Za-z0-9+/]+$/.test(i))try{i=atob(i.padEnd(4*Math.ceil(i.length/4),"="))}catch(e){}return this.decodeData(i)}}return null},destroy:function(e,t,r){this.set(e,"",-1,t,r)},parse:function(e){var t=[],r={};if("string"==typeof e)t.push(e);else for(var n in e)e.hasOwnProperty(n)&&t.push(e[n]);for(var i=0;i<t.length;i++){var s;r[this.unsbjs(t[i])]={},s=this.get(t[i])?this.get(t[i]).split(a):[];for(var o=0;o<s.length;o++){var c=s[o].split("="),u=c.splice(0,1);u.push(c.join("=")),r[this.unsbjs(t[i])][u[0]]=this.decodeData(u[1])}}return r},unsbjs:function(e){return e.replace("sbjs_","")}}},{"../data":2}],4:[function(e,t,r){"use strict";t.exports={parse:function(e){for(var t=this.parseOptions,r=t.parser[t.strictMode?"strict":"loose"].exec(e),a={},n=14;n--;)a[t.key[n]]=r[n]||"";return a[t.q.name]={},a[t.key[12]].replace(t.q.parser,function(e,r,n){r&&(a[t.q.name][r]=n)}),a},parseOptions:{strictMode:!1,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}},getParam:function(e){for(var t={},r=(e||window.location.search.substring(1)).split("&"),a=0;a<r.length;a++){var n=r[a].split("=");if(void 0===t[n[0]])t[n[0]]=n[1];else if("string"==typeof t[n[0]]){var i=[t[n[0]],n[1]];t[n[0]]=i}else t[n[0]].push(n[1])}return t},getHost:function(e){return this.parse(e).host.replace("www.","")}}},{}],5:[function(e,t,r){"use strict";t.exports={escapeRegexp:function(e){return e.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&")},setDate:function(e,t){var r=e.getTimezoneOffset()/60,a=e.getHours(),n=t||0===t?t:-r;return e.setHours(a+r+n),e.getFullYear()+"-"+this.setLeadingZeroToInt(e.getMonth()+1,2)+"-"+this.setLeadingZeroToInt(e.getDate(),2)+" "+this.setLeadingZeroToInt(e.getHours(),2)+":"+this.setLeadingZeroToInt(e.getMinutes(),2)+":"+this.setLeadingZeroToInt(e.getSeconds(),2)},setLeadingZeroToInt:function(e,t){for(var r=e+"";r.length<t;)r="0"+r;return r},randomInt:function(e,t){return Math.floor(Math.random()*(t-e+1))+e}}},{}],6:[function(e,t,r){"use strict";var a=e("./data"),n=e("./terms"),i=e("./helpers/cookies"),s=e("./helpers/uri"),o=e("./helpers/utils"),c=e("./params"),u=e("./migrations");t.exports=function(e){var t,r,p,m,f,l,d,g,h,v,_,y,b,x=c.fetch(e),k=s.getParam(),w=x.domain.host,q=x.domain.isolate,I=x.lifetime;function j(e){switch(e){case n.traffic.utm:t=n.traffic.utm,r=void 0!==k.utm_source?k.utm_source:void 0!==k.gclid?"google":void 0!==k.yclid?"yandex":n.none,p=void 0!==k.utm_medium?k.utm_medium:void 0!==k.gclid?"cpc":void 0!==k.yclid?"cpc":n.none,m=void 0!==k.utm_campaign?k.utm_campaign:void 0!==k[x.campaign_param]?k[x.campaign_param]:void 0!==k.gclid?"google_cpc":void 0!==k.yclid?"yandex_cpc":n.none,f=void 0!==k.utm_content?k.utm_content:void 0!==k[x.content_param]?k[x.content_param]:n.none,d=k.utm_id||n.none,g=k.utm_source_platform||n.none,h=k.utm_creative_format||n.none,v=k.utm_marketing_tactic||n.none,l=void 0!==k.utm_term?k.utm_term:void 0!==k[x.term_param]?k[x.term_param]:function(){var e=document.referrer;if(k.utm_term)return k.utm_term;if(!(e&&s.parse(e).host&&s.parse(e).host.match(/^(?:.*\.)?yandex\..{2,9}$/i)))return!1;try{return s.getParam(s.parse(document.referrer).query).text}catch(e){return!1}}()||n.none;break;case n.traffic.organic:t=n.traffic.organic,r=r||s.getHost(document.referrer),p=n.referer.organic,m=n.none,f=n.none,l=n.none,d=n.none,g=n.none,h=n.none,v=n.none;break;case n.traffic.referral:t=n.traffic.referral,r=r||s.getHost(document.referrer),p=p||n.referer.referral,m=n.none,f=s.parse(document.referrer).path,l=n.none,d=n.none,g=n.none,h=n.none,v=n.none;break;case n.traffic.typein:t=n.traffic.typein,r=x.typein_attributes.source,p=x.typein_attributes.medium,m=n.none,f=n.none,l=n.none,d=n.none,g=n.none,h=n.none,v=n.none;break;default:t=n.oops,r=n.oops,p=n.oops,m=n.oops,f=n.oops,l=n.oops,d=n.oops,g=n.oops,h=n.oops,v=n.oops}var i={type:t,source:r,medium:p,campaign:m,content:f,term:l,id:d,platform:g,format:h,tactic:v};return a.pack.main(i)}function R(e){var t=document.referrer;switch(e){case n.traffic.organic:return!!t&&H(t)&&function(e){var t=new RegExp("^(?:.*\\.)?"+o.escapeRegexp("yandex")+"\\..{2,9}$"),a=new RegExp(".*"+o.escapeRegexp("text")+"=.*"),n=new RegExp("^(?:www\\.)?"+o.escapeRegexp("google")+"\\..{2,9}$");if(s.parse(e).query&&s.parse(e).host.match(t)&&s.parse(e).query.match(a))return r="yandex",!0;if(s.parse(e).host.match(n))return r="google",!0;if(!s.parse(e).query)return!1;for(var i=0;i<x.organics.length;i++){if(s.parse(e).host.match(new RegExp("^(?:.*\\.)?"+o.escapeRegexp(x.organics[i].host)+"$","i"))&&s.parse(e).query.match(new RegExp(".*"+o.escapeRegexp(x.organics[i].param)+"=.*","i")))return r=x.organics[i].display||x.organics[i].host,!0;if(i+1===x.organics.length)return!1}}(t);case n.traffic.referral:return!!t&&H(t)&&function(e){if(!(x.referrals.length>0))return r=s.getHost(e),!0;for(var t=0;t<x.referrals.length;t++){if(s.parse(e).host.match(new RegExp("^(?:.*\\.)?"+o.escapeRegexp(x.referrals[t].host)+"$","i")))return r=x.referrals[t].display||x.referrals[t].host,p=x.referrals[t].medium||n.referer.referral,!0;if(t+1===x.referrals.length)return r=s.getHost(e),!0}}(t);default:return!1}}function H(e){if(x.domain){if(q)return s.getHost(e)!==s.getHost(w);var t=new RegExp("^(?:.*\\.)?"+o.escapeRegexp(w)+"$","i");return!s.getHost(e).match(t)}return s.getHost(e)!==s.getHost(document.location.href)}function D(){i.set(a.containers.current_extra,a.pack.extra(x.timezone_offset),I,w,q),i.get(a.containers.first_extra)||i.set(a.containers.first_extra,a.pack.extra(x.timezone_offset),I,w,q)}return i.setBase64Flag(x.base64),u.go(I,w,q),i.set(a.containers.current,function(){var e;if(void 0!==k.utm_source||void 0!==k.utm_medium||void 0!==k.utm_campaign||void 0!==k.utm_content||void 0!==k.utm_term||void 0!==k.utm_id||void 0!==k.utm_source_platform||void 0!==k.utm_creative_format||void 0!==k.utm_marketing_tactic||void 0!==k.gclid||void 0!==k.yclid||void 0!==k[x.campaign_param]||void 0!==k[x.term_param]||void 0!==k[x.content_param])D(),e=j(n.traffic.utm);else if(R(n.traffic.organic))D(),e=j(n.traffic.organic);else if(!i.get(a.containers.session)&&R(n.traffic.referral))D(),e=j(n.traffic.referral);else{if(i.get(a.containers.first)||i.get(a.containers.current))return i.get(a.containers.current);D(),e=j(n.traffic.typein)}return e}(),I,w,q),i.get(a.containers.first)||i.set(a.containers.first,i.get(a.containers.current),I,w,q),i.get(a.containers.udata)?(_=parseInt(i.parse(a.containers.udata)[i.unsbjs(a.containers.udata)][a.aliases.udata.visits])||1,_=i.get(a.containers.session)?_:_+1,y=a.pack.user(_,x.user_ip)):(_=1,y=a.pack.user(_,x.user_ip)),i.set(a.containers.udata,y,I,w,q),i.get(a.containers.session)?(b=parseInt(i.parse(a.containers.session)[i.unsbjs(a.containers.session)][a.aliases.session.pages_seen])||1,b+=1):b=1,i.set(a.containers.session,a.pack.session(b),x.session_length,w,q),x.promocode&&!i.get(a.containers.promocode)&&i.set(a.containers.promocode,a.pack.promo(x.promocode),I,w,q),i.parse(a.containers)}},{"./data":2,"./helpers/cookies":3,"./helpers/uri":4,"./helpers/utils":5,"./migrations":7,"./params":8,"./terms":9}],7:[function(e,t,r){"use strict";var a=e("./data"),n=e("./helpers/cookies");t.exports={go:function(e,t,r){var i,s=this.migrations,o={l:e,d:t,i:r};if(n.get(a.containers.first)||n.get(a.service.migrations)){if(!n.get(a.service.migrations))for(i=0;i<s.length;i++)s[i].go(s[i].id,o)}else{var c=[];for(i=0;i<s.length;i++)c.push(s[i].id);var u="";for(i=0;i<c.length;i++)u+=c[i]+"=1",i<c.length-1&&(u+=a.delimiter);n.set(a.service.migrations,u,o.l,o.d,o.i)}},migrations:[{id:"1418474375998",version:"1.0.0-beta",go:function(e,t){var r=e+"=1",i=e+"=0",s=function(e,t,r){return t||r?e:a.delimiter};try{var o=[];for(var c in a.containers)a.containers.hasOwnProperty(c)&&o.push(a.containers[c]);for(var u=0;u<o.length;u++)if(n.get(o[u])){var p=n.get(o[u]).replace(/(\|)?\|(\|)?/g,s);n.destroy(o[u],t.d,t.i),n.destroy(o[u],t.d,!t.i),n.set(o[u],p,t.l,t.d,t.i)}n.get(a.containers.session)&&n.set(a.containers.session,a.pack.session(0),t.l,t.d,t.i),n.set(a.service.migrations,r,t.l,t.d,t.i)}catch(e){n.set(a.service.migrations,i,t.l,t.d,t.i)}}}]}},{"./data":2,"./helpers/cookies":3}],8:[function(e,t,r){"use strict";var a=e("./terms"),n=e("./helpers/uri");t.exports={fetch:function(e){var t=e||{},r={};if(r.lifetime=this.validate.checkFloat(t.lifetime)||6,r.lifetime=parseInt(30*r.lifetime*24*60),r.session_length=this.validate.checkInt(t.session_length)||30,r.timezone_offset=this.validate.checkInt(t.timezone_offset),r.base64=t.base64||!1,r.campaign_param=t.campaign_param||!1,r.term_param=t.term_param||!1,r.content_param=t.content_param||!1,r.user_ip=t.user_ip||a.none,t.promocode?(r.promocode={},r.promocode.min=parseInt(t.promocode.min)||1e5,r.promocode.max=parseInt(t.promocode.max)||999999):r.promocode=!1,t.typein_attributes&&t.typein_attributes.source&&t.typein_attributes.medium?(r.typein_attributes={},r.typein_attributes.source=t.typein_attributes.source,r.typein_attributes.medium=t.typein_attributes.medium):r.typein_attributes={source:"(direct)",medium:"(none)"},t.domain&&this.validate.isString(t.domain)?r.domain={host:t.domain,isolate:!1}:t.domain&&t.domain.host?r.domain=t.domain:r.domain={host:n.getHost(document.location.hostname),isolate:!1},r.referrals=[],t.referrals&&t.referrals.length>0)for(var i=0;i<t.referrals.length;i++)t.referrals[i].host&&r.referrals.push(t.referrals[i]);if(r.organics=[],t.organics&&t.organics.length>0)for(var s=0;s<t.organics.length;s++)t.organics[s].host&&t.organics[s].param&&r.organics.push(t.organics[s]);return r.organics.push({host:"bing.com",param:"q",display:"bing"}),r.organics.push({host:"yahoo.com",param:"p",display:"yahoo"}),r.organics.push({host:"about.com",param:"q",display:"about"}),r.organics.push({host:"aol.com",param:"q",display:"aol"}),r.organics.push({host:"ask.com",param:"q",display:"ask"}),r.organics.push({host:"globososo.com",param:"q",display:"globo"}),r.organics.push({host:"go.mail.ru",param:"q",display:"go.mail.ru"}),r.organics.push({host:"rambler.ru",param:"query",display:"rambler"}),r.organics.push({host:"tut.by",param:"query",display:"tut.by"}),r.referrals.push({host:"t.co",display:"twitter.com"}),r.referrals.push({host:"plus.url.google.com",display:"plus.google.com"}),r},validate:{checkFloat:function(e){return!(!e||!this.isNumeric(parseFloat(e)))&&parseFloat(e)},checkInt:function(e){return!(!e||!this.isNumeric(parseInt(e)))&&parseInt(e)},isNumeric:function(e){return!isNaN(e)},isString:function(e){return"[object String]"===Object.prototype.toString.call(e)}}}},{"./helpers/uri":4,"./terms":9}],9:[function(e,t,r){"use strict";t.exports={traffic:{utm:"utm",organic:"organic",referral:"referral",typein:"typein"},referer:{referral:"referral",organic:"organic",social:"social"},none:"(none)",oops:"(Houston, we have a problem)"}},{}]},{},[1])(1)});
;

var wc_order_attribution = {"params":{"lifetime":1.0000000000000000818030539140313095458623138256371021270751953125e-5,"session":30,"base64":false,"ajaxurl":"https://welans.ru/wp-admin/admin-ajax.php","prefix":"wc_order_attribution_","allowTracking":true},"fields":{"source_type":"current.typ","referrer":"current_add.rf","utm_campaign":"current.cmp","utm_source":"current.src","utm_medium":"current.mdm","utm_content":"current.cnt","utm_id":"current.id","utm_term":"current.trm","utm_source_platform":"current.plt","utm_creative_format":"current.fmt","utm_marketing_tactic":"current.tct","session_entry":"current_add.ep","session_start_time":"current_add.fd","session_pages":"session.pgs","session_count":"udata.vst","user_agent":"udata.uag"}};
//# sourceURL=wc-order-attribution-js-extra

;
!function(t){"use strict";const e=t.params,n=(document.querySelector.bind(document),(t,e)=>e.split(".").reduce((t,e)=>t&&t[e],t)),s=()=>null,o=t=>null===t||void 0===t?"":t,i="wc/store/checkout";function a(t){!function(){const t=new Set;document.querySelectorAll("wc-order-attribution-inputs").forEach(e=>{const n=e.closest("form")||document;t.has(n)?e.remove():t.add(n)})}();for(const e of document.querySelectorAll("wc-order-attribution-inputs"))e.values=t}function c(t){window.wp&&window.wp.data&&window.wp.data.dispatch&&window.wc&&window.wc.wcBlocksData&&window.wp.data.dispatch(window.wc.wcBlocksData.CHECKOUT_STORE_KEY).setExtensionData("woocommerce/order-attribution",t,!0)}function r(){return"undefined"!=typeof sbjs}function d(){if(window.wp&&window.wp.data&&"function"==typeof window.wp.data.subscribe){const e=window.wp.data.subscribe(function(){e(),c(t.getAttributionData())},i)}}t.getAttributionData=function(){const o=e.allowTracking&&r()?n:s,i=r()?sbjs.get:{},a=Object.entries(t.fields).map(([t,e])=>[t,o(i,e)]);return Object.fromEntries(a)},t.setOrderTracking=function(n){if(e.allowTracking=n,n){if(!r())return;sbjs.init({lifetime:Number(e.lifetime),session_length:Number(e.session),base64:Boolean(e.base64),timezone_offset:"0"})}else!function(){const t=window.location.hostname;["sbjs_current","sbjs_current_add","sbjs_first","sbjs_first_add","sbjs_session","sbjs_udata","sbjs_migrations","sbjs_promo"].forEach(e=>{document.cookie=`${e}=; path=/; max-age=-999; domain=.${t};`})}();const s=t.getAttributionData();a(s),c(s)},t.setOrderTracking(e.allowTracking),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",d):d(),window.customElements.define("wc-order-attribution-inputs",class extends HTMLElement{constructor(){if(super(),this._fieldNames=Object.keys(t.fields),this.hasOwnProperty("_values")){let t=this.values;delete this.values,this.values=t||{}}}connectedCallback(){this.innerHTML="";const t=new DocumentFragment;for(const n of this._fieldNames){const s=document.createElement("input");s.type="hidden",s.name=`${e.prefix}${n}`,s.value=o(this.values&&this.values[n]||""),t.appendChild(s)}this.appendChild(t)}set values(t){if(this._values=t,this.isConnected)for(const t of this._fieldNames){const n=this.querySelector(`input[name="${e.prefix}${t}"]`);n?n.value=o(this.values[t]):console.warn(`Field "${t}" not found. `+"Most likely, the '<wc-order-attribution-inputs>' element was manipulated.")}}get values(){return this._values}})}(window.wc_order_attribution);
;

var ct_localizations = {"ajax_url":"https://welans.ru/wp-admin/admin-ajax.php","nonce":"b32a3d5c53","public_url":"https://welans.ru/wp-content/themes/blocksy/static/bundle/","rest_url":"https://welans.ru/wp-json/","search_url":"https://welans.ru/search/QUERY_STRING/","show_more_text":"\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435","more_text":"\u0411\u043e\u043b\u044c\u0448\u0435","expand_submenu":"\u0420\u0430\u0441\u043a\u0440\u044b\u0442\u044c \u0432\u044b\u043f\u0430\u0434\u0430\u044e\u0449\u0435\u0435 \u043c\u0435\u043d\u044e","collapse_submenu":"\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c \u0432\u044b\u043f\u0430\u0434\u0430\u044e\u0449\u0435\u0435 \u043c\u0435\u043d\u044e","dynamic_js_chunks":[],"dynamic_styles":{"lazy_load":"https://welans.ru/wp-content/themes/blocksy/static/bundle/non-critical-styles.min.css","search_lazy":"https://welans.ru/wp-content/themes/blocksy/static/bundle/non-critical-search-styles.min.css"},"dynamic_styles_selectors":[]};
//# sourceURL=ct-scripts-js-extra

;
window.ctFrontend=function(e){function t(t){for(var n,o,a=t[0],c=t[1],i=0,s=[];i<a.length;i++)o=a[i],Object.prototype.hasOwnProperty.call(r,o)&&r[o]&&s.push(r[o][0]),r[o]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);for(l&&l(t);s.length;)s.shift()()}var n={},r={2:0};function o(t){if(n[t])return n[t].exports;var r=n[t]={i:t,l:!1,exports:{}};return e[t].call(r.exports,r,r.exports,o),r.l=!0,r.exports}o.e=function(e){var t=[],n=r[e];if(0!==n)if(n)t.push(n[2]);else{var a=new Promise((function(t,o){n=r[e]=[t,o]}));t.push(n[2]=a);var c,i=document.createElement("script");i.charset="utf-8",i.timeout=120,o.nc&&i.setAttribute("nonce",o.nc),i.src=function(e){return o.p+""+e+"."+{0:"88eee2a6b838c273451f",1:"33572f7c68e66cbe763d",3:"9be7e926c5c5a0e646b8",4:"27e5e802835e24277590",5:"4b8fbb97a77716b926cb",6:"48db047398a5c890eb67",7:"200e5d4c14690b99979e",8:"2e060e2ddf5b7aa4e171",9:"17e00b07962bacbd8ccb",10:"cc3c6e538a78baa3a05a",11:"05c39c94a686ef08bc98",12:"644214afd0c759dc1332",13:"f280ea238910f01719ef",14:"9ed265640dcb8b8bfe4e",15:"1d35ce20355ae71eb669",16:"58c27bb9b2740c6193f7"}[e]+".js"}(e);var l=new Error;c=function(t){i.onerror=i.onload=null,clearTimeout(s);var n=r[e];if(0!==n){if(n){var o=t&&("load"===t.type?"missing":t.type),a=t&&t.target&&t.target.src;l.message="Loading chunk "+e+" failed.\n("+o+": "+a+")",l.name="ChunkLoadError",l.type=o,l.request=a,n[1](l)}r[e]=void 0}};var s=setTimeout((function(){c({type:"timeout",target:i})}),12e4);i.onerror=i.onload=c,document.head.appendChild(i)}return Promise.all(t)},o.m=e,o.c=n,o.d=function(e,t,n){o.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},o.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},o.t=function(e,t){if(1&t&&(e=o(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(o.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)o.d(n,r,function(t){return e[t]}.bind(null,r));return n},o.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return o.d(t,"a",t),t},o.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},o.p="",o.oe=function(e){throw console.error(e),e};var a=window.blocksyJsonP=window.blocksyJsonP||[],c=a.push.bind(a);a.push=t,a=a.slice();for(var i=0;i<a.length;i++)t(a[i]);var l=c;return o(o.s=7)}([function(e,t){e.exports=window.ctEvents},function(e,t){e.exports=window.jQuery},function(e,t,n){"use strict";n.d(t,"c",(function(){return u})),n.d(t,"a",(function(){return p})),n.d(t,"b",(function(){return b}));var r=n(0),o=n.n(r),a=n(5);function c(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?c(Object(n),!0).forEach((function(t){l(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):c(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}const d=e=>{let{els:t,events:n,forcedEvents:r,load:o,mount:c,condition:l,trigger:d}=e;t||(t=[]),n||(n=[]),r||(r=[]),d||(d=[]),c||(c=e=>{let{mount:t,el:n}=e,r=s(e,["mount","el"]);return n?t(n,r):t()}),t&&"[object Function]"==={}.toString.call(t)&&(t=t());const u=(Array.isArray(t)?t:[t]).reduce((e,t)=>[...e,...Array.isArray(t)?t:"string"==typeof t?document.querySelectorAll(t):[t]],[]);0!==u.length&&(l&&!l({els:t,allEls:u})||(d.length>0?(d.includes("click")&&u.map(e=>{e.hasLazyLoadClickListener||(e.hasLazyLoadClickListener=!0,e.addEventListener("click",t=>{t.preventDefault(),o().then(n=>c(i(i({},n),{},{event:t,el:e})))}))}),d.includes("scroll")&&u.map(e=>{e.hasLazyLoadScrollListener||(e.hasLazyLoadScrollListener=!0,setTimeout(()=>{let t=scrollY,n=r=>{if(Math.abs(scrollY-t)>30)return document.removeEventListener("scroll",n),void o().then(t=>c(i(i({},t),{},{event:r,el:e})))};document.addEventListener("scroll",n)},500))}),d.includes("input")&&u.map(e=>{e.hasLazyLoadInputListener||(e.hasLazyLoadInputListener=!0,e.addEventListener("input",t=>o().then(t=>c(i(i({},t),{},{el:e}))),{once:!0}))}),d.includes("hover-with-touch")&&u.map(e=>{e.hasLazyLoadMouseOverListener||(e.dataset.autoplay&&parseFloat(e.dataset.autoplay)?setTimeout(()=>{o().then(t=>c(i(i({},t),{},{el:e})))},1e3*parseFloat(e.dataset.autoplay)):(e.hasLazyLoadMouseOverListener=!0,e.forcedMount=function(){let t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return o().then(n=>c(i(i({},n),{},{el:e},t)))},["mouseover",...Object(a.a)()?["touchstart"]:[]].map(t=>{e.addEventListener(t,t=>{o().then(n=>c(i(i(i({},n),"touchstart"===t.type?{event:t}:{}),{},{el:e})))},{once:!0,passive:!0})})))}),d.includes("hover-with-click")&&u.map(e=>{e.hasLazyLoadClickHoverListener||(e.hasLazyLoadClickHoverListener=!0,e.addEventListener(Object(a.a)()?"click":"mouseover",t=>{t.preventDefault(),o().then(n=>c(i(i({},n),{},{event:t,el:e})))},{once:!0}))}),d.includes("hover")&&u.map(e=>{e.hasLazyLoadMouseOverListener||(e.hasLazyLoadHoverListener=!0,e.addEventListener("mouseover",t=>{o().then(n=>c(i(i({},n),{},{event:t,el:e})))},{once:!0}))}),d.includes("submit")&&u.map(e=>{e.hasLazyLoadSubmitListener||(e.hasLazyLoadSubmitListener=!0,e.addEventListener("submit",t=>{t.preventDefault(),o().then(n=>c(i(i({},n),{},{event:t,el:e})))}))})):o().then(e=>{u.map(t=>{c(i(i({},e),{},{el:t}))})})))},u=e=>{/comp|inter|loaded/.test(document.readyState)?e():document.addEventListener("DOMContentLoaded",e,!1)},p=(e,t)=>{const{immediate:n=!1,skipEvents:r=!1}=t||{};r||[...new Set(e.reduce((e,t)=>[...e,...t.events||[],...t.forcedEvents||[]],[]))].map(t=>{o.a.on(t,()=>{e.filter(e=>{let{events:n=[]}=e;return n.indexOf(t)>-1}).map(e=>d(i(i({},e),{},{trigger:[]}))),e.filter(e=>{let{forcedEvents:n=[]}=e;return n.indexOf(t)>-1}).map(e=>d(i(i(i({},e),e.forcedEventsElsSkip?{}:{els:["body"]}),{},{condition:()=>!0,trigger:[]})))})});const a=()=>{e.filter(e=>{let{onLoad:t=!0}=e;return"[object Function]"==={}.toString.call(t)?t():!!t}).map(d)};n?a():u(a)};var f=function(e,t,n,r){var o=document,a=o.createElement("link");if(t)t;else{var c=(o.body||o.getElementsByTagName("head")[0]).childNodes;c[c.length-1]}var i=o.styleSheets;a.rel="stylesheet",a.href=e,document.body.appendChild(a);var l=function(e){for(var t=a.href,n=i.length;n--;)if(i[n].href===t)return e();setTimeout((function(){l(e)}))};function s(){a.addEventListener&&a.removeEventListener("load",s)}return a.addEventListener&&a.addEventListener("load",s),a.onloadcssdefined=l,l(s),a};function m(e,t){var n;function r(){!n&&t&&(n=!0,t.call(e))}e.addEventListener&&e.addEventListener("load",r),e.attachEvent&&e.attachEvent("onload",r),"isApplicationInstalled"in navigator&&"onloadcssdefined"in e&&e.onloadcssdefined(r)}const b=function(e){arguments.length>1&&void 0!==arguments[1]&&arguments[1];return new Promise((t,n)=>{document.querySelector(`[href="${e}"]`)?t():requestAnimationFrame(()=>{m(f(e),()=>{requestAnimationFrame(()=>{t()})})})})}},function(e,t,n){"use strict";n.d(t,"a",(function(){return s}));var r=n(0),o=n.n(r);let a=null,c=matchMedia("all and (max-width: 689px)"),i=matchMedia("all and (max-width: 999px)");const l=()=>{a=c.matches?"mobile":i.matches?"tablet":"desktop",o.a.trigger("ct:general:device-change",{currentScreen:a})};l(),c.addListener(()=>l()),i.addListener(()=>l());const s=function(){let{withTablet:e=!1}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return e?a:"tablet"===a?"mobile":a}},function(e,t,n){var r,o,a;
/*!
  * $script.js JS loader & dependency manager
  * https://github.com/ded/script.js
  * (c) Dustin Diaz 2014 | License MIT
  */a=function(){var e,t,n=document,r=n.getElementsByTagName("head")[0],o={},a={},c={},i={};function l(e,t){for(var n=0,r=e.length;n<r;++n)if(!t(e[n]))return!1;return 1}function s(e,t){l(e,(function(e){return t(e),1}))}function d(t,n,r){t=t.push?t:[t];var p=n&&n.call,f=p?n:r,m=p?t.join(""):n,b=t.length;function h(e){return e.call?e():o[e]}function y(){if(!--b)for(var e in o[m]=1,f&&f(),c)l(e.split("|"),h)&&!s(c[e],h)&&(c[e]=[])}return setTimeout((function(){s(t,(function t(n,r){return null===n?y():(r||/^https?:\/\//.test(n)||!e||(n=-1===n.indexOf(".js")?e+n+".js":e+n),i[n]?(m&&(a[m]=1),2==i[n]?y():setTimeout((function(){t(n,!0)}),0)):(i[n]=1,m&&(a[m]=1),void u(n,y)))}))}),0),d}function u(e,o){var a,c=n.createElement("script");c.onload=c.onerror=c.onreadystatechange=function(){c.readyState&&!/^c|loade/.test(c.readyState)||a||(c.onload=c.onreadystatechange=null,a=1,i[e]=2,o())},c.async=1,c.src=t?e+(-1===e.indexOf("?")?"?":"&")+t:e,r.insertBefore(c,r.lastChild)}return d.get=u,d.order=function(e,t,n){!function r(o){o=e.shift(),e.length?d(o,r):d(o,t,n)}()},d.path=function(t){e=t},d.urlArgs=function(e){t=e},d.ready=function(e,t,n){e=e.push?e:[e];var r,a=[];return!s(e,(function(e){o[e]||a.push(e)}))&&l(e,(function(e){return o[e]}))?t():(r=e.join("|"),c[r]=c[r]||[],c[r].push(t),n&&n(a)),d},d.done=function(e){d([null],e)},d},e.exports?e.exports=a():void 0===(o="function"==typeof(r=a)?r.call(t,n,t,e):r)||(e.exports=o)},function(e,t,n){"use strict";n.d(t,"a",(function(){return r}));const r=()=>"ontouchstart"in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0},function(e,t,n){"use strict";n.d(t,"a",(function(){return o}));let r=null;window.IntersectionObserver&&(r=new IntersectionObserver(e=>e.filter(e=>{let{isIntersecting:t}=e;return t}).map(e=>{let{target:t}=e;return t}).filter(e=>(e.dataset.reveal||"").indexOf("no")>-1).map((e,t)=>{let n=(e.dataset.reveal||"").indexOf("bottom")>-1;e.dataset.reveal=n?"yes:"+(t+1):"yes"})));const o=e=>{if(!window.IntersectionObserver)return;let t=e.querySelectorAll('[data-reveal*="no"]');0!==t.length&&t[0].dataset.reveal&&[...t].map(e=>r.observe(e))}},function(e,t,n){"use strict";function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}n.r(t),n.d(t,"areWeDealingWithSafari",(function(){return V})),n.d(t,"getCurrentScreen",(function(){return m.a})),n.d(t,"allFrontendEntryPoints",(function(){return J})),n.d(t,"loadStyle",(function(){return f.b})),n.d(t,"handleEntryPoints",(function(){return f.a})),n.d(t,"onDocumentLoaded",(function(){return f.c})),n.d(t,"registerDynamicChunk",(function(){return _}));const c=(e,t)=>"string"!=typeof e?e:e.replace(/\s\s+/g," ").trim().split(" ").reduce((e,n)=>o(o({},e),{},{[n]:t}),{});const i=new class{constructor(){a(this,"_events",{})}on(e,t){const n=c(e,t);return Object.keys(n).map(e=>this._events=o(o({},this._events),{},{[e]:[...this._events[e]||[],n[e]]})),this}off(e,t){const n=c(e,t);return Object.keys(n).map(e=>{this._events[e]&&(n[e]?this._events[e].splice(this._events[e].indexOf(t)>>>0,1):this._events[e]=[])}),this}trigger(e,t){const n=c(e),r=e=>e&&e.call(window,t);return Object.keys(n).map(e=>{try{(this._events[e]||[]).map(r),(this._events.all||[]).map(r)}catch(e){if(console.log("%c [Events] Exception raised.","color: red; font-weight: bold;"),"undefined"==typeof console)throw e;console.error(e)}}),this}};window.ctEvents=i;n(8);var l=n(0),s=n.n(l),d=n(1),u=n.n(d),p=n(6),f=n(2),m=n(3),b=n(4),h=n.n(b);function y(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function g(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}const v=(e,t)=>{t=function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?y(Object(n),!0).forEach((function(t){g(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):y(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({container:null,openStrategy:"full"},t),document.body.hasAttribute("data-panel")&&"skip"!==t.openStrategy||("skip"!==t.openStrategy&&(t.container&&t.container.classList.add("active"),document.body.dataset.panel="in"+(t.container.dataset.behaviour.indexOf("left")>-1?":left":t.container.dataset.behaviour.indexOf("right")>-1?":right":"")),"full"!==t.openStrategy&&"skip"!==t.openStrategy||n.e(4).then(n.bind(null,36)).then(n=>{let{handleClick:r}=n;r(e,t)}))},O=(e,t)=>{let{event:n,focus:r=!1}=t;v(n,{isModal:!0,container:document.querySelector(e.dataset.togglePanel||e.hash),clickOutside:!0,focus:r})};function w(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function j(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?w(Object(n),!0).forEach((function(t){L(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):w(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function L(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}let k={},P=null;const S=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null;const r=()=>{n?k[e.id].mount(n,t):[...document.querySelectorAll(e.selector)].map(n=>{k[e.id].mount(n,t)})};if(k[e.id])r();else if(e.global_data&&e.global_data.map(e=>{e.var&&e.data&&(window[e.var]=e.data)}),e.deps){const t=e.deps.filter(t=>!document.querySelector(`script[src*="${e.deps_data[t]}"]`)),n=t.map(t=>e.deps_data[t]);t.includes("underscore")?h()(e.deps_data.underscore,()=>{h()([e.url,...n],r)}):h()([e.url,...n],r)}else h()(e.url,r)},E=()=>{window.requestIdleCallback;ct_localizations.dynamic_js_chunks.map(e=>{e.id&&document.querySelector(e.selector)&&(e.trigger?("click"===e.trigger&&[...document.querySelectorAll(e.selector)].map(t=>{if(t.hasLazyLoadClickListener)return;t.hasLazyLoadClickListener=!0;const n=n=>{if(!(e.ignore_click&&n.target.matches(e.ignore_click)||(n.preventDefault(),t.closest(".ct-panel.active")&&t.matches('.ct-header-account[href*="account-modal"]'))))if(e.has_modal_loader){const r=()=>{const r=`\n                                <div data-behaviour="modal" class="ct-panel ${e.has_modal_loader.class?e.has_modal_loader.class:""}" ${e.has_modal_loader.id?`id="${e.has_modal_loader.id}"`:""}>\n                                    <span data-loader="circles">\n                                        <span></span>\n                                        <span></span>\n                                        <span></span>\n                                    </span>\n                                </div>\n                            `,o=document.createElement("div");o.innerHTML=r;let a=o.firstElementChild;document.querySelector(".ct-drawer-canvas").appendChild(o.firstElementChild),v(n,{openStrategy:"fast",container:a}),S(e,{event:n},t)};if(document.body.dataset.panel){let e=document.querySelector(".ct-panel.active");if(e){let t=document.querySelector(`[data-toggle-panel="#${e.id}"]`)||document.querySelector(`[href="#${e.id}"]`);if(t)return t.click(),void setTimeout(()=>{r()},500)}}else r()}else S(e,{event:n},t)};t.dynamicJsChunkStop=()=>{t.removeEventListener("click",n)},t.addEventListener("click",n)}),"submit"===e.trigger&&[...document.querySelectorAll(e.selector)].map(t=>{t.hasLazyLoadSubmitListener||(t.hasLazyLoadSubmitListener=!0,t.addEventListener("submit",n=>{n.preventDefault(),S(e,{event:n},t)}))}),"hover"===e.trigger&&[...document.querySelectorAll(e.selector)].map(t=>{t.hasLazyLoadHoverListener||(t.hasLazyLoadHoverListener=!0,t.addEventListener("mouseover",n=>{n.preventDefault(),S(e,{event:n},t)}))}),"intersection-observer"===e.trigger&&(e=>{window.IntersectionObserver&&(P||(P=new IntersectionObserver(e=>{e.map(e=>{let{boundingClientRect:t,target:n,isIntersecting:r}=e;const o=n.__chunk__;if(!r&&t.y>0)return;let a="target-before-bottom";!r&&t.y<0&&(a="target-after-bottom"),("target-before-bottom"!==a||k[o.id])&&S(o,{state:a,target:n},o.el)})})),[...document.querySelectorAll(e.selector)].map(t=>{if(t.ioObserving)return;t.ioObserving=!0;const n=document.querySelector(e.target);n&&(n.__chunk__=j(j({},e),{},{el:t}),P.observe(n))}))})(e),"scroll"===e.trigger&&setTimeout(()=>{let t=scrollY,n=r=>{if(Math.abs(scrollY-t)>30)return document.removeEventListener("scroll",n),void S(e)};document.addEventListener("scroll",n,{passive:!0})},500)):S(e))})},_=(e,t)=>{k[e]||(k[e]=t)};let q=null,x=null;const C=()=>{q&&window.innerWidth===q||(q=window.innerWidth,s.a.trigger("ct:header:render-frame")),null!==x&&window.scrollY===x||(x=window.scrollY,s.a.trigger("ct:scroll:render-frame")),requestAnimationFrame(C)};function D(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function A(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?D(Object(n),!0).forEach((function(t){M(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):D(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function M(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}const z=()=>n.e(8).then(n.bind(null,29)),T=[{els:()=>['header [data-device="desktop"] [data-id*="menu"] > .menu'],condition:()=>"desktop"===Object(m.a)(),load:z,onLoad:!1,mount:e=>{let{el:t,mountMenuLevel:n}=e;return n(t,{startPosition:"left"})},events:["ct:general:device-change","ct:header:init-popper"]},{els:()=>['header [data-device="desktop"] [data-id*="menu"] > .menu .menu-item-has-children','header [data-device="desktop"] [data-id*="menu"] > .menu .page_item_has_children'],load:z,mount:e=>{let{handleUpdate:t,el:n}=e;return t(n)},onLoad:!1,events:["ct:general:device-change","ct:header:init-popper"],condition:e=>{let{allEls:t}=e;return"desktop"===Object(m.a)()}},{els:()=>[...document.querySelectorAll('header [data-device="desktop"] [data-id^="menu"][data-responsive]')],load:()=>n.e(9).then(n.bind(null,39)),events:["ct:general:device-change","ct:header:render-frame"],condition:()=>{if("desktop"!==Object(m.a)())return!1;return[...document.querySelectorAll('header [data-device="desktop"] [data-id^="menu"][data-responsive]')].map(e=>{if(window.blocksyResponsiveMenuCache&&window.blocksyResponsiveMenuCache[e.id]&&window.blocksyResponsiveMenuCache[e.id].enabled)return window.blocksyResponsiveMenuCache[e.id].enabled;if(!e.firstElementChild)return window.blocksyResponsiveMenuCache||(window.blocksyResponsiveMenuCache={}),window.blocksyResponsiveMenuCache=A(A({},window.blocksyResponsiveMenuCache),{},{[e.id]:{enabled:!1}}),!1;let t=e.closest('[class*="ct-container"]'),n=t.getBoundingClientRect().width-[...t.querySelectorAll('[data-id]:not([data-id*="menu"])')].reduce((e,t)=>{let n=window.getComputedStyle(t);return e+t.getBoundingClientRect().width+parseInt(n.getPropertyValue("margin-left"))+parseInt(n.getPropertyValue("margin-right"))},0)<[...t.querySelectorAll('[data-id*="menu"] > * > *')].reduce((e,t)=>{let n=window.getComputedStyle(t.closest('[data-id*="menu"]'));return e+t.getBoundingClientRect().width+parseInt(n.getPropertyValue("margin-left"))+parseInt(n.getPropertyValue("margin-right"))},0);if(!n){let t=e.dataset.responsive;e.dataset.responsive="yes","no"===t&&s.a.trigger("ct:header:init-popper")}return window.blocksyResponsiveMenuCache||(window.blocksyResponsiveMenuCache={}),window.blocksyResponsiveMenuCache=A(A({},window.blocksyResponsiveMenuCache),{},{[e.id]:{enabled:n}}),n}).filter(e=>!!e).length>0}},{els:()=>'header [data-device="desktop"] [data-id^="menu"]:not([data-responsive])',load:()=>new Promise(e=>e({mount:e=>{s.a.trigger("ct:header:init-popper")}}))}],I=[{els:()=>[[...document.querySelectorAll(".search-form[data-live-results]")].filter(e=>!e.matches('[id="search-modal"] .search-form[data-live-results]')&&!e.matches(".ct-sidebar .ct-widget .woocommerce-product-search"))],load:()=>n.e(0).then(n.bind(null,30)),mount:e=>{let{mount:t,el:n}=e;return t(n,{})},trigger:["input"]},{els:".ct-sidebar .ct-widget .search-form:not(.woocommerce-product-search)[data-live-results]",load:()=>n.e(0).then(n.bind(null,30)),trigger:["input"]},{els:".ct-sidebar .ct-widget .woocommerce-product-search",load:()=>n.e(0).then(n.bind(null,30)),mount:e=>{let{mount:t,el:n}=e;return t(n,{})},trigger:["input"]},{els:'[id="search-modal"] .search-form[data-live-results]',load:()=>n.e(0).then(n.bind(null,30)),mount:e=>{let{mount:t,el:n}=e;return t(n,{mode:"modal",perPage:6})},trigger:["input"]}];function R(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function F(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}const $=[{els:"body.single-product .woocommerce-product-gallery",condition:()=>!!document.querySelector(".woocommerce-product-gallery .ct-image-container"),load:()=>n.e(15).then(n.bind(null,31)),trigger:["hover-with-click"]},function(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?R(Object(n),!0).forEach((function(t){F(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):R(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}({els:"form.variations_form",condition:()=>!!document.querySelector(".woocommerce-product-gallery .ct-image-container"),load:()=>n.e(16).then(n.bind(null,32))},function(){try{return document.createEvent("TouchEvent"),!0}catch(e){return!1}}()?{}:{trigger:["hover"]}),{els:".quantity > *",load:()=>n.e(14).then(n.bind(null,33)),trigger:["click"]},{els:()=>[...document.querySelectorAll(".ct-ajax-add-to-cart .cart"),...document.querySelectorAll(".ct-floating-bar .cart")],load:()=>n.e(12).then(n.bind(null,34)),trigger:["submit"]},{els:".ct-header-cart, .ajax_add_to_cart",load:()=>n.e(13).then(n.bind(null,35)),events:["ct:header:update"],trigger:["hover-with-touch"]}],B=()=>{setTimeout(()=>{let e=document.querySelector('.ct-shortcuts-container [data-shortcut="cart"]');if(e&&!e.hasClickListener){e.hasClickListener=!0;const t=e=>{let t=document.querySelector(".ct-header-cart .ct-offcanvas-trigger");t&&(e.preventDefault(),t.dispatchEvent(new MouseEvent(e.type,{view:window,bubbles:!0,cancelable:!0})))};e.addEventListener("mouseover",t),e.addEventListener("click",t)}[...document.querySelectorAll("#woo-cart-panel .qty")].map(e=>{e.hasChangeListener||(e.hasChangeListener=!0,u()(e).on("change",t=>{var n=u()(e).attr("name").replace(/cart\[([\w]+)\]\[qty\]/g,"$1"),r=u()(e).val(),o=parseFloat(r);u.a.ajax({type:"POST",url:ct_localizations.ajax_url,data:{action:"blocksy_update_qty_cart",hash:n,quantity:o},success:e=>{jQuery("body").trigger("updated_wc_div"),s.a.trigger("ct:header:update")}})}))})},100)};Object(f.c)(B),s.a.on("blocksy:frontend:init",B);function W(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function H(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?W(Object(n),!0).forEach((function(t){Y(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):W(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function Y(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function N(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}document.addEventListener("click",e=>0);const V=/apple/i.test(navigator.vendor),J=[...T,...I,...$,{els:"[data-parallax]",load:()=>n.e(5).then(n.bind(null,37)),events:["blocksy:parallax:init"]},{els:'.flexy-container[data-flexy*="no"]',load:()=>n.e(7).then(n.bind(null,38)),events:["ct:flexy:update"],trigger:["hover-with-touch"]},{els:'.ct-share-box [data-network="pinterest"]',load:()=>n.e(1).then(n.bind(null,25)),trigger:["click"]},{els:'.ct-share-box [data-network]:not([data-network="pinterest"]):not([data-network="email"])',load:()=>n.e(1).then(n.bind(null,25)),trigger:["click"],condition:()=>!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)},{els:[...document.querySelector(".ct-header-cart > .ct-cart-content")?[".ct-header-cart > .ct-cart-item"]:[],".ct-language-switcher > .ct-active-language"],load:()=>n.e(11).then(n.bind(null,26)),trigger:["hover"],events:["ct:popper-elements:update"]},{els:'.ct-back-to-top, .ct-shortcuts-container [data-shortcut*="scroll_top"]',load:()=>n.e(6).then(n.bind(null,27)),events:["ct:back-to-top:mount"],trigger:["scroll"]},{els:'.ct-pagination:not([data-pagination="simple"])',load:()=>Promise.all([n.e(3),n.e(10)]).then(n.bind(null,28)),trigger:["scroll"]},{els:[".entries[data-layout]","[data-products].products"],load:()=>new Promise(e=>e({mount:p.a}))},{els:[".ct-modal-action"],load:()=>new Promise(e=>e({mount:O})),events:["ct:header:update"],trigger:["click"]},{els:[".ct-header-search"],load:()=>new Promise(e=>e({mount:O})),mount:e=>{let{mount:t,el:n}=e;t(n,H(H({},N(e,["mount","el"])),{},{focus:!0}))},events:[],trigger:["click"]}];Object(f.a)(J,{immediate:/comp|inter|loaded/.test(document.readyState)});const Q=()=>{[...document.querySelectorAll(".ct-header-trigger"),...document.querySelectorAll(".ct-offcanvas-trigger")].map(e=>{e&&!e.hasListener&&(e.hasListener=!0,e.addEventListener("click",t=>{if(t.preventDefault(),!e.dataset.togglePanel&&!e.hash)return;let n=document.querySelector(e.dataset.togglePanel||e.hash);n&&v(t,{container:n,closeWhenLinkInside:!e.closest(".ct-header-cart"),computeScrollContainer:()=>n.querySelector(".cart_list")&&!n.querySelector('[data-id="cart"] .cart_list')?n.querySelector(".cart_list"):"mobile"===Object(m.a)()&&n.querySelector('[data-device="mobile"]')?n.querySelector('[data-device="mobile"]'):n.querySelector(".ct-panel-content")})}))})},U=()=>{[...document.querySelectorAll('aside[data-type="type-4"]')].map(e=>{let t=window.innerWidth-document.documentElement.clientWidth;t>0&&e.style.setProperty("--scrollbar-width",t+"px"),e.style.setProperty("--has-scrollbar",1)})};Object(f.c)(()=>{document.body.addEventListener("mouseover",()=>{Object(f.b)(ct_localizations.dynamic_styles.lazy_load)},{once:!0,passive:!0});let e=[...document.querySelectorAll('.comment-form [class*="comment-form-field"]')].reduce((e,t)=>[...e,t.querySelector("input,textarea")],[]).filter(e=>"hidden"!==e.type&&"checkbox"!==e.type);const t=()=>{e.map(e=>{e.parentNode.classList.remove("ct-not-empty"),e.value&&e.value.trim().length>0&&e.parentNode.classList.add("ct-not-empty")})};setTimeout(()=>{t()}),e.map(e=>e.addEventListener("input",t)),E(),U(),setTimeout(()=>document.body.classList.remove("ct-loading"),1500),setTimeout(()=>{Q()}),requestAnimationFrame(C),window.elementorFrontend&&setTimeout(()=>{elementorFrontend.elements.$document.off("click",elementorFrontend.utils.anchors.getSettings("selectors.links"),elementorFrontend.utils.anchors.handleAnchorLinks)},1e3)}),u.a&&(u()(document.body).on("wc_fragments_refreshed",()=>{s.a.trigger("blocksy:frontend:init")}),u()(document.body).on("wc_fragments_loaded",()=>{s.a.trigger("blocksy:frontend:init")}),u()(document).on("jet-filter-content-rendered",()=>{s.a.trigger("blocksy:frontend:init")}),u()(document).on("yith_infs_added_elem",(function(){s.a.trigger("blocksy:frontend:init")})),jQuery(document).on("yith-wcan-ajax-filtered",(function(){s.a.trigger("blocksy:frontend:init")})),u()(document).on("berocket_ajax_filtering_end",()=>{setTimeout(()=>{s.a.trigger("blocksy:frontend:init")},100)}),u()(document).on("preload",()=>{s.a.trigger("blocksy:frontend:init")}),document.addEventListener("wpfAjaxSuccess",e=>{s.a.trigger("blocksy:frontend:init")}),document.addEventListener("facetwp-loaded",()=>{s.a.trigger("blocksy:frontend:init")})),s.a.on("blocksy:frontend:init",()=>{Object(f.a)(J,{immediate:!0,skipEvents:!0}),E(),U(),Q()}),s.a.on("ct:overlay:handle-click",e=>{let{e:t,href:n,container:r,options:o={}}=e;v(t,H(H(H({},n?{container:document.querySelector(n)}:{}),r?{container:r}:{}),o))})},function(e,t,n){n.p=ct_localizations.public_url}]);
;

_stq = window._stq || [];
_stq.push([ "view", {"v":"ext","blog":"214020532","post":"723","tz":"3","srv":"welans.ru","j":"1:16.3.1"} ]);
_stq.push([ "clickTrackerInit", "214020532", "723" ]);
//# sourceURL=jetpack-stats-js-before

;
(()=>{var e={5912:(e,t,n)=>{"use strict";n(1539);var r=n(9567),i=n.n(r);if(window.jQuery){["scrollPane","backgroundVideo","parallax","brzSticky"].forEach((function(e){window.jQuery.fn[e]||(window.jQuery.fn[e]=i().fn[e])}))}else window.jQuery=i()},9662:(e,t,n)=>{var r=n(614),i=n(6330),o=TypeError;e.exports=function(e){if(r(e))return e;throw o(i(e)+" is not a function")}},9670:(e,t,n)=>{var r=n(111),i=String,o=TypeError;e.exports=function(e){if(r(e))return e;throw o(i(e)+" is not an object")}},4326:(e,t,n)=>{var r=n(84),i=r({}.toString),o=r("".slice);e.exports=function(e){return o(i(e),8,-1)}},648:(e,t,n)=>{var r=n(1694),i=n(614),o=n(4326),a=n(5112)("toStringTag"),s=Object,l="Arguments"==o(function(){return arguments}());e.exports=r?o:function(e){var t,n,r;return void 0===e?"Undefined":null===e?"Null":"string"==typeof(n=function(e,t){try{return e[t]}catch(e){}}(t=s(e),a))?n:l?o(t):"Object"==(r=o(t))&&i(t.callee)?"Arguments":r}},8880:(e,t,n)=>{var r=n(9781),i=n(3070),o=n(9114);e.exports=r?function(e,t,n){return i.f(e,t,o(1,n))}:function(e,t,n){return e[t]=n,e}},9114:e=>{e.exports=function(e,t){return{enumerable:!(1&e),configurable:!(2&e),writable:!(4&e),value:t}}},8052:(e,t,n)=>{var r=n(614),i=n(3070),o=n(6339),a=n(3072);e.exports=function(e,t,n,s){s||(s={});var l=s.enumerable,c=void 0!==s.name?s.name:t;if(r(n)&&o(n,c,s),s.global)l?e[t]=n:a(t,n);else{try{s.unsafe?e[t]&&(l=!0):delete e[t]}catch(e){}l?e[t]=n:i.f(e,t,{value:n,enumerable:!1,configurable:!s.nonConfigurable,writable:!s.nonWritable})}return e}},3072:(e,t,n)=>{var r=n(7854),i=Object.defineProperty;e.exports=function(e,t){try{i(r,e,{value:t,configurable:!0,writable:!0})}catch(n){r[e]=t}return t}},9781:(e,t,n)=>{var r=n(7293);e.exports=!r((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]}))},4154:e=>{var t="object"==typeof document&&document.all,n=void 0===t&&void 0!==t;e.exports={all:t,IS_HTMLDDA:n}},317:(e,t,n)=>{var r=n(7854),i=n(111),o=r.document,a=i(o)&&i(o.createElement);e.exports=function(e){return a?o.createElement(e):{}}},8113:(e,t,n)=>{var r=n(5005);e.exports=r("navigator","userAgent")||""},7392:(e,t,n)=>{var r,i,o=n(7854),a=n(8113),s=o.process,l=o.Deno,c=s&&s.versions||l&&l.version,u=c&&c.v8;u&&(i=(r=u.split("."))[0]>0&&r[0]<4?1:+(r[0]+r[1])),!i&&a&&(!(r=a.match(/Edge\/(\d+)/))||r[1]>=74)&&(r=a.match(/Chrome\/(\d+)/))&&(i=+r[1]),e.exports=i},7293:e=>{e.exports=function(e){try{return!!e()}catch(e){return!0}}},4374:(e,t,n)=>{var r=n(7293);e.exports=!r((function(){var e=function(){}.bind();return"function"!=typeof e||e.hasOwnProperty("prototype")}))},6916:(e,t,n)=>{var r=n(4374),i=Function.prototype.call;e.exports=r?i.bind(i):function(){return i.apply(i,arguments)}},6530:(e,t,n)=>{var r=n(9781),i=n(2597),o=Function.prototype,a=r&&Object.getOwnPropertyDescriptor,s=i(o,"name"),l=s&&"something"===function(){}.name,c=s&&(!r||r&&a(o,"name").configurable);e.exports={EXISTS:s,PROPER:l,CONFIGURABLE:c}},84:(e,t,n)=>{var r=n(4374),i=Function.prototype,o=i.call,a=r&&i.bind.bind(o,o);e.exports=r?a:function(e){return function(){return o.apply(e,arguments)}}},1702:(e,t,n)=>{var r=n(4326),i=n(84);e.exports=function(e){if("Function"===r(e))return i(e)}},5005:(e,t,n)=>{var r=n(7854),i=n(614),o=function(e){return i(e)?e:void 0};e.exports=function(e,t){return arguments.length<2?o(r[e]):r[e]&&r[e][t]}},8173:(e,t,n)=>{var r=n(9662),i=n(8554);e.exports=function(e,t){var n=e[t];return i(n)?void 0:r(n)}},7854:(e,t,n)=>{var r=function(e){return e&&e.Math==Math&&e};e.exports=r("object"==typeof globalThis&&globalThis)||r("object"==typeof window&&window)||r("object"==typeof self&&self)||r("object"==typeof n.g&&n.g)||function(){return this}()||Function("return this")()},2597:(e,t,n)=>{var r=n(1702),i=n(7908),o=r({}.hasOwnProperty);e.exports=Object.hasOwn||function(e,t){return o(i(e),t)}},3501:e=>{e.exports={}},4664:(e,t,n)=>{var r=n(9781),i=n(7293),o=n(317);e.exports=!r&&!i((function(){return 7!=Object.defineProperty(o("div"),"a",{get:function(){return 7}}).a}))},2788:(e,t,n)=>{var r=n(1702),i=n(614),o=n(5465),a=r(Function.toString);i(o.inspectSource)||(o.inspectSource=function(e){return a(e)}),e.exports=o.inspectSource},9909:(e,t,n)=>{var r,i,o,a=n(4811),s=n(7854),l=n(111),c=n(8880),u=n(2597),d=n(5465),p=n(6200),h=n(3501),f="Object already initialized",g=s.TypeError,m=s.WeakMap;if(a||d.state){var v=d.state||(d.state=new m);v.get=v.get,v.has=v.has,v.set=v.set,r=function(e,t){if(v.has(e))throw g(f);return t.facade=e,v.set(e,t),t},i=function(e){return v.get(e)||{}},o=function(e){return v.has(e)}}else{var y=p("state");h[y]=!0,r=function(e,t){if(u(e,y))throw g(f);return t.facade=e,c(e,y,t),t},i=function(e){return u(e,y)?e[y]:{}},o=function(e){return u(e,y)}}e.exports={set:r,get:i,has:o,enforce:function(e){return o(e)?i(e):r(e,{})},getterFor:function(e){return function(t){var n;if(!l(t)||(n=i(t)).type!==e)throw g("Incompatible receiver, "+e+" required");return n}}}},614:(e,t,n)=>{var r=n(4154),i=r.all;e.exports=r.IS_HTMLDDA?function(e){return"function"==typeof e||e===i}:function(e){return"function"==typeof e}},8554:e=>{e.exports=function(e){return null==e}},111:(e,t,n)=>{var r=n(614),i=n(4154),o=i.all;e.exports=i.IS_HTMLDDA?function(e){return"object"==typeof e?null!==e:r(e)||e===o}:function(e){return"object"==typeof e?null!==e:r(e)}},1913:e=>{e.exports=!1},2190:(e,t,n)=>{var r=n(5005),i=n(614),o=n(7976),a=n(3307),s=Object;e.exports=a?function(e){return"symbol"==typeof e}:function(e){var t=r("Symbol");return i(t)&&o(t.prototype,s(e))}},6339:(e,t,n)=>{var r=n(7293),i=n(614),o=n(2597),a=n(9781),s=n(6530).CONFIGURABLE,l=n(2788),c=n(9909),u=c.enforce,d=c.get,p=Object.defineProperty,h=a&&!r((function(){return 8!==p((function(){}),"length",{value:8}).length})),f=String(String).split("String"),g=e.exports=function(e,t,n){"Symbol("===String(t).slice(0,7)&&(t="["+String(t).replace(/^Symbol\(([^)]*)\)/,"$1")+"]"),n&&n.getter&&(t="get "+t),n&&n.setter&&(t="set "+t),(!o(e,"name")||s&&e.name!==t)&&(a?p(e,"name",{value:t,configurable:!0}):e.name=t),h&&n&&o(n,"arity")&&e.length!==n.arity&&p(e,"length",{value:n.arity});try{n&&o(n,"constructor")&&n.constructor?a&&p(e,"prototype",{writable:!1}):e.prototype&&(e.prototype=void 0)}catch(e){}var r=u(e);return o(r,"source")||(r.source=f.join("string"==typeof t?t:"")),e};Function.prototype.toString=g((function(){return i(this)&&d(this).source||l(this)}),"toString")},3070:(e,t,n)=>{var r=n(9781),i=n(4664),o=n(3353),a=n(9670),s=n(4948),l=TypeError,c=Object.defineProperty,u=Object.getOwnPropertyDescriptor,d="enumerable",p="configurable",h="writable";t.f=r?o?function(e,t,n){if(a(e),t=s(t),a(n),"function"==typeof e&&"prototype"===t&&"value"in n&&h in n&&!n.writable){var r=u(e,t);r&&r.writable&&(e[t]=n.value,n={configurable:p in n?n.configurable:r.configurable,enumerable:d in n?n.enumerable:r.enumerable,writable:!1})}return c(e,t,n)}:c:function(e,t,n){if(a(e),t=s(t),a(n),i)try{return c(e,t,n)}catch(e){}if("get"in n||"set"in n)throw l("Accessors not supported");return"value"in n&&(e[t]=n.value),e}},7976:(e,t,n)=>{var r=n(1702);e.exports=r({}.isPrototypeOf)},288:(e,t,n)=>{"use strict";var r=n(1694),i=n(648);e.exports=r?{}.toString:function(){return"[object "+i(this)+"]"}},2140:(e,t,n)=>{var r=n(6916),i=n(614),o=n(111),a=TypeError;e.exports=function(e,t){var n,s;if("string"===t&&i(n=e.toString)&&!o(s=r(n,e)))return s;if(i(n=e.valueOf)&&!o(s=r(n,e)))return s;if("string"!==t&&i(n=e.toString)&&!o(s=r(n,e)))return s;throw a("Can't convert object to primitive value")}},4488:(e,t,n)=>{var r=n(8554),i=TypeError;e.exports=function(e){if(r(e))throw i("Can't call method on "+e);return e}},6200:(e,t,n)=>{var r=n(2309),i=n(9711),o=r("keys");e.exports=function(e){return o[e]||(o[e]=i(e))}},5465:(e,t,n)=>{var r=n(7854),i=n(3072),o="__core-js_shared__",a=r[o]||i(o,{});e.exports=a},2309:(e,t,n)=>{var r=n(1913),i=n(5465);(e.exports=function(e,t){return i[e]||(i[e]=void 0!==t?t:{})})("versions",[]).push({version:"3.26.0",mode:r?"pure":"global",copyright:"© 2014-2022 Denis Pushkarev (zloirock.ru)",license:"https://github.com/zloirock/core-js/blob/v3.26.0/LICENSE",source:"https://github.com/zloirock/core-js"})},6293:(e,t,n)=>{var r=n(7392),i=n(7293);e.exports=!!Object.getOwnPropertySymbols&&!i((function(){var e=Symbol();return!String(e)||!(Object(e)instanceof Symbol)||!Symbol.sham&&r&&r<41}))},7908:(e,t,n)=>{var r=n(4488),i=Object;e.exports=function(e){return i(r(e))}},7593:(e,t,n)=>{var r=n(6916),i=n(111),o=n(2190),a=n(8173),s=n(2140),l=n(5112),c=TypeError,u=l("toPrimitive");e.exports=function(e,t){if(!i(e)||o(e))return e;var n,l=a(e,u);if(l){if(void 0===t&&(t="default"),n=r(l,e,t),!i(n)||o(n))return n;throw c("Can't convert object to primitive value")}return void 0===t&&(t="number"),s(e,t)}},4948:(e,t,n)=>{var r=n(7593),i=n(2190);e.exports=function(e){var t=r(e,"string");return i(t)?t:t+""}},1694:(e,t,n)=>{var r={};r[n(5112)("toStringTag")]="z",e.exports="[object z]"===String(r)},6330:e=>{var t=String;e.exports=function(e){try{return t(e)}catch(e){return"Object"}}},9711:(e,t,n)=>{var r=n(1702),i=0,o=Math.random(),a=r(1..toString);e.exports=function(e){return"Symbol("+(void 0===e?"":e)+")_"+a(++i+o,36)}},3307:(e,t,n)=>{var r=n(6293);e.exports=r&&!Symbol.sham&&"symbol"==typeof Symbol.iterator},3353:(e,t,n)=>{var r=n(9781),i=n(7293);e.exports=r&&i((function(){return 42!=Object.defineProperty((function(){}),"prototype",{value:42,writable:!1}).prototype}))},4811:(e,t,n)=>{var r=n(7854),i=n(614),o=r.WeakMap;e.exports=i(o)&&/native code/.test(String(o))},5112:(e,t,n)=>{var r=n(7854),i=n(2309),o=n(2597),a=n(9711),s=n(6293),l=n(3307),c=i("wks"),u=r.Symbol,d=u&&u.for,p=l?u:u&&u.withoutSetter||a;e.exports=function(e){if(!o(c,e)||!s&&"string"!=typeof c[e]){var t="Symbol."+e;s&&o(u,e)?c[e]=u[e]:c[e]=l&&d?d(t):p(t)}return c[e]}},1539:(e,t,n)=>{var r=n(1694),i=n(8052),o=n(288);r||i(Object.prototype,"toString",o,{unsafe:!0})},4953:function(e){e.exports=function(){"use strict";var e=function(){return e=Object.assign||function(e){for(var t,n=1,r=arguments.length;n<r;n++)for(var i in t=arguments[n])Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i]);return e},e.apply(this,arguments)},t=["onChange","onClose","onDayCreate","onDestroy","onKeyDown","onMonthChange","onOpen","onParseConfig","onReady","onValueUpdate","onYearChange","onPreCalendarPosition"],n={_disable:[],_enable:[],allowInput:!1,altFormat:"F j, Y",altInput:!1,altInputClass:"form-control input",animate:"object"==typeof window&&-1===window.navigator.userAgent.indexOf("MSIE"),ariaDateFormat:"F j, Y",clickOpens:!0,closeOnSelect:!0,conjunction:", ",dateFormat:"Y-m-d",defaultHour:12,defaultMinute:0,defaultSeconds:0,disable:[],disableMobile:!1,enable:[],enableSeconds:!1,enableTime:!1,errorHandler:function(e){return"undefined"!=typeof console&&console.warn(e)},getWeek:function(e){var t=new Date(e.getTime());t.setHours(0,0,0,0),t.setDate(t.getDate()+3-(t.getDay()+6)%7);var n=new Date(t.getFullYear(),0,4);return 1+Math.round(((t.getTime()-n.getTime())/864e5-3+(n.getDay()+6)%7)/7)},hourIncrement:1,ignoredFocusElements:[],inline:!1,locale:"default",minuteIncrement:5,mode:"single",monthSelectorType:"dropdown",nextArrow:"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M13.207 8.472l-7.854 7.854-0.707-0.707 7.146-7.146-7.146-7.148 0.707-0.707 7.854 7.854z' /></svg>",noCalendar:!1,now:new Date,onChange:[],onClose:[],onDayCreate:[],onDestroy:[],onKeyDown:[],onMonthChange:[],onOpen:[],onParseConfig:[],onReady:[],onValueUpdate:[],onYearChange:[],onPreCalendarPosition:[],plugins:[],position:"auto",positionElement:void 0,prevArrow:"<svg version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 17 17'><g></g><path d='M5.207 8.471l7.146 7.147-0.707 0.707-7.853-7.854 7.854-7.853 0.707 0.707-7.147 7.146z' /></svg>",shorthandCurrentMonth:!1,showMonths:1,static:!1,time_24hr:!1,weekNumbers:!1,wrap:!1},r={weekdays:{shorthand:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],longhand:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]},months:{shorthand:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],longhand:["January","February","March","April","May","June","July","August","September","October","November","December"]},daysInMonth:[31,28,31,30,31,30,31,31,30,31,30,31],firstDayOfWeek:0,ordinal:function(e){var t=e%100;if(t>3&&t<21)return"th";switch(t%10){case 1:return"st";case 2:return"nd";case 3:return"rd";default:return"th"}},rangeSeparator:" to ",weekAbbreviation:"Wk",scrollTitle:"Scroll to increment",toggleTitle:"Click to toggle",amPM:["AM","PM"],yearAriaLabel:"Year",hourAriaLabel:"Hour",minuteAriaLabel:"Minute",time_24hr:!1},i=function(e){return("0"+e).slice(-2)},o=function(e){return!0===e?1:0};function a(e,t,n){var r;return void 0===n&&(n=!1),function(){var i=this,o=arguments;null!==r&&clearTimeout(r),r=window.setTimeout((function(){r=null,n||e.apply(i,o)}),t),n&&!r&&e.apply(i,o)}}var s=function(e){return e instanceof Array?e:[e]};function l(e,t,n){if(!0===n)return e.classList.add(t);e.classList.remove(t)}function c(e,t,n){var r=window.document.createElement(e);return t=t||"",n=n||"",r.className=t,void 0!==n&&(r.textContent=n),r}function u(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function d(e,t){return t(e)?e:e.parentNode?d(e.parentNode,t):void 0}function p(e,t){var n=c("div","numInputWrapper"),r=c("input","numInput "+e),i=c("span","arrowUp"),o=c("span","arrowDown");if(-1===navigator.userAgent.indexOf("MSIE 9.0")?r.type="number":(r.type="text",r.pattern="\\d*"),void 0!==t)for(var a in t)r.setAttribute(a,t[a]);return n.appendChild(r),n.appendChild(i),n.appendChild(o),n}function h(e){return"function"==typeof e.composedPath?e.composedPath()[0]:e.target}var f=function(){},g=function(e,t,n){return n.months[t?"shorthand":"longhand"][e]},m={D:f,F:function(e,t,n){e.setMonth(n.months.longhand.indexOf(t))},G:function(e,t){e.setHours(parseFloat(t))},H:function(e,t){e.setHours(parseFloat(t))},J:function(e,t){e.setDate(parseFloat(t))},K:function(e,t,n){e.setHours(e.getHours()%12+12*o(new RegExp(n.amPM[1],"i").test(t)))},M:function(e,t,n){e.setMonth(n.months.shorthand.indexOf(t))},S:function(e,t){e.setSeconds(parseFloat(t))},U:function(e,t){return new Date(1e3*parseFloat(t))},W:function(e,t,n){var r=parseInt(t),i=new Date(e.getFullYear(),0,2+7*(r-1),0,0,0,0);return i.setDate(i.getDate()-i.getDay()+n.firstDayOfWeek),i},Y:function(e,t){e.setFullYear(parseFloat(t))},Z:function(e,t){return new Date(t)},d:function(e,t){e.setDate(parseFloat(t))},h:function(e,t){e.setHours(parseFloat(t))},i:function(e,t){e.setMinutes(parseFloat(t))},j:function(e,t){e.setDate(parseFloat(t))},l:f,m:function(e,t){e.setMonth(parseFloat(t)-1)},n:function(e,t){e.setMonth(parseFloat(t)-1)},s:function(e,t){e.setSeconds(parseFloat(t))},u:function(e,t){return new Date(parseFloat(t))},w:f,y:function(e,t){e.setFullYear(2e3+parseFloat(t))}},v={D:"(\\w+)",F:"(\\w+)",G:"(\\d\\d|\\d)",H:"(\\d\\d|\\d)",J:"(\\d\\d|\\d)\\w+",K:"",M:"(\\w+)",S:"(\\d\\d|\\d)",U:"(.+)",W:"(\\d\\d|\\d)",Y:"(\\d{4})",Z:"(.+)",d:"(\\d\\d|\\d)",h:"(\\d\\d|\\d)",i:"(\\d\\d|\\d)",j:"(\\d\\d|\\d)",l:"(\\w+)",m:"(\\d\\d|\\d)",n:"(\\d\\d|\\d)",s:"(\\d\\d|\\d)",u:"(.+)",w:"(\\d\\d|\\d)",y:"(\\d{2})"},y={Z:function(e){return e.toISOString()},D:function(e,t,n){return t.weekdays.shorthand[y.w(e,t,n)]},F:function(e,t,n){return g(y.n(e,t,n)-1,!1,t)},G:function(e,t,n){return i(y.h(e,t,n))},H:function(e){return i(e.getHours())},J:function(e,t){return void 0!==t.ordinal?e.getDate()+t.ordinal(e.getDate()):e.getDate()},K:function(e,t){return t.amPM[o(e.getHours()>11)]},M:function(e,t){return g(e.getMonth(),!0,t)},S:function(e){return i(e.getSeconds())},U:function(e){return e.getTime()/1e3},W:function(e,t,n){return n.getWeek(e)},Y:function(e){return e.getFullYear()},d:function(e){return i(e.getDate())},h:function(e){return e.getHours()%12?e.getHours()%12:12},i:function(e){return i(e.getMinutes())},j:function(e){return e.getDate()},l:function(e,t){return t.weekdays.longhand[e.getDay()]},m:function(e){return i(e.getMonth()+1)},n:function(e){return e.getMonth()+1},s:function(e){return e.getSeconds()},u:function(e){return e.getTime()},w:function(e){return e.getDay()},y:function(e){return String(e.getFullYear()).substring(2)}},b=function(e){var t=e.config,i=void 0===t?n:t,o=e.l10n,a=void 0===o?r:o;return function(e,t,n){var r=n||a;return void 0!==i.formatDate?i.formatDate(e,t,r):t.split("").map((function(t,n,o){return y[t]&&"\\"!==o[n-1]?y[t](e,r,i):"\\"!==t?t:""})).join("")}},w=function(e){var t=e.config,i=void 0===t?n:t,o=e.l10n,a=void 0===o?r:o;return function(e,t,r,o){if(0===e||e){var s,l=o||a,c=e;if(e instanceof Date)s=new Date(e.getTime());else if("string"!=typeof e&&void 0!==e.toFixed)s=new Date(e);else if("string"==typeof e){var u=t||(i||n).dateFormat,d=String(e).trim();if("today"===d)s=new Date,r=!0;else if(/Z$/.test(d)||/GMT$/.test(d))s=new Date(e);else if(i&&i.parseDate)s=i.parseDate(e,u);else{s=i&&i.noCalendar?new Date((new Date).setHours(0,0,0,0)):new Date((new Date).getFullYear(),0,1,0,0,0,0);for(var p=void 0,h=[],f=0,g=0,y="";f<u.length;f++){var b=u[f],w="\\"===b,D="\\"===u[f-1]||w;if(v[b]&&!D){y+=v[b];var _=new RegExp(y).exec(e);_&&(p=!0)&&h["Y"!==b?"push":"unshift"]({fn:m[b],val:_[++g]})}else w||(y+=".");h.forEach((function(e){var t=e.fn,n=e.val;return s=t(s,n,l)||s}))}s=p?s:void 0}}if(s instanceof Date&&!isNaN(s.getTime()))return!0===r&&s.setHours(0,0,0,0),s;i.errorHandler(new Error("Invalid date provided: "+c))}}};function D(e,t,n){return void 0===n&&(n=!0),!1!==n?new Date(e.getTime()).setHours(0,0,0,0)-new Date(t.getTime()).setHours(0,0,0,0):e.getTime()-t.getTime()}var _=function(e,t,n){return e>Math.min(t,n)&&e<Math.max(t,n)},C={DAY:864e5};"function"!=typeof Object.assign&&(Object.assign=function(e){for(var t=[],n=1;n<arguments.length;n++)t[n-1]=arguments[n];if(!e)throw TypeError("Cannot convert undefined or null to object");for(var r=function(t){t&&Object.keys(t).forEach((function(n){return e[n]=t[n]}))},i=0,o=t;i<o.length;i++)r(o[i]);return e});var x=300;function M(f,m){var y={config:e({},n,S.defaultConfig),l10n:r};function M(){y.utils={getDaysInMonth:function(e,t){return void 0===e&&(e=y.currentMonth),void 0===t&&(t=y.currentYear),1===e&&(t%4==0&&t%100!=0||t%400==0)?29:y.l10n.daysInMonth[e]}}}function E(){y.element=y.input=f,y.isOpen=!1,_e(),Ce(),Ie(),Le(),M(),y.isMobile||U(),W(),(y.selectedDates.length||y.config.noCalendar)&&(y.config.enableTime&&I(y.config.noCalendar?y.latestSelectedDateObj||y.config.minDate:void 0),Xe(!1)),T(),y.showTimeInput=y.selectedDates.length>0||y.config.noCalendar;var e=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);!y.isMobile&&e&&xe(),je("onReady")}function A(e){return e.bind(y)}function T(){var e=y.config;!1===e.weekNumbers&&1===e.showMonths||!0!==e.noCalendar&&window.requestAnimationFrame((function(){if(void 0!==y.calendarContainer&&(y.calendarContainer.style.visibility="hidden",y.calendarContainer.style.display="block"),void 0!==y.daysContainer){var t=(y.days.offsetWidth+1)*e.showMonths;y.daysContainer.style.width=t+"px",y.calendarContainer.style.width=t+(void 0!==y.weekWrapper?y.weekWrapper.offsetWidth:0)+"px",y.calendarContainer.style.removeProperty("visibility"),y.calendarContainer.style.removeProperty("display")}}))}function $(e){0===y.selectedDates.length&&be(),void 0!==e&&"blur"!==e.type&&Ue(e);var t=y._input.value;L(),Xe(),y._input.value!==t&&y._debouncedChange()}function O(e,t){return e%12+12*o(t===y.l10n.amPM[1])}function k(e){switch(e%24){case 0:case 12:return 12;default:return e%12}}function L(){if(void 0!==y.hourElement&&void 0!==y.minuteElement){var e=(parseInt(y.hourElement.value.slice(-2),10)||0)%24,t=(parseInt(y.minuteElement.value,10)||0)%60,n=void 0!==y.secondElement?(parseInt(y.secondElement.value,10)||0)%60:0;void 0!==y.amPM&&(e=O(e,y.amPM.textContent));var r=void 0!==y.config.minTime||y.config.minDate&&y.minDateHasTime&&y.latestSelectedDateObj&&0===D(y.latestSelectedDateObj,y.config.minDate,!0);if(void 0!==y.config.maxTime||y.config.maxDate&&y.maxDateHasTime&&y.latestSelectedDateObj&&0===D(y.latestSelectedDateObj,y.config.maxDate,!0)){var i=void 0!==y.config.maxTime?y.config.maxTime:y.config.maxDate;(e=Math.min(e,i.getHours()))===i.getHours()&&(t=Math.min(t,i.getMinutes())),t===i.getMinutes()&&(n=Math.min(n,i.getSeconds()))}if(r){var o=void 0!==y.config.minTime?y.config.minTime:y.config.minDate;(e=Math.max(e,o.getHours()))===o.getHours()&&(t=Math.max(t,o.getMinutes())),t===o.getMinutes()&&(n=Math.max(n,o.getSeconds()))}P(e,t,n)}}function I(e){var t=e||y.latestSelectedDateObj;t&&P(t.getHours(),t.getMinutes(),t.getSeconds())}function Y(){var e=y.config.defaultHour,t=y.config.defaultMinute,n=y.config.defaultSeconds;if(void 0!==y.config.minDate){var r=y.config.minDate.getHours(),i=y.config.minDate.getMinutes();(e=Math.max(e,r))===r&&(t=Math.max(i,t)),e===r&&t===i&&(n=y.config.minDate.getSeconds())}if(void 0!==y.config.maxDate){var o=y.config.maxDate.getHours(),a=y.config.maxDate.getMinutes();(e=Math.min(e,o))===o&&(t=Math.min(a,t)),e===o&&t===a&&(n=y.config.maxDate.getSeconds())}P(e,t,n)}function P(e,t,n){void 0!==y.latestSelectedDateObj&&y.latestSelectedDateObj.setHours(e%24,t,n||0,0),y.hourElement&&y.minuteElement&&!y.isMobile&&(y.hourElement.value=i(y.config.time_24hr?e:(12+e)%12+12*o(e%12==0)),y.minuteElement.value=i(t),void 0!==y.amPM&&(y.amPM.textContent=y.l10n.amPM[o(e>=12)]),void 0!==y.secondElement&&(y.secondElement.value=i(n)))}function j(e){var t=parseInt(e.target.value)+(e.delta||0);(t/1e3>1||"Enter"===e.key&&!/[^\d]/.test(t.toString()))&&he(t)}function H(e,t,n,r){return t instanceof Array?t.forEach((function(t){return H(e,t,n,r)})):e instanceof Array?e.forEach((function(e){return H(e,t,n,r)})):(e.addEventListener(t,n,r),void y._handlers.push({element:e,event:t,handler:n,options:r}))}function N(e){return function(t){1===t.which&&e(t)}}function R(){je("onChange")}function W(){if(y.config.wrap&&["open","close","toggle","clear"].forEach((function(e){Array.prototype.forEach.call(y.element.querySelectorAll("[data-"+e+"]"),(function(t){return H(t,"click",y[e])}))})),y.isMobile)Ye();else{var e=a(ye,50);if(y._debouncedChange=a(R,x),y.daysContainer&&!/iPhone|iPad|iPod/i.test(navigator.userAgent)&&H(y.daysContainer,"mouseover",(function(e){"range"===y.config.mode&&ve(e.target)})),H(window.document.body,"keydown",me),y.config.inline||y.config.static||H(window,"resize",e),void 0!==window.ontouchstart?H(window.document,"touchstart",pe):H(window.document,"mousedown",N(pe)),H(window.document,"focus",pe,{capture:!0}),!0===y.config.clickOpens&&(H(y._input,"focus",y.open),H(y._input,"mousedown",N(y.open))),void 0!==y.daysContainer&&(H(y.monthNav,"mousedown",N(qe)),H(y.monthNav,["keyup","increment"],j),H(y.daysContainer,"mousedown",N(Se))),void 0!==y.timeContainer&&void 0!==y.minuteElement&&void 0!==y.hourElement){var t=function(e){return e.target.select()};H(y.timeContainer,["increment"],$),H(y.timeContainer,"blur",$,{capture:!0}),H(y.timeContainer,"mousedown",N(X)),H([y.hourElement,y.minuteElement],["focus","click"],t),void 0!==y.secondElement&&H(y.secondElement,"focus",(function(){return y.secondElement&&y.secondElement.select()})),void 0!==y.amPM&&H(y.amPM,"mousedown",N((function(e){$(e),R()})))}}}function F(e,t){var n=void 0!==e?y.parseDate(e):y.latestSelectedDateObj||(y.config.minDate&&y.config.minDate>y.now?y.config.minDate:y.config.maxDate&&y.config.maxDate<y.now?y.config.maxDate:y.now),r=y.currentYear,i=y.currentMonth;try{void 0!==n&&(y.currentYear=n.getFullYear(),y.currentMonth=n.getMonth())}catch(e){e.message="Invalid date supplied: "+n,y.config.errorHandler(e)}t&&y.currentYear!==r&&(je("onYearChange"),V()),!t||y.currentYear===r&&y.currentMonth===i||je("onMonthChange"),y.redraw()}function X(e){~e.target.className.indexOf("arrow")&&q(e,e.target.classList.contains("arrowUp")?1:-1)}function q(e,t,n){var r=e&&e.target,i=n||r&&r.parentNode&&r.parentNode.firstChild,o=He("increment");o.delta=t,i&&i.dispatchEvent(o)}function U(){var e=window.document.createDocumentFragment();if(y.calendarContainer=c("div","flatpickr-calendar"),y.calendarContainer.tabIndex=-1,!y.config.noCalendar){if(e.appendChild(ne()),y.innerContainer=c("div","flatpickr-innerContainer"),y.config.weekNumbers){var t=ae(),n=t.weekWrapper,r=t.weekNumbers;y.innerContainer.appendChild(n),y.weekNumbers=r,y.weekWrapper=n}y.rContainer=c("div","flatpickr-rContainer"),y.rContainer.appendChild(ie()),y.daysContainer||(y.daysContainer=c("div","flatpickr-days"),y.daysContainer.tabIndex=-1),Z(),y.rContainer.appendChild(y.daysContainer),y.innerContainer.appendChild(y.rContainer),e.appendChild(y.innerContainer)}y.config.enableTime&&e.appendChild(re()),l(y.calendarContainer,"rangeMode","range"===y.config.mode),l(y.calendarContainer,"animate",!0===y.config.animate),l(y.calendarContainer,"multiMonth",y.config.showMonths>1),y.calendarContainer.appendChild(e);var i=void 0!==y.config.appendTo&&void 0!==y.config.appendTo.nodeType;if((y.config.inline||y.config.static)&&(y.calendarContainer.classList.add(y.config.inline?"inline":"static"),y.config.inline&&(!i&&y.element.parentNode?y.element.parentNode.insertBefore(y.calendarContainer,y._input.nextSibling):void 0!==y.config.appendTo&&y.config.appendTo.appendChild(y.calendarContainer)),y.config.static)){var o=c("div","flatpickr-wrapper");y.element.parentNode&&y.element.parentNode.insertBefore(o,y.element),o.appendChild(y.element),y.altInput&&o.appendChild(y.altInput),o.appendChild(y.calendarContainer)}y.config.static||y.config.inline||(void 0!==y.config.appendTo?y.config.appendTo:window.document.body).appendChild(y.calendarContainer)}function z(e,t,n,r){var i=fe(t,!0),o=c("span","flatpickr-day "+e,t.getDate().toString());return o.dateObj=t,o.$i=r,o.setAttribute("aria-label",y.formatDate(t,y.config.ariaDateFormat)),-1===e.indexOf("hidden")&&0===D(t,y.now)&&(y.todayDateElem=o,o.classList.add("today"),o.setAttribute("aria-current","date")),i?(o.tabIndex=-1,Ne(t)&&(o.classList.add("selected"),y.selectedDateElem=o,"range"===y.config.mode&&(l(o,"startRange",y.selectedDates[0]&&0===D(t,y.selectedDates[0],!0)),l(o,"endRange",y.selectedDates[1]&&0===D(t,y.selectedDates[1],!0)),"nextMonthDay"===e&&o.classList.add("inRange")))):o.classList.add("flatpickr-disabled"),"range"===y.config.mode&&Re(t)&&!Ne(t)&&o.classList.add("inRange"),y.weekNumbers&&1===y.config.showMonths&&"prevMonthDay"!==e&&n%7==1&&y.weekNumbers.insertAdjacentHTML("beforeend","<span class='flatpickr-day'>"+y.config.getWeek(t)+"</span>"),je("onDayCreate",o),o}function B(e){e.focus(),"range"===y.config.mode&&ve(e)}function G(e){for(var t=e>0?0:y.config.showMonths-1,n=e>0?y.config.showMonths:-1,r=t;r!=n;r+=e)for(var i=y.daysContainer.children[r],o=e>0?0:i.children.length-1,a=e>0?i.children.length:-1,s=o;s!=a;s+=e){var l=i.children[s];if(-1===l.className.indexOf("hidden")&&fe(l.dateObj))return l}}function K(e,t){for(var n=-1===e.className.indexOf("Month")?e.dateObj.getMonth():y.currentMonth,r=t>0?y.config.showMonths:-1,i=t>0?1:-1,o=n-y.currentMonth;o!=r;o+=i)for(var a=y.daysContainer.children[o],s=n-y.currentMonth===o?e.$i+t:t<0?a.children.length-1:0,l=a.children.length,c=s;c>=0&&c<l&&c!=(t>0?l:-1);c+=i){var u=a.children[c];if(-1===u.className.indexOf("hidden")&&fe(u.dateObj)&&Math.abs(e.$i-c)>=Math.abs(t))return B(u)}y.changeMonth(i),J(G(i),0)}function J(e,t){var n=ge(document.activeElement||document.body),r=void 0!==e?e:n?document.activeElement:void 0!==y.selectedDateElem&&ge(y.selectedDateElem)?y.selectedDateElem:void 0!==y.todayDateElem&&ge(y.todayDateElem)?y.todayDateElem:G(t>0?1:-1);return void 0===r?y._input.focus():n?void K(r,t):B(r)}function Q(e,t){for(var n=(new Date(e,t,1).getDay()-y.l10n.firstDayOfWeek+7)%7,r=y.utils.getDaysInMonth((t-1+12)%12),i=y.utils.getDaysInMonth(t),o=window.document.createDocumentFragment(),a=y.config.showMonths>1,s=a?"prevMonthDay hidden":"prevMonthDay",l=a?"nextMonthDay hidden":"nextMonthDay",u=r+1-n,d=0;u<=r;u++,d++)o.appendChild(z(s,new Date(e,t-1,u),u,d));for(u=1;u<=i;u++,d++)o.appendChild(z("",new Date(e,t,u),u,d));for(var p=i+1;p<=42-n&&(1===y.config.showMonths||d%7!=0);p++,d++)o.appendChild(z(l,new Date(e,t+1,p%i),p,d));var h=c("div","dayContainer");return h.appendChild(o),h}function Z(){if(void 0!==y.daysContainer){u(y.daysContainer),y.weekNumbers&&u(y.weekNumbers);for(var e=document.createDocumentFragment(),t=0;t<y.config.showMonths;t++){var n=new Date(y.currentYear,y.currentMonth,1);n.setMonth(y.currentMonth+t),e.appendChild(Q(n.getFullYear(),n.getMonth()))}y.daysContainer.appendChild(e),y.days=y.daysContainer.firstChild,"range"===y.config.mode&&1===y.selectedDates.length&&ve()}}function V(){if(!(y.config.showMonths>1||"dropdown"!==y.config.monthSelectorType)){var e=function(e){return!(void 0!==y.config.minDate&&y.currentYear===y.config.minDate.getFullYear()&&e<y.config.minDate.getMonth()||void 0!==y.config.maxDate&&y.currentYear===y.config.maxDate.getFullYear()&&e>y.config.maxDate.getMonth())};y.monthsDropdownContainer.tabIndex=-1,y.monthsDropdownContainer.innerHTML="";for(var t=0;t<12;t++)if(e(t)){var n=c("option","flatpickr-monthDropdown-month");n.value=new Date(y.currentYear,t).getMonth().toString(),n.textContent=g(t,y.config.shorthandCurrentMonth,y.l10n),n.tabIndex=-1,y.currentMonth===t&&(n.selected=!0),y.monthsDropdownContainer.appendChild(n)}}}function ee(){var e,t=c("div","flatpickr-month"),n=window.document.createDocumentFragment();y.config.showMonths>1||"static"===y.config.monthSelectorType?e=c("span","cur-month"):(y.monthsDropdownContainer=c("select","flatpickr-monthDropdown-months"),H(y.monthsDropdownContainer,"change",(function(e){var t=e.target,n=parseInt(t.value,10);y.changeMonth(n-y.currentMonth),je("onMonthChange")})),V(),e=y.monthsDropdownContainer);var r=p("cur-year",{tabindex:"-1"}),i=r.getElementsByTagName("input")[0];i.setAttribute("aria-label",y.l10n.yearAriaLabel),y.config.minDate&&i.setAttribute("min",y.config.minDate.getFullYear().toString()),y.config.maxDate&&(i.setAttribute("max",y.config.maxDate.getFullYear().toString()),i.disabled=!!y.config.minDate&&y.config.minDate.getFullYear()===y.config.maxDate.getFullYear());var o=c("div","flatpickr-current-month");return o.appendChild(e),o.appendChild(r),n.appendChild(o),t.appendChild(n),{container:t,yearElement:i,monthElement:e}}function te(){u(y.monthNav),y.monthNav.appendChild(y.prevMonthNav),y.config.showMonths&&(y.yearElements=[],y.monthElements=[]);for(var e=y.config.showMonths;e--;){var t=ee();y.yearElements.push(t.yearElement),y.monthElements.push(t.monthElement),y.monthNav.appendChild(t.container)}y.monthNav.appendChild(y.nextMonthNav)}function ne(){return y.monthNav=c("div","flatpickr-months"),y.yearElements=[],y.monthElements=[],y.prevMonthNav=c("span","flatpickr-prev-month"),y.prevMonthNav.innerHTML=y.config.prevArrow,y.nextMonthNav=c("span","flatpickr-next-month"),y.nextMonthNav.innerHTML=y.config.nextArrow,te(),Object.defineProperty(y,"_hidePrevMonthArrow",{get:function(){return y.__hidePrevMonthArrow},set:function(e){y.__hidePrevMonthArrow!==e&&(l(y.prevMonthNav,"flatpickr-disabled",e),y.__hidePrevMonthArrow=e)}}),Object.defineProperty(y,"_hideNextMonthArrow",{get:function(){return y.__hideNextMonthArrow},set:function(e){y.__hideNextMonthArrow!==e&&(l(y.nextMonthNav,"flatpickr-disabled",e),y.__hideNextMonthArrow=e)}}),y.currentYearElement=y.yearElements[0],We(),y.monthNav}function re(){y.calendarContainer.classList.add("hasTime"),y.config.noCalendar&&y.calendarContainer.classList.add("noCalendar"),y.timeContainer=c("div","flatpickr-time"),y.timeContainer.tabIndex=-1;var e=c("span","flatpickr-time-separator",":"),t=p("flatpickr-hour",{"aria-label":y.l10n.hourAriaLabel});y.hourElement=t.getElementsByTagName("input")[0];var n=p("flatpickr-minute",{"aria-label":y.l10n.minuteAriaLabel});if(y.minuteElement=n.getElementsByTagName("input")[0],y.hourElement.tabIndex=y.minuteElement.tabIndex=-1,y.hourElement.value=i(y.latestSelectedDateObj?y.latestSelectedDateObj.getHours():y.config.time_24hr?y.config.defaultHour:k(y.config.defaultHour)),y.minuteElement.value=i(y.latestSelectedDateObj?y.latestSelectedDateObj.getMinutes():y.config.defaultMinute),y.hourElement.setAttribute("step",y.config.hourIncrement.toString()),y.minuteElement.setAttribute("step",y.config.minuteIncrement.toString()),y.hourElement.setAttribute("min",y.config.time_24hr?"0":"1"),y.hourElement.setAttribute("max",y.config.time_24hr?"23":"12"),y.minuteElement.setAttribute("min","0"),y.minuteElement.setAttribute("max","59"),y.timeContainer.appendChild(t),y.timeContainer.appendChild(e),y.timeContainer.appendChild(n),y.config.time_24hr&&y.timeContainer.classList.add("time24hr"),y.config.enableSeconds){y.timeContainer.classList.add("hasSeconds");var r=p("flatpickr-second");y.secondElement=r.getElementsByTagName("input")[0],y.secondElement.value=i(y.latestSelectedDateObj?y.latestSelectedDateObj.getSeconds():y.config.defaultSeconds),y.secondElement.setAttribute("step",y.minuteElement.getAttribute("step")),y.secondElement.setAttribute("min","0"),y.secondElement.setAttribute("max","59"),y.timeContainer.appendChild(c("span","flatpickr-time-separator",":")),y.timeContainer.appendChild(r)}return y.config.time_24hr||(y.amPM=c("span","flatpickr-am-pm",y.l10n.amPM[o((y.latestSelectedDateObj?y.hourElement.value:y.config.defaultHour)>11)]),y.amPM.title=y.l10n.toggleTitle,y.amPM.tabIndex=-1,y.timeContainer.appendChild(y.amPM)),y.timeContainer}function ie(){y.weekdayContainer?u(y.weekdayContainer):y.weekdayContainer=c("div","flatpickr-weekdays");for(var e=y.config.showMonths;e--;){var t=c("div","flatpickr-weekdaycontainer");y.weekdayContainer.appendChild(t)}return oe(),y.weekdayContainer}function oe(){if(y.weekdayContainer){var e=y.l10n.firstDayOfWeek,t=y.l10n.weekdays.shorthand.slice();e>0&&e<t.length&&(t=t.splice(e,t.length).concat(t.splice(0,e)));for(var n=y.config.showMonths;n--;)y.weekdayContainer.children[n].innerHTML="\n      <span class='flatpickr-weekday'>\n        "+t.join("</span><span class='flatpickr-weekday'>")+"\n      </span>\n      "}}function ae(){y.calendarContainer.classList.add("hasWeeks");var e=c("div","flatpickr-weekwrapper");e.appendChild(c("span","flatpickr-weekday",y.l10n.weekAbbreviation));var t=c("div","flatpickr-weeks");return e.appendChild(t),{weekWrapper:e,weekNumbers:t}}function se(e,t){void 0===t&&(t=!0);var n=t?e:e-y.currentMonth;n<0&&!0===y._hidePrevMonthArrow||n>0&&!0===y._hideNextMonthArrow||(y.currentMonth+=n,(y.currentMonth<0||y.currentMonth>11)&&(y.currentYear+=y.currentMonth>11?1:-1,y.currentMonth=(y.currentMonth+12)%12,je("onYearChange"),V()),Z(),je("onMonthChange"),We())}function le(e,t){void 0===e&&(e=!0),void 0===t&&(t=!0),y.input.value="",void 0!==y.altInput&&(y.altInput.value=""),void 0!==y.mobileInput&&(y.mobileInput.value=""),y.selectedDates=[],y.latestSelectedDateObj=void 0,!0===t&&(y.currentYear=y._initialDate.getFullYear(),y.currentMonth=y._initialDate.getMonth()),y.showTimeInput=!1,!0===y.config.enableTime&&Y(),y.redraw(),e&&je("onChange")}function ce(){y.isOpen=!1,y.isMobile||(void 0!==y.calendarContainer&&y.calendarContainer.classList.remove("open"),void 0!==y._input&&y._input.classList.remove("active")),je("onClose")}function ue(){void 0!==y.config&&je("onDestroy");for(var e=y._handlers.length;e--;){var t=y._handlers[e];t.element.removeEventListener(t.event,t.handler,t.options)}if(y._handlers=[],y.mobileInput)y.mobileInput.parentNode&&y.mobileInput.parentNode.removeChild(y.mobileInput),y.mobileInput=void 0;else if(y.calendarContainer&&y.calendarContainer.parentNode)if(y.config.static&&y.calendarContainer.parentNode){var n=y.calendarContainer.parentNode;if(n.lastChild&&n.removeChild(n.lastChild),n.parentNode){for(;n.firstChild;)n.parentNode.insertBefore(n.firstChild,n);n.parentNode.removeChild(n)}}else y.calendarContainer.parentNode.removeChild(y.calendarContainer);y.altInput&&(y.input.type="text",y.altInput.parentNode&&y.altInput.parentNode.removeChild(y.altInput),delete y.altInput),y.input&&(y.input.type=y.input._type,y.input.classList.remove("flatpickr-input"),y.input.removeAttribute("readonly"),y.input.value=""),["_showTimeInput","latestSelectedDateObj","_hideNextMonthArrow","_hidePrevMonthArrow","__hideNextMonthArrow","__hidePrevMonthArrow","isMobile","isOpen","selectedDateElem","minDateHasTime","maxDateHasTime","days","daysContainer","_input","_positionElement","innerContainer","rContainer","monthNav","todayDateElem","calendarContainer","weekdayContainer","prevMonthNav","nextMonthNav","monthsDropdownContainer","currentMonthElement","currentYearElement","navigationCurrentMonth","selectedDateElem","config"].forEach((function(e){try{delete y[e]}catch(e){}}))}function de(e){return!(!y.config.appendTo||!y.config.appendTo.contains(e))||y.calendarContainer.contains(e)}function pe(e){if(y.isOpen&&!y.config.inline){var t=h(e),n=de(t),r=t===y.input||t===y.altInput||y.element.contains(t)||e.path&&e.path.indexOf&&(~e.path.indexOf(y.input)||~e.path.indexOf(y.altInput)),i="blur"===e.type?r&&e.relatedTarget&&!de(e.relatedTarget):!r&&!n&&!de(e.relatedTarget),o=!y.config.ignoredFocusElements.some((function(e){return e.contains(t)}));i&&o&&(void 0!==y.timeContainer&&void 0!==y.minuteElement&&void 0!==y.hourElement&&$(),y.close(),"range"===y.config.mode&&1===y.selectedDates.length&&(y.clear(!1),y.redraw()))}}function he(e){if(!(!e||y.config.minDate&&e<y.config.minDate.getFullYear()||y.config.maxDate&&e>y.config.maxDate.getFullYear())){var t=e,n=y.currentYear!==t;y.currentYear=t||y.currentYear,y.config.maxDate&&y.currentYear===y.config.maxDate.getFullYear()?y.currentMonth=Math.min(y.config.maxDate.getMonth(),y.currentMonth):y.config.minDate&&y.currentYear===y.config.minDate.getFullYear()&&(y.currentMonth=Math.max(y.config.minDate.getMonth(),y.currentMonth)),n&&(y.redraw(),je("onYearChange"),V())}}function fe(e,t){void 0===t&&(t=!0);var n=y.parseDate(e,void 0,t);if(y.config.minDate&&n&&D(n,y.config.minDate,void 0!==t?t:!y.minDateHasTime)<0||y.config.maxDate&&n&&D(n,y.config.maxDate,void 0!==t?t:!y.maxDateHasTime)>0)return!1;if(0===y.config.enable.length&&0===y.config.disable.length)return!0;if(void 0===n)return!1;for(var r=y.config.enable.length>0,i=r?y.config.enable:y.config.disable,o=0,a=void 0;o<i.length;o++){if("function"==typeof(a=i[o])&&a(n))return r;if(a instanceof Date&&void 0!==n&&a.getTime()===n.getTime())return r;if("string"==typeof a&&void 0!==n){var s=y.parseDate(a,void 0,!0);return s&&s.getTime()===n.getTime()?r:!r}if("object"==typeof a&&void 0!==n&&a.from&&a.to&&n.getTime()>=a.from.getTime()&&n.getTime()<=a.to.getTime())return r}return!r}function ge(e){return void 0!==y.daysContainer&&-1===e.className.indexOf("hidden")&&y.daysContainer.contains(e)}function me(e){var t=e.target===y._input,n=y.config.allowInput,r=y.isOpen&&(!n||!t),i=y.config.inline&&t&&!n;if(13===e.keyCode&&t){if(n)return y.setDate(y._input.value,!0,e.target===y.altInput?y.config.altFormat:y.config.dateFormat),e.target.blur();y.open()}else if(de(e.target)||r||i){var o=!!y.timeContainer&&y.timeContainer.contains(e.target);switch(e.keyCode){case 13:o?(e.preventDefault(),$(),Ee()):Se(e);break;case 27:e.preventDefault(),Ee();break;case 8:case 46:t&&!y.config.allowInput&&(e.preventDefault(),y.clear());break;case 37:case 39:if(o||t)y.hourElement&&y.hourElement.focus();else if(e.preventDefault(),void 0!==y.daysContainer&&(!1===n||document.activeElement&&ge(document.activeElement))){var a=39===e.keyCode?1:-1;e.ctrlKey?(e.stopPropagation(),se(a),J(G(1),0)):J(void 0,a)}break;case 38:case 40:e.preventDefault();var s=40===e.keyCode?1:-1;y.daysContainer&&void 0!==e.target.$i||e.target===y.input||e.target===y.altInput?e.ctrlKey?(e.stopPropagation(),he(y.currentYear-s),J(G(1),0)):o||J(void 0,7*s):e.target===y.currentYearElement?he(y.currentYear-s):y.config.enableTime&&(!o&&y.hourElement&&y.hourElement.focus(),$(e),y._debouncedChange());break;case 9:if(o){var l=[y.hourElement,y.minuteElement,y.secondElement,y.amPM].concat(y.pluginElements).filter((function(e){return e})),c=l.indexOf(e.target);if(-1!==c){var u=l[c+(e.shiftKey?-1:1)];e.preventDefault(),(u||y._input).focus()}}else!y.config.noCalendar&&y.daysContainer&&y.daysContainer.contains(e.target)&&e.shiftKey&&(e.preventDefault(),y._input.focus())}}if(void 0!==y.amPM&&e.target===y.amPM)switch(e.key){case y.l10n.amPM[0].charAt(0):case y.l10n.amPM[0].charAt(0).toLowerCase():y.amPM.textContent=y.l10n.amPM[0],L(),Xe();break;case y.l10n.amPM[1].charAt(0):case y.l10n.amPM[1].charAt(0).toLowerCase():y.amPM.textContent=y.l10n.amPM[1],L(),Xe()}(t||de(e.target))&&je("onKeyDown",e)}function ve(e){if(1===y.selectedDates.length&&(!e||e.classList.contains("flatpickr-day")&&!e.classList.contains("flatpickr-disabled"))){for(var t=e?e.dateObj.getTime():y.days.firstElementChild.dateObj.getTime(),n=y.parseDate(y.selectedDates[0],void 0,!0).getTime(),r=Math.min(t,y.selectedDates[0].getTime()),i=Math.max(t,y.selectedDates[0].getTime()),o=!1,a=0,s=0,l=r;l<i;l+=C.DAY)fe(new Date(l),!0)||(o=o||l>r&&l<i,l<n&&(!a||l>a)?a=l:l>n&&(!s||l<s)&&(s=l));for(var c=0;c<y.config.showMonths;c++)for(var u=y.daysContainer.children[c],d=function(r,i){var l=u.children[r],c=l.dateObj.getTime(),d=a>0&&c<a||s>0&&c>s;return d?(l.classList.add("notAllowed"),["inRange","startRange","endRange"].forEach((function(e){l.classList.remove(e)})),"continue"):o&&!d?"continue":(["startRange","inRange","endRange","notAllowed"].forEach((function(e){l.classList.remove(e)})),void(void 0!==e&&(e.classList.add(t<=y.selectedDates[0].getTime()?"startRange":"endRange"),n<t&&c===n?l.classList.add("startRange"):n>t&&c===n&&l.classList.add("endRange"),c>=a&&(0===s||c<=s)&&_(c,n,t)&&l.classList.add("inRange"))))},p=0,h=u.children.length;p<h;p++)d(p,h)}}function ye(){!y.isOpen||y.config.static||y.config.inline||xe()}function be(){y.setDate(void 0!==y.config.minDate?new Date(y.config.minDate.getTime()):new Date,!0),Y(),Xe()}function we(e,t){if(void 0===t&&(t=y._positionElement),!0===y.isMobile)return e&&(e.preventDefault(),e.target&&e.target.blur()),void 0!==y.mobileInput&&(y.mobileInput.focus(),y.mobileInput.click()),void je("onOpen");if(!y._input.disabled&&!y.config.inline){var n=y.isOpen;y.isOpen=!0,n||(y.calendarContainer.classList.add("open"),y._input.classList.add("active"),je("onOpen"),xe(t)),!0===y.config.enableTime&&!0===y.config.noCalendar&&(0===y.selectedDates.length&&be(),!1!==y.config.allowInput||void 0!==e&&y.timeContainer.contains(e.relatedTarget)||setTimeout((function(){return y.hourElement.select()}),50))}}function De(e){return function(t){var n=y.config["_"+e+"Date"]=y.parseDate(t,y.config.dateFormat),r=y.config["_"+("min"===e?"max":"min")+"Date"];void 0!==n&&(y["min"===e?"minDateHasTime":"maxDateHasTime"]=n.getHours()>0||n.getMinutes()>0||n.getSeconds()>0),y.selectedDates&&(y.selectedDates=y.selectedDates.filter((function(e){return fe(e)})),y.selectedDates.length||"min"!==e||I(n),Xe()),y.daysContainer&&(Me(),void 0!==n?y.currentYearElement[e]=n.getFullYear().toString():y.currentYearElement.removeAttribute(e),y.currentYearElement.disabled=!!r&&void 0!==n&&r.getFullYear()===n.getFullYear())}}function _e(){var r=["wrap","weekNumbers","allowInput","clickOpens","time_24hr","enableTime","noCalendar","altInput","shorthandCurrentMonth","inline","static","enableSeconds","disableMobile"],i=e({},m,JSON.parse(JSON.stringify(f.dataset||{}))),o={};y.config.parseDate=i.parseDate,y.config.formatDate=i.formatDate,Object.defineProperty(y.config,"enable",{get:function(){return y.config._enable},set:function(e){y.config._enable=ke(e)}}),Object.defineProperty(y.config,"disable",{get:function(){return y.config._disable},set:function(e){y.config._disable=ke(e)}});var a="time"===i.mode;if(!i.dateFormat&&(i.enableTime||a)){var l=S.defaultConfig.dateFormat||n.dateFormat;o.dateFormat=i.noCalendar||a?"H:i"+(i.enableSeconds?":S":""):l+" H:i"+(i.enableSeconds?":S":"")}if(i.altInput&&(i.enableTime||a)&&!i.altFormat){var c=S.defaultConfig.altFormat||n.altFormat;o.altFormat=i.noCalendar||a?"h:i"+(i.enableSeconds?":S K":" K"):c+" h:i"+(i.enableSeconds?":S":"")+" K"}i.altInputClass||(y.config.altInputClass=y.input.className+" "+y.config.altInputClass),Object.defineProperty(y.config,"minDate",{get:function(){return y.config._minDate},set:De("min")}),Object.defineProperty(y.config,"maxDate",{get:function(){return y.config._maxDate},set:De("max")});var u=function(e){return function(t){y.config["min"===e?"_minTime":"_maxTime"]=y.parseDate(t,"H:i:S")}};Object.defineProperty(y.config,"minTime",{get:function(){return y.config._minTime},set:u("min")}),Object.defineProperty(y.config,"maxTime",{get:function(){return y.config._maxTime},set:u("max")}),"time"===i.mode&&(y.config.noCalendar=!0,y.config.enableTime=!0),Object.assign(y.config,o,i);for(var d=0;d<r.length;d++)y.config[r[d]]=!0===y.config[r[d]]||"true"===y.config[r[d]];for(t.filter((function(e){return void 0!==y.config[e]})).forEach((function(e){y.config[e]=s(y.config[e]||[]).map(A)})),y.isMobile=!y.config.disableMobile&&!y.config.inline&&"single"===y.config.mode&&!y.config.disable.length&&!y.config.enable.length&&!y.config.weekNumbers&&/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),d=0;d<y.config.plugins.length;d++){var p=y.config.plugins[d](y)||{};for(var h in p)t.indexOf(h)>-1?y.config[h]=s(p[h]).map(A).concat(y.config[h]):void 0===i[h]&&(y.config[h]=p[h])}je("onParseConfig")}function Ce(){"object"!=typeof y.config.locale&&void 0===S.l10ns[y.config.locale]&&y.config.errorHandler(new Error("flatpickr: invalid locale "+y.config.locale)),y.l10n=e({},S.l10ns.default,"object"==typeof y.config.locale?y.config.locale:"default"!==y.config.locale?S.l10ns[y.config.locale]:void 0),v.K="("+y.l10n.amPM[0]+"|"+y.l10n.amPM[1]+"|"+y.l10n.amPM[0].toLowerCase()+"|"+y.l10n.amPM[1].toLowerCase()+")",void 0===e({},m,JSON.parse(JSON.stringify(f.dataset||{}))).time_24hr&&void 0===S.defaultConfig.time_24hr&&(y.config.time_24hr=y.l10n.time_24hr),y.formatDate=b(y),y.parseDate=w({config:y.config,l10n:y.l10n})}function xe(e){if(void 0!==y.calendarContainer){je("onPreCalendarPosition");var t=e||y._positionElement,n=Array.prototype.reduce.call(y.calendarContainer.children,(function(e,t){return e+t.offsetHeight}),0),r=y.calendarContainer.offsetWidth,i=y.config.position.split(" "),o=i[0],a=i.length>1?i[1]:null,s=t.getBoundingClientRect(),c=window.innerHeight-s.bottom,u="above"===o||"below"!==o&&c<n&&s.top>n,d=window.pageYOffset+s.top+(u?-n-2:t.offsetHeight+2);if(l(y.calendarContainer,"arrowTop",!u),l(y.calendarContainer,"arrowBottom",u),!y.config.inline){var p=window.pageXOffset+s.left-(null!=a&&"center"===a?(r-s.width)/2:0),h=window.document.body.offsetWidth-(window.pageXOffset+s.right),f=p+r>window.document.body.offsetWidth,g=h+r>window.document.body.offsetWidth;if(l(y.calendarContainer,"rightMost",f),!y.config.static)if(y.calendarContainer.style.top=d+"px",f)if(g){var m=document.styleSheets[0];if(void 0===m)return;var v=window.document.body.offsetWidth,b=Math.max(0,v/2-r/2),w=".flatpickr-calendar.centerMost:before",D=".flatpickr-calendar.centerMost:after",_=m.cssRules.length,C="{left:"+s.left+"px;right:auto;}";l(y.calendarContainer,"rightMost",!1),l(y.calendarContainer,"centerMost",!0),m.insertRule(w+","+D+C,_),y.calendarContainer.style.left=b+"px",y.calendarContainer.style.right="auto"}else y.calendarContainer.style.left="auto",y.calendarContainer.style.right=h+"px";else y.calendarContainer.style.left=p+"px",y.calendarContainer.style.right="auto"}}}function Me(){y.config.noCalendar||y.isMobile||(We(),Z())}function Ee(){y._input.focus(),-1!==window.navigator.userAgent.indexOf("MSIE")||void 0!==navigator.msMaxTouchPoints?setTimeout(y.close,0):y.close()}function Se(e){e.preventDefault(),e.stopPropagation();var t=function(e){return e.classList&&e.classList.contains("flatpickr-day")&&!e.classList.contains("flatpickr-disabled")&&!e.classList.contains("notAllowed")},n=d(e.target,t);if(void 0!==n){var r=n,i=y.latestSelectedDateObj=new Date(r.dateObj.getTime()),o=(i.getMonth()<y.currentMonth||i.getMonth()>y.currentMonth+y.config.showMonths-1)&&"range"!==y.config.mode;if(y.selectedDateElem=r,"single"===y.config.mode)y.selectedDates=[i];else if("multiple"===y.config.mode){var a=Ne(i);a?y.selectedDates.splice(parseInt(a),1):y.selectedDates.push(i)}else"range"===y.config.mode&&(2===y.selectedDates.length&&y.clear(!1,!1),y.latestSelectedDateObj=i,y.selectedDates.push(i),0!==D(i,y.selectedDates[0],!0)&&y.selectedDates.sort((function(e,t){return e.getTime()-t.getTime()})));if(L(),o){var s=y.currentYear!==i.getFullYear();y.currentYear=i.getFullYear(),y.currentMonth=i.getMonth(),s&&(je("onYearChange"),V()),je("onMonthChange")}if(We(),Z(),Xe(),y.config.enableTime&&setTimeout((function(){return y.showTimeInput=!0}),50),o||"range"===y.config.mode||1!==y.config.showMonths?void 0!==y.selectedDateElem&&void 0===y.hourElement&&y.selectedDateElem&&y.selectedDateElem.focus():B(r),void 0!==y.hourElement&&void 0!==y.hourElement&&y.hourElement.focus(),y.config.closeOnSelect){var l="single"===y.config.mode&&!y.config.enableTime,c="range"===y.config.mode&&2===y.selectedDates.length&&!y.config.enableTime;(l||c)&&Ee()}R()}}y.parseDate=w({config:y.config,l10n:y.l10n}),y._handlers=[],y.pluginElements=[],y.loadedPlugins=[],y._bind=H,y._setHoursFromDate=I,y._positionCalendar=xe,y.changeMonth=se,y.changeYear=he,y.clear=le,y.close=ce,y._createElement=c,y.destroy=ue,y.isEnabled=fe,y.jumpToDate=F,y.open=we,y.redraw=Me,y.set=Te,y.setDate=Oe,y.toggle=Pe;var Ae={locale:[Ce,oe],showMonths:[te,T,ie],minDate:[F],maxDate:[F]};function Te(e,n){if(null!==e&&"object"==typeof e)for(var r in Object.assign(y.config,e),e)void 0!==Ae[r]&&Ae[r].forEach((function(e){return e()}));else y.config[e]=n,void 0!==Ae[e]?Ae[e].forEach((function(e){return e()})):t.indexOf(e)>-1&&(y.config[e]=s(n));y.redraw(),Xe(!1)}function $e(e,t){var n=[];if(e instanceof Array)n=e.map((function(e){return y.parseDate(e,t)}));else if(e instanceof Date||"number"==typeof e)n=[y.parseDate(e,t)];else if("string"==typeof e)switch(y.config.mode){case"single":case"time":n=[y.parseDate(e,t)];break;case"multiple":n=e.split(y.config.conjunction).map((function(e){return y.parseDate(e,t)}));break;case"range":n=e.split(y.l10n.rangeSeparator).map((function(e){return y.parseDate(e,t)}))}else y.config.errorHandler(new Error("Invalid date supplied: "+JSON.stringify(e)));y.selectedDates=n.filter((function(e){return e instanceof Date&&fe(e,!1)})),"range"===y.config.mode&&y.selectedDates.sort((function(e,t){return e.getTime()-t.getTime()}))}function Oe(e,t,n){if(void 0===t&&(t=!1),void 0===n&&(n=y.config.dateFormat),0!==e&&!e||e instanceof Array&&0===e.length)return y.clear(t);$e(e,n),y.showTimeInput=y.selectedDates.length>0,y.latestSelectedDateObj=y.selectedDates[y.selectedDates.length-1],y.redraw(),F(),I(),0===y.selectedDates.length&&y.clear(!1),Xe(t),t&&je("onChange")}function ke(e){return e.slice().map((function(e){return"string"==typeof e||"number"==typeof e||e instanceof Date?y.parseDate(e,void 0,!0):e&&"object"==typeof e&&e.from&&e.to?{from:y.parseDate(e.from,void 0),to:y.parseDate(e.to,void 0)}:e})).filter((function(e){return e}))}function Le(){y.selectedDates=[],y.now=y.parseDate(y.config.now)||new Date;var e=y.config.defaultDate||("INPUT"!==y.input.nodeName&&"TEXTAREA"!==y.input.nodeName||!y.input.placeholder||y.input.value!==y.input.placeholder?y.input.value:null);e&&$e(e,y.config.dateFormat),y._initialDate=y.selectedDates.length>0?y.selectedDates[0]:y.config.minDate&&y.config.minDate.getTime()>y.now.getTime()?y.config.minDate:y.config.maxDate&&y.config.maxDate.getTime()<y.now.getTime()?y.config.maxDate:y.now,y.currentYear=y._initialDate.getFullYear(),y.currentMonth=y._initialDate.getMonth(),y.selectedDates.length>0&&(y.latestSelectedDateObj=y.selectedDates[0]),void 0!==y.config.minTime&&(y.config.minTime=y.parseDate(y.config.minTime,"H:i")),void 0!==y.config.maxTime&&(y.config.maxTime=y.parseDate(y.config.maxTime,"H:i")),y.minDateHasTime=!!y.config.minDate&&(y.config.minDate.getHours()>0||y.config.minDate.getMinutes()>0||y.config.minDate.getSeconds()>0),y.maxDateHasTime=!!y.config.maxDate&&(y.config.maxDate.getHours()>0||y.config.maxDate.getMinutes()>0||y.config.maxDate.getSeconds()>0),Object.defineProperty(y,"showTimeInput",{get:function(){return y._showTimeInput},set:function(e){y._showTimeInput=e,y.calendarContainer&&l(y.calendarContainer,"showTimeInput",e),y.isOpen&&xe()}})}function Ie(){y.input=y.config.wrap?f.querySelector("[data-input]"):f,y.input?(y.input._type=y.input.type,y.input.type="text",y.input.classList.add("flatpickr-input"),y._input=y.input,y.config.altInput&&(y.altInput=c(y.input.nodeName,y.config.altInputClass),y._input=y.altInput,y.altInput.placeholder=y.input.placeholder,y.altInput.disabled=y.input.disabled,y.altInput.required=y.input.required,y.altInput.tabIndex=y.input.tabIndex,y.altInput.type="text",y.input.setAttribute("type","hidden"),!y.config.static&&y.input.parentNode&&y.input.parentNode.insertBefore(y.altInput,y.input.nextSibling)),y.config.allowInput||y._input.setAttribute("readonly","readonly"),y._positionElement=y.config.positionElement||y._input):y.config.errorHandler(new Error("Invalid input element specified"))}function Ye(){var e=y.config.enableTime?y.config.noCalendar?"time":"datetime-local":"date";y.mobileInput=c("input",y.input.className+" flatpickr-mobile"),y.mobileInput.step=y.input.getAttribute("step")||"any",y.mobileInput.tabIndex=1,y.mobileInput.type=e,y.mobileInput.disabled=y.input.disabled,y.mobileInput.required=y.input.required,y.mobileInput.placeholder=y.input.placeholder,y.mobileFormatStr="datetime-local"===e?"Y-m-d\\TH:i:S":"date"===e?"Y-m-d":"H:i:S",y.selectedDates.length>0&&(y.mobileInput.defaultValue=y.mobileInput.value=y.formatDate(y.selectedDates[0],y.mobileFormatStr)),y.config.minDate&&(y.mobileInput.min=y.formatDate(y.config.minDate,"Y-m-d")),y.config.maxDate&&(y.mobileInput.max=y.formatDate(y.config.maxDate,"Y-m-d")),y.input.type="hidden",void 0!==y.altInput&&(y.altInput.type="hidden");try{y.input.parentNode&&y.input.parentNode.insertBefore(y.mobileInput,y.input.nextSibling)}catch(e){}H(y.mobileInput,"change",(function(e){y.setDate(e.target.value,!1,y.mobileFormatStr),je("onChange"),je("onClose")}))}function Pe(e){if(!0===y.isOpen)return y.close();y.open(e)}function je(e,t){if(void 0!==y.config){var n=y.config[e];if(void 0!==n&&n.length>0)for(var r=0;n[r]&&r<n.length;r++)n[r](y.selectedDates,y.input.value,y,t);"onChange"===e&&(y.input.dispatchEvent(He("change")),y.input.dispatchEvent(He("input")))}}function He(e){var t=document.createEvent("Event");return t.initEvent(e,!0,!0),t}function Ne(e){for(var t=0;t<y.selectedDates.length;t++)if(0===D(y.selectedDates[t],e))return""+t;return!1}function Re(e){return!("range"!==y.config.mode||y.selectedDates.length<2)&&D(e,y.selectedDates[0])>=0&&D(e,y.selectedDates[1])<=0}function We(){y.config.noCalendar||y.isMobile||!y.monthNav||(y.yearElements.forEach((function(e,t){var n=new Date(y.currentYear,y.currentMonth,1);n.setMonth(y.currentMonth+t),y.config.showMonths>1||"static"===y.config.monthSelectorType?y.monthElements[t].textContent=g(n.getMonth(),y.config.shorthandCurrentMonth,y.l10n)+" ":y.monthsDropdownContainer.value=n.getMonth().toString(),e.value=n.getFullYear().toString()})),y._hidePrevMonthArrow=void 0!==y.config.minDate&&(y.currentYear===y.config.minDate.getFullYear()?y.currentMonth<=y.config.minDate.getMonth():y.currentYear<y.config.minDate.getFullYear()),y._hideNextMonthArrow=void 0!==y.config.maxDate&&(y.currentYear===y.config.maxDate.getFullYear()?y.currentMonth+1>y.config.maxDate.getMonth():y.currentYear>y.config.maxDate.getFullYear()))}function Fe(e){return y.selectedDates.map((function(t){return y.formatDate(t,e)})).filter((function(e,t,n){return"range"!==y.config.mode||y.config.enableTime||n.indexOf(e)===t})).join("range"!==y.config.mode?y.config.conjunction:y.l10n.rangeSeparator)}function Xe(e){void 0===e&&(e=!0),void 0!==y.mobileInput&&y.mobileFormatStr&&(y.mobileInput.value=void 0!==y.latestSelectedDateObj?y.formatDate(y.latestSelectedDateObj,y.mobileFormatStr):""),y.input.value=Fe(y.config.dateFormat),void 0!==y.altInput&&(y.altInput.value=Fe(y.config.altFormat)),!1!==e&&je("onValueUpdate")}function qe(e){var t=y.prevMonthNav.contains(e.target),n=y.nextMonthNav.contains(e.target);t||n?se(t?-1:1):y.yearElements.indexOf(e.target)>=0?e.target.select():e.target.classList.contains("arrowUp")?y.changeYear(y.currentYear+1):e.target.classList.contains("arrowDown")&&y.changeYear(y.currentYear-1)}function Ue(e){e.preventDefault();var t="keydown"===e.type,n=e.target;void 0!==y.amPM&&e.target===y.amPM&&(y.amPM.textContent=y.l10n.amPM[o(y.amPM.textContent===y.l10n.amPM[0])]);var r=parseFloat(n.getAttribute("min")),a=parseFloat(n.getAttribute("max")),s=parseFloat(n.getAttribute("step")),l=parseInt(n.value,10),c=l+s*(e.delta||(t?38===e.which?1:-1:0));if(void 0!==n.value&&2===n.value.length){var u=n===y.hourElement,d=n===y.minuteElement;c<r?(c=a+c+o(!u)+(o(u)&&o(!y.amPM)),d&&q(void 0,-1,y.hourElement)):c>a&&(c=n===y.hourElement?c-a-o(!y.amPM):r,d&&q(void 0,1,y.hourElement)),y.amPM&&u&&(1===s?c+l===23:Math.abs(c-l)>s)&&(y.amPM.textContent=y.l10n.amPM[o(y.amPM.textContent===y.l10n.amPM[0])]),n.value=i(c)}}return E(),y}function E(e,t){for(var n=Array.prototype.slice.call(e).filter((function(e){return e instanceof HTMLElement})),r=[],i=0;i<n.length;i++){var o=n[i];try{if(null!==o.getAttribute("data-fp-omit"))continue;void 0!==o._flatpickr&&(o._flatpickr.destroy(),o._flatpickr=void 0),o._flatpickr=M(o,t||{}),r.push(o._flatpickr)}catch(e){console.error(e)}}return 1===r.length?r[0]:r}"undefined"!=typeof HTMLElement&&"undefined"!=typeof HTMLCollection&&"undefined"!=typeof NodeList&&(HTMLCollection.prototype.flatpickr=NodeList.prototype.flatpickr=function(e){return E(this,e)},HTMLElement.prototype.flatpickr=function(e){return E([this],e)});var S=function(e,t){return"string"==typeof e?E(window.document.querySelectorAll(e),t):e instanceof Node?E([e],t):E(e,t)};return S.defaultConfig={},S.l10ns={en:e({},r),default:e({},r)},S.localize=function(t){S.l10ns.default=e({},S.l10ns.default,t)},S.setDefaults=function(t){S.defaultConfig=e({},S.defaultConfig,t)},S.parseDate=w({}),S.formatDate=b({}),S.compareDates=D,"undefined"!=typeof jQuery&&void 0!==jQuery.fn&&(jQuery.fn.flatpickr=function(e){return E(this,e)}),Date.prototype.fp_incr=function(e){return new Date(this.getFullYear(),this.getMonth(),this.getDate()+("string"==typeof e?parseInt(e,10):e))},"undefined"!=typeof window&&(window.flatpickr=S),S}()},686:(e,t,n)=>{var r,i,o;i=[n(9567)],r=function(e){var t=function(){if(e&&e.fn&&e.fn.select2&&e.fn.select2.amd)var t=e.fn.select2.amd;var n,r,i;return t&&t.requirejs||(t?r=t:t={},function(e){var t,o,a,s,l={},c={},u={},d={},p=Object.prototype.hasOwnProperty,h=[].slice,f=/\.js$/;function g(e,t){return p.call(e,t)}function m(e,t){var n,r,i,o,a,s,l,c,d,p,h,g=t&&t.split("/"),m=u.map,v=m&&m["*"]||{};if(e){for(a=(e=e.split("/")).length-1,u.nodeIdCompat&&f.test(e[a])&&(e[a]=e[a].replace(f,"")),"."===e[0].charAt(0)&&g&&(e=g.slice(0,g.length-1).concat(e)),d=0;d<e.length;d++)if("."===(h=e[d]))e.splice(d,1),d-=1;else if(".."===h){if(0===d||1===d&&".."===e[2]||".."===e[d-1])continue;d>0&&(e.splice(d-1,2),d-=2)}e=e.join("/")}if((g||v)&&m){for(d=(n=e.split("/")).length;d>0;d-=1){if(r=n.slice(0,d).join("/"),g)for(p=g.length;p>0;p-=1)if((i=m[g.slice(0,p).join("/")])&&(i=i[r])){o=i,s=d;break}if(o)break;!l&&v&&v[r]&&(l=v[r],c=d)}!o&&l&&(o=l,s=c),o&&(n.splice(0,s,o),e=n.join("/"))}return e}function v(t,n){return function(){var r=h.call(arguments,0);return"string"!=typeof r[0]&&1===r.length&&r.push(null),o.apply(e,r.concat([t,n]))}}function y(e){return function(t){return m(t,e)}}function b(e){return function(t){l[e]=t}}function w(n){if(g(c,n)){var r=c[n];delete c[n],d[n]=!0,t.apply(e,r)}if(!g(l,n)&&!g(d,n))throw new Error("No "+n);return l[n]}function D(e){var t,n=e?e.indexOf("!"):-1;return n>-1&&(t=e.substring(0,n),e=e.substring(n+1,e.length)),[t,e]}function _(e){return e?D(e):[]}function C(e){return function(){return u&&u.config&&u.config[e]||{}}}a=function(e,t){var n,r=D(e),i=r[0],o=t[1];return e=r[1],i&&(n=w(i=m(i,o))),i?e=n&&n.normalize?n.normalize(e,y(o)):m(e,o):(i=(r=D(e=m(e,o)))[0],e=r[1],i&&(n=w(i))),{f:i?i+"!"+e:e,n:e,pr:i,p:n}},s={require:function(e){return v(e)},exports:function(e){var t=l[e];return void 0!==t?t:l[e]={}},module:function(e){return{id:e,uri:"",exports:l[e],config:C(e)}}},t=function(t,n,r,i){var o,u,p,h,f,m,y,D=[],C=typeof r;if(m=_(i=i||t),"undefined"===C||"function"===C){for(n=!n.length&&r.length?["require","exports","module"]:n,f=0;f<n.length;f+=1)if("require"===(u=(h=a(n[f],m)).f))D[f]=s.require(t);else if("exports"===u)D[f]=s.exports(t),y=!0;else if("module"===u)o=D[f]=s.module(t);else if(g(l,u)||g(c,u)||g(d,u))D[f]=w(u);else{if(!h.p)throw new Error(t+" missing "+u);h.p.load(h.n,v(i,!0),b(u),{}),D[f]=l[u]}p=r?r.apply(l[t],D):void 0,t&&(o&&o.exports!==e&&o.exports!==l[t]?l[t]=o.exports:p===e&&y||(l[t]=p))}else t&&(l[t]=r)},n=r=o=function(n,r,i,l,c){if("string"==typeof n)return s[n]?s[n](r):w(a(n,_(r)).f);if(!n.splice){if((u=n).deps&&o(u.deps,u.callback),!r)return;r.splice?(n=r,r=i,i=null):n=e}return r=r||function(){},"function"==typeof i&&(i=l,l=c),l?t(e,n,r,i):setTimeout((function(){t(e,n,r,i)}),4),o},o.config=function(e){return o(e)},n._defined=l,(i=function(e,t,n){if("string"!=typeof e)throw new Error("See almond README: incorrect module build, no module name");t.splice||(n=t,t=[]),g(l,e)||g(c,e)||(c[e]=[e,t,n])}).amd={jQuery:!0}}(),t.requirejs=n,t.require=r,t.define=i),t.define("almond",(function(){})),t.define("jquery",[],(function(){var t=e||$;return null==t&&console&&console.error&&console.error("Select2: An instance of jQuery or a jQuery-compatible library was not found. Make sure that you are including jQuery before Select2 on your web page."),t})),t.define("select2/utils",["jquery"],(function(e){var t={};function n(e){var t=e.prototype,n=[];for(var r in t)"function"==typeof t[r]&&"constructor"!==r&&n.push(r);return n}t.Extend=function(e,t){var n={}.hasOwnProperty;function r(){this.constructor=e}for(var i in t)n.call(t,i)&&(e[i]=t[i]);return r.prototype=t.prototype,e.prototype=new r,e.__super__=t.prototype,e},t.Decorate=function(e,t){var r=n(t),i=n(e);function o(){var n=Array.prototype.unshift,r=t.prototype.constructor.length,i=e.prototype.constructor;r>0&&(n.call(arguments,e.prototype.constructor),i=t.prototype.constructor),i.apply(this,arguments)}function a(){this.constructor=o}t.displayName=e.displayName,o.prototype=new a;for(var s=0;s<i.length;s++){var l=i[s];o.prototype[l]=e.prototype[l]}for(var c=function(e){var n=function(){};e in o.prototype&&(n=o.prototype[e]);var r=t.prototype[e];return function(){return Array.prototype.unshift.call(arguments,n),r.apply(this,arguments)}},u=0;u<r.length;u++){var d=r[u];o.prototype[d]=c(d)}return o};var r=function(){this.listeners={}};r.prototype.on=function(e,t){this.listeners=this.listeners||{},e in this.listeners?this.listeners[e].push(t):this.listeners[e]=[t]},r.prototype.trigger=function(e){var t=Array.prototype.slice,n=t.call(arguments,1);this.listeners=this.listeners||{},null==n&&(n=[]),0===n.length&&n.push({}),n[0]._type=e,e in this.listeners&&this.invoke(this.listeners[e],t.call(arguments,1)),"*"in this.listeners&&this.invoke(this.listeners["*"],arguments)},r.prototype.invoke=function(e,t){for(var n=0,r=e.length;n<r;n++)e[n].apply(this,t)},t.Observable=r,t.generateChars=function(e){for(var t="",n=0;n<e;n++)t+=Math.floor(36*Math.random()).toString(36);return t},t.bind=function(e,t){return function(){e.apply(t,arguments)}},t._convertData=function(e){for(var t in e){var n=t.split("-"),r=e;if(1!==n.length){for(var i=0;i<n.length;i++){var o=n[i];(o=o.substring(0,1).toLowerCase()+o.substring(1))in r||(r[o]={}),i==n.length-1&&(r[o]=e[t]),r=r[o]}delete e[t]}}return e},t.hasScroll=function(t,n){var r=e(n),i=n.style.overflowX,o=n.style.overflowY;return(i!==o||"hidden"!==o&&"visible"!==o)&&("scroll"===i||"scroll"===o||r.innerHeight()<n.scrollHeight||r.innerWidth()<n.scrollWidth)},t.escapeMarkup=function(e){var t={"\\":"&#92;","&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#47;"};return"string"!=typeof e?e:String(e).replace(/[&<>"'\/\\]/g,(function(e){return t[e]}))},t.appendMany=function(t,n){if("1.7"===e.fn.jquery.substr(0,3)){var r=e();e.map(n,(function(e){r=r.add(e)})),n=r}t.append(n)},t.__cache={};var i=0;return t.GetUniqueElementId=function(e){var t=e.getAttribute("data-select2-id");return null==t&&(e.id?(t=e.id,e.setAttribute("data-select2-id",t)):(e.setAttribute("data-select2-id",++i),t=i.toString())),t},t.StoreData=function(e,n,r){var i=t.GetUniqueElementId(e);t.__cache[i]||(t.__cache[i]={}),t.__cache[i][n]=r},t.GetData=function(n,r){var i=t.GetUniqueElementId(n);return r?t.__cache[i]&&null!=t.__cache[i][r]?t.__cache[i][r]:e(n).data(r):t.__cache[i]},t.RemoveData=function(e){var n=t.GetUniqueElementId(e);null!=t.__cache[n]&&delete t.__cache[n],e.removeAttribute("data-select2-id")},t})),t.define("select2/results",["jquery","./utils"],(function(e,t){function n(e,t,r){this.$element=e,this.data=r,this.options=t,n.__super__.constructor.call(this)}return t.Extend(n,t.Observable),n.prototype.render=function(){var t=e('<ul class="select2-results__options" role="listbox"></ul>');return this.options.get("multiple")&&t.attr("aria-multiselectable","true"),this.$results=t,t},n.prototype.clear=function(){this.$results.empty()},n.prototype.displayMessage=function(t){var n=this.options.get("escapeMarkup");this.clear(),this.hideLoading();var r=e('<li role="alert" aria-live="assertive" class="select2-results__option"></li>'),i=this.options.get("translations").get(t.message);r.append(n(i(t.args))),r[0].className+=" select2-results__message",this.$results.append(r)},n.prototype.hideMessages=function(){this.$results.find(".select2-results__message").remove()},n.prototype.append=function(e){this.hideLoading();var t=[];if(null!=e.results&&0!==e.results.length){e.results=this.sort(e.results);for(var n=0;n<e.results.length;n++){var r=e.results[n],i=this.option(r);t.push(i)}this.$results.append(t)}else 0===this.$results.children().length&&this.trigger("results:message",{message:"noResults"})},n.prototype.position=function(e,t){t.find(".select2-results").append(e)},n.prototype.sort=function(e){return this.options.get("sorter")(e)},n.prototype.highlightFirstItem=function(){var e=this.$results.find(".select2-results__option[aria-selected]"),t=e.filter("[aria-selected=true]");t.length>0?t.first().trigger("mouseenter"):e.first().trigger("mouseenter"),this.ensureHighlightVisible()},n.prototype.setClasses=function(){var n=this;this.data.current((function(r){var i=e.map(r,(function(e){return e.id.toString()}));n.$results.find(".select2-results__option[aria-selected]").each((function(){var n=e(this),r=t.GetData(this,"data"),o=""+r.id;null!=r.element&&r.element.selected||null==r.element&&e.inArray(o,i)>-1?n.attr("aria-selected","true"):n.attr("aria-selected","false")}))}))},n.prototype.showLoading=function(e){this.hideLoading();var t={disabled:!0,loading:!0,text:this.options.get("translations").get("searching")(e)},n=this.option(t);n.className+=" loading-results",this.$results.prepend(n)},n.prototype.hideLoading=function(){this.$results.find(".loading-results").remove()},n.prototype.option=function(n){var r=document.createElement("li");r.className="select2-results__option";var i={role:"option","aria-selected":"false"},o=window.Element.prototype.matches||window.Element.prototype.msMatchesSelector||window.Element.prototype.webkitMatchesSelector;for(var a in(null!=n.element&&o.call(n.element,":disabled")||null==n.element&&n.disabled)&&(delete i["aria-selected"],i["aria-disabled"]="true"),null==n.id&&delete i["aria-selected"],null!=n._resultId&&(r.id=n._resultId),n.title&&(r.title=n.title),n.children&&(i.role="group",i["aria-label"]=n.text,delete i["aria-selected"]),i){var s=i[a];r.setAttribute(a,s)}if(n.children){var l=e(r),c=document.createElement("strong");c.className="select2-results__group",e(c),this.template(n,c);for(var u=[],d=0;d<n.children.length;d++){var p=n.children[d],h=this.option(p);u.push(h)}var f=e("<ul></ul>",{class:"select2-results__options select2-results__options--nested"});f.append(u),l.append(c),l.append(f)}else this.template(n,r);return t.StoreData(r,"data",n),r},n.prototype.bind=function(n,r){var i=this,o=n.id+"-results";this.$results.attr("id",o),n.on("results:all",(function(e){i.clear(),i.append(e.data),n.isOpen()&&(i.setClasses(),i.highlightFirstItem())})),n.on("results:append",(function(e){i.append(e.data),n.isOpen()&&i.setClasses()})),n.on("query",(function(e){i.hideMessages(),i.showLoading(e)})),n.on("select",(function(){n.isOpen()&&(i.setClasses(),i.options.get("scrollAfterSelect")&&i.highlightFirstItem())})),n.on("unselect",(function(){n.isOpen()&&(i.setClasses(),i.options.get("scrollAfterSelect")&&i.highlightFirstItem())})),n.on("open",(function(){i.$results.attr("aria-expanded","true"),i.$results.attr("aria-hidden","false"),i.setClasses(),i.ensureHighlightVisible()})),n.on("close",(function(){i.$results.attr("aria-expanded","false"),i.$results.attr("aria-hidden","true"),i.$results.removeAttr("aria-activedescendant")})),n.on("results:toggle",(function(){var e=i.getHighlightedResults();0!==e.length&&e.trigger("mouseup")})),n.on("results:select",(function(){var e=i.getHighlightedResults();if(0!==e.length){var n=t.GetData(e[0],"data");"true"==e.attr("aria-selected")?i.trigger("close",{}):i.trigger("select",{data:n})}})),n.on("results:previous",(function(){var e=i.getHighlightedResults(),t=i.$results.find("[aria-selected]"),n=t.index(e);if(!(n<=0)){var r=n-1;0===e.length&&(r=0);var o=t.eq(r);o.trigger("mouseenter");var a=i.$results.offset().top,s=o.offset().top,l=i.$results.scrollTop()+(s-a);0===r?i.$results.scrollTop(0):s-a<0&&i.$results.scrollTop(l)}})),n.on("results:next",(function(){var e=i.getHighlightedResults(),t=i.$results.find("[aria-selected]"),n=t.index(e)+1;if(!(n>=t.length)){var r=t.eq(n);r.trigger("mouseenter");var o=i.$results.offset().top+i.$results.outerHeight(!1),a=r.offset().top+r.outerHeight(!1),s=i.$results.scrollTop()+a-o;0===n?i.$results.scrollTop(0):a>o&&i.$results.scrollTop(s)}})),n.on("results:focus",(function(e){e.element.addClass("select2-results__option--highlighted")})),n.on("results:message",(function(e){i.displayMessage(e)})),e.fn.mousewheel&&this.$results.on("mousewheel",(function(e){var t=i.$results.scrollTop(),n=i.$results.get(0).scrollHeight-t+e.deltaY,r=e.deltaY>0&&t-e.deltaY<=0,o=e.deltaY<0&&n<=i.$results.height();r?(i.$results.scrollTop(0),e.preventDefault(),e.stopPropagation()):o&&(i.$results.scrollTop(i.$results.get(0).scrollHeight-i.$results.height()),e.preventDefault(),e.stopPropagation())})),this.$results.on("mouseup",".select2-results__option[aria-selected]",(function(n){var r=e(this),o=t.GetData(this,"data");"true"!==r.attr("aria-selected")?i.trigger("select",{originalEvent:n,data:o}):i.options.get("multiple")?i.trigger("unselect",{originalEvent:n,data:o}):i.trigger("close",{})})),this.$results.on("mouseenter",".select2-results__option[aria-selected]",(function(n){var r=t.GetData(this,"data");i.getHighlightedResults().removeClass("select2-results__option--highlighted"),i.trigger("results:focus",{data:r,element:e(this)})}))},n.prototype.getHighlightedResults=function(){return this.$results.find(".select2-results__option--highlighted")},n.prototype.destroy=function(){this.$results.remove()},n.prototype.ensureHighlightVisible=function(){var e=this.getHighlightedResults();if(0!==e.length){var t=this.$results.find("[aria-selected]").index(e),n=this.$results.offset().top,r=e.offset().top,i=this.$results.scrollTop()+(r-n),o=r-n;i-=2*e.outerHeight(!1),t<=2?this.$results.scrollTop(0):(o>this.$results.outerHeight()||o<0)&&this.$results.scrollTop(i)}},n.prototype.template=function(t,n){var r=this.options.get("templateResult"),i=this.options.get("escapeMarkup"),o=r(t,n);null==o?n.style.display="none":"string"==typeof o?n.innerHTML=i(o):e(n).append(o)},n})),t.define("select2/keys",[],(function(){return{BACKSPACE:8,TAB:9,ENTER:13,SHIFT:16,CTRL:17,ALT:18,ESC:27,SPACE:32,PAGE_UP:33,PAGE_DOWN:34,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40,DELETE:46}})),t.define("select2/selection/base",["jquery","../utils","../keys"],(function(e,t,n){function r(e,t){this.$element=e,this.options=t,r.__super__.constructor.call(this)}return t.Extend(r,t.Observable),r.prototype.render=function(){var n=e('<span class="select2-selection" role="combobox"  aria-haspopup="true" aria-expanded="false"></span>');return this._tabindex=0,null!=t.GetData(this.$element[0],"old-tabindex")?this._tabindex=t.GetData(this.$element[0],"old-tabindex"):null!=this.$element.attr("tabindex")&&(this._tabindex=this.$element.attr("tabindex")),n.attr("title",this.$element.attr("title")),n.attr("tabindex",this._tabindex),n.attr("aria-disabled","false"),this.$selection=n,n},r.prototype.bind=function(e,t){var r=this,i=e.id+"-results";this.container=e,this.$selection.on("focus",(function(e){r.trigger("focus",e)})),this.$selection.on("blur",(function(e){r._handleBlur(e)})),this.$selection.on("keydown",(function(e){r.trigger("keypress",e),e.which===n.SPACE&&e.preventDefault()})),e.on("results:focus",(function(e){r.$selection.attr("aria-activedescendant",e.data._resultId)})),e.on("selection:update",(function(e){r.update(e.data)})),e.on("open",(function(){r.$selection.attr("aria-expanded","true"),r.$selection.attr("aria-owns",i),r._attachCloseHandler(e)})),e.on("close",(function(){r.$selection.attr("aria-expanded","false"),r.$selection.removeAttr("aria-activedescendant"),r.$selection.removeAttr("aria-owns"),r.$selection.trigger("focus"),r._detachCloseHandler(e)})),e.on("enable",(function(){r.$selection.attr("tabindex",r._tabindex),r.$selection.attr("aria-disabled","false")})),e.on("disable",(function(){r.$selection.attr("tabindex","-1"),r.$selection.attr("aria-disabled","true")}))},r.prototype._handleBlur=function(t){var n=this;window.setTimeout((function(){document.activeElement==n.$selection[0]||e.contains(n.$selection[0],document.activeElement)||n.trigger("blur",t)}),1)},r.prototype._attachCloseHandler=function(n){e(document.body).on("mousedown.select2."+n.id,(function(n){var r=e(n.target).closest(".select2");e(".select2.select2-container--open").each((function(){this!=r[0]&&t.GetData(this,"element").select2("close")}))}))},r.prototype._detachCloseHandler=function(t){e(document.body).off("mousedown.select2."+t.id)},r.prototype.position=function(e,t){t.find(".selection").append(e)},r.prototype.destroy=function(){this._detachCloseHandler(this.container)},r.prototype.update=function(e){throw new Error("The `update` method must be defined in child classes.")},r.prototype.isEnabled=function(){return!this.isDisabled()},r.prototype.isDisabled=function(){return this.options.get("disabled")},r})),t.define("select2/selection/single",["jquery","./base","../utils","../keys"],(function(e,t,n,r){function i(){i.__super__.constructor.apply(this,arguments)}return n.Extend(i,t),i.prototype.render=function(){var e=i.__super__.render.call(this);return e.addClass("select2-selection--single"),e.html('<span class="select2-selection__rendered"></span><span class="select2-selection__arrow" role="presentation"><b role="presentation"></b></span>'),e},i.prototype.bind=function(e,t){var n=this;i.__super__.bind.apply(this,arguments);var r=e.id+"-container";this.$selection.find(".select2-selection__rendered").attr("id",r).attr("role","textbox").attr("aria-readonly","true"),this.$selection.attr("aria-labelledby",r),this.$selection.on("mousedown",(function(e){1===e.which&&n.trigger("toggle",{originalEvent:e})})),this.$selection.on("focus",(function(e){})),this.$selection.on("blur",(function(e){})),e.on("focus",(function(t){e.isOpen()||n.$selection.trigger("focus")}))},i.prototype.clear=function(){var e=this.$selection.find(".select2-selection__rendered");e.empty(),e.removeAttr("title")},i.prototype.display=function(e,t){var n=this.options.get("templateSelection");return this.options.get("escapeMarkup")(n(e,t))},i.prototype.selectionContainer=function(){return e("<span></span>")},i.prototype.update=function(e){if(0!==e.length){var t=e[0],n=this.$selection.find(".select2-selection__rendered"),r=this.display(t,n);n.empty().append(r);var i=t.title||t.text;i?n.attr("title",i):n.removeAttr("title")}else this.clear()},i})),t.define("select2/selection/multiple",["jquery","./base","../utils"],(function(e,t,n){function r(e,t){r.__super__.constructor.apply(this,arguments)}return n.Extend(r,t),r.prototype.render=function(){var e=r.__super__.render.call(this);return e.addClass("select2-selection--multiple"),e.html('<ul class="select2-selection__rendered"></ul>'),e},r.prototype.bind=function(t,i){var o=this;r.__super__.bind.apply(this,arguments),this.$selection.on("click",(function(e){o.trigger("toggle",{originalEvent:e})})),this.$selection.on("click",".select2-selection__choice__remove",(function(t){if(!o.isDisabled()){var r=e(this).parent(),i=n.GetData(r[0],"data");o.trigger("unselect",{originalEvent:t,data:i})}}))},r.prototype.clear=function(){var e=this.$selection.find(".select2-selection__rendered");e.empty(),e.removeAttr("title")},r.prototype.display=function(e,t){var n=this.options.get("templateSelection");return this.options.get("escapeMarkup")(n(e,t))},r.prototype.selectionContainer=function(){return e('<li class="select2-selection__choice"><span class="select2-selection__choice__remove" role="presentation">&times;</span></li>')},r.prototype.update=function(e){if(this.clear(),0!==e.length){for(var t=[],r=0;r<e.length;r++){var i=e[r],o=this.selectionContainer(),a=this.display(i,o);o.append(a);var s=i.title||i.text;s&&o.attr("title",s),n.StoreData(o[0],"data",i),t.push(o)}var l=this.$selection.find(".select2-selection__rendered");n.appendMany(l,t)}},r})),t.define("select2/selection/placeholder",["../utils"],(function(e){function t(e,t,n){this.placeholder=this.normalizePlaceholder(n.get("placeholder")),e.call(this,t,n)}return t.prototype.normalizePlaceholder=function(e,t){return"string"==typeof t&&(t={id:"",text:t}),t},t.prototype.createPlaceholder=function(e,t){var n=this.selectionContainer();return n.html(this.display(t)),n.addClass("select2-selection__placeholder").removeClass("select2-selection__choice"),n},t.prototype.update=function(e,t){var n=1==t.length&&t[0].id!=this.placeholder.id;if(t.length>1||n)return e.call(this,t);this.clear();var r=this.createPlaceholder(this.placeholder);this.$selection.find(".select2-selection__rendered").append(r)},t})),t.define("select2/selection/allowClear",["jquery","../keys","../utils"],(function(e,t,n){function r(){}return r.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),null==this.placeholder&&this.options.get("debug")&&window.console&&console.error&&console.error("Select2: The `allowClear` option should be used in combination with the `placeholder` option."),this.$selection.on("mousedown",".select2-selection__clear",(function(e){r._handleClear(e)})),t.on("keypress",(function(e){r._handleKeyboardClear(e,t)}))},r.prototype._handleClear=function(e,t){if(!this.isDisabled()){var r=this.$selection.find(".select2-selection__clear");if(0!==r.length){t.stopPropagation();var i=n.GetData(r[0],"data"),o=this.$element.val();this.$element.val(this.placeholder.id);var a={data:i};if(this.trigger("clear",a),a.prevented)this.$element.val(o);else{for(var s=0;s<i.length;s++)if(a={data:i[s]},this.trigger("unselect",a),a.prevented)return void this.$element.val(o);this.$element.trigger("input").trigger("change"),this.trigger("toggle",{})}}}},r.prototype._handleKeyboardClear=function(e,n,r){r.isOpen()||n.which!=t.DELETE&&n.which!=t.BACKSPACE||this._handleClear(n)},r.prototype.update=function(t,r){if(t.call(this,r),!(this.$selection.find(".select2-selection__placeholder").length>0||0===r.length)){var i=this.options.get("translations").get("removeAllItems"),o=e('<span class="select2-selection__clear" title="'+i()+'">&times;</span>');n.StoreData(o[0],"data",r),this.$selection.find(".select2-selection__rendered").prepend(o)}},r})),t.define("select2/selection/search",["jquery","../utils","../keys"],(function(e,t,n){function r(e,t,n){e.call(this,t,n)}return r.prototype.render=function(t){var n=e('<li class="select2-search select2-search--inline"><input class="select2-search__field" type="search" tabindex="-1" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" /></li>');this.$searchContainer=n,this.$search=n.find("input");var r=t.call(this);return this._transferTabIndex(),r},r.prototype.bind=function(e,r,i){var o=this,a=r.id+"-results";e.call(this,r,i),r.on("open",(function(){o.$search.attr("aria-controls",a),o.$search.trigger("focus")})),r.on("close",(function(){o.$search.val(""),o.$search.removeAttr("aria-controls"),o.$search.removeAttr("aria-activedescendant"),o.$search.trigger("focus")})),r.on("enable",(function(){o.$search.prop("disabled",!1),o._transferTabIndex()})),r.on("disable",(function(){o.$search.prop("disabled",!0)})),r.on("focus",(function(e){o.$search.trigger("focus")})),r.on("results:focus",(function(e){e.data._resultId?o.$search.attr("aria-activedescendant",e.data._resultId):o.$search.removeAttr("aria-activedescendant")})),this.$selection.on("focusin",".select2-search--inline",(function(e){o.trigger("focus",e)})),this.$selection.on("focusout",".select2-search--inline",(function(e){o._handleBlur(e)})),this.$selection.on("keydown",".select2-search--inline",(function(e){if(e.stopPropagation(),o.trigger("keypress",e),o._keyUpPrevented=e.isDefaultPrevented(),e.which===n.BACKSPACE&&""===o.$search.val()){var r=o.$searchContainer.prev(".select2-selection__choice");if(r.length>0){var i=t.GetData(r[0],"data");o.searchRemoveChoice(i),e.preventDefault()}}})),this.$selection.on("click",".select2-search--inline",(function(e){o.$search.val()&&e.stopPropagation()}));var s=document.documentMode,l=s&&s<=11;this.$selection.on("input.searchcheck",".select2-search--inline",(function(e){l?o.$selection.off("input.search input.searchcheck"):o.$selection.off("keyup.search")})),this.$selection.on("keyup.search input.search",".select2-search--inline",(function(e){if(l&&"input"===e.type)o.$selection.off("input.search input.searchcheck");else{var t=e.which;t!=n.SHIFT&&t!=n.CTRL&&t!=n.ALT&&t!=n.TAB&&o.handleSearch(e)}}))},r.prototype._transferTabIndex=function(e){this.$search.attr("tabindex",this.$selection.attr("tabindex")),this.$selection.attr("tabindex","-1")},r.prototype.createPlaceholder=function(e,t){this.$search.attr("placeholder",t.text)},r.prototype.update=function(e,t){var n=this.$search[0]==document.activeElement;this.$search.attr("placeholder",""),e.call(this,t),this.$selection.find(".select2-selection__rendered").append(this.$searchContainer),this.resizeSearch(),n&&this.$search.trigger("focus")},r.prototype.handleSearch=function(){if(this.resizeSearch(),!this._keyUpPrevented){var e=this.$search.val();this.trigger("query",{term:e})}this._keyUpPrevented=!1},r.prototype.searchRemoveChoice=function(e,t){this.trigger("unselect",{data:t}),this.$search.val(t.text),this.handleSearch()},r.prototype.resizeSearch=function(){this.$search.css("width","25px");var e="";e=""!==this.$search.attr("placeholder")?this.$selection.find(".select2-selection__rendered").width():.75*(this.$search.val().length+1)+"em",this.$search.css("width",e)},r})),t.define("select2/selection/eventRelay",["jquery"],(function(e){function t(){}return t.prototype.bind=function(t,n,r){var i=this,o=["open","opening","close","closing","select","selecting","unselect","unselecting","clear","clearing"],a=["opening","closing","selecting","unselecting","clearing"];t.call(this,n,r),n.on("*",(function(t,n){if(-1!==e.inArray(t,o)){n=n||{};var r=e.Event("select2:"+t,{params:n});i.$element.trigger(r),-1!==e.inArray(t,a)&&(n.prevented=r.isDefaultPrevented())}}))},t})),t.define("select2/translation",["jquery","require"],(function(e,t){function n(e){this.dict=e||{}}return n.prototype.all=function(){return this.dict},n.prototype.get=function(e){return this.dict[e]},n.prototype.extend=function(t){this.dict=e.extend({},t.all(),this.dict)},n._cache={},n.loadPath=function(e){if(!(e in n._cache)){var r=t(e);n._cache[e]=r}return new n(n._cache[e])},n})),t.define("select2/diacritics",[],(function(){return{"Ⓐ":"A",Ａ:"A",À:"A",Á:"A",Â:"A",Ầ:"A",Ấ:"A",Ẫ:"A",Ẩ:"A",Ã:"A",Ā:"A",Ă:"A",Ằ:"A",Ắ:"A",Ẵ:"A",Ẳ:"A",Ȧ:"A",Ǡ:"A",Ä:"A",Ǟ:"A",Ả:"A",Å:"A",Ǻ:"A",Ǎ:"A",Ȁ:"A",Ȃ:"A",Ạ:"A",Ậ:"A",Ặ:"A",Ḁ:"A",Ą:"A",Ⱥ:"A",Ɐ:"A",Ꜳ:"AA",Æ:"AE",Ǽ:"AE",Ǣ:"AE",Ꜵ:"AO",Ꜷ:"AU",Ꜹ:"AV",Ꜻ:"AV",Ꜽ:"AY","Ⓑ":"B",Ｂ:"B",Ḃ:"B",Ḅ:"B",Ḇ:"B",Ƀ:"B",Ƃ:"B",Ɓ:"B","Ⓒ":"C",Ｃ:"C",Ć:"C",Ĉ:"C",Ċ:"C",Č:"C",Ç:"C",Ḉ:"C",Ƈ:"C",Ȼ:"C",Ꜿ:"C","Ⓓ":"D",Ｄ:"D",Ḋ:"D",Ď:"D",Ḍ:"D",Ḑ:"D",Ḓ:"D",Ḏ:"D",Đ:"D",Ƌ:"D",Ɗ:"D",Ɖ:"D",Ꝺ:"D",Ǳ:"DZ",Ǆ:"DZ",ǲ:"Dz",ǅ:"Dz","Ⓔ":"E",Ｅ:"E",È:"E",É:"E",Ê:"E",Ề:"E",Ế:"E",Ễ:"E",Ể:"E",Ẽ:"E",Ē:"E",Ḕ:"E",Ḗ:"E",Ĕ:"E",Ė:"E",Ë:"E",Ẻ:"E",Ě:"E",Ȅ:"E",Ȇ:"E",Ẹ:"E",Ệ:"E",Ȩ:"E",Ḝ:"E",Ę:"E",Ḙ:"E",Ḛ:"E",Ɛ:"E",Ǝ:"E","Ⓕ":"F",Ｆ:"F",Ḟ:"F",Ƒ:"F",Ꝼ:"F","Ⓖ":"G",Ｇ:"G",Ǵ:"G",Ĝ:"G",Ḡ:"G",Ğ:"G",Ġ:"G",Ǧ:"G",Ģ:"G",Ǥ:"G",Ɠ:"G",Ꞡ:"G",Ᵹ:"G",Ꝿ:"G","Ⓗ":"H",Ｈ:"H",Ĥ:"H",Ḣ:"H",Ḧ:"H",Ȟ:"H",Ḥ:"H",Ḩ:"H",Ḫ:"H",Ħ:"H",Ⱨ:"H",Ⱶ:"H",Ɥ:"H","Ⓘ":"I",Ｉ:"I",Ì:"I",Í:"I",Î:"I",Ĩ:"I",Ī:"I",Ĭ:"I",İ:"I",Ï:"I",Ḯ:"I",Ỉ:"I",Ǐ:"I",Ȉ:"I",Ȋ:"I",Ị:"I",Į:"I",Ḭ:"I",Ɨ:"I","Ⓙ":"J",Ｊ:"J",Ĵ:"J",Ɉ:"J","Ⓚ":"K",Ｋ:"K",Ḱ:"K",Ǩ:"K",Ḳ:"K",Ķ:"K",Ḵ:"K",Ƙ:"K",Ⱪ:"K",Ꝁ:"K",Ꝃ:"K",Ꝅ:"K",Ꞣ:"K","Ⓛ":"L",Ｌ:"L",Ŀ:"L",Ĺ:"L",Ľ:"L",Ḷ:"L",Ḹ:"L",Ļ:"L",Ḽ:"L",Ḻ:"L",Ł:"L",Ƚ:"L",Ɫ:"L",Ⱡ:"L",Ꝉ:"L",Ꝇ:"L",Ꞁ:"L",Ǉ:"LJ",ǈ:"Lj","Ⓜ":"M",Ｍ:"M",Ḿ:"M",Ṁ:"M",Ṃ:"M",Ɱ:"M",Ɯ:"M","Ⓝ":"N",Ｎ:"N",Ǹ:"N",Ń:"N",Ñ:"N",Ṅ:"N",Ň:"N",Ṇ:"N",Ņ:"N",Ṋ:"N",Ṉ:"N",Ƞ:"N",Ɲ:"N",Ꞑ:"N",Ꞥ:"N",Ǌ:"NJ",ǋ:"Nj","Ⓞ":"O",Ｏ:"O",Ò:"O",Ó:"O",Ô:"O",Ồ:"O",Ố:"O",Ỗ:"O",Ổ:"O",Õ:"O",Ṍ:"O",Ȭ:"O",Ṏ:"O",Ō:"O",Ṑ:"O",Ṓ:"O",Ŏ:"O",Ȯ:"O",Ȱ:"O",Ö:"O",Ȫ:"O",Ỏ:"O",Ő:"O",Ǒ:"O",Ȍ:"O",Ȏ:"O",Ơ:"O",Ờ:"O",Ớ:"O",Ỡ:"O",Ở:"O",Ợ:"O",Ọ:"O",Ộ:"O",Ǫ:"O",Ǭ:"O",Ø:"O",Ǿ:"O",Ɔ:"O",Ɵ:"O",Ꝋ:"O",Ꝍ:"O",Œ:"OE",Ƣ:"OI",Ꝏ:"OO",Ȣ:"OU","Ⓟ":"P",Ｐ:"P",Ṕ:"P",Ṗ:"P",Ƥ:"P",Ᵽ:"P",Ꝑ:"P",Ꝓ:"P",Ꝕ:"P","Ⓠ":"Q",Ｑ:"Q",Ꝗ:"Q",Ꝙ:"Q",Ɋ:"Q","Ⓡ":"R",Ｒ:"R",Ŕ:"R",Ṙ:"R",Ř:"R",Ȑ:"R",Ȓ:"R",Ṛ:"R",Ṝ:"R",Ŗ:"R",Ṟ:"R",Ɍ:"R",Ɽ:"R",Ꝛ:"R",Ꞧ:"R",Ꞃ:"R","Ⓢ":"S",Ｓ:"S",ẞ:"S",Ś:"S",Ṥ:"S",Ŝ:"S",Ṡ:"S",Š:"S",Ṧ:"S",Ṣ:"S",Ṩ:"S",Ș:"S",Ş:"S",Ȿ:"S",Ꞩ:"S",Ꞅ:"S","Ⓣ":"T",Ｔ:"T",Ṫ:"T",Ť:"T",Ṭ:"T",Ț:"T",Ţ:"T",Ṱ:"T",Ṯ:"T",Ŧ:"T",Ƭ:"T",Ʈ:"T",Ⱦ:"T",Ꞇ:"T",Ꜩ:"TZ","Ⓤ":"U",Ｕ:"U",Ù:"U",Ú:"U",Û:"U",Ũ:"U",Ṹ:"U",Ū:"U",Ṻ:"U",Ŭ:"U",Ü:"U",Ǜ:"U",Ǘ:"U",Ǖ:"U",Ǚ:"U",Ủ:"U",Ů:"U",Ű:"U",Ǔ:"U",Ȕ:"U",Ȗ:"U",Ư:"U",Ừ:"U",Ứ:"U",Ữ:"U",Ử:"U",Ự:"U",Ụ:"U",Ṳ:"U",Ų:"U",Ṷ:"U",Ṵ:"U",Ʉ:"U","Ⓥ":"V",Ｖ:"V",Ṽ:"V",Ṿ:"V",Ʋ:"V",Ꝟ:"V",Ʌ:"V",Ꝡ:"VY","Ⓦ":"W",Ｗ:"W",Ẁ:"W",Ẃ:"W",Ŵ:"W",Ẇ:"W",Ẅ:"W",Ẉ:"W",Ⱳ:"W","Ⓧ":"X",Ｘ:"X",Ẋ:"X",Ẍ:"X","Ⓨ":"Y",Ｙ:"Y",Ỳ:"Y",Ý:"Y",Ŷ:"Y",Ỹ:"Y",Ȳ:"Y",Ẏ:"Y",Ÿ:"Y",Ỷ:"Y",Ỵ:"Y",Ƴ:"Y",Ɏ:"Y",Ỿ:"Y","Ⓩ":"Z",Ｚ:"Z",Ź:"Z",Ẑ:"Z",Ż:"Z",Ž:"Z",Ẓ:"Z",Ẕ:"Z",Ƶ:"Z",Ȥ:"Z",Ɀ:"Z",Ⱬ:"Z",Ꝣ:"Z","ⓐ":"a",ａ:"a",ẚ:"a",à:"a",á:"a",â:"a",ầ:"a",ấ:"a",ẫ:"a",ẩ:"a",ã:"a",ā:"a",ă:"a",ằ:"a",ắ:"a",ẵ:"a",ẳ:"a",ȧ:"a",ǡ:"a",ä:"a",ǟ:"a",ả:"a",å:"a",ǻ:"a",ǎ:"a",ȁ:"a",ȃ:"a",ạ:"a",ậ:"a",ặ:"a",ḁ:"a",ą:"a",ⱥ:"a",ɐ:"a",ꜳ:"aa",æ:"ae",ǽ:"ae",ǣ:"ae",ꜵ:"ao",ꜷ:"au",ꜹ:"av",ꜻ:"av",ꜽ:"ay","ⓑ":"b",ｂ:"b",ḃ:"b",ḅ:"b",ḇ:"b",ƀ:"b",ƃ:"b",ɓ:"b","ⓒ":"c",ｃ:"c",ć:"c",ĉ:"c",ċ:"c",č:"c",ç:"c",ḉ:"c",ƈ:"c",ȼ:"c",ꜿ:"c",ↄ:"c","ⓓ":"d",ｄ:"d",ḋ:"d",ď:"d",ḍ:"d",ḑ:"d",ḓ:"d",ḏ:"d",đ:"d",ƌ:"d",ɖ:"d",ɗ:"d",ꝺ:"d",ǳ:"dz",ǆ:"dz","ⓔ":"e",ｅ:"e",è:"e",é:"e",ê:"e",ề:"e",ế:"e",ễ:"e",ể:"e",ẽ:"e",ē:"e",ḕ:"e",ḗ:"e",ĕ:"e",ė:"e",ë:"e",ẻ:"e",ě:"e",ȅ:"e",ȇ:"e",ẹ:"e",ệ:"e",ȩ:"e",ḝ:"e",ę:"e",ḙ:"e",ḛ:"e",ɇ:"e",ɛ:"e",ǝ:"e","ⓕ":"f",ｆ:"f",ḟ:"f",ƒ:"f",ꝼ:"f","ⓖ":"g",ｇ:"g",ǵ:"g",ĝ:"g",ḡ:"g",ğ:"g",ġ:"g",ǧ:"g",ģ:"g",ǥ:"g",ɠ:"g",ꞡ:"g",ᵹ:"g",ꝿ:"g","ⓗ":"h",ｈ:"h",ĥ:"h",ḣ:"h",ḧ:"h",ȟ:"h",ḥ:"h",ḩ:"h",ḫ:"h",ẖ:"h",ħ:"h",ⱨ:"h",ⱶ:"h",ɥ:"h",ƕ:"hv","ⓘ":"i",ｉ:"i",ì:"i",í:"i",î:"i",ĩ:"i",ī:"i",ĭ:"i",ï:"i",ḯ:"i",ỉ:"i",ǐ:"i",ȉ:"i",ȋ:"i",ị:"i",į:"i",ḭ:"i",ɨ:"i",ı:"i","ⓙ":"j",ｊ:"j",ĵ:"j",ǰ:"j",ɉ:"j","ⓚ":"k",ｋ:"k",ḱ:"k",ǩ:"k",ḳ:"k",ķ:"k",ḵ:"k",ƙ:"k",ⱪ:"k",ꝁ:"k",ꝃ:"k",ꝅ:"k",ꞣ:"k","ⓛ":"l",ｌ:"l",ŀ:"l",ĺ:"l",ľ:"l",ḷ:"l",ḹ:"l",ļ:"l",ḽ:"l",ḻ:"l",ſ:"l",ł:"l",ƚ:"l",ɫ:"l",ⱡ:"l",ꝉ:"l",ꞁ:"l",ꝇ:"l",ǉ:"lj","ⓜ":"m",ｍ:"m",ḿ:"m",ṁ:"m",ṃ:"m",ɱ:"m",ɯ:"m","ⓝ":"n",ｎ:"n",ǹ:"n",ń:"n",ñ:"n",ṅ:"n",ň:"n",ṇ:"n",ņ:"n",ṋ:"n",ṉ:"n",ƞ:"n",ɲ:"n",ŉ:"n",ꞑ:"n",ꞥ:"n",ǌ:"nj","ⓞ":"o",ｏ:"o",ò:"o",ó:"o",ô:"o",ồ:"o",ố:"o",ỗ:"o",ổ:"o",õ:"o",ṍ:"o",ȭ:"o",ṏ:"o",ō:"o",ṑ:"o",ṓ:"o",ŏ:"o",ȯ:"o",ȱ:"o",ö:"o",ȫ:"o",ỏ:"o",ő:"o",ǒ:"o",ȍ:"o",ȏ:"o",ơ:"o",ờ:"o",ớ:"o",ỡ:"o",ở:"o",ợ:"o",ọ:"o",ộ:"o",ǫ:"o",ǭ:"o",ø:"o",ǿ:"o",ɔ:"o",ꝋ:"o",ꝍ:"o",ɵ:"o",œ:"oe",ƣ:"oi",ȣ:"ou",ꝏ:"oo","ⓟ":"p",ｐ:"p",ṕ:"p",ṗ:"p",ƥ:"p",ᵽ:"p",ꝑ:"p",ꝓ:"p",ꝕ:"p","ⓠ":"q",ｑ:"q",ɋ:"q",ꝗ:"q",ꝙ:"q","ⓡ":"r",ｒ:"r",ŕ:"r",ṙ:"r",ř:"r",ȑ:"r",ȓ:"r",ṛ:"r",ṝ:"r",ŗ:"r",ṟ:"r",ɍ:"r",ɽ:"r",ꝛ:"r",ꞧ:"r",ꞃ:"r","ⓢ":"s",ｓ:"s",ß:"s",ś:"s",ṥ:"s",ŝ:"s",ṡ:"s",š:"s",ṧ:"s",ṣ:"s",ṩ:"s",ș:"s",ş:"s",ȿ:"s",ꞩ:"s",ꞅ:"s",ẛ:"s","ⓣ":"t",ｔ:"t",ṫ:"t",ẗ:"t",ť:"t",ṭ:"t",ț:"t",ţ:"t",ṱ:"t",ṯ:"t",ŧ:"t",ƭ:"t",ʈ:"t",ⱦ:"t",ꞇ:"t",ꜩ:"tz","ⓤ":"u",ｕ:"u",ù:"u",ú:"u",û:"u",ũ:"u",ṹ:"u",ū:"u",ṻ:"u",ŭ:"u",ü:"u",ǜ:"u",ǘ:"u",ǖ:"u",ǚ:"u",ủ:"u",ů:"u",ű:"u",ǔ:"u",ȕ:"u",ȗ:"u",ư:"u",ừ:"u",ứ:"u",ữ:"u",ử:"u",ự:"u",ụ:"u",ṳ:"u",ų:"u",ṷ:"u",ṵ:"u",ʉ:"u","ⓥ":"v",ｖ:"v",ṽ:"v",ṿ:"v",ʋ:"v",ꝟ:"v",ʌ:"v",ꝡ:"vy","ⓦ":"w",ｗ:"w",ẁ:"w",ẃ:"w",ŵ:"w",ẇ:"w",ẅ:"w",ẘ:"w",ẉ:"w",ⱳ:"w","ⓧ":"x",ｘ:"x",ẋ:"x",ẍ:"x","ⓨ":"y",ｙ:"y",ỳ:"y",ý:"y",ŷ:"y",ỹ:"y",ȳ:"y",ẏ:"y",ÿ:"y",ỷ:"y",ẙ:"y",ỵ:"y",ƴ:"y",ɏ:"y",ỿ:"y","ⓩ":"z",ｚ:"z",ź:"z",ẑ:"z",ż:"z",ž:"z",ẓ:"z",ẕ:"z",ƶ:"z",ȥ:"z",ɀ:"z",ⱬ:"z",ꝣ:"z",Ά:"Α",Έ:"Ε",Ή:"Η",Ί:"Ι",Ϊ:"Ι",Ό:"Ο",Ύ:"Υ",Ϋ:"Υ",Ώ:"Ω",ά:"α",έ:"ε",ή:"η",ί:"ι",ϊ:"ι",ΐ:"ι",ό:"ο",ύ:"υ",ϋ:"υ",ΰ:"υ",ώ:"ω",ς:"σ","’":"'"}})),t.define("select2/data/base",["../utils"],(function(e){function t(e,n){t.__super__.constructor.call(this)}return e.Extend(t,e.Observable),t.prototype.current=function(e){throw new Error("The `current` method must be defined in child classes.")},t.prototype.query=function(e,t){throw new Error("The `query` method must be defined in child classes.")},t.prototype.bind=function(e,t){},t.prototype.destroy=function(){},t.prototype.generateResultId=function(t,n){var r=t.id+"-result-";return r+=e.generateChars(4),null!=n.id?r+="-"+n.id.toString():r+="-"+e.generateChars(4),r},t})),t.define("select2/data/select",["./base","../utils","jquery"],(function(e,t,n){function r(e,t){this.$element=e,this.options=t,r.__super__.constructor.call(this)}return t.Extend(r,e),r.prototype.current=function(e){var t=[],r=this;this.$element.find(":selected").each((function(){var e=n(this),i=r.item(e);t.push(i)})),e(t)},r.prototype.select=function(e){var t=this;if(e.selected=!0,n(e.element).is("option"))return e.element.selected=!0,void this.$element.trigger("input").trigger("change");if(this.$element.prop("multiple"))this.current((function(r){var i=[];(e=[e]).push.apply(e,r);for(var o=0;o<e.length;o++){var a=e[o].id;-1===n.inArray(a,i)&&i.push(a)}t.$element.val(i),t.$element.trigger("input").trigger("change")}));else{var r=e.id;this.$element.val(r),this.$element.trigger("input").trigger("change")}},r.prototype.unselect=function(e){var t=this;if(this.$element.prop("multiple")){if(e.selected=!1,n(e.element).is("option"))return e.element.selected=!1,void this.$element.trigger("input").trigger("change");this.current((function(r){for(var i=[],o=0;o<r.length;o++){var a=r[o].id;a!==e.id&&-1===n.inArray(a,i)&&i.push(a)}t.$element.val(i),t.$element.trigger("input").trigger("change")}))}},r.prototype.bind=function(e,t){var n=this;this.container=e,e.on("select",(function(e){n.select(e.data)})),e.on("unselect",(function(e){n.unselect(e.data)}))},r.prototype.destroy=function(){this.$element.find("*").each((function(){t.RemoveData(this)}))},r.prototype.query=function(e,t){var r=[],i=this;this.$element.children().each((function(){var t=n(this);if(t.is("option")||t.is("optgroup")){var o=i.item(t),a=i.matches(e,o);null!==a&&r.push(a)}})),t({results:r})},r.prototype.addOptions=function(e){t.appendMany(this.$element,e)},r.prototype.option=function(e){var r;e.children?(r=document.createElement("optgroup")).label=e.text:void 0!==(r=document.createElement("option")).textContent?r.textContent=e.text:r.innerText=e.text,void 0!==e.id&&(r.value=e.id),e.disabled&&(r.disabled=!0),e.selected&&(r.selected=!0),e.title&&(r.title=e.title);var i=n(r),o=this._normalizeItem(e);return o.element=r,t.StoreData(r,"data",o),i},r.prototype.item=function(e){var r={};if(null!=(r=t.GetData(e[0],"data")))return r;if(e.is("option"))r={id:e.val(),text:e.text(),disabled:e.prop("disabled"),selected:e.prop("selected"),title:e.prop("title")};else if(e.is("optgroup")){r={text:e.prop("label"),children:[],title:e.prop("title")};for(var i=e.children("option"),o=[],a=0;a<i.length;a++){var s=n(i[a]),l=this.item(s);o.push(l)}r.children=o}return(r=this._normalizeItem(r)).element=e[0],t.StoreData(e[0],"data",r),r},r.prototype._normalizeItem=function(e){e!==Object(e)&&(e={id:e,text:e});var t={selected:!1,disabled:!1};return null!=(e=n.extend({},{text:""},e)).id&&(e.id=e.id.toString()),null!=e.text&&(e.text=e.text.toString()),null==e._resultId&&e.id&&null!=this.container&&(e._resultId=this.generateResultId(this.container,e)),n.extend({},t,e)},r.prototype.matches=function(e,t){return this.options.get("matcher")(e,t)},r})),t.define("select2/data/array",["./select","../utils","jquery"],(function(e,t,n){function r(e,t){this._dataToConvert=t.get("data")||[],r.__super__.constructor.call(this,e,t)}return t.Extend(r,e),r.prototype.bind=function(e,t){r.__super__.bind.call(this,e,t),this.addOptions(this.convertToOptions(this._dataToConvert))},r.prototype.select=function(e){var t=this.$element.find("option").filter((function(t,n){return n.value==e.id.toString()}));0===t.length&&(t=this.option(e),this.addOptions(t)),r.__super__.select.call(this,e)},r.prototype.convertToOptions=function(e){var r=this,i=this.$element.find("option"),o=i.map((function(){return r.item(n(this)).id})).get(),a=[];function s(e){return function(){return n(this).val()==e.id}}for(var l=0;l<e.length;l++){var c=this._normalizeItem(e[l]);if(n.inArray(c.id,o)>=0){var u=i.filter(s(c)),d=this.item(u),p=n.extend(!0,{},c,d),h=this.option(p);u.replaceWith(h)}else{var f=this.option(c);if(c.children){var g=this.convertToOptions(c.children);t.appendMany(f,g)}a.push(f)}}return a},r})),t.define("select2/data/ajax",["./array","../utils","jquery"],(function(e,t,n){function r(e,t){this.ajaxOptions=this._applyDefaults(t.get("ajax")),null!=this.ajaxOptions.processResults&&(this.processResults=this.ajaxOptions.processResults),r.__super__.constructor.call(this,e,t)}return t.Extend(r,e),r.prototype._applyDefaults=function(e){var t={data:function(e){return n.extend({},e,{q:e.term})},transport:function(e,t,r){var i=n.ajax(e);return i.then(t),i.fail(r),i}};return n.extend({},t,e,!0)},r.prototype.processResults=function(e){return e},r.prototype.query=function(e,t){var r=this;null!=this._request&&(n.isFunction(this._request.abort)&&this._request.abort(),this._request=null);var i=n.extend({type:"GET"},this.ajaxOptions);function o(){var o=i.transport(i,(function(i){var o=r.processResults(i,e);r.options.get("debug")&&window.console&&console.error&&(o&&o.results&&n.isArray(o.results)||console.error("Select2: The AJAX results did not return an array in the `results` key of the response.")),t(o)}),(function(){(!("status"in o)||0!==o.status&&"0"!==o.status)&&r.trigger("results:message",{message:"errorLoading"})}));r._request=o}"function"==typeof i.url&&(i.url=i.url.call(this.$element,e)),"function"==typeof i.data&&(i.data=i.data.call(this.$element,e)),this.ajaxOptions.delay&&null!=e.term?(this._queryTimeout&&window.clearTimeout(this._queryTimeout),this._queryTimeout=window.setTimeout(o,this.ajaxOptions.delay)):o()},r})),t.define("select2/data/tags",["jquery"],(function(e){function t(t,n,r){var i=r.get("tags"),o=r.get("createTag");void 0!==o&&(this.createTag=o);var a=r.get("insertTag");if(void 0!==a&&(this.insertTag=a),t.call(this,n,r),e.isArray(i))for(var s=0;s<i.length;s++){var l=i[s],c=this._normalizeItem(l),u=this.option(c);this.$element.append(u)}}return t.prototype.query=function(e,t,n){var r=this;function i(e,o){for(var a=e.results,s=0;s<a.length;s++){var l=a[s],c=null!=l.children&&!i({results:l.children},!0);if((l.text||"").toUpperCase()===(t.term||"").toUpperCase()||c)return!o&&(e.data=a,void n(e))}if(o)return!0;var u=r.createTag(t);if(null!=u){var d=r.option(u);d.attr("data-select2-tag",!0),r.addOptions([d]),r.insertTag(a,u)}e.results=a,n(e)}this._removeOldTags(),null!=t.term&&null==t.page?e.call(this,t,i):e.call(this,t,n)},t.prototype.createTag=function(t,n){var r=e.trim(n.term);return""===r?null:{id:r,text:r}},t.prototype.insertTag=function(e,t,n){t.unshift(n)},t.prototype._removeOldTags=function(t){this.$element.find("option[data-select2-tag]").each((function(){this.selected||e(this).remove()}))},t})),t.define("select2/data/tokenizer",["jquery"],(function(e){function t(e,t,n){var r=n.get("tokenizer");void 0!==r&&(this.tokenizer=r),e.call(this,t,n)}return t.prototype.bind=function(e,t,n){e.call(this,t,n),this.$search=t.dropdown.$search||t.selection.$search||n.find(".select2-search__field")},t.prototype.query=function(t,n,r){var i=this;function o(t){var n=i._normalizeItem(t);if(!i.$element.find("option").filter((function(){return e(this).val()===n.id})).length){var r=i.option(n);r.attr("data-select2-tag",!0),i._removeOldTags(),i.addOptions([r])}a(n)}function a(e){i.trigger("select",{data:e})}n.term=n.term||"";var s=this.tokenizer(n,this.options,o);s.term!==n.term&&(this.$search.length&&(this.$search.val(s.term),this.$search.trigger("focus")),n.term=s.term),t.call(this,n,r)},t.prototype.tokenizer=function(t,n,r,i){for(var o=r.get("tokenSeparators")||[],a=n.term,s=0,l=this.createTag||function(e){return{id:e.term,text:e.term}};s<a.length;){var c=a[s];if(-1!==e.inArray(c,o)){var u=a.substr(0,s),d=l(e.extend({},n,{term:u}));null!=d?(i(d),a=a.substr(s+1)||"",s=0):s++}else s++}return{term:a}},t})),t.define("select2/data/minimumInputLength",[],(function(){function e(e,t,n){this.minimumInputLength=n.get("minimumInputLength"),e.call(this,t,n)}return e.prototype.query=function(e,t,n){t.term=t.term||"",t.term.length<this.minimumInputLength?this.trigger("results:message",{message:"inputTooShort",args:{minimum:this.minimumInputLength,input:t.term,params:t}}):e.call(this,t,n)},e})),t.define("select2/data/maximumInputLength",[],(function(){function e(e,t,n){this.maximumInputLength=n.get("maximumInputLength"),e.call(this,t,n)}return e.prototype.query=function(e,t,n){t.term=t.term||"",this.maximumInputLength>0&&t.term.length>this.maximumInputLength?this.trigger("results:message",{message:"inputTooLong",args:{maximum:this.maximumInputLength,input:t.term,params:t}}):e.call(this,t,n)},e})),t.define("select2/data/maximumSelectionLength",[],(function(){function e(e,t,n){this.maximumSelectionLength=n.get("maximumSelectionLength"),e.call(this,t,n)}return e.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),t.on("select",(function(){r._checkIfMaximumSelected()}))},e.prototype.query=function(e,t,n){var r=this;this._checkIfMaximumSelected((function(){e.call(r,t,n)}))},e.prototype._checkIfMaximumSelected=function(e,t){var n=this;this.current((function(e){var r=null!=e?e.length:0;n.maximumSelectionLength>0&&r>=n.maximumSelectionLength?n.trigger("results:message",{message:"maximumSelected",args:{maximum:n.maximumSelectionLength}}):t&&t()}))},e})),t.define("select2/dropdown",["jquery","./utils"],(function(e,t){function n(e,t){this.$element=e,this.options=t,n.__super__.constructor.call(this)}return t.Extend(n,t.Observable),n.prototype.render=function(){var t=e('<span class="select2-dropdown"><span class="select2-results"></span></span>');return t.attr("dir",this.options.get("dir")),this.$dropdown=t,t},n.prototype.bind=function(){},n.prototype.position=function(e,t){},n.prototype.destroy=function(){this.$dropdown.remove()},n})),t.define("select2/dropdown/search",["jquery","../utils"],(function(e,t){function n(){}return n.prototype.render=function(t){var n=t.call(this),r=e('<span class="select2-search select2-search--dropdown"><input class="select2-search__field" type="search" tabindex="-1" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" role="searchbox" aria-autocomplete="list" /></span>');return this.$searchContainer=r,this.$search=r.find("input"),n.prepend(r),n},n.prototype.bind=function(t,n,r){var i=this,o=n.id+"-results";t.call(this,n,r),this.$search.on("keydown",(function(e){i.trigger("keypress",e),i._keyUpPrevented=e.isDefaultPrevented()})),this.$search.on("input",(function(t){e(this).off("keyup")})),this.$search.on("keyup input",(function(e){i.handleSearch(e)})),n.on("open",(function(){i.$search.attr("tabindex",0),i.$search.attr("aria-controls",o),i.$search.trigger("focus"),window.setTimeout((function(){i.$search.trigger("focus")}),0)})),n.on("close",(function(){i.$search.attr("tabindex",-1),i.$search.removeAttr("aria-controls"),i.$search.removeAttr("aria-activedescendant"),i.$search.val(""),i.$search.trigger("blur")})),n.on("focus",(function(){n.isOpen()||i.$search.trigger("focus")})),n.on("results:all",(function(e){null!=e.query.term&&""!==e.query.term||(i.showSearch(e)?i.$searchContainer.removeClass("select2-search--hide"):i.$searchContainer.addClass("select2-search--hide"))})),n.on("results:focus",(function(e){e.data._resultId?i.$search.attr("aria-activedescendant",e.data._resultId):i.$search.removeAttr("aria-activedescendant")}))},n.prototype.handleSearch=function(e){if(!this._keyUpPrevented){var t=this.$search.val();this.trigger("query",{term:t})}this._keyUpPrevented=!1},n.prototype.showSearch=function(e,t){return!0},n})),t.define("select2/dropdown/hidePlaceholder",[],(function(){function e(e,t,n,r){this.placeholder=this.normalizePlaceholder(n.get("placeholder")),e.call(this,t,n,r)}return e.prototype.append=function(e,t){t.results=this.removePlaceholder(t.results),e.call(this,t)},e.prototype.normalizePlaceholder=function(e,t){return"string"==typeof t&&(t={id:"",text:t}),t},e.prototype.removePlaceholder=function(e,t){for(var n=t.slice(0),r=t.length-1;r>=0;r--){var i=t[r];this.placeholder.id===i.id&&n.splice(r,1)}return n},e})),t.define("select2/dropdown/infiniteScroll",["jquery"],(function(e){function t(e,t,n,r){this.lastParams={},e.call(this,t,n,r),this.$loadingMore=this.createLoadingMore(),this.loading=!1}return t.prototype.append=function(e,t){this.$loadingMore.remove(),this.loading=!1,e.call(this,t),this.showLoadingMore(t)&&(this.$results.append(this.$loadingMore),this.loadMoreIfNeeded())},t.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),t.on("query",(function(e){r.lastParams=e,r.loading=!0})),t.on("query:append",(function(e){r.lastParams=e,r.loading=!0})),this.$results.on("scroll",this.loadMoreIfNeeded.bind(this))},t.prototype.loadMoreIfNeeded=function(){var t=e.contains(document.documentElement,this.$loadingMore[0]);!this.loading&&t&&this.$results.offset().top+this.$results.outerHeight(!1)+50>=this.$loadingMore.offset().top+this.$loadingMore.outerHeight(!1)&&this.loadMore()},t.prototype.loadMore=function(){this.loading=!0;var t=e.extend({},{page:1},this.lastParams);t.page++,this.trigger("query:append",t)},t.prototype.showLoadingMore=function(e,t){return t.pagination&&t.pagination.more},t.prototype.createLoadingMore=function(){var t=e('<li class="select2-results__option select2-results__option--load-more"role="option" aria-disabled="true"></li>'),n=this.options.get("translations").get("loadingMore");return t.html(n(this.lastParams)),t},t})),t.define("select2/dropdown/attachBody",["jquery","../utils"],(function(e,t){function n(t,n,r){this.$dropdownParent=e(r.get("dropdownParent")||document.body),t.call(this,n,r)}return n.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),t.on("open",(function(){r._showDropdown(),r._attachPositioningHandler(t),r._bindContainerResultHandlers(t)})),t.on("close",(function(){r._hideDropdown(),r._detachPositioningHandler(t)})),this.$dropdownContainer.on("mousedown",(function(e){e.stopPropagation()}))},n.prototype.destroy=function(e){e.call(this),this.$dropdownContainer.remove()},n.prototype.position=function(e,t,n){t.attr("class",n.attr("class")),t.removeClass("select2"),t.addClass("select2-container--open"),t.css({position:"absolute",top:-999999}),this.$container=n},n.prototype.render=function(t){var n=e("<span></span>"),r=t.call(this);return n.append(r),this.$dropdownContainer=n,n},n.prototype._hideDropdown=function(e){this.$dropdownContainer.detach()},n.prototype._bindContainerResultHandlers=function(e,t){if(!this._containerResultsHandlersBound){var n=this;t.on("results:all",(function(){n._positionDropdown(),n._resizeDropdown()})),t.on("results:append",(function(){n._positionDropdown(),n._resizeDropdown()})),t.on("results:message",(function(){n._positionDropdown(),n._resizeDropdown()})),t.on("select",(function(){n._positionDropdown(),n._resizeDropdown()})),t.on("unselect",(function(){n._positionDropdown(),n._resizeDropdown()})),this._containerResultsHandlersBound=!0}},n.prototype._attachPositioningHandler=function(n,r){var i=this,o="scroll.select2."+r.id,a="resize.select2."+r.id,s="orientationchange.select2."+r.id,l=this.$container.parents().filter(t.hasScroll);l.each((function(){t.StoreData(this,"select2-scroll-position",{x:e(this).scrollLeft(),y:e(this).scrollTop()})})),l.on(o,(function(n){var r=t.GetData(this,"select2-scroll-position");e(this).scrollTop(r.y)})),e(window).on(o+" "+a+" "+s,(function(e){i._positionDropdown(),i._resizeDropdown()}))},n.prototype._detachPositioningHandler=function(n,r){var i="scroll.select2."+r.id,o="resize.select2."+r.id,a="orientationchange.select2."+r.id;this.$container.parents().filter(t.hasScroll).off(i),e(window).off(i+" "+o+" "+a)},n.prototype._positionDropdown=function(){var t=e(window),n=this.$dropdown.hasClass("select2-dropdown--above"),r=this.$dropdown.hasClass("select2-dropdown--below"),i=null,o=this.$container.offset();o.bottom=o.top+this.$container.outerHeight(!1);var a={height:this.$container.outerHeight(!1)};a.top=o.top,a.bottom=o.top+a.height;var s={height:this.$dropdown.outerHeight(!1)},l={top:t.scrollTop(),bottom:t.scrollTop()+t.height()},c=l.top<o.top-s.height,u=l.bottom>o.bottom+s.height,d={left:o.left,top:a.bottom},p=this.$dropdownParent;"static"===p.css("position")&&(p=p.offsetParent());var h={top:0,left:0};(e.contains(document.body,p[0])||p[0].isConnected)&&(h=p.offset()),d.top-=h.top,d.left-=h.left,n||r||(i="below"),u||!c||n?!c&&u&&n&&(i="below"):i="above",("above"==i||n&&"below"!==i)&&(d.top=a.top-h.top-s.height),null!=i&&(this.$dropdown.removeClass("select2-dropdown--below select2-dropdown--above").addClass("select2-dropdown--"+i),this.$container.removeClass("select2-container--below select2-container--above").addClass("select2-container--"+i)),this.$dropdownContainer.css(d)},n.prototype._resizeDropdown=function(){var e={width:this.$container.outerWidth(!1)+"px"};this.options.get("dropdownAutoWidth")&&(e.minWidth=e.width,e.position="relative",e.width="auto"),this.$dropdown.css(e)},n.prototype._showDropdown=function(e){this.$dropdownContainer.appendTo(this.$dropdownParent),this._positionDropdown(),this._resizeDropdown()},n})),t.define("select2/dropdown/minimumResultsForSearch",[],(function(){function e(t){for(var n=0,r=0;r<t.length;r++){var i=t[r];i.children?n+=e(i.children):n++}return n}function t(e,t,n,r){this.minimumResultsForSearch=n.get("minimumResultsForSearch"),this.minimumResultsForSearch<0&&(this.minimumResultsForSearch=1/0),e.call(this,t,n,r)}return t.prototype.showSearch=function(t,n){return!(e(n.data.results)<this.minimumResultsForSearch)&&t.call(this,n)},t})),t.define("select2/dropdown/selectOnClose",["../utils"],(function(e){function t(){}return t.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),t.on("close",(function(e){r._handleSelectOnClose(e)}))},t.prototype._handleSelectOnClose=function(t,n){if(n&&null!=n.originalSelect2Event){var r=n.originalSelect2Event;if("select"===r._type||"unselect"===r._type)return}var i=this.getHighlightedResults();if(!(i.length<1)){var o=e.GetData(i[0],"data");null!=o.element&&o.element.selected||null==o.element&&o.selected||this.trigger("select",{data:o})}},t})),t.define("select2/dropdown/closeOnSelect",[],(function(){function e(){}return e.prototype.bind=function(e,t,n){var r=this;e.call(this,t,n),t.on("select",(function(e){r._selectTriggered(e)})),t.on("unselect",(function(e){r._selectTriggered(e)}))},e.prototype._selectTriggered=function(e,t){var n=t.originalEvent;n&&(n.ctrlKey||n.metaKey)||this.trigger("close",{originalEvent:n,originalSelect2Event:t})},e})),t.define("select2/i18n/en",[],(function(){return{errorLoading:function(){return"The results could not be loaded."},inputTooLong:function(e){var t=e.input.length-e.maximum,n="Please delete "+t+" character";return 1!=t&&(n+="s"),n},inputTooShort:function(e){return"Please enter "+(e.minimum-e.input.length)+" or more characters"},loadingMore:function(){return"Loading more results…"},maximumSelected:function(e){var t="You can only select "+e.maximum+" item";return 1!=e.maximum&&(t+="s"),t},noResults:function(){return"No results found"},searching:function(){return"Searching…"},removeAllItems:function(){return"Remove all items"}}})),t.define("select2/defaults",["jquery","require","./results","./selection/single","./selection/multiple","./selection/placeholder","./selection/allowClear","./selection/search","./selection/eventRelay","./utils","./translation","./diacritics","./data/select","./data/array","./data/ajax","./data/tags","./data/tokenizer","./data/minimumInputLength","./data/maximumInputLength","./data/maximumSelectionLength","./dropdown","./dropdown/search","./dropdown/hidePlaceholder","./dropdown/infiniteScroll","./dropdown/attachBody","./dropdown/minimumResultsForSearch","./dropdown/selectOnClose","./dropdown/closeOnSelect","./i18n/en"],(function(e,t,n,r,i,o,a,s,l,c,u,d,p,h,f,g,m,v,y,b,w,D,_,C,x,M,E,S,A){function T(){this.reset()}return T.prototype.apply=function(u){if(null==(u=e.extend(!0,{},this.defaults,u)).dataAdapter){if(null!=u.ajax?u.dataAdapter=f:null!=u.data?u.dataAdapter=h:u.dataAdapter=p,u.minimumInputLength>0&&(u.dataAdapter=c.Decorate(u.dataAdapter,v)),u.maximumInputLength>0&&(u.dataAdapter=c.Decorate(u.dataAdapter,y)),u.maximumSelectionLength>0&&(u.dataAdapter=c.Decorate(u.dataAdapter,b)),u.tags&&(u.dataAdapter=c.Decorate(u.dataAdapter,g)),null==u.tokenSeparators&&null==u.tokenizer||(u.dataAdapter=c.Decorate(u.dataAdapter,m)),null!=u.query){var d=t(u.amdBase+"compat/query");u.dataAdapter=c.Decorate(u.dataAdapter,d)}if(null!=u.initSelection){var A=t(u.amdBase+"compat/initSelection");u.dataAdapter=c.Decorate(u.dataAdapter,A)}}if(null==u.resultsAdapter&&(u.resultsAdapter=n,null!=u.ajax&&(u.resultsAdapter=c.Decorate(u.resultsAdapter,C)),null!=u.placeholder&&(u.resultsAdapter=c.Decorate(u.resultsAdapter,_)),u.selectOnClose&&(u.resultsAdapter=c.Decorate(u.resultsAdapter,E))),null==u.dropdownAdapter){if(u.multiple)u.dropdownAdapter=w;else{var T=c.Decorate(w,D);u.dropdownAdapter=T}if(0!==u.minimumResultsForSearch&&(u.dropdownAdapter=c.Decorate(u.dropdownAdapter,M)),u.closeOnSelect&&(u.dropdownAdapter=c.Decorate(u.dropdownAdapter,S)),null!=u.dropdownCssClass||null!=u.dropdownCss||null!=u.adaptDropdownCssClass){var $=t(u.amdBase+"compat/dropdownCss");u.dropdownAdapter=c.Decorate(u.dropdownAdapter,$)}u.dropdownAdapter=c.Decorate(u.dropdownAdapter,x)}if(null==u.selectionAdapter){if(u.multiple?u.selectionAdapter=i:u.selectionAdapter=r,null!=u.placeholder&&(u.selectionAdapter=c.Decorate(u.selectionAdapter,o)),u.allowClear&&(u.selectionAdapter=c.Decorate(u.selectionAdapter,a)),u.multiple&&(u.selectionAdapter=c.Decorate(u.selectionAdapter,s)),null!=u.containerCssClass||null!=u.containerCss||null!=u.adaptContainerCssClass){var O=t(u.amdBase+"compat/containerCss");u.selectionAdapter=c.Decorate(u.selectionAdapter,O)}u.selectionAdapter=c.Decorate(u.selectionAdapter,l)}u.language=this._resolveLanguage(u.language),u.language.push("en");for(var k=[],L=0;L<u.language.length;L++){var I=u.language[L];-1===k.indexOf(I)&&k.push(I)}return u.language=k,u.translations=this._processTranslations(u.language,u.debug),u},T.prototype.reset=function(){function t(e){function t(e){return d[e]||e}return e.replace(/[^\u0000-\u007E]/g,t)}function n(r,i){if(""===e.trim(r.term))return i;if(i.children&&i.children.length>0){for(var o=e.extend(!0,{},i),a=i.children.length-1;a>=0;a--)null==n(r,i.children[a])&&o.children.splice(a,1);return o.children.length>0?o:n(r,o)}var s=t(i.text).toUpperCase(),l=t(r.term).toUpperCase();return s.indexOf(l)>-1?i:null}this.defaults={amdBase:"./",amdLanguageBase:"./i18n/",closeOnSelect:!0,debug:!1,dropdownAutoWidth:!1,escapeMarkup:c.escapeMarkup,language:{},matcher:n,minimumInputLength:0,maximumInputLength:0,maximumSelectionLength:0,minimumResultsForSearch:0,selectOnClose:!1,scrollAfterSelect:!1,sorter:function(e){return e},templateResult:function(e){return e.text},templateSelection:function(e){return e.text},theme:"default",width:"resolve"}},T.prototype.applyFromElement=function(e,t){var n=e.language,r=this.defaults.language,i=t.prop("lang"),o=t.closest("[lang]").prop("lang"),a=Array.prototype.concat.call(this._resolveLanguage(i),this._resolveLanguage(n),this._resolveLanguage(r),this._resolveLanguage(o));return e.language=a,e},T.prototype._resolveLanguage=function(t){if(!t)return[];if(e.isEmptyObject(t))return[];if(e.isPlainObject(t))return[t];var n;n=e.isArray(t)?t:[t];for(var r=[],i=0;i<n.length;i++)if(r.push(n[i]),"string"==typeof n[i]&&n[i].indexOf("-")>0){var o=n[i].split("-")[0];r.push(o)}return r},T.prototype._processTranslations=function(t,n){for(var r=new u,i=0;i<t.length;i++){var o=new u,a=t[i];if("string"==typeof a)try{o=u.loadPath(a)}catch(e){try{a=this.defaults.amdLanguageBase+a,o=u.loadPath(a)}catch(e){n&&window.console&&console.warn&&console.warn('Select2: The language file for "'+a+'" could not be automatically loaded. A fallback will be used instead.')}}else o=e.isPlainObject(a)?new u(a):a;r.extend(o)}return r},T.prototype.set=function(t,n){var r={};r[e.camelCase(t)]=n;var i=c._convertData(r);e.extend(!0,this.defaults,i)},new T})),t.define("select2/options",["require","jquery","./defaults","./utils"],(function(e,t,n,r){function i(t,i){if(this.options=t,null!=i&&this.fromElement(i),null!=i&&(this.options=n.applyFromElement(this.options,i)),this.options=n.apply(this.options),i&&i.is("input")){var o=e(this.get("amdBase")+"compat/inputData");this.options.dataAdapter=r.Decorate(this.options.dataAdapter,o)}}return i.prototype.fromElement=function(e){var n=["select2"];null==this.options.multiple&&(this.options.multiple=e.prop("multiple")),null==this.options.disabled&&(this.options.disabled=e.prop("disabled")),null==this.options.dir&&(e.prop("dir")?this.options.dir=e.prop("dir"):e.closest("[dir]").prop("dir")?this.options.dir=e.closest("[dir]").prop("dir"):this.options.dir="ltr"),e.prop("disabled",this.options.disabled),e.prop("multiple",this.options.multiple),r.GetData(e[0],"select2Tags")&&(this.options.debug&&window.console&&console.warn&&console.warn('Select2: The `data-select2-tags` attribute has been changed to use the `data-data` and `data-tags="true"` attributes and will be removed in future versions of Select2.'),r.StoreData(e[0],"data",r.GetData(e[0],"select2Tags")),r.StoreData(e[0],"tags",!0)),r.GetData(e[0],"ajaxUrl")&&(this.options.debug&&window.console&&console.warn&&console.warn("Select2: The `data-ajax-url` attribute has been changed to `data-ajax--url` and support for the old attribute will be removed in future versions of Select2."),e.attr("ajax--url",r.GetData(e[0],"ajaxUrl")),r.StoreData(e[0],"ajax-Url",r.GetData(e[0],"ajaxUrl")));var i={};function o(e,t){return t.toUpperCase()}for(var a=0;a<e[0].attributes.length;a++){var s=e[0].attributes[a].name,l="data-";if(s.substr(0,l.length)==l){var c=s.substring(l.length),u=r.GetData(e[0],c);i[c.replace(/-([a-z])/g,o)]=u}}t.fn.jquery&&"1."==t.fn.jquery.substr(0,2)&&e[0].dataset&&(i=t.extend(!0,{},e[0].dataset,i));var d=t.extend(!0,{},r.GetData(e[0]),i);for(var p in d=r._convertData(d))t.inArray(p,n)>-1||(t.isPlainObject(this.options[p])?t.extend(this.options[p],d[p]):this.options[p]=d[p]);return this},i.prototype.get=function(e){return this.options[e]},i.prototype.set=function(e,t){this.options[e]=t},i})),t.define("select2/core",["jquery","./options","./utils","./keys"],(function(e,t,n,r){var i=function(e,r){null!=n.GetData(e[0],"select2")&&n.GetData(e[0],"select2").destroy(),this.$element=e,this.id=this._generateId(e),r=r||{},this.options=new t(r,e),i.__super__.constructor.call(this);var o=e.attr("tabindex")||0;n.StoreData(e[0],"old-tabindex",o),e.attr("tabindex","-1");var a=this.options.get("dataAdapter");this.dataAdapter=new a(e,this.options);var s=this.render();this._placeContainer(s);var l=this.options.get("selectionAdapter");this.selection=new l(e,this.options),this.$selection=this.selection.render(),this.selection.position(this.$selection,s);var c=this.options.get("dropdownAdapter");this.dropdown=new c(e,this.options),this.$dropdown=this.dropdown.render(),this.dropdown.position(this.$dropdown,s);var u=this.options.get("resultsAdapter");this.results=new u(e,this.options,this.dataAdapter),this.$results=this.results.render(),this.results.position(this.$results,this.$dropdown);var d=this;this._bindAdapters(),this._registerDomEvents(),this._registerDataEvents(),this._registerSelectionEvents(),this._registerDropdownEvents(),this._registerResultsEvents(),this._registerEvents(),this.dataAdapter.current((function(e){d.trigger("selection:update",{data:e})})),e.addClass("select2-hidden-accessible"),e.attr("aria-hidden","true"),this._syncAttributes(),n.StoreData(e[0],"select2",this),e.data("select2",this)};return n.Extend(i,n.Observable),i.prototype._generateId=function(e){return"select2-"+(null!=e.attr("id")?e.attr("id"):null!=e.attr("name")?e.attr("name")+"-"+n.generateChars(2):n.generateChars(4)).replace(/(:|\.|\[|\]|,)/g,"")},i.prototype._placeContainer=function(e){e.insertAfter(this.$element);var t=this._resolveWidth(this.$element,this.options.get("width"));null!=t&&e.css("width",t)},i.prototype._resolveWidth=function(e,t){var n=/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;if("resolve"==t){var r=this._resolveWidth(e,"style");return null!=r?r:this._resolveWidth(e,"element")}if("element"==t){var i=e.outerWidth(!1);return i<=0?"auto":i+"px"}if("style"==t){var o=e.attr("style");if("string"!=typeof o)return null;for(var a=o.split(";"),s=0,l=a.length;s<l;s+=1){var c=a[s].replace(/\s/g,"").match(n);if(null!==c&&c.length>=1)return c[1]}return null}return"computedstyle"==t?window.getComputedStyle(e[0]).width:t},i.prototype._bindAdapters=function(){this.dataAdapter.bind(this,this.$container),this.selection.bind(this,this.$container),this.dropdown.bind(this,this.$container),this.results.bind(this,this.$container)},i.prototype._registerDomEvents=function(){var e=this;this.$element.on("change.select2",(function(){e.dataAdapter.current((function(t){e.trigger("selection:update",{data:t})}))})),this.$element.on("focus.select2",(function(t){e.trigger("focus",t)})),this._syncA=n.bind(this._syncAttributes,this),this._syncS=n.bind(this._syncSubtree,this),this.$element[0].attachEvent&&this.$element[0].attachEvent("onpropertychange",this._syncA);var t=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver;null!=t?(this._observer=new t((function(t){e._syncA(),e._syncS(null,t)})),this._observer.observe(this.$element[0],{attributes:!0,childList:!0,subtree:!1})):this.$element[0].addEventListener&&(this.$element[0].addEventListener("DOMAttrModified",e._syncA,!1),this.$element[0].addEventListener("DOMNodeInserted",e._syncS,!1),this.$element[0].addEventListener("DOMNodeRemoved",e._syncS,!1))},i.prototype._registerDataEvents=function(){var e=this;this.dataAdapter.on("*",(function(t,n){e.trigger(t,n)}))},i.prototype._registerSelectionEvents=function(){var t=this,n=["toggle","focus"];this.selection.on("toggle",(function(){t.toggleDropdown()})),this.selection.on("focus",(function(e){t.focus(e)})),this.selection.on("*",(function(r,i){-1===e.inArray(r,n)&&t.trigger(r,i)}))},i.prototype._registerDropdownEvents=function(){var e=this;this.dropdown.on("*",(function(t,n){e.trigger(t,n)}))},i.prototype._registerResultsEvents=function(){var e=this;this.results.on("*",(function(t,n){e.trigger(t,n)}))},i.prototype._registerEvents=function(){var e=this;this.on("open",(function(){e.$container.addClass("select2-container--open")})),this.on("close",(function(){e.$container.removeClass("select2-container--open")})),this.on("enable",(function(){e.$container.removeClass("select2-container--disabled")})),this.on("disable",(function(){e.$container.addClass("select2-container--disabled")})),this.on("blur",(function(){e.$container.removeClass("select2-container--focus")})),this.on("query",(function(t){e.isOpen()||e.trigger("open",{}),this.dataAdapter.query(t,(function(n){e.trigger("results:all",{data:n,query:t})}))})),this.on("query:append",(function(t){this.dataAdapter.query(t,(function(n){e.trigger("results:append",{data:n,query:t})}))})),this.on("keypress",(function(t){var n=t.which;e.isOpen()?n===r.ESC||n===r.TAB||n===r.UP&&t.altKey?(e.close(t),t.preventDefault()):n===r.ENTER?(e.trigger("results:select",{}),t.preventDefault()):n===r.SPACE&&t.ctrlKey?(e.trigger("results:toggle",{}),t.preventDefault()):n===r.UP?(e.trigger("results:previous",{}),t.preventDefault()):n===r.DOWN&&(e.trigger("results:next",{}),t.preventDefault()):(n===r.ENTER||n===r.SPACE||n===r.DOWN&&t.altKey)&&(e.open(),t.preventDefault())}))},i.prototype._syncAttributes=function(){this.options.set("disabled",this.$element.prop("disabled")),this.isDisabled()?(this.isOpen()&&this.close(),this.trigger("disable",{})):this.trigger("enable",{})},i.prototype._isChangeMutation=function(t,n){var r=!1,i=this;if(!t||!t.target||"OPTION"===t.target.nodeName||"OPTGROUP"===t.target.nodeName){if(n)if(n.addedNodes&&n.addedNodes.length>0)for(var o=0;o<n.addedNodes.length;o++)n.addedNodes[o].selected&&(r=!0);else n.removedNodes&&n.removedNodes.length>0?r=!0:e.isArray(n)&&e.each(n,(function(e,t){if(i._isChangeMutation(e,t))return r=!0,!1}));else r=!0;return r}},i.prototype._syncSubtree=function(e,t){var n=this._isChangeMutation(e,t),r=this;n&&this.dataAdapter.current((function(e){r.trigger("selection:update",{data:e})}))},i.prototype.trigger=function(e,t){var n=i.__super__.trigger,r={open:"opening",close:"closing",select:"selecting",unselect:"unselecting",clear:"clearing"};if(void 0===t&&(t={}),e in r){var o=r[e],a={prevented:!1,name:e,args:t};if(n.call(this,o,a),a.prevented)return void(t.prevented=!0)}n.call(this,e,t)},i.prototype.toggleDropdown=function(){this.isDisabled()||(this.isOpen()?this.close():this.open())},i.prototype.open=function(){this.isOpen()||this.isDisabled()||this.trigger("query",{})},i.prototype.close=function(e){this.isOpen()&&this.trigger("close",{originalEvent:e})},i.prototype.isEnabled=function(){return!this.isDisabled()},i.prototype.isDisabled=function(){return this.options.get("disabled")},i.prototype.isOpen=function(){return this.$container.hasClass("select2-container--open")},i.prototype.hasFocus=function(){return this.$container.hasClass("select2-container--focus")},i.prototype.focus=function(e){this.hasFocus()||(this.$container.addClass("select2-container--focus"),this.trigger("focus",{}))},i.prototype.enable=function(e){this.options.get("debug")&&window.console&&console.warn&&console.warn('Select2: The `select2("enable")` method has been deprecated and will be removed in later Select2 versions. Use $element.prop("disabled") instead.'),null!=e&&0!==e.length||(e=[!0]);var t=!e[0];this.$element.prop("disabled",t)},i.prototype.data=function(){this.options.get("debug")&&arguments.length>0&&window.console&&console.warn&&console.warn('Select2: Data can no longer be set using `select2("data")`. You should consider setting the value instead using `$element.val()`.');var e=[];return this.dataAdapter.current((function(t){e=t})),e},i.prototype.val=function(t){if(this.options.get("debug")&&window.console&&console.warn&&console.warn('Select2: The `select2("val")` method has been deprecated and will be removed in later Select2 versions. Use $element.val() instead.'),null==t||0===t.length)return this.$element.val();var n=t[0];e.isArray(n)&&(n=e.map(n,(function(e){return e.toString()}))),this.$element.val(n).trigger("input").trigger("change")},i.prototype.destroy=function(){this.$container.remove(),this.$element[0].detachEvent&&this.$element[0].detachEvent("onpropertychange",this._syncA),null!=this._observer?(this._observer.disconnect(),this._observer=null):this.$element[0].removeEventListener&&(this.$element[0].removeEventListener("DOMAttrModified",this._syncA,!1),this.$element[0].removeEventListener("DOMNodeInserted",this._syncS,!1),this.$element[0].removeEventListener("DOMNodeRemoved",this._syncS,!1)),this._syncA=null,this._syncS=null,this.$element.off(".select2"),this.$element.attr("tabindex",n.GetData(this.$element[0],"old-tabindex")),this.$element.removeClass("select2-hidden-accessible"),this.$element.attr("aria-hidden","false"),n.RemoveData(this.$element[0]),this.$element.removeData("select2"),this.dataAdapter.destroy(),this.selection.destroy(),this.dropdown.destroy(),this.results.destroy(),this.dataAdapter=null,this.selection=null,this.dropdown=null,this.results=null},i.prototype.render=function(){var t=e('<span class="select2 select2-container"><span class="selection"></span><span class="dropdown-wrapper" aria-hidden="true"></span></span>');return t.attr("dir",this.options.get("dir")),this.$container=t,this.$container.addClass("select2-container--"+this.options.get("theme")),n.StoreData(t[0],"element",this.$element),t},i})),t.define("jquery-mousewheel",["jquery"],(function(e){return e})),t.define("jquery.select2",["jquery","jquery-mousewheel","./select2/core","./select2/defaults","./select2/utils"],(function(e,t,n,r,i){if(null==e.fn.select2){var o=["open","close","destroy"];e.fn.select2=function(t){if("object"==typeof(t=t||{}))return this.each((function(){var r=e.extend(!0,{},t);new n(e(this),r)})),this;if("string"==typeof t){var r,a=Array.prototype.slice.call(arguments,1);return this.each((function(){var e=i.GetData(this,"select2");null==e&&window.console&&console.error&&console.error("The select2('"+t+"') method was called on an element that is not using Select2."),r=e[t].apply(e,a)})),e.inArray(t,o)>-1?this:r}throw new Error("Invalid arguments for Select2: "+t)}}return null==e.fn.select2.defaults&&(e.fn.select2.defaults=r),n})),{define:t.define,require:t.require}}(),n=t.require("jquery.select2");return e.fn.select2.amd=t,n},void 0===(o="function"==typeof r?r.apply(t,i):r)||(e.exports=o)},9567:e=>{"use strict";e.exports=window.jQuery}},t={};function n(r){var i=t[r];if(void 0!==i)return i.exports;var o=t[r]={exports:{}};return e[r].call(o.exports,o,o.exports,n),o.exports}n.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return n.d(t,{a:t}),t},n.d=(e,t)=>{for(var r in t)n.o(t,r)&&!n.o(e,r)&&Object.defineProperty(e,r,{enumerable:!0,get:t[r]})},n.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),n.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),n.r=e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})};var r={};(()=>{"use strict";n.r(r),n.d(r,{Flatpickr:()=>o(),Scrollbars:()=>k});n(1539);var e=n(9567),t=n.n(e),i=(n(5912),n(4953)),o=n.n(i);function a(e){return getComputedStyle(e)}function s(e,t){for(var n in t){var r=t[n];"number"==typeof r&&(r+="px"),e.style[n]=r}return e}function l(e){var t=document.createElement("div");return t.className=e,t}var c="undefined"!=typeof Element&&(Element.prototype.matches||Element.prototype.webkitMatchesSelector||Element.prototype.mozMatchesSelector||Element.prototype.msMatchesSelector);function u(e,t){if(!c)throw new Error("No element matching method supported");return c.call(e,t)}function d(e){e.remove?e.remove():e.parentNode&&e.parentNode.removeChild(e)}function p(e,t){return Array.prototype.filter.call(e.children,(function(e){return u(e,t)}))}var h="ps",f="ps__rtl",g={thumb:function(e){return"ps__thumb-"+e},rail:function(e){return"ps__rail-"+e},consuming:"ps__child--consume"},m={focus:"ps--focus",clicking:"ps--clicking",active:function(e){return"ps--active-"+e},scrolling:function(e){return"ps--scrolling-"+e}},v={x:null,y:null};function y(e,t){var n=e.element.classList,r=m.scrolling(t);n.contains(r)?clearTimeout(v[t]):n.add(r)}function b(e,t){v[t]=setTimeout((function(){return e.isAlive&&e.element.classList.remove(m.scrolling(t))}),e.settings.scrollingThreshold)}var w=function(e){this.element=e,this.handlers={}},D={isEmpty:{configurable:!0}};w.prototype.bind=function(e,t){void 0===this.handlers[e]&&(this.handlers[e]=[]),this.handlers[e].push(t),this.element.addEventListener(e,t,!1)},w.prototype.unbind=function(e,t){var n=this;this.handlers[e]=this.handlers[e].filter((function(r){return!(!t||r===t)||(n.element.removeEventListener(e,r,!1),!1)}))},w.prototype.unbindAll=function(){for(var e in this.handlers)this.unbind(e)},D.isEmpty.get=function(){var e=this;return Object.keys(this.handlers).every((function(t){return 0===e.handlers[t].length}))},Object.defineProperties(w.prototype,D);var _=function(){this.eventElements=[]};function C(e){if("function"==typeof window.CustomEvent)return new CustomEvent(e);var t=document.createEvent("CustomEvent");return t.initCustomEvent(e,!1,!1,void 0),t}function x(e,t,n,r,i){var o;if(void 0===r&&(r=!0),void 0===i&&(i=!1),"top"===t)o=["contentHeight","containerHeight","scrollTop","y","up","down"];else{if("left"!==t)throw new Error("A proper axis should be provided");o=["contentWidth","containerWidth","scrollLeft","x","left","right"]}!function(e,t,n,r,i){var o=n[0],a=n[1],s=n[2],l=n[3],c=n[4],u=n[5];void 0===r&&(r=!0);void 0===i&&(i=!1);var d=e.element;e.reach[l]=null,d[s]<1&&(e.reach[l]="start");d[s]>e[o]-e[a]-1&&(e.reach[l]="end");t&&(d.dispatchEvent(C("ps-scroll-"+l)),t<0?d.dispatchEvent(C("ps-scroll-"+c)):t>0&&d.dispatchEvent(C("ps-scroll-"+u)),r&&function(e,t){y(e,t),b(e,t)}(e,l));e.reach[l]&&(t||i)&&d.dispatchEvent(C("ps-"+l+"-reach-"+e.reach[l]))}(e,n,o,r,i)}function M(e){return parseInt(e,10)||0}_.prototype.eventElement=function(e){var t=this.eventElements.filter((function(t){return t.element===e}))[0];return t||(t=new w(e),this.eventElements.push(t)),t},_.prototype.bind=function(e,t,n){this.eventElement(e).bind(t,n)},_.prototype.unbind=function(e,t,n){var r=this.eventElement(e);r.unbind(t,n),r.isEmpty&&this.eventElements.splice(this.eventElements.indexOf(r),1)},_.prototype.unbindAll=function(){this.eventElements.forEach((function(e){return e.unbindAll()})),this.eventElements=[]},_.prototype.once=function(e,t,n){var r=this.eventElement(e),i=function(e){r.unbind(t,i),n(e)};r.bind(t,i)};var E={isWebKit:"undefined"!=typeof document&&"WebkitAppearance"in document.documentElement.style,supportsTouch:"undefined"!=typeof window&&("ontouchstart"in window||"maxTouchPoints"in window.navigator&&window.navigator.maxTouchPoints>0||window.DocumentTouch&&document instanceof window.DocumentTouch),supportsIePointer:"undefined"!=typeof navigator&&navigator.msMaxTouchPoints,isChrome:"undefined"!=typeof navigator&&/Chrome/i.test(navigator&&navigator.userAgent)};function S(e){var t=e.element,n=Math.floor(t.scrollTop),r=t.getBoundingClientRect();e.containerWidth=Math.ceil(r.width),e.containerHeight=Math.ceil(r.height),e.contentWidth=t.scrollWidth,e.contentHeight=t.scrollHeight,t.contains(e.scrollbarXRail)||(p(t,g.rail("x")).forEach((function(e){return d(e)})),t.appendChild(e.scrollbarXRail)),t.contains(e.scrollbarYRail)||(p(t,g.rail("y")).forEach((function(e){return d(e)})),t.appendChild(e.scrollbarYRail)),!e.settings.suppressScrollX&&e.containerWidth+e.settings.scrollXMarginOffset<e.contentWidth?(e.scrollbarXActive=!0,e.railXWidth=e.containerWidth-e.railXMarginWidth,e.railXRatio=e.containerWidth/e.railXWidth,e.scrollbarXWidth=A(e,M(e.railXWidth*e.containerWidth/e.contentWidth)),e.scrollbarXLeft=M((e.negativeScrollAdjustment+t.scrollLeft)*(e.railXWidth-e.scrollbarXWidth)/(e.contentWidth-e.containerWidth))):e.scrollbarXActive=!1,!e.settings.suppressScrollY&&e.containerHeight+e.settings.scrollYMarginOffset<e.contentHeight?(e.scrollbarYActive=!0,e.railYHeight=e.containerHeight-e.railYMarginHeight,e.railYRatio=e.containerHeight/e.railYHeight,e.scrollbarYHeight=A(e,M(e.railYHeight*e.containerHeight/e.contentHeight)),e.scrollbarYTop=M(n*(e.railYHeight-e.scrollbarYHeight)/(e.contentHeight-e.containerHeight))):e.scrollbarYActive=!1,e.scrollbarXLeft>=e.railXWidth-e.scrollbarXWidth&&(e.scrollbarXLeft=e.railXWidth-e.scrollbarXWidth),e.scrollbarYTop>=e.railYHeight-e.scrollbarYHeight&&(e.scrollbarYTop=e.railYHeight-e.scrollbarYHeight),function(e,t){var n={width:t.railXWidth},r=Math.floor(e.scrollTop);t.isRtl?n.left=t.negativeScrollAdjustment+e.scrollLeft+t.containerWidth-t.contentWidth:n.left=e.scrollLeft;t.isScrollbarXUsingBottom?n.bottom=t.scrollbarXBottom-r:n.top=t.scrollbarXTop+r;s(t.scrollbarXRail,n);var i={top:r,height:t.railYHeight};t.isScrollbarYUsingRight?t.isRtl?i.right=t.contentWidth-(t.negativeScrollAdjustment+e.scrollLeft)-t.scrollbarYRight-t.scrollbarYOuterWidth-9:i.right=t.scrollbarYRight-e.scrollLeft:t.isRtl?i.left=t.negativeScrollAdjustment+e.scrollLeft+2*t.containerWidth-t.contentWidth-t.scrollbarYLeft-t.scrollbarYOuterWidth:i.left=t.scrollbarYLeft+e.scrollLeft;s(t.scrollbarYRail,i),s(t.scrollbarX,{left:t.scrollbarXLeft,width:t.scrollbarXWidth-t.railBorderXWidth}),s(t.scrollbarY,{top:t.scrollbarYTop,height:t.scrollbarYHeight-t.railBorderYWidth})}(t,e),e.scrollbarXActive?t.classList.add(m.active("x")):(t.classList.remove(m.active("x")),e.scrollbarXWidth=0,e.scrollbarXLeft=0,t.scrollLeft=!0===e.isRtl?e.contentWidth:0),e.scrollbarYActive?t.classList.add(m.active("y")):(t.classList.remove(m.active("y")),e.scrollbarYHeight=0,e.scrollbarYTop=0,t.scrollTop=0)}function A(e,t){return e.settings.minScrollbarLength&&(t=Math.max(t,e.settings.minScrollbarLength)),e.settings.maxScrollbarLength&&(t=Math.min(t,e.settings.maxScrollbarLength)),t}function T(e,t){var n=t[0],r=t[1],i=t[2],o=t[3],a=t[4],s=t[5],l=t[6],c=t[7],u=t[8],d=e.element,p=null,h=null,f=null;function g(t){t.touches&&t.touches[0]&&(t[i]=t.touches[0].pageY),d[l]=p+f*(t[i]-h),y(e,c),S(e),t.stopPropagation(),t.preventDefault()}function v(){b(e,c),e[u].classList.remove(m.clicking),e.event.unbind(e.ownerDocument,"mousemove",g)}function w(t,a){p=d[l],a&&t.touches&&(t[i]=t.touches[0].pageY),h=t[i],f=(e[r]-e[n])/(e[o]-e[s]),a?e.event.bind(e.ownerDocument,"touchmove",g):(e.event.bind(e.ownerDocument,"mousemove",g),e.event.once(e.ownerDocument,"mouseup",v),t.preventDefault()),e[u].classList.add(m.clicking),t.stopPropagation()}e.event.bind(e[a],"mousedown",(function(e){w(e)})),e.event.bind(e[a],"touchstart",(function(e){w(e,!0)}))}var $={"click-rail":function(e){e.element,e.event.bind(e.scrollbarY,"mousedown",(function(e){return e.stopPropagation()})),e.event.bind(e.scrollbarYRail,"mousedown",(function(t){var n=t.pageY-window.pageYOffset-e.scrollbarYRail.getBoundingClientRect().top>e.scrollbarYTop?1:-1;e.element.scrollTop+=n*e.containerHeight,S(e),t.stopPropagation()})),e.event.bind(e.scrollbarX,"mousedown",(function(e){return e.stopPropagation()})),e.event.bind(e.scrollbarXRail,"mousedown",(function(t){var n=t.pageX-window.pageXOffset-e.scrollbarXRail.getBoundingClientRect().left>e.scrollbarXLeft?1:-1;e.element.scrollLeft+=n*e.containerWidth,S(e),t.stopPropagation()}))},"drag-thumb":function(e){T(e,["containerWidth","contentWidth","pageX","railXWidth","scrollbarX","scrollbarXWidth","scrollLeft","x","scrollbarXRail"]),T(e,["containerHeight","contentHeight","pageY","railYHeight","scrollbarY","scrollbarYHeight","scrollTop","y","scrollbarYRail"])},keyboard:function(e){var t=e.element;e.event.bind(e.ownerDocument,"keydown",(function(n){if(!(n.isDefaultPrevented&&n.isDefaultPrevented()||n.defaultPrevented)&&(u(t,":hover")||u(e.scrollbarX,":focus")||u(e.scrollbarY,":focus"))){var r,i=document.activeElement?document.activeElement:e.ownerDocument.activeElement;if(i){if("IFRAME"===i.tagName)i=i.contentDocument.activeElement;else for(;i.shadowRoot;)i=i.shadowRoot.activeElement;if(u(r=i,"input,[contenteditable]")||u(r,"select,[contenteditable]")||u(r,"textarea,[contenteditable]")||u(r,"button,[contenteditable]"))return}var o=0,a=0;switch(n.which){case 37:o=n.metaKey?-e.contentWidth:n.altKey?-e.containerWidth:-30;break;case 38:a=n.metaKey?e.contentHeight:n.altKey?e.containerHeight:30;break;case 39:o=n.metaKey?e.contentWidth:n.altKey?e.containerWidth:30;break;case 40:a=n.metaKey?-e.contentHeight:n.altKey?-e.containerHeight:-30;break;case 32:a=n.shiftKey?e.containerHeight:-e.containerHeight;break;case 33:a=e.containerHeight;break;case 34:a=-e.containerHeight;break;case 36:a=e.contentHeight;break;case 35:a=-e.contentHeight;break;default:return}e.settings.suppressScrollX&&0!==o||e.settings.suppressScrollY&&0!==a||(t.scrollTop-=a,t.scrollLeft+=o,S(e),function(n,r){var i=Math.floor(t.scrollTop);if(0===n){if(!e.scrollbarYActive)return!1;if(0===i&&r>0||i>=e.contentHeight-e.containerHeight&&r<0)return!e.settings.wheelPropagation}var o=t.scrollLeft;if(0===r){if(!e.scrollbarXActive)return!1;if(0===o&&n<0||o>=e.contentWidth-e.containerWidth&&n>0)return!e.settings.wheelPropagation}return!0}(o,a)&&n.preventDefault())}}))},wheel:function(e){var t=e.element;function n(n){var r=function(e){var t=e.deltaX,n=-1*e.deltaY;return void 0!==t&&void 0!==n||(t=-1*e.wheelDeltaX/6,n=e.wheelDeltaY/6),e.deltaMode&&1===e.deltaMode&&(t*=10,n*=10),t!=t&&n!=n&&(t=0,n=e.wheelDelta),e.shiftKey?[-n,-t]:[t,n]}(n),i=r[0],o=r[1];if(!function(e,n,r){if(!E.isWebKit&&t.querySelector("select:focus"))return!0;if(!t.contains(e))return!1;for(var i=e;i&&i!==t;){if(i.classList.contains(g.consuming))return!0;var o=a(i);if(r&&o.overflowY.match(/(scroll|auto)/)){var s=i.scrollHeight-i.clientHeight;if(s>0&&(i.scrollTop>0&&r<0||i.scrollTop<s&&r>0))return!0}if(n&&o.overflowX.match(/(scroll|auto)/)){var l=i.scrollWidth-i.clientWidth;if(l>0&&(i.scrollLeft>0&&n<0||i.scrollLeft<l&&n>0))return!0}i=i.parentNode}return!1}(n.target,i,o)){var s=!1;e.settings.useBothWheelAxes?e.scrollbarYActive&&!e.scrollbarXActive?(o?t.scrollTop-=o*e.settings.wheelSpeed:t.scrollTop+=i*e.settings.wheelSpeed,s=!0):e.scrollbarXActive&&!e.scrollbarYActive&&(i?t.scrollLeft+=i*e.settings.wheelSpeed:t.scrollLeft-=o*e.settings.wheelSpeed,s=!0):(t.scrollTop-=o*e.settings.wheelSpeed,t.scrollLeft+=i*e.settings.wheelSpeed),S(e),s=s||function(n,r){var i=Math.floor(t.scrollTop),o=0===t.scrollTop,a=i+t.offsetHeight===t.scrollHeight,s=0===t.scrollLeft,l=t.scrollLeft+t.offsetWidth===t.scrollWidth;return!(Math.abs(r)>Math.abs(n)?o||a:s||l)||!e.settings.wheelPropagation}(i,o),s&&!n.ctrlKey&&(n.stopPropagation(),n.preventDefault())}}void 0!==window.onwheel?e.event.bind(t,"wheel",n):void 0!==window.onmousewheel&&e.event.bind(t,"mousewheel",n)},touch:function(e){if(E.supportsTouch||E.supportsIePointer){var t=e.element,n={},r=0,i={},o=null;E.supportsTouch?(e.event.bind(t,"touchstart",u),e.event.bind(t,"touchmove",d),e.event.bind(t,"touchend",p)):E.supportsIePointer&&(window.PointerEvent?(e.event.bind(t,"pointerdown",u),e.event.bind(t,"pointermove",d),e.event.bind(t,"pointerup",p)):window.MSPointerEvent&&(e.event.bind(t,"MSPointerDown",u),e.event.bind(t,"MSPointerMove",d),e.event.bind(t,"MSPointerUp",p)))}function s(n,r){t.scrollTop-=r,t.scrollLeft-=n,S(e)}function l(e){return e.targetTouches?e.targetTouches[0]:e}function c(e){return(!e.pointerType||"pen"!==e.pointerType||0!==e.buttons)&&(!(!e.targetTouches||1!==e.targetTouches.length)||!(!e.pointerType||"mouse"===e.pointerType||e.pointerType===e.MSPOINTER_TYPE_MOUSE))}function u(e){if(c(e)){var t=l(e);n.pageX=t.pageX,n.pageY=t.pageY,r=(new Date).getTime(),null!==o&&clearInterval(o)}}function d(o){if(c(o)){var u=l(o),d={pageX:u.pageX,pageY:u.pageY},p=d.pageX-n.pageX,h=d.pageY-n.pageY;if(function(e,n,r){if(!t.contains(e))return!1;for(var i=e;i&&i!==t;){if(i.classList.contains(g.consuming))return!0;var o=a(i);if(r&&o.overflowY.match(/(scroll|auto)/)){var s=i.scrollHeight-i.clientHeight;if(s>0&&(i.scrollTop>0&&r<0||i.scrollTop<s&&r>0))return!0}if(n&&o.overflowX.match(/(scroll|auto)/)){var l=i.scrollWidth-i.clientWidth;if(l>0&&(i.scrollLeft>0&&n<0||i.scrollLeft<l&&n>0))return!0}i=i.parentNode}return!1}(o.target,p,h))return;s(p,h),n=d;var f=(new Date).getTime(),m=f-r;m>0&&(i.x=p/m,i.y=h/m,r=f),function(n,r){var i=Math.floor(t.scrollTop),o=t.scrollLeft,a=Math.abs(n),s=Math.abs(r);if(s>a){if(r<0&&i===e.contentHeight-e.containerHeight||r>0&&0===i)return 0===window.scrollY&&r>0&&E.isChrome}else if(a>s&&(n<0&&o===e.contentWidth-e.containerWidth||n>0&&0===o))return!0;return!0}(p,h)&&o.preventDefault()}}function p(){e.settings.swipeEasing&&(clearInterval(o),o=setInterval((function(){e.isInitialized?clearInterval(o):i.x||i.y?Math.abs(i.x)<.01&&Math.abs(i.y)<.01?clearInterval(o):(s(30*i.x,30*i.y),i.x*=.8,i.y*=.8):clearInterval(o)}),10))}}},O=function(e,t){var n=this;if(void 0===t&&(t={}),"string"==typeof e&&(e=document.querySelector(e)),!e||!e.nodeName)throw new Error("no element is specified to initialize PerfectScrollbar");for(var r in this.element=e,e.classList.add(h),this.settings={handlers:["click-rail","drag-thumb","keyboard","wheel","touch"],maxScrollbarLength:null,minScrollbarLength:null,scrollingThreshold:1e3,scrollXMarginOffset:0,scrollYMarginOffset:0,suppressScrollX:!1,suppressScrollY:!1,swipeEasing:!0,useBothWheelAxes:!1,wheelPropagation:!0,wheelSpeed:1},t)this.settings[r]=t[r];this.containerWidth=null,this.containerHeight=null,this.contentWidth=null,this.contentHeight=null;var i,o,c=function(){return e.classList.add(m.focus)},u=function(){return e.classList.remove(m.focus)};this.isRtl="rtl"===a(e).direction,!0===this.isRtl&&e.classList.add(f),this.isNegativeScroll=(o=e.scrollLeft,e.scrollLeft=-1,i=e.scrollLeft<0,e.scrollLeft=o,i),this.negativeScrollAdjustment=this.isNegativeScroll?e.scrollWidth-e.clientWidth:0,this.event=new _,this.ownerDocument=e.ownerDocument||document,this.scrollbarXRail=l(g.rail("x")),e.appendChild(this.scrollbarXRail),this.scrollbarX=l(g.thumb("x")),this.scrollbarXRail.appendChild(this.scrollbarX),this.scrollbarX.setAttribute("tabindex",0),this.event.bind(this.scrollbarX,"focus",c),this.event.bind(this.scrollbarX,"blur",u),this.scrollbarXActive=null,this.scrollbarXWidth=null,this.scrollbarXLeft=null;var d=a(this.scrollbarXRail);this.scrollbarXBottom=parseInt(d.bottom,10),isNaN(this.scrollbarXBottom)?(this.isScrollbarXUsingBottom=!1,this.scrollbarXTop=M(d.top)):this.isScrollbarXUsingBottom=!0,this.railBorderXWidth=M(d.borderLeftWidth)+M(d.borderRightWidth),s(this.scrollbarXRail,{display:"block"}),this.railXMarginWidth=M(d.marginLeft)+M(d.marginRight),s(this.scrollbarXRail,{display:""}),this.railXWidth=null,this.railXRatio=null,this.scrollbarYRail=l(g.rail("y")),e.appendChild(this.scrollbarYRail),this.scrollbarY=l(g.thumb("y")),this.scrollbarYRail.appendChild(this.scrollbarY),this.scrollbarY.setAttribute("tabindex",0),this.event.bind(this.scrollbarY,"focus",c),this.event.bind(this.scrollbarY,"blur",u),this.scrollbarYActive=null,this.scrollbarYHeight=null,this.scrollbarYTop=null;var p=a(this.scrollbarYRail);this.scrollbarYRight=parseInt(p.right,10),isNaN(this.scrollbarYRight)?(this.isScrollbarYUsingRight=!1,this.scrollbarYLeft=M(p.left)):this.isScrollbarYUsingRight=!0,this.scrollbarYOuterWidth=this.isRtl?function(e){var t=a(e);return M(t.width)+M(t.paddingLeft)+M(t.paddingRight)+M(t.borderLeftWidth)+M(t.borderRightWidth)}(this.scrollbarY):null,this.railBorderYWidth=M(p.borderTopWidth)+M(p.borderBottomWidth),s(this.scrollbarYRail,{display:"block"}),this.railYMarginHeight=M(p.marginTop)+M(p.marginBottom),s(this.scrollbarYRail,{display:""}),this.railYHeight=null,this.railYRatio=null,this.reach={x:e.scrollLeft<=0?"start":e.scrollLeft>=this.contentWidth-this.containerWidth?"end":null,y:e.scrollTop<=0?"start":e.scrollTop>=this.contentHeight-this.containerHeight?"end":null},this.isAlive=!0,this.settings.handlers.forEach((function(e){return $[e](n)})),this.lastScrollTop=Math.floor(e.scrollTop),this.lastScrollLeft=e.scrollLeft,this.event.bind(this.element,"scroll",(function(e){return n.onScroll(e)})),S(this)};O.prototype.update=function(){this.isAlive&&(this.negativeScrollAdjustment=this.isNegativeScroll?this.element.scrollWidth-this.element.clientWidth:0,s(this.scrollbarXRail,{display:"block"}),s(this.scrollbarYRail,{display:"block"}),this.railXMarginWidth=M(a(this.scrollbarXRail).marginLeft)+M(a(this.scrollbarXRail).marginRight),this.railYMarginHeight=M(a(this.scrollbarYRail).marginTop)+M(a(this.scrollbarYRail).marginBottom),s(this.scrollbarXRail,{display:"none"}),s(this.scrollbarYRail,{display:"none"}),S(this),x(this,"top",0,!1,!0),x(this,"left",0,!1,!0),s(this.scrollbarXRail,{display:""}),s(this.scrollbarYRail,{display:""}))},O.prototype.onScroll=function(e){this.isAlive&&(S(this),x(this,"top",this.element.scrollTop-this.lastScrollTop),x(this,"left",this.element.scrollLeft-this.lastScrollLeft),this.lastScrollTop=Math.floor(this.element.scrollTop),this.lastScrollLeft=this.element.scrollLeft)},O.prototype.destroy=function(){this.isAlive&&(this.event.unbindAll(),d(this.scrollbarX),d(this.scrollbarY),d(this.scrollbarXRail),d(this.scrollbarYRail),this.removePsClasses(),this.element=null,this.scrollbarX=null,this.scrollbarY=null,this.scrollbarXRail=null,this.scrollbarYRail=null,this.isAlive=!1)},O.prototype.removePsClasses=function(){this.element.className=this.element.className.split(" ").filter((function(e){return!e.match(/^ps([-_].+|)$/)})).join(" ")};const k=O;n(686);if(window.jQuery){["select2"].forEach((function(e){window.jQuery.fn[e]||(window.jQuery.fn[e]=t().fn[e])}))}else window.jQuery=t()})(),window.BrizyLibs=r})();
;
(()=>{var t={9662:(t,e,r)=>{var n=r(614),o=r(6330),i=TypeError;t.exports=function(t){if(n(t))return t;throw i(o(t)+" is not a function")}},9483:(t,e,r)=>{var n=r(4411),o=r(6330),i=TypeError;t.exports=function(t){if(n(t))return t;throw i(o(t)+" is not a constructor")}},6077:(t,e,r)=>{var n=r(614),o=String,i=TypeError;t.exports=function(t){if("object"==typeof t||n(t))return t;throw i("Can't set "+o(t)+" as a prototype")}},1223:(t,e,r)=>{var n=r(5112),o=r(30),i=r(3070).f,a=n("unscopables"),s=Array.prototype;null==s[a]&&i(s,a,{configurable:!0,value:o(null)}),t.exports=function(t){s[a][t]=!0}},1530:(t,e,r)=>{"use strict";var n=r(8710).charAt;t.exports=function(t,e,r){return e+(r?n(t,e).length:1)}},5787:(t,e,r)=>{var n=r(7976),o=TypeError;t.exports=function(t,e){if(n(e,t))return t;throw o("Incorrect invocation")}},9670:(t,e,r)=>{var n=r(111),o=String,i=TypeError;t.exports=function(t){if(n(t))return t;throw i(o(t)+" is not an object")}},7556:(t,e,r)=>{var n=r(7293);t.exports=n((function(){if("function"==typeof ArrayBuffer){var t=new ArrayBuffer(8);Object.isExtensible(t)&&Object.defineProperty(t,"a",{value:8})}}))},8533:(t,e,r)=>{"use strict";var n=r(2092).forEach,o=r(9341)("forEach");t.exports=o?[].forEach:function(t){return n(this,t,arguments.length>1?arguments[1]:void 0)}},8457:(t,e,r)=>{"use strict";var n=r(9974),o=r(6916),i=r(7908),a=r(3411),s=r(7659),c=r(4411),u=r(6244),l=r(6135),f=r(4121),d=r(1246),p=Array;t.exports=function(t){var e=i(t),r=c(this),h=arguments.length,v=h>1?arguments[1]:void 0,m=void 0!==v;m&&(v=n(v,h>2?arguments[2]:void 0));var b,g,y,w,_,z,S=d(e),x=0;if(!S||this===p&&s(S))for(b=u(e),g=r?new this(b):p(b);b>x;x++)z=m?v(e[x],x):e[x],l(g,x,z);else for(_=(w=f(e,S)).next,g=r?new this:[];!(y=o(_,w)).done;x++)z=m?a(w,v,[y.value,x],!0):y.value,l(g,x,z);return g.length=x,g}},1318:(t,e,r)=>{var n=r(5656),o=r(1400),i=r(6244),a=function(t){return function(e,r,a){var s,c=n(e),u=i(c),l=o(a,u);if(t&&r!=r){for(;u>l;)if((s=c[l++])!=s)return!0}else for(;u>l;l++)if((t||l in c)&&c[l]===r)return t||l||0;return!t&&-1}};t.exports={includes:a(!0),indexOf:a(!1)}},2092:(t,e,r)=>{var n=r(9974),o=r(1702),i=r(8361),a=r(7908),s=r(6244),c=r(5417),u=o([].push),l=function(t){var e=1==t,r=2==t,o=3==t,l=4==t,f=6==t,d=7==t,p=5==t||f;return function(h,v,m,b){for(var g,y,w=a(h),_=i(w),z=n(v,m),S=s(_),x=0,E=b||c,k=e?E(h,S):r||d?E(h,0):void 0;S>x;x++)if((p||x in _)&&(y=z(g=_[x],x,w),t))if(e)k[x]=y;else if(y)switch(t){case 3:return!0;case 5:return g;case 6:return x;case 2:u(k,g)}else switch(t){case 4:return!1;case 7:u(k,g)}return f?-1:o||l?l:k}};t.exports={forEach:l(0),map:l(1),filter:l(2),some:l(3),every:l(4),find:l(5),findIndex:l(6),filterReject:l(7)}},1194:(t,e,r)=>{var n=r(7293),o=r(5112),i=r(7392),a=o("species");t.exports=function(t){return i>=51||!n((function(){var e=[];return(e.constructor={})[a]=function(){return{foo:1}},1!==e[t](Boolean).foo}))}},9341:(t,e,r)=>{"use strict";var n=r(7293);t.exports=function(t,e){var r=[][t];return!!r&&n((function(){r.call(null,e||function(){return 1},1)}))}},3658:(t,e,r)=>{"use strict";var n=r(9781),o=r(3157),i=TypeError,a=Object.getOwnPropertyDescriptor,s=n&&!function(){if(void 0!==this)return!0;try{Object.defineProperty([],"length",{writable:!1}).length=1}catch(t){return t instanceof TypeError}}();t.exports=s?function(t,e){if(o(t)&&!a(t,"length").writable)throw i("Cannot set read only .length");return t.length=e}:function(t,e){return t.length=e}},1589:(t,e,r)=>{var n=r(1400),o=r(6244),i=r(6135),a=Array,s=Math.max;t.exports=function(t,e,r){for(var c=o(t),u=n(e,c),l=n(void 0===r?c:r,c),f=a(s(l-u,0)),d=0;u<l;u++,d++)i(f,d,t[u]);return f.length=d,f}},206:(t,e,r)=>{var n=r(1702);t.exports=n([].slice)},4362:(t,e,r)=>{var n=r(1589),o=Math.floor,i=function(t,e){var r=t.length,c=o(r/2);return r<8?a(t,e):s(t,i(n(t,0,c),e),i(n(t,c),e),e)},a=function(t,e){for(var r,n,o=t.length,i=1;i<o;){for(n=i,r=t[i];n&&e(t[n-1],r)>0;)t[n]=t[--n];n!==i++&&(t[n]=r)}return t},s=function(t,e,r,n){for(var o=e.length,i=r.length,a=0,s=0;a<o||s<i;)t[a+s]=a<o&&s<i?n(e[a],r[s])<=0?e[a++]:r[s++]:a<o?e[a++]:r[s++];return t};t.exports=i},7475:(t,e,r)=>{var n=r(3157),o=r(4411),i=r(111),a=r(5112)("species"),s=Array;t.exports=function(t){var e;return n(t)&&(e=t.constructor,(o(e)&&(e===s||n(e.prototype))||i(e)&&null===(e=e[a]))&&(e=void 0)),void 0===e?s:e}},5417:(t,e,r)=>{var n=r(7475);t.exports=function(t,e){return new(n(t))(0===e?0:e)}},3411:(t,e,r)=>{var n=r(9670),o=r(9212);t.exports=function(t,e,r,i){try{return i?e(n(r)[0],r[1]):e(r)}catch(e){o(t,"throw",e)}}},7072:(t,e,r)=>{var n=r(5112)("iterator"),o=!1;try{var i=0,a={next:function(){return{done:!!i++}},return:function(){o=!0}};a[n]=function(){return this},Array.from(a,(function(){throw 2}))}catch(t){}t.exports=function(t,e){if(!e&&!o)return!1;var r=!1;try{var i={};i[n]=function(){return{next:function(){return{done:r=!0}}}},t(i)}catch(t){}return r}},4326:(t,e,r)=>{var n=r(84),o=n({}.toString),i=n("".slice);t.exports=function(t){return i(o(t),8,-1)}},648:(t,e,r)=>{var n=r(1694),o=r(614),i=r(4326),a=r(5112)("toStringTag"),s=Object,c="Arguments"==i(function(){return arguments}());t.exports=n?i:function(t){var e,r,n;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(r=function(t,e){try{return t[e]}catch(t){}}(e=s(t),a))?r:c?i(e):"Object"==(n=i(e))&&o(e.callee)?"Arguments":n}},5631:(t,e,r)=>{"use strict";var n=r(3070).f,o=r(30),i=r(9190),a=r(9974),s=r(5787),c=r(8554),u=r(408),l=r(1656),f=r(6178),d=r(6340),p=r(9781),h=r(2423).fastKey,v=r(9909),m=v.set,b=v.getterFor;t.exports={getConstructor:function(t,e,r,l){var f=t((function(t,n){s(t,d),m(t,{type:e,index:o(null),first:void 0,last:void 0,size:0}),p||(t.size=0),c(n)||u(n,t[l],{that:t,AS_ENTRIES:r})})),d=f.prototype,v=b(e),g=function(t,e,r){var n,o,i=v(t),a=y(t,e);return a?a.value=r:(i.last=a={index:o=h(e,!0),key:e,value:r,previous:n=i.last,next:void 0,removed:!1},i.first||(i.first=a),n&&(n.next=a),p?i.size++:t.size++,"F"!==o&&(i.index[o]=a)),t},y=function(t,e){var r,n=v(t),o=h(e);if("F"!==o)return n.index[o];for(r=n.first;r;r=r.next)if(r.key==e)return r};return i(d,{clear:function(){for(var t=v(this),e=t.index,r=t.first;r;)r.removed=!0,r.previous&&(r.previous=r.previous.next=void 0),delete e[r.index],r=r.next;t.first=t.last=void 0,p?t.size=0:this.size=0},delete:function(t){var e=this,r=v(e),n=y(e,t);if(n){var o=n.next,i=n.previous;delete r.index[n.index],n.removed=!0,i&&(i.next=o),o&&(o.previous=i),r.first==n&&(r.first=o),r.last==n&&(r.last=i),p?r.size--:e.size--}return!!n},forEach:function(t){for(var e,r=v(this),n=a(t,arguments.length>1?arguments[1]:void 0);e=e?e.next:r.first;)for(n(e.value,e.key,this);e&&e.removed;)e=e.previous},has:function(t){return!!y(this,t)}}),i(d,r?{get:function(t){var e=y(this,t);return e&&e.value},set:function(t,e){return g(this,0===t?0:t,e)}}:{add:function(t){return g(this,t=0===t?0:t,t)}}),p&&n(d,"size",{get:function(){return v(this).size}}),f},setStrong:function(t,e,r){var n=e+" Iterator",o=b(e),i=b(n);l(t,e,(function(t,e){m(this,{type:n,target:t,state:o(t),kind:e,last:void 0})}),(function(){for(var t=i(this),e=t.kind,r=t.last;r&&r.removed;)r=r.previous;return t.target&&(t.last=r=r?r.next:t.state.first)?f("keys"==e?r.key:"values"==e?r.value:[r.key,r.value],!1):(t.target=void 0,f(void 0,!0))}),r?"entries":"values",!r,!0),d(e)}}},7710:(t,e,r)=>{"use strict";var n=r(2109),o=r(7854),i=r(1702),a=r(4705),s=r(8052),c=r(2423),u=r(408),l=r(5787),f=r(614),d=r(8554),p=r(111),h=r(7293),v=r(7072),m=r(8003),b=r(9587);t.exports=function(t,e,r){var g=-1!==t.indexOf("Map"),y=-1!==t.indexOf("Weak"),w=g?"set":"add",_=o[t],z=_&&_.prototype,S=_,x={},E=function(t){var e=i(z[t]);s(z,t,"add"==t?function(t){return e(this,0===t?0:t),this}:"delete"==t?function(t){return!(y&&!p(t))&&e(this,0===t?0:t)}:"get"==t?function(t){return y&&!p(t)?void 0:e(this,0===t?0:t)}:"has"==t?function(t){return!(y&&!p(t))&&e(this,0===t?0:t)}:function(t,r){return e(this,0===t?0:t,r),this})};if(a(t,!f(_)||!(y||z.forEach&&!h((function(){(new _).entries().next()})))))S=r.getConstructor(e,t,g,w),c.enable();else if(a(t,!0)){var k=new S,A=k[w](y?{}:-0,1)!=k,O=h((function(){k.has(1)})),T=v((function(t){new _(t)})),P=!y&&h((function(){for(var t=new _,e=5;e--;)t[w](e,e);return!t.has(-0)}));T||((S=e((function(t,e){l(t,z);var r=b(new _,t,S);return d(e)||u(e,r[w],{that:r,AS_ENTRIES:g}),r}))).prototype=z,z.constructor=S),(O||P)&&(E("delete"),E("has"),g&&E("get")),(P||A)&&E(w),y&&z.clear&&delete z.clear}return x[t]=S,n({global:!0,constructor:!0,forced:S!=_},x),m(S,t),y||r.setStrong(S,t,g),S}},9920:(t,e,r)=>{var n=r(2597),o=r(3887),i=r(1236),a=r(3070);t.exports=function(t,e,r){for(var s=o(e),c=a.f,u=i.f,l=0;l<s.length;l++){var f=s[l];n(t,f)||r&&n(r,f)||c(t,f,u(e,f))}}},4964:(t,e,r)=>{var n=r(5112)("match");t.exports=function(t){var e=/./;try{"/./"[t](e)}catch(r){try{return e[n]=!1,"/./"[t](e)}catch(t){}}return!1}},8544:(t,e,r)=>{var n=r(7293);t.exports=!n((function(){function t(){}return t.prototype.constructor=null,Object.getPrototypeOf(new t)!==t.prototype}))},4230:(t,e,r)=>{var n=r(1702),o=r(4488),i=r(1340),a=/"/g,s=n("".replace);t.exports=function(t,e,r,n){var c=i(o(t)),u="<"+e;return""!==r&&(u+=" "+r+'="'+s(i(n),a,"&quot;")+'"'),u+">"+c+"</"+e+">"}},6178:t=>{t.exports=function(t,e){return{value:t,done:e}}},8880:(t,e,r)=>{var n=r(9781),o=r(3070),i=r(9114);t.exports=n?function(t,e,r){return o.f(t,e,i(1,r))}:function(t,e,r){return t[e]=r,t}},9114:t=>{t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},6135:(t,e,r)=>{"use strict";var n=r(4948),o=r(3070),i=r(9114);t.exports=function(t,e,r){var a=n(e);a in t?o.f(t,a,i(0,r)):t[a]=r}},7045:(t,e,r)=>{var n=r(6339),o=r(3070);t.exports=function(t,e,r){return r.get&&n(r.get,e,{getter:!0}),r.set&&n(r.set,e,{setter:!0}),o.f(t,e,r)}},8052:(t,e,r)=>{var n=r(614),o=r(3070),i=r(6339),a=r(3072);t.exports=function(t,e,r,s){s||(s={});var c=s.enumerable,u=void 0!==s.name?s.name:e;if(n(r)&&i(r,u,s),s.global)c?t[e]=r:a(e,r);else{try{s.unsafe?t[e]&&(c=!0):delete t[e]}catch(t){}c?t[e]=r:o.f(t,e,{value:r,enumerable:!1,configurable:!s.nonConfigurable,writable:!s.nonWritable})}return t}},9190:(t,e,r)=>{var n=r(8052);t.exports=function(t,e,r){for(var o in e)n(t,o,e[o],r);return t}},3072:(t,e,r)=>{var n=r(7854),o=Object.defineProperty;t.exports=function(t,e){try{o(n,t,{value:e,configurable:!0,writable:!0})}catch(r){n[t]=e}return e}},5117:(t,e,r)=>{"use strict";var n=r(6330),o=TypeError;t.exports=function(t,e){if(!delete t[e])throw o("Cannot delete property "+n(e)+" of "+n(t))}},9781:(t,e,r)=>{var n=r(7293);t.exports=!n((function(){return 7!=Object.defineProperty({},1,{get:function(){return 7}})[1]}))},4154:t=>{var e="object"==typeof document&&document.all,r=void 0===e&&void 0!==e;t.exports={all:e,IS_HTMLDDA:r}},317:(t,e,r)=>{var n=r(7854),o=r(111),i=n.document,a=o(i)&&o(i.createElement);t.exports=function(t){return a?i.createElement(t):{}}},7207:t=>{var e=TypeError;t.exports=function(t){if(t>9007199254740991)throw e("Maximum allowed index exceeded");return t}},8324:t=>{t.exports={CSSRuleList:0,CSSStyleDeclaration:0,CSSValueList:0,ClientRectList:0,DOMRectList:0,DOMStringList:0,DOMTokenList:1,DataTransferItemList:0,FileList:0,HTMLAllCollection:0,HTMLCollection:0,HTMLFormElement:0,HTMLSelectElement:0,MediaList:0,MimeTypeArray:0,NamedNodeMap:0,NodeList:1,PaintRequestList:0,Plugin:0,PluginArray:0,SVGLengthList:0,SVGNumberList:0,SVGPathSegList:0,SVGPointList:0,SVGStringList:0,SVGTransformList:0,SourceBufferList:0,StyleSheetList:0,TextTrackCueList:0,TextTrackList:0,TouchList:0}},8509:(t,e,r)=>{var n=r(317)("span").classList,o=n&&n.constructor&&n.constructor.prototype;t.exports=o===Object.prototype?void 0:o},7871:(t,e,r)=>{var n=r(6258),o=r(5268);t.exports=!n&&!o&&"object"==typeof window&&"object"==typeof document},6258:t=>{t.exports="object"==typeof Deno&&Deno&&"object"==typeof Deno.version},1528:(t,e,r)=>{var n=r(8113),o=r(7854);t.exports=/ipad|iphone|ipod/i.test(n)&&void 0!==o.Pebble},8334:(t,e,r)=>{var n=r(8113);t.exports=/(?:ipad|iphone|ipod).*applewebkit/i.test(n)},5268:(t,e,r)=>{var n=r(4326),o=r(7854);t.exports="process"==n(o.process)},1036:(t,e,r)=>{var n=r(8113);t.exports=/web0s(?!.*chrome)/i.test(n)},8113:(t,e,r)=>{var n=r(5005);t.exports=n("navigator","userAgent")||""},7392:(t,e,r)=>{var n,o,i=r(7854),a=r(8113),s=i.process,c=i.Deno,u=s&&s.versions||c&&c.version,l=u&&u.v8;l&&(o=(n=l.split("."))[0]>0&&n[0]<4?1:+(n[0]+n[1])),!o&&a&&(!(n=a.match(/Edge\/(\d+)/))||n[1]>=74)&&(n=a.match(/Chrome\/(\d+)/))&&(o=+n[1]),t.exports=o},748:t=>{t.exports=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"]},1060:(t,e,r)=>{var n=r(1702),o=Error,i=n("".replace),a=String(o("zxcasd").stack),s=/\n\s*at [^:]*:[^\n]*/,c=s.test(a);t.exports=function(t,e){if(c&&"string"==typeof t&&!o.prepareStackTrace)for(;e--;)t=i(t,s,"");return t}},2914:(t,e,r)=>{var n=r(7293),o=r(9114);t.exports=!n((function(){var t=Error("a");return!("stack"in t)||(Object.defineProperty(t,"stack",o(1,7)),7!==t.stack)}))},2109:(t,e,r)=>{var n=r(7854),o=r(1236).f,i=r(8880),a=r(8052),s=r(3072),c=r(9920),u=r(4705);t.exports=function(t,e){var r,l,f,d,p,h=t.target,v=t.global,m=t.stat;if(r=v?n:m?n[h]||s(h,{}):(n[h]||{}).prototype)for(l in e){if(d=e[l],f=t.dontCallGetSet?(p=o(r,l))&&p.value:r[l],!u(v?l:h+(m?".":"#")+l,t.forced)&&void 0!==f){if(typeof d==typeof f)continue;c(d,f)}(t.sham||f&&f.sham)&&i(d,"sham",!0),a(r,l,d,t)}}},7293:t=>{t.exports=function(t){try{return!!t()}catch(t){return!0}}},7007:(t,e,r)=>{"use strict";r(4916);var n=r(1702),o=r(8052),i=r(2261),a=r(7293),s=r(5112),c=r(8880),u=s("species"),l=RegExp.prototype;t.exports=function(t,e,r,f){var d=s(t),p=!a((function(){var e={};return e[d]=function(){return 7},7!=""[t](e)})),h=p&&!a((function(){var e=!1,r=/a/;return"split"===t&&((r={}).constructor={},r.constructor[u]=function(){return r},r.flags="",r[d]=/./[d]),r.exec=function(){return e=!0,null},r[d](""),!e}));if(!p||!h||r){var v=n(/./[d]),m=e(d,""[t],(function(t,e,r,o,a){var s=n(t),c=e.exec;return c===i||c===l.exec?p&&!a?{done:!0,value:v(e,r,o)}:{done:!0,value:s(r,e,o)}:{done:!1}}));o(String.prototype,t,m[0]),o(l,d,m[1])}f&&c(l[d],"sham",!0)}},6677:(t,e,r)=>{var n=r(7293);t.exports=!n((function(){return Object.isExtensible(Object.preventExtensions({}))}))},2104:(t,e,r)=>{var n=r(4374),o=Function.prototype,i=o.apply,a=o.call;t.exports="object"==typeof Reflect&&Reflect.apply||(n?a.bind(i):function(){return a.apply(i,arguments)})},9974:(t,e,r)=>{var n=r(1702),o=r(9662),i=r(4374),a=n(n.bind);t.exports=function(t,e){return o(t),void 0===e?t:i?a(t,e):function(){return t.apply(e,arguments)}}},4374:(t,e,r)=>{var n=r(7293);t.exports=!n((function(){var t=function(){}.bind();return"function"!=typeof t||t.hasOwnProperty("prototype")}))},6916:(t,e,r)=>{var n=r(4374),o=Function.prototype.call;t.exports=n?o.bind(o):function(){return o.apply(o,arguments)}},6530:(t,e,r)=>{var n=r(9781),o=r(2597),i=Function.prototype,a=n&&Object.getOwnPropertyDescriptor,s=o(i,"name"),c=s&&"something"===function(){}.name,u=s&&(!n||n&&a(i,"name").configurable);t.exports={EXISTS:s,PROPER:c,CONFIGURABLE:u}},84:(t,e,r)=>{var n=r(4374),o=Function.prototype,i=o.call,a=n&&o.bind.bind(i,i);t.exports=n?a:function(t){return function(){return i.apply(t,arguments)}}},1702:(t,e,r)=>{var n=r(4326),o=r(84);t.exports=function(t){if("Function"===n(t))return o(t)}},5005:(t,e,r)=>{var n=r(7854),o=r(614),i=function(t){return o(t)?t:void 0};t.exports=function(t,e){return arguments.length<2?i(n[t]):n[t]&&n[t][e]}},1246:(t,e,r)=>{var n=r(648),o=r(8173),i=r(8554),a=r(7497),s=r(5112)("iterator");t.exports=function(t){if(!i(t))return o(t,s)||o(t,"@@iterator")||a[n(t)]}},4121:(t,e,r)=>{var n=r(6916),o=r(9662),i=r(9670),a=r(6330),s=r(1246),c=TypeError;t.exports=function(t,e){var r=arguments.length<2?s(t):e;if(o(r))return i(n(r,t));throw c(a(t)+" is not iterable")}},8173:(t,e,r)=>{var n=r(9662),o=r(8554);t.exports=function(t,e){var r=t[e];return o(r)?void 0:n(r)}},647:(t,e,r)=>{var n=r(1702),o=r(7908),i=Math.floor,a=n("".charAt),s=n("".replace),c=n("".slice),u=/\$([$&'`]|\d{1,2}|<[^>]*>)/g,l=/\$([$&'`]|\d{1,2})/g;t.exports=function(t,e,r,n,f,d){var p=r+t.length,h=n.length,v=l;return void 0!==f&&(f=o(f),v=u),s(d,v,(function(o,s){var u;switch(a(s,0)){case"$":return"$";case"&":return t;case"`":return c(e,0,r);case"'":return c(e,p);case"<":u=f[c(s,1,-1)];break;default:var l=+s;if(0===l)return o;if(l>h){var d=i(l/10);return 0===d?o:d<=h?void 0===n[d-1]?a(s,1):n[d-1]+a(s,1):o}u=n[l-1]}return void 0===u?"":u}))}},7854:(t,e,r)=>{var n=function(t){return t&&t.Math==Math&&t};t.exports=n("object"==typeof globalThis&&globalThis)||n("object"==typeof window&&window)||n("object"==typeof self&&self)||n("object"==typeof r.g&&r.g)||function(){return this}()||Function("return this")()},2597:(t,e,r)=>{var n=r(1702),o=r(7908),i=n({}.hasOwnProperty);t.exports=Object.hasOwn||function(t,e){return i(o(t),e)}},3501:t=>{t.exports={}},842:(t,e,r)=>{var n=r(7854);t.exports=function(t,e){var r=n.console;r&&r.error&&(1==arguments.length?r.error(t):r.error(t,e))}},490:(t,e,r)=>{var n=r(5005);t.exports=n("document","documentElement")},4664:(t,e,r)=>{var n=r(9781),o=r(7293),i=r(317);t.exports=!n&&!o((function(){return 7!=Object.defineProperty(i("div"),"a",{get:function(){return 7}}).a}))},8361:(t,e,r)=>{var n=r(1702),o=r(7293),i=r(4326),a=Object,s=n("".split);t.exports=o((function(){return!a("z").propertyIsEnumerable(0)}))?function(t){return"String"==i(t)?s(t,""):a(t)}:a},9587:(t,e,r)=>{var n=r(614),o=r(111),i=r(7674);t.exports=function(t,e,r){var a,s;return i&&n(a=e.constructor)&&a!==r&&o(s=a.prototype)&&s!==r.prototype&&i(t,s),t}},2788:(t,e,r)=>{var n=r(1702),o=r(614),i=r(5465),a=n(Function.toString);o(i.inspectSource)||(i.inspectSource=function(t){return a(t)}),t.exports=i.inspectSource},8340:(t,e,r)=>{var n=r(111),o=r(8880);t.exports=function(t,e){n(e)&&"cause"in e&&o(t,"cause",e.cause)}},2423:(t,e,r)=>{var n=r(2109),o=r(1702),i=r(3501),a=r(111),s=r(2597),c=r(3070).f,u=r(8006),l=r(1156),f=r(2050),d=r(9711),p=r(6677),h=!1,v=d("meta"),m=0,b=function(t){c(t,v,{value:{objectID:"O"+m++,weakData:{}}})},g=t.exports={enable:function(){g.enable=function(){},h=!0;var t=u.f,e=o([].splice),r={};r[v]=1,t(r).length&&(u.f=function(r){for(var n=t(r),o=0,i=n.length;o<i;o++)if(n[o]===v){e(n,o,1);break}return n},n({target:"Object",stat:!0,forced:!0},{getOwnPropertyNames:l.f}))},fastKey:function(t,e){if(!a(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!s(t,v)){if(!f(t))return"F";if(!e)return"E";b(t)}return t[v].objectID},getWeakData:function(t,e){if(!s(t,v)){if(!f(t))return!0;if(!e)return!1;b(t)}return t[v].weakData},onFreeze:function(t){return p&&h&&f(t)&&!s(t,v)&&b(t),t}};i[v]=!0},9909:(t,e,r)=>{var n,o,i,a=r(4811),s=r(7854),c=r(111),u=r(8880),l=r(2597),f=r(5465),d=r(6200),p=r(3501),h="Object already initialized",v=s.TypeError,m=s.WeakMap;if(a||f.state){var b=f.state||(f.state=new m);b.get=b.get,b.has=b.has,b.set=b.set,n=function(t,e){if(b.has(t))throw v(h);return e.facade=t,b.set(t,e),e},o=function(t){return b.get(t)||{}},i=function(t){return b.has(t)}}else{var g=d("state");p[g]=!0,n=function(t,e){if(l(t,g))throw v(h);return e.facade=t,u(t,g,e),e},o=function(t){return l(t,g)?t[g]:{}},i=function(t){return l(t,g)}}t.exports={set:n,get:o,has:i,enforce:function(t){return i(t)?o(t):n(t,{})},getterFor:function(t){return function(e){var r;if(!c(e)||(r=o(e)).type!==t)throw v("Incompatible receiver, "+t+" required");return r}}}},7659:(t,e,r)=>{var n=r(5112),o=r(7497),i=n("iterator"),a=Array.prototype;t.exports=function(t){return void 0!==t&&(o.Array===t||a[i]===t)}},3157:(t,e,r)=>{var n=r(4326);t.exports=Array.isArray||function(t){return"Array"==n(t)}},614:(t,e,r)=>{var n=r(4154),o=n.all;t.exports=n.IS_HTMLDDA?function(t){return"function"==typeof t||t===o}:function(t){return"function"==typeof t}},4411:(t,e,r)=>{var n=r(1702),o=r(7293),i=r(614),a=r(648),s=r(5005),c=r(2788),u=function(){},l=[],f=s("Reflect","construct"),d=/^\s*(?:class|function)\b/,p=n(d.exec),h=!d.exec(u),v=function(t){if(!i(t))return!1;try{return f(u,l,t),!0}catch(t){return!1}},m=function(t){if(!i(t))return!1;switch(a(t)){case"AsyncFunction":case"GeneratorFunction":case"AsyncGeneratorFunction":return!1}try{return h||!!p(d,c(t))}catch(t){return!0}};m.sham=!0,t.exports=!f||o((function(){var t;return v(v.call)||!v(Object)||!v((function(){t=!0}))||t}))?m:v},4705:(t,e,r)=>{var n=r(7293),o=r(614),i=/#|\.prototype\./,a=function(t,e){var r=c[s(t)];return r==l||r!=u&&(o(e)?n(e):!!e)},s=a.normalize=function(t){return String(t).replace(i,".").toLowerCase()},c=a.data={},u=a.NATIVE="N",l=a.POLYFILL="P";t.exports=a},8554:t=>{t.exports=function(t){return null==t}},111:(t,e,r)=>{var n=r(614),o=r(4154),i=o.all;t.exports=o.IS_HTMLDDA?function(t){return"object"==typeof t?null!==t:n(t)||t===i}:function(t){return"object"==typeof t?null!==t:n(t)}},1913:t=>{t.exports=!1},7850:(t,e,r)=>{var n=r(111),o=r(4326),i=r(5112)("match");t.exports=function(t){var e;return n(t)&&(void 0!==(e=t[i])?!!e:"RegExp"==o(t))}},2190:(t,e,r)=>{var n=r(5005),o=r(614),i=r(7976),a=r(3307),s=Object;t.exports=a?function(t){return"symbol"==typeof t}:function(t){var e=n("Symbol");return o(e)&&i(e.prototype,s(t))}},408:(t,e,r)=>{var n=r(9974),o=r(6916),i=r(9670),a=r(6330),s=r(7659),c=r(6244),u=r(7976),l=r(4121),f=r(1246),d=r(9212),p=TypeError,h=function(t,e){this.stopped=t,this.result=e},v=h.prototype;t.exports=function(t,e,r){var m,b,g,y,w,_,z,S=r&&r.that,x=!(!r||!r.AS_ENTRIES),E=!(!r||!r.IS_RECORD),k=!(!r||!r.IS_ITERATOR),A=!(!r||!r.INTERRUPTED),O=n(e,S),T=function(t){return m&&d(m,"normal",t),new h(!0,t)},P=function(t){return x?(i(t),A?O(t[0],t[1],T):O(t[0],t[1])):A?O(t,T):O(t)};if(E)m=t.iterator;else if(k)m=t;else{if(!(b=f(t)))throw p(a(t)+" is not iterable");if(s(b)){for(g=0,y=c(t);y>g;g++)if((w=P(t[g]))&&u(v,w))return w;return new h(!1)}m=l(t,b)}for(_=E?t.next:m.next;!(z=o(_,m)).done;){try{w=P(z.value)}catch(t){d(m,"throw",t)}if("object"==typeof w&&w&&u(v,w))return w}return new h(!1)}},9212:(t,e,r)=>{var n=r(6916),o=r(9670),i=r(8173);t.exports=function(t,e,r){var a,s;o(t);try{if(!(a=i(t,"return"))){if("throw"===e)throw r;return r}a=n(a,t)}catch(t){s=!0,a=t}if("throw"===e)throw r;if(s)throw a;return o(a),r}},3061:(t,e,r)=>{"use strict";var n=r(3383).IteratorPrototype,o=r(30),i=r(9114),a=r(8003),s=r(7497),c=function(){return this};t.exports=function(t,e,r,u){var l=e+" Iterator";return t.prototype=o(n,{next:i(+!u,r)}),a(t,l,!1,!0),s[l]=c,t}},1656:(t,e,r)=>{"use strict";var n=r(2109),o=r(6916),i=r(1913),a=r(6530),s=r(614),c=r(3061),u=r(9518),l=r(7674),f=r(8003),d=r(8880),p=r(8052),h=r(5112),v=r(7497),m=r(3383),b=a.PROPER,g=a.CONFIGURABLE,y=m.IteratorPrototype,w=m.BUGGY_SAFARI_ITERATORS,_=h("iterator"),z="keys",S="values",x="entries",E=function(){return this};t.exports=function(t,e,r,a,h,m,k){c(r,e,a);var A,O,T,P=function(t){if(t===h&&N)return N;if(!w&&t in L)return L[t];switch(t){case z:case S:case x:return function(){return new r(this,t)}}return function(){return new r(this)}},j=e+" Iterator",C=!1,L=t.prototype,I=L[_]||L["@@iterator"]||h&&L[h],N=!w&&I||P(h),q="Array"==e&&L.entries||I;if(q&&(A=u(q.call(new t)))!==Object.prototype&&A.next&&(i||u(A)===y||(l?l(A,y):s(A[_])||p(A,_,E)),f(A,j,!0,!0),i&&(v[j]=E)),b&&h==S&&I&&I.name!==S&&(!i&&g?d(L,"name",S):(C=!0,N=function(){return o(I,this)})),h)if(O={values:P(S),keys:m?N:P(z),entries:P(x)},k)for(T in O)(w||C||!(T in L))&&p(L,T,O[T]);else n({target:e,proto:!0,forced:w||C},O);return i&&!k||L[_]===N||p(L,_,N,{name:h}),v[e]=N,O}},3383:(t,e,r)=>{"use strict";var n,o,i,a=r(7293),s=r(614),c=r(111),u=r(30),l=r(9518),f=r(8052),d=r(5112),p=r(1913),h=d("iterator"),v=!1;[].keys&&("next"in(i=[].keys())?(o=l(l(i)))!==Object.prototype&&(n=o):v=!0),!c(n)||a((function(){var t={};return n[h].call(t)!==t}))?n={}:p&&(n=u(n)),s(n[h])||f(n,h,(function(){return this})),t.exports={IteratorPrototype:n,BUGGY_SAFARI_ITERATORS:v}},7497:t=>{t.exports={}},6244:(t,e,r)=>{var n=r(7466);t.exports=function(t){return n(t.length)}},6339:(t,e,r)=>{var n=r(7293),o=r(614),i=r(2597),a=r(9781),s=r(6530).CONFIGURABLE,c=r(2788),u=r(9909),l=u.enforce,f=u.get,d=Object.defineProperty,p=a&&!n((function(){return 8!==d((function(){}),"length",{value:8}).length})),h=String(String).split("String"),v=t.exports=function(t,e,r){"Symbol("===String(e).slice(0,7)&&(e="["+String(e).replace(/^Symbol\(([^)]*)\)/,"$1")+"]"),r&&r.getter&&(e="get "+e),r&&r.setter&&(e="set "+e),(!i(t,"name")||s&&t.name!==e)&&(a?d(t,"name",{value:e,configurable:!0}):t.name=e),p&&r&&i(r,"arity")&&t.length!==r.arity&&d(t,"length",{value:r.arity});try{r&&i(r,"constructor")&&r.constructor?a&&d(t,"prototype",{writable:!1}):t.prototype&&(t.prototype=void 0)}catch(t){}var n=l(t);return i(n,"source")||(n.source=h.join("string"==typeof e?e:"")),t};Function.prototype.toString=v((function(){return o(this)&&f(this).source||c(this)}),"toString")},4758:t=>{var e=Math.ceil,r=Math.floor;t.exports=Math.trunc||function(t){var n=+t;return(n>0?r:e)(n)}},5948:(t,e,r)=>{var n,o,i,a,s,c,u,l,f=r(7854),d=r(9974),p=r(1236).f,h=r(261).set,v=r(8334),m=r(1528),b=r(1036),g=r(5268),y=f.MutationObserver||f.WebKitMutationObserver,w=f.document,_=f.process,z=f.Promise,S=p(f,"queueMicrotask"),x=S&&S.value;x||(n=function(){var t,e;for(g&&(t=_.domain)&&t.exit();o;){e=o.fn,o=o.next;try{e()}catch(t){throw o?a():i=void 0,t}}i=void 0,t&&t.enter()},v||g||b||!y||!w?!m&&z&&z.resolve?((u=z.resolve(void 0)).constructor=z,l=d(u.then,u),a=function(){l(n)}):g?a=function(){_.nextTick(n)}:(h=d(h,f),a=function(){h(n)}):(s=!0,c=w.createTextNode(""),new y(n).observe(c,{characterData:!0}),a=function(){c.data=s=!s})),t.exports=x||function(t){var e={fn:t,next:void 0};i&&(i.next=e),o||(o=e,a()),i=e}},8523:(t,e,r)=>{"use strict";var n=r(9662),o=TypeError,i=function(t){var e,r;this.promise=new t((function(t,n){if(void 0!==e||void 0!==r)throw o("Bad Promise constructor");e=t,r=n})),this.resolve=n(e),this.reject=n(r)};t.exports.f=function(t){return new i(t)}},6277:(t,e,r)=>{var n=r(1340);t.exports=function(t,e){return void 0===t?arguments.length<2?"":e:n(t)}},3929:(t,e,r)=>{var n=r(7850),o=TypeError;t.exports=function(t){if(n(t))throw o("The method doesn't accept regular expressions");return t}},1574:(t,e,r)=>{"use strict";var n=r(9781),o=r(1702),i=r(6916),a=r(7293),s=r(1956),c=r(5181),u=r(5296),l=r(7908),f=r(8361),d=Object.assign,p=Object.defineProperty,h=o([].concat);t.exports=!d||a((function(){if(n&&1!==d({b:1},d(p({},"a",{enumerable:!0,get:function(){p(this,"b",{value:3,enumerable:!1})}}),{b:2})).b)return!0;var t={},e={},r=Symbol(),o="abcdefghijklmnopqrst";return t[r]=7,o.split("").forEach((function(t){e[t]=t})),7!=d({},t)[r]||s(d({},e)).join("")!=o}))?function(t,e){for(var r=l(t),o=arguments.length,a=1,d=c.f,p=u.f;o>a;)for(var v,m=f(arguments[a++]),b=d?h(s(m),d(m)):s(m),g=b.length,y=0;g>y;)v=b[y++],n&&!i(p,m,v)||(r[v]=m[v]);return r}:d},30:(t,e,r)=>{var n,o=r(9670),i=r(6048),a=r(748),s=r(3501),c=r(490),u=r(317),l=r(6200)("IE_PROTO"),f=function(){},d=function(t){return"<script>"+t+"<\/script>"},p=function(t){t.write(d("")),t.close();var e=t.parentWindow.Object;return t=null,e},h=function(){try{n=new ActiveXObject("htmlfile")}catch(t){}var t,e;h="undefined"!=typeof document?document.domain&&n?p(n):((e=u("iframe")).style.display="none",c.appendChild(e),e.src=String("javascript:"),(t=e.contentWindow.document).open(),t.write(d("document.F=Object")),t.close(),t.F):p(n);for(var r=a.length;r--;)delete h.prototype[a[r]];return h()};s[l]=!0,t.exports=Object.create||function(t,e){var r;return null!==t?(f.prototype=o(t),r=new f,f.prototype=null,r[l]=t):r=h(),void 0===e?r:i.f(r,e)}},6048:(t,e,r)=>{var n=r(9781),o=r(3353),i=r(3070),a=r(9670),s=r(5656),c=r(1956);e.f=n&&!o?Object.defineProperties:function(t,e){a(t);for(var r,n=s(e),o=c(e),u=o.length,l=0;u>l;)i.f(t,r=o[l++],n[r]);return t}},3070:(t,e,r)=>{var n=r(9781),o=r(4664),i=r(3353),a=r(9670),s=r(4948),c=TypeError,u=Object.defineProperty,l=Object.getOwnPropertyDescriptor;e.f=n?i?function(t,e,r){if(a(t),e=s(e),a(r),"function"==typeof t&&"prototype"===e&&"value"in r&&"writable"in r&&!r.writable){var n=l(t,e);n&&n.writable&&(t[e]=r.value,r={configurable:"configurable"in r?r.configurable:n.configurable,enumerable:"enumerable"in r?r.enumerable:n.enumerable,writable:!1})}return u(t,e,r)}:u:function(t,e,r){if(a(t),e=s(e),a(r),o)try{return u(t,e,r)}catch(t){}if("get"in r||"set"in r)throw c("Accessors not supported");return"value"in r&&(t[e]=r.value),t}},1236:(t,e,r)=>{var n=r(9781),o=r(6916),i=r(5296),a=r(9114),s=r(5656),c=r(4948),u=r(2597),l=r(4664),f=Object.getOwnPropertyDescriptor;e.f=n?f:function(t,e){if(t=s(t),e=c(e),l)try{return f(t,e)}catch(t){}if(u(t,e))return a(!o(i.f,t,e),t[e])}},1156:(t,e,r)=>{var n=r(4326),o=r(5656),i=r(8006).f,a=r(1589),s="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return s&&"Window"==n(t)?function(t){try{return i(t)}catch(t){return a(s)}}(t):i(o(t))}},8006:(t,e,r)=>{var n=r(6324),o=r(748).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return n(t,o)}},5181:(t,e)=>{e.f=Object.getOwnPropertySymbols},9518:(t,e,r)=>{var n=r(2597),o=r(614),i=r(7908),a=r(6200),s=r(8544),c=a("IE_PROTO"),u=Object,l=u.prototype;t.exports=s?u.getPrototypeOf:function(t){var e=i(t);if(n(e,c))return e[c];var r=e.constructor;return o(r)&&e instanceof r?r.prototype:e instanceof u?l:null}},2050:(t,e,r)=>{var n=r(7293),o=r(111),i=r(4326),a=r(7556),s=Object.isExtensible,c=n((function(){s(1)}));t.exports=c||a?function(t){return!!o(t)&&(!a||"ArrayBuffer"!=i(t))&&(!s||s(t))}:s},7976:(t,e,r)=>{var n=r(1702);t.exports=n({}.isPrototypeOf)},6324:(t,e,r)=>{var n=r(1702),o=r(2597),i=r(5656),a=r(1318).indexOf,s=r(3501),c=n([].push);t.exports=function(t,e){var r,n=i(t),u=0,l=[];for(r in n)!o(s,r)&&o(n,r)&&c(l,r);for(;e.length>u;)o(n,r=e[u++])&&(~a(l,r)||c(l,r));return l}},1956:(t,e,r)=>{var n=r(6324),o=r(748);t.exports=Object.keys||function(t){return n(t,o)}},5296:(t,e)=>{"use strict";var r={}.propertyIsEnumerable,n=Object.getOwnPropertyDescriptor,o=n&&!r.call({1:2},1);e.f=o?function(t){var e=n(this,t);return!!e&&e.enumerable}:r},7674:(t,e,r)=>{var n=r(1702),o=r(9670),i=r(6077);t.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var t,e=!1,r={};try{(t=n(Object.getOwnPropertyDescriptor(Object.prototype,"__proto__").set))(r,[]),e=r instanceof Array}catch(t){}return function(r,n){return o(r),i(n),e?t(r,n):r.__proto__=n,r}}():void 0)},4699:(t,e,r)=>{var n=r(9781),o=r(1702),i=r(1956),a=r(5656),s=o(r(5296).f),c=o([].push),u=function(t){return function(e){for(var r,o=a(e),u=i(o),l=u.length,f=0,d=[];l>f;)r=u[f++],n&&!s(o,r)||c(d,t?[r,o[r]]:o[r]);return d}};t.exports={entries:u(!0),values:u(!1)}},288:(t,e,r)=>{"use strict";var n=r(1694),o=r(648);t.exports=n?{}.toString:function(){return"[object "+o(this)+"]"}},2140:(t,e,r)=>{var n=r(6916),o=r(614),i=r(111),a=TypeError;t.exports=function(t,e){var r,s;if("string"===e&&o(r=t.toString)&&!i(s=n(r,t)))return s;if(o(r=t.valueOf)&&!i(s=n(r,t)))return s;if("string"!==e&&o(r=t.toString)&&!i(s=n(r,t)))return s;throw a("Can't convert object to primitive value")}},3887:(t,e,r)=>{var n=r(5005),o=r(1702),i=r(8006),a=r(5181),s=r(9670),c=o([].concat);t.exports=n("Reflect","ownKeys")||function(t){var e=i.f(s(t)),r=a.f;return r?c(e,r(t)):e}},857:(t,e,r)=>{var n=r(7854);t.exports=n},2534:t=>{t.exports=function(t){try{return{error:!1,value:t()}}catch(t){return{error:!0,value:t}}}},3702:(t,e,r)=>{var n=r(7854),o=r(2492),i=r(614),a=r(4705),s=r(2788),c=r(5112),u=r(7871),l=r(6258),f=r(1913),d=r(7392),p=o&&o.prototype,h=c("species"),v=!1,m=i(n.PromiseRejectionEvent),b=a("Promise",(function(){var t=s(o),e=t!==String(o);if(!e&&66===d)return!0;if(f&&(!p.catch||!p.finally))return!0;if(!d||d<51||!/native code/.test(t)){var r=new o((function(t){t(1)})),n=function(t){t((function(){}),(function(){}))};if((r.constructor={})[h]=n,!(v=r.then((function(){}))instanceof n))return!0}return!e&&(u||l)&&!m}));t.exports={CONSTRUCTOR:b,REJECTION_EVENT:m,SUBCLASSING:v}},2492:(t,e,r)=>{var n=r(7854);t.exports=n.Promise},9478:(t,e,r)=>{var n=r(9670),o=r(111),i=r(8523);t.exports=function(t,e){if(n(t),o(e)&&e.constructor===t)return e;var r=i.f(t);return(0,r.resolve)(e),r.promise}},612:(t,e,r)=>{var n=r(2492),o=r(7072),i=r(3702).CONSTRUCTOR;t.exports=i||!o((function(t){n.all(t).then(void 0,(function(){}))}))},2626:(t,e,r)=>{var n=r(3070).f;t.exports=function(t,e,r){r in t||n(t,r,{configurable:!0,get:function(){return e[r]},set:function(t){e[r]=t}})}},8572:t=>{var e=function(){this.head=null,this.tail=null};e.prototype={add:function(t){var e={item:t,next:null};this.head?this.tail.next=e:this.head=e,this.tail=e},get:function(){var t=this.head;if(t)return this.head=t.next,this.tail===t&&(this.tail=null),t.item}},t.exports=e},7651:(t,e,r)=>{var n=r(6916),o=r(9670),i=r(614),a=r(4326),s=r(2261),c=TypeError;t.exports=function(t,e){var r=t.exec;if(i(r)){var u=n(r,t,e);return null!==u&&o(u),u}if("RegExp"===a(t))return n(s,t,e);throw c("RegExp#exec called on incompatible receiver")}},2261:(t,e,r)=>{"use strict";var n,o,i=r(6916),a=r(1702),s=r(1340),c=r(7066),u=r(2999),l=r(2309),f=r(30),d=r(9909).get,p=r(9441),h=r(7168),v=l("native-string-replace",String.prototype.replace),m=RegExp.prototype.exec,b=m,g=a("".charAt),y=a("".indexOf),w=a("".replace),_=a("".slice),z=(o=/b*/g,i(m,n=/a/,"a"),i(m,o,"a"),0!==n.lastIndex||0!==o.lastIndex),S=u.BROKEN_CARET,x=void 0!==/()??/.exec("")[1];(z||x||S||p||h)&&(b=function(t){var e,r,n,o,a,u,l,p=this,h=d(p),E=s(t),k=h.raw;if(k)return k.lastIndex=p.lastIndex,e=i(b,k,E),p.lastIndex=k.lastIndex,e;var A=h.groups,O=S&&p.sticky,T=i(c,p),P=p.source,j=0,C=E;if(O&&(T=w(T,"y",""),-1===y(T,"g")&&(T+="g"),C=_(E,p.lastIndex),p.lastIndex>0&&(!p.multiline||p.multiline&&"\n"!==g(E,p.lastIndex-1))&&(P="(?: "+P+")",C=" "+C,j++),r=new RegExp("^(?:"+P+")",T)),x&&(r=new RegExp("^"+P+"$(?!\\s)",T)),z&&(n=p.lastIndex),o=i(m,O?r:p,C),O?o?(o.input=_(o.input,j),o[0]=_(o[0],j),o.index=p.lastIndex,p.lastIndex+=o[0].length):p.lastIndex=0:z&&o&&(p.lastIndex=p.global?o.index+o[0].length:n),x&&o&&o.length>1&&i(v,o[0],r,(function(){for(a=1;a<arguments.length-2;a++)void 0===arguments[a]&&(o[a]=void 0)})),o&&A)for(o.groups=u=f(null),a=0;a<A.length;a++)u[(l=A[a])[0]]=o[l[1]];return o}),t.exports=b},7066:(t,e,r)=>{"use strict";var n=r(9670);t.exports=function(){var t=n(this),e="";return t.hasIndices&&(e+="d"),t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.dotAll&&(e+="s"),t.unicode&&(e+="u"),t.unicodeSets&&(e+="v"),t.sticky&&(e+="y"),e}},4706:(t,e,r)=>{var n=r(6916),o=r(2597),i=r(7976),a=r(7066),s=RegExp.prototype;t.exports=function(t){var e=t.flags;return void 0!==e||"flags"in s||o(t,"flags")||!i(s,t)?e:n(a,t)}},2999:(t,e,r)=>{var n=r(7293),o=r(7854).RegExp,i=n((function(){var t=o("a","y");return t.lastIndex=2,null!=t.exec("abcd")})),a=i||n((function(){return!o("a","y").sticky})),s=i||n((function(){var t=o("^r","gy");return t.lastIndex=2,null!=t.exec("str")}));t.exports={BROKEN_CARET:s,MISSED_STICKY:a,UNSUPPORTED_Y:i}},9441:(t,e,r)=>{var n=r(7293),o=r(7854).RegExp;t.exports=n((function(){var t=o(".","s");return!(t.dotAll&&t.exec("\n")&&"s"===t.flags)}))},7168:(t,e,r)=>{var n=r(7293),o=r(7854).RegExp;t.exports=n((function(){var t=o("(?<a>b)","g");return"b"!==t.exec("b").groups.a||"bc"!=="b".replace(t,"$<a>c")}))},4488:(t,e,r)=>{var n=r(8554),o=TypeError;t.exports=function(t){if(n(t))throw o("Can't call method on "+t);return t}},1150:t=>{t.exports=Object.is||function(t,e){return t===e?0!==t||1/t==1/e:t!=t&&e!=e}},6340:(t,e,r)=>{"use strict";var n=r(5005),o=r(3070),i=r(5112),a=r(9781),s=i("species");t.exports=function(t){var e=n(t),r=o.f;a&&e&&!e[s]&&r(e,s,{configurable:!0,get:function(){return this}})}},8003:(t,e,r)=>{var n=r(3070).f,o=r(2597),i=r(5112)("toStringTag");t.exports=function(t,e,r){t&&!r&&(t=t.prototype),t&&!o(t,i)&&n(t,i,{configurable:!0,value:e})}},6200:(t,e,r)=>{var n=r(2309),o=r(9711),i=n("keys");t.exports=function(t){return i[t]||(i[t]=o(t))}},5465:(t,e,r)=>{var n=r(7854),o=r(3072),i="__core-js_shared__",a=n[i]||o(i,{});t.exports=a},2309:(t,e,r)=>{var n=r(1913),o=r(5465);(t.exports=function(t,e){return o[t]||(o[t]=void 0!==e?e:{})})("versions",[]).push({version:"3.26.0",mode:n?"pure":"global",copyright:"© 2014-2022 Denis Pushkarev (zloirock.ru)",license:"https://github.com/zloirock/core-js/blob/v3.26.0/LICENSE",source:"https://github.com/zloirock/core-js"})},6707:(t,e,r)=>{var n=r(9670),o=r(9483),i=r(8554),a=r(5112)("species");t.exports=function(t,e){var r,s=n(t).constructor;return void 0===s||i(r=n(s)[a])?e:o(r)}},3429:(t,e,r)=>{var n=r(7293);t.exports=function(t){return n((function(){var e=""[t]('"');return e!==e.toLowerCase()||e.split('"').length>3}))}},8710:(t,e,r)=>{var n=r(1702),o=r(9303),i=r(1340),a=r(4488),s=n("".charAt),c=n("".charCodeAt),u=n("".slice),l=function(t){return function(e,r){var n,l,f=i(a(e)),d=o(r),p=f.length;return d<0||d>=p?t?"":void 0:(n=c(f,d))<55296||n>56319||d+1===p||(l=c(f,d+1))<56320||l>57343?t?s(f,d):n:t?u(f,d,d+2):l-56320+(n-55296<<10)+65536}};t.exports={codeAt:l(!1),charAt:l(!0)}},3197:(t,e,r)=>{"use strict";var n=r(1702),o=2147483647,i=/[^\0-\u007E]/,a=/[.\u3002\uFF0E\uFF61]/g,s="Overflow: input needs wider integers to process",c=RangeError,u=n(a.exec),l=Math.floor,f=String.fromCharCode,d=n("".charCodeAt),p=n([].join),h=n([].push),v=n("".replace),m=n("".split),b=n("".toLowerCase),g=function(t){return t+22+75*(t<26)},y=function(t,e,r){var n=0;for(t=r?l(t/700):t>>1,t+=l(t/e);t>455;)t=l(t/35),n+=36;return l(n+36*t/(t+38))},w=function(t){var e=[];t=function(t){for(var e=[],r=0,n=t.length;r<n;){var o=d(t,r++);if(o>=55296&&o<=56319&&r<n){var i=d(t,r++);56320==(64512&i)?h(e,((1023&o)<<10)+(1023&i)+65536):(h(e,o),r--)}else h(e,o)}return e}(t);var r,n,i=t.length,a=128,u=0,v=72;for(r=0;r<t.length;r++)(n=t[r])<128&&h(e,f(n));var m=e.length,b=m;for(m&&h(e,"-");b<i;){var w=o;for(r=0;r<t.length;r++)(n=t[r])>=a&&n<w&&(w=n);var _=b+1;if(w-a>l((o-u)/_))throw c(s);for(u+=(w-a)*_,a=w,r=0;r<t.length;r++){if((n=t[r])<a&&++u>o)throw c(s);if(n==a){for(var z=u,S=36;;){var x=S<=v?1:S>=v+26?26:S-v;if(z<x)break;var E=z-x,k=36-x;h(e,f(g(x+E%k))),z=l(E/k),S+=36}h(e,f(g(z))),v=y(u,_,b==m),u=0,b++}}u++,a++}return p(e,"")};t.exports=function(t){var e,r,n=[],o=m(v(b(t),a,"."),".");for(e=0;e<o.length;e++)r=o[e],h(n,u(i,r)?"xn--"+w(r):r);return p(n,".")}},8415:(t,e,r)=>{"use strict";var n=r(9303),o=r(1340),i=r(4488),a=RangeError;t.exports=function(t){var e=o(i(this)),r="",s=n(t);if(s<0||s==1/0)throw a("Wrong number of repetitions");for(;s>0;(s>>>=1)&&(e+=e))1&s&&(r+=e);return r}},6091:(t,e,r)=>{var n=r(6530).PROPER,o=r(7293),i=r(1361);t.exports=function(t){return o((function(){return!!i[t]()||"​᠎"!=="​᠎"[t]()||n&&i[t].name!==t}))}},3111:(t,e,r)=>{var n=r(1702),o=r(4488),i=r(1340),a=r(1361),s=n("".replace),c="["+a+"]",u=RegExp("^"+c+c+"*"),l=RegExp(c+c+"*$"),f=function(t){return function(e){var r=i(o(e));return 1&t&&(r=s(r,u,"")),2&t&&(r=s(r,l,"")),r}};t.exports={start:f(1),end:f(2),trim:f(3)}},6293:(t,e,r)=>{var n=r(7392),o=r(7293);t.exports=!!Object.getOwnPropertySymbols&&!o((function(){var t=Symbol();return!String(t)||!(Object(t)instanceof Symbol)||!Symbol.sham&&n&&n<41}))},6532:(t,e,r)=>{var n=r(6916),o=r(5005),i=r(5112),a=r(8052);t.exports=function(){var t=o("Symbol"),e=t&&t.prototype,r=e&&e.valueOf,s=i("toPrimitive");e&&!e[s]&&a(e,s,(function(t){return n(r,this)}),{arity:1})}},2015:(t,e,r)=>{var n=r(6293);t.exports=n&&!!Symbol.for&&!!Symbol.keyFor},261:(t,e,r)=>{var n,o,i,a,s=r(7854),c=r(2104),u=r(9974),l=r(614),f=r(2597),d=r(7293),p=r(490),h=r(206),v=r(317),m=r(8053),b=r(8334),g=r(5268),y=s.setImmediate,w=s.clearImmediate,_=s.process,z=s.Dispatch,S=s.Function,x=s.MessageChannel,E=s.String,k=0,A={};try{n=s.location}catch(t){}var O=function(t){if(f(A,t)){var e=A[t];delete A[t],e()}},T=function(t){return function(){O(t)}},P=function(t){O(t.data)},j=function(t){s.postMessage(E(t),n.protocol+"//"+n.host)};y&&w||(y=function(t){m(arguments.length,1);var e=l(t)?t:S(t),r=h(arguments,1);return A[++k]=function(){c(e,void 0,r)},o(k),k},w=function(t){delete A[t]},g?o=function(t){_.nextTick(T(t))}:z&&z.now?o=function(t){z.now(T(t))}:x&&!b?(a=(i=new x).port2,i.port1.onmessage=P,o=u(a.postMessage,a)):s.addEventListener&&l(s.postMessage)&&!s.importScripts&&n&&"file:"!==n.protocol&&!d(j)?(o=j,s.addEventListener("message",P,!1)):o="onreadystatechange"in v("script")?function(t){p.appendChild(v("script")).onreadystatechange=function(){p.removeChild(this),O(t)}}:function(t){setTimeout(T(t),0)}),t.exports={set:y,clear:w}},863:(t,e,r)=>{var n=r(1702);t.exports=n(1..valueOf)},1400:(t,e,r)=>{var n=r(9303),o=Math.max,i=Math.min;t.exports=function(t,e){var r=n(t);return r<0?o(r+e,0):i(r,e)}},5656:(t,e,r)=>{var n=r(8361),o=r(4488);t.exports=function(t){return n(o(t))}},9303:(t,e,r)=>{var n=r(4758);t.exports=function(t){var e=+t;return e!=e||0===e?0:n(e)}},7466:(t,e,r)=>{var n=r(9303),o=Math.min;t.exports=function(t){return t>0?o(n(t),9007199254740991):0}},7908:(t,e,r)=>{var n=r(4488),o=Object;t.exports=function(t){return o(n(t))}},7593:(t,e,r)=>{var n=r(6916),o=r(111),i=r(2190),a=r(8173),s=r(2140),c=r(5112),u=TypeError,l=c("toPrimitive");t.exports=function(t,e){if(!o(t)||i(t))return t;var r,c=a(t,l);if(c){if(void 0===e&&(e="default"),r=n(c,t,e),!o(r)||i(r))return r;throw u("Can't convert object to primitive value")}return void 0===e&&(e="number"),s(t,e)}},4948:(t,e,r)=>{var n=r(7593),o=r(2190);t.exports=function(t){var e=n(t,"string");return o(e)?e:e+""}},1694:(t,e,r)=>{var n={};n[r(5112)("toStringTag")]="z",t.exports="[object z]"===String(n)},1340:(t,e,r)=>{var n=r(648),o=String;t.exports=function(t){if("Symbol"===n(t))throw TypeError("Cannot convert a Symbol value to a string");return o(t)}},6330:t=>{var e=String;t.exports=function(t){try{return e(t)}catch(t){return"Object"}}},9711:(t,e,r)=>{var n=r(1702),o=0,i=Math.random(),a=n(1..toString);t.exports=function(t){return"Symbol("+(void 0===t?"":t)+")_"+a(++o+i,36)}},5143:(t,e,r)=>{var n=r(7293),o=r(5112),i=r(1913),a=o("iterator");t.exports=!n((function(){var t=new URL("b?a=1&b=2&c=3","http://a"),e=t.searchParams,r="";return t.pathname="c%20d",e.forEach((function(t,n){e.delete("b"),r+=n+t})),i&&!t.toJSON||!e.sort||"http://a/c%20d?a=1&c=3"!==t.href||"3"!==e.get("c")||"a=1"!==String(new URLSearchParams("?a=1"))||!e[a]||"a"!==new URL("https://a@b").username||"b"!==new URLSearchParams(new URLSearchParams("a=b")).get("a")||"xn--e1aybc"!==new URL("http://тест").host||"#%D0%B1"!==new URL("http://a#б").hash||"a1c3"!==r||"x"!==new URL("http://x",void 0).host}))},3307:(t,e,r)=>{var n=r(6293);t.exports=n&&!Symbol.sham&&"symbol"==typeof Symbol.iterator},3353:(t,e,r)=>{var n=r(9781),o=r(7293);t.exports=n&&o((function(){return 42!=Object.defineProperty((function(){}),"prototype",{value:42,writable:!1}).prototype}))},8053:t=>{var e=TypeError;t.exports=function(t,r){if(t<r)throw e("Not enough arguments");return t}},4811:(t,e,r)=>{var n=r(7854),o=r(614),i=n.WeakMap;t.exports=o(i)&&/native code/.test(String(i))},6800:(t,e,r)=>{var n=r(857),o=r(2597),i=r(6061),a=r(3070).f;t.exports=function(t){var e=n.Symbol||(n.Symbol={});o(e,t)||a(e,t,{value:i.f(t)})}},6061:(t,e,r)=>{var n=r(5112);e.f=n},5112:(t,e,r)=>{var n=r(7854),o=r(2309),i=r(2597),a=r(9711),s=r(6293),c=r(3307),u=o("wks"),l=n.Symbol,f=l&&l.for,d=c?l:l&&l.withoutSetter||a;t.exports=function(t){if(!i(u,t)||!s&&"string"!=typeof u[t]){var e="Symbol."+t;s&&i(l,t)?u[t]=l[t]:u[t]=c&&f?f(e):d(e)}return u[t]}},1361:t=>{t.exports="\t\n\v\f\r                　\u2028\u2029\ufeff"},9191:(t,e,r)=>{"use strict";var n=r(5005),o=r(2597),i=r(8880),a=r(7976),s=r(7674),c=r(9920),u=r(2626),l=r(9587),f=r(6277),d=r(8340),p=r(1060),h=r(2914),v=r(9781),m=r(1913);t.exports=function(t,e,r,b){var g="stackTraceLimit",y=b?2:1,w=t.split("."),_=w[w.length-1],z=n.apply(null,w);if(z){var S=z.prototype;if(!m&&o(S,"cause")&&delete S.cause,!r)return z;var x=n("Error"),E=e((function(t,e){var r=f(b?e:t,void 0),n=b?new z(t):new z;return void 0!==r&&i(n,"message",r),h&&i(n,"stack",p(n.stack,2)),this&&a(S,this)&&l(n,this,E),arguments.length>y&&d(n,arguments[y]),n}));if(E.prototype=S,"Error"!==_?s?s(E,x):c(E,x,{name:!0}):v&&g in z&&(u(E,z,g),u(E,z,"prepareStackTrace")),c(E,z),!m)try{S.name!==_&&i(S,"name",_),S.constructor=E}catch(t){}return E}}},2222:(t,e,r)=>{"use strict";var n=r(2109),o=r(7293),i=r(3157),a=r(111),s=r(7908),c=r(6244),u=r(7207),l=r(6135),f=r(5417),d=r(1194),p=r(5112),h=r(7392),v=p("isConcatSpreadable"),m=h>=51||!o((function(){var t=[];return t[v]=!1,t.concat()[0]!==t})),b=d("concat"),g=function(t){if(!a(t))return!1;var e=t[v];return void 0!==e?!!e:i(t)};n({target:"Array",proto:!0,arity:1,forced:!m||!b},{concat:function(t){var e,r,n,o,i,a=s(this),d=f(a,0),p=0;for(e=-1,n=arguments.length;e<n;e++)if(g(i=-1===e?a:arguments[e]))for(o=c(i),u(p+o),r=0;r<o;r++,p++)r in i&&l(d,p,i[r]);else u(p+1),l(d,p++,i);return d.length=p,d}})},7327:(t,e,r)=>{"use strict";var n=r(2109),o=r(2092).filter;n({target:"Array",proto:!0,forced:!r(1194)("filter")},{filter:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}})},9826:(t,e,r)=>{"use strict";var n=r(2109),o=r(2092).find,i=r(1223),a="find",s=!0;a in[]&&Array(1).find((function(){s=!1})),n({target:"Array",proto:!0,forced:s},{find:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}}),i(a)},1038:(t,e,r)=>{var n=r(2109),o=r(8457);n({target:"Array",stat:!0,forced:!r(7072)((function(t){Array.from(t)}))},{from:o})},6699:(t,e,r)=>{"use strict";var n=r(2109),o=r(1318).includes,i=r(7293),a=r(1223);n({target:"Array",proto:!0,forced:i((function(){return!Array(1).includes()}))},{includes:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}}),a("includes")},6992:(t,e,r)=>{"use strict";var n=r(5656),o=r(1223),i=r(7497),a=r(9909),s=r(3070).f,c=r(1656),u=r(6178),l=r(1913),f=r(9781),d="Array Iterator",p=a.set,h=a.getterFor(d);t.exports=c(Array,"Array",(function(t,e){p(this,{type:d,target:n(t),index:0,kind:e})}),(function(){var t=h(this),e=t.target,r=t.kind,n=t.index++;return!e||n>=e.length?(t.target=void 0,u(void 0,!0)):u("keys"==r?n:"values"==r?e[n]:[n,e[n]],!1)}),"values");var v=i.Arguments=i.Array;if(o("keys"),o("values"),o("entries"),!l&&f&&"values"!==v.name)try{s(v,"name",{value:"values"})}catch(t){}},9600:(t,e,r)=>{"use strict";var n=r(2109),o=r(1702),i=r(8361),a=r(5656),s=r(9341),c=o([].join),u=i!=Object,l=s("join",",");n({target:"Array",proto:!0,forced:u||!l},{join:function(t){return c(a(this),void 0===t?",":t)}})},1249:(t,e,r)=>{"use strict";var n=r(2109),o=r(2092).map;n({target:"Array",proto:!0,forced:!r(1194)("map")},{map:function(t){return o(this,t,arguments.length>1?arguments[1]:void 0)}})},7658:(t,e,r)=>{"use strict";var n=r(2109),o=r(7908),i=r(6244),a=r(3658),s=r(7207),c=r(7293)((function(){return 4294967297!==[].push.call({length:4294967296},1)})),u=!function(){try{Object.defineProperty([],"length",{writable:!1}).push()}catch(t){return t instanceof TypeError}}();n({target:"Array",proto:!0,arity:1,forced:c||u},{push:function(t){var e=o(this),r=i(e),n=arguments.length;s(r+n);for(var c=0;c<n;c++)e[r]=arguments[c],r++;return a(e,r),r}})},7042:(t,e,r)=>{"use strict";var n=r(2109),o=r(3157),i=r(4411),a=r(111),s=r(1400),c=r(6244),u=r(5656),l=r(6135),f=r(5112),d=r(1194),p=r(206),h=d("slice"),v=f("species"),m=Array,b=Math.max;n({target:"Array",proto:!0,forced:!h},{slice:function(t,e){var r,n,f,d=u(this),h=c(d),g=s(t,h),y=s(void 0===e?h:e,h);if(o(d)&&(r=d.constructor,(i(r)&&(r===m||o(r.prototype))||a(r)&&null===(r=r[v]))&&(r=void 0),r===m||void 0===r))return p(d,g,y);for(n=new(void 0===r?m:r)(b(y-g,0)),f=0;g<y;g++,f++)g in d&&l(n,f,d[g]);return n.length=f,n}})},561:(t,e,r)=>{"use strict";var n=r(2109),o=r(7908),i=r(1400),a=r(9303),s=r(6244),c=r(3658),u=r(7207),l=r(5417),f=r(6135),d=r(5117),p=r(1194)("splice"),h=Math.max,v=Math.min;n({target:"Array",proto:!0,forced:!p},{splice:function(t,e){var r,n,p,m,b,g,y=o(this),w=s(y),_=i(t,w),z=arguments.length;for(0===z?r=n=0:1===z?(r=0,n=w-_):(r=z-2,n=v(h(a(e),0),w-_)),u(w+r-n),p=l(y,n),m=0;m<n;m++)(b=_+m)in y&&f(p,m,y[b]);if(p.length=n,r<n){for(m=_;m<w-n;m++)g=m+r,(b=m+n)in y?y[g]=y[b]:d(y,g);for(m=w;m>w-n+r;m--)d(y,m-1)}else if(r>n)for(m=w-n;m>_;m--)g=m+r-1,(b=m+n-1)in y?y[g]=y[b]:d(y,g);for(m=0;m<r;m++)y[m+_]=arguments[m+2];return c(y,w-n+r),p}})},1703:(t,e,r)=>{var n=r(2109),o=r(7854),i=r(2104),a=r(9191),s=o.WebAssembly,c=7!==Error("e",{cause:7}).cause,u=function(t,e){var r={};r[t]=a(t,e,c),n({global:!0,constructor:!0,arity:1,forced:c},r)},l=function(t,e){if(s&&s[t]){var r={};r[t]=a("WebAssembly."+t,e,c),n({target:"WebAssembly",stat:!0,constructor:!0,arity:1,forced:c},r)}};u("Error",(function(t){return function(e){return i(t,this,arguments)}})),u("EvalError",(function(t){return function(e){return i(t,this,arguments)}})),u("RangeError",(function(t){return function(e){return i(t,this,arguments)}})),u("ReferenceError",(function(t){return function(e){return i(t,this,arguments)}})),u("SyntaxError",(function(t){return function(e){return i(t,this,arguments)}})),u("TypeError",(function(t){return function(e){return i(t,this,arguments)}})),u("URIError",(function(t){return function(e){return i(t,this,arguments)}})),l("CompileError",(function(t){return function(e){return i(t,this,arguments)}})),l("LinkError",(function(t){return function(e){return i(t,this,arguments)}})),l("RuntimeError",(function(t){return function(e){return i(t,this,arguments)}}))},8309:(t,e,r)=>{var n=r(9781),o=r(6530).EXISTS,i=r(1702),a=r(3070).f,s=Function.prototype,c=i(s.toString),u=/function\b(?:\s|\/\*[\S\s]*?\*\/|\/\/[^\n\r]*[\n\r]+)*([^\s(/]*)/,l=i(u.exec);n&&!o&&a(s,"name",{configurable:!0,get:function(){try{return l(u,c(this))[1]}catch(t){return""}}})},8862:(t,e,r)=>{var n=r(2109),o=r(5005),i=r(2104),a=r(6916),s=r(1702),c=r(7293),u=r(3157),l=r(614),f=r(111),d=r(2190),p=r(206),h=r(6293),v=o("JSON","stringify"),m=s(/./.exec),b=s("".charAt),g=s("".charCodeAt),y=s("".replace),w=s(1..toString),_=/[\uD800-\uDFFF]/g,z=/^[\uD800-\uDBFF]$/,S=/^[\uDC00-\uDFFF]$/,x=!h||c((function(){var t=o("Symbol")();return"[null]"!=v([t])||"{}"!=v({a:t})||"{}"!=v(Object(t))})),E=c((function(){return'"\\udf06\\ud834"'!==v("\udf06\ud834")||'"\\udead"'!==v("\udead")})),k=function(t,e){var r=p(arguments),n=e;if((f(e)||void 0!==t)&&!d(t))return u(e)||(e=function(t,e){if(l(n)&&(e=a(n,this,t,e)),!d(e))return e}),r[1]=e,i(v,null,r)},A=function(t,e,r){var n=b(r,e-1),o=b(r,e+1);return m(z,t)&&!m(S,o)||m(S,t)&&!m(z,n)?"\\u"+w(g(t,0),16):t};v&&n({target:"JSON",stat:!0,arity:3,forced:x||E},{stringify:function(t,e,r){var n=p(arguments),o=i(x?k:v,null,n);return E&&"string"==typeof o?y(o,_,A):o}})},9098:(t,e,r)=>{"use strict";r(7710)("Map",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),r(5631))},1532:(t,e,r)=>{r(9098)},9653:(t,e,r)=>{"use strict";var n=r(9781),o=r(7854),i=r(1702),a=r(4705),s=r(8052),c=r(2597),u=r(9587),l=r(7976),f=r(2190),d=r(7593),p=r(7293),h=r(8006).f,v=r(1236).f,m=r(3070).f,b=r(863),g=r(3111).trim,y="Number",w=o.Number,_=w.prototype,z=o.TypeError,S=i("".slice),x=i("".charCodeAt),E=function(t){var e=d(t,"number");return"bigint"==typeof e?e:k(e)},k=function(t){var e,r,n,o,i,a,s,c,u=d(t,"number");if(f(u))throw z("Cannot convert a Symbol value to a number");if("string"==typeof u&&u.length>2)if(u=g(u),43===(e=x(u,0))||45===e){if(88===(r=x(u,2))||120===r)return NaN}else if(48===e){switch(x(u,1)){case 66:case 98:n=2,o=49;break;case 79:case 111:n=8,o=55;break;default:return+u}for(a=(i=S(u,2)).length,s=0;s<a;s++)if((c=x(i,s))<48||c>o)return NaN;return parseInt(i,n)}return+u};if(a(y,!w(" 0o1")||!w("0b1")||w("+0x1"))){for(var A,O=function(t){var e=arguments.length<1?0:w(E(t)),r=this;return l(_,r)&&p((function(){b(r)}))?u(Object(e),r,O):e},T=n?h(w):"MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,isFinite,isInteger,isNaN,isSafeInteger,parseFloat,parseInt,fromString,range".split(","),P=0;T.length>P;P++)c(w,A=T[P])&&!c(O,A)&&m(O,A,v(w,A));O.prototype=_,_.constructor=O,s(o,y,O,{constructor:!0})}},4048:(t,e,r)=>{r(2109)({target:"Number",stat:!0},{isNaN:function(t){return t!=t}})},6977:(t,e,r)=>{"use strict";var n=r(2109),o=r(1702),i=r(9303),a=r(863),s=r(8415),c=r(7293),u=RangeError,l=String,f=Math.floor,d=o(s),p=o("".slice),h=o(1..toFixed),v=function(t,e,r){return 0===e?r:e%2==1?v(t,e-1,r*t):v(t*t,e/2,r)},m=function(t,e,r){for(var n=-1,o=r;++n<6;)o+=e*t[n],t[n]=o%1e7,o=f(o/1e7)},b=function(t,e){for(var r=6,n=0;--r>=0;)n+=t[r],t[r]=f(n/e),n=n%e*1e7},g=function(t){for(var e=6,r="";--e>=0;)if(""!==r||0===e||0!==t[e]){var n=l(t[e]);r=""===r?n:r+d("0",7-n.length)+n}return r};n({target:"Number",proto:!0,forced:c((function(){return"0.000"!==h(8e-5,3)||"1"!==h(.9,0)||"1.25"!==h(1.255,2)||"1000000000000000128"!==h(0xde0b6b3a7640080,0)}))||!c((function(){h({})}))},{toFixed:function(t){var e,r,n,o,s=a(this),c=i(t),f=[0,0,0,0,0,0],h="",y="0";if(c<0||c>20)throw u("Incorrect fraction digits");if(s!=s)return"NaN";if(s<=-1e21||s>=1e21)return l(s);if(s<0&&(h="-",s=-s),s>1e-21)if(r=(e=function(t){for(var e=0,r=t;r>=4096;)e+=12,r/=4096;for(;r>=2;)e+=1,r/=2;return e}(s*v(2,69,1))-69)<0?s*v(2,-e,1):s/v(2,e,1),r*=4503599627370496,(e=52-e)>0){for(m(f,0,r),n=c;n>=7;)m(f,1e7,0),n-=7;for(m(f,v(10,n,1),0),n=e-1;n>=23;)b(f,1<<23),n-=23;b(f,1<<n),m(f,1,1),b(f,2),y=g(f)}else m(f,0,r),m(f,1<<-e,0),y=g(f)+d("0",c);return c>0?h+((o=y.length)<=c?"0."+d("0",c-o)+y:p(y,0,o-c)+"."+p(y,o-c)):h+y}})},9601:(t,e,r)=>{var n=r(2109),o=r(1574);n({target:"Object",stat:!0,arity:2,forced:Object.assign!==o},{assign:o})},9720:(t,e,r)=>{var n=r(2109),o=r(4699).entries;n({target:"Object",stat:!0},{entries:function(t){return o(t)}})},5003:(t,e,r)=>{var n=r(2109),o=r(7293),i=r(5656),a=r(1236).f,s=r(9781),c=o((function(){a(1)}));n({target:"Object",stat:!0,forced:!s||c,sham:!s},{getOwnPropertyDescriptor:function(t,e){return a(i(t),e)}})},9337:(t,e,r)=>{var n=r(2109),o=r(9781),i=r(3887),a=r(5656),s=r(1236),c=r(6135);n({target:"Object",stat:!0,sham:!o},{getOwnPropertyDescriptors:function(t){for(var e,r,n=a(t),o=s.f,u=i(n),l={},f=0;u.length>f;)void 0!==(r=o(n,e=u[f++]))&&c(l,e,r);return l}})},9660:(t,e,r)=>{var n=r(2109),o=r(6293),i=r(7293),a=r(5181),s=r(7908);n({target:"Object",stat:!0,forced:!o||i((function(){a.f(1)}))},{getOwnPropertySymbols:function(t){var e=a.f;return e?e(s(t)):[]}})},7941:(t,e,r)=>{var n=r(2109),o=r(7908),i=r(1956);n({target:"Object",stat:!0,forced:r(7293)((function(){i(1)}))},{keys:function(t){return i(o(t))}})},1539:(t,e,r)=>{var n=r(1694),o=r(8052),i=r(288);n||o(Object.prototype,"toString",i,{unsafe:!0})},6833:(t,e,r)=>{var n=r(2109),o=r(4699).values;n({target:"Object",stat:!0},{values:function(t){return o(t)}})},821:(t,e,r)=>{"use strict";var n=r(2109),o=r(6916),i=r(9662),a=r(8523),s=r(2534),c=r(408);n({target:"Promise",stat:!0,forced:r(612)},{all:function(t){var e=this,r=a.f(e),n=r.resolve,u=r.reject,l=s((function(){var r=i(e.resolve),a=[],s=0,l=1;c(t,(function(t){var i=s++,c=!1;l++,o(r,e,t).then((function(t){c||(c=!0,a[i]=t,--l||n(a))}),u)})),--l||n(a)}));return l.error&&u(l.value),r.promise}})},4164:(t,e,r)=>{"use strict";var n=r(2109),o=r(1913),i=r(3702).CONSTRUCTOR,a=r(2492),s=r(5005),c=r(614),u=r(8052),l=a&&a.prototype;if(n({target:"Promise",proto:!0,forced:i,real:!0},{catch:function(t){return this.then(void 0,t)}}),!o&&c(a)){var f=s("Promise").prototype.catch;l.catch!==f&&u(l,"catch",f,{unsafe:!0})}},3401:(t,e,r)=>{"use strict";var n,o,i,a=r(2109),s=r(1913),c=r(5268),u=r(7854),l=r(6916),f=r(8052),d=r(7674),p=r(8003),h=r(6340),v=r(9662),m=r(614),b=r(111),g=r(5787),y=r(6707),w=r(261).set,_=r(5948),z=r(842),S=r(2534),x=r(8572),E=r(9909),k=r(2492),A=r(3702),O=r(8523),T="Promise",P=A.CONSTRUCTOR,j=A.REJECTION_EVENT,C=A.SUBCLASSING,L=E.getterFor(T),I=E.set,N=k&&k.prototype,q=k,M=N,R=u.TypeError,D=u.document,B=u.process,F=O.f,H=F,U=!!(D&&D.createEvent&&u.dispatchEvent),V="unhandledrejection",W=function(t){var e;return!(!b(t)||!m(e=t.then))&&e},Y=function(t,e){var r,n,o,i=e.value,a=1==e.state,s=a?t.ok:t.fail,c=t.resolve,u=t.reject,f=t.domain;try{s?(a||(2===e.rejection&&X(e),e.rejection=1),!0===s?r=i:(f&&f.enter(),r=s(i),f&&(f.exit(),o=!0)),r===t.promise?u(R("Promise-chain cycle")):(n=W(r))?l(n,r,c,u):c(r)):u(i)}catch(t){f&&!o&&f.exit(),u(t)}},$=function(t,e){t.notified||(t.notified=!0,_((function(){for(var r,n=t.reactions;r=n.get();)Y(r,t);t.notified=!1,e&&!t.rejection&&J(t)})))},G=function(t,e,r){var n,o;U?((n=D.createEvent("Event")).promise=e,n.reason=r,n.initEvent(t,!1,!0),u.dispatchEvent(n)):n={promise:e,reason:r},!j&&(o=u["on"+t])?o(n):t===V&&z("Unhandled promise rejection",r)},J=function(t){l(w,u,(function(){var e,r=t.facade,n=t.value;if(K(t)&&(e=S((function(){c?B.emit("unhandledRejection",n,r):G(V,r,n)})),t.rejection=c||K(t)?2:1,e.error))throw e.value}))},K=function(t){return 1!==t.rejection&&!t.parent},X=function(t){l(w,u,(function(){var e=t.facade;c?B.emit("rejectionHandled",e):G("rejectionhandled",e,t.value)}))},Q=function(t,e,r){return function(n){t(e,n,r)}},Z=function(t,e,r){t.done||(t.done=!0,r&&(t=r),t.value=e,t.state=2,$(t,!0))},tt=function(t,e,r){if(!t.done){t.done=!0,r&&(t=r);try{if(t.facade===e)throw R("Promise can't be resolved itself");var n=W(e);n?_((function(){var r={done:!1};try{l(n,e,Q(tt,r,t),Q(Z,r,t))}catch(e){Z(r,e,t)}})):(t.value=e,t.state=1,$(t,!1))}catch(e){Z({done:!1},e,t)}}};if(P&&(M=(q=function(t){g(this,M),v(t),l(n,this);var e=L(this);try{t(Q(tt,e),Q(Z,e))}catch(t){Z(e,t)}}).prototype,(n=function(t){I(this,{type:T,done:!1,notified:!1,parent:!1,reactions:new x,rejection:!1,state:0,value:void 0})}).prototype=f(M,"then",(function(t,e){var r=L(this),n=F(y(this,q));return r.parent=!0,n.ok=!m(t)||t,n.fail=m(e)&&e,n.domain=c?B.domain:void 0,0==r.state?r.reactions.add(n):_((function(){Y(n,r)})),n.promise})),o=function(){var t=new n,e=L(t);this.promise=t,this.resolve=Q(tt,e),this.reject=Q(Z,e)},O.f=F=function(t){return t===q||void 0===t?new o(t):H(t)},!s&&m(k)&&N!==Object.prototype)){i=N.then,C||f(N,"then",(function(t,e){var r=this;return new q((function(t,e){l(i,r,t,e)})).then(t,e)}),{unsafe:!0});try{delete N.constructor}catch(t){}d&&d(N,M)}a({global:!0,constructor:!0,wrap:!0,forced:P},{Promise:q}),p(q,T,!1,!0),h(T)},8674:(t,e,r)=>{r(3401),r(821),r(4164),r(6027),r(683),r(6294)},6027:(t,e,r)=>{"use strict";var n=r(2109),o=r(6916),i=r(9662),a=r(8523),s=r(2534),c=r(408);n({target:"Promise",stat:!0,forced:r(612)},{race:function(t){var e=this,r=a.f(e),n=r.reject,u=s((function(){var a=i(e.resolve);c(t,(function(t){o(a,e,t).then(r.resolve,n)}))}));return u.error&&n(u.value),r.promise}})},683:(t,e,r)=>{"use strict";var n=r(2109),o=r(6916),i=r(8523);n({target:"Promise",stat:!0,forced:r(3702).CONSTRUCTOR},{reject:function(t){var e=i.f(this);return o(e.reject,void 0,t),e.promise}})},6294:(t,e,r)=>{"use strict";var n=r(2109),o=r(5005),i=r(1913),a=r(2492),s=r(3702).CONSTRUCTOR,c=r(9478),u=o("Promise"),l=i&&!s;n({target:"Promise",stat:!0,forced:i||s},{resolve:function(t){return c(l&&this===u?a:this,t)}})},4603:(t,e,r)=>{var n=r(9781),o=r(7854),i=r(1702),a=r(4705),s=r(9587),c=r(8880),u=r(8006).f,l=r(7976),f=r(7850),d=r(1340),p=r(4706),h=r(2999),v=r(2626),m=r(8052),b=r(7293),g=r(2597),y=r(9909).enforce,w=r(6340),_=r(5112),z=r(9441),S=r(7168),x=_("match"),E=o.RegExp,k=E.prototype,A=o.SyntaxError,O=i(k.exec),T=i("".charAt),P=i("".replace),j=i("".indexOf),C=i("".slice),L=/^\?<[^\s\d!#%&*+<=>@^][^\s!#%&*+<=>@^]*>/,I=/a/g,N=/a/g,q=new E(I)!==I,M=h.MISSED_STICKY,R=h.UNSUPPORTED_Y;if(a("RegExp",n&&(!q||M||z||S||b((function(){return N[x]=!1,E(I)!=I||E(N)==N||"/a/i"!=E(I,"i")}))))){for(var D=function(t,e){var r,n,o,i,a,u,h=l(k,this),v=f(t),m=void 0===e,b=[],w=t;if(!h&&v&&m&&t.constructor===D)return t;if((v||l(k,t))&&(t=t.source,m&&(e=p(w))),t=void 0===t?"":d(t),e=void 0===e?"":d(e),w=t,z&&"dotAll"in I&&(n=!!e&&j(e,"s")>-1)&&(e=P(e,/s/g,"")),r=e,M&&"sticky"in I&&(o=!!e&&j(e,"y")>-1)&&R&&(e=P(e,/y/g,"")),S&&(i=function(t){for(var e,r=t.length,n=0,o="",i=[],a={},s=!1,c=!1,u=0,l="";n<=r;n++){if("\\"===(e=T(t,n)))e+=T(t,++n);else if("]"===e)s=!1;else if(!s)switch(!0){case"["===e:s=!0;break;case"("===e:O(L,C(t,n+1))&&(n+=2,c=!0),o+=e,u++;continue;case">"===e&&c:if(""===l||g(a,l))throw new A("Invalid capture group name");a[l]=!0,i[i.length]=[l,u],c=!1,l="";continue}c?l+=e:o+=e}return[o,i]}(t),t=i[0],b=i[1]),a=s(E(t,e),h?this:k,D),(n||o||b.length)&&(u=y(a),n&&(u.dotAll=!0,u.raw=D(function(t){for(var e,r=t.length,n=0,o="",i=!1;n<=r;n++)"\\"!==(e=T(t,n))?i||"."!==e?("["===e?i=!0:"]"===e&&(i=!1),o+=e):o+="[\\s\\S]":o+=e+T(t,++n);return o}(t),r)),o&&(u.sticky=!0),b.length&&(u.groups=b)),t!==w)try{c(a,"source",""===w?"(?:)":w)}catch(t){}return a},B=u(E),F=0;B.length>F;)v(D,E,B[F++]);k.constructor=D,D.prototype=k,m(o,"RegExp",D,{constructor:!0})}w("RegExp")},8450:(t,e,r)=>{var n=r(9781),o=r(9441),i=r(4326),a=r(7045),s=r(9909).get,c=RegExp.prototype,u=TypeError;n&&o&&a(c,"dotAll",{configurable:!0,get:function(){if(this!==c){if("RegExp"===i(this))return!!s(this).dotAll;throw u("Incompatible receiver, RegExp required")}}})},4916:(t,e,r)=>{"use strict";var n=r(2109),o=r(2261);n({target:"RegExp",proto:!0,forced:/./.exec!==o},{exec:o})},8386:(t,e,r)=>{var n=r(9781),o=r(2999).MISSED_STICKY,i=r(4326),a=r(7045),s=r(9909).get,c=RegExp.prototype,u=TypeError;n&&o&&a(c,"sticky",{configurable:!0,get:function(){if(this!==c){if("RegExp"===i(this))return!!s(this).sticky;throw u("Incompatible receiver, RegExp required")}}})},7601:(t,e,r)=>{"use strict";r(4916);var n,o,i=r(2109),a=r(6916),s=r(614),c=r(9670),u=r(1340),l=(n=!1,(o=/[ac]/).exec=function(){return n=!0,/./.exec.apply(this,arguments)},!0===o.test("abc")&&n),f=/./.test;i({target:"RegExp",proto:!0,forced:!l},{test:function(t){var e=c(this),r=u(t),n=e.exec;if(!s(n))return a(f,e,r);var o=a(n,e,r);return null!==o&&(c(o),!0)}})},9714:(t,e,r)=>{"use strict";var n=r(6530).PROPER,o=r(8052),i=r(9670),a=r(1340),s=r(7293),c=r(4706),u="toString",l=RegExp.prototype.toString,f=s((function(){return"/a/b"!=l.call({source:"a",flags:"b"})})),d=n&&l.name!=u;(f||d)&&o(RegExp.prototype,u,(function(){var t=i(this);return"/"+a(t.source)+"/"+a(c(t))}),{unsafe:!0})},7227:(t,e,r)=>{"use strict";r(7710)("Set",(function(t){return function(){return t(this,arguments.length?arguments[0]:void 0)}}),r(5631))},189:(t,e,r)=>{r(7227)},5218:(t,e,r)=>{"use strict";var n=r(2109),o=r(4230);n({target:"String",proto:!0,forced:r(3429)("anchor")},{anchor:function(t){return o(this,"a","name",t)}})},2023:(t,e,r)=>{"use strict";var n=r(2109),o=r(1702),i=r(3929),a=r(4488),s=r(1340),c=r(4964),u=o("".indexOf);n({target:"String",proto:!0,forced:!c("includes")},{includes:function(t){return!!~u(s(a(this)),s(i(t)),arguments.length>1?arguments[1]:void 0)}})},8783:(t,e,r)=>{"use strict";var n=r(8710).charAt,o=r(1340),i=r(9909),a=r(1656),s=r(6178),c="String Iterator",u=i.set,l=i.getterFor(c);a(String,"String",(function(t){u(this,{type:c,string:o(t),index:0})}),(function(){var t,e=l(this),r=e.string,o=e.index;return o>=r.length?s(void 0,!0):(t=n(r,o),e.index+=t.length,s(t,!1))}))},4723:(t,e,r)=>{"use strict";var n=r(6916),o=r(7007),i=r(9670),a=r(8554),s=r(7466),c=r(1340),u=r(4488),l=r(8173),f=r(1530),d=r(7651);o("match",(function(t,e,r){return[function(e){var r=u(this),o=a(e)?void 0:l(e,t);return o?n(o,e,r):new RegExp(e)[t](c(r))},function(t){var n=i(this),o=c(t),a=r(e,n,o);if(a.done)return a.value;if(!n.global)return d(n,o);var u=n.unicode;n.lastIndex=0;for(var l,p=[],h=0;null!==(l=d(n,o));){var v=c(l[0]);p[h]=v,""===v&&(n.lastIndex=f(o,s(n.lastIndex),u)),h++}return 0===h?null:p}]}))},5306:(t,e,r)=>{"use strict";var n=r(2104),o=r(6916),i=r(1702),a=r(7007),s=r(7293),c=r(9670),u=r(614),l=r(8554),f=r(9303),d=r(7466),p=r(1340),h=r(4488),v=r(1530),m=r(8173),b=r(647),g=r(7651),y=r(5112)("replace"),w=Math.max,_=Math.min,z=i([].concat),S=i([].push),x=i("".indexOf),E=i("".slice),k="$0"==="a".replace(/./,"$0"),A=!!/./[y]&&""===/./[y]("a","$0");a("replace",(function(t,e,r){var i=A?"$":"$0";return[function(t,r){var n=h(this),i=l(t)?void 0:m(t,y);return i?o(i,t,n,r):o(e,p(n),t,r)},function(t,o){var a=c(this),s=p(t);if("string"==typeof o&&-1===x(o,i)&&-1===x(o,"$<")){var l=r(e,a,s,o);if(l.done)return l.value}var h=u(o);h||(o=p(o));var m=a.global;if(m){var y=a.unicode;a.lastIndex=0}for(var k=[];;){var A=g(a,s);if(null===A)break;if(S(k,A),!m)break;""===p(A[0])&&(a.lastIndex=v(s,d(a.lastIndex),y))}for(var O,T="",P=0,j=0;j<k.length;j++){for(var C=p((A=k[j])[0]),L=w(_(f(A.index),s.length),0),I=[],N=1;N<A.length;N++)S(I,void 0===(O=A[N])?O:String(O));var q=A.groups;if(h){var M=z([C],I,L,s);void 0!==q&&S(M,q);var R=p(n(o,void 0,M))}else R=b(C,s,L,I,q,o);L>=P&&(T+=E(s,P,L)+R,P=L+C.length)}return T+E(s,P)}]}),!!s((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")}))||!k||A)},4765:(t,e,r)=>{"use strict";var n=r(6916),o=r(7007),i=r(9670),a=r(8554),s=r(4488),c=r(1150),u=r(1340),l=r(8173),f=r(7651);o("search",(function(t,e,r){return[function(e){var r=s(this),o=a(e)?void 0:l(e,t);return o?n(o,e,r):new RegExp(e)[t](u(r))},function(t){var n=i(this),o=u(t),a=r(e,n,o);if(a.done)return a.value;var s=n.lastIndex;c(s,0)||(n.lastIndex=0);var l=f(n,o);return c(n.lastIndex,s)||(n.lastIndex=s),null===l?-1:l.index}]}))},3123:(t,e,r)=>{"use strict";var n=r(2104),o=r(6916),i=r(1702),a=r(7007),s=r(9670),c=r(8554),u=r(7850),l=r(4488),f=r(6707),d=r(1530),p=r(7466),h=r(1340),v=r(8173),m=r(1589),b=r(7651),g=r(2261),y=r(2999),w=r(7293),_=y.UNSUPPORTED_Y,z=4294967295,S=Math.min,x=[].push,E=i(/./.exec),k=i(x),A=i("".slice);a("split",(function(t,e,r){var i;return i="c"=="abbc".split(/(b)*/)[1]||4!="test".split(/(?:)/,-1).length||2!="ab".split(/(?:ab)*/).length||4!=".".split(/(.?)(.?)/).length||".".split(/()()/).length>1||"".split(/.?/).length?function(t,r){var i=h(l(this)),a=void 0===r?z:r>>>0;if(0===a)return[];if(void 0===t)return[i];if(!u(t))return o(e,i,t,a);for(var s,c,f,d=[],p=(t.ignoreCase?"i":"")+(t.multiline?"m":"")+(t.unicode?"u":"")+(t.sticky?"y":""),v=0,b=new RegExp(t.source,p+"g");(s=o(g,b,i))&&!((c=b.lastIndex)>v&&(k(d,A(i,v,s.index)),s.length>1&&s.index<i.length&&n(x,d,m(s,1)),f=s[0].length,v=c,d.length>=a));)b.lastIndex===s.index&&b.lastIndex++;return v===i.length?!f&&E(b,"")||k(d,""):k(d,A(i,v)),d.length>a?m(d,0,a):d}:"0".split(void 0,0).length?function(t,r){return void 0===t&&0===r?[]:o(e,this,t,r)}:e,[function(e,r){var n=l(this),a=c(e)?void 0:v(e,t);return a?o(a,e,n,r):o(i,h(n),e,r)},function(t,n){var o=s(this),a=h(t),c=r(i,o,a,n,i!==e);if(c.done)return c.value;var u=f(o,RegExp),l=o.unicode,v=(o.ignoreCase?"i":"")+(o.multiline?"m":"")+(o.unicode?"u":"")+(_?"g":"y"),m=new u(_?"^(?:"+o.source+")":o,v),g=void 0===n?z:n>>>0;if(0===g)return[];if(0===a.length)return null===b(m,a)?[a]:[];for(var y=0,w=0,x=[];w<a.length;){m.lastIndex=_?0:w;var E,O=b(m,_?A(a,w):a);if(null===O||(E=S(p(m.lastIndex+(_?w:0)),a.length))===y)w=d(a,w,l);else{if(k(x,A(a,y,w)),x.length===g)return x;for(var T=1;T<=O.length-1;T++)if(k(x,O[T]),x.length===g)return x;w=y=E}}return k(x,A(a,y)),x}]}),!!w((function(){var t=/(?:)/,e=t.exec;t.exec=function(){return e.apply(this,arguments)};var r="ab".split(t);return 2!==r.length||"a"!==r[0]||"b"!==r[1]})),_)},6755:(t,e,r)=>{"use strict";var n,o=r(2109),i=r(1702),a=r(1236).f,s=r(7466),c=r(1340),u=r(3929),l=r(4488),f=r(4964),d=r(1913),p=i("".startsWith),h=i("".slice),v=Math.min,m=f("startsWith");o({target:"String",proto:!0,forced:!(!d&&!m&&(n=a(String.prototype,"startsWith"),n&&!n.writable)||m)},{startsWith:function(t){var e=c(l(this));u(t);var r=s(v(arguments.length>1?arguments[1]:void 0,e.length)),n=c(t);return p?p(e,n,r):h(e,r,r+n.length)===n}})},3210:(t,e,r)=>{"use strict";var n=r(2109),o=r(3111).trim;n({target:"String",proto:!0,forced:r(6091)("trim")},{trim:function(){return o(this)}})},4032:(t,e,r)=>{"use strict";var n=r(2109),o=r(7854),i=r(6916),a=r(1702),s=r(1913),c=r(9781),u=r(6293),l=r(7293),f=r(2597),d=r(7976),p=r(9670),h=r(5656),v=r(4948),m=r(1340),b=r(9114),g=r(30),y=r(1956),w=r(8006),_=r(1156),z=r(5181),S=r(1236),x=r(3070),E=r(6048),k=r(5296),A=r(8052),O=r(2309),T=r(6200),P=r(3501),j=r(9711),C=r(5112),L=r(6061),I=r(6800),N=r(6532),q=r(8003),M=r(9909),R=r(2092).forEach,D=T("hidden"),B="Symbol",F=M.set,H=M.getterFor(B),U=Object.prototype,V=o.Symbol,W=V&&V.prototype,Y=o.TypeError,$=o.QObject,G=S.f,J=x.f,K=_.f,X=k.f,Q=a([].push),Z=O("symbols"),tt=O("op-symbols"),et=O("wks"),rt=!$||!$.prototype||!$.prototype.findChild,nt=c&&l((function(){return 7!=g(J({},"a",{get:function(){return J(this,"a",{value:7}).a}})).a}))?function(t,e,r){var n=G(U,e);n&&delete U[e],J(t,e,r),n&&t!==U&&J(U,e,n)}:J,ot=function(t,e){var r=Z[t]=g(W);return F(r,{type:B,tag:t,description:e}),c||(r.description=e),r},it=function(t,e,r){t===U&&it(tt,e,r),p(t);var n=v(e);return p(r),f(Z,n)?(r.enumerable?(f(t,D)&&t[D][n]&&(t[D][n]=!1),r=g(r,{enumerable:b(0,!1)})):(f(t,D)||J(t,D,b(1,{})),t[D][n]=!0),nt(t,n,r)):J(t,n,r)},at=function(t,e){p(t);var r=h(e),n=y(r).concat(lt(r));return R(n,(function(e){c&&!i(st,r,e)||it(t,e,r[e])})),t},st=function(t){var e=v(t),r=i(X,this,e);return!(this===U&&f(Z,e)&&!f(tt,e))&&(!(r||!f(this,e)||!f(Z,e)||f(this,D)&&this[D][e])||r)},ct=function(t,e){var r=h(t),n=v(e);if(r!==U||!f(Z,n)||f(tt,n)){var o=G(r,n);return!o||!f(Z,n)||f(r,D)&&r[D][n]||(o.enumerable=!0),o}},ut=function(t){var e=K(h(t)),r=[];return R(e,(function(t){f(Z,t)||f(P,t)||Q(r,t)})),r},lt=function(t){var e=t===U,r=K(e?tt:h(t)),n=[];return R(r,(function(t){!f(Z,t)||e&&!f(U,t)||Q(n,Z[t])})),n};u||(A(W=(V=function(){if(d(W,this))throw Y("Symbol is not a constructor");var t=arguments.length&&void 0!==arguments[0]?m(arguments[0]):void 0,e=j(t),r=function(t){this===U&&i(r,tt,t),f(this,D)&&f(this[D],e)&&(this[D][e]=!1),nt(this,e,b(1,t))};return c&&rt&&nt(U,e,{configurable:!0,set:r}),ot(e,t)}).prototype,"toString",(function(){return H(this).tag})),A(V,"withoutSetter",(function(t){return ot(j(t),t)})),k.f=st,x.f=it,E.f=at,S.f=ct,w.f=_.f=ut,z.f=lt,L.f=function(t){return ot(C(t),t)},c&&(J(W,"description",{configurable:!0,get:function(){return H(this).description}}),s||A(U,"propertyIsEnumerable",st,{unsafe:!0}))),n({global:!0,constructor:!0,wrap:!0,forced:!u,sham:!u},{Symbol:V}),R(y(et),(function(t){I(t)})),n({target:B,stat:!0,forced:!u},{useSetter:function(){rt=!0},useSimple:function(){rt=!1}}),n({target:"Object",stat:!0,forced:!u,sham:!c},{create:function(t,e){return void 0===e?g(t):at(g(t),e)},defineProperty:it,defineProperties:at,getOwnPropertyDescriptor:ct}),n({target:"Object",stat:!0,forced:!u},{getOwnPropertyNames:ut}),N(),q(V,B),P[D]=!0},1817:(t,e,r)=>{"use strict";var n=r(2109),o=r(9781),i=r(7854),a=r(1702),s=r(2597),c=r(614),u=r(7976),l=r(1340),f=r(3070).f,d=r(9920),p=i.Symbol,h=p&&p.prototype;if(o&&c(p)&&(!("description"in h)||void 0!==p().description)){var v={},m=function(){var t=arguments.length<1||void 0===arguments[0]?void 0:l(arguments[0]),e=u(h,this)?new p(t):void 0===t?p():p(t);return""===t&&(v[e]=!0),e};d(m,p),m.prototype=h,h.constructor=m;var b="Symbol(test)"==String(p("test")),g=a(h.valueOf),y=a(h.toString),w=/^Symbol\((.*)\)[^)]+$/,_=a("".replace),z=a("".slice);f(h,"description",{configurable:!0,get:function(){var t=g(this);if(s(v,t))return"";var e=y(t),r=b?z(e,7,-1):_(e,w,"$1");return""===r?void 0:r}}),n({global:!0,constructor:!0,forced:!0},{Symbol:m})}},763:(t,e,r)=>{var n=r(2109),o=r(5005),i=r(2597),a=r(1340),s=r(2309),c=r(2015),u=s("string-to-symbol-registry"),l=s("symbol-to-string-registry");n({target:"Symbol",stat:!0,forced:!c},{for:function(t){var e=a(t);if(i(u,e))return u[e];var r=o("Symbol")(e);return u[e]=r,l[r]=e,r}})},2165:(t,e,r)=>{r(6800)("iterator")},2526:(t,e,r)=>{r(4032),r(763),r(6620),r(8862),r(9660)},6620:(t,e,r)=>{var n=r(2109),o=r(2597),i=r(2190),a=r(6330),s=r(2309),c=r(2015),u=s("symbol-to-string-registry");n({target:"Symbol",stat:!0,forced:!c},{keyFor:function(t){if(!i(t))throw TypeError(a(t)+" is not a symbol");if(o(u,t))return u[t]}})},4747:(t,e,r)=>{var n=r(7854),o=r(8324),i=r(8509),a=r(8533),s=r(8880),c=function(t){if(t&&t.forEach!==a)try{s(t,"forEach",a)}catch(e){t.forEach=a}};for(var u in o)o[u]&&c(n[u]&&n[u].prototype);c(i)},3948:(t,e,r)=>{var n=r(7854),o=r(8324),i=r(8509),a=r(6992),s=r(8880),c=r(5112),u=c("iterator"),l=c("toStringTag"),f=a.values,d=function(t,e){if(t){if(t[u]!==f)try{s(t,u,f)}catch(e){t[u]=f}if(t[l]||s(t,l,e),o[e])for(var r in a)if(t[r]!==a[r])try{s(t,r,a[r])}catch(e){t[r]=a[r]}}};for(var p in o)d(n[p]&&n[p].prototype,p);d(i,"DOMTokenList")},5556:(t,e,r)=>{"use strict";r(6992);var n=r(2109),o=r(7854),i=r(6916),a=r(1702),s=r(9781),c=r(5143),u=r(8052),l=r(9190),f=r(8003),d=r(3061),p=r(9909),h=r(5787),v=r(614),m=r(2597),b=r(9974),g=r(648),y=r(9670),w=r(111),_=r(1340),z=r(30),S=r(9114),x=r(4121),E=r(1246),k=r(8053),A=r(5112),O=r(4362),T=A("iterator"),P="URLSearchParams",j="URLSearchParamsIterator",C=p.set,L=p.getterFor(P),I=p.getterFor(j),N=Object.getOwnPropertyDescriptor,q=function(t){if(!s)return o[t];var e=N(o,t);return e&&e.value},M=q("fetch"),R=q("Request"),D=q("Headers"),B=R&&R.prototype,F=D&&D.prototype,H=o.RegExp,U=o.TypeError,V=o.decodeURIComponent,W=o.encodeURIComponent,Y=a("".charAt),$=a([].join),G=a([].push),J=a("".replace),K=a([].shift),X=a([].splice),Q=a("".split),Z=a("".slice),tt=/\+/g,et=Array(4),rt=function(t){return et[t-1]||(et[t-1]=H("((?:%[\\da-f]{2}){"+t+"})","gi"))},nt=function(t){try{return V(t)}catch(e){return t}},ot=function(t){var e=J(t,tt," "),r=4;try{return V(e)}catch(t){for(;r;)e=J(e,rt(r--),nt);return e}},it=/[!'()~]|%20/g,at={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+"},st=function(t){return at[t]},ct=function(t){return J(W(t),it,st)},ut=d((function(t,e){C(this,{type:j,iterator:x(L(t).entries),kind:e})}),"Iterator",(function(){var t=I(this),e=t.kind,r=t.iterator.next(),n=r.value;return r.done||(r.value="keys"===e?n.key:"values"===e?n.value:[n.key,n.value]),r}),!0),lt=function(t){this.entries=[],this.url=null,void 0!==t&&(w(t)?this.parseObject(t):this.parseQuery("string"==typeof t?"?"===Y(t,0)?Z(t,1):t:_(t)))};lt.prototype={type:P,bindURL:function(t){this.url=t,this.update()},parseObject:function(t){var e,r,n,o,a,s,c,u=E(t);if(u)for(r=(e=x(t,u)).next;!(n=i(r,e)).done;){if(a=(o=x(y(n.value))).next,(s=i(a,o)).done||(c=i(a,o)).done||!i(a,o).done)throw U("Expected sequence with length 2");G(this.entries,{key:_(s.value),value:_(c.value)})}else for(var l in t)m(t,l)&&G(this.entries,{key:l,value:_(t[l])})},parseQuery:function(t){if(t)for(var e,r,n=Q(t,"&"),o=0;o<n.length;)(e=n[o++]).length&&(r=Q(e,"="),G(this.entries,{key:ot(K(r)),value:ot($(r,"="))}))},serialize:function(){for(var t,e=this.entries,r=[],n=0;n<e.length;)t=e[n++],G(r,ct(t.key)+"="+ct(t.value));return $(r,"&")},update:function(){this.entries.length=0,this.parseQuery(this.url.query)},updateURL:function(){this.url&&this.url.update()}};var ft=function(){h(this,dt);var t=arguments.length>0?arguments[0]:void 0;C(this,new lt(t))},dt=ft.prototype;if(l(dt,{append:function(t,e){k(arguments.length,2);var r=L(this);G(r.entries,{key:_(t),value:_(e)}),r.updateURL()},delete:function(t){k(arguments.length,1);for(var e=L(this),r=e.entries,n=_(t),o=0;o<r.length;)r[o].key===n?X(r,o,1):o++;e.updateURL()},get:function(t){k(arguments.length,1);for(var e=L(this).entries,r=_(t),n=0;n<e.length;n++)if(e[n].key===r)return e[n].value;return null},getAll:function(t){k(arguments.length,1);for(var e=L(this).entries,r=_(t),n=[],o=0;o<e.length;o++)e[o].key===r&&G(n,e[o].value);return n},has:function(t){k(arguments.length,1);for(var e=L(this).entries,r=_(t),n=0;n<e.length;)if(e[n++].key===r)return!0;return!1},set:function(t,e){k(arguments.length,1);for(var r,n=L(this),o=n.entries,i=!1,a=_(t),s=_(e),c=0;c<o.length;c++)(r=o[c]).key===a&&(i?X(o,c--,1):(i=!0,r.value=s));i||G(o,{key:a,value:s}),n.updateURL()},sort:function(){var t=L(this);O(t.entries,(function(t,e){return t.key>e.key?1:-1})),t.updateURL()},forEach:function(t){for(var e,r=L(this).entries,n=b(t,arguments.length>1?arguments[1]:void 0),o=0;o<r.length;)n((e=r[o++]).value,e.key,this)},keys:function(){return new ut(this,"keys")},values:function(){return new ut(this,"values")},entries:function(){return new ut(this,"entries")}},{enumerable:!0}),u(dt,T,dt.entries,{name:"entries"}),u(dt,"toString",(function(){return L(this).serialize()}),{enumerable:!0}),f(ft,P),n({global:!0,constructor:!0,forced:!c},{URLSearchParams:ft}),!c&&v(D)){var pt=a(F.has),ht=a(F.set),vt=function(t){if(w(t)){var e,r=t.body;if(g(r)===P)return e=t.headers?new D(t.headers):new D,pt(e,"content-type")||ht(e,"content-type","application/x-www-form-urlencoded;charset=UTF-8"),z(t,{body:S(0,_(r)),headers:S(0,e)})}return t};if(v(M)&&n({global:!0,enumerable:!0,dontCallGetSet:!0,forced:!0},{fetch:function(t){return M(t,arguments.length>1?vt(arguments[1]):{})}}),v(R)){var mt=function(t){return h(this,B),new R(t,arguments.length>1?vt(arguments[1]):{})};B.constructor=mt,mt.prototype=B,n({global:!0,constructor:!0,dontCallGetSet:!0,forced:!0},{Request:mt})}}t.exports={URLSearchParams:ft,getState:L}},1637:(t,e,r)=>{r(5556)},8789:(t,e,r)=>{"use strict";r(8783);var n,o=r(2109),i=r(9781),a=r(5143),s=r(7854),c=r(9974),u=r(1702),l=r(8052),f=r(7045),d=r(5787),p=r(2597),h=r(1574),v=r(8457),m=r(1589),b=r(8710).codeAt,g=r(3197),y=r(1340),w=r(8003),_=r(8053),z=r(5556),S=r(9909),x=S.set,E=S.getterFor("URL"),k=z.URLSearchParams,A=z.getState,O=s.URL,T=s.TypeError,P=s.parseInt,j=Math.floor,C=Math.pow,L=u("".charAt),I=u(/./.exec),N=u([].join),q=u(1..toString),M=u([].pop),R=u([].push),D=u("".replace),B=u([].shift),F=u("".split),H=u("".slice),U=u("".toLowerCase),V=u([].unshift),W="Invalid scheme",Y="Invalid host",$="Invalid port",G=/[a-z]/i,J=/[\d+-.a-z]/i,K=/\d/,X=/^0x/i,Q=/^[0-7]+$/,Z=/^\d+$/,tt=/^[\da-f]+$/i,et=/[\0\t\n\r #%/:<>?@[\\\]^|]/,rt=/[\0\t\n\r #/:<>?@[\\\]^|]/,nt=/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g,ot=/[\t\n\r]/g,it=function(t){var e,r,n,o;if("number"==typeof t){for(e=[],r=0;r<4;r++)V(e,t%256),t=j(t/256);return N(e,".")}if("object"==typeof t){for(e="",n=function(t){for(var e=null,r=1,n=null,o=0,i=0;i<8;i++)0!==t[i]?(o>r&&(e=n,r=o),n=null,o=0):(null===n&&(n=i),++o);return o>r&&(e=n,r=o),e}(t),r=0;r<8;r++)o&&0===t[r]||(o&&(o=!1),n===r?(e+=r?":":"::",o=!0):(e+=q(t[r],16),r<7&&(e+=":")));return"["+e+"]"}return t},at={},st=h({},at,{" ":1,'"':1,"<":1,">":1,"`":1}),ct=h({},st,{"#":1,"?":1,"{":1,"}":1}),ut=h({},ct,{"/":1,":":1,";":1,"=":1,"@":1,"[":1,"\\":1,"]":1,"^":1,"|":1}),lt=function(t,e){var r=b(t,0);return r>32&&r<127&&!p(e,t)?t:encodeURIComponent(t)},ft={ftp:21,file:null,http:80,https:443,ws:80,wss:443},dt=function(t,e){var r;return 2==t.length&&I(G,L(t,0))&&(":"==(r=L(t,1))||!e&&"|"==r)},pt=function(t){var e;return t.length>1&&dt(H(t,0,2))&&(2==t.length||"/"===(e=L(t,2))||"\\"===e||"?"===e||"#"===e)},ht=function(t){return"."===t||"%2e"===U(t)},vt={},mt={},bt={},gt={},yt={},wt={},_t={},zt={},St={},xt={},Et={},kt={},At={},Ot={},Tt={},Pt={},jt={},Ct={},Lt={},It={},Nt={},qt=function(t,e,r){var n,o,i,a=y(t);if(e){if(o=this.parse(a))throw T(o);this.searchParams=null}else{if(void 0!==r&&(n=new qt(r,!0)),o=this.parse(a,null,n))throw T(o);(i=A(new k)).bindURL(this),this.searchParams=i}};qt.prototype={type:"URL",parse:function(t,e,r){var o,i,a,s,c,u=this,l=e||vt,f=0,d="",h=!1,b=!1,g=!1;for(t=y(t),e||(u.scheme="",u.username="",u.password="",u.host=null,u.port=null,u.path=[],u.query=null,u.fragment=null,u.cannotBeABaseURL=!1,t=D(t,nt,"")),t=D(t,ot,""),o=v(t);f<=o.length;){switch(i=o[f],l){case vt:if(!i||!I(G,i)){if(e)return W;l=bt;continue}d+=U(i),l=mt;break;case mt:if(i&&(I(J,i)||"+"==i||"-"==i||"."==i))d+=U(i);else{if(":"!=i){if(e)return W;d="",l=bt,f=0;continue}if(e&&(u.isSpecial()!=p(ft,d)||"file"==d&&(u.includesCredentials()||null!==u.port)||"file"==u.scheme&&!u.host))return;if(u.scheme=d,e)return void(u.isSpecial()&&ft[u.scheme]==u.port&&(u.port=null));d="","file"==u.scheme?l=Ot:u.isSpecial()&&r&&r.scheme==u.scheme?l=gt:u.isSpecial()?l=zt:"/"==o[f+1]?(l=yt,f++):(u.cannotBeABaseURL=!0,R(u.path,""),l=Lt)}break;case bt:if(!r||r.cannotBeABaseURL&&"#"!=i)return W;if(r.cannotBeABaseURL&&"#"==i){u.scheme=r.scheme,u.path=m(r.path),u.query=r.query,u.fragment="",u.cannotBeABaseURL=!0,l=Nt;break}l="file"==r.scheme?Ot:wt;continue;case gt:if("/"!=i||"/"!=o[f+1]){l=wt;continue}l=St,f++;break;case yt:if("/"==i){l=xt;break}l=Ct;continue;case wt:if(u.scheme=r.scheme,i==n)u.username=r.username,u.password=r.password,u.host=r.host,u.port=r.port,u.path=m(r.path),u.query=r.query;else if("/"==i||"\\"==i&&u.isSpecial())l=_t;else if("?"==i)u.username=r.username,u.password=r.password,u.host=r.host,u.port=r.port,u.path=m(r.path),u.query="",l=It;else{if("#"!=i){u.username=r.username,u.password=r.password,u.host=r.host,u.port=r.port,u.path=m(r.path),u.path.length--,l=Ct;continue}u.username=r.username,u.password=r.password,u.host=r.host,u.port=r.port,u.path=m(r.path),u.query=r.query,u.fragment="",l=Nt}break;case _t:if(!u.isSpecial()||"/"!=i&&"\\"!=i){if("/"!=i){u.username=r.username,u.password=r.password,u.host=r.host,u.port=r.port,l=Ct;continue}l=xt}else l=St;break;case zt:if(l=St,"/"!=i||"/"!=L(d,f+1))continue;f++;break;case St:if("/"!=i&&"\\"!=i){l=xt;continue}break;case xt:if("@"==i){h&&(d="%40"+d),h=!0,a=v(d);for(var w=0;w<a.length;w++){var _=a[w];if(":"!=_||g){var z=lt(_,ut);g?u.password+=z:u.username+=z}else g=!0}d=""}else if(i==n||"/"==i||"?"==i||"#"==i||"\\"==i&&u.isSpecial()){if(h&&""==d)return"Invalid authority";f-=v(d).length+1,d="",l=Et}else d+=i;break;case Et:case kt:if(e&&"file"==u.scheme){l=Pt;continue}if(":"!=i||b){if(i==n||"/"==i||"?"==i||"#"==i||"\\"==i&&u.isSpecial()){if(u.isSpecial()&&""==d)return Y;if(e&&""==d&&(u.includesCredentials()||null!==u.port))return;if(s=u.parseHost(d))return s;if(d="",l=jt,e)return;continue}"["==i?b=!0:"]"==i&&(b=!1),d+=i}else{if(""==d)return Y;if(s=u.parseHost(d))return s;if(d="",l=At,e==kt)return}break;case At:if(!I(K,i)){if(i==n||"/"==i||"?"==i||"#"==i||"\\"==i&&u.isSpecial()||e){if(""!=d){var S=P(d,10);if(S>65535)return $;u.port=u.isSpecial()&&S===ft[u.scheme]?null:S,d=""}if(e)return;l=jt;continue}return $}d+=i;break;case Ot:if(u.scheme="file","/"==i||"\\"==i)l=Tt;else{if(!r||"file"!=r.scheme){l=Ct;continue}if(i==n)u.host=r.host,u.path=m(r.path),u.query=r.query;else if("?"==i)u.host=r.host,u.path=m(r.path),u.query="",l=It;else{if("#"!=i){pt(N(m(o,f),""))||(u.host=r.host,u.path=m(r.path),u.shortenPath()),l=Ct;continue}u.host=r.host,u.path=m(r.path),u.query=r.query,u.fragment="",l=Nt}}break;case Tt:if("/"==i||"\\"==i){l=Pt;break}r&&"file"==r.scheme&&!pt(N(m(o,f),""))&&(dt(r.path[0],!0)?R(u.path,r.path[0]):u.host=r.host),l=Ct;continue;case Pt:if(i==n||"/"==i||"\\"==i||"?"==i||"#"==i){if(!e&&dt(d))l=Ct;else if(""==d){if(u.host="",e)return;l=jt}else{if(s=u.parseHost(d))return s;if("localhost"==u.host&&(u.host=""),e)return;d="",l=jt}continue}d+=i;break;case jt:if(u.isSpecial()){if(l=Ct,"/"!=i&&"\\"!=i)continue}else if(e||"?"!=i)if(e||"#"!=i){if(i!=n&&(l=Ct,"/"!=i))continue}else u.fragment="",l=Nt;else u.query="",l=It;break;case Ct:if(i==n||"/"==i||"\\"==i&&u.isSpecial()||!e&&("?"==i||"#"==i)){if(".."===(c=U(c=d))||"%2e."===c||".%2e"===c||"%2e%2e"===c?(u.shortenPath(),"/"==i||"\\"==i&&u.isSpecial()||R(u.path,"")):ht(d)?"/"==i||"\\"==i&&u.isSpecial()||R(u.path,""):("file"==u.scheme&&!u.path.length&&dt(d)&&(u.host&&(u.host=""),d=L(d,0)+":"),R(u.path,d)),d="","file"==u.scheme&&(i==n||"?"==i||"#"==i))for(;u.path.length>1&&""===u.path[0];)B(u.path);"?"==i?(u.query="",l=It):"#"==i&&(u.fragment="",l=Nt)}else d+=lt(i,ct);break;case Lt:"?"==i?(u.query="",l=It):"#"==i?(u.fragment="",l=Nt):i!=n&&(u.path[0]+=lt(i,at));break;case It:e||"#"!=i?i!=n&&("'"==i&&u.isSpecial()?u.query+="%27":u.query+="#"==i?"%23":lt(i,at)):(u.fragment="",l=Nt);break;case Nt:i!=n&&(u.fragment+=lt(i,st))}f++}},parseHost:function(t){var e,r,n;if("["==L(t,0)){if("]"!=L(t,t.length-1))return Y;if(e=function(t){var e,r,n,o,i,a,s,c=[0,0,0,0,0,0,0,0],u=0,l=null,f=0,d=function(){return L(t,f)};if(":"==d()){if(":"!=L(t,1))return;f+=2,l=++u}for(;d();){if(8==u)return;if(":"!=d()){for(e=r=0;r<4&&I(tt,d());)e=16*e+P(d(),16),f++,r++;if("."==d()){if(0==r)return;if(f-=r,u>6)return;for(n=0;d();){if(o=null,n>0){if(!("."==d()&&n<4))return;f++}if(!I(K,d()))return;for(;I(K,d());){if(i=P(d(),10),null===o)o=i;else{if(0==o)return;o=10*o+i}if(o>255)return;f++}c[u]=256*c[u]+o,2!=++n&&4!=n||u++}if(4!=n)return;break}if(":"==d()){if(f++,!d())return}else if(d())return;c[u++]=e}else{if(null!==l)return;f++,l=++u}}if(null!==l)for(a=u-l,u=7;0!=u&&a>0;)s=c[u],c[u--]=c[l+a-1],c[l+--a]=s;else if(8!=u)return;return c}(H(t,1,-1)),!e)return Y;this.host=e}else if(this.isSpecial()){if(t=g(t),I(et,t))return Y;if(e=function(t){var e,r,n,o,i,a,s,c=F(t,".");if(c.length&&""==c[c.length-1]&&c.length--,(e=c.length)>4)return t;for(r=[],n=0;n<e;n++){if(""==(o=c[n]))return t;if(i=10,o.length>1&&"0"==L(o,0)&&(i=I(X,o)?16:8,o=H(o,8==i?1:2)),""===o)a=0;else{if(!I(10==i?Z:8==i?Q:tt,o))return t;a=P(o,i)}R(r,a)}for(n=0;n<e;n++)if(a=r[n],n==e-1){if(a>=C(256,5-e))return null}else if(a>255)return null;for(s=M(r),n=0;n<r.length;n++)s+=r[n]*C(256,3-n);return s}(t),null===e)return Y;this.host=e}else{if(I(rt,t))return Y;for(e="",r=v(t),n=0;n<r.length;n++)e+=lt(r[n],at);this.host=e}},cannotHaveUsernamePasswordPort:function(){return!this.host||this.cannotBeABaseURL||"file"==this.scheme},includesCredentials:function(){return""!=this.username||""!=this.password},isSpecial:function(){return p(ft,this.scheme)},shortenPath:function(){var t=this.path,e=t.length;!e||"file"==this.scheme&&1==e&&dt(t[0],!0)||t.length--},serialize:function(){var t=this,e=t.scheme,r=t.username,n=t.password,o=t.host,i=t.port,a=t.path,s=t.query,c=t.fragment,u=e+":";return null!==o?(u+="//",t.includesCredentials()&&(u+=r+(n?":"+n:"")+"@"),u+=it(o),null!==i&&(u+=":"+i)):"file"==e&&(u+="//"),u+=t.cannotBeABaseURL?a[0]:a.length?"/"+N(a,"/"):"",null!==s&&(u+="?"+s),null!==c&&(u+="#"+c),u},setHref:function(t){var e=this.parse(t);if(e)throw T(e);this.searchParams.update()},getOrigin:function(){var t=this.scheme,e=this.port;if("blob"==t)try{return new Mt(t.path[0]).origin}catch(t){return"null"}return"file"!=t&&this.isSpecial()?t+"://"+it(this.host)+(null!==e?":"+e:""):"null"},getProtocol:function(){return this.scheme+":"},setProtocol:function(t){this.parse(y(t)+":",vt)},getUsername:function(){return this.username},setUsername:function(t){var e=v(y(t));if(!this.cannotHaveUsernamePasswordPort()){this.username="";for(var r=0;r<e.length;r++)this.username+=lt(e[r],ut)}},getPassword:function(){return this.password},setPassword:function(t){var e=v(y(t));if(!this.cannotHaveUsernamePasswordPort()){this.password="";for(var r=0;r<e.length;r++)this.password+=lt(e[r],ut)}},getHost:function(){var t=this.host,e=this.port;return null===t?"":null===e?it(t):it(t)+":"+e},setHost:function(t){this.cannotBeABaseURL||this.parse(t,Et)},getHostname:function(){var t=this.host;return null===t?"":it(t)},setHostname:function(t){this.cannotBeABaseURL||this.parse(t,kt)},getPort:function(){var t=this.port;return null===t?"":y(t)},setPort:function(t){this.cannotHaveUsernamePasswordPort()||(""==(t=y(t))?this.port=null:this.parse(t,At))},getPathname:function(){var t=this.path;return this.cannotBeABaseURL?t[0]:t.length?"/"+N(t,"/"):""},setPathname:function(t){this.cannotBeABaseURL||(this.path=[],this.parse(t,jt))},getSearch:function(){var t=this.query;return t?"?"+t:""},setSearch:function(t){""==(t=y(t))?this.query=null:("?"==L(t,0)&&(t=H(t,1)),this.query="",this.parse(t,It)),this.searchParams.update()},getSearchParams:function(){return this.searchParams.facade},getHash:function(){var t=this.fragment;return t?"#"+t:""},setHash:function(t){""!=(t=y(t))?("#"==L(t,0)&&(t=H(t,1)),this.fragment="",this.parse(t,Nt)):this.fragment=null},update:function(){this.query=this.searchParams.serialize()||null}};var Mt=function(t){var e=d(this,Rt),r=_(arguments.length,1)>1?arguments[1]:void 0,n=x(e,new qt(t,!1,r));i||(e.href=n.serialize(),e.origin=n.getOrigin(),e.protocol=n.getProtocol(),e.username=n.getUsername(),e.password=n.getPassword(),e.host=n.getHost(),e.hostname=n.getHostname(),e.port=n.getPort(),e.pathname=n.getPathname(),e.search=n.getSearch(),e.searchParams=n.getSearchParams(),e.hash=n.getHash())},Rt=Mt.prototype,Dt=function(t,e){return{get:function(){return E(this)[t]()},set:e&&function(t){return E(this)[e](t)},configurable:!0,enumerable:!0}};if(i&&(f(Rt,"href",Dt("serialize","setHref")),f(Rt,"origin",Dt("getOrigin")),f(Rt,"protocol",Dt("getProtocol","setProtocol")),f(Rt,"username",Dt("getUsername","setUsername")),f(Rt,"password",Dt("getPassword","setPassword")),f(Rt,"host",Dt("getHost","setHost")),f(Rt,"hostname",Dt("getHostname","setHostname")),f(Rt,"port",Dt("getPort","setPort")),f(Rt,"pathname",Dt("getPathname","setPathname")),f(Rt,"search",Dt("getSearch","setSearch")),f(Rt,"searchParams",Dt("getSearchParams")),f(Rt,"hash",Dt("getHash","setHash"))),l(Rt,"toJSON",(function(){return E(this).serialize()}),{enumerable:!0}),l(Rt,"toString",(function(){return E(this).serialize()}),{enumerable:!0}),O){var Bt=O.createObjectURL,Ft=O.revokeObjectURL;Bt&&l(Mt,"createObjectURL",c(Bt,O)),Ft&&l(Mt,"revokeObjectURL",c(Ft,O))}w(Mt,"URL"),o({global:!0,constructor:!0,forced:!a,sham:!i},{URL:Mt})},285:(t,e,r)=>{r(8789)},3441:(t,e)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.orElse=e.isT=e.isNothing=void 0,e.isNothing=function(t){return null==t},e.isT=function(t){return!(0,e.isNothing)(t)},e.orElse=function(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];return 1===t.length?function(r){return(0,e.isNothing)(r)?t[0]:r}:(0,e.isNothing)(t[1])?t[0]:t[1]}},4882:function(t,e,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(t,e,r,n){void 0===n&&(n=r);var o=Object.getOwnPropertyDescriptor(e,r);o&&!("get"in o?!e.__esModule:o.writable||o.configurable)||(o={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,n,o)}:function(t,e,r,n){void 0===n&&(n=r),t[n]=e[r]}),o=this&&this.__exportStar||function(t,e){for(var r in t)"default"===r||Object.prototype.hasOwnProperty.call(e,r)||n(e,t,r)};Object.defineProperty(e,"__esModule",{value:!0}),o(r(5922),e),o(r(3874),e),o(r(9137),e),o(r(6938),e),o(r(3441),e),o(r(9697),e),o(r(4115),e),o(r(4638),e),o(r(1612),e)},5922:(t,e)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.liftA2=void 0,e.liftA2=function(t,e,r){return function(n,o){return t(e(n),r(o))}}},6938:(t,e,r)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.mPipe=void 0;var n=r(3441);e.mPipe=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var r=t[0],o=t.slice(1);return function(){for(var t,e=[],i=0;i<arguments.length;i++)e[i]=arguments[i];return e.every(n.isT)&&null!==(t=o.reduce((function(t,e){return(0,n.isT)(t)?e(t):void 0}),r.apply(void 0,e)))&&void 0!==t?t:void 0}}},3874:(t,e)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.match=void 0,e.match=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return function(e){for(var r=0;r<t.length;r++)if(t[r][0](e))return t[r][1](e)}}},9137:(t,e)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.match2=void 0,e.match2=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return function(e,r){for(var n=0;n<t.length;n++)if(t[n][0](e)&&t[n][1](r))return t[n][2](e,r)}}},1612:function(t,e,r){"use strict";var n=this&&this.__spreadArray||function(t,e,r){if(r||2===arguments.length)for(var n,o=0,i=e.length;o<i;o++)!n&&o in e||(n||(n=Array.prototype.slice.call(e,0,o)),n[o]=e[o]);return t.concat(n||Array.prototype.slice.call(e))};Object.defineProperty(e,"__esModule",{value:!0}),e.or=void 0;var o=r(3441);e.or=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return function(){for(var e,r=[],i=0;i<arguments.length;i++)r[i]=arguments[i];for(var a=0;a<=t.length;a++){var s=null===(e=t[a])||void 0===e?void 0:e.call.apply(e,n([t],r,!1));if(!(0,o.isNothing)(s))return s}}}},3642:(t,e,r)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e._parse=e.call=e.isOptional=void 0;var n=r(3441);e.isOptional=function(t){return"optional"===t.__type},e.call=function(t,e){switch(t.__type){case"optional":case"strict":return t.fn(e);default:return t(e)}},e._parse=function(t,r){var o={};for(var i in t)if(Object.prototype.hasOwnProperty.call(t,i)){var a=(0,e.call)(t[i],r);if(!(0,e.isOptional)(t[i])&&(0,n.isNothing)(a))return;o[i]=a}return o}},4115:(t,e,r)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.parse=e.optional=void 0;var n=r(3642);e.optional=function(t){return{__type:"optional",fn:t}},e.parse=function(t,e){return void 0===e?function(e){return(0,n._parse)(t,e)}:(0,n._parse)(t,e)}},4638:(t,e,r)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.parseStrict=void 0;var n=r(3642);e.parseStrict=function(t,e){return void 0===e?function(e){return(0,n._parse)(t,e)}:(0,n._parse)(t,e)}},9697:(t,e)=>{"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.pass=void 0,e.pass=function(t){return function(e){return t(e)?e:void 0}}}},e={};function r(n){var o=e[n];if(void 0!==o)return o.exports;var i=e[n]={exports:{}};return t[n].call(i.exports,i,i.exports,r),i.exports}r.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return r.d(e,{a:e}),e},r.d=(t,e)=>{for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]})},r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),r.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},(()=>{"use strict";var t={};r.r(t),r.d(t,{Animation:()=>u,Background:()=>j,Comments:()=>C,Facebook:()=>I,Link:()=>M,ScrollPane:()=>R,Select:()=>L,Sticky:()=>B,Twitter:()=>W});var e={};r.r(e),r.d(e,{de:()=>X,en:()=>Q,es:()=>Z,fr:()=>tt,it:()=>et,nl:()=>rt,ru:()=>nt});var n={};r.r(n),r.d(n,{VERSION:()=>be,after:()=>Pn,all:()=>Kn,allKeys:()=>Ar,any:()=>Xn,assign:()=>Ir,before:()=>jn,bind:()=>yn,bindAll:()=>_n,chain:()=>vn,chunk:()=>Io,clone:()=>Rr,collect:()=>Vn,compact:()=>So,compose:()=>Tn,constant:()=>lr,contains:()=>Qn,countBy:()=>lo,create:()=>Mr,debounce:()=>kn,default:()=>Mo,defaults:()=>Nr,defer:()=>xn,delay:()=>Sn,detect:()=>Fn,difference:()=>Eo,drop:()=>_o,each:()=>Un,escape:()=>nn,every:()=>Kn,extend:()=>Lr,extendOwn:()=>Ir,filter:()=>Gn,find:()=>Fn,findIndex:()=>Nn,findKey:()=>Ln,findLastIndex:()=>qn,findWhere:()=>Hn,first:()=>wo,flatten:()=>xo,foldl:()=>Yn,foldr:()=>$n,forEach:()=>Un,functions:()=>jr,groupBy:()=>co,has:()=>Br,head:()=>wo,identity:()=>Fr,include:()=>Qn,includes:()=>Qn,indexBy:()=>uo,indexOf:()=>Dn,initial:()=>yo,inject:()=>Yn,intersection:()=>To,invert:()=>Pr,invoke:()=>Zn,isArguments:()=>sr,isArray:()=>er,isArrayBuffer:()=>Ze,isBoolean:()=>Be,isDataView:()=>tr,isDate:()=>We,isElement:()=>Fe,isEmpty:()=>_r,isEqual:()=>kr,isError:()=>$e,isFinite:()=>cr,isFunction:()=>or,isMap:()=>Je,isMatch:()=>zr,isNaN:()=>ur,isNull:()=>Re,isNumber:()=>Ve,isObject:()=>Me,isRegExp:()=>Ye,isSet:()=>Xe,isString:()=>Ue,isSymbol:()=>Ge,isTypedArray:()=>mr,isUndefined:()=>De,isWeakMap:()=>Ke,isWeakSet:()=>Qe,iteratee:()=>$r,keys:()=>wr,last:()=>zo,lastIndexOf:()=>Bn,map:()=>Vn,mapObject:()=>Jr,matcher:()=>Hr,matches:()=>Hr,max:()=>ro,memoize:()=>zn,methods:()=>jr,min:()=>no,mixin:()=>qo,negate:()=>On,noop:()=>Kr,now:()=>tn,object:()=>Co,omit:()=>go,once:()=>Cn,pairs:()=>Tr,partial:()=>gn,partition:()=>fo,pick:()=>bo,pluck:()=>to,property:()=>Vr,propertyOf:()=>Xr,random:()=>Zr,range:()=>Lo,reduce:()=>Yn,reduceRight:()=>$n,reject:()=>Jn,rest:()=>_o,restArguments:()=>qe,result:()=>dn,sample:()=>oo,select:()=>Gn,shuffle:()=>io,size:()=>vo,some:()=>Xn,sortBy:()=>ao,sortedIndex:()=>Mn,tail:()=>_o,take:()=>wo,tap:()=>Dr,template:()=>fn,templateSettings:()=>an,throttle:()=>En,times:()=>Qr,toArray:()=>ho,transpose:()=>Po,unescape:()=>on,union:()=>Oo,uniq:()=>Ao,unique:()=>Ao,uniqueId:()=>hn,unzip:()=>Po,values:()=>Or,where:()=>eo,without:()=>ko,wrap:()=>An,zip:()=>jo});var o={};r.r(o),r.d(o,{Accordion:()=>G,AddToCart:()=>Ia,Alert:()=>J,Audio:()=>K,Countdown:()=>ot,Countdown2:()=>it,Counter:()=>st,EcwidCart:()=>ei,EcwidMyAccount:()=>ri,EcwidProduct:()=>ti,EcwidProducts:()=>Xo,EcwidShoppingBag:()=>ni,FileUpload:()=>ki,Form:()=>oi,Form2:()=>mi,Image:()=>Oi,Login:()=>Bi,Map:()=>Fi,Price:()=>Na,ProgressBar:()=>Hi,Protected:()=>Ui,Quantity:()=>Ba,ResetPassword:()=>Wi,Section:()=>Yi,SectionPopup:()=>Xi,SectionPopup2:()=>ra,Story:()=>Ua,Tabs:()=>Wa,Translation:()=>Ga,Variations:()=>Fa,Video:()=>ns,YotPoReview:()=>Ha});var i={};r.r(i),r.d(i,{ScrollMotions:()=>ps,Sticky:()=>B});var a={};r.r(a),r.d(a,{Calendly:()=>hs,Carousel:()=>vs,Filters:()=>ms,ImageGallery:()=>bs,Lottie:()=>gs,Menu:()=>Cs,Posts:()=>Rs,SectionHeader:()=>Ls,Switcher:()=>Is,VideoPlaylist:()=>Ms,WOOAddToCart:()=>Ds,WOOCart:()=>Hs}),r(1539),r(4747),r(6833),r(2222),r(9826);var s=function(){return window.BrizyLibs||{}},c=function(){return window.BrizyProLibs||{}};function u(t){var e=s().Animation;e&&t.find(".brz-animated").each((function(){new e(this)}))}const l=jQuery;var f=r.n(l);function d(t){return d="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},d(t)}r(1703),r(7658),r(8862),r(6699),r(2023),r(7042);var p=[],h=!1;function v(t,e){this._loop=e.loop,this._start=e.start||0,function(t){if(h)t();else{if(0===p.length){if(!document.querySelector("script[src='https://www.youtube.com/iframe_api']")){var e=document.createElement("script");e.async=!0,e.src="https://www.youtube.com/iframe_api",e.onerror=function(){t(new Error("Failed to load"+e.src))};var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(e,r)}void 0===window.onYouTubeIframeAPIReady&&(window.onYouTubeIframeAPIReady=function(){window.Brz&&window.Brz.emit("elements.video.iframe.ready")}),void 0===window.Brz&&(window.onYouTubeIframeAPIReady=function(){h=!0,p.forEach((function(t){t()}))}),window.Brz&&window.Brz.on("elements.video.iframe.ready",(function(){h=!0,p.forEach((function(t){t()}))}))}p.push(t)}}(this._init.bind(this,t))}function m(t,e){var r=e.loop,n=e.start||0,o=function(e,r){t.get(0).contentWindow&&t.get(0).contentWindow.postMessage(JSON.stringify({method:e,value:r}),"*")}.bind(this);return window.addEventListener("message",function(e){if(e.origin.includes("vimeo")){var i=JSON.parse(e.data);switch("ping"!==i.method||t.attr("data-ready")||(t.attr("data-ready","true"),o("addEventListener","loaded"),o("addEventListener","finish")),i.event){case"ready":t.data("ready")||(t.attr("data-ready","true"),o("addEventListener","loaded"),o("addEventListener","finish"));break;case"finish":o("setCurrentTime",n),r&&setTimeout(function(){o("play")}.bind(this),260);break;case"loaded":o("setCurrentTime",n),o("setVolume",0),o("play")}}}.bind(this),!1),o("ping"),{mute:function(){o("setVolume",0)},unMute:function(){o("setVolume",100)},play:function(){o("play")},pause:function(){o("pause")},setLoop:function(t){this.play(),r=t},seekTo:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;n=t,o("setCurrentTime",t)},destroy:function(){o("unload"),o("removeEventListener","loaded"),o("removeEventListener","finish")}}}f().extend(v.prototype,{_init:function(t){this.player=new YT.Player(t.get(0),{events:{onReady:function(t){t.target.mute(),t.target.seekTo(this._start),t.target.playVideo()}.bind(this),onStateChange:function(t){this._loop&&t.data==YT.PlayerState.ENDED&&(t.target.seekTo(this._start),t.target.playVideo())}.bind(this)}})},mute:function(){this.player.mute()},unMute:function(){this.player.unMute()},play:function(){this.player&&"function"==typeof this.player.playVideo&&this.player.playVideo()},stop:function(){this.player.stopVideo()},pause:function(){this.player.pauseVideo()},setLoop:function(t){this.play(),this._loop=t},seekTo:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0;this._start=t,this.player.seekTo(t)},destroy:function(){this.player=null}}),function(t,e){var r="backgroundVideo",n="plugin_"+r;function o(e,r){this.$elem=t(e),this.$iframe=this.$elem.find("iframe"),this._setSizes=this._setSizes.bind(this),this._setSizes(),this._attachEvents(),this._init(r)}t.extend(o.prototype,{_init:function(t){"youtube"===t.type?this._player=new v(this.$iframe,t):"vimeo"===t.type&&(this._player=new m(this.$iframe,t))},_setSizes:function(){var t=function(){var t=1.78,e=this.$elem.width(),r=this.$elem.height();if(e/t<r){var n=Math.ceil(r*t);return{width:n,height:r,left:(e-n)/2,top:0}}var o=Math.ceil(e/t);return{width:e,height:o,left:0,top:(r-o)/2}}.call(this);this.$iframe.width(t.width).height(t.height).css({left:t.left,top:t.top})},_attachEvents:function(){t(e).on("resize",this._setSizes)},_detachEvents:function(){t(e).off("resize",this._setSizes)},refresh:function(t,e){"typeChange"===t?(this._player.destroy(),this._init(e),this._setSizes()):"resize"===t?this._setSizes():this._player[t](e)},destroy:function(){this._detachEvents(),this._player.destroy(),this.$iframe=null,this._player=null}}),t.fn[r]=function(e){if(void 0===e||"object"===d(e))return this.each((function(){t.data(this,n)||t.data(this,n,new o(this,e))}));if("string"==typeof e&&"destroy"===e)return this.each((function(){var e=t.data(this,n);e instanceof o&&e.destroy.apply(e)}));var r=Array.prototype.slice.call(arguments,1)[0];return this.each((function(){var i=t.data(this,n);i instanceof o&&i.refresh.apply(i,[e,r])}))}}(f(),window,document),r(9600),r(6992),r(1532),r(8783),r(3948);var b=new Map,g=function(t){b.forEach((function(e){e(t)}))},y=function(t,e){b.size||window.addEventListener("resize",g,{passive:!1}),b.set(t,e)},w=function(t){b.delete(t),0===b.size&&window.removeEventListener("resize",g)};function _(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function z(t,e){if(t){if("string"==typeof t)return _(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?_(t,e):void 0}}function S(t){return function(t){if(Array.isArray(t))return _(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||z(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function x(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,o,i=[],a=!0,s=!1;try{for(r=r.call(t);!(a=(n=r.next()).done)&&(i.push(n.value),!e||i.length!==e);a=!0);}catch(t){s=!0,o=t}finally{try{a||null==r.return||r.return()}finally{if(s)throw o}}return i}}(t,e)||z(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var E=new Map,k=function(t){var e=E.size,r=x(S(E)[e-1],2),n=(r[0],r[1]);null==n||n(t)},A=function(t,e){E.size||window.addEventListener("wheel",k,{passive:!1}),E.set(t,e)},O=function(t){E.delete(t),0===E.size&&window.removeEventListener("wheel",k)},T="brz-bg-image-parallax--init brz-ed-preserve-3d absolute w-full !bg-cover left-0 -top-[50vh] h-[100vh] !transition-[all] !duration-[0s] !ease-[ease] !delay-[0s] origin-[center_center_0]";!function(t,e,r){var n="plugin_parallax";function o(n,o){this.$elem=t(n),this.options=t.extend({bgClass:"parallax-bg",wheelIgnoreClass:[],items:[],baseElement:e,windowHeight:Math.max(r.documentElement.clientHeight,e.innerHeight||0),r:0,u:0,v:0,s:!1,F:!1},o),this._handleScrollBound=this._handleScroll.bind(this),this._handleWheelBound=this._handleWheel.bind(this),this._handleResizeBound=this._handleResize.bind(this),this._init()}t.extend(o.prototype,{_init:function(){this.options.windowHeight=Math.max(r.documentElement.clientHeight,e.innerHeight||0),this.profileParallaxElements(),this._attachEvents(),this.d()},_attachEvents:function(){var t=this.$elem.get(0);this.options.baseElement.addEventListener("scroll",this._handleScrollBound,!1),A(t,this._handleWheelBound),y(t,this._handleResizeBound)},_detachEvents:function(){var t=this.$elem.get(0);this.options.baseElement.removeEventListener("scroll",this._handleScrollBound,!1),O(t),w(t)},_handleScroll:function(){this.options.F=!0},_handleWheel:function(e){if(this.options.wheelIgnoreClass&&this.options.wheelIgnoreClass.length>0&&t(e.target).closest("."+this.options.wheelIgnoreClass.join(", .")).length>0)return null;e.preventDefault&&e.preventDefault(),this.options.v=e.notRealWheel?-e.deltaY/4:1===e.deltaMode?-e.deltaY/3:100===Math.abs(e.deltaY)?-e.deltaY/120:-e.deltaY/40,this.options.v=-2>this.options.v?-2:this.options.v,this.options.v=this.options.v>2?2:this.options.v,this.options.s=!0,this.options.u=4},_handleResize:function(){this.options.windowHeight=Math.max(r.documentElement.clientHeight,e.innerHeight||0),this.options.r=this.b(),this.profileParallaxElements()},profileParallaxElements:function(){var e=this.$elem,r=this;this.options.items=[],this.options.r=this.b(),e.find("."+this.options.bgClass).each((function(){var n=e,o=n.offset().top,i=r.getHeight(n),a=t(this);i&&r.setHeight(n,i),r.options.items.push({section:n.get(0),outerHeight:n.outerHeight(),elemTop:o,elemBottom:o+n.outerHeight(),isFirstSection:!1,imageHolder:this}),a.addClass(T),r.mr_setTranslate3DTransform(a.get(0),(r.f()+r.options.windowHeight-o)/2)}))},setHeight:function(e,r){t(e).find("."+this.options.bgClass).css({height:100*r+"vh"})},getHeight:function(e){var r=t(e),n=t(this.options.baseElement).height(),o=r.height();return o>n?o/n:null},getTransformStyle:function(t){for(var e=0;e<t.length;e++)if(void 0!==r.body.style[t[e]])return t[e];return null},getScrollingState:function(){return this.options.u>0},getCurrentElement:function(t){for(var e=0,r=this.options.items.length;this.options.items[e]&&this.options.items[e].section!==t;e++);return e===r?-1:e},isFunction:function(t){return t&&"[object Function]"==={}.toString.call(t)},requestAnimationFrame:function(t){return(this.options.baseElement.requestAnimationFrame||this.options.baseElement.mozRequestAnimationFrame||this.options.baseElement.webkitRequestAnimationFrame||this.options.baseElement.msRequestAnimationFrame)(t)},mr_setTranslate3DTransform:function(t,e){var r=this.getTransformStyle(["transform","msTransform","webkitTransform","mozTransform","oTransform"]);t.style[r]="translate3d(0,"+e+"px,0)"},refresh:function(){this.profileParallaxElements()},destroy:function(){this._detachEvents(),this.$elem.removeData(n),this.$elem.find("."+this.options.bgClass).css({height:"",transform:""}).removeClass(T)},paused:function(t){t?this._detachEvents():this._attachEvents()},e:function(t,e){this.isVariant()?e+this.options.windowHeight-this.options.r>t.elemTop&&e-this.options.r<t.elemBottom&&(t.isFirstSection?this.mr_setTranslate3DTransform(t.imageHolder,e/2):this.mr_setTranslate3DTransform(t.imageHolder,e-t.elemTop-this.options.r)):e+this.options.windowHeight>t.elemTop&&e<t.elemBottom&&(t.isFirstSection?this.mr_setTranslate3DTransform(t.imageHolder,e/2):this.mr_setTranslate3DTransform(t.imageHolder,(e+this.options.windowHeight-t.elemTop)/2))},c:function(t,e,r,n){var o=t-1;return o/=n,t/=n,r*(--t*t*t*t*t+1)+e-(r*(--o*o*o*o*o+1)+e)},d:function(){var t=0;if(this.options.F){for(var e=this.options.items.length,r=this.f();e--;)this.e(this.options.items[e],r);this.options.F=!1}this.options.s&&(((t+=-this.options.v*this.c(this.options.u,0,300,30))>1||-1>t)&&(this.options.baseElement.scrollBy(0,t),t=0),this.options.u++,this.options.u>30&&(this.options.u=0,this.options.s=!1,this.options.v=0,t=0)),this.requestAnimationFrame.call(this,this.d.bind(this))},isVariant:function(){return!1},b:function(){return t(this.options.baseElement).outerHeight(!0)},f:function(){return this.options.baseElement!=e?this.options.baseElement.scrollTop:0===r.documentElement.scrollTop?r.body.scrollTop:r.documentElement.scrollTop}}),t.fn.parallax=function(e){if(void 0===e||"object"===d(e))return this.each((function(){t.data(this,n)||t.data(this,n,new o(this,e))}));if("string"==typeof e&&"_"!==e[0]&&"init"!==e){var r=Array.prototype.slice.call(arguments,1);return this.each((function(){var i=t.data(this,n);i instanceof o&&"function"==typeof i[e]&&i[e].apply(i,r)}))}}}(f(),window,document);var P=function(){var t=window.innerWidth,e="desktop";return t<992&&(e="tablet"),t<768&&(e="mobile"),e};const j=function(t){var e=t.find(".brz-bg-image-parallax");if(e.length>0){var r=e.closest(".brz-bg");"desktop"===P()&&r.parallax({bgClass:"brz-bg-image-parallax"}),f()(window).on("resize",(function(){"desktop"===P()?r.parallax({bgClass:"brz-bg-image-parallax"}):r.parallax("destroy")})),["elements.mmenu.open","elements.popup.open"].forEach((function(t){window.Brz.on(t,(function(e){if("elements.popup.open"===t){var n=e.dataset.scroll_page;if("true"===(void 0===n?"false":n))return;r.parallax("paused",!0)}else r.parallax("paused",!0)}))})),["elements.mmenu.close","elements.popup.close"].forEach((function(t){window.Brz.on(t,(function(e){if("elements.popup.close"===t){var n=e.dataset.scroll_page;if("true"===(void 0===n?"false":n))return;r.parallax("paused",!1)}else r.parallax("paused",!1)}))}))}t.find(".brz-bg-video").each((function(){var t=f()(this),e=t.data(),r=e.type,n=e.loop,o=e.start;t.backgroundVideo({type:r,loop:n,start:o}),window.Brz.on("elements.story.init",(function(e){e.contains(t.get(0))&&t.backgroundVideo("typeChange",{type:r,loop:n,start:o})}))}))};function C(t){var e,n,o=t.find("#disqus_thread");if(o.length){var i=o.attr("data-shortname"),a=o.attr("data-url"),s=o.attr("data-identifier");r.g.disqus_config=function(){this.page.url=a,this.page.identifier=s},(n=(e=document).createElement("script")).src="https://".concat(i,".disqus.com/embed.js"),n.setAttribute("data-timestamp",+new Date),(e.head||e.body).appendChild(n)}}function L(t){t.find(".brz-control__select").each((function(){var t=f()(this),e=t.find(".brz-control__select-current"),r=e.find(".brz-control__select-option"),n=t.find(".brz-control__select-options"),o=n.find(".brz-control__select-option");e.on("click",(function(){n.toggle()})),o.on("click",(function(){f()(this).parent().children().removeClass("active"),f()(this).addClass("active"),t.find("input[type=hidden]").val(f()(this).data("value")),r.html(f()(this).html()),n.hide()})),t.find("input[type=hidden]").on("change",(function(){var t=o.html();r.html(t),f()(this).val("")})),f()(window).on("click",(function(e){f()(e.target).closest(t).length||n.hide()}))}))}function I(t){var e=t.find(".brz-facebook"),r=t.find(".fb-root");e.length&&0===r.length&&function(t,e){var r=document.createElement("div");r.className="fb-root",document.body.appendChild(r);var n,o,i,a,s,c="https://connect.facebook.net/"+t+"/sdk.js#xfbml=1&version=v3.1&appId="+e;o="script",i="facebook-jssdk",s=(n=document).getElementsByTagName(o)[0],n.getElementById(i)||((a=n.createElement(o)).id=i,a.src=c,s.parentNode.insertBefore(a,s))}(e.attr("lang"),e.attr("appid"))}r(8674),r(3210),r(4916),r(5306);var N=function(t){return new Promise((function(e){var r=t.endLocation,n=t.duration,o=t.targetNode;window.Brz.emit("elements.anchor.startScrolled",o);var i=document.scrollingElement;if(i){var a=i.scrollTop,s=r-a,c=0;!function t(){var r,o,u,l=(r=c+=20,o=a,u=s,(r/=n/2)<1?u/2*r*r+o:-u/2*(--r*(r-2)-1)+o);i.scrollTop=l,c<n?setTimeout(t,20):e()}()}}))},q=function(t,e,r){var n=t.querySelector('[id="'.concat(e.slice(1),'"]'));return n&&r?n.getBoundingClientRect().top+r.scrollTop:0};function M(t){var e=t.get(0),r=e.ownerDocument.scrollingElement;window.addEventListener("hashchange",(function(t){t.preventDefault();var n=location.hash;(n&&e.querySelector('[id="'.concat(n.slice(1),'"]'))||"#"===n)&&N({endLocation:q(e,n,r),duration:600})})),e.addEventListener("click",(function(t){if(t.target instanceof Element){var n=t.target.closest(".brz-a:not([data-brz-link-type='popup']), .brz-anchor, .link--anchor, .link--external, .brz-menu__ul a.menu-item");if(n){var o=n.hash.trim(),i=n.href.replace(o,""),a=o&&!!e.querySelector('[id="'.concat(o.slice(1),'"]'));o&&function(t,e){var r=e.href,n=e.hash,o=r.replace(n,"");return o.includes(t)&&Math.abs(o.length-t.length)<=1}(i,location)&&(a||"#"===o)&&(t.preventDefault(),N({endLocation:q(e,o,r),duration:600,targetNode:n}).then((function(){history.pushState(null,"",o)})))}}}))}function R(t){t.find(".brz-ed-scroll-pane").scrollPane()}r(7601),function(t){function e(t){this.elem=t,this.scrolableElem=this.elem.firstElementChild,this.options={onlyWide:!1,wideTrackClassName:"brz-ed-wide-track",wideThumbClassName:"brz-ed-wide-thumb",tallTrackClassName:"brz-ed-tall-track",tallThumbClassName:"brz-ed-tall-thumb"},this.init()}var r=1,n=function(t,e,r,n,o){var i=(r=Math.max(r,t))-t,a=t/r*o,s=o-a;return{client:t,offset:e,scroll:r,overflow:i,position:n,track:o,thumb:a,piece:s,shift:0==i?0:n/i*s}};e.prototype.init=function(){var e=navigator.userAgent.toLowerCase(),n=/firefox/.test(e),o=/chrome/.test(e);n&&(r=20),o&&(r=.8),this.onUpdateDOM(),t(this.elem).on("wheel",this.onWheel.bind(this)),t(this.scrolableElem).on("scroll",this.onUpdateDOM.bind(this))},e.prototype.destroy=function(){t(this.elem).off("wheel"),t(this.scrolableElem).off("scroll")},e.prototype.onWheel=function(t){var e=this.scrolableElem.scrollTop,n=this.scrolableElem.scrollLeft;this.options.onlyWide?this.scrolableElem.scrollLeft=n+(t.originalEvent.deltaX?t.originalEvent.deltaX:t.originalEvent.deltaY*r):(t.preventDefault(),this.scrolableElem.scrollTop=e+t.originalEvent.deltaY*r,this.scrolableElem.scrollLeft=n+t.originalEvent.deltaX),(this.scrolableElem.scrollTop!=e||this.scrolableElem.scrollLeft!=n||this.options.onlyWide)&&t.preventDefault()},e.prototype.onUpdateDOM=function(){var t,e,r=this.elem.getElementsByClassName(this.options.wideTrackClassName)[0],o=this.elem.getElementsByClassName(this.options.wideThumbClassName)[0],i=this.elem.getElementsByClassName(this.options.tallTrackClassName)[0],a=this.elem.getElementsByClassName(this.options.tallThumbClassName)[0],s={overflow:Math.max(0,this.scrolableElem.scrollWidth-this.scrolableElem.clientWidth)},c={overflow:Math.max(this.scrolableElem.scrollHeight-this.scrolableElem.clientHeight)};r.style.position="absolute",i.style.position="absolute",o.style.position="relative",a.style.position="relative",r.style.display="block",t=r.offsetHeight,i.style.display="block",e=i.offsetWidth,this.scrolableElem.style.overflow="hidden",this.scrolableElem.style.borderBottomWidth=t+"px",this.scrolableElem.style.borderBottomStyle=s.overflow?"solid":"none",this.scrolableElem.style.borderRightWidth=e+"px",this.scrolableElem.style.borderRightStyle=c.overflow?"solid":"none",s.overflow=Math.max(0,this.scrolableElem.scrollWidth-this.scrolableElem.clientWidth),c.overflow=Math.max(0,this.scrolableElem.scrollHeight-this.scrolableElem.clientHeight),r.style.display=s.overflow?"block":"none",r.style.width=this.scrolableElem.clientWidth+"px",r.style.left=0,r.style.top=this.scrolableElem.offsetHeight-t+"px",i.style.display=c.overflow?"block":"none",i.style.height=this.scrolableElem.clientHeight+"px",i.style.top=0,s=n(this.scrolableElem.clientWidth,this.scrolableElem.offsetWidth,this.scrolableElem.scrollWidth,this.scrolableElem.scrollLeft,r.clientWidth),c=n(this.scrolableElem.clientHeight,this.scrolableElem.offsetHeight,this.scrolableElem.scrollHeight,this.scrolableElem.scrollTop,i.clientHeight),o.style.left=s.shift+"px",o.style.width=s.thumb+"px",a.style.top=c.shift+"px",a.style.height=c.thumb+"px"},t.fn.scrollPane=function(r){var n=t(this),o="plugin_scrollPane";return void 0===r||"object"===d(r)?this.each((function(){n.data(o)||n.data(o,new e(this,r))})):"string"==typeof r&&"_"!==r[0]&&"init"!==r?this.each((function(){var t=n.data(o);t instanceof e&&"function"==typeof t[r]&&t[r].apply(t,Array.prototype.slice.call(arguments,1))})):void 0}}(f(),window,document),r(561);var D={events:["load","scroll"],listeners:[],framePending:!1,addEvents:function(){var t=this;this.notifyListeners=this.notifyListeners.bind(this),this.events.forEach((function(e){window.addEventListener(e,t.notifyListeners)}))},removeEvents:function(){var t=this;this.events.forEach((function(e){window.removeEventListener(e,t.notifyListeners)}))},addListener:function(t){0===this.listeners.length&&this.addEvents(),this.listeners.push(t)},removeListener:function(t){this.listeners.splice(this.listeners.indexOf(t),1),0===this.listeners.length&&this.removeEvents()},notifyListeners:function(){if(!this.framePending){var t=this;requestAnimationFrame((function(){t.framePending=!1,t.listeners.forEach((function(t){t()}))})),this.framePending=!0}}};function B(){}!function(t){var e={type:"animated",refNode:function(){throw new Error("brzSticky refNode must be specified")},onStickyChange:function(){}};function r(r,n){this.element=r,this.settings=t.extend({},e,n),this._defaults=e,this._name="brzSticky",this.init()}t.extend(r.prototype,{init:function(){this.isSticky=!1,D.addListener(this.checkSticky.bind(this))},checkSticky:function(){var t=this.settings.type,e=this.settings.refNode.call(this.element),r=this.element.ownerDocument.defaultView.scrollY,n=e.getBoundingClientRect(),o="animated"===t?-n.top>=n.height:n.top<=0;o!==this.isSticky&&r>0&&(this.isSticky=o,this.settings.onStickyChange.call(this.element,this.isSticky))}}),t.fn.brzSticky=function(e){return this.each((function(){t.data(this,"plugin_brzSticky")||t.data(this,"plugin_brzSticky",new r(this,e))}))}}(f(),window,document),r(285),r(1637),r(7327),r(9714);var F=function(t){switch(d(t)){case"string":return t;case"number":return isNaN(t)?void 0:t.toString();default:return}},H=function(t){return JSON.parse(decodeURIComponent(t))},U=function(){var t=window.innerWidth,e="desktop";return t>992?e="desktop":t<992&&t>768?e="tablet":t<768&&(e="mobile"),e},V=U();const W=function(t){var e=S(t.get(0).querySelectorAll(".brz-twitter"));if(e.length>0){var r=e.filter((function(t){return"embed"===t.dataset.type}));r.length>0&&("desktop"!==V&&r.forEach((function(t){try{var e=t.querySelector("[data-height]");if(e){var r,n=null!==(r=F(t.getAttribute("data-heights")))&&void 0!==r?r:"",o=H(n);e.dataset.height="".concat(o[V])}}catch(t){console.error("Invalid attribute heights",t)}})),window.addEventListener("resize",(function(){return t=r,void((e=U())!==V&&function(t,e){t.forEach((function(t){var r=t.querySelector("iframe");if(r)try{var n,o=null!==(n=F(t.getAttribute("data-heights")))&&void 0!==n?n:"",i=H(o),a=new URL(r.src),s=i[e];a.searchParams.set("maxHeight","".concat(s)),r.src="".concat(a)}catch(t){console.error("Invalid attribute heights",t)}}))}(t,V=e));var t,e}))),window.twttr=function(t,e){var r=window.twttr||{};if(t.getElementById(e))return r;var n=t.createElement("script");return n.setAttribute("id",e),n.setAttribute("src","https://platform.twitter.com/widgets.js"),t.body.appendChild(n),r}(document,"twitter-wjs")}};r(9653),r(1249);var Y=function(t,e){var r=e.height,n=e.duration,o=e.onFinish,i=t.animate([{height:"".concat(r,"px"),offset:0},{height:0,offset:1}],{duration:n,iterations:1,fill:"backwards"});"function"==typeof o&&(i.onfinish=o)},$=function(t,e){var r=e.height,n=e.duration,o=e.onFinish,i=t.animate([{height:0,offset:0},{height:"".concat(r,"px"),offset:1}],{duration:n,iterations:1,fill:"backwards"});"function"==typeof o&&(i.onfinish=o)};function G(t){t.find(".brz-accordion").each((function(){var t=this,e=f()(t).find("> .brz-accordion__item > .brz-accordion__nav"),r=f()(t).find(".brz-accordion__filter-wrapper"),n=e.attr("data-collapsible"),o=Number(t.dataset.duration||0),i=f()(t).find("> .brz-accordion__item > .brz-accordion__content").toArray();e.on("click",(function(){var e="brz-accordion__item--active",a=f()(this).closest(".brz-accordion__item"),s=a.find("> .brz-accordion__content"),c=r.length?a.index()-1:a.index(),u=i.map((function(t){var e=t.firstElementChild;return e?e.getBoundingClientRect().height:0})),l=function(){var e=a.offset().top;window.Brz.emit("elements.accordion.changed",t,{active:a.get(0),tabs:a.siblings().get()}),window.scrollY>e&&f()("html, body").animate({scrollTop:e},200)};if("on"===n){if(a.hasClass(e))return;a.siblings().find("> .brz-accordion__content").each((function(t,r){var n=r.closest(".brz-accordion__item--active");if(n){var i=u[t];Y(r,{height:i,duration:o,onFinish:l}),n.classList.remove(e)}}));var d=s.get(0),p=u[c];$(d,{height:p,duration:o,onFinish:l}),a.addClass(e)}else{var h=s.get(0),v=u[c];a.hasClass(e)?(Y(h,{height:v,duration:o,onFinish:l}),a.removeClass(e)):($(h,{height:v,duration:o,onFinish:l}),a.addClass(e))}})),r.on("click",(function(t){var e=t.target,r=f()(this),n="brz-accordion__hidden",o=f()(e).closest(".brz-accordion__filter__item");if(o.hasClass("brz-accordion__filter__item--active")||(o.addClass("brz-accordion__filter__item--active"),o.siblings().removeClass("brz-accordion__filter__item--active")),o.length){var i=o.data().filter;"*"===i?r.siblings().removeClass(n):r.siblings().addClass(n).siblings(".".concat(i)).removeClass(n)}}))}))}function J(t){t.get(0).querySelectorAll(".brz-alert").forEach((function(t){var e=t.querySelector(".brz-alert-close"),r=t.getAttribute("data-delay"),n=r?Number(r):0;if(n&&n>0)var o=setTimeout((function(){null==e||e.classList.remove("brz-hidden"),clearTimeout(o)}),1e3*n);null==e||e.addEventListener("click",(function(){var e;null===(e=t.parentElement)||void 0===e||e.classList.add("brz-hidden")}))}))}function K(t){var e=t.get(0),r=function(t){var e=Math.floor(t/60),r=Math.floor(t%60);return"".concat(e,":").concat(r<10?"0".concat(r):r)},n=function(t,e){return Boolean(e&&t.composedPath().find((function(t){return t===e})))},o=function(t,e){var r=t.children[0],n=t.children[1];r&&n&&(e?(r.classList.add("brz-hidden"),n.classList.remove("brz-hidden")):(r.classList.remove("brz-hidden"),n.classList.add("brz-hidden")))},i=function(t,e){var r=t.getBoundingClientRect().width;return 100*(e-t.getBoundingClientRect().left)/r};e.querySelectorAll(".brz-audio").forEach((function(t){var a=t.querySelector("audio");if(a){var s=t.querySelector(".brz-audio-controls .brz-audio-progress"),c=t.querySelector(".brz-audio-controls .brz-audio-slider"),u=t.querySelector(".brz-audio-volume-controls .brz-audio-slider"),l=t.querySelector(".brz-audio-volume-controls .brz-audio-progress"),f=t.querySelector(".brz-audio-volume-btn"),d=t.querySelector(".brz-audio-current-time"),p=t.querySelector(".brz-audio-total-time"),h=t.querySelector(".brz-audio-play-pause-btn");a.addEventListener("loadedmetadata",(function(t){var e=t.target,n=r(e.duration);p&&(p.innerHTML=n)})),a.addEventListener("timeupdate",(function(t){var e=t.target,n=e.currentTime,o=n/e.duration*100;s&&d&&(s.style.width="".concat(o.toFixed(2),"%"),d.innerHTML=r(n))})),a.addEventListener("ended",(function(){h&&o(h,!1)})),t.addEventListener("click",(function(r){var s=n(r,h),d=n(r,c),p=n(r,f),v=n(r,u);if(s)a.paused?(function(t){Array.from(e.querySelectorAll(".brz-audio")).filter((function(e){return e!==t})).forEach((function(t){var e=t.querySelector(".brz-custom-audio audio"),r=t.querySelector(".brz-audio-play-pause-btn");e&&r&&(o(r,!1),e.pause())}))}(t),a.play()):a.pause(),h&&o(h,!a.paused);else if(d&&c){var m=i(c,r.pageX);a.currentTime=m*a.duration/100}else if(p&&f&&l)o(f,!a.muted),a.muted=!a.muted,a.muted?l.style.width="0%":(a.volume,l.style.width="".concat((100*a.volume).toFixed(2),"%"));else if(v&&l&&u){var b=i(u,r.pageX);l.style.width="".concat(b.toFixed(2),"%"),a.volume=b/100,a.muted&&f&&v&&(o(f,!a.muted),l.style.width="".concat(b.toFixed(2),"%"),a.muted=!a.muted,a.volume=b/100)}}))}}))}r(1038),r(6977);const X={labels:[["Jahre","Monate","Wochen","Tage","Stunden","Minuten","Sekunden"],["Jahr","Monat","Woche","Tag","Stunde","Minute","Sekunde"]],whichLabels:function(t){var e=Number(t>1?0:1);return this.labels[e]}},Q={labels:[["Years","Months","Weeks","Days","Hours","Minutes","Seconds"],["Year","Month","Week","Day","Hour","Minute","Second"]],whichLabels:function(t){var e=Number(t>1?0:1);return this.labels[e]}},Z={labels:[["Años","Meses","Semanas","Días","Horas","Minutos","Segundos"],["Año","Mes","Semana","Día","Hora","Minuto","Segundo"]],whichLabels:function(t){var e=0===t?0:1;return this.labels[e]}},tt={labels:[["Années","Mois","Semaines","Jours","Heures","Minutes","Secondes"],["Année","Mois","Semaine","Jour","Heure","Minute","Seconde"]],whichLabels:function(t){var e=Number(t>1?0:1);return this.labels[e]}},et={labels:[["Anni","Mesi","Settimane","Giorni","Ore","Minuti","Secondi"],["Anno","Mese","Settimana","Giorno","Ora","Minuto","Secondo"]],whichLabels:function(t){var e=Number(t>1?0:1);return this.labels[e]}},rt={labels:[["Jaren","Maanden","Weken","Dagen","Uren","Minuten","Seconden"],["Jaar","Maand","Week","Dag","Uur","Minuut","Seconde"]],whichLabels:function(t){var e=Number(t>1?0:1);return this.labels[e]}},nt={labels:[["Лет","Месяцев","Недель","Дней","Часов","Минут","Секунд"],["Год","Месяц","Неделя","День","Час","Минута","Секунда"],["Года","Месяца","Недели","Дня","Часа","Минуты","Секунды"]],whichLabels:function(t){var e=t%10,r=Math.floor(t%100/10),n=1===t?1:e>=2&&e<=4&&1!==r?2:1===e&&1!==r?1:0;return this.labels[n]}};function ot(t){t.find(".brz-countdown").each((function(){var t=f()(this),r=t.find(".brz-countdown__days > .brz-countdown__number"),n=t.find(".brz-countdown__hours > .brz-countdown__number"),o=t.find(".brz-countdown__minutes > .brz-countdown__number"),i=t.find(".brz-countdown__seconds > .brz-countdown__number"),a=t.find(".brz-countdown__days > .brz-countdown__label"),s=t.find(".brz-countdown__hours > .brz-countdown__label"),c=t.find(".brz-countdown__minutes > .brz-countdown__label"),u=t.find(".brz-countdown__seconds > .brz-countdown__label"),l=t.attr("data-end"),d=t.attr("data-timezone"),p=t.attr("data-language"),h=function(t){return("0"+t).slice(-2)};t.countdown({now:Date.now(),endDate:l,timeZoneOffset:60*d*1e3,tickInterval:1e3,language:e[p]||Q,onTick:function(t){r.text(t.days.amount),n.text(h(t.hours.amount)),o.text(h(t.minutes.amount)),i.text(h(t.seconds.amount)),a.text(t.days.title),s.text(t.hours.title),c.text(t.minutes.title),u.text(t.seconds.title)}})}))}function it(t){t.find(".brz-countdown2").each((function(){var t=f()(this),e=t.find(".brz-countdown2__days > .brz-countdown2__number"),r=t.find(".brz-countdown2__hours > .brz-countdown2__number"),n=t.find(".brz-countdown2__minutes > .brz-countdown2__number"),o=t.find(".brz-countdown2__seconds > .brz-countdown2__number"),i=t.find(".brz-countdown2-message"),a=t.attr("data-end"),s=t.attr("data-hours"),c=t.attr("data-minutes"),u=a.split("/"),l=function(t,e,r){var n=x(e.split(" "),2),o=n[0],i=n[1],a=60*(new Date).getTimezoneOffset()*1e3;return function(t){var e=/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/.exec(t);if(null===e)return!1;var r=e[2],n=e[1]-1,o=e[3],i=new Date(o,n,r);return i.getDate()==r&&i.getMonth()==n&&i.getFullYear()==o}(t)?new Date("".concat(t," ").concat(o,":").concat(r," ").concat(i)).getTime()-a:new Date(0).getTime()}(function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"d/m/Y";if(t=new Date(t),isNaN(Date.parse(t)))return t;var r=t.getFullYear(),n=t.getMonth()+1,o=t.getDate(),i=t.getHours(),a=t.getMinutes(),s=t.getSeconds();return e.replace("Y",r).replace("m",n).replace("d",o).replace("H",i).replace("i",a).replace("s",s)}("".concat(u[1],"/").concat(u[0],"/").concat(u[2]),"m/d/Y"),s,c),d=t.attr("data-timezone"),p=t.attr("data-link-type"),h=t.attr("data-redirect"),v=t.attr("data-action"),m=function(t){return t>=0&&t<=9?"0"+t:t};t.countdown2({now:Date.now(),endDate:l,timeZoneOffset:60*d*1e3,tickInterval:1e3,onTick:function(a){e.text(m(a.days)),r.text(m(a.hours)),n.text(m(a.minutes)),o.text(m(a.seconds)),Object.values(a).every((function(t){return 0===t}))&&("redirect"===p?window.location.href=h:"showMessage"===v?i.show():"linkAction"===p&&"none"===v?t.removeAttr("data-message").removeAttr("data-redirect").removeAttr("data-hide"):"linkAction"===p&&"hide"===v&&t.hide())}})}))}var at=[];function st(t){t.find(".brz-story").length>0?t.find(".brz-slick-slider").on("afterChange init",(function(t,e){var r=e.currentSlide,n=e.$slides[r];f()(n).find(".brz-counter").each((function(){var t=f()(this);ct({elem:this,start:"simple"===t.attr("data-type")?t.attr("data-start"):0,end:t.attr("data-end"),duration:t.attr("data-duration"),separator:t.attr("data-separator")})}))})):(t.find(".brz-counter").each((function(){var t=f()(this),e="simple"===t.attr("data-type")?t.attr("data-start"):0;at.push({elem:this,start:e,end:t.attr("data-end"),duration:t.attr("data-duration"),separator:t.attr("data-separator")}),t.addClass("brz-initialized")})),f()(document).on("brz.popup.show",ut),document.addEventListener("scroll",ut),ut())}function ct(t){var e=t.elem,r=t.separator,n=f()(e).find(".brz-counter-figures .brz-counter-numbers"),o=f()(e).find(".brz-counter-pie-chart"),i=Number(t.end),a=o.length?Math.max(0,Math.min(100,i)):i,s=function(t){n.text(function(t,e){var r;return(r=(t=t.toFixed(0)).split("."))[0]=r[0].replace(/\B(?=(\d{3})+(?!\d))/g,e),r.join("-")}(t,r)),o&&o.css("stroke-dasharray","calc("+(t+.5)+"px) 100")};f()({countNum:Number(t.start)}).animate({countNum:a},{duration:Number(1e3*t.duration),easing:"linear",step:function(){s(this.countNum)},complete:function(){s(a)}})}function ut(){(at=at.filter((function(t){return r=(e=t.elem.getBoundingClientRect()).top,n=e.bottom,!(r>=0&&n<=window.innerHeight&&(ct(t),1));var e,r,n}))).length||document.removeEventListener("scroll",ut)}function lt(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function ft(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function dt(t,e,r){return e&&ft(t.prototype,e),r&&ft(t,r),Object.defineProperty(t,"prototype",{writable:!1}),t}function pt(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}r(7941),r(2526),r(5003),r(9337),r(9720);var ht=function(t,e){return ht=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var r in e)e.hasOwnProperty(r)&&(t[r]=e[r])},ht(t,e)};function vt(t,e){function r(){this.constructor=t}ht(t,e),t.prototype=null===e?Object.create(e):(r.prototype=e.prototype,new r)}function mt(t){return"function"==typeof t}var bt=!1,gt={Promise:void 0,set useDeprecatedSynchronousErrorHandling(t){t&&(new Error).stack,bt=t},get useDeprecatedSynchronousErrorHandling(){return bt}};function yt(t){setTimeout((function(){throw t}),0)}var wt={closed:!0,next:function(t){},error:function(t){if(gt.useDeprecatedSynchronousErrorHandling)throw t;yt(t)},complete:function(){}},_t=function(){return Array.isArray||function(t){return t&&"number"==typeof t.length}}();function zt(t){return null!==t&&"object"==typeof t}var St=function(){function t(t){return Error.call(this),this.message=t?t.length+" errors occurred during unsubscription:\n"+t.map((function(t,e){return e+1+") "+t.toString()})).join("\n  "):"",this.name="UnsubscriptionError",this.errors=t,this}return t.prototype=Object.create(Error.prototype),t}(),xt=function(){function t(t){this.closed=!1,this._parentOrParents=null,this._subscriptions=null,t&&(this._ctorUnsubscribe=!0,this._unsubscribe=t)}return t.prototype.unsubscribe=function(){var e;if(!this.closed){var r=this,n=r._parentOrParents,o=r._ctorUnsubscribe,i=r._unsubscribe,a=r._subscriptions;if(this.closed=!0,this._parentOrParents=null,this._subscriptions=null,n instanceof t)n.remove(this);else if(null!==n)for(var s=0;s<n.length;++s)n[s].remove(this);if(mt(i)){o&&(this._unsubscribe=void 0);try{i.call(this)}catch(t){e=t instanceof St?Et(t.errors):[t]}}if(_t(a)){s=-1;for(var c=a.length;++s<c;){var u=a[s];if(zt(u))try{u.unsubscribe()}catch(t){e=e||[],t instanceof St?e=e.concat(Et(t.errors)):e.push(t)}}}if(e)throw new St(e)}},t.prototype.add=function(e){var r=e;if(!e)return t.EMPTY;switch(typeof e){case"function":r=new t(e);case"object":if(r===this||r.closed||"function"!=typeof r.unsubscribe)return r;if(this.closed)return r.unsubscribe(),r;if(!(r instanceof t)){var n=r;(r=new t)._subscriptions=[n]}break;default:throw new Error("unrecognized teardown "+e+" added to Subscription.")}var o=r._parentOrParents;if(null===o)r._parentOrParents=this;else if(o instanceof t){if(o===this)return r;r._parentOrParents=[o,this]}else{if(-1!==o.indexOf(this))return r;o.push(this)}var i=this._subscriptions;return null===i?this._subscriptions=[r]:i.push(r),r},t.prototype.remove=function(t){var e=this._subscriptions;if(e){var r=e.indexOf(t);-1!==r&&e.splice(r,1)}},t.EMPTY=function(t){return t.closed=!0,t}(new t),t}();function Et(t){return t.reduce((function(t,e){return t.concat(e instanceof St?e.errors:e)}),[])}var kt=function(){return"function"==typeof Symbol?Symbol("rxSubscriber"):"@@rxSubscriber_"+Math.random()}(),At=function(t){function e(r,n,o){var i=t.call(this)||this;switch(i.syncErrorValue=null,i.syncErrorThrown=!1,i.syncErrorThrowable=!1,i.isStopped=!1,arguments.length){case 0:i.destination=wt;break;case 1:if(!r){i.destination=wt;break}if("object"==typeof r){r instanceof e?(i.syncErrorThrowable=r.syncErrorThrowable,i.destination=r,r.add(i)):(i.syncErrorThrowable=!0,i.destination=new Ot(i,r));break}default:i.syncErrorThrowable=!0,i.destination=new Ot(i,r,n,o)}return i}return vt(e,t),e.prototype[kt]=function(){return this},e.create=function(t,r,n){var o=new e(t,r,n);return o.syncErrorThrowable=!1,o},e.prototype.next=function(t){this.isStopped||this._next(t)},e.prototype.error=function(t){this.isStopped||(this.isStopped=!0,this._error(t))},e.prototype.complete=function(){this.isStopped||(this.isStopped=!0,this._complete())},e.prototype.unsubscribe=function(){this.closed||(this.isStopped=!0,t.prototype.unsubscribe.call(this))},e.prototype._next=function(t){this.destination.next(t)},e.prototype._error=function(t){this.destination.error(t),this.unsubscribe()},e.prototype._complete=function(){this.destination.complete(),this.unsubscribe()},e.prototype._unsubscribeAndRecycle=function(){var t=this._parentOrParents;return this._parentOrParents=null,this.unsubscribe(),this.closed=!1,this.isStopped=!1,this._parentOrParents=t,this},e}(xt),Ot=function(t){function e(e,r,n,o){var i,a=t.call(this)||this;a._parentSubscriber=e;var s=a;return mt(r)?i=r:r&&(i=r.next,n=r.error,o=r.complete,r!==wt&&(mt((s=Object.create(r)).unsubscribe)&&a.add(s.unsubscribe.bind(s)),s.unsubscribe=a.unsubscribe.bind(a))),a._context=s,a._next=i,a._error=n,a._complete=o,a}return vt(e,t),e.prototype.next=function(t){if(!this.isStopped&&this._next){var e=this._parentSubscriber;gt.useDeprecatedSynchronousErrorHandling&&e.syncErrorThrowable?this.__tryOrSetError(e,this._next,t)&&this.unsubscribe():this.__tryOrUnsub(this._next,t)}},e.prototype.error=function(t){if(!this.isStopped){var e=this._parentSubscriber,r=gt.useDeprecatedSynchronousErrorHandling;if(this._error)r&&e.syncErrorThrowable?(this.__tryOrSetError(e,this._error,t),this.unsubscribe()):(this.__tryOrUnsub(this._error,t),this.unsubscribe());else if(e.syncErrorThrowable)r?(e.syncErrorValue=t,e.syncErrorThrown=!0):yt(t),this.unsubscribe();else{if(this.unsubscribe(),r)throw t;yt(t)}}},e.prototype.complete=function(){var t=this;if(!this.isStopped){var e=this._parentSubscriber;if(this._complete){var r=function(){return t._complete.call(t._context)};gt.useDeprecatedSynchronousErrorHandling&&e.syncErrorThrowable?(this.__tryOrSetError(e,r),this.unsubscribe()):(this.__tryOrUnsub(r),this.unsubscribe())}else this.unsubscribe()}},e.prototype.__tryOrUnsub=function(t,e){try{t.call(this._context,e)}catch(t){if(this.unsubscribe(),gt.useDeprecatedSynchronousErrorHandling)throw t;yt(t)}},e.prototype.__tryOrSetError=function(t,e,r){if(!gt.useDeprecatedSynchronousErrorHandling)throw new Error("bad call");try{e.call(this._context,r)}catch(e){return gt.useDeprecatedSynchronousErrorHandling?(t.syncErrorValue=e,t.syncErrorThrown=!0,!0):(yt(e),!0)}return!1},e.prototype._unsubscribe=function(){var t=this._parentSubscriber;this._context=null,this._parentSubscriber=null,t.unsubscribe()},e}(At),Tt=function(){return"function"==typeof Symbol&&Symbol.observable||"@@observable"}();function Pt(t){return t}function jt(t){return 0===t.length?Pt:1===t.length?t[0]:function(e){return t.reduce((function(t,e){return e(t)}),e)}}var Ct=function(){function t(t){this._isScalar=!1,t&&(this._subscribe=t)}return t.prototype.lift=function(e){var r=new t;return r.source=this,r.operator=e,r},t.prototype.subscribe=function(t,e,r){var n=this.operator,o=function(t,e,r){if(t){if(t instanceof At)return t;if(t[kt])return t[kt]()}return t||e||r?new At(t,e,r):new At(wt)}(t,e,r);if(n?o.add(n.call(o,this.source)):o.add(this.source||gt.useDeprecatedSynchronousErrorHandling&&!o.syncErrorThrowable?this._subscribe(o):this._trySubscribe(o)),gt.useDeprecatedSynchronousErrorHandling&&o.syncErrorThrowable&&(o.syncErrorThrowable=!1,o.syncErrorThrown))throw o.syncErrorValue;return o},t.prototype._trySubscribe=function(t){try{return this._subscribe(t)}catch(e){gt.useDeprecatedSynchronousErrorHandling&&(t.syncErrorThrown=!0,t.syncErrorValue=e),function(t){for(;t;){var e=t,r=e.closed,n=e.destination,o=e.isStopped;if(r||o)return!1;t=n&&n instanceof At?n:null}return!0}(t)?t.error(e):console.warn(e)}},t.prototype.forEach=function(t,e){var r=this;return new(e=Lt(e))((function(e,n){var o;o=r.subscribe((function(e){try{t(e)}catch(t){n(t),o&&o.unsubscribe()}}),n,e)}))},t.prototype._subscribe=function(t){var e=this.source;return e&&e.subscribe(t)},t.prototype[Tt]=function(){return this},t.prototype.pipe=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return 0===t.length?this:jt(t)(this)},t.prototype.toPromise=function(t){var e=this;return new(t=Lt(t))((function(t,r){var n;e.subscribe((function(t){return n=t}),(function(t){return r(t)}),(function(){return t(n)}))}))},t.create=function(e){return new t(e)},t}();function Lt(t){if(t||(t=gt.Promise||Promise),!t)throw new Error("no Promise impl found");return t}var It=function(){function t(){return Error.call(this),this.message="object unsubscribed",this.name="ObjectUnsubscribedError",this}return t.prototype=Object.create(Error.prototype),t}(),Nt=function(t){function e(e,r){var n=t.call(this)||this;return n.subject=e,n.subscriber=r,n.closed=!1,n}return vt(e,t),e.prototype.unsubscribe=function(){if(!this.closed){this.closed=!0;var t=this.subject,e=t.observers;if(this.subject=null,e&&0!==e.length&&!t.isStopped&&!t.closed){var r=e.indexOf(this.subscriber);-1!==r&&e.splice(r,1)}}},e}(xt),qt=function(t){function e(e){var r=t.call(this,e)||this;return r.destination=e,r}return vt(e,t),e}(At),Mt=function(t){function e(){var e=t.call(this)||this;return e.observers=[],e.closed=!1,e.isStopped=!1,e.hasError=!1,e.thrownError=null,e}return vt(e,t),e.prototype[kt]=function(){return new qt(this)},e.prototype.lift=function(t){var e=new Rt(this,this);return e.operator=t,e},e.prototype.next=function(t){if(this.closed)throw new It;if(!this.isStopped)for(var e=this.observers,r=e.length,n=e.slice(),o=0;o<r;o++)n[o].next(t)},e.prototype.error=function(t){if(this.closed)throw new It;this.hasError=!0,this.thrownError=t,this.isStopped=!0;for(var e=this.observers,r=e.length,n=e.slice(),o=0;o<r;o++)n[o].error(t);this.observers.length=0},e.prototype.complete=function(){if(this.closed)throw new It;this.isStopped=!0;for(var t=this.observers,e=t.length,r=t.slice(),n=0;n<e;n++)r[n].complete();this.observers.length=0},e.prototype.unsubscribe=function(){this.isStopped=!0,this.closed=!0,this.observers=null},e.prototype._trySubscribe=function(e){if(this.closed)throw new It;return t.prototype._trySubscribe.call(this,e)},e.prototype._subscribe=function(t){if(this.closed)throw new It;return this.hasError?(t.error(this.thrownError),xt.EMPTY):this.isStopped?(t.complete(),xt.EMPTY):(this.observers.push(t),new Nt(this,t))},e.prototype.asObservable=function(){var t=new Ct;return t.source=this,t},e.create=function(t,e){return new Rt(t,e)},e}(Ct),Rt=function(t){function e(e,r){var n=t.call(this)||this;return n.destination=e,n.source=r,n}return vt(e,t),e.prototype.next=function(t){var e=this.destination;e&&e.next&&e.next(t)},e.prototype.error=function(t){var e=this.destination;e&&e.error&&this.destination.error(t)},e.prototype.complete=function(){var t=this.destination;t&&t.complete&&this.destination.complete()},e.prototype._subscribe=function(t){return this.source?this.source.subscribe(t):xt.EMPTY},e}(Mt),Dt=function(t){function e(e,r){return t.call(this)||this}return vt(e,t),e.prototype.schedule=function(t,e){return void 0===e&&(e=0),this},e}(xt),Bt=function(t){function e(e,r){var n=t.call(this,e,r)||this;return n.scheduler=e,n.work=r,n.pending=!1,n}return vt(e,t),e.prototype.schedule=function(t,e){if(void 0===e&&(e=0),this.closed)return this;this.state=t;var r=this.id,n=this.scheduler;return null!=r&&(this.id=this.recycleAsyncId(n,r,e)),this.pending=!0,this.delay=e,this.id=this.id||this.requestAsyncId(n,this.id,e),this},e.prototype.requestAsyncId=function(t,e,r){return void 0===r&&(r=0),setInterval(t.flush.bind(t,this),r)},e.prototype.recycleAsyncId=function(t,e,r){if(void 0===r&&(r=0),null!==r&&this.delay===r&&!1===this.pending)return e;clearInterval(e)},e.prototype.execute=function(t,e){if(this.closed)return new Error("executing a cancelled action");this.pending=!1;var r=this._execute(t,e);if(r)return r;!1===this.pending&&null!=this.id&&(this.id=this.recycleAsyncId(this.scheduler,this.id,null))},e.prototype._execute=function(t,e){var r=!1,n=void 0;try{this.work(t)}catch(t){r=!0,n=!!t&&t||new Error(t)}if(r)return this.unsubscribe(),n},e.prototype._unsubscribe=function(){var t=this.id,e=this.scheduler,r=e.actions,n=r.indexOf(this);this.work=null,this.state=null,this.pending=!1,this.scheduler=null,-1!==n&&r.splice(n,1),null!=t&&(this.id=this.recycleAsyncId(e,t,null)),this.delay=null},e}(Dt),Ft=function(t){function e(e,r){var n=t.call(this,e,r)||this;return n.scheduler=e,n.work=r,n}return vt(e,t),e.prototype.schedule=function(e,r){return void 0===r&&(r=0),r>0?t.prototype.schedule.call(this,e,r):(this.delay=r,this.state=e,this.scheduler.flush(this),this)},e.prototype.execute=function(e,r){return r>0||this.closed?t.prototype.execute.call(this,e,r):this._execute(e,r)},e.prototype.requestAsyncId=function(e,r,n){return void 0===n&&(n=0),null!==n&&n>0||null===n&&this.delay>0?t.prototype.requestAsyncId.call(this,e,r,n):e.flush(this)},e}(Bt),Ht=function(){function t(e,r){void 0===r&&(r=t.now),this.SchedulerAction=e,this.now=r}return t.prototype.schedule=function(t,e,r){return void 0===e&&(e=0),new this.SchedulerAction(this,t).schedule(r,e)},t.now=function(){return Date.now()},t}(),Ut=function(t){function e(r,n){void 0===n&&(n=Ht.now);var o=t.call(this,r,(function(){return e.delegate&&e.delegate!==o?e.delegate.now():n()}))||this;return o.actions=[],o.active=!1,o.scheduled=void 0,o}return vt(e,t),e.prototype.schedule=function(r,n,o){return void 0===n&&(n=0),e.delegate&&e.delegate!==this?e.delegate.schedule(r,n,o):t.prototype.schedule.call(this,r,n,o)},e.prototype.flush=function(t){var e=this.actions;if(this.active)e.push(t);else{var r;this.active=!0;do{if(r=t.execute(t.state,t.delay))break}while(t=e.shift());if(this.active=!1,r){for(;t=e.shift();)t.unsubscribe();throw r}}},e}(Ht),Vt=new(function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return vt(e,t),e}(Ut))(Ft),Wt=new Ct((function(t){return t.complete()}));function Yt(t){return t&&"function"==typeof t.schedule}var $t,Gt=function(t){return function(e){for(var r=0,n=t.length;r<n&&!e.closed;r++)e.next(t[r]);e.complete()}};function Jt(t,e){return new Ct((function(r){var n=new xt,o=0;return n.add(e.schedule((function(){o!==t.length?(r.next(t[o++]),r.closed||n.add(this.schedule())):r.complete()}))),n}))}function Kt(t,e){return e?Jt(t,e):new Ct(Gt(t))}function Xt(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];var r=t[t.length-1];return Yt(r)?(t.pop(),Jt(t,r)):Kt(t)}$t||($t={});var Qt=function(){function t(t,e,r){this.kind=t,this.value=e,this.error=r,this.hasValue="N"===t}return t.prototype.observe=function(t){switch(this.kind){case"N":return t.next&&t.next(this.value);case"E":return t.error&&t.error(this.error);case"C":return t.complete&&t.complete()}},t.prototype.do=function(t,e,r){switch(this.kind){case"N":return t&&t(this.value);case"E":return e&&e(this.error);case"C":return r&&r()}},t.prototype.accept=function(t,e,r){return t&&"function"==typeof t.next?this.observe(t):this.do(t,e,r)},t.prototype.toObservable=function(){var t;switch(this.kind){case"N":return Xt(this.value);case"E":return t=this.error,new Ct((function(e){return e.error(t)}));case"C":return function(t){return t?function(t){return new Ct((function(e){return t.schedule((function(){return e.complete()}))}))}(t):Wt}()}throw new Error("unexpected notification kind value")},t.createNext=function(e){return void 0!==e?new t("N",e):t.undefinedValueNotification},t.createError=function(e){return new t("E",void 0,e)},t.createComplete=function(){return t.completeNotification},t.completeNotification=new t("C"),t.undefinedValueNotification=new t("N",void 0),t}(),Zt=function(t){function e(e,r,n){void 0===n&&(n=0);var o=t.call(this,e)||this;return o.scheduler=r,o.delay=n,o}return vt(e,t),e.dispatch=function(t){var e=t.notification,r=t.destination;e.observe(r),this.unsubscribe()},e.prototype.scheduleMessage=function(t){this.destination.add(this.scheduler.schedule(e.dispatch,this.delay,new te(t,this.destination)))},e.prototype._next=function(t){this.scheduleMessage(Qt.createNext(t))},e.prototype._error=function(t){this.scheduleMessage(Qt.createError(t)),this.unsubscribe()},e.prototype._complete=function(){this.scheduleMessage(Qt.createComplete()),this.unsubscribe()},e}(At),te=function(){return function(t,e){this.notification=t,this.destination=e}}(),ee=function(t){function e(e,r,n){void 0===e&&(e=Number.POSITIVE_INFINITY),void 0===r&&(r=Number.POSITIVE_INFINITY);var o=t.call(this)||this;return o.scheduler=n,o._events=[],o._infiniteTimeWindow=!1,o._bufferSize=e<1?1:e,o._windowTime=r<1?1:r,r===Number.POSITIVE_INFINITY?(o._infiniteTimeWindow=!0,o.next=o.nextInfiniteTimeWindow):o.next=o.nextTimeWindow,o}return vt(e,t),e.prototype.nextInfiniteTimeWindow=function(e){if(!this.isStopped){var r=this._events;r.push(e),r.length>this._bufferSize&&r.shift()}t.prototype.next.call(this,e)},e.prototype.nextTimeWindow=function(e){this.isStopped||(this._events.push(new re(this._getNow(),e)),this._trimBufferThenGetEvents()),t.prototype.next.call(this,e)},e.prototype._subscribe=function(t){var e,r=this._infiniteTimeWindow,n=r?this._events:this._trimBufferThenGetEvents(),o=this.scheduler,i=n.length;if(this.closed)throw new It;if(this.isStopped||this.hasError?e=xt.EMPTY:(this.observers.push(t),e=new Nt(this,t)),o&&t.add(t=new Zt(t,o)),r)for(var a=0;a<i&&!t.closed;a++)t.next(n[a]);else for(a=0;a<i&&!t.closed;a++)t.next(n[a].value);return this.hasError?t.error(this.thrownError):this.isStopped&&t.complete(),e},e.prototype._getNow=function(){return(this.scheduler||Vt).now()},e.prototype._trimBufferThenGetEvents=function(){for(var t=this._getNow(),e=this._bufferSize,r=this._windowTime,n=this._events,o=n.length,i=0;i<o&&!(t-n[i].time<r);)i++;return o>e&&(i=Math.max(i,o-e)),i>0&&n.splice(0,i),n},e}(Mt),re=function(){return function(t,e){this.time=t,this.value=e}}(),ne=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return vt(e,t),e.prototype.notifyNext=function(t,e,r,n,o){this.destination.next(e)},e.prototype.notifyError=function(t,e){this.destination.error(t)},e.prototype.notifyComplete=function(t){this.destination.complete()},e}(At),oe=function(t){function e(e,r,n){var o=t.call(this)||this;return o.parent=e,o.outerValue=r,o.outerIndex=n,o.index=0,o}return vt(e,t),e.prototype._next=function(t){this.parent.notifyNext(this.outerValue,t,this.outerIndex,this.index++,this)},e.prototype._error=function(t){this.parent.notifyError(t,this),this.unsubscribe()},e.prototype._complete=function(){this.parent.notifyComplete(this),this.unsubscribe()},e}(At);function ie(){return"function"==typeof Symbol&&Symbol.iterator?Symbol.iterator:"@@iterator"}var ae=ie(),se=function(t){return t&&"number"==typeof t.length&&"function"!=typeof t};function ce(t){return!!t&&"function"!=typeof t.subscribe&&"function"==typeof t.then}var ue=function(t){if(t&&"function"==typeof t[Tt])return n=t,function(t){var e=n[Tt]();if("function"!=typeof e.subscribe)throw new TypeError("Provided object does not correctly implement Symbol.observable");return e.subscribe(t)};if(se(t))return Gt(t);if(ce(t))return r=t,function(t){return r.then((function(e){t.closed||(t.next(e),t.complete())}),(function(e){return t.error(e)})).then(null,yt),t};if(t&&"function"==typeof t[ae])return e=t,function(t){for(var r=e[ae]();;){var n=void 0;try{n=r.next()}catch(e){return t.error(e),t}if(n.done){t.complete();break}if(t.next(n.value),t.closed)break}return"function"==typeof r.return&&t.add((function(){r.return&&r.return()})),t};var e,r,n,o=zt(t)?"an invalid object":"'"+t+"'";throw new TypeError("You provided "+o+" where a stream was expected. You can provide an Observable, Promise, Array, or Iterable.")};function le(t,e,r,n,o){if(void 0===o&&(o=new oe(t,r,n)),!o.closed)return e instanceof Ct?e.subscribe(o):ue(e)(o)}function fe(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e];return function(e){var r;"function"==typeof t[t.length-1]&&(r=t.pop());var n=t;return e.lift(new de(n,r))}}var de=function(){function t(t,e){this.observables=t,this.project=e}return t.prototype.call=function(t,e){return e.subscribe(new pe(t,this.observables,this.project))},t}(),pe=function(t){function e(e,r,n){var o=t.call(this,e)||this;o.observables=r,o.project=n,o.toRespond=[];var i=r.length;o.values=new Array(i);for(var a=0;a<i;a++)o.toRespond.push(a);for(a=0;a<i;a++){var s=r[a];o.add(le(o,s,void 0,a))}return o}return vt(e,t),e.prototype.notifyNext=function(t,e,r){this.values[r]=e;var n=this.toRespond;if(n.length>0){var o=n.indexOf(r);-1!==o&&n.splice(o,1)}},e.prototype.notifyComplete=function(){},e.prototype._next=function(t){if(0===this.toRespond.length){var e=[t].concat(this.values);this.project?this._tryProject(e):this.destination.next(e)}},e.prototype._tryProject=function(t){var e;try{e=this.project.apply(this,t)}catch(t){return void this.destination.error(t)}this.destination.next(e)},e}(ne);function he(t,e){return function(r){if("function"!=typeof t)throw new TypeError("argument is not a function. Are you looking for `mapTo()`?");return r.lift(new ve(t,e))}}var ve=function(){function t(t,e){this.project=t,this.thisArg=e}return t.prototype.call=function(t,e){return e.subscribe(new me(t,this.project,this.thisArg))},t}(),me=function(t){function e(e,r,n){var o=t.call(this,e)||this;return o.project=r,o.count=0,o.thisArg=n||o,o}return vt(e,t),e.prototype._next=function(t){var e;try{e=this.project.call(this.thisArg,t,this.count++)}catch(t){return void this.destination.error(t)}this.destination.next(e)},e}(At),be="1.11.0",ge="object"==typeof self&&self.self===self&&self||"object"==typeof r.g&&r.g.global===r.g&&r.g||Function("return this")()||{},ye=Array.prototype,we=Object.prototype,_e="undefined"!=typeof Symbol?Symbol.prototype:null,ze=ye.push,Se=ye.slice,xe=we.toString,Ee=we.hasOwnProperty,ke="undefined"!=typeof ArrayBuffer,Ae=Array.isArray,Oe=Object.keys,Te=Object.create,Pe=ke&&ArrayBuffer.isView,je=isNaN,Ce=isFinite,Le=!{toString:null}.propertyIsEnumerable("toString"),Ie=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"],Ne=Math.pow(2,53)-1;function qe(t,e){return e=null==e?t.length-1:+e,function(){for(var r=Math.max(arguments.length-e,0),n=Array(r),o=0;o<r;o++)n[o]=arguments[o+e];switch(e){case 0:return t.call(this,n);case 1:return t.call(this,arguments[0],n);case 2:return t.call(this,arguments[0],arguments[1],n)}var i=Array(e+1);for(o=0;o<e;o++)i[o]=arguments[o];return i[e]=n,t.apply(this,i)}}function Me(t){var e=typeof t;return"function"===e||"object"===e&&!!t}function Re(t){return null===t}function De(t){return void 0===t}function Be(t){return!0===t||!1===t||"[object Boolean]"===xe.call(t)}function Fe(t){return!(!t||1!==t.nodeType)}function He(t){return function(e){return xe.call(e)==="[object "+t+"]"}}const Ue=He("String"),Ve=He("Number"),We=He("Date"),Ye=He("RegExp"),$e=He("Error"),Ge=He("Symbol"),Je=He("Map"),Ke=He("WeakMap"),Xe=He("Set"),Qe=He("WeakSet"),Ze=He("ArrayBuffer"),tr=He("DataView"),er=Ae||He("Array");var rr=He("Function"),nr=ge.document&&ge.document.childNodes;"object"!=typeof Int8Array&&"function"!=typeof nr&&(rr=function(t){return"function"==typeof t||!1});const or=rr;function ir(t,e){return null!=t&&Ee.call(t,e)}var ar=He("Arguments");!function(){ar(arguments)||(ar=function(t){return ir(t,"callee")})}();const sr=ar;function cr(t){return!Ge(t)&&Ce(t)&&!isNaN(parseFloat(t))}function ur(t){return Ve(t)&&je(t)}function lr(t){return function(){return t}}function fr(t){return function(e){var r=t(e);return"number"==typeof r&&r>=0&&r<=Ne}}function dr(t){return function(e){return null==e?void 0:e[t]}}const pr=dr("byteLength"),hr=fr(pr);var vr=/\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;const mr=ke?function(t){return Pe?Pe(t)&&!tr(t):hr(t)&&vr.test(xe.call(t))}:lr(!1),br=dr("length"),gr=fr(br);function yr(t,e){e=function(t){for(var e={},r=t.length,n=0;n<r;++n)e[t[n]]=!0;return{contains:function(t){return e[t]},push:function(r){return e[r]=!0,t.push(r)}}}(e);var r=Ie.length,n=t.constructor,o=or(n)&&n.prototype||we,i="constructor";for(ir(t,i)&&!e.contains(i)&&e.push(i);r--;)(i=Ie[r])in t&&t[i]!==o[i]&&!e.contains(i)&&e.push(i)}function wr(t){if(!Me(t))return[];if(Oe)return Oe(t);var e=[];for(var r in t)ir(t,r)&&e.push(r);return Le&&yr(t,e),e}function _r(t){return null==t||(gr(t)&&(er(t)||Ue(t)||sr(t))?0===t.length:0===wr(t).length)}function zr(t,e){var r=wr(e),n=r.length;if(null==t)return!n;for(var o=Object(t),i=0;i<n;i++){var a=r[i];if(e[a]!==o[a]||!(a in o))return!1}return!0}function Sr(t){return t instanceof Sr?t:this instanceof Sr?void(this._wrapped=t):new Sr(t)}function xr(t,e,r,n){if(t===e)return 0!==t||1/t==1/e;if(null==t||null==e)return!1;if(t!=t)return e!=e;var o=typeof t;return("function"===o||"object"===o||"object"==typeof e)&&Er(t,e,r,n)}function Er(t,e,r,n){t instanceof Sr&&(t=t._wrapped),e instanceof Sr&&(e=e._wrapped);var o=xe.call(t);if(o!==xe.call(e))return!1;switch(o){case"[object RegExp]":case"[object String]":return""+t==""+e;case"[object Number]":return+t!=+t?+e!=+e:0==+t?1/+t==1/e:+t==+e;case"[object Date]":case"[object Boolean]":return+t==+e;case"[object Symbol]":return _e.valueOf.call(t)===_e.valueOf.call(e);case"[object ArrayBuffer]":return Er(new DataView(t),new DataView(e),r,n);case"[object DataView]":var i=pr(t);if(i!==pr(e))return!1;for(;i--;)if(t.getUint8(i)!==e.getUint8(i))return!1;return!0}if(mr(t))return Er(new DataView(t.buffer),new DataView(e.buffer),r,n);var a="[object Array]"===o;if(!a){if("object"!=typeof t||"object"!=typeof e)return!1;var s=t.constructor,c=e.constructor;if(s!==c&&!(or(s)&&s instanceof s&&or(c)&&c instanceof c)&&"constructor"in t&&"constructor"in e)return!1}n=n||[];for(var u=(r=r||[]).length;u--;)if(r[u]===t)return n[u]===e;if(r.push(t),n.push(e),a){if((u=t.length)!==e.length)return!1;for(;u--;)if(!xr(t[u],e[u],r,n))return!1}else{var l,f=wr(t);if(u=f.length,wr(e).length!==u)return!1;for(;u--;)if(!ir(e,l=f[u])||!xr(t[l],e[l],r,n))return!1}return r.pop(),n.pop(),!0}function kr(t,e){return xr(t,e)}function Ar(t){if(!Me(t))return[];var e=[];for(var r in t)e.push(r);return Le&&yr(t,e),e}function Or(t){for(var e=wr(t),r=e.length,n=Array(r),o=0;o<r;o++)n[o]=t[e[o]];return n}function Tr(t){for(var e=wr(t),r=e.length,n=Array(r),o=0;o<r;o++)n[o]=[e[o],t[e[o]]];return n}function Pr(t){for(var e={},r=wr(t),n=0,o=r.length;n<o;n++)e[t[r[n]]]=r[n];return e}function jr(t){var e=[];for(var r in t)or(t[r])&&e.push(r);return e.sort()}function Cr(t,e){return function(r){var n=arguments.length;if(e&&(r=Object(r)),n<2||null==r)return r;for(var o=1;o<n;o++)for(var i=arguments[o],a=t(i),s=a.length,c=0;c<s;c++){var u=a[c];e&&void 0!==r[u]||(r[u]=i[u])}return r}}Sr.VERSION=be,Sr.prototype.value=function(){return this._wrapped},Sr.prototype.valueOf=Sr.prototype.toJSON=Sr.prototype.value,Sr.prototype.toString=function(){return String(this._wrapped)};const Lr=Cr(Ar),Ir=Cr(wr),Nr=Cr(Ar,!0);function qr(t){if(!Me(t))return{};if(Te)return Te(t);var e=function(){};e.prototype=t;var r=new e;return e.prototype=null,r}function Mr(t,e){var r=qr(t);return e&&Ir(r,e),r}function Rr(t){return Me(t)?er(t)?t.slice():Lr({},t):t}function Dr(t,e){return e(t),t}function Br(t,e){if(!er(e))return ir(t,e);for(var r=e.length,n=0;n<r;n++){var o=e[n];if(null==t||!Ee.call(t,o))return!1;t=t[o]}return!!r}function Fr(t){return t}function Hr(t){return t=Ir({},t),function(e){return zr(e,t)}}function Ur(t,e){for(var r=e.length,n=0;n<r;n++){if(null==t)return;t=t[e[n]]}return r?t:void 0}function Vr(t){return er(t)?function(e){return Ur(e,t)}:dr(t)}function Wr(t,e,r){if(void 0===e)return t;switch(null==r?3:r){case 1:return function(r){return t.call(e,r)};case 3:return function(r,n,o){return t.call(e,r,n,o)};case 4:return function(r,n,o,i){return t.call(e,r,n,o,i)}}return function(){return t.apply(e,arguments)}}function Yr(t,e,r){return null==t?Fr:or(t)?Wr(t,e,r):Me(t)&&!er(t)?Hr(t):Vr(t)}function $r(t,e){return Yr(t,e,1/0)}function Gr(t,e,r){return Sr.iteratee!==$r?Sr.iteratee(t,e):Yr(t,e,r)}function Jr(t,e,r){e=Gr(e,r);for(var n=wr(t),o=n.length,i={},a=0;a<o;a++){var s=n[a];i[s]=e(t[s],s,t)}return i}function Kr(){}function Xr(t){return null==t?function(){}:function(e){return er(e)?Ur(t,e):t[e]}}function Qr(t,e,r){var n=Array(Math.max(0,t));e=Wr(e,r,1);for(var o=0;o<t;o++)n[o]=e(o);return n}function Zr(t,e){return null==e&&(e=t,t=0),t+Math.floor(Math.random()*(e-t+1))}Sr.iteratee=$r;const tn=Date.now||function(){return(new Date).getTime()};function en(t){var e=function(e){return t[e]},r="(?:"+wr(t).join("|")+")",n=RegExp(r),o=RegExp(r,"g");return function(t){return t=null==t?"":""+t,n.test(t)?t.replace(o,e):t}}const rn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},nn=en(rn),on=en(Pr(rn)),an=Sr.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var sn=/(.)^/,cn={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},un=/\\|'|\r|\n|\u2028|\u2029/g;function ln(t){return"\\"+cn[t]}function fn(t,e,r){!e&&r&&(e=r),e=Nr({},e,Sr.templateSettings);var n,o=RegExp([(e.escape||sn).source,(e.interpolate||sn).source,(e.evaluate||sn).source].join("|")+"|$","g"),i=0,a="__p+='";t.replace(o,(function(e,r,n,o,s){return a+=t.slice(i,s).replace(un,ln),i=s+e.length,r?a+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":n?a+="'+\n((__t=("+n+"))==null?'':__t)+\n'":o&&(a+="';\n"+o+"\n__p+='"),e})),a+="';\n",e.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{n=new Function(e.variable||"obj","_",a)}catch(t){throw t.source=a,t}var s=function(t){return n.call(this,t,Sr)},c=e.variable||"obj";return s.source="function("+c+"){\n"+a+"}",s}function dn(t,e,r){er(e)||(e=[e]);var n=e.length;if(!n)return or(r)?r.call(t):r;for(var o=0;o<n;o++){var i=null==t?void 0:t[e[o]];void 0===i&&(i=r,o=n),t=or(i)?i.call(t):i}return t}var pn=0;function hn(t){var e=++pn+"";return t?t+e:e}function vn(t){var e=Sr(t);return e._chain=!0,e}function mn(t,e,r,n,o){if(!(n instanceof e))return t.apply(r,o);var i=qr(t.prototype),a=t.apply(i,o);return Me(a)?a:i}var bn=qe((function(t,e){var r=bn.placeholder,n=function(){for(var o=0,i=e.length,a=Array(i),s=0;s<i;s++)a[s]=e[s]===r?arguments[o++]:e[s];for(;o<arguments.length;)a.push(arguments[o++]);return mn(t,n,this,this,a)};return n}));bn.placeholder=Sr;const gn=bn,yn=qe((function(t,e,r){if(!or(t))throw new TypeError("Bind must be called on a function");var n=qe((function(o){return mn(t,n,e,this,r.concat(o))}));return n}));function wn(t,e,r,n){if(n=n||[],e||0===e){if(e<=0)return n.concat(t)}else e=1/0;for(var o=n.length,i=0,a=br(t);i<a;i++){var s=t[i];if(gr(s)&&(er(s)||sr(s)))if(e>1)wn(s,e-1,r,n),o=n.length;else for(var c=0,u=s.length;c<u;)n[o++]=s[c++];else r||(n[o++]=s)}return n}const _n=qe((function(t,e){var r=(e=wn(e,!1,!1)).length;if(r<1)throw new Error("bindAll must be passed function names");for(;r--;){var n=e[r];t[n]=yn(t[n],t)}return t}));function zn(t,e){var r=function(n){var o=r.cache,i=""+(e?e.apply(this,arguments):n);return ir(o,i)||(o[i]=t.apply(this,arguments)),o[i]};return r.cache={},r}const Sn=qe((function(t,e,r){return setTimeout((function(){return t.apply(null,r)}),e)})),xn=gn(Sn,Sr,1);function En(t,e,r){var n,o,i,a,s=0;r||(r={});var c=function(){s=!1===r.leading?0:tn(),n=null,a=t.apply(o,i),n||(o=i=null)},u=function(){var u=tn();s||!1!==r.leading||(s=u);var l=e-(u-s);return o=this,i=arguments,l<=0||l>e?(n&&(clearTimeout(n),n=null),s=u,a=t.apply(o,i),n||(o=i=null)):n||!1===r.trailing||(n=setTimeout(c,l)),a};return u.cancel=function(){clearTimeout(n),s=0,n=o=i=null},u}function kn(t,e,r){var n,o,i=function(e,r){n=null,r&&(o=t.apply(e,r))},a=qe((function(a){if(n&&clearTimeout(n),r){var s=!n;n=setTimeout(i,e),s&&(o=t.apply(this,a))}else n=Sn(i,e,this,a);return o}));return a.cancel=function(){clearTimeout(n),n=null},a}function An(t,e){return gn(e,t)}function On(t){return function(){return!t.apply(this,arguments)}}function Tn(){var t=arguments,e=t.length-1;return function(){for(var r=e,n=t[e].apply(this,arguments);r--;)n=t[r].call(this,n);return n}}function Pn(t,e){return function(){if(--t<1)return e.apply(this,arguments)}}function jn(t,e){var r;return function(){return--t>0&&(r=e.apply(this,arguments)),t<=1&&(e=null),r}}const Cn=gn(jn,2);function Ln(t,e,r){e=Gr(e,r);for(var n,o=wr(t),i=0,a=o.length;i<a;i++)if(e(t[n=o[i]],n,t))return n}function In(t){return function(e,r,n){r=Gr(r,n);for(var o=br(e),i=t>0?0:o-1;i>=0&&i<o;i+=t)if(r(e[i],i,e))return i;return-1}}const Nn=In(1),qn=In(-1);function Mn(t,e,r,n){for(var o=(r=Gr(r,n,1))(e),i=0,a=br(t);i<a;){var s=Math.floor((i+a)/2);r(t[s])<o?i=s+1:a=s}return i}function Rn(t,e,r){return function(n,o,i){var a=0,s=br(n);if("number"==typeof i)t>0?a=i>=0?i:Math.max(i+s,a):s=i>=0?Math.min(i+1,s):i+s+1;else if(r&&i&&s)return n[i=r(n,o)]===o?i:-1;if(o!=o)return(i=e(Se.call(n,a,s),ur))>=0?i+a:-1;for(i=t>0?a:s-1;i>=0&&i<s;i+=t)if(n[i]===o)return i;return-1}}const Dn=Rn(1,Nn,Mn),Bn=Rn(-1,qn);function Fn(t,e,r){var n=(gr(t)?Nn:Ln)(t,e,r);if(void 0!==n&&-1!==n)return t[n]}function Hn(t,e){return Fn(t,Hr(e))}function Un(t,e,r){var n,o;if(e=Wr(e,r),gr(t))for(n=0,o=t.length;n<o;n++)e(t[n],n,t);else{var i=wr(t);for(n=0,o=i.length;n<o;n++)e(t[i[n]],i[n],t)}return t}function Vn(t,e,r){e=Gr(e,r);for(var n=!gr(t)&&wr(t),o=(n||t).length,i=Array(o),a=0;a<o;a++){var s=n?n[a]:a;i[a]=e(t[s],s,t)}return i}function Wn(t){var e=function(e,r,n,o){var i=!gr(e)&&wr(e),a=(i||e).length,s=t>0?0:a-1;for(o||(n=e[i?i[s]:s],s+=t);s>=0&&s<a;s+=t){var c=i?i[s]:s;n=r(n,e[c],c,e)}return n};return function(t,r,n,o){var i=arguments.length>=3;return e(t,Wr(r,o,4),n,i)}}const Yn=Wn(1),$n=Wn(-1);function Gn(t,e,r){var n=[];return e=Gr(e,r),Un(t,(function(t,r,o){e(t,r,o)&&n.push(t)})),n}function Jn(t,e,r){return Gn(t,On(Gr(e)),r)}function Kn(t,e,r){e=Gr(e,r);for(var n=!gr(t)&&wr(t),o=(n||t).length,i=0;i<o;i++){var a=n?n[i]:i;if(!e(t[a],a,t))return!1}return!0}function Xn(t,e,r){e=Gr(e,r);for(var n=!gr(t)&&wr(t),o=(n||t).length,i=0;i<o;i++){var a=n?n[i]:i;if(e(t[a],a,t))return!0}return!1}function Qn(t,e,r,n){return gr(t)||(t=Or(t)),("number"!=typeof r||n)&&(r=0),Dn(t,e,r)>=0}const Zn=qe((function(t,e,r){var n,o;return or(e)?o=e:er(e)&&(n=e.slice(0,-1),e=e[e.length-1]),Vn(t,(function(t){var i=o;if(!i){if(n&&n.length&&(t=Ur(t,n)),null==t)return;i=t[e]}return null==i?i:i.apply(t,r)}))}));function to(t,e){return Vn(t,Vr(e))}function eo(t,e){return Gn(t,Hr(e))}function ro(t,e,r){var n,o,i=-1/0,a=-1/0;if(null==e||"number"==typeof e&&"object"!=typeof t[0]&&null!=t)for(var s=0,c=(t=gr(t)?t:Or(t)).length;s<c;s++)null!=(n=t[s])&&n>i&&(i=n);else e=Gr(e,r),Un(t,(function(t,r,n){((o=e(t,r,n))>a||o===-1/0&&i===-1/0)&&(i=t,a=o)}));return i}function no(t,e,r){var n,o,i=1/0,a=1/0;if(null==e||"number"==typeof e&&"object"!=typeof t[0]&&null!=t)for(var s=0,c=(t=gr(t)?t:Or(t)).length;s<c;s++)null!=(n=t[s])&&n<i&&(i=n);else e=Gr(e,r),Un(t,(function(t,r,n){((o=e(t,r,n))<a||o===1/0&&i===1/0)&&(i=t,a=o)}));return i}function oo(t,e,r){if(null==e||r)return gr(t)||(t=Or(t)),t[Zr(t.length-1)];var n=gr(t)?Rr(t):Or(t),o=br(n);e=Math.max(Math.min(e,o),0);for(var i=o-1,a=0;a<e;a++){var s=Zr(a,i),c=n[a];n[a]=n[s],n[s]=c}return n.slice(0,e)}function io(t){return oo(t,1/0)}function ao(t,e,r){var n=0;return e=Gr(e,r),to(Vn(t,(function(t,r,o){return{value:t,index:n++,criteria:e(t,r,o)}})).sort((function(t,e){var r=t.criteria,n=e.criteria;if(r!==n){if(r>n||void 0===r)return 1;if(r<n||void 0===n)return-1}return t.index-e.index})),"value")}function so(t,e){return function(r,n,o){var i=e?[[],[]]:{};return n=Gr(n,o),Un(r,(function(e,o){var a=n(e,o,r);t(i,e,a)})),i}}const co=so((function(t,e,r){ir(t,r)?t[r].push(e):t[r]=[e]})),uo=so((function(t,e,r){t[r]=e})),lo=so((function(t,e,r){ir(t,r)?t[r]++:t[r]=1})),fo=so((function(t,e,r){t[r?0:1].push(e)}),!0);var po=/[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;function ho(t){return t?er(t)?Se.call(t):Ue(t)?t.match(po):gr(t)?Vn(t,Fr):Or(t):[]}function vo(t){return null==t?0:gr(t)?t.length:wr(t).length}function mo(t,e,r){return e in r}const bo=qe((function(t,e){var r={},n=e[0];if(null==t)return r;or(n)?(e.length>1&&(n=Wr(n,e[1])),e=Ar(t)):(n=mo,e=wn(e,!1,!1),t=Object(t));for(var o=0,i=e.length;o<i;o++){var a=e[o],s=t[a];n(s,a,t)&&(r[a]=s)}return r})),go=qe((function(t,e){var r,n=e[0];return or(n)?(n=On(n),e.length>1&&(r=e[1])):(e=Vn(wn(e,!1,!1),String),n=function(t,r){return!Qn(e,r)}),bo(t,n,r)}));function yo(t,e,r){return Se.call(t,0,Math.max(0,t.length-(null==e||r?1:e)))}function wo(t,e,r){return null==t||t.length<1?null==e||r?void 0:[]:null==e||r?t[0]:yo(t,t.length-e)}function _o(t,e,r){return Se.call(t,null==e||r?1:e)}function zo(t,e,r){return null==t||t.length<1?null==e||r?void 0:[]:null==e||r?t[t.length-1]:_o(t,Math.max(0,t.length-e))}function So(t){return Gn(t,Boolean)}function xo(t,e){return wn(t,e,!1)}const Eo=qe((function(t,e){return e=wn(e,!0,!0),Gn(t,(function(t){return!Qn(e,t)}))})),ko=qe((function(t,e){return Eo(t,e)}));function Ao(t,e,r,n){Be(e)||(n=r,r=e,e=!1),null!=r&&(r=Gr(r,n));for(var o=[],i=[],a=0,s=br(t);a<s;a++){var c=t[a],u=r?r(c,a,t):c;e&&!r?(a&&i===u||o.push(c),i=u):r?Qn(i,u)||(i.push(u),o.push(c)):Qn(o,c)||o.push(c)}return o}const Oo=qe((function(t){return Ao(wn(t,!0,!0))}));function To(t){for(var e=[],r=arguments.length,n=0,o=br(t);n<o;n++){var i=t[n];if(!Qn(e,i)){var a;for(a=1;a<r&&Qn(arguments[a],i);a++);a===r&&e.push(i)}}return e}function Po(t){for(var e=t&&ro(t,br).length||0,r=Array(e),n=0;n<e;n++)r[n]=to(t,n);return r}const jo=qe(Po);function Co(t,e){for(var r={},n=0,o=br(t);n<o;n++)e?r[t[n]]=e[n]:r[t[n][0]]=t[n][1];return r}function Lo(t,e,r){null==e&&(e=t||0,t=0),r||(r=e<t?-1:1);for(var n=Math.max(Math.ceil((e-t)/r),0),o=Array(n),i=0;i<n;i++,t+=r)o[i]=t;return o}function Io(t,e){if(null==e||e<1)return[];for(var r=[],n=0,o=t.length;n<o;)r.push(Se.call(t,n,n+=e));return r}function No(t,e){return t._chain?Sr(e).chain():e}function qo(t){return Un(jr(t),(function(e){var r=Sr[e]=t[e];Sr.prototype[e]=function(){var t=[this._wrapped];return ze.apply(t,arguments),No(this,r.apply(Sr,t))}})),Sr}Un(["pop","push","reverse","shift","sort","splice","unshift"],(function(t){var e=ye[t];Sr.prototype[t]=function(){var r=this._wrapped;return null!=r&&(e.apply(r,arguments),"shift"!==t&&"splice"!==t||0!==r.length||delete r[0]),No(this,r)}})),Un(["concat","join","slice"],(function(t){var e=ye[t];Sr.prototype[t]=function(){var t=this._wrapped;return null!=t&&(t=e.apply(t,arguments)),No(this,t)}}));const Mo=Sr;var Ro=qo(n);function Do(t){switch(t.type){case"cart":case"account":return{id:t.id,widgetType:"ProductBrowser",arg:["id=".concat(t.id)]};case"product":return{id:t.id,widgetType:"ProductBrowser",arg:["id=".concat(t.id),"productId=".concat(t.args.id)]};case"CATEGORY":return{id:t.id,widgetType:"ProductBrowser",arg:["id=".concat(t.id),"categoryId=".concat(t.args.categoryId)]}}}Ro._=Ro;var Bo=function(t,e,r){var n=t.querySelector(e);if(n&&n.parentNode){var o=n.parentNode,i=o.cloneNode(!0);if(o.parentNode&&o.parentNode.replaceChild(i,o),i){var a=i.querySelector(e);a&&(a.href=r)}}};function Fo(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function Ho(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?Fo(Object(r),!0).forEach((function(e){pt(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Fo(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}var Uo=0,Vo=!1,Wo=function(t){return new MutationObserver((function(){return function(t){if(Vo||Uo>=10)return!0;switch(t){case"myAccount":(e=document.querySelector(".ec-store__account-page .ec-footer"))&&e.children.length>0&&(Bo(e,".footer__link--my-account","/shop/my-account"),Bo(e,".footer__link--favorites","/my-account/favorites"),Bo(e,".footer__link--track-order","/shop/track-orders"),Bo(e,".footer__link--shopping-cart","/shop/cart"),Vo=!0);break;case"shoppingBag":!function(){var t=document.querySelector(".ec-minicart .ec-minicart__body");if(t&&t.parentNode){var e=t.cloneNode(!0);t.parentNode.replaceChild(e,t),e&&(e.addEventListener("click",(function(t){window.location.replace("/shop/cart"),t.stopPropagation()})),Vo=!0)}}()}var e;Uo++}(t)}))},Yo={redirect:{fromFooter:{"/shop/my-account":".footer__link--my-account","/shop/track-orders":".footer__link--track-order","/my-account/favorites":".footer__link--favorites","/shop/cart":".footer__link--shopping-cart"},fromContent:{"/shop/cart":".details-product-purchase__checkout","/my-account/thank-you":".ec-form .form-control--done"}}},$o={"/shop/my-account":"/shop/my-account","/shop/track-orders":"/shop/track-orders","/my-account/favorites":"/my-account/favorites","/shop/cart":"/shop/cart"},Go={"/shop/cart":"/shop/cart","/my-account/thank-you":"/my-account/thank-you"},Jo=function(){function t(e,r){lt(this,t),this.storeId=e,pt(this,"$load",void 0),pt(this,"$widgets",void 0),pt(this,"config",void 0),this.$load=new ee,this.$widgets=new Mt,this.config=Ho(Ho({},Yo),r),window.ec=window.ec||{},window.ec.config=window.ec.config||{},window.ec.config.storefrontUrls=window.ec.config.storefrontUrls||{},window.ec.config.storefrontUrls.cleanUrls=!0,window.ec.config.baseUrl="/",window.ec.storefront=Ho(Ho({},window.ec.storefront),r),this.$load.pipe(fe(this.$widgets),he((function(t){return x(t,2)[1]}))).subscribe((function(t){return Ecwid.openPage(t.type,t.args)}))}return dt(t,[{key:"loadScripts",value:function(t){var e=this;if(document.getElementById("ecwid-script"))"function"==typeof ecwid_onBodyDone&&ecwid_onBodyDone();else{window.ecwid_script_defer=!0,window.ecwid_dynamic_widgets=!0;var r=document.createElement("script");r.id="ecwid-script",r.src="https://app.ecwid.com/script.js?".concat(this.storeId,"&data_platform=code"),r.type="text/javascript",r.onload=function(){Ecwid.OnAPILoaded.add((function(){e.$load.next()})),Ecwid.OnPageLoaded.add((function(){"function"==typeof e.config.onPageLoaded&&e.config.onPageLoaded(),e.config.redirect&&t&&e.changeRedirectLinks(t),Ecwid&&Ecwid.resizeProductBrowser&&Ecwid.resizeProductBrowser(),window&&window.pathBeforeEcwidChange&&window.location.pathname!==window.pathBeforeEcwidChange&&e.config.restoreUrl&&window.history.pushState({},"",window.pathBeforeEcwidChange)}))},document.body.append(r)}}},{key:"openPage",value:function(t,e){this.addWidget(t),this.loadScripts(e),this.$widgets.next(t)}},{key:"setId",value:function(t){var e=t.id||hn("ecwid-widget-");return t.id||(t.id=e),t}},{key:"addWidget",value:function(t){var e=[Do(t)];"undefined"!=typeof Ecwid&&Ecwid.destroy&&Ecwid.destroy(),window._xnext_initialization_scripts=e}},{key:"products",value:function(t){var e=this.setId(t);this.openPage({id:e.id,args:{categoryId:0},type:"CATEGORY"},t)}},{key:"product",value:function(t,e){var r=this.setId(e);this.openPage(function(t,e){return{id:t,type:"product",args:{id:e}}}(r.id,t),e)}},{key:"cart",value:function(t){window.pathBeforeEcwidChange=window.location.pathname;var e=this.setId(t);this.openPage({id:e.id,type:"cart",args:{}},t)}},{key:"shoppingCart",value:function(t){this.loadScripts(t),this.$load.subscribe((function(){Ecwid.init(),t&&Wo("shoppingBag").observe(t,{attributes:!0,subtree:!0})}))}},{key:"myAccount",value:function(t){window.pathBeforeEcwidChange=window.location.pathname;var e=this.setId(t);this.openPage({id:e.id,args:{},type:"account"},t),Wo("myAccount").observe(t,{attributes:!0,subtree:!0})}},{key:"updateConfig",value:function(t){var e,r,n,o;this.config=t,window.ec=null!==(e=window.ec)&&void 0!==e?e:{},window.ec.storefront=Ho(Ho({},null===(r=window.ec)||void 0===r?void 0:r.storefront),t),null===(n=(o=Ecwid).refreshConfig)||void 0===n||n.call(o)}},{key:"changeRedirectLinks",value:function(t){this.config.redirect&&(this.config.redirect.fromContent&&Object.entries(this.config.redirect.fromContent).forEach((function(e){var r=x(e,2),n=r[0],o=r[1];!function(t,e,r){var n=t.querySelector(e);if(n&&n.parentNode){var o=n.cloneNode(!0);n.parentNode.replaceChild(o,n);var i=t.querySelector("".concat(e," >  button"));i&&i.addEventListener("click",(function(t){window.location.replace(r),t.stopPropagation()}))}}(t,o,Go[n])})),this.config.redirect.fromFooter&&Object.entries(this.config.redirect.fromFooter).forEach((function(e){var r=x(e,2),n=r[0],o=r[1];Bo(t,o,$o[n])})))}},{key:"getConfig",value:function(){return this.config}}],[{key:"init",value:function(e,r){if(t.instances.has(e))return t.instances.get(e);var n=new t(e,r);return t.instances.set(e,n),n}}]),t}();pt(Jo,"instances",new Map);var Ko=function(t){if("string"==typeof t)try{return JSON.parse(t)}catch(t){return}},Xo=function(t){t.find(".brz-ecwid-products").each((function(t,e){var r,n=e.getAttribute("data-store-id"),o=Ko(decodeURIComponent(null!==(r=e.getAttribute("data-storefront"))&&void 0!==r?r:""));n&&Jo.init(n,null!=o?o:{}).products(e)}))},Qo=function(t){switch(d(t)){case"string":var e=""!==t?Number(t):NaN;return isNaN(e)?void 0:e;case"number":return isNaN(t)?void 0:t;default:return}};function Zo(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}var ti=function(t){t.find(".brz-ecwid-product").each((function(t,e){var r,n=e.getAttribute("data-store-id"),o=function(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?Zo(Object(r),!0).forEach((function(e){pt(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Zo(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}({},Ko(decodeURIComponent(null!==(r=e.getAttribute("data-storefront"))&&void 0!==r?r:""))),i=Qo(e.getAttribute("data-product-id")),a=Qo(e.getAttribute("data-default-product-id")),s=null!=i?i:a;s&&n&&Jo.init(n,null!=o?o:{}).product(s,e)}))},ei=function(t){t.find(".brz-ecwid-cart").each((function(t,e){var r=e.getAttribute("data-store-id");r&&Jo.init(r,{restoreUrl:!0}).cart(e)}))},ri=function(t){t.find(".brz-ecwid-my-account").each((function(t,e){var r=e.getAttribute("data-store-id");r&&Jo.init(r,{restoreUrl:!0}).myAccount(e)}))},ni=function(t){t.find(".brz-ecwid-shopping-bag").each((function(t,e){var r=e.getAttribute("data-store-id");r&&Jo.init(r,{}).shoppingCart(e)}))};function oi(t){var e=t.get(0),n=e.querySelectorAll(".brz-g-recaptcha");n.length&&(function(){var t="brz-recaptcha__script";if(!document.getElementById(t)){var e=document.createElement("script");e.setAttribute("src","https://www.google.com/recaptcha/api.js?onload=brzOnloadRecaptchaCallback&render=explicit"),e.setAttribute("async","async"),e.setAttribute("defer","defer"),e.setAttribute("id",t),document.body.append(e)}}(),r.g.brzFormV1Captcha=function(t){var n=e.querySelector("[data-form-version='1'].brz-forms--pending");if(n){var o=ui(n),i=[].concat(S(o),[{name:"g-recaptcha-response",value:t}]);ci(n,i).then((function(){n.classList.remove("brz-forms--pending");var t=n.querySelector(".brz-g-recaptcha").getAttribute("recaptchaId");r.g.grecaptcha.reset(t)}))}},r.g.brzOnloadRecaptchaCallback=function(){n.forEach((function(t){var e=t.dataset,n=e.sitekey,o=e.size,i=e.callback,a=r.g.grecaptcha.render(t,{sitekey:n,size:o,callback:i});t.setAttribute("recaptchaId",a)}))}),e.querySelectorAll("[data-form-version='1']").forEach(si)}function ii(t){var e=t.value,r=t.required,n=t.getAttribute("pattern")||"",o=new RegExp(n).test(e),i=t.closest(".brz-forms__item"),a=!0;return null!==i&&(i.classList.remove("brz-forms__item--error","brz-forms__item--error-pattern","brz-forms__item--error-required"),!r||e&&o||(i.classList.add("brz-forms__item--error","brz-forms__item--error-required"),a=!1),e.length&&!o&&(i.classList.add("brz-form__item--error","brz-form__item--error-pattern"),a=!1),a)}function ai(t){var e=!0;return t.querySelectorAll("input[pattern], textarea[pattern], input[required], textarea[required]").forEach((function(t){ii(t)||(e=!1)})),e}function si(t){var e=f()(t);e.on("blur","form input, form textarea",(function(){ii(this)})),e.on("click","form .brz-control__select .brz-control__select-option",(function(){ii(f()(this).closest(".brz-control__select").find("input").get(0))}));var n=t.querySelector(".brz-g-recaptcha");n?e.on("submit","form",(function(e){if(e.preventDefault(),ai(t)){t.classList.add("brz-forms--pending");var o=n.getAttribute("recaptchaId");r.g.grecaptcha.execute(o)}})):e.on("submit","form",(function(e){if(e.preventDefault(),ai(t)){var r=ui(t);ci(t,r)}}))}function ci(t,e){!function(t){var e=t.querySelector(".brz-forms__alert");e&&e.remove(),t.classList.remove("brz-forms__send--empty","brz-forms__send--success","brz-forms__send--fail")}(t);var r=t.querySelector(".brz-btn");r.classList.add("brz-blocked");var n=t.querySelector("form.brz-form");if(n){var o=n.dataset,i=o.projectId,a=o.formId,s=o.success,c=o.error,u=o.redirect,l=n.getAttribute("action"),d=function(){t.classList.add("brz-form__send--fail"),fi(t,li("error",c))},p={done:function(e){var r=(e||{}).success;!1===(void 0===r?void 0:r)?d():(fi(t,li("success",s)),""!==u&&window.location.replace(u),function(t){t.querySelectorAll(".brz-forms__item").forEach((function(t){t.querySelectorAll("input, textarea, select").forEach((function(t){t.value="",t.dispatchEvent(new Event("change",{bubbles:!0}))}))}))}(t))},error:d,always:function(){r.classList.remove("brz-blocked")}};return function(t,e,r){var n=r.done,o=r.error,i=r.always;return f().ajax({type:"POST",url:t,data:e}).done(n).fail(o).always(i)}(l,{data:JSON.stringify(e),project_id:i,form_id:a},p)}}function ui(t){var e=[];return t.querySelectorAll(".brz-forms__fields input,  .brz-forms__fields textarea").forEach((function(t){var r=t.dataset,n=r.type,o=r.label,i=t.getAttribute("name"),a=t.value,s=t.required;e.push({name:i,value:a,required:s,type:n,label:o})})),e}function li(t,e){switch(t){case"success":var r=document.createElement("div");return r.className="brz-forms__alert brz-forms__alert--success",r.innerHTML=e||"Your email was sent successfully",r;case"error":var n=document.createElement("div");return n.className="brz-forms__alert brz-forms__alert--error",n.innerHTML=e||"Your email was not sent",n}}function fi(t,e){t.appendChild(e)}r(4603),r(8450),r(8386),r(8309),r(4723),r(1817),r(2165),r(4048);function di(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(t){if("string"==typeof t)return pi(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?pi(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,s=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return a=t.done,t},e:function(t){s=!0,i=t},f:function(){try{a||null==r.return||r.return()}finally{if(s)throw i}}}}function pi(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}var hi,vi=!0;function mi(t){var e=t.get(0),n=e.querySelectorAll(".brz-g-recaptcha");n.length&&(function(){var t="brz-recaptcha__script";if(!document.getElementById(t)){var e=document.createElement("script");e.setAttribute("src","https://www.google.com/recaptcha/api.js?onload=brzOnloadRecaptchaCallback&render=explicit"),e.setAttribute("async","async"),e.setAttribute("defer","defer"),e.setAttribute("id",t),document.body.append(e)}}(),r.g.brzFormV2Captcha=function(t){var n=e.querySelector("[data-form-version='2'].brz-forms2--pending");if(n){var o=zi(n),i=[{name:"g-recaptcha-response",value:t}],a={formData:o.formData,data:o.data.concat(i)};_i(n,a).then((function(){n.classList.remove("brz-forms2--pending");var t=n.querySelector(".brz-g-recaptcha").getAttribute("recaptchaId");r.g.grecaptcha.reset(t)}))}},r.g.brzOnloadRecaptchaCallback=function(){n.forEach((function(t){var e=t.dataset,n=e.sitekey,o=e.size,i=e.callback,a=r.g.grecaptcha.render(t,{sitekey:n,size:o,callback:i});t.setAttribute("recaptchaId",a)}))}),e.querySelectorAll("[data-form-version='2']").forEach(yi),e.querySelectorAll(".brz-forms2__field-date").forEach((function(t){var e=t.dataset,r=e.min,n=e.max,o="true"===e.native,i=s().Flatpickr;!o&&i?i(t,{minDate:r,maxDate:n,disableMobile:!0}):(t.setAttribute("min",r),t.setAttribute("max",n))})),e.querySelectorAll(".brz-forms2__field-time").forEach((function(t){var e=t.dataset,r=e.min,n=e.max,o="true"===e.native,i=s().Flatpickr;!o&&i?i(t,{minDate:r,maxDate:n,enableTime:!0,noCalendar:!0,disableMobile:!0}):(t.setAttribute("min",r),t.setAttribute("max",n))})),e.querySelectorAll(".brz-forms2__field-select").forEach((function(t){var e,r=f()(t),n=r.find(".brz-select"),o=n.get(0).multiple,i=n.data("placeholder"),a=n.data("max-item-dropdown"),c=!1;n.select2({width:"100%",minimumResultsForSearch:1/0,dropdownParent:r,templateSelection:function(t){return i||c?t.text:""}}),n.on("select2:opening",(function(){setTimeout((function(){var t=r.find(".select2-dropdown"),n=parseInt(t.find(".select2-results__options .select2-results__option").css("height")),i=s().Scrollbars;if(t.css("maxHeight",n*a),t.length&&i){var c=t.get(0);e=new i(c)}o&&r.addClass("brz-forms2__field-select--multiple--opened")}),0)})),n.on("select2:close",(function(){e&&(e.destroy(),e=null),o&&r.removeClass("brz-forms2__field-select--multiple--opened")})),c=!0}))}function bi(t){var e,r=t.closest(".brz-form"),n=t.closest(".brz-forms2__item"),o=t.value,i=t.dataset,a=t.required,s=i.type,c=i.error,u=i.fileMaxSize,l=c?H(c):null,f=t.getAttribute("pattern"),d=null==(e=f)||"number"==typeof e&&Number.isNaN(e)||new RegExp(f).test(o),p=!0;if(n.classList.remove("brz-forms2__item--error","brz-forms2__item--error-pattern","brz-forms2__item--error-required"),!a||o&&d||(n.classList.add("brz-forms2__item--error","brz-forms2__item--error-required"),p=!1),o.length&&!d&&(n.classList.add("brz-forms2__item--error","brz-forms2__item--error-pattern"),p=!1),"Number"===s){var h=i.min,v=i.max,m=Number(o);Boolean(o)&&m<h&&""!==h&&(Ei(r,Si("error","".concat((null==l?void 0:l.minNumError)||"Selected quantity is less than stock status, min:"," ").concat(h))),n.classList.add("brz-forms2__item--error","brz-forms2__item--error-pattern"),p=!1),Boolean(o)&&m>v&&""!==v&&(Ei(r,Si("error","".concat((null==l?void 0:l.maxNumError)||"Selected quantity is more than stock status, max:"," ").concat(v))),n.classList.add("brz-forms2__item--error","brz-forms2__item--error-pattern"),p=!1)}if("FileUpload"===s){var b,g=t.files,y=parseInt(t.dataset.fileMaxSize)||1,w=t.getAttribute("accept")?t.getAttribute("accept").replace(/\s+/g,"").toLowerCase().split(","):[],_=!1,z=!1,E=di(g);try{for(E.s();!(b=E.n()).done;){var k=b.value,A=k.name,O=k.size,T=x(A.match(/\.([^\.]+)$/),1)[0];_=O/1048576>=y,T&&(z=w.length&&!w.includes(T.toLowerCase()))}}catch(t){E.e(t)}finally{E.f()}if(_&&(p=!1,n.classList.add("brz-forms2__item--error","brz-forms2__item--error-pattern"),Ei(r,Si("error","".concat((null==l?void 0:l.fileMaxSizeError)||"This file exceeds the maximum allowed size."," ").concat(u)))),z){p=!1,n.classList.add("brz-forms2__item--error","brz-forms2__item--error-pattern");var P=w.map((function(t){return t.replace(".","")})).join(", ");Ei(r,Si("error","".concat((null==l?void 0:l.fileTypeError)||"Only files with the following extensions are allowed:"," ").concat(P)))}}var j=t.closest(".brz-forms2__field-select");if(j){var C=j.querySelector(".brz-select"),L=C.multiple,I=C.value;if(L){var N=C.querySelectorAll("option:checked");0===Array.from(N).map((function(t){return t.value})).length&&(n.classList.add("brz-forms2__item--error","brz-forms2__item--error-required"),p=!1)}else" "===I&&(n.classList.add("brz-forms2__item--error","brz-forms2__item--error-required"),p=!1)}return a&&"Checkbox"===s&&!S(n.querySelectorAll("input")).some((function(t){return t.checked}))&&(n.classList.add("brz-forms2__item--error","brz-forms2__item--error-required"),p=!1),p}function gi(t){var e=t.querySelectorAll("input[pattern], textarea[pattern], input[required], textarea[required], input[type='file'], select[required]"),r=!0;return e.forEach((function(t){bi(t)||(r=!1)})),r}function yi(t){var e=f()(t),n=t.querySelector(".brz-btn"),o=t.querySelector(".brz-form-spinner");n&&o&&n.appendChild(o),function(t){t.querySelectorAll("input[pattern], textarea[pattern]").forEach((function(t){var e=t.getAttribute("pattern");e&&t.setAttribute("pattern",decodeURI(e))}))}(t),e.on("blur","form input, form textarea, form select",(function(){bi(this)}));var i=t.querySelector(".brz-g-recaptcha");i?e.on("submit","form",(function(e){if(e.preventDefault(),gi(t)){t.classList.add("brz-forms2--pending");var n=i.getAttribute("recaptchaId");r.g.grecaptcha.execute(n)}})):e.on("submit","form",(function(e){if(e.preventDefault(),vi){if(!gi(t))return;var r=zi(t);_i(t,r),vi=!1}}))}function wi(t,e){if(t.children.length){var r=Array.from(t.children),n=r.find((function(t){return t.classList.contains("brz-form-spinner")}));e?(t.classList.add("brz-blocked"),r.forEach((function(t){t.classList.add("brz-invisible")})),n&&n.classList.remove("brz-invisible")):(t.classList.remove("brz-blocked"),r.forEach((function(t){t.classList.remove("brz-invisible")})),n&&n.classList.add("brz-invisible"),vi=!0)}}function _i(t,e){xi(t);var r=t.querySelector(".brz-btn");wi(r,!0);var n=t.querySelector("form.brz-form");if(n){var o=n.dataset,i=o.projectId,a=o.formId,s=o.redirect,c=o.success,u=o.error,l=n.getAttribute("action"),d=e.formData,p=e.data;d.append("data",JSON.stringify(p)),d.append("project_id",i),d.append("form_id",a);var h=function(){t.classList.add("brz-forms2__send--fail"),Ei(n,Si("error",u))},v={done:function(e){var r=(e||{}).success;!1===(void 0===r?void 0:r)?h():(Ei(n,Si("success",c)),""!==s&&window.location.replace(s),function(t){t.querySelectorAll(".brz-forms2__item").forEach((function(t){t.querySelectorAll("input, textarea, select").forEach((function(t,e){switch(t.type){case"radio":t.checked=0===e;break;case"checkbox":t.checked=!1;break;default:t.value=""}t.dispatchEvent(new Event("change",{bubbles:!0}))}))}))}(t))},error:h,always:function(){wi(r,!1)}};return function(t,e,r){var n=r.done,o=r.error,i=r.always;return f().ajax({type:"POST",processData:!1,contentType:!1,url:t,data:e}).done(n).fail(o).always(i)}(l,d,v)}}function zi(t){var e=new FormData,r=[];return t.querySelectorAll(".brz-forms2__item:not(.brz-forms2__item-button)").forEach((function(t){var n=t.querySelectorAll("input, textarea, select");if(0!==n.length){var o={};if(t.querySelector(".brz-forms2__checkbox, .brz-forms2__radio")&&n.length>1){var i=[];n.forEach((function(t){var e=t.name,r=t.required,n=t.type,a=t.checked,s=t.value,c=t.dataset;a&&i.push(s),o.name=e,o.required=r,o.type=n,o.label=c.label})),o.value=i.join(",")}else{var a=x(n,1)[0],s=a.getAttribute("name"),c=a.dataset,u=c.type,l=c.label,f=c.placeholder,d=a.required,p=a.value;if(o.name=s,o.value=p,o.required=d,o.type=u,o.label=l,"FileUpload"===u){var h,v=di(a.files);try{for(v.s();!(h=v.n()).done;){var m=h.value;e.append("".concat(s,"[]"),m,m.name)}}catch(t){v.e(t)}finally{v.f()}o.maxSize=parseInt(a.dataset.fileMaxSize),o.extensions=a.getAttribute("accept")}if("Select"===u&&a.multiple){var b=a.querySelectorAll("option:checked"),g=Array.from(b).map((function(t){return t.value}));o.value=g.join(",")}"Hidden"===u&&(o.value=f||l)}r.push(o)}})),{data:r,formData:e}}function Si(t,e){var r=document.createElement("div");return r.className="brz-forms2__alert brz-forms2__alert--".concat(t),r.innerHTML=e||{success:"Your email was sent successfully",error:"Your email was not sent",empty:"Please check your entry and try again"}[t],r}function xi(t){var e=t.querySelector(".brz-forms2__alert");e&&e.remove(),t.classList.remove("brz-forms2__send--empty","brz-forms2__send--success","brz-forms2__send--fail")}function Ei(t,e){xi(t),t.appendChild(e)}function ki(t){t.find(".brz-input__upload").each((function(){var t=f()(this),e=t.children(".brz-input"),r=t.find(".brz-button"),n=t.find(".brz-span");e.on("change",(function(){var o=e[0].files[0],i=t.find(".brz-input__upload-delete");o&&o.name?(n.text(o.name),r.addClass("brz-hidden"),i.removeClass("brz-hidden"),e.prop("disabled",!0)):Ai(t),i.on("click",(function(){return Ai(t)}))}))}))}function Ai(t){var e=t.children(".brz-input");t.find(".brz-span").text(e.data("placeholder")),e.val(""),t.find(".brz-button").removeClass("brz-hidden"),t.find(".brz-input__upload-delete").addClass("brz-hidden"),setTimeout((function(){e.prop("disabled",!1)}),500)}function Oi(t){t.find(".brz-image__lightbox").each((function(){f()(this).magnificPopup({delegate:"a",type:"image",closeOnContentClick:!0})}))}!function(t){t.login="login",t.register="register",t.forgot="forgot",t.authorized="authorized"}(hi||(hi={}));var Ti,Pi=function(t,e){t.setAttribute("style","display: ".concat(e,";"))},ji=function(t,e){return t.querySelectorAll(e)},Ci=function(t,e){return ji(t,e)[0]},Li=function(t,e,r){(e||["An error has occured."]).forEach((function(e){var n,o=document.createElement("div");o.className="brz-login__alert brz-login__alert--".concat(r),o.innerHTML=e,null===(n=t.parentNode)||void 0===n||n.appendChild(o)}))},Ii=function(t){var e;null===(e=t.parentNode)||void 0===e||e.querySelectorAll(".brz-login__alert").forEach((function(t){t.remove()}))},Ni=function(t){var e=t.getAttribute("data-redirect"),r=t.getAttribute("data-redirect-value");"samePage"===e?window.location.reload():window.location.href=r||"/"},qi=function(t,e,r){var n=Ci(t,r);e.forEach((function(e){e.addEventListener("click",(function(){Ii(t);var o=e.closest(".brz-login-form");o&&n&&(Pi(o,"none"),Pi(n,"flex"),function(t,e){switch(e){case".brz-login-form__login":t.setAttribute("type",hi.login);break;case".brz-login-form__register":t.setAttribute("type",hi.register);break;case".brz-login-form__forgot":t.setAttribute("type",hi.forgot)}}(t,r))}))}))},Mi=function(t){return{emptyFieldsError:t.getAttribute("data-error-empty")||"Please fill in the mandatory fields",passLengthError:t.getAttribute("data-error-passlength")||"Password should be at least 6 characters",passMatchError:t.getAttribute("data-error-passmatch")||"Passwords do not match"}},Ri=new Headers({accept:"*/*","Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"}),Di=!0;function Bi(t){t.get(0).querySelectorAll(".brz-login").forEach((function(t){!function(t){var e=t.getAttribute("type"),r="true"===t.getAttribute("data-islogged"),n=Ci(t,".brz-login__authorized"),o=Ci(t,".brz-login-form__login"),i=Ci(t,".brz-login-form__register"),a=Ci(t,".brz-login-form__forgot"),s=Ci(t,"input[name=redirect_to]");s&&"samePage"===s.getAttribute("data-redirect")&&s.setAttribute("value",window.location.href),r?n&&Pi(n,"block"):(e===hi.login&&o&&Pi(o,"flex"),e===hi.register&&i&&Pi(i,"flex"),e===hi.forgot&&a&&Pi(a,"flex"));var c=ji(t,".brz-login-form__field-login-link"),u=ji(t,".brz-login-form__field-lost-password"),l=ji(t,".brz-login-form__field-register-link");c&&qi(t,c,".brz-login-form__login"),u&&qi(t,u,".brz-login-form__forgot"),l&&qi(t,l,".brz-login-form__register")}(t);var e=Mi(t);t.querySelectorAll(".brz-login-form__login").forEach((function(r){r.addEventListener("submit",(function(n){if(n.preventDefault(),Di){var o=function(t,e,r){Ii(e);var n=function(t,e){var r=function(t){switch(t){case hi.login:return"input[name='log'], input[name='pwd']";case hi.register:case hi.forgot:case hi.authorized:return""}}(t);return e.querySelectorAll(r)}(t,e);switch(t){case hi.login:return function(t,e){var r=e.emptyFieldsError;return t.forEach((function(t){t.classList.remove("brz-login__field-empty"),t.required&&""===t.value&&t.classList.add("brz-login__field-empty")})),S(t).some((function(t){return t.required&&""===t.value}))?{success:!1,messages:[r]}:{success:!0,messages:[]}}(n,r);case hi.register:case hi.forgot:case hi.authorized:return{success:!0,messages:[]}}}(hi.login,r,e),i=r.action;if(o.success){var a=function(t,e){if(t===hi.login){var r=new FormData(e);return r.set("isEditorLogin","1"),r.set("redirect_to","/"),new URLSearchParams(r).toString()}}(hi.login,r);Di=!1;var s=r.querySelector(".brz-btn");null==s||s.classList.add("brz-blocked"),function(t,e,r,n,o,i){fetch(e,{method:"POST",mode:"same-origin",body:r,headers:n}).then(function(t,e,r){return function(n){n.ok?n.json().then((function(n){n.success?function(t,e,r){switch(e){case hi.login:case hi.register:case hi.authorized:Ni(r);break;case hi.forgot:!function(t){t.querySelectorAll("input").forEach((function(t){t.value=""}))}(t),Li(t,["Email sent successfully"],"success")}}(e,t,r):Li(e,n.errors||["An error has occured."],"error")})).catch((function(t){Li(e,[t],"error")})):403===n.status?n.json().then((function(t){Li(e,t.errors||["An error has occured. ".concat(n.status)],"error")})).catch((function(t){Li(e,[t],"error")})):Li(e,["An error has occured. ".concat(n.status)],"error")}}(t,o,i)).catch((function(t){Li(o,[t],"error")}))}(hi.login,i,a,Ri,r,t),Di=!0,null==s||s.classList.remove("brz-blocked")}else Li(r,o.messages,"error")}}))}))}))}function Fi(t){t.get(0).querySelectorAll(".brz-map").forEach((function(t){var e,r,n=t.querySelector(".brz-map-content");n&&(r=(e=n).querySelector("iframe"))&&(e.addEventListener("click",(function(){r.style.pointerEvents="auto"})),e.addEventListener("mouseleave",(function(){r.style.pointerEvents="none"})))}))}function Hi(t){t.find(".brz-progress-bar").each((function(){var t=f()(this),e=t.find(".brz-progress-bar__wrapper"),r=t.find(".brz-progress-bar__percent"),n=t.data().type,o=parseInt(e.attr("data-progress"));f()({countNum:0}).animate({countNum:o},{duration:1500,easing:"linear",step:function(){r.text(Math.floor(this.countNum)+"%"),e.css({maxWidth:Math.round(this.countNum+.5)+"%"}),"style2"===n&&r.css({marginLeft:Math.round(this.countNum+.5)-"".concat(o>=94?7:1)+"%"})},complete:function(){r.text(Math.round(this.countNum)+"%"),e.css({maxWidth:Math.round(this.countNum+.5)+"%"})}})}))}function Ui(t){var e=t.get(0),r=function(t){var e,r;null===(e=t.parentNode)||void 0===e||null===(r=e.querySelector(".brz-protected__alert"))||void 0===r||r.remove()},n=function(t,e){var r,n=document.createElement("div");n.className="brz-protected__alert",n.innerHTML=e,null===(r=t.parentNode)||void 0===r||r.appendChild(n)},o=function(t){var e=t.dataset.messages,r=e?H(e):null;return{empty:(null==r?void 0:r.empty)||"The field should not be empty!",fail:(null==r?void 0:r.fail)||"An error has occured!",invalid:(null==r?void 0:r.invalid)||"Please insert a valid code!"}};e.querySelectorAll(".brz-protected-form").forEach((function(t){t.addEventListener("submit",(function(e){e.preventDefault();var i=o(t).empty,a=t.querySelector(".brz-input"),s=null==a?void 0:a.value;s?function(t,e){r(t);var i=t.querySelector(".brz-btn");null==i||i.classList.add("brz-blocked");var a={protected_page_token:e},s=t.dataset.action||"/",c=o(t),u=c.fail,l=c.invalid;fetch(s,{method:"POST",mode:"same-origin",body:JSON.stringify(a),headers:{"Content-Type":"application/json"}}).then((function(e){null==i||i.classList.remove("brz-blocked"),r(t),e.ok?window.location.reload():404===e.status?n(t,u):n(t,l)}))}(t,s):(r(t),n(t,i))}))}))}r(4765),function(t){t.reset="/customer/password_update"}(Ti||(Ti={}));var Vi=function(t){return t.querySelectorAll("input[name='password'], input[name='passwordConfirm']")};function Wi(t){var e=t.get(0),r=new Headers({"Content-Type":"application/json"}),n=!0;e.querySelectorAll(".brz-reset-psw").forEach((function(t){var e=Mi(t),o=t.querySelector(".brz-reset-psw-form");o&&o.addEventListener("submit",(function(i){if(i.preventDefault(),n){var a=function(t,e){Ii(t);var r=Vi(t),n=e.passLengthError,o=e.passMatchError,i=e.emptyFieldsError;return r.forEach((function(t){t.classList.remove("brz-reset-psw__field-empty"),t.required&&""===t.value&&t.classList.add("brz-reset-psw__field-empty")})),S(r).some((function(t){return t.required&&""===t.value}))?{success:!1,messages:[i]}:r[0].value.length<6?(r[0].classList.add("brz-reset-psw__field-empty"),{success:!1,messages:[n]}):r[0].value!==r[1].value?(r.forEach((function(t){t.classList.add("brz-reset-psw__field-empty")})),{success:!1,messages:[o]}):{success:!0,messages:[]}}(o,e),s=Ti.reset;if(a.success){var c=function(t){var e=Vi(t),r={};return e.forEach((function(t){var e=t.name,n=t.value;r[e]=n})),r.resetPasswordToken=new URLSearchParams(location.search).get("token")||"",JSON.stringify(r)}(o);n=!1;var u=o.querySelector(".brz-btn");null==u||u.classList.add("brz-blocked"),function(t,e,r,n,o){fetch(t,{method:"POST",mode:"same-origin",body:e,headers:r}).then(function(t,e){return function(r){r.ok?r.json().then((function(r){r.success?function(t,e){Li(t,["Password reset successfully"],"success"),Ni(e)}(t,e):Li(t,r.errors||[],"error")})).catch((function(e){Li(t,[e],"error")})):Li(t,["An error has occured. ".concat(r.status)],"error")}}(n,o)).catch((function(t){Li(n,[t],"error")}))}(s,c,r,o,t),n=!0,null==u||u.classList.remove("brz-blocked")}else Li(o,a.messages,"error")}}))}))}function Yi(t){var e=t.closest("[dir='rtl']").length>0;t.find(".brz-slick-slider__section").each((function(){var t,r=f()(this),n=r.data(),o=n.slidesToShow,i=n.slidesToScroll,a=n.dots,s=n.dotsClass,c=n.arrows,u=n.fade,l=n.vertical,d=n.autoPlay,p=n.autoPlaySpeed,h=n.swipe,v=JSON.parse(decodeURIComponent(n.responsive)),m=(this,t=f()(this).children(".brz-icon-svg").removeClass("brz-hidden"),f()(this).children(".brz-icon-svg").remove(),function(e){return'<div class="brz-slick-slider__arrow '.concat(e,'">').concat(t[0].outerHTML,"</div>")});r.slick({slidesToShow:o,slidesToScroll:i,swipe:h,dots:a,dotsClass:s,arrows:c,fade:u,vertical:l,responsive:v,useTransform:!1,speed:350,draggable:h,nextArrow:c&&m("brz-slick-slider__arrow-next"),prevArrow:c&&m("brz-slick-slider__arrow-prev"),autoplay:d,autoplaySpeed:p,rtl:e,rows:0})}))}let $i=t=>crypto.getRandomValues(new Uint8Array(t)),Gi=(t,e=21)=>((t,e,r)=>{let n=(2<<Math.log(t.length-1)/Math.LN2)-1,o=-~(1.6*n*e/t.length);return(i=e)=>{let a="";for(;;){let e=r(o),s=o;for(;s--;)if(a+=t[e[s]&n]||"",a.length===i)return a}}})(t,e,$i);var Ji="abcdefghijklmnopqrstuvwxyz",Ki=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:36;return Gi(Ji,t)(t)};function Xi(t){var e=t.get(0),r=e.ownerDocument.body,n={};function o(t){f()(t).removeClass("brz-popup--opened"),f()("html").removeClass("brz-ow-hidden"),f()(document).trigger("brz.popup.close",[t]),window.Brz.emit("elements.popup.close",t)}e.querySelectorAll("[data-brz-link-type='popup']").forEach((function(t){var e,o=t.getAttribute("href").slice(1),i=t.parentElement;if(n[o])t.setAttribute("href","#".concat(n[o]));else{for(;i&&(e=S(i.children).find((function(t){return t.dataset.brzPopup===o})),!e);)i=i.parentElement;if(e&&e.parentElement!==r){var a=Ki(),s=e.getAttribute("id").includes("global_");t.setAttribute("href","#".concat(a)),e.setAttribute("data-brz-popup",a),s&&(n[o]=a),r.append(e)}}})),t.find("[data-brz-link-type='popup']").on("click",(function(t){t.preventDefault();var e,r=this.getAttribute("href").slice(1);if(r){var n=f()('[data-brz-popup="'.concat(r,'"]'));n.hasClass("brz-popup")&&(e=n.get(0),f()(e).addClass("brz-popup--opened"),f()("html").addClass("brz-ow-hidden"),window.Brz.emit("elements.popup.open",e))}})),t.find(".brz-popup:not(.brz-initialized)").click((function(t){0===f()(t.target).closest(".brz-container").length&&o(this)})),f()(".brz-popup").addClass("brz-initialized"),window.Brz.on("elements.anchor.startScrolled",(function(t){var e=f()(t).closest(".brz-popup");e.length>0&&o(e.get(0))}))}r(9601),r(189),r(6755),r(3123);var Qi=function(t){try{return localStorage.getItem(t)}catch(t){return null}},Zi=function(t,e){try{localStorage.setItem(t,e)}catch(t){console.warn("Could not access to localStorage")}},ta=Number(Qi("brz-lastVisit"))||Date.now();!function(){var t=Number(Qi("brz-pagesViews"))||0,e=Number(Qi("brz-pagesViewsInSessionTimeLine"))||0,r=Number(Qi("brz-lastVisit"))||Date.now(),n=Number(Qi("brz-sessions"))||0,o=Date.now()-216e5;!n||r&&r<o?(Zi("brz-sessions",++n),Zi("brz-pagesViewsInSessionTimeLine",1),Zi("brz-showedPopupsInSessionTimeLine","[]")):Zi("brz-pagesViewsInSessionTimeLine",++e),Zi("brz-pagesViews",++t),setTimeout((function(){Zi("brz-lastVisit",Date.now())}),0),Qi("brz-firstVisit")||Zi("brz-firstVisit",Date.now())}(),function(t,e){f()(e).on("brz.popup.close",(function(t,e){var r=f()(e);if(r.hasClass("brz-conditions-popup")){var n=JSON.parse(Qi("brz-showedPopups")||"[]"),o=r.attr("data-brz-popup");Zi("brz-showedPopups",JSON.stringify(S(new Set([].concat(S(n),[o])))))}})),t.brzPopup=function(t){var r=!0,n=0,o=0,i=[],a=JSON.parse(Qi("brz-showedPopups")||"[]");if(!t.triggerOnce||!a.includes(t.popupId))return function(){if(t.pageLoad){var r=Number(t.pageLoad);setTimeout(d,1e3*r)}if(t.click&&h("click",l),t.inactivity){var n=(o=function(){d()},i=1e3*t.inactivity,function(){var t=this,e=arguments,r=function(){v=null,o.apply(t,e)},n=a;clearTimeout(v),v=setTimeout(r,i),n&&o.apply(t,e)});h("load",n),h("mousemove",n),h("mousedown",n),h("touchstart",n),h("click",n),h("keypress",n),h("scroll",n)}var o,i,a,v;if(t.exitIntent&&h("mouseleave",f,e.body),t.scrolling&&t.scrolling.forEach((function(t){switch(t.value){case"down":h("scroll",s.bind(this,t.within));break;case"up":h("scroll",c);break;case"toElement":h("scroll",u.bind(this,t.toElement))}})),t.showing&&t.showing.forEach((function(t){var e=t.type||"equals",r="is fewer"===e,n="equals"===e,o="is more"===e;switch(t.value){case"views":var i=Number(Qi("brz-pagesViews")),a=Number(t.views);r&&i<a&&d(),n&&i===a&&d(),o&&i>a&&d();break;case"sessions":var s=Qi("brz-pagesViewsInSessionTimeLine"),c=Number(Qi("brz-sessions")),u=Number(t.sessions);if(1!==s)break;r&&c<u&&d(),n&&c===u&&d(),o&&c>u&&d()}})),t.loggedIn){var b=__CONFIG__.currentUser.roles;t.loggedIn.find((function(t){return"all"===t.value||b.includes(t.user)}))&&p()}if(t.referrer&&t.referrer.forEach((function(t){switch(t.value){case"show":m(e.referrer)===m(t.url)&&d();break;case"hide":m(e.referrer)===m(t.url)&&p();break;case"regex":new RegExp(t.url).test(e.referrer)&&d();break;case"source":var r=t.type||"is",n=t.source,o=function(t){return n===t&&m(e.referrer).startsWith(t)},i=function(t){return t.some((function(t){return o(t)}))},a="search_engines"===n&&i(["search_engines","bing","yandex","yahoo","baidu","so.com","360.cn","aol","duckduckgo","ask.com","mail.ru","sogou"]),s="social_networks"===n&&i(["social_networks","facebook","pinterest","twitter","linkedin"]),c="internal"===n&&m(e.referrer).startsWith(location.host),u="external"===n&&e.referrer&&!a&&!c,l=o(n)||a||s||c||u;switch(r){case"is":l&&d();break;case"is not":!l&&d()}}})),t.devices){var g=(991,outerWidth<767?"mobile":outerWidth<991?"tablet":"desktop");t.devices.includes(g)||p()}t.currentUrl&&t.currentUrl.forEach((function(t){var r=m(e.location.href),n=m(t.value);switch(t.type){case"matches":r===n&&d();break;case"does not match":r!==n&&d();break;case"contains":r.includes(n)&&d();break;case"does not contain":!r.includes(n)&&d()}})),t.currentDate&&t.currentDate.forEach((function(t){var e=new Date(t.value.split(/[/.-]/).reverse().join(" ")).getTime(),r=new Date,n=new Date("".concat(r.getFullYear()," ").concat(r.getMonth()+1," ").concat(r.getDate())).getTime();switch(t.type){case"matches":n===e&&d();break;case"before":n<e&&d();break;case"after":n>e&&d()}})),t.os&&t.os.forEach((function(t){var e,r=(e={getUserAgent:function(){return navigator.userAgent},getPlatform:function(){return navigator.platform},isIos:function(){return/iPhone|iPad|iPod/.test(e.getPlatform())},isAndroid:function(){return/Android/.test(e.getUserAgent())},isBlackBerry:function(){return/BlackBerry/.test(e.getPlatform())},isBada:function(){return/Bada/.test(e.getPlatform())},isMac:function(){return/Mac/.test(e.getPlatform())},isWindows:function(){return/Win/.test(e.getPlatform())},isLinux:function(){return/Linux/.test(e.getPlatform())&&!e.isAndroid()},isChromeOS:function(){return/\bCrOS\b/.test(e.getPlatform())},isFirefoxOS:function(){return/\bFxiOS\b/.test(e.getPlatform())},getAll:function(){return{blackberry:e.isBlackBerry(),firefoxOs:e.isFirefoxOS(),windows:e.isWindows(),android:e.isAndroid(),chromeOs:e.isChromeOS(),linux:e.isLinux(),bada:e.isBada(),ios:e.isIos(),mac:e.isMac()}}},e).getAll()[t.value];switch(t.type){case"is":r&&d();break;case"is not":!r&&d()}})),t.cookie&&t.cookie.forEach((function(t){var r=t.param,n=t.value,o=function(t){var r=("; "+e.cookie).split("; "+t+"=");if(2==r.length)return r.pop().split(";").shift()}(r);if(o)switch(t.type){case"matches":o===n&&d();break;case"does not match":o!==n&&d();break;case"contains":o.includes(n)&&d();break;case"does not contain":!o.includes(n)&&d()}})),t.timeFrom&&t.timeFrom.forEach((function(t){var e=t.visit,r="days"===t.time?864e5:36e5,n=Number(t.value),o="first"==e,i="last"==e,a=(Number(Qi("brz-firstVisit"))||Date.now())+n*r<Date.now(),s=ta+n*r<Date.now();switch(t.type){case"greater":o&&a&&d(),i&&s&&d();break;case"less":o&&!a&&d(),i&&!s&&d()}})),t.lastVisitDate&&t.lastVisitDate.forEach((function(t){var e=new Date(t.value.split(/[/.-]/).reverse().join(" ")).getTime(),r=new Date(ta),n=new Date("".concat(r.getFullYear()," ").concat(r.getMonth()+1," ").concat(r.getDate())).getTime();switch(t.type){case"matches":n===e&&d();break;case"before":n<e&&d();break;case"after":n>e&&d()}}))}(),this;function s(t){var r=e.body,n=e.documentElement;100*n.scrollTop/(Math.max(r.scrollHeight,r.offsetHeight,n.clientHeight,n.scrollHeight,n.offsetHeight)-n.clientHeight)>Number(t)&&d()}function c(){var t=e.documentElement.scrollTop;t<n&&d(),n=t}function u(t){var r=e.querySelector(t);if(r){var n=e.documentElement,o=n.scrollTop,i=o+n.clientHeight,a=r.clientHeight,s=r.offsetTop;s<=i&&s+a>=o&&d()}}function l(){++o>=Number(t.click)&&d()}function f(){d()}function d(){var n=!0;t.specificPopup&&t.specificPopup.forEach((function(t){var r=t.value.replace("#",""),o=e.getElementById(r),i=o&&o.classList.contains("brz-popup2--was-shown");n="was"===t.type&&i}));var o=JSON.parse(Qi("brz-showedPopupsInSessionTimeLine")||"[]");t.otherPopups&&t.otherPopups.forEach((function(t){var n=t.value,i=e.querySelector(".brz-popup2--was-shown");switch(t.type){case"was":"page"===n&&(r=Boolean(i)),"session"===n&&(r=!o.length);break;case"was not":"page"===n&&(r=Boolean(!i)),"session"===n&&(r=o.length)}})),n&&(setTimeout((function(){r&&(t.show(),Zi("brz-showedPopupsInSessionTimeLine",JSON.stringify(S(new Set([].concat(S(o),[t.popupId]))))),r=!1)}),0),v())}function p(){t.hide(),r=!1,v()}function h(t,r,n){n||(n=e),i.push({type:t,handler:r,elem:n}),n.addEventListener(t,r)}function v(){for(var t=0;t<i.length;t++){var e=i[t];e.elem.removeEventListener(e.type,e.handler)}}function m(t){return t.replace(/^(?:https?:\/\/)?(?:www\.)?/i,"")}}}(window,document);var ea=["brz-map__cover"];function ra(t){var e=t.get(0),r=e.ownerDocument.body,n={};e.querySelectorAll("[data-brz-link-type='popup']").forEach((function(t){var e,o=t.getAttribute("href").slice(1),i=t.parentElement;if(n[o])t.setAttribute("href","#".concat(n[o]));else{for(;i&&(e=S(i.children).find((function(t){return t.dataset.brzPopup===o})),!e);)i=i.parentElement;if(e&&e.parentElement!==r){var a=Ki(),s=e.getAttribute("id").includes("global_");t.setAttribute("href","#".concat(a)),e.setAttribute("data-brz-popup",a),s&&(n[o]=a),r.append(e)}}})),t.find("[data-brz-link-type='popup']").on("click",(function(t){t.preventDefault();var e=this.getAttribute("href").slice(1);if(e){var r=f()('[data-brz-popup="'.concat(e,'"]'));r.hasClass("brz-popup2")&&r.popup().show()}})),t.find(".brz-simple-popup, .brz-conditions-internal-popup, .brz-conditions-external-popup").each((function(){var t=f()(this);if(t.on("click",(function(e){if(!ea.some((function(t){return e.target.classList.contains(t)}))){var r=t.attr("data-click_outside_to_close"),n=0===f()(e.target).closest(".brz-container").length,o=f()(e.target).closest(".brz-popup2__close").length,i=f()(e.target).closest(".brz-popup2__action-close").length,a=f()(e.target).closest(".select2-selection__choice").length>0;(i||o||!a&&n&&r)&&(e.preventDefault(),t.popup().close())}})),t.hasClass("brz-conditions-internal-popup")||t.hasClass("brz-conditions-external-popup")){var e=function(t){var e=t.attr("data-trigger_once"),r=t.attr("data-brz-popup");return{pageLoad:t.attr("data-page_load"),click:t.attr("data-click"),inactivity:t.attr("data-inactivity"),exitIntent:t.attr("data-exit_intent"),scrolling:n(t.attr("data-scrolling")),showing:n(t.attr("data-showing")),loggedIn:n(t.attr("data-logged_in")),referrer:n(t.attr("data-referrer")),devices:n(t.attr("data-devices")),currentUrl:n(t.attr("data-current_url")),currentDate:n(t.attr("data-current_date")),lastVisitDate:n(t.attr("data-last_visit_date")),timeFrom:n(t.attr("data-time_from")),cookie:n(t.attr("data-cookie")),os:n(t.attr("data-os")),otherPopups:n(t.attr("data-other_popups")),specificPopup:n(t.attr("data-specific_popup")),triggerOnce:"true"===e,popupId:r};function n(t){return t?JSON.parse(decodeURIComponent(t)):null}}(t),r=t.popup();window.brzPopup(Object.assign({},e,{show:function(){this.show()}.bind(r),hide:function(){this.close()}.bind(r)}))}})),window.Brz.on("elements.anchor.startScrolled",(function(t){var e=f()(t).closest(".brz-popup2");e.length>0&&e.popup().close()}))}function na(t,e){return e?function(t,e){if(null!=t){if(function(t){return t&&"function"==typeof t[Tt]}(t))return function(t,e){return new Ct((function(r){var n=new xt;return n.add(e.schedule((function(){var o=t[Tt]();n.add(o.subscribe({next:function(t){n.add(e.schedule((function(){return r.next(t)})))},error:function(t){n.add(e.schedule((function(){return r.error(t)})))},complete:function(){n.add(e.schedule((function(){return r.complete()})))}}))}))),n}))}(t,e);if(ce(t))return function(t,e){return new Ct((function(r){var n=new xt;return n.add(e.schedule((function(){return t.then((function(t){n.add(e.schedule((function(){r.next(t),n.add(e.schedule((function(){return r.complete()})))})))}),(function(t){n.add(e.schedule((function(){return r.error(t)})))}))}))),n}))}(t,e);if(se(t))return Jt(t,e);if(function(t){return t&&"function"==typeof t[ae]}(t)||"string"==typeof t)return function(t,e){if(!t)throw new Error("Iterable cannot be null");return new Ct((function(r){var n,o=new xt;return o.add((function(){n&&"function"==typeof n.return&&n.return()})),o.add(e.schedule((function(){n=t[ae](),o.add(e.schedule((function(){if(!r.closed){var t,e;try{var o=n.next();t=o.value,e=o.done}catch(t){return void r.error(t)}e?r.complete():(r.next(t),this.schedule())}})))}))),o}))}(t,e)}throw new TypeError((null!==t&&typeof t||t)+" is not observable")}(t,e):t instanceof Ct?t:new Ct(ue(t))}f().fn.popup=function(){var t=f()(this);return{show:function(){var e=t.attr("data-scroll_page"),r=t.attr("data-show-close-button-after");t.attr("data-click_outside_to_close")||(t.addClass("brz-pointer-events-none"),t.find(".brz-popup2__inner > .brz-container__wrap").addClass("brz-pointer-events-auto")),r&&setTimeout((function(){t.find(".brz-popup2__close").removeClass("brz-hidden")}),1e3*Number(r)),t.addClass("brz-popup2--opened"),e?f()("html").removeClass("brz-ow-hidden"):f()("html").addClass("brz-ow-hidden"),t.addClass("brz-popup2--was-shown"),f()(document).trigger("brz.popup.show",[t.get(0)]),window.Brz.emit("elements.popup.open",t.get(0))},close:function(){t.removeClass("brz-popup2--opened"),f()("html").removeClass("brz-ow-hidden"),f()(document).trigger("brz.popup.close",[t.get(0)]),window.Brz.emit("elements.popup.close",t.get(0))}}};var oa=function(t,e,r){return{type:"Submitting",handle:t,quantity:e,variationId:r}},ia=function(t,e,r){return{type:"Ready",handle:t,quantity:e,variationId:r}};function aa(t,e){return function(r){return r.lift(new sa(t,e))}}var sa=function(){function t(t,e){this.compare=t,this.keySelector=e}return t.prototype.call=function(t,e){return e.subscribe(new ca(t,this.compare,this.keySelector))},t}(),ca=function(t){function e(e,r,n){var o=t.call(this,e)||this;return o.keySelector=n,o.hasKey=!1,"function"==typeof r&&(o.compare=r),o}return vt(e,t),e.prototype.compare=function(t,e){return t===e},e.prototype._next=function(t){var e;try{var r=this.keySelector;e=r?r(t):t}catch(t){return this.destination.error(t)}var n=!1;if(this.hasKey)try{n=(0,this.compare)(this.key,e)}catch(t){return this.destination.error(t)}else this.hasKey=!0;n||(this.key=e,this.destination.next(t))},e}(At);function ua(t,e){return function(r){return r.lift(new la(t,e))}}var la=function(){function t(t,e){this.predicate=t,this.thisArg=e}return t.prototype.call=function(t,e){return e.subscribe(new fa(t,this.predicate,this.thisArg))},t}(),fa=function(t){function e(e,r,n){var o=t.call(this,e)||this;return o.predicate=r,o.thisArg=n,o.count=0,o}return vt(e,t),e.prototype._next=function(t){var e;try{e=this.predicate.call(this.thisArg,t,this.count++)}catch(t){return void this.destination.error(t)}e&&this.destination.next(t)},e}(At),da=function(t){function e(e){var r=t.call(this)||this;return r.parent=e,r}return vt(e,t),e.prototype._next=function(t){this.parent.notifyNext(t)},e.prototype._error=function(t){this.parent.notifyError(t),this.unsubscribe()},e.prototype._complete=function(){this.parent.notifyComplete(),this.unsubscribe()},e}(At),pa=function(t){function e(){return null!==t&&t.apply(this,arguments)||this}return vt(e,t),e.prototype.notifyNext=function(t){this.destination.next(t)},e.prototype.notifyError=function(t){this.destination.error(t)},e.prototype.notifyComplete=function(){this.destination.complete()},e}(At);function ha(t,e){if(!e.closed){if(t instanceof Ct)return t.subscribe(e);var r;try{r=ue(t)(e)}catch(t){e.error(t)}return r}}function va(t,e){return"function"==typeof e?function(r){return r.pipe(va((function(r,n){return na(t(r,n)).pipe(he((function(t,o){return e(r,t,n,o)})))})))}:function(e){return e.lift(new ma(t))}}var ma=function(){function t(t){this.project=t}return t.prototype.call=function(t,e){return e.subscribe(new ba(t,this.project))},t}(),ba=function(t){function e(e,r){var n=t.call(this,e)||this;return n.project=r,n.index=0,n}return vt(e,t),e.prototype._next=function(t){var e,r=this.index++;try{e=this.project(t,r)}catch(t){return void this.destination.error(t)}this._innerSub(e)},e.prototype._innerSub=function(t){var e=this.innerSubscription;e&&e.unsubscribe();var r=new da(this),n=this.destination;n.add(r),this.innerSubscription=ha(t,r),this.innerSubscription!==r&&n.add(this.innerSubscription)},e.prototype._complete=function(){var e=this.innerSubscription;e&&!e.closed||t.prototype._complete.call(this),this.unsubscribe()},e.prototype._unsubscribe=function(){this.innerSubscription=void 0},e.prototype.notifyComplete=function(){this.innerSubscription=void 0,this.isStopped&&t.prototype._complete.call(this)},e.prototype.notifyNext=function(t){this.destination.next(t)},e}(pa),ga=function(){function t(t){this.value=t}return t.prototype.call=function(t,e){return e.subscribe(new ya(t,this.value))},t}(),ya=function(t){function e(e,r){var n=t.call(this,e)||this;return n.value=r,n}return vt(e,t),e.prototype._next=function(t){this.destination.next(this.value)},e}(At),wa=function(){function t(t){this.selector=t}return t.prototype.call=function(t,e){return e.subscribe(new _a(t,this.selector,this.caught))},t}(),_a=function(t){function e(e,r,n){var o=t.call(this,e)||this;return o.selector=r,o.caught=n,o}return vt(e,t),e.prototype.error=function(e){if(!this.isStopped){var r=void 0;try{r=this.selector(e,this.caught)}catch(e){return void t.prototype.error.call(this,e)}this._unsubscribeAndRecycle();var n=new da(this);this.add(n);var o=ha(r,n);o!==n&&this.add(o)}},e}(pa),za={},Sa=function(){function t(e,r){var n=this;lt(this,t),this.cartClient=r,pt(this,"stateSubject",void 0),pt(this,"actionSubject",void 0),pt(this,"setQuantity",(function(t){n.actionSubject.next({type:"SetQuantity",payload:t})})),pt(this,"setVariation",(function(t){n.actionSubject.next({type:"SetVariation",payload:t})})),this.stateSubject=new ee,this.actionSubject=new ee,this.actionSubject.pipe(fe(this.stateSubject),he((function(t){var e=x(t,2);return function(t,e){switch(t.type){case"SetQuantity":if(t.payload!==e.quantity)switch(e.type){case"Ready":return ia(e.handle,t.payload,e.variationId);case"Submitting":return oa(e.handle,t.payload,e.variationId)}return e;case"SetVariation":switch(e.type){case"Ready":return t.payload!==e.variationId?ia(e.handle,e.quantity,t.payload):e;case"Submitting":return t.payload!==e.variationId?oa(e.handle,e.quantity,t.payload):e}case"Submit":switch(e.type){case"Ready":return oa(e.handle,e.quantity||1,e.variationId);case"Submitting":return e}case"SubmitErr":case"SubmitSuccess":return"Submitting"===e.type?ia(e.handle,0,e.variationId):e}}(e[0],e[1])}))).subscribe(this.stateSubject),this.stateSubject.pipe(("type",aa((function(t,e){return t.type===e.type}))),ua((function(t){return"Submitting"===t.type})),va((function(t){return na(n.cartClient.add([{id:t.variationId,quantity:t.quantity}])).pipe((r={type:"SubmitSuccess"},function(t){return t.lift(new ga(r))}),(e=function(t){return Xt({type:"SubmitErr",payload:{code:t.status,message:t.statusText}})},function(t){var r=new wa(e),n=t.lift(r);return r.caught=n}));var e,r}))).subscribe(this.actionSubject),this.stateSubject.next(ia(e.handle,0,e.variants[0].id))}return dt(t,[{key:"observable",get:function(){return this.stateSubject.pipe(aa())}},{key:"submit",value:function(){this.actionSubject.next({type:"Submit"})}}]),t}(),xa=function(t,e){var r=za[t.id];if(r)return r;var n=new Sa(t,e);return za[t.id]=n,n},Ea=new Ut(Bt);function ka(t,e){void 0===e&&(e=Ea);var r,n=(r=t)instanceof Date&&!isNaN(+r)?+t-e.now():Math.abs(t);return function(t){return t.lift(new Aa(n,e))}}var Aa=function(){function t(t,e){this.delay=t,this.scheduler=e}return t.prototype.call=function(t,e){return e.subscribe(new Oa(t,this.delay,this.scheduler))},t}(),Oa=function(t){function e(e,r,n){var o=t.call(this,e)||this;return o.delay=r,o.scheduler=n,o.queue=[],o.active=!1,o.errored=!1,o}return vt(e,t),e.dispatch=function(t){for(var e=t.source,r=e.queue,n=t.scheduler,o=t.destination;r.length>0&&r[0].time-n.now()<=0;)r.shift().notification.observe(o);if(r.length>0){var i=Math.max(0,r[0].time-n.now());this.schedule(t,i)}else this.unsubscribe(),e.active=!1},e.prototype._schedule=function(t){this.active=!0,this.destination.add(t.schedule(e.dispatch,this.delay,{source:this,destination:this.destination,scheduler:t}))},e.prototype.scheduleNotification=function(t){if(!0!==this.errored){var e=this.scheduler,r=new Ta(e.now()+this.delay,t);this.queue.push(r),!1===this.active&&this._schedule(e)}},e.prototype._next=function(t){this.scheduleNotification(Qt.createNext(t))},e.prototype._error=function(t){this.errored=!0,this.queue=[],this.destination.error(t),this.unsubscribe()},e.prototype._complete=function(){this.scheduleNotification(Qt.createComplete()),this.unsubscribe()},e}(At),Ta=function(){return function(t,e){this.time=t,this.notification=e}}();function Pa(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function ja(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?Pa(Object(r),!0).forEach((function(e){pt(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Pa(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}var Ca=function(){function t(){lt(this,t),pt(this,"items",[])}return dt(t,[{key:"add",value:function(t){var e=this.items.map((function(t){return t.id})),r=t.filter((function(t){return!e.includes(t.id)}));return this.items=[].concat(S(this.items.map((function(e){var r=t.find((function(t){return t.id===e.id}));return r?ja(ja({},e),{},{quantity:e.quantity+r.quantity}):e}))),S(r)),Xt(this.items).pipe(ka(200)).toPromise()}}]),t}(),La=function(){function t(){lt(this,t),pt(this,"product",{id:7076768645314,title:"841851",handle:"841851",description:"<meta charset=\"utf-8\">\n<div>\n<p><strong>Lorem Ipsum</strong><span> </span>is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>\n</div>\n<div>\n<h2>Why do we use it?</h2>\n<p>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).</p>\n</div>",published_at:"2021-10-21T10:53:51+03:00",created_at:"2021-10-21T10:51:25+03:00",vendor:"brizy12",type:"",tags:[],price:0,price_min:0,price_max:0,available:!0,price_varies:!1,compare_at_price:null,compare_at_price_min:0,compare_at_price_max:0,compare_at_price_varies:!1,variants:[{id:41476847501506,title:"S",option1:"S",option2:null,option3:null,sku:"",requires_shipping:!0,taxable:!0,featured_image:{id:31801540509890,product_id:7076768645314,position:2,created_at:"2022-01-12T13:47:36+02:00",updated_at:"2022-01-12T13:47:38+02:00",alt:null,width:1950,height:1300,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1532982116380-02ce47a3e03c.jpg?v=1641988058",variant_ids:[41476847501506]},available:!0,options:["S"],price:0,weight:0,compare_at_price:null,inventory_management:"shopify",barcode:"",featured_media:{alt:null,id:24123763163330,position:2,preview_image:{aspect_ratio:1.5,height:1300,width:1950,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1532982116380-02ce47a3e03c.jpg?v=1641988058"}}},{id:41476847534274,title:"M",option1:"M",option2:null,option3:null,sku:"",requires_shipping:!0,taxable:!0,featured_image:{id:31801540608194,product_id:7076768645314,position:3,created_at:"2022-01-12T13:47:36+02:00",updated_at:"2022-01-12T13:47:38+02:00",alt:null,width:1951,height:1301,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533079047304-3997643590ab.jpg?v=1641988058",variant_ids:[41476847534274]},available:!1,options:["M"],price:0,weight:0,compare_at_price:null,inventory_management:"shopify",barcode:"",featured_media:{alt:null,id:24123763196098,position:3,preview_image:{aspect_ratio:1.5,height:1301,width:1951,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533079047304-3997643590ab.jpg?v=1641988058"}}},{id:41476847567042,title:"L",option1:"L",option2:null,option3:null,sku:"",requires_shipping:!0,taxable:!0,featured_image:{id:31801540542658,product_id:7076768645314,position:5,created_at:"2022-01-12T13:47:36+02:00",updated_at:"2022-01-12T13:47:38+02:00",alt:null,width:1950,height:1300,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533227356842-2b94d2d24d8d.jpg?v=1641988058",variant_ids:[41476847567042]},available:!1,options:["L"],price:0,weight:0,compare_at_price:null,inventory_management:"shopify",barcode:"",featured_media:{alt:null,id:24123763261634,position:5,preview_image:{aspect_ratio:1.5,height:1300,width:1950,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533227356842-2b94d2d24d8d.jpg?v=1641988058"}}}],images:["//cdn.shopify.com/s/files/1/0573/9649/4530/products/car_27480qb9z4484phaxdq99tgdxbev.jpg?v=1641801607","//cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1532982116380-02ce47a3e03c.jpg?v=1641988058","//cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533079047304-3997643590ab.jpg?v=1641988058","//cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533139143976-30918502365b.jpg?v=1641988058","//cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533227356842-2b94d2d24d8d.jpg?v=1641988058"],featured_image:"//cdn.shopify.com/s/files/1/0573/9649/4530/products/car_27480qb9z4484phaxdq99tgdxbev.jpg?v=1641801607",options:[{name:"Size",position:1,values:["S","M","L"]}],url:"/products/841851",media:[{alt:null,id:24095807963330,position:1,preview_image:{aspect_ratio:1.333,height:600,width:800,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/car_27480qb9z4484phaxdq99tgdxbev.jpg?v=1641801607"},aspect_ratio:1.333,height:600,media_type:"image",src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/car_27480qb9z4484phaxdq99tgdxbev.jpg?v=1641801607",width:800},{alt:null,id:24123763163330,position:2,preview_image:{aspect_ratio:1.5,height:1300,width:1950,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1532982116380-02ce47a3e03c.jpg?v=1641988058"},aspect_ratio:1.5,height:1300,media_type:"image",src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1532982116380-02ce47a3e03c.jpg?v=1641988058",width:1950},{alt:null,id:24123763196098,position:3,preview_image:{aspect_ratio:1.5,height:1301,width:1951,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533079047304-3997643590ab.jpg?v=1641988058"},aspect_ratio:1.5,height:1301,media_type:"image",src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533079047304-3997643590ab.jpg?v=1641988058",width:1951},{alt:null,id:24123763228866,position:4,preview_image:{aspect_ratio:1.5,height:1300,width:1950,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533139143976-30918502365b.jpg?v=1641988058"},aspect_ratio:1.5,height:1300,media_type:"image",src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533139143976-30918502365b.jpg?v=1641988058",width:1950},{alt:null,id:24123763261634,position:5,preview_image:{aspect_ratio:1.5,height:1300,width:1950,src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533227356842-2b94d2d24d8d.jpg?v=1641988058"},aspect_ratio:1.5,height:1300,media_type:"image",src:"https://cdn.shopify.com/s/files/1/0573/9649/4530/products/photo-1533227356842-2b94d2d24d8d.jpg?v=1641988058",width:1950}]})}return dt(t,[{key:"get",value:function(t){return Xt(this.product).pipe(ka(2e3)).toPromise()}}]),t}();function Ia(t){var e=t.get(0),r=new Ca,n=new La;e.querySelectorAll(".brz-shopify-add-to-cart").forEach((function(t){var e=t.getAttribute("data-product-handle");e&&n.get(e).then((function(e){var n=xa(e,r);n.observable.pipe(aa((function(t,e){return t.type===e.type&&t.quantity===e.quantity}))).subscribe((function(e){switch(e.type){case"Submitting":return t.innerHTML="Loading",t;case"Ready":return t.innerHTML="Add to Cart: ".concat(e.quantity),t}})),t.addEventListener("click",(function(){n.submit()}))}))}))}function Na(t){var e=t.get(0),r=new Ca,n=new La;e.querySelectorAll(".brz-shopify-price").forEach((function(t){var e=t.getAttribute("data-product-handle"),o=t.querySelector(".price");e&&o&&n.get(e).then((function(t){xa(t,r).observable.pipe(he((function(t){return String(t.variationId)})),aa()).subscribe((function(t){return o.innerHTML=t}))}))}))}var qa=function(t){if(""!==t&&("number"==typeof t||"string"==typeof t)){var e=Number(t);return isNaN(e)?void 0:e}},Ma=r(4882),Ra=function(t){return function(e){return e[t]}},Da=function(t){return function(e){return function(t,e){return t in e}(t,e)?e[t]:void 0}};function Ba(t){var e=t.get(0),r=new Ca,n=new La;e.querySelectorAll(".brz-shopify-quantity").forEach((function(t){var e=t.getAttribute("data-product-handle"),o=t.querySelector("input[type=number]");e&&o&&n.get(e).then((function(e){var n=xa(e,r);n.observable.pipe(he(Ra("quantity")),aa(),he(String)).subscribe((function(t){return o.value=t})),t.addEventListener("change",(0,Ma.mPipe)(Ra("target"),Da("value"),qa,n.setQuantity))}))}))}function Fa(t){var e=t.get(0),r=new Ca,n=new La;e.querySelectorAll(".brz-shopify-variations").forEach((function(t){var e=t.getAttribute("data-product-handle");if(e){var o=t.querySelectorAll('input[data-product-handle="'.concat(e,'"]'));n.get(e).then((function(t){var e=xa(t,r);e.observable.pipe(ua((function(t){return"Ready"===t.type})),he((function(t){return t.variationId})),aa(),he(String)).subscribe((function(t){o.forEach((function(e){return e.checked=e.value===t}))})),o.forEach((function(t){null==t||t.addEventListener("change",(0,Ma.mPipe)(Ra("target"),Da("value"),qa,(function(t){return t}),e.setVariation))}))}))}}))}function Ha(t){var e,r,n,o=t.get(0);try{var i=o.querySelector(".brz-yotpo-review"),a=null==i?void 0:i.firstChild;if(null!=a&&a.classList.contains("bottomLine")){var s=a.getAttribute("data-appkey");e=s&&0!==s.length?H(s):"",r=document.head,(n=document.createElement("script")).id="yotPo-review",n.type="text/javascript",n.async=!0,n.src="//staticw2.yotpo.com/".concat(e,"/widget.js"),r.append(n)}}catch(t){console.error(t)}}function Ua(t){var e=t.get(0),r=t.closest("[dir='rtl']").length>0,n=function(t){var e=window,r=e.innerWidth,n=e.innerHeight;if(r<768){var o=t.find(".slick-slide"),i=n;i!==o.height()&&o.css("height",i)}},o=function(t){t.preventDefault()};t.find(".brz-slick-slider__story").each((function(){var t=f()(this),i=t.data(),a=i.centerMode,s=i.centerPadding,c=i.variableWidth,u=i.focusOnSelect,l=i.touchThreshold,d=i.slidesToShow,p=i.slidesToScroll,h=i.sliderLoop,v=i.lazyLoad,m=i.dots,b=i.dotsClass,g=i.arrows,y=i.fade,w=i.vertical,_=i.autoPlay,z=i.autoPlaySpeed,S=i.swipe,x=i.speed,E=i.responsive,k=JSON.parse(decodeURIComponent(E)),A=function(t){var e=f()(t).children(".brz-icon-svg").removeClass("brz-hidden");return f()(t).children(".brz-icon-svg").remove(),function(t){return"brz-slick-slider__arrow-next"===t&&e.length>1?'<div class="brz-slick-slider__arrow '.concat(t,'">').concat(e[0].outerHTML,'</div>\n           <div class="brz-slick-slider__arrow brz-slick-slider__arrow-replay">').concat(e[1].outerHTML,"</div>"):'<div class="brz-slick-slider__arrow '.concat(t,'">').concat(e[0].outerHTML,"</div>")}}(this);t.on("init",(function(){n(t),window.Brz.emit("elements.story.init",t.get(0))})),t.on("breakpoint",(function(){n(t)}));var O=t.slick({centerMode:a,centerPadding:s,variableWidth:c,focusOnSelect:u,touchThreshold:l,slidesToShow:d,infinite:h,slidesToScroll:p,lazyLoad:v,swipe:S,speed:x,dots:m,dotsClass:b,arrows:g,fade:y,vertical:w,responsive:k,useTransform:!1,draggable:S,nextArrow:g&&A("brz-slick-slider__arrow-next"),prevArrow:g&&A("brz-slick-slider__arrow-prev"),autoplay:_,autoplaySpeed:z,rtl:r,rows:0});e.querySelectorAll("[data-brz-link-story]").forEach((function(t){var e,r=null!==(e=Qo(t.getAttribute("data-brz-link-story")))&&void 0!==e?e:1;t.addEventListener("click",(function(t){t.preventDefault(),O.slick("slickGoTo",r-1)}))})),f()(".brz-slick-slider__arrow-replay").on("click",(function(){O.slick("slickGoTo",0)})),f()(".brz-slick-slider__inner-arrow-next").on("click",(function(t){t.stopPropagation(),t.preventDefault(),O.slick("slickNext")})),f()(".brz-slick-slider__inner-arrow-prev").on("click",(function(t){t.stopPropagation(),t.preventDefault(),O.slick("slickPrev")})),O.on("beforeChange",(function(t,e,r,n){if(r!==n){var o=e.$slides[r];o&&window.Brz.emit("elements.story.slide.changed",o)}})),h||t.on("afterChange",(function(){(arguments.length<=2?void 0:arguments[2])===f()(".brz-slick-slider__dots > li").length-1&&O.slick("slickPause")})),window.addEventListener("touchmove",o,{passive:!1})}))}function Va(t,e){var r=t.children(".brz-tabs__content").children(".brz-tabs__items"),n=f()(e).closest("li"),o=n.index(),i="brz-tabs__nav--mobile--active";-1!==o&&(r.removeClass("brz-tabs__items--active"),r.children(".brz-tabs__nav--mobile").removeClass(i),n.siblings("li").removeClass("brz-tabs__nav--active"),n.addClass("brz-tabs__nav--active"),f()(r[o]).children(".brz-tabs__nav--mobile").addClass(i),f()(r[o]).addClass("brz-tabs__items--active"),window.Brz.emit("elements.tabs.changed",t.get(0),{active:r[o],tabs:r.get()}))}function Wa(t){t.find(".brz-tabs").each((function(){var t=f()(this);"click"==("hover"===t.attr("data-action")?"mouseenter":"click")?t.children(".brz-tabs__nav").on("click",(function(e){Va(t,e.target)})):t.find(".brz-tabs__nav > li").on("mouseenter",(function(e){Va(t,e.target)})),t.find(".brz-tabs__nav--mobile").on("click",(function(){var e=f()(this),r="brz-tabs__items--active",n="brz-tabs__nav--mobile--active",o=e.closest(".brz-tabs__items"),i=t.children(".brz-tabs__content").children(".brz-tabs__items");o.siblings().removeClass(r),o.siblings().children(".brz-tabs__nav--mobile").removeClass(n),o.addClass(r),o.children(".brz-tabs__nav--mobile").addClass(n),setTimeout((function(){var t=e.offset().top;window.scrollY>t&&f()("html, body").animate({scrollTop:t},200)}),100),window.Brz.emit("elements.tabs.changed",o.get(0),{active:o.get(0),tabs:i.get()})}))}))}var Ya=function(t,e,r){var n,o,i;return o=r.showName,i=null!==(n=F(t.text))&&void 0!==n?n:"English",(o?'<span class="brz-span">'.concat(i,"</span>"):"")+function(t,e){return t?'<img class="brz-translation__flag" src="'.concat(e,'" />'):""}(r.showFlags,e)},$a=function(t){return function(e){var r,n,o,i=null!==(r=null===(n=e.element)||void 0===n||null===(o=n.dataset)||void 0===o?void 0:o.flag)&&void 0!==r?r:"",a=document.createElement("div");return a.className="brz-translation__select-item",a.innerHTML=Ya(e,i,t),a}};function Ga(t){t.get(0).querySelectorAll(".brz-translation").forEach((function(t){var e,r,n=f()(t),o="on"===t.getAttribute("data-showflags"),i="on"===t.getAttribute("data-showname"),a=t.querySelector("select.brz-select");a&&(f()(a).select2({minimumResultsForSearch:1/0,dropdownParent:n,templateResult:(r={showFlags:o,showName:i},function(t){var e,n,o,i=null!==(e=null===(n=t.element)||void 0===n||null===(o=n.dataset)||void 0===o?void 0:o.flag)&&void 0!==e?e:"",a=document.createElement("div");return a.className="brz-translation__select-item",a.innerHTML=Ya(t,i,r),a}),templateSelection:$a({showFlags:o,showName:i}),dropdownAutoWidth:!0}),f()(a).on("select2:select",(function(t){var e,r,n,o,i,a=null!==(e=null===(r=t.target)||void 0===r||null===(n=r.selectedOptions)||void 0===n||null===(o=n[0])||void 0===o||null===(i=o.dataset)||void 0===i?void 0:i.href)&&void 0!==e?e:"#";window.location.href=a})),f()(a).on("select2:opening",(function(){setTimeout((function(){var r=t.querySelector(".select2-dropdown");if(r){var n=r.querySelector(".select2-results__options .select2-results__option");if(n){var o=n.getBoundingClientRect().height,i=s().Scrollbars;r.style.maxHeight="".concat(4*o,"px"),i&&(e=new i(r))}}}),0)})),f()(a).on("select2:close",(function(){e&&(e.destroy(),e=null)})))}))}function Ja(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function Ka(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?Ja(Object(r),!0).forEach((function(e){pt(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):Ja(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}r(5218);var Xa={autoplay:!1,controls:!0,loop:!1,privacyMode:"off"};function Qa(t){var e,r=null;return/(?:youtu\.be|youtube)/.test(t)?(r="youtube",e=t.match(/(?:v=|embed\/|youtu\.be\/)([A-Z0-9a-z\-_+%]*)(?:"|)/)):/(?:vimeo\.com)/.test(t)&&(r="vimeo",e=t.match(/vimeo\.com.*?\/([0-9]{1,20})/)),r&&e&&e[1]?{type:r,key:e[1]}:null}var Za=!1,ts=function(t,e,r,n,o,i,a){return new YT.Player(t,{events:{onReady:function(t){var r=t.target.isMuted();a&&t.target.pauseVideo(),(e||r)&&t.target.mute(),e||r||t.target.unMute(),(e||i&&!a)&&(t.target.seekTo(n),t.target.playVideo())},onStateChange:function(t){if(r&&t.data==YT.PlayerState.PLAYING)if(o>n)setTimeout((function(){return t.target.seekTo(n)}),1e3*(o-n));else{var e=t.target.getDuration()-n;setTimeout((function(){return t.target.seekTo(n)}),1e3*e)}}}})};function es(t){t.find(".brz-video .brz-iframe").each((function(){f()(this).remove()})),t.find(".brz-embed-code iframe").each((function(){var t=f()(this),e=(Qa(t.attr("src"))||{}).type;if("youtube"===e||"vimeo"===e){var r=t.get(0).outerHTML;f()(this).replaceWith(r)}})),t.find(".brz-custom-video").each((function(){f()(this).find("video").trigger("pause")}))}function rs(t){t.find(".brz-vimeo-video, .brz-youtube-video").each((function(){var t=f()(this);t.find(".brz-video__cover").length||is(t)}))}function ns(t){var e=t.get(0);["elements.tabs.changed","elements.accordion.changed","elements.switcher.changed"].forEach((function(t){window.Brz.on(t,(function(t,e){var r=e.tabs.filter((function(t){return t!==e.active}));es(f()(r)),rs(f()(e.active))}))})),["elements.mmenu.panel.opened","elements.mmenu.open"].forEach((function(t){window.Brz.on(t,(function(t){rs(f()(t))}))})),["elements.mmenu.panel.closed","elements.mmenu.close"].forEach((function(t){window.Brz.on(t,(function(t){es(f()(t))}))})),f()(document).on("brz.popup.show",(function(t,e){rs(f()(e))})),f()(document).on("brz.popup.close",(function(t,e){es(f()(e))}));var r,n=[],o=[],i=["iPad Simulator","iPhone Simulator","iPod Simulator","iPad","iPhone","iPod"].includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document,a=t.find(".brz-youtube-video"),s=t.find(".brz-vimeo-video");a.length>0&&(function(){if(!document.querySelector("script[src='https://www.youtube.com/iframe_api']")){var t=document.createElement("script");t.src="https://www.youtube.com/iframe_api",document.head.append(t)}}(),void 0===window.onYouTubeIframeAPIReady&&(window.onYouTubeIframeAPIReady=function(){window.Brz&&window.Brz.emit("elements.video.iframe.ready")})),window.Brz.on("elements.video.iframe.ready",(function(){Za=!0,a.each((function(t){var e=this,r=f()(this),a=this.querySelector("iframe"),s=r.find(".brz-video-data"),c=r.find(".brz-video__cover"),u=s.attr("data-population"),l="true"===s.attr("data-loop"),d=Number(s.attr("data-start")),p=Number(s.attr("data-end")),h="on"===s.attr("data-autoplay");i&&n.push(r),c.length?i?(this.classList.add("brz-video__ios"),c.get(0).addEventListener("click",(function(){o[t].playVideo&&(e.classList.remove("brz-video__ios"),o[t].playVideo(),c.remove())}))):c.on("click",is.bind(null,r,!1)):u?is(r):a&&ts(a,h,l,d,p,!1)})),n.forEach((function(t){var e=is(t,i);o.push(e)}))})),s.each((function(){var t=f()(this),e=t.find(".brz-video-data"),r=t.find(".brz-video__cover"),n=e.attr("data-population");r.length?r.on("click",is.bind(null,t,!1)):n&&is(t)})),t.find(".brz-custom-video").each((function(){var t=f()(this),e=t.find("video"),r=e.get(0).getAttribute("data-autoplay"),n=e.get(0).hasAttribute("muted");"on"===r&&ls(t),n&&fs(t,!0)})),t.find(".brz-custom-video .brz-video-custom-play-pause-btn, .brz-custom-video .brz-shortcode__placeholder, .brz-custom-video .brz-video__cover, .brz-custom-video video").click((function(){ls(f()(this).closest(".brz-video"))})),t.find(".brz-custom-video .brz-video-custom-volume-btn").click((function(){var t=f()(this).closest(".brz-video"),e=t.find("video").get(0).muted;fs(t,!e)}));var c=function(){var t=document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement||document.mozFullscreenElement;r&&(t?r.addClass("brz-video-custom-fullScreen-window-show"):r.removeClass("brz-video-custom-fullScreen-window-show"))};e.ownerDocument.onfullscreenchange=c,e.ownerDocument.onwebkitfullscreenchange=c,e.ownerDocument.onmozfullscreenchange=c,t.find(".brz-custom-video .brz-video-custom-fullscreen-btn").click((function(t){var e,n=f()(t.target).closest(".brz-video").find(".brz-video-elem"),o=n.find("video")[0],i=document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement||document.mozFullscreenElement;o.src&&o.duration&&(i?document.exitFullscreen?document.exitFullscreen():document.mozCancelFullScreen?document.mozCancelFullScreen():document.webkitExitFullscreen?document.webkitExitFullscreen():document.msExitFullscreen&&document.msExitFullscreen():(r=n,(e=n.get(0)).requestFullscreen?e.requestFullscreen():e.mozRequestFullScreen?e.mozRequestFullScreen():e.webkitRequestFullscreen?e.webkitRequestFullscreen():e.msRequestFullscreen&&e.msRequestFullscreen()))})),window.Brz.on("elements.story.slide.changed",(function(t){if(t){var e=t.querySelectorAll(".brz-video");e.length>0&&e.forEach((function(t){var e=function(t){if(t.classList.contains("brz-youtube-video")){var e=t.querySelector("iframe");return e?{type:"youtube",player:e}:void 0}if(t.classList.contains("brz-vimeo-video")){var r=t.querySelector("iframe");return r?{type:"vimeo",player:r}:void 0}if(t.classList.contains("brz-custom-video")){var n=t.querySelector("video");return n?{type:"custom",player:n}:void 0}}(t);e&&function(t){var e,r,n,o,i;switch(t.type){case"youtube":null==t||null===(e=t.player)||void 0===e||null===(r=e.contentWindow)||void 0===r||r.postMessage(JSON.stringify({event:"command",func:"pauseVideo"}),"*");break;case"vimeo":null==t||null===(n=t.player)||void 0===n||null===(o=n.contentWindow)||void 0===o||o.postMessage(JSON.stringify({method:"pause",value:"true"}),"*");break;case"custom":var a;"function"==typeof(null==t||null===(i=t.player)||void 0===i?void 0:i.pause)&&(null==t||null===(a=t.player)||void 0===a||a.pause())}}(e)}))}}))}function os(t){var e=t.find(".brz-video-data"),r=t.find(".brz-video__cover"),n=e.attr("data-src"),o=e.attr("data-population"),i=e.attr("data-controls"),a=e.attr("data-branding"),s=e.attr("data-intro"),c=e.attr("data-start"),u=e.attr("data-end"),l=e.attr("data-loop");return o&&(n=function(t,e){var r=Qa(t);return r?function(t,e){var r,n=t.type,o=t.key,i=Ka(Ka({},Xa),e),a="youtube"===n?function(t,e){var r=e.autoplay,n=e.controls,o=e.branding,i=void 0===o?1:o,a=e.loop,s=e.suggestedVideo,c=e.start,u=void 0===c?0:c,l=e.end,f=void 0===l?0:l,d=e.hasCover,p=void 0!==d&&d,h=e.privacyMode,v=e.videoMuted,m=Ka({autoplay:Number(r),controls:Number(n),start:Number(u),end:Number(f),modestbranding:i,wmode:"transparent",enablejsapi:1,loop:0,rel:Number(s),mute:Number(v)},r&&!p?{mute:1}:{});return a&&(m.loop=1,m.playlist=t),{url:"https://www.youtube".concat("on"===h?"-nocookie":"",".com/embed/").concat(t),options:m}}(o,i):function(t,e){var r=e.intro,n=void 0===r?1:r,o=e.autoplay,i=e.loop,a=void 0!==i&&i,s=e.start,c=void 0===s?0:s,u=e.controls,l=e.hasCover,f=void 0!==l&&l,d=e.videoMuted;return{url:"https://player.vimeo.com/video/".concat(t),options:Ka({autoplay:Number(o),background:0,title:n,byline:n,badge:!1,autopause:!1,portrait:n,controls:Number(u),loop:Number(a),muted:Number(d)},!0!==o||f?{}:{muted:1}),anchor:"#t=".concat(Number(c),"s")}}(o,i),s=a.url,c=a.options,u=a.anchor,l=void 0===u?"":u;return"".concat(s,"?").concat((r=c,r?Object.entries(r).map((function(t){return t[0]+"="+encodeURIComponent(t[1])})).join("&"):"")).concat(l)}(r,e):null}(o,{autoplay:r.length?1:0,controls:Number("true"===i),branding:Number("true"===a),intro:Number("true"===s),start:Number(c),end:Number(u),loop:Number(l)})),n}function is(t,e){var r=t.find(".video-wrapper"),n=t.find(".brz-video__cover"),o=t.find(".brz-video-data"),i="true"===o.attr("data-loop"),a=Number(o.attr("data-start")),s=Number(o.attr("data-end")),c="on"===o.attr("data-autoplay"),u=t[0].classList.contains("brz-youtube-video"),l=os(t),d=f()("<iframe/>",{class:"brz-iframe intrinsic-ignore",allowfullscreen:!0,allow:"autoplay",src:l});setTimeout((function(){u?Za&&(r.append(d),e||n.remove()):(r.append(d),n.remove())}),0);var p=n.length;if(u&&Za)return ts(d.get(0),c,i,a,s,p,e)}function as(t){var e=Math.floor(t/60),r=Math.floor(t%60);return e+":"+(r<10?"0"+r:r)}function ss(t,e){return e=e||2,+(Math.round(t+"e+"+e)+"e-"+e)}function cs(t,e){var r=f()(t.children()[0]),n=f()(t.children()[1]);e?(r.addClass("brz-hidden"),n.removeClass("brz-hidden")):(r.removeClass("brz-hidden"),n.addClass("brz-hidden"))}function us(t,e){var r=t.width();return 100*(e-t.offset().left)/r}function ls(t){var e=t.find(".brz-video-custom-controls .brz-video-custom-slider"),r=t.find(".brz-video__cover"),n=t.find(".brz-shortcode__placeholder"),o=t.find(".brz-video-custom-volume-controls"),i=t.find(".brz-video-custom-controls .brz-video-custom-progress"),a=t.find(".brz-video-custom-volume-controls .brz-video-custom-progress"),s=t.find("video")[0],c=s.getAttribute("data-time-start"),u=Number(s.getAttribute("data-time-end"))||1/0,l=t.find(".brz-video-custom-play-pause-btn");s.src&&(cs(l,s.paused),s.paused?s.play():s.pause(),r.addClass("brz-hidden"),n.addClass("brz-hidden"),t.find("video").removeAttr("class"),s.duration||(s.addEventListener("loadedmetadata",(function(e){var r=as(e.target.duration),n=as(c);s.currentTime=c,t.find(".brz-video-custom-total-time").html(r),t.find(".brz-video-custom-current-time").html(n)})),s.addEventListener("timeupdate",(function(e){var r=e.target.currentTime,n=r/e.target.duration*100;i.css("width",ss(n)+"%"),t.find(".brz-video-custom-current-time").html(as(r)),r>=u&&(s.pause(),u=1/0)})),s.addEventListener("ended",(function(){cs(l,!1)})),s.addEventListener("play",(function(){cs(l,!0)})),s.addEventListener("pause",(function(){cs(l,!1)})),window.addEventListener("mousedown",(function(t){var r,n=f()(t.target).closest(e).length,i=f()(t.target).closest(o).length;n&&(r=us(e,t.pageX),s.currentTime=r*s.duration/100),i&&(r=us(o,t.pageX),a.css("width",ss(r)+"%"),s.volume=r/100)}))))}function fs(t,e){var r=t.find(".brz-video-custom-volume-controls .brz-video-custom-progress"),n=t.find("video")[0],o=t.find(".brz-video-custom-volume-btn");if(n.src){cs(o,e),n.muted=e;var i=e?0:100*n.volume;r.css("width",ss(i)+"%")}}window.Brz={emitter:{events:{},emit(t,...e){for(let r of this.events[t]||[])r(...e)},on(t,e){return(this.events[t]=this.events[t]||[]).push(e),()=>this.events[t]=this.events[t].filter((t=>t!==e))}},on:function(t,e){return this.emitter.on(t,e)},emit:function(t){for(var e,r=arguments.length,n=new Array(r>1?r-1:0),o=1;o<r;o++)n[o-1]=arguments[o];(e=this.emitter).emit.apply(e,[t].concat(n))}},window.Brz.on("init.dom",(function(e){var r;r=e,Object.values(t).forEach((function(t){t(r)})),Object.values(o).forEach((function(t){t(r)}))}));var ds=function(t){if(t)return H(t)};function ps(t){var e=s().Motions;e&&t.get(0).querySelectorAll(".brz-motion--effects").forEach((function(t){var r=t.dataset,n=r.motionScrollVertical,o=r.motionScrollHorizontal,i=r.motionScrollTransparency,a=r.motionScrollRotate,s=r.motionScrollScale,c=r.motionScrollBlur,u=r.motionMouseTrack,l=r.motionMouseFit,f=r.motionResponsive,d=function(t){var e=t.scrollVertical,r=t.scrollHorizontal,n=t.scrollTransparency,o=t.scrollRotate,i=t.scrollScale,a=t.scrollBlur,s=t.mouseTrack,c=t.mouseFit,u=[],l=[];if(e){var f=e.scrollStep,d=e.direction,p=e.viewport;u.push({type:"vertical",scrollStep:Number(null!=f?f:1),direction:d,viewport:p})}if(r){var h=r.scrollStep,v=r.direction,m=r.viewport;u.push({type:"horizontal",scrollStep:Number(null!=h?h:1),direction:v,viewport:m})}if(n){var b=n.scrollStep,g=n.direction,y=n.viewport;u.push({type:"transparency",scrollStep:Number(null!=b?b:1),direction:g,viewport:y})}if(o){var w=o.scrollStep,_=o.direction,z=o.viewport,S=o.xPosition,x=void 0===S?"center":S,E=o.yPosition,k=void 0===E?"center":E;u.push({type:"rotate",scrollStep:Number(null!=w?w:1),viewport:z,direction:_,xPosition:x,yPosition:k})}if(i){var A=i.scrollStep,O=i.direction,T=i.viewport,P=i.xPosition,j=void 0===P?"center":P,C=i.yPosition,L=void 0===C?"center":C;u.push({type:"scale",scrollStep:Number(null!=A?A:1),direction:O,xPosition:j,yPosition:L,viewport:T})}if(a){var I=a.scrollStep,N=a.direction,q=a.viewport;u.push({type:"blur",scrollStep:Number(null!=I?I:1),direction:N,viewport:q})}if(s){var M=s.type,R=s.distance,D=s.direction;l.push({type:M,direction:D,distance:R})}if(c){var B=c.type,F=c.distance,H=c.direction;l.push({type:B,direction:H,distance:F})}return{mouse:l,scroll:u}}({scrollVertical:ds(n),scrollHorizontal:ds(o),scrollTransparency:ds(i),scrollRotate:ds(a),scrollScale:ds(s),scrollBlur:ds(c),mouseTrack:ds(u),mouseFit:ds(l)}),p=d.scroll,h=d.mouse;new e(t,{scroll:p,mouse:h,responsive:ds(f)})}))}const hs=function(t){var e=t.get(0).querySelectorAll(".brz-calendly");e.length&&(function(t,e){if(!t.getElementById(e)){var r=t.createElement("script");r.setAttribute("id",e),r.setAttribute("async","true"),r.setAttribute("src","https://assets.calendly.com/assets/external/widget.js"),t.body.appendChild(r)}}(document,"brz-calendly-wjs"),e.forEach((function(t){var e=t.getAttribute("data-url");if(e){var r=document.createElement("div");r.setAttribute("data-url",e),r.className="calendly-inline-widget",null==t||t.appendChild(r)}})))};function vs(t){var e=t.closest("[dir='rtl']").length>0;t.find(".brz-carousel__slider").each((function(){var t=this,r=f()(this),n=r.data(),o=n.slidesToShow,i=n.slidesToScroll,a=n.dots,s=n.dotsClass,c=n.arrows,u=n.fade,l=n.vertical,d=n.autoPlay,p=n.autoPlaySpeed,h=n.swipe,v=JSON.parse(decodeURIComponent(n.responsive));r.on("init",(function(){r.find(".brz-image__lightbox").each((function(){f()(this).magnificPopup({delegate:"a",type:"image",closeOnContentClick:!0})}))}));var m,b,g=(m=t,b=f()(m).children(".brz-icon-svg").removeClass("brz-hidden"),f()(m).children(".brz-icon-svg").remove(),function(t){return'<div class="brz-slick-slider__arrow '.concat(t,'">').concat(b[0].outerHTML,"</div>")}),y=r.slick({slidesToShow:o,slidesToScroll:i,swipe:h,dots:a,dotsClass:s,arrows:c,fade:u,vertical:l,responsive:v,useTransform:!1,speed:350,draggable:h,nextArrow:c&&g("brz-slick-slider__arrow-next"),prevArrow:c&&g("brz-slick-slider__arrow-prev"),autoplay:d,autoplaySpeed:p,rtl:e});["elements.tabs.changed","elements.accordion.changed","elements.switcher.changed","elements.mmenu.panel.opened"].forEach((function(e){window.Brz.on(e,(function(e){e&&e.contains(t)&&y.slick("setPosition")}))}))}))}function ms(t){var e=t.get(0);e.querySelectorAll(".brz-filters__main").forEach((function(t){switch(t.getAttribute("data-filter-type")){case"range":!function(t){var e,r=t.querySelector("#brz-filters__range--input-left"),n=t.querySelector("#brz-filters__range--input-right"),o=null===(e=t.querySelector(".brz-filters__option.brz-filters__range"))||void 0===e?void 0:e.getAttribute("data-show-text"),i=t.querySelector(".brz-filters__range--slider > .brz-filters__range--thumb.brz-filters__range--thumb--left"),a=t.querySelector(".brz-filters__range--slider > .brz-filters__range--thumb.brz-filters__range--thumb--right"),s=t.querySelector(".brz-filters__range--slider > .brz-filters__range--range"),c=t.querySelector(".brz-filters__range__text > .brz-filters__range--min"),u=t.querySelector(".brz-filters__range__text > .brz-filters__range--max");function l(){if(r&&n){var t=parseInt(r.min),e=parseInt(r.max),a=parseInt(r.step);r.value=Math.min(parseInt(r.value),parseInt(n.value)-a).toString();var u=(Number(r.value)-t)/(e-t)*100;"on"===o&&c&&(c.innerText=r.value),i&&(i.style.left=u+"%"),s&&(s.style.left=u+"%")}}function f(){if(r&&n){var t=parseInt(n.min),e=parseInt(n.max),i=parseInt(n.step);n.value=Math.max(parseInt(n.value),parseInt(r.value)+i).toString();var c=(Number(n.value)-t)/(e-t)*100;"on"===o&&u&&(u.innerText=n.value),a&&(a.style.right=100-c+"%"),s&&(s.style.right=100-c+"%")}}l(),f(),n&&n.addEventListener("input",(function(){return f()})),r&&r.addEventListener("input",(function(){return l()}))}(t);break;case"radio":!function(t){var e="brz-filters__radio-option--active";t.addEventListener("change",(function(){t.querySelectorAll(".brz-input").forEach((function(t){var r=t.closest(".brz-filters__radio-option");!t.checked||null!=r&&r.classList.contains(e)?null!=r&&r.classList.contains(e)&&r.classList.remove(e):null==r||r.classList.add(e)}))}))}(t);break;case"checkbox":case"checkrange":!function(t){var e="brz-filters__checkbox-option--active";t.addEventListener("change",(function(){t.querySelectorAll(".brz-input").forEach((function(t){var r=t.closest(".brz-filters__checkbox-option");!t.checked||null!=r&&r.classList.contains(e)?!t.checked&&null!=r&&r.classList.contains(e)&&r.classList.remove(e):null==r||r.classList.add(e)}))}))}(t);break;case"active":!function(t){var e=t.querySelector(".brz-filters__tags");e&&e.addEventListener("click",(function(t){var e=t.target;if(e instanceof Element){var r,n=e.closest(".brz-filters__option");null==n||null===(r=n.parentNode)||void 0===r||r.removeChild(n)}}))}(t);break;case"rating":!function(t){for(var e=t.querySelectorAll(".brz-starrating-icon-wrap"),r=function(t){e[t].starValue=t+1,["mouseover","mouseout","click"].forEach((function(r){e[t].addEventListener(r,(function(t){return function(t){var r=t.type,n="brz-filters__rating-hover",o=t.target,i=0;if(o instanceof Element){var a,s=o.closest(".brz-starrating-icon-wrap");i=parseInt(null!==(a=null==s?void 0:s.getAttribute("starValue"))&&void 0!==a?a:"0")}e.forEach((function(t,e){var o=t.querySelector(".brz-filters__rating--color");switch(r){case"click":o&&e<i?o.style.width="100%":o&&(o.style.width="0%");break;case"mouseover":o&&e<i?(t.classList.add(n),o.style.width="100%"):o&&(t.classList.remove(n),o.style.width="0%");break;case"mouseout":t.classList.remove(n)}}))}(t)}))}))},n=0;n<e.length;n++)r(n)}(t);break;case"select":t.querySelectorAll(".brz-filters__wrapper .brz-filters__select").forEach((function(t){!function(t){var e,r=f()(t),n=r.find(".brz-filters__select-option");n.select2({width:"100%",minimumResultsForSearch:1/0,dropdownParent:r}),n.on("select2:opening",(function(){setTimeout((function(){var t=r.find(".select2-dropdown"),n=parseInt(t.find(".select2-results__options .select2-results__option").css("height"));t.css("maxHeight",5*n);var o=s().Scrollbars;if(t.length&&o){var i=t.get(0);e=new o(i)}}),0)})),n.on("select2:close",(function(){e&&(e.destroy(),e=null)}))}(t)}));break;case"date":!function(t){var e=t.querySelector(".brz-filters__option.brz-filters__date-option--from"),r=t.querySelector(".brz-filters__option.brz-filters__date-option--to"),n="on"===(null==e?void 0:e.getAttribute("data-native"))&&"on"===(null==r?void 0:r.getAttribute("data-native")),o=s().Flatpickr;!n&&o&&e&&r&&(o(e,{}),o(r,{}))}(t)}}))}function bs(t){var e=c(),r=e.Isotope,n=e.ImagesLoaded;r&&n&&(t.find(".brz-image__gallery").each((function(){var t,e,o=this,i=f()(this).children(".brz-image__gallery-wrapper").get(0);n(i,(function(){e=new r(i,{itemSelector:".brz-image__gallery-item",masonry:{columnWidth:".brz-image__gallery-item"}}),f()(i).data("isotope",e)})),null===(t=o.querySelector("ul.brz-image__gallery-filter"))||void 0===t||t.firstChild.classList.add("brz-image__gallery-filter__item--active"),f()(".brz-image__gallery--filter-wrapper",o).on("click",(function(t){var r=t.target.closest(".brz-image__gallery-filter__item"),n="brz-image__gallery-filter__item--active";if(f()(r).hasClass(n)||(f()(r).addClass(n),f()(r).siblings().removeClass(n)),null!=r&&r.className.includes("brz-image__gallery-filter__item")){var o=r.dataset.filter,i=void 0===o?"*":o;e.arrange({filter:"*"===i?"*":".".concat(i)})}})),["elements.tabs.changed","elements.accordion.changed","elements.switcher.changed"].forEach((function(t){window.Brz.on(t,(function(t){e&&t&&t.contains(o)&&e.arrange()}))}))})),t.find(".brz-image__gallery-lightbox").each((function(){f()(this).magnificPopup({delegate:"a",type:"image",gallery:{enabled:!0}})})))}function gs(t){var e=c().Lottie;e&&t.get(0).querySelectorAll(".brz-lottie-anim").forEach((function(t){var r=t.getAttribute("data-animate-name"),n=t.getAttribute("data-anim-loop"),o=t.getAttribute("data-anim-speed"),i=t.getAttribute("data-anim-autoplay"),a=t.getAttribute("data-anim-direction"),s=t.getAttribute("data-render-type"),c=e.loadAnimation({container:t,loop:"on"===n,autoplay:"on"===i,path:r,renderer:s,rendererSettings:{preserveAspectRatio:"svg"===s?"xMidYMid slice":"xMidYMid meet"}});c.setSpeed(o),c.setDirection(a)}))}var ys=function(t){var e,r;return null!==(e=null===(r=t.closest(".brz-mega-menu__portal"))||void 0===r?void 0:r.getAttribute("data-mega-menu-uid"))&&void 0!==e?e:void 0};function ws(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}var _s=f()(document).find(".brz-root__container"),zs=new Map,Ss=new Map,xs=function(){var t=window.innerWidth,e="desktop";return t<992&&(e="tablet"),t<768&&(e="mobile"),e},Es=xs(),ks=function(t,e){var r,n=t.placement;return null!==(r=null==n?void 0:n[e])&&void 0!==r?r:"bottom"},As=function(t,e){var r,n=ks(t,e);return[{name:"flip",options:{fallbackPlacements:"horizontal"===(null===(r=t.mods)||void 0===r?void 0:r[e])?[n,"top","auto"]:[n,"right-start","auto"]}}]},Os=function(t){var e=zs.get(t);if(e){e.dataset.opened="false",e.classList.remove("brz-mega-menu__portal--opened"),e.style.maxHeight="none",e.style.display="none",e.style.overflow="visible";var r=document.querySelector('[data-mega-menu-open-uid="'.concat(t,'"]'));r&&r.classList.remove("brz-menu__item--opened")}},Ts=function(t){zs.forEach((function(e,r){"true"!==e.dataset.opened||null!=t&&t.includes(r)||Os(r)}))},Ps=function(t){var e=t.target;if(e instanceof Element){var r,n,o=e.closest(".brz-menu__item-mega-menu");o&&(r=null!==(n=o.getAttribute("data-mega-menu-open-uid"))&&void 0!==n?n:""),zs.forEach((function(t,n){var i="true"===t.dataset.opened,a=e.closest('[data-mega-menu-uid="'.concat(n,'"]'));if(!(i&&a||o&&r===n)){var s=ys(e);if(s){var c=document.querySelector('[data-mega-menu-open-uid="'.concat(s,'"]'));if(c){var u=c.closest(".brz-mega-menu__portal");if(u&&"true"===u.dataset.opened&&u.dataset.megaMenuUid===n)return}}Os(n)}}))}},js=function(t,e){var r,n=c().CreatePopper;if(n){var o=t.querySelector(".brz-mega-menu__portal"),i=Es;if(t.popper&&(t.popper.destroy(),t.popper=null),"mobile"===i&&(o||(function(t,e){var r=t.getAttribute("data-mega-menu-open-uid"),n=e.querySelector('[data-mega-menu-uid="'.concat(r,'"]'));n&&t.appendChild(n)}(t,e),o=t.querySelector(".brz-mega-menu__portal")),o)){var a,s,u=null!==(a=o.dataset.settings)&&void 0!==a?a:"",l=JSON.parse(decodeURIComponent(u));if("vertical"===(null==l||null===(s=l.mods)||void 0===s?void 0:s[i]))return}if(("tablet"===i||"desktop"===i)&&!o){var f=t.getAttribute("data-mega-menu-open-uid");o=e.querySelector('[data-mega-menu-uid="'.concat(f,'"]'))}if(o){var d=null!==(r=o.dataset.settings)&&void 0!==r?r:"",p=JSON.parse(decodeURIComponent(d));"tablet"!==i&&"desktop"!==i||function(t,e){var r=t.querySelector(".brz-mega-menu__portal");r&&e.appendChild(r)}(t,e);var h=function(t,e,r){var n;return"horizontal"===(null===(n=e.mods)||void 0===n?void 0:n[r])?t.closest(".brz-menu"):t.closest(".brz-menu__ul")}(t,p,i);if(h){var v,m=n(h,o,{placement:ks(p,i),modifiers:As(p,i)}),b=null!==(v=t.getAttribute("data-mega-menu-open-uid"))&&void 0!==v?v:"";t.popper=m,t.addEventListener("mouseenter",function(t,e,r){return function(){var n=zs.get(r);if(n){var o=[r],i=ys(e);i&&o.push(i),Ts(o),n.dataset.opened="true",n.style.display="block",e.classList.add("brz-menu__item--opened"),requestAnimationFrame((function(){var r,o=null!==(r=n.dataset.settings)&&void 0!==r?r:"",i=JSON.parse(decodeURIComponent(o)),a=function(t,e,r){var n,o=e.widths,i=e.mods,a=null!==(n=null==o?void 0:o[r])&&void 0!==n?n:"100",s=parseInt(a),c=null==i?void 0:i[r],u=t.closest(".brz-menu");if("horizontal"===c&&"mobile"===r||!u)return a;var l,f=document.body.clientWidth,d=u.getBoundingClientRect(),p=t.getBoundingClientRect(),h=p.left,v=f-p.right;if(l=a.includes("vw")?s>=100?f:f*(s/100):a.includes("%")?d.width*(s/100):s,"vertical"===c&&h<l&&v<l){var m=h-5,b=v-5;return"".concat(Math.max(m,b),"px")}return"".concat(l,"px")}(e,i,Es);n.style.width="mobile"===Es&&"100vw"===a?"100vw":"100%",n.style.maxWidth=a,t.update().then((function(){var t=n.getBoundingClientRect(),e=window.innerHeight;if(e<t.top){var r=t.top-e,o=t.height-r-20;n.style.maxHeight="".concat(o,"px"),n.style.overflow="auto"}if(e<t.bottom){var i=t.bottom-e,a=t.height-i-20;n.style.maxHeight="".concat(a,"px"),n.style.overflow="auto"}requestAnimationFrame((function(){n.classList.add("brz-mega-menu__portal--opened")}))}))}))}}}(m,t,b))}}}};function Cs(t){var e=c(),r=e.MMenu,n=e.Dropdown;if(r){var o=t.get(0);o.querySelectorAll("[data-menu-items-active]").forEach((function(t){var e=t.closest(".brz-menu__mmenu"),r=t.dataset.menuItemsActive||"",n=e?"brz-mm-menu__item--current":"brz-menu__item--current",o=r.split(",").map((function(t){return"[data-menu-item-id='".concat(t,"']")})).join(","),i=t.querySelectorAll(".".concat(n)),a=t.querySelectorAll(o);i.forEach((function(t){t.classList.remove(n)})),a.forEach((function(t){null==t||t.classList.add(n)}))}));var i=void 0,a=void 0;o.querySelectorAll("[data-mmenu-id]").forEach((function(t){var e=t.dataset,n=e.mmenuId,s=e.mmenuPosition,c=e.mmenuTitle,u=S(t.children).find((function(t){return t.classList.contains("brz-mm-menu__icon")})),l="on"===F(t.getAttribute("data-mmenu-stickyTitle"));if(n&&u){var f={extensions:["theme-dark","pagedim-black","border-full","position-front",s],slidingSubmenus:!1,navbar:{title:c,titleLink:"custom",sticky:l},hooks:{"openPanel:after":function(t){window.Brz.emit("elements.mmenu.panel.opened",t)},"closePanel:after":function(t){window.Brz.emit("elements.mmenu.panel.closed",t)},"open:start":function(){window.Brz.emit("elements.mmenu.open",this.node.pnls)},"close:start":function(){window.Brz.emit("elements.mmenu.close",this.node.pnls),i=void 0},"close:finish":function(){if(a){var t=o.querySelector("".concat(a,".brz-mm-menu"));null!=t&&t.mmApi&&(t.mmApi.open(),a=void 0)}}}},d=(1===_s.length?new r(n,f,{offCanvas:{menu:{insertSelector:".brz-root__container"},page:{wrapIfNeeded:!1,selector:".brz-root__container"}}}):new r(n,f)).API;u.addEventListener("click",(function(){if(i){var t=o.querySelector("".concat(i,".brz-mm-menu"));t&&t.mmApi&&(a=n,t.mmApi.close(n))}else i=n,null==d||d.open()})),window.Brz.on("elements.anchor.startScrolled",(function(){null==d||d.close()}))}})),o.querySelector(".brz-menu__item-mega-menu")&&(window.Brz.on("elements.headerSticky.show",(function(t){"animated"===t.type&&o.querySelectorAll(".brz-menu__item--opened").forEach((function(t){var e,r=null!==(e=t.getAttribute("data-mega-menu-open-uid"))&&void 0!==e?e:"";Os(r)}))})),window.Brz.on("elements.headerSticky.hide",(function(t){var e=t.node;"animated"===t.type&&e.querySelectorAll(".brz-menu__item--opened").forEach((function(t){var e,r=null!==(e=t.getAttribute("data-mega-menu-open-uid"))&&void 0!==e?e:"";Os(r)}))}))),o.querySelectorAll(".brz-menu__item-mega-menu").forEach((function(t){var e=t.querySelector(".brz-mega-menu__portal");if(e){var r=Ki();t.setAttribute("data-mega-menu-open-uid",r),e.setAttribute("data-mega-menu-uid",r),zs.set(r,e),js(t,o)}})),n&&o.querySelectorAll(".brz-menu__item-dropdown").forEach((function(t){var e=Es,r=S(t.children).find((function(t){return t.classList.contains("brz-menu__dropdown")}));if(r instanceof HTMLElement){var o,i=null!==(o=r.dataset.settings)&&void 0!==o?o:"",a=H(i),s=new n(t,r,{placement:ks(a,e),offset:5,disabled:{position:"desktop"!==e},onOpen:function(){var e=ys(t);Ts(e?[e]:void 0)}});Ss.set(s,a)}}));var s=kn(Ps,150);window.addEventListener("resize",function(t){return function(){var e=t.querySelectorAll(".brz-menu__item-mega-menu"),r=xs();if(r!==Es){Es=r,e.forEach((function(e){js(e,t)}));var n,o=function(t,e){var r="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=function(t,e){if(t){if("string"==typeof t)return ws(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?ws(t,e):void 0}}(t))||e&&t&&"number"==typeof t.length){r&&(t=r);var n=0,o=function(){};return{s:o,n:function(){return n>=t.length?{done:!0}:{done:!1,value:t[n++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,s=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return a=t.done,t},e:function(t){s=!0,i=t},f:function(){try{a||null==r.return||r.return()}finally{if(s)throw i}}}}(Ss);try{for(o.s();!(n=o.n()).done;){var i=x(n.value,2),a=i[0],s=i[1];a.update({disabled:{position:"desktop"!==r},placement:ks(s,Es)})}}catch(t){o.e(t)}finally{o.f()}}}}(o)),document.addEventListener("mousemove",s)}}function Ls(t){t.find(".brz-section__header--animated").brzSticky({type:"animated",refNode:function(){return f()(this).closest(".brz-section__header").get(0)},onStickyChange:function(t){f()(this).toggleClass("brz-section__header--animated-closed",!t),f()(this).toggleClass("brz-section__header--animated-opened",t),t?window.Brz.emit("elements.headerSticky.show",{node:this,type:"animated"}):window.Brz.emit("elements.headerSticky.hide",{node:this,type:"animated"})}}),t.find(".brz-section__header--fixed").brzSticky({type:"fixed",refNode:function(){return f()(this).closest(".brz-section__header").get(0)},onStickyChange:function(t){var e=f()(this),r=f()(this).closest(".brz-section__header");if(t){var n=e.children().css("marginTop"),o={height:e.outerHeight()};parseInt(n)<0&&r.css({marginTop:n}),e.addClass("brz-section__header--fixed-opened"),e.closest(".brz-section__header").css(o),window.Brz.emit("elements.headerSticky.show",{node:this,type:"fixed"})}else e.removeClass("brz-section__header--fixed-opened"),e.closest(".brz-section__header").css({height:"auto"}),r.css({marginTop:""}),window.Brz.emit("elements.headerSticky.hide",{node:this,type:"fixed"})}})}function Is(t){t.find(".brz-switcher").each((function(){var t=f()(this),e=t.find("> .brz-switcher__nav"),r=t.find("> .brz-switcher__nav .brz-switcher__nav--item"),n=t.find("> .brz-switcher__content--tab");r.on("click",(function(){e.toggleClass("brz-switcher__nav--active"),r.toggleClass("brz-switcher__nav--item--active"),n.toggleClass("brz-switcher__content--tab--active"),window.Brz.emit("elements.switcher.changed",t.get(0),{active:t.find(".brz-switcher__content--tab--active").get(0),tabs:n.get()})}));var o=t.find("> .brz-switcher__nav2 .brz-switcher__nav2--control"),i=t.find("> .brz-switcher__nav2 .brz-switcher__nav2--button");o.on("click",(function(){o.toggleClass("brz-switcher__nav2--control--active"),n.toggleClass("brz-switcher__content--tab--active"),i.toggleClass("brz-switcher__nav2__item--active"),window.Brz.emit("elements.switcher.changed",t.get(0),{active:t.find(".brz-switcher__content--tab--active").get(0),tabs:n.get()})}))}))}var Ns=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=new URL(t);return Object.entries(e).forEach((function(t){var e=x(t,2),n=e[0],o=e[1];r.searchParams.set(n,o)})),r.href},qs=!1;function Ms(t){var e=f()(window),r=f()(document),n=!1;t.find(".brz-video-playlist").on("click",(function(t){var r=f()(this),o=f()(t.target),i=o.closest(".brz-video-playlist-video-item"),a=o.closest(".brz-video-playlist-main__cover"),s=r.find(".brz-video-playlist-main__video"),c=r.find(".brz-video-playlist-main__placeholder"),u=e.innerWidth()<767,l="brz-video-playlist-video-item--active";if(o.hasClass(l)||(o.addClass(l),o.siblings().removeClass(l)),i.length){var d=i.attr("data-link");r.find(".brz-video-playlist-main").addClass("brz-d-none"),r.find(".brz-video-playlist-video-item").removeClass("brz-video-playlist-video-item--active"),i.addClass("brz-video-playlist-video-item--active"),d?(s.removeClass("brz-d-none"),s.find(".brz-iframe").attr("src",Ns(d,{autoplay:1})),u?s.addClass("brz-video-playlist-modal"):s.removeClass("brz-video-playlist-modal")):(c.removeClass("brz-d-none"),s.find(".brz-iframe").attr("src",""),u?c.addClass("brz-video-playlist-modal"):c.removeClass("brz-video-playlist-modal"))}else u&&(s.removeClass("brz-video-playlist-modal").find(".brz-iframe").attr("src",""),c.removeClass("brz-video-playlist-modal"),n=!0);if(a.length){t.preventDefault();var p=a.find(".brz-play-button").attr("data-video-url");a.addClass("brz-d-none"),s.removeClass("brz-d-none"),s.find(".brz-iframe").attr("src",Ns(p,{autoplay:1}))}})),qs||(qs=!0,e.on("resize",(function(){if(n&&e.innerWidth()>=767){var t=f()(".brz-video-playlist"),r=t.find(".brz-video-playlist-video-item--active");if(n=!1,r.length){var o=t.find(".brz-video-playlist-main__cover"),i=t.find(".brz-video-playlist-main__video"),a=t.find(".brz-video-playlist-main__placeholder"),s=r.hasClass("brz-video-playlist-video-item__cover"),c=r.attr("data-link");t.find(".brz-video-playlist-main").addClass("brz-d-none"),s?(o.removeClass("brz-d-none"),o.find(".brz-iframe").remove()):c?(i.removeClass("brz-d-none"),i.find(".brz-iframe").attr("src",c)):(a.removeClass("brz-d-none"),i.find(".brz-iframe").attr("src",""))}}}))),r.on("brz.popup.close",(function(t,e){f()(e).find(".brz-video-playlist .brz-iframe").each((function(){var t=f()(this),e=t.attr("src");t.attr("src",""),t.attr("src",Ns(e,{autoplay:0}))}))}))}function Rs(t){t.get(0).querySelectorAll(".brz-posts").forEach((function(t){var e=t.querySelector(".brz-posts__filter-wrapper");if(e){var r=t.classList.contains("brz-posts--masonry"),n=t.querySelector(".brz-posts__wrapper"),o=t.querySelectorAll(".brz-posts__item");if(r){var i,a,s=c(),u=s.ImagesLoaded,l=s.Isotope;if(!u||!l)return;var d=t.querySelector(".brz-posts__wrapper");null!==d&&u(d,(function(){a=new l(d,{layoutMode:"masonry"})})),["elements.tabs.changed","elements.accordion.changed","elements.switcher.changed"].forEach((function(e){window.Brz.on(e,(function(e){a&&e&&e.contains(t)&&a.arrange({})}))}));var p="brz-posts-filter__item--active";null===(i=t.querySelector(".brz-posts__filter__item:first-child"))||void 0===i||i.classList.add(p),f()(".brz-posts__filter",t).on("click",".brz-posts__filter__item",(function(){var t=f()(this);t.hasClass(p)||(t.siblings().removeClass(p),t.addClass(p));var e=this.getAttribute("data-filter")||"*";a.arrange({filter:"*"===e?e:'[data-filter*="'.concat(e,'"]')})}))}else{var h,v="brz-posts-filter__item--active";null===(h=t.querySelector(".brz-posts__filter__item:first-child"))||void 0===h||h.classList.add(v),e.querySelectorAll(".brz-posts__filter__item").forEach((function(t){t.addEventListener("click",(function(){var r=t.dataset.filter,i=void 0===r?"*":r,a=Array.from(o).filter((function(t){var e=t.dataset.filter;return"*"===i?t:i===(void 0===e?"*":e)}));if(n&&n.replaceChildren.apply(n,S(a)),!t.classList.contains(v)){var s=e.querySelector(".".concat(v));s&&s.classList.remove(v),t.classList.add(v)}}))}))}}}))}function Ds(t){t.find(".brz-woo-add-to-cart").each((function(){var e=t.find(".variations_form").get(0);if(e&&Boolean(t.find(".woocommerce-product-gallery").get(0))){var r=function(t,e){for(;t;){if(e(t))return t;t=t.parentElement}}(e,(function(t){return null!=t.querySelector(".woocommerce-product-gallery")}));r&&r.classList.add("product")}}))}function Bs(){f()(this).closest(".brz-woocart__wrapper").addClass("brz-woocart__wrapper--opened"),f()(document.body).addClass("brz-ow-hidden brz-woocart--opened")}function Fs(){f()(this).closest(".brz-woocart__wrapper").removeClass("brz-woocart__wrapper--opened"),f()(document.body).removeClass("brz-ow-hidden brz-woocart--opened")}function Hs(t){t.find(".brz-woocart__wrapper").each((function(){var t=f()(this),e=t.find(".brz-woocart"),r=t.find(".brz-woocart__sidebar-close"),n=t.find(".brz-woocart__background");e.on("click",Bs),r.on("click",Fs),n.on("click",Fs)}))}window.Brz.on("init.dom",(function(t){Object.values(i).forEach((function(e){e(t)})),Object.values(a).forEach((function(e){e(t)}))}))})()})();
;

document.addEventListener('DOMContentLoaded', () => window.Brz.emit("init.dom", jQuery(document.body)));
//# sourceURL=brizy-asset-main-30-js-after

;

jQuery.uiBackCompat = true;
jQuery.uiBackCompat = true;
//# sourceURL=jquery-ui-core-js-before

;
/*! jQuery UI - v1.14.2 - 2026-07-15
* https://jqueryui.com
* Includes: widget.js, position.js, data.js, disable-selection.js, focusable.js, form-reset-mixin.js, jquery-patch.js, keycode.js, labels.js, scroll-parent.js, tabbable.js, unique-id.js
* Copyright OpenJS Foundation and other contributors; Licensed MIT */
!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery"],t):t(jQuery)}(function(x){"use strict";x.ui=x.ui||{};x.ui.version="1.14.2";
/*!
 * jQuery UI Widget 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 */var o,n,W,C,s,r,l,a,h,i,f=0,c=Array.prototype.hasOwnProperty,u=Array.prototype.slice;x.cleanData=(o=x.cleanData,function(t){for(var e,i,n=0;null!=(i=t[n]);n++)(e=x._data(i,"events"))&&e.remove&&x(i).triggerHandler("remove");o(t)}),x.widget=function(t,i,e){var n,o,s,r,l={},a=t.split(".")[0];return"__proto__"===(t=t.split(".")[1])||"constructor"===t?x.error("Invalid widget name: "+t):(r=a+"-"+t,e||(e=i,i=x.Widget),Array.isArray(e)&&(e=x.extend.apply(null,[{}].concat(e))),x.expr.pseudos[r.toLowerCase()]=function(t){return!!x.data(t,r)},x[a]=x[a]||{},n=x[a][t],o=x[a][t]=function(t,e){if(!this||!this._createWidget)return new o(t,e);arguments.length&&this._createWidget(t,e)},x.extend(o,n,{version:e.version,_proto:x.extend({},e),_childConstructors:[]}),(s=new i).options=x.widget.extend({},s.options),x.each(e,function(e,n){function o(){return i.prototype[e].apply(this,arguments)}function s(t){return i.prototype[e].apply(this,t)}l[e]="function"!=typeof n?n:function(){var t,e=this._super,i=this._superApply;return this._super=o,this._superApply=s,t=n.apply(this,arguments),this._super=e,this._superApply=i,t}}),o.prototype=x.widget.extend(s,{widgetEventPrefix:n&&s.widgetEventPrefix||t},l,{constructor:o,namespace:a,widgetName:t,widgetFullName:r}),n?(x.each(n._childConstructors,function(t,e){var i=e.prototype;x.widget(i.namespace+"."+i.widgetName,o,e._proto)}),delete n._childConstructors):i._childConstructors.push(o),x.widget.bridge(t,o),o)},x.widget.extend=function(t){for(var e,i,n=u.call(arguments,1),o=0,s=n.length;o<s;o++)for(e in n[o])i=n[o][e],c.call(n[o],e)&&void 0!==i&&(x.isPlainObject(i)?t[e]=x.isPlainObject(t[e])?x.widget.extend({},t[e],i):x.widget.extend({},i):t[e]=i);return t},x.widget.bridge=function(s,e){var r=e.prototype.widgetFullName||s;x.fn[s]=function(i){var t="string"==typeof i,n=u.call(arguments,1),o=this;return t?this.length||"instance"!==i?this.each(function(){var t,e=x.data(this,r);return"instance"===i?(o=e,!1):e?"function"!=typeof e[i]||"_"===i.charAt(0)?x.error("no such method '"+i+"' for "+s+" widget instance"):(t=e[i].apply(e,n))!==e&&void 0!==t?(o=t&&t.jquery?o.pushStack(t.get()):t,!1):void 0:x.error("cannot call methods on "+s+" prior to initialization; attempted to call method '"+i+"'")}):o=void 0:(n.length&&(i=x.widget.extend.apply(null,[i].concat(n))),this.each(function(){var t=x.data(this,r);t?(t.option(i||{}),t._init&&t._init()):x.data(this,r,new e(i,this))})),o}},x.Widget=function(){},x.Widget._childConstructors=[],x.Widget.prototype={widgetName:"widget",widgetEventPrefix:"",defaultElement:"<div>",options:{classes:{},disabled:!1,create:null},_createWidget:function(t,e){e=x(e||this.defaultElement||this)[0],this.element=x(e),this.uuid=f++,this.eventNamespace="."+this.widgetName+this.uuid,this.bindings=x(),this.hoverable=x(),this.focusable=x(),this.classesElementLookup={},e!==this&&(x.data(e,this.widgetFullName,this),this._on(!0,this.element,{remove:function(t){t.target===e&&this.destroy()}}),this.document=x(e.style?e.ownerDocument:e.document||e),this.window=x(this.document[0].defaultView||this.document[0].parentWindow)),this.options=x.widget.extend({},this.options,this._getCreateOptions(),t),this._create(),this.options.disabled&&this._setOptionDisabled(this.options.disabled),this._trigger("create",null,this._getCreateEventData()),this._init()},_getCreateOptions:function(){return{}},_getCreateEventData:x.noop,_create:x.noop,_init:x.noop,destroy:function(){var i=this;this._destroy(),x.each(this.classesElementLookup,function(t,e){i._removeClass(e,t)}),this.element.off(this.eventNamespace).removeData(this.widgetFullName),this.widget().off(this.eventNamespace).removeAttr("aria-disabled"),this.bindings.off(this.eventNamespace)},_destroy:x.noop,widget:function(){return this.element},option:function(t,e){var i,n,o,s=t;if(0===arguments.length)return x.widget.extend({},this.options);if("string"==typeof t)if(s={},t=(i=t.split(".")).shift(),i.length){for(n=s[t]=x.widget.extend({},this.options[t]),o=0;o<i.length-1;o++)n[i[o]]=n[i[o]]||{},n=n[i[o]];if(t=i.pop(),1===arguments.length)return void 0===n[t]?null:n[t];n[t]=e}else{if(1===arguments.length)return void 0===this.options[t]?null:this.options[t];s[t]=e}return this._setOptions(s),this},_setOptions:function(t){for(var e in t)this._setOption(e,t[e]);return this},_setOption:function(t,e){return"classes"===t&&this._setOptionClasses(e),this.options[t]=e,"disabled"===t&&this._setOptionDisabled(e),this},_setOptionClasses:function(t){var e,i,n;for(e in t)n=this.classesElementLookup[e],t[e]!==this.options.classes[e]&&n&&n.length&&(i=x(n.get()),this._removeClass(n,e),i.addClass(this._classes({element:i,keys:e,classes:t,add:!0})))},_setOptionDisabled:function(t){this._toggleClass(this.widget(),this.widgetFullName+"-disabled",null,!!t),t&&(this._removeClass(this.hoverable,null,"ui-state-hover"),this._removeClass(this.focusable,null,"ui-state-focus"))},enable:function(){return this._setOptions({disabled:!1})},disable:function(){return this._setOptions({disabled:!0})},_classes:function(o){var s=[],r=this;function t(t,e){for(var i,n=0;n<t.length;n++)i=r.classesElementLookup[t[n]]||x(),i=o.add?(function(){var i=[];o.element.each(function(t,e){x.map(r.classesElementLookup,function(t){return t}).some(function(t){return t.is(e)})||i.push(e)}),r._on(x(i),{remove:"_untrackClassesElement"})}(),x(x.uniqueSort(i.get().concat(o.element.get())))):x(i.not(o.element).get()),r.classesElementLookup[t[n]]=i,s.push(t[n]),e&&o.classes[t[n]]&&s.push(o.classes[t[n]])}return(o=x.extend({element:this.element,classes:this.options.classes||{}},o)).keys&&t(o.keys.match(/\S+/g)||[],!0),o.extra&&t(o.extra.match(/\S+/g)||[]),s.join(" ")},_untrackClassesElement:function(i){var n=this;x.each(n.classesElementLookup,function(t,e){-1!==x.inArray(i.target,e)&&(n.classesElementLookup[t]=x(e.not(i.target).get()))}),this._off(x(i.target))},_removeClass:function(t,e,i){return this._toggleClass(t,e,i,!1)},_addClass:function(t,e,i){return this._toggleClass(t,e,i,!0)},_toggleClass:function(t,e,i,n){var o="string"==typeof t||null===t,e={extra:o?e:i,keys:o?t:e,element:o?this.element:t,add:n="boolean"==typeof n?n:i};return e.element.toggleClass(this._classes(e),n),this},_on:function(o,s,t){var r,l=this;"boolean"!=typeof o&&(t=s,s=o,o=!1),t?(s=r=x(s),this.bindings=this.bindings.add(s)):(t=s,s=this.element,r=this.widget()),x.each(t,function(t,e){function i(){if(o||!0!==l.options.disabled&&!x(this).hasClass("ui-state-disabled"))return("string"==typeof e?l[e]:e).apply(l,arguments)}"string"!=typeof e&&(i.guid=e.guid=e.guid||i.guid||x.guid++);var t=t.match(/^([\w:-]*)\s*(.*)$/),n=t[1]+l.eventNamespace,t=t[2];t?r.on(n,t,i):s.on(n,i)})},_off:function(t,e){e=(e||"").split(" ").join(this.eventNamespace+" ")+this.eventNamespace,t.off(e),this.bindings=x(this.bindings.not(t).get()),this.focusable=x(this.focusable.not(t).get()),this.hoverable=x(this.hoverable.not(t).get())},_delay:function(t,e){var i=this;return setTimeout(function(){return("string"==typeof t?i[t]:t).apply(i,arguments)},e||0)},_hoverable:function(t){this.hoverable=this.hoverable.add(t),this._on(t,{mouseenter:function(t){this._addClass(x(t.currentTarget),null,"ui-state-hover")},mouseleave:function(t){this._removeClass(x(t.currentTarget),null,"ui-state-hover")}})},_focusable:function(t){this.focusable=this.focusable.add(t),this._on(t,{focusin:function(t){this._addClass(x(t.currentTarget),null,"ui-state-focus")},focusout:function(t){this._removeClass(x(t.currentTarget),null,"ui-state-focus")}})},_trigger:function(t,e,i){var n,o,s=this.options[t];if(i=i||{},(e=x.Event(e)).type=(t===this.widgetEventPrefix?t:this.widgetEventPrefix+t).toLowerCase(),e.target=this.element[0],o=e.originalEvent)for(n in o)n in e||(e[n]=o[n]);return this.element.trigger(e,i),!("function"==typeof s&&!1===s.apply(this.element[0],[e].concat(i))||e.isDefaultPrevented())}},x.each({show:"fadeIn",hide:"fadeOut"},function(s,r){x.Widget.prototype["_"+s]=function(e,t,i){var n,o=(t="string"==typeof t?{effect:t}:t)?!0!==t&&"number"!=typeof t&&t.effect||r:s;"number"==typeof(t=t||{})?t={duration:t}:!0===t&&(t={}),n=!x.isEmptyObject(t),t.complete=i,t.delay&&e.delay(t.delay),n&&x.effects&&x.effects.effect[o]?e[s](t):o!==s&&e[o]?e[o](t.duration,t.easing,i):e.queue(function(t){x(this)[s](),i&&i.call(e[0]),t()})}}),x.widget;function E(t,e,i){return[parseFloat(t[0])*(h.test(t[0])?e/100:1),parseFloat(t[1])*(h.test(t[1])?i/100:1)]}function P(t,e){return parseInt(x.css(t,e),10)||0}function H(t){return null!=t&&t===t.window}
/*!
 * jQuery UI Position 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 *
 * https://api.jqueryui.com/position/
 */
W=Math.max,C=Math.abs,s=/left|center|right/,r=/top|center|bottom/,l=/[\+\-]\d+(\.[\d]+)?%?/,a=/^\w+/,h=/%$/,i=x.fn.position,x.position={scrollbarWidth:function(){var t,e,i;return void 0!==n?n:(i=(e=x("<div style='display:block;position:absolute;width:200px;height:200px;overflow:hidden;'><div style='height:300px;width:auto;'></div></div>")).children()[0],x("body").append(e),t=i.offsetWidth,e.css("overflow","scroll"),t===(i=i.offsetWidth)&&(i=e[0].clientWidth),e.remove(),n=t-i)},getScrollInfo:function(t){var e=t.isWindow||t.isDocument?"":t.element.css("overflow-x"),i=t.isWindow||t.isDocument?"":t.element.css("overflow-y"),e="scroll"===e||"auto"===e&&t.width<t.element[0].scrollWidth;return{width:"scroll"===i||"auto"===i&&t.height<t.element[0].scrollHeight?x.position.scrollbarWidth():0,height:e?x.position.scrollbarWidth():0}},getWithinInfo:function(t){var e=x(t||window),i=H(e[0]),n=!!e[0]&&9===e[0].nodeType;return{element:e,isWindow:i,isDocument:n,offset:!i&&!n?x(t).offset():{left:0,top:0},scrollLeft:e.scrollLeft(),scrollTop:e.scrollTop(),width:e.outerWidth(),height:e.outerHeight()}}},x.fn.position=function(c){var u,d,p,g,m,v,w,y,b,_,t,e;return c&&c.of?(v="string"==typeof(c=x.extend({},c)).of?x(document).find(c.of):x(c.of),w=x.position.getWithinInfo(c.within),y=x.position.getScrollInfo(w),b=(c.collision||"flip").split(" "),_={},e=9===(e=(t=v)[0]).nodeType?{width:t.width(),height:t.height(),offset:{top:0,left:0}}:H(e)?{width:t.width(),height:t.height(),offset:{top:t.scrollTop(),left:t.scrollLeft()}}:e.preventDefault?{width:0,height:0,offset:{top:e.pageY,left:e.pageX}}:{width:t.outerWidth(),height:t.outerHeight(),offset:t.offset()},v[0].preventDefault&&(c.at="left top"),d=e.width,p=e.height,m=x.extend({},g=e.offset),x.each(["my","at"],function(){var t,e,i=(c[this]||"").split(" ");(i=1===i.length?s.test(i[0])?i.concat(["center"]):r.test(i[0])?["center"].concat(i):["center","center"]:i)[0]=s.test(i[0])?i[0]:"center",i[1]=r.test(i[1])?i[1]:"center",t=l.exec(i[0]),e=l.exec(i[1]),_[this]=[t?t[0]:0,e?e[0]:0],c[this]=[a.exec(i[0])[0],a.exec(i[1])[0]]}),1===b.length&&(b[1]=b[0]),"right"===c.at[0]?m.left+=d:"center"===c.at[0]&&(m.left+=d/2),"bottom"===c.at[1]?m.top+=p:"center"===c.at[1]&&(m.top+=p/2),u=E(_.at,d,p),m.left+=u[0],m.top+=u[1],this.each(function(){var i,t,r=x(this),l=r.outerWidth(),a=r.outerHeight(),e=P(this,"marginLeft"),n=P(this,"marginTop"),o=l+e+P(this,"marginRight")+y.width,s=a+n+P(this,"marginBottom")+y.height,h=x.extend({},m),f=E(_.my,r.outerWidth(),r.outerHeight());"right"===c.my[0]?h.left-=l:"center"===c.my[0]&&(h.left-=l/2),"bottom"===c.my[1]?h.top-=a:"center"===c.my[1]&&(h.top-=a/2),h.left+=f[0],h.top+=f[1],i={marginLeft:e,marginTop:n},x.each(["left","top"],function(t,e){x.ui.position[b[t]]&&x.ui.position[b[t]][e](h,{targetWidth:d,targetHeight:p,elemWidth:l,elemHeight:a,collisionPosition:i,collisionWidth:o,collisionHeight:s,offset:[u[0]+f[0],u[1]+f[1]],my:c.my,at:c.at,within:w,elem:r})}),c.using&&(t=function(t){var e=g.left-h.left,i=e+d-l,n=g.top-h.top,o=n+p-a,s={target:{element:v,left:g.left,top:g.top,width:d,height:p},element:{element:r,left:h.left,top:h.top,width:l,height:a},horizontal:i<0?"left":0<e?"right":"center",vertical:o<0?"top":0<n?"bottom":"middle"};d<l&&C(e+i)<d&&(s.horizontal="center"),p<a&&C(n+o)<p&&(s.vertical="middle"),W(C(e),C(i))>W(C(n),C(o))?s.important="horizontal":s.important="vertical",c.using.call(this,t,s)}),r.offset(x.extend(h,{using:t}))})):i.apply(this,arguments)},x.ui.position={fit:{left:function(t,e){var i,n=e.within,o=n.isWindow?n.scrollLeft:n.offset.left,n=n.width,s=t.left-e.collisionPosition.marginLeft,r=o-s,l=s+e.collisionWidth-n-o;n<e.collisionWidth?0<r&&l<=0?(i=t.left+r+e.collisionWidth-n-o,t.left+=r-i):t.left=!(0<l&&r<=0)&&l<r?o+n-e.collisionWidth:o:0<r?t.left+=r:0<l?t.left-=l:t.left=W(t.left-s,t.left)},top:function(t,e){var i,n=e.within,n=n.isWindow?n.scrollTop:n.offset.top,o=e.within.height,s=t.top-e.collisionPosition.marginTop,r=n-s,l=s+e.collisionHeight-o-n;o<e.collisionHeight?0<r&&l<=0?(i=t.top+r+e.collisionHeight-o-n,t.top+=r-i):t.top=!(0<l&&r<=0)&&l<r?n+o-e.collisionHeight:n:0<r?t.top+=r:0<l?t.top-=l:t.top=W(t.top-s,t.top)}},flip:{left:function(t,e){var i=e.within,n=i.offset.left+i.scrollLeft,o=i.width,i=i.isWindow?i.scrollLeft:i.offset.left,s=t.left-e.collisionPosition.marginLeft,r=s-i,s=s+e.collisionWidth-o-i,l="left"===e.my[0]?-e.elemWidth:"right"===e.my[0]?e.elemWidth:0,a="left"===e.at[0]?e.targetWidth:"right"===e.at[0]?-e.targetWidth:0,h=-2*e.offset[0];r<0?((o=t.left+l+a+h+e.collisionWidth-o-n)<0||o<C(r))&&(t.left+=l+a+h):0<s&&(0<(n=t.left-e.collisionPosition.marginLeft+l+a+h-i)||C(n)<s)&&(t.left+=l+a+h)},top:function(t,e){var i=e.within,n=i.offset.top+i.scrollTop,o=i.height,i=i.isWindow?i.scrollTop:i.offset.top,s=t.top-e.collisionPosition.marginTop,r=s-i,s=s+e.collisionHeight-o-i,l="top"===e.my[1]?-e.elemHeight:"bottom"===e.my[1]?e.elemHeight:0,a="top"===e.at[1]?e.targetHeight:"bottom"===e.at[1]?-e.targetHeight:0,h=-2*e.offset[1];r<0?((o=t.top+l+a+h+e.collisionHeight-o-n)<0||o<C(r))&&(t.top+=l+a+h):0<s&&(0<(n=t.top-e.collisionPosition.marginTop+l+a+h-i)||C(n)<s)&&(t.top+=l+a+h)}},flipfit:{left:function(){x.ui.position.flip.left.apply(this,arguments),x.ui.position.fit.left.apply(this,arguments)},top:function(){x.ui.position.flip.top.apply(this,arguments),x.ui.position.fit.top.apply(this,arguments)}}};var t,e;
/*!
 * jQuery UI :data 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 */x.ui.position,x.extend(x.expr.pseudos,{data:x.expr.createPseudo(function(e){return function(t){return!!x.data(t,e)}})}),x.fn.extend({disableSelection:(t="onselectstart"in document.createElement("div")?"selectstart":"mousedown",function(){return this.on(t+".ui-disableSelection",function(t){t.preventDefault()})}),enableSelection:function(){return this.off(".ui-disableSelection")}}),
/*!
 * jQuery UI Focusable 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 */
x.ui.focusable=function(t,e){var i,n,o,s=t.nodeName.toLowerCase();return"area"===s?(o=(i=t.parentNode).name,!(!t.href||!o||"map"!==i.nodeName.toLowerCase())&&0<(i=x("img[usemap='#"+o+"']")).length&&i.is(":visible")):(/^(input|select|textarea|button|object)$/.test(s)?(n=!t.disabled)&&(o=x(t).closest("fieldset")[0])&&(n=!o.disabled):n="a"===s&&t.href||e,n&&x(t).is(":visible")&&"visible"===x(t).css("visibility"))},x.extend(x.expr.pseudos,{focusable:function(t){return x.ui.focusable(t,null!=x.attr(t,"tabindex"))}}),x.ui.focusable,x.ui.formResetMixin={_formResetHandler:function(){var e=x(this);setTimeout(function(){var t=e.data("ui-form-reset-instances");x.each(t,function(){this.refresh()})})},_bindFormResetHandler:function(){var t;this.form=x(this.element.prop("form")),this.form.length&&((t=this.form.data("ui-form-reset-instances")||[]).length||this.form.on("reset.ui-form-reset",this._formResetHandler),t.push(this),this.form.data("ui-form-reset-instances",t))},_unbindFormResetHandler:function(){var t;this.form.length&&((t=this.form.data("ui-form-reset-instances")).splice(x.inArray(this,t),1),t.length?this.form.data("ui-form-reset-instances",t):this.form.removeData("ui-form-reset-instances").off("reset.ui-form-reset"))}},
/*!
 * jQuery UI Legacy jQuery Core patches 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 *
 */
x.escapeSelector||(x.escapeSelector=function(t){return CSS.escape(t+"")}),x.fn.even&&x.fn.odd||x.fn.extend({even:function(){return this.filter(function(t){return t%2==0})},odd:function(){return this.filter(function(t){return t%2==1})}}),x.ui.keyCode={BACKSPACE:8,COMMA:188,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,LEFT:37,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SPACE:32,TAB:9,UP:38},x.fn.labels=function(){var t,e,i;return this.length?this[0].labels&&this[0].labels.length?this.pushStack(this[0].labels):(e=this.eq(0).parents("label"),(t=this.attr("id"))&&(i=(i=this.eq(0).parents().last()).add((i.length?i:this).siblings()),t="label[for='"+CSS.escape(t)+"']",e=e.add(i.find(t).addBack(t))),this.pushStack(e)):this.pushStack([])},x.fn.scrollParent=function(t){var e=this.css("position"),i="absolute"===e,n=t?/(auto|scroll|hidden)/:/(auto|scroll)/,t=this.parents().filter(function(){var t=x(this);return(!i||"static"!==t.css("position"))&&n.test(t.css("overflow")+t.css("overflow-y")+t.css("overflow-x"))}).eq(0);return"fixed"!==e&&t.length?t:x(this[0].ownerDocument||document)},x.extend(x.expr.pseudos,{tabbable:function(t){var e=x.attr(t,"tabindex"),i=null!=e;return(!i||0<=e)&&x.ui.focusable(t,i)}}),x.fn.extend({uniqueId:(e=0,function(){return this.each(function(){this.id||(this.id="ui-id-"+ ++e)})}),removeUniqueId:function(){return this.each(function(){/^ui-id-\d+$/.test(this.id)&&x(this).removeAttr("id")})}});x.ui.plugin={add:function(t,e,i){var n,o=x.ui[t].prototype;for(n in i)o.plugins[n]=o.plugins[n]||[],o.plugins[n].push([e,i[n]])},call:function(t,e,i,n){var o,s=t.plugins[e];if(s&&(n||t.element[0].parentNode&&11!==t.element[0].parentNode.nodeType))for(o=0;o<s.length;o++)t.options[s[o][0]]&&s[o][1].apply(t.element,i)}}});
;
/*!
 * jQuery UI Datepicker 1.14.2
 * https://jqueryui.com
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license.
 * https://jquery.org/license
 */
!function(e){"use strict";"function"==typeof define&&define.amd?define(["jquery","../version","../keycode"],e):e(jQuery)}(function(V){"use strict";var n;function e(){this._curInst=null,this._keyEvent=!1,this._disabledInputs=[],this._datepickerShowing=!1,this._inDialog=!1,this._mainDivId="ui-datepicker-div",this._inlineClass="ui-datepicker-inline",this._appendClass="ui-datepicker-append",this._triggerClass="ui-datepicker-trigger",this._dialogClass="ui-datepicker-dialog",this._disableClass="ui-datepicker-disabled",this._unselectableClass="ui-datepicker-unselectable",this._currentClass="ui-datepicker-current-day",this._dayOverClass="ui-datepicker-days-cell-over",this.regional=[],this.regional[""]={closeText:"Done",prevText:"Prev",nextText:"Next",currentText:"Today",monthNames:["January","February","March","April","May","June","July","August","September","October","November","December"],monthNamesShort:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],dayNames:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayNamesShort:["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],dayNamesMin:["Su","Mo","Tu","We","Th","Fr","Sa"],weekHeader:"Wk",dateFormat:"mm/dd/yy",firstDay:0,isRTL:!1,showMonthAfterYear:!1,yearSuffix:"",selectMonthLabel:"Select month",selectYearLabel:"Select year"},this._defaults={showOn:"focus",showAnim:"fadeIn",showOptions:{},defaultDate:null,appendText:"",buttonText:"...",buttonImage:"",buttonImageOnly:!1,hideIfNoPrevNext:!1,navigationAsDateFormat:!1,gotoCurrent:!1,changeMonth:!1,changeYear:!1,yearRange:"c-10:c+10",showOtherMonths:!1,selectOtherMonths:!1,showWeek:!1,calculateWeek:this.iso8601Week,shortYearCutoff:"+10",minDate:null,maxDate:null,duration:"fast",beforeShowDay:null,beforeShow:null,onSelect:null,onChangeMonthYear:null,onClose:null,onUpdateDatepicker:null,numberOfMonths:1,showCurrentAtPos:0,stepMonths:1,stepBigMonths:12,altField:"",altFormat:"",constrainInput:!0,showButtonPanel:!1,autoSize:!1,disabled:!1},V.extend(this._defaults,this.regional[""]),this.regional.en=V.extend(!0,{},this.regional[""]),this.regional["en-US"]=V.extend(!0,{},this.regional.en),this.dpDiv=a(V("<div id='"+this._mainDivId+"' class='ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>"))}function a(e){var t="button, .ui-datepicker-prev, .ui-datepicker-next, .ui-datepicker-calendar td a";return e.on("mouseout",t,function(){V(this).removeClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&V(this).removeClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&V(this).removeClass("ui-datepicker-next-hover")}).on("mouseover",t,d)}function d(){V.datepicker._isDisabledDatepicker((n.inline?n.dpDiv.parent():n.input)[0])||(V(this).parents(".ui-datepicker-calendar").find("a").removeClass("ui-state-hover"),V(this).addClass("ui-state-hover"),-1!==this.className.indexOf("ui-datepicker-prev")&&V(this).addClass("ui-datepicker-prev-hover"),-1!==this.className.indexOf("ui-datepicker-next")&&V(this).addClass("ui-datepicker-next-hover"))}function c(e,t){for(var a in V.extend(e,t),t)null==t[a]&&(e[a]=t[a])}return V.extend(V.ui,{datepicker:{version:"1.14.2"}}),V.extend(e.prototype,{markerClassName:"hasDatepicker",maxRows:4,_widgetDatepicker:function(){return this.dpDiv},setDefaults:function(e){return c(this._defaults,e||{}),this},_attachDatepicker:function(e,t){var a,i=e.nodeName.toLowerCase(),s="div"===i||"span"===i;e.id||(this.uuid+=1,e.id="dp"+this.uuid),(a=this._newInst(V(e),s)).settings=V.extend({},t||{}),"input"===i?this._connectDatepicker(e,a):s&&this._inlineDatepicker(e,a)},_newInst:function(e,t){return{id:e[0].id.replace(/([^A-Za-z0-9_\-])/g,"\\\\$1"),input:e,selectedDay:0,selectedMonth:0,selectedYear:0,drawMonth:0,drawYear:0,inline:t,dpDiv:t?a(V("<div class='"+this._inlineClass+" ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all'></div>")):this.dpDiv}},_connectDatepicker:function(e,t){var a=V(e);t.append=V([]),t.trigger=V([]),a.hasClass(this.markerClassName)||(this._attachments(a,t),a.addClass(this.markerClassName).on("keydown",this._doKeyDown).on("keypress",this._doKeyPress).on("keyup",this._doKeyUp),this._autoSize(t),V.data(e,"datepicker",t),t.settings.disabled&&this._disableDatepicker(e))},_attachments:function(e,t){var a,i=this._get(t,"appendText"),s=this._get(t,"isRTL");t.append&&t.append.remove(),i&&(t.append=V("<span>").addClass(this._appendClass).text(i),e[s?"before":"after"](t.append)),e.off("focus",this._showDatepicker),t.trigger&&t.trigger.remove(),"focus"!==(i=this._get(t,"showOn"))&&"both"!==i||e.on("focus",this._showDatepicker),"button"!==i&&"both"!==i||(i=this._get(t,"buttonText"),a=this._get(t,"buttonImage"),this._get(t,"buttonImageOnly")?t.trigger=V("<img>").addClass(this._triggerClass).attr({src:a,alt:i,title:i}):(t.trigger=V("<button type='button'>").addClass(this._triggerClass),a?t.trigger.html(V("<img>").attr({src:a,alt:i,title:i})):t.trigger.text(i)),e[s?"before":"after"](t.trigger),t.trigger.on("click",function(){return V.datepicker._datepickerShowing&&V.datepicker._lastInput===e[0]?V.datepicker._hideDatepicker():(V.datepicker._datepickerShowing&&V.datepicker._lastInput!==e[0]&&V.datepicker._hideDatepicker(),V.datepicker._showDatepicker(e[0])),!1}))},_autoSize:function(e){var t,a,i,s,r,n;this._get(e,"autoSize")&&!e.inline&&(r=new Date(2009,11,20),(n=this._get(e,"dateFormat")).match(/[DM]/)&&(r.setMonth((t=function(e){for(s=i=a=0;s<e.length;s++)e[s].length>a&&(a=e[s].length,i=s);return i})(this._get(e,n.match(/MM/)?"monthNames":"monthNamesShort"))),r.setDate(t(this._get(e,n.match(/DD/)?"dayNames":"dayNamesShort"))+20-r.getDay())),e.input.attr("size",this._formatDate(e,r).length))},_inlineDatepicker:function(e,t){var a=V(e);a.hasClass(this.markerClassName)||(a.addClass(this.markerClassName).append(t.dpDiv),V.data(e,"datepicker",t),this._setDate(t,this._getDefaultDate(t),!0),this._updateDatepicker(t),this._updateAlternate(t),t.settings.disabled&&this._disableDatepicker(e),t.dpDiv.css("display","block"))},_dialogDatepicker:function(e,t,a,i,s){var r,n=this._dialogInst;return n||(this.uuid+=1,r="dp"+this.uuid,this._dialogInput=V("<input type='text' id='"+r+"' style='position: absolute; top: -100px; width: 0px;'/>"),this._dialogInput.on("keydown",this._doKeyDown),V("body").append(this._dialogInput),(n=this._dialogInst=this._newInst(this._dialogInput,!1)).settings={},V.data(this._dialogInput[0],"datepicker",n)),c(n.settings,i||{}),t=t&&t.constructor===Date?this._formatDate(n,t):t,this._dialogInput.val(t),this._pos=s?s.length?s:[s.pageX,s.pageY]:null,this._pos||(r=document.documentElement.clientWidth,i=document.documentElement.clientHeight,t=document.documentElement.scrollLeft||document.body.scrollLeft,s=document.documentElement.scrollTop||document.body.scrollTop,this._pos=[r/2-100+t,i/2-150+s]),this._dialogInput.css("left",this._pos[0]+20+"px").css("top",this._pos[1]+"px"),n.settings.onSelect=a,this._inDialog=!0,this.dpDiv.addClass(this._dialogClass),this._showDatepicker(this._dialogInput[0]),V.blockUI&&V.blockUI(this.dpDiv),V.data(this._dialogInput[0],"datepicker",n),this},_destroyDatepicker:function(e){var t,a=V(e),i=V.data(e,"datepicker");a.hasClass(this.markerClassName)&&(t=e.nodeName.toLowerCase(),V.removeData(e,"datepicker"),"input"===t?(i.append.remove(),i.trigger.remove(),a.removeClass(this.markerClassName).off("focus",this._showDatepicker).off("keydown",this._doKeyDown).off("keypress",this._doKeyPress).off("keyup",this._doKeyUp)):"div"!==t&&"span"!==t||a.removeClass(this.markerClassName).empty(),V.datepicker._hideDatepicker(),n===i)&&(n=null,this._curInst=null)},_enableDatepicker:function(t){var e,a=V(t),i=V.data(t,"datepicker");a.hasClass(this.markerClassName)&&("input"===(e=t.nodeName.toLowerCase())?(t.disabled=!1,i.trigger.filter("button").each(function(){this.disabled=!1}).end().filter("img").css({opacity:"1.0",cursor:""})):"div"!==e&&"span"!==e||((i=a.children("."+this._inlineClass)).children().removeClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!1)),this._disabledInputs=V.map(this._disabledInputs,function(e){return e===t?null:e}))},_disableDatepicker:function(t){var e,a=V(t),i=V.data(t,"datepicker");a.hasClass(this.markerClassName)&&("input"===(e=t.nodeName.toLowerCase())?(t.disabled=!0,i.trigger.filter("button").each(function(){this.disabled=!0}).end().filter("img").css({opacity:"0.5",cursor:"default"})):"div"!==e&&"span"!==e||((i=a.children("."+this._inlineClass)).children().addClass("ui-state-disabled"),i.find("select.ui-datepicker-month, select.ui-datepicker-year").prop("disabled",!0)),this._disabledInputs=V.map(this._disabledInputs,function(e){return e===t?null:e}),this._disabledInputs[this._disabledInputs.length]=t)},_isDisabledDatepicker:function(e){if(e)for(var t=0;t<this._disabledInputs.length;t++)if(this._disabledInputs[t]===e)return!0;return!1},_getInst:function(e){try{return V.data(e,"datepicker")}catch(e){throw"Missing instance data for this datepicker"}},_optionDatepicker:function(e,t,a){var i,s,r=this._getInst(e);if(2===arguments.length&&"string"==typeof t)return"defaults"===t?V.extend({},V.datepicker._defaults):r?"all"===t?V.extend({},r.settings):this._get(r,t):null;i=t||{},"string"==typeof t&&((i={})[t]=a),r&&(this._curInst===r&&this._hideDatepicker(),t=this._getDateDatepicker(e,!0),a=this._getMinMaxDate(r,"min"),s=this._getMinMaxDate(r,"max"),c(r.settings,i),null!==a&&void 0!==i.dateFormat&&void 0===i.minDate&&(r.settings.minDate=this._formatDate(r,a)),null!==s&&void 0!==i.dateFormat&&void 0===i.maxDate&&(r.settings.maxDate=this._formatDate(r,s)),"disabled"in i&&(i.disabled?this._disableDatepicker(e):this._enableDatepicker(e)),this._attachments(V(e),r),this._autoSize(r),this._setDate(r,t),this._updateAlternate(r),this._updateDatepicker(r))},_changeDatepicker:function(e,t,a){this._optionDatepicker(e,t,a)},_refreshDatepicker:function(e){e=this._getInst(e);e&&this._updateDatepicker(e)},_setDateDatepicker:function(e,t){e=this._getInst(e);e&&(this._setDate(e,t),this._updateDatepicker(e),this._updateAlternate(e))},_getDateDatepicker:function(e,t){e=this._getInst(e);return e&&!e.inline&&this._setDateFromField(e,t),e?this._getDate(e):null},_doKeyDown:function(e){var t,a,i=V.datepicker._getInst(e.target),s=!0,r=i.dpDiv.is(".ui-datepicker-rtl");if(i._keyEvent=!0,V.datepicker._datepickerShowing)switch(e.keyCode){case 9:V.datepicker._hideDatepicker(),s=!1;break;case 13:return(a=V("td."+V.datepicker._dayOverClass+":not(."+V.datepicker._currentClass+")",i.dpDiv))[0]&&V.datepicker._selectDay(e.target,i.selectedMonth,i.selectedYear,a[0]),(a=V.datepicker._get(i,"onSelect"))?(t=V.datepicker._formatDate(i),a.apply(i.input?i.input[0]:null,[t,i])):V.datepicker._hideDatepicker(),!1;case 27:V.datepicker._hideDatepicker();break;case 33:V.datepicker._adjustDate(e.target,e.ctrlKey?-V.datepicker._get(i,"stepBigMonths"):-V.datepicker._get(i,"stepMonths"),"M");break;case 34:V.datepicker._adjustDate(e.target,e.ctrlKey?+V.datepicker._get(i,"stepBigMonths"):+V.datepicker._get(i,"stepMonths"),"M");break;case 35:(e.ctrlKey||e.metaKey)&&V.datepicker._clearDate(e.target),s=e.ctrlKey||e.metaKey;break;case 36:(e.ctrlKey||e.metaKey)&&V.datepicker._gotoToday(e.target),s=e.ctrlKey||e.metaKey;break;case 37:(e.ctrlKey||e.metaKey)&&V.datepicker._adjustDate(e.target,r?1:-1,"D"),s=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&V.datepicker._adjustDate(e.target,e.ctrlKey?-V.datepicker._get(i,"stepBigMonths"):-V.datepicker._get(i,"stepMonths"),"M");break;case 38:(e.ctrlKey||e.metaKey)&&V.datepicker._adjustDate(e.target,-7,"D"),s=e.ctrlKey||e.metaKey;break;case 39:(e.ctrlKey||e.metaKey)&&V.datepicker._adjustDate(e.target,r?-1:1,"D"),s=e.ctrlKey||e.metaKey,e.originalEvent.altKey&&V.datepicker._adjustDate(e.target,e.ctrlKey?+V.datepicker._get(i,"stepBigMonths"):+V.datepicker._get(i,"stepMonths"),"M");break;case 40:(e.ctrlKey||e.metaKey)&&V.datepicker._adjustDate(e.target,7,"D"),s=e.ctrlKey||e.metaKey;break;default:s=!1}else 36===e.keyCode&&e.ctrlKey?V.datepicker._showDatepicker(this):s=!1;s&&(e.preventDefault(),e.stopPropagation())},_doKeyPress:function(e){var t,a=V.datepicker._getInst(e.target);if(V.datepicker._get(a,"constrainInput"))return a=V.datepicker._possibleChars(V.datepicker._get(a,"dateFormat")),t=String.fromCharCode(null==e.charCode?e.keyCode:e.charCode),e.ctrlKey||e.metaKey||t<" "||!a||-1<a.indexOf(t)},_doKeyUp:function(e){e=V.datepicker._getInst(e.target);if(e.input.val()!==e.lastVal)try{V.datepicker.parseDate(V.datepicker._get(e,"dateFormat"),e.input?e.input.val():null,V.datepicker._getFormatConfig(e))&&(V.datepicker._setDateFromField(e),V.datepicker._updateAlternate(e),V.datepicker._updateDatepicker(e))}catch(e){}return!0},_showDatepicker:function(e){var t,a,i,s;"input"!==(e=e.target||e).nodeName.toLowerCase()&&(e=V("input",e.parentNode)[0]),V.datepicker._isDisabledDatepicker(e)||V.datepicker._lastInput===e||(s=V.datepicker._getInst(e),V.datepicker._curInst&&V.datepicker._curInst!==s&&(V.datepicker._curInst.dpDiv.stop(!0,!0),s)&&V.datepicker._datepickerShowing&&V.datepicker._hideDatepicker(V.datepicker._curInst.input[0]),!1===(a=(a=V.datepicker._get(s,"beforeShow"))?a.apply(e,[e,s]):{}))||(c(s.settings,a),s.lastVal=null,V.datepicker._lastInput=e,V.datepicker._setDateFromField(s),V.datepicker._inDialog&&(e.value=""),V.datepicker._pos||(V.datepicker._pos=V.datepicker._findPos(e),V.datepicker._pos[1]+=e.offsetHeight),t=!1,V(e).parents().each(function(){return!(t|="fixed"===V(this).css("position"))}),a={left:V.datepicker._pos[0],top:V.datepicker._pos[1]},V.datepicker._pos=null,s.dpDiv.empty(),s.dpDiv.css({position:"absolute",display:"block",top:"-1000px"}),V.datepicker._updateDatepicker(s),a=V.datepicker._checkOffset(s,a,t),s.dpDiv.css({position:V.datepicker._inDialog&&V.blockUI?"static":t?"fixed":"absolute",display:"none",left:a.left+"px",top:a.top+"px"}),s.inline)||(a=V.datepicker._get(s,"showAnim"),i=V.datepicker._get(s,"duration"),s.dpDiv.css("z-index",function(e){for(var t;e.length&&e[0]!==document;){if(("absolute"===(t=e.css("position"))||"relative"===t||"fixed"===t)&&(t=parseInt(e.css("zIndex"),10),!isNaN(t))&&0!==t)return t;e=e.parent()}return 0}(V(e))+1),V.datepicker._datepickerShowing=!0,V.effects&&V.effects.effect[a]?s.dpDiv.show(a,V.datepicker._get(s,"showOptions"),i):s.dpDiv[a||"show"](a?i:null),V.datepicker._shouldFocusInput(s)&&s.input.trigger("focus"),V.datepicker._curInst=s)},_updateDatepicker:function(e){this.maxRows=4,(n=e).dpDiv.empty().append(this._generateHTML(e)),this._attachHandlers(e);var t,a=this._getNumberOfMonths(e),i=a[1],s=e.dpDiv.find("."+this._dayOverClass+" a"),r=V.datepicker._get(e,"onUpdateDatepicker");0<s.length&&d.apply(s.get(0)),e.dpDiv.removeClass("ui-datepicker-multi-2 ui-datepicker-multi-3 ui-datepicker-multi-4").width(""),1<i&&e.dpDiv.addClass("ui-datepicker-multi-"+i).css("width",17*i+"em"),e.dpDiv[(1!==a[0]||1!==a[1]?"add":"remove")+"Class"]("ui-datepicker-multi"),e.dpDiv[(this._get(e,"isRTL")?"add":"remove")+"Class"]("ui-datepicker-rtl"),e===V.datepicker._curInst&&V.datepicker._datepickerShowing&&V.datepicker._shouldFocusInput(e)&&e.input.trigger("focus"),e.yearshtml&&(t=e.yearshtml,setTimeout(function(){t===e.yearshtml&&e.yearshtml&&e.dpDiv.find("select.ui-datepicker-year").first().replaceWith(e.yearshtml),t=e.yearshtml=null},0)),r&&r.apply(e.input?e.input[0]:null,[e])},_shouldFocusInput:function(e){return e.input&&e.input.is(":visible")&&!e.input.is(":disabled")},_checkOffset:function(e,t,a){var i=e.dpDiv.outerWidth(),s=e.dpDiv.outerHeight(),r=e.input?e.input.outerWidth():0,n=e.input?e.input.outerHeight():0,d=document.documentElement.clientWidth+(a?0:V(document).scrollLeft()),c=document.documentElement.clientHeight+(a?0:V(document).scrollTop());return t.left-=this._get(e,"isRTL")?i-r:0,t.left-=a&&t.left===e.input.offset().left?V(document).scrollLeft():0,t.top-=a&&t.top===e.input.offset().top+n?V(document).scrollTop():0,t.left-=Math.min(t.left,d<t.left+i&&i<d?Math.abs(t.left+i-d):0),t.top-=Math.min(t.top,c<t.top+s&&s<c?Math.abs(s+n):0),t},_findPos:function(e){for(var t=this._getInst(e),a=this._get(t,"isRTL");e&&("hidden"===e.type||1!==e.nodeType||V.expr.pseudos.hidden(e));)e=e[a?"previousSibling":"nextSibling"];return[(t=V(e).offset()).left,t.top]},_hideDatepicker:function(e){var t,a,i=this._curInst;!i||e&&i!==V.data(e,"datepicker")||this._datepickerShowing&&(e=this._get(i,"showAnim"),a=this._get(i,"duration"),t=function(){V.datepicker._tidyDialog(i)},V.effects&&V.effects.effect[e]?i.dpDiv.hide(e,V.datepicker._get(i,"showOptions"),a,t):i.dpDiv["slideDown"===e?"slideUp":"fadeIn"===e?"fadeOut":"hide"](e?a:null,t),e||t(),this._datepickerShowing=!1,(a=this._get(i,"onClose"))&&a.apply(i.input?i.input[0]:null,[i.input?i.input.val():"",i]),this._lastInput=null,this._inDialog&&(this._dialogInput.css({position:"absolute",left:"0",top:"-100px"}),V.blockUI)&&(V.unblockUI(),V("body").append(this.dpDiv)),this._inDialog=!1)},_tidyDialog:function(e){e.dpDiv.removeClass(this._dialogClass).off(".ui-datepicker-calendar")},_checkExternalClick:function(e){var t;V.datepicker._curInst&&(e=V(e.target),t=V.datepicker._getInst(e[0]),!(e[0].id===V.datepicker._mainDivId||0!==e.parents("#"+V.datepicker._mainDivId).length||e.hasClass(V.datepicker.markerClassName)||e.closest("."+V.datepicker._triggerClass).length||!V.datepicker._datepickerShowing||V.datepicker._inDialog&&V.blockUI)||e.hasClass(V.datepicker.markerClassName)&&V.datepicker._curInst!==t)&&V.datepicker._hideDatepicker()},_adjustDate:function(e,t,a){var e=V(e),i=this._getInst(e[0]);this._isDisabledDatepicker(e[0])||(this._adjustInstDate(i,t,a),this._updateDatepicker(i))},_gotoToday:function(e){var t,e=V(e),a=this._getInst(e[0]);this._get(a,"gotoCurrent")&&a.currentDay?(a.selectedDay=a.currentDay,a.drawMonth=a.selectedMonth=a.currentMonth,a.drawYear=a.selectedYear=a.currentYear):(t=new Date,a.selectedDay=t.getDate(),a.drawMonth=a.selectedMonth=t.getMonth(),a.drawYear=a.selectedYear=t.getFullYear()),this._notifyChange(a),this._adjustDate(e)},_selectMonthYear:function(e,t,a){var e=V(e),i=this._getInst(e[0]);i["selected"+("M"===a?"Month":"Year")]=i["draw"+("M"===a?"Month":"Year")]=parseInt(t.options[t.selectedIndex].value,10),this._notifyChange(i),this._adjustDate(e)},_selectDay:function(e,t,a,i){var s=V(e);V(i).hasClass(this._unselectableClass)||this._isDisabledDatepicker(s[0])||((s=this._getInst(s[0])).selectedDay=s.currentDay=parseInt(V("a",i).attr("data-date")),s.selectedMonth=s.currentMonth=t,s.selectedYear=s.currentYear=a,this._selectDate(e,this._formatDate(s,s.currentDay,s.currentMonth,s.currentYear)))},_clearDate:function(e){e=V(e);this._selectDate(e,"")},_selectDate:function(e,t){var a,e=V(e),e=this._getInst(e[0]);t=null!=t?t:this._formatDate(e),e.input&&e.input.val(t),this._updateAlternate(e),(a=this._get(e,"onSelect"))?a.apply(e.input?e.input[0]:null,[t,e]):e.input&&e.input.trigger("change"),e.inline?this._updateDatepicker(e):(this._hideDatepicker(),this._lastInput=e.input[0],"object"!=typeof e.input[0]&&e.input.trigger("focus"),this._lastInput=null)},_updateAlternate:function(e){var t,a,i=this._get(e,"altField");i&&(a=this._get(e,"altFormat")||this._get(e,"dateFormat"),t=this._getDate(e),a=this.formatDate(a,t,this._getFormatConfig(e)),V(document).find(i).val(a))},noWeekends:function(e){e=e.getDay();return[0<e&&e<6,""]},iso8601Week:function(e){var t,e=new Date(e.getTime());return e.setDate(e.getDate()+4-(e.getDay()||7)),t=e.getTime(),e.setMonth(0),e.setDate(1),Math.floor(Math.round((t-e)/864e5)/7)+1},parseDate:function(t,s,e){if(null==t||null==s)throw"Invalid arguments";if(""===(s="object"==typeof s?s.toString():s+""))return null;for(var a,i,r=0,n=(e?e.shortYearCutoff:null)||this._defaults.shortYearCutoff,n="string"!=typeof n?n:(new Date).getFullYear()%100+parseInt(n,10),d=(e?e.dayNamesShort:null)||this._defaults.dayNamesShort,c=(e?e.dayNames:null)||this._defaults.dayNames,o=(e?e.monthNamesShort:null)||this._defaults.monthNamesShort,l=(e?e.monthNames:null)||this._defaults.monthNames,h=-1,u=-1,p=-1,g=-1,_=!1,f=function(e){e=y+1<t.length&&t.charAt(y+1)===e;return e&&y++,e},k=function(e){var t=f(e),t="@"===e?14:"!"===e?20:"y"===e&&t?4:"o"===e?3:2,e=new RegExp("^\\d{"+("y"===e?t:1)+","+t+"}"),t=s.substring(r).match(e);if(t)return r+=t[0].length,parseInt(t[0],10);throw"Missing number at position "+r},D=function(e,t,a){var i=-1,e=V.map(f(e)?a:t,function(e,t){return[[t,e]]}).sort(function(e,t){return-(e[1].length-t[1].length)});if(V.each(e,function(e,t){var a=t[1];if(s.substr(r,a.length).toLowerCase()===a.toLowerCase())return i=t[0],r+=a.length,!1}),-1!==i)return i+1;throw"Unknown name at position "+r},m=function(){if(s.charAt(r)!==t.charAt(y))throw"Unexpected literal at position "+r;r++},y=0;y<t.length;y++)if(_)"'"!==t.charAt(y)||f("'")?m():_=!1;else switch(t.charAt(y)){case"d":p=k("d");break;case"D":D("D",d,c);break;case"o":g=k("o");break;case"m":u=k("m");break;case"M":u=D("M",o,l);break;case"y":h=k("y");break;case"@":h=(i=new Date(k("@"))).getFullYear(),u=i.getMonth()+1,p=i.getDate();break;case"!":h=(i=new Date((k("!")-this._ticksTo1970)/1e4)).getFullYear(),u=i.getMonth()+1,p=i.getDate();break;case"'":f("'")?m():_=!0;break;default:m()}if(r<s.length&&(e=s.substr(r),!/^\s+/.test(e)))throw"Extra/unparsed characters found in date: "+e;if(-1===h?h=(new Date).getFullYear():h<100&&(h+=(new Date).getFullYear()-(new Date).getFullYear()%100+(h<=n?0:-100)),-1<g)for(u=1,p=g;;){if(p<=(a=this._getDaysInMonth(h,u-1)))break;u++,p-=a}if((i=this._daylightSavingAdjust(new Date(h,u-1,p))).getFullYear()!==h||i.getMonth()+1!==u||i.getDate()!==p)throw"Invalid date";return i},ATOM:"yy-mm-dd",COOKIE:"D, dd M yy",ISO_8601:"yy-mm-dd",RFC_822:"D, d M y",RFC_850:"DD, dd-M-y",RFC_1036:"D, d M y",RFC_1123:"D, d M yy",RFC_2822:"D, d M yy",RSS:"D, d M y",TICKS:"!",TIMESTAMP:"@",W3C:"yy-mm-dd",_ticksTo1970:24*(718685+Math.floor(492.5)-Math.floor(19.7)+Math.floor(4.925))*60*60*1e7,formatDate:function(t,e,a){if(!e)return"";function i(e,t,a){var i=""+t;if(l(e))for(;i.length<a;)i="0"+i;return i}function s(e,t,a,i){return(l(e)?i:a)[t]}var r,n=(a?a.dayNamesShort:null)||this._defaults.dayNamesShort,d=(a?a.dayNames:null)||this._defaults.dayNames,c=(a?a.monthNamesShort:null)||this._defaults.monthNamesShort,o=(a?a.monthNames:null)||this._defaults.monthNames,l=function(e){e=r+1<t.length&&t.charAt(r+1)===e;return e&&r++,e},h="",u=!1;if(e)for(r=0;r<t.length;r++)if(u)"'"!==t.charAt(r)||l("'")?h+=t.charAt(r):u=!1;else switch(t.charAt(r)){case"d":h+=i("d",e.getDate(),2);break;case"D":h+=s("D",e.getDay(),n,d);break;case"o":h+=i("o",Math.round((new Date(e.getFullYear(),e.getMonth(),e.getDate()).getTime()-new Date(e.getFullYear(),0,0).getTime())/864e5),3);break;case"m":h+=i("m",e.getMonth()+1,2);break;case"M":h+=s("M",e.getMonth(),c,o);break;case"y":h+=l("y")?e.getFullYear():(e.getFullYear()%100<10?"0":"")+e.getFullYear()%100;break;case"@":h+=e.getTime();break;case"!":h+=1e4*e.getTime()+this._ticksTo1970;break;case"'":l("'")?h+="'":u=!0;break;default:h+=t.charAt(r)}return h},_possibleChars:function(t){for(var e="",a=!1,i=function(e){e=s+1<t.length&&t.charAt(s+1)===e;return e&&s++,e},s=0;s<t.length;s++)if(a)"'"!==t.charAt(s)||i("'")?e+=t.charAt(s):a=!1;else switch(t.charAt(s)){case"d":case"m":case"y":case"@":e+="0123456789";break;case"D":case"M":return null;case"'":i("'")?e+="'":a=!0;break;default:e+=t.charAt(s)}return e},_get:function(e,t){return(void 0!==e.settings[t]?e.settings:this._defaults)[t]},_setDateFromField:function(e,t){if(e.input.val()!==e.lastVal){var a=this._get(e,"dateFormat"),i=e.lastVal=e.input?e.input.val():null,s=this._getDefaultDate(e),r=s,n=this._getFormatConfig(e);try{r=this.parseDate(a,i,n)||s}catch(e){i=t?"":i}e.selectedDay=r.getDate(),e.drawMonth=e.selectedMonth=r.getMonth(),e.drawYear=e.selectedYear=r.getFullYear(),e.currentDay=i?r.getDate():0,e.currentMonth=i?r.getMonth():0,e.currentYear=i?r.getFullYear():0,this._adjustInstDate(e)}},_getDefaultDate:function(e){return this._restrictMinMax(e,this._determineDate(e,this._get(e,"defaultDate"),new Date))},_determineDate:function(d,e,t){var a,i=null==e||""===e?t:"string"==typeof e?function(e){try{return V.datepicker.parseDate(V.datepicker._get(d,"dateFormat"),e,V.datepicker._getFormatConfig(d))}catch(e){}for(var t=(e.toLowerCase().match(/^c/)?V.datepicker._getDate(d):null)||new Date,a=t.getFullYear(),i=t.getMonth(),s=t.getDate(),r=/([+\-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g,n=r.exec(e);n;){switch(n[2]||"d"){case"d":case"D":s+=parseInt(n[1],10);break;case"w":case"W":s+=7*parseInt(n[1],10);break;case"m":case"M":i+=parseInt(n[1],10),s=Math.min(s,V.datepicker._getDaysInMonth(a,i));break;case"y":case"Y":a+=parseInt(n[1],10),s=Math.min(s,V.datepicker._getDaysInMonth(a,i))}n=r.exec(e)}return new Date(a,i,s)}(e):"number"==typeof e?isNaN(e)?t:(i=e,(a=new Date).setDate(a.getDate()+i),a):new Date(e.getTime());return(i=i&&"Invalid Date"===i.toString()?t:i)&&(i.setHours(0),i.setMinutes(0),i.setSeconds(0),i.setMilliseconds(0)),this._daylightSavingAdjust(i)},_daylightSavingAdjust:function(e){return e?(e.setHours(12<e.getHours()?e.getHours()+2:0),e):null},_setDate:function(e,t,a){var i=!t,s=e.selectedMonth,r=e.selectedYear,t=this._restrictMinMax(e,this._determineDate(e,t,new Date));e.selectedDay=e.currentDay=t.getDate(),e.drawMonth=e.selectedMonth=e.currentMonth=t.getMonth(),e.drawYear=e.selectedYear=e.currentYear=t.getFullYear(),s===e.selectedMonth&&r===e.selectedYear||a||this._notifyChange(e),this._adjustInstDate(e),e.input&&e.input.val(i?"":this._formatDate(e))},_getDate:function(e){return!e.currentYear||e.input&&""===e.input.val()?null:this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay))},_attachHandlers:function(e){var t=this._get(e,"stepMonths"),a="#"+e.id.replace(/\\\\/g,"\\");e.dpDiv.find("[data-handler]").map(function(){var e={prev:function(){V.datepicker._adjustDate(a,-t,"M")},next:function(){V.datepicker._adjustDate(a,+t,"M")},hide:function(){V.datepicker._hideDatepicker()},today:function(){V.datepicker._gotoToday(a)},selectDay:function(){return V.datepicker._selectDay(a,+this.getAttribute("data-month"),+this.getAttribute("data-year"),this),!1},selectMonth:function(){return V.datepicker._selectMonthYear(a,this,"M"),!1},selectYear:function(){return V.datepicker._selectMonthYear(a,this,"Y"),!1}};V(this).on(this.getAttribute("data-event"),e[this.getAttribute("data-handler")])})},_generateHTML:function(e){var t,a,i,s,r,O,L,R,H,n,d,W,c,o,l,h,u,p,g,_,f,k,E,D,m,U,y,P,z,v,M,b,w=new Date,B=this._daylightSavingAdjust(new Date(w.getFullYear(),w.getMonth(),w.getDate())),C=this._get(e,"isRTL"),w=this._get(e,"showButtonPanel"),I=this._get(e,"hideIfNoPrevNext"),x=this._get(e,"navigationAsDateFormat"),Y=this._getNumberOfMonths(e),S=this._get(e,"showCurrentAtPos"),F=this._get(e,"stepMonths"),J=1!==Y[0]||1!==Y[1],N=this._daylightSavingAdjust(e.currentDay?new Date(e.currentYear,e.currentMonth,e.currentDay):new Date(9999,9,9)),T=this._getMinMaxDate(e,"min"),A=this._getMinMaxDate(e,"max"),K=e.drawMonth-S,j=e.drawYear;if(K<0&&(K+=12,j--),A)for(t=this._daylightSavingAdjust(new Date(A.getFullYear(),A.getMonth()-Y[0]*Y[1]+1,A.getDate())),t=T&&t<T?T:t;this._daylightSavingAdjust(new Date(j,K,1))>t;)--K<0&&(K=11,j--);for(e.drawMonth=K,e.drawYear=j,S=this._get(e,"prevText"),S=x?this.formatDate(S,this._daylightSavingAdjust(new Date(j,K-F,1)),this._getFormatConfig(e)):S,a=this._canAdjustMonth(e,-1,j,K)?V("<a>").attr({class:"ui-datepicker-prev ui-corner-all","data-handler":"prev","data-event":"click",title:S}).append(V("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(C?"e":"w")).text(S))[0].outerHTML:I?"":V("<a>").attr({class:"ui-datepicker-prev ui-corner-all ui-state-disabled",title:S}).append(V("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(C?"e":"w")).text(S))[0].outerHTML,S=this._get(e,"nextText"),S=x?this.formatDate(S,this._daylightSavingAdjust(new Date(j,K+F,1)),this._getFormatConfig(e)):S,i=this._canAdjustMonth(e,1,j,K)?V("<a>").attr({class:"ui-datepicker-next ui-corner-all","data-handler":"next","data-event":"click",title:S}).append(V("<span>").addClass("ui-icon ui-icon-circle-triangle-"+(C?"w":"e")).text(S))[0].outerHTML:I?"":V("<a>").attr({class:"ui-datepicker-next ui-corner-all ui-state-disabled",title:S}).append(V("<span>").attr("class","ui-icon ui-icon-circle-triangle-"+(C?"w":"e")).text(S))[0].outerHTML,F=this._get(e,"currentText"),I=this._get(e,"gotoCurrent")&&e.currentDay?N:B,F=x?this.formatDate(F,I,this._getFormatConfig(e)):F,S="",e.inline||(S=V("<button>").attr({type:"button",class:"ui-datepicker-close ui-state-default ui-priority-primary ui-corner-all","data-handler":"hide","data-event":"click"}).text(this._get(e,"closeText"))[0].outerHTML),x="",w&&(x=V("<div class='ui-datepicker-buttonpane ui-widget-content'>").append(C?S:"").append(this._isInRange(e,I)?V("<button>").attr({type:"button",class:"ui-datepicker-current ui-state-default ui-priority-secondary ui-corner-all","data-handler":"today","data-event":"click"}).text(F):"").append(C?"":S)[0].outerHTML),s=parseInt(this._get(e,"firstDay"),10),s=isNaN(s)?0:s,r=this._get(e,"showWeek"),O=this._get(e,"dayNames"),L=this._get(e,"dayNamesMin"),R=this._get(e,"monthNames"),H=this._get(e,"monthNamesShort"),n=this._get(e,"beforeShowDay"),d=this._get(e,"showOtherMonths"),W=this._get(e,"selectOtherMonths"),c=this._getDefaultDate(e),o="",h=0;h<Y[0];h++){for(u="",this.maxRows=4,p=0;p<Y[1];p++){if(g=this._daylightSavingAdjust(new Date(j,K,e.selectedDay)),_=" ui-corner-all",f="",J){if(f+="<div class='ui-datepicker-group",1<Y[1])switch(p){case 0:f+=" ui-datepicker-group-first",_=" ui-corner-"+(C?"right":"left");break;case Y[1]-1:f+=" ui-datepicker-group-last",_=" ui-corner-"+(C?"left":"right");break;default:f+=" ui-datepicker-group-middle",_=""}f+="'>"}for(f+="<div class='ui-datepicker-header ui-widget-header ui-helper-clearfix"+_+"'>"+(/all|left/.test(_)&&0===h?C?i:a:"")+(/all|right/.test(_)&&0===h?C?a:i:"")+this._generateMonthYearHeader(e,K,j,T,A,0<h||0<p,R,H)+"</div><table class='ui-datepicker-calendar'><thead><tr>",k=r?"<th class='ui-datepicker-week-col'>"+this._get(e,"weekHeader")+"</th>":"",l=0;l<7;l++)k+="<th scope='col'"+(5<=(l+s+6)%7?" class='ui-datepicker-week-end'":"")+"><span title='"+O[E=(l+s)%7]+"'>"+L[E]+"</span></th>";for(f+=k+"</tr></thead><tbody>",m=this._getDaysInMonth(j,K),j===e.selectedYear&&K===e.selectedMonth&&(e.selectedDay=Math.min(e.selectedDay,m)),D=(this._getFirstDayOfMonth(j,K)-s+7)%7,m=Math.ceil((D+m)/7),U=J&&this.maxRows>m?this.maxRows:m,this.maxRows=U,y=this._daylightSavingAdjust(new Date(j,K,1-D)),P=0;P<U;P++){for(f+="<tr>",z=r?"<td class='ui-datepicker-week-col'>"+this._get(e,"calculateWeek")(y)+"</td>":"",l=0;l<7;l++)v=n?n.apply(e.input?e.input[0]:null,[y]):[!0,""],b=(M=y.getMonth()!==K)&&!W||!v[0]||T&&y<T||A&&A<y,z+="<td class='"+(5<=(l+s+6)%7?" ui-datepicker-week-end":"")+(M?" ui-datepicker-other-month":"")+(y.getTime()===g.getTime()&&K===e.selectedMonth&&e._keyEvent||c.getTime()===y.getTime()&&c.getTime()===g.getTime()?" "+this._dayOverClass:"")+(b?" "+this._unselectableClass+" ui-state-disabled":"")+(M&&!d?"":" "+v[1]+(y.getTime()===N.getTime()?" "+this._currentClass:"")+(y.getTime()===B.getTime()?" ui-datepicker-today":""))+"'"+(M&&!d||!v[2]?"":" title='"+v[2].replace(/'/g,"&#39;")+"'")+(b?"":" data-handler='selectDay' data-event='click' data-month='"+y.getMonth()+"' data-year='"+y.getFullYear()+"'")+">"+(M&&!d?"&#xa0;":b?"<span class='ui-state-default'>"+y.getDate()+"</span>":"<a class='ui-state-default"+(y.getTime()===B.getTime()?" ui-state-highlight":"")+(y.getTime()===N.getTime()?" ui-state-active":"")+(M?" ui-priority-secondary":"")+"' href='#' aria-current='"+(y.getTime()===N.getTime()?"true":"false")+"' data-date='"+y.getDate()+"'>"+y.getDate()+"</a>")+"</td>",y.setDate(y.getDate()+1),y=this._daylightSavingAdjust(y);f+=z+"</tr>"}11<++K&&(K=0,j++),u+=f+="</tbody></table>"+(J?"</div>"+(0<Y[0]&&p===Y[1]-1?"<div class='ui-datepicker-row-break'></div>":""):"")}o+=u}return o+=x,e._keyEvent=!1,o},_generateMonthYearHeader:function(e,t,a,i,s,r,n,d){var c,o,l,h,u,p,g=this._get(e,"changeMonth"),_=this._get(e,"changeYear"),f=this._get(e,"showMonthAfterYear"),k=this._get(e,"selectMonthLabel"),D=this._get(e,"selectYearLabel"),m="<div class='ui-datepicker-title'>",y="";if(r||!g)y+="<span class='ui-datepicker-month'>"+n[t]+"</span>";else{for(c=i&&i.getFullYear()===a,o=s&&s.getFullYear()===a,y+="<select class='ui-datepicker-month' aria-label='"+k+"' data-handler='selectMonth' data-event='change'>",l=0;l<12;l++)(!c||l>=i.getMonth())&&(!o||l<=s.getMonth())&&(y+="<option value='"+l+"'"+(l===t?" selected='selected'":"")+">"+d[l]+"</option>");y+="</select>"}if(f||(m+=y+(!r&&g&&_?"":"&#xa0;")),!e.yearshtml)if(e.yearshtml="",r||!_)m+="<span class='ui-datepicker-year'>"+a+"</span>";else{for(n=this._get(e,"yearRange").split(":"),h=(new Date).getFullYear(),u=(k=function(e){e=e.match(/c[+\-].*/)?a+parseInt(e.substring(1),10):e.match(/[+\-].*/)?h+parseInt(e,10):parseInt(e,10);return isNaN(e)?h:e})(n[0]),p=Math.max(u,k(n[1]||"")),u=i?Math.max(u,i.getFullYear()):u,p=s?Math.min(p,s.getFullYear()):p,e.yearshtml+="<select class='ui-datepicker-year' aria-label='"+D+"' data-handler='selectYear' data-event='change'>";u<=p;u++)e.yearshtml+="<option value='"+u+"'"+(u===a?" selected='selected'":"")+">"+u+"</option>";e.yearshtml+="</select>",m+=e.yearshtml,e.yearshtml=null}return m+=this._get(e,"yearSuffix"),f&&(m+=(!r&&g&&_?"":"&#xa0;")+y),m+="</div>"},_adjustInstDate:function(e,t,a){var i=e.selectedYear+("Y"===a?t:0),s=e.selectedMonth+("M"===a?t:0),t=Math.min(e.selectedDay,this._getDaysInMonth(i,s))+("D"===a?t:0),i=this._restrictMinMax(e,this._daylightSavingAdjust(new Date(i,s,t)));e.selectedDay=i.getDate(),e.drawMonth=e.selectedMonth=i.getMonth(),e.drawYear=e.selectedYear=i.getFullYear(),"M"!==a&&"Y"!==a||this._notifyChange(e)},_restrictMinMax:function(e,t){var a=this._getMinMaxDate(e,"min"),e=this._getMinMaxDate(e,"max"),a=a&&t<a?a:t;return e&&e<a?e:a},_notifyChange:function(e){var t=this._get(e,"onChangeMonthYear");t&&t.apply(e.input?e.input[0]:null,[e.selectedYear,e.selectedMonth+1,e])},_getNumberOfMonths:function(e){e=this._get(e,"numberOfMonths");return null==e?[1,1]:"number"==typeof e?[1,e]:e},_getMinMaxDate:function(e,t){return this._determineDate(e,this._get(e,t+"Date"),null)},_getDaysInMonth:function(e,t){return 32-this._daylightSavingAdjust(new Date(e,t,32)).getDate()},_getFirstDayOfMonth:function(e,t){return new Date(e,t,1).getDay()},_canAdjustMonth:function(e,t,a,i){var s=this._getNumberOfMonths(e),a=this._daylightSavingAdjust(new Date(a,i+(t<0?t:s[0]*s[1]),1));return t<0&&a.setDate(this._getDaysInMonth(a.getFullYear(),a.getMonth())),this._isInRange(e,a)},_isInRange:function(e,t){var a,i=this._getMinMaxDate(e,"min"),s=this._getMinMaxDate(e,"max"),r=null,n=null,e=this._get(e,"yearRange");return e&&(e=e.split(":"),a=(new Date).getFullYear(),r=parseInt(e[0],10),n=parseInt(e[1],10),e[0].match(/[+\-].*/)&&(r+=a),e[1].match(/[+\-].*/))&&(n+=a),(!i||t.getTime()>=i.getTime())&&(!s||t.getTime()<=s.getTime())&&(!r||t.getFullYear()>=r)&&(!n||t.getFullYear()<=n)},_getFormatConfig:function(e){var t=this._get(e,"shortYearCutoff");return{shortYearCutoff:"string"!=typeof t?t:(new Date).getFullYear()%100+parseInt(t,10),dayNamesShort:this._get(e,"dayNamesShort"),dayNames:this._get(e,"dayNames"),monthNamesShort:this._get(e,"monthNamesShort"),monthNames:this._get(e,"monthNames")}},_formatDate:function(e,t,a,i){t||(e.currentDay=e.selectedDay,e.currentMonth=e.selectedMonth,e.currentYear=e.selectedYear);i=t?"object"==typeof t?t:this._daylightSavingAdjust(new Date(i,a,t)):this._daylightSavingAdjust(new Date(e.currentYear,e.currentMonth,e.currentDay));return this.formatDate(this._get(e,"dateFormat"),i,this._getFormatConfig(e))}}),V.fn.datepicker=function(e){if(!this.length)return this;V.datepicker.initialized||(V(document).on("mousedown",V.datepicker._checkExternalClick),V.datepicker.initialized=!0),0===V("#"+V.datepicker._mainDivId).length&&V("body").append(V.datepicker.dpDiv);var t=Array.prototype.slice.call(arguments,1);return"string"==typeof e&&("isDisabled"===e||"getDate"===e||"widget"===e)||"option"===e&&2===arguments.length&&"string"==typeof arguments[1]?V.datepicker["_"+e+"Datepicker"].apply(V.datepicker,[this[0]].concat(t)):this.each(function(){"string"==typeof e?V.datepicker["_"+e+"Datepicker"].apply(V.datepicker,[this].concat(t)):V.datepicker._attachDatepicker(this,e)})},V.datepicker=new e,V.datepicker.initialized=!1,V.datepicker.uuid=(new Date).getTime(),V.datepicker.version="1.14.2",V.datepicker});
;
rcl_do_action("rcl_footer")
;

			(function() {
				// Always start from a fresh object: a `||` fallback would keep a same-named DOM element alive.
				window.wcAnalytics = {};
				const wcAnalytics = window.wcAnalytics;

				// Set the assets URL for webpack to find the split assets.
				wcAnalytics.assets_url = 'https://welans.ru/wp-content/plugins/jetpack/jetpack_vendor/automattic/woocommerce-analytics/src/../build/';

				// Set the REST API tracking endpoint URL.
								wcAnalytics.trackEndpoint = "https://welans.ru/wp-json/woocommerce-analytics/v1/track";

				// Set common properties for all events.
				wcAnalytics.commonProps = {"ui":0,"blog_id":214020532,"store_id":"5d1db11b-710b-4441-8685-eb8b02acc426","url":"https://welans.ru","woo_version":"11.2.1","wp_version":"7.1.3","store_admin":0,"device":"desktop","store_currency":"RUB","timezone":"+03:00","is_guest":1,"package_version":"0.18.0"};

				// Set the event queue.
				wcAnalytics.eventQueue = [];

				// Features.
				wcAnalytics.features = {
					ch: false,
					sessionTracking: false,
					proxy: false,
				};

				wcAnalytics.breadcrumbs = ["Home"];

				// Page context flags.
				wcAnalytics.pages = {
					isAccountPage: false,
					isCart: false,
				};
			})();
		
;

   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
   m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

   ym(88761909, "init", {
        clickmap:true,
        trackLinks:true,
        accurateTrackBounce:true,
        webvisor:true
   });

;

// WeCRM: форма обратной связи лендинга -> новая задача в проекте
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var form = document.querySelector('form.brz-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var fields = form.querySelectorAll('.brz-forms2__field');
      var data = { name: '', phone: '', message: '' };
      fields.forEach(function (f) {
        var label = (f.getAttribute('data-label') || '').toLowerCase();
        if (label.indexOf('ф.и.о') !== -1 || label.indexOf('имя') !== -1) data.name = f.value;
        else if (label.indexOf('телефон') !== -1 || f.type === 'tel') data.phone = f.value;
        else data.message = f.value;
      });
      if (!data.name.trim() || !data.phone.trim()) {
        alert('Заполните, пожалуйста, Ф.И.О и телефон.');
        return;
      }
      var btn = form.querySelector('.brz-btn-submit');
      if (btn) btn.disabled = true;
      fetch('/api/public/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (btn) btn.disabled = false;
        if (res.ok) {
          form.reset();
          alert('Сообщение отправлено!');
        } else {
          alert((res.j && res.j.error) || 'Ошибка отправки. Попробуйте позже.');
        }
      }).catch(function () {
        if (btn) btn.disabled = false;
        alert('Ошибка отправки. Попробуйте позже.');
      });
    }, true);
  });
})();

;

// WeCRM: если посетитель авторизован на welans.cc — показать в шапке его аватарку
// (круглую, в зелёном контуре) вместо кнопки «Вход»; клик ведёт на дашборд CRM.
// Состояние узнаём через редирект-мост welans.cc/auth-bridge.html (один раз в сутки,
// результат кэшируется в localStorage этой страницы). Поисковых ботов не редиректим.
(function () {
  if (['welans.ru', 'www.welans.ru'].indexOf(location.hostname) === -1) return;
  var LS_KEY = 'wecrm_auth';
  var TTL = 24 * 60 * 60 * 1000;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  function render(user) {
    var cta = document.querySelector('.ct-header-cta');
    if (!cta || cta.querySelector('.wecrm-avatar-link')) return;
    var loginBtn = cta.querySelector('a[href="https://welans.cc/"]');
    var a = document.createElement('a');
    a.href = 'https://welans.cc/';
    a.className = 'wecrm-avatar-link';
    a.title = (user.name ? user.name + ' — ' : '') + 'Перейти в CRM';
    a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;' +
      'width:40px;height:40px;border-radius:50%;border:2px solid #22c55e;overflow:hidden;' +
      'margin-left:10px;background:#00b300;text-decoration:none;box-sizing:border-box;flex-shrink:0;';
    var avatarUrl = user.avatar ? (String(user.avatar).indexOf('http') === 0 ? user.avatar : 'https://welans.cc' + user.avatar) : '';
    if (avatarUrl) {
      var img = document.createElement('img');
      img.src = avatarUrl;
      img.alt = user.name || 'Профиль';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      a.appendChild(img);
    } else {
      var initials = (user.name || 'U').trim().split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
      var sp = document.createElement('span');
      sp.textContent = initials;
      sp.style.cssText = 'color:#fff;font-size:14px;font-weight:700;line-height:1;';
      a.appendChild(sp);
    }
    cta.appendChild(a);
    if (loginBtn) loginBtn.style.display = 'none';
  }
  function cache(rec) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rec)); } catch (e) {}
  }

  ready(function () {
    // 1) вернулись с моста — ответ в хэше адреса
    if (location.hash.indexOf('#wecrm-user=') === 0) {
      var user = null;
      try { user = JSON.parse(decodeURIComponent(escape(atob(location.hash.substring(12))))); } catch (e) {}
      history.replaceState(null, '', location.pathname + location.search);
      cache({ ts: Date.now(), user: user });
      if (user) render(user);
      return;
    }
    if (location.hash === '#wecrm-guest') {
      history.replaceState(null, '', location.pathname + location.search);
      cache({ ts: Date.now(), user: null });
      return;
    }
    // 2) свежий кэш — работаем без редиректа
    try {
      var c = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (c && Date.now() - c.ts < TTL) {
        if (c.user) render(c.user);
        return;
      }
    } catch (e) {}
    // 3) ботов не трогаем — им всегда обычная страница
    var ua = navigator.userAgent || '';
    if (/bot|crawler|spider|slurp|yandex|duckduck|baidu|curl|wget|python|headless|lighthouse/i.test(ua)) return;
    // 4) состояние неизвестно — один редирект на мост и обратно
    location.replace('https://welans.cc/auth-bridge.html?back=' + encodeURIComponent(location.href.split('#')[0]));
  });
})();
