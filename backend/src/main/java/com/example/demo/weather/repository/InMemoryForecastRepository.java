package com.example.demo.weather.repository;

import com.example.demo.weather.forecast.ForecastSlot;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class InMemoryForecastRepository implements ForecastCacheRepository {

    private List<ForecastSlot> cache = new ArrayList<>();

    @Override
    public List<ForecastSlot> findLatest() {
        return cache;
    }

    public void save(List<ForecastSlot> slots) {
        this.cache = slots;
    }
}