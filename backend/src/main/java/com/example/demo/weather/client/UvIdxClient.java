package com.example.demo.weather.client;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.dto.KmaUvResponse;
import com.example.demo.weather.domain.UvIndex;
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

@Component
public class UvIdxClient {

    private static final String UV_PATH = "/getUVIdxV5";

    private static final List<Integer> BASE_HOURS = List.of(6, 18);
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

    // ============================================================
    // PUBLIC API
    // ============================================================
    public UvIndex fetch(String areaNo) {

        validateAreaNo(areaNo);

        String time = resolveBaseTime(LocalDateTime.now());

        KmaUvResponse response = call(areaNo, time);

        return parse(response, areaNo);
    }

    // ============================================================
    // CALL
    // ============================================================
    private KmaUvResponse call(String areaNo, String time) {

        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(UV_PATH)
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
    // VALIDATION
    // ============================================================
    public static void validateAreaNo(String areaNo) {

        if (areaNo == null || !areaNo.matches("\\d{10}")) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "행정구역코드(areaNo)는 10자리 숫자여야 합니다: " + areaNo
            );
        }
    }

    // ============================================================
    // BASE TIME
    // ============================================================
    public static String resolveBaseTime(LocalDateTime now) {

        LocalDate date = now.toLocalDate();
        int hour = now.getHour();

        for (int i = BASE_HOURS.size() - 1; i >= 0; i--) {

            int slot = BASE_HOURS.get(i);

            if (hour >= slot) {
                return date.atTime(slot, 0).format(BASE_TIME);
            }
        }

        return date.minusDays(1).atTime(18, 0).format(BASE_TIME);
    }

    // ============================================================
    // PARSE
    // ============================================================
    public static UvIndex parse(KmaUvResponse response, String areaNo) {

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

    // ============================================================
    // INTERNAL HELPERS
    // ============================================================
    private static KmaUvResponse.Item extractItem(KmaUvResponse response) {

        if (response == null
                || response.response() == null
                || response.response().header() == null) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        String resultCode = response.response().header().resultCode();

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