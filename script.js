(() => {
  const NS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs = {}, parent) {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, value, className, anchor = 'start') {
    const node = svg('text', { x, y, class: className, 'text-anchor': anchor }, parent);
    node.textContent = value;
    return node;
  }

  // A dot is one percentage point. These are illustrations of reported values,
  // not a simulated population or a claim that the source sampled 100 people.
  document.querySelectorAll('.dot-field[data-dots]').forEach((field) => {
    const count = Math.round(Number(field.dataset.dots));
    for (let i = 0; i < 100; i += 1) {
      const dot = document.createElement('span');
      dot.className = `data-dot${i < count ? ' is-filled' : ''}`;
      field.appendChild(dot);
    }
    field.setAttribute('role', 'img');
    field.setAttribute('aria-label', field.dataset.label || `${count} of 100 marks, proportional illustration`);
  });

  const birthData = [
    { year: '2021', births: 445875 },
    { year: '2022', births: 403893 },
    { year: '2023', births: 388428 },
    { year: '2024', births: 365923 },
    { year: '2025', births: 335000 }
  ];
  const birthSvg = document.querySelector('#birth-chart');
  if (birthSvg) {
    const left = 65, right = 680, top = 35, bottom = 260;
    const x = (i) => left + i * ((right - left) / (birthData.length - 1));
    const y = (n) => bottom - (n / 500000) * (bottom - top);

    [0, 250000, 500000].forEach((n) => {
      const yy = y(n);
      svg('line', { x1: left, y1: yy, x2: right, y2: yy, class: 'chart-gridline' }, birthSvg);
      text(birthSvg, left - 12, yy + 4, n === 0 ? '0' : `${n / 1000}k`, 'chart-label', 'end');
    });

    const points = birthData.map((d, i) => `${x(i)},${y(d.births)}`).join(' ');
    const area = `M ${x(0)} ${bottom} L ${points.replaceAll(' ', ' L ')} L ${x(birthData.length - 1)} ${bottom} Z`;
    svg('path', { d: area, class: 'chart-area' }, birthSvg);
    svg('polyline', { points, class: 'chart-line' }, birthSvg);

    birthData.forEach((d, i) => {
      const cx = x(i), cy = y(d.births);
      const point = svg('circle', { cx, cy, r: 6, class: 'chart-point' }, birthSvg);
      const title = svg('title', {}, point);
      title.textContent = `${d.year}: ${d.births.toLocaleString('en-US')} births`;
      text(birthSvg, cx, cy - 15, `${(d.births / 1000).toFixed(1)}k`, 'chart-value', 'middle');
      text(birthSvg, cx, bottom + 27, d.year, 'chart-label', 'middle');
    });
    text(birthSvg, left, 20, 'ANNUAL LIVE BIRTHS', 'chart-label');
    text(birthSvg, right, 20, 'KAZAKHSTAN', 'chart-label', 'end');
  }

  const suicideSvg = document.querySelector('#suicide-chart');
  if (suicideSvg) {
    const left = 62, right = 525, top = 40, bottom = 260;
    const values = [
      { year: '2023', rate: 18.6, count: 3694, className: 'bar-2023' },
      { year: '2024', rate: 17.2, count: 3408, className: 'bar-2024' }
    ];
    const y = (n) => bottom - (n / 22) * (bottom - top);
    [0, 10, 20].forEach((n) => {
      const yy = y(n);
      svg('line', { x1: left, y1: yy, x2: right, y2: yy, class: 'chart-gridline' }, suicideSvg);
      text(suicideSvg, left - 10, yy + 4, String(n), 'chart-label', 'end');
    });
    values.forEach((d, i) => {
      const x = i === 0 ? 170 : 355;
      const barTop = y(d.rate);
      const rect = svg('rect', { x, y: barTop, width: 90, height: bottom - barTop, rx: 3, class: d.className }, suicideSvg);
      const title = svg('title', {}, rect);
      title.textContent = `${d.year}: ${d.rate} registered deaths per 100,000; ${d.count.toLocaleString('en-US')} deaths`;
      text(suicideSvg, x + 45, barTop - 13, d.rate.toFixed(1), 'chart-value', 'middle');
      text(suicideSvg, x + 45, bottom + 27, d.year, 'chart-label', 'middle');
      text(suicideSvg, x + 45, bottom + 46, `${d.count.toLocaleString('en-US')} deaths`, 'chart-label', 'middle');
    });
    text(suicideSvg, left, 20, 'REGISTERED DEATHS / 100,000', 'chart-label');
  }

  // Keep labels readable after the fixed-viewBox charts shrink on phones.
  function fitChartLabels() {
    [birthSvg, suicideSvg].filter(Boolean).forEach((chart) => {
      const boxWidth = chart.viewBox.baseVal.width;
      const renderedWidth = chart.getBoundingClientRect().width;
      if (!boxWidth || !renderedWidth) return;
      const scale = renderedWidth / boxWidth;
      const labelSize = Math.min(30, 11 / scale);
      const valueSize = Math.min(32, 12 / scale);
      chart.querySelectorAll('.chart-label').forEach((node) => {
        node.style.fontSize = `${labelSize}px`;
      });
      chart.querySelectorAll('.chart-value').forEach((node) => {
        node.style.fontSize = `${valueSize}px`;
      });
    });
  }
  fitChartLabels();
  window.addEventListener('resize', fitChartLabels, { passive: true });

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.topbar nav a')];
  if ('IntersectionObserver' in window && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        navLinks.forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }
})();
