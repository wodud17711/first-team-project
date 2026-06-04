package com.example.demo.weather;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GridConverterTest {

    @Test
    void known_cities_convert_success() {

        assertGrid(
                37.5665,
                126.9780,
                60,
                127
        ); // 서울

        assertGrid(
                35.1796,
                129.0756,
                98,
                76
        ); // 부산

        assertGrid(
                33.4996,
                126.5312,
                53,
                38
        ); // 제주

        assertGrid(
                37.4563,
                126.7052,
                55,
                124
        ); // 인천

        assertGrid(
                36.3504,
                127.3845,
                67,
                100
        ); // 대전
    }

    @Test
    void round_trip_success() {

        GridCoordinate grid =
                GridConverter.toGrid(
                        37.5665,
                        126.9780
                );

        double[] latLon =
                GridConverter.toLatLon(
                        grid.nx(),
                        grid.ny()
                );

        GridCoordinate regrid =
                GridConverter.toGrid(
                        latLon[0],
                        latLon[1]
                );

        assertThat(regrid.nx())
                .isEqualTo(grid.nx());

        assertThat(regrid.ny())
                .isEqualTo(grid.ny());
    }

    @Test
    void bounds_success() {

        GridCoordinate seoul =
                GridConverter.toGrid(
                        37.5665,
                        126.9780
                );

        assertThat(seoul.inBounds())
                .isTrue();

        GridCoordinate tokyo =
                GridConverter.toGrid(
                        35.6762,
                        139.6503
                );

        assertThat(tokyo.inBounds())
                .isFalse();
    }

    private void assertGrid(
            double lat,
            double lon,
            int expectedNx,
            int expectedNy
    ) {

        GridCoordinate result =
                GridConverter.toGrid(
                        lat,
                        lon
                );

        assertThat(result.nx())
                .isBetween(
                        expectedNx - 1,
                        expectedNx + 1
                );

        assertThat(result.ny())
                .isBetween(
                        expectedNy - 1,
                        expectedNy + 1
                );
    }
}