package com.touristguide.service;

import com.touristguide.model.Destination;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DestinationService {

    private List<Destination> destinations;

    public DestinationService() {
        initializeDestinations();
    }

    private void initializeDestinations() {
        destinations = new ArrayList<>();
        destinations.add(new Destination(1L, "Paris", "The City of Light with iconic landmarks and rich culture", 
                "April to June, September to October", 4.8, "https://via.placeholder.com/300x200", "France", "City"));
        destinations.add(new Destination(2L, "Tokyo", "Modern metropolis blending tradition with innovation", 
                "March to May, September to November", 4.7, "https://via.placeholder.com/300x200", "Japan", "City"));
        destinations.add(new Destination(3L, "Bali", "Tropical paradise with beautiful beaches and temples", 
                "April to October", 4.6, "https://via.placeholder.com/300x200", "Indonesia", "Beach"));
        destinations.add(new Destination(4L, "Rome", "Ancient city with incredible history and architecture", 
                "April to June, September to October", 4.5, "https://via.placeholder.com/300x200", "Italy", "Historical"));
        destinations.add(new Destination(5L, "Santorini", "Greek island with stunning sunsets and white buildings", 
                "April to November", 4.9, "https://via.placeholder.com/300x200", "Greece", "Island"));
        destinations.add(new Destination(6L, "Machu Picchu", "Ancient Incan citadel high in the Andes Mountains", 
                "May to September", 4.8, "https://via.placeholder.com/300x200", "Peru", "Historical"));
    }

    public List<Destination> getAllDestinations() {
        return new ArrayList<>(destinations);
    }

    public Destination getDestinationById(Long id) {
        return destinations.stream()
                .filter(dest -> dest.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public List<Destination> getDestinationsByCountry(String country) {
        return destinations.stream()
                .filter(dest -> dest.getCountry().equalsIgnoreCase(country))
                .collect(Collectors.toList());
    }

    public List<Destination> getDestinationsByCategory(String category) {
        return destinations.stream()
                .filter(dest -> dest.getCategory().equalsIgnoreCase(category))
                .collect(Collectors.toList());
    }
}