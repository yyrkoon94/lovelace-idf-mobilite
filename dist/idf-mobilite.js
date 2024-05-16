import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module"

import { idfMobiliteLineRef } from "./referentiel-des-lignes-filtered.js"

class IDFMobiliteCard extends LitElement {
    static get properties() {
        console.log("%c Lovelace - IDF Mobilité  %c 0.2.3", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
        return {
            hass: {},
            config: {},
        };
    }

    render() {
        if (!this.config || !this.hass) {
            return html``;
        }
        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
            <ha-card>
                <div class="border${this.config.show_screen === true ? "-screen" : this.config.wall_panel === true ? "" : "-screen"}">
                    <div class="idf-${this.config.show_screen === true ? "with-" : ""}screen">
                        <div class="card-content${this.config.show_screen === true ? "-with-screen" : this.config.wall_panel === true ? "-nobg" : ""}">
                            ${this.config.lineType === "RER"
                                ? this.createRERContent(this.hass.states[this.config.entity], this.config.exclude_lines, this.config.exclude_lines_ref) : ""}
                            ${this.config.lineType === "BUS"
                                ? this.createBUSContent(this.hass.states[this.config.entity], this.config.exclude_lines, this.config.exclude_lines_ref) : ""}
                            ${this.config.second_entity && this.config.lineType === "RER"
                                ? this.createRERContent(this.hass.states[this.config.second_entity], this.config.exclude_second_lines, this.config.exclude_second_lines_ref, true) : ""}
                            ${this.config.second_entity && this.config.lineType === "BUS"
                                ? this.createBUSContent(this.hass.states[this.config.second_entity], this.config.exclude_second_lines, this.config.exclude_second_lines_ref, true) : ""}
                            ${this.createMessageDisplay()}
                        </div>
                        ${this.config.show_screen === true ?
                             html`
                                <div class="ratp-img">
                                    <img src="${imagesUrl}general/ratp.png" class="ratp-image">
                                    <div class="blink-point"></div>
                                </div>
                            `
                            : ""}
                    </div>
                </div>
            </ha-card>
        `;
    }

    createRERContent(lineDatas, exclude_lines, exclude_lines_ref, second_entity) {
        const messagesList = this.hass.states[this.config.messages];
        if (!lineDatas?.attributes['Siri']  || !lineDatas.attributes['Siri']?.ServiceDelivery?.StopMonitoringDelivery[0].ResponseTimestamp)
            return html``;
        let serviceDelivery = lineDatas.attributes['Siri'].ServiceDelivery;

        // Last update date
        const lastUpdateTime = IDFMobiliteCard.parseTimestamp(serviceDelivery.StopMonitoringDelivery[0].ResponseTimestamp)
        // Station name (take the first stopPointName)
        const stationName = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0 ?
            serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value
            : "API ERROR";

        // Build Line/Time
        const trains = {};
        const trainData = {};
        serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(stop => {
            if (stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length > 0 && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value.indexOf("Bus Estime Dans") == -1) {
                const lineToFind = stop.MonitoredVehicleJourney.LineRef.value.substring(stop.MonitoredVehicleJourney.LineRef.value.indexOf("::") + 2, stop.MonitoredVehicleJourney.LineRef.value.length - 1);
                const line = IDFMobiliteCard.findNonRatpLineData(lineToFind);
                let lineRef;
                // accept all rail vehicles, and replacement bus, no metro/tram/funicular
                switch(line?.transportmode) {
                    case "rail":
                        if (line?.transportsubmode?.includes("local")) { // RER
                            lineRef = "rer-" + line.name_line;
                        } else if (line?.transportsubmode?.includes("suburbanRailway")) { // TRAIN
                            lineRef = "train-" + line.name_line;
                        } else if (line?.transportsubmode?.includes("regionalRail")) { // TER
                            lineRef = "train-" + line.shortname_line;
                        }
                        break;
                    case "bus":
                        if (line?.type?.includes("REPLACEMENT") && this.config.show_replacement_bus) { // REPLACEMENT BUS
                            lineRef = "bus-rep-" + line.shortname_line;
                        }
                        break;
                    default:
                        IDFMobiliteCard.logUnknownLine(line);
                        break;
                }

                if (lineRef) {
                    const nextDeparture = Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60);
                    const lineStop = stop.MonitoredVehicleJourney.DestinationRef.value.substring(stop.MonitoredVehicleJourney.DestinationRef.value.indexOf(":Q:") + 3, stop.MonitoredVehicleJourney.DestinationRef.value.length - 1);
                    if ((!exclude_lines || exclude_lines.indexOf(lineRef) == -1) && (!exclude_lines_ref || exclude_lines_ref.indexOf(lineStop) == -1) && nextDeparture > -5 && nextDeparture < 60) {
                        const destinationName = stop.MonitoredVehicleJourney.DirectionName.length > 0 ? stop.MonitoredVehicleJourney.DirectionName[0].value.split('-').map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()).join('-').split(' ').map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(' ') : stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value;
                        if (!trains[lineRef])
                            trains[lineRef] = {};
                        if (!trains[lineRef][destinationName])
                            trains[lineRef][destinationName] = [];
                        trains[lineRef][destinationName].push({
                            vehiculeName: stop.MonitoredVehicleJourney.JourneyNote != "" ? stop.MonitoredVehicleJourney.JourneyNote[0].value : lineRef.substring(lineRef.indexOf("-") + 1).toLocaleUpperCase(),
                            destinationName: stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value,
                            destinationRef: stop.MonitoredVehicleJourney.DestinationRef.value,
                            nextDeparture: nextDeparture, monitoringRef: stop.MonitoringRef.value
                        });
                        if (!trainData[lineRef])
                            trainData[lineRef] = line;
                    }
                }
            }
        });

        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
            ${this.config.show_station_name === undefined || this.config.show_station_name === true ?
                html `<div class="rer-header ${this.config.show_screen === true ? "with-screen" : this.config.wall_panel === true ? "header-nobg " : ""}}">
                    <div class="rer-station-name${this.config.wall_panel === true ? "-nobg" : ""}">
                        ${stationName.indexOf("RER") > 0 || stationName.indexOf("Métro") > 0 || stationName.indexOf("Tramway") > 0 ?
                    html`<div class="bus-destination-name">
                                    ${stationName.substring(0, stationName.indexOf("RER") > 0 ? stationName.indexOf("RER") : stationName.length).substring(0, stationName.indexOf("Métro") > 0 ? stationName.indexOf("Métro") : stationName.length).substring(0, stationName.indexOf("Tramway") > 0 ? stationName.indexOf("Tramway") : stationName.length).replace(/-$/, '')}
                                </div>
                                ${stationName.indexOf("Métro") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/metro_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("RER") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/rer_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("Tramway") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/tram_white.png" class="bus-destination-image"/></div>` : ""}
                            `
                    : stationName }
                    </div>
                    ${!second_entity ?
                        html`<div class="bus-last-update">
                                <div class="bus-last-update-time">
                                    ${lastUpdateTime}
                                </div>
                                <div class="bus-last-update-text">
                                    Dernière mise à jour
                                </div>
                            </div>`: "" }
                </div>`: ""
            }
            <div class="rer-content">
                ${Object.keys(trains).sort(function (a, b) { return a.localeCompare(b) }).map(train => {
                return html`
                    ${Object.keys(trains[train]).map(trainDestination => {
                    return html`
                        <div class="rer-line${this.config.wall_panel === true ? "-nobg" : ""}">
                            <div class="rer-line-title" style="border-color: #${trainData[train].colourweb_hexa.toUpperCase()}">
                                <div class="rer-line-title-logo">
                                    <img src="${imagesUrl}general/${train.substring(0, train.indexOf('-'))}${train.includes("bus") === true ? "" : "sq"}${this.config.wall_panel === true ? "_white" : ""}.png" class="rer-line-type-image">
                                </div>
                                <div class="rer-line-title-image">
                                    ${train.includes("rep") ?
                                    html`<img src="${imagesUrl}general/warning.png" alt="warning" class="${train.substring(0, train.indexOf('-'))}-image"/>`
                                    : html``}
                                    ${trainData[train].icon ?
                                    html`<img src="${imagesUrl}${trainData[train].transportmode}/${ trainData[train].icon}" alt="${trainData[train].shortname_line}" class="${train.substring(0, train.indexOf('-'))}-image"/>`
                                    : html`<div class="bus-line-image-no-ratp" style="color: #${trainData[train].textcolourweb_hexa};background-color:#${trainData[train].colourweb_hexa};">${trainData[train].shortname_line}</div>`}
                                </div>
                                <div class="rer-line-title-name">
                                    ${trainDestination}
                                </div>
                            </div>
                            ${Object.keys(trains[train][trainDestination]).map(trainLine => {
                                return html`
                                    <div class="rer-line-detail">
                                        <div class="rer-line-vehicule">
                                            <div class="rer-line-vehicule-name">
                                                ${this.config.show_train_ref ?
                                                    html`${trains[train][trainDestination][trainLine].destinationRef.substring(trains[train][trainDestination][trainLine].destinationRef.indexOf(":Q:") + 3, trains[train][trainDestination][trainLine].destinationRef.length - 1) }`
                                                    : html`${trains[train][trainDestination][trainLine].vehiculeName}`
                                                }
                                            </div>
                                        </div>
                                        <div class="rer-line-destination">
                                            ${trains[train][trainDestination][trainLine].destinationName.startsWith("Gare d") ?
                                                html`<div class="bus-destination-name">${trains[train][trainDestination][trainLine].destinationName.substring(7, trains[train][trainDestination][trainLine].destinationName.length).trim()}</div><div class="bus-destination-img"><img src="${imagesUrl}general/train${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                : html`${trains[train][trainDestination][trainLine].destinationName}${trains[train][trainDestination][trainLine].destinationName.endsWith("Chessy") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/mickey${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>` : ""}`
                                            }
                                        </div>
                                        <div class="rer-line-departure">
                                            ${trains[train][trainDestination][trainLine].nextDeparture > 0 ?
                                                html`
                                                    <div class="rer-line-departure-time-content">
                                                        <div class="rer-line-departure-time">
                                                            ${trains[train][trainDestination][trainLine].nextDeparture}
                                                        </div>
                                                        <div class="rer-line-departure-minute">
                                                            min
                                                        </div>
                                                    </div>` :
                                                        (trains[train][trainDestination][trainLine].nextDeparture == 0 ?
                                                            html`<div class="rer-line-departure-message"><div class="rer-line-departure-message-text-blink">à l'approche</div></div>`
                                                            : html`<div class="rer-line-departure-message"><div class="rer-line-departure-message-text">à quai</div></div>`)
                                            }
                                        </div>
                                    </div>`
                            })}
                        </div>`
                    })}`
                })}
            </div>
        `;
    }

    createBUSContent(lineDatas, exclude_lines, exclude_lines_ref, second_entity) {
        if (!lineDatas?.attributes['Siri']  || !lineDatas.attributes['Siri']?.ServiceDelivery?.StopMonitoringDelivery[0].ResponseTimestamp)
            return html``;
        let serviceDelivery = lineDatas.attributes['Siri'].ServiceDelivery;

        // Last update date
        const lastUpdateTime = IDFMobiliteCard.parseTimestamp(serviceDelivery.StopMonitoringDelivery[0].ResponseTimestamp)
        // Station name (take the first stopPointName)
        const stationName = serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0 ?
            serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value
            : "API ERROR";
        // Build Line/Time
        const buses = {};
        const busData = {};
        serviceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(stop => {
            if (stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime && ((stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length > 0 && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value.indexOf("Bus Estime Dans") == -1) || stop.MonitoredVehicleJourney.DestinationName.length > 0)) {
                // Try to find the line in the referential for non RATP lines
                const lineToFind = stop.MonitoredVehicleJourney.LineRef.value.substring(stop.MonitoredVehicleJourney.LineRef.value.lastIndexOf("::")+2, stop.MonitoredVehicleJourney.LineRef.value.lastIndexOf(":"));
                const line = IDFMobiliteCard.findNonRatpLineData(lineToFind);
                let lineRef;
                switch(line?.transportmode) {
                    case "rail": // skip rail
                        break;
                    default:
                        lineRef = line.transportmode + "-" + line.name_line
                        break;
                }

                if (lineRef) {
                    const lineStop = stop.MonitoredVehicleJourney.DestinationRef.value.substring(stop.MonitoredVehicleJourney.DestinationRef.value.indexOf(":Q:") + 3, stop.MonitoredVehicleJourney.DestinationRef.value.lastIndexOf(":"))
                    if ((!exclude_lines || !exclude_lines.includes(lineRef)) && (!exclude_lines_ref || !exclude_lines_ref.includes(lineStop))) {
                        const nextDepartureTime = Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                        if (nextDepartureTime > -1) {
                            const destinationName = stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length >0 ? IDFMobiliteCard.reformatString(stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value) : IDFMobiliteCard.reformatString(stop.MonitoredVehicleJourney.DestinationName[0].value)
                            if (!buses[lineRef])
                                buses[lineRef] = {}
                            if (!buses[lineRef][destinationName])
                                buses[lineRef][destinationName] = []
                            buses[lineRef][destinationName].push({
                                destinationRef: lineStop,
                                nextDeparture: Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                            })
                            if (!busData[lineRef])
                                busData[lineRef] = line;
                        }
                    }
                    return false
                }
            }
        });

        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
            ${this.config.show_station_name === undefined || this.config.show_station_name === true ?
                html `<div class="bus-header ${this.config.show_screen === true ? "with-screen" : this.config.wall_panel === true ? "header-nobg " : ""}" style="${second_entity ? 'border-radius: 0px !important' : ''}">
                    <div class="bus-station-name${this.config.wall_panel === true ? "-nobg" : ""}">
                        ${stationName.indexOf("RER") > 0 || stationName.indexOf("Métro") > 0 || stationName.indexOf("Tramway") > 0 ?
                            html`<div class="bus-destination-name">
                                    ${stationName.substring(0, stationName.indexOf("RER") > 0 ? stationName.indexOf("RER") : stationName.length).substring(0, stationName.indexOf("Métro") > 0 ? stationName.indexOf("Métro") : stationName.length).substring(0, stationName.indexOf("Tramway") > 0 ? stationName.indexOf("Tramway") : stationName.length).replace(/-$/, '')}
                                </div>
                                ${stationName.indexOf("Métro") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/metro_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("RER") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/rer_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("Tramway") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}general/tram_white.png" class="bus-destination-image"/></div>` : ""}
                            `
                            : stationName
                        }
                    </div>
                    ${!second_entity ?
                        html`<div class="bus-last-update">
                            <div class="bus-last-update-time">
                                ${lastUpdateTime}
                            </div>
                            <div class="bus-last-update-text${this.config.wall_panel === true ? "-nobg" : ""}">
                                Dernière mise à jour
                            </div>
                        </div>`: "" }
                </div>
                `: ""
                }
                <div class="bus-lines" style="${this.config.second_entity && !second_entity ? 'flex-grow: 0;': ''}">
                    ${Object.keys(buses).sort(function (a, b) { return a.localeCompare(b) }).map(bus => {
                        return html`
                            <div class="bus-line${this.config.wall_panel === true ? "-nobg" : ""}">
                                ${Object.keys(buses[bus]).map((destination, index) => {
                                    return html`
                                    <div class="bus-line-detail">
                                        <div class="bus-img">
                                            ${index === 0 ?
                                            html`<div class="bus-line-type">
                                                        <img src="${imagesUrl}general/${bus.substring(0, bus.indexOf('-'))}${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-line-type-image">
                                                    </div>
                                                    <div class="bus-line-image">
                                                        ${busData[bus].icon ?
                                                            html`<img src = "${imagesUrl}${busData[bus].transportmode}/${busData[bus].icon}" alt = "${busData[bus].name_line}" class="${bus.substring(0, bus.indexOf('-'))}-image" />`
                                                    : html`<div class="bus-line-image-no-ratp" style="color: #${busData[bus].textcolourweb_hexa};background-color:#${busData[bus].colourweb_hexa}">${busData[bus].shortname_line}</div>`
                                                        }
                                                    </div>` : ""}
                                        </div>
                                        <div class="bus-destination">
                                            ${this.config.show_train_ref ?
                                                html`${buses[bus][destination][0].destinationRef}`
                                                : html`
                                                    ${destination.indexOf("<RER>") > 0 ?
                                                        html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<RER>")).endsWith("-") ? destination.substring(0, destination.indexOf("-<RER>")) : destination.substring(0, destination.indexOf("<RER>"))}</div><div class="bus-destination-img"><img src="${imagesUrl}general/rer${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                        : destination.indexOf("<METRO>") > 0 ?
                                                            html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<METRO>")).endsWith("-") ? destination.substring(0, destination.indexOf("-<METRO>")) : destination.substring(0, destination.indexOf("<METRO>"))}</div><div class="bus-destination-img"><img src="${imagesUrl}general/metro${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                    : html`<div class="bus-destination-name">${destination}</div>`}`
                                            }
                                        </div>
                                        <div class="bus-stop">
                                            ${this.getBusDeparture(buses[bus][destination][0])}
                                        </div>
                                        <div class="bus-stop">
                                            ${this.getBusDeparture(buses[bus][destination][1])}
                                        </div>
                                    </div>`
                                })}
                            </div>`
                    })}
                </div>
        `;
    }

    getBusDeparture(busDestinationStop) {
        return busDestinationStop ? html`
            <div class="bus-stop-value">
                ${busDestinationStop.nextDeparture > 0 ?
                    busDestinationStop.nextDeparture :
                    (this.config.show_bus_stop_label ?
                        (busDestinationStop.nextDeparture == 0 ?
                            html`<div class="bus-stop-value-text-blink">à l'approche</div>` :
                            "à l'arrêt") :
                        html`<div class="bus-stop-value-text-blink">0</div>`)
                }
            </div>` :
            html`<div class="bus-stop-value-empty"> </div>`
    }

    createMessageDisplay() {
        //Build messages
        const messagesList = this.hass.states[this.config.messages];
        const messages = {}
        if (messagesList && messagesList.attributes['Siri']) {
            const deliveryMessages = messagesList.attributes['Siri'].ServiceDelivery.GeneralMessageDelivery[0]
            if (deliveryMessages.InfoMessage) {
                deliveryMessages.InfoMessage
                .sort((a, b) => { // sort messages from the shortest validity
                    const data_a = new Date(a.ValidUntilTime);
                    const data_b = new Date(b.ValidUntilTime);
                    return ((data_a < data_b) ? -1 : ((data_a > data_b) ? 1 : 0));
                })
                .forEach(infoMessage => {
                    // show only messages which are still valid
                    if (new Date(infoMessage.ValidUntilTime) > new Date()) {
                        if (!messages[infoMessage.InfoChannelRef.value])
                            messages[infoMessage.InfoChannelRef.value] = { messages: [] }
                        messages[infoMessage.InfoChannelRef.value].messages.push(infoMessage.Content.Message[0].MessageText.value)
                    }
                })
            }
        }

        const imagesUrl = new URL('images/', import.meta.url).href
        let displayedTextLength = 0;
        const messageText = Object.keys(messages).map(key => {
            let concatMessage = "";
            messages[key].messages.forEach((message, index) => { concatMessage += message + (index < messages[key].messages.length - 1 ? " /// " : "") })
            if (key == "Information" && this.config.display_info_message === true) {
                displayedTextLength += concatMessage.length;
                return html`<img src="${imagesUrl}general/info.png" class="message-icon">${concatMessage}`
            } else if (key == "Perturbation") {
                displayedTextLength += concatMessage.length;
                return html`<img src="${imagesUrl}general/warning.png" class="message-icon">${concatMessage}`
            } else if (key == "Commercial" && this.config.display_commercial_message === true) {
                displayedTextLength += concatMessage.length;
                return concatMessage
            }
        });
        const textSpeed = Math.max(Math.floor(displayedTextLength / 10), 5); // set min speed to 5 for very short texts

        return html`
            <div class="message-div ${this.config.show_screen === true ? "with-screen" : this.config.wall_panel === true ? "footer-nobg " : ""}">
                ${messageText.length > 0 ?
                    html`<div class="message-div-text" style="animation: ScrollMessage ${textSpeed}s linear infinite;">${messageText}</div>`
                    : ""
                }
            </div>`
    }

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

    static parseTimestamp(timestamp) {
        const lastUpdateDate = new Date(timestamp)
        return `${String(lastUpdateDate.getHours()).padStart(2, '0')}:${String(lastUpdateDate.getMinutes()).padStart(2, '0')}`;
    }

    static logUnknownLine(line) {
        console.log("Unknown line: " + line?.name_line + " operator: " + line?.operatorname + " type: " + line?.transportmode + " subtype: " + line?.transportsubmode);
    }

    static reformatString(str) {
        // in case where at least one letter is lowercase, then we skip
        // we want to reformat only the string if all letter are uppercase
        // hard to check if all letters are uppercase cause it must include all special french letters
        if (/[a-z]/.test(str))
            return str;
        const exclusions = new Set(['de', 'du', 'le', 'la', 'les', 'et', 'via', 'sur', 'en']);
        // Split the input string into words
        const words = str.split(/\s+/);
        // Transform each word
        return words.map((word, index) => {
            // If the word is enclosed in < > tags, convert it to uppercase
            if (/^<.*>$/.test(word)) {
                return word.toUpperCase();
            }
            // If the word contains a hyphen, capitalize each part
            if (word.includes('-')) {
                const hyphenatedParts = word.split('-');
                return hyphenatedParts.map((part, part_idx) => {
                    if (index > 0 && part_idx > 0 && exclusions.has(part.toLowerCase()))
                        return part.toLowerCase()
                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                }).join('-');
            }
            // If the word is in the exclusion list and it's not the first word, keep it as is
            if (index > 0 && exclusions.has(word.toLowerCase())) {
                return word.toLowerCase();
            }
            // Capitalize the first letter of each word
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    static findNonRatpLineData(lineToFind) {
        let lineData;
        idfMobiliteLineRef().every(line => {
            if (line.id_line == lineToFind) {
                lineData = line;
                return false;
            }
            return true;
        });
        return lineData;
    }

    static async getConfigElement() {
        await import("./idf-mobilite-card-editor.js");
        return document.createElement("idf-mobilite-card-editor");
    }

    static getStubConfig() {
        return {
            entity: "",
            messages: "",
            lineType: "BUS",
            show_screen: false,
            exclude_lines: "",
            show_bus_stop_label: false,
            show_replacement_bus: false,
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
            .card-content-nobg {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 0px;
            }
            .bus-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 4px solid #070572;
                background-color: #FFFFFF;
                border-radius: 9px 9px 0px 0px;
                margin-bottom: 4px;
                min-height: 45px;
            }
            .header-nobg {
                background: none !important;
                color: #FFFFFF !important;
                border-bottom: 4px solid #050446;
            }
            .footer-nobg {
                background: none !important;
                color: #FFFFFF !important;
            }
            .bus-station-name {
                display: flex;
                align-self: center;
                background-color: #070572;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
            }
            .bus-station-name-nobg {
                display: flex;
                align-self: center;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
                background-color: #050446
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
                text-wrap: nowrap;
                overflow: hidden;
            }
            .bus-last-update-text-nobg {
                display: flex;
                font-size: 8px;
                color: #FFFFFF;
                margin-top: -2px;
                text-wrap: nowrap;
                overflow: hidden;
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
                color: #070572;
                background-color: #FFFFFF;
            }
            .bus-line-nobg {
                display: flex;
                justify-content: space-between;
                flex-direction:column;
                color: #FFFFFF;
                background-color: none !important;
            }
            .bus-line-detail {
                display: flex;
                flex-wrap: wrap; /* Allow flex items to wrap to the next line */
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                min-height: 40px;
                padding-right: 10px;
            }
            .bus-line-detail-nobg {
                display: flex;
                flex-wrap: wrap; /* Allow flex items to wrap to the next line */
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                min-height: 40px;
                padding-right: 10px;
            }
            .bus-img {
                display: flex;
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
                display: flex;
                flex-grow: 1;
                align-items: center;
                justify-content: center;
            }
            .bus-line-image-no-ratp {
                display: flex;
                border-radius: 3px;
                align-items: center;
                justify-content: center;
                height: 25px;
                min-width: 30px;
                font-weight: bold;
                font-size: 18px;
                text-wrap: nowrap;
                padding-left: 3px;
                padding-right: 3px;
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
                flex: 1;
                align-self: center;
                font-size: 18px;
                font-weight: bold;
                margin-left: 3px;
                text-wrap: nowrap;
                overflow: hidden;
            }
            .bus-destination-name {
                display: flex;
                align-items: center;
                overflow: hidden;
            }
            .bus-destination-img {
                display: flex;
                flex: 1;
                align-items: center;
                margin-left: 5px;
                margin-right: 5px;
            }
            .bus-destination-image {
                height: 20px;
            }
            .bus-stop {
                display: flex;
                align-self: center;
                justify-content: end;
                margin-left: 3px;
                margin-right: 3px;
            }
            .bus-stop-value {
                background: #000000;
                font-size: 18px;
                font-weight: bold;
                color: #CAA94C;
                padding: 5px 5px 5px 5px;
                border-radius: 5px;
                text-align: center;
                white-space: nowrap;
                min-width: 28px;
            }
            .bus-stop-value-empty {
                background: #222222;
                border-radius: 5px;
                white-space: nowrap;
                height: 30px;
                width: 38px;
            }
            .bus-stop-value-text-blink {
                animation: blinker 3s linear infinite;
            }
            .rer-header {
                display: flex;
                justify-content: space-between;
                border-bottom: 4px solid #070572;
                background-color: #FFFFFF;
                border-radius: 9px 9px 0px 0px;
                margin-bottom: 4px;
                min-height: 45px;
            }
            .rer-station-name {
                display: flex;
                align-self: center;
                background-color: #070572;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
                text-wrap: nowrap;
                overflow: hidden;
            }
            .rer-station-name-nobg {
                display: flex;
                align-self: center;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
                background-color: #050446;
                text-wrap: nowrap;
                overflow: hidden;
            }
            .rer-content {
                display: flex;
                flex-direction: column;
                flex-grow: 1;
            }
            .rer-line {
                display: flex;
                flex-direction: column;
                background-color: #FFFFFF;
                color: #070572;
                margin-bottom: 4px;
            }
            .rer-line-nobg {
                display: flex;
                justify-content: space-between;
                flex-direction:column;
                color: #FFFFFF;
                background-color: none !important;
            }
            .rer-line-title {
                display: flex;
                border-bottom: 4px solid #070572;
                border-radius: 9px 9px 0px 0px;
                min-height: 40px;
            }
            .rer-line-title-logo {
                display: flex;
                align-self: center;
                margin-left: 2px;
            }
            .rer-line-type-image {
                height: 25px;
            }
            .rer-line-title-image {
                display: flex;
                align-self: center;
                margin-left: 5px;
                margin-right: 5px;
            }
            .rer-image {
                height: 25px;
            }
            .train-image {
                height: 30px;
            }
            .rer-line-title-name {
                display: flex;
                align-self: center;
                font-size: 18px;
                font-weight: bold;
                text-wrap: nowrap;
                overflow: hidden;
            }
            .rer-line-detail {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                min-height:40px;
            }
            .rer-line-vehicule {
                display: flex;
                align-self: center;
                flex: 1;
            }
            .rer-line-vehicule-name {
                display: flex;
                align-self: center;
                background-color: #000000;
                color: #FFFFFF;
                border-radius: 0px 5px 5px 0px;
                padding-right: 5px;
            }
            .rer-line-destination {
                display: flex;
                flex: 5;
                align-self: center;
                align-self: center;
                font-size: 18px;
                font-weight: bold;
                text-wrap: nowrap;
                overflow: hidden;
            }
            .rer-line-departure {
                display: flex;
                flex: 3;
                height: 40px;
                background: #4D4D4D;
                align-self: center;
            }
            .rer-line-departure-time-content {
                display: flex;
                flex-direction: column;
                background: #000000;
                color: #CAA94C;
                min-width: 35px;
            }
            .rer-line-departure-time {
                display: flex;
                align-self: center;
                font-size: 18px;
                font-weight: bold;
                padding-top: 6px;
            }
            .rer-line-departure-minute {
                display: flex;
                align-self: center;
                font-size: 8px;
                margin-top: -5px;
            }
            .rer-line-departure-message {
                display: flex;
                align-self: center;
                height: 40px;
                font-size: 18px;
                font-weight: bold;
                padding-left: 5px;
                padding-right: 5px;
                background: #000000;
                color: #CAA94C;
            }
            .rer-line-departure-message-text-blink {
                display: flex;
                align-self: center;
                animation: blinker 3s linear infinite;
            }
            .rer-line-departure-message-text {
                display: flex;
                align-self: center;
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
                overflow: hidden;
            }
            .message-div-text {
                display: flex;
                justify-content: right;
                flex-grow: 1;
                white-space: nowrap;
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
