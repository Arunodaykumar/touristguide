package com.touristguide.controller;

import com.touristguide.model.Contact;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ContactController {

    @PostMapping("/contact")
    public ResponseEntity<Map<String, String>> submitContact(@RequestBody Contact contact) {
        Map<String, String> response = new HashMap<>();
        
        try {
            // Validate required fields
            if (contact.getName() == null || contact.getName().trim().isEmpty()) {
                response.put("status", "error");
                response.put("message", "Name is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (contact.getEmail() == null || contact.getEmail().trim().isEmpty()) {
                response.put("status", "error");
                response.put("message", "Email is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (contact.getSubject() == null || contact.getSubject().trim().isEmpty()) {
                response.put("status", "error");
                response.put("message", "Subject is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (contact.getMessage() == null || contact.getMessage().trim().isEmpty()) {
                response.put("status", "error");
                response.put("message", "Message is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Here you would typically save to database or send email
            // For now, we'll just log the contact submission
            System.out.println("Contact form submitted:");
            System.out.println("Name: " + contact.getName());
            System.out.println("Email: " + contact.getEmail());
            System.out.println("Phone: " + contact.getPhone());
            System.out.println("Subject: " + contact.getSubject());
            System.out.println("Message: " + contact.getMessage());
            
            response.put("status", "success");
            response.put("message", "Thank you for your message! We will get back to you soon.");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", "An error occurred while processing your request");
            return ResponseEntity.internalServerError().body(response);
        }
    }
}