/**

layout-fixes-and-links.js

Generated on: 2026-03-10 21:42

// [V] - Vespers:
// [LIHC] = Lord I Have Cried
// [AP] = Aposticha
// [O] = Orthros:
// [PR] = Praises
// [EX] = Exaposteilarion
// [KA] = Kathisma
// [PS] = Praises Stichera
// [LT] = Litia
// [V][LIHC] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [V][AP] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [O][PR] DOXASTIKON FOR...



Layout cleanup + RTL/LTR detection + title links

Typography controlled entirely by CSS

June 3 2026 - add festal to the kewords to be ignored (for FESTAL TROPARIA AFTER PSALM 50)
June 4 2026 - fix for linking [V] header and [O] header
June 30 2026 remove Sticheras from the title
June 30 2026 - fix for in one place FIFTH EOTHINON EXAPOSTEILARION IN TONE TWO in other FIFTH EOTHINON EXAPOSTEILARION TONE TWO
July 7 2026 - fix for overlapping [V] [LIHC] For St. Paisios in Tone One | Karam with [O] For St. Paisios in Tone One | Karamnot shouwn in Orthros as well. Only when the service moment is provided.
            - struct change: do not include LITART in VESP only for customizations. So Always keep [LT] as separate entity


| JSON                                                  | HTML             | Rezultat                     |
| ----------------------------------------------------- | ---------------- | ---------------------------- |
| `TITLE`                                               | `TITLE`          | ✅                            |
| `[V] TITLE`                                           | Vespers          | ✅                            |
| `[O] TITLE`                                           | Orthros          | ✅                            |
| `[V][LIHC] TITLE` + `[V][AP] TITLE`                   | două apariții    | ✅ LIHC apoi AP               |
| `[V][LIHC] TITLE` + `[O] TITLE`                       | fiecare serviciu | ✅ fără coliziuni             |
| `[V] TITLE` + `[O] TITLE`                             | fiecare serviciu | ✅ fără coliziuni             |
| `[V][LIHC] TITLE` + `[V][LT] TITLE` + `[V][AP] TITLE` | trei apariții    | ✅ în ordinea `SERVICE_ORDER` |

July 17 2026 - fix for having the same title for the same service, same part. The differentiation would be in the automelon of the title

✅ TITLE
✅ [V] TITLE
✅ [O] TITLE
✅ [V][LIHC], [V][LT], [V][AP] în ordinea SERVICE_ORDER
✅ coliziuni între Vespers și Orthros
✅ suport pentru TITLE || AUTOMELON
✅ suport pentru [SERVICE] TITLE || AUTOMELON
✅ suport pentru [SERVICE][MOMENT] TITLE || AUTOMELON
✅ protecție împotriva amestecului dintre [SERVICE] și [SERVICE][MOMENT]
✅ obiectele multi afișează acum doar versiunile care corespund automelonului (cum era cazul For the Holy Fathers...)

July 20 - am scos TD din document.querySelectorAll("td p").forEach(p => {  in incercarea de a putea aplica kinks la file care nu are table - English.hml
- mai trebuie lucrat

*/

