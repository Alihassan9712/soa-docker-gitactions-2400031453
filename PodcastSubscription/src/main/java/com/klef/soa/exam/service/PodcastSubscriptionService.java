package com.klef.soa.exam.service;

import java.util.List;

import com.klef.soa.exam.entity.PodcastSubscription;

public interface PodcastSubscriptionService {

    PodcastSubscription addSubscriber(PodcastSubscription ps);

    List<PodcastSubscription> displayAll();

    PodcastSubscription getById(Long id);

    PodcastSubscription updateSubscriber(Long id, PodcastSubscription ps);

    boolean deleteById(Long id);
}
