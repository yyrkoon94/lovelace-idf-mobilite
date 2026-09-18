// render-style.js
import { css } from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

export const IDFMobiliteStyles = css`

/* ============================================================
   LAYOUT (idf-screen, card-content, borders, RATP logo)
   ============================================================ */
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
.ratp-img {
    display: flex;
    justify-content: center;
    margin-top: 5px;
}
.ratp-image {
    height: 25px;
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

/* ============================================================
   COMMON (destination, last-update, badges, icons)
   ============================================================ */
.header-nobg {
    background: none !important;
    color: #FFFFFF !important;
    border-bottom: 4px solid #050446;
}
.footer-nobg {
    background: none !important;
    color: #FFFFFF !important;
}
.destination-name {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
}

.destination-scroll {
    display: inline-block;
    white-space: nowrap;
    flex-shrink: 1; /* le texte peut rétrécir */
}

.destination-img {
    flex-shrink: 0; /* l’icône NE DOIT PAS rétrécir */
    align-items: center;
    margin-left: 6px;
    display: flex;
}
.auto-scroll {
  animation: destination-scroll var(--scroll-duration) linear infinite;
}

@keyframes destination-scroll-pingpong {
    0%   { transform: translateX(0); }
    10%  { transform: translateX(0); } /* pause début */
    50%  { transform: translateX(var(--scroll-distance)); }
    60%  { transform: translateX(var(--scroll-distance)); } /* pause fin */
    100% { transform: translateX(0); }
}

.destination-image {
    height: 20px;
    vertical-align: middle;
}
.last-update {
    display: flex;
    flex-direction:column;
    margin-right: 5px;
}
.last-update-time {
    display: flex;
    align-self: center;
    background: #000000;
    font-size: 18px;
    font-weight: bold;
    color: #FFCC33;
    padding: 0px 5px;
    border-radius: 0px 0px 5px 5px;
}
.last-update-text {
    display: flex;
    font-size: 8px;
    color: #000000;
    text-wrap: nowrap;
    overflow: hidden;
}
.last-update-text-nobg {
    display: flex;
    font-size: 8px;
    color: #FFFFFF;
    text-wrap: nowrap;
    overflow: hidden;
}
/* Icône de ligne (RER, Métro, Tram, Bus, etc.) */
.message-line-icon {
    height: 18px;
    width: auto;
    vertical-align: text-bottom;
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
.badge { display: inline-block; margin-right: 4px; margin-left: 4px;}
.badge-info { color: #007bff; }
.badge-noservice { color: #ff4d4d; }
.badge-delays { color: #ffae42; }
.badge-other { color: #516077; }

@keyframes blinker { 50% { opacity: 0; } }
@keyframes ScrollMessage {
    0% { transform: translate(50%); }
    100% { transform: translate(-60%); }
}

/* ============================================================
   BUS
   ============================================================ */
.bus-header {
    display: flex;
    justify-content: space-between;
    border-bottom: 4px solid #070572;
    background-color: #FFFFFF;
    border-radius: 9px 9px 0px 0px;
    margin-bottom: 4px;
    min-height: 45px;
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
.bus-image { height: 25px; }
.tram-image { height: 25px; }
.rail-image { height: 25px; }
.metro-image { height: 30px; }
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
.bus-destination-after {
    display: inline-block;
    margin-left: 4px;
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
.bus-state-on_time { color: #FFCC33; }
.bus-state-delayed { color: #ffae42; }
.bus-state-cancelled { color: #ff4d4d; }
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

/* ============================================================
   RER
   ============================================================ */
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
    color: #FFFFFF !important;
    background-color: none !important;
}
.rer-line-title {
    min-width: 0; /* indispensable pour iOS */
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
.rer-line-title-name {
    display: flex;
    align-self: center;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
    font-size: 18px;
    font-weight: bold;
}
.rer-line-title-name {
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
}
.rer-title-scroll {
    display: inline-block;
    min-width: 0;
    white-space: nowrap;
    flex-shrink: 1;
    will-change: transform;
    padding-right: 20px; /* marge de confort */
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
.rer-line-departure-message-text-blink {
    display: flex;
    align-self: center;
    animation: blinker 3s linear infinite;
}
.rer-line-departure-message-text {
    display: flex;
    align-self: center;
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

/* ============================================================
   MESSAGES
   ============================================================ */
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
.message-block {
    display: inline-block;
}

.idf-message-container {
  display: flex;
  width: 100%;
  margin-left: -10px;
  position: relative;
  background: #516077;
}

.idf-message-sidebar {
  width: 65px;
  background: #f0f0f0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.idf-message-content {
  flex: 1;
  padding: 12px;
  background: white;
}

.idf-message-tab {
  display: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.idf-message-tab.active {
  display: block;
  opacity: 1;
}

.idf-message-sidebar-item {
  display: flex;
  height: 35px;
  cursor: pointer;
  padding-left: 2px;
  opacity: 0.7;
  border-bottom: solid #516077 1px;
  border-right: solid #516077 4px;
}

.idf-message-sidebar-item.active {
  border-left-color: #007bff;
  background: #ffffff;
  opacity: 1;
  height: 50px;
  border-right: solid white 4px;
}

.sidebar-badge {
  font-size: 18px;
}

.sidebar-label {
  font-size: 14px;
  font-weight: 600;
}
.sidebar-mode-icon img {
  height: 20px;
  margin-right: 1px;
  margin-top: 2px;
  margin-left: 2px;
  display: flex;
  opacity: 0.33;
}

.sidebar-line-icon {
    display: flex;
    align-items: center;
}
.sidebar-line-icon img {
  height: 22px;
  vertical-align: middle;
}
.sidebar-status-icon {
  display: flex;
  align-items: end;
}
.sidebar-status-icon img {
  height: 16px;
  margin-bottom: 2px;
  margin-left: 2px;
  vertical-align: bottom;
}
/* Animation de glissement vertical uniquement pour la sidebar */
.idf-sidebar-slide {
    transition: transform 0.35s ease-in-out;
    transform: translateY(-40px); /* hauteur d’un onglet */
}
    /* Mode plus grand pour le premier onglet */
.sidebar-mode-icon-large {
    width: 42px;   /* tu ajustes selon ton design */
    height: 42px;
}

.idf-message-current-mode {
    position: absolute;
    top: 0;
    left: 0;
    width: 69px; /* ou juste la largeur de la sidebar */
    height: 48px; /* hauteur du header */
    display: flex;
    justify-content: end;
    align-items: center;
    background: white;
    z-index: 10; /* au-dessus de la sidebar */
    border-bottom: solid #516077 4px;
}

.current-mode-icon {
    width: 30px;
    height: 30px;
    opacity: 0.33;
}

/* 🟩 Agrandir l’icône de ligne dans le corps du message en mode carrousel */
.idf-message-container .idf-message-content .message-line-icon {
    display: none;
}

.idf-message-sidebar-item.active .message-line-icon {
    margin-left: 15px;
    z-index: 5;
}

.idf-message-sidebar-item.active .sidebar-mode-icon img {
    height: 20px;
    position: absolute;
}

/* 🟩 Agrandir aussi les lignes en mode "pill" (pas de SVG) */
.idf-message-container .idf-message-content .message-line-pill {
    display: none;
}

.idf-message-sidebar-item.active .sidebar-severity-icon {
    height: 18px;
    position: absolute;
    margin-top: 15px;
    margin-left: 23px;
    z-index: 10;
}

.sidebar-severity-icon {
    height: 12px;
    position: absolute;
    margin-top: 11px;
    margin-left: 23px;
    z-index: 10;
}

.idf-message-sidebar-item.active .message-line-pill {
    font-size: 1.1em;      /* augmente la taille du texte */
    padding: 4px 10px;     /* un peu plus de padding */
    border-radius: 6px;    /* arrondi plus visible */
    margin-right: 8px;
    margin-left: 15px;
    z-index: 5;
    display: inline-block; /* pour éviter les déformations */
}

.idf-message-container .idf-message-content .severity-icon {
    display: none;
}

.severity-icon {
    width: 18px;
    height: 18px;
    vertical-align: text-bottom;
    margin-right: 6px;
    margin-left:2px;
}

.idf-message-container .severity-icon {
    width: 20px;
    height: 20px;
    vertical-align: text-top;
    margin-left: -15px;
}

/* Zone de texte */
.idf-message-text {
  overflow: hidden;
  position: relative;
}

/* Animation verticale ping-pong */
.idf-message-text.scroll-vertical {
  animation: idf-vertical-scroll var(--scroll-duration) linear infinite;
}

@keyframes idf-vertical-scroll {
  /* Pause en haut */
  0%   { transform: translateY(0); }
  10%  { transform: translateY(0); } /* 2s de pause */

  /* Descente lente */
  80%  { transform: translateY(var(--scroll-distance)); }

  /* Pause en bas */
  99%  { transform: translateY(var(--scroll-distance)); } /* 2s de pause */

  /* Reset instantané */
  100% { transform: translateY(0); }
}

`;
