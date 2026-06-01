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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 기상청 단기예보(getVilageFcst)를 호출해 격자별 {@link WeatherSnapshot}을 만든다.
 *
 * <p>요청 좌표는 {@link GridConverter}로 변환된 격자(nx, ny)를 받는다.
 * 같은 격자+발표시각은 같은 결과이므로 호출 측에서 캐싱/중복저장을 막는다
 * ({@link WeatherSnapshotService#saveIfAbsent}).
 */
@Component
public class WeatherClient {

    private static final String FORECAST_PATH = "/getVilageFcst";

    // 단기예보 1일 8회 발표 (HHMM). 발표 10분 뒤부터 조회 가능.
    private static final List<String> BASE_TIMES =
            List.of("0200", "0500", "0800", "1100", "1400", "1700", "2000", "2300");

    private static final int PUBLISH_DELAY_MINUTES = 10;

    // KMA 5km 격자 범위 (149 x 253). 범위를 벗어난 좌표는 호출 전에 거른다
    // — 잘못된 파라미터도 일일 호출 한도를 차감하기 때문(HANDOFF 주의).
    private static final int GRID_NX_MAX = 149;
    private static final int GRID_NY_MAX = 253;

    private static final DateTimeFormatter BASE_DATE =
            DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter FCST_DATE_TIME =
            DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final RestClient restClient;
    private final String apiKey;

    public WeatherClient(
            @Value("${weather.base-url}") String baseUrl,
            @Value("${weather.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    /**
     * 격자(nx, ny)의 현재 시각 기준 가장 가까운 예보를 조회해 스냅샷으로 만든다.
     *
     * @throws BusinessException 좌표가 격자 범위를 벗어나면 {@code INVALID_INPUT},
     *                           예보 데이터가 없으면 {@code INVALID_INPUT},
     *                           API 호출/응답 자체가 실패하면 {@code WEATHER_API_ERROR}
     */
    public WeatherSnapshot fetchCurrent(int nx, int ny) {

        validateGrid(nx, ny);

        BaseDateTime base = resolveBaseDateTime(LocalDateTime.now());

        KmaForecastResponse response =
                call(nx, ny, base.date(), base.time());

        return parse(response, nx, ny);
    }

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
                            // serviceKey 는 디코딩(평문) 키 기준 — UriBuilder 가 인코딩한다.
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
    // 좌표 검증
    // ============================================================
    static void validateGrid(int nx, int ny) {

        if (nx < 1 || nx > GRID_NX_MAX
                || ny < 1 || ny > GRID_NY_MAX) {

            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "격자 좌표 범위를 벗어났습니다: nx=" + nx + ", ny=" + ny
            );
        }
    }

    // ============================================================
    // 발표 일자/시각 계산
    // 현재 시각보다 이전(발표 +10분) 발표시각 중 가장 최근 것을 고른다.
    // ============================================================
    static BaseDateTime resolveBaseDateTime(LocalDateTime now) {

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

        // 02:10 이전이면 전날 23시 발표분 사용
        return new BaseDateTime(
                date.minusDays(1).format(BASE_DATE),
                "2300"
        );
    }

    // ============================================================
    // 응답 파싱 → WeatherSnapshot
    // ============================================================
    static WeatherSnapshot parse(KmaForecastResponse response, int nx, int ny) {

        List<KmaForecastResponse.Item> items = extractItems(response);

        // 가장 이른 예보 시각의 값만 사용 (현재 시각에 가장 가까운 한 시간)
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
                null // 지면온도는 ASOS(GroundTempParser)에서 별도 보강
        );
    }

    private static List<KmaForecastResponse.Item> extractItems(
            KmaForecastResponse response
    ) {
        // 헤더 정상 코드("00")가 아니면 호출 자체 실패로 취급
        if (response == null
                || response.response() == null
                || response.response().header() == null) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }

        String resultCode = response.response().header().resultCode();

        // NODATA(03): 보통 잘못된/데이터 없는 좌표 → 입력 오류로 매핑
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

    record BaseDateTime(String date, String time) {
    }
}
