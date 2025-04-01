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
