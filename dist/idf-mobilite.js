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
                            this.config.max_delay_first_line
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
    createRERContent(lineDatas, exclude_lines, exclude_lines_ref, nb_departure, show_hour_departure, show_hour_departure_index, show_departure_platform, groupDestination, groupDestinationName, max_delay, second_entity) {
        const model = parseRerFromSiri(lineDatas, exclude_lines, exclude_lines_ref, nb_departure, groupDestination, groupDestinationName, max_delay)
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

        const noScroll = this.config.no_messages_scroll === true;


        // Calcul de la vitesse (optionnel si tu veux le garder)
        const textLength = htmlString.replace(/<[^>]*>/g, "").length;
        const textSpeed = Math.max(Math.floor(textLength / 10), 5);

        return html`
        <div class="message-div${noScroll ? "-fix" : ""}
                    ${this.config.show_screen ? "with-screen" : this.config.wall_panel ? "footer-nobg" : ""}">

            ${noScroll
            ? html`
                <div class="message-div-text-fix">
                    ${unsafeHTML(htmlString)}
                </div>
                `
            : html`
                <div class="message-div-text"
                    style="animation: ScrollMessage ${textSpeed}s linear infinite;">
                    ${unsafeHTML(htmlString)}
                </div>
                `}
        </div>
        `;
    }

    updated() {
        super.updated();

        // Scroll désactivé → on supprime tout
        if (!this.config || this.config.destination_scroll !== true) {
            this.shadowRoot.querySelectorAll(".destination-scroll, .rer-title-scroll")
            .forEach(el => el.style.animation = "none");
            return;
        }

        // Fonction interne pour appliquer le scroll
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

        // Scroll des destinations
        applyScroll(".destination-scroll");

        // Scroll des titres RER
        applyScroll(".rer-title-scroll");
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
        this.config = config;
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