package com.example.demo.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * 에어코리아 대기오염정보(getCtprvnRltmMesureDnsty, 시도별 실시간) JSON 응답 매핑.
 *
 * <p>응답 트리: {@code response.header} + {@code response.body.items[]}.
 * 자외선(getUVIdxV5)과 달리 items 가 곧바로 배열이다(item 한 겹 없음).
 * 한 번 호출(sidoName)로 해당 시도의 모든 측정소가 내려온다.
 *
 * <p>룰베이스 미세먼지 가중치 입력(pm10/pm25)을 제공한다. 등급·기타 오염물질은
 * 현재 쓰지 않으므로 무시한다({@code ignoreUnknown}).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AirKoreaResponse(
        Response response
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(
            Header header,
            Body body
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Header(
            String resultCode,
            String resultMsg
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Body(
            List<Item> items,
            Integer totalCount
    ) {
    }

    /**
     * 한 측정소의 실시간 측정값. 결측은 {@code "-"} 또는 빈 문자열로 내려온다.
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            String stationName,
            String sidoName,
            String dataTime,
            String pm10Value,
            String pm25Value
    ) {
    }
}
