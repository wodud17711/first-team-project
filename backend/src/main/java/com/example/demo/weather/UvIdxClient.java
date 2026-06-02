package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 기상청 생활기상지수(자외선, getUVIdxV5)를 호출해 지점별 {@link UvIndex}를 만든다.
 *
 * <p>단기예보가 격자(nx, ny)를 쓰는 것과 달리 자외선지수는
 * 행정구역코드(areaNo, 10자리)를 입력으로 받는다. 좌표→areaNo 매핑은 별도 후속 작업이며
 * 현재는 호출 측에서 areaNo 를 직접 넘긴다(MVP: 서울 {@code 1100000000}).
 *
 * <p>룰베이스 v1.2 의 UV_HIGH/UV_VERY_HIGH 입력 데이터를 제공한다.
 */
@Component
public class UvIdxClient {

    private static final String UV_PATH = "/getUVIdxV5";

    // 자외선지수는 1일 2회(06, 18시) 발표. 발표시각보다 이전의 가장 최근 슬롯을 쓴다.
    private static final List<Integer> BASE_HOURS = List.of(6, 18);

    // 발표시각 기준 당일(h0~h24, 3시간 간격) 오프셋만 파싱한다.
    private static final List<Integer> HOUR_OFFSETS =
            List.of(0, 3, 6, 9, 12, 15, 18, 21, 24);

    private static final DateTimeFormatter BASE_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHH");

    private final RestClient restClient;
    private final String apiKey;

    public UvIdxClient(
            @Value("${livingweather.base-url}") String baseUrl,
            @Value("${livingweather.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    /**
     * 행정구역코드(areaNo)의 현재 발표 기준 당일 자외선지수를 조회한다.
     *
     * @throws BusinessException areaNo 형식이 잘못되면 {@code INVALID_INPUT},
     *                           데이터가 없으면 {@code INVALID_INPUT},
     *                           API 호출/응답 자체가 실패하면 {@code WEATHER_API_ERROR}
     */
    public UvIndex fetch(String areaNo) {

        validateAreaNo(areaNo);

        String time = resolveBaseTime(LocalDateTime.now());

        KmaUvResponse response = call(areaNo, time);

        return parse(response, areaNo);
    }

    private KmaUvResponse call(String areaNo, String time) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(UV_PATH)
                            // serviceKey 는 디코딩(평문) 키 기준 — UriBuilder 가 인코딩한다.
                            .queryParam("serviceKey", apiKey)
                            .queryParam("pageNo", 1)
                            .queryParam("numOfRows", 10)
                            .queryParam("dataType", "JSON")
                            .queryParam("areaNo", areaNo)
                            .queryParam("time", time)
                            .build())
                    .retrieve()
                    .body(KmaUvResponse.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }
    }

    // ============================================================
    // areaNo 검증 — 잘못된 파라미터도 일일 호출 한도를 차감하므로 호출 전에 거른다.
    // ============================================================
    static void validateAreaNo(String areaNo) {

        if (areaNo == null || !areaNo.matches("\\d{10}")) {

            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "행정구역코드(areaNo)는 10자리 숫자여야 합니다: " + areaNo
            );
        }
    }

    // ============================================================
    // 발표시각 계산 — 현재 시각 이전의 가장 최근 발표 슬롯(06/18).
    // ============================================================
    static String resolveBaseTime(LocalDateTime now) {

        LocalDate date = now.toLocalDate();
        int hour = now.getHour();

        for (int i = BASE_HOURS.size() - 1; i >= 0; i--) {

            int slot = BASE_HOURS.get(i);

            if (hour >= slot) {
                return date.atTime(slot, 0).format(BASE_TIME);
            }
        }

        // 06시 이전이면 전날 18시 발표분 사용
        return date.minusDays(1).atTime(18, 0).format(BASE_TIME);
    }

    // ============================================================
    // 응답 파싱 → UvIndex
    // ============================================================
    static UvIndex parse(KmaUvResponse response, String areaNo) {

        KmaUvResponse.Item item = extractItem(response);

        Map<Integer, Integer> hourly = new LinkedHashMap<>();

        for (int offset : HOUR_OFFSETS) {

            Integer value = parseUv(hourValue(item, offset));

            if (value != null) {
                hourly.put(offset, value);
            }
        }

        LocalDateTime baseDateTime =
                LocalDateTime.parse(item.date(), BASE_TIME);

        return new UvIndex(areaNo, baseDateTime, hourly);
    }

    private static KmaUvResponse.Item extractItem(KmaUvResponse response) {

        // 헤더 정상 코드("00")가 아니면 호출 자체 실패로 취급
        if (response == null
                || response.response() == null
                || response.response().header() == null) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        String resultCode = response.response().header().resultCode();

        // NODATA(03): 보통 잘못된/데이터 없는 지역 → 입력 오류로 매핑
        if ("03".equals(resultCode)) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 지역의 자외선지수 데이터가 없습니다"
            );
        }

        if (!"00".equals(resultCode)) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        List<KmaUvResponse.Item> items =
                response.response().body() == null
                        || response.response().body().items() == null
                        ? null
                        : response.response().body().items().item();

        if (items == null || items.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 지역의 자외선지수 데이터가 없습니다"
            );
        }

        return items.get(0);
    }

    private static String hourValue(KmaUvResponse.Item item, int offset) {
        return switch (offset) {
            case 0 -> item.h0();
            case 3 -> item.h3();
            case 6 -> item.h6();
            case 9 -> item.h9();
            case 12 -> item.h12();
            case 15 -> item.h15();
            case 18 -> item.h18();
            case 21 -> item.h21();
            case 24 -> item.h24();
            default -> null;
        };
    }

    private static Integer parseUv(String raw) {

        if (raw == null || raw.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
