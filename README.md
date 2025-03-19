# Lovelace Card : Ile de France Mobilité [@yyrkoon94](https://www.github.com/yyrkoon94)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![release][release-badge]][release-url]

** **IMPORTANT INFORMATION** : PRIM has changed its quota policy for accounts created since March 2024 with only 1000 calls per day by default (which is not enough if you refresh the REST sensor every 60 seconds and more over if you have several sensors). The easiest solution is probably to refresh less than every 60 seconds, but you can also request additional quota when your quota is exceeded on the PRIM website ** 

A new [Home Assistant][home-assistant] Lovelace Card to show all types of upcoming vehicles on the Ile de France Mobilite network.

This Card consume the [PRIM][prim-url] (**P**lateforme **R**égionale d'**I**nformation pour la **M**obilité) API provided by "Ile de France Mobilité".

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/screenshot3.png)
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/screenshot1.png)
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/screenshot2.png)

## Installation

The simplest way to install this card is to add this repository to HACS. If you wish to install it manually, you may follow the instructions below.

### Upload to HA

Download source code zip file file from the [latest-release][release-url].
Put the contains of the 'dist' repository into your `config/www` in a folder named `community/lovelace-idf-mobilite`.

### Add the custom to Lovelace resources
Add reference to `idf-mobilite.js` in Dashboard :
    _Settings_ → _Dashboards_ → _More Options icon_ → _Resources_ → _Add Resource_ → Set _Url_ as `/local/community/lovelace-idf-mobilite/idf-mobilite.js` → Set _Resource type_ as `JavaScript Module`.
      **Note:** If you do not see the Resources menu, you will need to enable _Advanced Mode_ in your _User Profile_

## Usage

### PRIM API Key
First, you need to **create an account** on the [PRIM][prim-url] API website. Once your account is created, log in to the site and click on your name in the right corner then create an API key (and write it down somewhere!). The API key should be a series of numbers and letters, we will use it to configure the **sensors**.

### First sensor

Once your api key created, you can create your first sensor. To do this, edit your configuration.yaml and add the following lines (if you already have a sensor section, simply add the platform to it):

```
sensor:
  - platform: rest
    name: prim_the_name_you_want                            <-- for exemple prim_la_defense
    unique_id: bbbc536a-d580-4317-8669-87a590b0f55d         <-- a unique id to manage the state (you can generate one on https://www.uuidgenerator.net/version4)
    resource: https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring
    method: GET
    params:
      MonitoringRef: "STIF:StopArea:SP:71517:"              <-- mandatory : the StopArea or StopPoint you want to follow (cf next section)
      LineRef: "STIF:Line::C01221:"                         <-- optional : the line if you want to follow only one line on the StopArea
    headers:
      apiKey: "YourApiKey"                                  <-- the PRIM Api Key
    scan_interval: 60                                       <-- the time between update (in seconds)
    timeout: 30
    value_template: "OK"
    json_attributes:
      - Siri
```
### Find your Area and Line

#### StopArea and StopPoint

The StopArea is a string encoded as **STIF:StopArea:SP:XXXXX:** where **XXXXXX** is your area. To find the value, navigate to the [Referential][area-reference-url] of Area and Stops. You can see the following map:

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/stoparea1.png)

Unselect **Accès** and **Arrêts Transporteur** on the right menu and search an adress (or move the map) to go where you want (use zoom to see the full area). You may have something like the following map with 3 kinds of assets :
1. Correpondance Area (the bold red line)
2. Stop Area (the thin red line)
3. Stop (the mark icon)

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/stoparea2.png)

Click on one of the three asset types to see the details and get the **famous** area code:

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/areacode.png)

So, in this exemple, the area code is **71517** so the stop area code for the sensor is **STIF:StopArea:SP:71517:**

If you choose a stop point, you can use the StopArea syntax **STIF:StopArea:SP:43032:** or the StopPoint syntax **STIF:StopPoint:Q:41442:** (both works for now)

NOTE : at this point you can display the Lovelace Card, the LineRef is optional (and you can filter lines in the Lovelace Card also !)

#### LineRef

To find the line ref (and filter the Lovelace Card on a specif line), got to the [Referential][line-reference-url] of datas available for the PRIM API and clic on the "CARTE PERIMETRE TEMPS REEL" tab. You can see the following map (near the same than the previous one) :

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/lineref1.png)

