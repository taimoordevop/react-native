import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TimePickerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialTime = (params.initialTime as string) || '09:00 AM';
  
  const [selectedTime, setSelectedTime] = useState(initialTime);

  const handleSave = () => {
    // Pass the selected time back to the previous screen
    router.back();
    // Use a global variable to pass data back
    (global as any).selectedTime = selectedTime;
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={28} color="#636e72" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Time</Text>
          <Text style={styles.subtitle}>Choose your preferred time</Text>
        </View>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Clock Display */}
      <View style={styles.clockContainer}>
        <View style={styles.clockFace}>
          {/* Clock Numbers */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) - 90; // Start from 12 o'clock
            const radius = 80;
            const x = Math.cos(angle * Math.PI / 180) * radius;
            const y = Math.sin(angle * Math.PI / 180) * radius;
            
            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.clockNumber,
                  {
                    left: 100 + x - 15,
                    top: 100 + y - 15,
                  },
                  parseInt(selectedTime.split(':')[0]) === (i === 0 ? 12 : i) && styles.clockNumberActive
                ]}
                onPress={() => {
                  const currentMinute = selectedTime.split(':')[1].split(' ')[0];
                  const currentAMPM = selectedTime.split(' ')[1];
                  setSelectedTime(`${String(i === 0 ? 12 : i).padStart(2, '0')}:${currentMinute} ${currentAMPM}`);
                }}
              >
                <Text style={[
                  styles.clockNumberText,
                  parseInt(selectedTime.split(':')[0]) === (i === 0 ? 12 : i) && styles.clockNumberTextActive
                ]}>
                  {i === 0 ? '12' : String(i)}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {/* Clock Hands */}
          <View style={styles.clockCenter} />
          <View 
            style={[
              styles.hourHand,
              {
                transform: [{
                  rotate: `${(parseInt(selectedTime.split(':')[0]) === 12 ? 0 : parseInt(selectedTime.split(':')[0])) * 30 - 90}deg`
                }]
              }
            ]} 
          />
          <View 
            style={[
              styles.minuteHand,
              {
                transform: [{
                  rotate: `${parseInt(selectedTime.split(':')[1].split(' ')[0]) * 6 - 90}deg`
                }]
              }
            ]} 
          />
          <View style={styles.clockCenterDot} />
        </View>
      </View>

      {/* Selected Time Display */}
      <View style={styles.selectedTimeContainer}>
        <Text style={styles.selectedTimeText}>{selectedTime}</Text>
      </View>

      {/* Minute Selection */}
      <View style={styles.minuteSelectionContainer}>
        <Text style={styles.minuteSelectionLabel}>Minutes:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.minuteScrollContent}
        >
          {Array.from({ length: 60 }, (_, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.minuteButton,
                parseInt(selectedTime.split(':')[1].split(' ')[0]) === i && styles.minuteButtonActive
              ]}
              onPress={() => {
                const currentHour = selectedTime.split(':')[0];
                const currentAMPM = selectedTime.split(' ')[1];
                setSelectedTime(`${currentHour}:${String(i).padStart(2, '0')} ${currentAMPM}`);
              }}
            >
              <Text style={[
                styles.minuteButtonText,
                parseInt(selectedTime.split(':')[1].split(' ')[0]) === i && styles.minuteButtonTextActive
              ]}>
                {String(i).padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* AM/PM Selection */}
      <View style={styles.ampmSelectionContainer}>
        <TouchableOpacity
          style={[
            styles.ampmButton,
            selectedTime.includes('AM') && styles.ampmButtonActive
          ]}
          onPress={() => {
            const currentTime = selectedTime.split(' ')[0];
            setSelectedTime(`${currentTime} AM`);
          }}
        >
          <Text style={[
            styles.ampmButtonText,
            selectedTime.includes('AM') && styles.ampmButtonTextActive
          ]}>
            AM
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.ampmButton,
            selectedTime.includes('PM') && styles.ampmButtonActive
          ]}
          onPress={() => {
            const currentTime = selectedTime.split(' ')[0];
            setSelectedTime(`${currentTime} PM`);
          }}
        >
          <Text style={[
            styles.ampmButtonText,
            selectedTime.includes('PM') && styles.ampmButtonTextActive
          ]}>
            PM
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  clockContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  clockFace: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f8f9fa',
    borderWidth: 3,
    borderColor: '#007AFF',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockNumber: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  clockNumberActive: {
    backgroundColor: '#007AFF',
  },
  clockNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clockNumberTextActive: {
    color: '#fff',
  },
  clockCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    position: 'absolute',
    zIndex: 10,
  },
  clockCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    position: 'absolute',
    zIndex: 11,
  },
  hourHand: {
    position: 'absolute',
    width: 4,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 2,
    top: 50,
    left: 98,
    transformOrigin: 'bottom',
    zIndex: 8,
  },
  minuteHand: {
    position: 'absolute',
    width: 2,
    height: 70,
    backgroundColor: '#666',
    borderRadius: 1,
    top: 30,
    left: 99,
    transformOrigin: 'bottom',
    zIndex: 9,
  },
  selectedTimeContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  selectedTimeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  minuteSelectionContainer: {
    marginBottom: 30,
  },
  minuteSelectionLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  minuteScrollContent: {
    paddingHorizontal: 20,
  },
  minuteButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  minuteButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  minuteButtonText: {
    fontSize: 16,
    color: '#333',
  },
  minuteButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ampmSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  ampmButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  ampmButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ampmButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  ampmButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 50,
  },
}); 