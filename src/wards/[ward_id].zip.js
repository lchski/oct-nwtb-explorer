import { parseArgs } from "node:util"
// import { csvFormat } from "d3-dsv"
import JSZip from "jszip"
// import { octdb } from '../data/octdb-builder.js'

const {
	values: { ward_id }
} = parseArgs({
	options: { ward_id: { type: "string" } }
});

// use group by rollup

const zip = new JSZip();
zip.file("details.json", JSON.stringify({ ward_number: ward_id, ward_name: "test!" }, null, 2));
zip.generateNodeStream().pipe(process.stdout);
