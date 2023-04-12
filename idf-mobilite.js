import {
    LitElement,
    html,
    css
  } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class IDFMobiliteCard extends LitElement {
    static get properties() {
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
            <ha-card style="background-color:#516077;">
                <div class="card-content">
                    ${this.config.lineType === "RER"
                        ? this.createRERContent() : ""}
                    ${this.config.lineType === "BUS"
                        ? this.createBUSContent() : ""}
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
            var busLine = stop.MonitoredVehicleJourney.OperatorRef.value;
            if (busLine.indexOf("BUS") > 0) {
                busLine = busLine.substring(busLine.lastIndexOf('.') + 1, busLine.length - 1)
                const destinationName = stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value
                if (!buses[busLine])
                    buses[busLine] = { destinationName: destinationName, nextStop: [] }
                buses[busLine].nextStop.push(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)
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
            console.log("Messages :"+ messages)
        }
        return html`
            <div>
                <div class="bus-header">
                    <div class="bus-station-name">
                        ${stationName.indexOf(" RER") > 0 ?
                                    html`<div class="bus-destination-name">${stationName.substring(0, stationName.indexOf(" RER"))}</div><div class="bus-destination-img"><img src="/local/lovelace-idf-mobilite/images/RER_white.png" class="bus-destination-image"/></div>`
                                    : stationName}
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
                ${Object.keys(buses).map(key => {
                    return html`
                        <div class="bus-line">
                            <div class="bus-img">
                                <img src="/local/lovelace-idf-mobilite/images/${key}.png" alt="${key}" class="bus-image"/>
                            </div>
                            <div class="bus-destination">
                                ${buses[key].destinationName.indexOf("<RER>") > 0 ?
                                    html`<div class="bus-destination-name">${buses[key].destinationName.substring(0, buses[key].destinationName.indexOf("<RER>"))}</div><div class="bus-destination-img"><img src="/local/lovelace-idf-mobilite/images/RER.png" class="bus-destination-image"/></div>`
                                    : buses[key].destinationName}
                            </div>
                            <div class="bus-stop">
                                <div class="bus-stop-value">
                                    ${buses[key].nextStop[0] ? (new Date(Date.parse(buses[key].nextStop[0])) - Date.now())>0?Math.floor((new Date(Date.parse(buses[key].nextStop[0])) - Date.now()) / 1000 / 60):"..." : ""}
                                </div>
                            </div>
                            <div class="bus-stop">
                                <div class="bus-stop-value">
                                    ${buses[key].nextStop[1] ? (new Date(Date.parse(buses[key].nextStop[1])) - Date.now())>0? Math.floor((new Date(Date.parse(buses[key].nextStop[1])) - Date.now()) / 1000 / 60) : "" : ""}
                                </div>
                            </div>
                        </div>
                    `
                })}
                <div class="message-div">
                    ${Object.keys(messages).length > 0 ?
                        html`<div class="message-div-text">
                            ${Object.keys(messages).map(key => {
                                var concatMessage = "";
                                messages[key].messages.forEach((message, index) => { concatMessage += message + (index< messages[key].messages.length-1 ? " /// ": "") })
                                if (key == "Perturbation")
                                    return html`<img src="/local/lovelace-idf-mobilite/images/warning.png" height="15px" style="align-self: center;">${concatMessage}`
                                else
                                    return concatMessage
                            })}</div>`
                        : "Pas de message"}
                </div>
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
            lineType: "bus",
            line: "lineNumber",
            lineColor: "#676545",

        }
    }

    static get styles() {
        return css`
            .card-content {
                padding: 0px;
            }
            .bus-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 4px solid #070572;
                background-color: #FFFFFF;
                border-radius: 10px 10px 0px 0px;
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
            .bus-line {
                display: flex;
                justify-content: space-between;
                margin: 4px 0px;
                background-color: #FFFFFF;
                height:40px;
            }
            .bus-img {
                display: flex;
                flex: 1;
                justify-content: center;
                align-items: center;
            }
            .bus-image {
                height: 25px;
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
                justify-content: center;
            }
            .bus-stop-value {
                background: #000000;
                font-size: 18px;
                font-weight: bold;
                color: #CAA94C;
                padding: 2px 5px 5px 5px;
                border-radius: 5px;
                width: 20px;
                text-align: center;
            }
            .message-div {
                display: flex;
                justify-content: center;
                overflow-x: auto;
                height: 20px;
                border-radius: 0px 0px 10px 10px;
                background-color: #FFFFFF;
                color: #000000;
                padding-left: 10px;
                padding-right: 10px;
            }

            .message-div-text {
                display: flex;
                justify-content: right;
                flex-grow: 1;
                white-space: nowrap;
                animation: ScrollMessage 40s linear infinite;
            }

            @keyframes ScrollMessage {
                0% {
                    transform: translate(50%);
                }
                100% {
                    transform: translate(-60%);
                }

            }
        `;
    }

}
customElements.define("idf-mobilite-card", IDFMobiliteCard);