(function () {
"use strict";

function ready(fn) {
if (document.readyState !== "loading") {
fn();
} else {
document.addEventListener("DOMContentLoaded", fn);
}
}

ready(async () => {

console.log("layout-fixes-and-links loaded");

/**********************
 * SERVICE TYPE
 **********************/
function detectServiceType() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("vesp")) return "V";
  if (path.includes("orthros")) return "O";
  if (path.includes("litart")) return "LT";

  // if ((path.includes("liturgy") || path.includes("divine")) && !path.includes("variables")) {
  //   return "L";
  // }

  if ((path.includes("liturgy") || path.includes("divine")) && path.includes("variables")) {
    return "LV";
  }

  return null;
}

const SERVICE = detectServiceType();

// defines document order when multiple identical
// titles exist inside the same service
const SERVICE_ORDER = {
  V: {
    LIHC: 1,
    LT: 2,
    AP: 3,
  }
};

/**********************
 * UTILS
 **********************/
function normalizeTitle(str) {
  str = str
      .replace(/[\n\r\t]+/g, " ")
    .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")   // (** ... **)
    .replace(/\*\*.*?\*\*/g, "")             // fallback
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\(\s*/g, "( ")
    .replace(/\s*\)/g, " )")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an|sticheras)\s+/i, "")          // remove leading article
    .replace(/\bin\s+tone\b/gi, "tone")                

  const prefixMatch = str.match(/^((\[[a-z]+\]\s*)+)(.*)$/i);

  if (prefixMatch) {
    const prefixes = prefixMatch[1];
    let title = prefixMatch[3];

    title = title.replace(/^(the|a|an|festal|sticheras)\s+/, "");

    return `${prefixes} ${title}`.trim();
  }

  return str.replace(/^(the|a|an|festal)\s+/, "");
}

function extractAutomelonFromText(text) {

  if (!text) {
    return "";
  }

  const match =
    text.match(/\(\s*\*\*(.*?)\*\*\s*\)/s);

  if (!match) {
    return "";
  }

  return normalizeTitle(match[1]);
}


function splitAutomelonKey(key) {

  const separator = "||";
  const index = key.lastIndexOf(separator);

  if (index === -1) {
    return {
      title: key.trim(),
      automelon: ""
    };
  }

  return {
    title: key.substring(0, index).trim(),
    automelon: key.substring(index + separator.length).trim()
  };
}

function isRTL(text) {
  return /[\u0590-\u08FF]/.test(text);
}

/**********************
 * REMOVE GHOST COLUMNS
 **********************/
document.querySelectorAll("table col").forEach(col => {
  const width = parseInt(col.getAttribute("width"));
  if (!width || width > 1000) col.remove();
});

document.querySelectorAll("table tr").forEach(tr => {

  const tds = Array.from(tr.children).filter(td => td.tagName === "TD");

  tds.forEach(td => {

    const text = td.textContent.replace(/\s+/g, "");
    const width = td.getAttribute("width");

    if (!text || (width && parseInt(width) > 1000)) {
      td.remove();
    }

  });

  const remainingTds = Array.from(tr.children).filter(td => td.tagName === "TD");

  if (remainingTds.length === 1) {
    remainingTds[0].setAttribute("colspan", "2");
  }

  if (remainingTds.length === 2) {
    remainingTds.forEach(td => td.removeAttribute("colspan"));
  }

});

/**********************
 * FORCE LTR TABLE LAYOUT
 **********************/
document.querySelectorAll("table").forEach(table => {
  table.setAttribute("dir", "ltr");
});

/**********************
 * PARAGRAPH FIXES
 **********************/
document.querySelectorAll("td p").forEach(p => {

  const text = p.textContent.trim();
  if (!text) return;

  p.removeAttribute("align");
  p.style.float = "none";
  p.style.position = "static";

  const rtl = isRTL(text);

  p.style.direction = rtl ? "rtl" : "ltr";
  p.style.textAlign = rtl ? "right" : "left";

});

/**********************
 * FIX COLUMN ORDER
 **********************/
document.querySelectorAll("table tr").forEach(tr => {

  const tds = Array.from(tr.querySelectorAll("td"));
  if (tds.length !== 2) return;

  const leftText = tds[0].textContent.trim();
  const rightText = tds[1].textContent.trim();

  const leftRTL = isRTL(leftText);
  const rightRTL = isRTL(rightText);

  if (leftRTL && !rightRTL) {
    tr.insertBefore(tds[1], tds[0]);
  }

  tds.forEach(td => {

    const text = td.textContent.trim();
    if (!text) return;

    const rtl = isRTL(text);

    td.setAttribute("dir", rtl ? "rtl" : "ltr");
    td.style.textAlign = rtl ? "right" : "left";

  });

});

/**********************
 * LOAD TITLE LINKS
 **********************/
