package com.example.demo.walk;

import com.example.demo.weather.WeatherSnapshot;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class WalkScoreService {

    public WalkScoreResult calculate(
            WeatherSnapshot snapshot,
            DogWeatherProfile dog
    ) {

        int score = 100;

        List<String> reasons =
                new ArrayList<>();

        List<String> preparations =
                new ArrayList<>();

        double temp =
                snapshot.getTemperature();

        double feelsLike =
                snapshot.getFeelsLikeTemperature();

        Double groundTemp =
                snapshot.getGroundTemperature();

        double humidity =
                snapshot.getHumidity();

        double wind =
                snapshot.getWindSpeed();

        // ====================================
        // 지면온도
        // ====================================

        if (groundTemp != null && groundTemp >= 50) {

            score -= 40;

            reasons.add(
                    "발바닥 화상 위험이 있습니다."
            );

            preparations.add(
                    "신발 착용을 권장합니다."
            );
        }

        else if (groundTemp != null && groundTemp >= 40) {

            score -= 20;

            reasons.add(
                    "지면이 뜨거울 수 있습니다."
            );
        }

        // ====================================
        // 체감온도
        // ====================================

        if (feelsLike >= 33) {

            score -= 20;

            reasons.add(
                    "체감온도가 매우 높습니다."
            );
        }

        if (feelsLike <= -5) {

            score -= 20;

            reasons.add(
                    "체감온도가 매우 낮습니다."
            );
        }

        // ====================================
        // 단두종
        // ====================================

        if (
                dog.brachycephalic()
                        && temp >= 28
        ) {

            score -= 25;

            reasons.add(
                    "단두종은 더위에 취약합니다."
            );
        }

        // ====================================
        // 더위 취약
        // ====================================

        if (
                dog.heatTolerance() <= 2
                        && temp >= 28
        ) {

            score -= 15;

            reasons.add(
                    "더위에 취약한 견종입니다."
            );
        }

        // ====================================
        // 추위 취약
        // ====================================

        if (
                dog.coldTolerance() <= 2
                        && temp <= 0
        ) {

            score -= 15;

            reasons.add(
                    "추위에 취약한 견종입니다."
            );
        }

        // ====================================
        // 장모종
        // ====================================

        if (
                dog.longCoat()
                        && temp >= 28
        ) {

            score -= 10;

            reasons.add(
                    "장모종에게 다소 더운 날씨입니다."
            );
        }

        // ====================================
        // 단모 소형견
        // ====================================

        if (
                dog.smallDog()
                        && dog.shortCoat()
                        && temp <= 5
        ) {

            score -= 10;

            reasons.add(
                    "소형 단모견에게 추운 날씨입니다."
            );

            preparations.add(
                    "외출복 착용을 권장합니다."
            );
        }

        // ====================================
        // 습도
        // ====================================

        if (
                humidity >= 70
                        && temp >= 28
        ) {

            score -= 10;

            reasons.add(
                    "습도가 높아 열사병 위험이 있습니다."
            );
        }

        // ====================================
        // 강풍
        // ====================================

        if (wind >= 9) {

            score -= 10;

            reasons.add(
                    "강풍이 불고 있습니다."
            );
        }

        // ====================================
        // 노령견
        // ====================================

        if (
                dog.age() >= 8
                        && (temp >= 28 || temp <= 0)
        ) {

            score -= 10;

            reasons.add(
                    "노령견에게 부담스러운 날씨입니다."
            );
        }

        score = Math.max(score, 0);

        return new WalkScoreResult(
                score,
                determineRiskLevel(score),
                reasons,
                preparations
        );
    }

    private RiskLevel determineRiskLevel(
            int score
    ) {

        if (score >= 70) {
            return RiskLevel.SAFE;
        }

        if (score >= 40) {
            return RiskLevel.CAUTION;
        }

        return RiskLevel.DANGER;
    }
}