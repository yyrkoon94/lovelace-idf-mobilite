# Lovelace Card : Ile de France Mobilité [@yyrkoon94](https://www.github.com/yyrkoon94)

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![release][release-badge]][release-url]
![downloads][downloads-badge]

A new [Home Assistant][home-assistant] Lovelace Card to show all types of upcoming vehicles on the Ile de France Mobilite network. 

This Card consume the [PRIM][prim-url] (**P**lateforme **R**égionale d'**I**nformation pour la **M**obilité) API provided by "Ile de France Mobilité".

![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/screenshot1.png)
![Screenshot](https://raw.githubusercontent.com/yyrkoon94/lovelace-idf-mobilite/master/screenshot2.png)

For now this map is in **BETA VERSION**, you can only use the BUS/METRA/TRAM map and not all icons are available (but ask me and I'll add them!). The next version will contain a specific RER and SNCF display.

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

First, you need to **create an account** on the [PRIM][prim-url] API website. Once your account is created, log in to the site and click on your name in the right corner then create an API key (and write it down somewhere!). The API key should be a series of numbers and letters, we will use it to configure the **sensors**.





<!-- Badges -->
[release-badge]: https://img.shields.io/github/v/release/yyrkoon94/lovelace-idf-mobilite?style=flat-square
[downloads-badge]: https://img.shields.io/github/downloads/yyrkoon94/lovelace-idf-mobilite/total?style=flat-square

<!-- References -->
[home-assistant]: https://www.home-assistant.io/
[home-assitant-theme-docs]: https://www.home-assistant.io/integrations/frontend/#defining-themes
[hacs]: https://hacs.xyz
[release-url]: https://github.com/yyrkoon94/lovelace-idf-mobilite/releases
[prim-url]: https://prim.iledefrance-mobilites.fr/
