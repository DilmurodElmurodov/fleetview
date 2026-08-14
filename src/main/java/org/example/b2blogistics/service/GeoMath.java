package org.example.b2blogistics.service;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

public final class GeoMath {

    public static final GeometryFactory WGS84_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    private GeoMath() {
    }

    public static Point pointOf(double lon, double lat) {
        return WGS84_FACTORY.createPoint(new Coordinate(lon, lat));
    }

    public static Polygon closedPolygonOf(double[][] lonLatRing) {
        int vertexCount = lonLatRing.length;
        boolean alreadyClosed = lonLatRing[0][0] == lonLatRing[vertexCount - 1][0]
                && lonLatRing[0][1] == lonLatRing[vertexCount - 1][1];
        Coordinate[] ring = new Coordinate[alreadyClosed ? vertexCount : vertexCount + 1];
        for (int i = 0; i < vertexCount; i++) {
            ring[i] = new Coordinate(lonLatRing[i][0], lonLatRing[i][1]);
        }
        if (!alreadyClosed) {
            ring[vertexCount] = new Coordinate(lonLatRing[0][0], lonLatRing[0][1]);
        }
        return WGS84_FACTORY.createPolygon(ring);
    }

    public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public static double initialBearingDegrees(double lat1, double lon1, double lat2, double lon2) {
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dLon = Math.toRadians(lon2 - lon1);
        double y = Math.sin(dLon) * Math.cos(phi2);
        double x = Math.cos(phi1) * Math.sin(phi2)
                - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
        return (Math.toDegrees(Math.atan2(y, x)) + 360.0) % 360.0;
    }
}
