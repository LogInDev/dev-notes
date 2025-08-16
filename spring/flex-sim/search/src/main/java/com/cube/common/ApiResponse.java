package com.cube.common;

public record ApiResponse<T>(String status, String message, T data) {
    public static <T> ApiResponse<T> ok(T data){
        return new ApiResponse<>("OK", "success", data);
    }

    public static <T> ApiResponse<T> fail(String msg){
        return new ApiResponse<>("FAIL", msg, null);
    }
}