const serviceIndex = {};
const globalIndex = {};

const serviceAutomelonIndex = {};
const globalAutomelonIndex = {};

const globalCount = {};
const titleUsage = {};

try {

  const base = window.location.pathname.includes("/byzmusic/") ? "/byzmusic" : "";
  const res = await fetch(`${base}/system/data/titleLink.json`);

  if (!res.ok) throw new Error("titleLink.json missing");

  const raw = await res.json();



  for (const key in raw) {

      const item =
          typeof raw[key] === "string"
              ? { url: raw[key], name: null }
              : raw[key];

      const keyParts = splitAutomelonKey(key);

      const norm = normalizeTitle(keyParts.title);
      const automelon = normalizeTitle(keyParts.automelon);

      // ----------------------------
      // [SERVICE] [MOMENT] TITLE
      // ----------------------------

      let m = norm.match(/^\[([a-z]+)\]\s+\[([a-z]+)\]\s+(.*)$/i);

      if (m) {

        const service = m[1].toUpperCase();
        const moment  = m[2].toUpperCase();
        const title   = m[3];

        const serviceKey =
          `[${service}] ${title}`;

        if (automelon) {

          const automelonKey =
            serviceKey + " || " + automelon;

          if (!serviceAutomelonIndex[automelonKey]) {

            serviceAutomelonIndex[automelonKey] = [];

          }

          if (Array.isArray(serviceAutomelonIndex[automelonKey])) {

            serviceAutomelonIndex[automelonKey].push({
              moment,
              item
            });

          } else {

            console.warn(
              "Mixed service and service-moment automelon key:",
              automelonKey
            );

          }

        }

        if (!serviceIndex[serviceKey]) {
          serviceIndex[serviceKey] = [];
        }

        serviceIndex[serviceKey].push({
          moment,
          item
        });

        globalCount[title] =
          (globalCount[title] || 0) + 1;

        continue;
      }

      // ----------------------------
      // [SERVICE] TITLE
      // ----------------------------

      m = norm.match(/^\[([a-z]+)\]\s+(.*)$/i);

      if (m) {

          const service = m[1].toUpperCase();
          const title   = m[2];

          const serviceKey =`[${service}] ${title}`;

          if (automelon) {

            const automelonKey =
              serviceKey + " || " + automelon;

            if (!serviceAutomelonIndex[automelonKey]) {

              serviceAutomelonIndex[automelonKey] = item;

            } else {

              console.warn(
                "Mixed service and service-moment automelon key:",
                automelonKey
              );

            }

          } else {

            serviceIndex[serviceKey] = item;

          }

          globalCount[title] =
              (globalCount[title] || 0) + 1;

          continue;
      }

      // ----------------------------
      // GLOBAL TITLE
      // ----------------------------

      if (automelon) {

        const automelonKey = norm + " || " + automelon;

        globalAutomelonIndex[automelonKey] = item;

      } else {

        globalIndex[norm] = item;

      }

      globalCount[norm] = (globalCount[norm] || 0) + 1;
  } 

  // sort moments inside each service

  for (const key in serviceIndex) {

      if (!Array.isArray(serviceIndex[key])) {
          continue;
      }

      const service =
          key.match(/^\[([A-Z]+)\]/)[1];

      const order =
          SERVICE_ORDER[service] || {};

      serviceIndex[key].sort((a, b) => {

          return (order[a.moment] || 999)
              - (order[b.moment] || 999);

      });
  }

  for (const key in serviceAutomelonIndex) {

    const entries =
      serviceAutomelonIndex[key];

    if (!Array.isArray(entries)) {
      continue;
    }

    const serviceMatch =
      key.match(/^\[([A-Z]+)\]/);

    const service =
      serviceMatch ? serviceMatch[1] : "";

    const order =
      SERVICE_ORDER[service] || {};

    entries.sort((a, b) =>
      (order[a.moment] || 999) -
      (order[b.moment] || 999)
    );
  }

  // remove global entries that collide
  // with another service

  for (const title in globalCount) {

      if (globalCount[title] > 1) {
          delete globalIndex[title];
      }
  }  


} catch (e) {

  console.warn("TitleLink load failed:", e.message);

}

