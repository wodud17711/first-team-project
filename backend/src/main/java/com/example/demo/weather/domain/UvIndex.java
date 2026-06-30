package com.example.demo.weather.domain;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.Map;

/**
 * 한 지점(areaNo)의 자외선지수 당일 예측.
 *
 * <p>{@code hourly} 의 키는 발표시각 기준 시간 오프셋(0, 3, 6 ... 24),
 * 값은 자외선지수(0~11+). 데이터가 없는 시간대(빈 문자열)는 담지 않는다.
 *
 * <p>위험도 입력으로는 <b>실제 현재 시각</b>에 해당하는 값({@link #currentAt(LocalDateTime)})을 쓴다.
 * 발표시각(+0h)인 {@link #current()} 는 06시/18시 값이라 항상 0에 가깝다 — 현재값 용도로 쓰면 안 된다.
 */
public record UvIndex(
        String areaNo,
        LocalDateTime baseDateTime,
        Map<Integer, Integer> hourly
) {

    /** 발표시각(+0h, 06시 또는 18시)의 자외선지수. 데이터가 없으면 {@code null}. */
    public Integer current() {
        return hourly.get(0);
    }

    /** 발표시각 기준 {@code hourOffset} 시간 뒤 자외선지수. 없으면 {@code null}. */
    public Integer at(int hourOffset) {
        return hourly.get(hourOffset);
    }

    /**
     * {@code now} 에 가장 가까운 예측 시간대의 자외선지수.
     *
     * <p>발표시각(baseDateTime)부터의 경과 시간과 가장 가까운 오프셋 슬롯(0,3,6…24)을 골라
     * 그 값을 반환한다. 예: 06시 발표 + 정오 호출 → 경과 6h → h6(=12시) 값(자외선 피크).
     * 데이터가 비어 있으면 {@code null}.
     */
    public Integer currentAt(LocalDateTime now) {

        if (hourly.isEmpty()) {
            return null;
        }

        double elapsedHours =
                Duration.between(baseDateTime, now).toMinutes() / 60.0;

        return hourly.entrySet().stream()
                .min(Comparator.comparingDouble(
                        e -> Math.abs(e.getKey() - elapsedHours)))
                .map(Map.Entry::getValue)
                .orElse(null);
    }
}
