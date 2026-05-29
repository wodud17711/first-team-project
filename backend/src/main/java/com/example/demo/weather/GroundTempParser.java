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

    private static final Map<Integer, StationLocation> STATION_LOCATIONS =
            Map.ofEntries(
                    Map.entry(108, new StationLocation(37.5714, 126.9658)), // 서울
                    Map.entry(159, new StationLocation(35.1047, 129.0320)), // 부산
                    Map.entry(184, new StationLocation(33.5141, 126.5297)), // 제주
                    Map.entry(143, new StationLocation(35.8908, 128.6562)), // 대구
                    Map.entry(156, new StationLocation(35.1729, 126.8916)), // 광주
                    Map.entry(152, new StationLocation(35.5821, 129.3296)), // 울산
                    Map.entry(133, new StationLocation(36.3722, 127.3739)), // 대전
                    Map.entry(112, new StationLocation(37.4769, 126.6249))  // 인천
            );

    private GroundTempParser() {
    }

    // =========================================================
    // 응답 파싱
    // =========================================================
    public static List<AsosRecord> parse(String text) {

        List<AsosRecord> records = new ArrayList<>();

        String[] lines = text.split("\\R");

        for (String line : lines) {

            line = line.trim();

            if (line.isBlank() || line.startsWith("#")) {
                continue;
            }

            String[] parts = line.split("\\s+");

            if (parts.length < MIN_COLUMN_COUNT) {
                continue;
            }

            try {

                int stn = Integer.parseInt(parts[COL_STN]);

                records.add(
                        new AsosRecord(
                                parts[COL_TM],
                                stn,
                                parseFloat(parts[COL_TA]),
                                parseFloat(parts[COL_HM]),
                                parseFloat(parts[COL_TS])
                        )
                );

            } catch (NumberFormatException ignored) {
            }
        }

        return records;
    }

    // =========================================================
    // 공개 API
    // =========================================================
    public static Double getGroundTempByStation(
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

        if (nearest.distanceKm() > maxDistanceKm) {
            return null;
        }

        return getGroundTempByStation(
                records,
                nearest.stationId()
        );
    }

    // =========================================================
    // 가장 가까운 관측소
    // =========================================================
    public static NearestStation nearestStation(
            double lat,
            double lon
    ) {

        int nearestStationId = -1;
        double minDistance = Double.MAX_VALUE;

        for (Map.Entry<Integer, StationLocation> entry
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
                nearestStationId = entry.getKey();
            }
        }

        return new NearestStation(
                nearestStationId,
                minDistance
        );
    }

    // =========================================================
    // 내부 로직
    // =========================================================
    private static Double parseFloat(String value) {

        try {

            double parsed = Double.parseDouble(value);

            if (
                    parsed == -9.0
                            || parsed == -99.0
                            || parsed == -999.0
            ) {
                return null;
            }

            return parsed;

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
                Math.sin(dLat / 2)
                        * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(dLon / 2)
                        * Math.sin(dLon / 2);

        return 2
                * r
                * Math.asin(Math.sqrt(a));
    }

    // =========================================================
    // DTO
    // =========================================================
    public record AsosRecord(
            String tm,
            int stn,
            Double ta,
            Double hm,
            Double ts
    ) {
    }

    public record StationLocation(
            double lat,
            double lon
    ) {
    }

    public record NearestStation(
            int stationId,
            double distanceKm
    ) {
    }
}