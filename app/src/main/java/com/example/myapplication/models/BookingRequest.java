package com.example.myapplication.models;

import com.google.gson.annotations.SerializedName;

public class BookingRequest {

    @SerializedName("customerName")
    private String customerName;

    @SerializedName("customerPhone")
    private String customerPhone;

    @SerializedName("serviceName")
    private String serviceName;

    @SerializedName("bookingDate")
    private String bookingDate;

    @SerializedName("bookingTime")
    private String bookingTime;

    public BookingRequest(String customerName, String customerPhone, String serviceName, String bookingDate, String bookingTime) {
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.serviceName = serviceName;
        this.bookingDate = bookingDate;
        this.bookingTime = bookingTime;
    }

    public String getCustomerName() {
        return customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getBookingDate() {
        return bookingDate;
    }

    public String getBookingTime() {
        return bookingTime;
    }
}
