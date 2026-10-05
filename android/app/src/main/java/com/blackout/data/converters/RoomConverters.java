package com.blackout.data.converters;

import androidx.room.TypeConverter;
import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.List;

public class RoomConverters {

    @TypeConverter
    public static String stringListToJson(List<String> list) {
        if (list == null) return null;
        JSONArray jsonArray = new JSONArray();
        for (String item : list) {
            jsonArray.put(item);
        }
        return jsonArray.toString();
    }

    @TypeConverter
    public static List<String> jsonToStringList(String json) {
        if (json == null) return null;
        List<String> list = new ArrayList<>();
        try {
            JSONArray jsonArray = new JSONArray(json);
            for (int i = 0; i < jsonArray.length(); i++) {
                list.add(jsonArray.getString(i));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return list;
    }
}
