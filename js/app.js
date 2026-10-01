const app = document.getElementById("app");
let mapInstance = null;

function mapsLink(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function mapsDir(origin, destination, mode = "walking") {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
}

function kmBetween(a, b) {
  if (typeof a?.lat !== "number" || typeof b?.lat !== "number") return 999;
  const toRad = (n) => (n * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
}

function isMappable(stop) {
  return typeof stop?.lat === "number" && stop.lat > 54.5;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function destroyMap() {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
}

function renderMap(stops, hotel) {
  const el = document.getElementById("day-map");
  if (!el || !window.L) return;

  destroyMap();
  mapInstance = L.map(el, { scrollWheelZoom: false });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(mapInstance);

  const points = [];
  const hotelIcon = L.divIcon({
    className: "",
    html: '<div class="pin" style="background:#2c5363">H</div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  L.marker([hotel.lat, hotel.lng], { icon: hotelIcon })
    .addTo(mapInstance)
    .bindPopup("Hotel · Wakeup Borgergade");
  points.push([hotel.lat, hotel.lng]);

  stops.forEach((stop, index) => {
    if (!isMappable(stop)) return;
    const icon = L.divIcon({
      className: "",
      html: `<div class="pin">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([stop.lat, stop.lng], { icon })
      .addTo(mapInstance)
      .bindPopup(`<strong>${escapeHtml(stop.time)}</strong><br>${escapeHtml(stop.title)}`);
    points.push([stop.lat, stop.lng]);
  });

  mapInstance.fitBounds(points, { padding: [28, 28], maxZoom: 14 });
  setTimeout(() => mapInstance.invalidateSize(), 80);
}

function renderHome() {
  destroyMap();
  const days = TRIP.days
    .map(
      (day) => `
      <a class="day-card" href="#/giorno/${day.id}">
        <div class="day-card-media">
          <img src="${day.image}" alt="${escapeHtml(day.imageCredit)}" />
          <div class="day-num">${day.shortDate}</div>
        </div>
        <div class="day-card-body">
          <p class="tiny">${escapeHtml(day.weekday)} · ${escapeHtml(day.pace)}</p>
          <h3>${escapeHtml(day.title)}</h3>
          <p>${escapeHtml(day.summary)}</p>
          <div class="tags">${day.neighborhoods.map((n) => `<span class="tag">${escapeHtml(n)}</span>`).join("")}</div>
        </div>
        <div class="day-card-side">
          <div>
            <div class="tiny">Giorno ${day.id}</div>
            <div style="font-family:var(--serif);font-size:1.4rem;margin-top:8px">${escapeHtml(day.date)}</div>
          </div>
          <div class="arrow">→</div>
        </div>
      </a>`
    )
    .join("");

  app.innerHTML = `
    <header class="hero">
      <div class="hero-media">
        <img src="img/nyhavn.jpg" alt="Nyhavn, Copenaghen" />
      </div>
      <div class="wrap topbar">
        <span>Itinerario di viaggio</span>
        <span>Copenaghen 2026</span>
      </div>
      <div class="wrap hero-copy">
        <div class="kicker">${escapeHtml(TRIP.datesLabel)}</div>
        <h1>Copenaghen</h1>
        <p class="hero-lead">${escapeHtml(TRIP.tagline)}</p>
        <div class="hero-meta">
          <span class="chip">${escapeHtml(TRIP.hotel.name)}</span>
          <span class="chip">easyJet · Linate ⇄ CPH</span>
          <span class="chip">5 giorni · visite, cibo, shopping</span>
        </div>
      </div>
    </header>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div>
            <div class="kicker muted">Voli</div>
            <h2>Andata e ritorno</h2>
          </div>
        </div>
        <div class="flights">
          ${TRIP.flights
            .map(
              (flight) => `
            <article class="flight-card">
              <div class="dir">${escapeHtml(flight.direction)} · ${escapeHtml(flight.when)}</div>
              <div class="flight-route">
                <span>${escapeHtml(flight.from)}</span>
                <span>→</span>
                <span>${escapeHtml(flight.to)}</span>
              </div>
              <div class="times">
                <span>${escapeHtml(flight.depart)}</span>
                <span>${escapeHtml(flight.airline)}</span>
                <span>${escapeHtml(flight.arrive)}</span>
              </div>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="wrap">
        <div class="section-head">
          <div>
            <div class="kicker muted">Il viaggio</div>
            <h2>Scegli il giorno</h2>
          </div>
          <p class="muted" style="max-width:320px;margin:0">Ogni giornata è a piedi, per quartieri. C’è già dove fare colazione, pranzo, cena e un giro di negozi.</p>
        </div>
        <div class="days-list">${days}</div>
      </div>
    </section>

    <section class="section" style="padding-top:0">
      <div class="wrap">
        <div class="section-head">
          <div>
            <div class="kicker muted">Prima di partire</div>
            <h2>Info pratiche</h2>
          </div>
        </div>
        <div class="info-grid">
          ${TRIP.practical
            .map(
              (item) => `
            <article class="info-card">
              <h3>${escapeHtml(item.title)}</h3>
              <p class="muted">${escapeHtml(item.text)}</p>
            </article>`
            )
            .join("")}
        </div>
      </div>
    </section>

    <footer>
      <div class="wrap">Wakeup Borgergade · ${escapeHtml(TRIP.hotel.address)} · orari e prezzi aggiornati a ottobre 2026, da ricontrollare il giorno prima.</div>
    </footer>
  `;
}

function renderDay(id) {
  const day = TRIP.days.find((item) => item.id === id);
  if (!day) {
    location.hash = "#/";
    return;
  }

  const hotelMaps = TRIP.hotel.address;
  const stops = day.stops
    .map((stop, index) => {
      const prevStop = index === 0 ? TRIP.hotel : day.stops[index - 1];
      const prevMaps = index === 0 ? hotelMaps : prevStop.maps;
      const canRoute = kmBetween(prevStop, stop) < 8;
      const mode =
        stop.type === "trasporto" ||
        stop.type === "volo" ||
        (stop.type === "hotel" && prevStop.type === "trasporto")
          ? "transit"
          : "walking";
      const routeLabel = mode === "transit" ? "Indicazioni mezzi" : "Indicazioni a piedi";
      const routeBtn = canRoute && stop.type !== "volo"
        ? `<a class="btn" target="_blank" rel="noreferrer" href="${mapsDir(prevMaps, stop.maps, mode)}">${routeLabel}</a>`
        : "";
      const photo = stop.image
        ? `<div class="stop-photo"><img src="${escapeHtml(stop.image)}" alt="${escapeHtml(stop.place)}" /></div>`
        : `<div class="stop-photo"></div>`;
      return `
        <article class="stop" id="stop-${index + 1}">
          <div class="stop-time">
            <b>${escapeHtml(stop.time)}</b>
            <span>${escapeHtml(stop.duration)}</span>
          </div>
          ${photo}
          <div class="stop-body">
            <div class="stop-top">
              <div>
                <div class="tiny">${escapeHtml(stop.neighborhood)} · ${escapeHtml(stop.place)}</div>
                <h3>${escapeHtml(stop.title)}</h3>
              </div>
              <span class="badge${["colazione", "pranzo", "cena", "shopping"].includes(stop.type) ? " " + stop.type : ""}">${stop.optional ? "Opzionale" : escapeHtml(stop.type)}</span>
            </div>
            <p>${escapeHtml(stop.description)}</p>
            <div class="facts">
              <div class="fact"><strong>Orari</strong>${escapeHtml(stop.hours)}</div>
              <div class="fact"><strong>Biglietti</strong>${escapeHtml(stop.tickets)}</div>
              <div class="fact"><strong>Come arrivare</strong>${escapeHtml(stop.how)}</div>
              <div class="fact"><strong>Quartiere</strong>${escapeHtml(stop.neighborhood)}</div>
            </div>
            <div class="actions">
              ${routeBtn}
              <a class="btn ghost" target="_blank" rel="noreferrer" href="${mapsLink(stop.maps)}">Apri la mappa</a>
            </div>
          </div>
        </article>`;
    })
    .join("");

  app.innerHTML = `
    <header class="page-hero">
      <div class="hero-media">
        <img src="${day.image}" alt="${escapeHtml(day.imageCredit)}" />
      </div>
      <div class="wrap topbar">
        <a class="back" href="#/">← Tutti i giorni</a>
        <span>Giorno ${day.id} / 5</span>
      </div>
      <div class="wrap hero-copy">
        <div class="kicker">${escapeHtml(day.weekday)} ${escapeHtml(day.date)} ${escapeHtml(day.year)}</div>
        <h1 class="day-title">${escapeHtml(day.title)}</h1>
        <p class="hero-lead">${escapeHtml(day.summary)}</p>
        <div class="hero-meta">
          ${day.neighborhoods.map((n) => `<span class="chip">${escapeHtml(n)}</span>`).join("")}
          <span class="chip">${escapeHtml(day.pace)}</span>
        </div>
      </div>
    </header>

    <section class="section">
      <div class="wrap">
        <div class="note-box">
          <strong>Mappa della giornata.</strong>
          I numeri seguono l’ordine delle tappe. H è l’hotel. Da ogni scheda puoi aprire le indicazioni a piedi su Google Maps.
        </div>
        <div class="map-wrap"><div id="day-map"></div></div>
        <div class="timeline">${stops}</div>
      </div>
    </section>

    <footer>
      <div class="wrap">
        <a href="#/">← Torna ai giorni</a>
        &nbsp;·&nbsp; Hotel: ${escapeHtml(TRIP.hotel.address)}
      </div>
    </footer>
  `;

  renderMap(day.stops, TRIP.hotel);
}

function route() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const match = hash.match(/^\/giorno\/(\d+)/);
  if (match) renderDay(Number(match[1]));
  else renderHome();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
