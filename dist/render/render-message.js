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


    if (!config.enable_message_carousel) {
      // --- MODE EN LIGNE ---
      if (concatMessage) {
        fullHtml += `<span class="message-block">`;
        fullHtml += concatMessage;
        fullHtml += `</span>`;
      }
      return fullHtml;
    }

    // --- MODE CARROUSEL (NOUVEAU) ---
    const tabsHtml = allMessages.map((m, index) => `
       <div class="idf-message-tab ${index === 0 ? "active" : ""}"
          data-index="${index}"
          data-line-mode="${m.lineMode}">
        <div class="idf-message-text">
          ${m.text}
        </div>
      </div>
    `).join("");

    const sidebarHtml = allMessages.map((m, index)  => {
      const statusIcon = {
        "NO_SERVICE": "no_service.svg",
        "SIGNIFICANT_DELAYS": "significant_delays.svg",
        "DEVIATED": "deviated.svg",
        "DISTURBED": "disturbed.svg",
        "INFORMATION": "information.svg",
        "WORK": "work.svg"
      }[m.severity] || "";

      return `
        <div class="idf-message-sidebar-item ${index === 0 ? "active" : ""}" data-index="${index}">
          <span class="sidebar-mode-icon">
            ${m.lineMode
                ? `<div class="sidebar-mode-wrapper">
                    <img src="${imagesUrl}${m.lineMode}.png" class="sidebar-mode-icon">
                  </div>`
                : ""
              }
          </span>
          <span class="sidebar-line-icon">
            ${m.lineMode ? m.lineIconHtml || "" : "<span class='message-stop-icon'>🚏</span>"}
          </span>
        </div>`;
    }).join("");


    return `
       <div class="idf-message-container" style="max-height:${(config.maxTabs-1)*35+60}px;">

          <!-- 🟩 HEADER ABSOLU AU-DESSUS DU CARROUSEL -->
          <div class="idf-message-current-mode">
              <!-- L’image sera remplie dynamiquement dans updated() -->
               <img class="current-mode-icon"
                    src="${imagesUrl}${allMessages[0].lineMode}.png" style="padding-right: 8px;">
          </div>

          <div class="idf-message-sidebar">
              ${sidebarHtml}
          </div>

          <div class="idf-message-content">
              ${tabsHtml}
          </div>

      </div>

    `;

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
  function getSeverityBadge(severity, type, imagesUrl) {
    // type === "information" → message réseau
    if (type === "information") {
      return `<img class="severity-icon" src="${imagesUrl}status/information.svg" alt="info">`;
    }

    switch (severity) {
      case "NO_SERVICE":
        return `<img class="severity-icon" src="${imagesUrl}status/no_service.svg" alt="no service">`;

      case "SIGNIFICANT_DELAYS":
        return `<img class="severity-icon" src="${imagesUrl}status/significant_delays.svg" alt="delays">`;

      case "DISTURBED":
      case "DEVIATED":
        return `<img class="severity-icon" src="${imagesUrl}status/disrupted.svg" alt="disrupted">`;

      default:
        return `<img class="severity-icon" src="${imagesUrl}status/disrupted.svg" alt="other">`;
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
    let lineMode = "";
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
        lineMode = lineData.transportmode && lineData.transportmode =="rail" && lineData.transportsubmode =="local" ? "rersq" : lineData.transportmode || "";
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
    const badge = getSeverityBadge(msg.severity, msg.type, imagesUrl);
    const text = `${prefixHtml}${badge} ${baseText}`;

    targetArray.push({
      text,
      normalized,
        type: msg.type,
        severity: msg.severity,
        lineIconHtml: prefixHtml,
        lineMode: lineMode
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
