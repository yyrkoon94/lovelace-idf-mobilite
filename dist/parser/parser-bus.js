// siri-parser-bus.js
import {
  findNonRatpLineData,
  extractLineStop,
  cleanDirectionRef,
  normalizeDestination,
  detectState,
  formatTimestamp,
  fixEncodingAndClean
} from "./parser-utils.js";


export function parseBusFromSiri(lineDatas, exclude_lines, exclude_lines_ref, included_destination, show_only_included) {
  const siri = lineDatas?.attributes?.Siri;
  const stopMon = siri?.ServiceDelivery?.StopMonitoringDelivery?.[0];
  if (!stopMon?.ResponseTimestamp) return null;

  const station =
    fixEncodingAndClean(stopMon.MonitoredStopVisit.length > 0
      ? stopMon.MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall
          .StopPointName?.[0]?.value
      : "Pas de départ prévu");

  const lastUpdate = formatTimestamp(stopMon.ResponseTimestamp);

  const busesMap = {};
  const busMeta = {};
  const destinationRefLineStop = {}; // mapping directionRef → lineStop

  stopMon.MonitoredStopVisit.forEach((stop) => {
    const mvj = stop.MonitoredVehicleJourney;
    const call = mvj.MonitoredCall;

    // --- Filtre des terminus non commerciaux (missions partielles)
    const isTerminusHere =
      mvj.DestinationRef?.value === stop.MonitoringRef?.value;

    if (isTerminusHere) {
      return; // On ignore les trains qui terminent ici
    }

    if (!call?.ExpectedDepartureTime) return;

    // --- Ligne ----------------------------------------------------
    const raw = mvj.LineRef.value;
    const lineToFind = raw.substring(raw.lastIndexOf("::") + 2, raw.lastIndexOf(":"));
    const line = findNonRatpLineData(lineToFind);
    if (!line) return;

    // ------------------------------------------------------------
    // EXCLUSION DES TYPES RAIL
    // ------------------------------------------------------------
    const mode = line.transportmode || "";
    const submode =line.transportsubmode || "";

    if (mode === "rail" || submode === "rail") {
        return; // on ignore cette entrée
    }

    const lineRef = line.transportmode + "-" + line.name_line;

    // --- DestinationRef (lineStop) -------------------------------
    let lineStop = extractLineStop(mvj.DestinationRef.value);

    // --- DestinationName (fusion intelligente) -------------------
    // --- DestinationName (version fiable via DirectionName) --------
    const rawDest = getBusDestination(mvj, call);
    const destinationName = normalizeDestination(rawDest);

    // --- directionRef (clé logique) ------------------------------
    let directionRef =
      mvj.DestinationShortName?.[0]?.value ||
      mvj.DirectionRef?.value ||
      mvj.DestinationRef?.value;

    directionRef = cleanDirectionRef(directionRef);

    // mapping directionRef → lineStop
    if (!destinationRefLineStop[directionRef] && lineStop !== "BusEstimeDans") {
      destinationRefLineStop[directionRef] = lineStop;
    }

    // --- Filtres EXACTS de ton ancien code ------------------------
    let excluded = false;

    // Normalisation : exclude_lines_ref doit être un tableau
    let excludeRef = exclude_lines_ref;

    if (typeof excludeRef === "string") {
      excludeRef = excludeRef
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    // MODE EXCLUSION (par défaut)
    if (!show_only_included) {
      const destIncluded =
        excludeRef &&
        excludeRef.some(ref =>
          ref === lineStop ||
          ref === destinationRefLineStop[directionRef] ||
          directionRef.toLowerCase().includes(ref.toLowerCase())
        );

      excluded =
        (exclude_lines && exclude_lines.includes(lineRef)) ||
        destIncluded;
    }

    // MODE INCLUSION
    else {
      const destIncluded =
        excludeRef &&
        excludeRef.some(ref =>
          ref === lineStop ||
          ref === destinationRefLineStop[directionRef] ||
          directionRef.toLowerCase().includes(ref.toLowerCase())
        );

      const lineIncluded =
        exclude_lines && exclude_lines.includes(lineRef);

      if (lineIncluded) {
        excluded = false;
      }
      else if (destIncluded) {
        excluded = false;
      }
      else {
        excluded = true;
      }
    }

    if (excluded) return;


    // --- Départ ---------------------------------------------------
    const expected = new Date(call.ExpectedDepartureTime);
    const minutes = Math.floor((expected - Date.now()) / 60000);
    const hour = expected.toISOString().substring(11, 16);
    const state = detectState(call, minutes);

    // --- Groupement ----------------------------------------------
    if (!busesMap[lineRef]) busesMap[lineRef] = {};
    if (!busesMap[lineRef][destinationName]) busesMap[lineRef][destinationName] = [];

    busesMap[lineRef][destinationName].push({
      minutes,
      hour,
      state,
      destinationRef: lineStop,
    });

    if (!busMeta[lineRef]) busMeta[lineRef] = line;
  });

  // --- Transformation finale --------------------------------------
  const lines = Object.keys(busesMap)
    .sort(sortBusLines) // tri naturel
    .map((lineRef) => ({
      id: lineRef,
      type: busMeta[lineRef]?.transportmode || null,
      id_line: busMeta[lineRef]?.id_line || null,
      icon: busMeta[lineRef]?.icon || null,
      shortname_line: busMeta[lineRef]?.name_line || null,
      transportmode: busMeta[lineRef]?.transportmode || null,
      transportsubmode: busMeta[lineRef]?.transportsubmode || null,
      colorweb_hexa: busMeta[lineRef]?.colourweb_hexa || busMeta[lineRef]?.colorweb_hexa || null,
      textcolorweb_hexa: busMeta[lineRef]?.textcolourweb_hexa || busMeta[lineRef]?.textcolorweb_hexa || null,

      destinations: Object.keys(busesMap[lineRef]).map((destName) => ({
        name: destName,
        departures: busesMap[lineRef][destName].sort((a, b) => a.minutes - b.minutes),
      })),
    }));

  return {
    station,
    lastUpdate,
    lines,
  };
}

function sortBusLines(a, b) {
  const na = parseInt(a.replace("bus-", ""));
  const nb = parseInt(b.replace("bus-", ""));
  return na - nb;
}

function getBusDestination(mvj, call) {
  const dn = mvj.DestinationName?.[0]?.value || "";
  const dd = call?.DestinationDisplay?.[0]?.value || "";
  const dir = mvj.DirectionName?.[0]?.value || "";

  const dnLower = dn.toLowerCase();
  const ddLower = dd.toLowerCase();
  const dirLower = dir.toLowerCase();

  // 1. DirectionName contient DestinationDisplay → terminus
  if (dir && dd && dirLower.includes(ddLower)) {
    return cleanDestinationName(dir);
  }

  // 2. DirectionName contient DestinationName → terminus
  if (dir && dn && dirLower.includes(dnLower)) {
    return cleanDestinationName(dir);
  }

  // 3. Sinon → DestinationName (vraie destination)
  if (dn) {
    return cleanDestinationName(dn);
  }

  // 4. Fallback → DestinationDisplay
  if (dd) {
    return cleanDestinationName(dd);
  }

  return "Destination inconnue";
}

function cleanDestinationName(name) {
  return name
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}




