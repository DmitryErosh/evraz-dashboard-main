package com.evraz.dashboard.controller;

import com.evraz.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final DashboardService dashboardService;
    
    @GetMapping
    public String dashboard(Model model) {
        model.addAttribute("metrics", dashboardService.getAllMetrics());
        model.addAttribute("pageTitle", "ЕВРАЗ - Дашборд");
        return "dashboard";
    }
}