import { parseArgs } from "node:util"
import { asyncBufferFromFile, parquetReadObjects } from "hyparquet"
import { compressors } from "hyparquet-compressors"

// TODO: need a parquet parsing library


const {
    values: { stop_code }
} = parseArgs({
    options: { stop_code: { type: "string" } }
})


const stops_file = await asyncBufferFromFile(`./src/data/octranspo.com/stops_normalized.parquet`)
const stops = await parquetReadObjects({ file: stops_file, compressors })

const stop_details = stops
    .find(stop => stop.stop_code == stop_code)

process.stdout.write(JSON.stringify(stop_details))
