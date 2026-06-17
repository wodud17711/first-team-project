package com.example.demo.weather.support;

import com.example.demo.common.constant.DemoLocation;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.util.GridConverter;
import com.example.demo.weather.util.GridCoordinate;

import java.time.LocalDateTime;

/**
 * 기상청 키 없음/호출 실패/스냅샷 미수집 상황에서도 산책점수가 항상 나오도록
 * 부산 데모 좌표 기준 baseline(평년 수준) 스냅샷을 만든다.
 *
 * <p>가짜 점수를 박는 게 아니라, 이 baseline 값을 룰베이스(FastAPI)에 그대로 흘려
 * <b>실제 룰로 계산된 설명 가능한 점수</b>가 나오게 하는 게 목적이다.
 * 값은 6월 부산 평년 수준(맑고 무난한 날)이라 감점 룰에 거의 걸리지 않아 "안전"으로 나온다.
 * 정본: docs/08-risk-rules.md
 */
public final class WeatherFallbackSnapshot {

    private WeatherFallbackSnapshot() {
    }

    /**
     * 부산 데모 좌표 기준 baseline 스냅샷.
     *
     * @param baseDateTime 기준 시각. 실시간 수집이 아님을 드러내기 위해 호출부에서
     *                     과거 시각을 넣어주는 것을 권장(폴백 로그 구분에 사용).
     */
    public static WeatherSnapshot busanBaseline(LocalDateTime baseDateTime) {

        // 격자는 부산 좌표에서 직접 변환 (수집 경로와 동일한 단일 출처)
        GridCoordinate grid =
                GridConverter.toGrid(
                        DemoLocation.BUSAN_LAT,
                        DemoLocation.BUSAN_LON
                );

        return WeatherSnapshot.create(
                grid.nx(),
                grid.ny(),
                baseDateTime,
                24.0,   // temperature (℃)
                65.0,   // humidity (%)
                3.0,    // windSpeed (m/s)
                25.0,   // feelsLikeTemperature (℃)
                30.0,   // groundTemperature (℃)
                5,      // uvIndex (보통)
                35,     // pm10 (μg/m³, 보통)
                18      // pm25 (μg/m³, 보통)
        );
    }
}
