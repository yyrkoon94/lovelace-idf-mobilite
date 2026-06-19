import { idfMobiliteLineRef } from "../referentiel-des-lignes-filtered.js";

export function renderMessages(model, config, imagesUrl) {
  if (!model || !model.lines || model.lines.length === 0) return "";

  const collected = {
    Information: [],
    Perturbation: [],
    Commercial: []
  };

  const lineMessagesSet = new Set();

  // ------------------------------------------------------------
  // 1) Messages de ligne
  // ------------------------------------------------------------
  for (const lineBlock of model.lines) {
    if (!lineBlock?.line) continue;

    const messages = lineBlock.line.messages || [];
    for (const msg of messages) {

      const raw = extractRawText(msg);
      const cleaned = cleanHtml(raw);

      const normalized = normalizeMessageForComparison(cleaned);
      lineMessagesSet.add(normalized);

      pushMessage(
        collected,
        { ...msg, cleanedText: cleaned, normalized },
        {
          type: "line",
          id: lineBlock.line.id,
          name: lineBlock.line.name
        },
        imagesUrl
      );
    }
  }

  // ------------------------------------------------------------
  // 2) Messages de station
  // ------------------------------------------------------------
  for (const lineBlock of model.lines) {
    for (const station of lineBlock.stations || []) {
      for (const msg of station.messages || []) {

        const raw = extractRawText(msg);
        const cleaned = cleanHtml(raw);

        const normalized = normalizeMessageForComparison(cleaned);

        if (lineMessagesSet.has(normalized)) continue;
        lineMessagesSet.add(normalized);

        pushMessage(
          collected,
          { ...msg, cleanedText: cleaned, normalized },
          {
            type: "station",
            id: station.id,
            name: station.name
          },
          imagesUrl
        );
      }
    }
  }

  // ------------------------------------------------------------
  // 3) FILTRAGE SELON CONFIG (NOUVEAU)
  // ------------------------------------------------------------
  const filteredPerturbations = filterMessagesByConfig(collected.Perturbation, config);
  const filteredInformation = filterMessagesByConfig(collected.Information, config);
  const filteredCommercial = filterMessagesByConfig(collected.Commercial, config);

  // ------------------------------------------------------------
  // 4) Construction HTML final
  // ------------------------------------------------------------
  let fullHtml = "";

  // On concatène dans l’ordre : Perturbation → Information → Commercial
    const allMessages = [
    ...filteredPerturbations,
    ...filteredInformation,
    ...filteredCommercial
    ];

    const concatMessage = allMessages
    .map(m => m.text)
    .join(" • ");


  if (concatMessage) {
    fullHtml += `<span class="message-block">`;
    fullHtml += concatMessage;
    fullHtml += `</span>`;
  }

  return fullHtml;
}

// ------------------------------------------------------------
// FILTRE SELON CONFIG (NOUVEAU)
// ------------------------------------------------------------
function filterMessagesByConfig(messages, config) {
  return messages.filter(m => {
    // 1) Messages d'information (network)
    if (m.type === "information" && !config.display_info_message) {
      return false;
    }

    // 2) SIGNIFICANT_DELAYS
    if (m.severity === "SIGNIFICANT_DELAYS" && !config.display_delays_message) {
      return false;
    }

    // 3) NO_SERVICE
    if (m.severity === "NO_SERVICE" && !config.display_no_service_message) {
      return false;
    }

    return true;
  });
}

// ------------------------------------------------------------
// EXTRACTION DU TEXTE NAVITIA
// ------------------------------------------------------------
function extractRawText(msg) {
  if (msg.text) return msg.text;
  if (msg.html) return msg.html;
  if (msg.message) return msg.message;
  if (msg.content) return msg.content;

  if (Array.isArray(msg.messages)) {
    for (const m of msg.messages) {
      if (m.text) return m.text;
      if (m.html) return m.html;
    }
  }

  return "";
}

// ------------------------------------------------------------
// Normalisation pour la déduplication
// ------------------------------------------------------------
function normalizeMessageForComparison(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .replace(/#/g, " ")
    .replace(/Lignes?\s*\d+(,\s*\d+)*/gi, "")
    .replace(/^\d+\s*/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ------------------------------------------------------------
// pushMessage (utilise cleanedText)
// ------------------------------------------------------------
function getSeverityBadge(severity, type) {
  // type === "information" → message réseau
  if (type === "information") {
    return `<span class="badge badge-info">ℹ️</span>`;
  }

  switch (severity) {
    case "NO_SERVICE":
      return `<span class="badge badge-noservice">🔴</span>`;
    case "SIGNIFICANT_DELAYS":
      return `<span class="badge badge-delays">🟧</span>`;
    default:
      return `<span class="badge badge-other">🟦</span>`;
  }
}

function pushMessage(collected, msg, context, imagesUrl) {
  const baseText = msg.cleanedText;
  const normalized = msg.normalized;

  const targetArray =
    msg.type === "information"
      ? collected.Information
      : collected.Perturbation;

  if (targetArray.some(e => e.normalized === normalized)) {
    return;
  }

  let prefixHtml = "";

  // ------------------------------------------------------------
  // CONTEXTE LIGNE → icône IDFM officielle
  // ------------------------------------------------------------
  if (context.type === "line") {
    let lineData = null;
    let lineCode = null;

    // msg.line_id peut contenir "IDFM:C02344"
    if (msg.line_id) {
      const m = msg.line_id.match(/IDFM:(C\d+)/);
      if (m) lineCode = m[1];
    }

    // Recherche dans ton référentiel minimal
    idfMobiliteLineRef().every((line) => {
      if (line.id_line === lineCode) {
        lineData = line;
        return false;
      }
      return true;
    });

    if (lineData) {
       if (lineData.icon)
         prefixHtml = `<img class="message-line-icon" src = "${imagesUrl}${lineData.transportmode}/${lineData.icon}" alt = "${lineData.shortname_line}" class="${lineData.type}-image" />`
       else
          prefixHtml = `<div class="message-line-pill" style="color: #${lineData.textcolourweb_hexa};background-color:#${lineData.colourweb_hexa}">${lineData.shortname_line}</div>`
    } else {
      // fallback texte
      prefixHtml = `
        <span class="message-line-icon-fallback">🚌</span>
        <strong>${context.name}</strong>
      `;
    }
  }

  // ------------------------------------------------------------
  // CONTEXTE STATION
  // ------------------------------------------------------------
  else if (context.type === "station") {
    prefixHtml = `<span class="message-stop-icon">🚏</span> <strong>${context.name}</strong> `;
  }

  // ------------------------------------------------------------
  // BADGE + TEXTE
  // ------------------------------------------------------------
  const badge = getSeverityBadge(msg.severity, msg.type);
  const text = `${prefixHtml}${badge} ${baseText}`;

  targetArray.push({
    text,
    normalized,
    type: msg.type,
    severity: msg.severity
  });
}


// ------------------------------------------------------------
// cleanHtml (décodage + suppression InfoTrafic)
// ------------------------------------------------------------
function cleanHtml(html) {
  if (!html) return "";

  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  let text = txt.value;

  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const idx = text.toLowerCase().indexOf("#infotrafic");
  if (idx !== -1) {
    text = text.substring(idx + "#infotrafic".length);
    text = text.replace(/^\s*-\s*/, "").trim();
  }

  return text;
}

function getFolderFromModes(mode) {
  mode = (mode || "").toLowerCase();

  if (mode === "bus") return "bus/";
  if (mode === "noctilien") return "noctilien/";
  if (mode === "rail") return "rail/";
  if (mode === "funicular") return "funicular/";

  return "";
}
