package com.example.demo.weather;

public final class GridConverter {

    // =========================
    // 기상청 DFS 상수
    // =========================
    private static final double RE = 6371.00877;
    private static final double GRID = 5.0;

    private static final double SLAT1 = 30.0;
    private static final double SLAT2 = 60.0;

    private static final double OLON = 126.0;
    private static final double OLAT = 38.0;

    private static final double XO = 43;
    private static final double YO = 136;

    private static final double DEGRAD =
            Math.PI / 180.0;

    // =========================
    // 미리 계산되는 값
    // =========================
    private static final double re =
            RE / GRID;

    private static final double slat1 =
            SLAT1 * DEGRAD;

    private static final double slat2 =
            SLAT2 * DEGRAD;

    private static final double olon =
            OLON * DEGRAD;

    private static final double olat =
            OLAT * DEGRAD;

    private static final double sn;
    private static final double sf;
    private static final double ro;

    static {

        double temp =
                Math.tan(Math.PI * 0.25 + slat2 * 0.5)
                        / Math.tan(Math.PI * 0.25 + slat1 * 0.5);

        sn =
                Math.log(
                        Math.cos(slat1)
                                / Math.cos(slat2)
                ) / Math.log(temp);

        sf =
                Math.pow(
                        Math.tan(
                                Math.PI * 0.25
                                        + slat1 * 0.5
                        ),
                        sn
                ) * Math.cos(slat1) / sn;

        ro =
                re * sf
                        / Math.pow(
                        Math.tan(
                                Math.PI * 0.25
                                        + olat * 0.5
                        ),
                        sn
                );
    }

    private GridConverter() {
    }

    // =========================
    // 위경도 -> 기상청 격자
    // =========================
    public static GridCoordinate toGrid(
            double lat,
            double lon
    ) {

        double ra =
                re * sf
                        / Math.pow(
                        Math.tan(
                                Math.PI * 0.25
                                        + (lat * DEGRAD) * 0.5
                        ),
                        sn
                );

        double theta =
                lon * DEGRAD - olon;

        if (theta > Math.PI) {
            theta -= 2.0 * Math.PI;
        }

        if (theta < -Math.PI) {
            theta += 2.0 * Math.PI;
        }

        theta *= sn;

        int nx =
                (int) Math.floor(
                        ra * Math.sin(theta)
                                + XO
                                + 0.5
                );

        int ny =
                (int) Math.floor(
                        ro
                                - ra * Math.cos(theta)
                                + YO
                                + 0.5
                );

        return new GridCoordinate(nx, ny);
    }
}