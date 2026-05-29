package com.example.demo.weather;

public class FeelsLikeCalculator {

    private FeelsLikeCalculator() {
    }

    /**
     * 체감온도 계산 (Steadman)
     *
     * @param temperature 기온(℃)
     * @param humidity 상대습도(%)
     * @param windSpeed 풍속(m/s)
     * @return 체감온도(℃)
     */
    public static double calculate(
            double temperature,
            double humidity,
            double windSpeed
    ) {

        // 풍속 m/s → km/h 변환
        double windKmh = windSpeed * 3.6;

        // 수증기압(hPa)
        double vaporPressure =
                (humidity / 100.0)
                        * 6.105
                        * Math.exp(
                        (17.27 * temperature)
                                / (237.7 + temperature)
                );

        double feelsLike =
                temperature
                        + 0.33 * vaporPressure
                        - 0.70 * windKmh
                        - 4.00;

        if (Double.isNaN(feelsLike)
                || Double.isInfinite(feelsLike)) {

            return temperature;
        }

        return Math.round(feelsLike * 10.0)
                / 10.0;
    }
}