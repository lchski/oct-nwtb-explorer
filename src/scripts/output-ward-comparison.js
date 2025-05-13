import { DuckDBInstance } from '@duckdb/node-api'

const duckdb_instance = await DuckDBInstance.create()
const octdb = await duckdb_instance.connect()

await octdb.run(`CREATE TABLE stop_times AS SELECT * FROM read_parquet('./src/data/octranspo.com/stop_times.parquet')`)

await octdb.run(`
    COPY (
        SELECT
            source,
            ward_number,
            service_id,
            service_window,
            stop_code,
            COUNT(*)::INTEGER as n_stop_times
        FROM stop_times
        GROUP BY source, ward_number, service_id, service_window, stop_code
    ) TO './src/data/generated/wards/all.parquet' (COMPRESSION gzip)
`)
