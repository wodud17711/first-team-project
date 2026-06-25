package com.example.demo.walk.scheduler;

import com.example.demo.walk.client.AiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * FastAPI(산책위험도) 콜드스타트 완화용 워밍 스케줄러.
 *
 * <p>Render 무료 인스턴스는 15분 무활동 시 슬립한다. BE 가 활성인 동안 FastAPI /health 를
 * 주기적으로 핑해 깨워둠으로써, 사용자가 산책점수를 누르기 전에 FastAPI 를 미리 준비시킨다.
 *
 * <p><b>한계</b>: BE(Render) 자체도 무료라 슬립하면 이 스케줄러도 함께 멈춘다. 즉 "BE 는
 * 깨어있는데 FastAPI 만 자는 구간"만 메우며, 콜드스타트의 완전한 해결은 아니다.
 * 둘 다 자는 상태(야간·발표 직전 첫 접속)는 별도의 외부 워밍/수동 워밍으로 대비한다.
 *
 * <p>{@code app.ai.warmup.enabled=true} 일 때만 활성(운영 prod 에서 on, 로컬 기본 off).
 */
@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.ai.warmup.enabled", havingValue = "true")
public class AiWarmupScheduler {

    private final AiClient aiClient;

    /**
     * 기본 10분 주기(슬립 15분보다 안전마진), 부팅 5분 후 첫 실행.
     * 값은 프로퍼티로 조정 가능(검증 시 짧게).
     */
    @Scheduled(
            initialDelayString = "${app.ai.warmup.initial-delay-ms:300000}",
            fixedRateString = "${app.ai.warmup.interval-ms:600000}"
    )
    public void warmUpAi() {

        boolean ok = aiClient.pingHealth();

        if (ok) {
            log.debug("[AiWarmup] FastAPI /health 핑 성공");
        } else {
            log.warn("[AiWarmup] FastAPI /health 핑 실패 (콜드스타트 중이거나 미기동)");
        }
    }
}
