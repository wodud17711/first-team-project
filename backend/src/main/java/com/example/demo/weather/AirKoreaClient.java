package com.example.demo.weather;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

/**
 * 에어코리아 대기오염정보(getCtprvnRltmMesureDnsty, 시도별 실시간)를 호출해
 * 좌표 위치의 미세먼지({@link AirQuality})를 가져온다.
 *
 * <p>좌표→최근접 측정소는 {@link AirQualityStationLocator} 가 고른다. 고른 측정소의
 * 시도로 <b>1회만</b> 호출하면 그 시도 전체 측정소가 내려오므로(좌표마다·측정소마다
 * 호출하지 않음), 일일 호출 한도(개발 1,000회)를 아낀다.
 *
 * <p>응답에서 최근접 측정소명을 우선 찾고, 표의 측정소명이 실제 응답과 다르면
 * 해당 시도에서 PM 값이 유효한 첫 측정소로 폴백한다.
 *
 * <p>룰베이스 미세먼지 가중치(pm10/pm25) 입력 데이터를 제공한다.
 */
@Component
public class AirKoreaClient {

    private static final String CTPRVN_PATH = "/getCtprvnRltmMesureDnsty";

    // 한 시도의 측정소 수(최대 ~40)를 한 번에 받는다. 페이지를 나누면 호출이 늘어난다.
    private static final int NUM_OF_ROWS = 100;

    // 결측 표기: 에어코리아는 값이 없으면 "-" 를 내려준다.
    private static final String MISSING = "-";

    private final RestClient restClient;
    private final String apiKey;

    public AirKoreaClient(
            @Value("${airkorea.base-url}") String baseUrl,
            @Value("${airkorea.api-key}") String apiKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    /**
     * 주어진 좌표에서 가장 가까운 측정소의 미세먼지를 조회한다.
     *
     * @throws BusinessException API 호출/응답이 실패하면 {@code AIRQUALITY_API_ERROR}
     */
    public AirQuality fetchAirQuality(double lat, double lon) {

        AirQualityStationLocator.Nearest nearest =
                AirQualityStationLocator.nearest(lat, lon);

        AirKoreaResponse response =
                call(nearest.station().sidoName());

        return select(response, nearest.station().stationName());
    }

    private AirKoreaResponse call(String sidoName) {

        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(CTPRVN_PATH)
                            // serviceKey 는 디코딩(평문) 키 기준 — UriBuilder 가 인코딩한다.
                            .queryParam("serviceKey", apiKey)
                            .queryParam("returnType", "json")
                            .queryParam("numOfRows", NUM_OF_ROWS)
                            .queryParam("pageNo", 1)
                            .queryParam("sidoName", sidoName)
                            .queryParam("ver", "1.0")
                            .build())
                    .retrieve()
                    .body(AirKoreaResponse.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.AIRQUALITY_API_ERROR);
        }
    }

    // ============================================================
    // 응답에서 측정소 선택 → AirQuality
    // 최근접 측정소명 우선. 매칭이 없거나 매칭돼도 PM 이 전부 결측이면
    // PM 값이 유효한 첫 측정소로 폴백.
    // ============================================================
    static AirQuality select(AirKoreaResponse response, String preferredStation) {

        List<AirKoreaResponse.Item> items = extractItems(response);

        AirKoreaResponse.Item matched = null;
        AirKoreaResponse.Item firstWithPm = null;

        for (AirKoreaResponse.Item item : items) {

            if (firstWithPm == null && hasPm(item)) {
                firstWithPm = item;
            }

            if (matched == null && preferredStation.equals(item.stationName())) {
                matched = item;
            }
        }

        // 최근접 측정소가 매칭돼도 PM 이 전부 결측이면, 같은 시도에서 값이
        // 있는 첫 측정소로 폴백한다(예: 부산 광복동이 "-"/"-" 로 내려오는 경우).
        AirKoreaResponse.Item chosen =
                (matched != null && hasPm(matched)) ? matched : firstWithPm;

        if (chosen == null) {
            throw new BusinessException(
                    ErrorCode.AIRQUALITY_API_ERROR,
                    "측정소 응답에 유효한 미세먼지 값이 없습니다"
            );
        }

        return new AirQuality(
                chosen.sidoName(),
                chosen.stationName(),
                chosen.dataTime(),
                parsePm(chosen.pm10Value()),
                parsePm(chosen.pm25Value())
        );
    }

    private static List<AirKoreaResponse.Item> extractItems(AirKoreaResponse response) {

        if (response == null
                || response.response() == null
                || response.response().header() == null) {
            throw new BusinessException(ErrorCode.AIRQUALITY_API_ERROR);
        }

        if (!"00".equals(response.response().header().resultCode())) {
            throw new BusinessException(ErrorCode.AIRQUALITY_API_ERROR);
        }

        List<AirKoreaResponse.Item> items =
                response.response().body() == null
                        ? null
                        : response.response().body().items();

        if (items == null || items.isEmpty()) {
            throw new BusinessException(ErrorCode.AIRQUALITY_API_ERROR);
        }

        return items;
    }

    private static boolean hasPm(AirKoreaResponse.Item item) {
        return parsePm(item.pm10Value()) != null
                || parsePm(item.pm25Value()) != null;
    }

    private static Integer parsePm(String raw) {

        if (raw == null || raw.isBlank() || MISSING.equals(raw.trim())) {
            return null;
        }

        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
