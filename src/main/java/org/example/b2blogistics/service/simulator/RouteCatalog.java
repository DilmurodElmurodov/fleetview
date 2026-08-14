package org.example.b2blogistics.service.simulator;

import java.util.List;

public final class RouteCatalog {

    public record Route(String name, double[][] waypoints) {
    }

    private RouteCatalog() {
    }

    public static final List<Route> ROUTES = List.of(
            new Route("M39 Tashkent → Samarkand", new double[][]{
                    {69.2797, 41.3111}, {69.2401, 41.2646}, {69.1354, 41.1858},
                    {68.9046, 41.0510}, {68.7810, 40.9101}, {68.6620, 40.7770},
                    {68.7846, 40.4897}, {68.7460, 40.2500}, {68.4310, 40.1200},
                    {67.9945, 40.1158}, {67.8422, 40.0217}, {67.5680, 39.9200},
                    {67.2650, 39.7680}, {66.9749, 39.6542}
            }),
            new Route("A373 Tashkent → Kokand (Kamchik Pass)", new double[][]{
                    {69.2797, 41.3111}, {69.3550, 41.2620}, {69.6300, 41.1150},
                    {70.1436, 41.0167}, {70.3820, 40.9800}, {70.5000, 40.8800},
                    {70.6600, 40.7500}, {70.7900, 40.6100}, {70.9420, 40.5286}
            }),
            new Route("M37 Samarkand → Bukhara", new double[][]{
                    {66.9749, 39.6542}, {66.7500, 39.7200}, {66.4200, 39.7700},
                    {65.9600, 39.7900}, {65.5300, 39.8100}, {65.1500, 39.7900},
                    {64.7800, 39.7850}, {64.4286, 39.7747}
            }),
            new Route("M34 Tashkent → Chirchiq → Gazalkent", new double[][]{
                    {69.2797, 41.3111}, {69.3400, 41.3800}, {69.4650, 41.4400},
                    {69.5800, 41.4690}, {69.7100, 41.5400}, {69.7700, 41.5580}
            }),
            new Route("A380 Bukhara → Khiva corridor", new double[][]{
                    {64.4286, 39.7747}, {64.2000, 39.9500}, {63.7500, 40.1500},
                    {63.2000, 40.3800}, {62.6500, 40.7200}, {62.1500, 41.1500},
                    {61.6800, 41.3900}, {60.6417, 41.3775}
            }),
            new Route("M39 Tashkent → Chinaz → Gulistan", new double[][]{
                    {69.2797, 41.3111}, {69.1600, 41.2400}, {69.0000, 41.1200},
                    {68.7700, 40.9370}, {68.7810, 40.7500}, {68.7846, 40.4897}
            })
    );

    public static Route byIndex(int index) {
        return ROUTES.get(Math.floorMod(index, ROUTES.size()));
    }
}
