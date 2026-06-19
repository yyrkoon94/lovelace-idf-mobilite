// parser-utils.js
import { idfMobiliteLineRef } from "../referentiel-des-lignes-filtered.js";

// ------------------------------------------------------------
// Recherche d'une ligne IDFM (BUS / RER / TRAIN / TRAM)
// ------------------------------------------------------------
export function findNonRatpLineData(lineToFind) {
  let lineData;
  idfMobiliteLineRef().every((line) => {
    if (line.id_line == lineToFind) {
      lineData = line;
      return false;
    }
    return true;
  });
  return lineData;
}

// ------------------------------------------------------------
// Extraction du StopPoint (STIF:StopPoint:Q:xxxx → xxxx)
// ------------------------------------------------------------
export function extractLineStop(ref) {
  let s = ref.substring(0, ref.lastIndexOf(":"));
  return s.substring(s.lastIndexOf(":") + 1);
}

// ------------------------------------------------------------
// Nettoyage directionRef
// ------------------------------------------------------------
export function cleanDirectionRef(ref) {
  if (!ref) return "";
  let r = fixEncodingAndClean(ref);
  r = r.replace(/- *$/, "").trim();

  // fallback propre
  if (!r || r.length < 2) return "DIR_" + Math.random().toString(36).substring(2, 7);

  return r;
}

// ------------------------------------------------------------
// Normalisation destination
// ------------------------------------------------------------
export function normalizeDestination(str) {
  if (!str) return "";
  return fixEncodingAndClean(str);
}

// ------------------------------------------------------------
// Détection de l'état du véhicule
// ------------------------------------------------------------
export function detectState(call, minutes) {
  const status = call.DepartureStatus?.toLowerCase() || "";

  if (status === "cancelled") return "cancelled";
  if (status === "delayed") return "delayed";
  if (minutes === 0) return "approaching";
  if (minutes < 0) return "at_stop";

  return "on_time";
}

// ------------------------------------------------------------
// Format HH:MM local
// ------------------------------------------------------------
export function formatTimestamp(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// ------------------------------------------------------------
// Nettoyage des caractères cassés IDFM
// ------------------------------------------------------------
export function fixEncodingAndClean(str) {
  if (!str) return "";

  const map = {
    "�": "é",
    "Ã©": "é",
       "Ã¨": "è",
    "Ãª": "ê",
    "Ã": "à",
    "â€™": "’",
    "â€“": "–",
    "â€œ": "“",
    "â€": "”",
  };

  let s = str;
  for (const bad in map) s = s.replaceAll(bad, map[bad]);

  s = s.replace(/\s+/g, " ").trim();

  return reformatString(s);
}

// ------------------------------------------------------------
// Mise en forme typographique (Majuscules, accents…)
// ------------------------------------------------------------
export function reformatString(str) {
  const exclusions = new Set(["de", "du", "le", "la", "les", "et", "via", "sur", "en"]);
  const words = str.split(/\s+/);

  return words
    .map((word, index) => {
      if (/^<.*>$/.test(word)) return word.toUpperCase();
      if (/[a-z]/.test(word)) return word;

      if (word.includes("-")) {
        return word
          .split("-")
          .map((part, part_idx) => {
            if (index > 0 && part_idx > 0 && exclusions.has(part.toLowerCase()))
              return part.toLowerCase();
            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
          })
          .join("-");
      }

      if (index > 0 && exclusions.has(word.toLowerCase())) return word.toLowerCase();

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
