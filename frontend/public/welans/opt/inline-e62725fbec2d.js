
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
