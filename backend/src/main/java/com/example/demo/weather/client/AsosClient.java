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

@Component
public class AsosClient {

    private static final String SFCTM3_PATH = "/kma_sfctm3.php";
    private static final int ALL_STATIONS = 0;
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

    // ============================================================
    // PUBLIC API
    // ============================================================
    public Double fetchGroundTemp(double lat, double lon) {

        String tm = resolveBaseTime(LocalDateTime.now());

        String body = call(tm);

        List<AsosRecord> records = GroundTempParser.parse(body);

        return GroundTempParser.getGroundTempAt(records, lat, lon);
    }

    // ============================================================
    // API CALL
    // ============================================================
    private String call(String tm) {

        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path(SFCTM3_PATH)
                            .queryParam("tm", tm)
                            .queryParam("stn", ALL_STATIONS)
                            .queryParam("help", 0)
                            .queryParam("authKey", authKey)
                            .build())
                    .retrieve()
                    .body(String.class);

        } catch (RestClientException e) {
            throw new BusinessException(ErrorCode.WEATHER_API_ERROR);
        }
    }

    // ============================================================
    // BASE TIME
    // ============================================================
    public static String resolveBaseTime(LocalDateTime now) {

        LocalDateTime observed = now
                .minusMinutes(OBSERVATION_DELAY_MINUTES)
                .truncatedTo(ChronoUnit.HOURS);

        return observed.format(TM);
    }
}