package com.example.demo.walk.domain;

public record DogWeatherProfile(

        boolean brachycephalic,

        int heatTolerance,   // 1~5
        int coldTolerance,   // 1~5

        boolean longCoat,
        boolean shortCoat,

        boolean smallDog,

        int age
) {
}