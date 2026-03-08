package com.touristguide.controller;

import com.touristguide.model.Destination;
import com.touristguide.service.DestinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class DestinationController {

    @Autowired
    private DestinationService destinationService;

    @GetMapping("/destinations")
    public List<Destination> getAllDestinations() {
        return destinationService.getAllDestinations();
    }

    @GetMapping("/destinations/{id}")
    public Destination getDestinationById(@PathVariable Long id) {
        return destinationService.getDestinationById(id);
    }

    @GetMapping("/destinations/country/{country}")
    public List<Destination> getDestinationsByCountry(@PathVariable String country) {
        return destinationService.getDestinationsByCountry(country);
    }

    @GetMapping("/destinations/category/{category}")
    public List<Destination> getDestinationsByCategory(@PathVariable String category) {
        return destinationService.getDestinationsByCategory(category);
    }
}