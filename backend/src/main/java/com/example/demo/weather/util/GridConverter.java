package com.example.demo.weather.util;

public final class GridConverter {

    // ============================================================
    // KMA LCC DFS 좌표 변환 상수
    // ============================================================
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

    private static final double RADDEG =
            180.0 / Math.PI;

    // ============================================================
    // 미리 계산되는 투영 상수
    // ============================================================
    private static final double RE_SCALED =
            RE / GRID;

    private static final double SN;
    private static final double SF;
    private static final double RO;

    static {

        double slat1Rad =
                SLAT1 * DEGRAD;

        double slat2Rad =
                SLAT2 * DEGRAD;

        double olatRad =
                OLAT * DEGRAD;

        double snTemp =
                Math.tan(
                        Math.PI * 0.25
                                + slat2Rad * 0.5
                ) / Math.tan(
                        Math.PI * 0.25
                                + slat1Rad * 0.5
                );

        SN =
                Math.log(
                        Math.cos(slat1Rad)
                                / Math.cos(slat2Rad)
                ) / Math.log(snTemp);

        double sfTemp =
                Math.tan(
                        Math.PI * 0.25
                                + slat1Rad * 0.5
                );

        SF =
                Math.pow(sfTemp, SN)
                        * Math.cos(slat1Rad)
                        / SN;

        double roTemp =
                Math.tan(
                        Math.PI * 0.25
                                + olatRad * 0.5
                );

        RO =
                RE_SCALED * SF
                        / Math.pow(roTemp, SN);
    }

    private GridConverter() {
    }

    // ============================================================
    // 위경도 -> 격자
    // ============================================================
    public static GridCoordinate toGrid(
            double lat,
            double lon
    ) {

        double ra =
                Math.tan(
                        Math.PI * 0.25
                                + lat * DEGRAD * 0.5
                );

        ra =
                RE_SCALED * SF
                        / Math.pow(ra, SN);

        double theta =
                lon * DEGRAD
                        - OLON * DEGRAD;

        if (theta > Math.PI) {
            theta -= 2.0 * Math.PI;
        }

        if (theta < -Math.PI) {
            theta += 2.0 * Math.PI;
        }

        theta *= SN;

        int nx =
                (int) (
                        ra * Math.sin(theta)
                                + XO
                                + 0.5
                );

        int ny =
                (int) (
                        RO
                                - ra * Math.cos(theta)
                                + YO
                                + 0.5
                );

        return new GridCoordinate(nx, ny);
    }

    // ============================================================
    // 격자 -> 위경도
    // ============================================================
    public static double[] toLatLon(
            int nx,
            int ny
    ) {

        double xn =
                nx - XO;

        double yn =
                RO - (ny - YO);

        double ra =
                Math.sqrt(
                        xn * xn
                                + yn * yn
                );

        if (SN < 0.0) {
            ra = -ra;
        }

        double alat =
                Math.pow(
                        RE_SCALED * SF / ra,
                        1.0 / SN
                );

        alat =
                2.0 * Math.atan(alat)
                        - Math.PI * 0.5;

        double theta;

        if (Math.abs(xn) <= 0.0) {

            theta = 0.0;

        } else {

            if (Math.abs(yn) <= 0.0) {

                theta = Math.PI * 0.5;

                if (xn < 0.0) {
                    theta = -theta;
                }

            } else {

                theta =
                        Math.atan2(xn, yn);
            }
        }

        double alon =
                theta / SN
                        + OLON * DEGRAD;

        double lat =
                alat * RADDEG;

        double lon =
                alon * RADDEG;

        return new double[]{lat, lon};
    }
}