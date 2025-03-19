const fireEvent = (node, type, detail, options) => {
    options = options || {};
    detail = detail === null || detail === undefined ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
};

const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// First we get an entities card element
const cardHelpers = await window.loadCardHelpers();
const entitiesCard = await cardHelpers.createCardElement({ type: "entities", entities: [] }); // A valid config avoids errors

// Then we make it load its editor through the static getConfigElement method
entitiesCard.constructor.getConfigElement();

class IDFMobiliteCardEditor extends LitElement {

    constructor() {
        super(...arguments);
        this._configArray = [];
    }

    setConfig(config) {
      this._config = { ...config };
    }

    static get properties() {
        return { hass: {}, _config: {} };
    }

    get _entity() {
        return this._config.entity || "";
    }

    get _second_entity() {
      return this._config.second_entity || "";
   }

    get _messages() {
      return this._config.messages || "";
    }

    get _lineType() {
      return this._config.lineType || "";
    }

    get _show_screen() {
      return this._config.show_screen || false;
    }

    get _wall_panel() {
      return this._config.wall_panel || false;
    }

    get _show_station_name() {
      return this._config.show_station_name === undefined ? true : this._config.show_station_name;
    }

    get _display_info_message() {
      return this._config.display_info_message || false;
    }

    get _display_commercial_message() {
      return this._config.display_commercial_message || false;
    }

    get _no_messages_scroll() {
      return this._config.no_messages_scroll || false;
    }

    get _exclude_lines() {
      return this._config.exclude_lines || "";
    }

    get _exclude_lines_ref() {
      return this._config.exclude_lines_ref || "";
    }

    get _exclude_second_lines() {
      return this._config.exclude_second_lines || "";
    }

    get _exclude_second_lines_ref() {
      return this._config.exclude_second_lines_ref || "";
    }

    get _show_train_ref() {
      return this._config.show_train_ref || false;
    }

    get _show_bus_stop_label() {
      return this._config.show_bus_stop_label === undefined ? false : this._config.show_bus_stop_label;
    }

    get _show_replacement_bus() {
      return this._config.show_replacement_bus === undefined ? false : this._config.show_replacement_bus;
    }

    get _nb_departure_first_line() {
      return this._config.nb_departure_first_line || "";
    }

    get _nb_departure_second_line() {
      return this._config.nb_departure_second_line || "";
    }

    get _show_hour_departure_first_line() {
      return this._config.show_hour_departure_first_line|| false;
    }

    get _show_hour_departure_second_line() {
      return this._config.show_hour_departure_second_line|| false;
    }

    get _show_hour_departure_index_first_line() {
      return this._config.show_hour_departure_index_first_line|| "";
    }

    get _show_hour_departure_index_second_line() {
      return this._config.show_hour_departure_second_first_line|| "";
    }

    get _show_departure_platform_first_line() {
      return this._config.show_departure_platform_first_line|| false;
    }

    get _show_departure_platform_second_line() {
      return this._config.show_departure_platform_second_line|| false;
    }

    get _group_destination_first_line() {
      return this._config.group_destination_first_line|| false;
    }

    get _group_destination_second_line() {
      return this._config.group_destination_second_line|| false;
    }

    get _group_destination_name_first_line() {
      return this._config.group_destination_name_first_line|| "";
    }

    get _group_destination_name_second_line() {
      return this._config.group_destination_name_second_line|| "";
    }

