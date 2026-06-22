// render-rer.js
import { html } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

export function renderRER(model, config, imagesUrl, second_entity = false) {
  return html`
    ${renderRerHeader(model, config, imagesUrl, second_entity)}
    ${renderRerContent(model, config, imagesUrl, second_entity)}
  `;
}

/* -------------------------------------------------------------
   HEADER
------------------------------------------------------------- */
function renderRerHeader(model, config, imagesUrl, second_entity) {
  const stationName = model.station || "";
  const lastUpdateTime = model.lastUpdate || "";

  if (config.show_station_name === false) return html``;

  return html`
    <div class="rer-header ${headerClass(config)}"
         style="${second_entity ? "border-radius:0!important" : ""}">

      <div class="rer-station-name${config.wall_panel ? "-nobg" : ""}">
        ${renderStationName(stationName, imagesUrl, config)}
      </div>

      ${!second_entity ? html`
        <div class="last-update">
          <div class="last-update-time">${lastUpdateTime}</div>
          <div class="last-update-text${config.wall_panel ? "-nobg" : ""}">
            Dernière mise à jour
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function headerClass(config) {
  if (config.show_screen) return "with-screen";
  if (config.wall_panel) return "header-nobg";
  return "";
}

function renderStationName(stationName, imagesUrl, config) {
  const hasIcon =
    stationName.includes("RER") ||
    stationName.includes("Métro") ||
    stationName.includes("Tramway");

  if (!hasIcon) return stationName;

  const base = stationName
    .replace(/RER.*/i, "")
    .replace(/Métro.*/i, "")
    .replace(/Tramway.*/i, "")
    .replace(/-$/, "")
    .trim();

  return html`
    <div class="destination-name"><span class="destination-scroll">${base}</span></div>

    ${stationName.includes("Métro")
      ? html`<div class="destination-img">
          <img src="${imagesUrl}metro_white.png" class="destination-image">
        </div>`
      : ""}

    ${stationName.includes("RER")
      ? html`<div class="destination-img">
          <img src="${imagesUrl}rer_white.png" class="destination-image">
        </div>`
      : ""}

    ${stationName.includes("Tramway")
      ? html`<div class="destination-img">
            <img src="${imagesUrl}tram_white.png" class="destination-image">
        </div>`
      : ""}
  `;
}

/* -------------------------------------------------------------
   CONTENT
------------------------------------------------------------- */
function renderRerContent(model, config, imagesUrl, second_entity) {
  const lines = model.lines || [];

  return html`
    <div class="rer-content">
      ${lines
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((line) => renderRerLine(line, config, imagesUrl, second_entity))}
    </div>
  `;
}

/* -------------------------------------------------------------
   LINE BLOCK
------------------------------------------------------------- */
function renderRerLine(line, config, imagesUrl, second_entity) {
  return html`
    ${line.destinations
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((dest) => renderRerLineBlock(line, dest, config, imagesUrl, second_entity))}
  `;
}

function renderRerLineBlock(line, dest, config, imagesUrl, second_entity) {
  let lineCount = -1;

  return html`
    <div class="rer-line${config.wall_panel ? "-nobg" : ""}">
      ${renderRerLineTitle(line, dest.name, config, imagesUrl)}

      ${dest.departures.map((dep) => {
        lineCount++;
        return renderRerLineDetail(line, dest, dep, lineCount, config, imagesUrl, second_entity);
      })}
    </div>
  `;
}

/* -------------------------------------------------------------
   LINE TITLE (logo + pastille ligne + destination)
------------------------------------------------------------- */
function renderRerLineTitle(line, destinationName, config, imagesUrl) {
  const mode = line.id.includes("-")
    ? line.id.substring(0, line.id.indexOf("-"))
    : line.type || "rer";

  return html`
    <div class="rer-line-title"
         style="border-color:#${(line.colourweb_hexa || "").toUpperCase()}">

      <div class="rer-line-title-logo">
        <img src="${imagesUrl}${mode}${mode.includes("bus") ? "" : "sq"}${config.wall_panel ? "_white" : ""}.png"
             class="rer-line-type-image">
      </div>
       <div class="rer-line-title-image">
          ${line.icon ?
              html`<img src = "${imagesUrl}${line.transportmode}/${line.icon}" alt = "${line.shortname_line}" class="${line.type}-image" />`
                 : html`<div class="bus-line-image-no-ratp" style="color: #${line.textcolorweb_hexa};background-color:#${line.colorweb_hexa}">${line.shortname_line}</div>`
              }
        </div>

      <div class="rer-line-title-name"><span class="rer-title-scroll">${destinationName}</span></div>
    </div>
  `;
}

/* -------------------------------------------------------------
   LINE DETAIL (one departure)
------------------------------------------------------------- */
function renderRerLineDetail(line, dest, dep, lineCount, config, imagesUrl, second_entity) {
  const nextDeparture = dep.minutes;
  const nextDepartureHour = dep.hour;
  const platform = dep.platform || "";
  const destinationName = dep.destinationName;
  const state = dep.state;

  // nom du train : on privilégie dep.vehiculeName si le parser le fournit
  const trainLabel = config.show_train_ref
    ? (dep.destinationRef || "")
    : (dep.vehiculeName || dep.destinationRef || "");

  return html`
    <div class="rer-line-detail">
      <div class="rer-line-vehicule">
        <div class="rer-line-vehicule-name">
          ${trainLabel}
        </div>
      </div>

      <div class="rer-line-destination">
        ${formatDestinationLabel(destinationName, imagesUrl, config)}
      </div>

      <div class="rer-line-departure">
        ${renderRerDeparture(nextDeparture, nextDepartureHour, state, lineCount, config, second_entity)}

        ${platform &&
        platform !== "unknown" &&
         ((!second_entity && config.show_departure_platform_first_line) || second_entity && config.show_departure_platform_second_line)
          ? html`<div class="rer-line-departure-platform">${platform}</div>`
          : ""}
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------
   DEPARTURE FORMATTER
------------------------------------------------------------- */
function renderRerDeparture(nextDeparture, nextDepartureHour, state, lineCount, config, second_ligne) {

  // --- 1) Train annulé ---
  if (state === "cancelled") {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text bus-state-cancelled">supprimé</div>
      </div>
    `;
  }

  // --- 2) Train à l'approche ---
  if (state === "approaching") {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text-blink bus-state-approaching">à l'approche</div>
      </div>
    `;
  }

  // --- 3) Train à quai ---
  if (state === "at_stop") {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text bus-state-at_stop">à quai</div>
      </div>
    `;
  }

  // --- 4) Train déjà parti ---
  if (state === "departed") {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text bus-state-departed">parti</div>
      </div>
    `;
  }

  // --- 5) Train en retard ---
  if (state === "delayed") {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text bus-state-delayed">retardé</div>
      </div>
    `;
  }

  // --- 6) Cas normal : minutes / heures ---
  const showHourFlag = second_ligne
    ? config.show_hour_departure_second_line
    : config.show_hour_departure_first_line;

  const showHourIndex = second_ligne
    ? config.show_hour_departure_index_second_line
    : config.show_hour_departure_index_first_line;

  let showHour = false;

  if (!showHourFlag) {
    showHour = false;
  } else if (showHourFlag && (showHourIndex === undefined || showHourIndex === null)) {
    showHour = true;
  } else if (showHourFlag) {
    showHour = lineCount >= showHourIndex;
  }

  return html`
    <div class="${showHour
      ? "rer-line-departure-message"
      : "rer-line-departure-time-content"}">

      <div class="${showHour
        ? "rer-line-departure-message-text"
        : "rer-line-departure-time"}">
        ${showHour ? nextDepartureHour : nextDeparture}
      </div>

      ${!showHour
        ? html`<div class="rer-line-departure-minute">min</div>`
        : ""}
    </div>
  `;
}


