package com.example.demo.walk.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record WalkScoreRequest(

        DogInfo dog,
        WeatherInfo weather
) {

    public record DogInfo(

            String breed,
            String size,

            @JsonProperty("coat_type")
            String coatType,

            @JsonProperty("age_years")
            int ageYears,

            double weight,

            @JsonProperty("is_brachycephalic")
            boolean isBrachycephalic,

            @JsonProperty("heat_tolerance")
            int heatTolerance,

            @JsonProperty("cold_tolerance")
            int coldTolerance
    ) {
    }

    public record WeatherInfo(

            double temperature,

            @JsonProperty("feels_like")
            double feelsLike,

            int humidity,

            @JsonProperty("wind_speed")
            double windSpeed,

            @JsonProperty("ground_temperature")
            Double groundTemperature,

            int pm10,

            int pm25,

            @JsonProperty("uv_index")
            int uvIndex
    ) {
    }
}