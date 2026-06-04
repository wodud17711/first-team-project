package com.example.demo.weather.dto;

/**
 * KMA ASOS 관측 레코드.
 *
 * tm  : 관측 시각 (YYYYMMDDHHMI)
 * stn : 관측소 번호
 * ta  : 기온 (℃)
 * hm  : 상대습도 (%)
 * ts  : 지면온도 (℃)
 */
public record AsosRecord(

        String tm,
        int stn,
        Double ta,
        Double hm,
        Double ts
) {

    public boolean hasGroundTemp() {
        return ts != null;
    }

    public boolean hasAirTemp() {
        return ta != null;
    }

    public boolean hasHumidity() {
        return hm != null;
    }
}