    render() {
        if (!this.hass) {
          return html``;
        }

      return html`
            <div class="card-config">
                <div class="side-by-side">
                    <h2>Type d'Arrêt</h2>
                    <ha-select
                        label="Type"
                        .hass="${this.hass}"
                        .value="${this._lineType}"
                        .configValue=${"lineType"}
                        @selected="${this._valueChanged}"
                        @closed="${e => e.stopPropagation()}"
                        >
                        <ha-list-item value="RER">RER/SNCF</ha-list-item>
                        <ha-list-item value="BUS">Bus/Tram/Métro</ha-list-item>
                    </ha-select>
                    ${this._config.lineType == 'RER' ?
                      html`
                        <div>
                          <span>Afficher les bus de replacement</span>
                          <ha-switch
                              .checked=${this._show_replacement_bus}
                              .configValue="${"_show_replacement_bus"}"
                              @change="${this._valueChanged}"
                              ></ha-switch>
                        </div>` : ''}
                    <h2>Premier Arrêt</h2>
                    <ha-entity-picker
                        label="Arrêt (RESTFul sensor)"
                        .hass="${this.hass}"
                        .value="${this._entity}"
                        .configValue=${"entity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <h4>Filtrage des données :</h4>
                    <ha-textfield
                      label="Exclure les lignes (ex: bus-206;metro-1;tram-T2;rer-A;train-R;)"
                      .value="${this._exclude_lines}"
                      .configValue=${"exclude_lines"}
                      @input="${this._valueChanged}"
                    ></ha-textfield>
                    <ha-textfield
                      label="Exclure les destinations (ex: 458755;5655442;)"
                      .value="${this._exclude_lines_ref}"
                      .configValue=${"exclude_lines_ref"}
                      @input="${this._valueChanged}"
                    ></ha-textfield>
                    ${this._config.lineType == 'RER' ?
                      html`
                        <h4>Options d'affichage :</h4>
                        <ha-textfield
                            label="Nombre de départs à afficher (si vide = tous)"
                            .value="${this._nb_departure_first_line}"
                            .configValue=${"nb_departure_first_line"}
                            @input="${this._valueChanged}"
                          ></ha-textfield>
                        <div>
                          <span>Afficher l'heure de départ au lieu du delais</span>
                            <ha-switch
                                .checked=${this._show_hour_departure_first_line}
                                .configValue="${"show_hour_departure_first_line"}"
                                @change="${this._valueChanged}"
                            ></ha -switch>
                        </div>
                        ${this._config.show_hour_departure_first_line ? html`
                          <ha-textfield
                            label="Nombre de lignes où conserver le delais (si vide = aucune)"
                            .value="${this._show_hour_departure_index_first_line}"
                            .configValue=${"show_hour_departure_index_first_line"}
                            @input="${this._valueChanged}"
                          ></ha-textfield>
                        <div>`: ``}
                        <div>
                          <span>Afficher le quai de départ</span>
                          <ha-switch
                              .checked=${this._show_departure_platform_first_line}
                              .configValue="${"show_departure_platform_first_line"}"
                              @change="${this._valueChanged}"
                          ></ha -switch>
                        </div>
                        <div>
                          <span>Grouper les destinations</span>
                          <ha-switch
                              .checked=${this._group_destination_first_line}
                              .configValue="${"group_destination_first_line"}"
                              @change="${this._valueChanged}"
                          ></ha -switch>
                        </div>
                        ${this._config.group_destination_first_line ? html`
                          <ha-textfield
                            label="Libellé de la destination (si vide = toutes)"
                            .value="${this._group_destination_name_first_line}"
                            .configValue=${"group_destination_name_first_line"}
                            @input="${this._valueChanged}"
                          ></ha-textfield>
                        <div>`: ``}` : ''}
                    <h2>Second Arrêt (optionel)</h2>
                    <ha-entity-picker
                      label="Arrêt (RESTFul sensor)"
                      .hass="${this.hass}"
                      .value="${this._second_entity}"
                      .configValue=${"second_entity"}
                      @value-changed="${this._valueChanged}"
                      ></ha-entity-picker>
                    <h4>Filtrage des données :</h4>
                    <ha-textfield
                      label="Exclure les lignes (ex: bus-206;metro-1;tram-T2;rer-A;train-R;)"
                      .value="${this._exclude_second_lines}"
                      .configValue=${"exclude_second_lines"}
                      @input="${this._valueChanged}"
                    ></ha-textfield>
                    <ha-textfield
                      label="Exclure les destinations (ex: 458755;5655442;)"
                      .value="${this._exclude_second_lines_ref}"
                      .configValue=${"exclude_second_lines_ref"}
                      @input="${this._valueChanged}"
                    ></ha-textfield>
                    ${this._config.lineType == 'RER' ?
                      html`
                        <h4>Options d'affichage :</h4>
                        <ha-textfield
                                label="Nombre de départs à afficher (si vide = tous)"
                                .value="${this._nb_departure_second_line}"
                                .configValue=${"nb_departure_second_line"}
                                @input="${this._valueChanged}"
                              ></ha-textfield>
                        <div>
                          <span>Afficher l'heure de départ au lieu du delais</span>
                              <ha-switch
                                  .checked=${this._show_hour_departure_second_line}
                                  .configValue="${"show_hour_departure_second_line"}"
                                  @change="${this._valueChanged}"
                              ></ha -switch>
                        </div>
                        ${this._config.show_hour_departure_second_line ? html`
                          <ha-textfield
                            label="Nombre de lignes où conserver le delais (si vide = aucune)"
                            .value="${this._show_hour_departure_index_second_line}"
                            .configValue=${"show_hour_departure_index_second_line"}
                            @input="${this._valueChanged}"
                          ></ha-textfield>
                        <div>`: ``}
                        <div>
                          <span>Afficher le quai de départ</span>
                          <ha-switch
                              .checked=${this._show_departure_platform_second_line}
                              .configValue="${"show_departure_platform_second_line"}"
                              @change="${this._valueChanged}"
                          ></ha -switch>
                        </div>
                        <div>
                          <span>Grouper les destinations</span>
                          <ha-switch
                              .checked=${this._group_destination_second_line}
                              .configValue="${"group_destination_second_line"}"
                              @change="${this._valueChanged}"
                          ></ha -switch>
                        </div>
                        ${this._config.group_destination_second_line ? html`
                          <ha-textfield
                            label="Libellé de la destination (si vide = toutes)"
                            .value="${this._group_destination_name_second_line}"
                            .configValue=${"group_destination_name_second_line"}
                            @input="${this._valueChanged}"
                          ></ha-textfield>
                        <div>`: ``}` : ''}
                    <h2>Messages d'information / perturbations (optionel)</h2>
                    <ha-entity-picker
                        label="Messages (RESTFul sensor)"
                        .hass="${this.hass}"
                        .value="${this._messages}"
                        .configValue=${"messages"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <div>
                        <span>Afficher les messages d'information</span>
                        <ha-switch
                            .checked=${this._display_info_message}
                            .configValue="${"display_info_message"}"
                            @change="${this._valueChanged}"
                            ></ha-switch>
                    </div>
                    <div>
                        <span>Afficher les messages commerciaux</span>
                        <ha-switch
                            .checked=${this._display_commercial_message}
                            .configValue="${"display_commercial_message"}"
                            @change="${this._valueChanged}"
                            ></ha-switch>
                    </div>
                    <div>
                        <span>Ne pas faire défiler les messages</span>
                        <ha-switch
                            .checked=${this._no_messages_scroll}
                            .configValue="${"no_messages_scroll"}"
                            @change="${this._valueChanged}"
                            ></ha-switch>
                    </div>
                    <h2>Options générales d'affichage</h2>
                    <div>
                      <span>Mode écran</span>
                      <ha-switch
                          .checked=${this._show_screen}
                          .configValue="${"show_screen"}"
                          @change="${this._valueChanged}"
                          ></ha-switch>
                    </div>
                    <div>
                      <span>Nom de la station</span>
                      <ha-switch
                          .checked=${this._show_station_name}
                          .configValue="${"show_station_name"}"
                          @change="${this._valueChanged}"
                          ></ha-switch>
                    </div>
                    <div>
                      <span>Mode sans bordure (pour wall-panel sur fond noir)</span>
                      <ha-switch
                          .checked=${this._wall_panel}
                          .configValue="${"wall_panel"}"
                          @change="${this._valueChanged}"
                          ></ha-switch>
                    </div>
                    ${this._config.lineType == 'BUS' ?
                      html`
                      <div>
                        <span>Afficher "à l'approche/à l'arrêt" au lieu de "0"</span>
                        <ha-switch
                            .checked=${this._show_bus_stop_label}
                            .configValue="${"show_bus_stop_label"}"
                            @change="${this._valueChanged}"
                            ></ha-switch>
                      </div>` : ''}
                    </div>
                    <h2>Aide à la configuration</h2>
                    <div>
                      <div>
                        <span>Afficher les références des destinations pour les filtres</span>
                        <ha-switch
                            .checked=${this._show_train_ref}
                            .configValue="${"show_train_ref"}"
                            @change="${this._valueChanged}"
                            ></ha-switch>
                      </div>
                    </div>
                </div>
          </div>
          `;
    }

