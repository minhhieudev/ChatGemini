import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./chatSlice/index";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

// Redux Persist configuration
const persistConfig = {
    key: 'root',
    storage,
    version: 1,
    debug: true, // Enable for debugging persistence issues
};

// Create persisted reducer directly - we don't need combineReducers
// since we only have one reducer
const persistedReducer = persistReducer(persistConfig, chatReducer);

const store = configureStore({
    reducer: {
        chat: persistedReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
    devTools: true
});

// Create persistor
export const persistor = persistStore(store);

// Optionally clear persistence for debugging
// persistor.purge();

export default store;