package com.blackout.bridge;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.blackout.data.RoomDataEngine;
import com.blackout.data.entity.*;
import com.blackout.network.protocol.NetworkMessage;
import com.blackout.network.protocol.MessageSerializer;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

public class BlackoutDataModule extends ReactContextBaseJavaModule {

    private final RoomDataEngine dataEngine;

    public BlackoutDataModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.dataEngine = new RoomDataEngine(reactContext.getApplicationContext());
    }

    @NonNull
    @Override
    public String getName() {
        return "BlackoutDataModule";
    }

    @ReactMethod
    public void saveMessage(String messageJson, Promise promise) {
        try {
            NetworkMessage msg = MessageSerializer.deserialize(messageJson.getBytes(StandardCharsets.UTF_8));
            dataEngine.saveMessage(msg);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("SAVE_MESSAGE_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void getMessage(String messageId, Promise promise) {
        try {
            NetworkMessage msg = dataEngine.getMessage(messageId);
            if (msg != null) {
                String jsonStr = new String(MessageSerializer.serialize(msg), StandardCharsets.UTF_8);
                promise.resolve(jsonStr);
            } else {
                promise.resolve(null);
            }
        } catch (Exception e) {
            promise.reject("GET_MESSAGE_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void createReport(String reportJson, Promise promise) {
        try {
            JSONObject obj = new JSONObject(reportJson);
            EmergencyReportEntity entity = new EmergencyReportEntity();
            entity.reportId = UUID.randomUUID().toString();
            entity.category = obj.getString("category");
            entity.description = obj.optString("description", "");
            entity.severity = obj.getString("severity");
            entity.locationJson = obj.getJSONObject("location").toString();
            entity.reporterDeviceId = obj.getString("reporterDeviceId");
            entity.observedAt = System.currentTimeMillis();
            
            dataEngine.processReport(entity);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("CREATE_REPORT_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void listIncidents(Promise promise) {
        try {
            List<IncidentEntity> incidents = dataEngine.listIncidents();
            JSONArray arr = new JSONArray();
            for (IncidentEntity inc : incidents) {
                JSONObject obj = new JSONObject();
                obj.put("id", inc.incidentId);
                obj.put("category", inc.category);
                obj.put("status", inc.status);
                obj.put("confidence", inc.confidenceLevel);
                obj.put("location", new JSONObject(inc.locationJson));
                arr.put(obj);
            }
            promise.resolve(arr.toString());
        } catch (Exception e) {
            promise.reject("LIST_INCIDENTS_ERROR", e.getMessage(), e);
        }
    }

    @ReactMethod
    public void listResources(Promise promise) {
        try {
            List<ResourceEntity> resources = dataEngine.listResources();
            JSONArray arr = new JSONArray();
            for (ResourceEntity res : resources) {
                JSONObject obj = new JSONObject();
                obj.put("id", res.resourceId);
                obj.put("type", res.type);
                obj.put("location", new JSONObject(res.locationJson));
                arr.put(obj);
            }
            promise.resolve(arr.toString());
        } catch (Exception e) {
            promise.reject("LIST_RESOURCES_ERROR", e.getMessage(), e);
        }
    }
}
