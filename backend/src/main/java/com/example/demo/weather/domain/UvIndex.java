package com.example.demo.weather.domain;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 한 지점(areaNo)의 자외선지수 당일 예측.
 *
 * <p>{@code hourly} 의 키는 발표시각 기준 시간 오프셋(0, 3, 6 ... 24),
 * 값은 자외선지수(0~11+). 데이터가 없는 시간대(빈 문자열)는 담지 않는다.
 *
 * <p>위험도 입력으로는 발표시각 기준 현재값({@link #current()})을 쓴다.
 */
public record UvIndex(
        String areaNo,
        LocalDateTime baseDateTime,
        Map<Integer, Integer> hourly
) {

    /** 발표시각(+0h)의 자외선지수. 데이터가 없으면 {@code null}. */
    public Integer current() {
        return hourly.get(0);
    }

    /** 발표시각 기준 {@code hourOffset} 시간 뒤 자외선지수. 없으면 {@code null}. */
    public Integer at(int hourOffset) {
        return hourly.get(hourOffset);
    }
}
