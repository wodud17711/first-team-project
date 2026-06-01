package com.example.demo.walk;

import com.example.demo.weather.WeatherSnapshot;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WalkScoreService {

    public WalkScoreResult calculate(
            WeatherSnapshot snapshot
    ) {

        int score = 100;

        List<String> reasons =
                new ArrayList<>();

        List<String> preparations =
                new ArrayList<>();

        double feelsLike =
                snapshot.getFeelsLikeTemperature();

        Double groundTemp =
                snapshot.getGroundTemperature();

        // ====================================
        // 체감온도
        // ====================================

        if (feelsLike >= 33) {

            score -= 40;

            reasons.add(
                    "체감온도가 매우 높습니다."
            );

            preparations.add(
                    "충분한 물을 준비하세요."
            );
        }

        else if (feelsLike >= 28) {

            score -= 20;

            reasons.add(
                    "체감온도가 다소 높습니다."
            );
        }

        // ====================================
        // 지면온도
        // ====================================

        if (
                groundTemp != null
                        && groundTemp >= 50
        ) {

            score -= 40;

            reasons.add(
                    "지면온도가 매우 높습니다."
            );

            preparations.add(
                    "신발 착용을 권장합니다."
            );
        }

        else if (
                groundTemp != null
                        && groundTemp >= 40
        ) {

            score -= 20;

            reasons.add(
                    "지면이 뜨거울 수 있습니다."
            );
        }

        score =
                Math.max(score, 0);

        RiskLevel riskLevel =
                determineRiskLevel(score);

        return new WalkScoreResult(
                score,
                riskLevel,
                reasons,
                preparations
        );
    }

    private RiskLevel determineRiskLevel(
            int score
    ) {

        if (score >= 80) {
            return RiskLevel.SAFE;
        }

        if (score >= 50) {
            return RiskLevel.CAUTION;
        }

        return RiskLevel.DANGER;
    }
}