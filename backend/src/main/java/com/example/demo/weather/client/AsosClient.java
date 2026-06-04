package com.example.demo.weather.client;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.common.exception.ErrorCode;
import com.example.demo.weather.dto.AsosRecord;
import com.example.demo.weather.util.GroundTempParser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 기상청 API허브 지상관측 시간자료(kma_sfctm3.php)를 호출해 지면온도(TS)를 가져온다.
 *
 * <p>폭염 룰의 발바닥 화상 판단 입력값. 단기예보(getVilageFcst)·생활기상지수(getUVIdxV5)와
 * 다른 서비스(기상청 API허브)이며, 응답은 JSON 이 아니라 공백 구분 텍스트다.
 * 파싱은 {@link GroundTempParser}(이미 포팅 완료)에 위임한다.
 *
 * <p>한 번 호출(stn=0)로 전국 관측소가 내려오므로, 좌표는
 * {@link GroundTempParser#getGroundTempAt}로 가장 가까운 관측소 값을 고른다
 * — 좌표마다 호출하지 않아 일일 호출 한도를 아낀다.
 */
@Component
public class AsosClient {

    private static final String SFCTM3_PATH = "/kma_sfctm3.php";

    // 전국 지점 일괄 조회. 좌표 → 최근접 관측소는 파서가 고른다.
    private static final int ALL_STATIONS = 0;

    // 매시 정시 관측. 정시 후 약 10분 뒤부터 조회 가능.
    private static final int OBSERVATION_DELAY_MINUTES = 10;

    private static final DateTimeFormatter TM =
            DateTimeFormatter.ofPattern("yyyyMMddHHmm");

    private final RestClient restClient;
    private final String authKey;

    public AsosClient(
            @Value("${kma.hub.base-url}") String baseUrl,
            @Value("${kma.hub.api-key}") String authKey
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.authKey = authKey;
    }

    /**
     * 주어진 좌표의 현재 시각 기준 지면온도(℃)를 조회한다.
     *
     * @return 가장 가까운 관측소의 지면온도. 결측이거나 관측소가 멀면 {@code null}.
     * @throws BusinessException API 호출/응답 자체가 실패하면 {@code WEATHER_API_ERROR}
     */
    public Double fetchGroundTemp(double lat, double lon) {

        String tm = resolveBaseTime(LocalDateTime.now());

        String body = call(tm);

        List<AsosRecord> records = GroundTempParser.parse(body);

        return GroundTempParser.getGroundTempAt(records, lat, lon);
    }

    private String call(String tm) {

        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(SFCTM3_PATH)
                            .queryParam("tm", tm)
                            .queryParam("stn", ALL_STATIONS)
                            .queryParam("help", 0)
                            // API허브 인증키. UriBuilder 가 인코딩 처리.
                            .queryParam("authKey", authKey)
                            .build())
                    .retrieve()
                    .body(String.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }
    }

    // ============================================================
    // 관측 시각 계산
    // 현재 시각에서 관측 지연(10분)을 뺀 시각의 정시.
    // ============================================================
    static String resolveBaseTime(LocalDateTime now) {

        LocalDateTime observed = now
                .minusMinutes(OBSERVATION_DELAY_MINUTES)
                .truncatedTo(ChronoUnit.HOURS);

        return observed.format(TM);
    }
}
