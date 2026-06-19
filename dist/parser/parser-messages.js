export function parseMultiLineNavitia(sensors) {
  const now = new Date();
  const lastUpdate = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const lines = [];

  for (const sensor of sensors) {
    const parsed = parseSingleLineNavitia(sensor);
    if (parsed) lines.push(parsed);
  }

  return {
    lastUpdate,
    lines
  };
}

function parseSingleLineNavitia(data) {
  if (!data || !data.attributes) return null;

  const lineReports = data.attributes.line_reports || [];
  const disruptions = data.attributes.disruptions || [];

  let lineObj = null;
  const stationsMap = {};

  // 🔥 Set global pour éviter tout doublon
  const seenDisruptions = new Set();

  // ------------------------------------------------------------
  // 1) Parcours des line_reports
  // ------------------------------------------------------------
  for (const report of lineReports) {
    const line = report.line;
    const ptObjects = report.pt_objects || [];

    // ------------------------------------------------------------
    // 1A) Ligne
    // ------------------------------------------------------------
    if (!lineObj && line) {
      lineObj = {
        id: line.id,
        name: line.name,
        messages: []
      };

      const lineDisruptions = findDisruptionsInLinks(line, disruptions);

      for (const disruption of lineDisruptions) {

        // 🔥 Déduplication par ID
        if (seenDisruptions.has(disruption.id)) continue;
        seenDisruptions.add(disruption.id);

        if (!isTrafficPerturbation(disruption)) continue;

        const text = extractBestMessage(disruption);
        if (!text) continue;

        lineObj.messages.push({
          type: "line",
          line_id: line.id,
          line_name: line.name,
          text,
          severity: disruption.severity?.effect || null,
          cause: disruption.cause || report.cause || null
        });
      }
    }

    // ------------------------------------------------------------
    // 1B) Stations
    // ------------------------------------------------------------
    for (const pt of ptObjects) {
      if (
        pt.embedded_type !== "stop_area" &&
        pt.embedded_type !== "stop_point"
      ) continue;

      const id = pt.id;
      const name = pt.name;

      if (!stationsMap[id]) {
        stationsMap[id] = {
          id,
          type: pt.embedded_type,
          name,
          messages: []
        };
      }

      const stationDisruptions = findDisruptionsForPtObject(pt, disruptions);

      for (const disruption of stationDisruptions) {

        // 🔥 Déduplication par ID
        if (seenDisruptions.has(disruption.id)) continue;
        seenDisruptions.add(disruption.id);

        if (!isTrafficPerturbation(disruption)) continue;

        const text = extractBestMessage(disruption);
        if (!text) continue;

        stationsMap[id].messages.push({
          type: "station",
          station_id: id,
          station_name: name,
          text,
          severity: disruption.severity?.effect || null,
          cause: disruption.cause || report.cause || null
        });
      }
    }
  }

  // ------------------------------------------------------------
  // 2) PATCH — Ajouter disruptions stop_point hors line_reports
  // ------------------------------------------------------------
  for (const disruption of disruptions) {
    for (const obj of disruption.impacted_objects || []) {
      const pt = obj.pt_object;

      if (pt?.embedded_type === "stop_point") {

        // 🔥 Déduplication par ID
        if (seenDisruptions.has(disruption.id)) continue;
        seenDisruptions.add(disruption.id);

        if (!stationsMap[pt.id]) {
          stationsMap[pt.id] = {
            id: pt.id,
            type: "stop_point",
            name: pt.name,
            messages: []
          };
        }

        const text = extractBestMessage(disruption);
        if (!text) continue;

        stationsMap[pt.id].messages.push({
          type: "station",
          station_id: pt.id,
          station_name: pt.name,
          text,
          severity: disruption.severity?.effect || null,
          cause: disruption.cause || null
        });
      }
    }
  }

  // ------------------------------------------------------------
  // 3) PATCH — Ajouter disruptions "network" (messages information)
  // ------------------------------------------------------------
  for (const disruption of disruptions) {
    for (const obj of disruption.impacted_objects || []) {
      if (obj.pt_object?.embedded_type === "network") {

        // 🔥 Déduplication par ID
        if (seenDisruptions.has(disruption.id)) continue;
        seenDisruptions.add(disruption.id);

        const text = extractBestMessage(disruption);
        if (!text) continue;

        if (lineObj) {
          lineObj.messages.push({
            type: "information",
            line_id: lineObj.id,
            line_name: lineObj.name,
            text,
            severity: disruption.severity?.effect || null,
            cause: disruption.cause || null
          });
        }
      }
    }
  }

  return {
    line: lineObj,
    stations: Object.values(stationsMap)
  };
}

/* ------------------------------------------------------------
   Trouver disruptions liées à un stop_area / stop_point
------------------------------------------------------------ */
function findDisruptionsForPtObject(pt, disruptions) {
  const stopAreaLinks = pt.stop_area?.links || [];
  const stopPointLinks = pt.stop_point?.links || [];
  const links = [...stopAreaLinks, ...stopPointLinks];

  const disruptionIds = links
    .filter(l => l.type === "disruption" || l.rel === "disruptions")
    .map(l => l.id)
    .filter(Boolean);

  const uniqueIds = [...new Set(disruptionIds)];

  return disruptions.filter(
    d =>
      uniqueIds.includes(d.id) ||
      uniqueIds.includes(d.disruption_id) ||
      uniqueIds.includes(d.uri)
  );
}

/* ------------------------------------------------------------
   Trouver disruptions liées à une ligne
------------------------------------------------------------ */
function findDisruptionsInLinks(wrapper, disruptions) {
  const links = wrapper.links || [];

  const disruptionIds = links
    .filter(l => l.type === "disruption" || l.rel === "disruptions")
    .map(l => l.id)
    .filter(Boolean);

  const uniqueIds = [...new Set(disruptionIds)];

  return disruptions.filter(
    d =>
      uniqueIds.includes(d.id) ||
      uniqueIds.includes(d.disruption_id) ||
      uniqueIds.includes(d.uri)
  );
}

/* ------------------------------------------------------------
   Filtrer les perturbations utiles
------------------------------------------------------------ */
function isTrafficPerturbation(disruption) {
  const tags = (disruption.tags || []).map(t => t.toLowerCase());

  if (tags.includes("ascenseur")) return false;
  if (tags.includes("escalator")) return false;
  if (tags.includes("accessibilité")) return false;

  return true;
}

/* ------------------------------------------------------------
   Extraire le meilleur message (HTML complet)
------------------------------------------------------------ */
function extractBestMessage(disruption) {
  if (!disruption.messages) return null;

  // 1) HTML prioritaire
  const html = disruption.messages.find(
    m => m.channel?.content_type === "text/html"
  );
  if (html?.text) return cleanHtmlFull(html.text);

  // 2) Texte brut
  const txt = disruption.messages.find(
    m => m.channel?.content_type === "text/plain"
  );
  if (txt?.text) return txt.text.trim();

  // 3) Titre fallback
  const title = disruption.messages.find(m =>
    (m.channel?.types || []).includes("title")
  );
  if (title?.text) return title.text.trim();

  return null;
}

/* ------------------------------------------------------------
   Garder 100% du texte HTML (pas de résumé)
------------------------------------------------------------ */
function cleanHtmlFull(html) {
  html = decodeHtmlEntities(html);

  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtmlEntities(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}
