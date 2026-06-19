// render-bus.js
import { html } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

export function renderBUS(model, config, imagesUrl, secondEntity = false) {
  return html`
    ${renderBusHeader(model, config, imagesUrl, secondEntity)}
    ${renderBusLines(model, config, imagesUrl, secondEntity)}
  `;
}

/* -------------------------------------------------------------
   HEADER
------------------------------------------------------------- */
function renderBusHeader(model, config, imagesUrl, secondEntity) {
  if (config.show_station_name === false) return html``;

  const station = formatStationName(model.station);

  return html`
    <div class="bus-header ${headerClass(config)}"
         style="${secondEntity ? "border-radius:0!important" : ""}">

      <div class="bus-station-name${config.wall_panel ? "-nobg" : ""}">
        ${station.label}
        ${station.icons.map(icon => html`
          <div class="destination-img">
            <img src="${imagesUrl}${icon}${config.wall_panel ? "_white" : ""}.png"
                 class="destination-image">
          </div>
        `)}
      </div>

      ${!secondEntity ? html`
        <div class="last-update">
          <div class="last-update-time">${model.lastUpdate}</div>
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

/* -------------------------------------------------------------
   LINES
------------------------------------------------------------- */
function renderBusLines(model, config, imagesUrl, secondEntity) {
  if (!model.lines.length) {
    return html`
      <div class="bus-lines">
        <div class="bus-line${config.wall_panel ? "-nobg" : ""}">
          <div class="bus-line-detail">
            <div class="bus-img">
              <div class="bus-line-image">
                <img src="${imagesUrl}warning.png" class="bus-image">
              </div>
            </div>
            <div class="bus-destination">Arrêt non desservi / Données indisponibles</div>
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div class="bus-lines" style="${config.second_entity && !secondEntity ? "flex-grow:0" : ""}">
      ${model.lines.map(line => renderBusLine(line, config, imagesUrl))}
    </div>
  `;
}

function renderBusLine(line, config, imagesUrl) {
  let first_time = false;

  return html`
    <div class="bus-line${config.wall_panel ? "-nobg" : ""}">
      ${line.destinations.map(dest => html`
        <div class="bus-line-detail">
          <div class="bus-img">
            ${first_time == false ?
                first_time = true &&
                html`
                <div class="bus-line-type">
                    <img src="${imagesUrl}${line.type}${config.wall_panel ? "_white" : ""}.png"
                        class="bus-line-type-image">
                </div>
                <div class="bus-line-image">
                  <img
                    src="https://cachesync.prod.bonjour-ratp.fr/svg/LIG:IDFM:${line.id_line}.svg"
                      alt="${line.shortname_line}"
                      class="${line.type}-image"
                    >
                  </div>
            ` : ""}
          </div>
          <div class="bus-destination">
            ${config.show_train_ref ? html`${dest.departures[0].destinationRef != "BusEstimeDans" || !dest.departures[1] ? dest.departures[0].destinationRef : dest.departures[1].destinationRef}&nbsp;-&nbsp;` : ""}
            <div class="destination-name">${formatDestinationLabel(dest.name, imagesUrl, config)}</div>
          </div>
          ${renderBusDeparture(dest.departures[0], config)}
          ${renderBusDeparture(dest.departures[1], config)}
          ${config.display_third_stop ?
            renderBusDeparture(dest.departures[2], config) : ""}
        </div>
      `)}
    </div>
  `;
}

/* -------------------------------------------------------------
   DEPARTURES
------------------------------------------------------------- */
function renderBusDeparture(dep, config) {
    if (!dep) return html`<div class="bus-stop"><div class="bus-stop-value">&nbsp;</div></div>`;
    return html`
        <div class="bus-stop">
            <div class="bus-stop-value">
                <span class="bus-state-${dep.state}">
                    ${formatDeparture(dep, config)}
                </span>
            </div>
            ${dep.destinationRef === "BusEstimeDans"
                ? html`<div class="bus-estime">Estimé</div>`
            : ""}
            ${dep.state === "delayed"
                ? html`<div class="bus-delayed">Retardé</div>`
                : ""}
        </div>
    `;
}

function formatDeparture(dep, config) {
    if (dep.state === "cancelled") return config.show_bus_stop_label ? "Supprimé" : "X";
    if (dep.state === "delayed") return config.show_bus_stop_label ? "Retardé" : `${dep.minutes}`;
    if (dep.state === "approaching") return config.show_bus_stop_label ? "À l'approche" : "0";
    if (dep.state === "at_stop") return config.show_bus_stop_label ? "À quai" : "0";

  return `${dep.minutes}`;
}

/* -------------------------------------------------------------
   STATION NAME PARSER
------------------------------------------------------------- */
function formatStationName(name) {
    const icons = [];
    let label = name;

    if (name.includes("Métro")) icons.push("metro");
    if (name.includes("RER") || name.includes("Rer")) icons.push("rer");
    if (name.includes("Tramway")) icons.push("tram");

    label = name
        .replace(/RER.*/i, "")
        .replace(/Métro.*/i, "")
        .replace(/Tramway.*/i, "")
        .replace(/-$/, "")
        .trim();

    return { label, icons };
}

/* -------------------------------------------------------------
   DESTINATION LABEL PARSER
------------------------------------------------------------- */
function formatDestinationLabel(raw, imagesUrl, config) {
    // On travaille sur la chaîne brute (avec éventuels tags)
    const name = raw || "";
    const wallSuffix = config.wall_panel ? "_white" : "";

    // Cas 1 : "<RER>"
  if (name.indexOf("<RER>") > 0) {
    const before = name.substring(0, name.indexOf("<RER>")).trim();

    // Ce qu'il y a après <RER>
    const after = name.substring(name.indexOf("<RER>") + "<RER>".length).trim();

    // Nettoyage du before (gestion du tiret final)
    const label = before.endsWith("-")
      ? before.substring(0, before.length - 1).trim()
      : before;

    return html`
        <div class="destination-name"><span class="destination-scroll">${label}</span></div>
        <div class="destination-img">
            <img src="${imagesUrl}rer${wallSuffix}.png"
                 class="destination-image">
        </div>
        ${after
        ? html`<div class="bus-destination-after">${after}</div>`
        : ""}
    `;
    }

    // Cas 2 : " Rer" en suffixe
    if (name.endsWith(" Rer")) {
        const label = name.substring(0, name.lastIndexOf(" Rer"));

        return html`
            <div class="destination-name"><span class="destination-scroll">${label}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}rer${wallSuffix}.png"
                    class="destination-image">
            </div>
            `;
    }

    // Cas 3 : "<METRO>"
    if (name.indexOf("<METRO>") > 0) {
        const before = name.substring(0, name.indexOf("<METRO>")).trim();

        // Ce qu'il y a après <METRO>
        const after = name.substring(name.indexOf("<METRO>") + "<METRO>".length).trim();

        // Nettoyage du before (gestion du tiret final)
        const label = before.endsWith("-")
            ? before.substring(0, before.length - 1).trim()
            : before;

        return html`
            <div class="destination-name"><span class="destination-scroll">${label}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}metro${wallSuffix}.png"
                    class="destination-image">
            </div>
            ${after
                ? html`<div class="bus-destination-after">${after}</div>`
                : ""}
        `;
    }

    // Cas 4 : " Metro"
    if (name.endsWith(" Metro") > 0) {
        const label = name.substring(0, name.indexOf(" Metro"));

        return html`
            <div class="destination-name"><span class="destination-scroll">${label}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}metro${wallSuffix}.png"
                    class="destination-image">
            </div>
    `;
    }

    // Cas 5 : "<TRAMWAY>"
    if (name.indexOf("<TRAMWAY>") > 0) {
        const before = name.substring(0, name.indexOf("<TRAMWAY>")).trim();

        // Ce qu'il y a après <TRAMWAY>
        const after = name.substring(name.indexOf("<TRAMWAY>") + "<TRAMWAY>".length).trim();

        // Nettoyage du before (gestion du tiret final)
        const label = before.endsWith("-")
            ? before.substring(0, before.length - 1).trim()
            : before;

        return html`
            <div class="destination-name"><span class="destination-scroll">${label}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}tram${wallSuffix}.png"
                    class="destination-image">
            </div>
            ${after
                ? html`<div class="bus-destination-after">${after}</div>`
                : ""}
        `;
    }

    // Cas 6 : "Gare Tgv"
    if (name.endsWith("- Gare Tgv") > 0) {
        const before = name.substring(0, name.indexOf("- Gare Tgv")).trim();

        // Ce qu'il y a après "- Gare Tgv"
        const after = name.substring(name.indexOf("- Gare Tgv") + "- Gare Tgv".length).trim();

        // Nettoyage du before (gestion du tiret final)
        const label = before.endsWith("-")
            ? before.substring(0, before.length - 1).trim()
            : before;

        return html`
            <div class="destination-name"><span class="destination-scroll">${label}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}tgv${wallSuffix}.png"
                    class="destination-image">
            </div>
            ${after
                ? html`<div class="bus-destination-after">${after}</div>`
                : ""}
        `;
    }

    // Cas 7 : "Gare"
    if (name.startsWith("Gare") > 0) {
        return html`
            <div class="destination-name"><span class="destination-scroll">${name}</span></div>
            <div class="destination-img">
                <img src="${imagesUrl}train${wallSuffix}.png"
                    class="destination-image">
            </div>
        `;
    }

    // Cas par défaut
    return html`<div class="destination-name">
      <span class="destination-scroll">${name}</span>
    </div>`;
}

