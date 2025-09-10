package com.shopmypham.core.api;
public record ApiResponse<T>(boolean success, T data, String message) {}
