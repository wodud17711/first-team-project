package com.example.demo.weather.repository;

import com.example.demo.weather.forecast.ForecastSlot;

import java.util.List;

public interface ForecastCacheRepository {
    List<ForecastSlot> findLatest();
}