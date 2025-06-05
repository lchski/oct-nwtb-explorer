# Data

This project relies on open data shared by the City of Ottawa and OC Transpo. The [methodology page](/about/methodology) explains how the [OC Transpo GTFS data](https://www.octranspo.com/en/plan-your-trip/travel-tools/developers/) is processed using the [supporting project repository](https://github.com/lchski/octranspo-new-ways-to-bus-data).

You can [download a copy of the data supporting this site](https://github.com/lchski/octranspo-new-ways-to-bus-data/releases/tag/v1.0.0). The data is available in both CSVs and Parquet format, depending on your preference.

The explorer tool itself uses a few additional GIS files from the City of Ottawa:

- [Wards 2022–2026](https://open.ottawa.ca/datasets/ottawa::wards-2022-2026)
- [Ottawa Neighbourhood Study](https://open.ottawa.ca/datasets/ottawa::ottawa-neighbourhood-study-ons-neighbourhood-boundaries-gen-3/explore)
- [Road Centrelines](https://open.ottawa.ca/datasets/road-centrelines) _(through doing this project, I learned how crucial roads are to making a map feel right)_

Each of these files were downloaded as GeoJSON, modified using [mapshaper](https://mapshaper.org/) (mildly simplifying geometry, removing unused data properties, and exporting at a lower level of lat/lon precision), then used in either GeoJSON or Shapefile format. The optimizations are (somewhat) tracked in [issue #5, “Optimize geo datasets”](https://github.com/lchski/oct-nwtb-explorer/issues/5).
