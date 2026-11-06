(() => {
  'use strict';
  if (document.getElementById('gold-quote')) return;

  const endpoint = 'https://iss.moex.com/iss/engines/currency/markets/selt/boards/CETS/securities/GLDRUB_TOM.json?iss.meta=off&iss.only=securities,marketdata,dataversion';
  const storageKey = 'klever-moex-gold-v1';
  const wideScreen = matchMedia('(min-width:1660px)');
  const widget = document.createElement('details');
  widget.id = 'gold-quote';
  widget.className = 'gold-quote';
  widget.open = wideScreen.matches;
  widget.innerHTML = `
    <summary aria-label="Котировка золота Московской биржи. Раскрыть или свернуть подробности">
      <span class="gold-quote-title">За сколько продать золото сегодня</span><span class="gold-quote-heading"><span class="gold-quote-symbol" aria-hidden="true">Au</span><span class="gold-quote-label">Золото<span class="gold-quote-delay">MOEX · 15 мин</span></span></span>
      <span class="gold-quote-arrow" aria-hidden="true">⌄</span>
      <strong class="gold-quote-price">—</strong><span class="gold-quote-unit">₽ за 1 грамм</span>
    </summary>
    <div class="gold-quote-body">
      <p class="gold-quote-change" hidden></p>
      <time class="gold-quote-time"></time>
      <span class="gold-quote-status" role="status">Загружаем котировку…</span>
      <a href="https://www.moex.com/preciousmetals" target="_blank" rel="noopener noreferrer">Московская биржа ↗</a>
      <p class="gold-quote-note">GLDRUB_TOM · задержка 15 мин.<br>Биржевой ориентир. Стоимость изделия определяем после оценки.</p>
      <button class="gold-quote-refresh" type="button">Обновить</button>
    </div>`;
  document.body.append(widget);

  const price = widget.querySelector('.gold-quote-price');
  const change = widget.querySelector('.gold-quote-change');
  const time = widget.querySelector('.gold-quote-time');
  const status = widget.querySelector('.gold-quote-status');
  const refresh = widget.querySelector('.gold-quote-refresh');
  const numberFormat = new Intl.NumberFormat('ru-RU', {maximumFractionDigits: 2});
  let lastQuote = null;
  let loading = false;

  function row(block) {
    if (!block?.data?.length || !Array.isArray(block.columns)) return {};
    return Object.fromEntries(block.columns.map((column, index) => [column, block.data[0][index]]));
  }

  function validQuote(quote) {
    return quote && Number.isFinite(quote.price) && quote.price > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(quote.date) &&
      (quote.time === '' || /^\d{2}:\d{2}:\d{2}$/.test(quote.time));
  }

  function parseQuote(payload) {
    const market = row(payload.marketdata);
    const security = row(payload.securities);
    const version = row(payload.dataversion);
    if (security.SECID !== 'GLDRUB_TOM') throw new Error('Unexpected instrument');
    const hasTrade = Number.isFinite(market.LAST) && market.LAST > 0;
    const quote = {
      price: hasTrade ? market.LAST : security.PREVPRICE,
      date: hasTrade ? version.trade_date : security.PREVDATE,
      time: hasTrade ? (market.TIME || '') : '',
      change: hasTrade && Number.isFinite(market.LASTTOPREVPRICE) ? market.LASTTOPREVPRICE : null,
      previousClose: !hasTrade,
      receivedAt: Date.now()
    };
    if (!validQuote(quote)) throw new Error('No dated quote');
    return quote;
  }

  function render(quote, cached) {
    widget.dataset.state = cached ? 'cached' : 'loaded';
    price.textContent = numberFormat.format(quote.price);
    const dateLabel = quote.date.split('-').reverse().join('.');
    time.dateTime = quote.date + (quote.time ? 'T' + quote.time + '+03:00' : '');
    time.textContent = (quote.previousClose ? 'Закрытие ' : 'Сделка ') + dateLabel +
      (quote.time ? ' · ' + quote.time.slice(0, 5) + ' МСК' : '');
    change.hidden = !Number.isFinite(quote.change);
    if (!change.hidden) {
      change.textContent = (quote.change > 0 ? '+' : '') + numberFormat.format(quote.change) + '% к закрытию';
      change.dataset.direction = quote.change < 0 ? 'down' : 'up';
    }
    status.textContent = cached ? 'Сохранённые данные · проверяем связь' : 'Обновление каждую минуту';
    widget.querySelector('summary').setAttribute('aria-label',
      'Золото на Московской бирже, ' + numberFormat.format(quote.price) + ' рублей за грамм. ' +
      time.textContent + '. Данные с задержкой 15 минут. Раскрыть или свернуть подробности.');
  }

  async function update() {
    if (loading || document.hidden) return;
    loading = true;
    refresh.disabled = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, {signal: controller.signal, credentials: 'omit'});
      if (!response.ok) throw new Error('Quote service unavailable');
      lastQuote = parseQuote(await response.json());
      render(lastQuote, false);
      try { localStorage.setItem(storageKey, JSON.stringify(lastQuote)); } catch { /* Storage is optional. */ }
    } catch {
      if (lastQuote) {
        render(lastQuote, true);
        status.textContent = 'Нет связи · показаны сохранённые данные';
      } else {
        widget.dataset.state = 'unavailable';
        price.textContent = '—';
        status.textContent = 'Курс временно недоступен. Открыть источник ниже.';
      }
    } finally {
      clearTimeout(timeout);
      loading = false;
      refresh.disabled = false;
    }
  }

  try {
    const cached = JSON.parse(localStorage.getItem(storageKey));
    if (validQuote(cached)) { lastQuote = cached; render(cached, true); }
  } catch { /* A fresh request also works with blocked or invalid storage. */ }

  refresh.addEventListener('click', update);
  wideScreen.addEventListener('change', event => { widget.open = event.matches; });
  window.addEventListener('online', update);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  setInterval(update, 60000);
  update();
})();
