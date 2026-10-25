package com.klef.soa.exam.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.klef.soa.exam.entity.PodcastSubscription;
import com.klef.soa.exam.service.PodcastSubscriptionService;

@RestController
@RequestMapping("/")
@CrossOrigin(origins = {
        "*"
})
public class PodcastSubscriptionController {

    @Autowired
    private PodcastSubscriptionService service;

    @GetMapping
    public String home() {
        return "Podcast Subscription Service Project";
    }

    @PostMapping("/Add")
    public ResponseEntity<PodcastSubscription> addSubscriber(@RequestBody PodcastSubscription ps) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addSubscriber(ps));
    }

    @GetMapping("/DisplayAll")
    public List<PodcastSubscription> displayAll() {
        return service.displayAll();
    }

    @GetMapping("/Display/{id}")
    public ResponseEntity<?> displayById(@PathVariable Long id) {

        PodcastSubscription ps = service.getById(id);

        if (ps != null) {
            return ResponseEntity.ok(ps);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Podcast subscription not found: " + id);
    }

    @PutMapping("/Update/{id}")
    public ResponseEntity<?> updateSubscriber(@PathVariable Long id, @RequestBody PodcastSubscription ps) {

        PodcastSubscription updated = service.updateSubscriber(id, ps);

        if (updated != null) {
            return ResponseEntity.ok(updated);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Podcast subscription not found: " + id);
    }

    @DeleteMapping("/Delete/{id}")
    public ResponseEntity<String> deleteById(@PathVariable Long id) {

        if (service.deleteById(id)) {
            return ResponseEntity.ok(
                    "Podcast subscription deleted successfully");
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body("Podcast subscription not found: " + id);
    }
}
