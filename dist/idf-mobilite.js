import {
    LitElement,
    html,
    css
  } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class IDFMobiliteCard extends LitElement {
    static get properties() {
        console.log("%c Lovelave - IDF Mobilité  %c 0.0.6 ", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
        return {
            hass: {},
            config: {},
        };
    }

    render() {
        if (!this.config || !this.hass) {
            return html``;
        }

        return html`
            <ha-card>
                <div class="border${this.config.show_screen === true ? "-screen" : "-screen"}">
                    <div class="idf-${this.config.show_screen === true ? "with-" : ""}screen">
                        <div class="card-content${this.config.show_screen === true ? "-with-screen" : ""}">
                            ${this.config.lineType === "RER"
                                ? this.createRERContent() : ""}
                            ${this.config.lineType === "BUS"
                                ? this.createBUSContent() : ""}
                        </div>
                        ${this.config.show_screen === true ?
                            html`
                                <div class="ratp-img">
                                    <img src="/local/community/lovelace-idf-mobilite/images/ratp.png" class="ratp-image">
                                    <div class="blink-point"></div>
                                </div>
                            `
                            : ""}
                    </div>
                </div>
            </ha-card>
        `;
    }

    createRERContent() {
        return html`
            <div>
                RER
            </div>
        `;
    }

    createBUSContent() {
        const lineDatas = this.hass.states[this.config.entity];
        const messagesList = this.hass.states[this.config.messages];
        if (!lineDatas && !lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp)
            return html``
        // Last update date
        const lastUpdateDate = new Date(Date.parse(lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp))
        const lastUpdateTime = (lastUpdateDate.getUTCHours() < 10 ? "0" + lastUpdateDate.getUTCHours() : lastUpdateDate.getUTCHours()) + ":" + (lastUpdateDate.getUTCMinutes() < 10 ? "0" + lastUpdateDate.getUTCMinutes() : lastUpdateDate.getUTCMinutes())
        // Station name (take the first stopPointName)
        const stationName = lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length>0 ?
                                lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value
                                : "API ERROR"
        // Build Line/Time
        const buses = {};
        lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(stop => {
            if (stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length >0 && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value.indexOf("Bus Estime Dans")==-1) {
                var busLine = stop.MonitoredVehicleJourney.OperatorRef.value;
                // OCTAVE, PCCMOD, STAEL = Metro, KOWM=TRAM
                if (busLine.indexOf("SAE-BUS") > 0 || busLine.indexOf("SAE-TRAM") > 0 || busLine.indexOf("OCTAVE") > 0 || busLine.indexOf("PCCMOD") > 0 || busLine.indexOf("STAEL") > 0 || busLine.indexOf("KOVM") > 0) {
                    busLine = busLine.replace("KOVM_", "SAE-TRAM.")
                    // check if the line is exclude
                    var lineRef = ""
                    var busRef = ""
                    const lineNumber = busLine.substring(busLine.lastIndexOf('.') + 1, busLine.length - 1)
                    if (busLine.indexOf("SAE-BUS") > 0) {
                        lineRef = "bus-" + lineNumber.padStart(3, 0)
                        busRef = "bus-" + lineNumber
                    }
                    if (busLine.indexOf("SAE-TRAM") > 0) {
                        lineRef = "tram-" + lineNumber
                        busRef = "tram-" + lineNumber
                    }
                    if (busLine.indexOf("OCTAVE") > 0 || busLine.indexOf("PCCMOD") > 0 || busLine.indexOf("STAEL") > 0) {
                        lineRef = "metro-" + lineNumber.padStart(2, 0)
                        busRef = "metro-" + lineNumber
                    }
                    if (!this.config.exclude_lines || this.config.exclude_lines.indexOf(busRef)==-1) {
                        const destinationName = stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value
                        if (!buses[lineRef])
                            buses[lineRef] = {}
                        if (!buses[lineRef][destinationName])
                            buses[lineRef][destinationName] = []
                        buses[lineRef][destinationName].push(Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60))
                    }
                }
                else {
                    //console.log("Ignoring line : " + busLine)
                }
            }
        });

        //Build messages
        const messages = {}
        if (messagesList && messagesList.attributes['Siri']) {
            const deliveryMessages = messagesList.attributes['Siri'].ServiceDelivery.GeneralMessageDelivery[0]
            deliveryMessages.InfoMessage.forEach(infoMessage => {
                if (!messages[infoMessage.InfoChannelRef.value])
                    messages[infoMessage.InfoChannelRef.value] = { messages: [] }
                messages[infoMessage.InfoChannelRef.value].messages.push(infoMessage.Content.Message[0].MessageText.value)
            })
        }
        return html`

                <div class="bus-header ${this.config.show_screen === true ? "with-screen" : ""}">
                    <div class="bus-station-name">
                        ${stationName.indexOf("RER") > 0 || stationName.indexOf("Métro") > 0 || stationName.indexOf("Tramway") > 0 ?
                            html`<div class="bus-destination-name">
                                    ${stationName.substring(0, stationName.indexOf("RER") > 0 ? stationName.indexOf("RER") : stationName.length).substring(0, stationName.indexOf("Métro") > 0 ? stationName.indexOf("Métro") : stationName.length).substring(0, stationName.indexOf("Tramway") > 0 ? stationName.indexOf("Tramway") : stationName.length).replace(/-$/, '')}
                                </div>
                                ${stationName.indexOf("Métro") > 0 ? html`<div class="bus-destination-img"><img src="/local/community/lovelace-idf-mobilite/images/metro_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("RER") > 0 ? html`<div class="bus-destination-img"><img src="/local/community/lovelace-idf-mobilite/images/rer_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("Tramway") > 0 ? html`<div class="bus-destination-img"><img src="/local/community/lovelace-idf-mobilite/images/tram_white.png" class="bus-destination-image"/></div>` : ""}
                            `
                            : stationName
                        }
                    </div>
                    <div class="bus-last-update">
                        <div class="bus-last-update-time">
                            ${lastUpdateTime}
                        </div>
                        <div class="bus-last-update-text">
                            Dernière mise à jour
                        </div>
                    </div>
                </div>
                <div class="bus-lines">
                    ${Object.keys(buses).sort(function(a, b) { return a.localeCompare(b)}).map(bus => {
                        return html`
                            <div class="bus-line">
                                ${Object.keys(buses[bus]).map((destination, index) => {
                                return html`
                                    <div class="bus-line-detail">
                                        <div class="bus-img">

                                            ${index === 0 ?
                                                html`<div class="bus-line-type">
                                                        <img src="/local/community/lovelace-idf-mobilite/images/${bus.substring(0, bus.indexOf('-'))}.png" class="bus-line-type-image">
                                                    </div>
                                                    <div class="bus-line-image">
                                                        <img src="/local/community/lovelace-idf-mobilite/images/${bus.substring(0, bus.indexOf('-'))}/${bus.substring(bus.indexOf('-') + 1, bus.length).replace(/^0+/, '')}.png" alt="${bus.substring(bus.indexOf('-') + 1, bus.length).replace(/^0+/, '')}" class="${bus.substring(0, bus.indexOf('-'))}-image"/>
                                                    </div>` : ""}
                                        </div>
                                        <div class="bus-destination">
                                            ${destination.indexOf("<RER>") > 0 ?
                                                html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<RER>")).endsWith("-") ? destination.substring(0, destination.indexOf("-<RER>")) : destination.substring(0, destination.indexOf("<RER>"))}</div><div class="bus-destination-img"><img src="/local/community/lovelace-idf-mobilite/images/rer.png" class="bus-destination-image"/></div>`
                                                : destination.indexOf("<METRO>") > 0 ?
                                                    html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<METRO>")).endsWith("-")?destination.substring(0, destination.indexOf("-<METRO>")):destination.substring(0, destination.indexOf("<METRO>"))}</div><div class="bus-destination-img"><img src="/local/community/lovelace-idf-mobilite/images/metro.png" class="bus-destination-image"/></div>`
                                                    : destination}
                                        </div>
                                        <div class="bus-stop">
                                            <div class="bus-stop-value">
                                                ${buses[bus][destination][0] > 0 ?
                                                            buses[bus][destination][0] :
                                                            (buses[bus][destination][0] == 0 ? "A l'approche" : "A l'arrêt")
                                                }
                                            </div>
                                        </div>
                                        <div class="bus-stop">
                                            <div class="bus-stop-value">
                                                ${buses[bus][destination][1] ? (buses[bus][destination][1] > 0 ? buses[bus][destination][1] : "") : ""}
                                            </div>
                                        </div>
                                    </div>
                                `
                                })}
                            </div>`
                    })}
                </div>
                <div class="message-div ${this.config.show_screen === true ? "with-screen" : ""}"">
                    ${Object.keys(messages).length > 0 ?
                        html`<div class="message-div-text">
                            ${Object.keys(messages).map(key => {
                                var concatMessage = "";
                                messages[key].messages.forEach((message, index) => { concatMessage += message + (index< messages[key].messages.length-1 ? " /// ": "") })
                                if (key == "Information" && this.config.display_info_message === true)
                                    return html`<img src="/local/community/lovelace-idf-mobilite/images/info.png" class="message-icon">${concatMessage}`
                                else if (key == "Perturbation")
                                    return html`<img src="/local/community/lovelace-idf-mobilite/images/warning.png" class="message-icon">${concatMessage}`
                                else if (key == "Commercial" && this.config.display_commercial_message === true)
                                    return concatMessage
                            })}</div>`
                        : ""}
                </div>

        `;
    }

    setConfig(config) {
        if (!config.entity) {
            throw new Error("You need to define entities");
        }
        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    static async getConfigElement() {
        await import("./idf-mobilite-card-editor.js");
        return document.createElement("idf-mobilite-card-editor");
    }

    static getStubConfig() {
        return {
            entities: "",
            messages: "",
            lineType: "BUS",
            show_screen: false,
            exclude_lines: ""
        }
    }

    static get styles() {
        return css`
            .idf-screen {
            }
            .border {

            }
            .border-screen {
                background: #969798;
                padding: 2px;
                border-radius: 11px;
            }
            .idf-with-screen {
                background-color:#000000;
                padding: 20px 20px 5px 20px;
                border-radius: 9px;
            }
            .with-screen {
                border-radius: 0px !important;
            }
            .blink-point {
                position: absolute;
                bottom: 16px;
                right: 35px;
                border-radius: 5px;
                width: 5px;
                height: 5px;
                background: #D3833A;
                animation: blinker 5s linear infinite;
            }
            .card-content {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 0px;
                background-color:#516077;
                border-radius: 9px;
            }
            .card-content-with-screen {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 0px;
                background-color:#516077;
                min-height: 300px;
            }
            .bus-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 4px solid #070572;
                background-color: #FFFFFF;
                border-radius: 9px 9px 0px 0px;
                margin-bottom: 4px;
            }
            .bus-station-name {
                display: flex;
                align-self: center;
                background-color: #070572;
                color: rgb(255, 255, 255);
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
            }
            .bus-last-update {
                display: flex;
                flex-direction:column;
                margin-right: 12px;
            }
            .bus-last-update-time {
                display: flex;
                align-self: center;
                background: #000000;
                font-size: 18px;
                font-weight: bold;
                color: #CAA94C;
                padding: 2px 5px 5px 5px;
                border-radius: 0px 0px 5px 5px;
            }
            .bus-last-update-text {
                display: flex;
                font-size: 8px;
                color: #000000;
                margin-top: -2px;
            }
            .bus-lines {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }
            .bus-line {
                display: flex;
                justify-content: space-between;
                flex-direction:column;
                margin: 4px 0px;
                background-color: #FFFFFF;
            }
            .bus-line-detail {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                background-color: #FFFFFF;
                height:40px;
                padding-right: 10px;
            }
            .bus-img {
                display: flex;
                flex: 1;
                justify-content: space-between;
                min-width: 62px;
                margin-right: 4px;
            }
            .bus-line-type {
                display: flex;
                opacity: 0.33;
            }
            .bus-line-type-image {
                height: 25px;
            }
            .bus-line-image {
                display:flex;
                flex-grow: 1;
                align-items: center;
                justify-content: center;
            }
            .bus-image {
                height: 25px;
            }
            .tram-image {
                height: 25px;
            }
            .metro-image {
                height: 30px;
            }
            .bus-destination {
                display: flex;
                flex: 6 ;
                align-self: center;
                color: #070572;
                font-size: 18px;
                font-weight: bold;
            }
            .bus-destination-name {
                display: flex;
                align-items: center;
            }
            .bus-destination-img {
                display: flex;
                flex: 1;
                align-items: center;
                margin-left: 5px;
            }
            .bus-destination-image {
                height: 20px;
            }
            .bus-stop {
                display: flex;
                flex: 1;
                align-self: center;
                justify-content: end;
            }
            .bus-stop-value {
                background: #000000;
                font-size: 18px;
                font-weight: bold;
                color: #CAA94C;
                padding: 2px 5px 5px 5px;
                border-radius: 5px;
                text-align: center;
                white-space: nowrap;
                min-width: 20px;
            }
            .message-div {
                display: flex;
                justify-content: center;
                overflow-x: auto;
                height: 20px;
                border-radius: 0px 0px 9px 9px;
                background-color: #FFFFFF;
                color: #000000;
                padding-left: 10px;
                padding-right: 10px;
                margin-top: 8px;
            }
            .message-div-text {
                display: flex;
                justify-content: right;
                flex-grow: 1;
                white-space: nowrap;
                animation: ScrollMessage 60s linear infinite;
            }
            .message-icon {
                align-self: center;
                padding-right: 5px;
                padding-left: 5px;
                height: 15px;
            }
            .ratp-img {
                display: flex;
                justify-content: center;
                margin-top: 5px;
            }
            .ratp-image {
                height: 25px;
            }
            @keyframes ScrollMessage {
                0% {
                    transform: translate(50%);
                }
                100% {
                    transform: translate(-60%);
                }

            }
            @keyframes blinker {
                50% {
                  opacity: 0;
                }
              }
        `;
    }
}
customElements.define("idf-mobilite-card", IDFMobiliteCard);