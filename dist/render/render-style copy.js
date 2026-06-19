// render/render-style.js
import { css } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

export const IDFMobiliteStyles = css`
    .idf-screen {}
    .border {}
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
        padding: 0px 12px;
    }
    .bus-station-name-nobg {
        display: flex;
        align-self: center;
        color: #FFFFFF;
        font-size: 18px;
        font-weight: bold;
        margin-left: 12px;
        padding: 0px 12px;
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
        color: #FFCC33;
        padding: 0px 5px;
        border-radius: 0px 0px 5px 5px;
    }
    .bus-last-update-text {
        display: flex;
        font-size: 8px;
        color: #000000;
        text-wrap: nowrap;
        overflow: hidden;
    }
    .bus-last-update-text-nobg {
        display: flex;
        font-size: 8px;
        color: #FFFFFF;
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
        flex-wrap: wrap;
        justify-content: space-between;
        border-bottom: 1px solid #516077;
        min-height: 40px;
        padding-right: 10px;
    }
    .bus-line-detail-nobg {
        display: flex;
        flex-wrap: wrap;
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
        color: #FFCC33;
        padding: 5px 5px 3px;
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
    .bus-state-on_time {
        color: #FFCC33;
    }
    .bus-state-delayed  {
        color: #ffae42;
    }
    .bus-state-cancelled {
        color: #ff4d4d;
    }
    .bus-state-approaching {
        color: #FFCC33;
        animation: blinker 3s linear infinite;
    }
    .bus-estime {
        position: absolute;
        border-radius: 5px;
        padding-right: 5px;
        color: #FFFFFF;
        margin-top: 24px;
        font-size: 9px;
    }
    .bus-delayed {
        position: absolute;
        border-radius: 5px;
        padding-right:4px;
        color: #ffae42;
        margin-top: 24px;
        font-size: 9px;
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
        padding: 0px 12px;
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
        padding: 0px 12px;
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
        height: 25px;
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
        justify-content: space-between;
    }
    .rer-line-departure-time-content {
        display: flex;
        flex-direction: column;
        background: #000000;
        color: #FFCC33;
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
        margin-top: -8px;
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
        color: #FFCC33;
    }
    .rer-line-departure-platform {
        background: #ffffff;
        align-items: center;
        margin: 5px;
        border-radius: 5px;
        border: 1px solid #070572;
        font-size: 18px;
        font-weight: bold;
        padding-left: 5px;
        padding-right: 5px;
        display: flex;
        color: #070572;
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
        height: 20px !important;
        border-radius: 0px 0px 9px 9px;
        background-color: #FFFFFF;
        color: #000000;
        padding-left: 10px;
        padding-right: 10px;
        margin-top: 8px;
        overflow: hidden;
    }
    .message-div-fix {
        display: flex;
        justify-content: center;
        overflow-x: auto;
        min-height: 20px !important;
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
    .message-div-text-fix {
        display: inline;
        justify-content: right;
        flex-grow: 1;
    }
    .message-icon {
        align-self: center;
        padding-right: 5px;
        padding-left: 5px;
        height: 15px;
    }
    .message-icon-fix {
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
    /* Icône de ligne (RER, Métro, Tram, Bus, etc.) */
    .message-line-icon {
        height: 18px;
        width: auto;
        vertical-align: text-bottom;
        display: inline-block;
    }

    /* Pastille couleur fallback (si pas d’icône) */
    .message-line-pill {
        display: inline-block;
        font-size: 0.85rem;
        line-height: 1;
        padding: 3px 7px;
        border-radius: 4px;
        font-weight: 600;
        vertical-align: text-bottom;
        text-transform: uppercase;
    }

    .bus-destination-after {
        display: inline-block;
        margin-left: 4px;
    }

    .message-line-icon-fallback {
        margin-right: 4px;
        font-size: 1.1em;
        vertical-align: middle;
    }

    .message-stop-icon {
        margin-right: 4px;
        font-size: 1.1em;
        vertical-align: middle;
    }



    @keyframes ScrollMessage {
        0% { transform: translate(50%); }
        100% { transform: translate(-60%); }
    }
    @keyframes blinker {
        50% { opacity: 0; }
    }
`;
