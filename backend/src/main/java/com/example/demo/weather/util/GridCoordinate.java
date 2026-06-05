package com.example.demo.weather.util;

public record GridCoordinate(
        int nx,
        int ny
) {

    private static final int NX = 149;
    private static final int NY = 253;

    public boolean inBounds() {
        return 1 <= nx
                && nx <= NX
                && 1 <= ny
                && ny <= NY;
    }
}