import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail ?? {};
  const event = new Event(type, {
    bubbles: options.bubbles ?? true,
    cancelable: Boolean(options.cancelable),
    composed: options.composed ?? true,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

const cardHelpers = await window.loadCardHelpers();
const entitiesCard = await cardHelpers.createCardElement({
  type: "entities",
  entities: [],
});
entitiesCard.constructor.getConfigElement();

class IDFMobiliteCardEditor extends LitElement {
  constructor() {
    super();
    this._configArray = [];
    this.currentPage = "first";
  }

  static get properties() {
    return { hass: {}, _config: {} };
  }

  setConfig(config) {
    this._config = { ...config };
  }

  showPage(pageName) {
    this.currentPage = pageName;
    this.requestUpdate();
  }

  /* -------------------------
     GETTERS
  ------------------------- */

  get _entity() { return this._config.entity || ""; }
  get _second_entity() { return this._config.second_entity || ""; }
get _messages() {
  return Array.isArray(this._config.messages)
    ? this._config.messages
    : [];
}
  get _filter_messages() { return this._config.filter_messages || ""; }
  get _lineType() { return this._config.lineType || "RER"; }

  get _show_screen() { return this._config.show_screen || false; }
  get _wall_panel() { return this._config.wall_panel || false; }
  get _show_station_name() { return this._config.show_station_name ?? true; }

  get _display_info_message() { return this._config.display_info_message || false; }
  get _display_delays_message() { return this._config.display_delays_message || false; }
  get _display_no_service_message() { return this._config.display_no_service_message || false; }
  get _no_messages_scroll() { return this._config.no_messages_scroll || false; }

  get _exclude_lines() { return this._config.exclude_lines || ""; }
  get _exclude_lines_ref() { return this._config.exclude_lines_ref || ""; }
  get _included_destination() { return this._config.included_destination || ""; }
  get _show_only_included() { return this._config.show_only_included || false; }

  get _exclude_second_lines() { return this._config.exclude_second_lines || ""; }
  get _exclude_second_lines_ref() { return this._config.exclude_second_lines_ref || ""; }
  get _included_second_lines_destination() { return this._config.included_second_lines_destination || ""; }
  get _show_only_included_second_lines() { return this._config.show_only_included_second_lines || false; }

  get _show_train_ref() { return this._config.show_train_ref || false; }

  get _show_bus_stop_label() { return this._config.show_bus_stop_label ?? false; }
  get _display_third_stop() { return this._config.display_third_stop ?? false; }
  get _show_replacement_bus() { return this._config.show_replacement_bus ?? false; }

  get _nb_departure_first_line() { return this._config.nb_departure_first_line || ""; }
  get _nb_departure_second_line() { return this._config.nb_departure_second_line || ""; }

  get _max_delay_first_line() { return this._config.max_delay_first_line || ""; }
  get _max_delay_second_line() { return this._config.max_delay_second_line || ""; }

  get _show_hour_departure_first_line() { return this._config.show_hour_departure_first_line || false; }
  get _show_hour_departure_second_line() { return this._config.show_hour_departure_second_line || false; }

  get _show_hour_departure_index_first_line() { return this._config.show_hour_departure_index_first_line || ""; }
  get _show_hour_departure_index_second_line() { return this._config.show_hour_departure_index_second_line || ""; }

  get _show_departure_platform_first_line() { return this._config.show_departure_platform_first_line || false; }
  get _show_departure_platform_second_line() { return this._config.show_departure_platform_second_line || false; }

  get _group_destination_first_line() { return this._config.group_destination_first_line || false; }
  get _group_destination_second_line() { return this._config.group_destination_second_line || false; }

  get _group_destination_name_first_line() { return this._config.group_destination_name_first_line || ""; }
  get _group_destination_name_second_line() { return this._config.group_destination_name_second_line || ""; }

  get _destination_scroll() { return this._config.destination_scroll || false; }

  /* ----------------------------------------------------
     RENDER PRINCIPAL
  ---------------------------------------------------- */
  render() {
    if (!this.hass || !this._config) return html``;

    return html`
      <div class="card-config">
        <div class="side-by-side">

          <h3>Type d'Arrêt</h3>
          ${this._renderLineTypeSelector()}

          ${this._lineType === "RER"
            ? this._renderReplacementBusOption()
            : ""}

          <br/>
          ${this._renderTabs()}
          <div class="page-container ${this.currentPage === 'first' ? 'active' : ''}">
            ${this._renderFirstPage()}
          </div>
           <div class="page-container ${this.currentPage === 'second' ? 'active' : ''}">
          ${this._renderSecondPage()}
          </div>
          <div class="page-container ${this.currentPage === 'message' ? 'active' : ''}">
            ${this._renderMessagePage()}
          </div>
          <hr/>
          ${this._renderGeneralOptions()}
          <hr/>
          ${this._renderHelpOptions()}

        </div>
      </div>
    `;
  }

  /* ----------------------------------------------------
     SOUS-FONCTIONS PRINCIPALES
  ---------------------------------------------------- */

  _renderLineTypeSelector() {
    return html`
      <div class="form-row">
        <select
          class="ha-like-select"
          .value=${this._lineType}
          @change=${this._onLineTypeChanged}
        >
          <option value="RER">RER/SNCF</option>
          <option value="BUS">Bus/Tram/Métro</option>
        </select>
      </div>
    `;
  }

  _renderReplacementBusOption() {
    return html`
      <ha-formfield label="Afficher les bus de replacement">
        <ha-switch
          .checked=${this._show_replacement_bus}
          .configValue=${"show_replacement_bus"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
    `;
  }

  _renderBusExclusionSwicthFirst() {
  return html`
    <div>
        <span style="vertical-align: super;padding-right:5px;">Exclure ces destinations</span>
        <ha-switch
          .checked=${this._show_only_included}
          .configValue=${"show_only_included"}
          @change=${this._valueChanged}
        ></ha-switch>
        <span style="vertical-align: super;padding-right:5px;">&nbsp;&nbsp;Inclure ces destinations</span>
      </div>
  `;
  }

  _renderBusExclusionSwicthSecond() {
    return html`
    <div>
          <span style="vertical-align: super;padding-right:5px;">Exclure ces destinations</span>
          <ha-switch
            .checked=${this._show_only_included_second_lines}
            .configValue=${"show_only_included_second_lines"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span style="vertical-align: super;padding-right:5px;">&nbsp;&nbsp;Inclure ces destinations</span>
        </div>
  `;
  }


  _renderTabs() {
    return html`
      <sl-tab-group>
        <sl-tab
          slot="nav"
          panel="first"
          class=${this.currentPage === "first" ? "active-tab" : ""}
          @click=${() => this.showPage("first")}
        >
          Premier Arrêt
        </sl-tab>

        <sl-tab
          slot="nav"
          panel="second"
          class=${this.currentPage === "second" ? "active-tab" : ""}
          @click=${() => this.showPage("second")}
        >
          Second Arrêt (option)
        </sl-tab>

        <sl-tab
          slot="nav"
          panel="message"
          class=${this.currentPage === "message" ? "active-tab" : ""}
          @click=${() => this.showPage("message")}
        >
          Messages (option)
        </sl-tab>
      </sl-tab-group>
    `;
  }

  getRestSiriSensors() {
    return Object.keys(this.hass.states).filter(id => {
      const entity = this.hass.states[id];
      return (
        id.startsWith("sensor.") &&
        entity.attributes?.Siri !== undefined
      );
    });
  }

  getRestMessageSensors() {
    return Object.keys(this.hass.states).filter(id => {
      const entity = this.hass.states[id];
      return (
        id.startsWith("sensor.") &&
        entity.attributes?.disruptions !== undefined
      );
    });
  }


  /* ----------------------------------------------------
     PAGE 1 — PREMIER ARRÊT
  ---------------------------------------------------- */
  _renderFirstPage() {
    return html`
        <ha-entity-picker
          .includeEntities=${this.getRestSiriSensors()}
          .hass=${this.hass}
          .value=${this._entity}
          .configValue=${"entity"}
          @value-changed=${this._valueChanged}
        ></ha-entity-picker>

        <h4>Filtrage des données :</h4>
        ${this._lineType === "BUS" ? this._renderBusExclusionSwicthFirst() : ""}
        <ha-input
          label="Lignes (ex: bus-210;metro-11)"
          .value=${this._exclude_lines}
          .configValue=${"exclude_lines"}
          @input=${this._valueChanged}
        ></ha-input>

        <ha-input
          label="Références de lignes"
          .value=${this._exclude_lines_ref}
          .configValue=${"exclude_lines_ref"}
          @input=${this._valueChanged}
        ></ha-input>

        ${this._lineType === "RER" ? this._renderRerOptionsFirst() : ""}
    `;
  }

  /* ----------------------------------------------------
     PAGE 2 — SECOND ARRÊT
  ---------------------------------------------------- */
  _renderSecondPage() {
    return html`
        <ha-entity-picker
          .includeEntities=${this.getRestSiriSensors()}
          .hass=${this.hass}
          .value=${this._second_entity}
          .configValue=${"second_entity"}
          @value-changed=${this._valueChanged}
        ></ha-entity-picker>

        <h4>Filtrage des données :</h4>
        ${this._lineType === "BUS" ? this._renderBusExclusionSwicthSecond() : ""}
        <ha-input
          label="Exclure les lignes"
          .value=${this._exclude_second_lines}
          .configValue=${"exclude_second_lines"}
          @input=${this._valueChanged}
        ></ha-input>

        <ha-input
          label="Exclure les références de lignes"
          .value=${this._exclude_second_lines_ref}
          .configValue=${"exclude_second_lines_ref"}
          @input=${this._valueChanged}
        ></ha-input>

        ${this._lineType === "RER" ? this._renderRerOptionsSecond() : ""}
    `;
  }

  /* ----------------------------------------------------
     PAGE 3 — MESSAGES
  ---------------------------------------------------- */
  _renderMessagePage() {
    return html`
        <ha-form
          .hass=${this.hass}
          .data=${{
            messages: this._messages,
            filter_messages: this._filter_messages,
            display_info_message: this._display_info_message,
            display_commercial_message: this._display_commercial_message,
            no_messages_scroll: this._no_messages_scroll
          }}
          .schema=${this._schemaMessages()}
          @value-changed=${this._valueChangedForm}
        ></ha-form>
        <br/>
        <ha-input
          label="Filtrer les messages"
          .value=${this._filter_messages}
          .configValue=${"filter_messages"}
          @input=${this._valueChanged}
        ></ha-input>
        <ha-formfield label="Afficher les perturbations">
          <ha-switch
            .checked=${this._display_delays_message}
            .configValue=${"display_delays_message"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <br/>
        <ha-formfield label="Afficher les alertes">
          <ha-switch
            .checked=${this._display_no_service_message}
            .configValue=${"display_no_service_message"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <br/>
        <ha-formfield label="Afficher les messages d'information">
          <ha-switch
            .checked=${this._display_info_message}
            .configValue=${"display_info_message"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <br/>
        <ha-formfield label="Ne pas faire défiler les messages">
          <ha-switch
            .checked=${this._no_messages_scroll}
            .configValue=${"no_messages_scroll"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
    `;
  }
  _schemaMessages() {
  return [
    {
      name: "Liste des entité Messages",
      label: "Messages (RESTFul sensors)",
      selector: {
        entity: {
          multiple: true,
          include_entities: this.getRestMessageSensors()
        }
      }
    },
  ];
}
  _valueChangedForm(ev) {
  ev.stopPropagation();
  const newConfig = { ...this._config, ...ev.detail.value };
  this._config = newConfig;

  this.dispatchEvent(
    new CustomEvent("config-changed", { detail: { config: this._config } })
  );
}

  /* ----------------------------------------------------
     OPTIONS GÉNÉRALES
  ---------------------------------------------------- */
  _renderGeneralOptions() {
    return html`
      <h3>Options générales d'affichage</h3>
      <ha-formfield label="Mode écran">
        <ha-switch
          .checked=${this._show_screen}
          .configValue=${"show_screen"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
        <ha-formfield label="Nom de la station">
        <ha-switch
          .checked=${this._show_station_name}
          .configValue=${"show_station_name"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      <ha-formfield label="Mode sans bordure">
        <ha-switch
          .checked=${this._wall_panel}
          .configValue=${"wall_panel"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
        <ha-formfield label="Activer le scroll des destinations">
          <ha-switch
            .checked=${this._destination_scroll}
            .configValue=${"destination_scroll"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
      <br/>
      ${this._lineType === "BUS" ? html`
        <ha-formfield label="Afficher 'à l'approche/à l'arrêt'">
          <ha-switch
            .checked=${this._show_bus_stop_label}
            .configValue=${"show_bus_stop_label"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <br/>
        <ha-formfield label="Afficher 3 départs au lie de 2">
          <ha-switch
            .checked=${this._display_third_stop}
            .configValue=${"display_third_stop"}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
      ` : ""}
    `;
  }

  /* ----------------------------------------------------
     AIDE À LA CONFIGURATION
  ---------------------------------------------------- */
  _renderHelpOptions() {
    return html`
      <h3>Aide à la configuration</h3>
      <ha-formfield label="Afficher les références des lignes">
        <ha-switch
          .checked=${this._show_train_ref}
          .configValue=${"show_train_ref"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
    `;
  }

  /* ----------------------------------------------------
     SOUS-FONCTIONS RER — PREMIER ARRÊT
  ---------------------------------------------------- */
  _renderRerOptionsFirst() {
    return html`
      <h4>Options d'affichage :</h4>

      <ha-input
        label="Nombre de départs à afficher (si vide = tous)"
        .value=${this._nb_departure_first_line}
        .configValue=${"nb_departure_first_line"}
        @input=${this._valueChanged}
      ></ha-input>

      <ha-input
        label="Délai maximum (ex: 90 — défaut 60)"
        .value=${this._max_delay_first_line}
        .configValue=${"max_delay_first_line"}
        @input=${this._valueChanged}
      ></ha-input>

      <ha-formfield label="Afficher l'heure de départ au lieu du délai">
        <ha-switch
          .checked=${this._show_hour_departure_first_line}
          .configValue=${"show_hour_departure_first_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      ${this._show_hour_departure_first_line ? html`
        <ha-input
          label="Nombre de lignes où conserver le délai"
          .value=${this._show_hour_departure_index_first_line}
          .configValue=${"show_hour_departure_index_first_line"}
          @input=${this._valueChanged}
        ></ha-input>
      ` : ""}

      <ha-formfield label="Afficher le quai de départ">
        <ha-switch
          .checked=${this._show_departure_platform_first_line}
          .configValue=${"show_departure_platform_first_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      <ha-formfield label="Grouper les destinations">
        <ha-switch
          .checked=${this._group_destination_first_line}
          .configValue=${"group_destination_first_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      ${this._group_destination_first_line ? html`
        <ha-input
          label="Libellé de la destination (si vide = toutes)"
          .value=${this._group_destination_name_first_line}
          .configValue=${"group_destination_name_first_line"}
          @input=${this._valueChanged}
        ></ha-input>
      ` : ""}
    `;
  }

  /* ----------------------------------------------------
     SOUS-FONCTIONS RER — SECOND ARRÊT
  ---------------------------------------------------- */
  _renderRerOptionsSecond() {
    return html`
      <h4>Options d'affichage :</h4>

      <ha-input
        label="Nombre de départs à afficher (si vide = tous)"
        .value=${this._nb_departure_second_line}
        .configValue=${"nb_departure_second_line"}
        @input=${this._valueChanged}
      ></ha-input>

      <ha-input
        label="Délai maximum (ex: 90 — défaut 60)"
        .value=${this._max_delay_second_line}
        .configValue=${"max_delay_second_line"}
        @input=${this._valueChanged}
      ></ha-input>

      <ha-formfield label="Afficher l'heure de départ au lieu du délai">
        <ha-switch
          .checked=${this._show_hour_departure_second_line}
          .configValue=${"show_hour_departure_second_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      ${this._show_hour_departure_second_line ? html`
        <ha-input
          label="Nombre de lignes où conserver le délai"
          .value=${this._show_hour_departure_index_second_line}
          .configValue=${"show_hour_departure_index_second_line"}
          @input=${this._valueChanged}
        ></ha-input>
      ` : ""}

      <ha-formfield label="Afficher le quai de départ">
        <ha-switch
          .checked=${this._show_departure_platform_second_line}
          .configValue=${"show_departure_platform_second_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>
      <br/>
      <ha-formfield label="Grouper les destinations">
        <ha-switch
          .checked=${this._group_destination_second_line}
          .configValue=${"group_destination_second_line"}
          @change=${this._valueChanged}
        ></ha-switch>
      </ha-formfield>

      ${this._group_destination_second_line ? html`
        <ha-input
          label="Libellé de la destination (si vide = toutes)"
          .value=${this._group_destination_name_second_line}
          .configValue=${"group_destination_name_second_line"}
          @input=${this._valueChanged}
        ></ha-input>
      ` : ""}
    `;
  }
  /* ----------------------------------------------------
     CSS COMPLET
  ---------------------------------------------------- */
  static get styles() {
    return css`
      :host {
        --ha-select-border: var(--divider-color, #d0d0d0);
        --ha-select-background: var(--input-fill-color, #f7f7f7);
        --ha-select-text: var(--primary-text-color, #2b2b2b);
        --ha-select-arrow: #8a8a8a;
      }

      /* ------------------------------
         SELECT STYLE (ha-like-select)
      ------------------------------ */
      .ha-like-select {
        box-sizing: border-box;
        width: 100%;
        height: 40px;
        padding: 0 12px;
        border-radius: 4px;
        border: 1px solid var(--ha-select-border);
        background-color: var(--ha-select-background);
        color: var(--ha-select-text);
        font: inherit;
        outline: none;

        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;

        background-image:
          linear-gradient(45deg, transparent 50%, var(--ha-select-arrow) 50%),
          linear-gradient(135deg, var(--ha-select-arrow) 50%, transparent 50%);
        background-position:
          calc(100% - 18px) 16px,
          calc(100% - 12px) 16px;
        background-size: 6px 6px, 6px 6px;
        background-repeat: no-repeat;
      }

      .ha-like-select:focus {
        border-color: var(--primary-color, #03a9f4);
        box-shadow: 0 0 0 1px rgba(3, 169, 244, 0.3);
      }

      /* ------------------------------
         FORM LABELS
      ------------------------------ */
      .form-label {
        color: var(--secondary-text-color, #6c6c75);
        font-size: 0.9rem;
      }

      .form-row {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;
      }

      /* ------------------------------
         PAGE CONTAINERS
      ------------------------------ */
      .page-container {
        display: none;
      }

      .page-container.active {
        display: block;
      }

      /* ------------------------------
         HA COMPONENT SPACING
      ------------------------------ */
      ha-entity-picker,
      ha-select,
      ha-input {
        display: block;
        margin-bottom: 16px;
      }

      ha-switch {
        margin-top: 10px;
        margin-bottom: 10px;
      }

      /* ------------------------------
         TABS (Shoelace) — STYLE HA
      ------------------------------ */
      sl-tab-group {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0;
        border-bottom: 1px solid var(--divider-color);
        margin-bottom: 12px;
        padding: 0;
      }

      sl-tab {
        display: inline-flex !important;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 0 16px;
        height: 48px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
        text-transform: none;
        border-bottom: 2px solid transparent;
      }

      sl-tab:hover {
        background: rgba(0, 0, 0, 0.05);
      }

      @media (prefers-color-scheme: dark) {
        sl-tab:hover {
          background: rgba(255, 255, 255, 0.05);
        }
      }

      sl-tab.active-tab {
        color: var(--primary-color) !important;
        border-bottom: 2px solid var(--primary-color) !important;
      }

      /* ----------------------------------------------------
        SECTIONS REPLIABLES (style Home Assistant)
      ---------------------------------------------------- */

      .ha-section {
        border: 1px solid var(--divider-color);
        border-radius: 6px;
        margin-bottom: 16px;
        background: var(--card-background-color);
      }

      .ha-section summary {
        cursor: pointer;
        padding: 12px 14px;
        font-weight: 600;
        color: var(--primary-text-color);
        list-style: none;
        outline: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ha-section summary::-webkit-details-marker {
        display: none;
      }

      .ha-section summary::after {
        content: "▸";
        font-size: 14px;
        transition: transform 0.2s ease;
        opacity: 0.7;
      }

      .ha-section[open] summary::after {
        transform: rotate(90deg);
      }

      .section-content {
        padding: 12px 14px 16px 14px;
        border-top: 1px solid var(--divider-color);
      }
    `;
  }
  /* ----------------------------------------------------
     HANDLERS
  ---------------------------------------------------- */

  _onLineTypeChanged(ev) {
    const value = ev.target.value;

    this._config = {
      ...this._config,
      lineType: value,
    };

    fireEvent(this, "config-changed", { config: this._config });
    this.requestUpdate();
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) return;

    const target = ev.target;
    const key = target.configValue;

    if (!key) return;

    const newValue =
      target.checked !== undefined ? target.checked : target.value;

    if (this[`_${key}`] === newValue) return;

    this._config = {
      ...this._config,
      [key]: newValue,
    };

    fireEvent(this, "config-changed", { config: this._config });
    this.requestUpdate();
  }
}

/* ----------------------------------------------------
   ENREGISTREMENT DU CUSTOM ELEMENT
---------------------------------------------------- */
customElements.define("idf-mobilite-card-editor", IDFMobiliteCardEditor);
