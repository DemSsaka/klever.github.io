/* Ротатор УТП в баннере «Знаем ценность вашего золота» (#brand-banner).
 * Раз в INTERVAL мс текст размывается и на его месте проявляется следующий набор.
 * Тексты УТП меняются в массиве SLIDES ниже. Первый элемент = то, что в вёрстке.
 * Заголовок: строки через \n. Пунктов всегда 3 (t — жирная строка, d — подпись).
 */
(function () {
  'use strict';

  var SLIDES = [
  {
    "title": "Знаем ценность вашего золота",
    "usps": [
      {
        "t": "Цена привязана к бирже",
        "d": "Курс — ориентир; учитываем пробу и вес"
      },
      {
        "t": "Только по договору",
        "d": "Каждая продажа — по договору купли-продажи"
      },
      {
        "t": "Деньги после оценки",
        "d": "Выплачиваем после подписания договора"
      }
    ]
  },
  {
    "title": "Профессиональная оценка при вас",
    "usps": [
      {
        "t": "Оценивает товаровед",
        "d": "Специалист с профильным образованием"
      },
      {
        "t": "Проба — после проверки",
        "d": "Проверяем золото несколькими способами"
      },
      {
        "t": "Весы проходят поверку",
        "d": "Вы видите взвешивание своего изделия"
      }
    ]
  },
  {
    "title": "Вы видите, как складывается сумма",
    "usps": [
      {
        "t": "Проверяем пробу при вас",
        "d": "Учитываем фактическое содержание золота"
      },
      {
        "t": "Объясняем расчёт цены",
        "d": "Учитываем пробу, вес и характеристики"
      },
      {
        "t": "Сумма до подписания",
        "d": "Вы решаете, подходит ли предложение"
      }
    ]
  },
  {
    "title": "Продаёте изделие — получаете деньги",
    "usps": [
      {
        "t": "Вы продаёте, а не занимаете",
        "d": "Покупаем золото, не принимаем в залог"
      },
      {
        "t": "Без процентов по займу",
        "d": "После продажи нет кредитных платежей"
      },
      {
        "t": "Без обратного выкупа",
        "d": "Возвращать выплату за изделие не нужно"
      }
    ]
  },
  {
    "title": "Продайте золото в удобное время",
    "usps": [
      {
        "t": "Офисы рядом с метро",
        "d": "Выберите удобный адрес в Москве"
      },
      {
        "t": "Ежедневно до 22:00",
        "d": "Можно приехать после работы"
      },
      {
        "t": "Ориентир по фото",
        "d": "Предварительная оценка в мессенджере"
      }
    ]
  },
  {
    "title": "Дайте новую ценность старым вещам",
    "usps": [
      {
        "t": "Целые и сломанные",
        "d": "Принимаем украшения и лом золота"
      },
      {
        "t": "Одиночные и без пары",
        "d": "Оценим серьгу или обрывок цепочки"
      },
      {
        "t": "Продажа без залога",
        "d": "Без займа и обязательства выкупа"
      }
    ]
  }
];

  var INTERVAL = 6500;   // сколько висит один набор, мс
  var DUR = 750;         // длительность размытия одного элемента, мс
  var WORD_STEP = 45;    // задержка между словами заголовка, мс
  var USP_START = 140;   // с какой задержки начинают пункты, мс
  var USP_STEP = 110;    // задержка между пунктами, мс

  var CSS =
    '#brand-banner .br-w{display:inline-block;transition:filter ' + DUR + 'ms cubic-bezier(.4,0,.2,1),opacity ' + DUR + 'ms cubic-bezier(.4,0,.2,1),transform ' + DUR + 'ms cubic-bezier(.2,.7,.2,1);transition-delay:calc(var(--d,0)*1ms);will-change:filter,opacity,transform}' +
    '#brand-banner .br-out .br-w{filter:blur(12px);opacity:0;transform:translateY(-.14em) scale(1.03)}' +
    '#brand-banner .br-w.br-pre{transition:none!important;filter:blur(14px);opacity:0;transform:translateY(.22em) scale(.97)}' +
    '#brand-banner .brand-check{transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .5s ease,border-color .5s ease;transition-delay:calc(var(--d,0)*1ms)}' +
    '#brand-banner .br-out .brand-check{transform:scale(.82);border-color:#e4c47d22}' +
    '#brand-banner .br-glow .brand-check{box-shadow:0 0 0 4px #e4c47d1f,0 0 18px #e4c47d55;border-color:#e4c47d}';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function titleHTML(title) {
    var i = 0;
    return title.split('\n').map(function (line) {
      return line.split(' ').filter(Boolean).map(function (w) {
        return '<span class="br-w" style="--d:' + (i++ * WORD_STEP) + '">' + esc(w) + '</span>';
      }).join(' ');
    }).join('<br>');
  }

  function lastDelay(slide) {
    var words = slide.title.split(/\s+/).filter(Boolean).length;
    return Math.max((words - 1) * WORD_STEP, USP_START + 2 * USP_STEP + 60);
  }

  function init(copy) {
    copy.setAttribute('data-br-ready', '');
    var h2 = copy.querySelector('h2');
    var items = copy.querySelectorAll('.brand-usps > div');
    if (!h2 || items.length < 3) return;

    var parts = [].map.call(items, function (item, k) {
      var check = item.querySelector('.brand-check');
      if (check) check.style.setProperty('--d', USP_START + k * USP_STEP);
      return { t: item.querySelector('strong'), d: item.querySelector('small') };
    });

    function render(slide, pre) {
      h2.innerHTML = titleHTML(slide.title);
      parts.forEach(function (p, k) {
        var dl = USP_START + k * USP_STEP;
        if (p.t) p.t.innerHTML = '<span class="br-w" style="--d:' + dl + '">' + esc(slide.usps[k].t) + '</span>';
        if (p.d) p.d.innerHTML = '<span class="br-w" style="--d:' + (dl + 60) + '">' + esc(slide.usps[k].d) + '</span>';
      });
      if (pre) [].forEach.call(copy.querySelectorAll('.br-w'), function (w) { w.classList.add('br-pre'); });
    }

    // Не даём баннеру прыгать по высоте, если у какого-то набора больше строк.
    var maxH = 0;
    function lockHeight() {
      var h = copy.offsetHeight;
      if (h > maxH) { maxH = h; copy.style.minHeight = maxH + 'px'; }
    }
    window.addEventListener('resize', function () { maxH = 0; copy.style.minHeight = ''; lockHeight(); });

    render(SLIDES[0], false);
    lockHeight();

    var idx = 0, timer = 0, busy = false, hovered = false, visible = true;

    function next() {
      timer = 0;
      if (!copy.isConnected) return;
      if (hovered || !visible || document.hidden || (reduce && reduce.matches)) { schedule(); return; }
      busy = true;
      var cur = SLIDES[idx];
      idx = (idx + 1) % SLIDES.length;
      var nxt = SLIDES[idx];

      copy.classList.add('br-out');
      setTimeout(function () {
        if (!copy.isConnected) return;
        render(nxt, true);
        copy.classList.remove('br-out');
        lockHeight();
        void copy.offsetWidth; // фиксируем стартовое состояние до анимации
        requestAnimationFrame(function () {
          [].forEach.call(copy.querySelectorAll('.br-pre'), function (w) { w.classList.remove('br-pre'); });
          copy.classList.add('br-glow');
          setTimeout(function () { copy.classList.remove('br-glow'); }, 900);
          setTimeout(function () { busy = false; schedule(); }, lastDelay(nxt) + DUR);
        });
      }, lastDelay(cur) + Math.round(DUR * 0.65)); // новый текст проявляется, пока старый дотаивает
    }

    function schedule() {
      if (!timer && !busy) timer = setTimeout(next, INTERVAL);
    }

    var banner = copy.closest('.brand-promise') || copy;
    banner.addEventListener('mouseenter', function () { hovered = true; });
    banner.addEventListener('mouseleave', function () { hovered = false; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.2 }).observe(banner);
    }
    schedule();
  }

  function scan() {
    var copy = document.querySelector('#brand-banner .brand-copy:not([data-br-ready])');
    if (copy) init(copy);
  }

  function boot() {
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    scan();
    // Баннер рендерится шаблоном позже и может перерисовываться — следим.
    var raf = 0;
    new MutationObserver(function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; scan(); });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
