
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
