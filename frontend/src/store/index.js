import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import hospitalReducer from "./slices/hospitalSlice";
import predictionReducer from "./slices/predictionSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hospital: hospitalReducer,
    predictions: predictionReducer,
  },
});