package com.example.demo.walk;

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