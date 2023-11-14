import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module"

import { nonRatpLineRef } from "./referentiel-des-lignes-filtered.js"

//const nonRatpLineRef = await import("./referentiel-des-lignes-filtered.json", {assert: { type: "json" }})

const sncfLineRef = {
    // https://prim.iledefrance-mobilites.fr/fr/donnees-statiques/emplacement-des-gares-idf
    C01742: "A",
    C01743: "B",
    C01727: "C",
    C01728: "D",
    C01729: "E",
    C01737: "H",
    C01739: "J",
    C01738: "K",
    C01740: "L",
    C01736: "N",
    C01730: "P",
    C01731: "R",
    C01741: "U",

}

const sncfLineColor = {
    // https://prim.iledefrance-mobilites.fr/fr/donnees-statiques/emplacement-des-gares-idf
    "A": "#FF0000",
    "B": "#238FC9",
    "C": "#FFCB00",
    "D": "#008B5A",
    "E": "#D1448F",
    "H": "#976238",
    "J": "#D5C932",
    "K": "#9E9640",
    "L": "#D0A0C7",
    "N": "#00B593",
    "P": "#FF8741",
    "R": "#FF97A8",
    "U": "#D00042",
}

class IDFMobiliteCard extends LitElement {
    static get properties() {
        console.log("%c Lovelace - IDF Mobilité  %c 0.1.10", "color: #FFFFFF; background: #5D0878; font-weight: 700;", "color: #fdd835; background: #212121; font-weight: 700;")
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

    createRERContent(lineDatas, exclude_lines, exclude_lines_ref, second_entity) {
        const messagesList = this.hass.states[this.config.messages];
        if (!lineDatas && !lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp)
            return html``

        // Last update date
        const lastUpdateDate = new Date(Date.parse(lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp))
        const lastUpdateTime = (lastUpdateDate.getUTCHours() < 10 ? "0" + lastUpdateDate.getUTCHours() : lastUpdateDate.getUTCHours()) + ":" + (lastUpdateDate.getUTCMinutes() < 10 ? "0" + lastUpdateDate.getUTCMinutes() : lastUpdateDate.getUTCMinutes())

        // Station name (take the first stopPointName)
        const stationName = lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0 ?
            lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value
            : "API ERROR"

        // Build Line/Time
        const trains = {};
        lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(stop => {
            if (stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length > 0 && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value.indexOf("Bus Estime Dans") == -1) {
                const trainLine = stop.MonitoredVehicleJourney.OperatorRef.value;
                // OCTAVE, PCCMOD, STAEL = Metro, KOWM=TRAM
                if (trainLine.indexOf("RER") != -1 || trainLine.indexOf("SNCF") != -1) {
                    // SNCF line
                    var lineRef = ""
                    if (trainLine.indexOf("SNCF") != -1) {
                        const lineToFind = stop.MonitoredVehicleJourney.LineRef.value.substring(stop.MonitoredVehicleJourney.LineRef.value.indexOf("::") + 2, stop.MonitoredVehicleJourney.LineRef.value.length - 1)
                        if (sncfLineRef[lineToFind]) {
                            // Train found
                            if (sncfLineRef[lineToFind] > "E")
                                lineRef = "train-" + sncfLineRef[lineToFind]
                            else
                                lineRef = "rer-" + sncfLineRef[lineToFind]
                        }
                    }
                    else {
                        lineRef = "rer-" + trainLine.substring(trainLine.lastIndexOf('.') + 1, trainLine.length - 1)
                    }
                    if (lineRef != "") {
                        const nextDeparture = Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                        const lineStop = stop.MonitoredVehicleJourney.DestinationRef.value.substring(stop.MonitoredVehicleJourney.DestinationRef.value.indexOf(":Q:") + 3, stop.MonitoredVehicleJourney.DestinationRef.value.length - 1)
                        if ((!exclude_lines || exclude_lines.indexOf(lineRef) == -1) && (!exclude_lines_ref || exclude_lines_ref.indexOf(lineStop) == -1) && nextDeparture > -5 && nextDeparture < 60) {
                            const destinationName = stop.MonitoredVehicleJourney.DirectionName.length > 0 ? stop.MonitoredVehicleJourney.DirectionName[0].value.split('-').map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()).join('-').split(' ').map(item => item.charAt(0).toUpperCase() + item.slice(1)).join(' ') : stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value
                            if (!trains[lineRef])
                                trains[lineRef] = {}
                            if (!trains[lineRef][destinationName])
                                trains[lineRef][destinationName] = []
                            trains[lineRef][destinationName].push({
                                vehiculeName: stop.MonitoredVehicleJourney.JourneyNote[0].value,
                                destinationName: stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value,
                                destinationRef: stop.MonitoredVehicleJourney.DestinationRef.value,
                                nextDeparture: nextDeparture, monitoringRef: stop.MonitoringRef.value
                            })
                        }
                    }
                    else {
                        console.log("Ignoring line : " + trainLine)
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
                                ${stationName.indexOf("Métro") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}metro_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("RER") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}rer_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("Tramway") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}tram_white.png" class="bus-destination-image"/></div>` : ""}
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
                            <div class="rer-line-title" style="border-color: ${sncfLineColor[train.substring(train.indexOf('-') + 1, train.length)]}">
                                <div class="rer-line-title-logo">
                                    <img src="${imagesUrl}${train.substring(0, train.indexOf('-'))}sq${this.config.wall_panel === true ? "_white" : ""}.png" class="rer-line-type-image">
                                </div>
                                <div class="rer-line-title-image">
                                    <img src="${imagesUrl}${train.substring(0, train.indexOf('-'))}/${train.substring(train.indexOf('-') + 1, train.length)}.png" alt="${train.substring(train.indexOf('-') + 1, train.length)}" class="${train.substring(0, train.indexOf('-'))}-image"/>
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
                                                html`${trains[train][trainDestination][trainLine].destinationName.substring(7, trains[train][trainDestination][trainLine].destinationName.length).trim()}<div class="bus-destination-img"><img src="${imagesUrl}train${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                : html`${trains[train][trainDestination][trainLine].destinationName}${trains[train][trainDestination][trainLine].destinationName.endsWith("Chessy") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}mickey${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>` : ""}`
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
        if (!lineDatas && !lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp)
            return html``

        // Last update date
        const lastUpdateDate = new Date(Date.parse(lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].ResponseTimestamp))
        const lastUpdateTime = (lastUpdateDate.getUTCHours() < 10 ? "0" + lastUpdateDate.getUTCHours() : lastUpdateDate.getUTCHours()) + ":" + (lastUpdateDate.getUTCMinutes() < 10 ? "0" + lastUpdateDate.getUTCMinutes() : lastUpdateDate.getUTCMinutes())
        // Station name (take the first stopPointName)
        const stationName = lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.length > 0 ?
            lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit[0].MonitoredVehicleJourney.MonitoredCall.StopPointName[0].value
            : "API ERROR"
        // Build Line/Time
        const buses = {};
        lineDatas.attributes['Siri'].ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit.forEach(stop => {
            if (stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay.length > 0 && stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value.indexOf("Bus Estime Dans") == -1) {
                var busLine = stop.MonitoredVehicleJourney.OperatorRef.value;
                // OCTAVE, PCCMOD, STAEL = Metro, KOWM=TRAM
                if (busLine && (busLine.indexOf("SAE-BUS") > 0 || busLine.indexOf("SAE-TRAM") > 0 || busLine.indexOf("OCTAVE") > 0 || busLine.indexOf("PCCMOD") > 0 || busLine.indexOf("STAEL") > 0 || busLine.indexOf("KOVM") > 0)) {
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
                    const lineStop = stop.MonitoredVehicleJourney.DestinationRef.value.substring(stop.MonitoredVehicleJourney.DestinationRef.value.indexOf(":Q:") + 3, stop.MonitoredVehicleJourney.DestinationRef.value.lastIndexOf(":"))
                    if ((!exclude_lines || exclude_lines.indexOf(busRef) == -1) && (!exclude_lines_ref || exclude_lines_ref.indexOf(lineStop) == -1)) {
                        const destinationName = stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value
                        if (!buses[lineRef])
                            buses[lineRef] = {}
                        if (!buses[lineRef][destinationName])
                            buses[lineRef][destinationName] = []
                        buses[lineRef][destinationName].push({
                            destinationRef: lineStop,
                            nextDeparture: Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)})
                    }
                }
                else {
                    // Try to find the line in the referential for non RATP lines
                    const lineToFind = stop.MonitoredVehicleJourney.LineRef.value.substring(stop.MonitoredVehicleJourney.LineRef.value.lastIndexOf("::")+2, stop.MonitoredVehicleJourney.LineRef.value.lastIndexOf(":"));
                    nonRatpLineRef().every(line => {
                        if (line.id_line == lineToFind) {
                            const lineNumber = line.name_line
                            const lineRef = line.transportmode+"-" + lineNumber
                            const busRef = line.transportmode+"-" + lineNumber
                            const lineStop = stop.MonitoredVehicleJourney.DestinationRef.value.substring(stop.MonitoredVehicleJourney.DestinationRef.value.indexOf(":Q:") + 3, stop.MonitoredVehicleJourney.DestinationRef.value.lastIndexOf(":"))
                            if ((!exclude_lines || exclude_lines.indexOf(busRef) == -1) && (!exclude_lines_ref || exclude_lines_ref.indexOf(lineStop) == -1)) {
                                const nextDepartureTime = Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                                if (nextDepartureTime > -1) {
                                    const destinationName = this.titleCase(stop.MonitoredVehicleJourney.MonitoredCall.DestinationDisplay[0].value)
                                    if (!buses[lineRef])
                                        buses[lineRef] = {}
                                    if (!buses[lineRef][destinationName])
                                        buses[lineRef][destinationName] = []
                                    if (line.transportmode != "tram")
                                        buses[lineRef][destinationName].push({
                                            destinationRef: lineStop,
                                            lineTextColor: line.textcolourweb_hexa,
                                            lineBackgroundColor: line.colourweb_hexa,
                                            nextDeparture: Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                                        })
                                    else
                                        buses[lineRef][destinationName].push({
                                            destinationRef: lineStop,
                                            nextDeparture: Math.floor((new Date(Date.parse(stop.MonitoredVehicleJourney.MonitoredCall.ExpectedDepartureTime)) - Date.now()) / 1000 / 60)
                                        })
                                }
                            }
                            return false
                        }
                        return true
                    });
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
                                ${stationName.indexOf("Métro") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}metro_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("RER") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}rer_white.png" class="bus-destination-image"/></div>` : ""}
                                ${stationName.indexOf("Tramway") > 0 ? html`<div class="bus-destination-img"><img src="${imagesUrl}tram_white.png" class="bus-destination-image"/></div>` : ""}
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
                                                        <img src="${imagesUrl}${bus.substring(0, bus.indexOf('-'))}${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-line-type-image">
                                                    </div>
                                                    <div class="bus-line-image">
                                                        ${!buses[bus][destination][0].lineTextColor ?
                                                            html`<img src = "${imagesUrl}${bus.substring(0, bus.indexOf('-'))}/${bus.substring(bus.indexOf('-') + 1, bus.length).replace(/^0+/, '')}.png" alt = "${bus.substring(bus.indexOf('-') + 1, bus.length).replace(/^0+/, '')}" class="${bus.substring(0, bus.indexOf('-'))}-image" />`
                                                    : html`<div class="bus-line-image-no-ratp" style="color: #${buses[bus][destination][0].lineTextColor};background-color:#${buses[bus][destination][0].lineBackgroundColor}">${bus.substring(bus.indexOf('-') + 1, bus.length).replace(/^0+/, '')}</div>`
                                                        }
                                                    </div>` : ""}
                                        </div>
                                        <div class="bus-destination">
                                            ${this.config.show_train_ref ?
                                                html`${buses[bus][destination][0].destinationRef}`
                                                : html`
                                                    ${destination.indexOf("<RER>") > 0 ?
                                                        html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<RER>")).endsWith("-") ? destination.substring(0, destination.indexOf("-<RER>")) : destination.substring(0, destination.indexOf("<RER>"))}</div><div class="bus-destination-img"><img src="${imagesUrl}rer${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                        : destination.indexOf("<METRO>") > 0 ?
                                                            html`<div class="bus-destination-name">${destination.substring(0, destination.indexOf("<METRO>")).endsWith("-") ? destination.substring(0, destination.indexOf("-<METRO>")) : destination.substring(0, destination.indexOf("<METRO>"))}</div><div class="bus-destination-img"><img src="${imagesUrl}metro${this.config.wall_panel === true ? "_white" : ""}.png" class="bus-destination-image"/></div>`
                                                    : destination}`
                                            }
                                        </div>
                                        <div class="bus-stop">
                                            <div class="bus-stop-value">
                                                ${buses[bus][destination][0].nextDeparture > 0 ?
                                                    buses[bus][destination][0].nextDeparture :
                                                    (buses[bus][destination][0].nextDeparture == 0 ? html`<div class="bus-stop-value-text-blink">à l'approche</div>` : "à l'arrêt")
                                                }
                                            </div>
                                        </div>
                                        <div class="bus-stop">
                                            <div class="bus-stop-value">
                                                ${buses[bus][destination][1] ? (buses[bus][destination][1].nextDeparture > 0 ? buses[bus][destination][1].nextDeparture : "") : ""}
                                            </div>
                                        </div>
                                    </div>`
                                })}
                            </div>`
                    })}
                </div>
        `;
    }

    titleCase(str) {
        //var newstr = str.split(' ').map(item =>
         //   item.charAt(0).toUpperCase() + item.slice(1).toLowerCase()).join(' ');
        return str.split(' ').map(item =>
            item.indexOf('-') < 0 ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() :
            item.split('-').map(item2 =>
                item2.charAt(0).toUpperCase() + item2.slice(1).toLowerCase()).join('-')).join(' ');
    }

    createMessageDisplay() {
        //Build messages
        const messagesList = this.hass.states[this.config.messages];
        const messages = {}
        if (messagesList && messagesList.attributes['Siri']) {
            const deliveryMessages = messagesList.attributes['Siri'].ServiceDelivery.GeneralMessageDelivery[0]
            if (deliveryMessages.InfoMessage) {
                deliveryMessages.InfoMessage.forEach(infoMessage => {
                    if (!messages[infoMessage.InfoChannelRef.value])
                        messages[infoMessage.InfoChannelRef.value] = { messages: [] }
                    messages[infoMessage.InfoChannelRef.value].messages.push(infoMessage.Content.Message[0].MessageText.value)
                })
            }
        }

        const imagesUrl = new URL('images/', import.meta.url).href
        return html`
            <div class="message-div ${this.config.show_screen === true ? "with-screen" : this.config.wall_panel === true ? "footer-nobg " : ""}">
                ${Object.keys(messages).length > 0 ?
                html`<div class="message-div-text">
                        ${Object.keys(messages).map(key => {
                    var concatMessage = "";
                    messages[key].messages.forEach((message, index) => { concatMessage += message + (index < messages[key].messages.length - 1 ? " /// " : "") })
                    if (key == "Information" && this.config.display_info_message === true)
                        return html`<img src="${imagesUrl}info.png" class="message-icon">${concatMessage}`
                    else if (key == "Perturbation")
                        return html`<img src="${imagesUrl}warning.png" class="message-icon">${concatMessage}`
                    else if (key == "Commercial" && this.config.display_commercial_message === true)
                        return concatMessage
                })}</div>`
                : ""}
            </div>`
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
            }
            .bus-last-update-text-nobg {
                display: flex;
                font-size: 8px;
                color: #FFFFFF;
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
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                height:40px;
                padding-right: 10px;
            }
            .bus-line-detail-nobg {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #516077;
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
            .bus-line-image-no-ratp {
                display:flex;
                align-items: center;
                justify-content: center;
                height: 25px;
                width: 40px;
                font-weight: bold;
                font-size: 18px;
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
                font-size: 18px;
                font-weight: bold;
                padding-left: 2px;
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
            }
            .rer-station-name-nobg {
                display: flex;
                align-self: center;
                color: #FFFFFF;
                font-size: 18px;
                font-weight: bold;
                margin-left: 12px;
                padding: 4px 12px;
                background-color: #050446
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
            }
            .rer-line-detail {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #516077;
                height:40px;
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