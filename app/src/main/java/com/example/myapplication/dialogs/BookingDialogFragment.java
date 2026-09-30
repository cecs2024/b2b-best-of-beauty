package com.example.myapplication.dialogs;

import android.app.DatePickerDialog;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.example.myapplication.R;
import com.example.myapplication.models.BookingRequest;
import com.example.myapplication.models.BookingResponse;
import com.example.myapplication.network.ApiService;
import com.example.myapplication.network.RetrofitClient;

import java.util.Calendar;
import java.util.Locale;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingDialogFragment extends DialogFragment {

    private EditText etName, etPhone, etService, etDate, etTime, etNotes;
    private Button btnConfirm;
    private ProgressBar progressBar;

    public static BookingDialogFragment newInstance(String serviceName) {
        BookingDialogFragment fragment = new BookingDialogFragment();
        Bundle args = new Bundle();
        args.putString("service_name", serviceName);
        fragment.setArguments(args);
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.dialog_book_appointment, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        // Bind Views
        etName = view.findViewById(R.id.etCustomerName);
        etPhone = view.findViewById(R.id.etCustomerPhone);
        etService = view.findViewById(R.id.etServiceName);
        etDate = view.findViewById(R.id.etBookingDate);
        etTime = view.findViewById(R.id.etBookingTime);
        etNotes = view.findViewById(R.id.etBookingNotes);
        btnConfirm = view.findViewById(R.id.btnConfirmBooking);
        progressBar = view.findViewById(R.id.progressBar);
        ImageView btnClose = view.findViewById(R.id.btnCloseDialog);

        // Pre-fill service name if passed
        if (getArguments() != null && getArguments().containsKey("service_name")) {
            String prefilledService = getArguments().getString("service_name");
            if (!TextUtils.isEmpty(prefilledService)) {
                etService.setText(prefilledService);
            }
        }

        // Close Dialog Listener
        if (btnClose != null) {
            btnClose.setOnClickListener(v -> dismiss());
        }

        // Date Picker Listener
        etDate.setOnClickListener(v -> showDatePicker());

        // Submit Booking Listener
        btnConfirm.setOnClickListener(v -> executeBookingCall());
    }

    @Override
    public void onStart() {
        super.onStart();
        // Fix for Dialog Collapsing Issue: Explicitly set Width to MATCH_PARENT and Height to WRAP_CONTENT
        Dialog dialog = getDialog();
        if (dialog != null && dialog.getWindow() != null) {
            Window window = dialog.getWindow();
            window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
            window.setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }
    }

    private void showDatePicker() {
        Calendar calendar = Calendar.getInstance();
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);

        DatePickerDialog datePickerDialog = new DatePickerDialog(requireContext(),
                (view, year1, month1, dayOfMonth) -> {
                    String selectedDate = String.format(Locale.getDefault(), "%04d-%02d-%02d", year1, month1 + 1, dayOfMonth);
                    etDate.setText(selectedDate);
                }, year, month, day);

        datePickerDialog.getDatePicker().setMinDate(System.currentTimeMillis());
        datePickerDialog.show();
    }

    private void executeBookingCall() {
        String name = etName.getText().toString().trim();
        String phone = etPhone.getText().toString().trim();
        String service = etService.getText().toString().trim();
        String date = etDate.getText().toString().trim();
        String time = etTime.getText().toString().trim();
        String notes = etNotes != null ? etNotes.getText().toString().trim() : "";

        if (TextUtils.isEmpty(name) || TextUtils.isEmpty(phone) ||
                TextUtils.isEmpty(service) || TextUtils.isEmpty(date) || TextUtils.isEmpty(time)) {
            Toast.makeText(getContext(), "Please fill in all required fields", Toast.LENGTH_SHORT).show();
            return;
        }

        // UI Loading State
        progressBar.setVisibility(View.VISIBLE);
        btnConfirm.setEnabled(false);
        btnConfirm.setText("Connecting to Render Server...");

        BookingRequest request = new BookingRequest(name, phone, service, date, time);

        ApiService apiService = RetrofitClient.getApiService();
        apiService.bookAppointment(request).enqueue(new Callback<BookingResponse>() {
            @Override
            public void onResponse(@NonNull Call<BookingResponse> call, @NonNull Response<BookingResponse> response) {
                if (getContext() == null) return;

                progressBar.setVisibility(View.GONE);
                btnConfirm.setEnabled(true);
                btnConfirm.setText("Confirm & Lock Appointment");

                if (response.isSuccessful() && response.body() != null) {
                    BookingResponse bookingResponse = response.body();
                    if (bookingResponse.isSuccess()) {
                        Toast.makeText(getContext(),
                                "🎉 Booking Confirmed! Ref ID: " + bookingResponse.getBookingId(),
                                Toast.LENGTH_LONG).show();
                        dismiss();
                    } else {
                        Toast.makeText(getContext(), "Failed: " + bookingResponse.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(getContext(), "Server Error (" + response.code() + ")", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(@NonNull Call<BookingResponse> call, @NonNull Throwable t) {
                if (getContext() == null) return;

                progressBar.setVisibility(View.GONE);
                btnConfirm.setEnabled(true);
                btnConfirm.setText("Confirm & Lock Appointment");

                Toast.makeText(getContext(), "Connection Error: " + t.getLocalizedMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }
}