/**********************
 * APPLY TITLE LINKS
 **********************/
document.querySelectorAll("p").forEach(p => {

  if (p.querySelector("a")) return;

  const originalText = p.textContent.trim();

  if (!originalText) {
    return;
  }

  const htmlAutomelon = extractAutomelonFromText(originalText);

  const baseKey = normalizeTitle(originalText);

  let item = null;

  // ----------------------------
  // SERVICE
  // ----------------------------

  if (SERVICE) {

      const serviceKey = `[${SERVICE}] ${baseKey}`;

      if (htmlAutomelon) {

        const automelonKey = serviceKey + " || " + htmlAutomelon;

        const automelonMatch = serviceAutomelonIndex[automelonKey];

        if (Array.isArray(automelonMatch)) {

          const usageKey =
            "AUTOMELON::" + automelonKey;

          const index =
            titleUsage[usageKey] || 0;

          const selected =
            automelonMatch[
              Math.min(
                index,
                automelonMatch.length - 1
              )
            ];

          item = selected.item;

          titleUsage[usageKey] =
            index + 1;

        } else if (automelonMatch) {

          item =
            automelonMatch.item ||
            automelonMatch;

        }

      }

      // 2. Dacă nu s-a găsit după automelon,
      // folosește logica veche
      if (!item) {

        const match =
          serviceIndex[serviceKey];

        if (Array.isArray(match)) {

          const index =
            titleUsage[serviceKey] || 0;

          item =
            match[
              Math.min(
                index,
                match.length - 1
              )
            ].item;

          titleUsage[serviceKey] =
            index + 1;

        } else if (match) {

          item = match;

        }

      }
  }

  // ----------------------------
  // GLOBAL
  // ----------------------------

  if (!item && htmlAutomelon) {

    const automelonKey = baseKey + " || " + htmlAutomelon;

    item = globalAutomelonIndex[automelonKey];

  }

  if (!item) {
    item = globalIndex[baseKey];
  }

  if (!item) {
      return;
  }


  if (item.type === "multi" && Array.isArray(item.versions)) {

    let versions = item.versions;

    if (htmlAutomelon) {

      versions = versions.filter(v =>
        normalizeTitle(v.automelon || "") === htmlAutomelon
      );

      if (versions.length === 0) {

        console.warn(
          "No matching automelon version:",
          baseKey,
          htmlAutomelon
        );

        return;
      }

    }

    const span = document.createElement("span");
    span.innerHTML = p.innerHTML;

    versions.forEach(v => {

      if (!v.url) {
        return;
      }

      const space = document.createTextNode(" ");

      const a = document.createElement("a");
      a.href = v.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `(${v.label || "PDF"})`;

      span.appendChild(space);
      span.appendChild(a);

    });

    p.innerHTML = "";
    p.appendChild(span);

    return;
  }

  if (!item.url) return;

  const a = document.createElement("a");

  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.innerHTML = p.innerHTML;

  if (item.name) a.title = item.name;

  p.innerHTML = "";
  p.appendChild(a);

});

/**********************
 * REMOVE WORD FONT SIZES
 **********************/
document.querySelectorAll("[style*='font-size']").forEach(el => {
  el.style.fontSize = "";
});

document.querySelectorAll("font[size]").forEach(el => {
  el.removeAttribute("size");
});

document.querySelectorAll("font[face]").forEach(el => {
  el.removeAttribute("face");
});

/**********************
 * CLEAN WORD COLORS
 **********************/
document.querySelectorAll("a font").forEach(f => {
  f.removeAttribute("color");
  if (f.style) f.style.color = "";
});

document.querySelectorAll("a span").forEach(s => {
  if (s.style) s.style.color = "";
});

console.log("Layout + links applied successfully.");

});

})();