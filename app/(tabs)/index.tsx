import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { getWeek } from "date-fns";
import React, { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Task {
    id: string;
    text: string;
    detail: string;
    once: boolean;
    day: number;
    done: boolean;
    time?: string;
}

const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

export default function App() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [text, setText] = useState("");
    const [detail, setDetail] = useState("");
    const [day, setDay] = useState<number>(0);
    const [once, setOnce] = useState(false);

    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [second, setSecond] = useState(0);

    const [selectedDay, setSelectedDay] = useState((new Date().getDay() + 6) % 7);

    const closeModal = () => {
        setModalVisible(false)
        setText("")
        setDetail("")
        setDay((new Date().getDay() + 6) % 7)
        setOnce(false)
        setHour(0)
        setMinute(0)
        setSecond(0)
        setEditingTask(null)
    }


    useEffect(() => {
        const autoResetWeeklyTasks = async () => {
            const now = new Date();
            const currentWeek = getWeek(now);
            const lastResetWeek = await AsyncStorage.getItem("lastResetWeek");
            if (lastResetWeek === null || Number(lastResetWeek) !== currentWeek) {
                setTasks(prev => prev.filter(t => !t.once).map(t => ({ ...t, done: false })));
                await AsyncStorage.setItem("lastResetWeek", currentWeek.toString());
            }
        };
        autoResetWeeklyTasks();
    }, []);

    useEffect(() => {
        const loadTasks = async () => {
            const stored = await AsyncStorage.getItem("tasks");
            if (stored) setTasks(JSON.parse(stored));
        };
        loadTasks();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem("tasks", JSON.stringify(tasks));
    }, [tasks]);

    const saveTask = () => {
        if (!text.trim()) return
        const newTime = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second.toString().padStart(2, "0")}`
        if (editingTask) {
            setTasks(prev =>
                prev.map(t =>
                    t.id === editingTask.id ? { ...t, text, detail, day, once, time: newTime } : t
                )
            )
            setEditingTask(null)
        } else {
            const newTask: Task = {
                id: Date.now().toString(),
                text,
                detail,
                once,
                day,
                done: false,
                time: newTime,
            }
            setTasks(prev => [...prev, newTask])
        }
        setText("")
        setDetail("")
        setDay(0)
        setOnce(false)
        setHour(0)
        setMinute(0)
        setSecond(0)
        setModalVisible(false)
    }

    const toggleTask = (id: string) => {
        setTasks(prev =>
            prev.map(t => t.id === id ? { ...t, done: !t.done } : t)
        );
    };

    const deleteAllTasks = () => {
        Alert.alert("Delete All", "Are you sure you want to delete all tasks?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete All", style: "destructive", onPress: () => setTasks([]) }
        ])
    }

    const resetWeeklyTasks = () => {
        Alert.alert("Reset Week", "This will reset weekly tasks and remove once tasks. Continue?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reset", style: "destructive", onPress: () => {
                    setTasks(prev => prev.filter(t => !t.once).map(t => ({ ...t, done: false })))
                }
            }
        ])
    }

    const deleteTask = (id: string) => {
        Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () => setTasks((prev) => prev.filter((t) => t.id !== id)),
            },
        ]);
    };

    const formatTimeText = (time: string) => {
        const [h, m, s] = time.split(":").map(Number)
        if (h > 0) return `${h} Hours ${m} Minute ${s} Second`.trim()
        if (m > 0) return `${m} Minute ${s > 0 ? s + " Second" : ""}`.trim()
        if (s > 0) return `${s} Second`
        return "--"
    }

    const TaskItem = ({ item }: { item: Task }) => (
        <TouchableOpacity
            style={styles.taskRow}
            onPress={() => toggleTask(item.id)}
        >
            <View
                style={[
                    styles.checkbox,
                    item.done ? styles.checkboxChecked : styles.checkboxUnchecked,
                ]}
            >
                {item.done && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <View style={{ flex: 1 }}>
                <Text
                    style={[
                        styles.taskText,
                        item.done && { textDecorationLine: "line-through", color: "gray" },
                    ]}
                >
                    {item.text}
                </Text>
                {item.time ? (
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                        <Ionicons name="time-outline" size={12} color="white" style={{ marginRight: 4 }} />
                        <Text style={[
                            styles.taskTime,
                            item.done && { textDecorationLine: "line-through", color: "gray" },
                        ]}>{formatTimeText(item.time)}</Text>
                    </View>
                ) : null}
                {item.detail ? (
                    <Text style={[
                        styles.taskDetail,
                        item.done && { textDecorationLine: "line-through", color: "gray" },
                    ]}>{item.detail}</Text>
                ) : null}
            </View>
            {item.once && (
                <View style={[styles.onceBadge, { marginHorizontal: 10 }]}>
                    <Text style={styles.onceBadgeText}>ONCE</Text>
                </View>
            )}
            <TouchableOpacity
                onPress={() => {
                    setEditingTask(item)
                    setText(item.text)
                    setDetail(item.detail)
                    setDay(item.day)
                    setOnce(item.once)
                    setHour(Number((item.time || "00:00:00").split(":")[0]));
                    setMinute(Number((item.time || "00:00:00").split(":")[1]));
                    setSecond(Number((item.time || "00:00:00").split(":")[2]));
                    setModalVisible(true)
                }}
                style={{ marginRight: 12 }}
            >
                <Ionicons name="pencil-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Ionicons name="trash-outline" size={20} color="white" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Weekly-Task</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity onPress={resetWeeklyTasks} style={{ marginRight: 12 }}>
                        <Ionicons name="refresh-circle-outline" size={26} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={deleteAllTasks} style={{ marginRight: 12 }}>
                        <Ionicons name="trash-bin-outline" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle-outline" size={28} color="black" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: "black" }} />

            <Picker
                selectedValue={selectedDay}
                onValueChange={(v) => setSelectedDay(v)}
                style={styles.picker}
            >
                {days.map((d, i) => (
                    <Picker.Item key={i} label={d} value={i} color="black" />
                ))}
            </Picker>

            <FlatList
                data={days.map((d, i) => ({
                    day: i,
                    title: d,
                    tasks: tasks.filter((t) => t.day === i),
                }))}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => {
                    if (item.day !== selectedDay) return null;
                    return (
                        <View style={{ marginHorizontal: 16 }}>
                            <Text style={styles.dayHeader}>Task List</Text>
                            {!item.tasks || item.tasks.length === 0 ? (
                                <Text style={[styles.taskText, { marginTop: 5, color: "grey" }]}>No Tasks</Text>
                            ) : (
                                item.tasks.map((t) => <TaskItem key={t.id} item={t} />)
                            )}
                        </View>
                    )
                }}
                contentContainerStyle={{ paddingBottom: 40 }}
            />

            <Modal
                transparent
                animationType="slide"
                visible={modalVisible}
                onRequestClose={closeModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.input}
                            placeholder="Task title"
                            placeholderTextColor="gray"
                            value={text}
                            onChangeText={setText}
                        />
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                            placeholder="Task detail"
                            placeholderTextColor="gray"
                            value={detail}
                            onChangeText={setDetail}
                            multiline
                        />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                            <Picker
                                selectedValue={hour}
                                onValueChange={(v) => setHour(v)}
                                style={[styles.picker, { flex: 1 }]}
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} color="black" />
                                ))}
                            </Picker>

                            <Picker
                                selectedValue={minute}
                                onValueChange={(v) => setMinute(v)}
                                style={[styles.picker, { flex: 1 }]}
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} color="black" />
                                ))}
                            </Picker>

                            <Picker
                                selectedValue={second}
                                onValueChange={(v) => setSecond(v)}
                                style={[styles.picker, { flex: 1 }]}
                            >
                                {Array.from({ length: 60 }, (_, i) => (
                                    <Picker.Item key={i} label={i.toString().padStart(2, "0")} value={i} color="black" />
                                ))}
                            </Picker>
                        </View>

                        <Picker
                            selectedValue={day}
                            onValueChange={(v) => setDay(v)}
                            style={styles.picker}
                        >
                            {days.map((d, i) => (
                                <Picker.Item key={i} label={d} value={i} color="black" />
                            ))}
                        </Picker>
                        <Picker
                            selectedValue={once}
                            onValueChange={(v) => setOnce(v)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Weekly" value={false} color="black" />
                            <Picker.Item label="Once" value={true} color="black" />
                        </Picker>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={closeModal}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={saveTask}>
                                <Text style={styles.modalButtonText}>{editingTask ? "Update" : "Save"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "black" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "white",
    },
    headerTitle: { color: "black", fontSize: 20, fontWeight: "bold" },
    dayHeader: {
        color: "white",
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 16,
    },
    taskRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6,
        paddingRight: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    checkboxUnchecked: {
        borderWidth: 2,
        borderColor: "white",
        backgroundColor: "transparent",
    },
    checkboxChecked: {
        borderWidth: 2,
        borderColor: "white",
        backgroundColor: "black",
    },
    taskText: { color: "white", fontSize: 16 },
    taskDetail: { color: "gray", fontSize: 12 },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 12,
        width: "80%",
    },
    input: {
        borderWidth: 1,
        borderColor: "black",
        color: "black",
        marginBottom: 12,
        padding: 8,
    },
    onceBadge: {
        backgroundColor: "red",
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
        marginLeft: 6,
    },
    onceBadgeText: {
        color: "white",
        fontSize: 10,
        fontWeight: "bold",
    },
    taskTime: { color: "white", fontSize: 12, fontWeight: "bold" },
    picker: { backgroundColor: "white", marginBottom: 12 },
    modalButtons: { flexDirection: "row", justifyContent: "space-between" },
    modalButton: {
        flex: 1,
        marginHorizontal: 4,
        padding: 12,
        backgroundColor: "black",
        borderRadius: 8,
        alignItems: "center",
    },
    modalButtonText: { color: "white" },
});
