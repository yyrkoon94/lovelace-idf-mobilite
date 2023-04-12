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
      this._config = config;
    }

    static get properties() {
        return { hass: {}, _config: {} };
    }

    get _entity() {
        return this._config.entity || "";
    }

    get _messages() {
      return this._config.messages || "";
  }

    get _lineType() {
        return this._config.lineType || "";
    }

    render() {
        if (!this.hass) {
          return html``;
        }

        return html`
            <div class="card-config">
                <div class="side-by-side">
                    <ha-entity-picker
                        label="Ligne"
                        .hass="${this.hass}"
                        .value="${this._entity}"
                        .configValue=${"entity"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <ha-entity-picker
                        label="Messages"
                        .hass="${this.hass}"
                        .value="${this._messages}"
                        .configValue=${"messages"}
                        @value-changed="${this._valueChanged}"
                        ></ha-entity-picker>
                    <ha-select
                        label="Line Type"
                        .hass="${this.hass}"
                        .value="${this._lineType}"
                        .configValue=${"lineType"}
                        @selected="${this._valueChanged}"
                        @closed="${e => e.stopPropagation()}"
                        >
                        <ha-list-item value="RER">RER</ha-list-item>
                        <ha-list-item value="BUS">Bus</ha-list-item>
                    </ha-select>
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
          if (target.value === "") {
            delete this._config[target.configValue];
          } else {
            this._config = {
              ...this._config,
              [target.configValue]: target.value
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