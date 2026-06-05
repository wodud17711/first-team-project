package com.example.demo.weather.service;

public final class FeelsLikeCalculator {

    private FeelsLikeCalculator() {
    }

    public static double calculate(
            double tempC,
            int humidity,
            double windMs
    ) {

        // ========================================
        // 여름: Steadman
        // temp >= 27°C
        // ========================================
        if (tempC >= 27.0) {

            double vaporPressure =
                    (humidity / 100.0)
                            * 6.105
                            * Math.exp(
                            17.27 * tempC
                                    / (237.7 + tempC)
                    );

            double apparentTemp =
                    1.07 * tempC
                            + 0.2 * vaporPressure
                            - 0.65 * windMs
                            - 2.7;

            return round1(apparentTemp);
        }

        // ========================================
        // 겨울: Wind Chill
        // temp <= 10°C && wind >= 1.3m/s
        // ========================================
        if (tempC <= 10.0 && windMs >= 1.3) {

            double windKmh = windMs * 3.6;

            double windPow =
                    Math.pow(windKmh, 0.16);

            double windChill =
                    13.12
                            + 0.6215 * tempC
                            - 11.37 * windPow
                            + 0.3965 * tempC * windPow;

            return round1(windChill);
        }

        // ========================================
        // 봄/가을 또는 무풍 겨울
        // ========================================
        return round1(tempC);
    }

    private static double round1(double value) {

        return Math.round(value * 10.0) / 10.0;
    }
}