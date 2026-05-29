package com.example.demo.weather;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class GroundTempParser {

    private static final int COL_TM = 0;
    private static final int COL_STN = 1;
    private static final int COL_TA = 11;
    private static final int COL_HM = 13;
    private static final int COL_TS = 36;

    private static final int MIN_COLUMN_COUNT = 37;

    private static final List<Double> MISSING_FLOATS =
            List.of(-9.0, -99.0, -999.0);

    public static final Map<Integer, StationLocation>
            STATION_LOCATIONS = Map.ofEntries(

            Map.entry(108,
                    new StationLocation(
                            37.5714,
                            126.9658
                    )
            ),

            Map.entry(159,
                    new StationLocation(
                            35.1047,
                            129.0320
                    )
            ),

            Map.entry(184,
                    new StationLocation(
                            33.5141,
                            126.5297
                    )
            )
    );

    private GroundTempParser() {
    }

    public static List<AsosRecord> parse(
            String text
    ) {

        List<AsosRecord> records =
                new ArrayList<>();

        String[] lines =
                text.split("\n");

        for (String line : lines) {

            line = line.trim();

            if (line.isBlank()
                    || line.startsWith("#")) {
                continue;
            }

            String[] parts =
                    line.split("\\s+");

            if (parts.length
                    < MIN_COLUMN_COUNT) {
                continue;
            }

            try {

                int stn =
                        Integer.parseInt(
                                parts[COL_STN]
                        );

                records.add(
                        new AsosRecord(
                                parts[COL_TM],
                                stn,
                                parseDouble(
                                        parts[COL_TA]
                                ),
                                parseDouble(
                                        parts[COL_HM]
                                ),
                                parseDouble(
                                        parts[COL_TS]
                                )
                        )
                );

            } catch (NumberFormatException e) {

                continue;
            }
        }

        return records;
    }

    public static Double getGroundTempByStn(
            List<AsosRecord> records,
            int stn
    ) {

        for (AsosRecord record : records) {

            if (record.stn() == stn) {
                return record.ts();
            }
        }

        return null;
    }

    public static Double getGroundTempAt(
            List<AsosRecord> records,
            double lat,
            double lon,
            double maxDistanceKm
    ) {

        NearestStation nearest =
                nearestStation(lat, lon);

        if (nearest.distanceKm()
                > maxDistanceKm) {
            return null;
        }

        return getGroundTempByStn(
                records,
                nearest.stn()
        );
    }

    public static NearestStation nearestStation(
            double lat,
            double lon
    ) {

        int nearestStn = -1;

        double minDistance =
                Double.MAX_VALUE;

        for (Map.Entry<Integer,
                StationLocation> entry
                : STATION_LOCATIONS.entrySet()) {

            double distance =
                    haversineKm(
                            lat,
                            lon,
                            entry.getValue().lat(),
                            entry.getValue().lon()
                    );

            if (distance < minDistance) {

                minDistance = distance;
                nearestStn = entry.getKey();
            }
        }

        return new NearestStation(
                nearestStn,
                minDistance
        );
    }

    private static Double parseDouble(
            String token
    ) {

        try {

            double value =
                    Double.parseDouble(token);

            if (MISSING_FLOATS.contains(
                    value
            )) {
                return null;
            }

            return value;

        } catch (NumberFormatException e) {

            return null;
        }
    }

    private static double haversineKm(
            double lat1,
            double lon1,
            double lat2,
            double lon2
    ) {

        double r = 6371.0;

        double dLat =
                Math.toRadians(lat2 - lat1);

        double dLon =
                Math.toRadians(lon2 - lon1);

        double a =
                Math.pow(
                        Math.sin(dLat / 2),
                        2
                )
                        + Math.cos(
                        Math.toRadians(lat1)
                )
                        * Math.cos(
                        Math.toRadians(lat2)
                )
                        * Math.pow(
                        Math.sin(dLon / 2),
                        2
                );

        return 2
                * r
                * Math.asin(Math.sqrt(a));
    }
}