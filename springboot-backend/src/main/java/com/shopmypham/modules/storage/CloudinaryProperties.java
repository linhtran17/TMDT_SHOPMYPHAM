package com.shopmypham.modules.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudinary")
public record CloudinaryProperties(
    String cloudName,
    String apiKey,
    String apiSecret,
    String rootFolder
) {}
