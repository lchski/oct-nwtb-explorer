import * as fs from 'fs'

const wards_json = fs.readFileSync('src/data/ottawa.ca/wards_2022_to_2026.geojson')
const wards = JSON.parse(wards_json)

const ward_details = wards.features
	.map(ward => ({
		id: ward.id,
		name: ward.properties.NAME,
		number: Number(ward.properties.WARD)
	}))
	.sort((wardA, wardB) => wardA.number - wardB.number)

// Write the remapped data to the output file
fs.writeFileSync('src/data/generated/wards/ward_details.json', JSON.stringify(ward_details))
