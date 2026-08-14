package org.example.b2blogistics;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

class B2BLogisticsApplicationTests extends AbstractIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Test
    void contextLoadsWithMigratedPostgisDatabase() {
        assertThat(applicationContext.containsBean("gpsSimulatorService")).isTrue();
    }
}
