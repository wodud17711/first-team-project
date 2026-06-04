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

    private static final double EARTH_RADIUS_KM = 6371.0;

    private static final double DEFAULT_MAX_DISTANCE_KM = 100.0;

    private static final Map<Integer, StationLocation> STATION_LOCATIONS =
            Map.ofEntries(
                    Map.entry(90, new StationLocation(38.2509, 128.5647)),   // 속초
                    Map.entry(101, new StationLocation(37.9026, 127.7355)),  // 춘천
                    Map.entry(105, new StationLocation(37.7515, 128.8910)),  // 강릉
                    Map.entry(108, new StationLocation(37.5714, 126.9658)),  // 서울
                    Map.entry(112, new StationLocation(37.4769, 126.6249)),  // 인천
                    Map.entry(115, new StationLocation(37.3373, 130.8980)),  // 울릉도
                    Map.entry(119, new StationLocation(37.2746, 126.9988)),  // 수원
                    Map.entry(129, new StationLocation(36.7724, 126.4982)),  // 서산
                    Map.entry(131, new StationLocation(36.6394, 127.4413)),  // 청주
                    Map.entry(133, new StationLocation(36.3722, 127.3739)),  // 대전
                    Map.entry(135, new StationLocation(36.2204, 128.2872)),  // 추풍령
                    Map.entry(138, new StationLocation(36.0327, 129.3800)),  // 포항
                    Map.entry(143, new StationLocation(35.8908, 128.6562)),  // 대구
                    Map.entry(146, new StationLocation(35.8226, 127.1192)),  // 전주
                    Map.entry(152, new StationLocation(35.5821, 129.3296)),  // 울산
                    Map.entry(156, new StationLocation(35.1729, 126.8916)),  // 광주
                    Map.entry(159, new StationLocation(35.1047, 129.0320)),  // 부산
                    Map.entry(162, new StationLocation(34.8083, 126.3815)),  // 목포
                    Map.entry(165, new StationLocation(34.6815, 126.3814)),  // 흑산도
                    Map.entry(168, new StationLocation(34.7393, 127.7405)),  // 여수
                    Map.entry(184, new StationLocation(33.5141, 126.5297)),  // 제주
                    Map.entry(189, new StationLocation(33.2461, 126.5604)),  // 서귀포
                    Map.entry(192, new StationLocation(35.1648, 128.0398))   // 진주
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

                int stationId =
                        Integer.parseInt(parts[COL_STN]);

                records.add(
                        new AsosRecord(
                                parts[COL_TM],
                                stationId,
                                parseNullableDouble(parts[COL_TA]),
                                parseNullableDouble(parts[COL_HM]),
                                parseNullableDouble(parts[COL_TS])
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
            int stationId
    ) {

        for (AsosRecord record : records) {

            if (record.stn() == stationId) {
                return record.ts();
            }
        }

        return null;
    }

    public static Double getGroundTempAt(
            List<AsosRecord> records,
            double lat,
            double lon
    ) {

        return getGroundTempAt(
                records,
                lat,
                lon,
                DEFAULT_MAX_DISTANCE_KM
        );
    }

    public static Double getGroundTempAt(
            List<AsosRecord> records,
            double lat,
            double lon,
            double maxDistanceKm
    ) {

        NearestStation nearestStation =
                nearestStation(lat, lon);

        if (nearestStation.distanceKm() > maxDistanceKm) {
            return null;
        }

        return getGroundTempByStation(
                records,
                nearestStation.stationId()
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

        double minimumDistanceKm =
                Double.MAX_VALUE;

        for (Map.Entry<Integer, StationLocation> entry
                : STATION_LOCATIONS.entrySet()) {

            StationLocation stationLocation =
                    entry.getValue();

            double distanceKm =
                    haversineKm(
                            lat,
                            lon,
                            stationLocation.lat(),
                            stationLocation.lon()
                    );

            if (distanceKm < minimumDistanceKm) {

                minimumDistanceKm = distanceKm;
                nearestStationId = entry.getKey();
            }
        }

        return new NearestStation(
                nearestStationId,
                minimumDistanceKm
        );
    }

    // =========================================================
    // 내부 로직
    // =========================================================
    private static Double parseNullableDouble(String value) {

        try {

            double parsedValue =
                    Double.parseDouble(value);

            if (
                    parsedValue == -9.0
                            || parsedValue == -99.0
                            || parsedValue == -999.0
            ) {
                return null;
            }

            return parsedValue;

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

        double latitudeDifference =
                Math.toRadians(lat2 - lat1);

        double longitudeDifference =
                Math.toRadians(lon2 - lon1);

        double a =
                Math.sin(latitudeDifference * 0.5)
                        * Math.sin(latitudeDifference * 0.5)
                        + Math.cos(Math.toRadians(lat1))
                        * Math.cos(Math.toRadians(lat2))
                        * Math.sin(longitudeDifference * 0.5)
                        * Math.sin(longitudeDifference * 0.5);

        return 2
                * EARTH_RADIUS_KM
                * Math.asin(Math.sqrt(a));
    }

    // =========================================================
    // DTO
    // =========================================================
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