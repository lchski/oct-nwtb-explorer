import { parseArgs } from "node:util"
import { csvFormat } from "d3-dsv"
import JSZip from "jszip"
import * as fs from 'fs'


const {
	values: { ward_id }
} = parseArgs({
	options: { ward_id: { type: "string" } }
})


// Ward details
const wards = JSON.parse(fs.readFileSync('./src/data/ottawa.ca/wards_2022_to_2026.geojson'))

const ward_details = wards.features
	.filter(ward => ward.properties.WARD == ward_id)
	.map(ward => ({
		id: ward.id,
		name: ward.properties.NAME,
		number: Number(ward.properties.WARD)
	}))
	[0]

const zip = new JSZip()
zip.file("details.json", JSON.stringify(ward_details))
zip.generateNodeStream().pipe(process.stdout)