    configChanged(newConfig) {
      const event = new Event("config-changed", {
        bubbles: true,
        composed: true,
      });
      event.detail = { config: newConfig };
      this.dispatchEvent(event);
    }

    _valueChanged(ev) {
        if (!this._config || !this.hass) {
          return;
        }
        const target = ev.target;
        if (this[`_${target.configValue}`] === target.value) {
          return;
        }
        if (target.configValue) {
          if (!target.checked && target.value === "") {
            delete this._config[target.configValue];
          } else {
            this._config = {
              ...this._config,
              [target.configValue]: target.checked !== undefined ? target.checked : target.value
            };
          }
        }
        fireEvent(this, "config-changed", { config: this._config });
    }

    static get styles() {
        return css`
            ha-entity-picker {
              display: block;
              margin-bottom: 16px;
            }
            ha-select {
              display: block;
              margin-bottom: 16px;
            }
            ha-textfield {
              display: block;
              margin-bottom: 16px;
            }
            ha-switch {
              margin-top: 10px;
              margin-bottom: 10px;
            }
            .switch {
              display: flex;
              justify-content: space-around;
            }
        `;
    }
}


customElements.define("idf-mobilite-card-editor", IDFMobiliteCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
    type: "idf-mobilite-card",
    name: "IDF Mobilite Card",
    preview: false, // Optional - defaults to false
    description: "Card to display next train/bus for IDF Mobilité", // Optional
});