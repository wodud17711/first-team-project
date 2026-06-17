package com.example.demo.walk.dto;

import com.example.demo.weather.domain.WeatherSnapshot;

import java.time.LocalDateTime;
import java.util.List;

public record WalkScoreResponse(

        int score,
        String level,
        List<String> reasons,
        List<String> reasonCodes,
        List<String> topReasons,
        List<String> topReasonCodes,
        Weather weather
) {

    /**
     * 점수 산출에 실제 사용된 날씨 스냅샷의 실측값. FE 홈 산책지수 카드의 날씨 줄 표시용.
     *
     * <p>숫자 원본을 그대로 전달하고, 등급 라벨 변환(미세먼지 좋음/보통/나쁨, 바람 약함/보통/강함,
     * 자외선 낮음/보통/높음 등)은 FE 표현 영역에서 처리한다. 하늘상태(sky) 코드는 현재 스냅샷에
     * 없어 제외하며, 날씨 아이콘은 FE 기본값을 유지한다.
     *
     * @param measuredAt 스냅샷 기준 시각. baseline/직전 폴백 여부 판단 및 신선도 표시에 활용 가능.
     */
    public record Weather(
            double temperature,
            Double groundTemperature,
            double humidity,
            double feelsLikeTemperature,
            double windSpeed,
            Integer uvIndex,
            Integer pm10,
            Integer pm25,
            LocalDateTime measuredAt
    ) {
    }

    public static WalkScoreResponse from(
            WalkScoreResult result,
            WeatherSnapshot snapshot
    ) {

        return new WalkScoreResponse(
                result.score(),
                result.level(),
                result.reasons(),
                result.reasonCodes(),
                result.topReasons(),
                result.topReasonCodes(),
                new Weather(
                        snapshot.getTemperature(),
                        snapshot.getGroundTemperature(),
                        snapshot.getHumidity(),
                        snapshot.getFeelsLikeTemperature(),
                        snapshot.getWindSpeed(),
                        snapshot.getUvIndex(),
                        snapshot.getPm10(),
                        snapshot.getPm25(),
                        snapshot.getBaseDateTime()
                )
        );
    }
}