The difference is when you clic on a stop point, you will see the StopId and the lines at this point :

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/lineref2.png)

In this exemple, for the StopPoint **STIF:StopPoint:Q:36384:** (36384), there are the 3 bus lines C01221, C01276 and C01222. So, you have it (!), the LineRef to use is **STIF:Line::C01221:** for the first line.

Now you can create as many sensors as you want to monitor StopArea, StopPoint or specif Line. So, let's go to the Lovelace Card !

### The Lovelace Card

The Lovelace Card come with a custom Card Editor to configure the card. For now, you must create first a custom card to have the editor in the **Add Card** list (don't know why !). So just create a **Custom Card** and add the folowing code :
```
type: custom:idf-mobilite-card
```

Then clic on the code editor, you will see this page :
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/cardeditor.png)

In the "Ligne" box, choose a PRIM sensor that you have created and ***that's all*** !

You can see *more options* :
- Messages : another sensor to display Information message at the StopArea (line problems, ...)
- Line Type : to display Bus/Tram/Métro or RER/SNCF lines
- Screen Mode : To display the Card like a RATP TV :)
- Display infomation messages : used for messages to display also Infomation message (and not only perturbations)

#### Filtering Options
There are two kinds of filtering :
- Exclude Lines : a list of line to exclude to the display (for exemple, to exclude the bus 207, just type bus-207;)
- Exclude Destinations : this one is used for filtering specific destinations. For exemple if you want to display RER A but only on one way or only a specific destination, you can hide other lines. To know the line number to hide, just check the switch "Afficher les références des destinations" and you will see the destination number instead of train name. Just use these number for filtering.

### Messages sensor
You can add a second sensor for your StopArea to monitor Information and Perturbation messages. For that simply add a sensor like this exemple :

```
sensor:
  - platform: rest
    name: prim_the_name_you_want_messages                   <-- for exemple prim_la_defense_messages
    unique_id: bbbc536a-d580-4317-8669-87a94560f55d         <-- a unique id to manage the state (you can generate one on https://www.uuidgenerator.net/version4)
    resource: https://prim.iledefrance-mobilites.fr/marketplace/general-message
    method: GET
    params:
      StopPointRef: "STIF:StopArea:SP:71517:"               <-- optional (ONLY ONE of these params) : the StopArea or StopPoint you want to follow 
      LineRef: "STIF:Line::C01221:"                         <-- optional (ONLY ONE of these params) : the line if you want to follow only one line 
    headers:
      apiKey: "YourApiKey"                                  <-- the PRIM Api Key
    scan_interval: 60                                       <-- the time between update (in seconds)
    timeout: 30
    value_template: "OK"
    json_attributes:
      - Siri
```

And choose this new sensor for the "Messages" entity

## Database update
To update manually the database you need to have __Python3__ and install all __requirements__:

```bash
python3 -m pip install -r scripts/requirements.txt
```

Then run the update script:

```bash
scripts/update_database.py -m dist/images -o dist/referentiel-des-lignes-filtered.js
# or if you want to save the raw database json file from RATP
# scripts/update_database.py -m dist/images -o dist/referentiel-des-lignes-filtered.js -r dist/referentiel-des-lignes.json
```

## Credits

The card is inspired by [Lesensei’s work][lesensei] on [idfm-card][idfm-card].

<!-- Badges -->
[release-badge]: https://img.shields.io/github/v/release/yyrkoon94/lovelace-idf-mobilite?style=flat-square
[downloads-badge]: https://img.shields.io/github/downloads/yyrkoon94/lovelace-idf-mobilite/total?style=flat-square

<!-- References -->
[home-assistant]: https://www.home-assistant.io/
[home-assitant-theme-docs]: https://www.home-assistant.io/integrations/frontend/#defining-themes
[hacs]: https://hacs.xyz
[release-url]: https://github.com/yyrkoon94/lovelace-idf-mobilite/releases
[prim-url]: https://prim.iledefrance-mobilites.fr/
[area-reference-url]: https://data.iledefrance-mobilites.fr/explore/dataset/arrets/custom/
[line-reference-url]: https://prim.iledefrance-mobilites.fr/fr/jeux-de-donnees/perimetre-des-donnees-tr-disponibles-plateforme-idfm
[lesensei]: https://github.com/lesensei
[idfm-card]: https://github.com/lesensei/idfm-card
