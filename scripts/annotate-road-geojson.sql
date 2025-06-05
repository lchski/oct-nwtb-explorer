load spatial;

CREATE TABLE roads AS SELECT * FROM ST_Read('src/data/ottawa.ca/Road_Centrelines_simplify_25.geojson');
CREATE TABLE wards AS SELECT * FROM ST_Read('src/data/ottawa.ca/wards_2022_to_2026.geojson');

SELECT
	r.MAINTCLASS,
	r.geom,
	array_agg(DISTINCT w.WARD) AS ward_number
FROM
	roads r
LEFT JOIN
	wards w
ON
	ST_Intersects(r.geom, w.geom)
GROUP BY
	r.MAINTCLASS, r.geom;

-- to query, e.g., FROM roads_annot WHERE array_contains(ward_number, '13');
