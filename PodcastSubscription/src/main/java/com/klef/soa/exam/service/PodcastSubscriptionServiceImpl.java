package com.klef.soa.exam.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.klef.soa.exam.entity.PodcastSubscription;
import com.klef.soa.exam.repository.PodcastSubscriptionRepository;

@Service
public class PodcastSubscriptionServiceImpl
        implements PodcastSubscriptionService {

    @Autowired
    private PodcastSubscriptionRepository repository;

    @Override
    public PodcastSubscription addSubscriber(PodcastSubscription ps) {
        return repository.save(ps);
    }

    @Override
    public List<PodcastSubscription> displayAll() {
        return repository.findAll();
    }

    @Override
    public PodcastSubscription getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public PodcastSubscription updateSubscriber(
            Long id, PodcastSubscription ps) {

        PodcastSubscription existing = repository.findById(id).orElse(null);

        if (existing != null) {
            existing.setSubscriberName(ps.getSubscriberName());
            existing.setPodcastTitle(ps.getPodcastTitle());
            existing.setStartDate(ps.getStartDate());
            existing.setActive(ps.isActive());
            return repository.save(existing);
        }

        return null;
    }

    @Override
    public boolean deleteById(Long id) {

        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }

        return false;
    }
}
