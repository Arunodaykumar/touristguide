package com.touristguide.model;

public class Destination {
    private Long id;
    private String name;
    private String description;
    private String bestTime;
    private double rating;
    private String imageUrl;
    private String country;
    private String category;

    public Destination() {}

    public Destination(Long id, String name, String description, String bestTime, 
                      double rating, String imageUrl, String country, String category) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.bestTime = bestTime;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.country = country;
        this.category = category;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getBestTime() { return bestTime; }
    public void setBestTime(String bestTime) { this.bestTime = bestTime; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}