function renderRerDepartureOld(nextDeparture, nextDepartureHour, nextArrival, lineCount, config, second_ligne) {

  // --- Cas "à l'approche"
  if (nextDeparture === 0) {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text-blink">à l'approche</div>
      </div>
    `;
  }

  // --- Cas "à quai"
  if (nextDeparture < 0) {
    return html`
      <div class="rer-line-departure-message">
        <div class="rer-line-departure-message-text">à quai</div>
      </div>
    `;
  }

  // --- Sélection du bon mode selon la ligne
  const showHourFlag = second_ligne
    ? config.show_hour_departure_second_line
    : config.show_hour_departure_first_line;

  const showHourIndex = second_ligne
    ? config.show_hour_departure_index_second_line
    : config.show_hour_departure_index_first_line;

  let showHour = false;

  // 1) Si showHourFlag = false → minutes
  if (!showHourFlag) {
    showHour = false;
  }

  // 2) Si showHourFlag = true mais PAS d'index → heure pour tous
  else if (showHourFlag && (showHourIndex === undefined || showHourIndex === null)) {
    showHour = true;
  }

  // 3) Si showHourFlag = true ET index défini
  else if (showHourFlag) {
    showHour = lineCount >= showHourIndex;
  }

  // --- Rendu final
  return html`
    <div class="${showHour
      ? "rer-line-departure-message"
      : "rer-line-departure-time-content"}">

      <div class="${showHour
        ? "rer-line-departure-message-text"
        : "rer-line-departure-time"}">
        ${showHour ? nextDepartureHour : nextDeparture}
      </div>

      ${!showHour
        ? html`<div class="rer-line-departure-minute">min</div>`
        : ""}
    </div>
  `;
}


/* -------------------------------------------------------------
   DESTINATION LABEL
------------------------------------------------------------- */
function formatDestinationLabel(name, imagesUrl, config) {
  if (name.startsWith("Gare d")) {
    return html`
      <div class="destination-name"><span class="destination-scroll">${name.substring(7).trim()}</span></div>
      <div class="destination-img">
        <img src="${imagesUrl}train${config.wall_panel ? "_white" : ""}.png"
             class="destination-image">
      </div>
    `;
  }

  if (name.endsWith("Chessy")) {
    return html`
      <div class="destination-name"><span class="destination-scroll">${name}</span></div>
      <div class="destination-img">
        <img src="${imagesUrl}mickey${config.wall_panel ? "_white" : ""}.png"
             class="destination-image">
      </div>
    `;
  }

  if (name.endsWith("Gare Tgv")) {
    return html`
      <div class="destination-name"><span class="destination-scroll">${name}</span></div>
      <div class="destination-img">
        <img src="${imagesUrl}tgv${config.wall_panel ? "_white" : ""}.png"
             class="destination-image">
      </div>
    `;
  }

  return html`<div class="destination-name"><span class="destination-scroll">${name}</span></div>`;
}
