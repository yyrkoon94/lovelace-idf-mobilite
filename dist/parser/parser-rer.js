// siri-parser-rer.js
import {
  findNonRatpLineData,
  extractLineStop,
  cleanDirectionRef,
  normalizeDestination,
  detectState,
  formatTimestamp,
  fixEncodingAndClean
} from "./parser-utils.js";


export function parseRerFromSiri(
  lineDatas,
  exclude_lines,
  exclude_lines_ref,
  nb_departure,
  groupDestination,
  groupDestinationName,
  max_delay,
  show_replacement_bus
) {
  const siri = lineDatas?.attributes?.Siri;
  const stopMon = siri?.ServiceDelivery?.StopMonitoringDelivery?.[0];
  if (!stopMon?.ResponseTimestamp) return null;

  const station = fixEncodingAndClean(
    stopMon.MonitoredStopVisit.length > 0
      ? stopMon.MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall
          .StopPointName?.[0]?.value
      : "Pas de départ prévu"
  );

  const lastUpdate = formatTimestamp(stopMon.ResponseTimestamp);
  const maxDelay = max_delay ? max_delay : 60
  const rerMap = {};
  const rerMeta = {};
  const destinationRefLineStop = {};

  stopMon.MonitoredStopVisit.forEach((stop) => {
    const mvj = stop.MonitoredVehicleJourney;
    const call = mvj.MonitoredCall;

    // --- Filtre des terminus non commerciaux (missions partielles)
    const isTerminusHere =
      mvj.DestinationRef?.value === stop.MonitoringRef?.value;

    if (isTerminusHere) {
      return; // On ignore les trains qui terminent ici
    }

    const ts = call?.ExpectedDepartureTime || call?.ExpectedArrivalTime;
    if (!ts) return;

    // --- Ligne ----------------------------------------------------
    const raw = mvj.LineRef.value;
    const lineToFind = raw.substring(raw.lastIndexOf("::") + 2, raw.lastIndexOf(":"));
    const line = findNonRatpLineData(lineToFind);
    if (!line) return;

    // RER = rail
    const mode = line.transportmode || "";
    const submode = line.transportsubmode || "";
    let lineRef = null;

    // --- RAIL (RER / TRAIN / TER) ---
    if (mode === "rail") {

      if (submode.includes("local")) {            // RER
        lineRef = "rer-" + line.name_line;

      } else if (submode.includes("suburbanRailway")) { // TRAIN
        lineRef = "train-" + line.name_line;

      } else if (submode.includes("regionalRail")) {    // TER
        lineRef = "train-" + line.shortname_line;
      }
    }

    // --- BUS DE REMPLACEMENT ---
    else if (mode === "bus") {

      if (line?.type?.includes("REPLACEMENT") && show_replacement_bus) {
        lineRef = "bus-rep-" + line.shortname_line;
      }
    }
    // --- AUTRES MODES : ignorés ---
    else {
      return;
    }

    // Si rien n’a matché → on ignore
    if (!lineRef) return;

    // --- DestinationRef ------------------------------------------
    let lineStop = extractLineStop(mvj.DestinationRef.value);

    // --- DestinationName -----------------------------------------
    const rawDest =
      mvj.DestinationName?.[0]?.value ||      // ✔ RER / SNCF
      mvj.DestinationDisplay?.[0]?.value ||   // fallback
      "Destination inconnue";

    const destinationName = normalizeDestination(rawDest);



    // --- directionRef --------------------------------------------
    let directionRef =
        mvj.DestinationShortName?.[0]?.value ||
         mvj.DestinationRef?.value ||
        mvj.DirectionRef?.value;

    directionRef = cleanDirectionRef(directionRef);

    if (!destinationRefLineStop[directionRef] && lineStop !== "TrainEstimeDans") {
      destinationRefLineStop[directionRef] = lineStop;
    }

    // --- Filtres --------------------------------------------------
    const excluded =
      (exclude_lines && exclude_lines.includes(lineRef)) ||
      (exclude_lines_ref && exclude_lines_ref.includes(lineStop)) ||
      (exclude_lines_ref &&
        exclude_lines_ref.includes(destinationRefLineStop[directionRef]));

    if (excluded) return;

    // --- Départ ---------------------------------------------------
    const expected = new Date(Date.parse(ts));
    const minutes = Math.floor((expected - Date.now()) / 60000);
    const hour = expected.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const platform = line?.type?.includes("REPLACEMENT") ? "" :
        call.DeparturePlatformName?.value ||
        call.ArrivalPlatformName?.value || "";

    const state = detectState(call, minutes);

    if (minutes < -5 || (maxDelay && minutes > maxDelay)) return;

    // --- Groupement ----------------------------------------------
    if (!rerMap[lineRef]) rerMap[lineRef] = {};
    const destKey = groupDestination ? "GROUPED" : destinationName;

    if (!rerMap[lineRef][destKey]) rerMap[lineRef][destKey] = [];

    const vehiculeName =
        mvj.JourneyNote && mvj.JourneyNote.length > 0 && mvj.JourneyNote[0].value !== ""
        ? mvj.JourneyNote[0].value
        : lineRef.substring(lineRef.indexOf("-") + 1).toLocaleUpperCase();

    if (nb_departure && nb_departure !="" && rerMap[lineRef][destKey].length >= nb_departure) return;
    rerMap[lineRef][destKey].push({
      minutes,
      hour,
      state,
      platform,
      destinationRef: lineStop,
      destinationName,
      vehiculeName,
    });

    if (!rerMeta[lineRef]) rerMeta[lineRef] = line;
  });

  // --- Transformation finale --------------------------------------
  const lines = Object.keys(rerMap).map((lineRef) => {
    const destinations = Object.keys(rerMap[lineRef]).map((destKey) => {
      const deps = rerMap[lineRef][destKey]
        .sort((a, b) => a.minutes - b.minutes);

      let label;

      if (groupDestination) {
        if (groupDestinationName) {
            // Nom de groupe explicite fourni
            label = groupDestinationName;
        } else {
            // Pas de nom explicite : on concatène tous les destinationName
            const allNames = [...new Set(deps.map((d) => d.destinationName).filter(Boolean))];
            label = allNames.join(" • ");
        }
        } else {
        // Pas de groupement : on garde le comportement normal
        label = deps[0]?.destinationName || destKey;
      }

      return {
        name: label,
        type: rerMeta[lineRef]?.transportmode || null,
        id_line: rerMeta[lineRef]?.id_line || null,
        departures: deps.map((d, i) => ({
          minutes: d.minutes,
          hour: d.hour,
          platform: d.platform,
          state: d.state,
          destinationRef: d.destinationRef,
          destinationName: d.destinationName,
          vehiculeName: d.vehiculeName,
        })),
      };
    });

    return {
      id: lineRef,
      type: rerMeta[lineRef]?.transportmode || null,
      id_line: rerMeta[lineRef]?.id_line || null,
      shortname_line: rerMeta[lineRef]?.name_line || null,
      icon: rerMeta[lineRef]?.icon || null,
      shortname_line: rerMeta[lineRef]?.name_line || null,
      transportmode: rerMeta[lineRef]?.transportmode || null,
      transportsubmode: rerMeta[lineRef]?.transportsubmode || null,
      colorweb_hexa: rerMeta[lineRef]?.colourweb_hexa || rerMeta[lineRef]?.colorweb_hexa || null,
      textcolorweb_hexa: rerMeta[lineRef]?.textcolourweb_hexa || rerMeta[lineRef]?.textcolorweb_hexa || null,
      destinations,
    };
  });

  return {
    station,
    lastUpdate,
    lines,
  };
}