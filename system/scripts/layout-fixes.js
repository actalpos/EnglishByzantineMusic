/**
 * layout-fixes.js
 *
 * Repară structura și aspectul HTML-ului generat de
 * Microsoft Word / LibreOffice.
 *
 * Acest fișier NU:
 * - încarcă titleLink.json;
 * - normalizează titluri de imnuri;
 * - detectează momente liturgice;
 * - adaugă hyperlinkuri.
 */

(function () {
    "use strict";

    /**
     * Execută funcția după încărcarea structurii HTML.
     */
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    /**
     * Verifică dacă textul conține caractere dintr-o limbă RTL.
     *
     * Include, între altele:
     * - ebraică;
     * - arabă;
     * - alte caractere din intervalele Unicode asociate.
     */
    function isRTL(text) {
        return /[\u0590-\u08FF]/.test(text || "");
    }

    /**
     * Returnează numai celulele TD care sunt copii direcți ai rândului.
     *
     * Nu folosim querySelectorAll("td"), deoarece acela poate include
     * și celule din eventuale tabele imbricate.
     */
    function getDirectCells(row) {
        return Array.from(row.children).filter(
            element => element.tagName === "TD"
        );
    }

    /**
     * Elimină elementele <col> invalide sau supradimensionate
     * create uneori la conversia RTF/DOCX în HTML.
     */
    function removeGhostColumns() {
        document.querySelectorAll("table col").forEach(col => {
            const rawWidth = col.getAttribute("width");
            const width = Number.parseInt(rawWidth, 10);

            if (!width || width > 1000) {
                col.remove();
            }
        });
    }

    /**
     * Elimină celulele goale sau supradimensionate și repară colspan.
     */
    function removeGhostCells() {
        document.querySelectorAll("table tr").forEach(row => {
            const cells = getDirectCells(row);

            cells.forEach(cell => {
                const text = cell.textContent.replace(/\s+/g, "");
                const rawWidth = cell.getAttribute("width");
                const width = Number.parseInt(rawWidth, 10);

                const isEmpty = !text;
                const isOversized = rawWidth && width > 1000;

                if (isEmpty || isOversized) {
                    cell.remove();
                }
            });

            const remainingCells = getDirectCells(row);

            /*
             * Un singur TD rămas ocupă întregul rând.
             */
            if (remainingCells.length === 1) {
                remainingCells[0].setAttribute("colspan", "2");
            }

            /*
             * Două celule trebuie să formeze cele două coloane normale.
             */
            if (remainingCells.length === 2) {
                remainingCells.forEach(cell => {
                    cell.removeAttribute("colspan");
                });
            }
        });
    }

    /**
     * Forțează structura tabelului să curgă de la stânga la dreapta.
     *
     * Direcția textului din fiecare celulă este stabilită separat.
     */
    function forceLTRTableLayout() {
        document.querySelectorAll("table").forEach(table => {
            table.setAttribute("dir", "ltr");
        });
    }

    /**
     * Curăță proprietățile de poziționare ale paragrafelor și
     * stabilește direcția textului.
     */
    function fixParagraphDirection() {
        document.querySelectorAll("p").forEach(paragraph => {
            const text = paragraph.textContent.trim();

            /*
             * Păstrăm informația că paragraful era centrat
             * înainte să eliminăm atributul LibreOffice.
             */
            const originalAlign =
                (paragraph.getAttribute("align") || "").toLowerCase();

            if (originalAlign === "center") {
                paragraph.classList.add("source-centered");
            }

            paragraph.removeAttribute("align");
            paragraph.style.float = "none";
            paragraph.style.position = "static";

            if (!text) {
                return;
            }

            const rtl = isRTL(text);

            paragraph.style.direction = rtl ? "rtl" : "ltr";
            paragraph.style.textAlign = rtl ? "right" : "left";
        });
    }

    /**
     * Se asigură că într-un rând bilingv:
     *
     * - coloana English este în stânga;
     * - coloana Arabic este în dreapta.
     */
    function fixBilingualColumnOrder() {
        document.querySelectorAll("table tr").forEach(row => {
            const cells = getDirectCells(row);

            if (cells.length !== 2) {
                return;
            }

            const leftCell = cells[0];
            const rightCell = cells[1];

            const leftText = leftCell.textContent.trim();
            const rightText = rightCell.textContent.trim();

            const leftRTL = isRTL(leftText);
            const rightRTL = isRTL(rightText);

            /*
             * Dacă Arabic este în stânga și English în dreapta,
             * schimbăm ordinea celulelor.
             */
            if (leftRTL && !rightRTL) {
                row.insertBefore(rightCell, leftCell);
            }

            /*
             * Recalculăm celulele după eventuala schimbare de ordine.
             */
            getDirectCells(row).forEach(cell => {
                const text = cell.textContent.trim();

                if (!text) {
                    return;
                }

                const rtl = isRTL(text);

                cell.setAttribute("dir", rtl ? "rtl" : "ltr");
                cell.style.textAlign = rtl ? "right" : "left";
            });
        });
    }

    /**
     * Verifică dacă un tabel este bilingv.
     *
     * Un tabel este considerat bilingv dacă are cel puțin un rând
     * cu două sau mai multe celule care conțin text.
     */
    function isBilingualTable(table) {
        return Array.from(table.rows).some(row => {
            const cellsWithText = Array.from(row.cells).filter(cell => {
                return cell.textContent.trim();
            });

            return cellsWithText.length >= 2;
        });
    }

    /**
     * Detectează tipul întregului document.
     *
     * Document bilingv:
     * - conține cel puțin un tabel bilingv.
     *
     * Document monolingv:
     * - nu are tabel;
     * - sau are numai tabele cu o singură coloană de conținut.
     */
    function detectDocumentType() {
        const tables = Array.from(document.querySelectorAll("table"));

        const bilingual = tables.some(table => {
            return isBilingualTable(table);
        });

        document.body.classList.remove(
            "bilingual-document",
            "monolingual-document"
        );

        document.body.classList.add(
            bilingual ? "bilingual-document" : "monolingual-document"
        );

        return bilingual ? "bilingual" : "monolingual";
    }

    /**
     * Centrează tabelele monolingve.
     *
     * Un tabel bilingv nu este modificat aici.
     */
    function formatMonolingualTables() {
        document.querySelectorAll("table").forEach(table => {
            if (isBilingualTable(table)) {
                return;
            }

            table.classList.add("monolingual-table");

            /*
             * Nu stabilim dimensiunea sau alinierea în JavaScript.
             * monolingual.css controlează aspectul.
             */
            table.style.removeProperty("margin-left");
            table.style.removeProperty("margin-right");
            table.style.removeProperty("max-width");
            table.style.removeProperty("width");

            table.querySelectorAll("td").forEach(cell => {
                cell.style.removeProperty("text-align");
                cell.style.removeProperty("width");
                cell.style.removeProperty("max-width");
            });

            table.querySelectorAll("p").forEach(paragraph => {
                paragraph.style.removeProperty("text-align");
            });
        });
    }

    /**
     * Elimină alinierea inline din documentele monolingve
     * fără tabel, astfel încât monolingual.css să controleze:
     *
     * - textul normal la stânga;
     * - titlurile la centru.
     */
    function formatTablelessMonolingualDocument() {
        if (document.querySelector("table")) {
            return;
        }

        /*
         * Nu stabilim aici alinierea.
         * monolingual.css controlează:
         *
         * - paragrafele la stânga;
         * - titlurile la centru.
         */
        document.querySelectorAll("p").forEach(paragraph => {
            paragraph.style.removeProperty("text-align");
        });
    }

    /**
     * Elimină dimensiunile de font introduse de Word/LibreOffice.
     *
     * Aspectul va fi controlat ulterior din CSS.
     */
    function removeWordFontSizes() {
        document
            .querySelectorAll("[style*='font-size']")
            .forEach(element => {
                element.style.fontSize = "";
            });

        document.querySelectorAll("font[size]").forEach(font => {
            font.removeAttribute("size");
        });
    }

    /**
     * Elimină atributele face de pe elementele <font>.
     *
     * Familia de font va fi controlată din CSS.
     */
    function removeWordFontFaces() {
        document.querySelectorAll("font[face]").forEach(font => {
            font.removeAttribute("face");
        });
    }

    /**
     * Pornește toate reparațiile de layout în ordinea necesară.
     */
    ready(function () {
        console.log("layout-fixes.js loaded");

        removeGhostColumns();
        removeGhostCells();

        forceLTRTableLayout();
        fixParagraphDirection();
        fixBilingualColumnOrder();

        const documentType = detectDocumentType();

        cleanMonolingualLibreOfficeStyles();

        formatMonolingualTables();
        formatTablelessMonolingualDocument();

        removeWordFontSizes();
        removeWordFontFaces();

        console.log(
            `Layout fixes applied successfully. Document type: ${documentType}.`
        );
    });

    /**
     * Curăță formatarea inline produsă de LibreOffice
     * numai pentru documentele monolingve.
     *
     * Nu elimină:
     * - bold;
     * - italic;
     * - underline;
     * - culorile linkurilor.
     */
    function cleanMonolingualLibreOfficeStyles() {
        if (
            !document.body.classList.contains(
                "monolingual-document"
            )
        ) {
            return;
        }

        /*
         * Elimină dimensiunile, indentările, alinierile
         * și clasele generate de LibreOffice.
         */
        document.querySelectorAll("p").forEach(paragraph => {
            paragraph.classList.remove("western");
            paragraph.classList.remove("cjk");
            paragraph.classList.remove("ctl");

            paragraph.removeAttribute("align");

            paragraph.style.removeProperty("font-size");
            paragraph.style.removeProperty("font-family");
            paragraph.style.removeProperty("line-height");

            paragraph.style.removeProperty("margin-left");
            paragraph.style.removeProperty("margin-right");
            paragraph.style.removeProperty("margin-top");
            paragraph.style.removeProperty("margin-bottom");

            paragraph.style.removeProperty("text-indent");
            paragraph.style.removeProperty("text-align");

            paragraph.style.removeProperty("width");
            paragraph.style.removeProperty("max-width");

            paragraph.style.removeProperty("letter-spacing");
        });

        /*
         * LibreOffice pune frecvent font-size și font-family
         * pe font, span, b, i și u.
         */
        document
            .querySelectorAll(
                "font, span, b, strong, i, em, u"
            )
            .forEach(element => {
                element.style.removeProperty("font-size");
                element.style.removeProperty("font-family");
                element.style.removeProperty("line-height");
                element.style.removeProperty("letter-spacing");
            });

        /*
         * Curăță vechile elemente FONT fără să elimine
         * conținutul sau bold/italic/underline.
         */
        document.querySelectorAll("font").forEach(font => {
            font.removeAttribute("face");
            font.removeAttribute("size");
        });
    }
})();