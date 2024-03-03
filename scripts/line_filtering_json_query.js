// npm install sync-request
// node scripts/line_filtering_json_query.js dist/referentiel-des-lignes.json dist/referentiel-des-lignes-filtered-idf.js dist/images

const input_json_path = process.argv[2];    // path to JSON database
const output_path = process.argv[3];        // path to output JS data script
const images_folder_path = process.argv[4]; // patht to folder where images are stocked

const syncRequest = require('sync-request');
const fs = require('fs');
const path = require('path');

function downloadSvg(line, type, name) {
  const url = `https://cachesync.prod.bonjour-ratp.fr/svg/LIG:IDFM:${line}.svg`;

  try {
    const response = syncRequest('GET', url);
    if (response.statusCode === 200) {
      const data = response.getBody();

      const outputPath = path.join(images_folder_path, type);
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      
      const filePath = path.join(outputPath, `${name}.svg`);

      // Save the SVG file synchronously
      fs.writeFileSync(filePath, data);
      return `${name}.svg`;
    } else {
      // Handle other status codes
      console.error(`Unexpected status code: ${response.statusCode} with ${line} (${name})`);
      return null;
    }
  } catch (error) {
    // Handle errors
    console.error(`Error: ${error.message}`);
    return null;
  }
}

function shouldDownload(fields) {
  let svgDownload = false;
  if (fields?.transportmode == "bus") {
    // download only images for night buses
    // other images can be created dynamically
    if (fields?.transportsubmode == "nightBus") {
      svgDownload = true;
    // download also images for RoissyBus, OrlyBus and TVM
    } else if (['ROISSYBUS', 'ORLYBUS', 'TVM'].includes(fields?.shortname_line)) {
      svgDownload = true;
    }
  } else if (fields?.transportmode == "rail") {
    // skip TER images - they don't exist
    if (fields?.shortname_line != 'TER')
      svgDownload = true;
  } else {
    svgDownload = true;
  }
  return svgDownload;
}

function query(data) {
  return data
    .filter(item => item?.fields?.status == 'active')
    .sort((a, b) => {
      const idA = a.fields.id_line;
      const idB = b.fields.id_line;
      return idA.localeCompare(idB);
    })
    .map(item => {
      const { fields } = item;
      let svgPath;
      // check if the SVG image exists
      if (shouldDownload(fields)) {
        svgPath = downloadSvg(fields?.id_line, fields?.transportmode, fields?.shortname_line)
      }
      
      const result = {
        "id_line": fields?.id_line,
        "name_line": fields?.name_line,
        "shortname_line": fields?.shortname_line,
        "transportmode": fields?.transportmode,
        "transportsubmode": fields?.transportsubmode,
        "type": fields?.type,
        "operatorname": fields?.operatorname,
        "networkname": fields?.networkname,
        "colourweb_hexa": fields?.colourweb_hexa,
        "textcolourweb_hexa": fields?.textcolourweb_hexa,
      };

      if (fields?.picto) {
        result.picto = {
          "id": fields.picto.id,
          "filename": fields.picto.filename
        };
      }
      if (svgPath) {
        result.icon = svgPath;
      }

      return result;
    });
}

if (!input_json_path || !output_path) {
  console.log("Execute " + process.argv[1] + " <INPUT_JSON_PATH> <OUTPUT_JS_PATH>")
  return 1
}

// Load the JSON data
const rawData = fs.readFileSync(input_json_path);
// Parse JSON data
const data = JSON.parse(rawData);
// Execute the query function on your data
const result = query(data);
// Write the JavaScript file
const jsCode = `export function idfMobiliteLineRef() {
  return ${JSON.stringify(result, null, 2)}
}`;
// Save JS file
fs.writeFileSync(output_path, jsCode);
console.log("Script has created the file")