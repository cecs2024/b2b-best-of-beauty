package com.example.myapplication.models;

import com.google.gson.annotations.SerializedName;

public class BookingResponse {

    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("bookingId")
    private String bookingId;

    public boolean isSuccess() {
        return success;
    }

    public String getMessage() {
        return message;
    }

    public String getBookingId() {
        return bookingId;
    }
}
