import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";
import { unsafeHTML } from "https://unpkg.com/lit-html@1.4.1/directives/unsafe-html.js?module";

import { parseBusFromSiri } from "./parser/parser-bus.js";
import { parseRerFromSiri } from "./parser/parser-rer.js";
import { parseMultiLineNavitia } from "./parser/parser-messages.js";
import { renderBUS } from "./render/render-bus.js";
import { renderRER } from "./render/render-rer.js";
import { renderMessages } from "./render/render-message.js";
import { IDFMobiliteStyles } from "./render/render-style.js";

class IDFMobiliteCard extends LitElement {
    static get properties() {
        console.log("%c Lovelace - IDF Mobilité  %c 0.4.5", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
        return {
            hass: {},
            config: {},
        };
    }

    /********************************************************
    **                                                     **
    **                      MAIN RENDER                    **
    **                                                     **
    *********************************************************/
    render() {
        if (!this.config || !this.hass) {
            return html``;
        }
        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
        <ha-card>
            <div class="${this.getBorderClass()}">
                <div class="${this.getScreenClass()}">
                    <div class="${this.getContentClass()}">
                    <!-- Type RER -->
                    ${this.config.lineType === "RER"
                        ? this.createRERContent(
                            this.hass.states[this.config.entity],
                            this.config.exclude_lines,
                            this.config.exclude_lines_ref,
                            this.config.nb_departure_first_line,
                            this.config.show_hour_departure_first_line,
                            this.config.show_hour_departure_index_first_line,
                            this.config.show_departure_platform_first_line,
                            this.config.group_destination_first_line,
                            this.config.group_destination_name_first_line,
                            this.config.max_delay_first_line,
                            this.config.show_replacement_bus
                        )
                    : ""}
                    <!-- Type BUS -->
                    ${this.config.lineType === "BUS"
                        ? this.createBUSContent(
                            this.hass.states[this.config.entity],
                            this.config.exclude_lines,
                            this.config.exclude_lines_ref,
                            this.config.included_destination,
                            this.config.show_only_included
                        )
                        : ""}
                    <!-- Deuxieme entitté Type RER -->
                    ${this.config.second_entity && this.config.lineType === "RER"
                        ? this.createRERContent(
                            this.hass.states[this.config.second_entity],
                            this.config.exclude_second_lines,
                            this.config.exclude_second_lines_ref,
                            this.config.nb_departure_second_line,
                            this.config.show_hour_departure_second_line,
                            this.config.show_hour_departure_index_second_line,
                            this.config.show_departure_platform_second_line,
                            this.config.group_destination_second_line,
                            this.config.group_destination_name_second_line,
                            this.config.max_delay_second_line,
                            this.config.show_replacement_bus,
                            true
                        )
                        : ""}
                    <!-- Deuxieme entitté Type BUS -->
                    ${this.config.second_entity && this.config.lineType === "BUS"
                        ? this.createBUSContent(
                            this.hass.states[this.config.second_entity],
                            this.config.exclude_second_lines,
                            this.config.exclude_second_lines_ref,
                            this.config.included_second_lines_destination,
                            this.config.show_only_included_second_lines,
                            true
                        )
                        : ""}
                    <!-- Messages -->
                    ${this.createMessageDisplay()}
                    </div>
                    <!-- Logo RATP en mode screen -->
                    ${this.config.show_screen
                    ? html`
                        <div class="ratp-img">
                            <img src="${imagesUrl}ratp.png" class="ratp-image">
                            <div class="blink-point"></div>
                        </div>
                        `
                    : ""}
                </div>
            </div>
        </ha-card>
        `;
    }

    getBorderClass() {
        if (this.config.show_screen) return "border-screen";
        if (this.config.wall_panel) return "border";
        return "border-screen";
    }

    getScreenClass() {
        return this.config.show_screen ? "idf-with-screen" : "idf-screen";
    }

    getContentClass() {
        if (this.config.show_screen) return "card-content-with-screen";
        if (this.config.wall_panel) return "card-content-nobg";
        return "card-content";
    }

    static get styles() {
        return IDFMobiliteStyles;
    }

    /********************************************************
    **                                                     **
    **                       RER CONTENT                   **
    **                                                     **
    *********************************************************/
    createRERContent(lineDatas, exclude_lines, exclude_lines_ref, nb_departure, show_hour_departure, show_hour_departure_index, show_departure_platform, groupDestination, groupDestinationName, max_delay, show_replacement_bus, second_entity) {
        const model = parseRerFromSiri(lineDatas, exclude_lines, exclude_lines_ref, nb_departure, groupDestination, groupDestinationName, max_delay, show_replacement_bus)
        if (!model)
            return
        const imagesUrl = new URL('images/', import.meta.url).href
         return html`
            ${renderRER(model, this.config, imagesUrl, second_entity)}
        `;
    }
    /********************************************************
    **                                                     **
    **                       BUS CONTENT                   **
    **                                                     **
    *********************************************************/
    createBUSContent(lineDatas, exclude_lines, exclude_lines_ref, included_destination, show_only_included, second_entity) {
        const model = parseBusFromSiri(lineDatas, exclude_lines, exclude_lines_ref, included_destination, show_only_included)
        if (!model)
            return
        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
            ${renderBUS(model, this.config, imagesUrl, second_entity)}
        `;
    }

    /********************************************************
    **                                                     **
    **                   MESSAGE CONTENT                   **
    **                                                     **
    *********************************************************/
    createMessageDisplay() {
        const messagesList = Array.isArray(this.config.messages)
            ? this.config.messages
            : this.config.messages
                ? [this.config.messages]
                : [];
        const model = parseMultiLineNavitia(
            messagesList.map(id => this.hass.states[id]).filter(Boolean)
        );

        const imagesUrl = new URL('images/', import.meta.url).href;
        const htmlString = renderMessages(model, this.config, imagesUrl);
        const safeHtmlString = htmlString || "";

        const noScroll = this.config.no_messages_scroll === true || this.config.enable_message_carousel === true;


        // Calcul de la vitesse (optionnel si tu veux le garder)
        const textLength = safeHtmlString.replace(/<[^>]*>/g, "").length;
        const textSpeed = Math.max(Math.floor(textLength / 10), 5);

        return html`
            <div class="message-div${noScroll ? "-fix" : ""}
                        ${this.config.show_screen ? "with-screen" : this.config.wall_panel ? "footer-nobg" : ""}">
                ${noScroll
                ? html`
                    <div class="message-div-text-fix">
                        ${unsafeHTML(safeHtmlString)}
                    </div>
                    `
                : html`
                    <div class="message-div-text"
                        style="animation: ScrollMessage ${textSpeed}s linear infinite;">
                        ${unsafeHTML(safeHtmlString)}
                    </div>
                    `}
            </div>
        `;
    }

    updated() {
        super.updated();
        if (this.config.enable_message_carousel) {

            // 🟩 Réattacher le clic proprement à chaque updated()
            this._attachCarouselClickHandler();

            // 🟩 recalculer le scroll vertical APRÈS le rendu réel
            requestAnimationFrame(() => {
                this._updateVerticalScroll();
            });

            if (!this._messageTabsInterval) {
                this._messageTabsInterval = setInterval(() => {
                    const imagesUrl = new URL('images/', import.meta.url).href
                    const root = this.shadowRoot;
                    if (!root) return;

                    const sidebarContainer = root.querySelector(".idf-message-sidebar");

                    const tabs = Array.from(root.querySelectorAll(".idf-message-tab"));
                    const sidebar = Array.from(root.querySelectorAll(".idf-message-sidebar-item"));

                    if (!tabs.length) return;

                    // 1. Animer uniquement la sidebar
                    sidebarContainer.classList.add("idf-sidebar-slide");

                    // 2. Attendre la fin de l’animation
                    setTimeout(() => {

                        // 3. Déplacer le premier onglet à la fin
                        sidebarContainer.appendChild(sidebar[0]);
                        tabs[0].parentElement.appendChild(tabs[0]);

                        // 🟩 3bis. Mettre à jour le mode du header
                        const newTabs = Array.from(root.querySelectorAll(".idf-message-tab"));
                        const activeTab = newTabs[0]; // le vrai onglet actif après rotation
                        const mode = activeTab.getAttribute("data-line-mode");

                        const modeImg = root.querySelector(".current-mode-icon");
                        modeImg.src = `${imagesUrl}${mode}.png`;

                        // 4. Retirer l’animation
                        sidebarContainer.classList.remove("idf-sidebar-slide");

                        // 5. Re-sélectionner les éléments
                        const newSidebar = Array.from(root.querySelectorAll(".idf-message-sidebar-item"));

                        // 6. Désactiver tous
                        newTabs.forEach(t => t.classList.remove("active"));
                        newSidebar.forEach(s => s.classList.remove("active"));

                        // 7. Activer le premier (le bon)
                        newTabs[0].classList.add("active");
                        newSidebar[0].classList.add("active");

                    }, 350); // durée de l’animation

                }, 20000);
            }

        }


        // Le reste de ton updated() (scroll destinations etc.)
        // ------------------------------------------------------
        if (!this.config || this.config.destination_scroll !== true) {
            this.shadowRoot.querySelectorAll(".destination-scroll, .rer-title-scroll")
            .forEach(el => el.style.animation = "none");
            return;
        }

        const applyScroll = (selector) => {
            this.shadowRoot.querySelectorAll(selector).forEach(scrollEl => {
            const container = scrollEl.parentElement;
            if (!container) return;

            const containerWidth = container.offsetWidth;
            const textWidth = scrollEl.scrollWidth;

            if (textWidth <= containerWidth) {
                scrollEl.style.animation = "none";
                return;
            }

            const extra = 20;
            const distance = (textWidth + extra) - containerWidth;

            const speed = 5;
            const duration = distance / speed;

            scrollEl.style.setProperty("--scroll-distance", `-${distance}px`);
            scrollEl.style.setProperty("--scroll-duration", `${duration}s`);
            scrollEl.style.animation =
                `destination-scroll-pingpong var(--scroll-duration) ease-in-out infinite`;
            });
        };

        applyScroll(".destination-scroll");
        applyScroll(".rer-title-scroll");
    }

    _updateVerticalScroll() {
        const root = this.shadowRoot;
        if (!root) return;

        const textBlocks = Array.from(root.querySelectorAll(".idf-message-text"));
        const container = root.querySelectorAll(".idf-message-container");

        textBlocks.forEach(block => {
            const visibleHeight = container[0].clientHeight;
            const fullHeight = block.scrollHeight;
            const extra = 30;

            if (fullHeight > visibleHeight) {
                // Marge pour éviter la coupure
                const distance = (fullHeight - visibleHeight) + extra;

                // Scroll lent : 20 px/s
                const speed = 20;

                // Temps de descente
                const scrollTime = distance / speed;

                // Pause haut (3s) + pause bas (2s)
                const pauseTime = 3 + 2;

                // Durée totale
                const duration = scrollTime + pauseTime;

                block.style.setProperty("--scroll-distance", `-${distance}px`);
                block.style.setProperty("--scroll-duration", `${duration}s`);

                block.classList.add("scroll-vertical");
            } else {
                block.classList.remove("scroll-vertical");
            }
        });
    }

    _attachCarouselClickHandler() {
        const root = this.shadowRoot;
        if (!root) return;

        const container = root.querySelector(".idf-message-container");
        if (!container) return;

        const modeImg = root.querySelector(".current-mode-icon");
        const imagesUrl = new URL('images/', import.meta.url).href
        // 🟥 Si un ancien listener existe, on le retire
        if (this._carouselClickHandler) {
            container.removeEventListener("click", this._carouselClickHandler);
        }

        // 🟩 Nouveau listener
        this._carouselClickHandler = (ev) => {
            const tab = ev.target.closest(".idf-message-tab");
            const sidebarItem = ev.target.closest(".idf-message-sidebar-item");

            if (!tab && !sidebarItem) return;

            const tabs = Array.from(root.querySelectorAll(".idf-message-tab"));
            const sidebar = Array.from(root.querySelectorAll(".idf-message-sidebar-item"));

            // 🟩 Index réel dans le DOM
            const index = tab
                ? tabs.indexOf(tab)
                : sidebar.indexOf(sidebarItem);

            if (index < 0) return;

            const sidebarContainer = root.querySelector(".idf-message-sidebar");
            const contentContainer = root.querySelector(".idf-message-content");

            // 🟦 Repositionner le DOM
            for (let i = 0; i < index; i++) {
                sidebarContainer.appendChild(sidebar[i]);
                contentContainer.appendChild(tabs[i]);
            }

            // 🟦 Re-sélectionner les éléments
            const newTabs = Array.from(root.querySelectorAll(".idf-message-tab"));
            const newSidebar = Array.from(root.querySelectorAll(".idf-message-sidebar-item"));

            // 🟦 Activer le premier
            newTabs.forEach(t => t.classList.remove("active"));
            newSidebar.forEach(s => s.classList.remove("active"));

            newTabs[0].classList.add("active");
            newSidebar[0].classList.add("active");

            // 🟦 Mettre à jour le header
            const mode = newTabs[0].getAttribute("data-line-mode");
            if (mode) modeImg.src = `${imagesUrl}${mode}.png`;

            this._updateVerticalScroll();
        };

        // 🟩 Attacher le nouveau listener
        container.addEventListener("click", this._carouselClickHandler);
    }


    static get properties() {
        return {
            hass: {},
            config: {},
            _carouselIndex: { type: Number }
        };
    }

    constructor() {
        super();
        this._carouselIndex = 0;
    }




    /********************************************************
    **                                                     **
    **              GLOBAL CARD CONFIGURATION              **
    **                                                     **
    *********************************************************/
    setConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define an entity");
        }
        this.config = {
            maxTabs: config.max_tabs ?? 3,
            ...config
        };
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entity.length + 1;
    }

    static async getConfigElement() {
        await import("./idf-mobilite-card-editor.js");
        return document.createElement("idf-mobilite-card-editor");
    }
}
customElements.define("idf-mobilite-card", IDFMobiliteCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'idf-mobilite-card',
  name: 'Ile de France Mobilité',
  preview: false,
  description: 'Lovelace Card to show all types of upcoming vehicles on the Ile de France Mobilite network',
});