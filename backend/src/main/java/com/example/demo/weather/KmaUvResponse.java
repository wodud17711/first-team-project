package com.example.demo.weather;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * 기상청 생활기상지수(자외선, getUVIdxV5) JSON 응답 매핑.
 *
 * <p>응답 트리: {@code response.header} + {@code response.body.items.item[]}.
 * item 은 발표시각(date, yyyyMMddHH) 기준 3시간 간격 예측값을
 * {@code h0, h3, ... h75} 로 담는다. 룰베이스 입력에는 당일(h0~h24)만 쓰므로
 * h27 이후는 무시한다({@code ignoreUnknown}).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record KmaUvResponse(
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
            Items items
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Items(
            List<Item> item
    ) {
    }

    /**
     * 자외선지수 예측 1건. {@code h{n}} 은 발표시각 +n 시간 예측값(문자열, 데이터 없으면 빈 문자열).
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            String code,
            String areaNo,
            String date,
            String h0,
            String h3,
            String h6,
            String h9,
            String h12,
            String h15,
            String h18,
            String h21,
            String h24
    ) {
    }
}
