package com.example.demo.weather.client;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.AirKoreaClient;
import com.example.demo.weather.domain.WeatherSnapshot;
import com.example.demo.weather.dto.KmaForecastResponse;
import com.example.demo.weather.forecast.ForecastSlot;
import com.example.demo.weather.service.FeelsLikeCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class WeatherClient {

    private static final String FORECAST_PATH = "/getVilageFcst";

    private static final List<String> BASE_TIMES =
            List.of("0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300");

    private static final int PUBLISH_DELAY_MINUTES = 10;

    private static final int GRID_NX_MAX = 149;
    private static final int GRID_NY_MAX = 253;

    private static final DateTimeFormatter BASE_DATE =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final DateTimeFormatter FCST_DATE_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final RestClient restClient;
    private final String apiKey;
    private final AirKoreaClient airKoreaClient;

    public WeatherClient(
            @Value("${weather.base-url}") String baseUrl,
            @Value("${weather.api-key}") String apiKey,
            AirKoreaClient airKoreaClient
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
        this.airKoreaClient = airKoreaClient;
    }

    // ============================================================
// PUBLIC API (외부 노출 1개만 유지)
// ============================================================
    public WeatherSnapshot fetchCurrent(int nx, int ny) {

        validateGrid(nx, ny);

        BaseDateTime base = resolveBaseDateTime(LocalDateTime.now());

        KmaForecastResponse response =
                call(nx, ny, base.date(), base.time());

        return parse(response, nx, ny);
    }

    // ============================================================
    // API CALL
    // ============================================================
    private KmaForecastResponse call(
            int nx,
            int ny,
            String baseDate,
            String baseTime
    ) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(FORECAST_PATH)
                            .queryParam("serviceKey", apiKey)
                            .queryParam("pageNo", 1)
                            .queryParam("numOfRows", 1000)
                            .queryParam("dataType", "JSON")
                            .queryParam("base_date", baseDate)
                            .queryParam("base_time", baseTime)
                            .queryParam("nx", nx)
                            .queryParam("ny", ny)
                            .build())
                    .retrieve()
                    .body(KmaForecastResponse.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }
    }

    // ============================================================
    // GRID VALIDATION
    // ============================================================
    public static void validateGrid(int nx, int ny) {

        if (nx < 1 || nx > GRID_NX_MAX
                || ny < 1 || ny > GRID_NY_MAX) {

            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "격자 좌표 범위를 벗어났습니다: nx=" + nx + ", ny=" + ny
            );
        }
    }

    // ============================================================
    // BASE TIME CALCULATION
    // ============================================================
    public static BaseDateTime resolveBaseDateTime(LocalDateTime now) {

        LocalDateTime threshold =
                now.minusMinutes(PUBLISH_DELAY_MINUTES);

        LocalDate date = threshold.toLocalDate();
        int hhmm = threshold.getHour() * 100 + threshold.getMinute();

        for (int i = BASE_TIMES.size() - 1; i >= 0; i--) {

            int slot = Integer.parseInt(BASE_TIMES.get(i));

            if (hhmm >= slot) {
                return new BaseDateTime(date.format(BASE_DATE), BASE_TIMES.get(i));
            }
        }

        return new BaseDateTime(
                date.minusDays(1).format(BASE_DATE),
                "2300"
        );
    }

    // ============================================================
    // PARSE RESPONSE → DOMAIN
    // ============================================================
    public static WeatherSnapshot parse(KmaForecastResponse response, int nx, int ny) {

        List<KmaForecastResponse.Item> items = extractItems(response);

        KmaForecastResponse.Item firstItem = items.get(0);
        String fcstDate = firstItem.fcstDate();
        String fcstTime = firstItem.fcstTime();

        Map<String, String> values = new HashMap<>();

        for (KmaForecastResponse.Item item : items) {
            if (fcstDate.equals(item.fcstDate())
                    && fcstTime.equals(item.fcstTime())) {
                values.put(item.category(), item.fcstValue());
            }
        }

        double temperature = required(values, "TMP");
        double humidity = required(values, "REH");
        double windSpeed = required(values, "WSD");

        double feelsLike = FeelsLikeCalculator.calculate(
                temperature,
                (int) Math.round(humidity),
                windSpeed
        );

        LocalDateTime baseDateTime =
                LocalDateTime.parse(fcstDate + fcstTime, FCST_DATE_TIME);

        return WeatherSnapshot.create(
                nx,
                ny,
                baseDateTime,
                temperature,
                humidity,
                windSpeed,
                feelsLike,
                null,
                null,
                null,
                null
        );
    }

    // ============================================================
    // RESPONSE VALIDATION
    // ============================================================
    private static List<KmaForecastResponse.Item> extractItems(
            KmaForecastResponse response
    ) {
        if (response == null
                || response.response() == null
                || response.response().header() == null) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        String resultCode = response.response().header().resultCode();

        if ("03".equals(resultCode)) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 좌표의 예보 데이터가 없습니다"
            );
        }

        if (!"00".equals(resultCode)) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        List<KmaForecastResponse.Item> items =
                response.response().body() == null
                        || response.response().body().items() == null
                        ? null
                        : response.response().body().items().item();

        if (items == null || items.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 좌표의 예보 데이터가 없습니다"
            );
        }

        return items;
    }

    private static double required(Map<String, String> values, String category) {

        String raw = values.get(category);

        if (raw == null) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }
    }

    public record BaseDateTime(String date, String time) {}

    public List<ForecastSlot> fetchForecastSlots(
            int nx,
            int ny
    ) {

        validateGrid(nx, ny);

        BaseDateTime base =
                resolveBaseDateTime(LocalDateTime.now());

        KmaForecastResponse response =
                call(
                        nx,
                        ny,
                        base.date(),
                        base.time()
                );

        return parseForecastSlots(response);
    }

    public static List<ForecastSlot> parseForecastSlots(
            KmaForecastResponse response
    ) {

        List<KmaForecastResponse.Item> items =
                extractItems(response);

        Map<String, Map<String, String>> grouped =
                new HashMap<>();

        for (KmaForecastResponse.Item item : items) {

            String key =
                    item.fcstDate() + item.fcstTime();

            grouped.computeIfAbsent(
                    key,
                    k -> new HashMap<>()
            );

            grouped.get(key).put(
                    item.category(),
                    item.fcstValue()
            );
        }

        List<ForecastSlot> result =
                new ArrayList<>();

        for (Map.Entry<String, Map<String, String>> entry
                : grouped.entrySet()) {

            Map<String, String> values =
                    entry.getValue();

            double temperature =
                    required(values, "TMP");

            double humidity =
                    required(values, "REH");

            double windSpeed =
                    required(values, "WSD");

            String pty =
                    values.getOrDefault("PTY", "0");

            double feelsLike =
                    FeelsLikeCalculator.calculate(
                            temperature,
                            (int) Math.round(humidity),
                            windSpeed
                    );

            LocalDateTime forecastTime =
                    LocalDateTime.parse(
                            entry.getKey(),
                            FCST_DATE_TIME
                    );

            result.add(
                    new ForecastSlot(
                            forecastTime,
                            temperature,
                            feelsLike,
                            humidity,
                            windSpeed,
                            0,
                            toPrecipitationType(pty)
                    )
            );
        }

        result.sort(
                java.util.Comparator.comparing(
                        ForecastSlot::forecastTime
                )
        );

        return result;
    }

    private static String toPrecipitationType(
            String pty
    ) {

        return switch (pty) {

            case "1" -> "비";
            case "2" -> "비/눈";
            case "3" -> "눈";
            case "4" -> "소나기";

            default -> "없음";
        };
    }
}