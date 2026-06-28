package com.evraz.dashboard.service;

import com.evraz.dashboard.model.Metric;
import com.evraz.dashboard.repository.MetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final MetricRepository metricRepository;
    
    public List<Metric> getAllMetrics() {
        return metricRepository.findAll();
    }
    
    @PostConstruct
    public void initData() {
        if (metricRepository.count() == 0) {
            // Производство
            saveMetric("Сталь (тыс. т)", 1250.5, "тыс. т", "production", 12.5, "up");
            saveMetric("Прокат (тыс. т)", 890.2, "тыс. т", "production", 8.3, "up");
            saveMetric("Чугун (тыс. т)", 720.0, "тыс. т", "production", -2.1, "down");
            
            // Качество
            saveMetric("Брак (%)", 2.8, "%", "quality", -15.2, "up");
            saveMetric("Сертификация (%)", 94.5, "%", "quality", 3.7, "up");
            saveMetric("Возвраты (%)", 1.2, "%", "quality", -5.1, "down");
            
            // Эффективность
            saveMetric("Производительность", 87.3, "%", "efficiency", 4.2, "up");
            saveMetric("Загрузка мощностей", 78.9, "%", "efficiency", 2.8, "up");
            saveMetric("Энергоэффективность", 92.1, "%", "efficiency", 5.3, "up");
        }
    }
    
    private void saveMetric(String name, double value, String unit, String category, double change, String trend) {
        metricRepository.save(Metric.builder()
            .name(name)
            .value(value)
            .unit(unit)
            .category(category)
            .changePercent(change)
            .trend(trend)
            .build());
    }
}