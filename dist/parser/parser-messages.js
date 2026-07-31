export function parseMultiLineNavitia(sensors) {
  const now = new Date();
  const lastUpdate = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const lines = sensors
    .map(parseSingleLineNavitia)
    .filter(Boolean);

  return { lastUpdate, lines };
}

function parseSingleLineNavitia(data) {
  if (!data || !data.attributes) return null;

  const lineReports = data.attributes.line_reports || [];
  const disruptions = data.attributes.disruptions || [];

  return parseLineReports(lineReports, disruptions);
}

function parseLineReports(lineReports, disruptions) {
  let lineObj = null;
  const stationsMap = {};
  const seen = new Set();

  for (const report of lineReports) {
    const line = report.line;
    const ptObjects = report.pt_objects || [];

    if (!line || !line.id) continue;

    // -------------------------
    // LIGNE
    // -------------------------
    if (!lineObj) {
      lineObj = {
        id: line.id,
        name: line.name,
        messages: []
      };
    }

    for (const disruption of disruptions) {
      if (!isTrafficPerturbation(disruption)) continue;

      const text = extractBestMessage(disruption);
      if (!text) continue;

      // LIGNE impactée ?
      const impactsLine = (disruption.impacted_objects || []).some(obj => {
        const pt = obj.pt_object;
        if (!pt) return false;

        return (
          pt.embedded_type === "line" &&
          (pt.id === line.id || pt.line?.id === line.id)
        );
      });

      if (impactsLine) {
        const key = disruption.id + "::line::" + line.id;
        if (seen.has(key)) continue;
        seen.add(key);

        lineObj.messages.push({
          type: "line",
          line_id: line.id,
          line_name: line.name,
          text,
          severity: disruption.severity?.effect || null,
          cause: disruption.cause || report.cause || null
        });

        continue;
      }

      // -------------------------
      // STATIONS impactées ?
      // -------------------------
      /*for (const pt of ptObjects) {
        const id = pt.id;
        const name = pt.name;
        if (!id) continue;

        const impactsStation = (disruption.impacted_objects || []).some(obj => {
          const dpt = obj.pt_object;
          return dpt && dpt.id === id;
        });

        if (!impactsStation) continue;

        const key = disruption.id + "::station::" + id;
        if (seen.has(key)) continue;
        seen.add(key);

        if (!stationsMap[id]) {
          stationsMap[id] = {
            id,
            type: pt.embedded_type,
            name,
            messages: []
          };
        }

        stationsMap[id].messages.push({
          type: "station",
          station_id: id,
          station_name: name,
          text,
          severity: disruption.severity?.effect || null,
          cause: disruption.cause || report.cause || null
        });
      }*/
    }
  }

  return {
    line: lineObj,
    stations: Object.values(stationsMap)
  };
}

// utils inchangés
function isTrafficPerturbation(disruption) {
  const tags = (disruption.tags || []).map(t => t.toLowerCase());

  if (tags.includes("ascenseur")) return false;
  if (tags.includes("escalator")) return false;
  if (tags.includes("accessibilité")) return false;

  return true;
}

function extractBestMessage(disruption) {
  if (!disruption.messages) return null;

  const html = disruption.messages.find(
    m => m.channel?.content_type === "text/html"
  );
  if (html?.text) return cleanHtmlFull(html.text);

  const txt = disruption.messages.find(
    m => m.channel?.content_type === "text/plain"
  );
  if (txt?.text) return txt.text.trim();

  const title = disruption.messages.find(m =>
    (m.channel?.types || []).includes("title")
  );
  if (title?.text) return title.text.trim();

  return null;
}

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
