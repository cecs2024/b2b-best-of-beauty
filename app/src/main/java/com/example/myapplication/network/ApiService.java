package com.example.myapplication.network;

import com.example.myapplication.models.BookingRequest;
import com.example.myapplication.models.BookingResponse;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.POST;

public interface ApiService {

    @POST("/api/book-appointment")
    Call<BookingResponse> bookAppointment(@Body BookingRequest bookingRequest);
}
