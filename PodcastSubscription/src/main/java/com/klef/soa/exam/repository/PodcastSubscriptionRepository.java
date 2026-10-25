package com.klef.soa.exam.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.klef.soa.exam.entity.PodcastSubscription;

public interface PodcastSubscriptionRepository extends JpaRepository<PodcastSubscription, Long>{

}
