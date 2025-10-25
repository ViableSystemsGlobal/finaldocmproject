import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

interface PlaceDetails {
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

interface GooglePlacesInputProps {
  value: string
  onPlaceSelect: (address: string, details: PlaceDetails) => void
  placeholder?: string
  style?: any
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
                            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
                            'AIzaSyBYXKNsJKNsJKNsJKNsJKNsJKNsJKNsJKN'

export default function GooglePlacesInput({
  value,
  onPlaceSelect,
  placeholder = 'Enter address...',
  style,
}: GooglePlacesInputProps) {
  const [inputValue, setInputValue] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setPredictions([])
      setShowPredictions(false)
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_MAPS_API_KEY}&types=address&language=en`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK') {
        setPredictions(data.predictions || [])
        setShowPredictions(true)
      } else {
        console.error('Google Places API error:', data.status, data.error_message)
        setPredictions([])
        setShowPredictions(false)
      }
    } catch (error) {
      console.error('Error fetching places:', error)
      setPredictions([])
      setShowPredictions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_MAPS_API_KEY}&fields=formatted_address,geometry`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK' && data.result) {
        return data.result as PlaceDetails
      } else {
        console.error('Google Places Details API error:', data.status, data.error_message)
        return null
      }
    } catch (error) {
      console.error('Error fetching place details:', error)
      return null
    }
  }

  const handleInputChange = (text: string) => {
    setInputValue(text)
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    
    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      searchPlaces(text)
    }, 300)
  }

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    setInputValue(prediction.description)
    setShowPredictions(false)
    setPredictions([])
    
    // Get detailed place information
    const details = await getPlaceDetails(prediction.place_id)
    
    if (details) {
      onPlaceSelect(prediction.description, details)
    } else {
      // Fallback if details fetch fails
      onPlaceSelect(prediction.description, {
        formatted_address: prediction.description,
        geometry: {
          location: { lat: 0, lng: 0 }
        }
      })
    }
  }

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <Ionicons name="location-outline" size={16} color="#F59E0B" style={styles.locationIcon} />
      <View style={styles.predictionText}>
        <Text style={styles.mainText}>
          {item.structured_formatting?.main_text || item.description}
        </Text>
        {item.structured_formatting?.secondary_text && (
          <Text style={styles.secondaryText}>
            {item.structured_formatting.secondary_text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onFocus={() => {
            if (predictions.length > 0) {
              setShowPredictions(true)
            }
          }}
        />
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color="#F59E0B" 
            style={styles.loadingIndicator}
          />
        )}
      </View>
      
      {showPredictions && predictions.length > 0 && (
        <View style={styles.predictionsContainer}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            style={styles.predictionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 80,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    textAlignVertical: 'top',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  predictionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#374151',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  predictionsList: {
    flex: 1,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4B5563',
  },
  locationIcon: {
    marginRight: 12,
  },
  predictionText: {
    flex: 1,
  },
  mainText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
}) 